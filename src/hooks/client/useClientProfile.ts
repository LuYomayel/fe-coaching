import { useState, useEffect, useRef } from 'react';
import { useIntl } from 'react-intl';
import { FilterMatchMode, FilterOperator } from 'primereact/api';
import { Toast } from 'primereact/toast';
import { DataTableFilterMeta } from 'primereact/datatable';

import { useUser } from '../../contexts/UserContext';
import { useToast } from '../../contexts/ToastContext';
import { useConfirmationDialog } from '../../utils/ConfirmationDialogContext';
import { useSpinner } from '../../utils/GlobalSpinner';
import { api } from '../../services/api-client';
import { formatDate, getDayMonthYear, getSeverity, sortBySessionDate, updateStatus } from '../../utils/UtilFunctions';
import { WorkoutStatus } from '../../types/enums/workout-status';

interface ISelectOption {
  label: string;
  value: string;
}

interface IWorkoutInstance {
  status: WorkoutStatus;
  realEndDate?: string;
  workout: { planName: string };
  trainingSession: {
    sessionDate: string | Date;
    dayNumber?: number;
    trainingWeek?: { weekNumber?: number };
  };
}

interface IPersonalInfo {
  id: number;
  name: string;
  birthdate: string;
  gender: string;
  phoneNumber: number | null;
  activityLevel: string;
  fitnessGoal: string;
  user?: { email: string };
}

interface ISubscriptionData {
  coachPlan?: { id: number; name: string };
  subscription?: {
    startDate: string;
    endDate: string;
    status: string;
  };
  workoutInstances: IWorkoutInstance[];
}

interface IProgressData {
  labels?: string[];
  datasets?: Array<{
    data: number[];
    backgroundColor: string[];
    hoverBackgroundColor: string[];
  }>;
}

interface IActivity {
  timestamp: string;
  description: string;
}

export const useClientProfile = () => {
  const { user, client } = useUser();
  const { showToast } = useToast();
  const { showConfirmationDialog } = useConfirmationDialog();
  const { setLoading } = useSpinner();
  const toast = useRef<Toast>(null);
  const intl = useIntl();

  // State variables
  const [personalInfo, setPersonalInfo] = useState<IPersonalInfo | null>(null);
  const [subscription, setSubscription] = useState<ISubscriptionData | null>(null);
  const [workoutHistory, setWorkoutHistory] = useState<IWorkoutInstance[]>([]);
  const [activities, setActivities] = useState<IActivity[]>([]);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [fitnessGoal, setFitnessGoal] = useState<string[]>([]);
  const [activityLevel, setActivityLevel] = useState('');
  const [progressData, setProgressData] = useState<IProgressData>({});
  const [refreshKey, setRefreshKey] = useState(0);
  const [filters, setFilters] = useState<DataTableFilterMeta>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    'workout.planName': {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }]
    },
    status: { value: null, matchMode: FilterMatchMode.EQUALS },
    description: {
      operator: 'and' as FilterOperator,
      constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }]
    }
  });
  const [statuses] = useState(['current', 'expired', 'completed', 'pending']);
  const [isPaymentDialogVisible, setIsPaymentDialogVisible] = useState(false);

  // Fetch data on component mount and when refreshKey changes
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch personal information
        const { data: dataClient } = await api.user.fetchClient(user!.userId);

        setPersonalInfo(dataClient);
        setActivityLevel(dataClient.activityLevel);
        if (dataClient.fitnessGoal) {
          const goals = dataClient.fitnessGoal
            .split(',')
            .map((goal: string) => goal.trim())
            .filter((value: string, index: number, self: string[]) => self.indexOf(value) === index);
          setFitnessGoal(goals);
        }

        // Fetch activities
        const { data: dataActivities } = await api.user.fetchClientActivitiesByUserId(user!.userId);
        setActivities(dataActivities || []);

        // Fetch subscription details
        const { data: subscriptionData } = await api.subscription.fetchSubscriptionDetails(user!.userId);
        setSubscription(subscriptionData);

        console.log('subscriptionData', subscriptionData);
        console.log('client', client);
        const checkStatusWorkouts = updateStatus<IWorkoutInstance>(subscriptionData.workoutInstances);
        const workoutsSorted = sortBySessionDate<IWorkoutInstance>(checkStatusWorkouts);
        setWorkoutHistory(workoutsSorted);

        const completed = workoutsSorted.filter((workout: IWorkoutInstance) => workout.status === 'completed').length;
        const pending = workoutsSorted.filter((workout: IWorkoutInstance) => workout.status === 'pending').length;
        const expired = workoutsSorted.filter((workout: IWorkoutInstance) => workout.status === 'expired').length;
        const current = workoutsSorted.filter((workout: IWorkoutInstance) => workout.status === 'current').length;

        setProgressData({
          labels: ['Completed', 'Pending', 'Expired', 'Current'],
          datasets: [
            {
              data: [completed, pending, expired, current],
              backgroundColor: ['green', 'yellow', 'red', 'blue'],
              hoverBackgroundColor: ['green', 'yellow', 'red', 'blue']
            }
          ]
        });
      } catch (error) {
        showToast('error', 'Error', (error as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.userId, showToast, setLoading, refreshKey]);

  // Handlers
  const handleEditPersonalInfo = () => {
    setEditDialogVisible(true);
  };

  const handleEditDialogClose = () => {
    setEditDialogVisible(false);
    setRefreshKey((prev) => prev + 1);
  };

  const handleSavePersonalInfo = async () => {
    const body: Record<string, unknown> = {
      fitnessGoal,
      activityLevel,
      phoneNumber: personalInfo?.phoneNumber
    };
    // Validate inputs
    for (const [key, value] of Object.entries(body)) {
      if (key === 'fitnessGoal') {
        if ((value as string[]).length === 0) return showToast('error', 'Error', `${key} cannot be null or empty`);
      }
      if (value == null || value === '' || value === 0) {
        showToast('error', 'Error', `${key} cannot be null or empty`);
        return;
      }
    }

    showConfirmationDialog({
      message: intl.formatMessage({ id: 'common.confirmation.saveChanges' }),
      header: intl.formatMessage({ id: 'common.confirmation' }),
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          setLoading(true);
          await api.user.updatePersonalInfo(personalInfo!.id, body);
          showToast('success', 'Success', 'Personal information updated successfully');
          setEditDialogVisible(false);
          setRefreshKey((prev) => prev + 1);
        } catch (error) {
          showToast('error', 'Error', (error as Error).message);
        } finally {
          setLoading(false);
        }
      },
      reject: () => {
        console.log('reject');
      }
    });
  };

  const handleOpenPaymentDialog = () => {
    setIsPaymentDialogVisible(true);
  };

  const handlePaymentDialogClose = () => {
    setIsPaymentDialogVisible(false);
    setRefreshKey((prev) => prev + 1);
  };

  const fitnessGoalOptions: ISelectOption[] = [
    {
      label: intl.formatMessage({ id: 'profile.goals.weightLoss' }),
      value: 'weight loss'
    },
    {
      label: intl.formatMessage({ id: 'profile.goals.muscleGain' }),
      value: 'muscle gain'
    },
    {
      label: intl.formatMessage({ id: 'profile.goals.mobility' }),
      value: 'gain mobility'
    },
    {
      label: intl.formatMessage({ id: 'profile.goals.maintenance' }),
      value: 'maintenance'
    },
    {
      label: intl.formatMessage({ id: 'profile.goals.flexibility' }),
      value: 'flexibility'
    }
  ];

  const activityLevelOptions: ISelectOption[] = [
    {
      label: intl.formatMessage({ id: 'profile.activity.sedentary' }),
      value: 'sedentary'
    },
    {
      label: intl.formatMessage({ id: 'profile.activity.moderate' }),
      value: 'moderately active'
    },
    {
      label: intl.formatMessage({ id: 'profile.activity.active' }),
      value: 'very active'
    }
  ];

  return {
    // Context
    intl,
    client,
    toast,

    // State
    personalInfo,
    setPersonalInfo,
    subscription,
    workoutHistory,
    activities,
    editDialogVisible,
    fitnessGoal,
    setFitnessGoal,
    activityLevel,
    setActivityLevel,
    progressData,
    filters,
    setFilters,
    statuses,
    isPaymentDialogVisible,

    // Handlers
    handleEditPersonalInfo,
    handleEditDialogClose,
    handleSavePersonalInfo,
    handleOpenPaymentDialog,
    handlePaymentDialogClose,

    // Options
    fitnessGoalOptions,
    activityLevelOptions,

    // Utilities
    formatDate,
    getDayMonthYear,
    getSeverity
  };
};

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { useUser } from '../../contexts/UserContext';
import { useToast } from '../../contexts/ToastContext';
import { useConfirmationDialog } from '../../utils/ConfirmationDialogContext';
import { useSpinner } from '../../utils/GlobalSpinner';
import { api } from '../../services/api-client';
import { formatDate } from '../../utils/UtilFunctions';

interface IWorkoutInstance {
  id: number;
  status: string;
  progress: number;
  instanceName: string;
  personalizedNotes: string;
  expectedStartDate: string;
  expectedEndDate: string;
  workout: {
    planName: string;
  };
}

interface IStudentSubscription {
  client: {
    name: string;
    fitnessGoal: string;
    activityLevel: string;
    user: {
      email: string;
      id: number;
    };
  };
  workoutInstances: IWorkoutInstance[];
}

interface IActivity {
  description: string;
  timestamp: string;
}

interface IChartData {
  labels?: string[];
  datasets?: Array<{
    data: number[];
    backgroundColor: string[];
    hoverBackgroundColor: string[];
  }>;
}

export const useStudentDetails = () => {
  const intl = useIntl();
  const navigate = useNavigate();
  const { client } = useUser();
  const { studentId } = useParams<{ studentId: string }>();
  const [student, setStudent] = useState<IStudentSubscription | null>(null);
  const { loading, setLoading } = useSpinner();
  const [activities, setActivities] = useState<IActivity[]>([]);
  const [progressData, setProgressData] = useState<IChartData>({});
  const [currentPlans, setCurrentPlans] = useState<IWorkoutInstance[]>([]);
  const [completedPlans, setCompletedPlans] = useState<IWorkoutInstance[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [planDetailsVisible, setPlanDetailsVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { showToast } = useToast();
  const { showConfirmationDialog } = useConfirmationDialog();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const { data: subscriptionData } = await api.subscription.fetchSubscriptionForStudent(Number(studentId));
        setStudent(subscriptionData);

        const instances: IWorkoutInstance[] = subscriptionData?.workoutInstances || [];
        const completed = instances.filter((workout) => workout.status === 'completed').length;
        const pending = instances.filter((workout) => workout.status === 'pending').length;

        setProgressData({
          labels: ['Completed', 'Pending'],
          datasets: [
            {
              data: [completed, pending],
              backgroundColor: ['green', 'red'],
              hoverBackgroundColor: ['green', 'red']
            }
          ]
        });

        const { data: activitiesData } = await api.user.fetchClientActivitiesByUserId(client!.user!.id);
        setActivities(activitiesData || []);

        setCurrentPlans(instances.filter((plan) => plan.status !== 'completed'));
        setCompletedPlans(instances.filter((plan) => plan.status === 'completed'));

        setError(null);
      } catch (err) {
        setError('Failed to fetch student data');
        showToast('error', 'Error', (err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [studentId, refreshKey]); // eslint-disable-line

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleViewPlanDetails = useCallback((plan: IWorkoutInstance) => {
    setSelectedPlan(plan.id);
    setPlanDetailsVisible(true);
  }, []);

  const handleDeletePlan = useCallback(
    (plan: IWorkoutInstance) => {
      showConfirmationDialog({
        message: intl.formatMessage({ id: 'deletePlan.confirmation.message' }),
        header: intl.formatMessage({ id: 'common.confirmation' }),
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          try {
            await api.workout.deleteWorkoutPlan(plan.id, false);
            setCurrentPlans((prev) => prev.filter((p) => p.id !== plan.id));
            showToast(
              'success',
              intl.formatMessage({ id: 'studentDetails.success.planDeleted' }, { name: plan.workout.planName })
            );
            setRefreshKey((prev) => prev + 1);
          } catch (err) {
            showToast('error', 'Error', (err as Error).message);
          }
        },
        reject: () => undefined
      });
    },
    [intl, showConfirmationDialog, showToast]
  );

  return {
    intl,
    student,
    loading,
    setLoading,
    activities,
    progressData,
    currentPlans,
    completedPlans,
    selectedPlan,
    planDetailsVisible,
    setPlanDetailsVisible,
    error,
    setRefreshKey,
    handleBack,
    handleViewPlanDetails,
    handleDeletePlan,
    formatDate
  };
};

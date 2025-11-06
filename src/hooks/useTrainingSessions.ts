import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { useUser } from '../contexts/UserContext';
import { useSpinner } from '../utils/GlobalSpinner';
import { useConfirmationDialog } from '../utils/ConfirmationDialogContext';
import { useToast } from '../contexts/ToastContext';
import { api } from '../services/api-client';

export function useTrainingSessions() {
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [selectedWorkouts, setSelectedWorkouts] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [isDialogVisible, setDialogVisible] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [filterOption, setFilterOption] = useState('all');
  const [filteredWorkouts, setFilteredWorkouts] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const intl = useIntl();
  const { setLoading } = useSpinner();
  const navigate = useNavigate();
  const { user, coach } = useUser();
  const { showConfirmationDialog } = useConfirmationDialog();
  const { showToast } = useToast();

  useEffect(() => {
    fetchWorkoutPlans();
    const loadStudents = async () => {
      try {
        if (!user) return;
        const { data } = await api.coach.fetchStudents();
        if (data) {
          setStudents(data);
        }
      } catch (error: any) {
        console.error('Error loading students:', error);
      }
    };
    loadStudents();
    // eslint-disable-next-line
  }, [refreshKey, user]);

  useEffect(() => {
    const filterWorkouts = () => {
      if (filterOption === 'all') {
        setFilteredWorkouts(workouts);
      } else if (filterOption === 'general') {
        setFilteredWorkouts(workouts.filter((workout) => workout.clientWorkouts.length === 0));
      } else {
        setFilteredWorkouts(
          workouts.filter((workout) =>
            workout.clientWorkouts.some((cw: any) => cw.clientSubscription.client.id === filterOption)
          )
        );
      }
    };

    filterWorkouts();
    // eslint-disable-next-line
  }, [filterOption, workouts, refreshKey]);

  const fetchWorkoutPlans = async () => {
    if (!coach) return;
    setLoading(true);
    try {
      const { data } = await api.workout.findAllWorkoutTemplatesByCoachId();
      if (data) {
        setWorkouts(data);
      }
    } catch (error: any) {
      console.error('Error fetching workout plans:', error);
      showToast('error', intl.formatMessage({ id: 'coach.delete.error.generic' }), error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (workoutInstanceTemplateId: number) => {
    showConfirmationDialog({
      message: intl.formatMessage({ id: 'coach.delete.confirmation' }),
      header: intl.formatMessage({ id: 'coach.delete.header' }),
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        setLoading(true);
        try {
          await api.workout.deleteWorkoutPlan(workoutInstanceTemplateId, true);
          setRefreshKey((prev) => prev + 1);
        } catch (error: any) {
          console.error('Error deleting workout plan:', error);
          showToast('error', intl.formatMessage({ id: 'coach.delete.error.generic' }), error.message);
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleUnassignFromClient = async (workoutInstanceTemplateId: number) => {
    setLoading(true);
    try {
      if (filterOption !== 'all' && filterOption !== 'general') {
        await api.workout.unassignWorkoutFromClient(Number(filterOption), [workoutInstanceTemplateId]);
        setRefreshKey((prev) => prev + 1);
      } else {
        showToast(
          'error',
          intl.formatMessage({ id: 'coach.unassign.error' }),
          intl.formatMessage({ id: 'coach.unassign.error.detail' })
        );
      }
    } catch (error: any) {
      console.error('Error unassigning workout from client:', error);
      showToast('error', intl.formatMessage({ id: 'coach.unassign.error' }), error.message);
    } finally {
      setLoading(false);
      setSelectedWorkouts([]);
      setSelectedClient(null);
      setDialogVisible(false);
    }
  };

  const handleUnassignAllFromClient = async () => {
    setLoading(true);
    try {
      if (filterOption !== 'all' && filterOption !== 'general') {
        await api.workout.unassignWorkoutFromClient(
          Number(filterOption),
          selectedWorkouts.map((workout) => workout.id)
        );
        setRefreshKey((prev) => prev + 1);
      } else {
        showToast(
          'error',
          intl.formatMessage({ id: 'coach.unassign.error' }),
          intl.formatMessage({ id: 'coach.unassign.error.detail' })
        );
      }
      setSelectedWorkouts([]);
      setSelectedClient(null);
    } catch (error: any) {
      console.error('Error unassigning workout from client:', error);
      showToast('error', intl.formatMessage({ id: 'coach.unassign.error' }), error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignToClient = async () => {
    setLoading(true);
    try {
      if (selectedWorkouts.length === 0 || !selectedClient) {
        showToast(
          'error',
          intl.formatMessage({ id: 'coach.assign.error' }),
          intl.formatMessage({ id: 'coach.assign.error.detail' })
        );
        return;
      }

      await api.workout.assignWorkoutToClient(
        selectedClient.id,
        selectedWorkouts.map((workout) => workout.id)
      );

      setDialogVisible(false);
      setSelectedWorkouts([]);
      setSelectedClient(null);
      setRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      console.error('Error assigning workout to client:', error);
      showToast('error', intl.formatMessage({ id: 'coach.assign.error' }), error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAssignDialog = (workoutId: number) => {
    setSelectedWorkouts([workouts.find((w) => w.id === workoutId)]);
    setDialogVisible(true);
  };

  const filterOptions = [
    { label: intl.formatMessage({ id: 'plansPage.filter.all' }), value: 'all' },
    { label: intl.formatMessage({ id: 'plansPage.filter.general' }), value: 'general' },
    ...students.map((student) => ({ label: student.name, value: student.id }))
  ];

  return {
    workouts: filteredWorkouts,
    selectedWorkouts,
    setSelectedWorkouts,
    selectedClient,
    setSelectedClient,
    isDialogVisible,
    setDialogVisible,
    students,
    filterOption,
    setFilterOption,
    filterOptions,
    handleDelete,
    handleUnassignFromClient,
    handleUnassignAllFromClient,
    handleAssignToClient,
    handleOpenAssignDialog,
    navigate,
    refreshKey
  };
}

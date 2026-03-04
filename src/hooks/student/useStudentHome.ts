import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { useUser } from '../../contexts/UserContext';
import { api } from '../../services/api-client';

interface IStreak {
  currentStreak: number;
}

interface IStreakData {
  daily: IStreak | null;
  weekly: IStreak | null;
}

interface ITodayWorkout {
  id: number;
  name: string;
  status: string;
  sessionId: number;
  sessionDate: string;
  dayNumber: number;
}

export const useStudentHome = () => {
  const intl = useIntl();
  const { user, client } = useUser();
  const navigate = useNavigate();
  const [streak, setStreak] = useState<IStreakData>({ daily: null, weekly: null });
  const [todayWorkouts, setTodayWorkouts] = useState<ITodayWorkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [planDetailsVisible, setPlanDetailsVisible] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const { data: streakData } = await api.user.fetchClientStreak(client!.id);
        setStreak(streakData);

        const { data: todayWorkoutsData } = await api.user.fetchAmIWorkingOutToday(client!.id);
        const transformedWorkouts: ITodayWorkout[] = (todayWorkoutsData || []).map(
          (workout: Record<string, unknown>) => ({
            id: workout.workoutInstanceId,
            name: workout.planName,
            status: workout.status,
            sessionId: workout.sessionId,
            sessionDate: workout.sessionDate,
            dayNumber: workout.dayNumber
          })
        );

        setTodayWorkouts(transformedWorkouts);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    if (user && client) {
      fetchData();
    }
  }, [user, client, refreshKey]); // eslint-disable-line

  const handleViewWorkoutDetails = useCallback((workoutId: number) => {
    setSelectedPlan(workoutId);
    setPlanDetailsVisible(true);
  }, []);

  const handleStartTrainingSession = useCallback(
    (workoutId: number) => {
      navigate(`/plans/start-session/${workoutId}`, {
        state: { isTraining: true, planId: workoutId }
      });
    },
    [navigate]
  );

  const handleGoToCalendar = useCallback(() => {
    navigate('/student/calendar');
  }, [navigate]);

  const formatDate = useCallback(
    (date: Date) => {
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      };
      return date.toLocaleDateString(intl.locale, options);
    },
    [intl.locale]
  );

  return {
    intl,
    client,
    streak,
    todayWorkouts,
    loading,
    setLoading,
    selectedPlan,
    planDetailsVisible,
    setPlanDetailsVisible,
    setRefreshKey,
    handleViewWorkoutDetails,
    handleStartTrainingSession,
    handleGoToCalendar,
    formatDate
  };
};

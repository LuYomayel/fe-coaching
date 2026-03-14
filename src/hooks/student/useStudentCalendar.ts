import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { useUser } from '../../contexts/UserContext';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../services/api-client';
import { getDayMonthYear, formatDateToApi } from '../../utils/UtilFunctions';
import FullCalendar from '@fullcalendar/react';

interface ICalendarEvent {
  title: string;
  start: string;
  extendedProps: {
    status?: string;
    workoutInstanceId?: number;
    sessionId: number;
  };
}

interface IMonthOption {
  label: string;
  value: number;
}

export const useStudentCalendar = () => {
  const intl = useIntl();
  const { user, client } = useUser();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [calendarEvents, setCalendarEvents] = useState<ICalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [planDetailsVisible, setPlanDetailsVisible] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [today] = useState(new Date());
  const calendarRef = useRef<FullCalendar>(null);

  const updateStatus = (workout: Record<string, unknown>, session: Record<string, unknown>) => {
    const now = new Date();
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sessionDate = new Date(session.sessionDate as string);
    const sessionDay = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate());
    if (workout.status === 'pending') {
      if (sessionDay < todayDate) {
        return 'expired';
      } else if (sessionDay.getTime() === todayDate.getTime()) {
        return 'current';
      }
    }
    return workout.status as string;
  };

  useEffect(() => {
    const fetchTrainingData = async () => {
      if (!user || !client) return;
      try {
        setLoading(true);
        const { data } = await api.workout.fetchMyTrainingCycles();
        const cycles = data || [];
        const events: ICalendarEvent[] = cycles.flatMap((cycle: Record<string, unknown>) =>
          ((cycle.trainingWeeks as Record<string, unknown>[]) || []).flatMap((week: Record<string, unknown>) =>
            ((week.trainingSessions as Record<string, unknown>[]) || []).flatMap((session: Record<string, unknown>) => {
              const workoutInstances = (session.workoutInstances as Record<string, unknown>[]) || [];
              if (workoutInstances.length > 0) {
                return workoutInstances.map((workoutInstance: Record<string, unknown>) => {
                  const status = updateStatus(workoutInstance, session);
                  const start = formatDateToApi(new Date(session.sessionDate as string));
                  const workout = workoutInstance.workout as Record<string, unknown>;
                  return {
                    title: (workoutInstance.instanceName as string) || (workout.planName as string),
                    start,
                    extendedProps: {
                      status,
                      workoutInstanceId: workoutInstance.id as number,
                      sessionId: session.id as number
                    }
                  };
                });
              }
              return [
                {
                  title: 'no title',
                  start: formatDateToApi(getDayMonthYear(session as { sessionDate: string })),
                  extendedProps: {
                    sessionId: session.id as number
                  }
                }
              ];
            })
          )
        );

        const trainingSessionWithNoWeek = await api.workout.fetchMyTrainingSessionWithNoWeek();
        const noWeekData = trainingSessionWithNoWeek.data || [];
        const noWeekEvents: ICalendarEvent[] = noWeekData.map((session: Record<string, unknown>) => {
          const workoutInstances = session.workoutInstances as Record<string, unknown>[];
          const firstInstance = workoutInstances[0] as Record<string, unknown>;
          const workout = firstInstance.workout as Record<string, unknown>;
          return {
            title: (firstInstance.instanceName as string) || (workout.planName as string),
            start: formatDateToApi(getDayMonthYear(session as { sessionDate: string })),
            extendedProps: {
              workoutInstanceId: firstInstance.id as number,
              status: firstInstance.status as string,
              sessionId: session.id as number
            }
          };
        });
        setCalendarEvents([...events, ...noWeekEvents]);
        setLoading(false);
      } catch (err) {
        console.log(err);
        setError('Failed to fetch training data');
        setLoading(false);
        showToast('error', 'Error', (err as Error).message);
      }
    };

    if (user && client) {
      fetchTrainingData();
    }
  }, [user?.userId, client?.id]); // eslint-disable-line

  const handleViewWorkoutDetails = useCallback((workoutInstanceId: number) => {
    setSelectedPlan(workoutInstanceId);
    setPlanDetailsVisible(true);
  }, []);

  const handleStartTrainingSession = useCallback(
    (workoutInstanceId: number) => {
      navigate(`/plans/start-session/${workoutInstanceId}`, {
        state: { isTraining: true, planId: workoutInstanceId }
      });
    },
    [navigate]
  );

  const monthOptions: IMonthOption[] = [
    { label: intl.formatMessage({ id: 'months.january' }), value: 0 },
    { label: intl.formatMessage({ id: 'months.february' }), value: 1 },
    { label: intl.formatMessage({ id: 'months.march' }), value: 2 },
    { label: intl.formatMessage({ id: 'months.april' }), value: 3 },
    { label: intl.formatMessage({ id: 'months.may' }), value: 4 },
    { label: intl.formatMessage({ id: 'months.june' }), value: 5 },
    { label: intl.formatMessage({ id: 'months.july' }), value: 6 },
    { label: intl.formatMessage({ id: 'months.august' }), value: 7 },
    { label: intl.formatMessage({ id: 'months.september' }), value: 8 },
    { label: intl.formatMessage({ id: 'months.october' }), value: 9 },
    { label: intl.formatMessage({ id: 'months.november' }), value: 10 },
    { label: intl.formatMessage({ id: 'months.december' }), value: 11 }
  ];

  const handleMonthChange = useCallback(
    (value: number) => {
      setSelectedMonth(value);
      const calendarApi = calendarRef.current?.getApi();
      if (calendarApi) {
        calendarApi.gotoDate(new Date(new Date().getFullYear(), value, 1));
      }
    },
    [calendarRef]
  );

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
    calendarEvents,
    loading,
    setLoading,
    error,
    selectedPlan,
    planDetailsVisible,
    setPlanDetailsVisible,
    selectedMonth,
    today,
    calendarRef,
    monthOptions,
    handleViewWorkoutDetails,
    handleStartTrainingSession,
    handleMonthChange,
    formatDate
  };
};

import { useState, useEffect, useMemo } from 'react';
import { useIntl, IntlShape } from 'react-intl';
import { useNavigate, useLocation, NavigateFunction, Location } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import { useSpinner } from '../../utils/GlobalSpinner';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../services/api-client';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

interface ILastTimeTrainedItem {
  clientId: number;
  clientName: string;
  lastTimeTrained: string | null;
}

interface IHowLongToFinishCycleItem {
  clientId: number;
  daysLeft: number | null;
}

interface ITrainingFrequencyItem {
  clientId: number;
  trainingSessionsLast30Days: number;
  trainingSessionsLast15Days: number;
  trainingSessionsLast7Days: number;
}

interface IPaymentStatusItem {
  clientId: number;
  isPaid: boolean;
  lastPaymentDate: string | null;
  nextPaymentDate: string | null;
  status: string | null;
}

export interface ICombinedClientData {
  clientId: number;
  clientName: string;
  lastTimeTrained: string | null;
  daysLeft: number | null;
  trainingSessionsLast30Days: number;
  trainingSessionsLast15Days: number;
  trainingSessionsLast7Days: number;
  isPaid: boolean;
  lastPaymentDate: string | null;
  nextPaymentDate: string | null;
  paymentStatus: string | null;
}

export interface IUseCoachHomeReturn {
  // Data
  combinedClientData: ICombinedClientData[];
  formattedDate: string;
  totalClients: number;
  totalPaid: number;
  unpaidClients: ICombinedClientData[];
  clientsWithDaysLeft: ICombinedClientData[];
  mostActiveClients: ICombinedClientData[];

  // Context values
  coachName: string;
  intl: IntlShape;
  navigate: NavigateFunction;
  location: Location;

  // Handlers
  goToManageStudents: () => void;
  viewClientProfile: (_clientId: number) => void;
  getStatusColor: (_status: string | null) => string;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export const useCoachHome = (): IUseCoachHomeReturn => {
  const { setLoading } = useSpinner();
  const { showToast } = useToast();
  const { coach, user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const intl = useIntl();

  const [combinedClientData, setCombinedClientData] = useState<ICombinedClientData[]>([]);

  const formattedDate = useMemo(() => {
    const currentDate = new Date();
    return new Intl.DateTimeFormat(intl.locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: true
    }).format(currentDate);
  }, [intl.locale]);

  useEffect(() => {
    if (!coach?.id) return;

    const fetchData = async (): Promise<void> => {
      setLoading(true);
      try {
        const [lastTimeTrained, howLongToFinishCycle, trainingFrequency, clientsPaymentStatus] = await Promise.all([
          api.workout.fetchLastTimeTrained(),
          api.workout.fetchHowLongToFinishCycle(),
          api.workout.fetchTrainingFrequency(),
          api.subscription.fetchClientsPaymentStatus()
        ]);

        const ltData: ILastTimeTrainedItem[] = lastTimeTrained.data ?? [];
        const cycleData: IHowLongToFinishCycleItem[] = howLongToFinishCycle.data ?? [];
        const freqData: ITrainingFrequencyItem[] = trainingFrequency.data ?? [];
        const payData: IPaymentStatusItem[] = clientsPaymentStatus.data ?? [];

        const merged: ICombinedClientData[] = ltData.map((lt) => {
          const cycle = cycleData.find((cd) => cd.clientId === lt.clientId);
          const freq = freqData.find((fd) => fd.clientId === lt.clientId);
          const pay = payData.find((pd) => pd.clientId === lt.clientId);

          return {
            clientId: lt.clientId,
            clientName: lt.clientName,
            lastTimeTrained: lt.lastTimeTrained,
            daysLeft: cycle ? cycle.daysLeft : null,
            trainingSessionsLast30Days: freq ? freq.trainingSessionsLast30Days : 0,
            trainingSessionsLast15Days: freq ? freq.trainingSessionsLast15Days : 0,
            trainingSessionsLast7Days: freq ? freq.trainingSessionsLast7Days : 0,
            isPaid: pay ? pay.isPaid : false,
            lastPaymentDate: pay ? pay.lastPaymentDate : null,
            nextPaymentDate: pay ? pay.nextPaymentDate : null,
            paymentStatus: pay ? pay.status : null
          };
        });

        setCombinedClientData(merged);
      } catch {
        showToast(
          'error',
          intl.formatMessage({ id: 'common.error' }),
          intl.formatMessage({ id: 'coach.home.fetchError' })
        );
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [coach?.id]); // eslint-disable-line

  // -- Derived data for cards / lists
  const totalClients = combinedClientData.length;
  const totalPaid = combinedClientData.filter((c) => c.isPaid).length;
  const unpaidClients = combinedClientData.filter((c) => !c.isPaid);

  const clientsWithDaysLeft = useMemo(
    () =>
      combinedClientData
        .filter((c) => c.daysLeft !== null)
        .sort((a, b) => (a.daysLeft ?? 0) - (b.daysLeft ?? 0))
        .slice(0, 5),
    [combinedClientData]
  );

  const mostActiveClients = useMemo(
    () => [...combinedClientData].sort((a, b) => b.trainingSessionsLast7Days - a.trainingSessionsLast7Days).slice(0, 5),
    [combinedClientData]
  );

  const coachName = coach?.name || user?.name || 'Coach';

  const goToManageStudents = (): void => {
    navigate('/manage-students');
  };

  const viewClientProfile = (clientId: number): void => {
    navigate(`/client-dashboard/${clientId}`);
  };

  const getStatusColor = (status: string | null): string => {
    if (!status) return 'inactive';

    switch (status.toLowerCase()) {
      case 'active':
        return 'active';
      case 'pending':
        return 'pending';
      default:
        return 'inactive';
    }
  };

  return {
    combinedClientData,
    formattedDate,
    totalClients,
    totalPaid,
    unpaidClients,
    clientsWithDaysLeft,
    mostActiveClients,
    coachName,
    intl,
    navigate,
    location,
    goToManageStudents,
    viewClientProfile,
    getStatusColor
  };
};

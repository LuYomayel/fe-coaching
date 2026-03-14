import { useState, useEffect, useRef, SyntheticEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { Toast } from 'primereact/toast';

import { useUser } from '../../contexts/UserContext';
import { useToast } from '../../contexts/ToastContext';
import { useSpinner } from '../../utils/GlobalSpinner';
import { useConfirmationDialog } from '../../utils/ConfirmationDialogContext';
import { api } from '../../services/api-client';
import { ICoachPlan } from '../../types/coach/coach-plan';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface IStudent {
  id: number;
  name: string;
  avatar?: string;
  fitnessGoal?: string;
  user?: {
    email?: string;
    isVerified?: boolean;
    subscription?: {
      id: number;
      status: string;
      nextPaymentDate?: string;
      clientSubscription?: {
        coachPlan: {
          name: string;
        };
      };
    };
  };
}

interface IClientsSubscribedResponse {
  total: number;
  clients: IStudent[];
}

export interface IStatusOption {
  label: string;
  value: string;
}

export const useManageStudents = () => {
  const { user, coach } = useUser();
  const [students, setStudents] = useState<IStudent[]>([]);
  const { showToast } = useToast();

  const [selectedStudent, setSelectedStudent] = useState<IStudent | null>(null);
  const [isNewStudentDialogVisible, setIsNewStudentDialogVisible] = useState<boolean>(false);
  const [isSubscriptionDialogVisible, setIsSubscriptionDialogVisible] = useState<boolean>(false);
  const [isRegisterPaymentDialogVisible, setIsRegisterPaymentDialogVisible] = useState<boolean>(false);
  const [isStudentDetailVisible, setIsStudentDetailVisible] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [coachPlans, setCoachPlans] = useState<ICoachPlan[]>([]);
  const { showConfirmationDialog } = useConfirmationDialog();
  const [totalClientsSubscribed, setTotalClientsSubscribed] = useState<number>(0);
  const [maxClients, setMaxClients] = useState<number>(0);
  const [globalFilter, setGlobalFilter] = useState<string>('');
  const [currentView, setCurrentView] = useState<string>('grid');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const toast = useRef<Toast>(null);

  const { setLoading } = useSpinner();
  const navigate = useNavigate();

  const intl = useIntl();

  const calculateRemainingDays = (nextPaymentDate?: string): number => {
    if (!nextPaymentDate) return 0;

    const today = new Date();
    const paymentDate = new Date(nextPaymentDate);
    const timeDifference = paymentDate.getTime() - today.getTime();
    const daysDifference = Math.ceil(timeDifference / (1000 * 3600 * 24));

    return daysDifference > 0 ? daysDifference : 0;
  };

  useEffect(() => {
    setLoading(true);
    const loadClientsSubscribed = async () => {
      try {
        const { data } = await api.coach.fetchClientsSubscribed();
        const response = data as unknown as IClientsSubscribedResponse;
        setMaxClients(response.total);
        setTotalClientsSubscribed(
          response.clients.filter((client: IStudent) => client.user?.subscription?.status === 'Active').length
        );

        setStudents(response.clients);
      } catch (error) {
        showToast('error', 'Error fetching clients subscribed', (error as Error).message);
      } finally {
        setLoading(false);
      }
    };

    const loadCoachPlans = async () => {
      try {
        const { data } = await api.subscription.fetchCoachPlans();
        setCoachPlans(data ?? []);
      } catch (error) {
        showToast('error', 'Error fetching coach plans', (error as Error).message);
      }
    };

    loadClientsSubscribed();

    setTimeout(() => {
      loadCoachPlans();
    }, 100);
  }, [refreshKey, user?.userId, showToast, setLoading, coach?.id]);

  const handleResendVerification = async (email?: string) => {
    try {
      setLoading(true);
      await api.auth.sendVerificationEmail(email ?? '');
      showToast(
        'success',
        intl.formatMessage({ id: 'student.success' }),
        intl.formatMessage({ id: 'student.verificationEmailSent' })
      );
    } catch (error) {
      showToast('error', 'Error', (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const viewProfile = (clientId: number) => {
    navigate(`/client-dashboard/${clientId}`);
  };

  const openNewStudentDialog = () => {
    setIsNewStudentDialogVisible(true);
  };

  const handleNewStudentDialogHide = () => {
    setIsNewStudentDialogVisible(false);
    setRefreshKey((prevKey) => prevKey + 1);
  };

  const openSubscriptionDialog = (student: IStudent) => {
    if (coachPlans.length === 0) {
      showToast(
        'warn',
        intl.formatMessage({ id: 'common.warning' }),
        intl.formatMessage({ id: 'student.error.noCoachPlans' }, true as unknown as Record<string, string>)
      );
      return;
    }
    setSelectedStudent(student);
    setIsSubscriptionDialogVisible(true);
  };

  const openRegisterPaymentDialog = (student: IStudent) => {
    setSelectedStudent(student);
    setIsRegisterPaymentDialogVisible(true);
  };

  const handleSubscriptionDialogHide = () => {
    setIsSubscriptionDialogVisible(false);
    setRefreshKey((prevKey) => prevKey + 1);
  };

  const handleRegisterPaymentDialogHide = () => {
    setIsRegisterPaymentDialogVisible(false);
    setRefreshKey((prevKey) => prevKey + 1);
  };

  const handleStudentDetailHide = () => {
    setIsStudentDetailVisible(false);
    setRefreshKey((prevKey) => prevKey + 1);
  };

  const handleCancelSubscription = (clientSubscriptionId: number) => {
    api.subscription
      .cancelSubscription(clientSubscriptionId)
      .then(() => {
        setRefreshKey((old) => old + 1);
        showToast('success', 'Subscription deleted successfully');
      })
      .catch((error: unknown) => {
        console.log(error);
        showToast('error', 'Error', (error as Error).message);
      });
  };

  const deleteCancelSubscription = (clientSubscriptionId: number) => {
    showConfirmationDialog({
      message: intl.formatMessage({ id: 'coach.subscription.confirm.delete' }),
      header: intl.formatMessage({ id: 'common.confirmation' }),
      icon: 'pi pi-exclamation-triangle',
      accept: () => handleCancelSubscription(clientSubscriptionId),
      reject: () => undefined
    });
  };

  const handleDeleteUser = async (clientId: number) => {
    try {
      setLoading(true);
      const isDeleted = await api.user.deleteClient(clientId);
      if (isDeleted) {
        showToast('success', 'Client successfully deleted!');
        setRefreshKey((old) => old + 1);
      }
    } catch (error) {
      showToast('error', 'Error', (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const deleteStudentDialog = (clientId: number) => {
    showConfirmationDialog({
      message: intl.formatMessage({ id: 'deleteStudent.confirmation.message' }),
      header: intl.formatMessage({ id: 'common.confirmation' }),
      icon: 'pi pi-exclamation-triangle',
      accept: () => handleDeleteUser(clientId),
      reject: () => undefined
    });
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name?.toLowerCase().includes(globalFilter.toLowerCase()) ||
      student.user?.email?.toLowerCase().includes(globalFilter.toLowerCase()) ||
      student.fitnessGoal?.toLowerCase().includes(globalFilter.toLowerCase());

    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'active') return matchesSearch && student.user?.subscription?.status === 'Active';
    if (filterStatus === 'inactive') return matchesSearch && student.user?.subscription?.status !== 'Active';
    if (filterStatus === 'unverified') return matchesSearch && !student.user?.isVerified;

    return matchesSearch;
  });

  const statusOptions: IStatusOption[] = [
    { label: intl.formatMessage({ id: 'common.all' }) || 'Todos', value: 'all' },
    { label: intl.formatMessage({ id: 'students.status.active' }) || 'Activos', value: 'active' },
    { label: intl.formatMessage({ id: 'students.status.inactive' }) || 'Inactivos', value: 'inactive' },
    { label: intl.formatMessage({ id: 'students.status.unverified' }) || 'No verificados', value: 'unverified' }
  ];

  const sortedStudents = [...filteredStudents].sort((a, b) => {
    const daysA = calculateRemainingDays(a.user?.subscription?.nextPaymentDate) || 0;
    const daysB = calculateRemainingDays(b.user?.subscription?.nextPaymentDate) || 0;

    if ((a.user?.subscription && !b.user?.subscription) || (!a.user?.isVerified && b.user?.isVerified)) return -1;
    if ((!a.user?.subscription && b.user?.subscription) || (a.user?.isVerified && !b.user?.isVerified)) return 1;

    if (a.user?.subscription && b.user?.subscription) {
      return daysA - daysB;
    }

    return a.name?.localeCompare(b.name) ?? 0;
  });

  const handleImageError = (e: SyntheticEvent<HTMLImageElement, Event>) => {
    (e.target as HTMLImageElement).src =
      'https://t4.ftcdn.net/jpg/05/49/98/39/360_F_549983970_bRCkYfk0P6PP5fKbMhZMIb07mCJ6esXL.jpg';
  };

  return {
    user,
    toast,
    intl,
    students,
    selectedStudent,
    isNewStudentDialogVisible,
    isSubscriptionDialogVisible,
    isRegisterPaymentDialogVisible,
    isStudentDetailVisible,
    refreshKey,
    setRefreshKey,
    coachPlans,
    totalClientsSubscribed,
    maxClients,
    globalFilter,
    setGlobalFilter,
    currentView,
    setCurrentView,
    filterStatus,
    setFilterStatus,
    statusOptions,
    sortedStudents,
    calculateRemainingDays,
    handleResendVerification,
    viewProfile,
    openNewStudentDialog,
    handleNewStudentDialogHide,
    openSubscriptionDialog,
    openRegisterPaymentDialog,
    handleSubscriptionDialogHide,
    handleRegisterPaymentDialogHide,
    handleStudentDetailHide,
    deleteCancelSubscription,
    deleteStudentDialog,
    handleImageError
  };
};

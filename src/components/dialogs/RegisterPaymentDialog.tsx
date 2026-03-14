import { useEffect, useState } from 'react';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { useIntl } from 'react-intl';
import { useToast } from '../../contexts/ToastContext';
import { useUser } from '../../contexts/UserContext';
import { useConfirmationDialog } from '../../utils/ConfirmationDialogContext';
import { formatDateToApi, validateDates } from '../../utils/UtilFunctions';
import { api } from '../../services/api-client';

interface ICoachPlanOption {
  id: number;
  name: string;
}

interface ISubscription {
  startDate?: string;
  endDate?: string;
  [key: string]: unknown;
}

interface ICoachPlan {
  id?: number;
  [key: string]: unknown;
}

interface IRegisterPaymentDialogProps {
  studentId: number;
  onClose: () => void;
  oldSubscription: ISubscription;
  oldCoachPlan: ICoachPlan;
}

const RegisterPaymentDialog = ({ studentId, onClose, oldSubscription, oldCoachPlan }: IRegisterPaymentDialogProps) => {
  const intl = useIntl();
  const { user } = useUser();
  const { showToast } = useToast();
  const { showConfirmationDialog } = useConfirmationDialog();

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [paymentDate, setPaymentDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [coachPlans, setCoachPlans] = useState<ICoachPlanOption[]>([]);
  const [selectedCoachPlan, setSelectedCoachPlan] = useState<number | null>(null);

  useEffect(() => {
    if (oldSubscription.startDate) {
      const newStartDate = new Date(oldSubscription.startDate);
      newStartDate.setMonth(newStartDate.getMonth() + 1);
      setStartDate(newStartDate);
    }

    if (oldSubscription.endDate) {
      const newEndDate = new Date(oldSubscription.endDate);
      newEndDate.setMonth(newEndDate.getMonth() + 1);
      setEndDate(newEndDate);
    }

    setPaymentDate(new Date());
    setSelectedCoachPlan(oldCoachPlan.id ?? null);

    const loadCoachPlans = async () => {
      try {
        const { data } = await api.subscription.fetchCoachPlans();
        setCoachPlans(data ?? []);
      } catch (error) {
        showToast('error', 'Error', (error as Error).message);
      }
    };
    loadCoachPlans();
  }, [user?.userId, oldSubscription, oldCoachPlan, showToast]);

  const onClickRegisterPayment = () => {
    const body = {
      clientId: studentId,
      startDate: startDate ? formatDateToApi(startDate) : null,
      endDate: endDate ? formatDateToApi(endDate) : null,
      paymentDate,
      coachPlanId: selectedCoachPlan
    };

    const { isValid, message } = validateDates(startDate, endDate, intl);
    if (!isValid) {
      showToast('error', 'Error', message);
      return;
    }

    if (!paymentDate) {
      showToast('error', 'Error', 'Please select a Payment date');
      return;
    }

    if (!selectedCoachPlan) {
      showToast('error', 'Error', 'Please select a coach plan');
      return;
    }

    showConfirmationDialog({
      message: intl.formatMessage({ id: 'registerPayment.confirmation.message' }),
      header: intl.formatMessage({ id: 'common.confirmation' }),
      icon: 'pi pi-exclamation-triangle',
      accept: () => handleRegisterPayment(body)
    });
  };

  const handleRegisterPayment = async (body: Record<string, unknown>) => {
    try {
      setLoading(true);
      const response = await api.subscription.registerPayment(body);
      if (response.message === 'success') {
        showToast('success', 'Success', 'Payment registered and subscription updated successfully');
        onClose();
      } else {
        showToast('error', 'Error', response.error || '');
      }
    } catch (error) {
      showToast('error', 'Error', (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-3">
      <div className="p-field">
        <label htmlFor="startDate">New Start Date</label>
        <Calendar
          id="startDate"
          locale={intl.locale}
          dateFormat="dd/mm/yy"
          value={startDate}
          onChange={(e) => setStartDate(e.value as Date | null)}
          showIcon
        />
      </div>
      <div className="p-field">
        <label htmlFor="endDate">New End Date</label>
        <Calendar
          id="endDate"
          locale={intl.locale}
          dateFormat="dd/mm/yy"
          value={endDate}
          onChange={(e) => setEndDate(e.value as Date | null)}
          showIcon
        />
      </div>
      <div className="p-field">
        <label htmlFor="paymentDate">Payment Date</label>
        <Calendar
          id="paymentDate"
          locale={intl.locale}
          dateFormat="dd/mm/yy"
          value={paymentDate}
          onChange={(e) => setPaymentDate(e.value as Date | null)}
          showIcon
        />
      </div>
      <div className="p-field">
        <label htmlFor="coachPlan">Select Plan</label>
        <Dropdown
          id="coachPlan"
          options={coachPlans}
          optionLabel="name"
          optionValue="id"
          value={selectedCoachPlan}
          onChange={(e) => setSelectedCoachPlan(e.value)}
        />
      </div>
      <Button label="Register Payment" icon="pi pi-dollar" loading={loading} onClick={onClickRegisterPayment} />
    </div>
  );
};

export default RegisterPaymentDialog;

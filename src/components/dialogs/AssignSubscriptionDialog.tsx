import { useEffect, useState } from 'react';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { useIntl, FormattedMessage } from 'react-intl';
import { useToast } from '../../contexts/ToastContext';
import { useUser } from '../../contexts/UserContext';
import { useConfirmationDialog } from '../../utils/ConfirmationDialogContext';
import { formatDateToApi, validateDates } from '../../utils/UtilFunctions';
import { api } from '../../services/api-client';

interface ICoachPlanOption {
  id: number;
  name: string;
}

interface IAssignSubscriptionDialogProps {
  studentId: number;
  onClose: () => void;
}

const AssignSubscriptionDialog = ({ studentId, onClose }: IAssignSubscriptionDialogProps) => {
  const intl = useIntl();
  const { user } = useUser();
  const { showToast } = useToast();
  const { showConfirmationDialog } = useConfirmationDialog();

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [coachPlans, setCoachPlans] = useState<ICoachPlanOption[]>([]);
  const [selectedCoachPlan, setSelectedCoachPlan] = useState<number | null>(null);

  useEffect(() => {
    const loadCoachPlans = async () => {
      try {
        const { data } = await api.subscription.fetchCoachPlans();
        setCoachPlans(data ?? []);
      } catch (error) {
        showToast('error', intl.formatMessage({ id: 'error' }), (error as Error).message);
      }
    };

    if (user?.userId) {
      loadCoachPlans();
    }
  }, [user, showToast, intl]);

  const handleAssign = () => {
    const body = {
      clientId: studentId,
      startDate: startDate ? formatDateToApi(startDate) : null,
      endDate: endDate ? formatDateToApi(endDate) : null,
      coachPlanId: selectedCoachPlan
    };

    const { isValid, message } = validateDates(startDate, endDate, intl);
    if (!isValid) {
      showToast('error', intl.formatMessage({ id: 'error' }), message);
      return;
    }

    if (!selectedCoachPlan) {
      showToast(
        'error',
        intl.formatMessage({ id: 'error' }),
        intl.formatMessage({ id: 'assignSubscription.error.selectPlan' })
      );
      return;
    }

    showConfirmationDialog({
      message: intl.formatMessage({ id: 'assignSubscription.confirmation.message' }),
      header: intl.formatMessage({ id: 'common.confirmation' }),
      icon: 'pi pi-exclamation-triangle',
      accept: () => confirmAssign(body)
    });
  };

  const confirmAssign = async (body: Record<string, unknown>) => {
    try {
      setLoading(true);
      await api.subscription.assignSubscription(body);
      showToast(
        'success',
        intl.formatMessage({ id: 'success' }),
        intl.formatMessage({ id: 'assignSubscription.success' })
      );
      onClose();
    } catch (error) {
      showToast('error', intl.formatMessage({ id: 'error' }), (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-3">
      <div className="flex flex-row gap-2">
        <div className="p-field w-full">
          <label htmlFor="startDate">
            <FormattedMessage id="startDate" />
          </label>
          <Calendar
            id="startDate"
            locale={intl.locale}
            dateFormat="dd/mm/yy"
            value={startDate}
            onChange={(e) => setStartDate(e.value as Date | null)}
            showIcon
            className="w-full"
          />
        </div>
        <div className="p-field w-full">
          <label htmlFor="endDate">
            <FormattedMessage id="endDate" />
          </label>
          <Calendar
            id="endDate"
            locale={intl.locale}
            dateFormat="dd/mm/yy"
            value={endDate}
            onChange={(e) => setEndDate(e.value as Date | null)}
            showIcon
            className="w-full"
          />
        </div>
      </div>
      <div className="p-field">
        <label htmlFor="coachPlan">
          <FormattedMessage id="plan" />
        </label>
        <Dropdown
          id="coachPlan"
          options={coachPlans}
          optionLabel="name"
          optionValue="id"
          value={selectedCoachPlan}
          onChange={(e) => setSelectedCoachPlan(e.value)}
          className="w-full"
        />
      </div>
      <div className="flex justify-content-end">
        <Button
          label={intl.formatMessage({ id: 'common.save' })}
          icon="pi pi-check"
          loading={loading}
          onClick={handleAssign}
        />
      </div>
    </div>
  );
};

export default AssignSubscriptionDialog;

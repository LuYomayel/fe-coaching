import React, { useEffect, useState, useContext } from 'react';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { useToast } from '../utils/ToastContext';
import { UserContext } from '../utils/UserContext';
import { Dropdown } from 'primereact/dropdown';
import { useConfirmationDialog } from '../utils/ConfirmationDialogContext';
import { formatDateToApi, validateDates } from '../utils/UtilFunctions';
import { fetchCoachPlans } from '../services/usersService';
import { assignSubscription } from '../services/subscriptionService';
import { useIntl, FormattedMessage } from 'react-intl';

const AssignSubscriptionDialog = ({ studentId, onClose }) => {
  const intl = useIntl();
  const { user, coach } = useContext(UserContext);
  const showToast = useToast();
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [coachPlans, setCoachPlans] = useState([]);
  const [selectedCoachPlan, setSelectedCoachPlan] = useState();
  const { showConfirmationDialog } = useConfirmationDialog();

  useEffect(() => {
    const loadCoachPlans = async () => {
      try {
        const { data } = await fetchCoachPlans(user.userId);
        setCoachPlans(data);
      } catch (error) {
        showToast('error', intl.formatMessage({ id: 'error' }), error.message);
      }
    };

    if (user && user.userId) {
      loadCoachPlans();
    }
  }, [user, showToast, intl]);

  const assingSubscription = () => {
    const body = {
      coachId: coach.id,
      clientId: studentId,
      startDate: formatDateToApi(startDate),
      endDate: formatDateToApi(endDate),
      coachPlanId: selectedCoachPlan,
      userId: user.userId
    };
    const { isValid, message } = validateDates(startDate, endDate, intl);

    if (!isValid) {
      showToast('error', intl.formatMessage({ id: 'error' }), message);
      return;
    }

    if (!selectedCoachPlan) {
      return showToast(
        'error',
        intl.formatMessage({ id: 'error' }),
        intl.formatMessage({ id: 'assignSubscription.error.selectPlan' })
      );
    }

    showConfirmationDialog({
      message: intl.formatMessage({
        id: 'assignSubscription.confirmation.message'
      }),
      header: intl.formatMessage({ id: 'common.confirmation' }),
      icon: 'pi pi-exclamation-triangle',
      accept: () => handleAssignSubscription(body),
      reject: () => console.log('Rejected')
    });
  };

  const handleAssignSubscription = async (body) => {
    try {
      setLoading(true);
      await assignSubscription(body);
      showToast(
        'success',
        intl.formatMessage({ id: 'success' }),
        intl.formatMessage({ id: 'assignSubscription.success' })
      );
      onClose();
    } catch (error) {
      showToast('error', intl.formatMessage({ id: 'error' }), error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="assign-subscription-dialog">
      <div className="p-field">
        <label htmlFor="startDate">
          <FormattedMessage id="startDate" />
        </label>
        <Calendar
          id="startDate"
          locale={intl.locale}
          dateFormat="dd/mm/yy"
          value={startDate}
          onChange={(e) => setStartDate(e.value)}
          showIcon
        />
      </div>
      <div className="p-field">
        <label htmlFor="endDate">
          <FormattedMessage id="endDate" />
        </label>
        <Calendar
          id="endDate"
          locale={intl.locale}
          dateFormat="dd/mm/yy"
          value={endDate}
          onChange={(e) => setEndDate(e.value)}
          showIcon
        />
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
        />
      </div>
      <Button
        label={intl.formatMessage({ id: 'common.save' })}
        icon="pi pi-check"
        loading={loading}
        onClick={assingSubscription}
      />
    </div>
  );
};

export default AssignSubscriptionDialog;

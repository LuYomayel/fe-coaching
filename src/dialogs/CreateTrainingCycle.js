import React, { useState, useContext, useEffect } from 'react';
import { UserContext } from '../utils/UserContext';
import { useToast } from '../utils/ToastContext';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { Dialog } from 'primereact/dialog';
import { useConfirmationDialog } from '../utils/ConfirmationDialogContext';
import { InputNumber } from 'primereact/inputnumber';
import { createTrainingCycle } from '../services/workoutService';
import { fetchCoachStudents } from '../services/usersService';
import { useIntl, FormattedMessage } from 'react-intl';

const CreateTrainingCycleDialog = ({ visible, onHide }) => {
  const { user } = useContext(UserContext);
  const intl = useIntl();
  const showToast = useToast();
  const [cycleName, setCycleName] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [durationInMonths, setDurationInMonths] = useState(null);
  const [durationInWeeks, setDurationInWeeks] = useState(null);
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const { showConfirmationDialog } = useConfirmationDialog();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadCoachStudents = async () => {
      try {
        const students = await fetchCoachStudents(user.userId);
        const activeStudents = students
          .filter(client => client.user.subscription.status !== 'Inactive')
          .map(client => ({
            label: client.name,
            value: client.id
          }));
        setClients(activeStudents);
      } catch (error) {
        showToast('error', intl.formatMessage({ id: 'error.fetchingStudents' }), error.message);
      }
    };

    if (user && user.userId) {
      loadCoachStudents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showToast, user.userId, intl]);

  const handleCreateCycle = async (body) => {
    try {
      setLoading(true);
      const result = await createTrainingCycle(body);
      showToast('success', intl.formatMessage({ id: 'success.cycleCreated' }));
      console.log('Created cycle:', result);
      onHide();
    } catch (error) {
      showToast('error', intl.formatMessage({ id: 'error' }), error.message);
    } finally {
      setLoading(false);
    }
  };

  const onDurationMonthChange = (e) => {
    setDurationInMonths(e.value);
    setDurationInWeeks(null);
  };

  const onDurationWeekChange = (e) => {
    setDurationInWeeks(e.value);
    setDurationInMonths(null);
  };

  const clickCreateCycle = () => {
    if (!cycleName || !startDate || !selectedClientId) {
      showToast('error', intl.formatMessage({ id: 'error' }), intl.formatMessage({ id: 'error.allFieldsRequired' }));
      return;
    }

    if (!durationInMonths && !durationInWeeks) {
      showToast('error', intl.formatMessage({ id: 'error' }), intl.formatMessage({ id: 'error.enterDuration' }));
      return;
    }

    const body = {
      name: cycleName,
      coachId: user.userId,
      startDate,
      clientId: selectedClientId,
      durationInMonths,
      durationInWeeks
    };

    showConfirmationDialog({
      message: intl.formatMessage({ id: 'createCycle.confirmation.message' }),
      header: intl.formatMessage({ id: 'common.confirmation' }),
      icon: "pi pi-exclamation-triangle",
      accept: () => handleCreateCycle(body),
      reject: () => console.log('Rejected')
    });
  };

  return (
    <Dialog draggable={false} resizable={false} dismissableMask header={intl.formatMessage({ id: 'createCycle.dialog.header' })} className="responsive-dialog" visible={visible} style={{ width: '50vw' }} onHide={onHide}>
      <div className="p-field">
        <label htmlFor="cycleName"><FormattedMessage id="createCycle.cycleName" /></label>
        <InputText id="cycleName" value={cycleName} onChange={(e) => setCycleName(e.target.value)} />
      </div>
      <div className="p-field">
        <label htmlFor="startDate"><FormattedMessage id="startDate" /></label>
        <Calendar id="startDate" value={startDate} dateFormat="dd/mm/yy" onChange={(e) => setStartDate(e.value)} showIcon />
      </div>
      <div className="p-field">
        <label htmlFor="durationInMonths"><FormattedMessage id="createCycle.durationInMonths" /></label>
        <InputNumber id="durationInMonths" value={durationInMonths} onValueChange={onDurationMonthChange} mode="decimal" min={1} max={12} />
      </div>
      <div className="p-field">
        <label htmlFor="durationInWeeks"><FormattedMessage id="createCycle.durationInWeeks" /></label>
        <InputNumber id="durationInWeeks" value={durationInWeeks} onValueChange={onDurationWeekChange} mode="decimal" min={1} max={52} />
      </div>
      <div className="p-field">
        <label htmlFor="client"><FormattedMessage id="client" /></label>
        <Dropdown id="client" value={selectedClientId} options={clients} onChange={(e) => setSelectedClientId(e.value)} placeholder={intl.formatMessage({ id: 'selectClient' })} />
      </div>
      <Button label={intl.formatMessage({ id: 'createCycle.button.create' })} icon="pi pi-check" onClick={clickCreateCycle} loading={loading} />
    </Dialog>
  );
};

export default CreateTrainingCycleDialog;
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

const apiUrl = process.env.REACT_APP_API_URL;

const CreateTrainingCycleDialog = ({ visible, onHide }) => {
  const { user } = useContext(UserContext);
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
        showToast('error', 'Error fetching students', error.message);
      }
    };
  
    if (user && user.userId) {
      loadCoachStudents();
    }
  }, [showToast, user.userId]);

  const handleCreateCycle = async (body) => {
    try {
      setLoading(true)
      const result = await createTrainingCycle(body);
      showToast('success', 'Training cycle created successfully!');
      console.log('Created cycle:', result); // Example of handling the received data
      onHide();
    } catch (error) {
      showToast('error', 'Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const onDurationMonthChange = (e) => {
    setDurationInMonths(e.value);
    setDurationInWeeks(null); // Clear weeks when months is set
  };

  const onDurationWeekChange = (e) => {
    setDurationInWeeks(e.value);
    setDurationInMonths(null); // Clear months when weeks is set
  };

  const clickCreateCycle =() => {
    if (!cycleName || !startDate || !selectedClientId) {
      showToast('error', 'Error', 'All fields are required');
      return;
    }

    if (!durationInMonths && !durationInWeeks) {
      showToast('error', 'Error', 'Please enter a duration in weeks or months');
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
      message: "Are you sure you want to create this plan?",
      header: "Confirmation",
      icon: "pi pi-exclamation-triangle",
      accept: () => handleCreateCycle(body),
      reject: () => console.log('Rejected u mf')
  });
  }
  return (
    <Dialog draggable={false}  resizable={false} header="Create Training Cycle" className="responsive-dialog" visible={visible} style={{ width: '50vw' }} onHide={onHide}>
      <div className="p-field">
        <label htmlFor="cycleName">Cycle Name</label>
        <InputText id="cycleName" value={cycleName} onChange={(e) => setCycleName(e.target.value)} />
      </div>
      <div className="p-field">
        <label htmlFor="startDate">Start Date</label>
        <Calendar id="startDate" value={startDate} onChange={(e) => setStartDate(e.value)} showIcon />
      </div>
      <div className="p-field">
        <label htmlFor="durationInMonths">Duration in Months</label>
        <InputNumber id="durationInMonths" value={durationInMonths} onValueChange={onDurationMonthChange} mode="decimal" min={1} max={12} />
      </div>
      <div className="p-field">
        <label htmlFor="durationInWeeks">Duration in Weeks</label>
        <InputNumber id="durationInWeeks" value={durationInWeeks} onValueChange={onDurationWeekChange} mode="decimal" min={1} max={52} />
      </div>
      <div className="p-field">
          <label htmlFor="client">Client</label>
          <Dropdown id="client" value={selectedClientId} options={clients} onChange={(e) => setSelectedClientId(e.value)} placeholder="Select a client" />
        </div>
      <Button label="Create Cycle" icon="pi pi-check" onClick={clickCreateCycle} loading={loading}/>
    </Dialog>
  );
};

export default CreateTrainingCycleDialog;
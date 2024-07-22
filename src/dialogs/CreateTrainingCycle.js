import React, { useState, useContext, useEffect } from 'react';
import { UserContext } from '../utils/UserContext';
import { useToast } from '../utils/ToastContext';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { Dialog } from 'primereact/dialog';
import { Checkbox } from 'primereact/checkbox';
import { useConfirmationDialog } from '../utils/ConfirmationDialogContext';

const apiUrl = process.env.REACT_APP_API_URL;

const CreateTrainingCycleDialog = ({ visible, onHide }) => {
  const { user } = useContext(UserContext);
  const showToast = useToast();
  const [cycleName, setCycleName] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [isMonthly, setIsMonthly] = useState(false);
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const { showConfirmationDialog } = useConfirmationDialog();
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    fetch(`${apiUrl}/users/coach/allStudents/${user.userId}`)
      .then(async response => {
        
        if(!response.ok){
          const errorData = await response.json();
          throw new Error(errorData.message || 'Something went wrong.')
        }
        const data = await response.json();
        const dataFiltered = data.filter(client => client.user.subscription.status !== 'Inactive').map( client => ({ label: client.name, value: client.id }))

        // setClients(data.map(client => {
        //   return ({ label: client.name, value: client.id })
        // }));
        setClients(dataFiltered)
      })
      .catch(error => {
        showToast('error', 'Error', error.message)
      });
  }, [showToast, user.userId]);

  const handleCreateCycle = async (body) => {
    try {
      setLoading(true)
      const response = await fetch(`${apiUrl}/workout/training-cycles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Something went wrong');
      }

      showToast('success', 'Success', 'Training cycle created successfully');
      onHide();
    } catch (error) {
      showToast('error', 'Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const clickCreateCycle =() => {
    if (!cycleName || !startDate || !selectedClientId) {
      showToast('error', 'Error', 'All fields are required');
      return;
    }

    const body = {
      name: cycleName,
      coachId: user.userId,
      startDate,
      isMonthly,
      clientId: selectedClientId
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
    <Dialog header="Create Training Cycle" visible={visible} style={{ width: '50vw' }} onHide={onHide}>
      <div className="p-field">
        <label htmlFor="cycleName">Cycle Name</label>
        <InputText id="cycleName" value={cycleName} onChange={(e) => setCycleName(e.target.value)} />
      </div>
      <div className="p-field">
        <label htmlFor="startDate">Start Date</label>
        <Calendar id="startDate" value={startDate} onChange={(e) => setStartDate(e.value)} showIcon />
      </div>
      <div className="p-field-checkbox">
        <Checkbox inputId="isMonthly" checked={isMonthly} onChange={(e) => setIsMonthly(e.checked)} />
        <label htmlFor="isMonthly">Is Monthly</label>
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
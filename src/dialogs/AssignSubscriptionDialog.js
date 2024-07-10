import React, { useEffect, useState, useContext } from 'react';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { useToast } from '../utils/ToastContext';
import { UserContext } from '../utils/UserContext';
import { Dropdown } from 'primereact/dropdown';
import { useConfirmationDialog } from '../utils/ConfirmationDialogContext';
const apiUrl = process.env.REACT_APP_API_URL;

const AssignSubscriptionDialog = ({ studentId, coachId, onClose }) => {
  const {user} = useContext(UserContext);
  const showToast = useToast();
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [coachPlans, setCoachPlans] =useState([]);
  const [selectedCoachPlan, setSelectedCoachPlan] = useState([])
  const { showConfirmationDialog } = useConfirmationDialog();
    useEffect( () => {    
      fetch(`${apiUrl}/users/coach/coachPlan/${user.userId}`)
          .then(async (response) => {
            const data = await response.json();
            console.log(data)
              setCoachPlans(data)
          })
    }, [])

  const assingSubscription = () => {
    const body = {
      coachId,
      clientId: studentId,
      startDate,
      endDate,
      coachPlanId: selectedCoachPlan
    }
    if(!startDate)
      showToast('error', 'Error', 'Please select a Start date')
    if(!endDate)
      showToast('error', 'Error', 'Please select a End date')
    if(!selectedCoachPlan)
      showToast('error', 'Error', 'Please select a coach plan')

    showConfirmationDialog({
      message: "Are you sure you want to generate a subscription to this client?",
      header: "Confirmation",
      icon: "pi pi-exclamation-triangle",
      accept: () => handleAssignSubscription(body),
      reject: () => console.log('Rejected u mf')
    });
  }
  const handleAssignSubscription = async (body) => {
    // setLoading(true);
    try {
      // return
      const response = await fetch(`${apiUrl}/subscription/client`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.log(errorData)
        throw new Error(errorData.message || 'Something went wrong');
      }
      else{
        // const data = await response.json();
        showToast('success', 'Success', 'Subscription assigned successfully');
        onClose();
      } 
    } catch (error) {
      showToast('error', 'Error', error.message);
    }
    setLoading(false);
  };



  return (
    <div className="assign-subscription-dialog">
      <div className="p-field">
        <label htmlFor="startDate">Start Date</label>
        <Calendar id="startDate" dateFormat='dd/mm/yy' value={startDate} onChange={(e) => setStartDate(e.value)} showIcon />
      </div>
      <div className="p-field">
        <label htmlFor="endDate">End Date</label>
        <Calendar id="endDate" dateFormat='dd/mm/yy' value={endDate} onChange={(e) => setEndDate(e.value)} showIcon />
      </div>
      <div className="p-field">
        <label htmlFor="endDate">Plan</label>
        <Dropdown id="coachPlan" options={coachPlans} optionLabel='name' optionValue='id' value={selectedCoachPlan} onChange={(e) => setSelectedCoachPlan(e.value)} />
      </div>
      <Button label="Assign Subscription" icon="pi pi-check" loading={loading} onClick={assingSubscription} />
    </div>
  );
};

export default AssignSubscriptionDialog;
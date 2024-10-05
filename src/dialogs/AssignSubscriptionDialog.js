import React, { useEffect, useState, useContext } from 'react';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { useToast } from '../utils/ToastContext';
import { UserContext } from '../utils/UserContext';
import { Dropdown } from 'primereact/dropdown';
import { useConfirmationDialog } from '../utils/ConfirmationDialogContext';
import { validateDates } from '../utils/UtilFunctions';
import { fetchCoachPlans } from '../services/usersService';
import { assignSubscription } from '../services/subscriptionService';
const apiUrl = process.env.REACT_APP_API_URL;

const AssignSubscriptionDialog = ({ studentId, coachId, onClose }) => {
  const {user} = useContext(UserContext);
  const showToast = useToast();
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [coachPlans, setCoachPlans] =useState([]);
  const [selectedCoachPlan, setSelectedCoachPlan] = useState()
  const { showConfirmationDialog } = useConfirmationDialog();
    useEffect( () => {    
      const loadCoachPlans = async () => {
        try {
          const plans = await fetchCoachPlans(user.userId);
          setCoachPlans(plans);
        } catch (error) {
          showToast('error', 'Error', error.message);
        }
      };
    
      if (user && user.userId) {
        loadCoachPlans();
      }
    }, [])

  const assingSubscription = () => {
    const body = {
      coachId,
      clientId: studentId,
      startDate,
      endDate,
      coachPlanId: selectedCoachPlan,
      userId: user.userId
    }
    const { isValid, message } = validateDates(startDate, endDate)

    if (!isValid) {
      showToast('error', 'Error', message);
      return;
    }

    if(!selectedCoachPlan)
      return showToast('error', 'Error', 'Please select a coach plan')

    showConfirmationDialog({
      message: "Are you sure you want to generate a subscription to this client?",
      header: "Confirmation",
      icon: "pi pi-exclamation-triangle",
      accept: () => handleAssignSubscription(body),
      reject: () => console.log('Rejected u mf')
    });
  }
  const handleAssignSubscription = async (body) => {
    try {
      setLoading(true);
      await assignSubscription(body);
      showToast('success', 'Success', 'Subscription assigned successfully');
      onClose();  // Assuming onClose is a function to close a modal or similar
    } catch (error) {
      showToast('error', 'Error', error.message);
    } finally {
      setLoading(false);
    }
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
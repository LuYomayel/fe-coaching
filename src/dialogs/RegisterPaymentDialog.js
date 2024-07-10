import React, { useEffect, useState, useContext } from 'react';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { useToast } from '../utils/ToastContext';
import { UserContext } from '../utils/UserContext';
import { Dropdown } from 'primereact/dropdown';
import { useConfirmationDialog } from '../utils/ConfirmationDialogContext';
const apiUrl = process.env.REACT_APP_API_URL;

const RegisterPaymentDialog = ({ studentId, coachId, onClose, oldSubscription, oldCoachPlan }) => {
  const { user } = useContext(UserContext);
  const showToast = useToast();
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [paymentDate, setPaymentDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [coachPlans, setCoachPlans] = useState([]);
  const [selectedCoachPlan, setSelectedCoachPlan] = useState(null);
  const { showConfirmationDialog } = useConfirmationDialog();

  useEffect(() => {
    const newStartDate = new Date(oldSubscription.startDate);
    newStartDate.setMonth(newStartDate.getMonth() + 1);

    const newEndDate = new Date(oldSubscription.endDate);
    newEndDate.setMonth(newEndDate.getMonth() + 1);

    setStartDate(newStartDate);
    setEndDate(newEndDate);
    setPaymentDate(new Date());
    setSelectedCoachPlan(oldCoachPlan.id);

    fetch(`${apiUrl}/users/coach/coachPlan/${user.userId}`)
      .then(async (response) => {
        const data = await response.json();
        setCoachPlans(data);
      });
  }, [user.userId, oldSubscription, oldCoachPlan]);

  const registerPayment = () => {
    const body = {
      coachId,
      clientId: studentId,
      startDate,
      endDate,
      paymentDate,
      coachPlanId: selectedCoachPlan
    };

    if (!startDate) {
      showToast('error', 'Error', 'Please select a Start date');
      return;
    }
    if (!paymentDate) {
      showToast('error', 'Error', 'Please select a Payment date');
      return;
    }

    if (!endDate) {
      showToast('error', 'Error', 'Please select an End date');
      return;
    }

    if (!selectedCoachPlan) {
      showToast('error', 'Error', 'Please select a coach plan');
      return;
    }

    showConfirmationDialog({
      message: "Are you sure you want to register this payment and update the client's subscription?",
      header: "Confirmation",
      icon: "pi pi-exclamation-triangle",
      accept: () => handleRegisterPayment(body),
      reject: () => console.log('Payment registration cancelled')
    });
  };

  const handleRegisterPayment = async (body) => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/subscription/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Something went wrong');
      } else {
        showToast('success', 'Success', 'Payment registered and subscription updated successfully');
        onClose();
      }
    } catch (error) {
      showToast('error', 'Error', error.message);
    }
    setLoading(false);
  };

  return (
    <div className="register-payment-dialog">
      <div className="p-field">
        <label htmlFor="startDate">New Start Date</label>
        <Calendar id="startDate" dateFormat="dd/mm/yy" value={startDate} onChange={(e) => setStartDate(e.value)} showIcon />
      </div>
      <div className="p-field">
        <label htmlFor="endDate">New End Date</label>
        <Calendar id="endDate" dateFormat="dd/mm/yy" value={endDate} onChange={(e) => setEndDate(e.value)} showIcon />
      </div>
      <div className="p-field">
        <label htmlFor="paymentDate">Payment Date</label>
        <Calendar id="paymentDate" dateFormat="dd/mm/yy" value={paymentDate} onChange={(e) => setPaymentDate(e.value)} showIcon />
      </div>
      <div className="p-field">
        <label htmlFor="coachPlan">Select Plan</label>
        <Dropdown id="coachPlan" options={coachPlans} optionLabel="name" optionValue="id" value={selectedCoachPlan} onChange={(e) => setSelectedCoachPlan(e.value)} />
      </div>
      <Button label="Register Payment" icon="pi pi-dollar" loading={loading} onClick={registerPayment} />
    </div>
  );
};

export default RegisterPaymentDialog;
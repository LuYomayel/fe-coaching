import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { MultiSelect } from 'primereact/multiselect';
import { InputTextarea } from 'primereact/inputtextarea';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { RadioButton } from 'primereact/radiobutton';
import { UserContext } from '../utils/UserContext';
import { useToast } from '../utils/ToastContext';
import '../styles/CoachProfileForm.css'
import { updateCoach } from '../services/usersService';
import SubscriptionPaymentPage from './SubscriptionPayment';
import { Dialog } from 'primereact/dialog';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
const apiUrl = process.env.REACT_APP_API_URL;

const trainingTypes = [
  { label: 'Strength Training', value: 'strength' },
  { label: 'Cardio', value: 'cardio' },
  { label: 'Calisthenics', value: 'calisthenics' },
  { label: 'Cross Fit', value: 'cross fit' },
  { label: 'General Fitness', value: 'general fitness' },
  // Add other training types as needed
];

const CoachProfileForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [name, setName] = useState('');
  const [estimatedClients, setEstimatedClients] = useState(3);
  const [trainingType, setTrainingType] = useState([]);
  const [hasGym, setHasGym] = useState(false);
  const [gymLocation, setGymLocation] = useState('');
  const [bio, setBio] = useState('');
  const [experience, setExperience] = useState('');
  const [subscriptionType, setSubscriptionType] = useState('freeTrial');
  const [loading, setLoading] = useState(false);
  const showToast = useToast();
  const { user, setCoach, coach } = useContext(UserContext);
  const [isPlanDialogVisible, setIsPlanDialogVisible] = useState(false);
  const [isFormCompleted, setIsFormCompleted] = useState(false);
  const [userPayment, setUserPayment] = useState(null);
  const navigate = useNavigate();

  useEffect( () => {

    if(user && coach)
      navigate('/coach')
  }, [user, coach, navigate])
  const handleSubmit = async () => {
    // setLoading(false);
    const body = {
      name, 
      estimatedClients: subscriptionType === 'freeTrial' ? 3 : userPayment.max_clients, 
      trainingType, 
      hasGym, 
      gymLocation: hasGym ? gymLocation : null, 
      bio, 
      experience, 
      email: user.email,
      subscriptionType,
    }
    // return
    if(subscriptionType === 'paid' && !userPayment){
      setIsPlanDialogVisible(true);
      return;
    }
    if (!stripe || !elements) {
      return;
    }

    try {
      const token = localStorage.getItem('token'); // Assume the token is stored in local storage
      const data = await updateCoach(user.userId, body, token);
      setCoach(data);

      navigate('/coach');
      showToast('success', 'Profile updated!', `Thanks for subscribing ${data.name}`);
    } catch (error) {
      showToast('error', 'Error', error.message);
    }
    setLoading(false);
  };

  return (
    <div className="coach-profile-form-container">
      <Card title="Complete Your Coach Profile" className='coach-profile-form'>
        <div className="p-field">
          <label htmlFor="name">Name</label>
          <InputText id="name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        {/* <div className="p-field">
          <label htmlFor="estimatedClients">Estimated Clients</label>
          <InputText id="estimatedClients" value={estimatedClients} onChange={(e) => setEstimatedClients(e.target.value)} disabled={subscriptionType === 'freeTrial'} />
        </div> */}
        <div className="p-field">
          <label htmlFor="trainingType">Training Type</label>
          <MultiSelect id="trainingType" value={trainingType} options={trainingTypes} optionLabel="label" onChange={(e) => setTrainingType(e.value)} multiple placeholder="Select Training Types" />
        </div>
        <div className="flex align-items-center gap-2">
          <Checkbox inputId="hasGym" checked={hasGym} onChange={(e) => setHasGym(e.checked)} />
          <label htmlFor="hasGym" className="p-checkbox-label">Has Gym</label>
        </div>
        {hasGym && (
          <div className="p-field">
            <label htmlFor="gymLocation">Gym Location</label>
            <InputText id="gymLocation" value={gymLocation} onChange={(e) => setGymLocation(e.target.value)} />
          </div>
        )}
        <div className="p-field">
          <label htmlFor="bio">Bio</label>
          <InputTextarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} />
        </div>
        <div className="p-field">
          <label htmlFor="experience">Experience</label>
          <InputTextarea id="experience" value={experience} onChange={(e) => setExperience(e.target.value)} />
        </div>
        <div className="p-field">
          <label>Subscription Type</label>
          <div className="">
            <div className="flex align-items-center gap-2">
              <RadioButton
                inputId="freeTrial"
                name="subscriptionType"
                value="freeTrial"
                onChange={(e) => setSubscriptionType(e.value)}
                checked={subscriptionType === 'freeTrial'}
              />
              <label htmlFor="freeTrial">Free Trial (3 Clients)</label>
            </div>
            <div className="flex align-items-center gap-2">
              <RadioButton
                inputId="paid"
                name="subscriptionType"
                value="paid"
                onChange={(e) => setSubscriptionType(e.value)}
                checked={subscriptionType === 'paid'}
              />
              <label htmlFor="paid">Monthly Subscription</label>
            </div>
          </div>
        </div>

        {subscriptionType === 'paid' && !userPayment && (
          <div className="p-field">
            <Button 
                label="Choose Plan" 
                className="p-button-outlined w-full" 
                onClick={() => setIsPlanDialogVisible(true)} 
              />
          </div>
        )}
          {userPayment && (
            <div className="p-field">
              <h4>Subscription Plan</h4>
              <p><strong>Plan:</strong> {userPayment.name}</p>
              <p><strong>Price:</strong> ${userPayment.price}</p>
              <p><strong>Clients:</strong> {userPayment.max_clients}</p>
            </div>
          )}
        <Button label="Submit" icon="pi pi-check" loading={loading} onClick={handleSubmit} />
      </Card>
        <Dialog 
          header="Select a Subscription Plan" 
          visible={isPlanDialogVisible} 
          style={{ width: '50vw' }} 
          onHide={() => setIsPlanDialogVisible(false)}
        >
          <SubscriptionPaymentPage setUserPayment={setUserPayment} setIsPlanDialogVisible={setIsPlanDialogVisible}/>
        </Dialog>
    </div>
  );
};

export default CoachProfileForm;
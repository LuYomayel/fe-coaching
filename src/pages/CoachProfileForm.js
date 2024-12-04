import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { MultiSelect } from 'primereact/multiselect';
import { InputTextarea } from 'primereact/inputtextarea';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { RadioButton } from 'primereact/radiobutton';
import { Steps } from 'primereact/steps';
import { Dialog } from 'primereact/dialog';
import { useStripe, useElements } from '@stripe/react-stripe-js';
import { useIntl, FormattedMessage } from 'react-intl';
import { UserContext } from '../utils/UserContext';
import { useToast } from '../utils/ToastContext';
import { updateCoach } from '../services/usersService';
import SubscriptionPaymentPage from './SubscriptionPayment';
import '../styles/CoachProfileForm.css';

const trainingTypes = [
  { label: 'Strength Training', value: 'strength' },
  { label: 'Cardio', value: 'cardio' },
  { label: 'Calisthenics', value: 'calisthenics' },
  { label: 'Cross Fit', value: 'cross fit' },
  { label: 'General Fitness', value: 'general fitness' },
  // Add other training types as needed
];

const CoachProfileForm = () => {
  const intl = useIntl();
  const stripe = useStripe();
  const elements = useElements();
  const [activeStep, setActiveStep] = useState(0);
  const [name, setName] = useState('');
  const [trainingType, setTrainingType] = useState([]);
  const [hasGym, setHasGym] = useState(false);
  const [gymLocation, setGymLocation] = useState('');
  const [bio, setBio] = useState('');
  const [experience, setExperience] = useState('');
  const [subscriptionType, setSubscriptionType] = useState('freeTrial');
  const [userPayment, setUserPayment] = useState(null);
  const [loading, setLoading] = useState(false);
  const showToast = useToast();
  const { user, setCoach, coach } = useContext(UserContext);
  const navigate = useNavigate();
  const [isPlanDialogVisible, setIsPlanDialogVisible] = useState(false);


  useEffect(() => {
    if (user && coach) navigate('/coach');
  }, [user, coach, navigate]);

  const steps = [
    { label: intl.formatMessage({ id: 'coachProfileForm.step.personalInfo' }) },
    { label: intl.formatMessage({ id: 'coachProfileForm.step.trainingDetails' }) },
    { label: intl.formatMessage({ id: 'coachProfileForm.step.subscription' }) },
    { label: intl.formatMessage({ id: 'coachProfileForm.step.confirmation' }) }
  ];

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const handleSubmit = async () => {
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
    };

    if (subscriptionType === 'paid' && !userPayment) {
      showToast('error', intl.formatMessage({ id: 'coachProfileForm.error' }), 'Please select a subscription plan.');
      return;
    }

    if (!stripe || !elements) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const data = await updateCoach(user.userId, body, token);
      setCoach(data);

      navigate('/coach');
      showToast('success', intl.formatMessage({ id: 'coachProfileForm.success' }), `Thanks for subscribing ${data.name}`);
    } catch (error) {
      showToast('error', intl.formatMessage({ id: 'coachProfileForm.error' }), error.message);
    }
    setLoading(false);
  };

  return (
    <div className="coach-profile-form-container">
      <Steps model={steps} activeIndex={activeStep} onSelect={(e) => setActiveStep(e.index)} readOnly={false} />
      <Card className='coach-profile-form'>
        {activeStep === 0 && (
          <div>
            <h2><FormattedMessage id="coachProfileForm.step.personalInfo" /></h2>
            <div className="p-field">
              <label htmlFor="name">
                <FormattedMessage id="coachProfileForm.name" />
              </label>
              <InputText id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="p-field">
              <label htmlFor="bio">
                <FormattedMessage id="coachProfileForm.bio" />
              </label>
              <InputTextarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} />
            </div>
            <div className="p-field">
              <label htmlFor="experience">
                <FormattedMessage id="coachProfileForm.experience" />
              </label>
              <InputTextarea id="experience" value={experience} onChange={(e) => setExperience(e.target.value)} />
            </div>
          </div>
        )}
        {activeStep === 1 && (
          <div>
            <h2><FormattedMessage id="coachProfileForm.step.trainingDetails" /></h2>
            <div className="p-field">
              <label htmlFor="trainingType">
                <FormattedMessage id="coachProfileForm.trainingType" />
              </label>
              <MultiSelect id="trainingType" value={trainingType} options={trainingTypes} optionLabel="label" onChange={(e) => setTrainingType(e.value)} multiple placeholder={intl.formatMessage({ id: 'coachProfileForm.selectTrainingTypes' })} />
            </div>
            <div className="flex align-items-center gap-2">
              <Checkbox inputId="hasGym" checked={hasGym} onChange={(e) => setHasGym(e.checked)} />
              <label htmlFor="hasGym" className="p-checkbox-label">
                <FormattedMessage id="coachProfileForm.hasGym" />
              </label>
            </div>
            {hasGym && (
              <div className="p-field">
                <label htmlFor="gymLocation">
                  <FormattedMessage id="coachProfileForm.gymLocation" />
                </label>
                <InputText id="gymLocation" value={gymLocation} onChange={(e) => setGymLocation(e.target.value)} />
              </div>
            )}
          </div>
        )}
        {activeStep === 2 && (
          <div>
            <h2><FormattedMessage id="coachProfileForm.step.subscription" /></h2>
            <div className="p-field">
              <label>
                <FormattedMessage id="coachProfileForm.subscriptionType" />
              </label>
              <div className="">
                <div className="flex align-items-center gap-2">
                  <RadioButton
                    inputId="freeTrial"
                    name="subscriptionType"
                    value="freeTrial"
                    onChange={(e) => setSubscriptionType(e.value)}
                    checked={subscriptionType === 'freeTrial'}
                  />
                  <label htmlFor="freeTrial">
                    <FormattedMessage id="coachProfileForm.freeTrial" />
                  </label>
                </div>
                <div className="flex align-items-center gap-2">
                  <RadioButton
                    inputId="paid"
                    name="subscriptionType"
                    value="paid"
                    onChange={(e) => setSubscriptionType(e.value)}
                    checked={subscriptionType === 'paid'}
                  />
                  <label htmlFor="paid">
                    <FormattedMessage id="coachProfileForm.paid" />
                  </label>
                </div>
              </div>
            </div>
            {subscriptionType === 'paid' && !userPayment && (
              <div className="p-field">
                <Button
                  label={intl.formatMessage({ id: 'coachProfileForm.choosePlan' })}
                  className="p-button-outlined w-full"
                  onClick={() => setIsPlanDialogVisible(true)}
                />
              </div>
            )}
            {userPayment && (
              <div className="p-field">
                <h4>
                  <FormattedMessage id="coachProfileForm.subscriptionPlan" />
                </h4>
                <p>
                  <strong><FormattedMessage id="coachProfileForm.plan" />:</strong> {userPayment.name}
                </p>
                <p>
                  <strong><FormattedMessage id="coachProfileForm.price" />:</strong> ${userPayment.price}
                </p>
                <p>
                  <strong><FormattedMessage id="coachProfileForm.clients" />:</strong> {userPayment.max_clients}
                </p>
              </div>
            )}
          </div>
        )}
        {activeStep === 3 && (
          <div>
            <h2><FormattedMessage id="coachProfileForm.step.confirmation" /></h2>
            <p><FormattedMessage id="coachProfileForm.confirmationMessage" /></p>
            {/* Aquí puedes mostrar un resumen de la información ingresada */}
          </div>
        )}
        <div className="flex justify-content-between mt-4">
          <Button label={intl.formatMessage({ id: 'common.back' })} icon="pi pi-arrow-left" onClick={handleBack} disabled={activeStep === 0} />
          <Button label={intl.formatMessage({ id: activeStep === steps.length - 1 ? 'coachProfileForm.submit' : 'common.next' })} icon={activeStep === steps.length - 1 ? "pi pi-check" : "pi pi-arrow-right"} onClick={handleNext} loading={loading} />
        </div>
      </Card>
      <Dialog
        draggable={false}
        resizable={false}
        dismissableMask
        header={intl.formatMessage({ id: 'coachProfileForm.dialog.header' })}
        visible={isPlanDialogVisible}
        style={{ width: '50vw' }}
        onHide={() => setIsPlanDialogVisible(false)}
      >
        <SubscriptionPaymentPage setUserPayment={setUserPayment} setIsPlanDialogVisible={setIsPlanDialogVisible} />
      </Dialog>
    </div>
  );
};

export default CoachProfileForm;
import React, { useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { fetchCoachSubscriptionPlans } from '../services/subscriptionService';
import '../styles/CoachProfileForm.css';
import { UserContextType } from '../types/shared-types';

const trainingTypes = [
  { label: 'Strength Training', value: 'strength' },
  { label: 'Cardio', value: 'cardio' },
  { label: 'Calisthenics', value: 'calisthenics' },
  { label: 'Cross Fit', value: 'cross fit' },
  { label: 'General Fitness', value: 'general fitness' }
  // Add other training types as needed
];

const CoachProfileForm = () => {
  const intl = useIntl();
  //const s = useStripe();
  //const elements = useElements();
  const [activeStep, setActiveStep] = useState(0);
  const [name, setName] = useState('');
  const [trainingType, setTrainingType] = useState([]);
  const [hasGym, setHasGym] = useState(false);
  const [gymLocation, setGymLocation] = useState('');
  const [bio, setBio] = useState('');
  const [experience, setExperience] = useState('');
  const [subscriptionType, setSubscriptionType] = useState('');
  const [userPayment, setUserPayment] = useState(null);
  const [loading, setLoading] = useState(false);
  const showToast = useToast();
  const { user, setCoach, coach } = useContext(UserContext) as UserContextType;
  const router = useRouter();
  const [isPlanDialogVisible, setIsPlanDialogVisible] = useState(false);
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data } = await fetchCoachSubscriptionPlans();
        setPlans(data);
      } catch (err) {
        showToast('error', 'Error', err.message);
      }
    };

    fetchPlans();

    if (user && coach) router.push('/coach');
    // eslint-disable-next-line
  }, [user, coach, router]);

  const steps = [
    { label: intl.formatMessage({ id: 'coachProfileForm.step.personalInfo' }) },
    {
      label: intl.formatMessage({
        id: 'coachProfileForm.step.trainingDetails'
      })
    },
    { label: intl.formatMessage({ id: 'coachProfileForm.step.subscription' }) },
    { label: intl.formatMessage({ id: 'coachProfileForm.step.confirmation' }) }
  ];

  const validateStep = () => {
    if (activeStep === 0 && !name) {
      showToast('error', intl.formatMessage({ id: 'coachProfileForm.error' }), 'Name is required.');
      return false;
    }
    if (activeStep === 1 && trainingType.length === 0) {
      showToast(
        'error',
        intl.formatMessage({ id: 'coachProfileForm.error' }),
        'At least one training type must be selected.'
      );
      return false;
    }
    if (activeStep === 2 && !subscriptionType) {
      showToast('error', intl.formatMessage({ id: 'coachProfileForm.error' }), 'Subscription type is required.');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      if (activeStep < steps.length - 1) {
        setActiveStep(activeStep + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const handleSubmit = async () => {
    const selectedPlanId =
      subscriptionType === 'freeTrial' ? plans.find((plan) => plan.name === 'Free')?.id : userPayment?.id;

    console.log(subscriptionType, plans);
    if (!selectedPlanId) {
      showToast('error', intl.formatMessage({ id: 'coachProfileForm.error.selectPlan' }));
      return;
    }

    const body = {
      name,
      estimatedClients: plans.find((plan) => plan.id === selectedPlanId)?.max_clients,
      trainingType,
      hasGym,
      gymLocation: hasGym ? gymLocation : null,
      bio,
      experience,
      email: user.email,
      subscriptionPlanId: selectedPlanId
    };
    console.log(body);
    if (subscriptionType === 'paid' && !userPayment) {
      showToast('error', intl.formatMessage({ id: 'coachProfileForm.error.selectPlan' }));
      return;
    }

    //if (!stripe || !elements) {
    //  return;
    //}

    try {
      const { data } = await updateCoach(user.userId, body);
      console.log(data);
      setCoach(data);

      router.push('/coach');
      showToast(
        'success',
        intl.formatMessage({ id: 'coachProfileForm.success' }),
        `Thanks for subscribing ${data.name}`
      );
    } catch (error) {
      showToast('error', intl.formatMessage({ id: 'coachProfileForm.error' }), error.message);
    }
    setLoading(false);
  };

  return (
    <div className="coach-profile-form-container">
      <Steps model={steps} activeIndex={activeStep} onSelect={(e) => setActiveStep(e.index)} readOnly={false} />
      <Card className="coach-profile-form">
        {activeStep === 0 && (
          <div>
            <h2>
              <FormattedMessage id="coachProfileForm.step.personalInfo" />
            </h2>
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
            <h2>
              <FormattedMessage id="coachProfileForm.step.trainingDetails" />
            </h2>
            <div className="p-field">
              <label htmlFor="trainingType">
                <FormattedMessage id="coachProfileForm.trainingType" />
              </label>
              <MultiSelect
                id="trainingType"
                value={trainingType}
                options={trainingTypes}
                optionLabel="label"
                onChange={(e) => setTrainingType(e.value)}
                multiple
                placeholder={intl.formatMessage({
                  id: 'coachProfileForm.selectTrainingTypes'
                })}
              />
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
            <h2>
              <FormattedMessage id="coachProfileForm.step.subscription" />
            </h2>
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
                  label={intl.formatMessage({
                    id: 'coachProfileForm.choosePlan'
                  })}
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
                  <strong>
                    <FormattedMessage id="coachProfileForm.plan" />:
                  </strong>{' '}
                  {userPayment.name}
                </p>
                <p>
                  <strong>
                    <FormattedMessage id="coachProfileForm.price" />:
                  </strong>{' '}
                  ${userPayment.price}
                </p>
                <p>
                  <strong>
                    <FormattedMessage id="coachProfileForm.clients" />:
                  </strong>{' '}
                  {userPayment.max_clients}
                </p>
              </div>
            )}
          </div>
        )}
        {activeStep === 3 && (
          <div>
            <h2>
              <FormattedMessage id="coachProfileForm.step.confirmation" />
            </h2>
            <p>
              <FormattedMessage id="coachProfileForm.confirmationMessage" />
            </p>
            <div className="confirmation-summary">
              <h3>
                <FormattedMessage id="coachProfileForm.summary" />
              </h3>
              <p>
                <strong>
                  <FormattedMessage id="coachProfileForm.name" />:
                </strong>{' '}
                {name}
              </p>
              <p>
                <strong>
                  <FormattedMessage id="coachProfileForm.trainingType" />:
                </strong>{' '}
                {trainingType.join(', ')}
              </p>
              <p>
                <strong>
                  <FormattedMessage id="coachProfileForm.hasGym" />:
                </strong>{' '}
                {hasGym ? intl.formatMessage({ id: 'common.yes' }) : intl.formatMessage({ id: 'common.no' })}
              </p>
              {hasGym && (
                <p>
                  <strong>
                    <FormattedMessage id="coachProfileForm.gymLocation" />:
                  </strong>{' '}
                  {gymLocation}
                </p>
              )}
              <p>
                <strong>
                  <FormattedMessage id="coachProfileForm.bio" />:
                </strong>{' '}
                {bio}
              </p>
              <p>
                <strong>
                  <FormattedMessage id="coachProfileForm.experience" />:
                </strong>{' '}
                {experience}
              </p>
              <p>
                <strong>
                  <FormattedMessage id="coachProfileForm.subscriptionType" />:
                </strong>{' '}
                {subscriptionType === 'freeTrial'
                  ? intl.formatMessage({ id: 'coachProfileForm.freeTrial' })
                  : intl.formatMessage({ id: 'coachProfileForm.paid' })}
              </p>
              {userPayment && (
                <>
                  <p>
                    <strong>
                      <FormattedMessage id="coachProfileForm.plan" />:
                    </strong>{' '}
                    {userPayment.name}
                  </p>
                  <p>
                    <strong>
                      <FormattedMessage id="coachProfileForm.price" />:
                    </strong>{' '}
                    ${userPayment.price}
                  </p>
                  <p>
                    <strong>
                      <FormattedMessage id="coachProfileForm.clients" />:
                    </strong>{' '}
                    {userPayment.max_clients}
                  </p>
                </>
              )}
            </div>
          </div>
        )}
        <div className="flex justify-content-between mt-4">
          <Button
            label={intl.formatMessage({ id: 'common.back' })}
            icon="pi pi-arrow-left"
            onClick={handleBack}
            disabled={activeStep === 0}
          />
          <Button
            label={intl.formatMessage({
              id: activeStep === steps.length - 1 ? 'coachProfileForm.submit' : 'common.next'
            })}
            icon={activeStep === steps.length - 1 ? 'pi pi-check' : 'pi pi-arrow-right'}
            onClick={handleNext}
            loading={loading}
          />
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

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';

import { buildCoachProfileFormSchema } from '../../schemas/coachProfileFormSchema';
import { useUser } from '../../contexts/UserContext';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../services/api-client';
import { mapZodErrors } from '../../utils/mapZodErrors';
import { ISubscriptionPlan } from '../../types/models';
import { ZodError, ZodSchema } from 'zod';

export const trainingTypeOptions = [
  { label: 'Entrenamiento de Fuerza', value: 'strength' },
  { label: 'Cardio', value: 'cardio' },
  { label: 'Calistenia', value: 'calisthenics' },
  { label: 'Cross Fit', value: 'cross fit' },
  { label: 'Fitness General', value: 'general fitness' },
  { label: 'Condicionamiento', value: 'conditioning' }
];

const initialValues = {
  name: '',
  bio: '',
  experience: '',
  trainingSpecialties: [],
  hasGym: false,
  gymLocation: '',
  subscriptionType: '',
  planId: null
};

export const useCoachProfileForm = () => {
  const intl = useIntl();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user, coach, setCoach } = useUser();

  const schema = useMemo(() => buildCoachProfileFormSchema(intl), [intl]);
  const stepFieldMap = [
    ['name', 'bio', 'experience'],
    ['trainingSpecialties', 'gymLocation'],
    ['subscriptionType', 'planId'],
    Object.keys(initialValues)
  ];

  const [formValues, setFormValues] = useState(initialValues);
  const [formErrors, setFormErrors] = useState({});
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<ISubscriptionPlan[]>([]);
  const [isPlanDialogVisible, setIsPlanDialogVisible] = useState(false);
  const [selectedPaidPlan, setSelectedPaidPlan] = useState<ISubscriptionPlan | null>(null);
  const [plansLoading, setPlansLoading] = useState(false);

  const steps = useMemo(
    () => [
      { label: intl.formatMessage({ id: 'coachProfileForm.step.personalInfo' }) },
      { label: intl.formatMessage({ id: 'coachProfileForm.step.trainingDetails' }) },
      { label: intl.formatMessage({ id: 'coachProfileForm.step.subscription' }) },
      { label: intl.formatMessage({ id: 'coachProfileForm.step.confirmation' }) }
    ],
    [intl]
  );

  const freeTrialPlan = useMemo(() => plans.find((plan) => Number(plan.price) === 0) ?? null, [plans]);

  useEffect(() => {
    if (user && coach) {
      navigate('/coach');
    }
  }, [coach, navigate, user]);

  useEffect(() => {
    const loadPlans = async () => {
      setPlansLoading(true);
      try {
        const { data } = await api.subscription.fetchCoachSubscriptionPlans();
        setPlans(data || []);
      } catch (error) {
        showToast('error', intl.formatMessage({ id: 'coachProfileForm.error' }), (error as Error).message);
      } finally {
        setPlansLoading(false);
      }
    };

    loadPlans();
  }, [intl, showToast]);

  useEffect(() => {
    if (formValues.subscriptionType === 'freeTrial' && freeTrialPlan) {
      setFormValues((prev: any) => {
        if (prev.planId === freeTrialPlan.id) {
          return prev;
        }
        return { ...prev, planId: freeTrialPlan.id };
      });
    }
  }, [freeTrialPlan, formValues.subscriptionType]);

  const applyErrors = useCallback((fields: string[], error: ZodError) => {
    setFormErrors((prev: Record<string, string>) => ({
      ...prev,
      ...mapZodErrors(error, fields)
    }));
  }, []);

  const clearErrors = useCallback((fields: string[]) => {
    setFormErrors((prev: Record<string, string>) => {
      const next = { ...prev };
      fields.forEach((field: string) => {
        next[field] = '';
      });
      return next;
    });
  }, []);

  const validateByStep = useCallback(
    (stepIndex: number) => {
      const schemaByStep: ZodSchema<any>[] = [
        schema.personalInfoSchema,
        schema.trainingDetailsSchema,
        schema.subscriptionSchema,
        schema.fullSchema
      ];
      const schemaForStep = schemaByStep[stepIndex];
      if (!schemaForStep) {
        return true;
      }
      const result = schemaForStep.safeParse(formValues);
      const fields = stepFieldMap[stepIndex] ?? [];
      if (result.success) {
        clearErrors(fields);
        return true;
      }
      applyErrors(fields, result.error);
      return false;
    },
    [applyErrors, clearErrors, formValues, schema, stepFieldMap]
  );

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleTrainingTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setFormValues((prev: any) => ({ ...prev, trainingSpecialties: event.target.value || [] }));
  };

  const handleGymToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues((prev: any) => ({
      ...prev,
      hasGym: event.target.checked,
      gymLocation: event.target.checked ? prev.gymLocation : ''
    }));
    if (!event.target.checked) {
      clearErrors(['gymLocation']);
    }
  };

  const handleSubscriptionChange = (value: string) => {
    setFormValues((prev: any) => ({
      ...prev,
      subscriptionType: value,
      planId: value === 'paid' ? (selectedPaidPlan?.id ?? undefined) : (freeTrialPlan?.id ?? undefined)
    }));
    clearErrors(['subscriptionType', 'planId']);
    if (value === 'paid' && !selectedPaidPlan) {
      setIsPlanDialogVisible(true);
    }
  };

  const handlePlanConfirmed = (plan: ISubscriptionPlan) => {
    setSelectedPaidPlan(plan);
    setFormValues((prev: any) => ({
      ...prev,
      subscriptionType: 'paid',
      planId: plan?.id ?? undefined
    }));
    clearErrors(['planId', 'subscriptionType']);
    setIsPlanDialogVisible(false);
  };

  const handleNext = async () => {
    if (!validateByStep(activeStep)) {
      return;
    }
    if (activeStep === steps.length - 1) {
      await handleSubmit();
      return;
    }
    setActiveStep((prev: number) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev: number) => Math.max(prev - 1, 0));
  };

  const selectedPlan = formValues.subscriptionType === 'paid' ? selectedPaidPlan : freeTrialPlan;

  const handleSubmit = async () => {
    const isValid = validateByStep(steps.length - 1);
    if (!isValid) {
      return;
    }

    const planDetails = selectedPlan || plans.find((plan: ISubscriptionPlan) => plan.id === formValues.planId);

    if (!user) {
      showToast(
        'error',
        intl.formatMessage({ id: 'coachProfileForm.error' }),
        intl.formatMessage({ id: 'coachProfileForm.error.noUser' })
      );
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error(intl.formatMessage({ id: 'coachProfileForm.error.missingToken' }));
      }
      const body = {
        name: formValues.name,
        trainingSpecialties: formValues.trainingSpecialties,
        hasGym: formValues.hasGym,
        gymLocation: formValues.hasGym ? formValues.gymLocation : null,
        bio: formValues.bio,
        experience: formValues.experience,
        subscriptionPlanId: formValues.planId,
        estimatedClients: planDetails?.max_clients,
        email: user?.email
      };

      const { data } = await api.user.updateCoach(user.userId, body);
      setCoach(data);
      showToast(
        'success',
        intl.formatMessage({ id: 'coachProfileForm.success' }),
        intl.formatMessage({ id: 'coachProfileForm.success.message' }, { name: data.name })
      );
      navigate('/coach');
    } catch (error) {
      showToast('error', intl.formatMessage({ id: 'coachProfileForm.error' }), (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const summaryItems = [
    {
      label: intl.formatMessage({ id: 'coachProfileForm.name' }),
      value: formValues.name || intl.formatMessage({ id: 'coachProfileForm.placeholder.pending' })
    },
    {
      label: intl.formatMessage({ id: 'coachProfileForm.trainingType' }),
      value:
        formValues.trainingSpecialties.length > 0
          ? formValues.trainingSpecialties.map(
              (specialty) => trainingTypeOptions.find((option) => option.value === specialty)?.label || specialty
            )
          : intl.formatMessage({ id: 'coachProfileForm.placeholder.pending' })
    },
    {
      label: intl.formatMessage({ id: 'coachProfileForm.subscriptionType' }),
      value: formValues.subscriptionType
        ? intl.formatMessage({
            id: formValues.subscriptionType === 'freeTrial' ? 'coachProfileForm.freeTrial' : 'coachProfileForm.paid'
          })
        : intl.formatMessage({ id: 'coachProfileForm.placeholder.pending' })
    }
  ];

  return {
    steps,
    activeStep,
    formValues,
    formErrors,
    loading,
    plansLoading,
    summaryItems,
    selectedPlan,
    isPlanDialogVisible,
    setIsPlanDialogVisible,
    handleInputChange,
    handleTrainingTypeChange,
    handleGymToggle,
    handleSubscriptionChange,
    handleNext,
    handleBack,
    handlePlanConfirmed,
    closePlanDialog: () => setIsPlanDialogVisible(false),
    openPlanDialog: () => setIsPlanDialogVisible(true)
  };
};

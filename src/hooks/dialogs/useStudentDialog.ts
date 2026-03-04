/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useIntl } from 'react-intl';
import { useUser } from '../../contexts/UserContext';
import { useToast } from '../../contexts/ToastContext';
import { useConfirmationDialog } from '../../utils/ConfirmationDialogContext';
import { api } from '../../services/api-client';
import { studentDialogSchema, processFitnessGoals, validateClientAge } from '../../schemas/studentDialogSchema';
import { contactMethodOptions } from '../../types/coach/dropdown-options';

interface IStudentFormData {
  name: string;
  email: string;
  fitnessGoal: string;
  activityLevel: string;
  gender: string;
  weight: number | null;
  height: number | null;
  birthdate: Date | null;
  customFitnessGoal: string;
  sessionMode: string | null;
  location: string;
  contactMethod: string;
}

export const useStudentDialog = (
  studentData: any,
  onClose: () => void,
  setRefreshKey: (fn: (old: number) => number) => void
) => {
  const intl = useIntl();
  const { showToast } = useToast();
  const { user } = useUser();
  const { showConfirmationDialog } = useConfirmationDialog();

  const [formData, setFormData] = useState<IStudentFormData>({
    name: '',
    email: '',
    fitnessGoal: '',
    activityLevel: '',
    gender: '',
    weight: null,
    height: null,
    birthdate: null,
    customFitnessGoal: '',
    sessionMode: null,
    location: '',
    contactMethod: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [isEditing, setIsEditing] = useState(false);

  const sessionModeOptions = [
    { label: 'Presencial', value: 'presencial' },
    { label: 'Virtual Sincrónico', value: 'virtual_sincronico' },
    { label: 'Virtual Asincrónico', value: 'virtual_asincronico' },
    { label: 'Híbrido', value: 'hibrido' }
  ];

  const genders = [
    { label: intl.formatMessage({ id: 'gender.male' }), value: 'Male' },
    { label: intl.formatMessage({ id: 'gender.female' }), value: 'Female' },
    { label: intl.formatMessage({ id: 'gender.other' }), value: 'Other' }
  ];

  const fitnessGoals = [
    { label: intl.formatMessage({ id: 'fitnessGoal.weightLoss' }), value: 'weight loss' },
    { label: intl.formatMessage({ id: 'fitnessGoal.muscleGain' }), value: 'muscle gain' },
    { label: intl.formatMessage({ id: 'fitnessGoal.gainMobility' }), value: 'gain mobility' },
    { label: intl.formatMessage({ id: 'fitnessGoal.maintenance' }), value: 'maintenance' },
    { label: intl.formatMessage({ id: 'fitnessGoal.flexibility' }), value: 'flexibility' },
    { label: intl.formatMessage({ id: 'fitnessGoal.other' }), value: 'other' },
    ...(formData.fitnessGoal
      ? formData.fitnessGoal
          .split(',')
          .filter(
            (goal) =>
              !['weight loss', 'muscle gain', 'gain mobility', 'maintenance', 'flexibility', 'other'].includes(goal)
          )
          .map((goal) => ({ label: goal, value: goal }))
      : [])
  ];

  const activityLevels = [
    { label: intl.formatMessage({ id: 'activityLevel.sedentary' }), value: 'sedentary' },
    { label: intl.formatMessage({ id: 'activityLevel.moderatelyActive' }), value: 'moderately active' },
    { label: intl.formatMessage({ id: 'activityLevel.veryActive' }), value: 'very active' }
  ];

  useEffect(() => {
    if (studentData) {
      setIsEditing(true);
      setFormData({
        name: studentData.name || '',
        email: studentData.user?.email || '',
        fitnessGoal: studentData.fitnessGoal || '',
        activityLevel: studentData.activityLevel || '',
        gender: studentData.gender || '',
        weight: studentData.weight || null,
        height: studentData.height || null,
        birthdate: studentData.birthdate ? new Date(studentData.birthdate) : null,
        customFitnessGoal: studentData.customFitnessGoal || '',
        sessionMode: studentData.sessionMode || null,
        location: studentData.location || '',
        contactMethod: studentData.contactMethod || ''
      });
    }
  }, [studentData]);

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validateForm = () => {
    try {
      const processedFitnessGoals = processFitnessGoals(formData.fitnessGoal, formData.customFitnessGoal);

      const dataToValidate = {
        ...formData,
        fitnessGoal: processedFitnessGoals,
        coachId: String(user!.userId)
      };

      studentDialogSchema.parse(dataToValidate);
      setErrors({});
      return { isValid: true, errors: {} };
    } catch (error: any) {
      if (error.issues) {
        const newErrors: Record<string, string> = {};
        error.issues.forEach((issue: any) => {
          newErrors[issue.path[0]] = issue.message;
        });
        setErrors(newErrors);
        return { isValid: false, errors: newErrors };
      }
      return { isValid: false, errors: {} };
    }
  };

  const handleSaveStudent = async (body: any) => {
    try {
      setLoading(true);

      if (isEditing) {
        const response = await api.user.updateStudent(studentData.id, body);
        if (response.message === 'success') {
          showToast(
            'success',
            intl.formatMessage({ id: 'student.success' }),
            intl.formatMessage({ id: 'student.updatedSuccessfully' })
          );
        } else {
          showToast('error', intl.formatMessage({ id: 'error' }), response.error || '');
        }
      } else {
        const response = await api.user.saveStudent(body);
        if (response.message === 'success') {
          showToast(
            'success',
            intl.formatMessage({ id: 'student.success' }),
            intl.formatMessage({ id: 'student.addedSuccessfully' })
          );
        } else {
          showToast('error', intl.formatMessage({ id: 'error' }), response.error || '');
        }
      }

      onClose();
      setRefreshKey((old) => old + 1);
    } catch (error) {
      showToast('error', intl.formatMessage({ id: 'error' }), (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    const validation = validateForm();

    if (!validation.isValid) {
      return;
    }

    const ageWarning = formData.birthdate ? validateClientAge(formData.birthdate) : false;
    if (ageWarning) {
      showToast(
        'warn',
        intl.formatMessage({ id: 'warning' }),
        intl.formatMessage({ id: 'student.warning.youngClient' })
      );
    }

    const processedFitnessGoals = processFitnessGoals(formData.fitnessGoal, formData.customFitnessGoal);

    const body = {
      name: formData.name,
      email: formData.email,
      fitnessGoal: processedFitnessGoals,
      activityLevel: formData.activityLevel,
      gender: formData.gender,
      weight: formData.weight,
      height: formData.height,
      birthdate: formData.birthdate,
      sessionMode: formData.sessionMode,
      location:
        formData.sessionMode === 'presencial' || formData.sessionMode === 'hibrido' ? formData.location : undefined,
      contactMethod:
        formData.sessionMode === 'virtual_sincronico' || formData.sessionMode === 'hibrido'
          ? formData.contactMethod
          : undefined,
      coachId: user!.userId
    };

    showConfirmationDialog({
      message: intl.formatMessage({ id: 'student.confirmation.create' }),
      header: intl.formatMessage({ id: 'common.confirmation' }),
      icon: 'pi pi-exclamation-triangle',
      accept: () => handleSaveStudent(body)
    });
  };

  return {
    formData,
    loading,
    errors,
    isEditing,
    sessionModeOptions,
    contactMethodOptions,
    genders,
    fitnessGoals,
    activityLevels,
    updateField,
    handleSubmit,
    validateForm
  };
};

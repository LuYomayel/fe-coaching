import { useState, useContext, useEffect } from 'react';
import { useIntl } from 'react-intl';
import { UserContext } from '../../contexts/UserContext';
import { useToast } from '../../contexts/ToastContext';
import { useConfirmationDialog } from '../../utils/ConfirmationDialogContext';
import { saveStudent, updateStudent } from '../../services/usersService';
import { studentDialogSchema, processFitnessGoals, validateClientAge } from '../../schemas/studentDialogSchema';
import { contactMethodOptions } from '../../types/coach/dropdown-options';
export const useStudentDialog = (studentData, onClose, setRefreshKey) => {
  const intl = useIntl();
  const { showToast } = useToast();
  const { user } = useContext(UserContext);
  const { showConfirmationDialog } = useConfirmationDialog();

  // Estado del formulario
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    fitnessGoal: '',
    activityLevel: '',
    gender: '',
    weight: null,
    height: null,
    birthdate: null,
    customFitnessGoal: '',
    trainingType: null,
    location: '',
    contactMethod: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);

  // Opciones para los dropdowns
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
    {
      label: intl.formatMessage({ id: 'fitnessGoal.weightLoss' }),
      value: 'weight loss'
    },
    {
      label: intl.formatMessage({ id: 'fitnessGoal.muscleGain' }),
      value: 'muscle gain'
    },
    {
      label: intl.formatMessage({ id: 'fitnessGoal.gainMobility' }),
      value: 'gain mobility'
    },
    {
      label: intl.formatMessage({ id: 'fitnessGoal.maintenance' }),
      value: 'maintenance'
    },
    {
      label: intl.formatMessage({ id: 'fitnessGoal.flexibility' }),
      value: 'flexibility'
    },
    { label: intl.formatMessage({ id: 'fitnessGoal.other' }), value: 'other' },
    ...(formData.fitnessGoal
      ? formData.fitnessGoal
          .split(',')
          .filter(
            (goal) =>
              !['weight loss', 'muscle gain', 'gain mobility', 'maintenance', 'flexibility', 'other'].includes(goal)
          )
          .map((goal) => ({
            label: goal,
            value: goal
          }))
      : [])
  ];

  const activityLevels = [
    {
      label: intl.formatMessage({ id: 'activityLevel.sedentary' }),
      value: 'sedentary'
    },
    {
      label: intl.formatMessage({ id: 'activityLevel.moderatelyActive' }),
      value: 'moderately active'
    },
    {
      label: intl.formatMessage({ id: 'activityLevel.veryActive' }),
      value: 'very active'
    }
  ];

  // Inicializar datos del formulario si estamos editando
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
        trainingType: studentData.trainingType || null,
        location: studentData.location || '',
        contactMethod: studentData.contactMethod || ''
      });
    }
  }, [studentData]);

  // Función para actualizar un campo del formulario
  const updateField = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));

    // Limpiar error del campo cuando se actualiza
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: null
      }));
    }
  };

  // Función para validar el formulario con Zod
  const validateForm = () => {
    try {
      const processedFitnessGoals = processFitnessGoals(formData.fitnessGoal, formData.customFitnessGoal);

      const dataToValidate = {
        ...formData,
        fitnessGoal: processedFitnessGoals,
        coachId: String(user.userId)
      };

      console.log('Data to validate:', dataToValidate);
      const result = studentDialogSchema.parse(dataToValidate);
      console.log(result);
      setErrors({});
      return true;
    } catch (error) {
      console.log(error);
      if (error.issues) {
        const newErrors = {};
        error.issues.forEach((issue) => {
          newErrors[issue.path[0]] = issue.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  // Función para guardar/actualizar estudiante
  const handleSaveStudent = async (body) => {
    try {
      setLoading(true);

      if (isEditing) {
        const response = await updateStudent(studentData.id, body);
        if (response.message === 'success') {
          showToast(
            'success',
            intl.formatMessage({ id: 'student.success' }),
            intl.formatMessage({ id: 'student.updatedSuccessfully' })
          );
        } else {
          showToast('error', intl.formatMessage({ id: 'error' }), response.error);
        }
      } else {
        const response = await saveStudent(body);
        if (response.message === 'success') {
          showToast(
            'success',
            intl.formatMessage({ id: 'student.success' }),
            intl.formatMessage({ id: 'student.addedSuccessfully' })
          );
        } else {
          showToast('error', intl.formatMessage({ id: 'error' }), response.error);
        }
      }

      onClose();
      setRefreshKey((old) => old + 1);
    } catch (error) {
      showToast('error', intl.formatMessage({ id: 'error' }), error.message, true);
    } finally {
      setLoading(false);
    }
  };

  // Función para manejar el envío del formulario
  const handleSubmit = () => {
    console.log('handleSubmit');
    if (!validateForm()) {
      return;
    }

    // Validar edad del cliente
    const ageWarning = validateClientAge(formData.birthdate);
    if (ageWarning) {
      showToast(
        'warn',
        intl.formatMessage({ id: 'warning' }),
        intl.formatMessage({ id: 'student.warning.youngClient' }),
        true
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
      trainingType: formData.trainingType,
      location:
        formData.trainingType === 'presencial' || formData.trainingType === 'hibrido' ? formData.location : undefined,
      contactMethod:
        formData.trainingType === 'virtual_sincronico' || formData.trainingType === 'hibrido'
          ? formData.contactMethod
          : undefined,
      coachId: user.userId
    };

    console.log(body);
    showConfirmationDialog({
      message: intl.formatMessage({ id: 'student.confirmation.create' }),
      header: intl.formatMessage({ id: 'common.confirmation' }),
      icon: 'pi pi-exclamation-triangle',
      accept: () => handleSaveStudent(body),
      reject: () => console.log('Rejected')
    });
  };

  return {
    // Estado
    formData,
    loading,
    errors,
    isEditing,

    // Opciones para dropdowns
    sessionModeOptions,
    contactMethodOptions,
    genders,
    fitnessGoals,
    activityLevels,

    // Funciones
    updateField,
    handleSubmit,
    validateForm
  };
};

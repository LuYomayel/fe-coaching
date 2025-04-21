import React, { useState, useContext, useEffect } from 'react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { useToast } from '../utils/ToastContext';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { InputNumber } from 'primereact/inputnumber';
import { UserContext } from '../utils/UserContext';
import { useConfirmationDialog } from '../utils/ConfirmationDialogContext';
import { saveStudent, updateStudent } from '../services/usersService';
import { useIntl, FormattedMessage } from 'react-intl';

const NewStudentDialog = ({ onClose, setRefreshKey, studentData }) => {
  const intl = useIntl();
  const showToast = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [fitnessGoal, setFitnessGoal] = useState('');
  const [activityLevel, setActivityLevel] = useState('');
  const [birthdate, setBirthDate] = useState(null);
  const [gender, setGender] = useState('');
  const [height, setHeight] = useState(null);
  const [weight, setWeight] = useState(null);
  const [customFitnessGoal, setCustomFitnessGoal] = useState('');
  const [trainingType, setTrainingType] = useState(null);
  const [location, setLocation] = useState('');
  const [contactMethod, setContactMethod] = useState('');
  const { user } = useContext(UserContext);
  const { showConfirmationDialog } = useConfirmationDialog();

  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line
  const [studentId, setStudentId] = useState(studentData ? studentData.id : null);
  const propertyUnits = JSON.parse(localStorage.getItem('propertyUnits'));

  const trainingTypeOptions = [
    { label: 'Presencial', value: 'presencial' },
    { label: 'Virtual Sincrónico', value: 'virtual_sincronico' },
    { label: 'Virtual Asincrónico', value: 'virtual_asincronico' },
    { label: 'Híbrido', value: 'hibrido' }
  ];

  const contactMethodOptions = [
    { label: 'Zoom', value: 'zoom' },
    { label: 'WhatsApp', value: 'whatsapp' },
    { label: 'Google Meet', value: 'google_meet' },
    { label: 'Skype', value: 'skype' }
  ];

  useEffect(() => {
    if (studentData) {
      setName(studentData.name);
      setEmail(studentData.user.email);
      setFitnessGoal(studentData.fitnessGoal);
      setActivityLevel(studentData.activityLevel);
      setBirthDate(studentData.birthdate ? new Date(studentData.birthdate) : null);
      setGender(studentData.gender);
      setHeight(studentData.height);
      setWeight(studentData.weight);
      setCustomFitnessGoal(studentData.customFitnessGoal || '');
      setTrainingType(studentData.trainingType || null);
      setLocation(studentData.location || '');
      setContactMethod(studentData.contactMethod || '');
    }
  }, [studentData]);

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
    ...(fitnessGoal
      ? fitnessGoal
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

  const handleSaveStudent = async (body) => {
    try {
      setLoading(true);
      if (studentId) {
        const response = await updateStudent(studentId, body);
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

  const onClickSaveStudent = async () => {
    let finalFitnessGoals = fitnessGoal ? fitnessGoal.split(',') : [];
    if (fitnessGoal.includes('other') && customFitnessGoal) {
      finalFitnessGoals = finalFitnessGoals.filter((goal) => goal !== 'other');
      finalFitnessGoals.push(customFitnessGoal);
    }
    const body = {
      name,
      email,
      fitnessGoal: finalFitnessGoals === '' ? [] : finalFitnessGoals,
      activityLevel,
      gender,
      weight,
      height,
      birthdate,
      trainingType,
      location: trainingType === 'presencial' || trainingType === 'hibrido' ? location : undefined,
      contactMethod: trainingType === 'virtual_sincronico' || trainingType === 'hibrido' ? contactMethod : undefined,
      coachId: user.userId
    };

    if (!name || !email) {
      showToast(
        'error',
        intl.formatMessage({ id: 'error' }),
        intl.formatMessage({ id: 'student.error.nameEmailRequired' })
      );
      return;
    }

    if (birthdate && birthdate.getTime() > new Date().getTime()) {
      return showToast(
        'error',
        intl.formatMessage({ id: 'error' }),
        intl.formatMessage({ id: 'student.error.birthdateInvalid' })
      );
    }

    if (birthdate) {
      const age = new Date().getFullYear() - birthdate.getFullYear();
      if (age >= 0 && age <= 10) {
        showToast(
          'warn',
          intl.formatMessage({ id: 'warning' }),
          intl.formatMessage({ id: 'student.warning.youngClient' }),
          true
        );
      }
    }

    if ((trainingType === 'presencial' || trainingType === 'hibrido') && !location) {
      showToast(
        'error',
        intl.formatMessage({ id: 'error' }),
        intl.formatMessage({ id: 'student.error.locationRequired' })
      );
      return;
    }

    if ((trainingType === 'virtual_sincronico' || trainingType === 'hibrido') && !contactMethod) {
      showToast(
        'error',
        intl.formatMessage({ id: 'error' }),
        intl.formatMessage({ id: 'student.error.contactMethodRequired' })
      );
      return;
    }

    showConfirmationDialog({
      message: intl.formatMessage({ id: 'student.confirmation.create' }),
      header: intl.formatMessage({ id: 'common.confirmation' }),
      icon: 'pi pi-exclamation-triangle',
      accept: () => handleSaveStudent(body),
      reject: () => console.log('Rejected')
    });
  };

  return (
    <div className="new-student-dialog">
      <div className="p-field">
        <label htmlFor="email">
          <FormattedMessage id="email" />
        </label>
        <InputText id="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={studentId} />
      </div>
      <div className="p-field">
        <label htmlFor="name">
          <FormattedMessage id="name" />
        </label>
        <InputText id="name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="p-field">
        <label htmlFor="fitnessGoal">
          <FormattedMessage id="fitnessGoal" />
        </label>
        <MultiSelect
          id="fitnessGoal"
          options={fitnessGoals}
          value={fitnessGoal ? fitnessGoal.split(',') : []}
          onChange={(e) => setFitnessGoal(e.value.join(','))}
          className="w-full"
        />
      </div>
      {fitnessGoal.includes('other') && (
        <div className="p-field">
          <label htmlFor="customFitnessGoal">
            <FormattedMessage id="fitnessGoal.custom" />
          </label>
          <InputText
            id="customFitnessGoal"
            value={customFitnessGoal}
            onChange={(e) => setCustomFitnessGoal(e.target.value)}
          />
        </div>
      )}
      <div className="p-field">
        <label htmlFor="activityLevel">
          <FormattedMessage id="activityLevel" />
        </label>
        <Dropdown
          id="activityLevel"
          options={activityLevels}
          value={activityLevel}
          onChange={(e) => setActivityLevel(e.target.value)}
        />
      </div>
      <div className="p-field">
        <label htmlFor="gender">
          <FormattedMessage id="gender" />
        </label>
        <Dropdown
          id="gender"
          options={genders}
          value={gender}
          optionLabel="label"
          optionValue="value"
          onChange={(e) => setGender(e.target.value)}
        />
      </div>
      <div className="p-field">
        <label htmlFor="height">
          <FormattedMessage id="height" /> {propertyUnits?.height ? `(${propertyUnits?.height})` : ''}
        </label>
        <InputNumber
          id="height"
          value={height}
          onChange={(e) => setHeight(e.value)}
          suffix={propertyUnits?.height}
          maxLength={3}
          min={0}
        />
      </div>
      <div className="p-field">
        <label htmlFor="weight">
          <FormattedMessage id="weight" /> {propertyUnits?.weight ? `(${propertyUnits?.weight})` : ''}
        </label>
        <InputNumber
          id="weight"
          value={weight}
          onChange={(e) => setWeight(e.value)}
          suffix={propertyUnits?.weight}
          maxLength={3}
          min={0}
        />
      </div>
      <div className="p-field">
        <label htmlFor="birthdate">
          <FormattedMessage id="birthdate" />
        </label>
        <Calendar
          id="birthdate"
          locale={intl.locale}
          dateFormat="dd/mm/yy"
          value={birthdate}
          onChange={(e) => setBirthDate(e.target.value)}
        />
      </div>
      <div className="p-field">
        <label htmlFor="trainingType">
          <FormattedMessage id="student.trainingType" />
        </label>
        <Dropdown
          id="trainingType"
          value={trainingType}
          options={trainingTypeOptions}
          onChange={(e) => setTrainingType(e.value)}
          placeholder={intl.formatMessage({ id: 'student.selectTrainingType' })}
        />
      </div>
      {trainingType === 'presencial' && (
        <div className="p-field">
          <label htmlFor="location">
            <FormattedMessage id="student.location" />
          </label>
          <InputText
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder={intl.formatMessage({ id: 'student.locationPlaceholder' })}
          />
        </div>
      )}
      {trainingType === 'virtual_sincronico' && (
        <div className="p-field">
          <label htmlFor="contactMethod">
            <FormattedMessage id="student.contactMethod" />
          </label>
          <Dropdown
            id="contactMethod"
            value={contactMethod}
            options={contactMethodOptions}
            onChange={(e) => setContactMethod(e.value)}
            placeholder={intl.formatMessage({ id: 'student.selectContactMethod' })}
          />
        </div>
      )}
      {trainingType === 'hibrido' && (
        <>
          <div className="p-field">
            <label htmlFor="location">
              <FormattedMessage id="student.location" />
            </label>
            <InputText
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={intl.formatMessage({ id: 'student.locationPlaceholder' })}
            />
          </div>
          <div className="p-field">
            <label htmlFor="contactMethod">
              <FormattedMessage id="student.contactMethod" />
            </label>
            <Dropdown
              id="contactMethod"
              value={contactMethod}
              options={contactMethodOptions}
              onChange={(e) => setContactMethod(e.value)}
              placeholder={intl.formatMessage({ id: 'student.selectContactMethod' })}
            />
          </div>
        </>
      )}
      <Button
        label={intl.formatMessage({ id: 'save' })}
        icon="pi pi-save"
        loading={loading}
        onClick={onClickSaveStudent}
      />
    </div>
  );
};

export default NewStudentDialog;

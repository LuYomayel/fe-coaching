import { useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { useIntl } from 'react-intl';
import { useToast } from '../../contexts/ToastContext';
import { validateStudentDetails } from '../../utils/UtilFunctions';
import { api } from '../../services/api-client';

interface IStudentData {
  id: number;
  name: string;
  email: string;
  fitnessGoal: string | null;
  activityLevel: string;
  birthdate: string | null;
  gender: string;
  height: number | null;
  weight: number | null;
}

interface IStudentDetailDialogProps {
  student: IStudentData;
  onClose: () => void;
}

const StudentDetailDialog = ({ student, onClose }: IStudentDetailDialogProps) => {
  const intl = useIntl();
  const { showToast } = useToast();

  const [name, setName] = useState(student.name);
  const [email, setEmail] = useState(student.email);
  const [fitnessGoal, setFitnessGoal] = useState<string[]>(student.fitnessGoal ? student.fitnessGoal.split(',') : []);
  const [activityLevel, setActivityLevel] = useState(student.activityLevel);
  const [birthdate, setBirthDate] = useState<Date | null>(student.birthdate ? new Date(student.birthdate) : null);
  const [gender, setGender] = useState(student.gender);
  const [height, setHeight] = useState<number | null>(student.height);
  const [weight, setWeight] = useState<number | null>(student.weight);
  const [loading, setLoading] = useState(false);

  const genders = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Other', value: 'other' }
  ];

  const fitnessGoals = [
    { label: 'Weight Loss', value: 'weight loss' },
    { label: 'Muscle Gain', value: 'muscle gain' },
    { label: 'Maintenance', value: 'maintenance' },
    { label: 'Gain Mobility', value: 'gain mobility' },
    { label: 'Flexibility', value: 'flexibility' }
  ];

  const activityLevels = [
    { label: 'Sedentary', value: 'sedentary' },
    { label: 'Moderately Active', value: 'moderately active' },
    { label: 'Very Active', value: 'very active' }
  ];

  const handleSaveStudent = async () => {
    const { isValid, message } = validateStudentDetails(
      {
        name,
        email,
        fitnessGoal,
        activityLevel,
        birthdate: birthdate ?? '',
        gender,
        height: height ?? 0,
        weight: weight ?? 0
      },
      intl
    );
    if (!isValid) {
      showToast('error', 'Error', message);
      return;
    }

    try {
      setLoading(true);
      const body = {
        name,
        email,
        fitnessGoal: fitnessGoal.join(','),
        activityLevel,
        birthdate,
        gender,
        height,
        weight
      };
      const response = await api.user.updateClient(student.id, body);
      if (response.message === 'success') {
        showToast('success', 'Success', 'Student details updated successfully');
        onClose();
      } else {
        showToast('error', 'Error', response.error || '');
      }
    } catch (error) {
      showToast('error', 'Error', (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-3">
      <div className="p-field">
        <label htmlFor="name">Name</label>
        <InputText id="name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="p-field">
        <label htmlFor="email">Email</label>
        <InputText id="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="p-field">
        <label htmlFor="fitnessGoal">Fitness Goal</label>
        <Dropdown
          id="fitnessGoal"
          options={fitnessGoals}
          value={fitnessGoal}
          optionLabel="label"
          optionValue="value"
          onChange={(e) => setFitnessGoal(e.value)}
        />
      </div>
      <div className="p-field">
        <label htmlFor="activityLevel">Activity Level</label>
        <Dropdown
          id="activityLevel"
          options={activityLevels}
          value={activityLevel}
          optionLabel="label"
          optionValue="value"
          onChange={(e) => setActivityLevel(e.value)}
        />
      </div>
      <div className="p-field">
        <label htmlFor="gender">Gender</label>
        <Dropdown
          id="gender"
          options={genders}
          value={gender}
          optionLabel="label"
          optionValue="value"
          onChange={(e) => setGender(e.value)}
        />
      </div>
      <div className="p-field">
        <label htmlFor="height">Height</label>
        <InputNumber id="height" value={height} onValueChange={(e) => setHeight(e.value ?? null)} />
      </div>
      <div className="p-field">
        <label htmlFor="weight">Weight</label>
        <InputNumber id="weight" value={weight} onValueChange={(e) => setWeight(e.value ?? null)} />
      </div>
      <div className="p-field">
        <label htmlFor="birthdate">Birthdate</label>
        <Calendar
          id="birthdate"
          locale={intl.locale}
          dateFormat="dd/mm/yy"
          value={birthdate}
          onChange={(e) => setBirthDate(e.value as Date | null)}
        />
      </div>
      <Button label="Save" icon="pi pi-save" loading={loading} onClick={handleSaveStudent} />
    </div>
  );
};

export default StudentDetailDialog;

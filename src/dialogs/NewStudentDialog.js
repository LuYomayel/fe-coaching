import React, { useState, useContext } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { useToast } from '../utils/ToastContext';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { InputNumber } from 'primereact/inputnumber';
import { UserContext } from '../utils/UserContext';
import { useConfirmationDialog } from '../utils/ConfirmationDialogContext';
import { saveStudent } from '../services/usersService';
const apiUrl = process.env.REACT_APP_API_URL;

const NewStudentDialog = ({ onClose, setRefreshKey }) => {
  const showToast = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [fitnessGoal, setFitnessGoal] = useState('');
  const [activityLevel, setActivityLevel] = useState('');
  const [birthdate, setBirthDate] = useState(new Date());
  const [gender, setGender] = useState('');
  const [height, setHeight] = useState(0);
  const [weight, setWeight] = useState(0);
  const { user } = useContext(UserContext);
  const { showConfirmationDialog } = useConfirmationDialog();

  const [loading, setLoading] = useState(false);

  const genders = [
    { label: 'Male', value: 'Male' },
    { label: 'Female', value: 'Female' },
    { label: 'Other', value: 'Other' },
  ]
  const fitnessGoals = [
    { label: 'Weight loss', value: 'weight loss'},
    { label: 'Muscle gain', value: 'muscle gain' },
    { label: 'Gain mobility', value: 'gain mobility' },
    { label: 'Maintenance', value: 'maintenance' },
    { label: 'Flexibility', value: 'flexibility' },
  ]
  const activityLevels = [
    { label: 'Sedentary', value: 'sedentary'},
    { label: 'Moderately active', value: 'moderately active' },
    { label: 'Very active', value: 'very active' },
  ]

  const handleSaveStudent = async (body) => {
    
    try {
      setLoading(true);
      const data = await saveStudent(body);
      showToast('success', 'Success', 'Student added successfully');
      onClose(); // Close modal or navigation function
      setRefreshKey(old => old + 1); // Trigger refetch of data
    } catch (error) {
      showToast('error', 'Error', error.message);
    } finally {
      setLoading(false);
    }
    
  };

  const onClickSaveStudent = async () =>{
    const body = { name, email, fitnessGoal, activityLevel, gender, weight, height,birthdate, coachId: user.userId };
    // Validación para comprobar si algún valor es nulo
    for (const [key, value] of Object.entries(body)) {
      if(key === 'fitnessGoal') {
        if(value.length === 0) 
          return showToast('error', 'Error', `${key} cannot be null or empty`);
      }
      if (value == null || value === '' || value === 0) {
        showToast('error', 'Error', `${key} cannot be null or empty`);
        return;
      }
    }
    if(birthdate.getTime() > new Date().getTime())
      return showToast('error', 'Error', 'Birthdate can not be later than today')
    console.log(new Date().getFullYear() - birthdate.getFullYear())
    if((new Date().getFullYear() - birthdate.getFullYear()) >= 0 &&  (new Date().getFullYear() - birthdate.getFullYear()) <= 10)
      return showToast('warn', 'Warning', 'Client must be at least 10 years old, check birthdate')
    console.log(body)
    showConfirmationDialog({
      message: "Are you sure you want to create this student?",
      header: "Confirmation",
      icon: "pi pi-exclamation-triangle",
      accept: () => handleSaveStudent(body),
      reject: () => console.log('Rejected')
  });
  } 
  return (
    <div className="new-student-dialog">
      <div className="p-field">
        <label htmlFor="email">Email</label>
        <InputText id="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="p-field">
        <label htmlFor="name">Name</label>
        <InputText id="name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="p-field">
        <label htmlFor="fitnessGoal">Fitness Goal</label>
        <MultiSelect id="fitnessGoal" options={fitnessGoals} value={fitnessGoal} onChange={(e) => setFitnessGoal(e.target.value)} />
      </div>
      <div className="p-field">
        <label htmlFor="activityLevel">Activity Level</label>
        <Dropdown id="activityLevel" options={activityLevels} value={activityLevel} onChange={(e) => setActivityLevel(e.target.value)} />
      </div>
      <div className="p-field">
        <label htmlFor="activityLevel">Gender</label>
        <Dropdown id="gender" options={genders} value={gender} optionLabel='label' optionValue='value' onChange={(e) => setGender(e.target.value)} />
      </div>
      <div className="p-field">
        <label htmlFor="activityLevel">Height (cm)</label>
        <InputNumber id="height" value={height} onChange={(e) => setHeight(e.value)} maxLength={3} min={0}/>
      </div>
      <div className="p-field">
        <label htmlFor="activityLevel">Weight (kg)</label>
        <InputNumber id="weight" value={weight} onChange={(e) => setWeight(e.value)} maxLength={3} min={0}/>
      </div>
      <div className="p-field">
        <label htmlFor="activityLevel">Birhdate</label>
        <Calendar id="birthdate" dateFormat='dd/mm/yy' value={birthdate} onChange={(e) => setBirthDate(e.target.value)}/>
      </div>
      <Button label="Save" icon="pi pi-save" loading={loading} onClick={onClickSaveStudent} />
    </div>
  );
};

export default NewStudentDialog;
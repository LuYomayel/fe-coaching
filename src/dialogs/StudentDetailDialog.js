import React, { useState, useEffect } from 'react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { useToast } from '../utils/ToastContext';
const apiUrl = process.env.REACT_APP_API_URL;

const StudentDetailDialog = ({ student, onClose }) => {
  const showToast = useToast();
  const [name, setName] = useState(student.name);
  const [email, setEmail] = useState(student.email);
  const [fitnessGoal, setFitnessGoal] = useState(student.fitnessGoal ? student.fitnessGoal.split(',') : []);
  const [activityLevel, setActivityLevel] = useState(student.activityLevel);
  const [birthdate, setBirthDate] = useState(student.birthdate ? new Date(student.birthdate) : null);
  const [gender, setGender] = useState(student.gender);
  const [height, setHeight] = useState(student.height);
  const [weight, setWeight] = useState(student.weight);
  const [loading, setLoading] = useState(false);

  const genders = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Other', value: 'other' },
  ];

  const fitnessGoals = [
    { label: 'Weight Loss', value: 'weight loss' },
    { label: 'Muscle Gain', value: 'muscle gain' },
    { label: 'Maintenance', value: 'maintenance' },
    { label: 'Gain Mobility', value: 'gain mobility' },
    { label: 'Flexibility', value: 'flexibility' },
  ];

  const activityLevels = [
    { label: 'Sedentary', value: 'sedentary' },
    { label: 'Moderately Active', value: 'moderately active' },
    { label: 'Very Active', value: 'very active' },
  ];

  const handleSaveStudent = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/students/${student.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, fitnessGoal: fitnessGoal.join(','), activityLevel, birthdate, gender, height, weight }),
      });
      if (response.ok) {
        showToast('success', 'Success', 'Student details updated successfully');
        onClose();
      } else {
        const errorData = await response.json();
        console.log(errorData)
        throw new Error(errorData.message || 'Something went wrong');
      }
    } catch (error) {
      showToast('error', 'Error', error.message);
    }
    setLoading(false);
  };

  return (
    <div className="student-detail">
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
        <Dropdown id="fitnessGoal" options={fitnessGoals} value={fitnessGoal} optionLabel="label" optionValue="value" onChange={(e) => setFitnessGoal(e.value)} multiple />
      </div>
      <div className="p-field">
        <label htmlFor="activityLevel">Activity Level</label>
        <Dropdown id="activityLevel" options={activityLevels} value={activityLevel} optionLabel="label" optionValue="value" onChange={(e) => setActivityLevel(e.value)} />
      </div>
      <div className="p-field">
        <label htmlFor="gender">Gender</label>
        <Dropdown id="gender" options={genders} value={gender} optionLabel='label' optionValue='value' onChange={(e) => setGender(e.value)} />
      </div>
      <div className="p-field">
        <label htmlFor="height">Height</label>
        <InputText id="height" value={height} onChange={(e) => setHeight(e.target.value)} />
      </div>
      <div className="p-field">
        <label htmlFor="weight">Weight</label>
        <InputText id="weight" value={weight} onChange={(e) => setWeight(e.target.value)} />
      </div>
      <div className="p-field">
        <label htmlFor="birthdate">Birthdate</label>
        <Calendar id="birthdate" value={birthdate} onChange={(e) => setBirthDate(e.value)} />
      </div>
      <Button label="Save" icon="pi pi-save" loading={loading} onClick={handleSaveStudent} />
    </div>
  );
};

export default StudentDetailDialog;
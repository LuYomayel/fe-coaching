import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { InputTextarea } from 'primereact/inputtextarea';
import { Fieldset } from 'primereact/fieldset';
import { Card } from 'primereact/card';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';

import { showSuccess, showError } from '../utils/toastMessages';

const apiUrl = process.env.REACT_APP_API_URL;

const PlanDetails = ({ user }) => {
  const { planId, studentId } = useParams();
  const [plan, setPlan] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();
  const toast = useRef(null);

  const exerciseProperties = [
    { label: 'Repetitions', value: 'repetitions' },
    { label: 'Sets', value: 'sets' },
    { label: 'Time', value: 'time' },
    { label: 'Weight', value: 'weight' },
    { label: 'Rest Interval', value: 'restInterval' },
    { label: 'Tempo', value: 'tempo' },
    { label: 'Notes', value: 'notes' },
    { label: 'Difficulty', value: 'difficulty' },
    { label: 'Duration', value: 'duration' },
    { label: 'Distance', value: 'distance' },
  ];

  useEffect(() => {
    fetch(`${apiUrl}/workout/clientId/${studentId}/planId/${planId}`)
      .then(response => response.json())
      .then(data => setPlan(data))
      .catch(error => showError(toast, 'Error fetching plan details'));

    fetch(`${apiUrl}/exercise`)
      .then(response => response.json())
      .then(data => {
        const formattedExercises = data.map(exercise => ({ label: exercise.name, value: exercise.id }));
        setExercises(formattedExercises);
      })
      .catch(error => console.error('Error fetching exercises:', error));
  }, [planId,studentId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPlan(prevState => ({ ...prevState, [name]: value }));
  };

  const handleDateChange = (e, name) => {
    setPlan(prevState => ({ ...prevState, [name]: e.value }));
  };

  const handleGroupChange = (index, event) => {
    const values = [...plan.groups];
    values[index][event.target.name] = event.target.value;
    setPlan(prevState => ({ ...prevState, groups: values }));
  };

  const handleAddGroup = () => {
    const newGroup = {
      set: '',
      rest: '',
      groupNumber: plan.groups.length + 1,
      exercises: [{
        exercise: { name: '', id: '' },
        videoUrl: '',
        repetitions: '',
        sets: '',
        time: '',
        weight: '',
        restInterval: '',
        tempo: '',
        notes: '',
        difficulty: '',
        duration: '',
        distance: '',
        selectedProperties: []
      }]
    };
    setPlan(prevState => ({ ...prevState, groups: [...prevState.groups, newGroup] }));
  };

  const handleExerciseDropdownChange = (groupIndex, exerciseIndex, event) => {
    const values = [...plan.groups];
    values[groupIndex].exercises[exerciseIndex].exercise.id = event.value;
    setPlan(prevState => ({ ...prevState, groups: values }));
  };

  const handleExerciseChange = (groupIndex, exerciseIndex, event) => {
    const values = [...plan.groups];
    values[groupIndex].exercises[exerciseIndex][event.target.name] = event.target.value;
    setPlan(prevState => ({ ...prevState, groups: values }));
  };

  const handleAddExercise = (groupIndex) => {
    const values = [...plan.groups];
    values[groupIndex].exercises.push({ 
      exercise: {name: '', id: ''}, 
      videoUrl: '', 
      repetitions: '', 
      sets: '', 
      time: '', 
      weight: '', 
      restInterval: '', 
      tempo: '', 
      notes: '', 
      difficulty: '', 
      duration: '', 
      distance: '', 
      selectedProperties: [] // Inicializar como un array vacío
    });
    setPlan(prevState => ({ ...prevState, groups: values }));
  };

  const handlePropertyChange = (groupIndex, exerciseIndex, propertyIndex, event) => {
    const values = [...plan.groups];
    values[groupIndex].exercises[exerciseIndex][values[groupIndex].exercises[exerciseIndex].selectedProperties[propertyIndex]] = event.target.value;
    setPlan(prevState => ({ ...prevState, groups: values }));
  };
  
  const handleAddProperty = (groupIndex, exerciseIndex, event) => {
    const values = [...plan.groups];
    const property = event.value;
    values[groupIndex].exercises[exerciseIndex].selectedProperties.push(property);
    setPlan(prevState => ({ ...prevState, groups: values }));
  };
  
  const handleRemoveProperty = (groupIndex, exerciseIndex, propertyIndex) => {
    const values = [...plan.groups];
    values[groupIndex].exercises[exerciseIndex].selectedProperties.splice(propertyIndex, 1);
    setPlan(prevState => ({ ...prevState, groups: values }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    
    if (!plan.planName.trim()) {
      showError(toast, 'Plan name is required.');
      return;
    }

    if (!plan.dayOfWeek.trim()) {
      showError(toast, 'Day of the week is required.');
      return;
    }

    if (plan.groups.length === 0) {
      showError(toast, 'At least one group is required.');
      return;
    }

    for (const group of plan.groups) {
      if (group.exercises.length === 0) {
        showError(toast, 'Each group must have at least one exercise.');
        return;
      }

      for (const exercise of group.exercises) {
        if (!exercise.exercise.id) {
          showError(toast, 'Each exercise must be selected.');
          return;
        }
        if (!exercise.videoUrl.trim()) {
          showError(toast, 'Video URL is required for each exercise.');
          return;
        }
      }
    }

    fetch(`${apiUrl}/plans/${planId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(plan),
    }).then(() => {
      showSuccess(toast, 'Plan updated successfully');
      setIsEditing(false);
      navigate('/');
    }).catch(error => showError(toast, 'Error updating plan'));
  };

  if (!plan) return <p>Loading...</p>;

  return (
    <div className="p-grid p-justify-center">
      <Toast ref={toast} />
      <div className="p-col-12 p-md-8">
        <Card title="Plan Details">
          <form onSubmit={handleSubmit} className="p-fluid">
            <div className="p-field">
              <label htmlFor="planName">Plan Name:</label>
              {isEditing ? (
                <InputText id="planName" name="planName" value={plan.planName} onChange={handleInputChange} required />
              ) : (
                <p>{plan.planName}</p>
              )}
            </div>
            <div className="p-field">
              <label htmlFor="dayOfWeek">Day of Week:</label>
              {isEditing ? (
                <InputText id="dayOfWeek" name="dayOfWeek" value={plan.dayOfWeek} onChange={handleInputChange} required />
              ) : (
                <p>{plan.dayOfWeek}</p>
              )}
            </div>
            <div className="p-field">
              <label htmlFor="startTime">Start Time:</label>
              {isEditing ? (
                <Calendar id="startTime" name="startTime" value={new Date(plan.startTime)} onChange={(e) => handleDateChange(e, 'startTime')} timeOnly hourFormat="24" />
              ) : (
                <p>{new Date(plan.startTime).toLocaleTimeString()}</p>
              )}
            </div>
            <div className="p-field">
              <label htmlFor="endTime">End Time:</label>
              {isEditing ? (
                <Calendar id="endTime" name="endTime" value={new Date(plan.endTime)} onChange={(e) => handleDateChange(e, 'endTime')} timeOnly hourFormat="24" />
              ) : (
                <p>{new Date(plan.endTime).toLocaleTimeString()}</p>
              )}
            </div>
            <div className="p-field">
              <label htmlFor="notes">Notes:</label>
              {isEditing ? (
                <InputTextarea id="notes" name="notes" value={plan.notes} onChange={handleInputChange} rows={3} />
              ) : (
                <p>{plan.notes}</p>
              )}
            </div>
            <h2>Exercise Groups</h2>
            {plan.groups.map((group, groupIndex) => (
              <Fieldset key={groupIndex} legend={`Group ${group.groupNumber}`}>
                <div className="p-field">
                  <label htmlFor={`set${groupIndex}`}>Set:</label>
                  {isEditing ? (
                    <InputText id={`set${groupIndex}`} type="number" name="set" value={group.set} onChange={(e) => handleGroupChange(groupIndex, e)} />
                  ) : (
                    <p>{group.set}</p>
                  )}
                </div>
                <div className="p-field">
                  <label htmlFor={`rest${groupIndex}`}>Rest (seconds):</label>
                  {isEditing ? (
                    <InputText id={`rest${groupIndex}`} type="number" name="rest" value={group.rest} onChange={(e) => handleGroupChange(groupIndex, e)} />
                  ) : (
                    <p>{group.rest}</p>
                  )}
                </div>
                <div className="p-field">
                  <label htmlFor={`groupNumber${groupIndex}`}>Group Number:</label>
                  {isEditing ? (
                    <InputText id={`groupNumber${groupIndex}`} type="number" name="groupNumber" value={group.groupNumber} onChange={(e) => handleGroupChange(groupIndex, e)} />
                  ) : (
                    <p>{group.groupNumber}</p>
                  )}
                </div>
                <h3>Exercises</h3>
                {group.exercises.map((exercise, exerciseIndex) => (
                  <div key={exerciseIndex} className="p-fluid">
                    <div className="p-field">
                      <label htmlFor={`exerciseDropdown${groupIndex}-${exerciseIndex}`}>Exercise:</label>
                      {isEditing ? (
                        <Dropdown id={`exerciseDropdown${groupIndex}-${exerciseIndex}`} value={exercise.exercise.id} options={exercises} onChange={(e) => handleExerciseDropdownChange(groupIndex, exerciseIndex, e)} filter showClear required placeholder="Select an exercise" />
                      ) : (
                        <p>{exercise.exercise.name}</p>
                      )}
                    </div>
                    <div className="p-field">
                      <label htmlFor={`videoUrl${groupIndex}-${exerciseIndex}`}>Video URL:</label>
                      {isEditing ? (
                        <InputText id={`videoUrl${groupIndex}-${exerciseIndex}`} name="videoUrl" value={exercise.videoUrl} onChange={(e) => handleExerciseChange(groupIndex, exerciseIndex, e)} required />
                      ) : (
                        <p>{exercise.videoUrl}</p>
                      )}
                    </div>
                    {(exercise.selectedProperties || []).map((property, propertyIndex) => (
                    <div key={propertyIndex} className="p-field">
                        <label htmlFor={`${property}${groupIndex}-${exerciseIndex}`}>{property.charAt(0).toUpperCase() + property.slice(1)}:</label>
                        {isEditing ? (
                        <InputText id={`${property}${groupIndex}-${exerciseIndex}`} name={property} value={exercise[property]} onChange={(e) => handlePropertyChange(groupIndex, exerciseIndex, propertyIndex, e)} />
                        ) : (
                        <p>{exercise[property]}</p>
                        )}
                        {isEditing && (
                        <Button type="button" label="Remove Property" icon="pi pi-minus" onClick={() => handleRemoveProperty(groupIndex, exerciseIndex, propertyIndex)} />
                        )}
                    </div>
                    ))}
                    {isEditing && (
                      <div className="p-field">
                        <label htmlFor={`addProperty${groupIndex}-${exerciseIndex}`}>Add Property:</label>
                        <Dropdown id={`addProperty${groupIndex}-${exerciseIndex}`} options={exerciseProperties} onChange={(e) => handleAddProperty(groupIndex, exerciseIndex, e)} placeholder="Select a property" />
                      </div>
                    )}
                  </div>
                ))}
                {isEditing && (
                  <Button type="button" label="Add Exercise" icon="pi pi-plus" onClick={() => handleAddExercise(groupIndex)} className="p-button-info p-mb-3" />
                )}
              </Fieldset>
            ))}
            {isEditing && (
              <Button type="button" label="Add Group" icon="pi pi-plus" onClick={handleAddGroup} className="p-button-info p-mb-3" />
            )}
            {isEditing && (
              <Button type="submit" label="Save Plan" icon="pi pi-check" className="p-button-success" />
            )}
            {!isEditing && user && user.userType === 'coach' && (
              <Button type="button" label="Edit Plan" icon="pi pi-pencil" onClick={() => setIsEditing(true)} />
            )}
          </form>
        </Card>
      </div>
    </div>
  );
};

export default PlanDetails;
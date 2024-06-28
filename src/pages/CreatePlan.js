import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { InputTextarea } from 'primereact/inputtextarea';
import { Fieldset } from 'primereact/fieldset';
import { Card } from 'primereact/card';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';  // Importar Toast
import '../styles/CreatePlan.css';
import { showError } from '../utils/toastMessages';

const apiUrl = process.env.REACT_APP_API_URL;

const CreatePlan = () => {
  const [planName, setPlanName] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [notes, setNotes] = useState('');
  const [groups, setGroups] = useState([{ 
    set: '', 
    rest: '', 
    groupNumber: 1, 
    exercises: [
        { 
            exercise: {name: '', id: ''}, 
            videoUrl: '', 
            selectedProperties: [],
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
         }
    ] 
        }]);
  const [exercises, setExercises] = useState([]);
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
    fetch(`${apiUrl}/exercise`)
      .then(response => response.json())
      .then(data => {
        const formattedExercises = data.map(exercise => ({ label: exercise.name, value: exercise.id }));
        setExercises(formattedExercises);
      })
      .catch(error => console.error('Error fetching exercises:', error));
  }, []);

  const handleAddGroup = () => {
    setGroups([...groups, { 
      set: '', 
      rest: '', 
      groupNumber: groups.length + 1, 
      exercises: [{ 
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
        distance: '' 
      }] 
    }]);
  };

  const handleGroupChange = (index, event) => {
    const values = [...groups];
    values[index][event.target.name] = event.target.value;
    setGroups(values);
  };

  const handleExerciseDropdownChange = (groupIndex, exerciseIndex, event) => {
    const values = [...groups];
    console.log(values[groupIndex].exercises[exerciseIndex].exercise.id, event.value)
    values[groupIndex].exercises[exerciseIndex].exercise.id = event.value;
    setGroups(values);
  };

  const handleExerciseChange = (groupIndex, exerciseIndex, event) => {
    const values = [...groups];
    values[groupIndex].exercises[exerciseIndex][event.target.name] = event.target.value;
    setGroups(values);
  };

  const handleAddExercise = (groupIndex) => {
    const values = [...groups];
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
      selectedProperties: [] 
    });
    setGroups(values);
  };

  const handlePropertyChange = (groupIndex, exerciseIndex, propertyIndex, event) => {
    const values = [...groups];
    values[groupIndex].exercises[exerciseIndex][values[groupIndex].exercises[exerciseIndex].selectedProperties[propertyIndex]] = event.target.value;
    setGroups(values);
  };
  
  const handleAddProperty = (groupIndex, exerciseIndex, event) => {
    const values = [...groups];
    const property = event.value;
    values[groupIndex].exercises[exerciseIndex].selectedProperties.push(property);
    setGroups(values);
  };
  
  const handleRemoveProperty = (groupIndex, exerciseIndex, propertyIndex) => {
    const values = [...groups];
    values[groupIndex].exercises[exerciseIndex].selectedProperties.splice(propertyIndex, 1);
    setGroups(values);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    
    if (!planName.trim()) {
        console.log('Here1')
        showError(toast, 'Plan name is required.');
        return;
    }
    
    if (!dayOfWeek.trim()) {
          console.log('Here1')
          showError(toast, 'Day of the week is required.');
          return;
        }
        
        if (groups.length === 0) {
          console.log('Here3')
          showError(toast, 'At least one group is required.');
          return;
        }
        
        for (const group of groups) {
          console.log('Here4')
        if (group.exercises.length === 0) {
          showError(toast, 'Each group must have at least one exercise.');
          return;
        }
  
        for (const exercise of group.exercises) {
            console.log('Here5')
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

    const newPlan = { planName, dayOfWeek, startTime, endTime, notes, groups, coachId: 1 };
    
    fetch(`${apiUrl}/workout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newPlan),
    }).then(() => {
      navigate('/');
    });
  };

  return (
    <div className="create-plan-container">
      <Toast ref={toast} /> {/* Agregar Toast */}
      
        <Card title="Create New Training Plan">
          <form onSubmit={handleSubmit} className="p-fluid">
            <div className="p-field">
              <label htmlFor="planName">Plan Name:</label>
              <InputText id="planName" value={planName} onChange={(e) => setPlanName(e.target.value)} required />
            </div>
            <div className="p-field">
              <label htmlFor="dayOfWeek">Day of Week:</label>
              <InputText id="dayOfWeek" value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)} required />
            </div>
            <div className="p-field">
              <label htmlFor="startTime">Start Time:</label>
              <Calendar id="startTime" value={startTime} onChange={(e) => setStartTime(e.value)} timeOnly hourFormat="24" />
            </div>
            <div className="p-field">
              <label htmlFor="endTime">End Time:</label>
              <Calendar id="endTime" value={endTime} onChange={(e) => setEndTime(e.value)} timeOnly hourFormat="24" />
            </div>
            <div className="p-field">
              <label htmlFor="notes">Notes:</label>
              <InputTextarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </div>
            </form>
            </Card>
            <h2>Exercise Groups</h2>
            {groups.map((group, groupIndex) => (
              <Card key={groupIndex} className="create-plan-card" title={`Group ${group.groupNumber}`}>
              <Fieldset key={groupIndex} legend={`Group ${group.groupNumber}`}>
                <div className="p-field">
                  <label htmlFor={`set${groupIndex}`}>Set:</label>
                  <InputText id={`set${groupIndex}`} type="number" name="set" value={group.set} onChange={(e) => handleGroupChange(groupIndex, e)} />
                </div>
                <div className="p-field">
                  <label htmlFor={`rest${groupIndex}`}>Rest (seconds):</label>
                  <InputText id={`rest${groupIndex}`} type="number" name="rest" value={group.rest} onChange={(e) => handleGroupChange(groupIndex, e)} />
                </div>
                <div className="p-field">
                  <label htmlFor={`groupNumber${groupIndex}`}>Group Number:</label>
                  <InputText id={`groupNumber${groupIndex}`} type="number" name="groupNumber" value={group.groupNumber} onChange={(e) => handleGroupChange(groupIndex, e)} />
                </div>
                <h3>Exercises</h3>
                {group.exercises.map((exercise, exerciseIndex) => (
                <div key={exerciseIndex} className="p-fluid">
                    <div className="p-field">
                    <label htmlFor={`exerciseDropdown${groupIndex}-${exerciseIndex}`}>Exercise:</label>
                    <Dropdown id={`exerciseDropdown${groupIndex}-${exerciseIndex}`} value={exercise.exercise.id} options={exercises} onChange={(e) => handleExerciseDropdownChange(groupIndex, exerciseIndex, e)} filter showClear required placeholder="Select an exercise" />
                    </div>
                    <div className="p-field">
                    <label htmlFor={`videoUrl${groupIndex}-${exerciseIndex}`}>Video URL:</label>
                    <InputText id={`videoUrl${groupIndex}-${exerciseIndex}`} name="videoUrl" value={exercise.videoUrl} onChange={(e) => handleExerciseChange(groupIndex, exerciseIndex, e)} required />
                    </div>
                    {exercise.selectedProperties.map((property, propertyIndex) => (
                    <div key={propertyIndex} className="p-field">
                        <label htmlFor={`${property}${groupIndex}-${exerciseIndex}`}>{property.charAt(0).toUpperCase() + property.slice(1)}:</label>
                        <InputText id={`${property}${groupIndex}-${exerciseIndex}`} name={property} value={exercise[property]} onChange={(e) => handlePropertyChange(groupIndex, exerciseIndex, propertyIndex, e)} />
                        <Button type="button" label="Remove Property" icon="pi pi-minus" onClick={() => handleRemoveProperty(groupIndex, exerciseIndex, propertyIndex)} className='p-button-rounded p-button-lg p-button-danger'/>
                    </div>
                    ))}
                    <div className="p-field">
                    <label htmlFor={`addProperty${groupIndex}-${exerciseIndex}`}>Add Property:</label>
                    <Dropdown id={`addProperty${groupIndex}-${exerciseIndex}`} options={exerciseProperties} onChange={(e) => handleAddProperty(groupIndex, exerciseIndex, e)} placeholder="Select a property" />
                    </div>
                </div>
                ))}
                
                <Button type="button" label="Add Exercise" icon="pi pi-plus" onClick={() => handleAddExercise(groupIndex)} className="p-button-rounded p-button-lg p-button-success" />
              </Fieldset>
              </Card>
            ))}
            <Button type="button" label="Add Group" icon="pi pi-plus" onClick={handleAddGroup} className="p-button-info p-button-rounded p-button-lg" />
            <Button type="submit" label="Create Plan" icon="pi pi-check" className="p-button-success p-button-rounded p-button-lg" />
    </div>
  );
};

export default CreatePlan;
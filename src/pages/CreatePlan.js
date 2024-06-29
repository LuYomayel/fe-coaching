import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { InputTextarea } from 'primereact/inputtextarea';
import { Fieldset } from 'primereact/fieldset';
import { Card } from 'primereact/card';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';  // Importar Toast
import '../styles/CreatePlan.css';
import { showError, showSuccess } from '../utils/toastMessages';

const apiUrl = process.env.REACT_APP_API_URL;

const CreatePlan = ({ isEdit }) => {
  const [exercises, setExercises] = useState([]);
  const { planId, studentId } = useParams();
  const navigate = useNavigate();
  const toast = useRef(null);
  const [plan, setPlan] = useState({
    planName: '',
    dayOfWeek: '',
    startTime: null,
    endTime: null,
    notes: '',
    groups: [{
      set: '',
      rest: '',
      groupNumber: 1,
      exercises: [{
        exercise: { name: '', id: '' },
        multimedia: '',
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
    }]
  });

  useEffect(() => {
    if (isEdit && planId) {
      console.log('estoy aca')
      fetch(`${apiUrl}/workout/clientId/${studentId}/planId/${planId}`)
        .then(response => response.json())
        .then(data => {
          setPlan(data)
        })
        .catch(error => console.error('Error fetching plan:', error));
    }
  }, [isEdit, planId,studentId]);
  
  useEffect(() => {
    fetch(`${apiUrl}/exercise`)
      .then(response => response.json())
      .then(data => {
        console.log(data)
        const formattedExercises = data.map(exercise => ({ label: exercise.name, value: exercise.id }));
        setExercises(formattedExercises);
      })
      // const dropdown = [{label: 'ejercicio', value: 1}, ]
      .catch(error => console.error('Error fetching exercises:', error));
  }, []);
  
  const getAvailableProperties = (exercise) => {
    const propertiesToExclude = ['exercise', 'id', 'multimedia'];
    return Object.keys(exercise).filter(property => !propertiesToExclude.includes(property) && exercise[property] === '');
  };

  const handleAddGroup = () => {
    const newGroup = {
      set: '',
      rest: '',
      groupNumber: plan.groups.length + 1,
      exercises: [{
        exercise: { name: '', id: '' },
        multimedia: '',
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
    };
    setPlan(prevState => ({ ...prevState, groups: [...prevState.groups, newGroup] }));
  };

  const handleGroupChange = (index, event) => {
    const { name, value } = event.target;
    const updatedGroups = plan.groups.map((group, groupIndex) => (
      groupIndex === index ? { ...group, [name]: value } : group
    ));
    setPlan(prevState => ({ ...prevState, groups: updatedGroups }));
  };

  const handleExerciseDropdownChange = (groupIndex, exerciseIndex, event) => {
    const updatedGroups = [...plan.groups];
    updatedGroups[groupIndex].exercises[exerciseIndex].exercise.id = event.value;
    setPlan(prevState => ({ ...prevState, groups: updatedGroups }));
  };

  const handleExerciseChange = (groupIndex, exerciseIndex, event) => {
    const { name, value } = event.target;
    const updatedGroups = [...plan.groups];
    updatedGroups[groupIndex].exercises[exerciseIndex][name] = value;
    setPlan(prevState => ({ ...prevState, groups: updatedGroups }));
  };

  const handleAddExercise = (groupIndex) => {
    const newExercise = {
      exercise: { name: '', id: '' },
      multimedia: '',
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
    };
    const updatedGroups = [...plan.groups];
    updatedGroups[groupIndex].exercises.push(newExercise);
    setPlan(prevState => ({ ...prevState, groups: updatedGroups }));
  };

  const handlePropertyChange = (groupIndex, exerciseIndex, property, event) => {
    const updatedGroups = [...plan.groups];
    updatedGroups[groupIndex].exercises[exerciseIndex][property] = event.target.value;
    setPlan(prevState => ({ ...prevState, groups: updatedGroups }));
  };

  const handleAddProperty = (groupIndex, exerciseIndex, event) => {
    const property = event.value;
    const updatedGroups = [...plan.groups];
    updatedGroups[groupIndex].exercises[exerciseIndex][property] = 0; // Agregar nueva propiedad con valor vacío
    setPlan(prevState => ({ ...prevState, groups: updatedGroups }));
  };
  
  const handleRemoveProperty = (groupIndex, exerciseIndex, property) => {
    const updatedGroups = [...plan.groups];
    // delete updatedGroups[groupIndex].exercises[exerciseIndex][property]; // Eliminar propiedad
    updatedGroups[groupIndex].exercises[exerciseIndex][property] = ''; // Agregar nueva propiedad con valor vacío
    setPlan(prevState => ({ ...prevState, groups: updatedGroups }));
    console.log(plan)
    
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    
    if (!plan.planName.trim()) {
        console.log('Here1')
        showError(toast, 'Plan name is required.');
        return;
    }
        
    if (plan.groups.length === 0) {
      console.log('Here3')
      showError(toast, 'At least one group is required.');
      return;
    }
    
    for (const group of plan.groups) {
      console.log('Here4')
    if (group.exercises.length === 0) {
      showError(toast, 'Each group must have at least one exercise.');
      return;
    }

    for (const exercise of plan.group.exercises) {
        console.log('Here5')
      if (!exercise.exercise.id) {
        showError(toast, 'Each exercise must be selected.');
        return;
      }
      if (!exercise.multimedia.trim()) {
        showError(toast, 'Video URL is required for each exercise.');
        return;
      }
    }
    } 

    
    const requestMethod = isEdit ? 'PUT' : 'POST';
    const url = isEdit ? `${apiUrl}/workout/${planId}` : `${apiUrl}/workout`;

    fetch(url, {
      method: requestMethod,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(plan),
    }).then(() => {
      // navigate('/');
      showSuccess(toast, 'Parece que actualizaste algo')
    });
  };

  return (
    <div>
      <h1>{isEdit ? "Edit Training Plan" : "Create New Training Plan"}</h1>
      <div className="create-plan-container">
      <Toast ref={toast} /> {/* Agregar Toast */}
      <div className="form-section">
        <Card title="Details">
          <form onSubmit={handleSubmit} className="p-fluid">
            <div className="p-field">
              <label htmlFor="planName">Plan Name:</label>
              <InputText
                id="planName"
                value={plan.planName}
                onChange={(e) => setPlan(prevState => ({ ...prevState, planName: e.target.value }))}
                required
              />
            </div>
            <div className="p-field">
              <label htmlFor="dayOfWeek">Day of Week:</label>
              <InputText
                id="dayOfWeek"
                value={plan.dayOfWeek}
                onChange={(e) => setPlan(prevState => ({ ...prevState, dayOfWeek: e.target.value }))}
                required
              />
            </div>
            <div className="p-field">
              <label htmlFor="startTime">Start Time:</label>
              <Calendar
                id="startTime"
                value={plan.startTime}
                onChange={(e) => setPlan(prevState => ({ ...prevState, startTime: e.value }))}
                timeOnly
                hourFormat="24"
              />
            </div>
            <div className="p-field">
              <label htmlFor="endTime">End Time:</label>
              <Calendar
                id="endTime"
                value={plan.endTime}
                onChange={(e) => setPlan(prevState => ({ ...prevState, endTime: e.value }))}
                timeOnly
                hourFormat="24"
              />
            </div>
            <div className="p-field">
              <label htmlFor="notes">Notes:</label>
              <InputTextarea
                id="notes"
                value={plan.notes}
                onChange={(e) => setPlan(prevState => ({ ...prevState, notes: e.target.value }))}
                rows={3}
              />
            </div>
          </form>
        </Card>
      </div>

      <div className="groups-section">
        <Card title="Exercise Groups" className="exercise-groups-card">
        <div className="groups-container">
        {plan.groups.map((group, groupIndex) => (
          <Card key={groupIndex} className="create-plan-card" >
            <Fieldset legend={`Group ${group.groupNumber}`}>
              <div className='fieldset-scroll'>
              <div className="p-field">
                <label htmlFor={`set${groupIndex}`}>Set:</label>
                <InputText id={`set${groupIndex}`} type="number" name="set" value={group.set} onChange={(e) => handleGroupChange(groupIndex, e)} />
              </div>
              <div className="p-field">
                <label htmlFor={`rest${groupIndex}`}>Rest (seconds):</label>
                <InputText id={`rest${groupIndex}`} type="number" name="rest" value={group.rest} onChange={(e) => handleGroupChange(groupIndex, e)} />
              </div>
              <h3>Exercises</h3>
              {group.exercises.map((exercise, exerciseIndex) => (
                <div key={exerciseIndex} className="p-fluid exercise">
                  <div className="p-field">
                    <label htmlFor={`exerciseDropdown${groupIndex}-${exerciseIndex}`}>Exercise:</label>
                    <Dropdown id={`exerciseDropdown${groupIndex}-${exerciseIndex}`} value={exercise.exercise.id} options={exercises} onChange={(e) => handleExerciseDropdownChange(groupIndex, exerciseIndex, e)} filter showClear required placeholder="Select an exercise" />
                  </div>
                  <div className="p-field">
                    <label htmlFor={`multimedia${groupIndex}-${exerciseIndex}`}>Video URL:</label>
                    <InputText id={`multimedia${groupIndex}-${exerciseIndex}`} name="multimedia" value={exercise.multimedia} onChange={(e) => handleExerciseChange(groupIndex, exerciseIndex, e)} required />
                  </div>
                  {Object.keys(exercise).map((property, propertyIndex) => (
                      (property !== 'exercise' && property !== 'id' && exercise[property] !== '') && (
                        <div key={propertyIndex} className="p-field">
                          <label htmlFor={`${property}${groupIndex}-${exerciseIndex}`}>{property.charAt(0).toUpperCase() + property.slice(1)}:</label>
                          <InputText
                            id={`${property}${groupIndex}-${exerciseIndex}`}
                            name={property}
                            value={exercise[property]}
                            onChange={(e) => handleAddProperty(groupIndex, exerciseIndex, e)}
                          />
                          <Button
                            type="button"
                            label="Remove Property"
                            icon="pi pi-minus"
                            onClick={() => handleRemoveProperty(groupIndex, exerciseIndex, property)}
                            className="p-button-rounded p-button-danger"
                          />
                        </div>
                      )
                    ))}
                  <div className="p-field">
                    <label htmlFor={`addProperty${groupIndex}-${exerciseIndex}`}>Add Property:</label>
                    {/* <Dropdown filter={true} id={`addProperty${groupIndex}-${exerciseIndex}`} options={exerciseProperties} onChange={(e) => handleAddProperty(groupIndex, exerciseIndex, e)} placeholder="Select a property" /> */}
                    <Dropdown
                            filter={true}
                            id={`addProperty${groupIndex}-${exerciseIndex}`}
                            options={getAvailableProperties(exercise).map(prop => ({ label: prop.charAt(0).toUpperCase() + prop.slice(1), value: prop }))}
                            onChange={(e) => handleAddProperty(groupIndex, exerciseIndex, e)}
                            placeholder="Select a property"
                          />
                  </div>
                </div>
              ))}
              {/* </div> */}
              <Button type="button" label="Add Exercise" icon="pi pi-plus" onClick={() => handleAddExercise(groupIndex)} className="p-button-rounded p-button-success" />
              </div>
            </Fieldset>
          </Card>
        ))}
        </div>
        </Card>
      </div>
      
      <div className="actions-section">
        <Button type="button" label="Add Group" icon="pi pi-plus" onClick={handleAddGroup} className="p-button-rounded p-button-info p-button-lg" />
        <Button type="submit" label="Create Plan" icon="pi pi-check" className="p-button-rounded p-button-success p-button-lg" onClick={handleSubmit}/>
      </div>
      </div>
    </div>
  );
};

export default CreatePlan;
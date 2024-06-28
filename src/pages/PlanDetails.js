import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import '../styles/PlanDetails.css';

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
      .then(data => {
        console.log(data)
        setPlan(data)
      })
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
    <div className="student-plan-container">
    <h1>Training Plan</h1>
    <div className="plan-summary">
      <Card>
        <div className="plan-details">
          <p><strong>Plan Name:</strong> {plan.planName}</p>
          <p><strong>Day of Week:</strong> {plan.dayOfWeek}</p>
          {/* <p><strong>Start Time:</strong> {new Date(plan.startTime).toLocaleTimeString()}</p> */}
          {/* <p><strong>End Time:</strong> {new Date(plan.endTime).toLocaleTimeString()}</p> */}
          <p><strong>Notes:</strong> {plan.notes}</p>
        </div>
      </Card>
    </div>

    <div className="exercise-groups">
      {plan.groups.map((group, groupIndex) => (
        <div key={groupIndex} className="exercise-group">
          <Card title={`Group ${group.groupNumber}`} className="group-card">
            <p><strong>Set:</strong> {group.set}</p>
            <p><strong>Rest (seconds):</strong> {group.rest}</p>
          </Card>
          <Fieldset legend="Exercises" className='exercises-card'>
            <div className="exercises-container">
              {group.exercises.map((exercise, exerciseIndex) => (
                <div key={exerciseIndex} className="exercise-card">
                  <Card>
                    <div className='exercise-fields'>

                      <div className='p-field exercise-field'>
                          <label> 
                            Exercise:
                          </label>
                          <p>{exercise.exercise.name}</p>
                      </div>
                      <div className='p-field exercise-field'>
                        <label> 
                          Video URL:
                        </label>
                        <p><a href={exercise.multimedia} >Watch Video</a></p>
                      </div>
                      {Object.keys(exercise).map((property, propertyIndex) => (
                        (property !== 'exercise' && property !== 'id' && exercise[property] !== '') && (
                          <div key={propertyIndex} className="p-field exercise-field">
                            <label htmlFor={`${property}${groupIndex}-${exerciseIndex}`}>{property.charAt(0).toUpperCase() + property.slice(1)}:</label>
                            <p>{exercise[property]}</p>
                          </div>
                        )
                      ))}
                      </div>
                  </Card>
                </div>
              ))}
            </div>
            </Fieldset>
          
        </div>
      ))}
    </div>
  </div>
  );
};

export default PlanDetails;
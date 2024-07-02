import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { InputTextarea } from 'primereact/inputtextarea';
import { Fieldset } from 'primereact/fieldset';
import { Card } from 'primereact/card';
import { Dropdown } from 'primereact/dropdown';
import { useToast } from '../utils/ToastContext';
import '../styles/CreatePlan.css';

const apiUrl = process.env.REACT_APP_API_URL;

const CreatePlan = ({ isEdit }) => {
  const [exercises, setExercises] = useState([]);
  const { planId } = useParams();
  const navigate = useNavigate();
  const showToast = useToast();
  const [plan, setPlan] = useState({
    planName: '',
    dayOfWeek: '',
    startTime: null,
    endTime: null,
    notes: '',
    workoutInstances: [{
      isTemplate: true,
      groups: [{
        set: '',
        rest: '',
        groupNumber: 1,
        exercises: [{
          exercise: { name: '', id: '', multimedia: '' },
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
    }]
  });

  useEffect(() => {
    if (isEdit && planId) {
      fetch(`${apiUrl}/workout/${planId}`)
        .then(response => response.json())
        .then(data => {
          console.log(data)
          setPlan(data)
        })
        .catch(error => showToast('error', `${error.message}`, 'Error fetching plan details'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, planId]);
  
  useEffect(() => {
    fetch(`${apiUrl}/exercise`)
      .then(response => response.json())
      .then(data => {
        const formattedExercises = data.map(exercise => ({ label: exercise.name, value: exercise.id }));
        setExercises(formattedExercises);
      })
      .catch(error => showToast('error', `${error.message}`, 'Error fetching plan details'));
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const getAvailableProperties = (exercise) => {
    const propertiesToExclude = ['exercise', 'id', 'multimedia'];
    return Object.keys(exercise).filter(property => !propertiesToExclude.includes(property) && exercise[property] === '');
  };

  
  const handleAddGroup = () => {
    console.log(plan)
    const newGroup = {
      set: '',
      rest: '',
      groupNumber: plan.workoutInstances[0].groups.length + 1,
      exercises: [{
        exercise: { name: '', id: '', multimedia: '' },
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
  
    setPlan(prevState => {
      const updatedInstances = prevState.workoutInstances.map(instance => {
        // if (instance.isTemplate) {
        //   return {
        //     ...instance,
        //     groups: [...instance.groups, newGroup]
        //   };
        // }
        // return instance;
        return {
              ...instance,
              groups: [...instance.groups, newGroup]
            };
      });
  
      return { ...prevState, workoutInstances: updatedInstances };
    });
  };

  const handleGroupChange = (index, event) => {
    const { name, value } = event.target;
    setPlan(prevState => {
      const updatedInstances = prevState.workoutInstances.map(instance => {
        // if (instance.isTemplate) {
        //   const updatedGroups = instance.groups.map((group, groupIndex) => (
        //     groupIndex === index ? { ...group, [name]: value } : group
        //   ));
        //   return { ...instance, groups: updatedGroups };
        // }
        // return instance;
        const updatedGroups = instance.groups.map((group, groupIndex) => (
          groupIndex === index ? { ...group, [name]: value } : group
        ));
        return { ...instance, groups: updatedGroups };
      });
      return { ...prevState, workoutInstances: updatedInstances };
    });
  };

  const handleExerciseDropdownChange = (groupIndex, exerciseIndex, event) => {
    setPlan(prevState => {
      const updatedInstances = prevState.workoutInstances.map(instance => {
        // if (instance.isTemplate) {
        //   const updatedGroups = [...instance.groups];
        //   updatedGroups[groupIndex].exercises[exerciseIndex].exercise.id = event.value;
        //   return { ...instance, groups: updatedGroups };
        // }
        // return instance;
        const updatedGroups = [...instance.groups];
          updatedGroups[groupIndex].exercises[exerciseIndex].exercise.id = event.value;
          return { ...instance, groups: updatedGroups };
      });
      return { ...prevState, workoutInstances: updatedInstances };
    });
  };

  const handleExerciseChange = (groupIndex, exerciseIndex, event) => {
    const { value } = event.target;
    setPlan(prevState => {
      const updatedInstances = prevState.workoutInstances.map(instance => {
        // if (instance.isTemplate) {
        //   const updatedGroups = [...instance.groups];
        //   updatedGroups[groupIndex].exercises[exerciseIndex].exercise.multimedia = value;
        //   return { ...instance, groups: updatedGroups };
        // }
        // return instance;
        const updatedGroups = [...instance.groups];
          updatedGroups[groupIndex].exercises[exerciseIndex].exercise.multimedia = value;
          return { ...instance, groups: updatedGroups };
      });
      return { ...prevState, workoutInstances: updatedInstances };
    });
  };

  const handleAddExercise = (groupIndex) => {
    const newExercise = {
      exercise: { name: '', id: '', multimedia: '' },
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
    setPlan(prevState => {
      const updatedInstances = prevState.workoutInstances.map(instance => {
        // if (instance.isTemplate) {
        //   const updatedGroups = [...instance.groups];
        //   updatedGroups[groupIndex].exercises.push(newExercise);
        //   return { ...instance, groups: updatedGroups };
        // }
        // return instance;
        const updatedGroups = [...instance.groups];
          updatedGroups[groupIndex].exercises.push(newExercise);
          return { ...instance, groups: updatedGroups };
      });
      return { ...prevState, workoutInstances: updatedInstances };
    });
  };

  const handlePropertyChange = (groupIndex, exerciseIndex, property, value) => {
    setPlan(prevState => {
      const updatedInstances = prevState.workoutInstances.map(instance => {
        // if (instance.isTemplate) {
        //   const updatedGroups = [...instance.groups];
        //   updatedGroups[groupIndex].exercises[exerciseIndex][property] = value;
        //   return { ...instance, groups: updatedGroups };
        // }
        // return instance;
        const updatedGroups = [...instance.groups];
          updatedGroups[groupIndex].exercises[exerciseIndex][property] = value;
          return { ...instance, groups: updatedGroups };
      });
      return { ...prevState, workoutInstances: updatedInstances };
    });
  };

  const handleAddProperty = (groupIndex, exerciseIndex, event) => {
    const property = event.value;
    setPlan(prevState => {
      const updatedInstances = prevState.workoutInstances.map(instance => {
        // if (instance.isTemplate) {
        //   const updatedGroups = [...instance.groups];
        //   updatedGroups[groupIndex].exercises[exerciseIndex][property] = 0; // Agregar nueva propiedad con valor vacío
        //   return { ...instance, groups: updatedGroups };
        // }
        // return instance;
        const updatedGroups = [...instance.groups];
          updatedGroups[groupIndex].exercises[exerciseIndex][property] = 0; // Agregar nueva propiedad con valor vacío
          return { ...instance, groups: updatedGroups };
      });
      return { ...prevState, workoutInstances: updatedInstances };
    });
  };
  
  const handleRemoveProperty = (groupIndex, exerciseIndex, property) => {
    setPlan(prevState => {
      const updatedInstances = prevState.workoutInstances.map(instance => {
        // if (instance.isTemplate) {
        //   const updatedGroups = [...instance.groups];
        //   updatedGroups[groupIndex].exercises[exerciseIndex][property] = ''; // Agregar nueva propiedad con valor vacío
        //   return { ...instance, groups: updatedGroups };
        // }
        // return instance;
        const updatedGroups = [...instance.groups];
          updatedGroups[groupIndex].exercises[exerciseIndex][property] = ''; // Agregar nueva propiedad con valor vacío
          return { ...instance, groups: updatedGroups };
      });
      return { ...prevState, workoutInstances: updatedInstances };
    });
    console.log(plan);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    
    if (!plan.planName.trim()) {
        // showError(toast, 'Plan name is required.');
        return;
    }
        
    if (plan.workoutInstances[0].groups.length === 0) {
      // showError(toast, 'At least one group is required.');
      return;
    }
    
    for (const group of plan.workoutInstances[0].groups) {
    if (group.exercises.length === 0) {
      // showError(toast, 'Each group must have at least one exercise.');
      return;
    }

    for (const exercise of group.exercises) {
      if (!exercise.exercise.id) {
        // showError(toast, 'Each exercise must be selected.');
        return;
      }
      if (!exercise.exercise.multimedia.trim()) {
        // showError(toast, 'Video URL is required for each exercise.');
        return;
      }
    }
    } 

    
    const requestMethod = isEdit ? 'PUT' : 'POST';
    const url = isEdit ? `${apiUrl}/workout/template/${planId}` : `${apiUrl}/workout`;
    fetch(url, {
      method: requestMethod,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(plan),
    }).then((response) => {
      if(isEdit){
        showToast('success', `You have updated the plan ${plan.planName} with success!`, 'Plan updated!');
      }else{
        showToast('success', `You have created the plan ${plan.planName} with success!`, 'Plan created!');
      }
      // navigate(`/`);
    });
  };

  return (
    <div>
      <h1>{isEdit ? "Edit Training Plan" : "Create New Training Plan"}</h1>
      <div className="create-plan-container">
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
        {plan.workoutInstances[0].groups.map((group, groupIndex) => (
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
                    <InputText id={`multimedia${groupIndex}-${exerciseIndex}`} name="multimedia" value={exercise.exercise.multimedia} onChange={(e) => handleExerciseChange(groupIndex, exerciseIndex, e)} required />
                  </div>
                  {Object.keys(exercise).map((property, propertyIndex) => (
                      (property !== 'exercise' && property !== 'id' && property !== 'multimedia' && exercise[property] !== '') && (
                        <div key={propertyIndex} className="p-field">
                          <label htmlFor={`${property}${groupIndex}-${exerciseIndex}`}>{property.charAt(0).toUpperCase() + property.slice(1)}:</label>
                          <InputText
                            id={`${property}${groupIndex}-${exerciseIndex}`}
                            name={property}
                            value={exercise[property]}
                            onChange={(e) => handlePropertyChange(groupIndex, exerciseIndex, property, e.target.value)}
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
        <Button type="submit" label={isEdit ? 'Edit Plan' : 'Create Plan'} icon="pi pi-check" className="p-button-rounded p-button-success p-button-lg" onClick={handleSubmit}/>
      </div>
      </div>
    </div>
  );
};

export default CreatePlan;
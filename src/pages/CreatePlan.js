import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
import { Fieldset } from 'primereact/fieldset';
import { Card } from 'primereact/card';
import { TabView, TabPanel } from 'primereact/tabview';
import { Dropdown } from 'primereact/dropdown';

import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
        
import { useToast } from '../utils/ToastContext';
import { UserContext } from '../utils/UserContext';
import { useConfirmationDialog } from '../utils/ConfirmationDialogContext';
import '../styles/CreatePlan.css';
import { useSpinner } from '../utils/GlobalSpinner';
import { fetchWorkoutInstance, submitPlan } from '../services/workoutService';
import { v4 as uuidv4 } from 'uuid'; // Librería para generar UUIDs


const apiUrl = process.env.REACT_APP_API_URL;

const CreatePlan = ({ isEdit }) => {
  const [exercises, setExercises] = useState([]);
  const { planId } = useParams();
  const navigate = useNavigate();
  const showToast = useToast();
  const { user } = useContext(UserContext);
  const { showConfirmationDialog } = useConfirmationDialog();
  const { loading, setLoading } = useSpinner();
  const [deletedGroup, setDeletedGroup] = useState(null);
  const [plan, setPlan] = useState(() => {
    const savedPlan = localStorage.getItem('unsavedPlan');

    return savedPlan && !isEdit ? JSON.parse(savedPlan) : {
      workout: {
        id: '',
        planName: '',
        coach: {
          id: '',
          user: {
            id: user.userId
          }
        }
      },
      isTemplate: true,
      dateAssigned: '',
      dateCompleted: '',
      expectedEndDate: '',
      expectedStartDate: '',
      feedback: '',
      instanceName: '',
      isRepeated: false,
      personalizedNotes: '',
      realEndDate: '',
      realStartedDate: '',
      repeatDays: [],
      status: ' ',
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
          distance: '',
          id: '',
        }]
      }]
    };
  });

  const handleBack = () => {
    navigate(-1)
  }

  useEffect(() => {
    if(!isEdit){
      localStorage.setItem('unsavedPlan', JSON.stringify(plan));
    }
  }, [plan, isEdit]);

  // Función para limpiar el plan
  const handleClearPlan = () => {
    setPlan({
      workout: {
        id: '',
        planName: '',
        coach: {
          id: '',
          user: {
            id: user.userId
          }
        }
      },
      isTemplate: true,
      dateAssigned: '',
      dateCompleted: '',
      expectedEndDate: '',
      expectedStartDate: '',
      feedback: '',
      instanceName: '',
      isRepeated: false,
      personalizedNotes: '',
      realEndDate: '',
      realStartedDate: '',
      repeatDays: [],
      status: ' ',
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
    });
    localStorage.removeItem('unsavedPlan');
  };

  useEffect(() => {
    const fetchPlanDetails = async () => {
      if (isEdit && planId) {
        setLoading(true);
        try {
          const data = await fetchWorkoutInstance(planId)
          // const data = await response.json();
          setPlan(data);
        } catch (error) {
          showToast('error', 'Error fetching plan details', `${error.message}`);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchPlanDetails();
  }, [isEdit, planId, setLoading, setPlan]);
  
  useEffect(() => {
    fetch(`${apiUrl}/exercise`)
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json();
          console.log(errorData)
          throw new Error(errorData.message || 'Something went wrong');
        }
        const data = await response.json();
        const formattedExercises = data.map(exercise => ({ label: exercise.name, value: exercise.id, exerciseType: exercise.exerciseType }));
        setExercises(formattedExercises);
      })
      .catch(error => showToast('error', 'Error fetching plan details', `${error.message}`));
      // eslint-disable-next-line react-hooks/exhaustive-deps
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
  
    setPlan(prevState => ({
      ...prevState,
      groups: [...prevState.groups, newGroup]
    }));
  };

  const handleRemoveGroup = (groupIndex) => {
    const updatedGroups = plan.groups.filter((_, index) => index !== groupIndex);
    const groupToRemove = plan.groups[groupIndex];

    setDeletedGroup(groupToRemove);  // Almacena el grupo eliminado
    setPlan(prevState => ({ ...prevState, groups: updatedGroups }));
  };

  const handleUndoDelete = () => {
    if (deletedGroup) {
      setPlan(prevState => ({
        ...prevState,
        groups: [...prevState.groups, deletedGroup]
      }));
      setDeletedGroup(null);  // Limpia el estado del grupo eliminado
    }
  };

  const handleGroupChange = (index, event) => {
    const { name, value } = event.target;
    const updatedGroups = plan.groups.map((group, groupIndex) => (
      groupIndex === index ? { ...group, [name]: value } : group
    ));
    setPlan(prevState => ({ ...prevState, groups: updatedGroups }));
  };

  const handleExerciseDropdownChange = (groupIndex, exerciseIndex, event) => {
    const selectedExercise = exercises.find(ex => ex.value === event.value);
    const updatedGroups = [...plan.groups];
    updatedGroups[groupIndex].exercises[exerciseIndex].exercise.id = event.value;
    updatedGroups[groupIndex].exercises[exerciseIndex].exercise.name = selectedExercise.label;
    setPlan(prevState => ({ ...prevState, groups: updatedGroups }));
  };

  const handleAddExercise = (groupIndex) => {
    const newExercise = {
      id: uuidv4(), // Genera un ID único para cada nuevo ejercicio
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
      distance: '',
    };
  
    setPlan((prevState) => {
      const updatedGroups = prevState.groups.map((group, idx) => {
        if (idx === groupIndex) {
          return {
            ...group,
            exercises: [...group.exercises, newExercise], // Añadir ejercicio de forma inmutable
          };
        }
        return group; // Devuelve el grupo sin modificaciones si no coincide el índice
      });
  
      return { ...prevState, groups: updatedGroups }; // Devuelve un nuevo estado con los grupos actualizados
    });
  };

  const handleRemoveExercise = (groupIndex, exerciseId) => {
    setPlan((prevState) => {
      const updatedGroups = prevState.groups.map((group, idx) => {
        if (idx === groupIndex) {
          // Filtra el ejercicio basado en su ID para eliminar solo el ejercicio seleccionado
          return {
            ...group,
            exercises: group.exercises.filter((exercise) => exercise.id !== exerciseId),
          };
        }
        return group; // Devuelve el grupo sin modificaciones si no coincide el índice
      });
  
      return { ...prevState, groups: updatedGroups }; // Devuelve un nuevo estado con los grupos actualizados
    });
  };

  const handleTabClose = (e, groupIndex) => {
    const exerciseId = plan.groups[groupIndex].exercises[e.index].id; // Usa el ID del ejercicio
    handleRemoveExercise(groupIndex, exerciseId); // Llama a la función de eliminación con el ID correcto
  };

  const handlePropertyChange = (groupIndex, exerciseIndex, property, value) => {
    const updatedGroups = [...plan.groups];
    updatedGroups[groupIndex].exercises[exerciseIndex][property] = value;
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
    updatedGroups[groupIndex].exercises[exerciseIndex][property] = ''; // Agregar nueva propiedad con valor vacío
    setPlan(prevState => ({ ...prevState, groups: updatedGroups }));
  };

  const handleSubmit = (event) =>{
    event.preventDefault();

    if (!plan.workout.planName.trim()) {
      showToast('error', 'Error', 'Plan name is required.');
      return;
    }

    if (plan.groups.length === 0) {
      showToast('error', 'Error', 'At least one group is required.');
      return;
    }

    for (const group of plan.groups) {
      if (group.exercises.length === 0) {
        showToast('error', 'Error', 'Each group must have at least one exercise.');
        return;
      }

      for (const exercise of group.exercises) {
        console.log('Exercises: ', group.exercises)
        if (!exercise.exercise.id) {
          showToast('error', 'Error',  'Each exercise must be selected.');
          return;
        }
        if(typeof exercise.id === 'string'){
          exercise.id = 0;
        }

        // if (!exercise.exercise.multimedia.trim()) {
        //   showToast('error', 'Error','Video URL is required for each exercise.');
        //   return;
        // }
      }
    }

  showConfirmationDialog({
      message: isEdit ? "Are you sure you want to edit this plan?" : "Are you sure you want to create this plan?",
      header: "Confirmation",
      icon: "pi pi-exclamation-triangle",
      accept: () => fetchSubmit(),
      reject: () => console.log('Rejected')
  });
  }

  const exerciseItemTemplate = (option) => {
    return (
      <div>
        <div>{option.label}</div>
        <div style={{ fontSize: '0.8em', color: 'gray' }}>{option.exerciseType}</div>
      </div>
    );
  };

  const fetchSubmit = async () => {
    try {
      console.log(plan, planId, isEdit)
      const result = await submitPlan(plan, planId, isEdit);
      if (isEdit) {
        showToast('success', 'Plan updated!', `You have updated the plan ${plan.workout.planName} successfully!`);
      } else {
        showToast('success', 'Plan created!', `You have created the plan ${plan.workout.planName} successfully!`);
      }
      navigate(-1); // Assuming navigate is from react-router-dom and is appropriately imported
    } catch (error) {
      console.log(error)
      showToast('error', 'Something went wrong!', error.message);
    }
  };

  return (
    <div className='pl-3 pr-3'>
      <div className='flex align-items-center justify-content-between'>
        <div>
          <Button icon="pi pi-arrow-left" onClick={handleBack} />
        </div>
        <div><h1>{isEdit ? "Edit Training Plan" : "Create New Training Plan"}</h1></div>
        <div>&nbsp;</div>
      </div>
      
      <div className="create-plan-container responsive-container">
      <div className="form-section responsive-section">
      <Card title="Details" className="responsive-card">
          <form onSubmit={handleSubmit} className="p-fluid">
            <div className="p-field">
              <label htmlFor="planName">Plan Name:</label>
              <InputText
                id="planName"
                value={plan.workout.planName}
                onChange={(e) => setPlan(prevState => ({ ...prevState, workout: { ...prevState.workout, planName: e.target.value } }))}
                disabled={plan.isTemplate ? false : true}
              />
            </div>
            {/* {isEdit && !plan.isTemplate &&
            <div className="p-field">
              <label htmlFor="notes">Description:</label>
              <InputTextarea
                id="instanceName"
                value={plan.instanceName}
                onChange={(e) => setPlan(prevState => ({ ...prevState, instanceName: e.target.value }))}
                rows={3}
              />
            </div>} */}
            {/* {isEdit && !plan.isTemplate &&
            <div className="p-field">
              <label htmlFor="notes">Notes:</label>
              <InputTextarea
                id="notes"
                value={plan.personalizedNotes}
                onChange={(e) => setPlan(prevState => ({ ...prevState, personalizedNotes: e.target.value }))}
                rows={3}
              />
            </div>} */}
          </form>
        </Card>
      </div>

      <div className="groups-section responsive-section">
      <Card title="Exercise Groups" className="exercise-groups-card responsive-card">
      <div className="groups-container responsive-groups-container">
        {plan.groups.map((group, groupIndex) => (
          <Card key={groupIndex} className="create-plan-card responsive-card" >
            <Fieldset legend={`Group ${group.groupNumber}`} toggleable onCollapse={() => handleRemoveGroup(groupIndex)} collapseIcon='pi pi-times'>
            <div className="fieldset-scroll responsive-fieldset-scroll">
              <div className="flex gap-2 justify-content-center responsive-flex">
                  <div className="p-field ">
                    <label htmlFor={`set${groupIndex}`}>Set:</label>
                    <InputText id={`set${groupIndex}`} type="number" name="set" value={group.set} onChange={(e) => handleGroupChange(groupIndex, e)} />
                  </div>
                  <div className="p-field ">
                    <label htmlFor={`rest${groupIndex}`}>Rest (seconds):</label>
                    <InputText id={`rest${groupIndex}`} type="number" name="rest" value={group.rest} onChange={(e) => handleGroupChange(groupIndex, e)} />
                  </div>
                </div>
                <h3>Exercises</h3>
                <div className="tabview-container responsive-tabview-container">
                  <TabView onTabClose={(e) => handleTabClose(e, groupIndex)}  scrollable >
                    {group.exercises.map((exercise, exerciseIndex) => (
                      
                      <TabPanel 
                        // key={`group-${groupIndex}-exercise-${exerciseIndex}`}
                        key={exercise.id} // Utiliza el ID único generado para cada ejercicio
                        header={exercise.exercise.name || 'No Exercise'} 
                        closable
                        
                      >
                        <>
                        </>
                        <div className="p-fluid exercise">
                          <div className="p-field">
                            <label htmlFor={`exerciseDropdown${groupIndex}-${exerciseIndex}`}>Exercise:</label>
                            <Dropdown 
                              id={`exerciseDropdown${groupIndex}-${exerciseIndex}`} 
                              value={exercise.exercise.id} 
                              options={exercises} 
                              onChange={(e) => handleExerciseDropdownChange(groupIndex, exerciseIndex, e)} 
                              filter 
                              filterBy="label,exerciseType" 
                              itemTemplate={exerciseItemTemplate}
                              required 
                              placeholder="Select an exercise" 
                            />
                          </div>
                          {Object.keys(exercise).map((property, propertyIndex) => (
                            property !== 'exercise' && 
                            property !== 'completedNotAsPlanned' && 
                            property !== 'id' && 
                            property !== 'multimedia' && 
                            exercise[property] !== '' && 
                            property !== 'rpe' && 
                            property !== 'comments' && 
                            property !== 'completed' && (
                              <div key={`prop-${groupIndex}-${exerciseIndex}-${propertyIndex}`} className="p-field">
                                <label htmlFor={`${property}${groupIndex}-${exerciseIndex}`}>
                                  {property.charAt(0).toUpperCase() + property.slice(1)}:
                                </label>
                                <IconField>
                                  <InputText
                                    id={`${property}${groupIndex}-${exerciseIndex}`}
                                    name={property}
                                    value={exercise[property]}
                                    onChange={(e) => handlePropertyChange(groupIndex, exerciseIndex, property, e.target.value)}
                                  />
                                  <InputIcon
                                    className="pi pi-times input-icon-button"
                                    tooltip='Remove property'
                                    onClick={() => handleRemoveProperty(groupIndex, exerciseIndex, property)}
                                  />
                                </IconField>
                              </div>
                            )
                          ))}
                          <div className="p-field">
                            <label htmlFor={`addProperty${groupIndex}-${exerciseIndex}`}>Add Property:</label>
                            <Dropdown
                              filter={true}
                              id={`addProperty${groupIndex}-${exerciseIndex}`}
                              options={getAvailableProperties(exercise).map(prop => ({ label: prop.charAt(0).toUpperCase() + prop.slice(1), value: prop }))}
                              onChange={(e) => handleAddProperty(groupIndex, exerciseIndex, e)}
                              placeholder="Select a property"
                            />
                          </div>
                        </div>
                      </TabPanel>
                    ))}
                  </TabView>
                </div>
                <div className="flex align-items-center justify-content-center">
                <Button type="button" label="Add Exercise" icon="pi pi-plus" onClick={() => handleAddExercise(groupIndex)} className="p-button-rounded p-button-success text-center" />
              </div>
              </div>
            </Fieldset>
          </Card>
        ))}
        </div>
        </Card>
      </div>
      
      <div className="actions-section responsive-actions-section">
      <Button type="button" label="Undo Delete" icon="pi pi-undo" onClick={handleUndoDelete} className="p-button-rounded p-button-warning p-button-lg responsive-button" disabled={!deletedGroup} /> {/* Botón Deshacer */}
          <Button type="button" label="Clear Plan" icon="pi pi-trash" onClick={handleClearPlan} className="p-button-rounded p-button-danger p-button-lg responsive-button" />
          <Button type="button" label="Add Group" icon="pi pi-plus" onClick={handleAddGroup} className="p-button-rounded p-button-info p-button-lg responsive-button" />
          <Button type="submit" label={isEdit ? 'Edit Plan' : 'Create Plan'} icon="pi pi-check" className="p-button-rounded p-button-success p-button-lg responsive-button" onClick={handleSubmit}/>
      </div>
      </div>
    </div>
  );
};

export default CreatePlan;
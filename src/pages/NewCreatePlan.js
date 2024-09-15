import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { useNavigate } from 'react-router-dom';
import { InputNumber } from 'primereact/inputnumber';
import { Dialog } from 'primereact/dialog';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Toast } from 'primereact/toast';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Card } from 'primereact/card';
import { InputTextarea } from 'primereact/inputtextarea';
import { fetchWorkoutInstance, submitPlan } from '../services/workoutService';
import { UserContext } from '../utils/UserContext';
import { useToast } from '../utils/ToastContext';
import { useSpinner } from '../utils/GlobalSpinner';
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs

const propertyList = [
  { name: 'Repetitions', key: 'repetitions' },
  { name: 'Sets', key: 'sets' },
  { name: 'Time (seconds)', key: 'time' },
  { name: 'Weight (lbs)', key: 'weight' },
  { name: 'Rest Interval (seconds)', key: 'restInterval' },
  { name: 'Tempo', key: 'tempo' },
  { name: 'Difficulty', key: 'difficulty' },
  { name: 'Duration', key: 'duration' },
  { name: 'Distance', key: 'distance' },
];

const apiUrl = process.env.REACT_APP_API_URL;

const NewCreatePlan = ({ isEdit }) => {
  const { planId } = useParams();
  const { user } = useContext(UserContext);
  const showToast = useToast();
  const { setLoading } = useSpinner();

  const [deletedGroup, setDeletedGroup] = useState(null);
  const [deletedGroupIndex, setDeletedGroupIndex] = useState(null);

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
      status: '',
      groups: []
    };
  });

  useEffect(() => {
    if (!isEdit) {
      localStorage.setItem('unsavedPlan', JSON.stringify(plan));
    }
  }, [plan, isEdit]);

  const navigate = useNavigate();
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [showExerciseDialog, setShowExerciseDialog] = useState(false);
  const [showPropertyDialog, setShowPropertyDialog] = useState(false);
  const [exercises, setExercises] = useState([]);
  const toast = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const fetchPlanDetails = async () => {
      if (isEdit && planId) {
        setLoading(true);
        try {
          const data = await fetchWorkoutInstance(planId);
          setPlan(data);
        } catch (error) {
          showToast('error', 'Error fetching plan details', `${error.message}`);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchPlanDetails();
  }, [isEdit, planId, setLoading, setPlan, showToast]);

  useEffect(() => {
    fetch(`${apiUrl}/exercise`)
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json();
          console.log(errorData);
          throw new Error(errorData.message || 'Something went wrong');
        }
        const data = await response.json();
        setExercises(data.filter(exercise => exercise.exerciseType !== null));
      })
      .catch(error => showToast('error', 'Error fetching exercises', `${error.message}`));
  }, [showToast]);

  const addGroup = () => {
    const newGroup = {
      set: '',
      rest: '',
      groupNumber: plan.groups.length + 1,
      exercises: []
    };
    setPlan({ ...plan, groups: [...plan.groups, newGroup] });
  };

  const removeGroup = (index) => {
    const groupToRemove = plan.groups[index];
    const newGroups = plan.groups.filter((_, idx) => idx !== index);
    newGroups.forEach((group, idx) => {
      group.groupNumber = idx + 1;
    });
    setDeletedGroup(groupToRemove);
    setDeletedGroupIndex(index);
    setPlan({ ...plan, groups: newGroups });
    showToast('info', 'Group Removed', 'The group has been removed');
  };

  const handleUndoDelete = () => {
    if (deletedGroup !== null && deletedGroupIndex !== null) {
      const newGroups = [...plan.groups];
      newGroups.splice(deletedGroupIndex, 0, deletedGroup);
      newGroups.forEach((group, idx) => {
        group.groupNumber = idx + 1;
      });
      setPlan({ ...plan, groups: newGroups });
      setDeletedGroup(null);
      setDeletedGroupIndex(null);
    }
  };

  const clearPlan = () => {
    confirmDialog({
      message: 'Are you sure you want to clear the entire workout plan?',
      header: 'Confirm Clear Plan',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
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
          status: '',
          groups: []
        });
        localStorage.removeItem('unsavedPlan');
        showToast('info', 'Plan Cleared', 'The workout plan has been cleared');
      },
    });
  };

  const openExerciseDialog = (groupIndex) => {
    setSelectedGroup(groupIndex);
    setShowExerciseDialog(true);
  };

  const addExercise = () => {
    if (selectedExercise) {
      const newExercise = {
        exercise: {
          ...selectedExercise
        },
        id: uuidv4(), // Generate unique ID
        notes: '',
      };
      const newGroups = [...plan.groups];
      newGroups[selectedGroup].exercises.push(newExercise);
      setPlan({ ...plan, groups: newGroups });
      setShowExerciseDialog(false);
      setSelectedExercise(null);
    }
  };

  const removeExercise = (groupIndex, exerciseIndex) => {
    const newGroups = [...plan.groups];
    newGroups[groupIndex].exercises.splice(exerciseIndex, 1);
    setPlan({ ...plan, groups: newGroups });
  };

  const openPropertyDialog = (groupIndex, exerciseIndex) => {
    setSelectedGroup(groupIndex);
    setSelectedExercise(exerciseIndex);
    setShowPropertyDialog(true);
  };

  const addProperty = (property) => {
    const newGroups = [...plan.groups];
    const exercise = newGroups[selectedGroup].exercises[selectedExercise];
    if (!exercise[property.key]) {
      exercise[property.key] = '';
      setPlan({ ...plan, groups: newGroups });
    }
  };

  const removeProperty = (groupIndex, exerciseIndex, propertyKey) => {
    const newGroups = [...plan.groups];
    const exercise = newGroups[groupIndex].exercises[exerciseIndex];
    delete exercise[propertyKey];
    setPlan({ ...plan, groups: newGroups });
  };

  const updatePropertyValue = (groupIndex, exerciseIndex, propertyKey, value) => {
    const newGroups = [...plan.groups];
    const exercise = newGroups[groupIndex].exercises[exerciseIndex];
    exercise[propertyKey] = value;
    setPlan({ ...plan, groups: newGroups });
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const newGroups = Array.from(plan.groups);
    const [reorderedGroup] = newGroups.splice(result.source.index, 1);
    newGroups.splice(result.destination.index, 0, reorderedGroup);

    newGroups.forEach((group, index) => {
      group.groupNumber = index + 1;
    });

    setPlan({ ...plan, groups: newGroups });
  };

  const submitPlanClick = () => {
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
        if (!exercise.exercise.id) {
          showToast('error', 'Error', 'Each exercise must be selected.');
          return;
        }
        if (typeof exercise.id === 'string') {
          exercise.id = 0;
        }
      }
    }

    // Create a clean version of the plan object
    const cleanPlan = JSON.parse(JSON.stringify({
      ...plan,
      groups: plan.groups.map(group => ({
        ...group,
        exercises: group.exercises.map(exercise => ({
          ...exercise,
          exercise: {
            id: exercise.exercise.id,
            name: exercise.exercise.name
          }
        }))
      }))
    }));

    confirmDialog({
      message: isEdit ? 'Are you sure you want to edit this plan?' : 'Are you sure you want to create this plan?',
      header: 'Confirm Submission',
      icon: 'pi pi-exclamation-triangle',
      accept: () => fetchSubmit(cleanPlan),
    });
  };

  const fetchSubmit = async (cleanPlan) => {
    try {
      const result = await submitPlan(cleanPlan, planId, isEdit);
      if (isEdit) {
        showToast('success', 'Plan updated!', `You have updated the plan ${cleanPlan.workout.planName} successfully!`);
      } else {
        showToast('success', 'Plan created!', `You have created the plan ${cleanPlan.workout.planName} successfully!`);
      }
      localStorage.removeItem('unsavedPlan');
      navigate(-1);
    } catch (error) {
      console.log(error);
      showToast('error', 'Something went wrong!', error.message);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setIsUploading(true);
      try {
        const planFromImage = await getPlanFromImage(file);
        setPlan(planFromImage);
        showToast('success', 'Plan imported!', 'The workout plan has been imported from the image successfully.');
      } catch (error) {
        showToast('error', 'Error importing plan', error.message);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const getPlanFromImage = async (imageFile) => {
    // Create a FormData object to send the image file
    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('purpose', 'plan_extraction');
  
    // Set up the API request
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
      },
      body: formData,
    });
  
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error.message || 'Error processing image');
    }
  
    const data = await response.json();
    // Assuming the API returns the plan object in the response
    return data.plan;
  };
  
  return (
    <div className="workout-plan-builder p-4 ">
      <Toast ref={toast} />
      <ConfirmDialog />

      <Card className="mb-4">
        <div className="flex flex-column md:flex-row align-items-center justify-content-between">
          <div className="w-full md:w-6 mb-3 md:mb-0">
            <label htmlFor="plan-name" className="block text-lg font-medium mb-2">
              Plan Name
            </label>
            <InputText
              id="plan-name"
              value={plan.workout.planName}
              onChange={(e) => setPlan({ ...plan, workout: { ...plan.workout, planName: e.target.value } })}
              className="w-full"
            />
          </div>
          <div className="w-full md:w-6 flex justify-content-end">
            <Button
                label="Import from Image"
                icon="pi pi-upload"
                onClick={() => document.getElementById('image-upload-input').click()}
                className="mr-2"
                disabled={isUploading}
            />
            <input
                type="file"
                id="image-upload-input"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageUpload}
            />
            <Button label="Add Group" icon="pi pi-plus" onClick={addGroup} className="mr-2" />
            <Button label="Undo Delete" icon="pi pi-undo" onClick={handleUndoDelete} className="p-button-info responsive-button mr-2" disabled={!deletedGroup} />
            <Button label="Clear Plan" icon="pi pi-trash" onClick={clearPlan} className="p-button-danger" />
          </div>
        </div>
      </Card>

      <Card className="mb-4">
        <label htmlFor="personalized-notes" className="block text-sm font-medium mb-1">Personalized Notes</label>
        <InputTextarea id="personalized-notes" value={plan.personalizedNotes} onChange={(e) => setPlan({ ...plan, personalizedNotes: e.target.value })} rows={3} className="w-full" />
      </Card>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="groups" direction="horizontal">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="grid">
              {plan.groups.map((group, groupIndex) => (
                <Draggable key={group.groupNumber} draggableId={`group-${group.groupNumber}`} index={groupIndex}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`col-12 md:col-6 lg:col-4 xl:col-3 p-2 ${snapshot.isDragging ? 'opacity-50' : ''}`}
                      style={{
                        ...provided.draggableProps.style,
                        transition: snapshot.isDropAnimating ? 'all 0.3s ease' : undefined,
                      }}
                    >
                      <Card className="h-full">
                        <div className="flex justify-content-between align-items-center mb-3">
                          <h3 className="text-xl m-0">Group {group.groupNumber}</h3>
                          <Button icon="pi pi-trash" className="p-button-danger p-button-text" onClick={() => removeGroup(groupIndex)} />
                        </div>
                        <div className="grid mb-3">
                          <div className="col-6">
                            <label htmlFor={`group-${group.groupNumber}-set`} className="block text-sm font-medium mb-1">Set</label>
                            <InputNumber id={`group-${group.groupNumber}-set`} value={group.set} onValueChange={(e) => {
                              const newGroups = [...plan.groups];
                              newGroups[groupIndex].set = e.value;
                              setPlan({ ...plan, groups: newGroups });
                            }} min={0} />
                          </div>
                          <div className="col-6">
                            <label htmlFor={`group-${group.groupNumber}-rest`} className="block text-sm font-medium mb-1">Rest (seconds)</label>
                            <InputNumber id={`group-${group.groupNumber}-rest`} value={group.rest} onValueChange={(e) => {
                              const newGroups = [...plan.groups];
                              newGroups[groupIndex].rest = e.value;
                              setPlan({ ...plan, groups: newGroups });
                            }} min={0} />
                          </div>
                        </div>
                        {group.exercises.map((exercise, exerciseIndex) => (
                          <div key={exercise.id} className="mb-3 p-3 border-1 border-gray-200 border-round">
                            <div className="flex justify-content-between align-items-center mb-2">
                              <h4 className="text-lg m-0">{exercise.exercise.name}</h4>
                              <div>
                                <Button
                                  icon="pi pi-plus"
                                  className="p-button-text p-button-sm mr-2"
                                  onClick={() => openPropertyDialog(groupIndex, exerciseIndex)}
                                />
                                <Button
                                  icon="pi pi-trash"
                                  className="p-button-danger p-button-text p-button-sm"
                                  onClick={() => removeExercise(groupIndex, exerciseIndex)}
                                />
                              </div>
                            </div>
                            <div className="grid">
                              {Object.entries(exercise).map(([key, value]) => {
                                if (key !== 'exercise' && key !== 'id' && value !== null && key !== 'notes') {
                                  return (
                                    <div key={key} className="col-12 md:col-6 lg:col-4 mb-2">
                                      <div className="flex flex-column">
                                        <label className="mb-1">{propertyList.find(p => p.key === key)?.name || key}</label>
                                        <div className="flex align-items-center">
                                          <InputText
                                            value={exercise[key]}
                                            onChange={(e) => updatePropertyValue(groupIndex, exerciseIndex, key, e.target.value)}
                                            className="w-full"
                                          />
                                          <Button
                                            icon="pi pi-times"
                                            className="p-button-danger p-button-text p-button-sm ml-2"
                                            onClick={() => removeProperty(groupIndex, exerciseIndex, key)}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              })}
                            </div>
                            <div className="mt-2">
                              <label htmlFor={`exercise-${exercise.id}-notes`} className="block text-sm font-medium mb-1">Notes</label>
                              <InputTextarea
                                id={`exercise-${exercise.id}-notes`}
                                value={exercise.notes}
                                onChange={(e) => updatePropertyValue(groupIndex, exerciseIndex, 'notes', e.target.value)}
                                rows={2}
                                className="w-full"
                              />
                            </div>
                          </div>
                        ))}
                        <Button label="Add Exercise" icon="pi pi-plus" className="p-button-text" onClick={() => openExerciseDialog(groupIndex)} />
                      </Card>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <div className="flex justify-content-end mt-4">
        <Button label={isEdit ? 'Edit Plan' : 'Create Plan'} icon="pi pi-check" onClick={submitPlanClick} className="p-button-success" />
      </div>

      <Dialog header="Add Exercise" visible={showExerciseDialog} onHide={() => setShowExerciseDialog(false)} className="w-30rem">
        <Dropdown
          value={selectedExercise}
          options={exercises}
          onChange={(e) => {
            setSelectedExercise(e.value)
          }}
          optionLabel="name"
          filter
          filterBy="name"
          placeholder="Select an Exercise"
          className="w-full mb-3"
        />
        <Button label="Add Exercise" icon="pi pi-plus" onClick={addExercise} disabled={!selectedExercise} />
      </Dialog>

      <Dialog header="Add Property" visible={showPropertyDialog} onHide={() => setShowPropertyDialog(false)} className="w-30rem">
        {propertyList.map((property) => (
          <div key={property.key} className="flex justify-content-between align-items-center mb-2">
            <span>{property.name}</span>
            <Button
              icon="pi pi-plus"
              className="p-button-text p-button-sm"
              onClick={() => addProperty(property)}
              disabled={plan.groups[selectedGroup]?.exercises[selectedExercise]?.hasOwnProperty(property.key) && plan.groups[selectedGroup]?.exercises[selectedExercise][property.key] !== null}
            />
          </div>
        ))}
      </Dialog>
    </div>
  );
};

export default NewCreatePlan;
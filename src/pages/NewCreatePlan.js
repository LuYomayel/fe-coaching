import React, { useState, useEffect, useRef, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { useNavigate } from 'react-router-dom';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Card } from 'primereact/card';
import { InputTextarea } from 'primereact/inputtextarea';
import { createExercises, fetchWorkoutInstance, submitPlan } from '../services/workoutService';
import { UserContext } from '../utils/UserContext';
import { useToast } from '../utils/ToastContext';
import { useSpinner } from '../utils/GlobalSpinner';
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs
import { useConfirmationDialog } from '../utils/ConfirmationDialogContext';
import { useIntl, FormattedMessage } from 'react-intl'; // Agregar este import
import '../styles/CreatePlan.css';
import { FaGripVertical } from 'react-icons/fa'; // Importa el ícono de "handle"
import { useTheme } from '../utils/ThemeContext';
import { extractYouTubeVideoId } from '../utils/UtilFunctions';
import { fetchCoachExercises } from '../services/exercisesService';
import { InputNumber } from 'primereact/inputnumber';

const NewCreatePlan = ({ isEdit }) => {
  const intl = useIntl();
  const { state} = useLocation();
  const [videoDialogVisible, setVideoDialogVisible] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const changeToTemplate = state?.changeToTemplate;
  const propertyList = [
    { name: intl.formatMessage({ id: 'exercise.properties.sets' }), key: 'sets', default: true },
    { name: intl.formatMessage({ id: 'exercise.properties.reps' }), key: 'repetitions', default: true },
    { name: intl.formatMessage({ id: 'exercise.properties.time' }), key: 'time', default: false },
    { name: intl.formatMessage({ id: 'exercise.properties.weight' }), key: 'weight', default: false },
    { name: intl.formatMessage({ id: 'exercise.properties.restInterval' }), key: 'restInterval', default: false },
    { name: intl.formatMessage({ id: 'exercise.properties.tempo' }), key: 'tempo', default: false },
    { name: intl.formatMessage({ id: 'exercise.properties.difficulty' }), key: 'difficulty', default: false },
    { name: intl.formatMessage({ id: 'exercise.properties.duration' }), key: 'duration', default: false },
    { name: intl.formatMessage({ id: 'exercise.properties.distance' }), key: 'distance', default: false },
  ];
  const navigate = useNavigate();
  const { planId } = useParams();
  const { user, coach } = useContext(UserContext);
  const showToast = useToast();
  const { setLoading } = useSpinner();
  const { showConfirmationDialog } = useConfirmationDialog();
  const [deletedGroup, setDeletedGroup] = useState(null);
  const [deletedGroupIndex, setDeletedGroupIndex] = useState(null);
  const { isDarkMode } = useTheme();
  const [ newExercises, setNewExercises] = useState([]);
  const [plan, setPlan] = useState(() => {
    const savedPlan = localStorage.getItem('unsavedPlan');
    return savedPlan && !isEdit ? JSON.parse(savedPlan) : {
    // return savedPlan ? JSON.parse(savedPlan) : {
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
    // Si alguien llega a ver esto alguna vez, no se por que tengo este if
    if (!isEdit) {
      localStorage.setItem('unsavedPlan', JSON.stringify(plan));
    }
  }, [plan, isEdit]);

  const [editingGroupName, setEditingGroupName] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [showExerciseDialog, setShowExerciseDialog] = useState(false);
  const [showPropertyDialog, setShowPropertyDialog] = useState(false);
  const [exercises, setExercises] = useState([]);
  const toast = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [exerciseCounter, setExerciseCounter] = useState(0);

    useEffect(() => {
        setLoading(isUploading)
    }, [isUploading, setLoading]);

  useEffect(() => {
    const fetchPlanDetails = async () => {
      if (isEdit && planId) {
        setLoading(true);
        try {
          const {data} = await fetchWorkoutInstance(planId);
          data.groups.sort((groupA, groupB) => groupA.groupNumber - groupB.groupNumber);
          
          // Iterate through each group
          data.groups.forEach(group => {
            // Iterate through each exercise in the group
            group.exercises.forEach(exercise => {
              // Check and modify the properties
              if (exercise) {
                const properties = ['sets', 'repetitions', 'tempo', 'time', 'weight', 
                                  'restInterval', 'difficulty', 'duration', 'distance'];
                                  
                properties.forEach(prop => {
                  exercise[prop] = exercise[prop] === '' ? null : exercise[prop];
                });
              }
            });
          });

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
    const cargarEjercicios = async () => {
      try {
        const { data } = await fetchCoachExercises(coach.id);
        const ejerciciosGuardados = localStorage.getItem('newExercises');
        const ejerciciosFiltrados = data.filter(ejercicio => ejercicio.exerciseType !== null);

        if (ejerciciosGuardados) {
          const ejerciciosParsed = JSON.parse(ejerciciosGuardados);
          setNewExercises(ejerciciosParsed);
          setExercises([...ejerciciosFiltrados, ...ejerciciosParsed]);
        } else {
          setExercises(ejerciciosFiltrados);
        }

      } catch (error) {
        showToast('error', 'Error fetching exercises', `${error.message}`);
      }
    };

    cargarEjercicios();
  }, [showToast]);

  const addExerciseGroup = () => {
    const newGroup = {
      name: '',
      groupNumber: plan.groups.length + 1,
      exercises: [],
      isRestPeriod: false,
      restDuration: 0
    };
    setPlan({ ...plan, groups: [...plan.groups, newGroup] });
  };

  const addRestPeriod = () => {
    const newGroup = {
      name: intl.formatMessage({ id: 'plan.group.restPeriod' }),
      groupNumber: plan.groups.length + 1,
      exercises: [],
      isRestPeriod: true,
      restDuration: 0
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
    groupToRemove.name ? 
      showToast('info', intl.formatMessage({ id: 'plan.group.removed' }), intl.formatMessage({ id: 'plan.group.removed.message.name' }, { name: groupToRemove.name }))
        :
      showToast('info', intl.formatMessage({ id: 'plan.group.removed' }), intl.formatMessage({ id: 'plan.group.removed.message.number' }, { number: groupToRemove.groupNumber }));
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
    showConfirmationDialog({
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

  const addExercise = (groupIndex) => {

    if (selectedExercise?.[groupIndex]) {
      const newExercise = {
        exercise: {
          ...selectedExercise[groupIndex]
        },
        id: exerciseCounter,
        notes: '',
        sets: propertyList.find(prop => prop.key === 'sets').default ? '' : null,
        repetitions: propertyList.find(prop => prop.key === 'repetitions').default ? '' : null,
        weight: propertyList.find(prop => prop.key === 'weight').default ? '' : null,
        time: propertyList.find(prop => prop.key === 'time').default ? '' : null,
        tempo: propertyList.find(prop => prop.key === 'tempo').default ? '' : null,
        distance: propertyList.find(prop => prop.key === 'distance').default ? '' : null,
        restInterval: propertyList.find(prop => prop.key === 'restInterval').default ? '' : null,
        difficulty: propertyList.find(prop => prop.key === 'difficulty').default ? '' : null,
        duration: propertyList.find(prop => prop.key === 'duration').default ? '' : null,
      };
      const newGroups = [...plan.groups];
      newGroups[groupIndex].exercises.push(newExercise);
      setPlan({ ...plan, groups: newGroups });
      setExerciseCounter(exerciseCounter + 1);
      setShowExerciseDialog(false);
      setSelectedExercise((prev) => ({...prev, [groupIndex]: null}));
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

  const updatePropertyValue = (groupIndex, exerciseIndex, key, value) => {
    const newGroups = [...plan.groups];
    newGroups[groupIndex].exercises[exerciseIndex][key] = value;
    setPlan({ ...plan, groups: newGroups });
  };

  const updateGroupName = (groupIndex, value) => {
    const newGroups = [...plan.groups];
    newGroups[groupIndex].name = value;
    setPlan({ ...plan, groups: newGroups });
  };

  const editGroupName = (groupIndex) => {
    // Now i need to enable the input text and the buttons without a dialog
    setEditingGroupName(prev => ({...prev, [groupIndex]: true}));    
  };

  const saveGroupName = (groupIndex) => {
    setEditingGroupName(prev => ({...prev, [groupIndex]: false}));
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination } = result;

    if (source.droppableId === 'groups' && destination.droppableId === 'groups') {
      // Mover grupos
      const newGroups = Array.from(plan.groups);
      const [movedGroup] = newGroups.splice(source.index, 1);
      newGroups.splice(destination.index, 0, movedGroup);

      // Actualizar el número de grupo
      newGroups.forEach((group, index) => {
        group.groupNumber = index + 1;
      });

      setPlan({ ...plan, groups: newGroups });
    } else {
      // Mover ejercicios
      const sourceGroupIndex = parseInt(source.droppableId.split('-')[1]);
      const destinationGroupIndex = parseInt(destination.droppableId.split('-')[1]);

      const newGroups = Array.from(plan.groups);
      const [movedExercise] = newGroups[sourceGroupIndex].exercises.splice(source.index, 1);
      newGroups[destinationGroupIndex].exercises.splice(destination.index, 0, movedExercise);

      // Actualizar el índice de cada ejercicio en ambos grupos
      newGroups[sourceGroupIndex].exercises.forEach((exercise, index) => {
        exercise.rowIndex = index;
      });
      newGroups[destinationGroupIndex].exercises.forEach((exercise, index) => {
        exercise.rowIndex = index;
      });

      setPlan({ ...plan, groups: newGroups });
    }
  };


  const submitPlanClick = () => {
    if (!plan.workout.planName.trim()) {
      showToast('error', 'Error', intl.formatMessage({ id: 'plan.error.nameRequired' }));
      return;
    }

    if (plan.groups.length === 0) {
      showToast('error', 'Error', intl.formatMessage({ id: 'plan.error.groupRequired' }));
      return;
    }

    for (const group of plan.groups) {
      if (!group.isRestPeriod && group.exercises.length === 0) {
        showToast('error', 'Error', intl.formatMessage({ id: 'plan.error.exerciseRequired' }));
        return;
      }

      if (group.isRestPeriod && group.restDuration === 0) {
        showToast('error', 'Error', intl.formatMessage({ id: 'plan.error.restDurationRequired' }));
        return;
      }

      if(!group.isRestPeriod) {
        for (const exercise of group.exercises) {
          if (!exercise.exercise.id) {
            showToast('error', 'Error', intl.formatMessage(
              { id: 'plan.error.exerciseSelect' }, 
              { name: exercise.exercise.name }
            ));
            return;
          }
        }
      }
    }
    let contador = 0;  
    if (changeToTemplate) {
      plan.isTemplate = true;
    }
    // Create a clean version of the plan object
    const cleanPlan = JSON.parse(JSON.stringify({
      ...plan,
      workout: {
        ...plan.workout,
        coach: {
          id: '',
          user: {
            id: user.userId
          }
        }
      },
      groups: plan.groups.map((group) => {

        return {
          ...group,
          exercises: group.exercises.map((exercise) => {
            return {
              ...exercise,
              rowIndex: contador++,
          exercise: {
            id: exercise.exercise.id,
                name: exercise.exercise.name
              }
            }
          })
        }
      })
    }));

    showConfirmationDialog({
      message: intl.formatMessage({ 
        id: isEdit ? 'plan.dialog.confirmEdit' : 'plan.dialog.confirmCreate' 
      }),
      header: intl.formatMessage({ 
        id: isEdit ? 'plan.edit.title' : 'plan.create.title' 
      }),
      icon: 'pi pi-exclamation-triangle',
      accept: () => fetchSubmit(cleanPlan),
    });
  };

  const fetchSubmit = async (cleanPlan) => {
    try {
      if (newExercises.length > 0) {
        const {data} = await createExercises(newExercises);
        setNewExercises([]);
        // Actualizar cleanPlan con los ejercicios recién creados
        cleanPlan.groups = cleanPlan.groups.map(group => ({
          ...group,
          exercises: group.exercises.map(exercise => {
            // Buscar si el ejercicio actual corresponde a uno recién creado
            const createdExercise = data.find(
              created => created.name.toLowerCase() === exercise.exercise.name.toLowerCase()
            );
            
            if (createdExercise) {
              // Si encontramos coincidencia, actualizamos con el ejercicio creado
              return {
                ...exercise,
                exercise: {
                  id: createdExercise.id,
                  name: createdExercise.name
                }
              };
            }
            return exercise;
          })
        }));
        const response = await submitPlan(cleanPlan, planId, changeToTemplate ? false : isEdit);
        if(response.error){
          showToast('error', 'Error', response.message);
        }
      } else {
        const {data} = await submitPlan(cleanPlan, planId, changeToTemplate ? false : isEdit);
        if(data.error){
          showToast('error', 'Error', data.message);
        }
      }
      if (isEdit) {
        showToast('success', intl.formatMessage({ id: 'coach.plan.success.updated' }), intl.formatMessage({ id: 'coach.plan.success.updated.message' }, { name: cleanPlan.workout.planName }));
      } else {
        showToast('success', intl.formatMessage({ id: 'coach.plan.success.created' }), intl.formatMessage({ id: 'coach.plan.success.created.message' }, { name: cleanPlan.workout.planName }));
      }
      localStorage.removeItem('unsavedPlan');
      localStorage.removeItem('newExercises');
      navigate(-1);
    } catch (error) {
      console.log(error);
      showToast('error', 'Something went wrong!', error.message);
    }
  };

  const handleCreateNewExercise = (groupIndex) => {
    // Obtener el texto del filtro del Dropdown    
    const filterInput = document.querySelector('.p-dropdown-filter');
    const exerciseName = filterInput ? filterInput.value : '';

    if (exerciseName) {
      // Crear nuevo ejercicio temporal
      const newExercise = {
        id: uuidv4(),
        name: exerciseName,
        description: '',
        exerciseType: 'OTHER', // Tipo por defecto
        videoUrl: '',
        isTemporary: true, // Flag para identificar ejercicios temporales
        coachId: coach.id
      };

      // Actualizar el estado de nuevos ejercicios
      setNewExercises(prevExercises => {
        const updatedExercises = [...prevExercises, newExercise];
        localStorage.setItem('newExercises', JSON.stringify(updatedExercises)); // Guardar en local storage
        return updatedExercises;
      });

      // Actualizar el estado de ejercicios
      setExercises(prevExercises => [...prevExercises, newExercise]);

      // Seleccionar el nuevo ejercicio
      const newSelectedExercises = {...selectedExercise};
      newSelectedExercises[groupIndex] = newExercise;
      setSelectedExercise(newSelectedExercises);

      // Mostrar un toast con el nuevo ejercicio
      showToast('info', 'Nuevo ejercicio creado', `Se ha creado el ejercicio: ${exerciseName}`);
    } else {
      showToast('error', 'Error', 'No se pudo obtener el nombre del ejercicio');
    }
  };
  
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
        setIsUploading(true);
        try {
            const planFromImage = await getPlanFromImage(file);

            // Array para almacenar nuevos ejercicios
            setNewExercises([]);

            // Filtramos los grupos y sus ejercicios
            const newGroups = planFromImage.groups.reduce((acc, group) => {
                const exercisesToAdd = group.exercises.map(exercise => {
                    const existingExercise = exercises.find(e => e.name.toLowerCase() === exercise.exercise.name.toLowerCase());
                    
                    if (!existingExercise) {
                        // Crear nuevo ejercicio temporal
                        const newExercise = {
                            id: uuidv4(),
                            name: exercise.exercise.name,
                            description: '',
                            exerciseType: 'OTHER', // Tipo por defecto
                            videoUrl: '',
                            isTemporary: true, // Flag para identificar ejercicios temporales
                            coachId: coach.id
                        };
                        setNewExercises(prevExercises => [...prevExercises, newExercise]);
                        return {
                            id: uuidv4(),
                            notes: exercise.notes,
                            ...exercise,
                            exercise: newExercise
                        };
                    }
                    
                    return {
                        id: uuidv4(),
                        notes: exercise.notes,
                        ...exercise,
                        exercise: {...existingExercise}
                    };
                });

                const newGroup = {
                    set: group.set,
                    rest: group.rest,
                    groupNumber: group.groupNumber,
                    exercises: exercisesToAdd
                };
                acc.push(newGroup);
                return acc;
            }, []);

            // Actualizamos los grupos en el plan
            planFromImage.groups = newGroups;

            setPlan(() => ({
                isTemplate: true,
                instanceName: '',
                ...planFromImage
            }));

            // Actualizamos el estado de ejercicios con los nuevos
            setExercises(prevExercises => [...prevExercises, ...newExercises]);

            // Mostramos un toast con los nuevos ejercicios
            if (newExercises.length > 0) {
                const message = `New exercises to be created: ${newExercises.map(e => e.name).join(', ')}`;
                showToast('info', 'New exercises detected', message, true);
            }

            showToast('success', 'Plan imported!', 'The workout plan has been imported from the image successfully.');
        } catch (error) {
            showToast('error', 'Error importing plan', error.message, true);
            // Clean up the input
            event.target.value = null;
          } finally {
            event.target.value = null;
            setIsUploading(false);
        }
    }
};

  const getPlanFromImage = async (imageFile) => {
    // Create a FormData object to send the image file
    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('purpose', 'plan_extraction');
    console.log(formData);
    // Set up the API request
    const response = await fetch(`${process.env.REACT_APP_API_URL}/workout/import-plan-from-image`, {
      method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
    //   },
      body: formData,
    });
    
    const data = await response.json();
    // Assuming the API returns the plan object in the response
    if(data.error){
      throw new Error(data.message);
    }
    return data.data;
  };

  const handleVideoClick = (url) => {
    try {
      const videoId = extractYouTubeVideoId(url);
      const embedUrl = `https://www.youtube.com/embed/${videoId}`;
      setSelectedVideo(embedUrl);
      setVideoDialogVisible(true);
    } catch (error) {
      showToast('error', 'Error', error.message);
    }
  };
  return (
    <div className="workout-plan-builder p-4 ">
      <Toast ref={toast} />

      <Card className="mb-4">
        <div className="flex flex-column md:flex-row align-items-center justify-content-between">
          <div className="w-full md:w-6 mb-3 md:mb-0">
            <label htmlFor="plan-name" className="block text-lg font-medium mb-2">
              <FormattedMessage id="plan.name" />
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
                label={intl.formatMessage({ id: 'plan.buttons.import' })}
                icon="pi pi-upload"
                onClick={() => document.getElementById('image-upload-input').click()}
                className="mr-2"
                disabled={isUploading}
                loading={isUploading}
            />
            <input
                type="file"
                id="image-upload-input"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageUpload}
            />
            <Button 
              label={intl.formatMessage({ id: 'plan.buttons.undoDelete' })}
              icon="pi pi-undo" 
              onClick={handleUndoDelete} 
              className="p-button-info responsive-button mr-2" 
              disabled={!deletedGroup} 
            />
            <Button 
              label={intl.formatMessage({ id: 'plan.buttons.clearPlan' })}
              icon="pi pi-trash" 
              onClick={clearPlan} 
              className="p-button-danger" 
            />
          </div>
        </div>
      </Card>

      <Card className="mb-4">
        <label htmlFor="personalized-notes" className="block text-sm font-medium mb-1">
          <FormattedMessage id="plan.notes" />
        </label>
        <InputTextarea rows={1} id="personalized-notes" value={plan.personalizedNotes ? plan.personalizedNotes : ''} onChange={(e) => setPlan({ ...plan, personalizedNotes: e.target.value })}  className="w-full" />
      </Card>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="groups" direction="horizontal" type="group">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="grid">
              {plan.groups.map((group, groupIndex) => (
                <Draggable key={`group-${group.groupNumber}`} draggableId={`group-${group.groupNumber}`} index={groupIndex}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`col-12 md:col-6 lg:col-4 xl:col-3 p-2 ${snapshot.isDragging ? 'opacity-50' : ''}`}
                      style={{
                        ...provided.draggableProps.style,
                        transition: snapshot.isDropAnimating ? 'all 0.3s ease' : undefined,
                      }}
                    >
                      <Card className="h-full">
                        <div className="flex justify-content-between align-items-center mb-3">
                          <div className="flex align-items-center">
                            <span {...provided.dragHandleProps}>
                              <FaGripVertical className="mr-2 cursor-pointer" />
                            </span>
                            {group.isRestPeriod ? (
                              <div className="flex flex-c justify-content-between align-items-center">
                              <div>
                                <h3 className="text-xl m-0">
                                  <FormattedMessage id="plan.group.restPeriod" />
                                </h3>
                              </div>
                              </div>
                            ) : (
                              <div className="flex justify-content-between align-items-center">
                                <div className="w-4/5 pr-2">
                                  <h3 className="text-xl m-0">
                                    {editingGroupName?.[groupIndex] ? (
                                      <InputText value={group.name} onChange={(e) => updateGroupName(groupIndex, e.target.value)} />
                                    ) : (
                                      <span>{group.name ? group.name : <FormattedMessage id="plan.group.title" values={{ number: group.groupNumber }} />}</span>
                                    )}
                                  </h3>
                                </div>
                                <div className="w-1/5">
                                  {editingGroupName?.[groupIndex] ? (
                                    <Button icon="pi pi-check" raised className="p-button-text" onClick={() => saveGroupName(groupIndex)} />
                                  ) : (
                                    <Button icon="pi pi-pencil" raised className="p-button-text" onClick={() => editGroupName(groupIndex)} />
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                          <Button icon="pi pi-trash" raised className="p-button-danger p-button-text" onClick={() => removeGroup(groupIndex)} />
                        </div>
                        <Droppable droppableId={`group-${groupIndex}`} type="exercise">
                          {(provided) => (
                            <div 
                              {...provided.droppableProps} 
                              ref={provided.innerRef} 
                              className="exercise-container"
                              style={!group.isRestPeriod ? {
                                minHeight: '50px',
                                padding: '5px',
                                border: group.exercises.length === 0 ? '2px dashed #ccc' : 'none',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'stretch',
                                justifyContent: 'center',
                                backgroundColor: group.exercises.length === 0 ? (isDarkMode ? '#2a2a2a' : '#f9f9f9') : 'transparent'
                              } : {}}
                            >
                              {!group.isRestPeriod && (
                                <>
                                  {group.exercises.length === 0 && (
                                    <span style={{ color: '#999' }}>{intl.formatMessage({ id: 'plan.group.empty' })}</span> // Texto visible si está vacío
                                  )}
                                  {group.exercises
                                    .sort((a, b) => a.rowIndex - b.rowIndex)
                                    .map((exercise, exerciseIndex) => (
                                      <Draggable key={`exercise-${exercise.id}`} draggableId={`exercise-${exercise.id}`} index={exerciseIndex}>
                                        {(provided) => (
                                          <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            className="mb-3 p-2 border-1 border-gray-200 border-round"
                                            style={{
                                              ...provided.draggableProps.style,
                                              //width: '100%',
                                            }}
                                          >
                                            <div className="flex justify-content-between align-items-center mb-2">
                                              <div className="flex align-items-center">
                                                <span {...provided.dragHandleProps}>
                                                  <FaGripVertical className="mr-2 cursor-pointer" />
                                                </span>
                                                <h6 className="text-lg m-0">{exercise.exercise?.name}</h6>
                                              </div>
                                              <div className="flex align-items-center">
                                              <Button
                                                  icon="pi pi-video" 
                                                  className="p-button-text p-button-sm"
                                                  raised
                                                  tooltip={intl.formatMessage({ id: 'exercise.video.view' })}
                                                  onClick={() => {handleVideoClick(exercise.exercise?.multimedia)}}
                                                />
                                                <Button
                                                  icon="pi pi-plus"
                                                  className="p-button-text p-button-sm"
                                                  raised
                                                  onClick={() => openPropertyDialog(groupIndex, exerciseIndex)}
                                                />
                                                <Button
                                                  icon="pi pi-trash"
                                                  className="p-button-danger p-button-text p-button-sm"
                                                  raised
                                                  onClick={() => removeExercise(groupIndex, exerciseIndex)}
                                                />
                                              </div>
                                            </div>
                                            <div className="grid">
                                              {Object.entries(exercise).map(([key, value]) => {
                                                if (key !== 'exercise' && key !== 'id' && value !== null && key !== 'notes' && key !== 'rowIndex') {
                                                  return (
                                                    <div key={key} className="col-12 md:col-6 lg:col-6 mb-2">
                                                      <div className="flex flex-column">
                                                        <label className="">{propertyList.find(p => p.key === key)?.name || key}</label>
                                                        <div className="flex align-items-center">
                                                          <InputText
                                                            value={exercise[key]}
                                                            onChange={(e) => updatePropertyValue(groupIndex, exerciseIndex, key, e.target.value)}
                                                            className="w-full"
                                                          />
                                                          <Button
                                                            icon="pi pi-times"
                                                            raised
                                                            className="p-button-danger p-button-text p-button-sm"
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
                                              <label htmlFor={`exercise-${exercise.id}-notes`} className="block text-sm font-medium mb-1">
                                                <FormattedMessage id="plan.exercise.notes" />
                                              </label>
                                              <InputTextarea
                                                id={`exercise-${exercise.id}-notes`}
                                                value={exercise.notes ? exercise.notes : ''}
                                                onChange={(e) => updatePropertyValue(groupIndex, exerciseIndex, 'notes', e.target.value)}
                                                rows={1}
                                                className="w-full"
                                              />
                                            </div>
                                          </div>
                                        )}
                                      </Draggable>
                                    ))}
                                  {provided.placeholder}
                                </>
                              )}
                            </div>
                          )}
                        </Droppable>
                        {!group.isRestPeriod ? (
                          <div className="flex align-items-center">
                            <div className="w-10 mr-2">
                              <Dropdown
                                id={`exercise-dropdown-${groupIndex}`}
                                value={selectedExercise?.[groupIndex]}
                                options={exercises.length > 0 ? exercises : [{ name: `${intl.formatMessage({ id: 'common.noResults' })}`, value: null, exerciseType: null, disabled: true }]}
                                
                                optionLabel="name"
                                filter
                                filterBy="name,exerciseType"
                                filterInputAutoFocus
                                resetFilterOnHide
                                onChange={(e) => {
                                  if(e.value){
                                    const newSelectedExercises = {...selectedExercise};
                                    newSelectedExercises[groupIndex] = e.value;
                                    setSelectedExercise(newSelectedExercises);
                                  }
                                }}
                                
                                placeholder={intl.formatMessage({ id: 'plan.exercise.select' })}
                                className="w-full"
                                onHide={(e) => {
                                  const dropdown = document.querySelector(`#exercise-dropdown-button-${groupIndex}`);
                                  if(dropdown) {
                                    dropdown.setAttribute('data-p-focus', 'true');
                                    dropdown.focus();
                                  }
                                }}
                                itemTemplate={(option) => {
                                  return (
                                    <div className='flex justify-content-between align-items-center w-full' style={{gap: '1rem'}}>
                                      <div className='flex flex-column flex-grow-1'>
                                        <span>{option.name}</span>
                                        {option.exerciseType && <small className='text-xs'>{option.exerciseType}</small>}
                                      </div>
                                      <div className='flex align-items-center flex-shrink-0'>
                                        {option.isTemporary && (
                                          <Button
                                            icon="pi pi-trash"
                                            text
                                            severity="danger"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setExercises(prev => prev.filter(ex => ex.id !== option.id));
                                              setNewExercises(prev => prev.filter(ex => ex.id !== option.id));
                                              
                                              // Eliminar el ejercicio de todos los grupos donde esté
                                              setPlan(prevPlan => ({
                                                ...prevPlan,
                                                groups: prevPlan.groups.map(group => ({
                                                  ...group,
                                                  exercises: group.exercises.filter(ex => 
                                                    ex.exercise.id !== option.id && 
                                                    ex.exercise.name.toLowerCase() !== option.name.toLowerCase()
                                                  )
                                                }))
                                              }));
                                            }}
                                          />
                                        )}
                                      </div>
                                    </div>
                                  );
                                }}
                                emptyFilterMessage={
                                  <Button
                                    label={intl.formatMessage({ id: 'common.createNew' })}
                                    icon="pi pi-plus"
                                    text
                                    raised
                                    onClick={() => handleCreateNewExercise(groupIndex)}
                                  />
                                }
                                onShow={(e) => {
                                  const filterInput = document.querySelector('.p-dropdown-filter');
                                  if (filterInput) {
                                    filterInput.focus();
                                    filterInput.addEventListener('keydown', (event) => {
                                      if (event.key === 'Enter') {
                                        const emptyMessage = document.querySelector('.p-dropdown-empty-message');
                                        if (emptyMessage) {
                                          handleCreateNewExercise(groupIndex); // Llamar a la función para crear un nuevo ejercicio
                                        }
                                      }
                                    });
                                  }
                                }}
                                onFilter={(e) => {
                                  if (e.originalEvent instanceof KeyboardEvent && e.originalEvent.key === 'Enter') {
                                    e.originalEvent.preventDefault(); // Prevenir el comportamiento por defecto
                                    handleCreateNewExercise(groupIndex);
                                  }
                                }}
                              //style={{ height: '40px' }}
                            />
                            </div>
                            <div className="w-1">
                            <Button
                                id={`exercise-dropdown-button-${groupIndex}`}
                                icon="pi pi-plus"
                                raised
                                text

                                onClick={() => addExercise(groupIndex)}
                                style={{ height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="mt-2">
                                  <InputNumber 
                                    value={group.restDuration} 
                                    onChange={(e) => {
                                      const newGroups = [...plan.groups];
                                      newGroups[groupIndex].restDuration = e.value;
                                      setPlan({...plan, groups: newGroups});
                                    }}
                                    suffix={intl.formatMessage({ id: 'plan.group.restDurationSuffix' })}
                                    min={0}
                                    placeholder={intl.formatMessage({ id: 'plan.group.restDuration' })}
                            />
                          </div>
                        )}
                      </Card>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
              <div className="col-12 md:col-6 lg:col-4 xl:col-3 p-2">
                <Card className="h-full flex justify-content-center align-items-center cursor-pointer">
                  <div className="flex flex-column sm:flex-row gap-2 justify-content-center align-items-center">
                    <Button
                      raised
                      text
                      label={intl.formatMessage({ id: 'plan.group.addGroup' })}
                      icon="pi pi-plus-circle"
                      onClick={addExerciseGroup}
                      className="p-button-text w-full sm:w-auto"
                    />
                    <Button
                      raised
                      text
                      label={intl.formatMessage({ id: 'plan.group.addRest' })}
                      icon="pi pi-plus-circle"
                      onClick={addRestPeriod} 
                      className="p-button-text w-full sm:w-auto"
                    />
                  </div>
                </Card>
              </div>
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <div className="flex justify-content-end mt-2">
        <Button
          label={intl.formatMessage({
            id: isEdit ? 'plan.buttons.editPlan' : 'plan.buttons.createPlan'
          })}
          icon="pi pi-check"
          onClick={submitPlanClick}
          className="p-button-success"
        />
      </div>

      <Dialog
        header={intl.formatMessage({ id: 'plan.exercise.add' })}
        visible={showExerciseDialog}
        onHide={() => setShowExerciseDialog(false)}
        className="w-30rem"
        dismissableMask
        draggable={false}
        resizable={false}
      >
        <Dropdown
          value={selectedExercise}
          options={exercises}
          onChange={(e) => setSelectedExercise(e.value)}
          optionLabel="name"
          filter
          filterBy="name,exerciseType"
          placeholder={intl.formatMessage({ id: 'plan.exercise.select' })}
          className="w-full mb-3"
          itemTemplate={(option) => (
            <div className='flex flex-column'>
              <span>{option.name}</span>
              <small className='text-xs'>{option.exerciseType}</small>
            </div>
          )}
        />
        <Button
          label={intl.formatMessage({ id: 'plan.exercise.add' })}
          icon="pi pi-plus"
          onClick={addExercise}
          disabled={!selectedExercise}
        />
      </Dialog>

      <Dialog
        header={intl.formatMessage({ id: 'plan.exercise.property.add' })}
        draggable={false}
        resizable={false}
        dismissableMask
        visible={showPropertyDialog}
        onHide={() => setShowPropertyDialog(false)}
        className="w-30rem"
      >
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

      <Dialog
        header={intl.formatMessage({ id: 'exercise.video.view' })}
        visible={videoDialogVisible}
        style={{ width: '70vw' }}
        onHide={() => setVideoDialogVisible(false)}
        dismissableMask
        draggable={false}
        resizable={false}
        className='responsive-dialog'
      >
        <iframe
            width="100%"
            height="400"
          src={selectedVideo}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Exercise Video"
        ></iframe>
      </Dialog>
    </div>
  );
};

export default NewCreatePlan;
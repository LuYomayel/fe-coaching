import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { RadioButton } from 'primereact/radiobutton';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

import { ProgressSpinner } from 'primereact/progressspinner';
import { useIntl, FormattedMessage } from 'react-intl';

import { UserContext } from '../utils/UserContext';
import { useToast } from '../utils/ToastContext';
import { useSpinner } from '../utils/GlobalSpinner';
import { fetchWorkoutInstance, submitFeedback } from '../services/workoutService';
import FinishTrainingDialog from '../dialogs/FinishTrainingDialog';
import VideoDialog from '../dialogs/VideoDialog';
import { extractYouTubeVideoId, getYouTubeThumbnail } from '../utils/UtilFunctions';
import RpeDropdownComponent from '../components/RpeDropdown';
import '../styles/TrainingPlanStyle.css';
import { InputNumber } from 'primereact/inputnumber';

export default function TrainingPlanDetails({ setPlanDetailsVisible, setRefreshKey, isTraining = true }) {
  const { planId } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const { clientId } = state;
  const { user, client, coach } = useContext(UserContext);
  const showToast = useToast();
  const { loading, setLoading } = useSpinner();
  const intl = useIntl();

  const [plan, setPlan] = useState(null);
  const [exerciseProgress, setExerciseProgress] = useState({});
  const [videoDialogVisible, setVideoDialogVisible] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');
  const [finishDialogVisible, setFinishDialogVisible] = useState(false);
  const [completedGroups, setCompletedGroups] = useState([]);
  const [isClientTraining, setIsClientTraining] = useState(isTraining);
  const [currentCycle, setCurrentCycle] = useState(null);
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const propertyUnits = JSON.parse(localStorage.getItem('propertyUnits'));

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        setLoading(true);
        const { data } = await fetchWorkoutInstance(planId);
        if (data.status === 'completed') setIsClientTraining(false);
        data.groups.sort((groupA, groupB) => groupA.groupNumber - groupB.groupNumber);
        setPlan(data);

        setCurrentCycle(data.trainingSession?.trainingWeek?.trainingCycle || -1);

        // Initialize exerciseProgress for all exercises and sets
        const initialProgress = {};
        data.groups.forEach((group) => {
          group.exercises.forEach((exercise) => {
            const numSets = parseInt(exercise.sets) || group.set || 1;
            initialProgress[exercise.id] = {
              sets: Array.from({ length: numSets }).map(() => ({
                repetitions: exercise.repetitions || null,
                weight: exercise.weight || null,
                time: exercise.time || null,
                distance: exercise.distance || null,
                tempo: exercise.tempo || null,
                notes: exercise.notes || null,
                difficulty: exercise.difficulty || null,
                duration: exercise.duration || null,
                restInterval: exercise.restInterval || null,
                completed: null
              })),
              completed: null,
              rating: null,
              comments: ''
            };
          });
        });
        setExerciseProgress(initialProgress);
      } catch (error) {
        console.log(error);
        showToast('error', 'Error', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [planId, showToast, setLoading, setPlanDetailsVisible]);

  useEffect(() => {
    const savedProgress = localStorage.getItem(`exerciseProgress_${planId}`);
    if (savedProgress) {
      const parsed = JSON.parse(savedProgress);
      const normalized = {};
      Object.entries(parsed).forEach(([exerciseId, prog]) => {
        const setsArray = Array.isArray(prog.sets) ? prog.sets : Object.values(prog.sets || {});
        normalized[exerciseId] = { ...prog, sets: setsArray };
      });
      setExerciseProgress(normalized);
    }
  }, [planId]);

  useEffect(() => {
    localStorage.setItem(`exerciseProgress_${planId}`, JSON.stringify(exerciseProgress));
  }, [exerciseProgress, planId]);

  const handleExerciseChange = (exerciseId, setIndex, field, value) => {
    console.log(exerciseProgress);
    setExerciseProgress((prevProgress) => {
      if (typeof setIndex === 'number') {
        const prev = prevProgress[exerciseId] || {};
        const prevSets = Array.isArray(prev.sets) ? prev.sets : [];
        const newSets = [...prevSets];
        newSets[setIndex] = {
          ...newSets[setIndex],
          [field]: value
        };
        return {
          ...prevProgress,
          [exerciseId]: {
            ...prev,
            sets: newSets
          }
        };
      } else {
        return {
          ...prevProgress,
          [exerciseId]: {
            ...prevProgress[exerciseId],
            [field]: value
          }
        };
      }
    });
  };

  const handleSetCompletedChange = (exerciseId, setIndex, completed) => {
    setExerciseProgress((prevProgress) => {
      const newProgress = { ...prevProgress };
      const group = plan.groups.find((group) => group.exercises.some((ex) => ex.id === exerciseId));
      if (!group) return newProgress;
      const exercise = group.exercises.find((ex) => ex.id === exerciseId);
      if (!exercise) return newProgress;

      // Asegurarse de que el set existe
      if (!newProgress[exerciseId]?.sets) {
        const numSets = parseInt(exercise.sets) || group.set;
        newProgress[exerciseId] = {
          ...newProgress[exerciseId],
          sets: Array.from({ length: numSets }).map(() => ({
            repetitions: exercise.repetitions,
            weight: exercise.weight,
            time: exercise.time,
            distance: exercise.distance,
            tempo: exercise.tempo,
            notes: exercise.notes,
            difficulty: exercise.difficulty,
            duration: exercise.duration,
            restInterval: exercise.restInterval,
            completed: exercise.completed
          }))
        };
      }

      // Actualizar el estado completado del set
      newProgress[exerciseId].sets[setIndex] = {
        ...newProgress[exerciseId].sets[setIndex],
        completed: completed
      };

      // Verificar si todos los sets están completados
      const allSetsCompleted = Object.values(newProgress[exerciseId].sets).every((set) => set.completed);
      newProgress[exerciseId].completed = allSetsCompleted;

      // Verificar si todos los ejercicios del grupo están completados
      const allExercisesCompleted = group.exercises.every((ex) => newProgress[ex.id]?.completed);

      // Actualizar el estado del grupo
      setCompletedGroups((prevCompletedGroups) => {
        const newCompletedGroups = [...prevCompletedGroups];
        const groupIndex = newCompletedGroups.findIndex((g) => g.id === group.id);

        if (groupIndex >= 0) {
          newCompletedGroups[groupIndex] = { ...newCompletedGroups[groupIndex], completed: allExercisesCompleted };
        } else {
          newCompletedGroups.push({ id: group.id, completed: allExercisesCompleted });
        }

        return newCompletedGroups;
      });

      return newProgress;
    });
  };

  const handleVideoClick = (url) => {
    try {
      const videoId = extractYouTubeVideoId(url);
      const embedUrl = `https://www.youtube.com/embed/${videoId}`;
      setCurrentVideoUrl(embedUrl);
      setVideoDialogVisible(true);
    } catch (error) {
      showToast('error', 'Error', error.message);
    }
  };

  const handleSaveProgress = () => {
    localStorage.setItem(`exerciseProgress_${planId}`, JSON.stringify(exerciseProgress));
    showToast('success', 'Success', intl.formatMessage({ id: 'training.success.saved' }));
  };

  const handleSubmitFeedback = ({
    sessionTime,
    generalFeedback,
    energyLevel,
    mood,
    perceivedDifficulty,
    additionalNotes
  }) => {
    // Normalize any null completed to false before finishing
    const normalizedProgress = {};
    console.log(exerciseProgress);
    Object.entries(exerciseProgress).forEach(([exerciseId, prog]) => {
      const sets = (prog.sets || []).map((s) => ({
        ...s,
        completed: s.completed == null ? false : s.completed
      }));
      normalizedProgress[exerciseId] = {
        ...prog,
        sets,
        completed: prog.completed == null ? false : prog.completed
      };
    });
    const exerciseFeedbackArray = Object.entries(normalizedProgress)
      .map(([exerciseId, progress]) => {
        const sets = Object.values(progress.sets || {});
        const group = plan.groups.find((group) => group.exercises.some((ex) => ex.id === parseInt(exerciseId)));
        if (!group) {
          showToast('error', 'Error', intl.formatMessage({ id: 'training.error.exerciseNotFound' }));
          return null;
        }
        const originalExercise = group.exercises.find((ex) => ex.id === parseInt(exerciseId));

        /*
        const allFieldsFilled = sets.every((set) =>
          Object.keys(originalExercise).every((key) => originalExercise[key] === '' || set[key] !== '')
        );

        if (!allFieldsFilled) {
          showToast('error', 'Error', intl.formatMessage({ id: 'training.error.fillAllFields' }));
          return null;
        }
        */
        console.log(sets);
        return {
          exerciseId: parseInt(exerciseId),
          sets,
          completed: progress.completed,
          rating: progress.rating,
          comments: progress.comments
        };
      })
      .filter((feedback) => feedback !== null);

    if (exerciseFeedbackArray.length === 0) {
      showToast('error', 'Error', intl.formatMessage({ id: 'training.error.noFeedback' }));
      return;
    }

    const body = {
      exerciseFeedbackArray,
      userId: user.userId,
      sessionTime,
      generalFeedback,
      energyLevel,
      mood,
      perceivedDifficulty,
      additionalNotes,
      isCoachFeedback: user.userType === 'coach',
      providedBy: user.userType === 'coach' ? coach.id : client.id
    };

    setLoading(true);
    submitFeedback(planId, body, client ? client.id : clientId)
      .then(() => {
        setExerciseProgress({});
        setFinishDialogVisible(false);
        if (setRefreshKey) {
          setRefreshKey((prev) => prev + 1);
        }
        showToast('success', 'Session finished!', 'Congratulations, you have finished your routine.');
        if (user.userType === 'coach') {
          navigate(`/client-dashboard/${clientId}`);
        } else {
          navigate('/student');
        }
      })
      .catch((error) => {
        showToast('error', 'Error', error.message);
        setFinishDialogVisible(false);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <i className="pi pi-check-circle text-green-500"></i>;
      case 'pending':
        return <i className="pi pi-clock text-yellow-500"></i>;
      case 'expired':
        return <i className="pi pi-exclamation-circle text-red-500"></i>;
      default:
        return <i className="pi pi-info-circle text-blue-500"></i>;
    }
  };

  const isExerciseCompleted = (exercise) => {
    return (
      (exerciseProgress[exercise.id]?.completed === true && exerciseProgress[exercise.id]?.rating !== null) ||
      exerciseProgress[exercise.id]?.completed === false
    );
  };

  const isGroupCompleted = (group) => {
    const groupStatus = completedGroups.find((g) => g.id === group.id);

    // Verificar si todos los ejercicios del grupo están completados
    const allExercisesCompleted = group.exercises.every(isExerciseCompleted);

    return groupStatus?.completed || allExercisesCompleted;
  };

  const canNavigateToNextGroup = () => {
    if (!plan || currentGroupIndex >= plan.groups.length - 1) return false;

    const currentGroup = plan.groups[currentGroupIndex];
    return isGroupCompleted(currentGroup);
  };

  const navigateToNextGroup = () => {
    if (canNavigateToNextGroup()) {
      setCurrentGroupIndex((prev) => prev + 1);
    }
  };

  const navigateToPreviousGroup = () => {
    if (currentGroupIndex > 0) {
      setCurrentGroupIndex((prev) => prev - 1);
    }
  };

  const navigateToGroup = (index) => {
    // Solo permitir navegar a grupos anteriores o completados
    if (index < currentGroupIndex || isGroupCompleted(plan.groups[index])) {
      setCurrentGroupIndex(index);
    }
  };

  const canFinishTraining = () => {
    if (!plan || !plan.groups) return false;

    // Verificar que todos los grupos estén completados
    return plan.groups.every((group) => {
      // Verificar que todos los ejercicios del grupo estén completados
      return group.exercises.every((exercise) => {
        const progress = exerciseProgress[exercise.id];
        return progress?.completed === true;
      });
    });
  };

  const renderExerciseGroup = (group) => {
    // Toggle all completed flags for this group's exercises
    const handleToggleAll = (flag, e) => {
      console.log(exerciseProgress);
      console.log(e.target.name);
      setExerciseProgress((prev) => {
        const newProgress = { ...prev };
        // Solo actualizar el ejercicio actual, no todos los del grupo
        const exerciseId = e.target.name.split('-')[1];
        const existing = newProgress[exerciseId] || { sets: [] };
        const sets = (existing.sets || []).map((s) => ({ ...s, completed: flag }));
        newProgress[exerciseId] = { ...existing, sets, completed: flag };
        return newProgress;
      });
    };

    const isCompleted = isGroupCompleted(group);

    return (
      <div key={group.id} className={`exercise-group ${isCompleted ? 'completed' : ''}`}>
        <div className="exercise-group-header">
          <div className="exercise-group-title">
            <FormattedMessage id="training.group" values={{ number: group.groupNumber }} />
            <div className="exercise-group-progress">
              {group.exercises.filter((ex) => exerciseProgress[ex.id]?.completed).length}/{group.exercises.length}
            </div>
          </div>
        </div>

        <div className="exercise-group-content">
          <div className="exercise-list">
            {group.exercises.map((exercise) => {
              const progress = exerciseProgress[exercise.id] || {};
              const isCompleted = isExerciseCompleted(exercise);

              return (
                <Card key={exercise.id} className={`exercise-card ${isCompleted ? 'completed' : ''}`}>
                  <div className="exercise-card-header">
                    <div className="exercise-card-header-left">
                      <h3 className="exercise-name">{exercise.exercise.name}</h3>
                    </div>
                    <div className="exercise-card-header-right">
                      <div className="exercise-card-header-right-item">
                        <div className="exercise-group-info-right">
                          <div
                            className="exercise-group-thumbnail"
                            onClick={() => {
                              handleVideoClick(exercise.exercise.multimedia);
                            }}
                          >
                            <img
                              className="exercise-group-thumbnail"
                              src={getYouTubeThumbnail(exercise.exercise.multimedia)}
                              alt="Video thumbnail"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="exercise-inputs">
                    <div className="exercise-sets">
                      <DataTable
                        value={Array.from({ length: parseInt(exercise.sets) || group.set || 1 }).map((_, index) => {
                          const setData = progress.sets?.[index] || {};
                          return {
                            setNumber: index + 1,
                            repetitions: setData.repetitions ?? '',
                            weight: setData.weight ?? '',
                            time: setData.time ?? '',
                            distance: setData.distance ?? '',
                            tempo: setData.tempo ?? '',
                            difficulty: setData.difficulty ?? '',
                            duration: setData.duration ?? '',
                            restInterval: setData.restInterval ?? '',
                            completed: setData.completed
                          };
                        })}
                        className="exercise-sets-table"
                        size="small"
                        showGridlines
                        stripedRows
                        paginator={false}
                        rows={5}
                        style={{ fontSize: '0.9rem' }}
                      >
                        <Column
                          field="setNumber"
                          header={intl.formatMessage({ id: 'training.exercise.set' })}
                          style={{ width: '10%', padding: '0.5rem' }}
                        />

                        {exercise.repetitions && (
                          <Column
                            field="repetitions"
                            header={intl.formatMessage(
                              { id: 'training.exercise.reps' },
                              { unit: propertyUnits.repetitions || '' }
                            )}
                            body={(rowData) => (
                              <span className="p-inputgroup" style={{ width: '100%' }}>
                                <InputText
                                  value={rowData.repetitions || ''}
                                  onChange={(e) =>
                                    handleExerciseChange(
                                      exercise.id,
                                      rowData.setNumber - 1,
                                      'repetitions',
                                      e.target.value
                                    )
                                  }
                                  className="w-full p-inputtext-sm"
                                  style={{ padding: '0.25rem' }}
                                />
                                <span className="p-inputgroup-addon">{propertyUnits.repetitions || ''}</span>
                              </span>
                            )}
                            style={{ padding: '0.5rem' }}
                          />
                        )}

                        {exercise.weight && (
                          <Column
                            field="weight"
                            header={intl.formatMessage(
                              { id: 'training.exercise.weight' },
                              { unit: propertyUnits.weight || 'kg' }
                            )}
                            body={(rowData) => (
                              <span className="p-inputgroup" style={{ width: '100%' }}>
                                <InputText
                                  value={rowData.weight || ''}
                                  onChange={(e) =>
                                    handleExerciseChange(exercise.id, rowData.setNumber - 1, 'weight', e.target.value)
                                  }
                                  className="p-inputtext-sm"
                                  style={{ width: '100%' }}
                                />
                                <span className="p-inputgroup-addon">{propertyUnits.weight}</span>
                              </span>
                            )}
                            style={{ padding: '0.5rem' }}
                          />
                        )}

                        {exercise.difficulty && (
                          <Column
                            field="difficulty"
                            header={intl.formatMessage(
                              { id: 'training.exercise.difficulty' },
                              { unit: propertyUnits.difficulty || '' }
                            )}
                            body={(rowData) => (
                              <span className="p-inputgroup" style={{ width: '100%' }}>
                                <InputText
                                  value={rowData.difficulty || ''}
                                  onChange={(e) =>
                                    handleExerciseChange(
                                      exercise.id,
                                      rowData.setNumber - 1,
                                      'difficulty',
                                      e.target.value
                                    )
                                  }
                                  className="w-full p-inputtext-sm"
                                  style={{ padding: '0.25rem' }}
                                  suffix={propertyUnits.difficulty || ''}
                                />
                                <span className="p-inputgroup-addon">{propertyUnits.difficulty || ''}</span>
                              </span>
                            )}
                            style={{ padding: '0.5rem' }}
                          />
                        )}

                        {exercise.duration && (
                          <Column
                            field="duration"
                            header={intl.formatMessage(
                              { id: 'training.exercise.duration' },
                              { unit: propertyUnits.duration || 's' }
                            )}
                            body={(rowData) => (
                              <span className="p-inputgroup" style={{ width: '100%' }}>
                                <InputText
                                  value={rowData.duration || ''}
                                  onChange={(e) =>
                                    handleExerciseChange(exercise.id, rowData.setNumber - 1, 'duration', e.target.value)
                                  }
                                  className="w-full p-inputtext-sm"
                                  style={{ padding: '0.25rem' }}
                                  suffix={propertyUnits.duration || 's'}
                                />
                                <span className="p-inputgroup-addon">{propertyUnits.duration || 's'}</span>
                              </span>
                            )}
                            style={{ padding: '0.5rem' }}
                          />
                        )}

                        {exercise.time && (
                          <Column
                            field="time"
                            header={intl.formatMessage(
                              { id: 'training.exercise.time' },
                              { unit: propertyUnits.time || 's' }
                            )}
                            body={(rowData) => (
                              <span className="p-inputgroup" style={{ width: '100%' }}>
                                <InputText
                                  value={rowData.time || ''}
                                  onChange={(e) =>
                                    handleExerciseChange(exercise.id, rowData.setNumber - 1, 'time', e.target.value)
                                  }
                                  className="w-full p-inputtext-sm"
                                  style={{ padding: '0.25rem' }}
                                  suffix={propertyUnits.time || 's'}
                                />
                                <span className="p-inputgroup-addon">{propertyUnits.time || 's'}</span>
                              </span>
                            )}
                            style={{ padding: '0.5rem' }}
                          />
                        )}

                        {exercise.distance && (
                          <Column
                            field="distance"
                            header={intl.formatMessage(
                              { id: 'training.exercise.distance' },
                              { unit: propertyUnits.distance || 'km' }
                            )}
                            body={(rowData) => (
                              <span className="p-inputgroup" style={{ width: '100%' }}>
                                <InputText
                                  value={rowData.distance || ''}
                                  onChange={(e) =>
                                    handleExerciseChange(exercise.id, rowData.setNumber - 1, 'distance', e.target.value)
                                  }
                                  className="w-full p-inputtext-sm"
                                  style={{ padding: '0.25rem' }}
                                  suffix={propertyUnits.distance || 'km'}
                                />
                                <span className="p-inputgroup-addon">{propertyUnits.distance || 'km'}</span>
                              </span>
                            )}
                            style={{ padding: '0.5rem' }}
                          />
                        )}

                        {exercise.tempo && (
                          <Column
                            field="tempo"
                            header={intl.formatMessage(
                              { id: 'training.exercise.tempo' },
                              { unit: propertyUnits.tempo || 's' }
                            )}
                            body={(rowData) => (
                              <span className="p-inputgroup" style={{ width: '100%' }}>
                                <InputText
                                  value={rowData.tempo || ''}
                                  onChange={(e) =>
                                    handleExerciseChange(exercise.id, rowData.setNumber - 1, 'tempo', e.target.value)
                                  }
                                  className="w-full p-inputtext-sm"
                                  style={{ padding: '0.25rem' }}
                                  suffix={propertyUnits.tempo || 's'}
                                />
                                <span className="p-inputgroup-addon">{propertyUnits.tempo || 's'}</span>
                              </span>
                            )}
                            style={{ padding: '0.5rem' }}
                          />
                        )}

                        <Column
                          field="completed"
                          header={
                            <div className="flex flex-column justify-between items-center">
                              <div className="flex items-center">
                                <FormattedMessage id="training.exercise.completed" />
                              </div>
                              <div className="flex flex-row items-center">
                                <RadioButton
                                  inputId={`completeAll-${exercise.id}`}
                                  name={`completeAll-${exercise.id}`}
                                  value={true}
                                  onChange={(e) => handleToggleAll(true, e)}
                                  checked={false}
                                />
                                <label htmlFor={`completeAll-${exercise.id}`} style={{ margin: '0 0.25rem' }}>
                                  {intl.formatMessage({ id: 'common.yes' })}
                                </label>
                                <RadioButton
                                  inputId={`incompleteAll-${exercise.id}`}
                                  name={`completeAll-${exercise.id}`}
                                  value={false}
                                  onChange={(e) => handleToggleAll(false, e)}
                                  checked={false}
                                />
                                <label htmlFor={`incompleteAll-${exercise.id}`}>
                                  {intl.formatMessage({ id: 'common.no' })}
                                </label>
                              </div>
                            </div>
                          }
                          body={(rowData) => (
                            <div className="flex flex-row items-center">
                              <RadioButton
                                inputId={`completed-yes-${rowData.setNumber}`}
                                name={`completed-${rowData.setNumber}`}
                                value={true}
                                onChange={(e) => handleSetCompletedChange(exercise.id, rowData.setNumber - 1, e.value)}
                                checked={rowData.completed === true}
                              />
                              <label htmlFor={`completed-yes-${rowData.setNumber}`} style={{ margin: '0 0.25rem' }}>
                                {intl.formatMessage({ id: 'common.yes' })}
                              </label>
                              <RadioButton
                                inputId={`completed-no-${rowData.setNumber}`}
                                name={`completed-${rowData.setNumber}`}
                                value={false}
                                onChange={(e) => handleSetCompletedChange(exercise.id, rowData.setNumber - 1, e.value)}
                                checked={rowData.completed === false}
                              />
                              <label htmlFor={`completed-no-${rowData.setNumber}`}>
                                {intl.formatMessage({ id: 'common.no' })}
                              </label>
                            </div>
                          )}
                          style={{ width: '10%', padding: '0.5rem' }}
                        />
                      </DataTable>
                    </div>
                    <div className="">
                      <label htmlFor={`notes-${exercise.id}`}>
                        <FormattedMessage id="training.notes" defaultMessage="Notes" />
                      </label>
                      <InputTextarea
                        id={`notes-${exercise.id}`}
                        rows={1}
                        value={exercise.notes || ''}
                        disabled
                        className="w-full"
                      />
                    </div>
                    <div className="">
                      <label htmlFor={`comments-${exercise.id}`}>
                        <FormattedMessage id="training.comments" defaultMessage="Comments" />
                      </label>
                      <InputTextarea
                        id={`comments-${exercise.id}`}
                        rows={3}
                        value={progress.comments || ''}
                        onChange={(e) => handleExerciseChange(exercise.id, null, 'comments', e.target.value)}
                        className="w-full"
                      />
                    </div>

                    {(client || clientId) && currentCycle && (
                      <div className="exercise-field">
                        <RpeDropdownComponent
                          selectedRpe={progress.rating}
                          onChange={(e) => handleExerciseChange(exercise.id, null, 'rating', e.value)}
                          planId={planId}
                          cycleId={currentCycle !== -1 ? currentCycle.id : currentCycle}
                          clientId={client ? client.id : clientId}
                        />
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  if (loading || !plan) {
    return (
      <div className="loading-container">
        <ProgressSpinner className="loading-spinner" />
        <span>
          <FormattedMessage id="training.loading" />
        </span>
      </div>
    );
  }

  return (
    <div className="training-plan-details">
      <div className="training-plan-header">
        <div className="training-plan-header-content">
          <h1 className="training-plan-title">
            <FormattedMessage id="training.title" />
          </h1>
          <h2 className="training-plan-name">{plan.instanceName ? plan.instanceName : plan.workout.planName}</h2>
          {!plan.isTemplate && (
            <div className="training-plan-status">
              {getStatusIcon(plan.status)}
              <FormattedMessage id="training.status" />: {plan.status}
            </div>
          )}
        </div>
      </div>

      <div className="exercise-groups-container">
        <div className="exercise-groups-navigation">
          <Button
            icon="pi pi-chevron-left"
            className={`p-button-rounded p-button-text navigation-button ${currentGroupIndex === 0 ? 'p-disabled' : ''}`}
            onClick={navigateToPreviousGroup}
            disabled={currentGroupIndex === 0}
            aria-label="Previous group"
          />

          <div className="exercise-groups-content">{renderExerciseGroup(plan.groups[currentGroupIndex])}</div>

          <Button
            icon="pi pi-chevron-right"
            className={`p-button-rounded p-button-text navigation-button ${!canNavigateToNextGroup() ? 'p-disabled' : ''}`}
            onClick={navigateToNextGroup}
            disabled={!canNavigateToNextGroup()}
            aria-label="Next group"
          />
        </div>

        <div className="exercise-groups-indicator">
          {plan.groups.map((_, index) => (
            <div
              key={index}
              className={`group-indicator ${index === currentGroupIndex ? 'active' : ''} ${isGroupCompleted(plan.groups[index]) ? 'completed' : ''}`}
              onClick={() => navigateToGroup(index)}
            />
          ))}
        </div>
      </div>

      {isClientTraining && (
        <div className="training-action-buttons">
          <Button
            label={intl.formatMessage({ id: 'training.buttons.saveProgress' })}
            icon="pi pi-save"
            className="p-button-primary"
            onClick={handleSaveProgress}
          />
          <Button
            label={intl.formatMessage({ id: 'training.buttons.finishTraining' })}
            icon="pi pi-check"
            className="p-button-success"
            onClick={() => setFinishDialogVisible(true)}
            //disabled={!canFinishTraining()}
          />
        </div>
      )}

      <FinishTrainingDialog
        visible={finishDialogVisible}
        onHide={() => setFinishDialogVisible(false)}
        submitFeedback={handleSubmitFeedback}
      />

      <VideoDialog
        visible={videoDialogVisible}
        onHide={() => setVideoDialogVisible(false)}
        videoUrl={currentVideoUrl}
        className="video-dialog"
      />
    </div>
  );
}

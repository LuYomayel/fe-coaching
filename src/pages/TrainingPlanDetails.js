import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
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

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        setLoading(true);
        const { data } = await fetchWorkoutInstance(planId);
        if (data.status === 'completed') setIsClientTraining(false);
        data.groups.sort((groupA, groupB) => groupA.groupNumber - groupB.groupNumber);
        setPlan(data);

        setCurrentCycle(data.trainingSession?.trainingWeek?.trainingCycle || -1);
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
      setExerciseProgress(JSON.parse(savedProgress));
    }
  }, [planId]);

  useEffect(() => {
    localStorage.setItem(`exerciseProgress_${planId}`, JSON.stringify(exerciseProgress));
  }, [exerciseProgress, planId]);

  const handleExerciseChange = (exerciseId, setIndex, field, value) => {
    setExerciseProgress((prevProgress) => {
      if (typeof setIndex === 'number') {
        return {
          ...prevProgress,
          [exerciseId]: {
            ...prevProgress[exerciseId],
            sets: {
              ...prevProgress[exerciseId]?.sets,
              [setIndex]: {
                ...prevProgress[exerciseId]?.sets?.[setIndex],
                [field]: value
              }
            }
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
            completed: false
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
    const exerciseFeedbackArray = Object.entries(exerciseProgress)
      .map(([exerciseId, progress]) => {
        const sets = Object.values(progress.sets || {});
        const group = plan.groups.find((group) => group.exercises.some((ex) => ex.id === parseInt(exerciseId)));
        if (!group) {
          showToast('error', 'Error', intl.formatMessage({ id: 'training.error.exerciseNotFound' }));
          return null;
        }
        const originalExercise = group.exercises.find((ex) => ex.id === parseInt(exerciseId));
        const allFieldsFilled = sets.every((set) =>
          Object.keys(originalExercise).every((key) => originalExercise[key] === '' || set[key] !== '')
        );

        if (!allFieldsFilled) {
          showToast('error', 'Error', intl.formatMessage({ id: 'training.error.fillAllFields' }));
          return null;
        }

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

  const isGroupCompleted = (group) => {
    const groupStatus = completedGroups.find((g) => g.id === group.id);

    // Verificar si todos los ejercicios del grupo están completados
    const allExercisesCompleted = group.exercises.every((exercise) => exerciseProgress[exercise.id]?.completed);

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
          <div className="exercise-group-info">
            <div className="exercise-group-info-left">
              <div className="exercise-group-info-item">
                <i className="pi pi-refresh"></i>
                <span>
                  <FormattedMessage id="training.group.set" />: {group.set}
                </span>
              </div>
              <div className="exercise-group-info-item">
                <i className="pi pi-clock"></i>
                <span>
                  <FormattedMessage id="training.group.rest" />: {group.rest} <FormattedMessage id="training.seconds" />
                </span>
              </div>
            </div>
            {group.exercises.some((ex) => ex.exercise.multimedia) && (
              <div className="exercise-group-info-right">
                <div
                  className="exercise-group-thumbnail"
                  onClick={() => {
                    const firstVideo = group.exercises.find((ex) => ex.exercise.multimedia);
                    if (firstVideo) {
                      handleVideoClick(firstVideo.exercise.multimedia);
                    }
                  }}
                >
                  <img
                    className="exercise-group-thumbnail"
                    src={getYouTubeThumbnail(group.exercises.find((ex) => ex.exercise.multimedia).exercise.multimedia)}
                    alt="Video thumbnail"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="exercise-list">
            {group.exercises.map((exercise) => {
              const progress = exerciseProgress[exercise.id] || {};
              const isCompleted = progress.completed;

              return (
                <Card key={exercise.id} className={`exercise-card ${isCompleted ? 'completed' : ''}`}>
                  <div className="exercise-card-header">
                    <h3 className="exercise-name">{exercise.exercise.name}</h3>
                  </div>

                  <div className="exercise-inputs">
                    <div className="exercise-sets">
                      {/*
                      <h4 className="exercise-set-header">
                        <FormattedMessage id="training.exercise.sets" />
                      </h4>
                      */}

                      <DataTable
                        value={Array.from({ length: parseInt(exercise.sets) || group.set || 1 }).map((_, index) => {
                          const setData = progress.sets?.[index] || {};
                          return {
                            setNumber: index + 1,
                            repetitions: setData.repetitions || exercise.repetitions || '',
                            weight: setData.weight || exercise.weight || '',
                            time: setData.time || exercise.time || '',
                            distance: setData.distance || exercise.distance || '',
                            tempo: setData.tempo || exercise.tempo || '',
                            completed: setData.completed || false
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
                            header={intl.formatMessage({ id: 'training.exercise.reps' })}
                            body={(rowData) => (
                              <InputText
                                value={rowData.repetitions}
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
                            )}
                            style={{ padding: '0.5rem' }}
                          />
                        )}

                        {exercise.weight && (
                          <Column
                            field="weight"
                            header={intl.formatMessage({ id: 'training.exercise.weight' })}
                            body={(rowData) => (
                              <InputText
                                value={rowData.weight}
                                onChange={(e) =>
                                  handleExerciseChange(exercise.id, rowData.setNumber - 1, 'weight', e.target.value)
                                }
                                className="w-full p-inputtext-sm"
                                style={{ padding: '0.25rem' }}
                              />
                            )}
                            style={{ padding: '0.5rem' }}
                          />
                        )}

                        {exercise.time && (
                          <Column
                            field="time"
                            header={intl.formatMessage({ id: 'training.exercise.time' })}
                            body={(rowData) => (
                              <InputText
                                value={rowData.time}
                                onChange={(e) =>
                                  handleExerciseChange(exercise.id, rowData.setNumber - 1, 'time', e.target.value)
                                }
                                className="w-full p-inputtext-sm"
                                style={{ padding: '0.25rem' }}
                              />
                            )}
                            style={{ padding: '0.5rem' }}
                          />
                        )}

                        {exercise.distance && (
                          <Column
                            field="distance"
                            header={intl.formatMessage({ id: 'training.exercise.distance' })}
                            body={(rowData) => (
                              <InputText
                                value={rowData.distance}
                                onChange={(e) =>
                                  handleExerciseChange(exercise.id, rowData.setNumber - 1, 'distance', e.target.value)
                                }
                                className="w-full p-inputtext-sm"
                                style={{ padding: '0.25rem' }}
                              />
                            )}
                            style={{ padding: '0.5rem' }}
                          />
                        )}

                        {exercise.tempo && (
                          <Column
                            field="tempo"
                            header={intl.formatMessage({ id: 'training.exercise.tempo' })}
                            body={(rowData) => (
                              <InputText
                                value={rowData.tempo}
                                onChange={(e) =>
                                  handleExerciseChange(exercise.id, rowData.setNumber - 1, 'tempo', e.target.value)
                                }
                                className="w-full p-inputtext-sm"
                                style={{ padding: '0.25rem' }}
                              />
                            )}
                            style={{ padding: '0.5rem' }}
                          />
                        )}

                        <Column
                          field="completed"
                          header={intl.formatMessage({ id: 'training.exercise.completed' })}
                          body={(rowData) => (
                            <Checkbox
                              checked={rowData.completed}
                              onChange={(e) => handleSetCompletedChange(exercise.id, rowData.setNumber - 1, e.checked)}
                              binary
                              className="p-checkbox-sm"
                            />
                          )}
                          style={{ width: '10%', padding: '0.5rem' }}
                        />
                      </DataTable>
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
                          selectedRpe={progress.rating || 0}
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
            disabled={!canFinishTraining()}
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

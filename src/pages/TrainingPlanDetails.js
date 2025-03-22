import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Fieldset } from 'primereact/fieldset';
import { Splitter, SplitterPanel } from 'primereact/splitter';
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
  const { user } = useContext(UserContext);
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

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        setLoading(true);
        const { data } = await fetchWorkoutInstance(planId);
        if (data.status === 'completed') setIsClientTraining(false);
        data.groups.sort((groupA, groupB) => groupA.groupNumber - groupB.groupNumber);
        setPlan(data);
        setCurrentCycle(data.trainingSession.trainingWeek.trainingCycle);
      } catch (error) {
        console.log(error);
        //showToast('error', 'Error fetching plan details', error.message);
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

  const handleCompletedChange = (exerciseId, isNotAsPlanned) => {
    setExerciseProgress((prevProgress) => {
      const newProgress = { ...prevProgress };
      const group = plan.groups.find((group) => group.exercises.some((ex) => ex.id === exerciseId));
      if (!group) return newProgress;
      const exercise = group.exercises.find((ex) => ex.id === exerciseId);
      if (!exercise) return newProgress;
      const numSets = parseInt(exercise.sets) || group.set;

      const sets = Array.from({ length: numSets }).map(() => ({
        repetitions: exercise.repetitions,
        weight: exercise.weight,
        time: exercise.time,
        distance: exercise.distance,
        tempo: exercise.tempo,
        notes: exercise.notes,
        difficulty: exercise.difficulty,
        duration: exercise.duration,
        restInterval: exercise.restInterval
      }));

      if (isNotAsPlanned) {
        const currentValue = newProgress[exerciseId]?.completedNotAsPlanned || false;
        newProgress[exerciseId] = {
          ...newProgress[exerciseId],
          completedNotAsPlanned: !currentValue,
          completed: false,
          sets: !currentValue ? sets : []
        };
      } else {
        const currentValue = newProgress[exerciseId]?.completed || false;
        newProgress[exerciseId] = {
          ...newProgress[exerciseId],
          completed: !currentValue,
          completedNotAsPlanned: false,
          sets: !currentValue ? sets : []
        };
      }
      // Verifica si todos los ejercicios del grupo están completados o completados parcialmente
      const allExercisesCompleted = group.exercises.every(
        (ex) => newProgress[ex.id]?.completed || newProgress[ex.id]?.completedNotAsPlanned
      );

      // Actualiza el estado del grupo (agrega un campo `groupCompleted` en el objeto `newProgress` o usa otro estado)
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
          completedNotAsPlanned: progress.completedNotAsPlanned,
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
      additionalNotes
    };

    setLoading(true);
    submitFeedback(planId, body)
      .then(() => {
        setExerciseProgress({});
        setFinishDialogVisible(false);
        if (setRefreshKey) {
          setRefreshKey((prev) => prev + 1);
        }
        showToast('success', 'Session finished!', 'Congratulations, you have finished your routine.');
        navigate('/student');
      })
      .catch((error) => {
        showToast('error', 'Error', error.message);
        setFinishDialogVisible(false);
      })
      .finally(() => {
        setLoading(false);
      });
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

  // Obtener el estado correcto para mostrar
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
              {/* {getStatusIcon(plan.status)} 
              <FormattedMessage id="training.status" />: {plan.status}
              */}
            </div>
          )}
        </div>
      </div>

      <div className="mobile-view md:hidden">
        <Accordion className="exercise-tabs">
          {plan.groups.map((group, groupIndex) => {
            const groupStatus = completedGroups.find((g) => g.id === group.id);
            const statusIcon = groupStatus?.completed ? (
              <i className="pi pi-check-circle text-green-500" />
            ) : (
              <i className="pi pi-clock text-yellow-500" />
            );
            return (
              <AccordionTab
                key={groupIndex}
                header={
                  <div className="exercise-group-title">
                    <FormattedMessage id="training.group" values={{ number: group.groupNumber }} />
                    <span>{statusIcon}</span>
                  </div>
                }
              >
                <div className="exercise-group-info">
                  <div className="exercise-group-info-item">
                    <strong>
                      <FormattedMessage id="training.group.set" />:
                    </strong>{' '}
                    {group.set}
                  </div>
                  <div className="exercise-group-info-item">
                    <strong>
                      <FormattedMessage id="training.group.rest" />:
                    </strong>{' '}
                    {group.rest} <FormattedMessage id="training.seconds" />
                  </div>
                </div>

                {group.exercises.map((exercise, exerciseIndex) => (
                  <div key={exerciseIndex} className="exercise-card">
                    <div className="exercise-card-header">
                      <h3 className="exercise-name">{exercise.exercise.name}</h3>
                    </div>
                    <div className="exercise-thumbnail" onClick={() => handleVideoClick(exercise.exercise.multimedia)}>
                      <img
                        src={getYouTubeThumbnail(exercise.exercise.multimedia)}
                        alt={exercise.exercise.name}
                        className="w-full"
                      />
                      <div className="exercise-play-overlay">
                        <div className="exercise-play-button">
                          <i className="pi pi-play"></i>
                        </div>
                      </div>
                    </div>
                    <Accordion className="exercise-tabs">
                      <AccordionTab header={intl.formatMessage({ id: 'training.exercise.details' })}>
                        {Object.keys(exercise).map(
                          (property, propertyIndex) =>
                            property !== 'exercise' &&
                            property !== 'id' &&
                            exercise[property] !== null &&
                            property !== 'completed' &&
                            property !== 'rpe' &&
                            property !== 'rowIndex' &&
                            property !== 'setLogs' &&
                            property !== 'comments' &&
                            property !== 'completedNotAsPlanned' && (
                              <div key={propertyIndex} className="exercise-field">
                                <label htmlFor={`${property}${groupIndex}-${exerciseIndex}`}>
                                  {property.charAt(0).toUpperCase() + property.slice(1)}:
                                </label>
                                <p>{exercise[property]}</p>
                              </div>
                            )
                        )}
                      </AccordionTab>
                      <AccordionTab header={intl.formatMessage({ id: 'training.exercise.progress' })}>
                        {isClientTraining ? (
                          <div className="exercise-inputs">
                            <div className="p-field-checkbox">
                              <Checkbox
                                inputId={`completed-not-as-planned-${exercise.id}`}
                                checked={exerciseProgress[exercise.id]?.completedNotAsPlanned || false}
                                onChange={() => handleCompletedChange(exercise.id, true)}
                              />
                              <label htmlFor={`completed-not-as-planned-${exercise.id}`}>
                                <FormattedMessage id="training.checkbox.notAsPlanned" />
                              </label>
                            </div>
                            {exerciseProgress[exercise.id]?.completedNotAsPlanned &&
                              Array.from({ length: parseInt(exercise.sets) || group.set || 1 }).map((_, setIndex) => (
                                <div key={setIndex}>
                                  <h4 className="exercise-set-header">Set {setIndex + 1}</h4>
                                  {Object.keys(exercise).map(
                                    (property) =>
                                      property !== 'exercise' &&
                                      property !== 'id' &&
                                      exercise[property] !== null &&
                                      property !== 'completed' &&
                                      property !== 'completedNotAsPlanned' &&
                                      property !== 'rpe' &&
                                      property !== 'rowIndex' &&
                                      property !== 'sets' &&
                                      property !== 'setLogs' &&
                                      property !== 'comments' && (
                                        <div key={property} className="exercise-field">
                                          <label htmlFor={`${property}-${exercise.id}-${setIndex}`}>
                                            {property.charAt(0).toUpperCase() + property.slice(1)}:
                                          </label>
                                          <InputText
                                            id={`${property}-${exercise.id}-${setIndex}`}
                                            value={exerciseProgress[exercise.id]?.sets?.[setIndex]?.[property] || ''}
                                            onChange={(e) =>
                                              handleExerciseChange(exercise.id, setIndex, property, e.target.value)
                                            }
                                            className="w-full"
                                          />
                                        </div>
                                      )
                                  )}
                                </div>
                              ))}
                            <div className="p-field-checkbox">
                              <Checkbox
                                inputId={`completed-${exercise.id}`}
                                checked={exerciseProgress[exercise.id]?.completed || false}
                                onChange={() => handleCompletedChange(exercise.id, false)}
                              />
                              <label htmlFor={`completed-${exercise.id}`}>
                                <FormattedMessage id="training.checkbox.completed" defaultMessage="Completed" />
                              </label>
                            </div>
                            <div className="p-field">
                              <RpeDropdownComponent
                                selectedRpe={exerciseProgress[exercise.id]?.rating || 0}
                                onChange={(e) => handleExerciseChange(exercise.id, null, 'rating', e.value)}
                                planId={planId}
                                cycleId={currentCycle.id}
                              />
                            </div>
                            <div className="p-field">
                              <label htmlFor={`comments-${exercise.id}`}>
                                <FormattedMessage id="training.comments" defaultMessage="Comments" />
                              </label>
                              <InputTextarea
                                id={`comments-${exercise.id}`}
                                rows={3}
                                value={exerciseProgress[exercise.id]?.comments || ''}
                                onChange={(e) => handleExerciseChange(exercise.id, null, 'comments', e.target.value)}
                                className="w-full"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="exercise-inputs">
                            <div className="p-field-checkbox">
                              <Checkbox
                                inputId={`completed-${exercise.id}`}
                                checked={exercise.completed || false}
                                readOnly
                              />
                              <label htmlFor={`completed-${exercise.id}`}>
                                <FormattedMessage id="training.checkbox.completed" defaultMessage="Completed" />
                              </label>
                            </div>
                            <div className="p-field-checkbox">
                              <Checkbox
                                inputId={`completedNotAsPlanned-${exercise.id}`}
                                checked={exercise.completedNotAsPlanned || false}
                                readOnly
                              />
                              <label htmlFor={`completedNotAsPlanned-${exercise.id}`}>
                                <FormattedMessage id="training.checkbox.notAsPlanned" />
                              </label>
                            </div>
                            <div className="p-field">
                              <RpeDropdownComponent
                                selectedRpe={exerciseProgress[exercise.id]?.rating || 0}
                                onChange={(e) => handleExerciseChange(exercise.id, null, 'rating', e.value)}
                                planId={planId}
                                cycleId={currentCycle.id}
                              />
                            </div>
                            <div className="p-field">
                              <label htmlFor={`comments-${exercise.id}`}>
                                <FormattedMessage id="training.comments" defaultMessage="Comments" />
                              </label>
                              <InputTextarea
                                disabled
                                id={`comments-${exercise.id}`}
                                rows={3}
                                value={exercise.comments || ''}
                                className="w-full"
                              />
                            </div>
                          </div>
                        )}
                      </AccordionTab>
                    </Accordion>
                  </div>
                ))}
              </AccordionTab>
            );
          })}
        </Accordion>
      </div>

      <div className="desktop-view hidden md:block">
        {plan.groups.map((group, groupIndex) => (
          <Fieldset legend={`Group ${group.groupNumber}`} key={groupIndex} className="mb-4" toggleable>
            <div className="exercise-group-info">
              <div className="exercise-group-info-item">
                <strong>Set Count:</strong> {group.set}
              </div>
              <div className="exercise-group-info-item">
                <strong>Rest Interval:</strong> {group.rest} seconds
              </div>
            </div>

            {group.exercises.map((exercise, exerciseIndex) => (
              <Card key={exerciseIndex} className="exercise-card mb-4">
                <div className="exercise-card-header">
                  <h3 className="exercise-name">{exercise.exercise.name}</h3>
                </div>
                <div className="grid">
                  <div className="col-12 md:col-4">
                    <div className="exercise-thumbnail" onClick={() => handleVideoClick(exercise.exercise.multimedia)}>
                      <img
                        src={getYouTubeThumbnail(exercise.exercise.multimedia)}
                        alt={`${exercise.exercise.name} thumbnail`}
                        className="w-full"
                      />
                      <div className="exercise-play-overlay">
                        <div className="exercise-play-button">
                          <i className="pi pi-play"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-12 md:col-8">
                    <Splitter>
                      <SplitterPanel className="flex align-items-center justify-content-center">
                        {Object.keys(exercise).map(
                          (property, propertyIndex) =>
                            property !== 'exercise' &&
                            property !== 'id' &&
                            exercise[property] !== null &&
                            property !== 'completed' &&
                            property !== 'rpe' &&
                            property !== 'rowIndex' &&
                            property !== 'setLogs' &&
                            property !== 'comments' &&
                            property !== 'completedNotAsPlanned' && (
                              <div key={propertyIndex} className="exercise-field">
                                <label htmlFor={`${property}${groupIndex}-${exerciseIndex}`}>
                                  {property.charAt(0).toUpperCase() + property.slice(1)}:
                                </label>
                                <p>{exercise[property]}</p>
                              </div>
                            )
                        )}
                      </SplitterPanel>
                      <SplitterPanel className="flex align-items-center justify-content-center">
                        {isClientTraining ? (
                          <div className="exercise-inputs">
                            <div className="p-field-checkbox">
                              <Checkbox
                                inputId={`completed-not-as-planned-${exercise.id}`}
                                checked={exerciseProgress[exercise.id]?.completedNotAsPlanned || false}
                                onChange={() => handleCompletedChange(exercise.id, true)}
                              />
                              <label htmlFor={`completed-not-as-planned-${exercise.id}`}>
                                <FormattedMessage id="training.checkbox.notAsPlanned" />
                              </label>
                            </div>
                            {exerciseProgress[exercise.id]?.completedNotAsPlanned &&
                              Array.from({ length: parseInt(exercise.sets) || group.set || 1 }).map((_, setIndex) => (
                                <div key={setIndex}>
                                  <h4 className="exercise-set-header">Set {setIndex + 1}</h4>
                                  {Object.keys(exercise).map(
                                    (property) =>
                                      property !== 'exercise' &&
                                      property !== 'id' &&
                                      exercise[property] !== null &&
                                      property !== 'completed' &&
                                      property !== 'completedNotAsPlanned' &&
                                      property !== 'rpe' &&
                                      property !== 'rowIndex' &&
                                      property !== 'setLogs' &&
                                      property !== 'sets' &&
                                      property !== 'comments' && (
                                        <div key={property} className="exercise-field">
                                          <label htmlFor={`${property}-${exercise.id}-${setIndex}`}>
                                            {property.charAt(0).toUpperCase() + property.slice(1)}:
                                          </label>
                                          <InputText
                                            id={`${property}-${exercise.id}-${setIndex}`}
                                            value={exerciseProgress[exercise.id]?.sets?.[setIndex]?.[property] || ''}
                                            onChange={(e) =>
                                              handleExerciseChange(exercise.id, setIndex, property, e.target.value)
                                            }
                                            className="w-full"
                                          />
                                        </div>
                                      )
                                  )}
                                </div>
                              ))}
                            <div className="p-field-checkbox">
                              <Checkbox
                                inputId={`completed-${exercise.id}`}
                                checked={exerciseProgress[exercise.id]?.completed || false}
                                onChange={() => handleCompletedChange(exercise.id, false)}
                              />
                              <label htmlFor={`completed-${exercise.id}`}>
                                <FormattedMessage id="training.checkbox.completed" defaultMessage="Completed" />
                              </label>
                            </div>
                            <div className="p-field">
                              <RpeDropdownComponent
                                selectedRpe={exerciseProgress[exercise.id]?.rating || 0}
                                onChange={(e) => handleExerciseChange(exercise.id, null, 'rating', e.value)}
                                planId={planId}
                                cycleId={currentCycle.id}
                              />
                            </div>
                            <div className="p-field">
                              <label htmlFor={`comments-${exercise.id}`}>
                                <FormattedMessage id="training.comments" defaultMessage="Comments" />
                              </label>
                              <InputTextarea
                                id={`comments-${exercise.id}`}
                                rows={3}
                                value={exerciseProgress[exercise.id]?.comments || ''}
                                onChange={(e) => handleExerciseChange(exercise.id, null, 'comments', e.target.value)}
                                className="w-full"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="exercise-inputs">
                            <div className="p-field-checkbox">
                              <Checkbox
                                inputId={`completed-${exercise.id}`}
                                checked={exercise.completed || false}
                                readOnly
                              />
                              <label htmlFor={`completed-${exercise.id}`}>
                                <FormattedMessage id="training.checkbox.completed" defaultMessage="Completed" />
                              </label>
                            </div>
                            <div className="p-field-checkbox">
                              <Checkbox
                                inputId={`completedNotAsPlanned-${exercise.id}`}
                                checked={exercise.completedNotAsPlanned || false}
                                readOnly
                              />
                              <label htmlFor={`completedNotAsPlanned-${exercise.id}`}>
                                <FormattedMessage id="training.checkbox.notAsPlanned" />
                              </label>
                            </div>
                            <div className="p-field">
                              <RpeDropdownComponent
                                selectedRpe={exerciseProgress[exercise.id]?.rating || 0}
                                onChange={(e) => handleExerciseChange(exercise.id, null, 'rating', e.value)}
                                planId={planId}
                                cycleId={currentCycle.id}
                              />
                            </div>
                            <div className="p-field">
                              <label htmlFor={`comments-${exercise.id}`}>
                                <FormattedMessage id="training.comments" defaultMessage="Comments" />
                              </label>
                              <InputTextarea
                                disabled
                                id={`comments-${exercise.id}`}
                                rows={3}
                                value={exercise.comments || ''}
                                className="w-full"
                              />
                            </div>
                          </div>
                        )}
                      </SplitterPanel>
                    </Splitter>
                  </div>
                </div>
              </Card>
            ))}
          </Fieldset>
        ))}
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

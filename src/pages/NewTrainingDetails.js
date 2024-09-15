import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Fieldset } from 'primereact/fieldset';
import { Splitter, SplitterPanel } from 'primereact/splitter';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';

import { UserContext } from '../utils/UserContext';
import { useToast } from '../utils/ToastContext';
import { useSpinner } from '../utils/GlobalSpinner';
import { fetchWorkoutInstance, submitFeedback } from '../services/workoutService';
import FinishTrainingDialog from '../dialogs/FinishTrainingDialog';
import VideoDialog from '../dialogs/VideoDialog';
import { extractYouTubeVideoId, getYouTubeThumbnail } from '../utils/UtilFunctions';
import CustomInput from '../components/CustomInput';

export default function NewTrainingPlanDetails({ setPlanDetailsVisible, setRefreshKey, isTraining = true }) {
  const { planId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const showToast = useToast();
  const { loading, setLoading } = useSpinner();
  const toast = useRef(null);

  const [plan, setPlan] = useState(null);
  const [exerciseProgress, setExerciseProgress] = useState({});
  const [videoDialogVisible, setVideoDialogVisible] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');
  const [finishDialogVisible, setFinishDialogVisible] = useState(false);
  const [isClientTraining, setIsClientTraining] = useState(isTraining);

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        setLoading(true);
        const data = await fetchWorkoutInstance(planId);
        if (data.status === 'completed') setIsClientTraining(false);
        setPlan(data);
      } catch (error) {
        showToast('error', 'Error fetching plan details', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [planId, showToast, setLoading]);

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
                [field]: value,
              },
            },
          },
        };
      } else {
        return {
          ...prevProgress,
          [exerciseId]: {
            ...prevProgress[exerciseId],
            [field]: value,
          },
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
        restInterval: exercise.restInterval,
      }));

      if (isNotAsPlanned) {
        newProgress[exerciseId] = { ...newProgress[exerciseId], completedNotAsPlanned: true, completed: false, sets };
      } else {
        newProgress[exerciseId] = { ...newProgress[exerciseId], completed: true, completedNotAsPlanned: false, sets };
      }
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
    showToast('success', 'Progress Saved', 'Your progress has been saved successfully.');
  };

  const handleFinishTraining = () => {
    setFinishDialogVisible(true);
  };

  const handleSubmitFeedback = ({ sessionTime, generalFeedback, energyLevel, mood, perceivedDifficulty, additionalNotes }) => {
    const exerciseFeedbackArray = Object.entries(exerciseProgress)
      .map(([exerciseId, progress]) => {
        const sets = Object.values(progress.sets || {});
        const group = plan.groups.find((group) => group.exercises.some((ex) => ex.id == exerciseId));
        if (!group) {
          showToast('error', 'Error', 'Original exercise not found.');
          return null;
        }
        const originalExercise = group.exercises.find((ex) => ex.id == exerciseId);
        const allFieldsFilled = sets.every((set) =>
          Object.keys(originalExercise).every((key) => originalExercise[key] === '' || set[key] !== '')
        );

        if (!allFieldsFilled) {
          showToast('error', 'Error', 'All relevant fields must be filled out.');
          return null;
        }

        return {
          exerciseId: parseInt(exerciseId),
          sets,
          completed: progress.completed,
          completedNotAsPlanned: progress.completedNotAsPlanned,
          rating: progress.rating,
          comments: progress.comments,
        };
      })
      .filter((feedback) => feedback !== null);

    if (exerciseFeedbackArray.length === 0) {
      showToast('error', 'Error', 'No valid feedback to submit.');
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
    };

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
      });
  };

  if (loading || !plan) {
    return (
      <div className="flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <ProgressSpinner />
      </div>
    );
  }

  return (
    <div className="training-plan-details">
      <Toast ref={toast} />
      <Card className="mb-3">
        <h1 className="text-2xl md:text-4xl font-bold mb-2 md:mb-4">Training Plan</h1>
        <h2 className="text-xl md:text-2xl mb-1 md:mb-2">{plan.workout.planName}</h2>
        {!plan.isTemplate && <p className="text-lg md:text-xl">Status: {plan.status}</p>}
      </Card>

      <div className="mobile-view md:hidden">
        <Accordion multiple>
          {plan.groups.map((group, groupIndex) => (
            <AccordionTab key={groupIndex} header={`Group ${group.groupNumber}`}>
              <p><strong>Set Count:</strong> {group.set}</p>
              <p><strong>Rest Interval:</strong> {group.rest} seconds</p>

              {group.exercises.map((exercise, exerciseIndex) => (
                <Card key={exerciseIndex} className="mb-3 p-2">
                  <h3 className="text-lg font-bold mb-2">{exercise.exercise.name}</h3>
                  <div className="grid">
                    <div className="col-12">
                      <img
                        src={getYouTubeThumbnail(exercise.exercise.multimedia)}
                        alt={`${exercise.exercise.name} thumbnail`}
                        className="cursor-pointer w-full"
                        onClick={() => handleVideoClick(exercise.exercise.multimedia)}
                      />
                    </div>
                    <div className="col-12">
                      <Accordion multiple>
                        <AccordionTab header="Exercise Details">
                          {Object.keys(exercise).map(
                            (property, propertyIndex) =>
                              property !== 'exercise' &&
                              property !== 'id' &&
                              exercise[property] !== '' &&
                              property !== 'completed' &&
                              property !== 'rpe' &&
                              property !== 'comments' &&
                              property !== 'completedNotAsPlanned' && (
                                <div key={propertyIndex} className="p-field exercise-field">
                                  <label htmlFor={`${property}${groupIndex}-${exerciseIndex}`}>
                                    {property.charAt(0).toUpperCase() + property.slice(1)}:
                                  </label>
                                  <p>{exercise[property]}</p>
                                </div>
                              )
                          )}
                        </AccordionTab>
                        <AccordionTab header="Exercise Progress">
                          {isClientTraining ? (
                            <div className="exercise-inputs">
                              <div className="p-field-checkbox mb-2">
                                <Checkbox
                                  inputId={`completed-not-as-planned-${exercise.id}`}
                                  checked={exerciseProgress[exercise.id]?.completedNotAsPlanned || false}
                                  onChange={() => handleCompletedChange(exercise.id, true)}
                                />
                                <label htmlFor={`completed-not-as-planned-${exercise.id}`} className="ml-2">Completed Not as Planned</label>
                              </div>
                              {exerciseProgress[exercise.id]?.completedNotAsPlanned &&
                                Array.from({ length: parseInt(exercise.sets) || group.set || 1 }).map((_, setIndex) => (
                                  <div key={setIndex} className="mb-3">
                                    <h4 className="text-md font-semibold mb-2">Set {setIndex + 1}</h4>
                                    {Object.keys(exercise).map(
                                      (property) =>
                                        property !== 'exercise' &&
                                        property !== 'id' &&
                                        exercise[property] !== '' &&
                                        property !== 'completed' &&
                                        property !== 'completedNotAsPlanned' &&
                                        property !== 'rpe' &&
                                        property !== 'sets' &&
                                        property !== 'comments' && (
                                          <div key={property} className="p-field exercise-field mb-2">
                                            <label htmlFor={`${property}-${exercise.id}-${setIndex}`} className="block mb-1">
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
                              <div className="p-field-checkbox mb-2">
                                <Checkbox
                                  inputId={`completed-${exercise.id}`}
                                  checked={exerciseProgress[exercise.id]?.completed || false}
                                  onChange={() => handleCompletedChange(exercise.id, false)}
                                />
                                <label htmlFor={`completed-${exercise.id}`} className="ml-2">Completed</label>
                              </div>
                              <div className="p-field mb-2">
                                <label htmlFor={`rating-${exercise.id}`} className="block mb-1">RPE: </label>
                                <CustomInput
                                  type="dropdown"
                                  id={`rating-${exercise.id}`}
                                  value={exerciseProgress[exercise.id]?.rating || 0}
                                  onChange={(e) => handleExerciseChange(exercise.id, null, 'rating', e.value)}
                                  className="w-full"
                                />
                              </div>
                              <div className="p-field">
                                <label htmlFor={`comments-${exercise.id}`} className="block mb-1">Comments</label>
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
                              <div className="p-field-checkbox mb-2">
                                <Checkbox
                                  inputId={`completed-${exercise.id}`}
                                  checked={exercise.completed || false}
                                  readOnly
                                />
                                <label htmlFor={`completed-${exercise.id}`} className="ml-2">Completed</label>
                              </div>
                              <div className="p-field-checkbox mb-2">
                                <Checkbox
                                  inputId={`completedNotAsPlanned-${exercise.id}`}
                                  checked={exercise.completedNotAsPlanned || false}
                                  readOnly
                                />
                                <label htmlFor={`completed-${exercise.id}`} className="ml-2">Completed Not As Planned</label>
                              </div>
                              <div className="p-field mb-2">
                                <label htmlFor={`rating-${exercise.id}`} className="block mb-1">RPE: </label>
                                <CustomInput type="dropdown" id={`rating-${exercise.id}`} value={parseInt(exercise.rpe) || 0} disabled className="w-full" />
                              </div>
                              <div className="p-field">
                                <label htmlFor={`comments-${exercise.id}`} className="block mb-1">Comments</label>
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
                  </div>
                </Card>
              ))}
            </AccordionTab>
          ))}
        </Accordion>
      </div>

      <div className="desktop-view hidden md:block">
        {plan.groups.map((group, groupIndex) => (
          <Fieldset legend={`Group ${group.groupNumber}`} key={groupIndex} className="mb-4">
            <p><strong>Set Count:</strong> {group.set}</p>
            <p><strong>Rest Interval:</strong> {group.rest} seconds</p>

            {group.exercises.map((exercise, exerciseIndex) => (
              <Card key={exerciseIndex} className="mb-4">
                <h3 className="text-xl font-bold mb-2">{exercise.exercise.name}</h3>
                <div className="grid">
                  <div className="col-12 md:col-4">
                    <img
                      src={getYouTubeThumbnail(exercise.exercise.multimedia)}
                      alt={`${exercise.exercise.name} thumbnail`}
                      className="cursor-pointer"
                      onClick={() => handleVideoClick(exercise.exercise.multimedia)}
                    />
                  </div>
                  <div className="col-12 md:col-8">
                    <Splitter>
                      <SplitterPanel className="flex align-items-center justify-content-center">
                        {Object.keys(exercise).map(
                          (property, propertyIndex) =>
                            property !== 'exercise' &&
                            property !== 'id' &&
                            exercise[property] !== '' &&
                            property !== 'completed' &&
                            property !== 'rpe' &&
                            property !== 'comments' &&
                            property !== 'completedNotAsPlanned' && (
                              <div key={propertyIndex} className="p-field exercise-field">
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
                              <label htmlFor={`completed-not-as-planned-${exercise.id}`} className="ml-2">Completed Not as Planned</label>
                            </div>
                            {exerciseProgress[exercise.id]?.completedNotAsPlanned &&
                              Array.from({ length: parseInt(exercise.sets) || group.set || 1 }).map((_, setIndex) => (
                                <div key={setIndex} className="mb-3">
                                  <h4 className="text-md font-semibold mb-2">Set {setIndex + 1}</h4>
                                  {Object.keys(exercise).map(
                                    (property) =>
                                      property !== 'exercise' &&
                                      property !== 'id' &&
                                      exercise[property] !== '' &&
                                      property !== 'completed' &&
                                      property !== 'completedNotAsPlanned' &&
                                      property !== 'rpe' &&
                                      property !== 'sets' &&
                                      property !== 'comments' && (
                                        <div key={property} className="p-field exercise-field mb-2">
                                          <label htmlFor={`${property}-${exercise.id}-${setIndex}`} className="block mb-1">
                                            {property.charAt(0).toUpperCase() + property.slice(1)}:
                                          </label>
                                          <InputText
                                            id={`${property}-${exercise.id}-${setIndex}`}
                                            value={exerciseProgress[exercise.id]?.sets?.[setIndex]?.[property] || ''}
                                            onChange={(e) =>
                                              handleExerciseChange(exercise.id, setIndex, property, e.target.value)
                                            }
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
                              <label htmlFor={`completed-${exercise.id}`} className="ml-2">Completed</label>
                            </div>
                            <div className="p-field">
                              <label htmlFor={`rating-${exercise.id}`} className="block mb-1">RPE: </label>
                              <CustomInput
                                type="dropdown"
                                id={`rating-${exercise.id}`}
                                value={exerciseProgress[exercise.id]?.rating || 0}
                                onChange={(e) => handleExerciseChange(exercise.id, null, 'rating', e.value)}
                              />
                            </div>
                            <div className="p-field">
                              <label htmlFor={`comments-${exercise.id}`} className="block mb-1">Comments</label>
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
                              <label htmlFor={`completed-${exercise.id}`} className="ml-2">Completed</label>
                            </div>
                            <div className="p-field-checkbox">
                              <Checkbox
                                inputId={`completedNotAsPlanned-${exercise.id}`}
                                checked={exercise.completedNotAsPlanned || false}
                                readOnly
                              />
                              <label htmlFor={`completed-${exercise.id}`} className="ml-2">Completed Not As Planned</label>
                            </div>
                            <div className="p-field">
                              <label htmlFor={`rating-${exercise.id}`} className="block mb-1">RPE: </label>
                              <CustomInput type="dropdown" id={`rating-${exercise.id}`} value={parseInt(exercise.rpe) || 0} disabled />
                            </div>
                            <div className="p-field">
                              <label htmlFor={`comments-${exercise.id}`} className="block mb-1">Comments</label>
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
        <div className="flex justify-content-between mt-3">
          <Button label="Save Progress" icon="pi pi-save" className="p-button-sm md:p-button-normal" onClick={handleSaveProgress} />
          <Button label="Finish Training" icon="pi pi-check" className="p-button-sm md:p-button-normal" onClick={handleFinishTraining} />
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
      />

      <style jsx>{`
        @media (max-width: 768px) {
          .training-plan-details {
            padding: 0.5rem;
          }
        }
        @media (min-width: 769px) {
          .training-plan-details {
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  );
}
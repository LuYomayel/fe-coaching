import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
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

export default function TrainingSession() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const { user, client } = useContext(UserContext);
  const showToast = useToast();
  const { loading, setLoading } = useSpinner();
  const intl = useIntl();

  const [session, setSession] = useState(null);
  const [exerciseProgress, setExerciseProgress] = useState({});
  const [videoDialogVisible, setVideoDialogVisible] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');
  const [finishDialogVisible, setFinishDialogVisible] = useState(false);
  const [completedGroups, setCompletedGroups] = useState([]);
  const [currentCycle, setCurrentCycle] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState({});

  useEffect(() => {
    const fetchSession = async () => {
      try {
        setLoading(true);
        const { data } = await fetchWorkoutInstance(planId);
        if (data.status === 'completed') {
          showToast('info', 'Session completed', 'This session has already been completed.');
          navigate('/student');
          return;
        }
        data.groups.sort((groupA, groupB) => groupA.groupNumber - groupB.groupNumber);
        setSession(data);
        setCurrentCycle(data.trainingSession?.trainingWeek?.trainingCycle || null);

        // Inicializar todos los grupos como expandidos
        const initialExpandedState = {};
        data.groups.forEach((_, index) => {
          initialExpandedState[index] = true;
        });
        setExpandedGroups(initialExpandedState);
      } catch (error) {
        console.error(error);
        showToast('error', 'Error', intl.formatMessage({ id: 'error.fetchTraining' }));
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [planId, showToast, setLoading, navigate, intl]);

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
    setExerciseProgress((prevProgress) => ({
      ...prevProgress,
      [exerciseId]: {
        ...prevProgress[exerciseId],
        completed: !isNotAsPlanned ? !prevProgress[exerciseId]?.completed : prevProgress[exerciseId]?.completed,
        completedNotAsPlanned: isNotAsPlanned
          ? !prevProgress[exerciseId]?.completedNotAsPlanned
          : prevProgress[exerciseId]?.completedNotAsPlanned
      }
    }));
  };

  const handleVideoClick = (videoUrl) => {
    if (videoUrl) {
      setCurrentVideoUrl(videoUrl);
      setVideoDialogVisible(true);
    }
  };

  const handleFinishSession = () => {
    setFinishDialogVisible(true);
  };

  const toggleGroup = (groupIndex) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupIndex]: !prev[groupIndex]
    }));
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
        const group = session.groups.find((group) => group.exercises.some((ex) => ex.id === parseInt(exerciseId)));
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
    submitFeedback(planId, body, client.id)
      .then(() => {
        setExerciseProgress({});
        setFinishDialogVisible(false);
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

  if (loading || !session) {
    return (
      <div className="loading-container">
        <ProgressSpinner className="loading-spinner" />
        <span>
          <FormattedMessage id="training.loading" />
        </span>
      </div>
    );
  }

  const renderExerciseGroup = (group, groupIndex) => {
    const isExpanded = expandedGroups[groupIndex];
    const isCompleted = completedGroups.includes(groupIndex);
    const groupProgress = group.exercises.reduce((acc, exercise) => {
      const progress = exerciseProgress[exercise.id] || {};
      return acc + (progress.completed ? 1 : 0);
    }, 0);
    const groupCompletionPercentage =
      group.exercises.length > 0 ? Math.round((groupProgress / group.exercises.length) * 100) : 0;

    return (
      <div
        key={groupIndex}
        className={`exercise-group ${isExpanded ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
      >
        <div className="exercise-group-header" onClick={() => toggleGroup(groupIndex)}>
          <div className="exercise-group-title">
            <FormattedMessage id="training.group" values={{ number: group.groupNumber }} />
            <div className="exercise-group-progress">{groupCompletionPercentage}%</div>
          </div>
          <div className="exercise-group-arrow">
            <i className={`pi ${isExpanded ? 'pi-chevron-up' : 'pi-chevron-down'}`}></i>
          </div>
        </div>

        {isExpanded && (
          <div className="exercise-group-content">
            <div className="exercise-group-info">
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

            <div className="exercise-list">
              {group.exercises.map((exercise) => {
                const progress = exerciseProgress[exercise.id] || {};
                const isCompleted = progress.completed;
                const isNotAsPlanned = progress.completedNotAsPlanned;

                return (
                  <Card key={exercise.id} className={`exercise-card ${isCompleted ? 'completed' : ''}`}>
                    <div className="exercise-card-header">
                      <h3 className="exercise-name">{exercise.name}</h3>
                      <div className="exercise-status">
                        <Checkbox
                          checked={isCompleted}
                          onChange={() => handleCompletedChange(exercise.id, false)}
                          binary
                          className="exercise-completed-checkbox"
                        />
                        <label>
                          <FormattedMessage id="training.exercise.completed" />
                        </label>
                      </div>
                    </div>

                    {exercise.videoUrl && (
                      <div className="exercise-thumbnail" onClick={() => handleVideoClick(exercise.videoUrl)}>
                        <img src={getYouTubeThumbnail(extractYouTubeVideoId(exercise.videoUrl))} alt={exercise.name} />
                        <div className="exercise-play-overlay">
                          <div className="exercise-play-button">
                            <i className="pi pi-play"></i>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="exercise-inputs">
                      {exercise.sets > 1 && (
                        <div className="exercise-sets">
                          {Array.from({ length: exercise.sets }, (_, i) => (
                            <div key={i} className="exercise-set">
                              <h4 className="exercise-set-header">
                                <FormattedMessage id="training.exercise.set" values={{ number: i + 1 }} />
                              </h4>
                              <div className="exercise-field">
                                <label>
                                  <FormattedMessage id="training.exercise.reps" />
                                </label>
                                <InputText
                                  value={progress.sets?.[i]?.reps || ''}
                                  onChange={(e) => handleExerciseChange(exercise.id, i, 'reps', e.target.value)}
                                  placeholder={exercise.reps}
                                />
                              </div>
                              <div className="exercise-field">
                                <label>
                                  <FormattedMessage id="training.exercise.weight" />
                                </label>
                                <InputText
                                  value={progress.sets?.[i]?.weight || ''}
                                  onChange={(e) => handleExerciseChange(exercise.id, i, 'weight', e.target.value)}
                                  placeholder={exercise.weight}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="exercise-field">
                        <label>
                          <FormattedMessage id="training.exercise.comments" />
                        </label>
                        <InputTextarea
                          value={progress.comments || ''}
                          onChange={(e) => handleExerciseChange(exercise.id, null, 'comments', e.target.value)}
                          rows={3}
                        />
                      </div>

                      <div className="exercise-field">
                        <label>
                          <FormattedMessage id="training.exercise.rpe" />
                        </label>
                        <RpeDropdownComponent
                          value={progress.rating || ''}
                          onChange={(value) => handleExerciseChange(exercise.id, null, 'rating', value)}
                        />
                      </div>

                      <div className="exercise-field-checkbox">
                        <Checkbox
                          checked={isNotAsPlanned}
                          onChange={() => handleCompletedChange(exercise.id, true)}
                          binary
                        />
                        <label>
                          <FormattedMessage id="training.exercise.notAsPlanned" />
                        </label>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="training-session">
      <div className="training-session-header">
        <div className="training-session-header-content">
          <h1 className="training-session-title">
            <FormattedMessage id="training.title" />
          </h1>
          <h2 className="training-session-name">{session.instanceName || session.workout.planName}</h2>
        </div>
        <Button
          label={intl.formatMessage({ id: 'training.finish' })}
          icon="pi pi-check"
          className="p-button-success"
          onClick={handleFinishSession}
        />
      </div>

      <div className="exercise-groups">{session.groups.map((group, index) => renderExerciseGroup(group, index))}</div>

      <VideoDialog
        visible={videoDialogVisible}
        onHide={() => setVideoDialogVisible(false)}
        videoUrl={currentVideoUrl}
      />

      <FinishTrainingDialog
        visible={finishDialogVisible}
        onHide={() => setFinishDialogVisible(false)}
        onSubmit={handleSubmitFeedback}
        sessionTime={session.sessionTime}
      />
    </div>
  );
}

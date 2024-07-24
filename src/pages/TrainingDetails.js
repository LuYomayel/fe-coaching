import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from 'primereact/button';
import '../styles/PlanDetails.css';

import { Fieldset } from 'primereact/fieldset';
import { Card } from 'primereact/card';
import { Checkbox } from 'primereact/checkbox';
import { InputTextarea } from 'primereact/inputtextarea';

import { Divider } from 'primereact/divider';
import { Splitter, SplitterPanel } from 'primereact/splitter';

import { useToast } from '../utils/ToastContext';
import { UserContext } from '../utils/UserContext';

import FinishTrainingDialog  from '../dialogs/FinishTrainingDialog';
import { extractYouTubeVideoId } from '../utils/UtilFunctions';
import CustomInput from '../components/CustomInput';
import VideoDialog from '../dialogs/VideoDialog';
import { useSpinner } from '../utils/GlobalSpinner';
import { InputText } from 'primereact/inputtext';
const apiUrl = process.env.REACT_APP_API_URL;

const TrainingPlanDetails = ({ setPlanDetailsVisible, setRefreshKey, isTraining=true }) => {
  const { planId } = useParams();
  const { user } = useContext(UserContext);
  const { setLoading } = useSpinner();
  const [exerciseProgress, setExerciseProgress] = useState({});
  const [allCompleted, setAllCompleted] = useState(false);
  const [finishDialogVisible, setFinishDialogVisible] = useState(false);
  const [videoDialogVisible, setVideoDialogVisible] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');
  const [isClientTraining, setIsClientTraining] = useState(isTraining);
  const [plan, setPlan] = useState({
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
    }],
    workout: {
      id: '',
      planName: ''
    },
    startTime: null,
    endTime: null,
    notes: '',
  });
  const showToast = useToast();
  const navigate = useNavigate();
  useEffect(() => {
    setLoading(true)
    fetch(`${apiUrl}/workout/workout-instance/${planId}`)
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json();
          console.log(errorData)
          throw new Error(errorData.message || 'Something went wrong');
        }
        const data = await response.json();
        console.log(data)
        if(data.status === 'completed')
        setIsClientTraining(false)
        setPlan(data)
      })
      .catch(error => showToast('error',  'Error fetching plan details xd', `${error.message}`))
      .finally(() => setLoading(false))

      
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId]);

  // const handleExerciseChange = (exerciseId, field, value) => {
  //   setExerciseProgress((prevProgress) => ({
  //     ...prevProgress,
  //     [exerciseId]: {
  //       ...prevProgress[exerciseId],
  //       [field]: value
  //     }
  //   }));
  // };

  useEffect(() => {
    const savedProgress = localStorage.getItem(`exerciseProgress_${planId}`);
    if (savedProgress) {
      setExerciseProgress(JSON.parse(savedProgress));
    }
  }, [planId]);

  const handleSaveProgress = () => {
    localStorage.setItem(`exerciseProgress_${planId}`, JSON.stringify(exerciseProgress));
    showToast('success', 'Progress Saved', 'Your progress has been saved successfully.');
  };

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

  const handleAllCompletedChange = (exerciseId) => {
    setExerciseProgress((prevProgress) => {
      const newProgress = { ...prevProgress };
  
      // Encontrar el grupo que contiene el ejercicio
      const group = plan.groups.find(group => group.exercises.some(ex => ex.id === exerciseId));
      if (!group) return newProgress; // Salir si no se encuentra el grupo
  
      // Encontrar el ejercicio en el grupo
      const exercise = group.exercises.find(ex => ex.id === exerciseId);
      if (!exercise) return newProgress; // Salir si no se encuentra el ejercicio
  
      const numSets = parseInt(exercise.sets) || group.set;
  
      if (!newProgress[exerciseId]?.allCompleted) {
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
        newProgress[exerciseId] = { ...newProgress[exerciseId], allCompleted: true, sets };
      } else {
        delete newProgress[exerciseId].allCompleted;
        delete newProgress[exerciseId].sets;
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
        showToast('error', 'Error', error.message)
    }
};

const submitFeedback = ({ sessionTime, generalFeedback, energyLevel, mood, perceivedDifficulty, additionalNotes }) => {
  const exerciseFeedbackArray = Object.entries(exerciseProgress).map(([exerciseId, progress]) => {
    const sets = Object.values(progress.sets || {});
    console.log(sets)
    const group = plan.groups.find(group => group.exercises.some(ex => ex.id == exerciseId));
    if (!group) {
      showToast('error', 'Error', 'Original exercise not found.');
      return null;
    }
    const originalExercise = group.exercises.find(ex => ex.id == exerciseId);
    console.log(originalExercise)
    const allFieldsFilled = sets.every(set =>
      Object.keys(originalExercise).every(key =>
        originalExercise[key] == '' || set[key] != ''
      )
    );

    if (!allFieldsFilled) {
      showToast('error', 'Error', 'All relevant fields must be filled out.');
      return null;
    }

    return {
      exerciseId,
      sets,
      completed: progress.completed,
      rating: progress.rating,
      comments: progress.comments
    };
  }).filter(feedback => feedback !== null);


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
    additionalNotes
  };

  console.log(body.sessionTime)
  fetch(`${apiUrl}/workout/feedback/${planId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })
    .then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json();
        console.log(errorData);
        throw new Error(errorData.message || 'Something went wrong');
      }
      return response.json();
    })
    .then(() => {
      setExerciseProgress({});
      setFinishDialogVisible(false);
      if (setRefreshKey) {
        setRefreshKey(prev => prev + 1);
      }
      showToast('success', 'Session finished!', 'Congratulations, you have finished your routine.');
      navigate('/student');
    })
    .catch(error => showToast('error', 'Error', error.message));
};

  

  return (
    <div className="student-plan-container">
      <div className='flex align-items-center justify-content-between'>
        <div>&nbsp;</div>
        <div>
          <h1>Training Plan</h1>
        </div>
        <div className='flex gap-2'>
          
          
        </div>
      </div>
    <div className="plan-summary">
      <Card>
        <div className="plan-details flex justify-content-between">
          <div>
            <p><strong>Plan Name:</strong> {plan.workout.planName}</p>
            {!plan.isTemplate && (<p><strong>Status:</strong> {plan.status}</p>)}
          </div>
          {/* <p><strong>Start Time:</strong> {new Date(plan.startTime).toLocaleTimeString()}</p> */}
          {/* <p><strong>End Time:</strong> {new Date(plan.endTime).toLocaleTimeString()}</p> */}
          <div>
            
          </div>
        </div>
      </Card>
    </div>

    <div className="exercise-groups">
      {(plan.groups ?  plan.groups : []).map((group, groupIndex) => (
        <div key={groupIndex} className="exercise-group">
          <Card title={`Group ${group.groupNumber}`} className="group-card">
            <p><strong>Set:</strong> {group.set}</p>
            <p><strong>Rest (seconds):</strong> {group.rest}</p>
          </Card>
          <Card className='exercises-card'>
            <div className="flex flex-column">
              {group.exercises.map((exercise, exerciseIndex) => (
                
                <div key={exerciseIndex} className="exercise-card">
                  <Splitter className='flex flex-row border border-solid border-gray-300'>
                    <SplitterPanel className='p-3' size={80}>
                        <Fieldset legend={exercise.exercise.name} className='p-3 h-full w-full' >
                        <div className='exercise-fields'>
                            {/* <div className='p-field exercise-field'>
                                <label> 
                                    Exercise:
                                </label>
                                <p>{exercise.exercise ? exercise.exercise.name : '' }</p>
                            </div> */}
                        <div className='p-field exercise-field'>
                            <label> 
                            Video URL:
                            </label>
                            <p>
                              <a href="#/" onClick={() => handleVideoClick(exercise.exercise.multimedia)}>
                                Watch video
                              </a>
                            </p>
                        </div>
                      {Object.keys(exercise).map((property, propertyIndex) => (
                        (
                          property !== 'exercise' && 
                          property !== 'id' && 
                          exercise[property] !== '' && 
                          property !== 'completed'&& 
                          property !== 'rpe' && 
                          property !== 'comments'
                        ) && (
                          <div key={propertyIndex} className="p-field exercise-field">
                            <label htmlFor={`${property}${groupIndex}-${exerciseIndex}`}>{property.charAt(0).toUpperCase() + property.slice(1)}:</label>
                            <p>{exercise[property]}</p>
                          </div>
                        )
                      ))}
                      </div>
                      </Fieldset>
                      </SplitterPanel>
                      <SplitterPanel className='p-3' size={20}>
                      {isClientTraining && (
                        <div className="exercise-inputs">
                         <div className="p-field-checkbox">
                          <Checkbox
                            inputId={`all-completed-${exercise.id}`}
                            checked={exerciseProgress[exercise.id]?.allCompleted || false}
                            onChange={() => handleAllCompletedChange(exercise.id)}
                          />
                          <label htmlFor={`all-completed-${exercise.id}`}>Completed All as Planned</label>
                        </div>
                        {Array.from({ length: parseInt(exercise.sets) || group.set || 1 }).map((_, setIndex) => (
                          <div key={setIndex}>
                            <h4>Set {setIndex + 1}</h4>
                            {Object.keys(exercise).map((property) => (
                              property !== 'exercise' && 
                              property !== 'id' && 
                              exercise[property] !== '' && 
                              property !== 'completed' &&
                              property !== 'rpe' &&
                              property !== 'sets' &&
                              property !== 'comments' && (
                                <div key={property} className="p-field exercise-field">
                                  <label htmlFor={`${property}-${exercise.id}-${setIndex}`}>{property.charAt(0).toUpperCase() + property.slice(1)}:</label>
                                  <InputText
                                    id={`${property}-${exercise.id}-${setIndex}`}
                                    value={exerciseProgress[exercise.id]?.sets?.[setIndex]?.[property] || ''}
                                    onChange={(e) => handleExerciseChange(exercise.id, setIndex, property, e.target.value)}
                                  />
                                </div>
                              )
                            ))}
                          </div>
                        ))}
                          <div className="p-field-checkbox">
                            <Checkbox
                              inputId={`completed-${exercise.id}`}
                              checked={exerciseProgress[exercise.id]?.completed || false}
                              onChange={(e) => handleExerciseChange(exercise.id, null, 'completed', e.checked)}
                            />
                            <label htmlFor={`completed-${exercise.id}`}>Completed</label>
                          </div>
                          <div className="p-field">
                            <label htmlFor={`rating-${exercise.id}`}>RPE: </label>
                            <CustomInput
                                type="dropdown" // Change this to "slider" or "dropdown" to use different input types
                                id={`rating-${exercise.id}`}
                                value={exerciseProgress[exercise.id]?.rating || 0}
                                onChange={(e) => handleExerciseChange(exercise.id, null, 'rating', e.value)}
                              />
                          </div>
                          <div className="p-field">
                            <label htmlFor={`comments-${exercise.id}`}>Comments</label>
                            <InputTextarea
                              id={`comments-${exercise.id}`}
                              rows={3}
                              value={exerciseProgress[exercise.id]?.comments || ''}
                              onChange={(e) => handleExerciseChange(exercise.id, null, 'comments', e.target.value)}
                              className="exercise-feedback-input"
                            />
                          </div>
                        </div>
                      )}
                      {!isClientTraining && (
                        <div className="exercise-inputs">
                          <div className="p-field-checkbox">
                            <Checkbox
                              inputId={`completed-${exercise.id}`}
                              checked={exercise.completed || false}
                            />
                            <label htmlFor={`completed-${exercise.id}`}>Completed</label>
                          </div>
                          <div className="p-field">
                            <label htmlFor={`rating-${exercise.id}`}>RPE: </label>
                            <CustomInput
                                type="dropdown" // Change this to "slider" or "dropdown" to use different input types
                                id={`rating-${exercise.id}`}
                                value={parseInt(exercise.rpe) || 0}
                                disabled={true}
                              />
                          </div>
                          <div className="p-field">
                            <label htmlFor={`comments-${exercise.id}`}>Comments</label>
                            <InputTextarea
                              disabled
                              id={`comments-${exercise.id}`}
                              rows={3}
                              value={exercise.comments || ''}
                              onChange={(e) => handleExerciseChange(exercise.id, 'comments', e.target.value)}
                              className="exercise-feedback-input"
                            />
                          </div>
                        </div>
                      )}
                      </SplitterPanel>
                  </Splitter>
                  {exerciseIndex !== group.exercises.length-1 ? <div><Divider/></div> : <div></div>}
                </div>
                
              ))}
            </div>
            </Card>
        </div>
        
      ))}
    </div>
    <div className='actions-section'>
      {isClientTraining && (
        <div className='flex gap-2'>
          <Button icon="pi pi-save" label="Save Progress" className='p-button-rounded p-button-info' onClick={handleSaveProgress} />
          <Button iconPos='left' icon="pi pi-check" label="Finish Training" className='p-button-rounded p-button-success' onClick={() => setFinishDialogVisible(true)} />
        </div>
      )}
    </div>
    <FinishTrainingDialog
        visible={finishDialogVisible}
        onHide={() => setFinishDialogVisible(false)}
        submitFeedback={submitFeedback}
      />
    <VideoDialog
      visible={videoDialogVisible}
      onHide={() => setVideoDialogVisible(false)}
      videoUrl={currentVideoUrl}
    />
  </div>
  );
};

export default TrainingPlanDetails;
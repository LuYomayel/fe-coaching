import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from 'primereact/button';
import '../styles/PlanDetails.css';

import { Fieldset } from 'primereact/fieldset';
import { Card } from 'primereact/card';
import { Checkbox } from 'primereact/checkbox';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Divider } from 'primereact/divider';
import { Splitter, SplitterPanel } from 'primereact/splitter';

import { useToast } from '../utils/ToastContext';
import { UserContext } from '../utils/UserContext';
import { useConfirmationDialog } from '../utils/ConfirmationDialogContext';
import FinishTrainingDialog  from '../dialogs/FinishTrainingDialog';

import CustomInput from '../components/CustomInput';
const apiUrl = process.env.REACT_APP_API_URL;

const TrainingPlanDetails = ({ setPlanDetailsVisible, setRefreshKey, isTraining=true }) => {
  const { planId } = useParams();
  const { user } = useContext(UserContext);
  const { showConfirmationDialog } = useConfirmationDialog();
  const [exerciseProgress, setExerciseProgress] = useState({});
  const [finishDialogVisible, setFinishDialogVisible] = useState(false);
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
    fetch(`${apiUrl}/workout/${planId}`)
      .then(response => response.json())
      .then(data => {
        if(data.statusCode && data.statusCode !== 200){
          showToast('error', 'Error fetching plan details', data.message)
        }else {
          setPlan(data)
        }
      })
      .catch(error => showToast('error',  'Error fetching plan details xd', `${error.message}`));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId]);

  const handleEditPlan = () => {
    navigate(`/plans/edit/${planId}`)
  }

  const handleExerciseChange = (exerciseId, field, value) => {
    setExerciseProgress((prevProgress) => ({
      ...prevProgress,
      [exerciseId]: {
        ...prevProgress[exerciseId],
        [field]: value
      }
    }));
  };

  const submitFeedback = ({ sessionTime, generalFeedback, energyLevel, mood, perceivedDifficulty, additionalNotes }) => {
    const exerciseFeedbackArray = Object.entries(exerciseProgress).map(([exerciseId, progress]) => ({
      exerciseId,
      ...progress,
    }));
    const body = {
        exerciseFeedbackArray,
        userId: user.userId,
        sessionTime,
        generalFeedback,
        energyLevel,
        mood,
        perceivedDifficulty,
        additionalNotes
    }
    console.log(body)
    // return

    fetch(`${apiUrl}/workout/feedback/${planId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })
      .then(response => response.json())
      .then(data => {
        console.log('Feedback submitted:', data);
        if(data.statusCode && data.statusCode !== 200){
            showToast('error', data.message);
        }else{
            setExerciseProgress({});
            setFinishDialogVisible(false);
            if (setRefreshKey) {
              setRefreshKey(prev => prev + 1);
            }
            showToast('success', 'Session finished!', 'Congratulations, you have finished your routine.')
            navigate(-1)
        }
      })
      .catch(error => console.error('Error submitting feedback:', error));
  };

  if (!plan) return <p>Loading...</p>;

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
        <div className="plan-details">
          <p><strong>Plan Name:</strong> {plan.workout.planName}</p>
          <p><strong>Description:</strong> {plan.instanceName}</p>
          {/* <p><strong>Start Time:</strong> {new Date(plan.startTime).toLocaleTimeString()}</p> */}
          {/* <p><strong>End Time:</strong> {new Date(plan.endTime).toLocaleTimeString()}</p> */}
          <p><strong>Notes:</strong> {plan.personalizedNotes}</p>
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
                            <p><a href={exercise.multimedia} >Watch Video</a></p>
                        </div>
                      {Object.keys(exercise).map((property, propertyIndex) => (
                        (property !== 'exercise' && property !== 'id' && exercise[property] !== '') && (
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
                      {isTraining && (
                        <div className="exercise-inputs">
                          <div className="p-field-checkbox">
                            <Checkbox
                              inputId={`completed-${exercise.id}`}
                              checked={exerciseProgress[exercise.id]?.completed || false}
                              onChange={(e) => handleExerciseChange(exercise.id, 'completed', e.checked)}
                            />
                            <label htmlFor={`completed-${exercise.id}`}>Completed</label>
                          </div>
                          <div className="p-field">
                            <label htmlFor={`rating-${exercise.id}`}>RPE: </label>
                            <CustomInput
                                type="dropdown" // Change this to "slider" or "dropdown" to use different input types
                                id={`rating-${exercise.id}`}
                                value={exerciseProgress[exercise.id]?.rating || 0}
                                onChange={(e) => handleExerciseChange(exercise.id, 'rating', e.value)}
                              />
                          </div>
                          <div className="p-field">
                            <label htmlFor={`comments-${exercise.id}`}>Comments</label>
                            <InputTextarea
                              id={`comments-${exercise.id}`}
                              rows={3}
                              value={exerciseProgress[exercise.id]?.comments || ''}
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
      {isTraining && (
        <Button label="Finish Training" onClick={() => setFinishDialogVisible(true)} />
      )}
    </div>
    <FinishTrainingDialog
        visible={finishDialogVisible}
        onHide={() => setFinishDialogVisible(false)}
        submitFeedback={submitFeedback}
      />
  </div>
  );
};

export default TrainingPlanDetails;
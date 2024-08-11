import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import '../styles/PlanDetails.css';

import { Fieldset } from 'primereact/fieldset';
import { Card } from 'primereact/card';

import { Divider } from 'primereact/divider';
import { Splitter } from 'primereact/splitter';
import { SplitterPanel } from 'primereact/splitter';
import CustomInput from '../components/CustomInput';
import { Checkbox } from 'primereact/checkbox';
import { InputTextarea } from 'primereact/inputtextarea';
import { useToast } from '../utils/ToastContext';
import { UserContext } from '../utils/UserContext';
import { useConfirmationDialog } from '../utils/ConfirmationDialogContext';
import { extractYouTubeVideoId, getYouTubeThumbnail } from '../utils/UtilFunctions';
import VideoDialog from './VideoDialog';
import { deleteWorkoutPlan, fetchWorkoutInstance } from '../services/workoutService';
const apiUrl = process.env.REACT_APP_API_URL;

const PlanDetails = ({ planId, setPlanDetailsVisible, setRefreshKey, setLoading }) => {
  // const { planId } = useParams();
  const { user } = useContext(UserContext);
  const { showConfirmationDialog } = useConfirmationDialog();
  const [videoDialogVisible, setVideoDialogVisible] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');

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
  const [loadingSubmit, setLoadingSubmit] = useState(false)
  const navigate = useNavigate();
  useEffect(() => {
    const getPlanDetails = async () => {
      setLoading(true);
      try {
        const planDetails = await fetchWorkoutInstance(planId);
        // console.log(planDetails)
        setPlan(planDetails);
      } catch (error) {
        showToast('error', 'Error fetching plan details xd', error.message);
      } finally {
        setLoading(false);
      }
    };

    if (planId) {
      getPlanDetails();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId]);

  const handleEditPlan = () => {
    navigate(`/plans/edit/${planId}`)
  }

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

  const handleDeletePlan = (plan) =>{
    showConfirmationDialog({
      message: "Are you sure you want to delete this plan?",
      header: "Confirmation",
      icon: "pi pi-exclamation-triangle",
      accept: () => fetchDeletePlan(),
      reject: () => console.log('Rejected')
  });
  }

  const fetchDeletePlan = () => {
    setLoadingSubmit(true);
    deleteWorkoutPlan(planId, plan.isTemplate)
      .then(() => {
        showToast('success', 'Plan deleted', 'You have deleted the plan with success!');
        setPlanDetailsVisible(false); // Cerrar el diálogo de detalles del plan
        setRefreshKey(old => old+1)
        // Aquí puedes manejar cualquier lógica adicional de actualización de UI
      })
      .catch((error) => {
        showToast('error', 'Error', error.message);
      })
      .finally(() => {
        setLoadingSubmit(false);
      });
    
  }

  const handleStartTraining = () => {
    navigate(`/plans/start-session/${plan.id}`, { state: { isTraining: true, planId: plan.id } });
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
          {user.userType === 'coach' && plan.status !== 'completed' && <Button label="" icon='pi pi-pencil' className='p-button-rounded p-button-warning'onClick={handleEditPlan}/>}
          {(user.userType === 'coach') && 
            <Button label="" icon='pi pi-trash'className='p-button-rounded p-button-danger' onClick={handleDeletePlan}/>
          }
          {user.userType === 'client' && plan.status ==='pending' && <Button tooltip='Start Training' icon='pi pi-chart-bar' className='p-button-rounded p-button-succes' onClick={handleStartTraining}/>}
          {/* <Button label="" icon='pi pi-clone' onClick={handleClonePlan}/> */}
        </div>
      </div>
    <div className="plan-summary">
      <Card>
        <div className="plan-details">
          <p><strong>Plan Name:</strong> {plan.workout.planName}</p>
          {!plan.isTemplate && (<p><strong>Status:</strong> {plan.status}</p>)}
          {/* {!plan.isTemplate && <p><strong>Description:</strong> {plan.instanceName}</p>} */}
          {/* <p><strong>Start Time:</strong> {new Date(plan.startTime).toLocaleTimeString()}</p> */}
          {/* <p><strong>End Time:</strong> {new Date(plan.endTime).toLocaleTimeString()}</p> */}
          {/* {!plan.isTemplate &&<p><strong>Notes:</strong> {plan.personalizedNotes}</p>} */}
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
                <div key={exerciseIndex} >
                  {!plan.isTemplate && plan.status === 'completed' && (
                    <Splitter className='flex flex-row border border-solid border-gray-300'>
                      <SplitterPanel className='p-3' size={80}>
                      <Fieldset legend={exercise.exercise.name} className='flex-grow-1 p-3'>
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
                              <img src={getYouTubeThumbnail(exercise.exercise.multimedia)} alt="Video thumbnail" style={{ width: '100px', cursor: 'pointer' }} />
                            </a>
                          </p>
                        </div>
                        {Object.keys(exercise).map((property, propertyIndex) => (
                          (
                            property !== 'exercise' && 
                            property !== 'id' && 
                            exercise[property] !== '' &&
                            property !== 'comments' &&
                            property !== 'rpe' &&
                            property !== 'completed' &&
                            property !== 'completedNotAsPlanned' 
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
                            <div className="exercise-inputs">
                              <div className="p-field-checkbox">
                                <Checkbox
                                  inputId={`completed-${exercise.id}`}
                                  checked={exercise.completed || false}
                                />
                                <label htmlFor={`completed-${exercise.id}`}>Completed</label>
                              </div>
                              <div className="p-field-checkbox">
                                <Checkbox
                                  inputId={`completed-not-as-planned-${exercise.id}`}
                                  checked={exercise.completedNotAsPlanned || false}
                                />
                                <label htmlFor={`completed-${exercise.id}`}>Completed Not as Planned</label>
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
                                  className="exercise-feedback-input"
                                />
                              </div>
                            </div>
                          </SplitterPanel>
                    </Splitter>
                  )}
                  {!plan.isTemplate && plan.status !== 'completed' && (
                    <Fieldset legend={exercise.exercise.name} className='flex-grow-1 p-3'>
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
                            <img src={getYouTubeThumbnail(exercise.exercise.multimedia)} alt="Video thumbnail" style={{ width: '100px', cursor: 'pointer' }} />
                          </a>  
                        </p>
                      </div>
                      {Object.keys(exercise).map((property, propertyIndex) => (
                        (
                          property !== 'exercise' && 
                          property !== 'id' && 
                          exercise[property] !== '' &&
                          property !== 'comments' &&
                          property !== 'rpe' &&
                          property !== 'completed' &&
                          property !== 'completedNotAsPlanned' 
                        ) && (
                          <div key={propertyIndex} className="p-field exercise-field">
                            <label htmlFor={`${property}${groupIndex}-${exerciseIndex}`}>{property.charAt(0).toUpperCase() + property.slice(1)}:</label>
                            <p>{exercise[property]}</p>
                          </div>
                        )
                      ))}
                      </div>
                      </Fieldset>
                  )}
                  {plan.isTemplate && (
                    <Fieldset legend={exercise.exercise.name} className='flex-grow-1 p-3'>
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
                            <img src={getYouTubeThumbnail(exercise.exercise.multimedia)} alt="Video thumbnail" style={{ width: '100px', cursor: 'pointer' }} />
                          </a>  
                        </p>
                      </div>
                      {Object.keys(exercise).map((property, propertyIndex) => (
                        (
                          property !== 'exercise' && 
                          property !== 'id' && 
                          exercise[property] !== '' &&
                          property !== 'comments' &&
                          property !== 'rpe' &&
                          property !== 'completed' &&
                          property !== 'completedNotAsPlanned' 
                        ) && (
                          <div key={propertyIndex} className="p-field exercise-field">
                            <label htmlFor={`${property}${groupIndex}-${exerciseIndex}`}>{property.charAt(0).toUpperCase() + property.slice(1)}:</label>
                            <p>{exercise[property]}</p>
                          </div>
                        )
                      ))}
                      </div>
                      </Fieldset>
                  )}
                  {exerciseIndex !== group.exercises.length-1 ? <div><Divider/></div> : <div></div>}
                </div>
                
              ))}
                  
            </div>
            </Card>
        </div>
        
      ))}
    </div>
    <VideoDialog
      visible={videoDialogVisible}
      onHide={() => setVideoDialogVisible(false)}
      videoUrl={currentVideoUrl}
    />
  </div>
  );
};

export default PlanDetails;
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import '../styles/PlanDetails.css';

import { Fieldset } from 'primereact/fieldset';
import { Card } from 'primereact/card';
import { useToast } from '../utils/ToastContext';
import { UserContext } from '../utils/UserContext';
import { useConfirmationDialog } from '../utils/ConfirmationDialogContext';
const apiUrl = process.env.REACT_APP_API_URL;

const PlanDetails = ({ planId, setPlanDetailsVisible, setRefreshKey }) => {
  // const { planId, studentId } = useParams();
  const { user } = useContext(UserContext);
  const { showConfirmationDialog } = useConfirmationDialog();
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
        console.log(data)
        setPlan(data)
      })
      .catch(error => showToast('error',  'Error fetching plan details xd', `${error.message}`));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId]);

  const handleEditPlan = () => {
    navigate(`/plans/edit/${planId}`)
  }

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
    const url = plan.isTemplate ? `${apiUrl}/workout/${planId}` : `${apiUrl}/workout/deleteInstance/${planId}`;
    fetch(`${url}`, {
      method: "DELETE",
      headers: {
        'Content-Type': 'application/json',
      },
    })
    .then(response => {
      if(response.ok){
        setRefreshKey(prev => prev + 1); // Update the refresh key to re-fetch data
        setPlanDetailsVisible(false); // Close the dialog
        showToast('success', `You have deleted the plan with success!`, 'Plan deleted!');  
      }else{
        showToast('error', `Something wrong happend!`, response.error);  
      }
    })
    .catch( (error) => console.log(error))
  }

  if (!plan) return <p>Loading...</p>;

  return (
    <div className="student-plan-container">
      <div className='flex align-items-center justify-content-between'>
        <div>&nbsp;</div>
        <div>
          <h1>Training Plan</h1>
        </div>
        <div className='flex gap-2'>
          {(user.userType === 'coach') && 
            <Button label="" icon='pi pi-trash' onClick={handleDeletePlan}/>
          }
          {user.userType === 'coach' && <Button label="" icon='pi pi-pencil' onClick={handleEditPlan}/>}
          {/* <Button label="" icon='pi pi-clone' onClick={handleClonePlan}/> */}
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
          <Fieldset legend="Exercises" className='exercises-card'>
            <div className="flex flex-column">
              {group.exercises.map((exercise, exerciseIndex) => (
                <div key={exerciseIndex} className="exercise-card">
                  <Card>
                    <div className='exercise-fields'>

                      <div className='p-field exercise-field'>
                          <label> 
                            Exercise:
                          </label>
                          <p>{exercise.exercise ? exercise.exercise.name : '' }</p>
                      </div>
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
                  </Card>
                </div>
              ))}
            </div>
            </Fieldset>
          
        </div>
      ))}
    </div>
  </div>
  );
};

export default PlanDetails;
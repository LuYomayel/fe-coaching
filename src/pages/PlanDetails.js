import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import '../styles/PlanDetails.css';

import { Fieldset } from 'primereact/fieldset';
import { Card } from 'primereact/card';
import { useToast } from '../utils/ToastContext';

const apiUrl = process.env.REACT_APP_API_URL;

const PlanDetails = ({ planId, setPlanDetailsVisible, setRefreshKey }) => {
  // const { planId, studentId } = useParams();
  const [plan, setPlan] = useState({
    planName: '',
    dayOfWeek: '',
    startTime: null,
    endTime: null,
    notes: '',
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
    }]
  });
  const showToast = useToast();
  const navigate = useNavigate();
  useEffect(() => {
    // fetch(`${apiUrl}/workout/clientId/1/planId/${planId}`)
    fetch(`${apiUrl}/workout/${planId}`)
      .then(response => response.json())
      .then(data => {
        console.log(data)
        setPlan(data)
      })
      .catch(error => showToast('error', `${error.message}`, 'Error fetching plan details'));
// eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId]);

  const handleEditPlan = () => {
    navigate(`/plans/edit/${planId}`)
  }

  const handleClonePlan = () => {
    fetch(`${apiUrl}/workout/copy/${planId}`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(plan),
    }).then((response) => {
      return response.json();
    }).then(data => {
      console.log(data)
      setRefreshKey(prev => prev + 1); // Update the refresh key to re-fetch data
      setPlanDetailsVisible(false); // Close the dialog
      showToast('success', `You have copy the plan with success!`, 'Plan cloned!');  
      navigate(`/`);
    })
  }

  const handleDeletePlan = () => {
    fetch(`${apiUrl}/workout/${planId}`, {
      method: "DELETE",
      headers: {
        'Content-Type': 'application/json',
      },
      // body: JSON.stringify(plan),
    })
    // .then((response) => {
    //   return response.json();
    // })
    .then(data => {
      console.log(data)
      setRefreshKey(prev => prev + 1); // Update the refresh key to re-fetch data
      setPlanDetailsVisible(false); // Close the dialog
      showToast('success', `You have deleted the plan with success!`, 'Plan deleted!');  
      navigate(`/`);
    })
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
          <Button label="" icon='pi pi-trash' onClick={handleDeletePlan}/>
          <Button label="" icon='pi pi-clone' onClick={handleClonePlan}/>
          <Button label="" icon='pi pi-pencil' onClick={handleEditPlan}/>
        </div>
      </div>
    <div className="plan-summary">
      <Card>
        <div className="plan-details">
          <p><strong>Plan Name:</strong> {plan.planName}</p>
          <p><strong>Day of Week:</strong> {plan.dayOfWeek}</p>
          {/* <p><strong>Start Time:</strong> {new Date(plan.startTime).toLocaleTimeString()}</p> */}
          {/* <p><strong>End Time:</strong> {new Date(plan.endTime).toLocaleTimeString()}</p> */}
          <p><strong>Notes:</strong> {plan.notes}</p>
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
                          <p>{exercise.exercise.name}</p>
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
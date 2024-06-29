import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';

import '../styles/PlanDetails.css';

import { Fieldset } from 'primereact/fieldset';
import { Card } from 'primereact/card';

import { showError } from '../utils/toastMessages';

const apiUrl = process.env.REACT_APP_API_URL;

const PlanDetails = ({ user }) => {
  const { planId, studentId } = useParams();
  const [plan, setPlan] = useState(null);
  const toast = useRef(null);

  useEffect(() => {
    fetch(`${apiUrl}/workout/clientId/${studentId}/planId/${planId}`)
      .then(response => response.json())
      .then(data => {
        console.log(data)
        setPlan(data)
      })
      .catch(error => showError(toast, 'Error fetching plan details'));

  }, [planId,studentId]);


  if (!plan) return <p>Loading...</p>;

  return (
    <div className="student-plan-container">
    <h1>Training Plan</h1>
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
      {plan.groups.map((group, groupIndex) => (
        <div key={groupIndex} className="exercise-group">
          <Card title={`Group ${group.groupNumber}`} className="group-card">
            <p><strong>Set:</strong> {group.set}</p>
            <p><strong>Rest (seconds):</strong> {group.rest}</p>
          </Card>
          <Fieldset legend="Exercises" className='exercises-card'>
            <div className="exercises-container">
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
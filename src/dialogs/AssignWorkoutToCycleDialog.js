import React, { useState, useEffect, useContext } from 'react';
import { Dialog } from 'primereact/dialog';

import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { useToast } from '../utils/ToastContext';
import { UserContext } from '../utils/UserContext';
import { assignWorkoutsToCycle, fetchCoachWorkouts } from '../services/workoutService';

const apiUrl = process.env.REACT_APP_API_URL;

const AssignWorkoutToCycleDialog = ({ visible, onHide, cycleId, clientId, setRefreshKey }) => {
  const showToast = useToast();
  const [workouts, setWorkouts] = useState([]);

  const [assignments, setAssignments] = useState([{ workoutId: null, dayOfWeek: null }]);
  const { user } = useContext(UserContext);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    setAssignments([{ workoutId: null, dayOfWeek: null }])
  }, []);

  useEffect(() => {
    const loadWorkouts = async () => {
      try {
        const workoutsData = await fetchCoachWorkouts(user.userId);
        setWorkouts(workoutsData);
      } catch (error) {
        showToast('error', 'Error', error.message);
      }
    };

    loadWorkouts();
  }, [showToast, user.userId]);



  const daysOfWeek = [
    { label: 'Monday', value: 1 },
    { label: 'Tuesday', value: 2 },
    { label: 'Wednesday', value: 3 },
    { label: 'Thursday', value: 4 },
    { label: 'Friday', value: 5 },
    { label: 'Saturday', value: 6 },
    { label: 'Sunday', value: 7 },
  ];

  const handleAssign = async () => {
    const body = {
      assignments: assignments.filter(assignment => assignment.dayOfWeek !== null && assignment.workoutId !== null),
    };
    console.log(body)
    if(body.assignments.length === 0)
      return showToast('error', 'Error', 'Please assign at least one workout.')
    try {
      setLoading(true);
      await assignWorkoutsToCycle(cycleId, clientId, body);
      showToast('success', 'Success', 'Workouts assigned to cycle successfully');
      onHide();
      setRefreshKey(old => old + 1);
    } catch (error) {
      showToast('error', 'Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAssignment = () => {
    if(!assignments[assignments.length-1].workoutId || assignments[assignments.length-1].dayOfWeek === null)
      return showToast('error', 'Error', 'Please select a workout and a day of week for the last assignment.')
    setAssignments([...assignments, { workoutId: null, dayOfWeek: null }]);
  };

  const handleAssignmentChange = (index, field, value) => {
    const updatedAssignments = [...assignments];
    updatedAssignments[index][field] = value;
    setAssignments(updatedAssignments);
  };

  const removeAssignment = (index) => {
    const updatedAssignments = assignments.filter((assignments, i) => index !== i);
    setAssignments(updatedAssignments)
  }
  return (
    <Dialog header="Assign Workouts to Cycle" className="responsive-dialog" visible={visible} onHide={onHide} style={{ width: '50vw' }}>
      {assignments.map((assignment, index) => (
        <Card key={index} title={`Assignment ${index + 1}`} className="mb-3">
          <div className="p-field grid">
            <div className="col-6">
              <Dropdown
                value={assignment.workoutId}
                options={workouts.map((workout) => ({ label: workout.planName, value: workout.id }))}
                onChange={(e) => handleAssignmentChange(index, 'workoutId', e.value)}
                placeholder="Select Workout"
              />
            </div>
            <div className="col-5">
              <Dropdown
                value={assignment.dayOfWeek}
                options={daysOfWeek}
                optionValue='value'
                onChange={(e) => handleAssignmentChange(index, 'dayOfWeek', e.value)}
                placeholder="Select Day of Week"
              />
            </div>
            <div className='col-1'>
              <Button icon='pi pi-times' onClick={() => removeAssignment(index)} />
            </div>
          </div>
        </Card>
      ))}
      <div className="flex justify-content-between">
        <Button label="Add Assignment" icon="pi pi-plus" onClick={handleAddAssignment} className="p-button-secondary" />
        <Button label="Assign Workouts" icon="pi pi-check" onClick={handleAssign} className="p-button-primary" loading={loading}/>
      </div>
    </Dialog>
  );
};

export default AssignWorkoutToCycleDialog;
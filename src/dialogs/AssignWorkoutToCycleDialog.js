import React, { useState, useEffect, useContext } from 'react';
import { Dialog } from 'primereact/dialog';
import { MultiSelect } from 'primereact/multiselect';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { useToast } from '../utils/ToastContext';
import { UserContext } from '../utils/UserContext';

const apiUrl = process.env.REACT_APP_API_URL;

const AssignWorkoutToCycleDialog = ({ visible, onHide, cycleId, clientId, setRefreshKey }) => {
  const showToast = useToast();
  const [workouts, setWorkouts] = useState([]);
  const [selectedWorkouts, setSelectedWorkouts] = useState([]);
  const [days, setDays] = useState([]);
  const [assignments, setAssignments] = useState([{ workoutId: null, dayOfWeek: null }]);
  const { user } = useContext(UserContext);

  useEffect(() => {
    setAssignments([{ workoutId: null, dayOfWeek: null }])
  }, []);

  useEffect(() => {
    fetch(`${apiUrl}/workout/coach-workouts/userId/${user.userId}`)
      .then(async response => {
        const data = await response.json();
        setWorkouts(data);
      })
      .catch(error => showToast('error', 'Error', error.message));
  }, [showToast]);



  const daysOfWeek = [
    { label: 'Monday', value: 0 },
    { label: 'Tuesday', value: 1 },
    { label: 'Wednesday', value: 2 },
    { label: 'Thursday', value: 3 },
    { label: 'Friday', value: 4 },
    { label: 'Saturday', value: 5 },
    { label: 'Sunday', value: 6 },
  ];

  const handleAssign = async () => {
    const body = {
      assignments: assignments.filter(assignment => assignment.dayOfWeek !== null && assignment.workoutId !== null),
    };

    try {
      const response = await fetch(`${apiUrl}/workout/assign-cycle/${cycleId}/assign-workouts/${clientId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Something went wrong');
      }

      showToast('success', 'Success', 'Workouts assigned to cycle successfully');
      onHide();
      setRefreshKey(old => old + 1);
    } catch (error) {
      showToast('error', 'Error', error.message);
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
    console.log(index)
    const updatedAssignments = assignments.filter((assignments, i) => index !== i);
    setAssignments(updatedAssignments)
  }
  return (
    <Dialog header="Assign Workouts to Cycle" visible={visible} onHide={onHide} style={{ width: '50vw' }}>
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
        <Button label="Assign Workouts" icon="pi pi-check" onClick={handleAssign} className="p-button-primary" />
      </div>
    </Dialog>
  );
};

export default AssignWorkoutToCycleDialog;
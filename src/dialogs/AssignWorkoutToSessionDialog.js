import React, { useState, useEffect, useContext } from 'react';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { useToast } from '../utils/ToastContext';
import { UserContext } from '../utils/UserContext';
const apiUrl = process.env.REACT_APP_API_URL;

const AssignWorkoutToSessionDialog = ({ visible, onHide, sessionId, clientId, setRefreshKey }) => {
  const showToast = useToast();
  const [workouts, setWorkouts] = useState([]);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
    const {user} = useContext(UserContext);
  useEffect(() => {
    fetch(`${apiUrl}/workout/coach-workouts/userId/${user.userId}`)
      .then(async response => {
        const data = await response.json();
        // console.log(data)
        // setWorkouts(data.map(workout => ({ label: workout.name, value: workout.id })));
        setWorkouts([...data])
      })
      .catch(error => showToast('error', 'Error', error.message));
  }, [showToast, user.userId]);

  const handleAssign = async () => {
    if (!selectedWorkout) {
      showToast('error', 'Error', 'Please select a workout');
      return;
    }

    const body = {
      sessionId,
      workoutId: selectedWorkout,
      clientId
    };
    console.log('sessionId: ', body)
    // return;
    try {
      const response = await fetch(`${apiUrl}/workout/assign-session/${sessionId}`, {
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
      console.log(response)
      showToast('success', 'Success', 'Workout assigned to session successfully');
      onHide();
      setRefreshKey(old=>old+1);
    } catch (error) {
      showToast('error', 'Error', error.message);
    }
  };

  return (
    <Dialog header="Assign Workout to Session" visible={visible} style={{ width: '50vw' }} onHide={onHide}>
      <div className="p-fluid">
        <div className="p-field">
          <label htmlFor="workout">Workout</label>
            <Dropdown id="workouts" 
            options={workouts} 
            optionLabel="planName" 
            optionValue="id" 
            value={selectedWorkout} 
            onChange={(e) => setSelectedWorkout(e.value)} 
            placeholder="Select Workouts" 
            />
        </div>
      </div>
      <Button label="Assign" icon="pi pi-check" onClick={handleAssign} />
    </Dialog>
  );
};

export default AssignWorkoutToSessionDialog;
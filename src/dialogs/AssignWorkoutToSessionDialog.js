import React, { useState, useEffect, useContext } from 'react';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { useToast } from '../utils/ToastContext';
import { UserContext } from '../utils/UserContext';
import { assignSession, fetchCoachWorkouts } from '../services/workoutService';
const apiUrl = process.env.REACT_APP_API_URL;

const AssignWorkoutToSessionDialog = ({ visible, onHide, sessionId, clientId, setRefreshKey }) => {
  const showToast = useToast();
  const [workouts, setWorkouts] = useState([]);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const[loading, setLoading] = useState(false)
  const {user} = useContext(UserContext);

  useEffect(() => {
    setSelectedWorkout([null]);
  }, []);

  useEffect(() => {
    const loadWorkouts = async () => {
      try {
        const workoutsData = await fetchCoachWorkouts(user.userId);
        setWorkouts([...workoutsData])
      } catch (error) {
        showToast('error', 'Error', error.message);
      }
    };

    loadWorkouts();
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
    // return;
    try {
      setLoading(true)
      const result = await assignSession(sessionId, body);
      showToast('success', 'Session assigned successfully');
      onHide();
      setRefreshKey(old=>old+1);
    } catch (error) {
      showToast('error', 'Error', error.message);
    } finally {
      setLoading(false)
    }
  };

  return (
    <Dialog draggable={false}
    resizable={false}  header="Assign Workout to Session" className="responsive-dialog" visible={visible} style={{ width: '50vw' }} onHide={onHide}>
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
      <Button label="Assign" icon="pi pi-check" onClick={handleAssign} loading={loading} />
    </Dialog>
  );
};

export default AssignWorkoutToSessionDialog;
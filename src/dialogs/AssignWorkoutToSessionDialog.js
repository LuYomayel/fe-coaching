import React, { useState, useEffect, useContext } from 'react';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { useToast } from '../utils/ToastContext';
import { UserContext } from '../utils/UserContext';
import {
  assignSession,
  assignTrainingSessionToClient,
  findAllWorkoutTemplatesByCoachId
} from '../services/workoutService';
import { formatDateToApi } from '../utils/UtilFunctions';
import { useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';
const AssignWorkoutToSessionDialog = ({ visible, onHide, sessionId, clientId, setRefreshKey, selectedDate }) => {
  const showToast = useToast();
  const [workouts, setWorkouts] = useState([]);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [loading, setLoading] = useState(false);
  const { coach } = useContext(UserContext);
  const intl = useIntl();
  const navigate = useNavigate();
  useEffect(() => {
    setSelectedWorkout([null]);
  }, []);

  useEffect(() => {
    const loadWorkouts = async () => {
      try {
        const { data } = await findAllWorkoutTemplatesByCoachId(coach.id);
        setWorkouts(data);
      } catch (error) {
        showToast('error', 'Error', error.message);
      }
    };

    if (visible) loadWorkouts();
  }, [showToast, coach.id, visible]);

  const handleAssign = async () => {
    if (!selectedWorkout) {
      showToast('error', 'Error', 'Please select a workout');
      return;
    }
    const sessionDate = formatDateToApi(selectedDate ? selectedDate : new Date());
    const body = {
      sessionId,
      workoutId: selectedWorkout,
      clientId,
      sessionDate: sessionDate
    };

    try {
      setLoading(true);
      if (sessionId) {
        await assignSession(sessionId, body);
      } else {
        await assignTrainingSessionToClient(body);
      }
      showToast('success', 'Session assigned successfully');
      onHide();
      setRefreshKey((old) => old + 1);
    } catch (error) {
      showToast('error', 'Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    navigate(`/plans/create-and-assign`, { state: { clientId, sessionDate: selectedDate, changeToTemplate: false } });
  };

  return (
    <Dialog
      draggable={false}
      dismissableMask
      resizable={false}
      header="Assign Workout to Session"
      className="responsive-dialog"
      visible={visible}
      style={{ width: '50vw' }}
      onHide={onHide}
    >
      <div className="p-fluid">
        <div className="p-field">
          <label htmlFor="workout">Workout</label>
          <Dropdown
            id="workouts"
            options={workouts}
            optionLabel={(option) => (option.instanceName ? option.instanceName : option.planName)}
            optionValue="id"
            value={selectedWorkout}
            onChange={(e) => setSelectedWorkout(e.value)}
            placeholder="Select Workouts"
          />
        </div>
      </div>
      <div className="flex justify-content-end gap-2">
        <Button
          label={intl.formatMessage({ id: 'common.assign' })}
          icon="pi pi-check"
          onClick={handleAssign}
          loading={loading}
        />
        <Button label={intl.formatMessage({ id: 'common.createNew' })} icon="pi pi-plus" onClick={handleCreateNew} />
      </div>
    </Dialog>
  );
};

export default AssignWorkoutToSessionDialog;

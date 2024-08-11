import React, { useState, useEffect, useContext } from 'react';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { useToast } from '../utils/ToastContext';
import { UserContext } from '../utils/UserContext';
import { assignWorkoutsToCycle, fetchCoachWorkouts, fetchAssignedWorkoutsForCycleDay, unassignWorkoutsFromCycle } from '../services/workoutService';

const apiUrl = process.env.REACT_APP_API_URL;

const AssignWorkoutToCycleDialog = ({ visible, onHide, clientId, setRefreshKey, cycleOptions, actionType }) => {
  const showToast = useToast();
  const [workouts, setWorkouts] = useState([]);
  const [assignments, setAssignments] = useState([{ workoutId: null, dayOfWeek: null }]);
  const [cycle, setCycle] = useState(-1);
  const [cycles, setCycles] = useState([]);
  const { user } = useContext(UserContext);
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState([]); // Estado para manejar los días
  const [selectedDay, setSelectedDay] = useState(null); // Nuevo estado para el día seleccionado
  const [assignedWorkouts, setAssignedWorkouts] = useState([]); // Estado para manejar los entrenamientos asignados
  
  useEffect(() => {
    setAssignments([{ workoutId: null, dayOfWeek: null }]);
    setCycle(-1)
    setSelectedDay(null);
    setAssignedWorkouts([])
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

  useEffect(() => {
    if (cycleOptions) {
      const options = cycleOptions.map((cycle) => ({ label: cycle.name, value: cycle.id }));
      setCycles(options);
    }
  }, [cycleOptions]);

  useEffect(() => {
  const loadAssignedWorkouts = async () => {
    if (actionType === 'unassign' && cycle !== -1 && selectedDay !== null) {
      try {
        const assignedData = await fetchAssignedWorkoutsForCycleDay(cycle, selectedDay); // Fetch para los workouts asignados
        setAssignedWorkouts(assignedData.map(workout => ({
          label: workout.planName,
          value: workout.id
        })));
      } catch (error) {
        showToast('error', 'Error fetching assigned workouts', error.message);
      }
    }
  };

  loadAssignedWorkouts();
}, [showToast, actionType, cycle, selectedDay]); // Incluye selectedDay como dependencia

  const daysOfWeek = [
    { label: 'Monday', value: 1 },
    { label: 'Tuesday', value: 2 },
    { label: 'Wednesday', value: 3 },
    { label: 'Thursday', value: 4 },
    { label: 'Friday', value: 5 },
    { label: 'Saturday', value: 6 },
    { label: 'Sunday', value: 7 },
  ];

  const handleAction = async () => {
    const body = {
      assignments: assignments.filter(
        (assignment) => assignment.dayOfWeek !== null && assignment.workoutId !== null
      ),
    };
    if (body.assignments.length === 0)
      return showToast('error', 'Error', 'Please select at least one workout.');

    if (cycle === -1) return showToast('error', 'Error', 'Please select a cycle.');

    try {
      setLoading(true);
      if (actionType === 'assign') {
        await assignWorkoutsToCycle(cycle, clientId, body);
        showToast('success', 'Success', 'Workouts assigned to cycle successfully');
      } else {
        await unassignWorkoutsFromCycle(cycle, body); // Implementa la lógica de desasignar
        showToast('success', 'Success', 'Workouts unassigned from cycle successfully');
      }
      onHide();
      setSelectedDay(null);
      setRefreshKey((old) => old + 1);
    } catch (error) {
      showToast('error', 'Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAssignment = () => {
    if (
      !assignments[assignments.length - 1].workoutId ||
      assignments[assignments.length - 1].dayOfWeek === null
    )
      return showToast('error', 'Error', 'Please select a workout and a day of week for the last assignment.');
    setAssignments([...assignments, { workoutId: null, dayOfWeek: null }]);
  };

  const handleAssignmentChange = (index, field, value) => {
    const updatedAssignments = [...assignments];
    updatedAssignments[index][field] = value;
    setAssignments(updatedAssignments);
  };

  const removeAssignment = (index) => {
    const updatedAssignments = assignments.filter((assignments, i) => index !== i);
    if (updatedAssignments.length > 0) setAssignments(updatedAssignments);
    else {
      showToast('error', 'Error', 'Select at least one workout.');
    }
  };

// Conditionally render elements based on actionType and current state
return (
  <Dialog
    draggable={false}
    resizable={false}
    header={actionType === 'assign' ? 'Assign Workouts to Cycle' : 'Unassign Workouts from Cycle'}
    className="responsive-dialog"
    visible={visible}
    onHide={onHide}
    style={{ width: '50vw' }}
  >
    <div className="col-12">
      <div className="p-field">
        <label>Cycle:</label>
        <Dropdown
          value={cycle}
          options={cycles}
          onChange={(e) => {
            setCycle(e.value); // Update the selected cycle
            if (actionType === 'unassign') {
              setSelectedDay(null); // Reset selected day when changing cycle for unassign
              setAssignedWorkouts([]); // Clear assigned workouts when changing cycle for unassign
            }
          }}
          placeholder="Select Cycle"
        />
      </div>
    </div>

    {actionType === 'unassign' && cycle !== -1 && (
      <div className="p-field grid">
        <div className="col-6">
          <label>Day of Week:</label>
          <Dropdown
            value={selectedDay}
            options={daysOfWeek}
            onChange={(e) => {
              setSelectedDay(e.value); // Actualiza el día seleccionado
              // Resetea los assignments y carga los workouts para desasignar
              setAssignments([{ workoutId: null, dayOfWeek: e.value }]);
            }}
            placeholder="Select Day of Week"
          />
        </div>
        <div className="col-6">
          <label>Select Workout:</label>
          <Dropdown
            value={assignments[0].workoutId} // Accede al workoutId del primer assignment
            options={assignedWorkouts} // Usa los workouts asignados
            onChange={(e) => handleAssignmentChange(0, 'workoutId', e.value)}
            placeholder="Select Workout to Unassign"
            disabled={selectedDay === null} // Deshabilita si no hay día seleccionado
          />
        </div>
      </div>
    )}

    {actionType === 'assign' && assignments.map((assignment, index) => (
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
      {actionType === 'assign' && (
        <Button
          label="Add Assignment"
          icon="pi pi-plus"
          onClick={handleAddAssignment}
          className="p-button-secondary"
        />
      )}
      <Button
        label={actionType === 'assign' ? 'Assign Workouts' : 'Unassign Workouts'}
        icon={actionType === 'assign' ? 'pi pi-check' : 'pi pi-trash'}
        onClick={handleAction}
        className="p-button-primary"
        loading={loading}
      />
    </div>
  </Dialog>
);
};

export default AssignWorkoutToCycleDialog;
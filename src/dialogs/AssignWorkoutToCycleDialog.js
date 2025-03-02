import React, { useState, useEffect, useContext } from 'react';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { useToast } from '../utils/ToastContext';
import { UserContext } from '../utils/UserContext';
import { assignWorkoutsToCycle, fetchAssignedWorkoutsForCycleDay, unassignWorkoutsFromCycle, findAllWorkoutTemplatesByCoachId } from '../services/workoutService';
import { useIntl } from 'react-intl';
import '../styles/AssignWorkoutToCycleDialog.css';

const AssignWorkoutToCycleDialog = ({ visible, onHide, clientId, setRefreshKey, cycleOptions, actionType }) => {
  const intl = useIntl();
  const showToast = useToast();
  const [workouts, setWorkouts] = useState([]);
  const [assignments, setAssignments] = useState([{ workoutId: null, dayOfWeek: null }]);
  const [cycle, setCycle] = useState(-1);
  const [cycles, setCycles] = useState([]);
  const { coach } = useContext(UserContext);
  const [loading, setLoading] = useState(false);
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
        const {data} = await findAllWorkoutTemplatesByCoachId(coach.id);
        
        setWorkouts(data);
      } catch (error) {
        showToast('error', 'Error', error.message);
      }
    };

    if (visible) loadWorkouts();
  }, [showToast, coach.id, visible]);

  useEffect(() => {
    if (cycleOptions && visible) {
      setCycles(cycleOptions);
    }
  }, [cycleOptions, visible]);

  useEffect(() => {
  const loadAssignedWorkouts = async () => {
    if (actionType === 'unassign' && cycle !== -1 && selectedDay !== null) {
      try {
        const {data} = await fetchAssignedWorkoutsForCycleDay(cycle, selectedDay); // Fetch para los workouts asignados
        console.log(data)
        setAssignedWorkouts(data.map(workout => ({
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
    { label: intl.formatMessage({ id: 'workoutTable.monday' }), value: 1 },
    { label: intl.formatMessage({ id: 'workoutTable.tuesday' }), value: 2 },
    { label: intl.formatMessage({ id: 'workoutTable.wednesday' }), value: 3 },
    { label: intl.formatMessage({ id: 'workoutTable.thursday' }), value: 4 },
    { label: intl.formatMessage({ id: 'workoutTable.friday' }), value: 5 },
    { label: intl.formatMessage({ id: 'workoutTable.saturday' }), value: 6 },
    { label: intl.formatMessage({ id: 'workoutTable.sunday' }), value: 7 },
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
        const {data} = await assignWorkoutsToCycle(cycle, clientId, body);
        if(data && data.trainingSessions && data.trainingSessions.length > 0) {
          showToast('success', intl.formatMessage({ id: 'assignWorkoutToCycleDialog.success.assign' }), intl.formatMessage({ id: 'assignWorkoutToCycleDialog.success.assign.detail' }));
        } else {
          showToast('error', intl.formatMessage({ id: 'assignWorkoutToCycleDialog.error.assign' }), intl.formatMessage({ id: 'assignWorkoutToCycleDialog.error.assign.detail' }));
        }
      } else {
        const {message} = await unassignWorkoutsFromCycle(cycle, body); // Implementa la lógica de desasignar
        if(message === 'success') {
          showToast('success', intl.formatMessage({ id: 'assignWorkoutToCycleDialog.success.unassign' }), intl.formatMessage({ id: 'assignWorkoutToCycleDialog.success.unassign.detail' }));
        } else {
          showToast('error', intl.formatMessage({ id: 'assignWorkoutToCycleDialog.error.unassign' }), intl.formatMessage({ id: 'assignWorkoutToCycleDialog.error.unassign.detail' }));
        }
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
      return showToast('error', 'Error', intl.formatMessage({ id: 'assignWorkoutToCycleDialog.error.selectWorkoutAndDay' }));
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
      showToast('error', 'Error', intl.formatMessage({ id: 'assignWorkoutToCycleDialog.error.selectAtLeastOneWorkout' }));
    }
  };

// Conditionally render elements based on actionType and current state
return (
  <Dialog
    draggable={false} dismissableMask
    resizable={false}
    header={actionType === 'assign' ? intl.formatMessage({ id: 'assignWorkoutToCycleDialog.assignWorkoutsToCycle' }) : intl.formatMessage({ id: 'assignWorkoutToCycleDialog.unassignWorkoutsFromCycle' })}
    className="responsive-dialog assign-workout-dialog"
    visible={visible}
    onHide={onHide}
  >
    <div className="col-12">
      <div className="p-field">
        <label>{intl.formatMessage({ id: 'assignWorkoutToCycleDialog.cycle' })}:</label>
        <Dropdown
          value={cycle}
          options={cycles.map(cycle => ({ label: cycle.label, value: cycle.value })).filter(cycle => cycle.value !== -1)}
          onChange={(e) => {
            setCycle(e.value);
            if (actionType === 'unassign') {
              setSelectedDay(null);
              setAssignedWorkouts([]);
            }
          }}
          placeholder={intl.formatMessage({ id: 'assignWorkoutToCycleDialog.selectCycle' })}
        />
      </div>
    </div>

    {actionType === 'unassign' && cycle !== -1 && (
      <div className="p-field grid">
        <div className="col-6">
          <label>{intl.formatMessage({ id: 'assignWorkoutToCycleDialog.dayOfWeek' })}:</label>
          <Dropdown
            value={selectedDay}
            options={daysOfWeek}
            onChange={(e) => {
              setSelectedDay(e.value);
              setAssignments([{ workoutId: null, dayOfWeek: e.value }]);
            }}
            placeholder={intl.formatMessage({ id: 'assignWorkoutToCycleDialog.selectDayOfWeek' })}
          />
        </div>
        <div className="col-6">
          <label>{intl.formatMessage({ id: 'assignWorkoutToCycleDialog.selectWorkout' })}:</label>
          <Dropdown
            value={assignments[0].workoutId}
            options={assignedWorkouts.map(workout => ({ label: workout.label, value: workout.value }))}
            onChange={(e) => handleAssignmentChange(0, 'workoutId', e.value)}
            placeholder={intl.formatMessage({ id: 'assignWorkoutToCycleDialog.selectWorkoutToUnassign' })}
            disabled={selectedDay === null}
          />
        </div>
      </div>
    )}

    {actionType === 'assign' && assignments.map((assignment, index) => (
      <Card key={index} title={`${intl.formatMessage({ id: 'assignWorkoutToCycleDialog.assignment' })} ${index + 1}`} className="mb-2">
        <div className="p-field grid">
          <div className="col-6">
            <Dropdown
              value={assignment.workoutId}
              options={workouts.map((workout) => ({ label: workout.planName, value: workout.id }))}
              onChange={(e) => handleAssignmentChange(index, 'workoutId', e.value)}
              placeholder={intl.formatMessage({ id: 'assignWorkoutToCycleDialog.selectWorkout' })}
            />
          </div>
          <div className="col-5">
            <Dropdown
              value={assignment.dayOfWeek}
              options={daysOfWeek}
              optionValue='value'
              onChange={(e) => handleAssignmentChange(index, 'dayOfWeek', e.value)}
              placeholder={intl.formatMessage({ id: 'assignWorkoutToCycleDialog.selectDayOfWeek' })}
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
          label={intl.formatMessage({ id: 'assignWorkoutToCycleDialog.addAssignment' })}
          icon="pi pi-plus"
          onClick={handleAddAssignment}
          className="p-button-secondary"
        />
      )}
      <Button
        label={actionType === 'assign' ? intl.formatMessage({ id: 'assignWorkoutToCycleDialog.assignWorkouts' }) : intl.formatMessage({ id: 'assignWorkoutToCycleDialog.unassignWorkouts' })}
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
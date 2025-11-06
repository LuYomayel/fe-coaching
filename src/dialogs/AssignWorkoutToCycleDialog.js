import React, { useState, useEffect, useContext } from 'react';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { RadioButton } from 'primereact/radiobutton';
import { Checkbox } from 'primereact/checkbox';
import { useToast } from '../contexts/ToastContext';
import { UserContext } from '../contexts/UserContext';
import {
  assignWorkoutsToCycle,
  fetchAssignedWorkoutsForCycleDay,
  unassignWorkoutsFromCycle,
  findAllWorkoutTemplatesByCoachId,
  deleteTrainingCycle,
  verifyTrainingCycleDeletion
} from '../services/workoutService';
import { useIntl } from 'react-intl';

const AssignWorkoutToCycleDialog = ({ visible, onHide, clientId, setRefreshKey, cycleOptions, actionType }) => {
  const intl = useIntl();
  const { showToast } = useToast();
  const [workouts, setWorkouts] = useState([]);
  const [assignments, setAssignments] = useState([{ workoutId: null, dayOfWeek: null }]);
  const [cycle, setCycle] = useState(-1);
  const [cycles, setCycles] = useState([]);
  const { coach } = useContext(UserContext);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null); // Nuevo estado para el día seleccionado
  const [assignedWorkouts, setAssignedWorkouts] = useState([]); // Estado para manejar los entrenamientos asignados
  const [unassignOption, setUnassignOption] = useState('day'); // 'day' para desasignar por día, 'cycle' para borrar todo el ciclo
  const [verificationResult, setVerificationResult] = useState(null); // Estado para almacenar el resultado de la verificación
  const [forceDelete, setForceDelete] = useState(false); // Estado para controlar si se debe forzar la eliminación
  const [showVerificationDialog, setShowVerificationDialog] = useState(false); // Estado para controlar la visibilidad del diálogo de verificación

  useEffect(() => {
    setAssignments([{ workoutId: null, dayOfWeek: null }]);
    setCycle(-1);
    setSelectedDay(null);
    setAssignedWorkouts([]);
    setUnassignOption('day');
    setVerificationResult(null);
    setForceDelete(false);
    setShowVerificationDialog(false);
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

  useEffect(() => {
    if (cycleOptions && visible) {
      setCycles(cycleOptions);
    }
  }, [cycleOptions, visible]);

  useEffect(() => {
    const loadAssignedWorkouts = async () => {
      if (actionType === 'unassign' && cycle !== -1 && selectedDay !== null && unassignOption === 'day') {
        try {
          const { data } = await fetchAssignedWorkoutsForCycleDay(cycle, selectedDay); // Fetch para los workouts asignados
          setAssignedWorkouts(
            data.map((workout) => ({
              label: workout.planName,
              value: workout.id
            }))
          );
        } catch (error) {
          showToast('error', 'Error fetching assigned workouts', error.message);
        }
      }
    };

    loadAssignedWorkouts();
  }, [showToast, actionType, cycle, selectedDay, unassignOption]); // Incluye unassignOption como dependencia

  const daysOfWeek = [
    { label: intl.formatMessage({ id: 'workoutTable.monday' }), value: 1 },
    { label: intl.formatMessage({ id: 'workoutTable.tuesday' }), value: 2 },
    { label: intl.formatMessage({ id: 'workoutTable.wednesday' }), value: 3 },
    { label: intl.formatMessage({ id: 'workoutTable.thursday' }), value: 4 },
    { label: intl.formatMessage({ id: 'workoutTable.friday' }), value: 5 },
    { label: intl.formatMessage({ id: 'workoutTable.saturday' }), value: 6 },
    { label: intl.formatMessage({ id: 'workoutTable.sunday' }), value: 7 }
  ];

  const handleVerifyDeletion = async () => {
    if (cycle === -1) return showToast('error', 'Error', 'Please select a cycle.');

    try {
      setLoading(true);
      const { data } = await verifyTrainingCycleDeletion(cycle);
      console.log('data', data);
      setVerificationResult(data);
      setShowVerificationDialog(true);
    } catch (error) {
      showToast('error', 'Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (cycle === -1) return showToast('error', 'Error', 'Please select a cycle.');

    try {
      setLoading(true);
      if (actionType === 'assign') {
        const body = {
          assignments: assignments.filter(
            (assignment) => assignment.dayOfWeek !== null && assignment.workoutId !== null
          )
        };
        if (body.assignments.length === 0) return showToast('error', 'Error', 'Please select at least one workout.');

        const { data } = await assignWorkoutsToCycle(cycle, clientId, body);
        if (data && data.trainingSessions && data.trainingSessions.length > 0) {
          showToast(
            'success',
            intl.formatMessage({
              id: 'assignWorkoutToCycleDialog.success.assign'
            }),
            intl.formatMessage({
              id: 'assignWorkoutToCycleDialog.success.assign.detail'
            })
          );
        } else {
          showToast(
            'error',
            intl.formatMessage({
              id: 'assignWorkoutToCycleDialog.error.assign'
            }),
            intl.formatMessage({
              id: 'assignWorkoutToCycleDialog.error.assign.detail'
            })
          );
        }
      } else {
        // Lógica para desasignar
        if (unassignOption === 'day') {
          // Desasignar entrenamientos de un día específico
          if (selectedDay === null) {
            return showToast('error', 'Error', 'Please select a day of the week.');
          }

          const body = {
            assignments: assignments.filter(
              (assignment) => assignment.dayOfWeek !== null && assignment.workoutId !== null
            )
          };

          if (body.assignments.length === 0) {
            return showToast('error', 'Error', 'Please select at least one workout to unassign.');
          }

          const { message } = await unassignWorkoutsFromCycle(cycle, body);
          if (message === 'success') {
            showToast(
              'success',
              intl.formatMessage({
                id: 'assignWorkoutToCycleDialog.success.unassign'
              }),
              intl.formatMessage({
                id: 'assignWorkoutToCycleDialog.success.unassign.detail'
              })
            );
          } else {
            showToast(
              'error',
              intl.formatMessage({
                id: 'assignWorkoutToCycleDialog.error.unassign'
              }),
              intl.formatMessage({
                id: 'assignWorkoutToCycleDialog.error.unassign.detail'
              })
            );
          }
        } else {
          // Borrar todo el ciclo
          if (!showVerificationDialog) {
            // Si no se ha verificado, primero verificamos
            await handleVerifyDeletion();
            return;
          }

          // Si ya se ha verificado, procedemos con la eliminación
          const { message } = await deleteTrainingCycle(cycle, forceDelete);
          if (message === 'success') {
            showToast(
              'success',
              intl.formatMessage({
                id: 'assignWorkoutToCycleDialog.success.deleteCycle'
              }),
              intl.formatMessage({
                id: 'assignWorkoutToCycleDialog.success.deleteCycle.detail'
              })
            );
            setShowVerificationDialog(false);
            onHide();
            setSelectedDay(null);
            setRefreshKey((old) => old + 1);
          } else {
            showToast(
              'error',
              intl.formatMessage({
                id: 'assignWorkoutToCycleDialog.error.deleteCycle'
              }),
              intl.formatMessage({
                id: 'assignWorkoutToCycleDialog.error.deleteCycle.detail'
              })
            );
          }
        }
      }
      if (actionType === 'assign' || unassignOption === 'day') {
        onHide();
        setSelectedDay(null);
        setRefreshKey((old) => old + 1);
      }
    } catch (error) {
      showToast('error', 'Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAssignment = () => {
    if (!assignments[assignments.length - 1].workoutId || assignments[assignments.length - 1].dayOfWeek === null)
      return showToast(
        'error',
        'Error',
        intl.formatMessage({
          id: 'assignWorkoutToCycleDialog.error.selectWorkoutAndDay'
        })
      );
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
      showToast(
        'error',
        'Error',
        intl.formatMessage({
          id: 'assignWorkoutToCycleDialog.error.selectAtLeastOneWorkout'
        })
      );
    }
  };

  const renderVerificationDialog = () => {
    if (!verificationResult) return null;

    const hasSetLogs = verificationResult.hasSetLogs;
    const setLogsCount = verificationResult.setLogsCount;
    const canDelete = !hasSetLogs || forceDelete;

    return (
      <Dialog
        header={intl.formatMessage({
          id: 'assignWorkoutToCycleDialog.verificationTitle'
        })}
        visible={showVerificationDialog}
        style={{ width: '50vw' }}
        onHide={() => setShowVerificationDialog(false)}
        className="verification-dialog"
        footer={
          <div className="flex justify-content-end gap-2">
            <Button
              label={intl.formatMessage({
                id: 'assignWorkoutToCycleDialog.cancel'
              })}
              icon="pi pi-times"
              onClick={() => setShowVerificationDialog(false)}
              className="p-button-text"
            />
            <Button
              label={intl.formatMessage({
                id: 'assignWorkoutToCycleDialog.confirm'
              })}
              icon="pi pi-check"
              onClick={handleAction}
              className="p-button-danger"
              disabled={!canDelete}
            />
          </div>
        }
      >
        <div className="p-fluid verification-content">
          {hasSetLogs ? (
            <>
              <div className="verification-warning">
                <i
                  className="pi pi-exclamation-triangle mr-2"
                  style={{ color: 'var(--warning-color)', fontSize: '1.5rem' }}
                ></i>
                <h3 className="m-0">
                  {intl.formatMessage({
                    id: 'assignWorkoutToCycleDialog.warningTitle'
                  })}
                </h3>
              </div>
              <div className="verification-message">
                <p>
                  {intl.formatMessage(
                    {
                      id: 'assignWorkoutToCycleDialog.warningMessage'
                    },
                    {
                      count: setLogsCount
                    }
                  )}
                </p>
              </div>
              <div className="verification-checkbox">
                <Checkbox inputId="forceDelete" checked={forceDelete} onChange={(e) => setForceDelete(e.checked)} />
                <label htmlFor="forceDelete" className="ml-2">
                  {intl.formatMessage({
                    id: 'assignWorkoutToCycleDialog.forceDelete'
                  })}
                </label>
              </div>
            </>
          ) : (
            <div className="verification-safe">
              <i className="pi pi-check-circle mr-2" style={{ color: 'var(--success-color)', fontSize: '1.5rem' }}></i>
              <p>
                {intl.formatMessage({
                  id: 'assignWorkoutToCycleDialog.safeToDelete'
                })}
              </p>
            </div>
          )}
        </div>
      </Dialog>
    );
  };

  // Conditionally render elements based on actionType and current state
  return (
    <>
      <Dialog
        draggable={false}
        dismissableMask
        resizable={false}
        header={
          actionType === 'assign'
            ? intl.formatMessage({
                id: 'assignWorkoutToCycleDialog.assignWorkoutsToCycle'
              })
            : intl.formatMessage({
                id: 'assignWorkoutToCycleDialog.unassignWorkoutsFromCycle'
              })
        }
        className="responsive-dialog assign-workout-dialog"
        visible={visible}
        onHide={onHide}
      >
        <div className="col-12">
          <div className="p-field">
            <label>{intl.formatMessage({ id: 'assignWorkoutToCycleDialog.cycle' })}:</label>
            <Dropdown
              value={cycle}
              options={cycles
                .map((cycle) => ({ label: cycle.label, value: cycle.value }))
                .filter((cycle) => cycle.value !== -1)}
              onChange={(e) => {
                setCycle(e.value);
                if (actionType === 'unassign') {
                  setSelectedDay(null);
                  setAssignedWorkouts([]);
                }
              }}
              placeholder={intl.formatMessage({
                id: 'assignWorkoutToCycleDialog.selectCycle'
              })}
              className="w-full"
            />
          </div>
        </div>

        {actionType === 'unassign' && cycle !== -1 && (
          <div className="col-12 mt-3">
            <div className="p-field">
              <div className="flex align-items-center mb-2">
                <RadioButton
                  inputId="unassignDay"
                  name="unassignOption"
                  value="day"
                  onChange={(e) => setUnassignOption(e.value)}
                  checked={unassignOption === 'day'}
                />
                <label htmlFor="unassignDay" className="ml-2">
                  {intl.formatMessage({
                    id: 'assignWorkoutToCycleDialog.unassignByDay'
                  })}
                </label>
              </div>
              <div className="flex align-items-center">
                <RadioButton
                  inputId="unassignCycle"
                  name="unassignOption"
                  value="cycle"
                  onChange={(e) => setUnassignOption(e.value)}
                  checked={unassignOption === 'cycle'}
                />
                <label htmlFor="unassignCycle" className="ml-2">
                  {intl.formatMessage({
                    id: 'assignWorkoutToCycleDialog.deleteEntireCycle'
                  })}
                </label>
              </div>
            </div>
          </div>
        )}

        {actionType === 'unassign' && cycle !== -1 && unassignOption === 'day' && (
          <div className="flex flex-row gap-2 mt-3">
            <div className="p-field">
              <label>
                {intl.formatMessage({
                  id: 'assignWorkoutToCycleDialog.dayOfWeek'
                })}
                :
              </label>
              <Dropdown
                value={selectedDay}
                options={daysOfWeek}
                onChange={(e) => {
                  setSelectedDay(e.value);
                  setAssignments([{ workoutId: null, dayOfWeek: e.value }]);
                }}
                placeholder={intl.formatMessage({
                  id: 'assignWorkoutToCycleDialog.selectDayOfWeek'
                })}
                className="w-full"
              />
            </div>
            <div className="p-field">
              <label>
                {intl.formatMessage({
                  id: 'assignWorkoutToCycleDialog.selectWorkout'
                })}
                :
              </label>
              <Dropdown
                value={assignments[0].workoutId}
                options={assignedWorkouts.map((workout) => ({
                  label: workout.label,
                  value: workout.value
                }))}
                onChange={(e) => handleAssignmentChange(0, 'workoutId', e.value)}
                placeholder={intl.formatMessage({
                  id: 'assignWorkoutToCycleDialog.selectWorkoutToUnassign'
                })}
                disabled={selectedDay === null}
                className="w-full"
              />
            </div>
          </div>
        )}

        {actionType === 'assign' &&
          assignments.map((assignment, index) => (
            <Card
              key={index}
              title={`${intl.formatMessage({ id: 'assignWorkoutToCycleDialog.assignment' })} ${index + 1}`}
              className="mb-2"
            >
              <div className="flex flex-row gap-2">
                <div className="p-field w-full">
                  <Dropdown
                    value={assignment.workoutId}
                    options={workouts.map((workout) => ({
                      label: workout.planName,
                      value: workout.id
                    }))}
                    onChange={(e) => handleAssignmentChange(index, 'workoutId', e.value)}
                    placeholder={intl.formatMessage({
                      id: 'assignWorkoutToCycleDialog.selectWorkout'
                    })}
                    className="w-full"
                  />
                </div>
                <div className="p-field w-full">
                  <Dropdown
                    value={assignment.dayOfWeek}
                    options={daysOfWeek}
                    optionValue="value"
                    onChange={(e) => handleAssignmentChange(index, 'dayOfWeek', e.value)}
                    placeholder={intl.formatMessage({
                      id: 'assignWorkoutToCycleDialog.selectDayOfWeek'
                    })}
                    className="w-full"
                  />
                </div>
                <div className="p-field">
                  <Button icon="pi pi-times" onClick={() => removeAssignment(index)} />
                </div>
              </div>
            </Card>
          ))}

        <div className="flex justify-content-between">
          {actionType === 'assign' && (
            <Button
              label={intl.formatMessage({
                id: 'assignWorkoutToCycleDialog.addAssignment'
              })}
              icon="pi pi-plus"
              onClick={handleAddAssignment}
              className="p-button-secondary"
            />
          )}
          <Button
            label={
              actionType === 'assign'
                ? intl.formatMessage({
                    id: 'assignWorkoutToCycleDialog.assignWorkouts'
                  })
                : unassignOption === 'day'
                  ? intl.formatMessage({
                      id: 'assignWorkoutToCycleDialog.unassignWorkouts'
                    })
                  : intl.formatMessage({
                      id: 'assignWorkoutToCycleDialog.deleteCycle'
                    })
            }
            icon={actionType === 'assign' ? 'pi pi-check' : 'pi pi-trash'}
            onClick={handleAction}
            className="p-button-primary"
            loading={loading}
          />
        </div>
      </Dialog>
      {renderVerificationDialog()}
    </>
  );
};

export default AssignWorkoutToCycleDialog;

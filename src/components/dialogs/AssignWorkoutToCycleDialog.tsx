import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { RadioButton } from 'primereact/radiobutton';
import { Checkbox, CheckboxChangeEvent } from 'primereact/checkbox';
import { useAssignWorkoutToCycleDialog } from '../../hooks/dialogs/useAssignWorkoutToCycleDialog';

interface ICycleOption {
  label: string;
  value: number;
}

interface IAssignWorkoutToCycleDialogProps {
  visible: boolean;
  onHide: () => void;
  clientId: number | string;
  setRefreshKey: (fn: (old: number) => number) => void;
  cycleOptions: ICycleOption[];
  actionType: 'assign' | 'unassign';
}

const AssignWorkoutToCycleDialog = ({
  visible,
  onHide,
  clientId,
  setRefreshKey,
  cycleOptions,
  actionType
}: IAssignWorkoutToCycleDialogProps) => {
  const {
    intl,
    workouts,
    assignments,
    cycle,
    cycles,
    loading,
    selectedDay,
    assignedWorkouts,
    unassignOption,
    verificationResult,
    forceDelete,
    showVerificationDialog,
    daysOfWeek,
    setUnassignOption,
    setForceDelete,
    setShowVerificationDialog,
    handleAction,
    handleAddAssignment,
    handleAssignmentChange,
    removeAssignment,
    handleCycleChange,
    handleDayChange
  } = useAssignWorkoutToCycleDialog({
    visible,
    onHide,
    clientId,
    setRefreshKey,
    cycleOptions,
    actionType
  });

  const renderVerificationDialog = () => {
    if (!verificationResult) return null;

    const hasSetLogs = verificationResult.hasSetLogs;
    const setLogsCount = verificationResult.setLogsCount;
    const canDelete = !hasSetLogs || forceDelete;

    return (
      <Dialog
        header={intl.formatMessage({ id: 'assignWorkoutToCycleDialog.verificationTitle' })}
        visible={showVerificationDialog}
        style={{ width: '50vw' }}
        onHide={() => setShowVerificationDialog(false)}
        className="verification-dialog"
        footer={
          <div className="flex justify-content-end gap-2">
            <Button
              label={intl.formatMessage({ id: 'assignWorkoutToCycleDialog.cancel' })}
              icon="pi pi-times"
              onClick={() => setShowVerificationDialog(false)}
              className="p-button-text"
            />
            <Button
              label={intl.formatMessage({ id: 'assignWorkoutToCycleDialog.confirm' })}
              icon="pi pi-check"
              onClick={handleAction}
              className="p-button-danger"
              disabled={!canDelete}
            />
          </div>
        }
      >
        <div className="p-fluid">
          {hasSetLogs ? (
            <>
              <div className="flex align-items-center gap-2 mb-3">
                <i
                  className="pi pi-exclamation-triangle"
                  style={{ color: 'var(--warning-color)', fontSize: '1.5rem' }}
                />
                <h3 className="m-0">{intl.formatMessage({ id: 'assignWorkoutToCycleDialog.warningTitle' })}</h3>
              </div>
              <div className="mb-3">
                <p>
                  {intl.formatMessage({ id: 'assignWorkoutToCycleDialog.warningMessage' }, { count: setLogsCount })}
                </p>
              </div>
              <div className="flex align-items-center gap-2">
                <Checkbox
                  inputId="forceDelete"
                  checked={forceDelete}
                  onChange={(e: CheckboxChangeEvent) => setForceDelete(!!e.checked)}
                />
                <label htmlFor="forceDelete">
                  {intl.formatMessage({ id: 'assignWorkoutToCycleDialog.forceDelete' })}
                </label>
              </div>
            </>
          ) : (
            <div className="flex align-items-center gap-2">
              <i className="pi pi-check-circle" style={{ color: 'var(--success-color)', fontSize: '1.5rem' }} />
              <p>{intl.formatMessage({ id: 'assignWorkoutToCycleDialog.safeToDelete' })}</p>
            </div>
          )}
        </div>
      </Dialog>
    );
  };

  return (
    <>
      <Dialog
        draggable={false}
        dismissableMask
        resizable={false}
        header={
          actionType === 'assign'
            ? intl.formatMessage({ id: 'assignWorkoutToCycleDialog.assignWorkoutsToCycle' })
            : intl.formatMessage({ id: 'assignWorkoutToCycleDialog.unassignWorkoutsFromCycle' })
        }
        className="responsive-dialog"
        visible={visible}
        onHide={onHide}
      >
        <div className="col-12">
          <div className="p-field">
            <label>{intl.formatMessage({ id: 'assignWorkoutToCycleDialog.cycle' })}:</label>
            <Dropdown
              value={cycle}
              options={cycles.map((c) => ({ label: c.label, value: c.value })).filter((c) => c.value !== -1)}
              onChange={(e) => handleCycleChange(e.value)}
              placeholder={intl.formatMessage({ id: 'assignWorkoutToCycleDialog.selectCycle' })}
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
                  {intl.formatMessage({ id: 'assignWorkoutToCycleDialog.unassignByDay' })}
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
                  {intl.formatMessage({ id: 'assignWorkoutToCycleDialog.deleteEntireCycle' })}
                </label>
              </div>
            </div>
          </div>
        )}

        {actionType === 'unassign' && cycle !== -1 && unassignOption === 'day' && (
          <div className="flex flex-row gap-2 mt-3">
            <div className="p-field">
              <label>{intl.formatMessage({ id: 'assignWorkoutToCycleDialog.dayOfWeek' })}:</label>
              <Dropdown
                value={selectedDay}
                options={daysOfWeek}
                onChange={(e) => handleDayChange(e.value)}
                placeholder={intl.formatMessage({ id: 'assignWorkoutToCycleDialog.selectDayOfWeek' })}
                className="w-full"
              />
            </div>
            <div className="p-field">
              <label>{intl.formatMessage({ id: 'assignWorkoutToCycleDialog.selectWorkout' })}:</label>
              <Dropdown
                value={assignments[0]?.workoutId}
                options={assignedWorkouts.map((w) => ({ label: w.label, value: w.value }))}
                onChange={(e) => handleAssignmentChange(0, 'workoutId', e.value)}
                placeholder={intl.formatMessage({ id: 'assignWorkoutToCycleDialog.selectWorkoutToUnassign' })}
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
                    options={workouts.map((w) => ({ label: w.planName, value: w.id }))}
                    onChange={(e) => handleAssignmentChange(index, 'workoutId', e.value)}
                    placeholder={intl.formatMessage({ id: 'assignWorkoutToCycleDialog.selectWorkout' })}
                    className="w-full"
                  />
                </div>
                <div className="p-field w-full">
                  <Dropdown
                    value={assignment.dayOfWeek}
                    options={daysOfWeek}
                    optionValue="value"
                    onChange={(e) => handleAssignmentChange(index, 'dayOfWeek', e.value)}
                    placeholder={intl.formatMessage({ id: 'assignWorkoutToCycleDialog.selectDayOfWeek' })}
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
              label={intl.formatMessage({ id: 'assignWorkoutToCycleDialog.addAssignment' })}
              icon="pi pi-plus"
              onClick={handleAddAssignment}
              className="p-button-secondary"
            />
          )}
          <Button
            label={
              actionType === 'assign'
                ? intl.formatMessage({ id: 'assignWorkoutToCycleDialog.assignWorkouts' })
                : unassignOption === 'day'
                  ? intl.formatMessage({ id: 'assignWorkoutToCycleDialog.unassignWorkouts' })
                  : intl.formatMessage({ id: 'assignWorkoutToCycleDialog.deleteCycle' })
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

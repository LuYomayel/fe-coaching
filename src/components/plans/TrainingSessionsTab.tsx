import { Card } from 'primereact/card';
import { FormattedMessage, useIntl } from 'react-intl';
import { Button } from 'primereact/button';
import { useNavigate, useLocation } from 'react-router-dom';
import { Dropdown } from 'primereact/dropdown';
import { ButtonGroup } from 'primereact/buttongroup';
import { Checkbox } from 'primereact/checkbox';
import { useTrainingSessions } from '../../hooks/coach/useTrainingSessions';
import { AssignWorkoutDialog } from '../dialogs/AssignWorkoutDialog';

export function TrainingSessionsTab() {
  const intl = useIntl();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    workouts,
    selectedWorkouts,
    setSelectedWorkouts,
    selectedClient,
    setSelectedClient,
    selectedRpeMethod,
    setSelectedRpeMethod,
    rpeMethods,
    isDialogVisible,
    setDialogVisible,
    students,
    filterOption,
    setFilterOption,
    filterOptions,
    handleDelete,
    handleUnassignFromClient,
    handleUnassignAllFromClient,
    handleAssignToClient,
    handleOpenAssignDialog
  } = useTrainingSessions();

  const renderPlanName = (rowData: any) => {
    const workoutInstanceTemplate = rowData.workoutInstanceTemplates[0];
    return (
      <div className="flex justify-content-between align-items-center">
        <div className="flex gap-2 align-items-center w-6">
          <Checkbox
            checked={selectedWorkouts.some((w) => w.id === rowData.id)}
            onChange={(e) => {
              if (e.checked) {
                setSelectedWorkouts([...selectedWorkouts, rowData]);
              } else {
                setSelectedWorkouts(selectedWorkouts.filter((w) => w.id !== rowData.id));
              }
            }}
            className="bg-primary-500"
          />
          <span className="text-lg">{rowData.planName}</span>
        </div>
        <ButtonGroup>
          {filterOption === 'all' || filterOption === 'general' ? (
            <Button
              tooltip={intl.formatMessage({ id: 'common.assign' })}
              icon="pi pi-user-plus"
              className="p-button-success"
              onClick={() => handleOpenAssignDialog(rowData.id)}
            />
          ) : (
            <Button
              tooltip={intl.formatMessage({ id: 'common.unassign' })}
              icon="pi pi-user-minus"
              className="p-button-warning"
              onClick={() => handleUnassignFromClient(rowData.id)}
            />
          )}
          <Button
            tooltip={intl.formatMessage({ id: 'common.edit' })}
            icon="pi pi-pencil"
            className="p-button-secondary"
            onClick={() =>
              navigate(`/plans/create/${rowData.id}`, {
                state: { isEdit: true, changeToTemplate: false, returnTo: location.pathname + location.search }
              })
            }
          />
          <Button
            tooltip={intl.formatMessage({ id: 'common.delete' })}
            icon="pi pi-trash"
            className="p-button-danger"
            onClick={() => handleDelete(workoutInstanceTemplate.id)}
          />
        </ButtonGroup>
      </div>
    );
  };

  return (
    <>
      <div>
        <h2 className="text-2xl font-bold mb-0">
          <FormattedMessage id="coach.sections.trainingPlans" />
        </h2>
        <small className="block text-gray-600">
          <FormattedMessage id="coach.plan.description" />
        </small>
      </div>
      <div className="flex justify-content-between align-items-center">
        <label>
          <FormattedMessage id="plansPage.filter.placeholder" />
        </label>
        <Dropdown
          value={filterOption}
          options={filterOptions}
          onChange={(e) => setFilterOption(e.value)}
          placeholder={intl.formatMessage({ id: 'plansPage.filter.placeholder' })}
          className="mb-3"
        />
      </div>
      <div className="grid">
        {workouts.map((plan, index) => (
          <div key={index} className="col-12 md:col-4">
            <Card
              title={renderPlanName(plan)}
              subTitle={plan.workoutInstanceTemplates[0].personalizedNotes}
              className="bg-primary-800"
            ></Card>
          </div>
        ))}
      </div>
      <div className="flex justify-content-end gap-2">
        <Button
          label={intl.formatMessage({ id: 'coach.buttons.newPlan' })}
          icon="pi pi-plus"
          className="p-button-rounded p-button-primary"
          onClick={() =>
            navigate('/plans/create', {
              state: { changeToTemplate: false, returnTo: location.pathname + location.search }
            })
          }
        />
        {filterOption === 'all' || filterOption === 'general' ? (
          <Button
            label={intl.formatMessage({ id: 'coach.buttons.assignPlans' })}
            icon="pi pi-user-plus"
            className="p-button-rounded p-button-primary"
            onClick={() => setDialogVisible(true)}
            disabled={selectedWorkouts.length === 0}
          />
        ) : (
          <Button
            label={intl.formatMessage({ id: 'coach.buttons.unassignPlans' })}
            icon="pi pi-user-minus"
            className="p-button-rounded p-button-primary"
            onClick={() => handleUnassignAllFromClient()}
            disabled={selectedWorkouts.length === 0}
          />
        )}
      </div>
      <AssignWorkoutDialog
        visible={isDialogVisible}
        onHide={() => setDialogVisible(false)}
        selectedWorkouts={selectedWorkouts}
        selectedClient={selectedClient}
        setSelectedClient={setSelectedClient}
        students={students}
        rpeMethods={rpeMethods}
        selectedRpeMethod={selectedRpeMethod}
        setSelectedRpeMethod={setSelectedRpeMethod}
        onAssign={handleAssignToClient}
      />
    </>
  );
}

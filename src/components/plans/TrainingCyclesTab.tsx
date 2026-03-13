import { Card } from 'primereact/card';
import { FormattedMessage, useIntl } from 'react-intl';
import { Button } from 'primereact/button';
import { ButtonGroup } from 'primereact/buttongroup';
import { useTrainingCycles } from '../../hooks/coach/useTrainingCycles';
import { useAssignCycleDialog } from '../../hooks/dialogs/useAssignCycleDialog';
import { AssignCycleDialog } from '../dialogs/AssignCycleDialog';
import { TrainingCycleTemplateDialog } from '../dialogs/TrainingCycleTemplateDialog';
import { useTrainingCycleTemplateDialog } from '../../hooks/dialogs/useTrainingCycleTemplateDialog';
import { useEffect, useState } from 'react';
import { useUser } from '../../contexts/UserContext';
import { api } from '../../services/api-client';

export function TrainingCyclesTab() {
  const intl = useIntl();
  const { coach, user } = useUser();
  const { trainingCycleTemplates, handleDeleteCycleTemplate, setRefreshKey } = useTrainingCycles();
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [deletedWorkoutTemplates, setDeletedWorkoutTemplates] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => {
    const fetchWorkouts = async () => {
      try {
        const { data } = await api.workout.findAllWorkoutTemplatesByCoachId();
        setWorkouts(data ?? []);
      } catch (error) {
        console.error('Error fetching workouts:', error);
      }
    };
    fetchWorkouts();
  }, [coach?.id]);

  useEffect(() => {
    const fetchDeletedWorkoutTemplates = async () => {
      try {
        const { data } = await api.workout.fetchDeletedWorkoutTemplatesByCoachId();
        setDeletedWorkoutTemplates(data ?? []);
      } catch (error) {
        console.error('Error fetching deleted workout templates:', error);
      }
    };
    fetchDeletedWorkoutTemplates();
  }, [coach?.id]);

  useEffect(() => {
    const loadStudents = async () => {
      try {
        const { data } = await api.coach.fetchStudents();
        setStudents(data ?? []);
      } catch (error) {
        console.error('Error loading students:', error);
      }
    };
    loadStudents();
  }, [user?.userId]);

  const assignCycleDialog = useAssignCycleDialog(() => {
    setRefreshKey((prev) => prev + 1);
  });

  const cycleTemplateDialog = useTrainingCycleTemplateDialog(workouts, deletedWorkoutTemplates, () => {
    setRefreshKey((prev) => prev + 1);
  });

  return (
    <>
      <h2 className="text-2xl font-bold mb-3">
        <FormattedMessage id="coach.sections.trainingCycles" />
      </h2>
      <small className="block text-gray-600">
        <FormattedMessage id="coach.trainingCycle.description" />
      </small>
      <div className="grid">
        {trainingCycleTemplates.map((template, index) => (
          <div key={index} className="col-12 md:col-4">
            <Card
              title={template.name}
              subTitle={`${template.duration} ${template.isDurationInMonths ? intl.formatMessage({ id: 'plansPage.months' }) : intl.formatMessage({ id: 'plansPage.weeks' })}`}
            >
              <p>
                {intl.formatMessage({ id: 'plansPage.coachId' })}: {template.coachId}
              </p>
              <p>
                {intl.formatMessage({ id: 'plansPage.numberOfWeeks' })}: {template.trainingWeeks.length}
              </p>
              <ButtonGroup>
                <Button
                  icon="pi pi-user-plus"
                  className="p-button-success"
                  onClick={() => assignCycleDialog.handleOpenDialog(template)}
                />
                <Button
                  icon="pi pi-eye"
                  className="p-button-primary"
                  onClick={() => cycleTemplateDialog.handleViewCycle(template.id)}
                />
                <Button
                  icon="pi pi-pencil"
                  className="p-button-secondary"
                  onClick={() => cycleTemplateDialog.handleEditCycle(template.id)}
                />
                <Button
                  icon="pi pi-trash"
                  className="p-button-danger"
                  onClick={() => handleDeleteCycleTemplate(template.id)}
                />
              </ButtonGroup>
            </Card>
          </div>
        ))}
      </div>
      <Button
        label={intl.formatMessage({ id: 'plansPage.createCycle' })}
        icon="pi pi-plus"
        className="p-button-primary mt-3"
        onClick={cycleTemplateDialog.handleOpenNewTemplate}
      />
      <AssignCycleDialog
        visible={assignCycleDialog.isAssignCycleDialogVisible}
        onHide={assignCycleDialog.handleCloseDialog}
        selectedCycle={assignCycleDialog.selectedCycle}
        selectedClient={assignCycleDialog.selectedClient}
        setSelectedClient={assignCycleDialog.setSelectedClient}
        startDate={assignCycleDialog.startDate}
        setStartDate={assignCycleDialog.setStartDate}
        endDate={assignCycleDialog.endDate}
        setEndDate={assignCycleDialog.setEndDate}
        onAssign={assignCycleDialog.handleAssignCycleToClient}
        students={students}
      />
      <TrainingCycleTemplateDialog
        visible={cycleTemplateDialog.isTemplateDialogVisible}
        onHide={cycleTemplateDialog.handleCloseDialog}
        templateName={cycleTemplateDialog.templateName}
        setTemplateName={cycleTemplateDialog.setTemplateName}
        templateDuration={cycleTemplateDialog.templateDuration}
        selectedDay={cycleTemplateDialog.selectedDay}
        setSelectedDay={cycleTemplateDialog.setSelectedDay}
        selectedWorkout={cycleTemplateDialog.selectedWorkout}
        setSelectedWorkout={cycleTemplateDialog.setSelectedWorkout}
        isDurationInWeeks={cycleTemplateDialog.isDurationInWeeks}
        applyToAllWeeks={cycleTemplateDialog.applyToAllWeeks}
        setApplyToAllWeeks={cycleTemplateDialog.setApplyToAllWeeks}
        isReadOnly={cycleTemplateDialog.isReadOnly}
        setIsReadOnly={cycleTemplateDialog.setIsReadOnly}
        selectedCycleId={cycleTemplateDialog.selectedCycleId}
        templateWeeks={cycleTemplateDialog.templateWeeks}
        handleDurationTypeChange={cycleTemplateDialog.handleDurationTypeChange}
        handleRemoveWorkoutFromWeek={cycleTemplateDialog.handleRemoveWorkoutFromWeek}
        handleAddWorkout={cycleTemplateDialog.handleAddWorkout}
        handleCreateTemplate={cycleTemplateDialog.handleCreateTemplate}
        handleDurationChange={cycleTemplateDialog.handleDurationChange}
        workouts={cycleTemplateDialog.workouts}
        deletedWorkoutTemplates={cycleTemplateDialog.deletedWorkoutTemplates}
      />
    </>
  );
}

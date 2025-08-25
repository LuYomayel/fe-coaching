import React, { useState, useContext, useEffect } from 'react';
import { Card } from 'primereact/card';
import { useSpinner } from '../utils/GlobalSpinner';
import { FormattedMessage, useIntl } from 'react-intl';
import { Button } from 'primereact/button';
import { useRouter } from 'next/navigation';
import { UserContext } from '../utils/UserContext';
import { TabView, TabPanel } from 'primereact/tabview';
import {
  deleteWorkoutPlan,
  createTrainingCycleTemplate,
  fetchTrainingCyclesTemplates,
  findAllWorkoutTemplatesByCoachId,
  fetchTrainingCycleTemplateById,
  updateTrainingCycle,
  deleteTrainingCycleTemplate,
  assignCycleTemplateToClient,
  fetchDeletedWorkoutTemplatesByCoachId
} from '../services/workoutService';
import { useConfirmationDialog } from '../utils/ConfirmationDialogContext';
import { useToast } from '../utils/ToastContext';

import { Accordion, AccordionTab } from 'primereact/accordion';
import { Fieldset } from 'primereact/fieldset';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { fetchCoachStudents } from '../services/usersService';
import { assignWorkoutToClient, unassignWorkoutFromClient } from '../services/workoutService';
import { ButtonGroup } from 'primereact/buttongroup';
import { Checkbox } from 'primereact/checkbox';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Calendar } from 'primereact/calendar';
import { Divider } from 'primereact/divider';
import { formatDateToApi } from '../utils/UtilFunctions';
import { UserContextType } from '../types/shared-types';

export default function PlansPage() {
  const [workouts, setWorkouts] = useState([]);
  const [trainingCycleTemplates, setTrainingCycleTemplates] = useState([]);
  const intl = useIntl();
  const { loading, setLoading } = useSpinner();
  const router = useRouter();
  const userContext = useContext(UserContext) as UserContextType;
  if (!userContext) {
    throw new Error('PlansPage must be used within a UserProvider');
  }
  const { user, coach } = userContext;
  const [refreshKey, setRefreshKey] = useState(0);
  const { showConfirmationDialog } = useConfirmationDialog();
  const showToast = useToast();
  const [deletedWorkoutTemplates, setDeletedWorkoutTemplates] = useState([]);

  const [selectedWorkouts, setSelectedWorkouts] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [isDialogVisible, setDialogVisible] = useState(false);
  const [isAssignCycleDialogVisible, setAssignCycleDialogVisible] = useState(false);
  const [students, setStudents] = useState([]);
  const [filterOption, setFilterOption] = useState('all');
  const [filteredWorkouts, setFilteredWorkouts] = useState(workouts);

  const [isTemplateDialogVisible, setTemplateDialogVisible] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDuration, setTemplateDuration] = useState(null);
  const [templateWeeks, setTemplateWeeks] = useState([]);

  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [selectedCycle, setSelectedCycle] = useState(null);

  const [isDurationInWeeks, setIsDurationInWeeks] = useState(true);
  const [applyToAllWeeks, setApplyToAllWeeks] = useState(false);

  // At the top of your PlansPage component (along with other useState declarations)
  const [isReadOnly, setIsReadOnly] = useState(true);
  const [selectedCycleId, setSelectedCycleId] = useState(null);

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const [datesOfWeek, setDatesOfWeek] = useState([
    { label: intl.formatMessage({ id: 'plansPage.monday' }), value: 1 },
    { label: intl.formatMessage({ id: 'plansPage.tuesday' }), value: 2 },
    { label: intl.formatMessage({ id: 'plansPage.wednesday' }), value: 3 },
    { label: intl.formatMessage({ id: 'plansPage.thursday' }), value: 4 },
    { label: intl.formatMessage({ id: 'plansPage.friday' }), value: 5 },
    { label: intl.formatMessage({ id: 'plansPage.saturday' }), value: 6 },
    { label: intl.formatMessage({ id: 'plansPage.sunday' }), value: 7 }
  ]);

  useEffect(() => {
    const fetchDeletedWorkoutTemplates = async () => {
      try {
        const { data } = await fetchDeletedWorkoutTemplatesByCoachId(coach.id);
        setDeletedWorkoutTemplates(data);
      } catch (error) {
        console.error('Error fetching deleted workout templates:', error);
      }
    };
    fetchDeletedWorkoutTemplates();
    //eslint-disable-next-line
  }, []);

  useEffect(() => {
    fetchWorkoutPlans();
    fetchTrainingCyclesT();
    const loadStudents = async () => {
      try {
        const userId = user.userId;
        const { data } = await fetchCoachStudents(userId);
        setStudents(data);
      } catch (error) {
        console.error('Error loading students:', error);
      }
    };
    loadStudents();
    // eslint-disable-next-line
  }, [refreshKey]);

  useEffect(() => {
    const filterWorkouts = () => {
      if (filterOption === 'all') {
        setFilteredWorkouts(workouts);
      } else if (filterOption === 'general') {
        setFilteredWorkouts(workouts.filter((workout) => workout.clientWorkouts.length === 0));
      } else {
        setFilteredWorkouts(
          workouts.filter((workout) =>
            workout.clientWorkouts.some((cw) => cw.clientSubscription.client.id === filterOption)
          )
        );
      }
    };

    filterWorkouts();
    // eslint-disable-next-line
  }, [filterOption, workouts, refreshKey]);

  const loadCycleTemplate = async (cycleId) => {
    setLoading(true);
    try {
      // Suponiendo que fetchCycleTemplate devuelve la data en response.data
      const response = await fetchTrainingCycleTemplateById(cycleId);
      const cycle = response.data;
      setTemplateName(cycle.name);
      setTemplateDuration(cycle.duration);
      // Si isDurationInMonths es true, la duración está en meses, por lo tanto isDurationInWeeks = false
      setIsDurationInWeeks(!cycle.isDurationInMonths);
      // Mapear las semanas
      const weeks = cycle.trainingWeeks.map((week) => ({
        weekNumber: week.weekNumber,
        // Si se requiere, puedes mapear también las sesiones; por ejemplo, conservar el dayNumber
        trainingSessions: week.trainingSessions.map((session) => ({
          dayNumber: session.dayNumber,
          // Si la sesión tiene workoutInstances, podrías agregar datos adicionales según convenga
          workout: session.workoutInstances[0]?.workout.workoutTemplate.id
        }))
      }));
      setTemplateWeeks(weeks);
    } catch (error) {
      showToast('error', 'Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrainingCyclesT = async () => {
    setLoading(true);
    try {
      const response = await fetchTrainingCyclesTemplates(coach.id);
      if (response.message === 'success') {
        setTrainingCycleTemplates(response.data);
      } else {
        showToast('error', intl.formatMessage({ id: 'coach.delete.error.generic' }), response.message);
      }
    } catch (error) {
      console.error('Error fetching training cycle templates:', error);
      showToast('error', intl.formatMessage({ id: 'coach.delete.error.generic' }), error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkoutPlans = async () => {
    setLoading(true);
    try {
      const response = await findAllWorkoutTemplatesByCoachId(coach.id);
      if (response.message === 'success') {
        setWorkouts(response.data);
      } else {
        showToast('error', intl.formatMessage({ id: 'coach.delete.error.generic' }), response.message);
      }
    } catch (error) {
      console.error('Error fetching workout plans:', error);
      showToast('error', intl.formatMessage({ id: 'coach.delete.error.generic' }), error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditCycle = (cycleId) => {
    setIsReadOnly(false);
    setSelectedCycleId(cycleId);
    loadCycleTemplate(cycleId);
    setTemplateDialogVisible(true);
  };

  const handleViewCycle = (cycleId) => {
    setIsReadOnly(true);
    setSelectedCycleId(cycleId);
    loadCycleTemplate(cycleId);
    setTemplateDialogVisible(true);
  };

  const handleDelete = async (workoutInstanceTemplateId) => {
    showConfirmationDialog({
      message: intl.formatMessage({ id: 'coach.delete.confirmation' }),
      header: intl.formatMessage({ id: 'coach.delete.header' }),
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        setLoading(true);
        try {
          await deleteWorkoutPlan(workoutInstanceTemplateId, true);
          setRefreshKey((prev) => prev + 1);
        } catch (error) {
          console.error('Error deleting workout plan:', error.error);
          showToast('error', intl.formatMessage({ id: 'coach.delete.error.generic' }), error.message);
        } finally {
          setLoading(false);
        }
      },
      reject: () => {
        // Do nothing if the user rejects
      }
    });
  };

  const handleUnassignFromClient = async (workoutInstanceTemplateId) => {
    setLoading(true);
    try {
      if (filterOption !== 'all' && filterOption !== 'general') {
        await unassignWorkoutFromClient([workoutInstanceTemplateId], filterOption);
        setRefreshKey((prev) => prev + 1);
      } else {
        showToast(
          'error',
          intl.formatMessage({ id: 'coach.unassign.error' }),
          intl.formatMessage({ id: 'coach.unassign.error.detail' })
        );
      }
    } catch (error) {
      console.error('Error unassigning workout from client:', error);
      showToast('error', intl.formatMessage({ id: 'coach.unassign.error' }), error.message);
    } finally {
      setLoading(false);
      setSelectedWorkouts([]);
      setSelectedClient(null);
      setDialogVisible(false);
    }
  };

  const handleUnassignAllFromClient = async () => {
    setLoading(true);
    try {
      if (filterOption !== 'all' && filterOption !== 'general') {
        await unassignWorkoutFromClient(
          selectedWorkouts.map((workout) => workout.id),
          filterOption
        );
        setRefreshKey((prev) => prev + 1);
      } else {
        showToast(
          'error',
          intl.formatMessage({ id: 'coach.unassign.error' }),
          intl.formatMessage({ id: 'coach.unassign.error.detail' })
        );
      }
      setSelectedWorkouts([]);
      setSelectedClient(null);
    } catch (error) {
      console.error('Error unassigning workout from client:', error);
      showToast('error', intl.formatMessage({ id: 'coach.unassign.error' }), error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignToClient = async () => {
    setLoading(true);
    try {
      if (selectedWorkouts.length === 0 || !selectedClient) {
        showToast(
          'error',
          intl.formatMessage({ id: 'coach.assign.error' }),
          intl.formatMessage({ id: 'coach.assign.error.detail' })
        );
        return;
      }

      await assignWorkoutToClient(
        selectedWorkouts.map((workout) => workout.id),
        selectedClient.id
      );

      setDialogVisible(false);
      setSelectedWorkouts([]);
      setSelectedClient(null);
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error('Error assigning workout to client:', error);
      showToast('error', intl.formatMessage({ id: 'coach.assign.error' }), error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAssignDialog = (workoutId) => {
    setSelectedWorkouts([workouts.find((w) => w.id === workoutId)]);
    setDialogVisible(true);
  };

  const filterOptions = [
    { label: intl.formatMessage({ id: 'plansPage.filter.all' }), value: 'all' },
    { label: intl.formatMessage({ id: 'plansPage.filter.general' }), value: 'general' },
    ...students.map((student) => ({ label: student.name, value: student.id }))
  ];

  const handleDurationTypeChange = (e) => {
    const newIsDurationInWeeks = e.checked;
    // Calculate total weeks based on the new unit:
    const totalWeeks = newIsDurationInWeeks ? templateDuration : templateDuration * 4;

    if (templateWeeks.length > totalWeeks) {
      showConfirmationDialog({
        message: intl.formatMessage({ id: 'plansPage.confirmation.reduceWeeks' }),
        header: intl.formatMessage({ id: 'common.confirmation' }),
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
          setIsDurationInWeeks(newIsDurationInWeeks);
          setTemplateWeeks(templateWeeks.slice(0, totalWeeks));
        },
        reject: () => {
          // If the user rejects, no changes are made
        }
      });
    } else {
      // Update the unit
      setIsDurationInWeeks(newIsDurationInWeeks);
      // If the current number of weeks does not match the new total, generate a new array
      if (templateWeeks.length !== totalWeeks) {
        const newWeeks = Array.from({ length: totalWeeks }, (_, i) => ({
          weekNumber: i + 1,
          trainingSessions: []
        }));
        setTemplateWeeks(newWeeks);
      }
    }
  };

  const handleRemoveWorkoutFromWeek = (weekIndex, sessionIndex) => {
    const updatedWeeks = [...templateWeeks];
    updatedWeeks[weekIndex].trainingSessions.splice(sessionIndex, 1);
    setTemplateWeeks(updatedWeeks);
  };

  const handleAddWorkout = (workoutId, dayNumber, applyToAll, weekIndex) => {
    if (!workoutId || !dayNumber) {
      showToast('error', intl.formatMessage({ id: 'plansPage.error.selectWorkoutAndDay' }));
      return;
    }

    if (applyToAll) {
      const updatedWeeks = templateWeeks.map((week) => ({
        ...week,
        trainingSessions: [...week.trainingSessions, { dayNumber, workout: workoutId }]
      }));
      setTemplateWeeks(updatedWeeks);
    } else {
      // If weekIndex is not provided, default to the first week
      const targetIndex = weekIndex !== undefined ? weekIndex : 0;
      const updatedWeeks = [...templateWeeks];
      updatedWeeks[targetIndex].trainingSessions.push({ dayNumber, workout: workoutId });
      setTemplateWeeks(updatedWeeks);
    }
  };

  const handleCreateTemplate = async () => {
    if (!templateName || !templateDuration || templateWeeks.length === 0) {
      showToast('error', intl.formatMessage({ id: 'plansPage.error.allFieldsRequired' }));
      return;
    }

    const payload = {
      name: templateName,
      duration: templateDuration,
      isDurationInMonths: !isDurationInWeeks,
      coachId: coach.id,
      trainingWeeks: templateWeeks.map((week) => ({
        weekNumber: week.weekNumber,
        trainingSessions: week.trainingSessions.map((session) => ({
          dayNumber: session.dayNumber,
          workout: session.workout
        }))
      }))
    };

    try {
      if (selectedCycleId) {
        // Si se está editando, llamar a updateCycleTemplate
        await updateTrainingCycle(selectedCycleId, payload);
        showToast('success', intl.formatMessage({ id: 'plansPage.success.cycleUpdated' }));
      } else {
        // Crear nuevo ciclo
        await createTrainingCycleTemplate(payload);
        showToast('success', intl.formatMessage({ id: 'plansPage.success.templateCreated' }));
      }

      setTemplateDialogVisible(false);
      setTemplateName('');
      setTemplateDuration(null);
      setTemplateWeeks([]);
      setSelectedCycleId(null);
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error('Error creating/updating template:', error);
      showToast('error', intl.formatMessage({ id: 'plansPage.error.creatingTemplate' }), error.message);
    }
  };

  const handleDurationChange = (newDuration) => {
    // Calculate total weeks based on the unit
    const totalWeeks = isDurationInWeeks ? newDuration : newDuration * 4;

    if (templateWeeks.length > totalWeeks) {
      // Confirm before trimming weeks if reducing duration
      showConfirmationDialog({
        message: intl.formatMessage({ id: 'plansPage.confirmation.reduceWeeks' }),
        header: intl.formatMessage({ id: 'common.confirmation' }),
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
          setTemplateDuration(newDuration);
          setTemplateWeeks(templateWeeks.slice(0, totalWeeks));
        },
        reject: () => {
          // Do nothing if the user rejects
        }
      });
    } else {
      // If new total weeks is greater than the current number, append additional weeks
      setTemplateDuration(newDuration);
      if (templateWeeks.length < totalWeeks) {
        const additionalWeeks = Array.from({ length: totalWeeks - templateWeeks.length }, (_, i) => ({
          weekNumber: templateWeeks.length + i + 1,
          trainingSessions: []
        }));
        setTemplateWeeks([...templateWeeks, ...additionalWeeks]);
      }
      // If equal, do nothing
    }
  };

  const handleDeleteCycleTemplate = async (cycleTemplateId) => {
    showConfirmationDialog({
      message: intl.formatMessage({ id: 'coach.delete.confirmation' }),
      header: intl.formatMessage({ id: 'coach.delete.header' }),
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        setLoading(true);
        try {
          await deleteTrainingCycleTemplate(cycleTemplateId);
          setRefreshKey((prev) => prev + 1);
        } catch (error) {
          console.error('Error deleting cycle template:', error);
          showToast('error', intl.formatMessage({ id: 'coach.delete.error.generic' }), error.message);
        } finally {
          setLoading(false);
        }
      },
      reject: () => {
        // Do nothing if the user rejects
      }
    });
  };

  const renderPlanName = (rowData) => {
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
          />
          <span>{rowData.planName}</span>
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
              router.push(`/plans/edit/${workoutInstanceTemplate.id}?changeToTemplate=false&isTemplate=true`)
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

  const renderTrainingSessionsTab = () => {
    return (
      <Card className={loading ? 'flex justify-content-center mb-4' : 'mb-4'}>
        <>
          <h2 className="text-2xl font-bold mb-3">
            <FormattedMessage id="coach.sections.trainingPlans" />
          </h2>
          <small className="block text-gray-600 mb-4">
            <FormattedMessage id="coach.plan.description" />
          </small>
          <Dropdown
            value={filterOption}
            options={filterOptions}
            onChange={(e) => setFilterOption(e.value)}
            placeholder={intl.formatMessage({ id: 'plansPage.filter.placeholder' })}
            className="mb-3"
          />
          <div className="grid">
            {filteredWorkouts.map((plan, index) => (
              <div key={index} className="col-12 md:col-4">
                <Card
                  title={renderPlanName(plan)}
                  subTitle={plan.workoutInstanceTemplates[0].personalizedNotes}
                  className="mb-3"
                ></Card>
              </div>
            ))}
          </div>
          <div className="flex justify-content-end gap-2 ">
            <Button
              label={intl.formatMessage({ id: 'coach.buttons.newPlan' })}
              icon="pi pi-plus"
              className="p-button-rounded p-button-primary"
              onClick={() => router.push('/plans/create?changeToTemplate=false')}
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
        </>
      </Card>
    );
  };

  const renderTrainingCyclesTab = () => {
    return (
      <Card>
        <h2 className="text-2xl font-bold mb-3">
          <FormattedMessage id="coach.sections.trainingCycles" />
        </h2>
        <small className="block text-gray-600 mb-4">
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
                    onClick={() => handleOpenAssignCycleDialog(template.id)}
                  />
                  <Button icon="pi pi-eye" className="p-button-primary" onClick={() => handleViewCycle(template.id)} />
                  <Button
                    icon="pi pi-pencil"
                    className="p-button-secondary"
                    onClick={() => handleEditCycle(template.id)}
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
          onClick={() => {
            setTemplateDialogVisible(true);
            setSelectedCycleId(null);
            setTemplateName('');
            setTemplateDuration(null);
            setTemplateWeeks([]);
            setIsReadOnly(false);
          }}
        />
      </Card>
    );
  };

  const handleOpenAssignCycleDialog = (cycleId) => {
    setSelectedCycle(trainingCycleTemplates.find((cycle) => cycle.id === cycleId));
    setStartDate(null);
    setEndDate(null);
    setSelectedClient(null);
    setAssignCycleDialogVisible(true);
  };

  const handleAssignCycleToClient = async () => {
    if (!selectedCycle || !selectedClient || !startDate || !endDate) {
      showToast('error', 'Error', 'Please select a cycle, client, and start/end dates.');
      return;
    }
    setLoading(true);
    const startDateNewDate = new Date(startDate);
    const endDateNewDate = new Date(endDate);
    //return
    try {
      const payload = {
        cycleTemplateId: selectedCycle.id,
        clientId: selectedClient.id,
        startDate: formatDateToApi(startDateNewDate),
        endDate: formatDateToApi(endDateNewDate)
      };
      console.log(payload);
      //return
      // Make sure you have created the assignCycleTemplateToClient service call
      await assignCycleTemplateToClient(payload);
      showToast('success', 'Success', 'Cycle template assigned to client successfully.');
      setAssignCycleDialogVisible(false);
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      showToast('error', 'Error', error.error);
    } finally {
      setLoading(false);
      setSelectedClient(null);
      setStartDate(null);
      setEndDate(null);
      setSelectedCycle(null);
    }
  };

  return (
    <>
      <div className="flex gap-4 w-full m-auto">
        <TabView className="w-full p-1">
          <TabPanel header={intl.formatMessage({ id: 'coach.sections.trainingSessions' })}>
            {renderTrainingSessionsTab()}
          </TabPanel>
          <TabPanel header={intl.formatMessage({ id: 'coach.sections.trainingCycles' })}>
            {renderTrainingCyclesTab()}
          </TabPanel>
        </TabView>
      </div>

      <Dialog
        dismissableMask={true}
        className="responsive-dialog"
        modal
        draggable={false}
        resizable={false}
        header={
          <div className="flex gap-2 align-items-center">
            <span>
              {!selectedCycleId
                ? intl.formatMessage({ id: 'plansPage.createCycleDialog.header' })
                : isReadOnly
                  ? intl.formatMessage({ id: 'plansPage.viewCycleDialog.header' })
                  : intl.formatMessage({ id: 'plansPage.editCycleDialog.header' })}
            </span>
            {isReadOnly && selectedCycleId ? (
              <Button
                icon="pi pi-pencil"
                className="p-button-text"
                tooltip={intl.formatMessage({ id: 'plansPage.enableEdit' })}
                onClick={() => setIsReadOnly(false)}
              />
            ) : !isReadOnly && selectedCycleId ? (
              <Button
                icon="pi pi-lock"
                className="p-button-text"
                tooltip={intl.formatMessage({ id: 'plansPage.disableEdit' })}
                onClick={() => setIsReadOnly(true)}
              />
            ) : null}
          </div>
        }
        visible={isTemplateDialogVisible}
        style={{ width: '50vw' }}
        onHide={() => {
          setTemplateDialogVisible(false);
          setSelectedCycleId(null);
          setTemplateName('');
          setTemplateDuration(null);
          setTemplateWeeks([]);
          setIsReadOnly(true); // Reset view mode when closing
        }}
      >
        <div className="flex flex-column gap-4 p-3">
          <InputText
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder={intl.formatMessage({ id: 'plansPage.templateNamePlaceholder' })}
            className="w-full"
            disabled={isReadOnly}
          />

          <div className="flex gap-2 align-items-center">
            <Checkbox
              inputId="durationType"
              checked={isDurationInWeeks}
              onChange={handleDurationTypeChange}
              disabled={isReadOnly}
            />
            <label htmlFor="durationType">
              {isDurationInWeeks
                ? intl.formatMessage({ id: 'plansPage.durationInWeeks' })
                : intl.formatMessage({ id: 'plansPage.durationInMonths' })}
            </label>
            <InputNumber
              value={templateDuration}
              onValueChange={(e) => handleDurationChange(e.value)}
              placeholder={intl.formatMessage(
                { id: 'plansPage.durationPlaceholder' },
                {
                  unit: isDurationInWeeks
                    ? intl.formatMessage({ id: 'plansPage.weeks' })
                    : intl.formatMessage({ id: 'plansPage.months' })
                }
              )}
              className="w-full"
              disabled={isReadOnly}
            />
          </div>

          <Fieldset legend={intl.formatMessage({ id: 'plansPage.trainingWeeks' })}>
            <Accordion>
              {templateWeeks.map((week, index) => (
                <AccordionTab
                  key={index}
                  header={intl.formatMessage({ id: 'plansPage.week' }, { weekNumber: week.weekNumber })}
                >
                  <div className="flex flex-column md:flex-row gap-2 align-items-center">
                    <div className="w-full md:w-6">
                      <Dropdown
                        value={selectedWorkout}
                        options={workouts}
                        onChange={(e) => setSelectedWorkout(e.value)}
                        optionLabel="planName"
                        placeholder={intl.formatMessage({ id: 'plansPage.selectWorkout' })}
                        disabled={isReadOnly}
                        //className="w-full md:w-6"
                      />
                    </div>
                    <div className="w-full md:w-6">
                      <Dropdown
                        value={selectedDay}
                        options={datesOfWeek}
                        onChange={(e) => setSelectedDay(e.value)}
                        placeholder={intl.formatMessage({ id: 'plansPage.selectDay' })}
                        disabled={isReadOnly}
                        //className="w-full md:w-6"
                      />
                    </div>
                    <div className="flex gap-2 align-items-center">
                      <Checkbox
                        inputId="addToAllWeeks"
                        checked={applyToAllWeeks}
                        onChange={(e) => setApplyToAllWeeks(e.checked)}
                        disabled={isReadOnly}
                      />
                      <label htmlFor="addToAllWeeks">{intl.formatMessage({ id: 'plansPage.applyToAllWeeks' })}</label>
                    </div>
                    <div className="">
                      <Button
                        tooltip={intl.formatMessage({ id: 'plansPage.addWorkout' })}
                        icon="pi pi-plus"
                        className="p-button-sm p-button-success"
                        onClick={() => handleAddWorkout(selectedWorkout, selectedDay, applyToAllWeeks, index)}
                        disabled={isReadOnly}
                      />
                    </div>
                  </div>

                  <ul className="mt-2">
                    {week.trainingSessions.map((session, i) => {
                      //const workout = workouts.find((w) => w.id === session.workout?.id || w.id === session.workoutInstances[0]?.id);
                      const workout =
                        workouts.find((w) => w.id === session.workout?.id || w.id === session.workout) ||
                        deletedWorkoutTemplates.find((w) => w.id === session.workout?.id || w.id === session.workout);
                      return (
                        <li key={i} className="flex align-items-center">
                          <span>
                            🏋️ {workout?.planName || intl.formatMessage({ id: 'plansPage.workout' })} -{' '}
                            {datesOfWeek.find((d) => d.value === session.dayNumber)?.label}
                          </span>
                          <Button
                            icon="pi pi-trash"
                            className="p-button-text p-button-danger"
                            onClick={() => handleRemoveWorkoutFromWeek(index, i)}
                            disabled={isReadOnly}
                          />
                        </li>
                      );
                    })}
                  </ul>
                </AccordionTab>
              ))}
            </Accordion>
          </Fieldset>

          <Button
            label={intl.formatMessage({ id: 'plansPage.saveTemplate' })}
            className="p-button-success"
            onClick={handleCreateTemplate}
          />
        </div>
      </Dialog>
      <Dialog
        dismissableMask={true}
        modal
        draggable={false}
        resizable={false}
        className="responsive-dialog"
        header={intl.formatMessage({ id: 'coach.assign.dialog.header' })}
        visible={isDialogVisible}
        style={{ width: '50vw' }}
        onHide={() => setDialogVisible(false)}
      >
        <div className="flex flex-column gap-3">
          <div>
            <label className="block mb-2">Planes seleccionados:</label>
            <ul className="list-none p-0 m-0">
              {selectedWorkouts.map((workout) => (
                <li key={workout.id} className="mb-2">
                  {workout.planName}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <label className="block mb-2">{intl.formatMessage({ id: 'coach.assign.selectClient' })}</label>
            <Dropdown
              value={selectedClient}
              options={students}
              onChange={(e) => setSelectedClient(e.value)}
              optionLabel="name"
              placeholder={intl.formatMessage({ id: 'coach.assign.selectClient' })}
              className="w-full"
            />
          </div>
          <Button
            label={intl.formatMessage({ id: 'coach.assign.confirm' })}
            icon="pi pi-check"
            onClick={handleAssignToClient}
            className="w-full"
          />
        </div>
      </Dialog>
      <Dialog
        dismissableMask={true}
        modal
        draggable={false}
        resizable={false}
        className="responsive-dialog"
        header={intl.formatMessage({ id: 'coach.assign.cycle.dialog.header' })}
        visible={isAssignCycleDialogVisible}
        style={{ width: '50vw' }}
        onHide={() => setAssignCycleDialogVisible(false)}
      >
        <div className="flex flex-column gap-3">
          <div className="flex gap-2">
            <div className="w-full">
              <label className="block mb-2">{intl.formatMessage({ id: 'coach.assign.dialog.selectedCycle' })}</label>
              <p>{selectedCycle?.name}</p>
              <p>
                {selectedCycle?.duration}{' '}
                {selectedCycle?.isDurationInMonths
                  ? intl.formatMessage({ id: 'plansPage.months' })
                  : intl.formatMessage({ id: 'plansPage.weeks' })}{' '}
                ({selectedCycle?.isDurationInMonths ? selectedCycle?.duration * 4 : selectedCycle?.duration}{' '}
                {intl.formatMessage({ id: 'plansPage.weeks' })})
              </p>
            </div>
            <div className="w-full">
              <label className="block mb-2">{intl.formatMessage({ id: 'coach.assign.selectClient' })}</label>
              <Dropdown
                value={selectedClient}
                options={students}
                onChange={(e) => setSelectedClient(e.value)}
                optionLabel="name"
                placeholder={intl.formatMessage({ id: 'coach.assign.selectClient' })}
                className="w-full"
              />
            </div>
          </div>
          <Divider />
          <div className="flex gap-2">
            <div className="w-full">
              <label className="block mb-2">{intl.formatMessage({ id: 'startDate' })}</label>
              <Calendar
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.value);
                  // Calculate end date based on duration
                  const endDate = new Date(e.value);
                  if (selectedCycle?.isDurationInMonths) {
                    endDate.setMonth(endDate.getMonth() + selectedCycle.duration);
                  } else {
                    endDate.setDate(endDate.getDate() + selectedCycle.duration * 7);
                  }
                  setEndDate(endDate);
                }}
                showIcon
                className="w-full"
                locale={intl.locale}
              />
            </div>
            <div className="w-full">
              <label className="block mb-2">{intl.formatMessage({ id: 'endDate' })}</label>
              <Calendar value={endDate} disabled showIcon className="w-full" locale={intl.locale} />
            </div>
          </div>
          <Button
            label={intl.formatMessage({ id: 'coach.assign.confirm' })}
            icon="pi pi-check"
            onClick={handleAssignCycleToClient}
            className="w-full"
          />
        </div>
      </Dialog>
    </>
  );
}

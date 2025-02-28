import React, { useState, useContext, useEffect } from 'react';
import { UserContext } from '../utils/UserContext';
import { useToast } from '../utils/ToastContext';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { Card } from 'primereact/card';
import { Dialog } from 'primereact/dialog';
import { useConfirmationDialog } from '../utils/ConfirmationDialogContext';
import { InputNumber } from 'primereact/inputnumber';
import { createTrainingCycle, createCycleAndAssignWorkouts, findAllWorkoutTemplatesByCoachId } from '../services/workoutService';
import { fetchCoachStudents } from '../services/usersService';
import { useIntl, FormattedMessage } from 'react-intl';
import { TabPanel, TabView } from 'primereact/tabview';
import '../styles/CreateTrainingCycle.css';

const CreateTrainingCycleDialog = ({ visible, onHide, clientId, setRefreshKey }) => {
  const { user, coach } = useContext(UserContext);
  const intl = useIntl();
  const showToast = useToast();
  const [cycleName, setCycleName] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [durationInMonths, setDurationInMonths] = useState(null);
  const [durationInWeeks, setDurationInWeeks] = useState(null);
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const { showConfirmationDialog } = useConfirmationDialog();
  const [loading, setLoading] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [bodyCycle, setBodyCycle] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [assignedWorkouts, setAssignedWorkouts] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const daysOfWeek = [
    { label: intl.formatMessage({ id: 'workoutTable.monday' }), value: 1 },
    { label: intl.formatMessage({ id: 'workoutTable.tuesday' }), value: 2 },
    { label: intl.formatMessage({ id: 'workoutTable.wednesday' }), value: 3 },
    { label: intl.formatMessage({ id: 'workoutTable.thursday' }), value: 4 },
    { label: intl.formatMessage({ id: 'workoutTable.friday' }), value: 5 },
    { label: intl.formatMessage({ id: 'workoutTable.saturday' }), value: 6 },
    { label: intl.formatMessage({ id: 'workoutTable.sunday' }), value: 7 },
  ];

  useEffect(() => {
    setAssignments([{ workoutId: null, dayOfWeek: null }]);
    setSelectedDay(null);
    setAssignedWorkouts([])
  }, []);

  useEffect(() => {
    const loadCoachStudents = async () => {
      try {
        const {data} = await fetchCoachStudents(user.userId);
        const activeStudents = data
          .filter(client => client.user.subscription.status !== 'Inactive')
          .map(client => ({
            label: client.name,
            value: client.id
          }));
        setClients(activeStudents);
      } catch (error) {
        showToast('error', intl.formatMessage({ id: 'error.fetchingStudents' }), error.message);
      }
    };

    const loadWorkouts = async () => {
      try {
        const {data} = await findAllWorkoutTemplatesByCoachId(coach.id);
        console.log(data);
        setWorkouts(data);
      } catch (error) {
        showToast('error', 'Error', error.message);
      }
    };


    if (user && user.userId && visible) {
      loadCoachStudents();
    }
    if (visible) loadWorkouts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showToast, user.userId, visible, coach]);

  const handleCreateCycle = async (body) => {
    try {
      setLoading(true);
      const result = await createTrainingCycle(body);
      showToast('success', intl.formatMessage({ id: 'success.cycleCreated' }));
      console.log('Created cycle:', result);
      onHide();
    } catch (error) {
      showToast('error', intl.formatMessage({ id: 'error' }), error.message);
    } finally {
      setLoading(false);
    }
  };

  const onDurationMonthChange = (e) => {
    setDurationInMonths(e.value);
    setDurationInWeeks(null);
  };

  const onDurationWeekChange = (e) => {
    setDurationInWeeks(e.value);
    setDurationInMonths(null);
  };

  const clickCreateCycle = () => {
    if (!cycleName || !startDate) {
      showToast('error', intl.formatMessage({ id: 'error' }), intl.formatMessage({ id: 'error.allFieldsRequired' }));
      return;
    }

    if (!durationInMonths && !durationInWeeks) {
      showToast('error', intl.formatMessage({ id: 'error' }), intl.formatMessage({ id: 'error.enterDuration' }));
      return;
    }

    const body = {
      name: cycleName,
      coachId: user.userId,
      startDate,
      clientId: parseInt(clientId),
      durationInMonths,
      durationInWeeks
    };

    showConfirmationDialog({
      message: intl.formatMessage({ id: 'createCycle.button.create.confirm' }),
      header: intl.formatMessage({ id: 'common.confirmation' }),
      icon: "pi pi-exclamation-triangle",
      accept: () => handleCreateCycle(body),
      reject: () => console.log('Rejected')
    });
  };

  const clickGoNextTab = () => {
    setActiveIndex(1);
    const body = {
      name: cycleName,
      coachId: user.userId,
      startDate,
      clientId: parseInt(clientId),
      durationInMonths,
      durationInWeeks
    };
    console.log(body)
    setBodyCycle(body);
  }

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

  const handleAction = async () => {
    const body = {
      clientId: parseInt(clientId),
      createCycleDto: bodyCycle,
      assignWorkoutsToCycleDTO: {
        assignments: assignments.filter(
          (assignment) => assignment.dayOfWeek !== null && assignment.workoutId !== null
        )
      }
    };
    if (body.assignWorkoutsToCycleDTO.assignments.length === 0)
      return showToast('error', 'Error', 'Please select at least one workout.');

  

    try {
      setLoading(true);
     // const cycle = await createTrainingCycle(bodyCycle);
      const { data } = await createCycleAndAssignWorkouts(body);

      if(data && data.trainingSessions && data.trainingSessions.length > 0) {
        showToast('success', intl.formatMessage({ id: 'assignWorkoutToCycleDialog.success.assign' }), intl.formatMessage({ id: 'assignWorkoutToCycleDialog.success.assign.detail' }));
      } else {
        showToast('error', intl.formatMessage({ id: 'assignWorkoutToCycleDialog.error.assign' }), intl.formatMessage({ id: 'assignWorkoutToCycleDialog.error.assign.detail' }));
      }
      
      onHide();
      //setSelectedDay(null);
      setRefreshKey((old) => old + 1);
    } catch (error) {
      showToast('error', 'Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderTabPanelCycle = () => {
    return (
      <TabPanel header={intl.formatMessage({ id: 'createCycle.dialog.header' })}>
        <div className="p-field">
          <label htmlFor="cycleName"><FormattedMessage id="createCycle.cycleName" /></label>
          <InputText id="cycleName" value={cycleName} onChange={(e) => setCycleName(e.target.value)} />
        </div>
        <div className="flex flex-row gap-2 w-full justify-content-between">
          <div className="p-field">
            <label htmlFor="startDate"><FormattedMessage id="startDate" /></label>
            <Calendar id="startDate" value={startDate} dateFormat="dd/mm/yy" onChange={(e) => setStartDate(e.value)} showIcon />
          </div>
          <div className="p-field">
            <label htmlFor="durationInMonths"><FormattedMessage id="createCycle.durationInMonths" /></label>
            <InputNumber 
              id="durationInMonths" 
              value={durationInMonths} 
              onValueChange={onDurationMonthChange} 
              mode="decimal" 
              min={1} 
              max={12}
              className={durationInWeeks ? 'p-inputtext-muted' : ''}
            />
          </div>
          <div className="p-field">
            <label htmlFor="durationInWeeks"><FormattedMessage id="createCycle.durationInWeeks" /></label>
            <InputNumber 
              id="durationInWeeks" 
              value={durationInWeeks} 
              onValueChange={onDurationWeekChange} 
              mode="decimal" 
              min={1} 
              max={52}
              className={durationInMonths ? 'p-inputtext-muted' : ''}
            />
          </div>
        </div>
        <div className="flex justify-content-between">  
          <Button label={intl.formatMessage({ id: 'createCycle.button.create' })} icon="pi pi-plus" onClick={clickCreateCycle} loading={loading} />
          <Button label={intl.formatMessage({ id: 'common.next' })} icon="pi pi-arrow-right" onClick={clickGoNextTab} loading={loading} disabled={!cycleName || !startDate || (!durationInMonths && !durationInWeeks)} />
        </div>
      </TabPanel>
    )
  }

  const renderTabPanelWorkouts = () => {
    return (
      <TabPanel header={intl.formatMessage({ id: 'assignWorkoutToCycleDialog.assignWorkoutsToCycle' })} disabled={activeIndex !== 1}>

        {assignments.map((assignment, index) => (
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
            <Button
              label={intl.formatMessage({ id: 'assignWorkoutToCycleDialog.addAssignment' })}
              icon="pi pi-plus"
              onClick={handleAddAssignment}
              className="p-button-secondary"
            />
          <Button
            label={intl.formatMessage({ id: 'assignWorkoutToCycleDialog.assignWorkouts'})}
            icon={'pi pi-check'}
            onClick={handleAction}
            className="p-button-primary"
            loading={loading}
          />
        </div>
      </TabPanel>
    )
  }

  return (
    <Dialog draggable={false} resizable={false} dismissableMask header={intl.formatMessage({ id: 'createCycle.dialog.header' })} className="responsive-dialog" visible={visible} style={{ width: '50vw' }} onHide={onHide}>
      <TabView activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)}>
        {renderTabPanelCycle()}
        {renderTabPanelWorkouts()}
      </TabView>
    </Dialog>
  );
};

export default CreateTrainingCycleDialog;
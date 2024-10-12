import React, { useState, useEffect, useRef, useContext } from 'react';
import { Card } from 'primereact/card';
import { TabView, TabPanel } from 'primereact/tabview';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Dropdown } from 'primereact/dropdown';
import { Chart } from 'primereact/chart';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { useParams } from 'react-router-dom';
import { useToast } from '../utils/ToastContext';
import { useSpinner } from '../utils/GlobalSpinner';
import { UserContext } from '../utils/UserContext';
import AssignWorkoutToCycleDialog from '../dialogs/AssignWorkoutToCycleDialog';
import AssignWorkoutToSessionDialog from '../dialogs/AssignWorkoutToSessionDialog';
import PlanDetails from '../dialogs/PlanDetails';
import NewPlanDetail from '../dialogs/NewPlanDetails';
import CreateTrainingCycleDialog from '../dialogs/CreateTrainingCycle';
import { fetchTrainingCyclesByClient, fetchWorkoutsByClientId } from '../services/workoutService';
import '../styles/ClientDashboard.css';
import { formatDate } from '../utils/UtilFunctions';
import WorkoutTable from '../components/WorkoutTable';

export default function ClientDashboard() {
  const { clientId } = useParams();
  const toast = useRef(null);
  const showToast = useToast();
  const { setLoading } = useSpinner();
  const { user } = useContext(UserContext);

  // State variables
  const [dialogVisible, setDialogVisible] = useState(false);
  const [workouts, setWorkouts] = useState([]);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [workoutDetailsVisible, setWorkoutDetailsVisible] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [exerciseOptions, setExerciseOptions] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [workoutOptions, setWorkoutOptions] = useState([]);
  const [filteredWorkouts, setFilteredWorkouts] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [assignCycleVisible, setAssignCycleVisible] = useState(false);
  const [selectedCycleId, setSelectedCycleId] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [planDetailsVisible, setPlanDetailsVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const calendarRef = useRef(null);
  const [assignSessionVisible, setAssignSessionVisible] = useState(false);
  const [actionType, setActionType] = useState('assign');
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(1);
  const [cycleOptions, setCycleOptions] = useState([]);
  const [cycleDropdownOptions, setCycleDropdownOptions] = useState([]);

  // Fetch data when the component mounts or refreshKey changes
  useEffect(() => {
    setLoading(true);
    fetchTrainingCyclesByClient(clientId)
      .then(({ events, cycleOptions }) => {
        setCycleOptions(cycleOptions);
        setCalendarEvents(events);
        const options = cycleOptions.map((cycle) => ({ label: cycle.name, value: cycle.id }));
        setCycleDropdownOptions(options);
      })
      .catch(error => showToast('error', 'Error fetching training cycles', error.message))
      .finally(() => setLoading(false));

    fetchWorkoutsByClientId(clientId)
      .then(data => {
        setWorkouts(data);
        const exercises = [...new Map(data.flatMap(workout => 
          workout.groups.flatMap(group => 
            group.exercises.map(ex => [ex.exercise.id, { id: ex.exercise.id, name: ex.exercise.name }])
          )
        ).map(entry => [entry[0], entry[1]]))].map(entry => entry[1]);

        setExerciseOptions(exercises.map(ex => ({ label: ex.name, value: ex.id })));

        const uniqueWorkouts = [...new Map(data.map(workout => [workout.workout.id, workout.workout])).values()];
        setWorkoutOptions(uniqueWorkouts.map(workout => ({ label: workout.planName, value: workout.id })));
      })
      .catch(error => {
        showToast('error', 'Error fetching client workouts', error.message);
      })
      .finally(() => setLoading(false));
  }, [clientId, showToast, setLoading, refreshKey]);

  // Update chart data when selectedExercise changes
  useEffect(() => {
    if (selectedExercise) {
      const extractNumber = (str) => {
        if (!str) return 0;
        const num = str.match(/\d+(\.\d+)?/);
        return num ? parseFloat(num[0]) : 0;
      };

      const filteredWorkouts = workouts.flatMap(workout =>
        workout.groups.flatMap(group =>
          group.exercises.filter(ex => ex.exercise.id === selectedExercise).map(ex => ({
            date: workout.realEndDate,
            expectedReps: extractNumber(ex.repetitions) || 0,
            rpe: extractNumber(ex.rpe) || 0,
            sets: ex.setLogs.map(set => ({
              completedReps: extractNumber(set.repetitions) || 0,
              weight: extractNumber(set.weight) || 0,
              rpe: extractNumber(set.rpe) || 0,
              time: extractNumber(set.time) || 0,
              distance: extractNumber(set.distance) || 0,
              tempo: set.tempo || '',
              notes: set.notes || '',
              difficulty: set.difficulty || '',
              duration: extractNumber(set.duration) || 0,
              restInterval: extractNumber(set.restInterval) || 0
            }))
          }))
        )
      ).filter(workout => workout.date);

      const processedData = filteredWorkouts.map(fw => {
        const totalReps = fw.sets.reduce((sum, set) => sum + set.completedReps, 0);
        const totalWeight = fw.sets.reduce((sum, set) => sum + set.weight, 0);
        const averageReps = fw.sets.length ? (totalReps / fw.sets.length) : 0;
        const averageWeight = fw.sets.length ? (totalWeight / fw.sets.length) : 0;

        return {
          date: new Date(fw.date).toLocaleDateString(),
          expectedReps: fw.expectedReps,
          averageReps,
          averageWeight,
          rpe: fw.rpe
        };
      });

      const dates = processedData.map(pd => pd.date);
      const expectedRepsData = processedData.map(pd => pd.expectedReps);
      const completedRepsData = processedData.map(pd => pd.averageReps);
      const weightData = processedData.map(pd => pd.averageWeight);
      const rpeData = processedData.map(pd => pd.rpe);

      setChartData({
        labels: dates,
        datasets: [
          {
            label: 'Expected Repetitions',
            data: expectedRepsData,
            borderColor: 'blue',
            fill: false,
            yAxisID: 'y-axis-1',
          },
          {
            label: 'Completed Repetitions',
            data: completedRepsData,
            borderColor: 'green',
            fill: false,
            yAxisID: 'y-axis-1',
          },
          {
            label: 'Average Weight (kg)',
            data: weightData,
            borderColor: 'red',
            fill: false,
            yAxisID: 'y-axis-1',
          },
          {
            label: 'Average RPE',
            data: rpeData,
            borderColor: 'purple',
            fill: false,
            yAxisID: 'y-axis-2',
          },
        ],
      });
    }
  }, [selectedExercise, workouts]);

  // Update filtered workouts when selectedWorkout changes
  useEffect(() => {
    if (selectedWorkout) {
      const filtered = workouts.filter(workout => workout.workout.id === selectedWorkout && workout.status === 'completed');
      setFilteredWorkouts(filtered);
    }
  }, [selectedWorkout, workouts]);

  // Handlers
  const handleEventClick = (info) => {
    const workoutInstanceId = info.event.extendedProps.workoutInstanceId;
    handleViewWorkoutDetails(workoutInstanceId);
  };

  const handleViewWorkoutDetails = (workoutInstanceId) => {
    setLoading(true);
    setSelectedPlan(workoutInstanceId);
    setPlanDetailsVisible(true);
  };

  const hidePlanDetails = () => {
    setPlanDetailsVisible(false);
    setSelectedPlan(null);
  };

  const renderEventContent = (eventInfo) => {
    if (!eventInfo || !eventInfo.event) {
      return null;
    }

    const { title, extendedProps } = eventInfo.event;
    const { status, workoutInstanceId, sessionId, cycle } = extendedProps || {};

    return (
      <div className="custom-event-content">
        {title !== 'no title' ? (
          <Button 
            tooltip="View Workout Details" 
            icon="pi pi-eye" 
            size='small'
            label={title}
            severity={status === 'completed' ? 'success' : status === 'expired' ? 'danger' : status === 'current' ? 'info' : 'warning'}
            text
            raised
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleViewWorkoutDetails(workoutInstanceId);
            }} 
          />
        ) : (
          <Button 
            tooltip="Assign Workouts to Day" 
            icon="pi pi-calendar-plus" 
            size='small'
            severity="primary"
            text
            raised
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleAssignDayWorkout(sessionId);
            }} 
          >
            <div className="text-left p-0 m-0">
              <p className="m-0">Assign Workout</p>
              <small>{cycle}</small>
            </div>
          </Button>
        )}
      </div>
    );
  };

  const handleAssignDayWorkout = (sessionId) => {
    setSelectedClient(clientId);
    setSelectedSessionId(sessionId);
    setAssignSessionVisible(true);
  };

  const showCreateCycleDialog = () => {
    setDialogVisible(true);
  };

  const hideCreateCycleDialog = () => {
    setRefreshKey(old => old + 1);
    setDialogVisible(false);
  };

  const handleOpenAssignCycle = (action) => {
    setSelectedClient(clientId);
    setActionType(action);
    setAssignCycleVisible(true);
  };

  const renderWorkoutDetails = (rowData) => {
    return (
      <Accordion multiple>
        {rowData.groups.flatMap(group =>
          group.exercises.map(exercise => {
            const allProperties = ['repetitions', 'weight', 'rpe', 'time', 'distance', 'tempo', 'notes', 'difficulty', 'duration', 'restInterval'];
            const availableProperties = allProperties.filter(prop => {
              return (
                exercise[prop] != null 
                && exercise[prop] != '' 
                // && exercise.setLogs.some(log => log[prop] != null)
              );
            });
            const tableData = exercise.setLogs.length > 0 ? exercise.setLogs : [{ setNumber: 1 }];
            const expandedData = tableData.flatMap(setLog => {
              return [

                { 
                  setNumber: setLog.setNumber, 
                  type: 'Expected', 
                  ...availableProperties.reduce((acc, prop) => ({ ...acc, [prop]: exercise[prop] || '-' }), {}),
                  rpe:  '-',
                },
                { 
                  setNumber: setLog.setNumber, 
                  type: 'Completed', 
                  ...availableProperties.reduce((acc, prop) => ({ ...acc, [prop]: setLog[prop] || '-' }), {}),
                  rpe: exercise.rpe || '-',
                }
              ];
            }
            );

            return (
              <AccordionTab key={exercise.id} header={exercise.exercise.name}>
                <DataTable value={expandedData} rowGroupMode="subheader" groupRowsBy="setNumber"
                           sortMode="single" sortField="setNumber" sortOrder={1}>
                  <Column field="setNumber" header="Set" body={(rowData) => `Set ${rowData.setNumber}`} />
                  <Column field="type" header="Type" />
                  {availableProperties.map(prop => (
                    <Column key={prop} field={prop} header={prop.charAt(0).toUpperCase() + prop.slice(1)} />
                  ))}
                </DataTable>
              </AccordionTab>
            );
          })
        )}
      </Accordion>
    );
  };

  return (
    <div className="client-dashboard p-4">
      <Toast ref={toast} />
      <Card className="mb-4" style={{ backgroundImage: 'linear-gradient(to right, #6366F1, #A5B4FC)' }}>
        <h1 className="text-4xl font-bold text-center text-white">Client Dashboard</h1>
      </Card>

      <TabView>
        <TabPanel header="Workout Calendar">
          <div className="mb-3 flex flex-wrap gap-2">
            <Button 
              label="Assign Workouts" 
              icon="pi pi-refresh" 
              className="p-button-success" 
              onClick={() => handleOpenAssignCycle('assign')} 
            />
            <Button 
              label="Unassign Workouts" 
              icon="pi pi-trash" 
              className="p-button-danger" 
              onClick={() => handleOpenAssignCycle('unassign')} 
            />
            <Button 
              label="Create Training Cycle" 
              icon="pi pi-plus" 
              className="p-button-secondary" 
              onClick={showCreateCycleDialog} 
            />
          </div>
          <Card>
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin, listPlugin, timeGridPlugin]}
              initialView={window.innerWidth > 768 ? 'dayGridMonth' : 'listMonth'}
              events={calendarEvents}
              eventContent={renderEventContent}
              ref={calendarRef}
              fixedWeekCount={false}
              className="custom-calendar"
              contentHeight="auto"
              windowResize={(arg) => {
                const calendarApi = calendarRef.current.getApi();
                if (arg.view.type === 'dayGridMonth' && window.innerWidth <= 768) {
                  calendarApi.changeView('listMonth');
                } else if (arg.view.type === 'listMonth' && window.innerWidth > 768) {
                  calendarApi.changeView('dayGridMonth');
                }
              }}
            />
          </Card>
          <AssignWorkoutToCycleDialog
            visible={assignCycleVisible}
            onHide={() => setAssignCycleVisible(false)}
            cycleId={selectedCycleId}
            clientId={selectedClient}
            setRefreshKey={setRefreshKey}
            // cycleOptions={cycleOptions}
            cycleOptions={cycleDropdownOptions}
            actionType={actionType}
          />
          <AssignWorkoutToSessionDialog
            visible={assignSessionVisible}
            onHide={() => setAssignSessionVisible(false)}
            sessionId={selectedSessionId}
            clientId={selectedClient}
            setRefreshKey={setRefreshKey}
          />
          <CreateTrainingCycleDialog visible={dialogVisible} onHide={hideCreateCycleDialog} />
          <Dialog header="Plan Details" visible={planDetailsVisible} style={{ width: '80vw' }} onHide={hidePlanDetails}>
            {selectedPlan && <NewPlanDetail planId={selectedPlan} setPlanDetailsVisible={setPlanDetailsVisible} setRefreshKey={setRefreshKey} setLoading={setLoading} />}
          </Dialog>
        </TabPanel>

        <TabPanel header="Workout Details">
          <div className="grid">
            <div className="col-12">
              <Dropdown value={selectedWorkout} options={workoutOptions} onChange={(e) => setSelectedWorkout(e.value)} placeholder="Select a Workout" className="w-full mb-3" />
              <DataTable value={filteredWorkouts}>
                <Column field={(rowData) => formatDate(rowData.realEndDate)}  header="Trained Date" style={{ width: '10%' }} />
                <Column field="workout.planName" header="Workout Name" style={{ width: '20%' }}/>
                <Column header="Details" body={renderWorkoutDetails} />
              </DataTable>
            </div>
          </div>
        </TabPanel>

        <TabPanel header="Exercise Progress">
          <div className="grid">
            <div className="col-12 md:col-6">
              <Dropdown value={selectedExercise} options={exerciseOptions} filter filterBy="label" onChange={(e) => setSelectedExercise(e.value)} placeholder="Select an Exercise" className="w-full mb-3" />
              {chartData && <Chart type="line" data={chartData} options={{
                responsive: true,
                maintainAspectRatio: false,
                aspectRatio: 1.5,
              }} />}
            </div>
          </div>
        </TabPanel>

        <TabPanel header="Client workouts">
          <WorkoutTable trainingWeeks={cycleOptions[2]?.trainingWeeks} cycleOptions={cycleDropdownOptions}/>
        </TabPanel>
      </TabView>

    </div>
  );
}
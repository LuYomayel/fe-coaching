import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useToast } from '../utils/ToastContext';
import { useSpinner } from '../utils/GlobalSpinner';
import { Chart } from 'primereact/chart';
import '../styles/ClientDashboard.css';
import { Dropdown } from 'primereact/dropdown';
import listPlugin from '@fullcalendar/list'
import timeGridPlugin from '@fullcalendar/timegrid';
import { Button } from 'primereact/button';
import { formatDate, updateStatus } from '../utils/UtilFunctions';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Column } from 'primereact/column';
import { TabView, TabPanel } from 'primereact/tabview';
import { Accordion, AccordionTab } from 'primereact/accordion';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { UserContext } from '../utils/UserContext';
import AssignWorkoutToCycleDialog from '../dialogs/AssignWorkoutToCycleDialog';
import AssignWorkoutToSessionDialog from '../dialogs/AssignWorkoutToSessionDialog';
import PlanDetails from '../dialogs/PlanDetails';
import CreateTrainingCycleDialog from '../dialogs/CreateTrainingCycle';
import { fetchTrainingCyclesByClient, fetchWorkoutsByClientId } from '../services/workoutService';
const apiUrl = process.env.REACT_APP_API_URL;

const ClientDashboard = () => {
  const { clientId } = useParams();
  const showToast = useToast();
  const { setLoading } = useSpinner();
  const [workouts, setWorkouts] = useState([]);
  const [dialogVisible, setDialogVisible] = useState(false);
  
  const [adherenceData, setAdherenceData] = useState(null);

  const [selectedExercise, setSelectedExercise] = useState(null);
  const [exerciseOptions, setExerciseOptions] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
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
  const [cycleOptions, setCycleOptions] = useState([])
  const { user } = useContext(UserContext);

  useEffect(() => {
    setLoading(true);
    fetchTrainingCyclesByClient(clientId)
      .then(({ events, cycleOptions }) => {
        setCycleOptions(cycleOptions)
        setCalendarEvents(events);
      })
      .catch(error => showToast('error', 'Error fetching training cycles', error.message))
      .finally(() => setLoading(false));

      fetchWorkoutsByClientId(clientId)
      .then(data => {
        setWorkouts(data);
        // Process data for display or additional computations here
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

  useEffect(() => {
    if (selectedExercise) {
        const extractNumber = (str) => {
            if (!str) return 0;
            const num = str.match(/\d+(\.\d+)?/); // Extrae el número, incluyendo decimales si los hay
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
            ).filter(workout => workout.date);// Filtramos solo los workouts con fecha
    
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

  useEffect(() => {
    if (selectedWorkout) {
      const filteredWorkouts = workouts.filter(workout => workout.workout.id === selectedWorkout && workout.status === 'completed');
      setFilteredWorkouts(filteredWorkouts);
    }
  }, [selectedWorkout, workouts]);

  const renderSets = (rowData) => {
    return (
      <Accordion multiple>
        {rowData.groups.flatMap(group =>
          group.exercises.map(exercise => (
            <AccordionTab key={exercise.id} header={exercise.exercise.name}>
              {exercise.setLogs.length > 0 ? (
                exercise.setLogs.map((setLog, index) => (
                  <div key={setLog.id} className="set-details">
                    <div className="grid">
                      <div className="col">
                        <p><strong>Expected Set {index + 1}</strong></p>
                        {exercise.repetitions && <p>Repetitions: {exercise.repetitions}</p>}
                        {exercise.weight && <p>Weight: {exercise.weight}</p>}
                        {exercise.time && <p>Time: {exercise.time}</p>}
                        {exercise.distance && <p>Distance: {exercise.distance}</p>}
                        {exercise.tempo && <p>Tempo: {exercise.tempo}</p>}
                        {exercise.notes && <p>Notes: {exercise.notes}</p>}
                        {exercise.difficulty && <p>Difficulty: {exercise.difficulty}</p>}
                        {exercise.duration && <p>Duration: {exercise.duration}</p>}
                        {exercise.restInterval && <p>Rest Interval: {exercise.restInterval}</p>}
                        
                      </div>
                      <div className="col">
                        <p><strong>Completed Set {setLog.setNumber}</strong></p>
                        {setLog.repetitions && <p>Repetitions: {setLog.repetitions}</p>}
                        {setLog.weight && <p>Weight: {setLog.weight}</p>}
                        {setLog.time && <p>Time: {setLog.time}</p>}
                        {setLog.distance && <p>Distance: {setLog.distance}</p>}
                        {setLog.tempo && <p>Tempo: {setLog.tempo}</p>}
                        {setLog.notes && <p>Notes: {setLog.notes}</p>}
                        {setLog.difficulty && <p>Difficulty: {setLog.difficulty}</p>}
                        {setLog.duration && <p>Duration: {setLog.duration}</p>}
                        {setLog.restInterval && <p>Rest Interval: {setLog.restInterval}</p>}
                        {exercise.rpe && <p>RPE: {exercise.rpe}</p>}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="set-details">
                  <div className="grid">
                    <div className="col">
                      <p><strong>Expected Set</strong></p>
                      {exercise.repetitions && <p>Repetitions: {exercise.repetitions}</p>}
                      {exercise.weight && <p>Weight: {exercise.weight}</p>}
                      {exercise.time && <p>Time: {exercise.time}</p>}
                      {exercise.distance && <p>Distance: {exercise.distance}</p>}
                      {exercise.tempo && <p>Tempo: {exercise.tempo}</p>}
                      {exercise.notes && <p>Notes: {exercise.notes}</p>}
                      {exercise.difficulty && <p>Difficulty: {exercise.difficulty}</p>}
                      {exercise.duration && <p>Duration: {exercise.duration}</p>}
                      {exercise.restInterval && <p>Rest Interval: {exercise.restInterval}</p>}
                    </div>
                    <div className="col">
                      <p><strong>Completed Set</strong></p>
                      <p>No logs available</p>
                    </div>
                  </div>
                </div>
              )}
            </AccordionTab>
          ))
        )}
      </Accordion>
    );
  };

  const hideCreateCycleDialog = () => {
    setRefreshKey(old => old+1)
    setDialogVisible(false);
  };

  const handleOpenAssignCycle = (action) => {
    setSelectedClient(clientId);
    setActionType(action)
    setAssignCycleVisible(true);
  };
  
  const hidePlanDetails = () => {

    setPlanDetailsVisible(false);
    setSelectedPlan(null);
  };

  const handleViewWorkoutDetails = (workoutInstanceId) => {
    // Lógica para ver los detalles del entrenamiento
    setLoading(true)
    setSelectedPlan(workoutInstanceId);
    setPlanDetailsVisible(true);
  };

  const renderEventContent = (eventInfo) => {
    if (!eventInfo || !eventInfo.event) {
      return null;
    }
  
    const { title, extendedProps } = eventInfo.event;
    const { status, workoutInstanceId, sessionId, cycle } = extendedProps || {};
  
    return (
      <>
        {title !== 'no title' && (
          <div className="flex align-items-center justify-content-center h-full">
            <Button 
              tooltip="View Workout Details" 
              icon="pi pi-eye" 
              size='small'
              label={title}
              text
              outlined
              raised
              className={`p-button p-button-${status === 'completed' ? 'success' : status === 'expired' ? 'danger' : status === 'current' ? 'info' : 'warning'} w-full lg:w-auto`} 
              onClick={() => handleViewWorkoutDetails(workoutInstanceId)} 
            />
          </div>
        )}
        {title === 'no title' && (
          <div className="flex align-items-center justify-content-center h-full">
            <Button 
              tooltip="Assign Workouts to Day" 
              icon="pi pi-calendar-plus" 
              size='small'
              text
              outlined
              raised
              label={(<div className="text-left p-0 m-0"><p>Assign Workout</p><small>{cycle}</small></div>)}
              className="p-button p-button-primary w-full lg:w-auto" 
              onClick={() => handleAssignDayWorkout(sessionId)} 
            />
          </div>
        )}
      </>
    );
  };

  const handleAssignDayWorkout = (sessionId) => {
    setSelectedClient(clientId)
    setSelectedSessionId(sessionId);
    setAssignSessionVisible(true);
  };

  const showCreateCycleDialog = () => {
    setDialogVisible(true);
  };

  return (
    <div className="grid grid-nogutter">
      <div className="col-12 mx-auto">
        <h1 className="panel-header">Client Dashboard</h1>
        <TabView className='mx-auto'>
          <TabPanel header="Workout Calendar" className='calendar-class overflow-scroll'>
            <div className="flex flex-column lg:flex-row align-items-center justify-content-between">
              <div>
                <h2>Calendar</h2>
              </div>
              <div className='flex gap-2 mt-2 lg:mt-0'>
                <Button 
                  label="Unassign Workouts" 
                  icon="pi pi-trash" 
                  className="p-button-danger p-button-rounded" 
                  onClick={() => handleOpenAssignCycle('unassign')}
                />
              <Button 
                tooltip="Assign Workouts to Cycle" 
                icon="pi pi-refresh" 
                label='Assign Workouts'
                className='p-button-rounded p-button-success w-full lg:w-auto' 
                onClick={() => handleOpenAssignCycle('assign')} 
              />
              <Button label="Create Training Cycle" icon="pi pi-plus" className="p-button-rounded p-button-secondary w-full lg:w-auto"  onClick={showCreateCycleDialog} />
              </div>
            </div>
            <div className="p-fluid w-10 mx-auto"> 
            <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin, listPlugin, timeGridPlugin]}
                initialView={window.innerWidth > 768 ? 'dayGridMonth' : 'listMonth'}
                views={{
                  listMonth: { buttonText: 'List Month' }
                }}
                // timeZone='local'
                events={calendarEvents}
                eventContent={renderEventContent}
                ref={calendarRef}
                fixedWeekCount={false}
                eventClassNames='events-class'
                viewClassNames='nueva-clase'
                contentHeight={550}
                windowResize={(arg) => {
                  const calendarApi = calendarRef.current.getApi();
                  console.log(arg.view.type, window.innerWidth)
                  if (arg.view.type === 'dayGridMonth' && window.innerWidth <= 768) {
                    console.log('Deberia cambiar a "listMonth"')
                    calendarApi.changeView('listMonth');
                  } else if (arg.view.type === 'listMonth' && window.innerWidth > 768) {
                    console.log('Deberia cambiar a "dayGridMonth"')
                    calendarApi.changeView('dayGridMonth');
                  }
                }}
              />
            </div>
             <AssignWorkoutToCycleDialog
              visible={assignCycleVisible}
              onHide={() => setAssignCycleVisible(false)}
              cycleId={selectedCycleId}
              clientId={selectedClient}
              setRefreshKey={setRefreshKey} // Asegúrate de pasar una función real si necesitas refrescar datos
              cycleOptions={cycleOptions}
              actionType={actionType}
            />
            <Dialog draggable={false}  resizable={false} header="Plan Details" className="responsive-dialog"  visible={planDetailsVisible} style={{ width: '80vw' }} onHide={hidePlanDetails}>
              {selectedPlan && <PlanDetails planId={selectedPlan} setPlanDetailsVisible={setPlanDetailsVisible} 
              setRefreshKey={setRefreshKey} setLoading={setLoading} />}
            </Dialog>
            <AssignWorkoutToSessionDialog
              visible={assignSessionVisible}
              onHide={() => setAssignSessionVisible(false)}
              sessionId={selectedSessionId}
              clientId={selectedClient}
              setRefreshKey={setRefreshKey}
              
            />
            <CreateTrainingCycleDialog visible={dialogVisible} onHide={hideCreateCycleDialog} />
          </TabPanel>
          <TabPanel header="Workout Details" >
              <div className="grid">
                <div className="col-12">
                  <Dropdown value={selectedWorkout} options={workoutOptions} onChange={(e) => setSelectedWorkout(e.value)} placeholder="Select a Workout" />
                  <DataTable value={filteredWorkouts}>
                      <Column body={(row) => formatDate(row.realEndDate)} header="Trained Date" style={{ width: '10%' }} />
                      <Column field="workout.planName" header="Workout Name" style={{ width: '20%' }}/>
                      <Column header="Details" body={renderSets} />
                  </DataTable>
                </div>
              </div>  
          </TabPanel>
          <TabPanel header="Exercise Progress">
            <div className="grid">
              <div className="col-12 md:col-6 lg:col-6">
                <Dropdown value={selectedExercise} options={exerciseOptions} filter filterBy='label' onChange={(e) => setSelectedExercise(e.value)} placeholder="Select an Exercise" />
                {chartData && <Chart type="line" data={chartData}  />}
              </div>
              <div className="col-12 md:col-6 lg:col-6">
                {adherenceData && <Chart type="bar" data={adherenceData} />}
              </div>
            </div>
          </TabPanel>
        </TabView>
      </div>
    </div>
  );
};

export default ClientDashboard;
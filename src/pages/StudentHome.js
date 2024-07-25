import React, { useContext, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { UserContext } from '../utils/UserContext';
import { useToast } from '../utils/ToastContext';

import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { TreeTable } from 'primereact/treetable';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

import PlanDetails from '../dialogs/PlanDetails';
import { formatDate, updateStatus } from '../utils/UtilFunctions';

import '../styles/StudentHome.css';
import { useSpinner } from '../utils/GlobalSpinner';
const apiUrl = process.env.REACT_APP_API_URL;

const StudentHome = () => {
  const { user, client } = useContext(UserContext);

  const [planDetailsVisible, setPlanDetailsVisible] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const showToast = useToast();
  const [nodes, setNodes] = useState([]);
  const { loading, setLoading } = useSpinner();
  const navigate = useNavigate();
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [cycles, setCycles] = useState([]);
  const calendarRef = useRef(null);

  const [selectedMonth, setSelectedMonth] = useState(null);
  const months = [
    { label: 'January', value: 0 },
    { label: 'February', value: 1 },
    { label: 'March', value: 2 },
    { label: 'April', value: 3 },
    { label: 'May', value: 4 },
    { label: 'June', value: 5 },
    { label: 'July', value: 6 },
    { label: 'August', value: 7 },
    { label: 'September', value: 8 },
    { label: 'October', value: 9 },
    { label: 'November', value: 10 },
    { label: 'December', value: 11 },
  ];
  
  const handleMonthChange = (e) => {
    setSelectedMonth(e.value);
  };

  const filteredNodes = nodes.filter(node => {
    if (selectedMonth === null) return true; // No filtrar si no hay un mes seleccionado
    const startDate = new Date(node.data.startDate);
    return startDate.getMonth() === selectedMonth;
  });

  const monthFilterElement = (
    <Dropdown 
      value={selectedMonth} 
      options={months} 
      onChange={handleMonthChange} 
      placeholder="Select a Month" 
      className="month-dropdown" 
    />
  );

  const getCurrentMonthYear = () => {
    const calendarApi = calendarRef.current.getApi();
    const currentDate = calendarApi.getDate();
    const currentMonth = currentDate.getMonth() + 1; // getMonth() devuelve 0-11, así que sumamos 1
    const currentYear = currentDate.getFullYear();
    return `${currentMonth}-${currentYear}`;
  };

  const updateStatus = (workout, session) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sessionDate = new Date(session.sessionDate);
    const sessionDay = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate());
    if (workout.status === 'pending') {
      if (sessionDay < today) {
        return 'expired';
      } else if (sessionDay.getTime() === today.getTime()) {
        return 'current';
      }
    }else {
      return workout.status
    }
  }
  useEffect(() => {
    setLoading(true)
    fetch(`${apiUrl}/workout/training-cycles/client/userId/${user.userId}`)
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Something went wrong');
        }
        return response.json();
      })
      .then(cycles => {
        const events = cycles.flatMap(cycle => 
          cycle.trainingWeeks.flatMap(week => 
            week.trainingSessions.flatMap(session => {
              const sessionEvents = session.workoutInstances.length > 0
                ? session.workoutInstances.map(workoutInstance => {
                  workoutInstance.status = updateStatus(workoutInstance, session)
                  // const now = new Date();
                  // const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                  // const sessionDate = new Date(session.sessionDate);
                  // const sessionDay = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate());
                  // if (workoutInstance.status === 'pending') {
                  //   if (sessionDay < today) {
                  //     workoutInstance.status = 'expired';
                  //   } else if (sessionDay.getTime() === today.getTime()) {
                  //     workoutInstance.status = 'current';
                  //   }
                  // }
                  return {
                    title: workoutInstance.workout.planName,
                    start: session.sessionDate,
                    extendedProps: {
                      status: workoutInstance.status,
                      workoutInstanceId: workoutInstance.id,
                      sessionId: session.id
                    }}
                  })
                : [{
                    title: 'no title',
                    start: session.sessionDate,
                    extendedProps: {
                      sessionId: session.id
                    }
                  }];
              
              return sessionEvents;
            })
          )
        );
        const cycleMap = cycles.map(cycle => {
          const startDate = new Date(cycle.startDate);
          const monthYear = `${startDate.getMonth() + 1}-${startDate.getFullYear()}`;
          return { monthYear, id: cycle.id };
        });
        setCycles(cycleMap);
        // console.log(events, cycles)
        setCalendarEvents(events);
      })
      .catch(error => showToast('error', 'Error', error.message))
      .finally(()=>setLoading(false))
  }, [user.userId, refreshKey, showToast]);

  const handleViewPlanDetails = (plan) => {
    setLoading(true)
    setSelectedPlan(plan);
    setPlanDetailsVisible(true);
  };

  const hidePlanDetails = () => {
    setPlanDetailsVisible(false);
    setSelectedPlan(null);
  };

  const handleStartTraining = (workoutInstanceId) => {
    navigate(`/plans/start-session/${workoutInstanceId}`, { state: { isTraining: true, planId: workoutInstanceId } });
  };

  const dateBodyTemplate = (node, field) => {
    return formatDate(node.data[field]);
  };
  
  const actionTemplate = (node) => {
    
    if (node.data.type === 'workoutInstance') {
      return (
      <div className="flex gap-2">
        <Button tooltip='View Details' className="p-button-rounded p-button-info" icon="pi pi-eye" onClick={() => handleViewPlanDetails(node.key.split('-')[1])} />
        {node.data.status !== 'completed' && (<Button tooltip='Start Training' className="p-button-rounded p-button-success" icon="pi pi-chart-bar" onClick={() => handleStartTraining(node.key.split('-')[1])} />)}
      </div>
      );
    }
    return null;
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
    const { status, workoutInstanceId, sessionId } = extendedProps || {};
    return (
      <>
        {title !== 'no title' && (
          <>
            <h3>
                <Button 
                tooltip="View Workout Details" 
                icon="pi pi-eye" 
                label={title}
                className={`p-button p-button-${status === 'completed' ? 'success' : status === 'expired' ? 'danger' : status === 'current' ? 'info' : 'warning'}` }
                onClick={() => handleViewWorkoutDetails(workoutInstanceId)} 
              />
            </h3>
            {/* <span>Status: {status}</span> */}
          </>
        )}
      </>
    );
  };

  return (
    <div className="student-home-container">
      <h1>Welcome, {client?.name || ''}!</h1>
      {/* <div className="flex w-12 "> */}
          {/* <TreeTable value={filteredNodes} rows={10} paginator >
            <Column field="name" header="Cycle Name" expander sortable />
            <Column field="startDate" header="Start Date" body={(node) => dateBodyTemplate(node, 'startDate')} filter 
          filterElement={monthFilterElement} />
            <Column field="endDate" header="End Date" body={(node) => dateBodyTemplate(node, 'endDate')} />
            <Column header="Actions" body={actionTemplate} />
          </TreeTable> */}
          <FullCalendar
            className='calendar-student'
            height={'50rem'}
            viewClassNames={'calendar-student'}
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={calendarEvents}
            eventContent={renderEventContent}
            ref={calendarRef}
            fixedWeekCount={false}
          />
        <Dialog header="Plan Details" visible={planDetailsVisible} style={{ width: '80vw' }} onHide={hidePlanDetails}>
          {selectedPlan && <PlanDetails planId={selectedPlan} setLoading={setLoading} setPlanDetailsVisible={setPlanDetailsVisible} setRefreshKey={setRefreshKey} />}
        </Dialog>
      {/* </div> */}
    </div>
  );
};

export default StudentHome;
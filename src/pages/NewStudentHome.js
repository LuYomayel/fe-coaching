import React, { useState, useEffect, useRef, useContext } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Dropdown } from 'primereact/dropdown';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../utils/UserContext';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { fetchTrainingCyclesForClientByUserId } from '../services/workoutService';
import PlanDetails from '../dialogs/PlanDetails';
import NewPlanDetail from '../dialogs/NewPlanDetails';

export default function NewStudentHome() {
  const { user, client } = useContext(UserContext);
  const navigate = useNavigate();
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [planDetailsVisible, setPlanDetailsVisible] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const toast = useRef(null);
  const calendarRef = useRef(null);

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
    } else {
      return workout.status;
    }
  };

  useEffect(() => {
    fetchTrainingData();
  }, [user.userId, refreshKey]);

  const fetchTrainingData = async () => {
    try {
      setLoading(true);
      const cycles = await fetchTrainingCyclesForClientByUserId(user.userId);
      const events = cycles.flatMap(cycle =>
        cycle.trainingWeeks.flatMap(week =>
          week.trainingSessions.flatMap(session => {
            const sessionEvents = session.workoutInstances.length > 0
              ? session.workoutInstances.map(workoutInstance => {
                  workoutInstance.status = updateStatus(workoutInstance, session);
                  return {
                    title: workoutInstance.workout.planName,
                    start: session.sessionDate,
                    extendedProps: {
                      status: workoutInstance.status,
                      workoutInstanceId: workoutInstance.id,
                      sessionId: session.id,
                    },
                  };
                })
              : [
                  {
                    title: 'no title',
                    start: session.sessionDate,
                    extendedProps: {
                      sessionId: session.id,
                    },
                  },
                ];

            return sessionEvents;
          })
        )
      );
      setCalendarEvents(events);
      setLoading(false);
    } catch (error) {
      setError('Failed to fetch training data');
      setLoading(false);
      toast.current.show({ severity: 'error', summary: 'Error', detail: error.message, life: 3000 });
    }
  };

  const handleViewWorkoutDetails = (workoutInstanceId) => {
    setSelectedPlan(workoutInstanceId);
    setPlanDetailsVisible(true);
  };

  const handleStartTrainingSession = (workoutInstanceId) => {
    navigate(`/plans/start-session/${workoutInstanceId}`, { state: { isTraining: true, planId: workoutInstanceId } });
  };

  const renderEventContent = (eventInfo) => {
    const { title, extendedProps } = eventInfo.event;
    const { status, workoutInstanceId } = extendedProps || {};

    return (
      <div className="custom-event-content p-2">
        {title !== 'no title' && (
          <>
            <div className="event-title mb-2">{title}</div>
            <div className="event-actions">
              <Button
                icon="pi pi-eye"
                className="p-button-rounded p-button-sm p-button-info mr-2"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewWorkoutDetails(workoutInstanceId);
                }}
                tooltip="View Details"
                tooltipOptions={{ position: 'top' }}
              />
              {status !== 'completed' && (
                <Button
                  icon="pi pi-play"
                  className="p-button-rounded p-button-sm p-button-success"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartTrainingSession(workoutInstanceId);
                  }}
                  tooltip="Start Training"
                  tooltipOptions={{ position: 'top' }}
                />
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  const monthOptions = [
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
    const calendarApi = calendarRef.current.getApi();
    calendarApi.gotoDate(new Date(new Date().getFullYear(), e.value, 1));
  };

  return (
    <div className="student-home p-4">
      <Toast ref={toast} />

      <Card className="mb-4">
        <h1 className="text-4xl font-bold mb-4">Welcome, {client?.name || ''}!</h1>
      </Card>

      <Card className="mb-4">
        <div className="flex justify-content-between align-items-center mb-4">
          <h2 className="text-2xl font-bold">Your Training Calendar</h2>
          <Dropdown value={selectedMonth} options={monthOptions} onChange={handleMonthChange} placeholder="Filter by Month" />
        </div>
        {loading ? (
          <div className="flex justify-content-center">
            <ProgressSpinner />
          </div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : (
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
            initialView={window.innerWidth > 768 ? 'dayGridMonth' : 'listMonth'}
            events={calendarEvents}
            eventContent={renderEventContent}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth',
            }}
            height="auto"
            windowResize={(arg) => {
              const calendarApi = calendarRef.current.getApi();
              if (window.innerWidth <= 768 && arg.view.type !== 'listMonth') {
                calendarApi.changeView('listMonth');
              } else if (window.innerWidth > 768 && arg.view.type !== 'dayGridMonth') {
                calendarApi.changeView('dayGridMonth');
              }
            }}
          />
        )}
      </Card>

      <Dialog
        header="Plan Details"
        visible={planDetailsVisible}
        style={{ width: '50vw' }}
        onHide={() => setPlanDetailsVisible(false)}
        draggable
        resizable
      >
        {selectedPlan && (
          <NewPlanDetail
            planId={selectedPlan}
            setLoading={setLoading}
            setPlanDetailsVisible={setPlanDetailsVisible}
            setRefreshKey={setRefreshKey}
          />
        )}
      </Dialog>

      <style jsx>{`
        .custom-event-content {
          width: 100%;
          height: 100%;
        }
        .event-title {
          font-weight: bold;
        }
        .event-actions {
          display: flex;
          justify-content: flex-end;
        }
        @media (max-width: 768px) {
          .p-dialog {
            width: 90vw !important;
          }
        }
      `}</style>
    </div>
  );
}
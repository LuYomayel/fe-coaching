import React, { useState, useEffect, useRef, useContext } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';

import { Dropdown } from 'primereact/dropdown';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import {
  fetchTrainingCyclesForClientByUserId,
  fetchTrainingSessionWithNoWeekByClientId
} from '../services/workoutService';
import NewPlanDetailHorizontal from '../dialogs/PlanDetails';
import { getDayMonthYear, formatDateToApi } from '../utils/UtilFunctions';
import { useIntl, FormattedMessage } from 'react-intl';

import { fetchClientStreak } from '../services/usersService';

export default function StudentCalendar() {
  const intl = useIntl();
  const { user, client } = useContext(UserContext);
  const navigate = useNavigate();
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [planDetailsVisible, setPlanDetailsVisible] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [today] = useState(new Date());
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
    const fetchTrainingData = async () => {
      try {
        setLoading(true);
        const { data } = await fetchTrainingCyclesForClientByUserId(user.userId);
        const cycles = data;
        const events = cycles.flatMap((cycle) =>
          cycle.trainingWeeks.flatMap((week) =>
            week.trainingSessions.flatMap((session) => {
              const sessionEvents =
                session.workoutInstances.length > 0
                  ? session.workoutInstances.map((workoutInstance) => {
                      workoutInstance.status = updateStatus(workoutInstance, session);
                      const start = formatDateToApi(new Date(session.sessionDate));
                      return {
                        title: workoutInstance.workout.planName,
                        start: start,
                        extendedProps: {
                          status: workoutInstance.status,
                          workoutInstanceId: workoutInstance.id,
                          sessionId: session.id
                        }
                      };
                    })
                  : [
                      {
                        title: 'no title',
                        start: getDayMonthYear(session).toISOString().split('T')[0],
                        extendedProps: {
                          sessionId: session.id
                        }
                      }
                    ];

              return sessionEvents;
            })
          )
        );

        const trainingSessionWithNoWeek = await fetchTrainingSessionWithNoWeekByClientId(client.id);
        const trainingSessionWithNoWeekEvents = trainingSessionWithNoWeek.data.map((session) => ({
          title: session.workoutInstances[0].instanceName
            ? session.workoutInstances[0].instanceName
            : session.workoutInstances[0].workout.planName,
          start: getDayMonthYear(session).toISOString().split('T')[0],
          extendedProps: {
            workoutInstanceId: session.workoutInstances[0].id,
            status: session.workoutInstances[0].status,
            sessionId: session.id
          }
        }));
        setCalendarEvents([...events, ...trainingSessionWithNoWeekEvents]);
        setLoading(false);
      } catch (error) {
        console.log(error);
        setError('Failed to fetch training data');
        setLoading(false);
        toast.current.show({
          severity: 'error',
          summary: 'Error',
          detail: error.message
        });
      }
    };

    const fetchClientRacha = async () => {
      const { data } = await fetchClientStreak(client.id);
      console.log(data);
    };

    if (user && client) {
      fetchTrainingData();
      fetchClientRacha();
    }
  }, [user, client]);

  const handleViewWorkoutDetails = (workoutInstanceId) => {
    setSelectedPlan(workoutInstanceId);
    setPlanDetailsVisible(true);
  };

  const handleStartTrainingSession = (workoutInstanceId) => {
    navigate(`/plans/start-session/${workoutInstanceId}`, {
      state: { isTraining: true, planId: workoutInstanceId }
    });
  };

  const renderEventContent = (eventInfo) => {
    const { title, extendedProps } = eventInfo.event;
    const { status, workoutInstanceId } = extendedProps || {};

    return (
      <div className="custom-event-content p-2">
        {title !== 'no title' && (
          <>
            <div className="event-title">{title}</div>
            <div className="event-actions">
              <Button
                icon="pi pi-eye"
                className="p-button-rounded p-button-sm p-button-info mr-2"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewWorkoutDetails(workoutInstanceId);
                }}
                tooltip={intl.formatMessage({
                  id: 'studentHome.calendar.viewDetails'
                })}
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
                  tooltip={intl.formatMessage({
                    id: 'studentHome.calendar.startTraining'
                  })}
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
    { label: intl.formatMessage({ id: 'months.january' }), value: 0 },
    { label: intl.formatMessage({ id: 'months.february' }), value: 1 },
    { label: intl.formatMessage({ id: 'months.march' }), value: 2 },
    { label: intl.formatMessage({ id: 'months.april' }), value: 3 },
    { label: intl.formatMessage({ id: 'months.may' }), value: 4 },
    { label: intl.formatMessage({ id: 'months.june' }), value: 5 },
    { label: intl.formatMessage({ id: 'months.july' }), value: 6 },
    { label: intl.formatMessage({ id: 'months.august' }), value: 7 },
    { label: intl.formatMessage({ id: 'months.september' }), value: 8 },
    { label: intl.formatMessage({ id: 'months.october' }), value: 9 },
    { label: intl.formatMessage({ id: 'months.november' }), value: 10 },
    { label: intl.formatMessage({ id: 'months.december' }), value: 11 }
  ];

  const handleMonthChange = (e) => {
    setSelectedMonth(e.value);
    const calendarApi = calendarRef.current.getApi();
    calendarApi.gotoDate(new Date(new Date().getFullYear(), e.value, 1));
  };

  const formatDate = (date) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString(intl.locale, options);
  };

  return (
    <div className="student-home">
      <Toast ref={toast} />

      <div className="student-header">
        <div className="student-header-content">
          <h1 className="student-welcome">
            <FormattedMessage id="studentHome.welcome" values={{ name: client?.name || '' }} />
          </h1>
          <p className="student-subheader">{formatDate(today)}</p>
        </div>
      </div>

      <Card className="student-card">
        <div className="calendar-controls">
          <h2 className="calendar-title">
            <i className="pi pi-calendar text-primary mr-2"></i>
            <FormattedMessage id="studentHome.calendar.title" />
          </h2>
          <Dropdown
            value={selectedMonth}
            options={monthOptions}
            onChange={handleMonthChange}
            placeholder={intl.formatMessage({
              id: 'studentHome.calendar.filterMonth'
            })}
            className="month-selector"
          />
        </div>
        {loading ? (
          <div className="loading-container">
            <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem' }}></i>
            <span>
              <FormattedMessage id="common.loading" />
            </span>
          </div>
        ) : error ? (
          <div className="error-message">
            <i className="pi pi-exclamation-triangle"></i>
            <FormattedMessage id="error.fetchTraining" />
          </div>
        ) : (
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
            initialView={window.innerWidth > 768 ? 'dayGridMonth' : 'listMonth'}
            events={calendarEvents}
            eventContent={renderEventContent}
            firstDay={1}
            timeZone="UTC"
            locale="es"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth'
            }}
            buttonText={{
              today: intl.formatMessage({ id: 'calendar.today' }),
              month: intl.formatMessage({ id: 'calendar.month' }),
              week: intl.formatMessage({ id: 'calendar.week' }),
              day: intl.formatMessage({ id: 'calendar.day' }),
              list: intl.formatMessage({ id: 'calendar.list' })
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
        header={intl.formatMessage({ id: 'studentHome.dialog.planDetails' })}
        draggable={false}
        resizable={false}
        dismissableMask
        visible={planDetailsVisible}
        style={{ width: '80vw' }}
        onHide={() => setPlanDetailsVisible(false)}
        className="plan-details-dialog"
      >
        {selectedPlan && (
          <NewPlanDetailHorizontal
            planId={selectedPlan}
            setLoading={setLoading}
            setPlanDetailsVisible={setPlanDetailsVisible}
            clientId={client.id}
          />
        )}
      </Dialog>
    </div>
  );
}

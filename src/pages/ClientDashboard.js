import React, { useState, useEffect, useRef } from 'react';
import { Card } from 'primereact/card';
import { TabView, TabPanel } from 'primereact/tabview';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Dropdown } from 'primereact/dropdown';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../utils/ToastContext';
import { useSpinner } from '../utils/GlobalSpinner';
import AssignWorkoutToCycleDialog from '../dialogs/AssignWorkoutToCycleDialog';
import AssignWorkoutToSessionDialog from '../dialogs/AssignWorkoutToSessionDialog';
import CreateTrainingCycleDialog from '../dialogs/CreateTrainingCycle';
import {
  fetchTrainingCyclesByClient,
  fetchWorkoutsByClientId,
  fetchTrainingSessionWithNoWeekByClientId
} from '../services/workoutService';
import { fetchClientByClientId } from '../services/usersService';
import '../styles/ClientDashboard.css';
import { formatDate, formatDateToApi } from '../utils/UtilFunctions';
// import WorkoutTable from '../components/WorkoutTable';
import NewWorkoutTable from '../components/NewWorkoutTable';
import { Badge } from 'primereact/badge';
import { useIntl, FormattedMessage } from 'react-intl';
import allLocales from '@fullcalendar/core/locales-all';
import { Avatar } from 'primereact/avatar';
import { Panel } from 'primereact/panel';
import { useLanguage } from '../i18n/LanguageContext';
import NewStudentDialog from '../dialogs/NewStudentDialog';
import { Tooltip } from 'primereact/tooltip';
import NewPlanDetailHorizontal from '../dialogs/PlanDetails';
import { fetchTrainingCyclesTemplates, assignCycleTemplateToClient } from '../services/workoutService';
import { Calendar } from 'primereact/calendar';
import { contactMethodOptions } from '../utils/Options';
import esLocale from '@fullcalendar/core/locales/es';
// Estilos mejorados para el botón de agregar sesión en el calendario
const addButtonStyle = `
  .fc-daygrid-day-frame {
    position: relative;
  }
  .fc-day-today .day-number {
    color: var(--primary-700);
    font-weight: 700;
  }
  .fc-daygrid-day-events {
    min-height: 40px;
  }
`;

export default function ClientDashboard() {
  const { clientId } = useParams();
  const [clientData, setClientData] = useState(null);
  const showToast = useToast();
  const { setLoading } = useSpinner();
  const { locale } = useLanguage();
  const intl = useIntl();
  const [isNewStudentDialogVisible, setIsNewStudentDialogVisible] = useState(false);
  const navigate = useNavigate();

  // State variables
  const [dialogVisible, setDialogVisible] = useState(false);
  const [workouts, setWorkouts] = useState([]);
  const [selectedWorkout, setSelectedWorkout] = useState(null);

  // eslint-disable-next-line
  const [selectedExercise, setSelectedExercise] = useState(null);

  // eslint-disable-next-line
  const [exerciseOptions, setExerciseOptions] = useState([]);

  // eslint-disable-next-line
  const [chartData, setChartData] = useState(null);
  const [workoutOptions, setWorkoutOptions] = useState([]);
  const [filteredWorkouts, setFilteredWorkouts] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [assignCycleVisible, setAssignCycleVisible] = useState(false);

  // eslint-disable-next-line
  const [selectedCycleId, setSelectedCycleId] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  //const [assignTrainingSessionVisible, setAssignTrainingSessionVisible] = useState(false);
  const [planDetailsVisible, setPlanDetailsVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const calendarRef = useRef(null);
  const [assignSessionVisible, setAssignSessionVisible] = useState(false);
  const [actionType, setActionType] = useState('assign');
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(1);
  const [cycleOptions, setCycleOptions] = useState([]);
  const [cycleDropdownOptions, setCycleDropdownOptions] = useState([]);

  // Estados para asignar ciclos de entrenamiento
  const [isAssignCycleTemplateDialogVisible, setAssignCycleTemplateDialogVisible] = useState(false);
  const [trainingCycleTemplates, setTrainingCycleTemplates] = useState([]);
  const [selectedCycleTemplate, setSelectedCycleTemplate] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // Nuevo estado para el índice de hover
  const [hoverRowIndex, setHoverRowIndex] = useState(null);

  // Estado para controlar el modo "solo Excel"
  const [isExcelOnlyMode, setIsExcelOnlyMode] = useState(false);

  // Fetch data when the component mounts or refreshKey changes
  useEffect(() => {
    setLoading(true);

    setCalendarEvents([]);
    fetchTrainingCyclesByClient(clientId)
      .then(({ events, cycleOptions }) => {
        // Add allDay: true to each event
        const mappedEvents = events.map((ev) => ({ ...ev, allDay: true }));
        setCycleOptions(cycleOptions);
        setCalendarEvents((e) => [...mappedEvents, ...e]);
        cycleOptions.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
        const options = cycleOptions.map((cycle) => ({
          label: `${cycle.name} - ${formatDate(cycle.startDate)} - ${formatDate(cycle.endDate)}`,
          value: cycle.id
        }));
        options.unshift({
          label: intl.formatMessage({ id: 'clientDashboard.cycle.createNewCycle' }),
          value: -1
        });
        setCycleDropdownOptions(options);
      })
      .catch((error) => showToast('error', 'Error fetching training cycles', error.message))
      .finally(() => setLoading(false));

    fetchTrainingSessionWithNoWeekByClientId(clientId)
      .then(({ data }) => {
        const events = data.map((session) => {
          const workoutInstance = session.workoutInstances[0];

          return {
            title: workoutInstance?.instanceName ? workoutInstance.instanceName : workoutInstance?.workout?.planName,
            start: session.sessionDate.split('T')[0],
            allDay: true,
            extendedProps: {
              sessionId: session.id,
              status: workoutInstance?.status,
              workoutInstanceId: workoutInstance?.id,
              cycle: null,
              trainingType: session?.trainingType,
              location: session?.location,
              sessionTime: session?.sessionTime,
              contactMethod: session?.contactMethod,
              notes: session?.notes
            }
          };
        });
        setCalendarEvents((e) => [...events, ...e]);
      })
      .catch((error) => showToast('error', 'Error fetching training sessions without weeks', error.message))
      .finally(() => setLoading(false));

    fetchWorkoutsByClientId(clientId)
      .then(({ data }) => {
        setWorkouts(data);
        const exercises = [
          ...new Map(
            data
              .flatMap((workout) =>
                workout.groups.flatMap((group) =>
                  group.exercises.map((ex) => [ex.exercise.id, { id: ex.exercise.id, name: ex.exercise.name }])
                )
              )
              .map((entry) => [entry[0], entry[1]])
          )
        ].map((entry) => entry[1]);

        setExerciseOptions(exercises.map((ex) => ({ label: ex.name, value: ex.id })));

        const uniqueWorkouts = [...new Map(data.map((workout) => [workout.workout.id, workout.workout])).values()];
        setWorkoutOptions(
          uniqueWorkouts.map((workout) => ({
            label: workout.planName,
            value: workout.id
          }))
        );
      })
      .catch((error) => {
        showToast('error', 'Error fetching client workouts', error.message);
      })
      .finally(() => setLoading(false));

    fetchClientByClientId(clientId)
      .then(({ data }) => {
        setClientData(data);
      })
      .catch((error) => {
        showToast('error', 'Error fetching client data', error.message);
      });

    // eslint-disable-next-line
  }, [clientId, refreshKey]);

  useEffect(() => {
    if (clientData) {
      fetchTrainingCyclesTemplates(clientData?.coach?.id || null)
        .then((response) => {
          setTrainingCycleTemplates(response.data);
        })
        .catch((error) => {
          console.error('Error fetching training cycle templates:', error);
        });
    }
  }, [clientData?.coach?.id, refreshKey]);
  // Update chart data when selectedExercise changes
  useEffect(() => {
    if (selectedExercise) {
      const extractNumber = (str) => {
        if (!str) return 0;
        const num = str.match(/\d+(\.\d+)?/);
        return num ? parseFloat(num[0]) : 0;
      };

      const filteredWorkouts = workouts
        .flatMap((workout) =>
          workout.groups.flatMap((group) =>
            group.exercises
              .filter((ex) => ex.exercise.id === selectedExercise)
              .map((ex) => ({
                date: workout.realEndDate,
                expectedReps: extractNumber(ex.repetitions) || 0,
                rpe: extractNumber(ex.rpe) || 0,
                sets: ex.setLogs.map((set) => ({
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
        )
        .filter((workout) => workout.date);

      const processedData = filteredWorkouts.map((fw) => {
        const totalReps = fw.sets.reduce((sum, set) => sum + set.completedReps, 0);
        const totalWeight = fw.sets.reduce((sum, set) => sum + set.weight, 0);
        const averageReps = fw.sets.length ? totalReps / fw.sets.length : 0;
        const averageWeight = fw.sets.length ? totalWeight / fw.sets.length : 0;

        return {
          date: new Date(fw.date).toLocaleDateString(),
          expectedReps: fw.expectedReps,
          averageReps,
          averageWeight,
          rpe: fw.rpe
        };
      });

      const dates = processedData.map((pd) => pd.date);
      const expectedRepsData = processedData.map((pd) => pd.expectedReps);
      const completedRepsData = processedData.map((pd) => pd.averageReps);
      const weightData = processedData.map((pd) => pd.averageWeight);
      const rpeData = processedData.map((pd) => pd.rpe);

      setChartData({
        labels: dates,
        datasets: [
          {
            label: 'Expected Repetitions',
            data: expectedRepsData,
            borderColor: 'blue',
            fill: false,
            yAxisID: 'y-axis-1'
          },
          {
            label: 'Completed Repetitions',
            data: completedRepsData,
            borderColor: 'green',
            fill: false,
            yAxisID: 'y-axis-1'
          },
          {
            label: 'Average Weight (kg)',
            data: weightData,
            borderColor: 'red',
            fill: false,
            yAxisID: 'y-axis-1'
          },
          {
            label: 'Average RPE',
            data: rpeData,
            borderColor: 'purple',
            fill: false,
            yAxisID: 'y-axis-2'
          }
        ]
      });
    }
  }, [selectedExercise, workouts]);

  // Update filtered workouts when selectedWorkout changes
  useEffect(() => {
    if (selectedWorkout) {
      const filtered = workouts.filter(
        (workout) => workout.workout.id === selectedWorkout && workout.status === 'completed'
      );
      const sortedWorkouts = [...filtered].sort((a, b) => new Date(b.realEndDate) - new Date(a.realEndDate));

      setFilteredWorkouts(sortedWorkouts);
    }
  }, [selectedWorkout, workouts]);

  // Handlers
  const handleViewWorkoutDetails = (workoutInstanceId) => {
    setLoading(true);
    setSelectedPlan(workoutInstanceId);
    setPlanDetailsVisible(true);
  };

  const handleDateClick = (arg) => {
    // Solo proceder si es un clic en un día, no en un evento
    if (arg.view.type.includes('dayGrid') || arg.view.type.includes('timeGrid')) {
      handleAddDayWorkout(arg.date);
    }
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
    const { status, workoutInstanceId, sessionId, trainingType, location, sessionTime, notes, contactMethod } =
      extendedProps || {};

    // Determinar la severidad según el estado
    let severity = 'info';
    let statusIcon = 'pi pi-calendar';
    let statusTooltip = intl.formatMessage({ id: 'dashboard.calendar.pendingStatus' }, { defaultMessage: 'Pendiente' });

    if (status === 'completed') {
      severity = 'success';
      statusIcon = 'pi pi-check-circle';
      statusTooltip = intl.formatMessage(
        { id: 'dashboard.calendar.completedStatus' },
        { defaultMessage: 'Completado' }
      );
    } else if (status === 'expired') {
      severity = 'danger';
      statusIcon = 'pi pi-times-circle';
      statusTooltip = intl.formatMessage({ id: 'dashboard.calendar.expiredStatus' }, { defaultMessage: 'Expirado' });
    } else if (status === 'current') {
      severity = 'info';
      statusIcon = 'pi pi-sync';
      statusTooltip = intl.formatMessage({ id: 'dashboard.calendar.currentStatus' }, { defaultMessage: 'En progreso' });
    } else {
      severity = 'warning';
      statusIcon = 'pi pi-exclamation-circle';
      statusTooltip = intl.formatMessage(
        { id: 'dashboard.calendar.warningStatus' },
        { defaultMessage: 'Atención requerida' }
      );
    }

    const renderLocationAndTime = () => {
      if (!trainingType && !clientData) return null;

      const showLocation =
        ((trainingType === 'presencial' || clientData?.trainingType === 'presencial') &&
          clientData?.location !== null) ||
        ((trainingType === 'hibrido' || clientData?.trainingType === 'hibrido') && clientData?.location !== null);
      const showTime =
        ((trainingType === 'presencial' || clientData?.trainingType === 'presencial') &&
          clientData?.location !== null) ||
        ((trainingType === 'virtual_sincronico' || clientData?.trainingType === 'virtual_sincronico') &&
          clientData?.location !== null) ||
        ((trainingType === 'hibrido' || clientData?.trainingType === 'hibrido') && clientData?.location !== null);
      const showMeetingLink =
        ((trainingType === 'virtual_sincronico' || clientData?.trainingType === 'virtual_sincronico') &&
          clientData?.location !== null &&
          notes) ||
        ((trainingType === 'hibrido' || clientData?.trainingType === 'hibrido') &&
          clientData?.location !== null &&
          notes);
      const showTrainingSessionButton = trainingType === 'presencial' && workoutInstanceId && status !== 'completed';

      const getGoogleMapsUrl = (location) => {
        if (!location) return null;
        const encodedLocation = encodeURIComponent(location);
        return `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;
      };

      const handleLocationClick = (e, location) => {
        e.preventDefault();
        e.stopPropagation();
        const mapsUrl = getGoogleMapsUrl(location);
        if (mapsUrl) {
          window.open(mapsUrl, '_blank');
        }
      };

      const handleTrainingSessionClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        navigate(`/plans/start-session/${workoutInstanceId}`, {
          state: {
            isTraining: true,
            planId: workoutInstanceId,
            clientId: clientId
          }
        });
      };

      // Usar la ubicación específica del entrenamiento o la ubicación predeterminada del cliente
      const locationToShow =
        location ||
        ((trainingType === 'presencial' || clientData?.trainingType === 'presencial') && clientData?.location
          ? clientData.location
          : null);

      return (
        <div className="event-details mt-2">
          {showLocation && locationToShow && (
            <div className="event-location">
              <i className="pi pi-map-marker mr-2" />
              <a
                href={getGoogleMapsUrl(locationToShow)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => handleLocationClick(e, locationToShow)}
                className="location-link"
              >
                {locationToShow}
              </a>
            </div>
          )}
          {showTime && sessionTime && (
            <div className="event-time">
              <i className="pi pi-clock mr-2" />
              {(() => {
                try {
                  const date = new Date(sessionTime);
                  return isNaN(date.getTime())
                    ? sessionTime
                    : date.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      });
                } catch (error) {
                  return sessionTime;
                }
              })()}
            </div>
          )}
          {showMeetingLink && (
            <div className="event-meeting-link">
              <i className="pi pi-link mr-2" />
              <a href={notes} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                {contactMethodOptions.find((option) => option.value === contactMethod)?.label || contactMethod}
              </a>
            </div>
          )}
          {showTrainingSessionButton && (
            <div className="event-training-session mt-2">
              <Button
                icon="pi pi-play"
                label={intl.formatMessage(
                  { id: 'dashboard.calendar.startTrainingSession' },
                  { defaultMessage: 'Iniciar sesión de entrenamiento' }
                )}
                className="p-button-success p-button-sm"
                onClick={handleTrainingSessionClick}
              />
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="custom-event-content">
        {title !== 'no title' ? (
          <div>
            <Button
              tooltip={intl.formatMessage(
                { id: 'dashboard.calendar.viewDetails' },
                { defaultMessage: 'Ver detalles del entrenamiento' }
              )}
              icon={statusIcon}
              size="small"
              label={title}
              severity={severity}
              text
              raised
              badge={statusTooltip}
              badgeClassName={`status-badge status-${severity}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleViewWorkoutDetails(workoutInstanceId);
              }}
            />
            {renderLocationAndTime()}
          </div>
        ) : (
          <Button
            tooltip={intl.formatMessage(
              { id: 'dashboard.calendar.assignWorkout' },
              { defaultMessage: 'Asignar entrenamientos al día' }
            )}
            icon="pi pi-calendar-plus"
            size="small"
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
              <p className="m-0">
                {intl.formatMessage(
                  { id: 'dashboard.calendar.assignWorkoutTo' },
                  { defaultMessage: 'Asignar entrenamiento' }
                )}
              </p>
            </div>
          </Button>
        )}
      </div>
    );
  };

  const renderDayCellContent = (dayInfo) => {
    const isToday = dayInfo.isToday;
    const dayNumberClasses = isToday ? 'day-number today-day' : 'day-number';

    // Verificar si hay eventos para este día
    const hasEvents = calendarEvents.some((event) => {
      const eventDate = new Date(event.start).toISOString().split('T')[0];
      const dayDate = dayInfo.date.toISOString().split('T')[0];
      return eventDate === dayDate;
    });

    return (
      <>
        <div className={dayNumberClasses}>{dayInfo.dayNumberText}</div>
        {!hasEvents && (
          <Button
            icon="pi pi-plus"
            rounded
            text
            aria-label={intl.formatMessage(
              { id: 'dashboard.calendar.addSession' },
              { defaultMessage: 'Añadir sesión' }
            )}
            tooltip={intl.formatMessage(
              { id: 'dashboard.calendar.addSessionTooltip' },
              { defaultMessage: 'Añadir nuevo entrenamiento a este día' }
            )}
            tooltipOptions={{ position: 'top' }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleAddDayWorkout(dayInfo.date);
            }}
          />
        )}
      </>
    );
  };

  const handleAssignDayWorkout = (sessionId) => {
    setSelectedClient(clientId);
    setSelectedSessionId(sessionId);
    setAssignSessionVisible(true);
  };

  const showCreateCycleDialog = () => {
    if (clientData.user.subscription.status === 'Active') setDialogVisible(true);
    else showToast('error', 'Error', intl.formatMessage({ id: 'student.error.noSubscription' }));
  };

  const hideCreateCycleDialog = () => {
    setRefreshKey((old) => old + 1);
    setDialogVisible(false);
  };

  const handleOpenAssignCycle = (action) => {
    setSelectedClient(clientId);
    setActionType(action);
    setAssignCycleVisible(true);
  };

  const handleNewStudentDialogHide = () => {
    setIsNewStudentDialogVisible(false);
  };

  const handleNewStudentDialogShow = () => {
    setIsNewStudentDialogVisible(true);
  };

  const renderPlanName = (rowData) => (
    <div>
      <p className="font-bold">{rowData.workout.planName}</p>
      <p className="text-sm">
        <FormattedMessage id="clientDashboard.workout.completedOn" />: {formatDate(rowData.realEndDate)}
      </p>
      <p className="text-sm">
        <FormattedMessage id="clientDashboard.workout.sessionTime" />: {rowData.sessionTime}
      </p>
      <p className="text-sm">
        <FormattedMessage id="clientDashboard.workout.feedback" />: {rowData.generalFeedback}
      </p>
      <p className="text-sm">
        <FormattedMessage id="clientDashboard.workout.mood" />: {rowData.mood ? `${rowData.mood}/10` : '-'}
      </p>
      <p className="text-sm">
        <FormattedMessage id="clientDashboard.workout.energy" />:{' '}
        {rowData.energyLevel ? `${rowData.energyLevel}/10` : '-'}
      </p>
      <p className="text-sm">
        <FormattedMessage id="clientDashboard.workout.difficulty" />:{' '}
        {rowData.perceivedDifficulty ? `${rowData.perceivedDifficulty}/10` : '-'}
      </p>
      <p className="text-sm">
        <FormattedMessage id="clientDashboard.workout.notes" />: {rowData.feedback}
      </p>
    </div>
  );

  const renderWorkoutDetails = (rowData) => {
    return (
      <Accordion>
        {rowData.groups.flatMap((group) =>
          group.exercises.map((exercise) => {
            const allProperties = [
              'repetitions',
              'weight',
              'rpe',
              'time',
              'distance',
              'tempo',
              'notes',
              'difficulty',
              'duration',
              'restInterval',
              'comments'
            ];
            const availableProperties = allProperties.filter((prop) => {
              return (
                exercise[prop] != null && exercise[prop] !== ''
                // && exercise.setLogs.some(log => log[prop] != null)
              );
            });
            const tableData = exercise.setLogs.length > 0 ? exercise.setLogs : [{ setNumber: 1 }];
            const expandedData = tableData.flatMap((setLog) => {
              return [
                {
                  setNumber: setLog.setNumber,
                  type: 'Expected',
                  ...availableProperties.reduce((acc, prop) => ({ ...acc, [prop]: exercise[prop] || '-' }), {}),
                  rpe: '-'
                },
                {
                  setNumber: setLog.setNumber,
                  type: 'Completed',
                  ...availableProperties.reduce((acc, prop) => ({ ...acc, [prop]: setLog[prop] || '-' }), {}),
                  rpe: exercise.rpe || '-',
                  notCompleted: !exercise.completed && !exercise.completedNotAsPlanned
                }
              ];
            });
            return (
              <AccordionTab
                key={exercise.id}
                header={
                  <>
                    {exercise.exercise.name}
                    <Badge
                      value={expandedData.some((data) => data.notCompleted) ? '✘' : '✔'}
                      className="ml-2"
                      severity={expandedData.some((data) => data.notCompleted) ? 'danger' : 'success'}
                    />
                  </>
                }
              >
                <DataTable
                  value={expandedData}
                  rowGroupMode="subheader"
                  groupRowsBy="setNumber"
                  sortMode="single"
                  sortField="setNumber"
                  sortOrder={1}
                >
                  <Column field="setNumber" header="Set" body={(rowData) => `Set ${rowData.setNumber}`} />
                  <Column field="type" header="Type" />
                  {availableProperties.map((prop) => (
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

  const renderTabView = () => {
    return (
      <TabView>
        <TabPanel header={intl.formatMessage({ id: 'clientDashboard.tabs.calendar' })}>
          <div className="action-buttons">
            <Button
              label={intl.formatMessage({ id: 'clientDashboard.buttons.assign' })}
              icon="pi pi-refresh"
              className="p-button-success"
              onClick={() => handleOpenAssignCycle('assign')}
            />
            <Button
              label={intl.formatMessage({ id: 'clientDashboard.buttons.unassign' })}
              icon="pi pi-trash"
              className="p-button-danger"
              onClick={() => handleOpenAssignCycle('unassign')}
            />
            <Button
              label={intl.formatMessage({ id: 'clientDashboard.buttons.createCycle' })}
              icon="pi pi-plus"
              className="p-button-secondary"
              onClick={showCreateCycleDialog}
            />
            <Button
              label={intl.formatMessage({ id: 'clientDashboard.buttons.assignCycleTemplate' })}
              icon="pi pi-clone"
              className="p-button-info"
              onClick={openAssignCycleTemplateDialog}
            />
          </div>

          <Card className="calendar-card">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
              initialView={window.innerWidth > 768 ? 'dayGridMonth' : 'listMonth'}
              events={calendarEvents}
              eventContent={renderEventContent}
              firstDay={1}
              timeZone="UTC"
              //dateClick={handleDateClick}
              //eventClick={handleEventClick}
              ref={calendarRef}
              fixedWeekCount={false}
              contentHeight="auto"
              locale="es"
              dayCellContent={renderDayCellContent}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,listMonth'
              }}
              buttonText={{
                today: intl.formatMessage({ id: 'calendar.today' }, { defaultMessage: 'Hoy' }),
                month: intl.formatMessage({ id: 'calendar.month' }, { defaultMessage: 'Mes' }),
                list: intl.formatMessage({ id: 'calendar.list' }, { defaultMessage: 'Lista' })
              }}
              dayMaxEvents={3}
              moreLinkContent={({ num }) => (
                <Badge
                  value={`+${num}`}
                  severity="info"
                  tooltip={intl.formatMessage(
                    { id: 'dashboard.calendar.moreEvents', defaultMessage: '{num} entrenamientos más' },
                    { num }
                  )}
                />
              )}
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
            cycleOptions={cycleDropdownOptions}
            actionType={actionType}
          />
          <AssignWorkoutToSessionDialog
            visible={assignSessionVisible}
            onHide={() => setAssignSessionVisible(false)}
            sessionId={selectedSessionId}
            clientId={selectedClient}
            setRefreshKey={setRefreshKey}
            selectedDate={selectedDate}
          />
          <CreateTrainingCycleDialog
            visible={dialogVisible}
            onHide={hideCreateCycleDialog}
            clientId={clientId}
            setRefreshKey={setRefreshKey}
          />
          <Dialog
            header={intl.formatMessage({ id: 'dashboard.dialog.planDetails' }, { defaultMessage: 'Detalles del Plan' })}
            dismissableMask
            draggable={false}
            resizable={false}
            visible={planDetailsVisible}
            style={{ width: '90vw', maxWidth: '1200px' }}
            onHide={hidePlanDetails}
            className="plan-details-dialog"
          >
            {selectedPlan && (
              <NewPlanDetailHorizontal
                planId={selectedPlan}
                setPlanDetailsVisible={setPlanDetailsVisible}
                setRefreshKey={setRefreshKey}
                setLoading={setLoading}
                isTemplate={false}
                clientId={clientId}
              />
            )}
          </Dialog>
        </TabPanel>

        <TabPanel header={intl.formatMessage({ id: 'clientDashboard.tabs.excelView' })}>
          <NewWorkoutTable
            cycleOptions={cycleDropdownOptions}
            clientData={clientData}
            onToggleExcelMode={() => setIsExcelOnlyMode(true)}
          />
        </TabPanel>

        <TabPanel
          header={intl.formatMessage({ id: 'clientDashboard.tabs.dashboard' }, { defaultMessage: 'Dashboard' })}
        >
          <div className="flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
            <Card className="w-full coming-soon-card">
              <div className="text-center">
                <i className="pi pi-clock text-5xl mb-3 text-primary-300"></i>
                <h2 className="text-color">
                  <FormattedMessage id="common.comingSoon" defaultMessage="Próximamente" />
                </h2>
                <p className="text-lg text-color-secondary">
                  <FormattedMessage
                    id="clientDashboard.comingSoon.dashboard"
                    defaultMessage="Estamos trabajando en un dashboard con estadísticas y métricas de progreso."
                  />
                </p>
              </div>
            </Card>
          </div>
        </TabPanel>

        <TabPanel
          header={intl.formatMessage(
            { id: 'clientDashboard.tabs.medicalHistory' },
            { defaultMessage: 'Historia Clínica' }
          )}
        >
          <div className="flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
            <Card className="w-full coming-soon-card">
              <div className="text-center">
                <i className="pi pi-heart text-5xl mb-3 text-primary-300"></i>
                <h2 className="text-color">
                  <FormattedMessage id="common.comingSoon" defaultMessage="Próximamente" />
                </h2>
                <p className="text-lg text-color-secondary">
                  <FormattedMessage
                    id="clientDashboard.comingSoon.medicalHistory"
                    defaultMessage="Próximamente podrás gestionar la historia clínica de tus clientes."
                  />
                </p>
              </div>
            </Card>
          </div>
        </TabPanel>

        <TabPanel
          header={intl.formatMessage({ id: 'clientDashboard.tabs.userData' }, { defaultMessage: 'Datos del Usuario' })}
        >
          <div className="flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
            <Card className="w-full coming-soon-card">
              <div className="text-center">
                <i className="pi pi-user text-5xl mb-3 text-primary-300"></i>
                <h2 className="text-color">
                  <FormattedMessage id="common.comingSoon" defaultMessage="Próximamente" />
                </h2>
                <p className="text-lg text-color-secondary">
                  <FormattedMessage
                    id="clientDashboard.comingSoon.userData"
                    defaultMessage="Próximamente podrás ver y editar todos los datos del usuario desde aquí."
                  />
                </p>
              </div>
            </Card>
          </div>
        </TabPanel>
      </TabView>
    );
  };

  const calculateAge = (birthdate) => {
    if (!birthdate) return null;

    const today = new Date();
    const birthDate = new Date(birthdate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  };

  // Header personalizado para el panel principal
  const headerTemplate = (options) => {
    const className = `${options.className} justify-content-space-between`;
    return (
      <div className={className}>
        <div className="profile-info">
          <div className="profile-image">
            <img
              src={clientData?.profilePicture || '/image.webp'}
              alt={clientData?.name || 'Profile'}
              onError={(e) => {
                e.target.src =
                  'https://t4.ftcdn.net/jpg/05/49/98/39/360_F_549983970_bRCkYfk0P6PP5fKbMhZMIb07mCJ6esXL.jpg';
              }}
            />
            {clientData &&
              [
                'fitnessGoal',
                'activityLevel',
                'gender',
                'weight',
                'height',
                'birthdate',
                'contactMethod',
                'location'
              ].some((field) => !clientData[field]) && (
                <>
                  <Tooltip target=".missing-data-indicator" />
                  <div
                    className="missing-data-indicator"
                    style={{
                      position: 'absolute',
                      bottom: '0',
                      right: '0',
                      background: 'white',
                      borderRadius: '50%',
                      width: '1rem',
                      height: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid var(--red-500)'
                    }}
                    data-pr-tooltip={intl.formatMessage({ id: 'common.missingData' })}
                    data-pr-position="bottom"
                  >
                    <i className="pi pi-exclamation-triangle text-red-500" style={{ fontSize: '0.7rem' }}></i>
                  </div>
                </>
              )}
          </div>
          <div className="profile-details">
            <h4>{clientData?.name}</h4>
            {clientData?.birthdate && (
              <p>
                {intl.formatMessage({ id: 'common.age' })}:&nbsp;
                {calculateAge(clientData.birthdate)}&nbsp;
                {intl.formatMessage({ id: 'common.years' })}
              </p>
            )}
          </div>
          <Button
            icon="pi pi-pencil"
            className="p-button-rounded p-button-text p-button-sm"
            onClick={() => handleNewStudentDialogShow(clientData?.email)}
            tooltip={intl.formatMessage({ id: 'students.actions.editProfile' })}
          />
        </div>
      </div>
    );
  };

  // Función para abrir el diálogo de asignación de ciclos
  const openAssignCycleTemplateDialog = () => {
    setAssignCycleTemplateDialogVisible(true);
    setSelectedCycleTemplate(null);
    setStartDate(null);
    setEndDate(null);
  };

  // Función para asignar un ciclo de entrenamiento al cliente
  const handleAssignCycleTemplateToClient = async () => {
    if (!selectedCycleTemplate || !startDate || !endDate) {
      showToast(
        'error',
        'Error',
        intl.formatMessage({
          id: 'clientDashboard.error.selectCycleAndDates',
          defaultMessage: 'Por favor seleccione un ciclo de entrenamiento y fechas de inicio/fin.'
        })
      );
      return;
    }

    setLoading(true);
    const startDateNewDate = new Date(startDate);
    const endDateNewDate = new Date(endDate);

    try {
      const payload = {
        cycleTemplateId: selectedCycleTemplate.id,
        clientId: parseInt(clientId),
        startDate: formatDateToApi(startDateNewDate),
        endDate: formatDateToApi(endDateNewDate)
      };

      await assignCycleTemplateToClient(payload);
      showToast(
        'success',
        intl.formatMessage({
          id: 'clientDashboard.success',
          defaultMessage: 'Éxito'
        }),
        intl.formatMessage({
          id: 'clientDashboard.success.cycleAssigned',
          defaultMessage: 'Ciclo de entrenamiento asignado correctamente.'
        })
      );
      setAssignCycleTemplateDialogVisible(false);
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      showToast('error', 'Error', error.message || 'Ocurrió un error al asignar el ciclo de entrenamiento.');
    } finally {
      setLoading(false);
      setSelectedCycleTemplate(null);
      setStartDate(null);
      setEndDate(null);
    }
  };

  const handleAddDayWorkout = (date) => {
    const clickedDate = new Date(date);
    clickedDate.setHours(0, 0, 0, 0);
    setSelectedDate(clickedDate);
    setSelectedClient(clientId);
    setSelectedSessionId(null);
    setAssignSessionVisible(true);
  };

  const handleEventClick = (arg) => {
    const { extendedProps } = arg.event;
    const { workoutInstanceId } = extendedProps || {};

    // Solo proceder si hay un ID de instancia de entrenamiento
    if (workoutInstanceId) {
      handleViewWorkoutDetails(workoutInstanceId);
    }
  };

  return (
    <div className="client-dashboard p-1">
      <style>{addButtonStyle}</style>

      {isExcelOnlyMode ? (
        // Modo solo Excel - pantalla completa sin header
        <div className="excel-fullscreen-mode">
          {cycleDropdownOptions.length > 0 && clientData ? (
            <NewWorkoutTable
              cycleOptions={cycleDropdownOptions}
              clientData={clientData}
              isExcelOnlyMode={true}
              clientName={clientData?.name}
              onToggleExcelMode={() => setIsExcelOnlyMode(false)}
            />
          ) : (
            <div className="flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
              <div className="text-center">
                <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem', marginBottom: '1rem' }}></i>
                <p>{intl.formatMessage({ id: 'common.loading' }, { defaultMessage: 'Cargando...' })}</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Modo dashboard completo
        <>
          {/* Botón flotante para alternar modo Excel */}
          <Button
            icon="pi pi-table"
            className="p-button-rounded p-button-info excel-toggle-button"
            onClick={() => setIsExcelOnlyMode(true)}
            tooltip={intl.formatMessage(
              { id: 'clientDashboard.showExcelOnly' },
              { defaultMessage: 'Mostrar solo vista Excel' }
            )}
            tooltipOptions={{ position: 'left' }}
            style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              zIndex: 1000,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}
          />

          <Panel headerTemplate={headerTemplate} className="panel-client-dashboard">
            {renderTabView()}
          </Panel>
        </>
      )}

      <Dialog
        header={intl.formatMessage({ id: 'students.dialog.editProfile' })}
        visible={isNewStudentDialogVisible}
        onHide={handleNewStudentDialogHide}
        draggable={false}
        resizable={false}
        dismissableMask
        className="responsive-dialog"
        style={{ width: '50vw' }}
      >
        <NewStudentDialog onClose={handleNewStudentDialogHide} setRefreshKey={setRefreshKey} studentData={clientData} />
      </Dialog>

      {/* Diálogo para asignar plantillas de ciclos de entrenamiento */}
      <Dialog
        dismissableMask
        modal
        draggable={false}
        resizable={false}
        className="responsive-dialog"
        header={intl.formatMessage({ id: 'clientDashboard.assignCycleTemplate.dialog.header' })}
        visible={isAssignCycleTemplateDialogVisible}
        style={{ width: '50vw' }}
        onHide={() => setAssignCycleTemplateDialogVisible(false)}
      >
        <div className="flex flex-column gap-3 p-3">
          <div className="field">
            <label className="block mb-2">
              {intl.formatMessage({ id: 'clientDashboard.assignCycleTemplate.selectCycle' })}
            </label>
            <Dropdown
              value={selectedCycleTemplate}
              options={trainingCycleTemplates}
              onChange={(e) => {
                setSelectedCycleTemplate(e.value);
                // Calcular fecha de fin basada en la duración del ciclo si hay fecha de inicio
                if (startDate && e.value) {
                  const endDate = new Date(startDate);
                  if (e.value.isDurationInMonths) {
                    endDate.setMonth(endDate.getMonth() + e.value.duration);
                  } else {
                    endDate.setDate(endDate.getDate() + e.value.duration * 7);
                  }
                  setEndDate(endDate);
                }
              }}
              optionLabel="name"
              placeholder={intl.formatMessage({ id: 'clientDashboard.assignCycleTemplate.selectCyclePlaceholder' })}
              className="w-full"
            />
            {selectedCycleTemplate && (
              <div className="cycle-info mt-2">
                <div className="cycle-name">{selectedCycleTemplate.name}</div>
                <div className="cycle-details">
                  <div className="m-0 text-sm flex gap-2">
                    <div className="m-0 text-sm">
                      {selectedCycleTemplate.duration}{' '}
                      {selectedCycleTemplate.isDurationInMonths
                        ? intl.formatMessage({ id: 'common.months' })
                        : intl.formatMessage({ id: 'common.weeks' })}{' '}
                      (
                      {selectedCycleTemplate.isDurationInMonths
                        ? selectedCycleTemplate.duration * 4
                        : selectedCycleTemplate.duration}{' '}
                      {intl.formatMessage({ id: 'common.weeks' })})
                    </div>
                    <div>
                      <p>/</p>
                    </div>

                    <div className="m-0 text-sm">
                      {selectedCycleTemplate.trainingWeeks?.[0]?.trainingSessions?.length || 0}{' '}
                      {intl.formatMessage({ id: 'common.workoutsPerWeek' })}
                    </div>
                  </div>

                  <div className="cycle-workouts mt-2 flex flex-wrap gap-2">
                    {selectedCycleTemplate.trainingWeeks?.[0]?.trainingSessions?.map((session, index) => (
                      <p key={index} className="m-0 text-sm">
                        {session.workoutInstances?.[0]?.workout?.planName || session.workout?.planName}{' '}
                        {index !== selectedCycleTemplate.trainingWeeks?.[0]?.trainingSessions?.length - 1 && ', '}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="field grid">
            <div className="col-6">
              <label className="block mb-2">{intl.formatMessage({ id: 'common.startDate' })}</label>
              <Calendar
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.value);
                  // Calcular fecha de fin si hay un ciclo seleccionado
                  if (e.value && selectedCycleTemplate) {
                    const endDate = new Date(e.value);
                    if (selectedCycleTemplate.isDurationInMonths) {
                      endDate.setMonth(endDate.getMonth() + selectedCycleTemplate.duration);
                    } else {
                      endDate.setDate(endDate.getDate() + selectedCycleTemplate.duration * 7);
                    }
                    setEndDate(endDate);
                  }
                }}
                showIcon
                className="w-full"
                locale={intl.locale}
              />
            </div>
            <div className="col-6">
              <label className="block mb-2">{intl.formatMessage({ id: 'common.endDate' })}</label>
              <Calendar value={endDate} disabled showIcon className="w-full" locale={intl.locale} />
            </div>
          </div>

          <Button
            label={intl.formatMessage({ id: 'common.assign' })}
            icon="pi pi-check"
            className="p-button-success mt-3"
            onClick={handleAssignCycleTemplateToClient}
          />
        </div>
      </Dialog>
    </div>
  );
}

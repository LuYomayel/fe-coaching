import React from 'react';
import { Button } from 'primereact/button';
import { Badge } from 'primereact/badge';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { useIntl } from 'react-intl';
import AssignWorkoutToCycleDialog from '../dialogs/AssignWorkoutToCycleDialog';
import AssignWorkoutToSessionDialog from '../dialogs/AssignWorkoutToSessionDialog';
import CreateTrainingCycleDialog from '../dialogs/CreateTrainingCycleDialog';
import PlanDetails from '../dialogs/PlanDetails';
import { useCalendarTab } from '../../hooks/client/useCalendarTab';
import { contactMethodOptions } from '../../types/coach/dropdown-options';
import { ClientData } from '../../pages/ClientDashboard';

interface CalendarTabProps {
  clientId: string;
  clientData: ClientData | null;
  refreshKey: number;
  setRefreshKey: (value: number | ((prev: number) => number)) => void; // eslint-disable-line no-unused-vars
}

export const CalendarTab: React.FC<CalendarTabProps> = ({ clientId, clientData, refreshKey, setRefreshKey }) => {
  const intl = useIntl();

  const {
    // Calendar
    calendarEvents,
    calendarRef,

    // Cycle dialogs
    assignCycleVisible,
    setAssignCycleVisible,
    cycleDropdownOptions,
    actionType,
    handleOpenAssignCycle,

    // Create cycle dialog
    dialogVisible,
    showCreateCycleDialog,
    hideCreateCycleDialog,

    // Session dialog
    assignSessionVisible,
    setAssignSessionVisible,
    selectedSessionId,
    selectedDate,
    selectedClient,
    handleAssignDayWorkout,
    handleAddDayWorkout,

    // Plan details dialog
    selectedPlan,
    planDetailsVisible,
    setPlanDetailsVisible,
    handleViewWorkoutDetails,

    // Utilities
    navigateToTrainingSession,
    setLoading
  } = useCalendarTab({ clientId, clientData, refreshKey, setRefreshKey });

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return { icon: 'pi pi-check-circle', color: '#22c55e', className: 'status-completed' };
      case 'expired':
        return { icon: 'pi pi-times-circle', color: '#ef4444', className: 'status-expired' };
      case 'current':
        return { icon: 'pi pi-bolt', color: '#6366f1', className: 'status-current' };
      default:
        return { icon: 'pi pi-clock', color: '#f97316', className: 'status-pending' };
    }
  };

  const getGoogleMapsUrl = (loc: string) => {
    if (!loc) return null;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc)}`;
  };

  const formatTime = (time: string) => {
    try {
      const date = new Date(time);
      return isNaN(date.getTime()) ? time : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return time;
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderEventContent = (eventInfo: any) => {
    if (!eventInfo || !eventInfo.event) return null;

    const { title, extendedProps } = eventInfo.event;
    const { status, workoutInstanceId, sessionId, sessionMode, location, sessionTime, notes, contactMethod } =
      extendedProps || {};

    const statusConfig = getStatusConfig(status);
    const showLocation = (sessionMode === 'presencial' || sessionMode === 'hibrido') && location;
    const showTime =
      (sessionMode === 'presencial' || sessionMode === 'hibrido' || sessionMode === 'virtual_sincronico') &&
      sessionTime;
    const showMeetingLink = (sessionMode === 'virtual_sincronico' || sessionMode === 'hibrido') && notes;
    const showTrainingSessionButton = sessionMode === 'presencial' && workoutInstanceId && status !== 'completed';
    const locationToShow = location || (sessionMode === 'presencial' ? clientData?.location : null);

    // Unassigned session
    if (title === 'no title') {
      return (
        <div
          className="calendar-event-ios status-assign"
          style={{ cursor: 'pointer' }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleAssignDayWorkout(sessionId);
          }}
        >
          <div className="flex align-items-center gap-1">
            <i className="pi pi-plus-circle" style={{ color: '#6366f1', fontSize: '0.72rem' }} />
            <span
              style={{
                fontSize: '0.74rem',
                fontWeight: 500,
                color: '#6366f1',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {intl.formatMessage(
                { id: 'dashboard.calendar.assignWorkoutTo' },
                { defaultMessage: 'Asignar entrenamiento' }
              )}
            </span>
          </div>
        </div>
      );
    }

    // Assigned workout event
    return (
      <div
        className={`calendar-event-ios ${statusConfig.className}`}
        style={{ cursor: 'pointer' }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleViewWorkoutDetails(workoutInstanceId);
        }}
      >
        {/* Title row */}
        <div className="flex align-items-center gap-1" style={{ marginBottom: '0.15rem' }}>
          <i className={statusConfig.icon} style={{ color: statusConfig.color, fontSize: '0.7rem', flexShrink: 0 }} />
          <span
            style={{
              fontSize: '0.76rem',
              fontWeight: 600,
              color: 'var(--ios-text)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              letterSpacing: '-0.01em'
            }}
            title={title}
          >
            {title}
          </span>
        </div>

        {/* Details */}
        {(showLocation || showTime || showMeetingLink || showTrainingSessionButton) && (
          <div style={{ fontSize: '0.7rem', color: 'var(--ios-text-secondary)' }}>
            {showTime && sessionTime && (
              <div className="flex align-items-center gap-1" style={{ marginBottom: '0.1rem' }}>
                <i className="pi pi-clock" style={{ fontSize: '0.62rem', color: statusConfig.color }} />
                <span>{formatTime(sessionTime)}</span>
              </div>
            )}
            {showLocation && locationToShow && (
              <div className="flex align-items-center gap-1" style={{ marginBottom: '0.1rem' }}>
                <i className="pi pi-map-marker" style={{ fontSize: '0.62rem', color: statusConfig.color }} />
                <a
                  href={getGoogleMapsUrl(locationToShow) || ''}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    color: 'var(--ios-text-secondary)',
                    textDecoration: 'none',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {locationToShow}
                </a>
              </div>
            )}
            {showMeetingLink && (
              <div className="flex align-items-center gap-1" style={{ marginBottom: '0.1rem' }}>
                <i className="pi pi-link" style={{ fontSize: '0.62rem', color: statusConfig.color }} />
                <a
                  href={notes}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    color: 'var(--ios-text-secondary)',
                    textDecoration: 'none',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {contactMethodOptions.find((option) => option.value === contactMethod)?.label || contactMethod}
                </a>
              </div>
            )}
            {showTrainingSessionButton && (
              <Button
                icon="pi pi-play"
                label={intl.formatMessage(
                  { id: 'dashboard.calendar.startTrainingSession' },
                  { defaultMessage: 'Iniciar sesión' }
                )}
                className="p-button-text p-button-sm w-full"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigateToTrainingSession(workoutInstanceId);
                }}
                style={{
                  color: '#22c55e',
                  fontSize: '0.72rem',
                  padding: '0.25rem 0.5rem',
                  marginTop: '0.2rem',
                  borderRadius: '6px',
                  background: 'rgba(34, 197, 94, 0.08)'
                }}
              />
            )}
          </div>
        )}
      </div>
    );
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderDayCellContent = (dayInfo: any) => {
    const hasEvents = calendarEvents.some((event) => {
      const eventDate = new Date(event.start).toISOString().split('T')[0];
      const dayDate = dayInfo.date.toISOString().split('T')[0];
      return eventDate === dayDate;
    });

    return (
      <>
        <div className="flex justify-content-end">{dayInfo.dayNumberText}</div>
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
              handleAddDayWorkout(dayInfo.date.toISOString().split('T')[0]);
            }}
            style={{ width: '1.5rem', height: '1.5rem', color: 'var(--ios-text-tertiary)' }}
          />
        )}
      </>
    );
  };

  return (
    <>
      <div className="action-buttons">
        <Button
          label={intl.formatMessage({ id: 'clientDashboard.buttons.createCycle' })}
          icon="pi pi-plus"
          className="p-button-secondary"
          onClick={showCreateCycleDialog}
        />
        <Button
          label={intl.formatMessage({ id: 'clientDashboard.buttons.assign' })}
          icon="pi pi-plus-circle"
          className="p-button-success"
          onClick={() => handleOpenAssignCycle('assign')}
        />
        <Button
          label={intl.formatMessage({ id: 'clientDashboard.buttons.unassign' })}
          icon="pi pi-minus-circle"
          className="p-button-danger"
          onClick={() => handleOpenAssignCycle('unassign')}
        />
      </div>

      <div className="calendar-card" style={{ padding: '1rem' }}>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView={window.innerWidth > 768 ? 'dayGridMonth' : 'listMonth'}
          events={calendarEvents}
          eventContent={renderEventContent}
          firstDay={1}
          timeZone="UTC"
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
          moreLinkContent={({ num }) => <Badge value={`+${num}`} severity="info" />}
          windowResize={(arg) => {
            if (calendarRef.current) {
              const calendarApi = calendarRef.current.getApi();
              if (arg.view.type === 'dayGridMonth' && window.innerWidth <= 768) {
                calendarApi.changeView('listMonth');
              } else if (arg.view.type === 'listMonth' && window.innerWidth > 768) {
                calendarApi.changeView('dayGridMonth');
              }
            }
          }}
        />
      </div>

      {/* Dialogs */}
      <AssignWorkoutToCycleDialog
        visible={assignCycleVisible}
        onHide={() => setAssignCycleVisible(false)}
        clientId={selectedClient || clientId}
        setRefreshKey={setRefreshKey}
        cycleOptions={cycleDropdownOptions}
        actionType={actionType}
      />
      <AssignWorkoutToSessionDialog
        visible={assignSessionVisible}
        onHide={() => setAssignSessionVisible(false)}
        sessionId={selectedSessionId}
        clientId={selectedClient || clientId}
        setRefreshKey={setRefreshKey}
        selectedDate={selectedDate}
      />
      <CreateTrainingCycleDialog
        visible={dialogVisible}
        onHide={hideCreateCycleDialog}
        clientId={clientId}
        setRefreshKey={setRefreshKey}
      />
      <PlanDetails
        planId={selectedPlan || 0}
        visible={planDetailsVisible}
        setPlanDetailsVisible={setPlanDetailsVisible}
        setRefreshKey={setRefreshKey}
        setLoading={setLoading}
        isTemplate={false}
        clientId={clientId}
      />
    </>
  );
};

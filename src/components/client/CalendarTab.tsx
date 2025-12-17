import React, { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Badge } from 'primereact/badge';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { useIntl } from 'react-intl';
import AssignWorkoutToCycleDialog from '../../dialogs/AssignWorkoutToCycleDialog';
import AssignWorkoutToSessionDialog from '../../dialogs/AssignWorkoutToSessionDialog';
import CreateTrainingCycleDialog from '../../dialogs/CreateTrainingCycle';
import PlanDetails from '../dialogs/PlanDetails';
import { AssignCycleTemplateDialog } from '../dialogs/AssignCycleTemplateDialog';
import { useCalendarTab } from '../../hooks/client/useCalendarTab';
import '../../App.css';
import { contactMethodOptions } from '../../types/coach/dropdown-options';
import { ClientData } from '../../pages/ClientDashboard';

interface CalendarTabProps {
  clientId: string;
  clientData: ClientData | null;
  refreshKey: number;
  setRefreshKey: (value: number | ((prev: number) => number)) => void;
}

export const CalendarTab: React.FC<CalendarTabProps> = ({ clientId, clientData, refreshKey, setRefreshKey }) => {
  const intl = useIntl();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

    // Assign cycle template dialog
    isAssignCycleTemplateDialogVisible,
    setAssignCycleTemplateDialogVisible,
    trainingCycleTemplates,
    selectedCycleTemplate,
    setSelectedCycleTemplate,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    handleAssignCycleTemplateToClient,

    // Utilities
    navigateToTrainingSession,
    setLoading
  } = useCalendarTab({ clientId, clientData, refreshKey, setRefreshKey });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderEventContent = (eventInfo: any) => {
    if (!eventInfo || !eventInfo.event) {
      return null;
    }

    const { title, extendedProps } = eventInfo.event;
    const { status, workoutInstanceId, sessionId, sessionMode, location, sessionTime, notes, contactMethod } =
      extendedProps || {};
    // Determinar la severidad según el estado
    let statusIcon = 'pi pi-calendar';
    let statusTooltip = intl.formatMessage({ id: 'dashboard.calendar.pendingStatus' }, { defaultMessage: 'Pendiente' });

    if (status === 'completed') {
      statusIcon = 'pi pi-check-circle';
      statusTooltip = intl.formatMessage(
        { id: 'dashboard.calendar.completedStatus' },
        { defaultMessage: 'Completado' }
      );
    } else if (status === 'expired') {
      statusIcon = 'pi pi-times-circle';
      statusTooltip = intl.formatMessage({ id: 'dashboard.calendar.expiredStatus' }, { defaultMessage: 'Expirado' });
    } else if (status === 'current') {
      statusIcon = 'pi pi-sync';
      statusTooltip = intl.formatMessage({ id: 'dashboard.calendar.currentStatus' }, { defaultMessage: 'En progreso' });
    } else {
      statusIcon = 'pi pi-exclamation-circle';
      statusTooltip = intl.formatMessage(
        { id: 'dashboard.calendar.warningStatus' },
        { defaultMessage: 'Atención requerida' }
      );
    }

    const getGoogleMapsUrl = (location: string) => {
      if (!location) return null;
      const encodedLocation = encodeURIComponent(location);
      return `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;
    };

    const handleLocationClick = (e: React.MouseEvent, location: string) => {
      e.preventDefault();
      e.stopPropagation();
      const mapsUrl = getGoogleMapsUrl(location);
      if (mapsUrl) {
        window.open(mapsUrl, '_blank');
      }
    };

    const handleTrainingSessionClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      navigateToTrainingSession(workoutInstanceId);
    };

    const formatTime = (time: string) => {
      try {
        const date = new Date(time);
        return isNaN(date.getTime())
          ? time
          : date.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            });
      } catch (error) {
        return time;
      }
    };

    const showLocation = (sessionMode === 'presencial' || sessionMode === 'hibrido') && location;
    const showTime =
      (sessionMode === 'presencial' || sessionMode === 'hibrido' || sessionMode === 'virtual_sincronico') &&
      sessionTime;
    const showMeetingLink = (sessionMode === 'virtual_sincronico' || sessionMode === 'hibrido') && notes;

    const showTrainingSessionButton = sessionMode === 'presencial' && workoutInstanceId && status !== 'completed';

    const locationToShow = location || (sessionMode === 'presencial' ? clientData?.location : null);

    const textColorClass =
      status === 'completed'
        ? 'text-success'
        : status === 'expired'
          ? 'text-danger'
          : status === 'current'
            ? 'text-primary'
            : 'text-warning';

    const bgColorClass =
      status === 'completed'
        ? 'bg-green-500'
        : status === 'expired'
          ? 'bg-red-500'
          : status === 'current'
            ? 'bg-blue-500'
            : 'bg-orange-500';

    // Si es un evento sin título (sesión sin workout asignado)
    if (title === 'no title') {
      return (
        <div
          className={`p-2 border-round-md bg-primary font-medium cursor-pointer transition-all transition-duration-200 flex align-items-center gap-2 w-full shadow-2 hover:shadow-4 ${
            isMobile ? 'text-xs' : 'text-sm'
          } ${bgColorClass} ${textColorClass}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleAssignDayWorkout(sessionId);
          }}
        >
          <i className={`pi pi-calendar-plus ${isMobile ? 'text-sm' : 'text-base'}`} />
          <span className="flex-1 overflow-hidden text-overflow-ellipsis white-space-nowrap">
            {intl.formatMessage(
              { id: 'dashboard.calendar.assignWorkoutTo' },
              { defaultMessage: 'Asignar entrenamiento' }
            )}
          </span>
        </div>
      );
    }

    // Evento con workout asignado
    return (
      <div
        className={`p-2 border-round-md cursor-pointer transition-all transition-duration-200 w-full shadow-2 hover:shadow-4  ${bgColorClass}
          ${isMobile ? 'text-xs' : 'text-sm'}
        `}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleViewWorkoutDetails(workoutInstanceId);
        }}
      >
        {/* Header con título y estado */}
        <div
          className={`flex align-items-center gap-2 ${
            showLocation || showTime || showMeetingLink || showTrainingSessionButton ? 'mb-2' : 'mb-0'
          }`}
          data-pr-tooltip={statusTooltip}
        >
          <i className={`${statusIcon} ${isMobile ? 'text-sm' : 'text-base'} ${bgColorClass} ${textColorClass}`} />
          <span
            className={`flex-1 overflow-hidden text-overflow-ellipsis white-space-nowrap font-semibold ${textColorClass}`}
            title={title}
          >
            {title}
          </span>
        </div>

        {/* Detalles adicionales */}
        {(showLocation || showTime || showMeetingLink || showTrainingSessionButton) && (
          <div
            className={`pt-2 border-top-1 border-200 flex flex-column gap-1 ${isMobile ? 'text-xs' : 'text-sm'} text-500`}
          >
            {showTime && sessionTime && (
              <div className="flex align-items-center gap-2">
                <i className={`pi pi-clock text-xs ${textColorClass}`} />
                <span>{formatTime(sessionTime)}</span>
              </div>
            )}
            {showLocation && locationToShow && (
              <div className="flex align-items-center gap-2">
                <i className={`pi pi-map-marker text-xs ${textColorClass}`} />
                <a
                  href={getGoogleMapsUrl(locationToShow) || ''}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => handleLocationClick(e, locationToShow)}
                  className={`flex-1 overflow-hidden text-overflow-ellipsis white-space-nowrap no-underline hover:underline ${textColorClass}`}
                >
                  {locationToShow}
                </a>
              </div>
            )}
            {showMeetingLink && (
              <div className="flex align-items-center gap-2">
                <i className={`pi pi-link text-xs ${textColorClass}`} />
                <a
                  href={notes}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className={`flex-1 overflow-hidden text-overflow-ellipsis white-space-nowrap no-underline hover:underline ${textColorClass}`}
                >
                  {contactMethodOptions.find((option) => option.value === contactMethod)?.label || contactMethod}
                </a>
              </div>
            )}
            {showTrainingSessionButton && (
              <div className="mt-2">
                <Button
                  icon="pi pi-play"
                  label={intl.formatMessage(
                    { id: 'dashboard.calendar.startTrainingSession' },
                    { defaultMessage: 'Iniciar sesión' }
                  )}
                  className={`p-button-success ${isMobile ? 'p-button-sm text-xs p-1' : 'p-button-sm text-sm p-2'} w-full  border-round-md`}
                  onClick={handleTrainingSessionClick}
                />
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderDayCellContent = (dayInfo: any) => {
    // Verificar si hay eventos para este día
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
      </div>

      <Card className="calendar-card">
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
      </Card>

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
      <AssignCycleTemplateDialog
        visible={isAssignCycleTemplateDialogVisible}
        onHide={() => setAssignCycleTemplateDialogVisible(false)}
        trainingCycleTemplates={trainingCycleTemplates}
        selectedCycleTemplate={selectedCycleTemplate}
        setSelectedCycleTemplate={setSelectedCycleTemplate}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        onAssign={handleAssignCycleTemplateToClient}
      />
    </>
  );
};

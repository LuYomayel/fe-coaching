import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { FormattedMessage } from 'react-intl';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { EventContentArg } from '@fullcalendar/core';
import { PlanDetailsDialog } from '../components/dialogs/PlanDetailsDialog';
import { useStudentCalendar } from '../hooks/student/useStudentCalendar';

export default function StudentCalendar() {
  const {
    intl,
    client,
    calendarEvents,
    loading,
    setLoading,
    error,
    selectedPlan,
    planDetailsVisible,
    setPlanDetailsVisible,
    selectedMonth,
    today,
    calendarRef,
    monthOptions,
    handleViewWorkoutDetails,
    handleStartTrainingSession,
    handleMonthChange,
    formatDate
  } = useStudentCalendar();

  const renderEventContent = (eventInfo: EventContentArg) => {
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

  return (
    <div className="student-home">
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
            onChange={(e) => handleMonthChange(e.value)}
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
              const calendarApi = calendarRef.current?.getApi();
              if (!calendarApi) return;
              if (window.innerWidth <= 768 && arg.view.type !== 'listMonth') {
                calendarApi.changeView('listMonth');
              } else if (window.innerWidth > 768 && arg.view.type !== 'dayGridMonth') {
                calendarApi.changeView('dayGridMonth');
              }
            }}
          />
        )}
      </Card>

      <PlanDetailsDialog
        visible={planDetailsVisible}
        onHide={() => setPlanDetailsVisible(false)}
        planId={selectedPlan}
        clientId={String(client?.id || '')}
        setRefreshKey={() => undefined}
        setLoading={setLoading}
      />
    </div>
  );
}

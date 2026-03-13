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
      <div style={{ padding: '0.35rem 0.5rem' }}>
        {title !== 'no title' && (
          <>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.25rem', letterSpacing: '-0.01em' }}>
              {title}
            </div>
            <div className="flex gap-1">
              <Button
                icon="pi pi-eye"
                className="p-button-rounded p-button-sm p-button-outlined"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewWorkoutDetails(workoutInstanceId);
                }}
                tooltip={intl.formatMessage({ id: 'studentHome.calendar.viewDetails' })}
                tooltipOptions={{ position: 'top' }}
                style={{ width: '1.6rem', height: '1.6rem', borderColor: '#3b82f6', color: '#3b82f6' }}
              />
              {status !== 'completed' && (
                <Button
                  icon="pi pi-play"
                  className="p-button-rounded p-button-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartTrainingSession(workoutInstanceId);
                  }}
                  tooltip={intl.formatMessage({ id: 'studentHome.calendar.startTraining' })}
                  tooltipOptions={{ position: 'top' }}
                  style={{ width: '1.6rem', height: '1.6rem', background: '#22c55e', border: 'none' }}
                />
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1
          style={{
            fontSize: 'clamp(1.5rem, 3vw, 2rem)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            margin: '0 0 0.25rem'
          }}
        >
          <FormattedMessage id="studentHome.welcome" values={{ name: client?.name || '' }} />
        </h1>
        <p style={{ color: 'var(--ios-text-secondary)', fontSize: '0.95rem', margin: 0 }}>{formatDate(today)}</p>
      </div>

      {/* Calendar Card */}
      <div
        style={{
          background: 'var(--ios-card-bg)',
          borderRadius: '20px',
          padding: '1.25rem',
          border: '1px solid var(--ios-card-border)',
          boxShadow: 'var(--ios-card-shadow)'
        }}
      >
        <div className="flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
          <div className="flex align-items-center gap-2">
            <i className="pi pi-calendar" style={{ color: '#6366f1', fontSize: '1rem' }} />
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, letterSpacing: '-0.015em' }}>
              <FormattedMessage id="studentHome.calendar.title" />
            </h2>
          </div>
          <Dropdown
            value={selectedMonth}
            options={monthOptions}
            onChange={(e) => handleMonthChange(e.value)}
            placeholder={intl.formatMessage({ id: 'studentHome.calendar.filterMonth' })}
          />
        </div>

        {loading ? (
          <div className="flex flex-column align-items-center justify-content-center p-5">
            <i
              className="pi pi-spin pi-spinner"
              style={{ fontSize: '1.5rem', color: '#6366f1', marginBottom: '0.5rem' }}
            />
            <span style={{ color: 'var(--ios-text-secondary)', fontSize: '0.88rem' }}>
              <FormattedMessage id="common.loading" />
            </span>
          </div>
        ) : error ? (
          <div className="flex align-items-center gap-2 p-3" style={{ color: '#ef4444' }}>
            <i className="pi pi-exclamation-triangle" />
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
      </div>

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

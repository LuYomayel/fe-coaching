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

  const renderEventContent = (eventInfo: EventContentArg) => {
    const { title, extendedProps } = eventInfo.event;
    const { status, workoutInstanceId } = extendedProps || {};
    const statusConfig = getStatusConfig(status as string);

    if (title === 'no title') return null;

    return (
      <div className={`calendar-event-ios ${statusConfig.className}`} style={{ cursor: 'pointer' }}>
        <div className="flex align-items-center gap-1" style={{ marginBottom: '0.2rem' }}>
          <i className={statusConfig.icon} style={{ color: statusConfig.color, fontSize: '0.7rem' }} />
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
          >
            {title}
          </span>
        </div>
        <div className="flex gap-1">
          <Button
            icon="pi pi-eye"
            className="p-button-rounded p-button-text p-button-sm"
            onClick={(e) => {
              e.stopPropagation();
              handleViewWorkoutDetails(workoutInstanceId);
            }}
            tooltip={intl.formatMessage({ id: 'studentHome.calendar.viewDetails' })}
            tooltipOptions={{ position: 'top' }}
            style={{
              width: '1.5rem',
              height: '1.5rem',
              color: statusConfig.color
            }}
          />
          {status !== 'completed' && (
            <Button
              icon="pi pi-play"
              className="p-button-rounded p-button-text p-button-sm"
              onClick={(e) => {
                e.stopPropagation();
                handleStartTrainingSession(workoutInstanceId);
              }}
              tooltip={intl.formatMessage({ id: 'studentHome.calendar.startTraining' })}
              tooltipOptions={{ position: 'top' }}
              style={{
                width: '1.5rem',
                height: '1.5rem',
                color: '#22c55e'
              }}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '0.75rem', maxWidth: '1000px', margin: '0 auto' }}>
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
            style={{
              borderRadius: '10px',
              fontSize: '0.85rem',
              border: '1px solid var(--ios-divider)'
            }}
          />
        </div>

        {/* Status Legend */}
        <div className="flex flex-wrap gap-3 mb-3" style={{ fontSize: '0.75rem', color: 'var(--ios-text-secondary)' }}>
          {[
            { color: '#6366f1', labelId: 'dashboard.calendar.currentStatus' },
            { color: '#f97316', labelId: 'dashboard.calendar.pendingStatus' },
            { color: '#22c55e', labelId: 'dashboard.calendar.completedStatus' },
            { color: '#ef4444', labelId: 'dashboard.calendar.expiredStatus' }
          ].map((item) => (
            <div key={item.labelId} className="flex align-items-center gap-1">
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: item.color
                }}
              />
              <span>
                <FormattedMessage id={item.labelId} />
              </span>
            </div>
          ))}
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

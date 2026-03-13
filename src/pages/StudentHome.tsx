import { Button } from 'primereact/button';
import { FormattedMessage } from 'react-intl';
import { PlanDetailsDialog } from '../components/dialogs/PlanDetailsDialog';
import { useStudentHome } from '../hooks/student/useStudentHome';

export default function StudentHome() {
  const {
    intl,
    client,
    streak,
    todayWorkouts,
    loading,
    setLoading,
    selectedPlan,
    planDetailsVisible,
    setPlanDetailsVisible,
    setRefreshKey,
    handleViewWorkoutDetails,
    handleStartTrainingSession,
    handleGoToCalendar,
    formatDate
  } = useStudentHome();

  return (
    <div style={{ padding: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
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
        <p style={{ color: 'var(--ios-text-secondary)', fontSize: '0.95rem', margin: 0 }}>{formatDate(new Date())}</p>
      </div>

      {/* Streak Card */}
      <div
        style={{
          background: 'var(--ios-card-bg)',
          borderRadius: '20px',
          padding: '1.25rem',
          marginBottom: '1rem',
          border: '1px solid var(--ios-card-border)',
          boxShadow: 'var(--ios-card-shadow)'
        }}
      >
        <div className="flex align-items-center justify-content-around">
          <div className="flex align-items-center gap-3">
            <div
              className="flex align-items-center justify-content-center"
              style={{
                width: '3rem',
                height: '3rem',
                background: 'rgba(99, 102, 241, 0.1)',
                borderRadius: '14px'
              }}
            >
              <i className="pi pi-calendar" style={{ color: '#6366f1', fontSize: '1.2rem' }} />
            </div>
            <div>
              <p
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--ios-text-secondary)',
                  margin: '0 0 0.1rem',
                  fontWeight: 500
                }}
              >
                <FormattedMessage id="studentHome.streak.daily" />
              </p>
              <p style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, letterSpacing: '-0.03em' }}>
                {streak.daily?.currentStreak || 0}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--ios-text-tertiary)', margin: 0 }}>
                <FormattedMessage id="studentHome.streak.days" />
              </p>
            </div>
          </div>

          <div style={{ width: '1px', height: '3.5rem', background: 'var(--ios-divider)' }} />

          <div className="flex align-items-center gap-3">
            <div
              className="flex align-items-center justify-content-center"
              style={{
                width: '3rem',
                height: '3rem',
                background: 'rgba(34, 197, 94, 0.1)',
                borderRadius: '14px'
              }}
            >
              <i className="pi pi-calendar-plus" style={{ color: '#22c55e', fontSize: '1.2rem' }} />
            </div>
            <div>
              <p
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--ios-text-secondary)',
                  margin: '0 0 0.1rem',
                  fontWeight: 500
                }}
              >
                <FormattedMessage id="studentHome.streak.weekly" />
              </p>
              <p style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, letterSpacing: '-0.03em' }}>
                {streak.weekly?.currentStreak || 0}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--ios-text-tertiary)', margin: 0 }}>
                <FormattedMessage id="studentHome.streak.weeks" />
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Workouts */}
      <div
        style={{
          background: 'var(--ios-card-bg)',
          borderRadius: '20px',
          padding: '1.25rem',
          marginBottom: '1rem',
          border: '1px solid var(--ios-card-border)',
          boxShadow: 'var(--ios-card-shadow)'
        }}
      >
        <div className="flex align-items-center gap-2 mb-3">
          <i className="pi pi-calendar" style={{ color: '#6366f1', fontSize: '1rem' }} />
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, letterSpacing: '-0.015em' }}>
            <FormattedMessage id="studentHome.todayWorkouts" />
          </h2>
        </div>

        {loading ? (
          <div className="flex flex-column align-items-center justify-content-center p-4">
            <i
              className="pi pi-spin pi-spinner"
              style={{ fontSize: '1.5rem', color: '#6366f1', marginBottom: '0.5rem' }}
            />
            <span style={{ color: 'var(--ios-text-secondary)', fontSize: '0.88rem' }}>
              <FormattedMessage id="common.loading" />
            </span>
          </div>
        ) : todayWorkouts.length > 0 ? (
          <div className="flex flex-column gap-2">
            {todayWorkouts.map((workout) => (
              <div
                key={workout.id}
                className="flex align-items-center justify-content-between"
                style={{
                  padding: '0.75rem 0.85rem',
                  background: 'var(--ios-surface-subtle)',
                  borderRadius: '12px'
                }}
              >
                <div className="flex-grow-1">
                  <h3 style={{ fontSize: '0.92rem', fontWeight: 600, margin: 0, letterSpacing: '-0.01em' }}>
                    {workout.name}
                  </h3>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color:
                        workout.status === 'completed'
                          ? '#22c55e'
                          : workout.status === 'in_progress'
                            ? '#f59e0b'
                            : '#6366f1',
                      padding: '0.1rem 0.4rem',
                      borderRadius: '6px',
                      background:
                        workout.status === 'completed'
                          ? 'rgba(34,197,94,0.1)'
                          : workout.status === 'in_progress'
                            ? 'rgba(245,158,11,0.1)'
                            : 'rgba(99,102,241,0.1)'
                    }}
                  >
                    <FormattedMessage id={`workout.status.${workout.status}`} />
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    icon="pi pi-eye"
                    className="p-button-rounded p-button-outlined p-button-sm"
                    onClick={() => handleViewWorkoutDetails(workout.id)}
                    tooltip={intl.formatMessage({ id: 'studentHome.viewWorkout' })}
                    style={{ width: '2.2rem', height: '2.2rem', borderColor: '#3b82f6', color: '#3b82f6' }}
                  />
                  {workout.status !== 'completed' && (
                    <Button
                      icon="pi pi-play"
                      className="p-button-rounded p-button-sm"
                      onClick={() => handleStartTrainingSession(workout.id)}
                      tooltip={intl.formatMessage({ id: 'studentHome.startWorkout' })}
                      style={{
                        width: '2.2rem',
                        height: '2.2rem',
                        background: '#22c55e',
                        border: 'none'
                      }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-column align-items-center justify-content-center p-4">
            <i
              className="pi pi-calendar-times"
              style={{ fontSize: '2rem', color: 'var(--ios-text-tertiary)', marginBottom: '0.5rem' }}
            />
            <p style={{ color: 'var(--ios-text-secondary)', margin: 0, fontSize: '0.88rem' }}>
              <FormattedMessage id="studentHome.noWorkoutsToday" />
            </p>
          </div>
        )}
      </div>

      {/* Calendar Button */}
      <Button
        label={intl.formatMessage({ id: 'studentHome.viewCalendar' })}
        icon="pi pi-calendar"
        onClick={handleGoToCalendar}
        className="w-full"
        style={{
          background: '#6366f1',
          border: 'none',
          borderRadius: '14px',
          padding: '0.85rem',
          fontWeight: 600,
          fontSize: '0.95rem',
          boxShadow: '0 4px 16px rgba(99, 102, 241, 0.25)'
        }}
      />

      <PlanDetailsDialog
        visible={planDetailsVisible}
        onHide={() => setPlanDetailsVisible(false)}
        planId={selectedPlan}
        clientId={String(client?.id || '')}
        setRefreshKey={setRefreshKey}
        setLoading={setLoading}
      />
    </div>
  );
}

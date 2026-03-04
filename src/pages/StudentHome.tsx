import { Card } from 'primereact/card';
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
    <div className="student-home">
      <div className="student-header">
        <div className="student-header-content">
          <h1 className="student-welcome">
            <FormattedMessage id="studentHome.welcome" values={{ name: client?.name || '' }} />
          </h1>
          <p className="student-subheader">{formatDate(new Date())}</p>
        </div>
      </div>

      <Card className="streak-card mb-4">
        <div className="streak-container">
          <div className="streak-item">
            <i className="pi pi-calendar streak-icon"></i>
            <div className="streak-info">
              <h3>
                <FormattedMessage id="studentHome.streak.daily" />
              </h3>
              <p className="streak-count">{streak.daily?.currentStreak || 0}</p>
              <p className="streak-label">
                <FormattedMessage id="studentHome.streak.days" />
              </p>
            </div>
          </div>
          <div className="streak-divider"></div>
          <div className="streak-item">
            <i className="pi pi-calendar-plus streak-icon"></i>
            <div className="streak-info">
              <h3>
                <FormattedMessage id="studentHome.streak.weekly" />
              </h3>
              <p className="streak-count">{streak.weekly?.currentStreak || 0}</p>
              <p className="streak-label">
                <FormattedMessage id="studentHome.streak.weeks" />
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="workouts-card mb-4">
        <h2 className="workouts-title">
          <i className="pi pi-calendar text-primary mr-2"></i>
          <FormattedMessage id="studentHome.todayWorkouts" />
        </h2>

        {loading ? (
          <div className="loading-container">
            <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem' }}></i>
            <span>
              <FormattedMessage id="common.loading" />
            </span>
          </div>
        ) : todayWorkouts.length > 0 ? (
          <div className="workouts-list">
            {todayWorkouts.map((workout) => (
              <div key={workout.id} className="workout-item">
                <div className="workout-info">
                  <h3>{workout.name}</h3>
                  <span className={`workout-status status-${workout.status}`}>
                    <FormattedMessage id={`workout.status.${workout.status}`} />
                  </span>
                </div>
                <div className="workout-actions">
                  <Button
                    icon="pi pi-eye"
                    className="p-button-rounded p-button-info mr-2"
                    onClick={() => handleViewWorkoutDetails(workout.id)}
                    tooltip={intl.formatMessage({ id: 'studentHome.viewWorkout' })}
                  />
                  {workout.status !== 'completed' && (
                    <Button
                      icon="pi pi-play"
                      className="p-button-rounded p-button-success"
                      onClick={() => handleStartTrainingSession(workout.id)}
                      tooltip={intl.formatMessage({ id: 'studentHome.startWorkout' })}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-workouts">
            <i className="pi pi-calendar-times"></i>
            <p>
              <FormattedMessage id="studentHome.noWorkoutsToday" />
            </p>
          </div>
        )}
      </Card>

      <Button
        label={intl.formatMessage({ id: 'studentHome.viewCalendar' })}
        icon="pi pi-calendar"
        className="p-button-primary p-button-rounded w-100"
        onClick={handleGoToCalendar}
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

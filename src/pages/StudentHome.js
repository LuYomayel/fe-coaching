import React, { useState, useEffect, useContext } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../utils/UserContext';
import { useIntl, FormattedMessage } from 'react-intl';
import { fetchAmIWorkingOutToday, fetchClientStreak } from '../services/usersService';

import NewPlanDetailHorizontal from '../dialogs/PlanDetails';

import '../styles/StudentHome.css';

export default function StudentHome() {
  const intl = useIntl();
  const { user, client } = useContext(UserContext);
  const navigate = useNavigate();
  const [streak, setStreak] = useState({ daily: null, weekly: null });
  const [todayWorkouts, setTodayWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [planDetailsVisible, setPlanDetailsVisible] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch streak data
        const { data: streakData } = await fetchClientStreak(client.id);
        setStreak(streakData);

        // Fetch today's workouts using the correct endpoint
        const { data: todayWorkoutsData } = await fetchAmIWorkingOutToday(client.id);
        // Transform the data to match our component's structure
        console.log(todayWorkoutsData);
        const transformedWorkouts = todayWorkoutsData.map((workout) => ({
          id: workout.workoutInstanceId,
          name: workout.planName,
          status: workout.status,
          sessionId: workout.sessionId,
          sessionDate: workout.sessionDate,
          dayNumber: workout.dayNumber
        }));

        setTodayWorkouts(transformedWorkouts);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    if (user && client) {
      fetchData();
    }
  }, [user, client, refreshKey]);

  const handleViewWorkoutDetails = (workoutId) => {
    setSelectedPlan(workoutId);
    setPlanDetailsVisible(true);
  };

  const handleStartTrainingSession = (workoutId) => {
    navigate(`/plans/start-session/${workoutId}`, {
      state: { isTraining: true, planId: workoutId }
    });
  };

  const handleGoToCalendar = () => {
    navigate('/student/calendar');
  };

  const formatDate = (date) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString(intl.locale, options);
  };

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

      {/* Streak Card */}
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

      {/* Today's Workouts Card */}
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

      {/* Calendar Button */}
      <Button
        label={intl.formatMessage({ id: 'studentHome.viewCalendar' })}
        icon="pi pi-calendar"
        className="p-button-primary p-button-rounded w-100"
        onClick={handleGoToCalendar}
      />

      {/* Plan Details Dialog */}
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
            setRefreshKey={setRefreshKey}
            clientId={client.id}
          />
        )}
      </Dialog>
    </div>
  );
}

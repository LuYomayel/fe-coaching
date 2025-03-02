import React, { useState, useEffect, useRef, useContext } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { fetchWorkoutInstance, fetchWorkoutInstanceTemplate, deleteWorkoutPlan, getRpeMethods } from '../services/workoutService';
import { useNavigate } from 'react-router-dom';
import { getYouTubeThumbnail, extractYouTubeVideoId, formatDate } from '../utils/UtilFunctions';
import { useToast } from '../utils/ToastContext';
import { UserContext } from '../utils/UserContext';
import { useConfirmationDialog } from '../utils/ConfirmationDialogContext';
import { useIntl, FormattedMessage } from 'react-intl';

export default function NewPlanDetailHorizontal({
  planId,
  setPlanDetailsVisible,
  setRefreshKey,
  setLoading,
  isTemplate,
}) {
  const intl = useIntl();
  const toast = useRef(null);
  const navigate = useNavigate();
  const { user, client } = useContext(UserContext);
  const { showConfirmationDialog } = useConfirmationDialog();
  const showToast = useToast();
  const propertyUnits = JSON.parse(localStorage.getItem('propertyUnits'));
  const [rpeMethods, setRpeMethods] = useState([]);
  const [videoDialogVisible, setVideoDialogVisible] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState('');

  const [workoutPlan, setWorkoutPlan] = useState({
    groups: [],
    workout: {
      id: '',
      planName: '',
    },
    workoutTemplate: {
      id: '',
      planName: '',
    },
    status: '',
  });

  useEffect(() => {
    const fetchPlanDetails = async () => {
      try {
        setLoading(true);
        const { data } = isTemplate
          ? await fetchWorkoutInstanceTemplate(planId)
          : await fetchWorkoutInstance(planId);
        // Sort groups by groupNumber
        data.groups.sort((a, b) => a.groupNumber - b.groupNumber);
        // Normalize empty exercise props
        data.groups.forEach((group) => {
          group.exercises.forEach((exercise) => {
            const props = [
              'sets',
              'repetitions',
              'tempo',
              'time',
              'weight',
              'restInterval',
              'difficulty',
              'duration',
              'distance',
            ];
            props.forEach((prop) => {
              if (exercise[prop] === '') {
                exercise[prop] = null;
              }
            });
          });
        });
        setWorkoutPlan(data);
      } catch (error) {
        showToast('error', 'Error fetching plan details', error.message);
      } finally {
        setLoading(false);
      }
    };
    if (planId) fetchPlanDetails();
  }, [planId, isTemplate, setLoading, showToast]);

  useEffect(() => {
    // Fetch RPE methods if not a template
    const fetchRpeMethods = async () => {
      try {
        setLoading(true);
        const { data } = await getRpeMethods(client?.coach?.user?.id || user.userId);
        setRpeMethods(data);
      } catch (error) {
        showToast('error', 'Error', 'No se pudieron cargar los métodos RPE');
      } finally {
        setLoading(false);
      }
    };
    if (!isTemplate) {
      fetchRpeMethods();
    }
  }, [isTemplate, client?.coach?.user?.id, user.userId, showToast, setLoading]);

  const handleEdit = () => {
    navigate(`/plans/edit/${planId}`);
  };

  const handleDelete = () => {
    showConfirmationDialog({
      message: intl.formatMessage({ id: 'deletePlan.confirmation.message' }),
      header: intl.formatMessage({ id: 'common.confirmation' }),
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          const response = await deleteWorkoutPlan(planId, workoutPlan.isTemplate);
          if (response.message === 'success') {
            showToast(
              'success',
              intl.formatMessage({ id: 'coach.plan.success.deleted' }),
              intl.formatMessage(
                { id: 'coach.plan.success.deleted.message' },
                { name: workoutPlan.workout.planName }
              )
            );
            setPlanDetailsVisible(false);
            setRefreshKey((old) => old + 1);
          } else {
            showToast('error', 'Error', response.error);
          }
        } catch (error) {
          showToast('error', 'Error', error.message);
        }
      },
    });
  };

  const handleStartWorkout = () => {
    navigate(`/plans/start-session/${planId}`, {
      state: { isTraining: true, planId: workoutPlan.id },
    });
  };

  const handleVideoClick = (url) => {
    try {
      const videoId = extractYouTubeVideoId(url);
      setSelectedVideo(`https://www.youtube.com/embed/${videoId}`);
      setVideoDialogVisible(true);
    } catch (error) {
      showToast('error', 'Error', error.message);
    }
  };

  const renderSetLogs = (setLogs) => {
    if (!setLogs || setLogs.length === 0) {
      return <p style={{ fontStyle: 'italic', color: '#666' }}>No set logs available</p>;
    }
  
    // Define the possible columns (excluding "setNumber" which we always want)
    const possibleKeys = [
      'repetitions',
      'weight',
      'time',
      'distance',
      'tempo',
      'notes',
      'difficulty',
      'duration',
      'restInterval',
    ];
  
    // Determine which columns have at least one non-empty value
    const columns = possibleKeys.filter((key) =>
      setLogs.some((log) => log[key] !== null && log[key] !== '')
    );
  
    return (
        <div className="p-datatable p-component" style={{ width: '100%', overflowX: 'auto' }}>
          <table className="p-datatable-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--surface-border)' }}>
                <th style={{ padding: '0.5rem', textAlign: 'left' }}>Set</th>
                {columns.map((col) => (
                  <th
                    key={col}
                    style={{
                      padding: '0.5rem',
                      textAlign: 'left',
                      textTransform: 'capitalize',
                      borderBottom: '1px solid var(--surface-border)',
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {setLogs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                  <td style={{ padding: '0.5rem' }}>{log.setNumber}</td>
                  {columns.map((col) => (
                    <td key={col} style={{ padding: '0.5rem' }}>
                      {log[col] !== null && log[col] !== '' ? log[col] : '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  };

  // Render basic exercise details (pending/in-progress)
  const renderExerciseDetails = (exercise) => (
    <div className="flex flex-column align-items-center mb-3" key={exercise.id}>
      <div className="w-full md:w-6 mb-2 md:mb-0">
        <div className="mr-2 flex-shrink-0">
          <a
            href="#/"
            onClick={(e) => {
              e.preventDefault();
              handleVideoClick(exercise.exercise.multimedia);
            }}
          >
            <img
              src={getYouTubeThumbnail(exercise.exercise.multimedia)}
              alt={`${exercise.exercise.name} thumbnail`}
              className="border-round"
              style={{ width: '120px', height: '68px', objectFit: 'cover', cursor: 'pointer' }}
            />
          </a>
        </div>
        <strong>{exercise.exercise.name}</strong>
      </div>
      <div className="w-full md:w-12">
        <div className="p-grid">
          {exercise.sets && (
            <div className="p-col-6 p-md-3">
              {intl.formatMessage({ id: 'exercise.properties.sets' })}: {exercise.sets}
              {propertyUnits?.sets || ''}
            </div>
          )}
          {exercise.repetitions && (
            <div className="p-col-6 p-md-3">
              {intl.formatMessage({ id: 'exercise.properties.reps' })}: {exercise.repetitions}
            </div>
          )}
          {exercise.weight && (
            <div className="p-col-6 p-md-3">
              {intl.formatMessage({ id: 'exercise.properties.weight' })}: {exercise.weight}
              {propertyUnits?.weight || ''}
            </div>
          )}
          {exercise.time && (
            <div className="p-col-6 p-md-3">
              {intl.formatMessage({ id: 'exercise.properties.time' })}: {exercise.time}
              {propertyUnits?.time || ''}
            </div>
          )}
          {exercise.tempo && (
            <div className="p-col-6 p-md-3">
              {intl.formatMessage({ id: 'exercise.properties.tempo' })}: {exercise.tempo}
            </div>
          )}
          {exercise.restInterval && (
            <div className="p-col-6 p-md-3">
              {intl.formatMessage({ id: 'exercise.properties.restInterval' })}: {exercise.restInterval}
              {propertyUnits?.restInterval || ''}
            </div>
          )}
          {exercise.difficulty && (
            <div className="p-col-6 p-md-3">
              {intl.formatMessage({ id: 'exercise.properties.difficulty' })}: {exercise.difficulty}
            </div>
          )}
          {exercise.distance && (
            <div className="p-col-6 p-md-3">
              {intl.formatMessage({ id: 'exercise.properties.distance' })}: {exercise.distance}
            </div>
          )}
          {exercise.duration && (
            <div className="p-col-6 p-md-3">
              {intl.formatMessage({ id: 'exercise.properties.duration' })}: {exercise.duration}
            </div>
          )}
          {exercise.notes && (
            <div className="p-col-6 p-md-3">
              {intl.formatMessage({ id: 'exercise.properties.notes' })}: {exercise.notes}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Render exercise details when plan is completed
  const renderExerciseDetailsWithFeedback = (exercise) => (
    <div className="flex flex-column align-items-center mb-3" key={exercise.id}>
      <div className="w-full md:w-6 mb-2 md:mb-0">
        <div className="mr-2 flex-shrink-0">
          <a
            href="#/"
            onClick={(e) => {
              e.preventDefault();
              handleVideoClick(exercise.exercise.multimedia);
            }}
          >
            <img
              src={getYouTubeThumbnail(exercise.exercise.multimedia)}
              alt={`${exercise.exercise.name} thumbnail`}
              className="border-round"
              style={{ width: '120px', height: '68px', objectFit: 'cover', cursor: 'pointer' }}
            />
          </a>
        </div>
        <strong>{exercise.exercise.name}</strong>
      </div>
      <div className="w-full md:w-12">
        <div className="p-grid">
          {exercise.repetitions && (
            <div className="p-col-6 p-md-3">
              {intl.formatMessage({ id: 'exercise.properties.reps' })}: {exercise.repetitions}
            </div>
          )}
          {exercise.weight && (
            <div className="p-col-6 p-md-3">
              {intl.formatMessage({ id: 'exercise.properties.weight' })}: {exercise.weight}
            </div>
          )}
          {exercise.time && (
            <div className="p-col-6 p-md-3">
              {intl.formatMessage({ id: 'exercise.properties.time' })}: {exercise.time}
            </div>
          )}
          {exercise.tempo && (
            <div className="p-col-6 p-md-3">
              {intl.formatMessage({ id: 'exercise.properties.tempo' })}: {exercise.tempo}
            </div>
          )}
          {exercise.restInterval && (
            <div className="p-col-6 p-md-3">
              {intl.formatMessage({ id: 'exercise.properties.restInterval' })}: {exercise.restInterval}
            </div>
          )}
          {exercise.difficulty && (
            <div className="p-col-6 p-md-3">
              {intl.formatMessage({ id: 'exercise.properties.difficulty' })}: {exercise.difficulty}
            </div>
          )}
          {exercise.notes && (
            <div className="p-col-6 p-md-3">
              {intl.formatMessage({ id: 'exercise.properties.notes' })}: {exercise.notes}
            </div>
          )}
          {exercise.distance && (
            <div className="p-col-6 p-md-3">
              {intl.formatMessage({ id: 'exercise.properties.distance' })}: {exercise.distance}
            </div>
          )}
          {exercise.duration && (
            <div className="p-col-6 p-md-3">
              {intl.formatMessage({ id: 'exercise.properties.duration' })}: {exercise.duration}
            </div>
          )}
          {exercise.sets && (
            <div className="p-col-6 p-md-3">
              {intl.formatMessage({ id: 'exercise.properties.sets' })}: {exercise.sets}
            </div>
          )}
        </div>
      </div>
      <div className="w-full md:w-12">
        <div className="p-grid">
          {exercise.completed ? (
            <div className="p-col-3">{intl.formatMessage({ id: 'exercise.properties.completed' })}</div>
          ) : exercise.completedNotAsPlanned ? (
            <div className="p-col-3">
              {intl.formatMessage({ id: 'exercise.properties.completedNotAsPlanned' })}
            </div>
          ) : (
            <div className="p-col-3">
              {intl.formatMessage({ id: 'exercise.properties.notCompleted' })}
            </div>
          )}
          {exercise.rpe && rpeMethods.length > 0 && (
            <div className="p-col-3">
              {(rpeMethods.find((method) => method.id === exercise.rpe) || { name: rpeMethods[0].name }).name}:
              {exercise.rpe}
            </div>
          )}
          {exercise.comments && (
            <div className="p-col-6">
              {intl.formatMessage({ id: 'exercise.properties.comments' })}: {exercise.comments}
            </div>
          )}
        </div>
      </div>

      {/* Render set logs if available */}
      {renderSetLogs(exercise.setLogs)}
    </div>
  );

  return (
    <div className="workout-plan-detail p-4">
      <Toast ref={toast} />

      {/* Card for Plan Title */}
      <Card className="mb-4">
        <div className="flex justify-content-between align-items-center mb-2">
          <h2 className="text-2xl font-bold m-0">
            {/* If it's a template, show the template name; otherwise, instanceName or workout planName */}
            {isTemplate
              ? workoutPlan.workoutTemplate?.planName
              : workoutPlan.instanceName
              ? workoutPlan.instanceName
              : workoutPlan.workout?.planName}
          </h2>

          {/* If user is coach => show Edit/Delete. If user is client => maybe show Start Workout if pending */}
          <div className="flex gap-2">
            {user.userType === 'coach' && (
              <>
                {(isTemplate || workoutPlan.status === 'pending') && (
                  <Button
                    label={intl.formatMessage({ id: 'common.edit' })}
                    icon="pi pi-pencil"
                    className="p-button-primary"
                    onClick={handleEdit}
                  />
                )}
                {(isTemplate || workoutPlan.status === 'pending') && (
                  <Button
                    label={intl.formatMessage({ id: 'common.delete' })}
                    icon="pi pi-trash"
                    className="p-button-danger"
                    onClick={handleDelete}
                  />
                )}
                {!isTemplate && (
                  <Button
                    label={intl.formatMessage({ id: 'common.template' })}
                    tooltip={intl.formatMessage({ id: 'common.useAsTemplate' })}
                    icon="pi pi-copy"
                    className="p-button-secondary"
                    onClick={() =>
                      navigate(`/plans/edit/${workoutPlan.id}`, {
                        state: { isEdit: true, changeToTemplate: true },
                      })
                    }
                  />
                )}
              </>
            )}
            {user.userType === 'client' && workoutPlan.status === 'pending' && (
              <Button
                label="Start Workout"
                icon="pi pi-play"
                className="p-button-success"
                onClick={handleStartWorkout}
              />
            )}
          </div>
        </div>

        {/* Show feedback below the plan name if the plan is completed */}
        {!isTemplate && workoutPlan.status === 'completed' && (
          <div className="mt-2">
            <p className="">
              <strong>{intl.formatMessage({ id: 'common.status' })}:</strong> {workoutPlan.status}
            </p>
            <p className="">
              {intl.formatMessage({ id: 'common.completedOn' })}: {formatDate(workoutPlan.feedback?.realEndDate)}
            </p>
            <p className="">
              {intl.formatMessage({ id: 'common.sessionTime' })}: {workoutPlan.feedback?.sessionTime}
            </p>
            <p className="">
              {intl.formatMessage({ id: 'common.feedback' })}: {workoutPlan.feedback?.generalFeedback}
            </p>
            <p className="">
              {intl.formatMessage({ id: 'common.mood' })}:{' '}
              {workoutPlan.feedback?.mood ? `${workoutPlan.feedback.mood}/10` : '-'}
            </p>
            <p className="">
              {intl.formatMessage({ id: 'common.energyLevel' })}:{' '}
              {workoutPlan.feedback?.energyLevel ? `${workoutPlan.feedback.energyLevel}/10` : '-'}
            </p>
            <p className="">
              {intl.formatMessage({ id: 'common.perceivedDifficulty' })}:{' '}
              {workoutPlan.feedback?.perceivedDifficulty
                ? `${workoutPlan.feedback.perceivedDifficulty}/10`
                : '-'}
            </p>
            <p className="">
              {intl.formatMessage({ id: 'common.extraNotes' })}: {workoutPlan.feedback?.additionalNotes}
            </p>
          </div>
        )}
      </Card>


      {/* Groups horizontally */}
      <div style={{ display: 'flex', flexDirection: 'row', overflowX: 'auto', gap: '1rem' }}>
        {workoutPlan.groups.map((group, groupIndex) => {
          // Check if all exercises are completed
          const allExercisesCompleted = group.exercises.every(
            (ex) => ex.completed || ex.completedNotAsPlanned
          );
          return (
            <div
              key={group.id || group.groupNumber}
              style={{ flex: '0 0 320px', minWidth: '320px' }}
            >
              <Card className="h-full" style={{ height: '100%' }}>
                <div className="flex justify-content-between align-items-center mb-3">
                  <div className="flex align-items-center">
                    {group.isRestPeriod ? (
                      <h3 className="text-xl m-0">
                        <FormattedMessage id="plan.group.restPeriod" />
                      </h3>
                    ) : (
                      <h3 className="text-xl m-0">
                        {group.name
                          ? group.name
                          : intl.formatMessage({ id: 'common.group' }, { number: group.groupNumber })} {group.groupNumber}
                      </h3> 
                    )}
                  </div>
                  {/* If plan is completed, show a check or X for the group */}
                  {!workoutPlan.isTemplate && workoutPlan.status === 'completed' && (
                    <span
                      className="ml-2"
                      style={{
                        color: allExercisesCompleted ? 'green' : 'red',
                        fontSize: '1.2rem',
                      }}
                    >
                      {allExercisesCompleted ? (
                        <i className="pi pi-check-circle" style={{ color: 'green' }} />
                      ) : (
                        <i className="pi pi-times-circle" style={{ color: 'red' }} />
                      )}
                    </span>
                  )}
                </div>

                {/* If rest period, show the rest duration */}
                {group.isRestPeriod && (
                  <p>
                    {intl.formatMessage({ id: 'plan.group.restPeriod' })}:{' '}
                    {group.restDuration} {propertyUnits?.restInterval || ''}
                  </p>
                )}

                {/* Render exercises */}
                {group.exercises.length === 0 && !group.isRestPeriod && (
                  <p style={{ color: '#999' }}>{intl.formatMessage({ id: 'plan.group.empty' })}</p>
                )}
                {group.exercises.map((exercise) =>
                  workoutPlan.status === 'completed'
                    ? renderExerciseDetailsWithFeedback(exercise)
                    : renderExerciseDetails(exercise)
                )}
              </Card>
            </div>
          );
        })}
      </div>

      <Dialog
        header={intl.formatMessage({ id: 'exercise.video.view' })}
        visible={videoDialogVisible}
        style={{ width: '70vw' }}
        onHide={() => setVideoDialogVisible(false)}
        dismissableMask
        draggable={false}
        resizable={false}
        className="responsive-dialog"
      >
        <iframe
          width="100%"
          height="400"
          src={selectedVideo}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Exercise Video"
        ></iframe>
      </Dialog>
    </div>
  );
}
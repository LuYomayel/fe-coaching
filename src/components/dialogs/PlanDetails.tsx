import React from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { FormattedMessage } from 'react-intl';
import { formatDate, getYouTubeThumbnail } from '../../utils/UtilFunctions';
import VideoDialog from './VideoDialog';
import { contactMethodOptions, sessionModeOptions } from '../../types/coach/dropdown-options';
import { usePlanDetails } from '../../hooks/dialogs/usePlanDetails';
import { IExerciseSetConfiguration } from '../../types/workout/exercise-set-configuration';
import { IExerciseSetLog } from '../../types/workout/exercise-set-log';
import { IExerciseInstance } from '../../types/workout/exercise-instance';
import { Dialog } from 'primereact/dialog';

interface PlanDetailsProps {
  planId: number;
  visible: boolean;
  setPlanDetailsVisible: (visible: boolean) => void;
  setRefreshKey: (key: ((prev: number) => number) | number) => void;
  setLoading: (loading: boolean) => void;
  isTemplate: boolean;
  clientId: string;
}

const PlanDetails: React.FC<PlanDetailsProps> = ({
  planId,
  visible,
  setPlanDetailsVisible,
  setRefreshKey,
  setLoading,
  isTemplate,
  clientId
}) => {
  const propertyUnits = JSON.parse(localStorage.getItem('propertyUnits') || '{}');

  const {
    workoutPlan,
    rpeMethod,
    videoDialogVisible,
    selectedVideo,
    isEditing,
    editedLocation,
    editedContactMethod,
    editedNotes,
    editedSessionTime,
    editedSessionMode,
    user,
    setVideoDialogVisible,
    setIsEditing,
    setEditedLocation,
    setEditedContactMethod,
    setEditedNotes,
    setEditedSessionTime,
    setEditedSessionMode,
    handleEdit,
    handleDelete,
    handleStartWorkout,
    handleVideoClick,
    handleSaveChanges,
    handleCancelEdit,
    canStartWorkout
  } = usePlanDetails({
    planId,
    isTemplate,
    clientId,
    setLoading,
    setPlanDetailsVisible,
    setRefreshKey
  });

  // Renderizar configuración de sets
  const renderSetConfiguration = (setConfiguration: IExerciseSetConfiguration[]) => {
    if (!setConfiguration || setConfiguration.length === 0) {
      return null;
    }

    // Determinar qué columnas tienen valores
    const possibleKeys: (keyof IExerciseSetConfiguration)[] = [
      'repetitions',
      'weight',
      'time',
      'distance',
      'tempo',
      'notes',
      'difficulty',
      'duration',
      'restInterval'
    ];

    const columns = possibleKeys.filter((key) =>
      setConfiguration.some((config) => config[key] !== null && config[key] !== '' && config[key] !== undefined)
    );

    if (columns.length === 0) return null;

    return (
      <div className="mt-3 mb-3">
        <div className="surface-100 border-round p-2">
          <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr className="border-bottom-1 border-200">
                <th className="p-2 text-left font-semibold">Set</th>
                {columns.map((col) => (
                  <th key={col} className="p-2 text-left font-semibold text-capitalize">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {setConfiguration.map((config) => (
                <tr key={config.setNumber} className="border-bottom-1 border-200">
                  <td className="p-2 font-semibold">{config.setNumber}</td>
                  {columns.map((col) => (
                    <td key={col} className="p-2">
                      {config[col] !== null && config[col] !== '' && config[col] !== undefined ? config[col] : '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Renderizar logs de sets (feedback del cliente)
  const renderSetLogs = (setLogs: IExerciseSetLog[]) => {
    if (!setLogs || setLogs.length === 0) {
      return null;
    }

    const possibleKeys: (keyof IExerciseSetLog)[] = [
      'repetitions',
      'weight',
      'time',
      'distance',
      'tempo',
      'notes',
      'difficulty',
      'duration',
      'restInterval',
      'rating'
    ];

    const columns = possibleKeys.filter((key) =>
      setLogs.some((log) => log[key] !== null && log[key] !== '' && log[key] !== undefined)
    );

    if (columns.length === 0) return null;

    return (
      <div className="mt-3">
        <h4 className="text-sm font-semibold mb-2 text-success">
          <FormattedMessage id="exercise.feedback.title" defaultMessage="Feedback del Cliente" />
        </h4>
        <div className="surface-100 border-round p-2">
          <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr className="border-bottom-1 border-200">
                <th className="p-2 text-left font-semibold">Set</th>
                {columns.map((col) => (
                  <th key={col} className="p-2 text-left font-semibold text-capitalize">
                    {col === 'rating' && rpeMethod ? rpeMethod.name : col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {setLogs.map((log) => (
                <tr key={log.id} className="border-bottom-1 border-200">
                  <td className="p-2 font-semibold">{log.setNumber}</td>
                  {columns.map((col) => (
                    <td key={col} className="p-2">
                      {log[col] !== null && log[col] !== '' && log[col] !== undefined ? String(log[col]) : '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Renderizar detalles básicos del ejercicio
  const renderExerciseDetails = (exercise: IExerciseInstance) => (
    <div className="flex flex-column mb-3" key={exercise.id}>
      <div className="flex gap-3 mb-2">
        <div className="flex-shrink-0">
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
              style={{
                width: '120px',
                height: '68px',
                objectFit: 'cover',
                cursor: 'pointer'
              }}
            />
          </a>
        </div>
        <div className="flex-1">
          <strong className="text-lg">{exercise.exercise.name}</strong>
        </div>
      </div>

      {/* Renderizar setConfiguration si existe */}
      {exercise.setConfiguration ? (
        renderSetConfiguration(exercise.setConfiguration)
      ) : (
        <div className="grid">
          {exercise.sets && (
            <div className="col-6 md:col-4">
              <strong>Sets:</strong> {exercise.sets}
              {propertyUnits?.sets || ''}
            </div>
          )}
          {exercise.repetitions && (
            <div className="col-6 md:col-4">
              <strong>Reps:</strong> {exercise.repetitions}
            </div>
          )}
          {exercise.weight && (
            <div className="col-6 md:col-4">
              <strong>Weight:</strong> {exercise.weight}
              {propertyUnits?.weight || ''}
            </div>
          )}
          {exercise.time && (
            <div className="col-6 md:col-4">
              <strong>Time:</strong> {exercise.time}
              {propertyUnits?.time || ''}
            </div>
          )}
          {exercise.tempo && (
            <div className="col-6 md:col-4">
              <strong>Tempo:</strong> {exercise.tempo}
            </div>
          )}
          {exercise.restInterval && (
            <div className="col-6 md:col-4">
              <strong>Rest:</strong> {exercise.restInterval}
              {propertyUnits?.restInterval || ''}
            </div>
          )}
          {exercise.difficulty && (
            <div className="col-6 md:col-4">
              <strong>Difficulty:</strong> {exercise.difficulty}
            </div>
          )}
          {exercise.distance && (
            <div className="col-6 md:col-4">
              <strong>Distance:</strong> {exercise.distance}
            </div>
          )}
          {exercise.duration && (
            <div className="col-6 md:col-4">
              <strong>Duration:</strong> {exercise.duration}
            </div>
          )}
          {exercise.notes && (
            <div className="col-12">
              <strong>Notes:</strong> {exercise.notes}
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Renderizar detalles del ejercicio con feedback (cuando está completado)
  const renderExerciseDetailsWithFeedback = (exercise: IExerciseInstance) => (
    <div className="flex flex-column mb-3" key={exercise.id}>
      <div className="flex gap-3 mb-2">
        <div className="flex-shrink-0">
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
              style={{
                width: '120px',
                height: '68px',
                objectFit: 'cover',
                cursor: 'pointer'
              }}
            />
          </a>
        </div>
        <div className="flex-1">
          <strong className="text-lg">{exercise.exercise.name}</strong>
        </div>
      </div>

      {/* Renderizar setConfiguration si existe */}
      {exercise.setConfiguration && renderSetConfiguration(exercise.setConfiguration)}

      {/* Propiedades del ejercicio */}
      <div className="grid mb-2">
        {exercise.repetitions && (
          <div className="col-6 md:col-4">
            <strong>Reps:</strong> {exercise.repetitions}
          </div>
        )}
        {exercise.weight && (
          <div className="col-6 md:col-4">
            <strong>Weight:</strong> {exercise.weight}
          </div>
        )}
        {exercise.time && (
          <div className="col-6 md:col-4">
            <strong>Time:</strong> {exercise.time}
          </div>
        )}
        {exercise.tempo && (
          <div className="col-6 md:col-4">
            <strong>Tempo:</strong> {exercise.tempo}
          </div>
        )}
        {exercise.restInterval && (
          <div className="col-6 md:col-4">
            <strong>Rest:</strong> {exercise.restInterval}
          </div>
        )}
        {exercise.difficulty && (
          <div className="col-6 md:col-4">
            <strong>Difficulty:</strong> {exercise.difficulty}
          </div>
        )}
        {exercise.notes && (
          <div className="col-12">
            <strong>Notes:</strong> {exercise.notes}
          </div>
        )}
        {exercise.distance && (
          <div className="col-6 md:col-4">
            <strong>Distance:</strong> {exercise.distance}
          </div>
        )}
        {exercise.duration && (
          <div className="col-6 md:col-4">
            <strong>Duration:</strong> {exercise.duration}
          </div>
        )}
        {exercise.sets && (
          <div className="col-6 md:col-4">
            <strong>Sets:</strong> {exercise.sets}
          </div>
        )}
      </div>

      {/* Estado de completado */}
      <div className="grid mb-2">
        {exercise.completed ? (
          <div className="col-12 md:col-6">
            <span
              className="inline-flex align-items-center border-round-xl px-3 py-1 font-semibold"
              style={{
                background: '#d4edda',
                color: '#155724'
              }}
            >
              <i className="pi pi-check-circle mr-2" style={{ color: '#28a745' }} />
              <FormattedMessage id="exercise.properties.completed" defaultMessage="Completado" />
            </span>
          </div>
        ) : exercise.completedNotAsPlanned ? (
          <div className="col-12 md:col-6">
            <span
              className="inline-flex align-items-center border-round-xl px-3 py-1 font-semibold"
              style={{
                background: '#fff3cd',
                color: '#856404'
              }}
            >
              <i className="pi pi-exclamation-triangle mr-2" style={{ color: '#ffc107' }} />
              <FormattedMessage
                id="exercise.properties.completedNotAsPlanned"
                defaultMessage="Completado (no como planeado)"
              />
            </span>
          </div>
        ) : (
          <div className="col-12 md:col-6">
            <span
              className="inline-flex align-items-center border-round-xl px-3 py-1 font-semibold"
              style={{
                background: '#f8d7da',
                color: '#721c24'
              }}
            >
              <i className="pi pi-times-circle mr-2" style={{ color: '#dc3545' }} />
              <FormattedMessage id="exercise.properties.notCompleted" defaultMessage="No completado" />
            </span>
          </div>
        )}
        {exercise.rpe && rpeMethod && (
          <div className="col-12 md:col-6">
            <strong>{rpeMethod.name}:</strong> {exercise.rpe}
          </div>
        )}
        {exercise.comments && (
          <div className="col-12">
            <strong>Comments:</strong> {exercise.comments}
          </div>
        )}
      </div>

      {/* Renderizar set logs (feedback) */}
      {exercise.completed && renderSetLogs(exercise.setLogs || [])}
    </div>
  );

  return (
    <Dialog
      header={<FormattedMessage id="dashboard.dialog.planDetails" defaultMessage="Detalles del Plan" />}
      visible={visible}
      onHide={() => setPlanDetailsVisible(false)}
    >
      {/* Card for Plan Title */}
      <Card className="mb-4">
        <div className="flex justify-content-between align-items-center mb-2">
          <h2 className="text-2xl font-bold m-0">{workoutPlan.workoutTemplate?.planName}</h2>

          {/* Botones de edición y guardado */}
          {!isTemplate && user && user.userType === 'coach' && (
            <div className="flex gap-2">
              {!isEditing ? (
                <Button
                  label="Edit"
                  icon="pi pi-pencil"
                  className="p-button-primary"
                  onClick={() => setIsEditing(true)}
                />
              ) : (
                <>
                  <Button label="Save" icon="pi pi-check" className="p-button-success" onClick={handleSaveChanges} />
                  <Button label="Cancel" icon="pi pi-times" className="p-button-secondary" onClick={handleCancelEdit} />
                </>
              )}
            </div>
          )}
        </div>

        {/* Información de la sesión */}
        <div className="mt-3">
          {isEditing ? (
            <div className="grid">
              <div className="col-12 mb-3">
                <label htmlFor="sessionMode" className="block mb-2 font-semibold">
                  Tipo de Sesión
                </label>
                <Dropdown
                  id="sessionMode"
                  value={editedSessionMode}
                  options={sessionModeOptions}
                  onChange={(e) => setEditedSessionMode(e.value)}
                  placeholder="Seleccionar Tipo de Sesión"
                  className="w-full"
                />
              </div>

              {(editedSessionMode === 'presencial' || editedSessionMode === 'hibrido') && (
                <div className="col-12 md:col-6 mb-3">
                  <label htmlFor="location" className="block mb-2 font-semibold">
                    Ubicación
                  </label>
                  <InputText
                    id="location"
                    value={editedLocation}
                    onChange={(e) => setEditedLocation(e.target.value)}
                    className="w-full"
                  />
                </div>
              )}

              {(editedSessionMode === 'virtual_sincronico' || editedSessionMode === 'hibrido') && (
                <div className="col-12 md:col-6 mb-3">
                  <label htmlFor="contactMethod" className="block mb-2 font-semibold">
                    Método de Contacto
                  </label>
                  <Dropdown
                    id="contactMethod"
                    value={editedContactMethod}
                    options={contactMethodOptions}
                    onChange={(e) => setEditedContactMethod(e.value)}
                    placeholder="Seleccionar Método de Contacto"
                    className="w-full"
                  />
                </div>
              )}

              {(editedSessionMode === 'presencial' ||
                editedSessionMode === 'virtual_sincronico' ||
                editedSessionMode === 'hibrido') && (
                <div className="col-12 md:col-6 mb-3">
                  <label htmlFor="sessionTime" className="block mb-2 font-semibold">
                    Hora de la Sesión
                  </label>
                  <Calendar
                    id="sessionTime"
                    value={editedSessionTime}
                    onChange={(e) => setEditedSessionTime(e.value as Date)}
                    timeOnly
                    hourFormat="24"
                    className="w-full"
                  />
                </div>
              )}

              <div className="col-12 mb-3">
                <label htmlFor="notes" className="block mb-2 font-semibold">
                  Notas
                </label>
                <InputText
                  id="notes"
                  value={editedNotes}
                  onChange={(e) => setEditedNotes(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-column gap-2">
              {workoutPlan.trainingSession?.sessionMode && (
                <div className="flex align-items-center">
                  <i className="pi pi-calendar mr-2" />
                  <span>
                    {sessionModeOptions.find((option) => option.value === workoutPlan.trainingSession?.sessionMode)
                      ?.label || workoutPlan.trainingSession.sessionMode}
                  </span>
                </div>
              )}

              {workoutPlan.trainingSession?.location && (
                <div className="flex align-items-center">
                  <i className="pi pi-map-marker mr-2" />
                  <span>{workoutPlan.trainingSession.location}</span>
                </div>
              )}

              {workoutPlan.trainingSession?.notes && (
                <div className="flex align-items-center">
                  <i className="pi pi-comment mr-2" />
                  <span>{workoutPlan.trainingSession.notes}</span>
                </div>
              )}

              {workoutPlan.trainingSession?.contactMethod && (
                <div className="flex align-items-center">
                  <i className="pi pi-phone mr-2" />
                  <span>
                    {contactMethodOptions.find((option) => option.value === workoutPlan.trainingSession?.contactMethod)
                      ?.label || workoutPlan.trainingSession.contactMethod}
                  </span>
                </div>
              )}

              {workoutPlan.trainingSession?.sessionTime && (
                <div className="flex align-items-center">
                  <i className="pi pi-clock mr-2" />
                  <span>
                    {(() => {
                      try {
                        const date = new Date(workoutPlan.trainingSession.sessionTime);
                        return isNaN(date.getTime())
                          ? workoutPlan.trainingSession.sessionTime
                          : date.toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            });
                      } catch (error) {
                        return workoutPlan.trainingSession.sessionTime;
                      }
                    })()}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex gap-2 mt-3">
          {user && user.userType === 'coach' && (
            <>
              {(isTemplate || workoutPlan.status === 'pending') && !isEditing && (
                <Button label="Editar" icon="pi pi-pencil" className="p-button-primary" onClick={handleEdit} />
              )}
              {(isTemplate || workoutPlan.status === 'pending') && !isEditing && (
                <Button label="Eliminar" icon="pi pi-trash" className="p-button-danger" onClick={handleDelete} />
              )}
            </>
          )}
          {canStartWorkout() && !isEditing && (
            <Button
              label="Iniciar Sesión"
              icon="pi pi-play"
              className="p-button-success"
              onClick={handleStartWorkout}
            />
          )}
        </div>

        {/* Feedback del plan completado */}
        {!isTemplate && workoutPlan.status === 'completed' && workoutPlan.feedback && (
          <div className="mt-3 surface-100 border-round p-3">
            <h3 className="text-lg font-semibold mb-2">
              <FormattedMessage id="common.feedback" defaultMessage="Feedback" />
            </h3>
            <div className="grid">
              <div className="col-12 md:col-6">
                <strong>Status:</strong> {workoutPlan.status}
              </div>
              <div className="col-12 md:col-6">
                <strong>Completed On:</strong> {formatDate(workoutPlan.feedback.realEndDate)}
              </div>
              <div className="col-12 md:col-6">
                <strong>Session Time:</strong> {workoutPlan.feedback.sessionTime}
              </div>
              <div className="col-12 md:col-6">
                <strong>Mood:</strong> {workoutPlan.feedback.mood ? `${workoutPlan.feedback.mood}/10` : '-'}
              </div>
              <div className="col-12 md:col-6">
                <strong>Energy Level:</strong>{' '}
                {workoutPlan.feedback.energyLevel ? `${workoutPlan.feedback.energyLevel}/10` : '-'}
              </div>
              <div className="col-12 md:col-6">
                <strong>Perceived Difficulty:</strong>{' '}
                {workoutPlan.feedback.perceivedDifficulty ? `${workoutPlan.feedback.perceivedDifficulty}/10` : '-'}
              </div>
              <div className="col-12">
                <strong>General Feedback:</strong> {workoutPlan.feedback.generalFeedback}
              </div>
              <div className="col-12">
                <strong>Extra Notes:</strong> {workoutPlan.feedback.additionalNotes}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Groups */}
      <div className="flex flex-row overflow-x-auto gap-3">
        {workoutPlan.groups?.map((group) => {
          const allExercisesCompleted = group.exercises.every((ex) => ex.completed || ex.completedNotAsPlanned);
          return (
            <div key={group.id || group.groupNumber} style={{ flex: '0 0 320px', minWidth: '320px' }}>
              <Card className="h-full">
                <div className="flex justify-content-between align-items-center mb-3">
                  {group.isRestPeriod ? (
                    <h3 className="text-xl m-0">
                      <FormattedMessage id="plan.group.restPeriod" defaultMessage="Rest Period" />
                    </h3>
                  ) : (
                    <h3 className="text-xl m-0">{group.name || `Group ${group.groupNumber}`}</h3>
                  )}
                  {!workoutPlan.isTemplate && workoutPlan.status === 'completed' && (
                    <span className="ml-2">
                      {allExercisesCompleted ? (
                        <i className="pi pi-check-circle" style={{ color: 'green', fontSize: '1.2rem' }} />
                      ) : (
                        <i className="pi pi-times-circle" style={{ color: 'red', fontSize: '1.2rem' }} />
                      )}
                    </span>
                  )}
                </div>

                {group.isRestPeriod && (
                  <p>
                    <strong>Rest Duration:</strong> {group.restDuration} {propertyUnits?.restInterval || ''}
                  </p>
                )}

                {group.exercises.length === 0 && !group.isRestPeriod && (
                  <p className="text-500">
                    <FormattedMessage id="plan.group.empty" defaultMessage="No exercises in this group" />
                  </p>
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

      <VideoDialog visible={videoDialogVisible} onHide={() => setVideoDialogVisible(false)} videoUrl={selectedVideo} />
    </Dialog>
  );
};

export default PlanDetails;

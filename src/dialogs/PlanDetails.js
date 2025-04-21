import React, { useState, useEffect, useRef, useContext } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import {
  fetchWorkoutInstance,
  fetchWorkoutInstanceTemplate,
  deleteWorkoutPlan,
  getRpeMethods,
  getRpeAssignments,
  getRpeMethodAssigned,
  updateWorkoutInstance
} from '../services/workoutService';
import { useNavigate } from 'react-router-dom';
import { getYouTubeThumbnail, extractYouTubeVideoId, formatDate } from '../utils/UtilFunctions';
import { useToast } from '../utils/ToastContext';
import { UserContext } from '../utils/UserContext';
import { useConfirmationDialog } from '../utils/ConfirmationDialogContext';
import { useIntl, FormattedMessage } from 'react-intl';
import VideoDialog from './VideoDialog';
import { fetchClientByClientId } from '../services/usersService';
import { contactMethodOptions } from '../utils/Options';
export default function NewPlanDetailHorizontal({
  planId,
  setPlanDetailsVisible,
  setRefreshKey,
  setLoading,
  isTemplate,
  clientId
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
  const [currentCycle, setCurrentCycle] = useState(null);
  const [clientData, setClientData] = useState(null);
  const [workoutPlan, setWorkoutPlan] = useState({
    groups: [],
    workout: {
      id: '',
      planName: ''
    },
    workoutTemplate: {
      id: '',
      planName: ''
    },
    status: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editedLocation, setEditedLocation] = useState('');
  const [editedContactMethod, setEditedContactMethod] = useState('');
  const [editedNotes, setEditedNotes] = useState('');
  const [editedSessionTime, setEditedSessionTime] = useState(null);
  const [editedTrainingType, setEditedTrainingType] = useState('');
  const [contactMethodOptions] = useState([
    { label: 'Zoom', value: 'zoom' },
    { label: 'WhatsApp', value: 'whatsapp' },
    { label: 'Google Meet', value: 'google_meet' },
    { label: 'Skype', value: 'skype' }
  ]);
  const [trainingTypeOptions] = useState([
    { label: 'Presencial', value: 'presencial' },
    { label: 'Virtual Sincrónico', value: 'virtual_sincronico' },
    { label: 'Virtual Asincrónico', value: 'virtual_asincronico' },
    { label: 'Híbrido', value: 'hibrido' }
  ]);

  useEffect(() => {
    const fetchClientData = async () => {
      const { data } = await fetchClientByClientId(clientId);
      console.log('data', data);
      setClientData(data);
    };
    fetchClientData();
  }, [clientId]);

  useEffect(() => {
    const fetchPlanDetails = async () => {
      try {
        setLoading(true);
        const { data } = isTemplate ? await fetchWorkoutInstanceTemplate(planId) : await fetchWorkoutInstance(planId);
        const trainingCycle = data.trainingSession?.trainingWeek?.trainingCycle || -1;
        console.log(trainingCycle);
        setCurrentCycle(trainingCycle);
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
              'distance'
            ];
            props.forEach((prop) => {
              if (exercise[prop] === '') {
                exercise[prop] = null;
              }
            });
          });
        });
        setWorkoutPlan(data);

        // Inicializar los campos editables con los valores actuales
        setEditedLocation(data.trainingSession?.location || '');
        setEditedContactMethod(data.trainingSession?.contactMethod || '');
        setEditedNotes(data.trainingSession?.notes || '');
        setEditedSessionTime(data.trainingSession?.sessionTime ? new Date(data.trainingSession.sessionTime) : null);
        setEditedTrainingType(data.trainingSession?.trainingType || '');
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
        const { data } = await getRpeMethodAssigned(clientId, planId, currentCycle.id || -1);
        console.log('data', data);
        setRpeMethods(data.rpeMethod);
      } catch (error) {
        console.log('error', error);
        showToast('error', 'Error', 'No se pudieron cargar los métodos RPE');
      } finally {
        setLoading(false);
      }
    };
    if (!isTemplate && currentCycle) {
      fetchRpeMethods();
    }
  }, [isTemplate, client?.coach?.user?.id, user.userId, showToast, setLoading, currentCycle]);

  const handleEdit = () => {
    navigate(`/plans/edit/${planId}`, { state: { changeToTemplate: false } });
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
              intl.formatMessage({ id: 'coach.plan.success.deleted.message' }, { name: workoutPlan.workout.planName })
            );
            setPlanDetailsVisible(false);
            setRefreshKey((old) => old + 1);
          } else {
            showToast('error', 'Error', response.error);
          }
        } catch (error) {
          showToast('error', 'Error', error.message);
        }
      }
    });
  };

  const handleStartWorkout = () => {
    navigate(`/plans/start-session/${planId}`, {
      state: {
        isTraining: true,
        planId: workoutPlan.id,
        trainingType: workoutPlan.trainingSession?.trainingType,
        location: workoutPlan.trainingSession?.location,
        contactMethod: workoutPlan.trainingSession?.contactMethod,
        isCoach: user.userType === 'coach',
        clientId: clientId
      }
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

  const handleSaveChanges = async () => {
    try {
      setLoading(true);

      // Preparar los datos actualizados
      const updatedData = {
        location: editedLocation,
        contactMethod: editedContactMethod,
        notes: editedNotes,
        sessionTime: editedSessionTime
          ? `${editedSessionTime.getHours().toString().padStart(2, '0')}:${editedSessionTime.getMinutes().toString().padStart(2, '0')}`
          : null,
        trainingType: editedTrainingType
      };

      console.log('updatedData', planId, updatedData);
      // Llamar al servicio para actualizar el workoutInstance
      await updateWorkoutInstance(planId, updatedData);

      // Actualizar el estado local
      setWorkoutPlan((prev) => ({
        ...prev,
        trainingSession: {
          ...prev.trainingSession,
          location: editedLocation,
          contactMethod: editedContactMethod,
          notes: editedNotes,
          sessionTime: editedSessionTime ? editedSessionTime.toISOString() : null,
          trainingType: editedTrainingType
        }
      }));

      setIsEditing(false);
      showToast('success', 'Cambios guardados', 'Los cambios se han guardado correctamente');
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      showToast('error', 'Error al guardar los cambios', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    // Restaurar los valores originales
    setEditedLocation(workoutPlan.trainingSession?.location || '');
    setEditedContactMethod(workoutPlan.trainingSession?.contactMethod || '');
    setEditedNotes(workoutPlan.trainingSession?.notes || '');
    setEditedSessionTime(
      workoutPlan.trainingSession?.sessionTime ? new Date(workoutPlan.trainingSession.sessionTime) : null
    );
    setEditedTrainingType(workoutPlan.trainingSession?.trainingType || '');
    setIsEditing(false);
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
      'restInterval'
    ];

    // Determine which columns have at least one non-empty value
    const columns = possibleKeys.filter((key) => setLogs.some((log) => log[key] !== null && log[key] !== ''));

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
                    borderBottom: '1px solid var(--surface-border)'
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
              style={{
                width: '120px',
                height: '68px',
                objectFit: 'cover',
                cursor: 'pointer'
              }}
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
              style={{
                width: '120px',
                height: '68px',
                objectFit: 'cover',
                cursor: 'pointer'
              }}
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
              {intl.formatMessage({
                id: 'exercise.properties.completedNotAsPlanned'
              })}
            </div>
          ) : (
            <div className="p-col-3">{intl.formatMessage({ id: 'exercise.properties.notCompleted' })}</div>
          )}
          {exercise.rpe && rpeMethods && (
            <div className="p-col-3">
              {rpeMethods.name}: {exercise.rpe}
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

          {/* Botones de edición y guardado */}
          {!isTemplate && user.userType === 'coach' && (
            <div className="flex gap-2">
              {!isEditing ? (
                <Button
                  label={intl.formatMessage({ id: 'common.edit' })}
                  icon="pi pi-pencil"
                  className="p-button-primary"
                  onClick={() => setIsEditing(true)}
                />
              ) : (
                <>
                  <Button
                    label={intl.formatMessage({ id: 'common.save' })}
                    icon="pi pi-check"
                    className="p-button-success"
                    onClick={handleSaveChanges}
                  />
                  <Button
                    label={intl.formatMessage({ id: 'common.cancel' })}
                    icon="pi pi-times"
                    className="p-button-secondary"
                    onClick={handleCancelEdit}
                  />
                </>
              )}
            </div>
          )}
        </div>

        {/* Información de ubicación, método de contacto, notas y tiempo de sesión */}
        <div className="mt-3">
          {isEditing ? (
            <div className="grid">
              <div className="col-12 mb-3">
                <label htmlFor="trainingType" className="block mb-2">
                  {intl.formatMessage({ id: 'common.trainingType' })}
                </label>
                <Dropdown
                  id="trainingType"
                  value={editedTrainingType}
                  options={trainingTypeOptions}
                  onChange={(e) => setEditedTrainingType(e.value)}
                  placeholder={intl.formatMessage({ id: 'common.selectTrainingType' })}
                  className="w-full"
                />
              </div>

              {/* Mostrar campos según el tipo de entrenamiento seleccionado */}
              {(editedTrainingType === 'presencial' || editedTrainingType === 'hibrido') && (
                <div className="col-12 md:col-6 mb-3">
                  <label htmlFor="location" className="block mb-2">
                    {intl.formatMessage({ id: 'common.location' })}
                  </label>
                  <InputText
                    id="location"
                    value={editedLocation}
                    onChange={(e) => setEditedLocation(e.target.value)}
                    className="w-full"
                  />
                </div>
              )}

              {(editedTrainingType === 'virtual_sincronico' || editedTrainingType === 'hibrido') && (
                <div className="col-12 md:col-6 mb-3">
                  <label htmlFor="contactMethod" className="block mb-2">
                    {intl.formatMessage({ id: 'common.contactMethod' })}
                  </label>
                  <Dropdown
                    id="contactMethod"
                    value={editedContactMethod}
                    options={contactMethodOptions}
                    onChange={(e) => setEditedContactMethod(e.value)}
                    placeholder={intl.formatMessage({ id: 'common.selectContactMethod' })}
                    className="w-full"
                  />
                </div>
              )}

              {(editedTrainingType === 'presencial' ||
                editedTrainingType === 'virtual_sincronico' ||
                editedTrainingType === 'hibrido') && (
                <div className="col-12 md:col-6 mb-3">
                  <label htmlFor="sessionTime" className="block mb-2">
                    {intl.formatMessage({ id: 'common.sessionTime' })}
                  </label>
                  <Calendar
                    id="sessionTime"
                    value={editedSessionTime}
                    onChange={(e) => setEditedSessionTime(e.value)}
                    timeOnly
                    hourFormat="24"
                    className="w-full"
                  />
                </div>
              )}

              <div className="col-12 mb-3">
                <label htmlFor="notes" className="block mb-2">
                  {intl.formatMessage({ id: 'common.notes' })}
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
              {/* Mostrar tipo de entrenamiento */}
              {workoutPlan.trainingSession?.trainingType && (
                <div className="flex align-items-center">
                  <i className="pi pi-calendar mr-2" />
                  <span>
                    {trainingTypeOptions.find((option) => option.value === workoutPlan.trainingSession.trainingType)
                      ?.label || workoutPlan.trainingSession.trainingType}
                  </span>
                </div>
              )}

              {/* Mostrar ubicación según prioridad: primero session, luego cliente */}
              {(workoutPlan.trainingSession?.trainingType === 'hibrido' ||
                workoutPlan.trainingSession?.trainingType === 'presencial' ||
                workoutPlan.trainingSession?.trainingType === 'virtual_sincronico') &&
              workoutPlan.trainingSession?.location ? (
                <div className="flex align-items-center">
                  <i className="pi pi-map-marker mr-2" />
                  <span>{workoutPlan.trainingSession.location}</span>
                </div>
              ) : (
                (clientData?.trainingType === 'hibrido' ||
                  clientData?.trainingType === 'presencial' ||
                  clientData?.trainingType === 'virtual_sincronico') &&
                clientData?.location && (
                  <div className="flex align-items-center">
                    <i className="pi pi-map-marker mr-2" />
                    <span>{clientData.location}</span>
                  </div>
                )
              )}

              {/* Mostrar notas según prioridad: primero session, luego cliente */}
              {workoutPlan.trainingSession?.notes ? (
                <div className="flex align-items-center">
                  <i className="pi pi-comment mr-2" />
                  <span>{workoutPlan.trainingSession.notes}</span>
                </div>
              ) : (
                clientData?.notes && (
                  <div className="flex align-items-center">
                    <i className="pi pi-comment mr-2" />
                    <span>{clientData.notes}</span>
                  </div>
                )
              )}

              {/* Mostrar método de contacto según prioridad: primero session, luego cliente */}
              {workoutPlan.trainingSession?.contactMethod ? (
                <div className="flex align-items-center">
                  <i className="pi pi-phone mr-2" />
                  <span>
                    {contactMethodOptions.find((option) => option.value === workoutPlan.trainingSession.contactMethod)
                      ?.label || workoutPlan.trainingSession.contactMethod}
                  </span>
                </div>
              ) : (
                clientData?.contactMethod && (
                  <div className="flex align-items-center">
                    <i className="pi pi-phone mr-2" />
                    <span>
                      {contactMethodOptions.find((option) => option.value === clientData.contactMethod)?.label ||
                        clientData.contactMethod}
                    </span>
                  </div>
                )
              )}

              {/* Mostrar tiempo de sesión */}
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

        {/* If user is coach => show Edit/Delete. If user is client => maybe show Start Workout if pending */}
        <div className="flex gap-2 mt-3">
          {user.userType === 'coach' && (
            <>
              {(isTemplate || workoutPlan.status === 'pending') && !isEditing && (
                <Button
                  label={intl.formatMessage({ id: 'common.edit' })}
                  icon="pi pi-pencil"
                  className="p-button-primary"
                  onClick={handleEdit}
                />
              )}
              {(isTemplate || workoutPlan.status === 'pending') && !isEditing && (
                <Button
                  label={intl.formatMessage({ id: 'common.delete' })}
                  icon="pi pi-trash"
                  className="p-button-danger"
                  onClick={handleDelete}
                />
              )}
              {!isTemplate && !isEditing && (
                <Button
                  label={intl.formatMessage({ id: 'common.template' })}
                  tooltip={intl.formatMessage({ id: 'common.useAsTemplate' })}
                  icon="pi pi-copy"
                  className="p-button-secondary"
                  onClick={() =>
                    navigate(`/plans/edit/${workoutPlan.id}`, {
                      state: { isEdit: true, changeToTemplate: true }
                    })
                  }
                />
              )}
            </>
          )}
          {user.userType === 'client' && workoutPlan.status === 'pending' && !isEditing && (
            <Button label="Start Workout" icon="pi pi-play" className="p-button-success" onClick={handleStartWorkout} />
          )}
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
              {intl.formatMessage({ id: 'exercise.properties.sessionTime' })}: {workoutPlan.feedback?.sessionTime}
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
              {workoutPlan.feedback?.perceivedDifficulty ? `${workoutPlan.feedback.perceivedDifficulty}/10` : '-'}
            </p>
            <p className="">
              {intl.formatMessage({ id: 'common.extraNotes' })}: {workoutPlan.feedback?.additionalNotes}
            </p>
          </div>
        )}
      </Card>

      {/* Groups horizontally */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          overflowX: 'auto',
          gap: '1rem'
        }}
      >
        {workoutPlan.groups.map((group) => {
          // Check if all exercises are completed
          const allExercisesCompleted = group.exercises.every((ex) => ex.completed || ex.completedNotAsPlanned);
          return (
            <div key={group.id || group.groupNumber} style={{ flex: '0 0 320px', minWidth: '320px' }}>
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
                          : intl.formatMessage({ id: 'common.group' }, { number: group.groupNumber })}{' '}
                        {group.groupNumber}
                      </h3>
                    )}
                  </div>
                  {/* If plan is completed, show a check or X for the group */}
                  {!workoutPlan.isTemplate && workoutPlan.status === 'completed' && (
                    <span
                      className="ml-2"
                      style={{
                        color: allExercisesCompleted ? 'green' : 'red',
                        fontSize: '1.2rem'
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
                    {intl.formatMessage({ id: 'plan.group.restPeriod' })}: {group.restDuration}{' '}
                    {propertyUnits?.restInterval || ''}
                  </p>
                )}

                {/* Render exercises */}
                {group.exercises.length === 0 && !group.isRestPeriod && (
                  <p style={{ color: '#999' }}>{intl.formatMessage({ id: 'plan.group.empty.notDraggable' })}</p>
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
    </div>
  );
}

import React, { useState, useEffect, useContext } from 'react';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { useToast } from '../utils/ToastContext';
import { UserContext } from '../utils/UserContext';
import {
  assignSession,
  assignTrainingSessionToClient,
  findAllWorkoutTemplatesByCoachId
} from '../services/workoutService';
import { formatDateToApi } from '../utils/UtilFunctions';
import { useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { InputTextarea } from 'primereact/inputtextarea';
import { contactMethodOptions, trainingTypeOptions } from '../utils/Options';
const AssignWorkoutToSessionDialog = ({ visible, onHide, sessionId, clientId, setRefreshKey, selectedDate }) => {
  const showToast = useToast();
  const [workouts, setWorkouts] = useState([]);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [loading, setLoading] = useState(false);
  const { coach } = useContext(UserContext);
  const intl = useIntl();
  const navigate = useNavigate();

  const [trainingType, setTrainingType] = useState(null);
  const [location, setLocation] = useState('');
  const [contactMethod, setContactMethod] = useState('');
  const [sessionTime, setSessionTime] = useState(null);
  const [meetingLink, setMeetingLink] = useState('');

  useEffect(() => {
    setSelectedWorkout(null);
    setTrainingType(null);
    setLocation('');
    setContactMethod('');
    setSessionTime(null);
    setMeetingLink('');
  }, []);

  useEffect(() => {
    const loadWorkouts = async () => {
      try {
        const { data } = await findAllWorkoutTemplatesByCoachId(coach.id);
        setWorkouts(data);
      } catch (error) {
        showToast('error', 'Error', error.message);
      }
    };

    if (visible) loadWorkouts();
  }, [showToast, coach.id, visible]);

  const handleAssign = async () => {
    if (!selectedWorkout) {
      showToast('error', 'Error', 'Por favor selecciona un entrenamiento');
      return;
    }

    if (!trainingType) {
      showToast('error', 'Error', 'Por favor selecciona un tipo de entrenamiento');
      return;
    }

    if ((trainingType === 'presencial' || trainingType === 'hibrido') && !location) {
      showToast(
        'error',
        intl.formatMessage({ id: 'error' }),
        intl.formatMessage({ id: 'student.error.locationRequired' })
      );
      return;
    }

    if ((trainingType === 'virtual_sincronico' || trainingType === 'hibrido') && !contactMethod) {
      showToast(
        'error',
        intl.formatMessage({ id: 'error' }),
        intl.formatMessage({ id: 'student.error.contactMethodRequired' })
      );
      return;
    }

    if ((trainingType === 'presencial' || trainingType === 'virtual_sincronico') && !sessionTime) {
      showToast('error', 'Error', 'Por favor selecciona una hora para el entrenamiento');
      return;
    }

    const sessionDate = formatDateToApi(selectedDate ? selectedDate : new Date());
    const body = {
      clientId,
      workoutId: selectedWorkout,
      sessionId,
      trainingType,
      location: trainingType === 'presencial' || trainingType === 'hibrido' ? location : undefined,
      contactMethod: trainingType === 'virtual_sincronico' || trainingType === 'hibrido' ? contactMethod : undefined,
      //sessionTime: sessionTime ? formatTime(sessionTime) : undefined,
      sessionTime: sessionTime
        ? `${sessionTime.getHours().toString().padStart(2, '0')}:${sessionTime.getMinutes().toString().padStart(2, '0')}`
        : null,
      sessionDate,
      notes: trainingType === 'virtual_sincronico' || trainingType === 'hibrido' ? meetingLink : undefined
    };

    try {
      setLoading(true);
      if (sessionId) {
        await assignSession(sessionId, body);
      } else {
        await assignTrainingSessionToClient(body);
      }
      showToast('success', 'Sesión asignada exitosamente');
      onHide();
      setRefreshKey((old) => old + 1);
    } catch (error) {
      showToast('error', 'Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    navigate(`/plans/create-and-assign`, { state: { clientId, sessionDate: selectedDate, changeToTemplate: false } });
  };

  return (
    <Dialog
      draggable={false}
      dismissableMask
      resizable={false}
      header={intl.formatMessage({ id: 'assignWorkout.title' })}
      visible={visible}
      onHide={onHide}
      style={{ width: '50vw' }}
      className="p-fluid responsive-dialog"
    >
      <div className="field">
        <label htmlFor="workout">{intl.formatMessage({ id: 'assignWorkout.selectWorkout' })}</label>
        <Dropdown
          id="workout"
          value={selectedWorkout}
          options={workouts}
          onChange={(e) => setSelectedWorkout(e.value)}
          optionLabel="planName"
          optionValue="id"
          placeholder={intl.formatMessage({ id: 'assignWorkout.selectWorkoutPlaceholder' })}
        />
      </div>

      <div className="field">
        <label htmlFor="trainingType">{intl.formatMessage({ id: 'assignWorkout.trainingType' })}</label>
        <Dropdown
          id="trainingType"
          value={trainingType}
          options={trainingTypeOptions}
          onChange={(e) => setTrainingType(e.value)}
          placeholder={intl.formatMessage({ id: 'assignWorkout.selectTrainingType' })}
        />
      </div>

      {trainingType === 'presencial' && (
        <div className="p-field">
          <label htmlFor="location">
            <FormattedMessage id="student.location" />
          </label>
          <InputText
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder={intl.formatMessage({ id: 'student.locationPlaceholder' })}
          />
        </div>
      )}

      {trainingType === 'virtual_sincronico' && (
        <div className="p-field">
          <label htmlFor="contactMethod">
            <FormattedMessage id="student.contactMethod" />
          </label>
          <Dropdown
            id="contactMethod"
            value={contactMethod}
            options={contactMethodOptions}
            onChange={(e) => setContactMethod(e.value)}
            placeholder={intl.formatMessage({ id: 'student.selectContactMethod' })}
          />
        </div>
      )}

      {trainingType === 'hibrido' && (
        <>
          <div className="p-field">
            <label htmlFor="location">
              <FormattedMessage id="student.location" />
            </label>
            <InputText
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={intl.formatMessage({ id: 'student.locationPlaceholder' })}
            />
          </div>
          <div className="p-field">
            <label htmlFor="contactMethod">
              <FormattedMessage id="student.contactMethod" />
            </label>
            <Dropdown
              id="contactMethod"
              value={contactMethod}
              options={contactMethodOptions}
              onChange={(e) => setContactMethod(e.value)}
              placeholder={intl.formatMessage({ id: 'student.selectContactMethod' })}
            />
          </div>
        </>
      )}

      {(trainingType === 'presencial' || trainingType === 'virtual_sincronico') && (
        <div className="field">
          <label htmlFor="sessionTime">{intl.formatMessage({ id: 'common.sessionTime' })}</label>
          <Calendar
            id="sessionTime"
            value={sessionTime}
            onChange={(e) => setSessionTime(e.value)}
            timeOnly
            hourFormat="24"
            showIcon
            placeholder={intl.formatMessage({ id: 'assignWorkout.selectTime' })}
          />
        </div>
      )}

      {(trainingType === 'virtual_sincronico' || trainingType === 'hibrido') && (
        <div className="p-field">
          <label htmlFor="meetingLink">
            <FormattedMessage id="assignWorkout.meetingLink" />
          </label>
          <InputTextarea
            id="meetingLink"
            value={meetingLink}
            onChange={(e) => setMeetingLink(e.target.value)}
            placeholder={intl.formatMessage({ id: 'assignWorkout.meetingLinkPlaceholder' })}
            rows={3}
            autoResize
          />
        </div>
      )}

      <div className="flex justify-content-end gap-2 mt-4">
        <Button
          label={intl.formatMessage({ id: 'assignWorkout.createNewSession' })}
          icon="pi pi-plus"
          className="p-button-secondary"
          onClick={handleCreateNew}
        />
        <Button
          label={intl.formatMessage({ id: 'assignWorkout.assign' })}
          icon="pi pi-check"
          className="p-button-success"
          onClick={handleAssign}
          loading={loading}
        />
      </div>
    </Dialog>
  );
};

export default AssignWorkoutToSessionDialog;

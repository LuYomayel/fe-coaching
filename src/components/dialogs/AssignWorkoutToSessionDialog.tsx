import { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { InputTextarea } from 'primereact/inputtextarea';
import { useIntl, FormattedMessage } from 'react-intl';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { useUser } from '../../contexts/UserContext';
import { useRpeMethods } from '../../hooks/coach/useRpeMethods';
import { contactMethodOptions, sessionModeOptions } from '../../types/coach/dropdown-options';
import { api } from '../../services/api-client';

interface IRpeMethod {
  id: number;
  name: string;
}

interface IWorkoutOption {
  id: number;
  planName: string;
}

interface IAssignWorkoutToSessionDialogProps {
  visible: boolean;
  onHide: () => void;
  sessionId: number | null;
  clientId: number | string;
  setRefreshKey: (fn: (old: number) => number) => void;
  selectedDate: Date | string | null;
}

const AssignWorkoutToSessionDialog = ({
  visible,
  onHide,
  sessionId,
  clientId,
  setRefreshKey,
  selectedDate
}: IAssignWorkoutToSessionDialogProps) => {
  const { showToast } = useToast();
  const { coach } = useUser();
  const intl = useIntl();
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const { rpeMethods, defaultRpeMethod } = useRpeMethods();

  const [workouts, setWorkouts] = useState<IWorkoutOption[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<number | null>(null);
  const [selectedRpeMethod, setSelectedRpeMethod] = useState<IRpeMethod | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionMode, setSessionMode] = useState<string | null>(null);
  const [location, setLocation] = useState('');
  const [contactMethod, setContactMethod] = useState('');
  const [sessionTime, setSessionTime] = useState<Date | null>(null);
  const [meetingLink, setMeetingLink] = useState('');

  useEffect(() => {
    if (defaultRpeMethod) {
      setSelectedRpeMethod(defaultRpeMethod);
    }
  }, [defaultRpeMethod]);

  useEffect(() => {
    setSelectedWorkout(null);
    setSessionMode(null);
    setLocation('');
    setContactMethod('');
    setSessionTime(null);
    setMeetingLink('');
    setSelectedRpeMethod(defaultRpeMethod);
  }, [visible, defaultRpeMethod]);

  useEffect(() => {
    const loadWorkouts = async () => {
      try {
        const { data } = await api.workout.findAllWorkoutTemplatesByCoachId();
        setWorkouts(data ?? []);
      } catch (error) {
        showToast('error', 'Error', (error as Error).message);
      }
    };

    if (visible) loadWorkouts();
  }, [showToast, coach?.id, visible]); // eslint-disable-line

  const handleAssign = async () => {
    if (!selectedWorkout) {
      showToast('error', 'Error', 'Por favor selecciona un entrenamiento');
      return;
    }
    if (!sessionMode) {
      showToast('error', 'Error', 'Por favor selecciona un tipo de entrenamiento');
      return;
    }
    if ((sessionMode === 'presencial' || sessionMode === 'hibrido') && !location) {
      showToast(
        'error',
        intl.formatMessage({ id: 'error' }),
        intl.formatMessage({ id: 'student.error.locationRequired' })
      );
      return;
    }
    if ((sessionMode === 'virtual_sincronico' || sessionMode === 'hibrido') && !contactMethod) {
      showToast(
        'error',
        intl.formatMessage({ id: 'error' }),
        intl.formatMessage({ id: 'student.error.contactMethodRequired' })
      );
      return;
    }
    if ((sessionMode === 'presencial' || sessionMode === 'virtual_sincronico') && !sessionTime) {
      showToast('error', 'Error', 'Por favor selecciona una hora para el entrenamiento');
      return;
    }
    if (!selectedRpeMethod) {
      showToast(
        'error',
        intl.formatMessage({ id: 'error' }),
        intl.formatMessage({
          id: 'assignWorkout.error.rpeRequired',
          defaultMessage: 'Por favor selecciona un metodo RPE'
        })
      );
      return;
    }

    const sessionTimeStr = sessionTime
      ? `${sessionTime.getHours().toString().padStart(2, '0')}:${sessionTime.getMinutes().toString().padStart(2, '0')}`
      : null;

    try {
      setLoading(true);
      if (sessionId) {
        const bodyAssignSession = {
          clientId,
          workoutId: selectedWorkout,
          sessionMode,
          location: sessionMode === 'presencial' || sessionMode === 'hibrido' ? location : undefined,
          contactMethod: sessionMode === 'virtual_sincronico' || sessionMode === 'hibrido' ? contactMethod : undefined,
          sessionTime: sessionTimeStr,
          notes: sessionMode === 'virtual_sincronico' || sessionMode === 'hibrido' ? meetingLink : undefined,
          rpeMethodId: selectedRpeMethod.id
        };
        await api.workout.assignSession(sessionId, bodyAssignSession);
      } else {
        const bodyNewSession = {
          clientId,
          workoutId: selectedWorkout,
          sessionDate: selectedDate,
          sessionMode,
          location: sessionMode === 'presencial' || sessionMode === 'hibrido' ? location : undefined,
          contactMethod: sessionMode === 'virtual_sincronico' || sessionMode === 'hibrido' ? contactMethod : undefined,
          sessionTime: sessionTimeStr,
          notes: sessionMode === 'virtual_sincronico' || sessionMode === 'hibrido' ? meetingLink : undefined,
          rpeMethodId: selectedRpeMethod.id
        };
        await api.workout.assignTrainingSessionToClient(bodyNewSession);
      }
      showToast('success', 'Sesion asignada exitosamente');
      onHide();
      setRefreshKey((old) => old + 1);
    } catch (error) {
      showToast('error', 'Error', (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    navigate('/plans/create-and-assign', {
      state: {
        clientId,
        sessionDate: selectedDate,
        changeToTemplate: false,
        returnTo: routerLocation.pathname + routerLocation.search
      }
    });
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
        <label htmlFor="rpeMethod">
          {intl.formatMessage({ id: 'assignWorkout.selectRpeMethod', defaultMessage: 'Metodo de Medicion RPE' })}
        </label>
        <Dropdown
          id="rpeMethod"
          value={selectedRpeMethod}
          options={rpeMethods}
          onChange={(e) => setSelectedRpeMethod(e.value)}
          optionLabel="name"
          placeholder={intl.formatMessage({
            id: 'assignWorkout.selectRpeMethodPlaceholder',
            defaultMessage: 'Seleccionar metodo RPE'
          })}
        />
      </div>

      <div className="field">
        <label htmlFor="trainingType">{intl.formatMessage({ id: 'assignWorkout.trainingType' })}</label>
        <Dropdown
          id="trainingType"
          value={sessionMode}
          options={sessionModeOptions}
          onChange={(e) => setSessionMode(e.value)}
          placeholder={intl.formatMessage({ id: 'assignWorkout.selectTrainingType' })}
        />
      </div>

      {sessionMode === 'presencial' && (
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

      {sessionMode === 'virtual_sincronico' && (
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

      {sessionMode === 'hibrido' && (
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

      {(sessionMode === 'presencial' || sessionMode === 'virtual_sincronico') && (
        <div className="field">
          <label htmlFor="sessionTime">{intl.formatMessage({ id: 'common.sessionTime' })}</label>
          <Calendar
            id="sessionTime"
            value={sessionTime}
            onChange={(e) => setSessionTime(e.value as Date | null)}
            timeOnly
            hourFormat="24"
            showIcon
            placeholder={intl.formatMessage({ id: 'assignWorkout.selectTime' })}
          />
        </div>
      )}

      {(sessionMode === 'virtual_sincronico' || sessionMode === 'hibrido') && (
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

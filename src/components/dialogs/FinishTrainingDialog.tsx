import { useEffect, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
import { Slider } from 'primereact/slider';
import { Calendar } from 'primereact/calendar';
import { Checkbox, CheckboxChangeEvent } from 'primereact/checkbox';
import { useIntl, FormattedMessage } from 'react-intl';

interface IFeedbackData {
  sessionTime: string | null;
  generalFeedback: string;
  energyLevel: number | null;
  mood: number | null;
  perceivedDifficulty: number | null;
  additionalNotes: string;
}

interface IFinishTrainingDialogProps {
  visible: boolean;
  onHide: () => void;
  submitFeedback: (data: IFeedbackData) => void;
  sessionTimer: number | null;
}

const FinishTrainingDialog = ({ visible, onHide, submitFeedback, sessionTimer }: IFinishTrainingDialogProps) => {
  const intl = useIntl();
  const [sessionTime, setSessionTime] = useState<Date>(new Date(0, 0, 0, 0, 0));
  const [generalFeedback, setGeneralFeedback] = useState('');
  const [energyLevel, setEnergyLevel] = useState(5);
  const [mood, setMood] = useState(5);
  const [perceivedDifficulty, setPerceivedDifficulty] = useState(5);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isEnergyLevelEnabled, setIsEnergyLevelEnabled] = useState(false);
  const [isMoodEnabled, setIsMoodEnabled] = useState(false);
  const [isPerceivedDifficultyEnabled, setIsPerceivedDifficultyEnabled] = useState(false);

  const handleTimeChange = (e: { value: Date | null | undefined }) => {
    if (e.value) setSessionTime(e.value);
  };

  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  useEffect(() => {
    if (sessionTimer && sessionTimer > 0) {
      const hours = Math.floor(sessionTimer / 3600);
      const minutes = Math.floor((sessionTimer % 3600) / 60);
      const seconds = sessionTimer % 60;
      setSessionTime(new Date(0, 0, 0, hours, minutes, seconds));
    }
  }, [sessionTimer, visible]);

  const handleSubmit = () => {
    submitFeedback({
      sessionTime: sessionTime ? formatTime(sessionTime) : null,
      generalFeedback,
      energyLevel: isEnergyLevelEnabled ? energyLevel : null,
      mood: isMoodEnabled ? mood : null,
      perceivedDifficulty: isPerceivedDifficultyEnabled ? perceivedDifficulty : null,
      additionalNotes
    });
    onHide();
  };

  const footer = (
    <div className="flex justify-content-end gap-2">
      <Button
        label={intl.formatMessage({ id: 'cancel', defaultMessage: 'Cancel' })}
        icon="pi pi-times"
        className="p-button-text"
        onClick={onHide}
      />
      <Button
        label={intl.formatMessage({ id: 'submit', defaultMessage: 'Submit' })}
        icon="pi pi-check"
        className="p-button-primary"
        onClick={handleSubmit}
      />
    </div>
  );

  return (
    <Dialog
      draggable={false}
      resizable={false}
      dismissableMask
      header={intl.formatMessage({ id: 'training.finish.title', defaultMessage: 'Finish Training' })}
      className="finish-training-dialog"
      visible={visible}
      style={{ width: '50vw' }}
      onHide={onHide}
      footer={footer}
    >
      <div className="p-3">
        <div className="mb-4">
          <h3>
            <i className="pi pi-stopwatch mr-2"></i>
            <FormattedMessage id="training.finish.sessionDetails" defaultMessage="Session Details" />
          </h3>

          <div className="field">
            <label htmlFor="sessionTime">
              <FormattedMessage id="training.finish.sessionTime" defaultMessage="Session Time" />
            </label>
            <div className="flex align-items-center gap-2 mb-2">
              <i className="pi pi-clock"></i>
              <span>{sessionTime ? formatTime(sessionTime) : '00:00:00'}</span>
            </div>
            <Calendar
              id="sessionTime"
              value={sessionTime}
              onChange={handleTimeChange}
              timeOnly
              hourFormat="24"
              showIcon
              placeholder={intl.formatMessage({
                id: 'training.finish.sessionTime.placeholder',
                defaultMessage: "Enter your session's duration"
              })}
            />
          </div>

          <div className="field">
            <label htmlFor="generalFeedback">
              <FormattedMessage id="training.finish.generalFeedback" defaultMessage="General Feedback" />
            </label>
            <InputTextarea
              id="generalFeedback"
              rows={3}
              value={generalFeedback}
              onChange={(e) => setGeneralFeedback(e.target.value)}
              placeholder={intl.formatMessage({
                id: 'training.finish.generalFeedback.placeholder',
                defaultMessage: 'How did your training session go?'
              })}
            />
          </div>
        </div>

        <div className="mb-4">
          <h3>
            <i className="pi pi-chart-bar mr-2"></i>
            <FormattedMessage id="training.finish.measurements" defaultMessage="Measurements" />
          </h3>

          <div className="flex align-items-center gap-2 mb-2">
            <Checkbox
              inputId="enableEnergyLevel"
              checked={isEnergyLevelEnabled}
              onChange={(e: CheckboxChangeEvent) => setIsEnergyLevelEnabled(!!e.checked)}
            />
            <label htmlFor="enableEnergyLevel">
              <FormattedMessage id="training.finish.energyLevel.enable" defaultMessage="Track Energy Level" />
            </label>
          </div>

          {isEnergyLevelEnabled && (
            <div className="mb-3">
              <div className="flex justify-content-between align-items-center mb-1">
                <label htmlFor="energyLevel">
                  <FormattedMessage id="training.finish.energyLevel" defaultMessage="Energy Level" />
                </label>
                <span className="font-bold">{energyLevel}</span>
              </div>
              <Slider
                id="energyLevel"
                value={energyLevel}
                onChange={(e) => setEnergyLevel(e.value as number)}
                min={0}
                max={10}
              />
              <div className="flex justify-content-between text-sm text-500 mt-1">
                <span>
                  <FormattedMessage id="training.finish.low" defaultMessage="Low" />
                </span>
                <span>
                  <FormattedMessage id="training.finish.high" defaultMessage="High" />
                </span>
              </div>
            </div>
          )}

          <div className="flex align-items-center gap-2 mb-2">
            <Checkbox
              inputId="enableMood"
              checked={isMoodEnabled}
              onChange={(e: CheckboxChangeEvent) => setIsMoodEnabled(!!e.checked)}
            />
            <label htmlFor="enableMood">
              <FormattedMessage id="training.finish.mood.enable" defaultMessage="Track Mood" />
            </label>
          </div>

          {isMoodEnabled && (
            <div className="mb-3">
              <div className="flex justify-content-between align-items-center mb-1">
                <label htmlFor="mood">
                  <FormattedMessage id="training.finish.mood" defaultMessage="Mood" />
                </label>
                <span className="font-bold">{mood}</span>
              </div>
              <Slider id="mood" value={mood} onChange={(e) => setMood(e.value as number)} min={0} max={10} />
              <div className="flex justify-content-between text-sm text-500 mt-1">
                <span>
                  <FormattedMessage id="training.finish.bad" defaultMessage="Bad" />
                </span>
                <span>
                  <FormattedMessage id="training.finish.great" defaultMessage="Great" />
                </span>
              </div>
            </div>
          )}

          <div className="flex align-items-center gap-2 mb-2">
            <Checkbox
              inputId="enablePerceivedDifficulty"
              checked={isPerceivedDifficultyEnabled}
              onChange={(e: CheckboxChangeEvent) => setIsPerceivedDifficultyEnabled(!!e.checked)}
            />
            <label htmlFor="enablePerceivedDifficulty">
              <FormattedMessage id="training.finish.difficulty.enable" defaultMessage="Track Difficulty" />
            </label>
          </div>

          {isPerceivedDifficultyEnabled && (
            <div className="mb-3">
              <div className="flex justify-content-between align-items-center mb-1">
                <label htmlFor="perceivedDifficulty">
                  <FormattedMessage id="training.finish.difficulty" defaultMessage="Perceived Difficulty" />
                </label>
                <span className="font-bold">{perceivedDifficulty}</span>
              </div>
              <Slider
                id="perceivedDifficulty"
                value={perceivedDifficulty}
                onChange={(e) => setPerceivedDifficulty(e.value as number)}
                min={0}
                max={10}
              />
              <div className="flex justify-content-between text-sm text-500 mt-1">
                <span>
                  <FormattedMessage id="training.finish.easy" defaultMessage="Easy" />
                </span>
                <span>
                  <FormattedMessage id="training.finish.challenging" defaultMessage="Challenging" />
                </span>
              </div>
            </div>
          )}
        </div>

        <div>
          <h3>
            <i className="pi pi-comment mr-2"></i>
            <FormattedMessage id="training.finish.additionalNotes" defaultMessage="Additional Notes" />
          </h3>
          <div className="field">
            <InputTextarea
              id="additionalNotes"
              rows={3}
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder={intl.formatMessage({
                id: 'training.finish.additionalNotes.placeholder',
                defaultMessage: 'Anything else you want to note about this session?'
              })}
            />
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default FinishTrainingDialog;

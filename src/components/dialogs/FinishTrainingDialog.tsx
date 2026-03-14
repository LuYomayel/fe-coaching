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

const sectionStyle: React.CSSProperties = {
  background: 'var(--ios-surface-subtle)',
  borderRadius: 'var(--ios-radius-lg)',
  padding: '1rem',
  marginBottom: '0.75rem',
  border: '1px solid var(--ios-divider)'
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  fontWeight: 700,
  color: 'var(--ios-text)',
  margin: '0 0 0.75rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem',
  letterSpacing: '-0.01em'
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.78rem',
  fontWeight: 500,
  color: 'var(--ios-text-secondary)',
  marginBottom: '0.3rem',
  display: 'block'
};

const sliderLabelStyle: React.CSSProperties = {
  fontSize: '0.72rem',
  color: 'var(--ios-text-tertiary)'
};

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
    <div className="flex justify-content-end gap-2" style={{ padding: '0.25rem 0' }}>
      <Button
        label={intl.formatMessage({ id: 'cancel', defaultMessage: 'Cancel' })}
        icon="pi pi-times"
        className="p-button-text"
        onClick={onHide}
        style={{ fontSize: '0.85rem', color: 'var(--ios-text-secondary)' }}
      />
      <Button
        label={intl.formatMessage({ id: 'submit', defaultMessage: 'Submit' })}
        icon="pi pi-check"
        onClick={handleSubmit}
        style={{
          fontSize: '0.85rem',
          background: '#22c55e',
          border: 'none',
          borderRadius: 'var(--ios-radius-md)',
          fontWeight: 600
        }}
      />
    </div>
  );

  return (
    <Dialog
      draggable={false}
      resizable={false}
      dismissableMask
      header={
        <div className="flex align-items-center gap-2">
          <i className="pi pi-flag-fill" style={{ color: '#22c55e', fontSize: '1rem' }} />
          <span style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.01em' }}>
            {intl.formatMessage({ id: 'training.finish.title', defaultMessage: 'Finish Training' })}
          </span>
        </div>
      }
      visible={visible}
      style={{ width: 'min(92vw, 480px)', borderRadius: 'var(--ios-radius-xl)' }}
      onHide={onHide}
      footer={footer}
    >
      <div style={{ padding: '0.25rem 0' }}>
        {/* Session Details */}
        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>
            <i className="pi pi-stopwatch" style={{ color: '#6366f1' }} />
            <FormattedMessage id="training.finish.sessionDetails" defaultMessage="Session Details" />
          </h3>

          <div style={{ marginBottom: '0.75rem' }}>
            <label style={labelStyle}>
              <FormattedMessage id="training.finish.sessionTime" defaultMessage="Session Time" />
            </label>
            <div
              className="flex align-items-center gap-2 mb-2"
              style={{
                background: 'var(--ios-card-bg)',
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--ios-radius-md)',
                border: '1px solid var(--ios-divider)'
              }}
            >
              <i className="pi pi-clock" style={{ color: '#6366f1', fontSize: '0.85rem' }} />
              <span style={{ fontWeight: 700, fontSize: '1.1rem', fontVariantNumeric: 'tabular-nums', color: 'var(--ios-text)' }}>
                {sessionTime ? formatTime(sessionTime) : '00:00:00'}
              </span>
            </div>
            <Calendar
              value={sessionTime}
              onChange={handleTimeChange}
              timeOnly
              hourFormat="24"
              showIcon
              className="w-full"
              placeholder={intl.formatMessage({
                id: 'training.finish.sessionTime.placeholder',
                defaultMessage: "Enter your session's duration"
              })}
              style={{ fontSize: '0.85rem' }}
            />
          </div>

          <div>
            <label style={labelStyle}>
              <FormattedMessage id="training.finish.generalFeedback" defaultMessage="General Feedback" />
            </label>
            <InputTextarea
              rows={3}
              value={generalFeedback}
              onChange={(e) => setGeneralFeedback(e.target.value)}
              className="w-full"
              placeholder={intl.formatMessage({
                id: 'training.finish.generalFeedback.placeholder',
                defaultMessage: 'How did your training session go?'
              })}
              style={{
                resize: 'none',
                borderRadius: 'var(--ios-radius-md)',
                fontSize: '0.85rem',
                border: '1px solid var(--ios-divider)'
              }}
            />
          </div>
        </div>

        {/* Measurements */}
        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>
            <i className="pi pi-chart-bar" style={{ color: '#f59e0b' }} />
            <FormattedMessage id="training.finish.measurements" defaultMessage="Measurements" />
          </h3>

          {/* Energy Level */}
          <div style={{ marginBottom: '0.75rem' }}>
            <div className="flex align-items-center gap-2 mb-2">
              <Checkbox
                inputId="enableEnergyLevel"
                checked={isEnergyLevelEnabled}
                onChange={(e: CheckboxChangeEvent) => setIsEnergyLevelEnabled(!!e.checked)}
              />
              <label htmlFor="enableEnergyLevel" style={{ fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer' }}>
                <FormattedMessage id="training.finish.energyLevel.enable" defaultMessage="Track Energy Level" />
              </label>
            </div>
            {isEnergyLevelEnabled && (
              <div style={{ paddingLeft: '0.25rem' }}>
                <div className="flex justify-content-between align-items-center mb-1">
                  <label style={labelStyle}>
                    <FormattedMessage id="training.finish.energyLevel" defaultMessage="Energy Level" />
                  </label>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#6366f1' }}>{energyLevel}</span>
                </div>
                <Slider value={energyLevel} onChange={(e) => setEnergyLevel(e.value as number)} min={0} max={10} />
                <div className="flex justify-content-between mt-1">
                  <span style={sliderLabelStyle}>
                    <FormattedMessage id="training.finish.low" defaultMessage="Low" />
                  </span>
                  <span style={sliderLabelStyle}>
                    <FormattedMessage id="training.finish.high" defaultMessage="High" />
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Mood */}
          <div style={{ marginBottom: '0.75rem' }}>
            <div className="flex align-items-center gap-2 mb-2">
              <Checkbox
                inputId="enableMood"
                checked={isMoodEnabled}
                onChange={(e: CheckboxChangeEvent) => setIsMoodEnabled(!!e.checked)}
              />
              <label htmlFor="enableMood" style={{ fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer' }}>
                <FormattedMessage id="training.finish.mood.enable" defaultMessage="Track Mood" />
              </label>
            </div>
            {isMoodEnabled && (
              <div style={{ paddingLeft: '0.25rem' }}>
                <div className="flex justify-content-between align-items-center mb-1">
                  <label style={labelStyle}>
                    <FormattedMessage id="training.finish.mood" defaultMessage="Mood" />
                  </label>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#6366f1' }}>{mood}</span>
                </div>
                <Slider value={mood} onChange={(e) => setMood(e.value as number)} min={0} max={10} />
                <div className="flex justify-content-between mt-1">
                  <span style={sliderLabelStyle}>
                    <FormattedMessage id="training.finish.bad" defaultMessage="Bad" />
                  </span>
                  <span style={sliderLabelStyle}>
                    <FormattedMessage id="training.finish.great" defaultMessage="Great" />
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Difficulty */}
          <div>
            <div className="flex align-items-center gap-2 mb-2">
              <Checkbox
                inputId="enablePerceivedDifficulty"
                checked={isPerceivedDifficultyEnabled}
                onChange={(e: CheckboxChangeEvent) => setIsPerceivedDifficultyEnabled(!!e.checked)}
              />
              <label htmlFor="enablePerceivedDifficulty" style={{ fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer' }}>
                <FormattedMessage id="training.finish.difficulty.enable" defaultMessage="Track Difficulty" />
              </label>
            </div>
            {isPerceivedDifficultyEnabled && (
              <div style={{ paddingLeft: '0.25rem' }}>
                <div className="flex justify-content-between align-items-center mb-1">
                  <label style={labelStyle}>
                    <FormattedMessage id="training.finish.difficulty" defaultMessage="Perceived Difficulty" />
                  </label>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#6366f1' }}>{perceivedDifficulty}</span>
                </div>
                <Slider
                  value={perceivedDifficulty}
                  onChange={(e) => setPerceivedDifficulty(e.value as number)}
                  min={0}
                  max={10}
                />
                <div className="flex justify-content-between mt-1">
                  <span style={sliderLabelStyle}>
                    <FormattedMessage id="training.finish.easy" defaultMessage="Easy" />
                  </span>
                  <span style={sliderLabelStyle}>
                    <FormattedMessage id="training.finish.challenging" defaultMessage="Challenging" />
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Additional Notes */}
        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>
            <i className="pi pi-comment" style={{ color: '#22c55e' }} />
            <FormattedMessage id="training.finish.additionalNotes" defaultMessage="Additional Notes" />
          </h3>
          <InputTextarea
            rows={3}
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            className="w-full"
            placeholder={intl.formatMessage({
              id: 'training.finish.additionalNotes.placeholder',
              defaultMessage: 'Anything else you want to note about this session?'
            })}
            style={{
              resize: 'none',
              borderRadius: 'var(--ios-radius-md)',
              fontSize: '0.85rem',
              border: '1px solid var(--ios-divider)'
            }}
          />
        </div>
      </div>
    </Dialog>
  );
};

export default FinishTrainingDialog;

import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Slider } from 'primereact/slider';
import { Calendar } from 'primereact/calendar';
import { Checkbox } from 'primereact/checkbox';


const FinishTrainingDialog = ({ visible, onHide, submitFeedback }) => {
  const [sessionTime, setSessionTime] = useState(new Date(0, 0, 0, 0, 0));
  const [generalFeedback, setGeneralFeedback] = useState('');
  const [energyLevel, setEnergyLevel] = useState(0); // Default to null
  const [mood, setMood] = useState(0); // Default to null
  const [perceivedDifficulty, setPerceivedDifficulty] = useState(0); // Default to null
  const [additionalNotes, setAdditionalNotes] = useState('');

  const [isEnergyLevelEnabled, setIsEnergyLevelEnabled] = useState(false);
  const [isMoodEnabled, setIsMoodEnabled] = useState(false);
  const [isPerceivedDifficultyEnabled, setIsPerceivedDifficultyEnabled] = useState(false);

  const handleTimeChange = (e) => {
    setSessionTime(e.value);
  };

  const formatTime = (date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

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

  return (
    <Dialog draggable={false}  resizable={false} header="Finish Training" className="responsive-dialog" visible={visible} style={{ width: '50vw' }} onHide={onHide}>
      <div className="p-field">
        <label htmlFor="sessionTime">Session Time (hh:mm)</label>
        <Calendar
          id="sessionTime"
          value={sessionTime}
          onChange={handleTimeChange}
          timeOnly
          
          hourFormat="24"
          showIcon
          placeholder="Enter the duration of your session"
          icon={() => <i className="pi pi-clock custom-calendar-icon" />}
        />
      </div>
      <div className="p-field">
        <label htmlFor="generalFeedback">General Feedback</label>
        <InputTextarea
          id="generalFeedback"
          rows={3}
          value={generalFeedback}
          onChange={(e) => setGeneralFeedback(e.target.value)}
        />
      </div>
      <div className="p-field-checkbox">
        <Checkbox inputId="enableEnergyLevel" checked={isEnergyLevelEnabled} onChange={(e) => setIsEnergyLevelEnabled(e.checked)} />
        <label htmlFor="enableEnergyLevel" className="p-checkbox-label">Enable Energy Level</label>
      </div>
      <div className="p-field">
        <label htmlFor="energyLevel">Energy Level</label>
        <Slider
          id="energyLevel"
          value={energyLevel || 0}
          onChange={(e) => setEnergyLevel(e.value)}
          min={0}
          max={10}
          disabled={!isEnergyLevelEnabled}
        />
      </div>
      <div className="p-field-checkbox">
        <Checkbox inputId="enableMood" checked={isMoodEnabled} onChange={(e) => setIsMoodEnabled(e.checked)} />
        <label htmlFor="enableMood" className="p-checkbox-label">Enable Mood</label>
      </div>
      <div className="p-field">
        <label htmlFor="mood">Mood</label>
        <Slider
          id="mood"
          value={mood || 0}
          onChange={(e) => setMood(e.value)}
          min={0}
          max={10}
          disabled={!isMoodEnabled}
        />
      </div>
      <div className="p-field-checkbox">
        <Checkbox inputId="enablePerceivedDifficulty" checked={isPerceivedDifficultyEnabled} onChange={(e) => setIsPerceivedDifficultyEnabled(e.checked)} />
        <label htmlFor="enablePerceivedDifficulty" className="p-checkbox-label">Enable Perceived Difficulty</label>
      </div>
      <div className="p-field">
        <label htmlFor="perceivedDifficulty">Perceived Difficulty</label>
        <InputNumber
          id="perceivedDifficulty"
          value={perceivedDifficulty || 0}
          onValueChange={(e) => setPerceivedDifficulty(e.value)}
          min={0}
          max={10}
          disabled={!isPerceivedDifficultyEnabled}
        />
      </div>
      <div className="p-field">
        <label htmlFor="additionalNotes">Additional Notes</label>
        <InputTextarea
          id="additionalNotes"
          rows={3}
          value={additionalNotes}
          onChange={(e) => setAdditionalNotes(e.target.value)}
        />
      </div>
      <div className='flex justify-content-center'>
        <Button label="Submit" onClick={handleSubmit} />
      </div>
    </Dialog>
  );
};

export default FinishTrainingDialog;
import React from 'react';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { useIntl } from 'react-intl';

interface TrainingCycleTemplate {
  id: number;
  name: string;
  duration: number;
  isDurationInMonths: boolean;
  trainingWeeks?: Array<{
    trainingSessions?: Array<{
      workoutInstances?: Array<{
        workout?: {
          planName: string;
        };
      }>;
      workout?: {
        planName: string;
      };
    }>;
  }>;
}

interface AssignCycleTemplateDialogProps {
  visible: boolean;
  onHide: () => void;
  trainingCycleTemplates: TrainingCycleTemplate[];
  selectedCycleTemplate: TrainingCycleTemplate | null;
  setSelectedCycleTemplate: (template: TrainingCycleTemplate | null) => void;
  startDate: Date | null;
  setStartDate: (date: Date | null) => void;
  endDate: Date | null;
  setEndDate: (date: Date | null) => void;
  onAssign: () => void;
}

export const AssignCycleTemplateDialog: React.FC<AssignCycleTemplateDialogProps> = ({
  visible,
  onHide,
  trainingCycleTemplates,
  selectedCycleTemplate,
  setSelectedCycleTemplate,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onAssign
}) => {
  const intl = useIntl();

  const handleCycleChange = (newTemplate: TrainingCycleTemplate) => {
    setSelectedCycleTemplate(newTemplate);
    // Calcular fecha de fin basada en la duración del ciclo si hay fecha de inicio
    if (startDate) {
      const calculatedEndDate = new Date(startDate);
      if (newTemplate.isDurationInMonths) {
        calculatedEndDate.setMonth(calculatedEndDate.getMonth() + newTemplate.duration);
      } else {
        calculatedEndDate.setDate(calculatedEndDate.getDate() + newTemplate.duration * 7);
      }
      setEndDate(calculatedEndDate);
    }
  };

  const handleStartDateChange = (newDate: Date) => {
    setStartDate(newDate);
    // Calcular fecha de fin si hay un ciclo seleccionado
    if (selectedCycleTemplate) {
      const calculatedEndDate = new Date(newDate);
      if (selectedCycleTemplate.isDurationInMonths) {
        calculatedEndDate.setMonth(calculatedEndDate.getMonth() + selectedCycleTemplate.duration);
      } else {
        calculatedEndDate.setDate(calculatedEndDate.getDate() + selectedCycleTemplate.duration * 7);
      }
      setEndDate(calculatedEndDate);
    }
  };

  return (
    <Dialog
      dismissableMask
      modal
      draggable={false}
      resizable={false}
      className="responsive-dialog"
      header={intl.formatMessage({ id: 'clientDashboard.assignCycleTemplate.dialog.header' })}
      visible={visible}
      style={{ width: '50vw' }}
      onHide={onHide}
    >
      <div className="flex flex-column gap-3 p-3">
        <div className="field">
          <label className="block mb-2">
            {intl.formatMessage({ id: 'clientDashboard.assignCycleTemplate.selectCycle' })}
          </label>
          <Dropdown
            value={selectedCycleTemplate}
            options={trainingCycleTemplates}
            onChange={(e) => handleCycleChange(e.value)}
            optionLabel="name"
            placeholder={intl.formatMessage({ id: 'clientDashboard.assignCycleTemplate.selectCyclePlaceholder' })}
            className="w-full"
          />
          {selectedCycleTemplate && (
            <div className="cycle-info mt-2">
              <div className="cycle-name">{selectedCycleTemplate.name}</div>
              <div className="cycle-details">
                <div className="m-0 text-sm flex gap-2">
                  <div className="m-0 text-sm">
                    {selectedCycleTemplate.duration}{' '}
                    {selectedCycleTemplate.isDurationInMonths
                      ? intl.formatMessage({ id: 'common.months' })
                      : intl.formatMessage({ id: 'common.weeks' })}{' '}
                    (
                    {selectedCycleTemplate.isDurationInMonths
                      ? selectedCycleTemplate.duration * 4
                      : selectedCycleTemplate.duration}{' '}
                    {intl.formatMessage({ id: 'common.weeks' })})
                  </div>
                  <div>
                    <p>/</p>
                  </div>

                  <div className="m-0 text-sm">
                    {selectedCycleTemplate.trainingWeeks?.[0]?.trainingSessions?.length || 0}{' '}
                    {intl.formatMessage({ id: 'common.workoutsPerWeek' })}
                  </div>
                </div>

                <div className="cycle-workouts mt-2 flex flex-wrap gap-2">
                  {selectedCycleTemplate.trainingWeeks?.[0]?.trainingSessions?.map((session, index) => (
                    <p key={index} className="m-0 text-sm">
                      {session.workoutInstances?.[0]?.workout?.planName || session.workout?.planName}{' '}
                      {index !== (selectedCycleTemplate.trainingWeeks?.[0]?.trainingSessions?.length || 0) - 1 && ', '}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="field grid">
          <div className="col-6">
            <label className="block mb-2">{intl.formatMessage({ id: 'common.startDate' })}</label>
            <Calendar
              value={startDate}
              onChange={(e) => handleStartDateChange(e.value as Date)}
              showIcon
              className="w-full"
              locale={intl.locale}
            />
          </div>
          <div className="col-6">
            <label className="block mb-2">{intl.formatMessage({ id: 'common.endDate' })}</label>
            <Calendar value={endDate} disabled showIcon className="w-full" locale={intl.locale} />
          </div>
        </div>

        <Button
          label={intl.formatMessage({ id: 'common.assign' })}
          icon="pi pi-check"
          className="p-button-success mt-3"
          onClick={onAssign}
        />
      </div>
    </Dialog>
  );
};

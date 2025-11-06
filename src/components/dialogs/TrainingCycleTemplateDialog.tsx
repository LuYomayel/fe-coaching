import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Checkbox } from 'primereact/checkbox';
import { Fieldset } from 'primereact/fieldset';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Dropdown } from 'primereact/dropdown';
import { useIntl } from 'react-intl';

interface TrainingCycleTemplateDialogProps {
  visible: boolean;
  onHide: () => void;
  templateName: string;
  setTemplateName: (name: string) => void;
  templateDuration: number | null;
  selectedDay: number | null;
  setSelectedDay: (day: number | null) => void;
  selectedWorkout: any;
  setSelectedWorkout: (workout: any) => void;
  isDurationInWeeks: boolean;
  applyToAllWeeks: boolean;
  setApplyToAllWeeks: (apply: boolean) => void;
  isReadOnly: boolean;
  setIsReadOnly: (readOnly: boolean) => void;
  selectedCycleId: number | null;
  templateWeeks: any[];
  handleDurationTypeChange: (e: any) => void;
  handleRemoveWorkoutFromWeek: (weekIndex: number, sessionIndex: number) => void;
  handleAddWorkout: (workoutId: number, dayNumber: number, applyToAll: boolean, weekIndex?: number) => void;
  handleCreateTemplate: () => void;
  handleDurationChange: (duration: number) => void;
  workouts: any[];
  deletedWorkoutTemplates: any[];
}

export function TrainingCycleTemplateDialog({
  visible,
  onHide,
  templateName,
  setTemplateName,
  templateDuration,
  selectedDay,
  setSelectedDay,
  selectedWorkout,
  setSelectedWorkout,
  isDurationInWeeks,
  applyToAllWeeks,
  setApplyToAllWeeks,
  isReadOnly,
  setIsReadOnly,
  selectedCycleId,
  templateWeeks,
  handleDurationTypeChange,
  handleRemoveWorkoutFromWeek,
  handleAddWorkout,
  handleCreateTemplate,
  handleDurationChange,
  workouts,
  deletedWorkoutTemplates
}: TrainingCycleTemplateDialogProps) {
  const intl = useIntl();

  const datesOfWeek = [
    { label: intl.formatMessage({ id: 'plansPage.monday' }), value: 1 },
    { label: intl.formatMessage({ id: 'plansPage.tuesday' }), value: 2 },
    { label: intl.formatMessage({ id: 'plansPage.wednesday' }), value: 3 },
    { label: intl.formatMessage({ id: 'plansPage.thursday' }), value: 4 },
    { label: intl.formatMessage({ id: 'plansPage.friday' }), value: 5 },
    { label: intl.formatMessage({ id: 'plansPage.saturday' }), value: 6 },
    { label: intl.formatMessage({ id: 'plansPage.sunday' }), value: 7 }
  ];

  const getHeader = () => {
    if (!selectedCycleId) {
      return intl.formatMessage({ id: 'plansPage.createCycleDialog.header' });
    }
    return isReadOnly
      ? intl.formatMessage({ id: 'plansPage.viewCycleDialog.header' })
      : intl.formatMessage({ id: 'plansPage.editCycleDialog.header' });
  };

  return (
    <Dialog
      dismissableMask={true}
      className="responsive-dialog"
      modal
      draggable={false}
      resizable={false}
      header={
        <div className="flex gap-2 align-items-center">
          <span>{getHeader()}</span>
          {isReadOnly && selectedCycleId ? (
            <Button
              icon="pi pi-pencil"
              className="p-button-text"
              tooltip={intl.formatMessage({ id: 'plansPage.enableEdit' })}
              onClick={() => setIsReadOnly(false)}
            />
          ) : !isReadOnly && selectedCycleId ? (
            <Button
              icon="pi pi-lock"
              className="p-button-text"
              tooltip={intl.formatMessage({ id: 'plansPage.disableEdit' })}
              onClick={() => setIsReadOnly(true)}
            />
          ) : null}
        </div>
      }
      visible={visible}
      style={{ width: '50vw' }}
      onHide={onHide}
    >
      <div className="flex flex-column gap-4 p-3">
        <InputText
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          placeholder={intl.formatMessage({ id: 'plansPage.templateNamePlaceholder' })}
          className="w-full"
          disabled={isReadOnly}
        />

        <div className="flex gap-2 align-items-center">
          <Checkbox
            inputId="durationType"
            checked={isDurationInWeeks}
            onChange={handleDurationTypeChange}
            disabled={isReadOnly}
          />
          <label htmlFor="durationType">
            {isDurationInWeeks
              ? intl.formatMessage({ id: 'plansPage.durationInWeeks' })
              : intl.formatMessage({ id: 'plansPage.durationInMonths' })}
          </label>
          <InputNumber
            value={templateDuration}
            onValueChange={(e) => handleDurationChange(e.value || 0)}
            placeholder={intl.formatMessage(
              { id: 'plansPage.durationPlaceholder' },
              {
                unit: isDurationInWeeks
                  ? intl.formatMessage({ id: 'plansPage.weeks' })
                  : intl.formatMessage({ id: 'plansPage.months' })
              }
            )}
            className="w-full"
            disabled={isReadOnly}
          />
        </div>

        <Fieldset legend={intl.formatMessage({ id: 'plansPage.trainingWeeks' })}>
          <Accordion>
            {templateWeeks.map((week, index) => (
              <AccordionTab
                key={index}
                header={intl.formatMessage({ id: 'plansPage.week' }, { weekNumber: week.weekNumber })}
              >
                <div className="flex flex-column md:flex-row gap-2 align-items-center">
                  <div className="w-full md:w-6">
                    <Dropdown
                      value={selectedWorkout}
                      options={workouts}
                      onChange={(e) => setSelectedWorkout(e.value)}
                      optionLabel="planName"
                      placeholder={intl.formatMessage({ id: 'plansPage.selectWorkout' })}
                      disabled={isReadOnly}
                    />
                  </div>
                  <div className="w-full md:w-6">
                    <Dropdown
                      value={selectedDay}
                      options={datesOfWeek}
                      onChange={(e) => setSelectedDay(e.value)}
                      placeholder={intl.formatMessage({ id: 'plansPage.selectDay' })}
                      disabled={isReadOnly}
                    />
                  </div>
                  <div className="flex gap-2 align-items-center">
                    <Checkbox
                      inputId="addToAllWeeks"
                      checked={applyToAllWeeks}
                      onChange={(e) => setApplyToAllWeeks(e.checked ?? false)}
                      disabled={isReadOnly}
                    />
                    <label htmlFor="addToAllWeeks">{intl.formatMessage({ id: 'plansPage.applyToAllWeeks' })}</label>
                  </div>
                  <div className="">
                    <Button
                      tooltip={intl.formatMessage({ id: 'plansPage.addWorkout' })}
                      icon="pi pi-plus"
                      className="p-button-sm p-button-success"
                      onClick={() => handleAddWorkout(selectedWorkout?.id, selectedDay || 0, applyToAllWeeks, index)}
                      disabled={isReadOnly}
                    />
                  </div>
                </div>

                <ul className="mt-2">
                  {week.trainingSessions.map((session: any, i: number) => {
                    const workout =
                      workouts.find((w) => w.id === session.workout?.id || w.id === session.workout) ||
                      deletedWorkoutTemplates.find((w) => w.id === session.workout?.id || w.id === session.workout);
                    return (
                      <li key={i} className="flex align-items-center">
                        <span>
                          🏋️ {workout?.planName || intl.formatMessage({ id: 'plansPage.workout' })} -{' '}
                          {datesOfWeek.find((d) => d.value === session.dayNumber)?.label}
                        </span>
                        <Button
                          icon="pi pi-trash"
                          className="p-button-text p-button-danger"
                          onClick={() => handleRemoveWorkoutFromWeek(index, i)}
                          disabled={isReadOnly}
                        />
                      </li>
                    );
                  })}
                </ul>
              </AccordionTab>
            ))}
          </Accordion>
        </Fieldset>

        <Button
          label={intl.formatMessage({ id: 'plansPage.saveTemplate' })}
          className="p-button-success"
          onClick={handleCreateTemplate}
        />
      </div>
    </Dialog>
  );
}

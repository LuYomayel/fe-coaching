import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { Card } from 'primereact/card';
import { Checkbox, CheckboxChangeEvent } from 'primereact/checkbox';
import { InputNumber } from 'primereact/inputnumber';
import { FormattedMessage } from 'react-intl';
import { TabPanel, TabView } from 'primereact/tabview';
import { useCreateTrainingCycleDialog } from '../../hooks/dialogs/useCreateTrainingCycleDialog';

interface ICreateTrainingCycleDialogProps {
  visible: boolean;
  onHide: () => void;
  clientId: number | string;
  setRefreshKey: (fn: (old: number) => number) => void;
}

const CreateTrainingCycleDialog = ({ visible, onHide, clientId, setRefreshKey }: ICreateTrainingCycleDialogProps) => {
  const {
    intl,
    rpeMethods,
    cycleName,
    setCycleName,
    startDate,
    setStartDate,
    durationInMonths,
    durationInWeeks,
    loading,
    assignments,
    workouts,
    activeIndex,
    setActiveIndex,
    trainingCycleTemplates,
    selectedCycleTemplate,
    templateStartDate,
    templateEndDate,
    globalRpeMethod,
    setGlobalRpeMethod,
    useGlobalRpe,
    setUseGlobalRpe,
    templateRpeMethod,
    setTemplateRpeMethod,
    daysOfWeek,
    onDurationMonthChange,
    onDurationWeekChange,
    clickCreateCycle,
    clickGoNextTab,
    handleAddAssignment,
    handleAssignmentChange,
    removeAssignment,
    handleAction,
    handleAssignCycleTemplate,
    handleCycleTemplateChange,
    handleTemplateStartDateChange,
    isNextDisabled
  } = useCreateTrainingCycleDialog({ visible, onHide, clientId, setRefreshKey });

  const renderTabPanelCycle = () => (
    <TabPanel header={intl.formatMessage({ id: 'createCycle.dialog.header' })}>
      <div className="flex flex-row gap-2">
        <div className="p-field">
          <label htmlFor="cycleName">
            <FormattedMessage id="createCycle.cycleName" />
          </label>
          <InputText
            id="cycleName"
            value={cycleName}
            onChange={(e) => setCycleName(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="p-field">
          <label htmlFor="startDate">
            <FormattedMessage id="startDate" />
          </label>
          <Calendar
            id="startDate"
            value={startDate}
            locale={intl.locale}
            dateFormat="dd/mm/yy"
            onChange={(e) => setStartDate(e.value as Date | null)}
            showIcon
            className="w-full"
          />
        </div>
      </div>
      <div className="flex flex-row gap-2 w-full justify-content-between">
        <div className="p-field">
          <label htmlFor="durationInMonths">
            <FormattedMessage id="createCycle.durationInMonths" />
          </label>
          <InputNumber
            id="durationInMonths"
            value={durationInMonths}
            onValueChange={(e) => onDurationMonthChange(e.value ?? null)}
            mode="decimal"
            min={1}
            max={12}
            className={`${durationInWeeks ? 'p-inputtext-muted' : ''} w-full`}
          />
        </div>
        <div className="p-field">
          <label htmlFor="durationInWeeks">
            <FormattedMessage id="createCycle.durationInWeeks" />
          </label>
          <InputNumber
            id="durationInWeeks"
            value={durationInWeeks}
            onValueChange={(e) => onDurationWeekChange(e.value ?? null)}
            mode="decimal"
            min={1}
            max={52}
            className={`${durationInMonths ? 'p-inputtext-muted' : ''} w-full`}
          />
        </div>
      </div>
      <div className="flex justify-content-between">
        <Button
          label={intl.formatMessage({ id: 'createCycle.button.create' })}
          icon="pi pi-plus"
          onClick={clickCreateCycle}
          loading={loading}
        />
        <Button
          label={intl.formatMessage({ id: 'common.next' })}
          icon="pi pi-arrow-right"
          onClick={clickGoNextTab}
          loading={loading}
          disabled={isNextDisabled}
        />
      </div>
    </TabPanel>
  );

  const renderTabPanelWorkouts = () => (
    <TabPanel
      header={intl.formatMessage({ id: 'assignWorkoutToCycleDialog.assignWorkoutsToCycle' })}
      disabled={activeIndex !== 1}
    >
      <div className="field-checkbox mb-3 flex align-items-center">
        <Checkbox
          inputId="useGlobalRpe"
          checked={useGlobalRpe}
          onChange={(e: CheckboxChangeEvent) => setUseGlobalRpe(!!e.checked)}
          className="mr-2"
        />
        <label htmlFor="useGlobalRpe" className="mb-0">
          {intl.formatMessage({
            id: 'createCycle.useGlobalRpe',
            defaultMessage: 'Usar el mismo método RPE para todas las sesiones'
          })}
        </label>
      </div>

      {useGlobalRpe && (
        <div className="field mb-3">
          <label className="block mb-2">
            {intl.formatMessage({
              id: 'createCycle.globalRpeMethod',
              defaultMessage: 'Método RPE para todas las sesiones'
            })}
          </label>
          <Dropdown
            value={globalRpeMethod}
            options={rpeMethods}
            onChange={(e) => setGlobalRpeMethod(e.value)}
            optionLabel="name"
            placeholder={intl.formatMessage({
              id: 'createCycle.selectRpeMethod',
              defaultMessage: 'Seleccionar método RPE'
            })}
            className="w-full"
          />
        </div>
      )}

      {assignments.map((assignment, index) => (
        <Card
          key={index}
          title={`${intl.formatMessage({ id: 'assignWorkoutToCycleDialog.assignment' })} ${index + 1}`}
          className="mb-2"
        >
          <div className="p-field grid">
            <div className={useGlobalRpe ? 'col-6' : 'col-4'}>
              <Dropdown
                value={assignment.workoutId}
                options={workouts.map((w) => ({ label: w.planName, value: w.id }))}
                onChange={(e) => handleAssignmentChange(index, 'workoutId', e.value)}
                placeholder={intl.formatMessage({ id: 'assignWorkoutToCycleDialog.selectWorkout' })}
                className="w-full"
              />
            </div>
            <div className={useGlobalRpe ? 'col-5' : 'col-3'}>
              <Dropdown
                value={assignment.dayOfWeek}
                options={daysOfWeek}
                optionValue="value"
                onChange={(e) => handleAssignmentChange(index, 'dayOfWeek', e.value)}
                placeholder={intl.formatMessage({ id: 'assignWorkoutToCycleDialog.selectDayOfWeek' })}
                className="w-full"
              />
            </div>
            {!useGlobalRpe && (
              <div className="col-4">
                <Dropdown
                  value={assignment.rpeMethodId}
                  options={rpeMethods}
                  onChange={(e) => handleAssignmentChange(index, 'rpeMethodId', e.value?.id || e.value)}
                  optionLabel="name"
                  optionValue="id"
                  placeholder={intl.formatMessage({
                    id: 'createCycle.selectRpeMethod',
                    defaultMessage: 'Método RPE'
                  })}
                  className="w-full"
                />
              </div>
            )}
            <div className="col-1">
              <Button icon="pi pi-times" onClick={() => removeAssignment(index)} />
            </div>
          </div>
        </Card>
      ))}

      <div className="flex justify-content-between">
        <Button
          label={intl.formatMessage({ id: 'assignWorkoutToCycleDialog.addAssignment' })}
          icon="pi pi-plus"
          onClick={handleAddAssignment}
          className="p-button-secondary"
        />
        <Button
          label={intl.formatMessage({ id: 'assignWorkoutToCycleDialog.assignWorkouts' })}
          icon="pi pi-check"
          onClick={handleAction}
          className="p-button-primary"
          loading={loading}
        />
      </div>
    </TabPanel>
  );

  const renderTabPanelTemplates = () => (
    <TabPanel
      header={intl.formatMessage({
        id: 'createCycle.fromTemplate',
        defaultMessage: 'Desde Plantilla'
      })}
    >
      <div className="flex flex-column gap-3 p-3">
        <div className="field">
          <label className="block mb-2">
            {intl.formatMessage(
              { id: 'clientDashboard.assignCycleTemplate.selectCycle' },
              { defaultMessage: 'Seleccionar Ciclo de Entrenamiento' }
            )}
          </label>
          <Dropdown
            value={selectedCycleTemplate}
            options={trainingCycleTemplates}
            onChange={(e) => handleCycleTemplateChange(e.value)}
            optionLabel="name"
            placeholder={intl.formatMessage(
              { id: 'clientDashboard.assignCycleTemplate.selectCyclePlaceholder' },
              { defaultMessage: 'Seleccione un ciclo de entrenamiento' }
            )}
            className="w-full"
          />
          {selectedCycleTemplate && (
            <p className="mt-2 text-sm w-full">
              {selectedCycleTemplate.duration}{' '}
              {selectedCycleTemplate.isDurationInMonths
                ? intl.formatMessage({ id: 'common.months', defaultMessage: 'meses' })
                : intl.formatMessage({ id: 'common.weeks', defaultMessage: 'semanas' })}{' '}
              (
              {selectedCycleTemplate.isDurationInMonths
                ? selectedCycleTemplate.duration * 4
                : selectedCycleTemplate.duration}{' '}
              {intl.formatMessage({ id: 'common.weeks', defaultMessage: 'semanas' })})
            </p>
          )}
        </div>

        <div className="field">
          <label className="block mb-2">
            {intl.formatMessage({
              id: 'createCycle.selectRpeMethod',
              defaultMessage: 'Método de Medición RPE'
            })}
          </label>
          <Dropdown
            value={templateRpeMethod}
            options={rpeMethods}
            onChange={(e) => setTemplateRpeMethod(e.value)}
            optionLabel="name"
            placeholder={intl.formatMessage({
              id: 'createCycle.selectRpeMethodPlaceholder',
              defaultMessage: 'Seleccionar método RPE'
            })}
            className="w-full"
          />
          {!templateRpeMethod && (
            <small className="p-error">
              {intl.formatMessage({
                id: 'createCycle.error.selectRpeMethod',
                defaultMessage: 'Por favor selecciona un método RPE'
              })}
            </small>
          )}
        </div>

        <div className="field grid">
          <div className="col-6">
            <label className="block mb-2">
              {intl.formatMessage({ id: 'common.startDate', defaultMessage: 'Fecha de Inicio' })}
            </label>
            <Calendar
              value={templateStartDate}
              onChange={(e) => handleTemplateStartDateChange(e.value as Date | null)}
              showIcon
              className="w-full"
              locale={intl.locale}
              dateFormat="dd/mm/yy"
            />
          </div>
          <div className="col-6">
            <label className="block mb-2">
              {intl.formatMessage({ id: 'common.endDate', defaultMessage: 'Fecha de Fin' })}
            </label>
            <Calendar
              value={templateEndDate}
              disabled
              showIcon
              className="w-full"
              locale={intl.locale}
              dateFormat="dd/mm/yy"
            />
          </div>
        </div>

        <Button
          label={intl.formatMessage({ id: 'common.assign', defaultMessage: 'Asignar' })}
          icon="pi pi-check"
          className="p-button-success mt-3"
          onClick={handleAssignCycleTemplate}
          loading={loading}
        />
      </div>
    </TabPanel>
  );

  return (
    <Dialog
      draggable={false}
      resizable={false}
      dismissableMask
      header={intl.formatMessage({ id: 'createCycle.dialog.header' })}
      className="responsive-dialog"
      visible={visible}
      style={{ width: '50vw' }}
      onHide={onHide}
    >
      <TabView activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)}>
        {renderTabPanelCycle()}
        {renderTabPanelWorkouts()}
        {renderTabPanelTemplates()}
      </TabView>
    </Dialog>
  );
};

export default CreateTrainingCycleDialog;

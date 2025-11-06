import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { useIntl } from 'react-intl';
import { CoachPlanForm } from '../../hooks/coach/useCoachPlanDialog';

interface Props {
  visible: boolean;
  loading: boolean;
  mode: 'create' | 'edit';
  form: CoachPlanForm;
  onHide: () => void;
  onChange: <K extends keyof CoachPlanForm>(key: K, value: CoachPlanForm[K]) => void;
  onSave: () => Promise<{ success: boolean }>;
}

export function CoachPlanDialog({ visible, loading, mode, form, onHide, onChange, onSave }: Props) {
  const intl = useIntl();

  return (
    <Dialog
      visible={visible}
      style={{ width: '650px' }}
      header={
        mode === 'create'
          ? intl.formatMessage({ id: 'coach.createNewPlan' })
          : intl.formatMessage({ id: 'coach.editPlan' })
      }
      modal
      className="coach-dialog"
      onHide={onHide}
      footer={
        <div>
          <Button
            label={intl.formatMessage({ id: 'common.cancel' })}
            icon="pi pi-times"
            onClick={onHide}
            className="p-button-text"
          />
          <Button
            label={intl.formatMessage({ id: 'common.save' })}
            icon="pi pi-check"
            onClick={onSave}
            loading={loading}
            autoFocus
          />
        </div>
      }
    >
      <div className="p-fluid">
        <div className="p-field">
          <label htmlFor="name">{intl.formatMessage({ id: 'coach.plan.name' })}</label>
          <InputText id="name" value={form.name} onChange={(e) => onChange('name', e.target.value)} />
        </div>
        <div className="p-field">
          <label htmlFor="price">{intl.formatMessage({ id: 'coach.plan.price' })}</label>
          <InputNumber id="price" value={form.price} onValueChange={(e) => onChange('price', Number(e.value) || 0)} />
        </div>
        <div className="p-field">
          <label htmlFor="workoutsPerWeek">{intl.formatMessage({ id: 'coach.plan.workoutsPerWeek' })}</label>
          <InputNumber
            id="workoutsPerWeek"
            value={form.workoutsPerWeek}
            onValueChange={(e) => onChange('workoutsPerWeek', Number(e.value) || 0)}
          />
        </div>
        <div className="p-field-checkbox">
          <Checkbox
            inputId="includeMealPlan"
            checked={form.includeMealPlan}
            onChange={(e) => onChange('includeMealPlan', !!e.checked)}
          />
          <label htmlFor="includeMealPlan">{intl.formatMessage({ id: 'coach.plan.includeMealPlan' })}</label>
        </div>
      </div>
    </Dialog>
  );
}

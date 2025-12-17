import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
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

  const paymentFrequencyOptions = [
    { label: intl.formatMessage({ id: 'coach.plan.paymentFrequency.monthly' }), value: 'monthly' },
    { label: intl.formatMessage({ id: 'coach.plan.paymentFrequency.weekly' }), value: 'weekly' },
    { label: intl.formatMessage({ id: 'coach.plan.paymentFrequency.perSession' }), value: 'per_session' }
  ];

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
          <label htmlFor="paymentFrequency">{intl.formatMessage({ id: 'coach.plan.paymentFrequency' })}</label>
          <Dropdown
            id="paymentFrequency"
            value={form.paymentFrequency}
            options={paymentFrequencyOptions}
            onChange={(e) => onChange('paymentFrequency', e.value)}
            placeholder={intl.formatMessage({ id: 'coach.plan.paymentFrequency.placeholder' })}
          />
        </div>
      </div>
    </Dialog>
  );
}

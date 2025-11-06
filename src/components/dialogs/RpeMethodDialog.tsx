import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { useIntl } from 'react-intl';
import { RpeMethodForm } from '../../hooks/dialogs/useRpeMethodDialog';

interface Props {
  visible: boolean;
  loading?: boolean;
  mode: 'create' | 'edit';
  form: RpeMethodForm;
  onHide: () => void;
  onChange: (patch: Partial<RpeMethodForm>) => void;
  onGenerateValues: () => void;
  onAddValue: () => void;
  onUpdateValue: (index: number, patch: Partial<RpeMethodForm['valuesMeta'][number]>) => void;
  onRemoveValue: (index: number) => void;
  onSave: () => Promise<{ success: boolean; error?: string }>;
}

export function RpeMethodDialog({
  visible,
  loading,
  mode,
  form,
  onHide,
  onChange,
  onGenerateValues,
  onAddValue,
  onUpdateValue,
  onRemoveValue,
  onSave
}: Props) {
  const intl = useIntl();

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      modal
      draggable={false}
      resizable={false}
      className="responsive-dialog"
      style={{ width: '50vw' }}
      header={
        mode === 'create'
          ? intl.formatMessage({ id: 'coach.rpe.create' })
          : intl.formatMessage({ id: 'coach.rpe.edit' })
      }
      footer={
        <div className="flex justify-content-end gap-2">
          <Button label={intl.formatMessage({ id: 'common.cancel' })} className="p-button-text" onClick={onHide} />
          <Button
            label={intl.formatMessage({ id: 'common.save' })}
            icon="pi pi-check"
            onClick={onSave}
            loading={loading}
          />
        </div>
      }
    >
      <div className="p-fluid flex flex-column gap-3">
        <div className="field">
          <label className="block mb-2">{intl.formatMessage({ id: 'coach.rpe.name' })}</label>
          <InputText value={form.name} onChange={(e) => onChange({ name: e.target.value })} />
        </div>
        <div className="grid">
          <div className="col-12 md:col-4">
            <label className="block mb-2">{intl.formatMessage({ id: 'coach.rpe.minValue' })}</label>
            <InputNumber
              value={form.minValue}
              onValueChange={(e) => onChange({ minValue: e.value ?? 0 })}
              className="w-full"
            />
          </div>
          <div className="col-12 md:col-4">
            <label className="block mb-2">{intl.formatMessage({ id: 'coach.rpe.maxValue' })}</label>
            <InputNumber
              value={form.maxValue}
              onValueChange={(e) => onChange({ maxValue: e.value ?? 0 })}
              className="w-full"
            />
          </div>
          <div className="col-12 md:col-4">
            <label className="block mb-2">{intl.formatMessage({ id: 'coach.rpe.step' })}</label>
            <InputNumber value={form.step} onValueChange={(e) => onChange({ step: e.value ?? 1 })} className="w-full" />
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            label={intl.formatMessage({ id: 'coach.rpe.generateValues' })}
            icon="pi pi-cog"
            onClick={onGenerateValues}
          />
          <Button
            label={intl.formatMessage({ id: 'coach.rpe.addValue' })}
            icon="pi pi-plus"
            className="p-button-outlined"
            onClick={onAddValue}
          />
        </div>

        <div className="flex flex-column gap-2">
          {form.valuesMeta.map((vm, idx) => (
            <div key={idx} className="grid align-items-center">
              <div className="col-4">
                <InputNumber
                  value={vm.value}
                  onValueChange={(e) => onUpdateValue(idx, { value: e.value ?? 0 })}
                  className="w-full"
                />
              </div>
              <div className="col-4">
                <InputText
                  value={vm.color || ''}
                  onChange={(e) => onUpdateValue(idx, { color: e.target.value })}
                  placeholder="#color"
                />
              </div>
              <div className="col-3">
                <InputText
                  value={vm.emoji || ''}
                  onChange={(e) => onUpdateValue(idx, { emoji: e.target.value })}
                  placeholder=":)"
                />
              </div>
              <div className="col-1 flex justify-content-end">
                <Button
                  icon="pi pi-trash"
                  className="p-button-text p-button-danger"
                  onClick={() => onRemoveValue(idx)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Dialog>
  );
}

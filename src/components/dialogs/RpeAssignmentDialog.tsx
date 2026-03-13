import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { useIntl } from 'react-intl';

interface Option {
  label: string;
  value: number;
}

interface Props {
  visible: boolean;
  loading?: boolean;
  types: { label: string; value: string }[];
  selectedType: string | null;
  onChangeType: (type: string | null) => void;
  targets: Option[];
  selectedTargetId: number | null;
  onChangeTargetId: (id: number | null) => void;
  rpeMethods: Option[];
  selectedRpeMethodId: number | null;
  onChangeRpeMethodId: (id: number | null) => void;
  onHide: () => void;
  onAssign: () => Promise<{ success: boolean; error?: string }>;
}

export function RpeAssignmentDialog({
  visible,
  loading,
  types,
  selectedType,
  onChangeType,
  targets,
  selectedTargetId,
  onChangeTargetId,
  rpeMethods,
  selectedRpeMethodId,
  onChangeRpeMethodId,
  onHide,
  onAssign
}: Props) {
  const intl = useIntl();

  const canAssign = Boolean(selectedType && selectedTargetId && selectedRpeMethodId);

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      modal
      draggable={false}
      resizable={false}
      className="responsive-dialog"
      style={{ width: '50vw' }}
      header={intl.formatMessage({ id: 'coach.assignRpeMethod' })}
      footer={
        <div className="flex justify-content-end gap-2">
          <Button label={intl.formatMessage({ id: 'common.cancel' })} className="p-button-text" onClick={onHide} />
          <Button
            label={intl.formatMessage({ id: 'common.assign' })}
            icon="pi pi-check"
            onClick={onAssign}
            disabled={!canAssign}
            loading={loading}
          />
        </div>
      }
    >
      <div className="p-fluid flex flex-column gap-3">
        <div>
          <label className="block mb-2">{intl.formatMessage({ id: 'coach.rpe.assign.type' })}</label>
          <Dropdown value={selectedType} options={types} onChange={(e) => onChangeType(e.value)} className="w-full" />
        </div>
        <div>
          <label className="block mb-2">{intl.formatMessage({ id: 'coach.rpe.assign.target' })}</label>
          <Dropdown
            value={selectedTargetId}
            options={targets}
            onChange={(e) => onChangeTargetId(e.value)}
            className="w-full"
          />
        </div>
        <div>
          <label className="block mb-2">{intl.formatMessage({ id: 'coach.rpe.assign.rpe' })}</label>
          <Dropdown
            value={selectedRpeMethodId}
            options={rpeMethods}
            onChange={(e) => onChangeRpeMethodId(e.value)}
            className="w-full"
          />
        </div>
      </div>
    </Dialog>
  );
}

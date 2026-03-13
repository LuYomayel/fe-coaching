import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { useIntl } from 'react-intl';
import { IRpeMethod } from '../../types/rpe/rpe-method-assigned';

interface AssignWorkoutDialogProps {
  visible: boolean;
  onHide: () => void;
  selectedWorkouts: any[];
  selectedClient: any;
  setSelectedClient: (client: any) => void;
  students: any[];
  rpeMethods: IRpeMethod[];
  selectedRpeMethod: IRpeMethod | null;
  setSelectedRpeMethod: (method: IRpeMethod | null) => void;
  onAssign: () => void;
}

export function AssignWorkoutDialog({
  visible,
  onHide,
  selectedWorkouts,
  selectedClient,
  setSelectedClient,
  students,
  rpeMethods,
  selectedRpeMethod,
  setSelectedRpeMethod,
  onAssign
}: AssignWorkoutDialogProps) {
  const intl = useIntl();

  return (
    <Dialog
      dismissableMask={true}
      modal
      draggable={false}
      resizable={false}
      className="responsive-dialog"
      header={intl.formatMessage({ id: 'coach.assign.dialog.header' })}
      visible={visible}
      style={{ width: '50vw' }}
      onHide={onHide}
    >
      <div className="flex flex-column gap-3">
        <div>
          <label className="block mb-2">Planes seleccionados:</label>
          <ul className="list-none p-0 m-0">
            {selectedWorkouts.map((workout) => (
              <li key={workout.id} className="mb-2">
                {workout.planName}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <label className="block mb-2">{intl.formatMessage({ id: 'coach.assign.selectClient' })}</label>
          <Dropdown
            value={selectedClient}
            options={students}
            onChange={(e) => setSelectedClient(e.value)}
            optionLabel="name"
            placeholder={intl.formatMessage({ id: 'coach.assign.selectClient' })}
            className="w-full"
          />
        </div>
        <div>
          <label className="block mb-2">
            {intl.formatMessage({ id: 'coach.assign.selectRpeMethod', defaultMessage: 'Método de Medición RPE' })}
          </label>
          <Dropdown
            value={selectedRpeMethod}
            options={rpeMethods}
            onChange={(e) => setSelectedRpeMethod(e.value)}
            optionLabel="name"
            placeholder={intl.formatMessage({
              id: 'coach.assign.selectRpeMethodPlaceholder',
              defaultMessage: 'Seleccionar método RPE'
            })}
            className="w-full"
          />
        </div>
        <Button
          label={intl.formatMessage({ id: 'coach.assign.confirm' })}
          icon="pi pi-check"
          onClick={onAssign}
          className="w-full"
        />
      </div>
    </Dialog>
  );
}

import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { useIntl } from 'react-intl';

interface AssignWorkoutDialogProps {
  visible: boolean;
  onHide: () => void;
  selectedWorkouts: any[];
  selectedClient: any;
  setSelectedClient: (client: any) => void;
  students: any[];
  onAssign: () => void;
}

export function AssignWorkoutDialog({
  visible,
  onHide,
  selectedWorkouts,
  selectedClient,
  setSelectedClient,
  students,
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

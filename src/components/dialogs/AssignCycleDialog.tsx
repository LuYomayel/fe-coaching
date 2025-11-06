import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Divider } from 'primereact/divider';
import { useIntl } from 'react-intl';

interface AssignCycleDialogProps {
  visible: boolean;
  onHide: () => void;
  selectedCycle: any;
  selectedClient: any;
  setSelectedClient: (client: any) => void;
  startDate: Date | null;
  setStartDate: (date: Date | null) => void;
  endDate: Date | null;
  setEndDate: (date: Date | null) => void;
  onAssign: () => void;
  students: any[];
}

export function AssignCycleDialog({
  visible,
  onHide,
  selectedCycle,
  selectedClient,
  setSelectedClient,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onAssign,
  students
}: AssignCycleDialogProps) {
  const intl = useIntl();

  const handleStartDateChange = (e: any) => {
    setStartDate(e.value);
    if (e.value && selectedCycle) {
      const endDateNew = new Date(e.value);
      if (selectedCycle.isDurationInMonths) {
        endDateNew.setMonth(endDateNew.getMonth() + selectedCycle.duration);
      } else {
        endDateNew.setDate(endDateNew.getDate() + selectedCycle.duration * 7);
      }
      setEndDate(endDateNew);
    }
  };

  return (
    <Dialog
      dismissableMask={true}
      modal
      draggable={false}
      resizable={false}
      className="responsive-dialog"
      header={intl.formatMessage({ id: 'coach.assign.cycle.dialog.header' })}
      visible={visible}
      style={{ width: '50vw' }}
      onHide={onHide}
    >
      <div className="flex flex-column gap-3">
        <div className="flex gap-2">
          <div className="w-full">
            <label className="block mb-2">{intl.formatMessage({ id: 'coach.assign.dialog.selectedCycle' })}</label>
            <p>{selectedCycle?.name}</p>
            <p>
              {selectedCycle?.duration}{' '}
              {selectedCycle?.isDurationInMonths
                ? intl.formatMessage({ id: 'plansPage.months' })
                : intl.formatMessage({ id: 'plansPage.weeks' })}{' '}
              ({selectedCycle?.isDurationInMonths ? selectedCycle?.duration * 4 : selectedCycle?.duration}{' '}
              {intl.formatMessage({ id: 'plansPage.weeks' })})
            </p>
          </div>
          <div className="w-full">
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
        </div>
        <Divider />
        <div className="flex gap-2">
          <div className="w-full">
            <label className="block mb-2">{intl.formatMessage({ id: 'startDate' })}</label>
            <Calendar
              value={startDate}
              onChange={handleStartDateChange}
              showIcon
              className="w-full"
              locale={intl.locale}
            />
          </div>
          <div className="w-full">
            <label className="block mb-2">{intl.formatMessage({ id: 'endDate' })}</label>
            <Calendar value={endDate} disabled showIcon className="w-full" locale={intl.locale} />
          </div>
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

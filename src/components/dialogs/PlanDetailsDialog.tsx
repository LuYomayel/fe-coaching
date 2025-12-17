import React from 'react';
import { Dialog } from 'primereact/dialog';
import { useIntl } from 'react-intl';
import PlanDetails from './PlanDetails';

interface PlanDetailsDialogProps {
  visible: boolean;
  onHide: () => void;
  planId: number | null;
  clientId: string;
  setRefreshKey: (value: number | ((prev: number) => number)) => void;
  setLoading: (loading: boolean) => void;
}

export const PlanDetailsDialog: React.FC<PlanDetailsDialogProps> = ({
  visible,
  onHide,
  planId,
  clientId,
  setRefreshKey,
  setLoading
}) => {
  const intl = useIntl();

  return (
    <Dialog
      header={intl.formatMessage({ id: 'dashboard.dialog.planDetails' }, { defaultMessage: 'Detalles del Plan' })}
      dismissableMask
      draggable={false}
      resizable={false}
      visible={visible}
      style={{ width: '90vw', maxWidth: '1200px' }}
      onHide={onHide}
      className="plan-details-dialog"
    >
      {planId && (
        <PlanDetails
          planId={planId}
          visible={visible}
          setPlanDetailsVisible={(value: boolean) => !value && onHide()}
          setRefreshKey={setRefreshKey}
          setLoading={setLoading}
          isTemplate={false}
          clientId={clientId}
        />
      )}
    </Dialog>
  );
};

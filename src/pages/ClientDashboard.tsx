import React, { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { TabView, TabPanel } from 'primereact/tabview';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { useParams } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { useSpinner } from '../utils/GlobalSpinner';
import { fetchClientByClientId } from '../services/usersService';
import NewWorkoutTable from '../components/NewWorkoutTable';
import { useIntl, FormattedMessage } from 'react-intl';
import { Panel } from 'primereact/panel';
import StudentDialog from '../dialogs/StudentDialog';
import { Tooltip } from 'primereact/tooltip';
import { CalendarTab } from '../components/client/CalendarTab';

export interface ClientData {
  id?: number;
  name?: string;
  email?: string;
  profileImage?: string;
  birthdate?: string;
  fitnessGoal?: string;
  activityLevel?: string;
  gender?: string;
  weight?: number;
  height?: number;
  contactMethod?: string;
  location?: string | null;
  coach?: {
    id: number | null;
  };
  user?: {
    subscription?: {
      status?: string;
    };
  };
  trainingType?: string;
}

interface PanelHeaderOptions {
  className: string;
}

const ClientDashboard: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const { showToast } = useToast();
  const { setLoading } = useSpinner();
  const intl = useIntl();
  const [isNewStudentDialogVisible, setIsNewStudentDialogVisible] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(1);
  const [isExcelOnlyMode, setIsExcelOnlyMode] = useState<boolean>(false);

  // Fetch data when the component mounts or refreshKey changes
  useEffect(() => {
    if (!clientId) return;

    setLoading(true);

    fetchClientByClientId(clientId)
      .then(({ data }) => {
        setClientData(data);
        console.log('clientData', data);
      })
      .catch((error: Error) => {
        showToast('error', 'Error fetching client data', error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [clientId, refreshKey, setLoading, showToast]);

  const handleNewStudentDialogHide = (): void => {
    setIsNewStudentDialogVisible(false);
  };

  const handleNewStudentDialogShow = (): void => {
    setIsNewStudentDialogVisible(true);
  };

  const renderTabView = (): React.JSX.Element => {
    return (
      <TabView>
        <TabPanel header={intl.formatMessage({ id: 'clientDashboard.tabs.calendar' })}>
          {clientData && (
            <CalendarTab
              clientId={clientId || ''}
              clientData={clientData}
              refreshKey={refreshKey}
              setRefreshKey={setRefreshKey}
            />
          )}
        </TabPanel>

        <TabPanel header={intl.formatMessage({ id: 'clientDashboard.tabs.excelView' })}>
          <div className="flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
            <Card className="w-full coming-soon-card">
              <div className="text-center">
                <i className="pi pi-clock text-5xl mb-3 text-primary-300"></i>
                <h2 className="text-color">
                  <FormattedMessage id="common.comingSoon" defaultMessage="Próximamente" />
                </h2>
                <p className="text-lg text-color-secondary">
                  <FormattedMessage
                    id="clientDashboard.comingSoon.excelView"
                    defaultMessage="Estamos trabajando en una vista Excel con estadísticas y métricas de progreso."
                  />
                </p>
              </div>
            </Card>
          </div>
        </TabPanel>

        <TabPanel
          header={intl.formatMessage({ id: 'clientDashboard.tabs.dashboard' }, { defaultMessage: 'Dashboard' })}
        >
          <div className="flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
            <Card className="w-full coming-soon-card">
              <div className="text-center">
                <i className="pi pi-clock text-5xl mb-3 text-primary-300"></i>
                <h2 className="text-color">
                  <FormattedMessage id="common.comingSoon" defaultMessage="Próximamente" />
                </h2>
                <p className="text-lg text-color-secondary">
                  <FormattedMessage
                    id="clientDashboard.comingSoon.dashboard"
                    defaultMessage="Estamos trabajando en un dashboard con estadísticas y métricas de progreso."
                  />
                </p>
              </div>
            </Card>
          </div>
        </TabPanel>

        <TabPanel
          header={intl.formatMessage(
            { id: 'clientDashboard.tabs.medicalHistory' },
            { defaultMessage: 'Historia Clínica' }
          )}
        >
          <div className="flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
            <Card className="w-full coming-soon-card">
              <div className="text-center">
                <i className="pi pi-heart text-5xl mb-3 text-primary-300"></i>
                <h2 className="text-color">
                  <FormattedMessage id="common.comingSoon" defaultMessage="Próximamente" />
                </h2>
                <p className="text-lg text-color-secondary">
                  <FormattedMessage
                    id="clientDashboard.comingSoon.medicalHistory"
                    defaultMessage="Próximamente podrás gestionar la historia clínica de tus clientes."
                  />
                </p>
              </div>
            </Card>
          </div>
        </TabPanel>

        <TabPanel
          header={intl.formatMessage({ id: 'clientDashboard.tabs.userData' }, { defaultMessage: 'Datos del Usuario' })}
        >
          <div className="flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
            <Card className="w-full coming-soon-card">
              <div className="text-center">
                <i className="pi pi-user text-5xl mb-3 text-primary-300"></i>
                <h2 className="text-color">
                  <FormattedMessage id="common.comingSoon" defaultMessage="Próximamente" />
                </h2>
                <p className="text-lg text-color-secondary">
                  <FormattedMessage
                    id="clientDashboard.comingSoon.userData"
                    defaultMessage="Próximamente podrás ver y editar todos los datos del usuario desde aquí."
                  />
                </p>
              </div>
            </Card>
          </div>
        </TabPanel>
      </TabView>
    );
  };

  const calculateAge = (birthdate: string | undefined): number | null => {
    if (!birthdate) return null;

    const today = new Date();
    const birthDate = new Date(birthdate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  };

  // Header personalizado para el panel principal
  const headerTemplate = (options: PanelHeaderOptions): React.JSX.Element => {
    const className = `${options.className} flex justify-content-start align-items-center`;
    return (
      <div className={className}>
        <div className="flex align-items-center gap-3">
          <div className="relative">
            <img
              src={clientData?.profileImage || '/image.webp'}
              alt={clientData?.name || 'Profile'}
              className="w-4rem h-4rem border-circle"
              style={{ objectFit: 'cover' }}
              onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                e.currentTarget.src =
                  'https://t4.ftcdn.net/jpg/05/49/98/39/360_F_549983970_bRCkYfk0P6PP5fKbMhZMIb07mCJ6esXL.jpg';
              }}
            />
            {clientData &&
              [
                'fitnessGoal',
                'activityLevel',
                'gender',
                'weight',
                'height',
                'birthdate',
                'contactMethod',
                'location'
              ].some((field) => !clientData[field as keyof ClientData]) && (
                <>
                  <Tooltip target=".missing-data-indicator" />
                  <div
                    className="missing-data-indicator absolute bottom-0 right-0 bg-white border-circle w-1rem h-1rem flex align-items-center justify-content-center border-1 border-red-500"
                    data-pr-tooltip={intl.formatMessage({ id: 'common.missingData' })}
                    data-pr-position="bottom"
                  >
                    <i className="pi pi-exclamation-triangle text-red-500 text-xs"></i>
                  </div>
                </>
              )}
          </div>
          <div className="flex flex-column">
            <h4 className="m-0 text-xl font-bold">{clientData?.name}</h4>
            {clientData?.birthdate && (
              <p className="m-0 text-600 text-sm">
                {intl.formatMessage({ id: 'common.age' })}:&nbsp;
                {calculateAge(clientData.birthdate)}&nbsp;
                {intl.formatMessage({ id: 'common.years' })}
              </p>
            )}
          </div>
        </div>
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-text p-button-sm"
          onClick={() => handleNewStudentDialogShow()}
          tooltip={intl.formatMessage({ id: 'students.actions.editProfile' })}
        />
      </div>
    );
  };

  return (
    <div className="client-dashboard p-1">
      {isExcelOnlyMode ? (
        // Modo solo Excel - pantalla completa sin header
        <div className="excel-fullscreen-mode">
          {clientData ? (
            <NewWorkoutTable
              cycleOptions={[]}
              clientData={clientData}
              isExcelOnlyMode={true}
              clientName={clientData?.name}
              onToggleExcelMode={() => setIsExcelOnlyMode(false)}
            />
          ) : (
            <div className="flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
              <div className="text-center">
                <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem', marginBottom: '1rem' }}></i>
                <p>{intl.formatMessage({ id: 'common.loading' }, { defaultMessage: 'Cargando...' })}</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Modo dashboard completo
        <>
          <Panel headerTemplate={headerTemplate} className="panel-client-dashboard">
            {renderTabView()}
          </Panel>
        </>
      )}

      <Dialog
        header={intl.formatMessage({ id: 'students.dialog.editProfile' })}
        visible={isNewStudentDialogVisible}
        onHide={handleNewStudentDialogHide}
        draggable={false}
        resizable={false}
        dismissableMask
        className="responsive-dialog"
        style={{ width: '50vw' }}
      >
        <StudentDialog
          onClose={handleNewStudentDialogHide}
          setRefreshKey={setRefreshKey}
          studentData={clientData}
          visible={isNewStudentDialogVisible}
        />
      </Dialog>
    </div>
  );
};

export default ClientDashboard;

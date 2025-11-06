import React, { useState, useEffect, useContext } from 'react';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tooltip } from 'primereact/tooltip';
import { formatDate } from '../utils/UtilFunctions';
import { UserContext } from '../contexts/UserContext';
import { useSpinner } from '../utils/GlobalSpinner';
import { useToast } from '../contexts/ToastContext';
import { fetchLastTimeTrained, fetchHowLongToFinishCycle, fetchTrainingFrequency } from '../services/workoutService';
import { fetchClientsPaymentStatus } from '../services/subscriptionService';
import { useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';

export default function CoachHomePage() {
  const { setLoading } = useSpinner();
  const { showToast } = useToast();
  const { coach, user } = useContext(UserContext);
  const navigate = useNavigate();
  const intl = useIntl();

  // === Estados de datos de servicios ===
  const [lastTimeTrainedData, setLastTimeTrainedData] = useState([]);
  const [howLongToFinishCycleData, setHowLongToFinishCycleData] = useState([]);
  const [trainingFrequencyData, setTrainingFrequencyData] = useState([]);
  const [paymentStatusData, setPaymentStatusData] = useState([]);

  // === Datos combinados para el dashboard ===
  const [combinedClientData, setCombinedClientData] = useState([]);

  // Obtener la fecha y hora actual para mostrarla en el dashboard
  const currentDate = new Date();
  const formattedDate = new Intl.DateTimeFormat(intl.locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: true
  }).format(currentDate);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [lastTimeTrained, howLongToFinishCycle, trainingFrequency, clientsPaymentStatus] = await Promise.all([
          fetchLastTimeTrained(coach.id),
          fetchHowLongToFinishCycle(coach.id),
          fetchTrainingFrequency(coach.id),
          fetchClientsPaymentStatus(coach.id)
        ]);

        setLastTimeTrainedData(lastTimeTrained.data);
        setHowLongToFinishCycleData(howLongToFinishCycle.data);
        setTrainingFrequencyData(trainingFrequency.data);
        setPaymentStatusData(clientsPaymentStatus.data);
      } catch (error) {
        showToast({
          severity: 'error',
          summary: intl.formatMessage({ id: 'common.error' }),
          detail: intl.formatMessage({ id: 'coach.home.fetchError' })
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [coach.id, setLoading, showToast, intl]);

  // Unificar la información en un solo array
  useEffect(() => {
    if (
      !lastTimeTrainedData.length &&
      !howLongToFinishCycleData.length &&
      !trainingFrequencyData.length &&
      !paymentStatusData.length
    ) {
      return;
    }

    const merged = lastTimeTrainedData.map((lt) => {
      const cycleData = howLongToFinishCycleData.find((cd) => cd.clientId === lt.clientId);
      const freqData = trainingFrequencyData.find((fd) => fd.clientId === lt.clientId);
      const payData = paymentStatusData.find((pd) => pd.clientId === lt.clientId);

      return {
        clientId: lt.clientId,
        clientName: lt.clientName,
        lastTimeTrained: lt.lastTimeTrained,
        daysLeft: cycleData ? cycleData.daysLeft : null,
        trainingSessionsLast30Days: freqData ? freqData.trainingSessionsLast30Days : 0,
        trainingSessionsLast15Days: freqData ? freqData.trainingSessionsLast15Days : 0,
        trainingSessionsLast7Days: freqData ? freqData.trainingSessionsLast7Days : 0,
        isPaid: payData ? payData.isPaid : false,
        lastPaymentDate: payData ? payData.lastPaymentDate : null,
        nextPaymentDate: payData ? payData.nextPaymentDate : null,
        paymentStatus: payData ? payData.status : null
      };
    });

    setCombinedClientData(merged);
  }, [lastTimeTrainedData, howLongToFinishCycleData, trainingFrequencyData, paymentStatusData]);

  // -- Datos para tarjetas / listados
  const totalClients = combinedClientData.length;
  const totalPaid = combinedClientData.filter((c) => c.isPaid).length;
  const unpaidClients = combinedClientData.filter((c) => !c.isPaid);
  const clientsWithDaysLeft = combinedClientData
    .filter((c) => c.daysLeft !== null)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 5);
  const mostActiveClients = [...combinedClientData]
    .sort((a, b) => b.trainingSessionsLast7Days - a.trainingSessionsLast7Days)
    .slice(0, 5);

  // Función para navegar a la página de gestión de estudiantes
  const goToManageStudents = () => {
    navigate('/manage-students');
  };

  // Función para navegar al perfil de usuario
  const viewClientProfile = (clientId) => {
    navigate(`/client-dashboard/${clientId}`);
  };

  // Función para determinar el color del status de pago
  const getStatusColor = (status) => {
    if (!status) return 'inactive';

    switch (status.toLowerCase()) {
      case 'active':
        return 'active';
      case 'pending':
        return 'pending';
      default:
        return 'inactive';
    }
  };

  // Renderizar el status de pago para la tabla
  const paymentStatusTemplate = (rowData) => {
    return (
      <span className={`status-badge ${getStatusColor(rowData.paymentStatus)}`}>
        <i className={`pi ${rowData.isPaid ? 'pi-check-circle' : 'pi-times-circle'}`}></i>
        {rowData.paymentStatus || intl.formatMessage({ id: 'common.inactive' })}
      </span>
    );
  };

  // Renderizar la última fecha de entrenamiento
  const lastTrainedTemplate = (rowData) => {
    const daysAgo = rowData.lastTimeTrained
      ? Math.floor((new Date() - new Date(rowData.lastTimeTrained)) / (1000 * 60 * 60 * 24))
      : null;

    return (
      <div>
        {rowData.lastTimeTrained ? (
          <>
            <div>{formatDate(rowData.lastTimeTrained)}</div>
            <div className={`text-sm ${daysAgo > 7 ? 'client-danger' : 'client-success'}`}>
              {daysAgo === 0
                ? intl.formatMessage({ id: 'coach.home.today' })
                : daysAgo === 1
                  ? intl.formatMessage({ id: 'coach.home.yesterday' })
                  : intl.formatMessage({ id: 'coach.home.daysAgo' }, { days: daysAgo })}
            </div>
          </>
        ) : (
          <span className="client-danger">---</span>
        )}
      </div>
    );
  };

  // Renderizar los días restantes
  const daysLeftTemplate = (rowData) => {
    if (rowData.daysLeft === null) return <span>---</span>;

    const colorClass =
      rowData.daysLeft < 3 ? 'client-danger' : rowData.daysLeft < 7 ? 'client-warning' : 'client-success';

    return <span className={colorClass}>{rowData.daysLeft}</span>;
  };

  // Renderizar acciones de cliente
  const clientActionsTemplate = (rowData) => {
    return (
      <div className="flex gap-2 justify-content-center">
        <Button
          icon="pi pi-eye"
          className="p-button-rounded p-button-outlined p-button-sm"
          tooltip={intl.formatMessage({ id: 'common.view' })}
          tooltipOptions={{ position: 'top' }}
          onClick={() => viewClientProfile(rowData.clientId)}
        />
      </div>
    );
  };

  return (
    <div className="p-4 surface-ground min-h-screen">
      <Tooltip target=".custom-tooltip" />

      {/* Cabecera del dashboard */}
      <div className="surface-card border-round-lg p-4 mb-4 shadow-2">
        <div className="flex flex-column lg:flex-row justify-content-between align-items-start lg:align-items-center gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-900 mb-2 m-0">
              {intl.formatMessage({ id: 'coach.home.welcome' }, { name: coach?.name || user?.name || 'Coach' })}
            </h1>
            <p className="text-600 text-lg m-0">{formattedDate}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="flex align-items-center gap-2 p-3 surface-100 border-round-lg">
              <div className="w-3rem h-3rem bg-primary-100 border-round-3xl flex align-items-center justify-content-center">
                <i className="pi pi-users text-primary text-xl"></i>
              </div>
              <div>
                <div className="text-2xl font-bold text-900">{totalClients}</div>
                <div className="text-sm text-600">{intl.formatMessage({ id: 'coach.home.totalStudents' })}</div>
              </div>
            </div>

            <div className="flex align-items-center gap-2 p-3 surface-100 border-round-lg">
              <div className="w-3rem h-3rem bg-green-100 border-round-3xl flex align-items-center justify-content-center">
                <i className="pi pi-check-circle text-green-500 text-xl"></i>
              </div>
              <div>
                <div className="text-2xl font-bold text-900">{totalPaid}</div>
                <div className="text-sm text-600">{intl.formatMessage({ id: 'coach.home.paidUp' })}</div>
              </div>
            </div>

            <div className="flex align-items-center gap-2 p-3 surface-100 border-round-lg">
              <div className="w-3rem h-3rem bg-orange-100 border-round-3xl flex align-items-center justify-content-center">
                <i className="pi pi-exclamation-triangle text-orange-500 text-xl"></i>
              </div>
              <div>
                <div className="text-2xl font-bold text-900">{unpaidClients.length}</div>
                <div className="text-sm text-600">{intl.formatMessage({ id: 'coach.home.unpaidClients' })}</div>
              </div>
            </div>

            <div className="flex align-items-center">
              <Button
                label={intl.formatMessage({ id: 'coach.home.manageStudents' })}
                icon="pi pi-user-edit"
                className="p-button-rounded p-button-sm"
                onClick={goToManageStudents}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Cards principales del dashboard */}
      <div className="grid">
        {/* Card 1: Clientes sin pago */}
        <div className="col-12 md:col-6 lg:col-3">
          <Card
            className="h-full"
            title={
              <div className="flex align-items-center gap-2">
                <i className="pi pi-dollar text-primary"></i>
                <span>{intl.formatMessage({ id: 'coach.home.unpaidClients' })}</span>
              </div>
            }
          >
            {unpaidClients.length > 0 ? (
              <div className="flex flex-column gap-2">
                {unpaidClients.map((client) => (
                  <div
                    key={client.clientId}
                    className="flex align-items-center justify-content-between p-2 surface-100 border-round"
                  >
                    <div className="flex align-items-center gap-2">
                      <i className="pi pi-user text-600"></i>
                      <span className="text-900 font-medium">{client.clientName}</span>
                    </div>
                    <Button
                      icon="pi pi-eye"
                      className="p-button-rounded p-button-outlined p-button-sm"
                      onClick={() => viewClientProfile(client.clientId)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-column align-items-center justify-content-center p-4 text-center">
                <i className="pi pi-check-circle text-green-500 text-4xl mb-3"></i>
                <p className="text-600 m-0">{intl.formatMessage({ id: 'coach.home.allPaid' })}</p>
              </div>
            )}
          </Card>
        </div>

        {/* Card 2: Días restantes para finalizar ciclo */}
        <div className="col-12 md:col-6 lg:col-3">
          <Card
            className="h-full"
            title={
              <div className="flex align-items-center gap-2">
                <i className="pi pi-calendar text-primary"></i>
                <span>{intl.formatMessage({ id: 'coach.home.daysLeft' })}</span>
              </div>
            }
          >
            {clientsWithDaysLeft.length > 0 ? (
              <div className="flex flex-column gap-2">
                {clientsWithDaysLeft.map((client) => (
                  <div
                    key={client.clientId}
                    className="flex align-items-center justify-content-between p-2 surface-100 border-round"
                  >
                    <div className="flex align-items-center gap-2">
                      <i className="pi pi-user text-600"></i>
                      <span className="text-900 font-medium">{client.clientName}</span>
                    </div>
                    <span
                      className={`px-2 py-1 border-round text-sm font-bold ${
                        client.daysLeft < 3
                          ? 'bg-red-100 text-red-700'
                          : client.daysLeft < 7
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {client.daysLeft} {intl.formatMessage({ id: 'common.days' })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-column align-items-center justify-content-center p-4 text-center">
                <i className="pi pi-info-circle text-blue-500 text-4xl mb-3"></i>
                <p className="text-600 m-0">{intl.formatMessage({ id: 'coach.home.noDaysLeftData' })}</p>
              </div>
            )}
          </Card>
        </div>

        {/* Card 3: Frecuencia de entrenamiento */}
        <div className="col-12 md:col-6 lg:col-3">
          <Card
            className="h-full"
            title={
              <div className="flex align-items-center gap-2">
                <i className="pi pi-heart text-primary"></i>
                <span>{intl.formatMessage({ id: 'coach.home.last7daysFrequency' })}</span>
              </div>
            }
          >
            {mostActiveClients.length > 0 ? (
              <div className="flex flex-column gap-2">
                {mostActiveClients.map((client) => (
                  <div
                    key={client.clientId}
                    className="flex align-items-center justify-content-between p-2 surface-100 border-round"
                  >
                    <div className="flex align-items-center gap-2">
                      <i className="pi pi-user text-600"></i>
                      <span className="text-900 font-medium">{client.clientName}</span>
                    </div>
                    <span
                      className={`px-2 py-1 border-round text-sm font-bold ${
                        client.trainingSessionsLast7Days === 0
                          ? 'bg-red-100 text-red-700'
                          : client.trainingSessionsLast7Days < 3
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {client.trainingSessionsLast7Days} {intl.formatMessage({ id: 'coach.home.sessions' })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-column align-items-center justify-content-center p-4 text-center">
                <i className="pi pi-info-circle text-blue-500 text-4xl mb-3"></i>
                <p className="text-600 m-0">{intl.formatMessage({ id: 'coach.home.noFrequencyData7days' })}</p>
              </div>
            )}
          </Card>
        </div>

        {/* Card 4: Acciones rápidas */}
        <div className="col-12 md:col-6 lg:col-3">
          <Card
            className="h-full"
            title={
              <div className="flex align-items-center gap-2">
                <i className="pi pi-bolt text-primary"></i>
                <span>{intl.formatMessage({ id: 'coach.home.quickActions' })}</span>
              </div>
            }
          >
            <div className="flex flex-column gap-2">
              <Button
                label={intl.formatMessage({ id: 'coach.home.createWorkout' })}
                icon="pi pi-plus-circle"
                className="p-button-outlined w-full"
                onClick={() => navigate('/plans/create', { state: { changeToTemplate: false } })}
              />
              <Button
                label={intl.formatMessage({ id: 'coach.home.addExercise' })}
                icon="pi pi-plus"
                className="p-button-outlined p-button-secondary w-full"
                onClick={() => navigate('/coach/profile')}
              />
              <Button
                label={intl.formatMessage({ id: 'coach.home.viewProfile' })}
                icon="pi pi-user"
                className="p-button-outlined p-button-info w-full"
                onClick={() => navigate('/coach/profile')}
              />
            </div>
          </Card>
        </div>
      </div>

      {/* Tabla de resumen de clientes */}
      <Card className="mt-4">
        <DataTable
          value={combinedClientData}
          responsiveLayout="stack"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 20]}
          emptyMessage={intl.formatMessage({ id: 'coach.home.noClientsData' })}
          header={
            <div className="flex justify-content-between align-items-center">
              <h3 className="m-0 text-2xl font-bold text-900">
                {intl.formatMessage({ id: 'coach.home.clientsSummary' })}
              </h3>
              <Button
                label={intl.formatMessage({ id: 'coach.home.viewAll' })}
                icon="pi pi-external-link"
                className="p-button-text"
                onClick={goToManageStudents}
              />
            </div>
          }
        >
          <Column field="clientName" header={intl.formatMessage({ id: 'coach.home.table.clientName' })} sortable />
          <Column
            field="lastTimeTrained"
            header={intl.formatMessage({ id: 'coach.home.table.lastWorkout' })}
            body={lastTrainedTemplate}
            sortable
          />
          <Column
            field="daysLeft"
            header={intl.formatMessage({ id: 'coach.home.table.daysLeft' })}
            body={daysLeftTemplate}
            sortable
          />
          <Column
            field="trainingSessionsLast30Days"
            header={intl.formatMessage({ id: 'coach.home.table.last30days' })}
            sortable
          />
          <Column
            field="trainingSessionsLast7Days"
            header={intl.formatMessage({ id: 'coach.home.table.last7days' })}
            sortable
          />
          <Column
            field="paymentStatus"
            header={intl.formatMessage({ id: 'coach.home.table.subscriptionStatus' })}
            body={paymentStatusTemplate}
            sortable
          />
          <Column
            header={intl.formatMessage({ id: 'common.actions' })}
            body={clientActionsTemplate}
            style={{ width: '120px', textAlign: 'center' }}
          />
        </DataTable>
      </Card>
    </div>
  );
}

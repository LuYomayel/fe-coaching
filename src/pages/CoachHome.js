import React, { useState, useEffect, useContext } from 'react';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tooltip } from 'primereact/tooltip';
import { formatDate } from '../utils/UtilFunctions';
import { UserContext } from '../utils/UserContext';
import { useSpinner } from '../utils/GlobalSpinner';
import { useToast } from '../utils/ToastContext';
import { fetchLastTimeTrained, fetchHowLongToFinishCycle, fetchTrainingFrequency } from '../services/workoutService';
import { fetchClientsPaymentStatus } from '../services/subscriptionService';
import { useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';
import '../styles/CoachDashboard.css';

export default function CoachHomePage() {
  const { setLoading } = useSpinner();
  const showToast = useToast();
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

  // Obtener la fecha actual para mostrarla en el dashboard
  const currentDate = new Date();
  const formattedDate = new Intl.DateTimeFormat(intl.locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(currentDate);

  useEffect(() => {
    const date = new Date();
    console.log(date);
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
    <div className="coach-dashboard animate-fadeIn">
      <Tooltip target=".custom-tooltip" />

      {/* Cabecera del dashboard */}
      <div className="dashboard-header">
        <div className="dashboard-header-content">
          <div>
            <h1 className="welcome-message">
              {intl.formatMessage({ id: 'coach.home.welcome' }, { name: coach?.name || user?.name || 'Coach' })}
            </h1>
            <p className="date-display">{formattedDate}</p>
          </div>

          <div className="header-stats">
            <div className="header-stat-item">
              <div className="stat-value">
                <div className="stat-icon">
                  <i className="pi pi-users"></i>
                </div>
                {totalClients}
              </div>
              <div className="stat-label">{intl.formatMessage({ id: 'coach.home.totalStudents' })}</div>
            </div>

            <div className="header-stat-item">
              <div className="stat-value">
                <div className="stat-icon">
                  <i className="pi pi-check-circle"></i>
                </div>
                {totalPaid}
              </div>
              <div className="stat-label">{intl.formatMessage({ id: 'coach.home.paidUp' })}</div>
            </div>

            <div className="header-stat-item">
              <div className="stat-value">
                <div className="stat-icon">
                  <i className="pi pi-exclamation-triangle"></i>
                </div>
                {unpaidClients.length}
              </div>
              <div className="stat-label">{intl.formatMessage({ id: 'coach.home.unpaidClients' })}</div>
            </div>

            <div className="header-stat-item">
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
      <div className="stat-cards">
        {/* Card 1: Clientes sin pago */}
        <Card
          className="stat-card"
          title={
            <span>
              <i className="pi pi-dollar text-primary"></i> {intl.formatMessage({ id: 'coach.home.unpaidClients' })}
            </span>
          }
        >
          {unpaidClients.length > 0 ? (
            <ul className="client-list">
              {unpaidClients.map((client) => (
                <li key={client.clientId} className="client-item animate-fadeIn">
                  <span className="client-name">
                    <i className="pi pi-user"></i> {client.clientName}
                  </span>
                  <Button
                    icon="pi pi-eye"
                    className="p-button-rounded p-button-outlined p-button-sm"
                    onClick={() => viewClientProfile(client.clientId)}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-message">
              <i className="pi pi-check-circle"></i>
              <p>{intl.formatMessage({ id: 'coach.home.allPaid' })}</p>
            </div>
          )}
        </Card>

        {/* Card 2: Días restantes para finalizar ciclo */}
        <Card
          className="stat-card"
          title={
            <span>
              <i className="pi pi-calendar text-primary"></i> {intl.formatMessage({ id: 'coach.home.daysLeft' })}
            </span>
          }
        >
          {clientsWithDaysLeft.length > 0 ? (
            <ul className="client-list">
              {clientsWithDaysLeft.map((client) => (
                <li key={client.clientId} className="client-item animate-fadeIn">
                  <span className="client-name">
                    <i className="pi pi-user"></i> {client.clientName}
                  </span>
                  <span
                    className={`client-value ${
                      client.daysLeft < 3 ? 'client-danger' : client.daysLeft < 7 ? 'client-warning' : 'client-success'
                    }`}
                  >
                    {client.daysLeft} {intl.formatMessage({ id: 'common.days' })}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-message">
              <i className="pi pi-info-circle"></i>
              <p>{intl.formatMessage({ id: 'coach.home.noDaysLeftData' })}</p>
            </div>
          )}
        </Card>

        {/* Card 3: Frecuencia de entrenamiento */}
        <Card
          className="stat-card"
          title={
            <span>
              <i className="pi pi-heart text-primary"></i> {intl.formatMessage({ id: 'coach.home.last7daysFrequency' })}
            </span>
          }
        >
          {mostActiveClients.length > 0 ? (
            <ul className="client-list">
              {mostActiveClients.map((client) => (
                <li key={client.clientId} className="client-item animate-fadeIn">
                  <span className="client-name">
                    <i className="pi pi-user"></i> {client.clientName}
                  </span>
                  <span
                    className={`client-value ${
                      client.trainingSessionsLast7Days === 0
                        ? 'client-danger'
                        : client.trainingSessionsLast7Days < 3
                          ? 'client-warning'
                          : 'client-success'
                    }`}
                  >
                    {client.trainingSessionsLast7Days} {intl.formatMessage({ id: 'coach.home.sessions' })}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-message">
              <i className="pi pi-info-circle"></i>
              <p>{intl.formatMessage({ id: 'coach.home.noFrequencyData7days' })}</p>
            </div>
          )}
        </Card>

        {/* Card 4: Acciones rápidas */}
        <Card
          className="stat-card"
          title={
            <span>
              <i className="pi pi-bolt text-primary"></i> {intl.formatMessage({ id: 'coach.home.quickActions' })}
            </span>
          }
        >
          <div className="flex flex-column gap-2">
            <Button
              label={intl.formatMessage({ id: 'coach.home.createWorkout' })}
              icon="pi pi-plus-circle"
              className="p-button-outlined mb-2"
              onClick={() => navigate('/plans/create', { state: { changeToTemplate: false } })}
            />
            <Button
              label={intl.formatMessage({ id: 'coach.home.addExercise' })}
              icon="pi pi-plus"
              className="p-button-outlined p-button-secondary mb-2"
              onClick={() => navigate('/coach/profile')}
            />
            <Button
              label={intl.formatMessage({ id: 'coach.home.viewProfile' })}
              icon="pi pi-user"
              className="p-button-outlined p-button-info"
              onClick={() => navigate('/coach/profile')}
            />
          </div>
        </Card>
      </div>

      {/* Tabla de resumen de clientes */}
      <Card className="summary-card surface-card">
        <DataTable
          value={combinedClientData}
          responsiveLayout="stack"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 20]}
          className="summary-table"
          emptyMessage={intl.formatMessage({ id: 'coach.home.noClientsData' })}
          header={
            <div className="flex justify-content-between align-items-center">
              <h3 className="m-0">{intl.formatMessage({ id: 'coach.home.clientsSummary' })}</h3>
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

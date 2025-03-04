import React, { useState, useEffect, useContext } from 'react';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { formatDate } from '../utils/UtilFunctions';
import { UserContext } from '../utils/UserContext';
import { useSpinner } from '../utils/GlobalSpinner';
import { useToast } from '../utils/ToastContext';
import {
  fetchLastTimeTrained,
  fetchHowLongToFinishCycle,
  fetchTrainingFrequency
} from '../services/workoutService';
import { fetchClientsPaymentStatus } from '../services/subscriptionService';
import { useIntl } from 'react-intl';

export default function CoachHomePage() {
  const { setLoading } = useSpinner();
  const showToast = useToast();
  const { coach } = useContext(UserContext);

  const intl = useIntl();

  // === Estados de datos de servicios ===
  const [lastTimeTrainedData, setLastTimeTrainedData] = useState([]);
  const [howLongToFinishCycleData, setHowLongToFinishCycleData] = useState([]);
  const [trainingFrequencyData, setTrainingFrequencyData] = useState([]);
  const [paymentStatusData, setPaymentStatusData] = useState([]);

  // === Datos combinados para el dashboard ===
  const [combinedClientData, setCombinedClientData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [
          lastTimeTrained,
          howLongToFinishCycle,
          trainingFrequency,
          clientsPaymentStatus
        ] = await Promise.all([
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
      const cycleData = howLongToFinishCycleData.find(
        (cd) => cd.clientId === lt.clientId
      );
      const freqData = trainingFrequencyData.find(
        (fd) => fd.clientId === lt.clientId
      );
      const payData = paymentStatusData.find(
        (pd) => pd.clientId === lt.clientId
      );

      return {
        clientId: lt.clientId,
        clientName: lt.clientName,
        lastTimeTrained: lt.lastTimeTrained,
        daysLeft: cycleData ? cycleData.daysLeft : null,
        trainingSessionsLast30Days: freqData
          ? freqData.trainingSessionsLast30Days
          : 0,
        trainingSessionsLast15Days: freqData
          ? freqData.trainingSessionsLast15Days
          : 0,
        trainingSessionsLast7Days: freqData
          ? freqData.trainingSessionsLast7Days
          : 0,
        isPaid: payData ? payData.isPaid : false,
        lastPaymentDate: payData ? payData.lastPaymentDate : null,
        nextPaymentDate: payData ? payData.nextPaymentDate : null,
        paymentStatus: payData ? payData.status : null
      };
    });

    setCombinedClientData(merged);
  }, [
    lastTimeTrainedData,
    howLongToFinishCycleData,
    trainingFrequencyData,
    paymentStatusData
  ]);

  // -- Datos para tarjetas / listados
  const totalClients = combinedClientData.length;
  const totalPaid = combinedClientData.filter((c) => c.isPaid).length;
  const unpaidClients = combinedClientData.filter((c) => !c.isPaid);
  const clientsWithDaysLeft = combinedClientData.filter(
    (c) => c.daysLeft !== null
  );

  return (
    <div className="grid p-nogutter" style={{ padding: '1rem' }}>
      {/* 
        1) Card fusionada: Alumnos Totales + Al Día
      */}
      <div className="col-12 md:col-6 lg:col-3" style={{ padding: '0.5rem' }}>
        <Card title={intl.formatMessage({ id: 'coach.home.studentsStatus' })}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <p style={{ fontSize: '1.1rem', margin: '0.3rem' }}>
              {intl.formatMessage({ id: 'coach.home.totalStudents' })}:{' '}
              {totalClients}
            </p>
            <p style={{ fontSize: '1.1rem', margin: '0.3rem' }}>
              {intl.formatMessage({ id: 'coach.home.paidUp' })}: {totalPaid}
            </p>
          </div>
        </Card>
      </div>

      {/*
        2) Card con la lista de clientes que no están al día con el pago
      */}
      <div className="col-12 md:col-6 lg:col-3" style={{ padding: '0.5rem' }}>
        <Card title={intl.formatMessage({ id: 'coach.home.unpaidClients' })}>
          {unpaidClients.length > 0 ? (
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {unpaidClients.map((client) => (
                <li key={client.clientId} style={{ marginBottom: '0.5rem' }}>
                  {client.clientName}
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ margin: 0 }}>
              {intl.formatMessage({ id: 'coach.home.allPaid' })}
            </p>
          )}
        </Card>
      </div>

      {/*
        3) Card: Listado de alumnos y cuánto le falta a cada uno
           para terminar su ciclo de entrenamiento
      */}
      <div className="col-12 md:col-6 lg:col-3" style={{ padding: '0.5rem' }}>
        <Card title={intl.formatMessage({ id: 'coach.home.daysLeft' })}>
          {clientsWithDaysLeft.length > 0 ? (
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {clientsWithDaysLeft.map((client) => (
                <li key={client.clientId} style={{ marginBottom: '0.3rem' }}>
                  {client.clientName}:<strong> {client.daysLeft}</strong>{' '}
                  {intl.formatMessage({ id: 'common.days' })}
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ margin: 0 }}>
              {intl.formatMessage({ id: 'coach.home.noDaysLeftData' })}
            </p>
          )}
        </Card>
      </div>

      {/*
        4) Card: Frecuencia de entrenamiento (últimos 7 días)
      */}
      <div className="col-12 md:col-6 lg:col-3" style={{ padding: '0.5rem' }}>
        <Card
          title={intl.formatMessage({ id: 'coach.home.last7daysFrequency' })}
        >
          {combinedClientData.length > 0 ? (
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {combinedClientData.map((client) => (
                <li key={client.clientId} style={{ marginBottom: '0.3rem' }}>
                  {client.clientName}:
                  <strong> {client.trainingSessionsLast7Days}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ margin: 0 }}>
              {intl.formatMessage({ id: 'coach.home.noFrequencyData7days' })}
            </p>
          )}
        </Card>
      </div>

      {/* ====== TABLA DE CLIENTES ====== */}
      <div className="col-12" style={{ padding: '0.5rem' }}>
        <Card title={intl.formatMessage({ id: 'coach.home.clientsSummary' })}>
          <DataTable
            value={combinedClientData}
            responsiveLayout="scroll"
            style={{ marginTop: '1rem' }}
          >
            <Column
              field="clientName"
              header={intl.formatMessage({ id: 'coach.home.table.clientName' })}
            />
            <Column
              field="lastTimeTrained"
              header={intl.formatMessage({
                id: 'coach.home.table.lastWorkout'
              })}
              body={(rowData) =>
                rowData.lastTimeTrained
                  ? formatDate(rowData.lastTimeTrained)
                  : '---'
              }
            />
            <Column
              field="daysLeft"
              header={intl.formatMessage({ id: 'coach.home.table.daysLeft' })}
              body={(rowData) => rowData.daysLeft ?? '---'}
            />
            <Column
              field="trainingSessionsLast30Days"
              header={intl.formatMessage({ id: 'coach.home.table.last30days' })}
            />
            <Column
              field="isPaid"
              header={intl.formatMessage({ id: 'coach.home.table.didPay' })}
              body={(rowData) =>
                rowData.isPaid
                  ? intl.formatMessage({ id: 'common.yes' })
                  : intl.formatMessage({ id: 'common.no' })
              }
            />
            <Column
              field="nextPaymentDate"
              header={intl.formatMessage({
                id: 'coach.home.table.nextPayment'
              })}
              body={(rowData) =>
                rowData.nextPaymentDate
                  ? formatDate(rowData.nextPaymentDate)
                  : '---'
              }
            />
            <Column
              field="paymentStatus"
              header={intl.formatMessage({
                id: 'coach.home.table.subscriptionStatus'
              })}
            />
          </DataTable>
        </Card>
      </div>
    </div>
  );
}

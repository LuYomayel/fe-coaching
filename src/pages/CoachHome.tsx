import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tooltip } from 'primereact/tooltip';
import { formatDate } from '../utils/UtilFunctions';
import { useCoachHome, ICombinedClientData } from '../hooks/coach/useCoachHome';

// ---------------------------------------------------------------------------
// Template helpers
// ---------------------------------------------------------------------------

function PaymentStatusTemplate({
  rowData,
  intl,
  getStatusColor
}: {
  rowData: ICombinedClientData;
  intl: ReturnType<typeof useCoachHome>['intl'];
  getStatusColor: (status: string | null) => string;
}): JSX.Element {
  return (
    <span className={`status-badge ${getStatusColor(rowData.paymentStatus)}`}>
      <i className={`pi ${rowData.isPaid ? 'pi-check-circle' : 'pi-times-circle'}`}></i>
      {rowData.paymentStatus || intl.formatMessage({ id: 'common.inactive' })}
    </span>
  );
}

function LastTrainedTemplate({
  rowData,
  intl
}: {
  rowData: ICombinedClientData;
  intl: ReturnType<typeof useCoachHome>['intl'];
}): JSX.Element {
  const daysAgo = rowData.lastTimeTrained
    ? Math.floor((Date.now() - new Date(rowData.lastTimeTrained).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div>
      {rowData.lastTimeTrained ? (
        <>
          <div style={{ fontWeight: 500, fontSize: '0.88rem' }}>{formatDate(rowData.lastTimeTrained)}</div>
          <div
            style={{
              fontSize: '0.78rem',
              fontWeight: 500,
              color: daysAgo !== null && daysAgo > 7 ? '#ef4444' : '#22c55e'
            }}
          >
            {daysAgo === 0
              ? intl.formatMessage({ id: 'coach.home.today' })
              : daysAgo === 1
                ? intl.formatMessage({ id: 'coach.home.yesterday' })
                : intl.formatMessage({ id: 'coach.home.daysAgo' }, { days: daysAgo })}
          </div>
        </>
      ) : (
        <span style={{ color: '#ef4444' }}>---</span>
      )}
    </div>
  );
}

function DaysLeftTemplate({ rowData }: { rowData: ICombinedClientData }): JSX.Element {
  if (rowData.daysLeft === null) return <span style={{ color: '#a3a3a3' }}>---</span>;

  const color = rowData.daysLeft < 3 ? '#ef4444' : rowData.daysLeft < 7 ? '#f59e0b' : '#22c55e';

  return <span style={{ fontWeight: 600, color }}>{rowData.daysLeft}</span>;
}

// ---------------------------------------------------------------------------
// Stat widget component
// ---------------------------------------------------------------------------

function StatWidget({
  icon,
  iconBg,
  iconColor,
  value,
  label
}: {
  icon: string;
  iconBg: string;
  iconColor: string;
  value: string | number;
  label: string;
}): JSX.Element {
  return (
    <div
      className="flex align-items-center gap-3"
      style={{
        padding: '0.65rem 0.85rem',
        background: 'var(--ios-surface-subtle)',
        borderRadius: '14px',
        flex: '1 1 auto',
        minWidth: '0'
      }}
    >
      <div
        className="flex align-items-center justify-content-center"
        style={{
          width: '2.5rem',
          height: '2.5rem',
          background: iconBg,
          borderRadius: '12px',
          flexShrink: 0
        }}
      >
        <i className={icon} style={{ color: iconColor, fontSize: '1.05rem' }} />
      </div>
      <div>
        <div style={{ fontSize: '1.35rem', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2 }}>{value}</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--ios-text-secondary)', fontWeight: 500 }}>{label}</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dashboard card component
// ---------------------------------------------------------------------------

function DashboardCard({
  icon,
  iconColor,
  title,
  children
}: {
  icon: string;
  iconColor: string;
  title: string;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <div
      style={{
        background: 'var(--ios-card-bg)',
        borderRadius: '20px',
        border: '1px solid var(--ios-card-border)',
        boxShadow: 'var(--ios-card-shadow)',
        height: '100%',
        overflow: 'hidden'
      }}
    >
      <div
        className="flex align-items-center gap-2"
        style={{ padding: '1rem 1.25rem 0.75rem', borderBottom: '1px solid var(--ios-card-border)' }}
      >
        <i className={icon} style={{ color: iconColor, fontSize: '1rem' }} />
        <span style={{ fontWeight: 600, fontSize: '0.95rem', letterSpacing: '-0.01em' }}>{title}</span>
      </div>
      <div style={{ padding: '0.75rem 1.25rem 1.25rem' }}>{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CoachHomePage(): JSX.Element {
  const {
    combinedClientData,
    formattedDate,
    totalClients,
    totalPaid,
    unpaidClients,
    clientsWithDaysLeft,
    mostActiveClients,
    coachName,
    intl,
    navigate,
    location,
    goToManageStudents,
    viewClientProfile,
    getStatusColor
  } = useCoachHome();

  const paymentStatusTemplate = (rowData: ICombinedClientData): JSX.Element => (
    <PaymentStatusTemplate rowData={rowData} intl={intl} getStatusColor={getStatusColor} />
  );

  const lastTrainedTemplate = (rowData: ICombinedClientData): JSX.Element => (
    <LastTrainedTemplate rowData={rowData} intl={intl} />
  );

  const daysLeftTemplate = (rowData: ICombinedClientData): JSX.Element => <DaysLeftTemplate rowData={rowData} />;

  const clientActionsTemplate = (rowData: ICombinedClientData): JSX.Element => (
    <div className="flex gap-2 justify-content-center">
      <Button
        icon="pi pi-eye"
        className="p-button-rounded p-button-outlined p-button-sm"
        tooltip={intl.formatMessage({ id: 'common.view' })}
        tooltipOptions={{ position: 'top' }}
        onClick={() => viewClientProfile(rowData.clientId)}
        style={{ width: '2rem', height: '2rem' }}
      />
    </div>
  );

  return (
    <div style={{ padding: '0.75rem', minHeight: '100vh' }}>
      <Tooltip target=".custom-tooltip" />

      {/* Dashboard header */}
      <div
        style={{
          background: 'var(--ios-card-bg)',
          borderRadius: '16px',
          padding: '1rem',
          marginBottom: '0.75rem',
          border: '1px solid var(--ios-card-border)',
          boxShadow: 'var(--ios-card-shadow)'
        }}
      >
        <div className="flex flex-column lg:flex-row justify-content-between align-items-start lg:align-items-center gap-4">
          <div className="flex-1">
            <h1
              style={{
                fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                margin: '0 0 0.25rem'
              }}
            >
              {intl.formatMessage({ id: 'coach.home.welcome' }, { name: coachName })}
            </h1>
            <p style={{ color: 'var(--ios-text-secondary)', fontSize: '0.95rem', margin: 0 }}>{formattedDate}</p>
          </div>

          <div className="flex flex-wrap gap-2 align-items-center">
            <StatWidget
              icon="pi pi-users"
              iconBg="rgba(99, 102, 241, 0.1)"
              iconColor="#6366f1"
              value={totalClients}
              label={intl.formatMessage({ id: 'coach.home.totalStudents' })}
            />
            <StatWidget
              icon="pi pi-check-circle"
              iconBg="rgba(34, 197, 94, 0.1)"
              iconColor="#22c55e"
              value={totalPaid}
              label={intl.formatMessage({ id: 'coach.home.paidUp' })}
            />
            <StatWidget
              icon="pi pi-exclamation-triangle"
              iconBg="rgba(249, 115, 22, 0.1)"
              iconColor="#f97316"
              value={unpaidClients.length}
              label={intl.formatMessage({ id: 'coach.home.unpaidClients' })}
            />
            <Button
              label={intl.formatMessage({ id: 'coach.home.manageStudents' })}
              icon="pi pi-user-edit"
              onClick={goToManageStudents}
              style={{
                background: '#6366f1',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 600,
                fontSize: '0.85rem',
                padding: '0.55rem 1rem'
              }}
            />
          </div>
        </div>
      </div>

      {/* Dashboard cards */}
      <div className="grid">
        {/* Unpaid clients */}
        <div className="col-12 md:col-6 lg:col-3 p-2">
          <DashboardCard
            icon="pi pi-dollar"
            iconColor="#6366f1"
            title={intl.formatMessage({ id: 'coach.home.unpaidClients' })}
          >
            {unpaidClients.length > 0 ? (
              <div className="flex flex-column gap-2">
                {unpaidClients.map((client) => (
                  <div
                    key={client.clientId}
                    className="flex align-items-center justify-content-between"
                    style={{ padding: '0.5rem 0.6rem', background: 'var(--ios-surface-subtle)', borderRadius: '10px' }}
                  >
                    <div className="flex align-items-center gap-2">
                      <i className="pi pi-user" style={{ color: 'var(--ios-text-tertiary)', fontSize: '0.85rem' }} />
                      <span style={{ fontWeight: 500, fontSize: '0.88rem' }}>{client.clientName}</span>
                    </div>
                    <Button
                      icon="pi pi-eye"
                      className="p-button-rounded p-button-text p-button-sm"
                      onClick={() => viewClientProfile(client.clientId)}
                      style={{ width: '1.8rem', height: '1.8rem' }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-column align-items-center justify-content-center p-3 text-center">
                <i
                  className="pi pi-check-circle"
                  style={{ color: '#22c55e', fontSize: '2rem', marginBottom: '0.5rem' }}
                />
                <p style={{ color: 'var(--ios-text-secondary)', margin: 0, fontSize: '0.88rem' }}>
                  {intl.formatMessage({ id: 'coach.home.allPaid' })}
                </p>
              </div>
            )}
          </DashboardCard>
        </div>

        {/* Days left */}
        <div className="col-12 md:col-6 lg:col-3 p-2">
          <DashboardCard
            icon="pi pi-calendar"
            iconColor="#3b82f6"
            title={intl.formatMessage({ id: 'coach.home.daysLeft' })}
          >
            {clientsWithDaysLeft.length > 0 ? (
              <div className="flex flex-column gap-2">
                {clientsWithDaysLeft.map((client) => (
                  <div
                    key={client.clientId}
                    className="flex align-items-center justify-content-between"
                    style={{ padding: '0.5rem 0.6rem', background: 'var(--ios-surface-subtle)', borderRadius: '10px' }}
                  >
                    <div className="flex align-items-center gap-2">
                      <i className="pi pi-user" style={{ color: 'var(--ios-text-tertiary)', fontSize: '0.85rem' }} />
                      <span style={{ fontWeight: 500, fontSize: '0.88rem' }}>{client.clientName}</span>
                    </div>
                    <span
                      style={{
                        padding: '0.15rem 0.5rem',
                        borderRadius: '8px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        background:
                          (client.daysLeft ?? 0) < 3
                            ? 'rgba(239,68,68,0.1)'
                            : (client.daysLeft ?? 0) < 7
                              ? 'rgba(249,115,22,0.1)'
                              : 'rgba(34,197,94,0.1)',
                        color:
                          (client.daysLeft ?? 0) < 3 ? '#ef4444' : (client.daysLeft ?? 0) < 7 ? '#f97316' : '#22c55e'
                      }}
                    >
                      {client.daysLeft} {intl.formatMessage({ id: 'common.days' })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-column align-items-center justify-content-center p-3 text-center">
                <i
                  className="pi pi-info-circle"
                  style={{ color: '#3b82f6', fontSize: '2rem', marginBottom: '0.5rem' }}
                />
                <p style={{ color: 'var(--ios-text-secondary)', margin: 0, fontSize: '0.88rem' }}>
                  {intl.formatMessage({ id: 'coach.home.noDaysLeftData' })}
                </p>
              </div>
            )}
          </DashboardCard>
        </div>

        {/* Training frequency */}
        <div className="col-12 md:col-6 lg:col-3 p-2">
          <DashboardCard
            icon="pi pi-heart"
            iconColor="#ec4899"
            title={intl.formatMessage({ id: 'coach.home.last7daysFrequency' })}
          >
            {mostActiveClients.length > 0 ? (
              <div className="flex flex-column gap-2">
                {mostActiveClients.map((client) => (
                  <div
                    key={client.clientId}
                    className="flex align-items-center justify-content-between"
                    style={{ padding: '0.5rem 0.6rem', background: 'var(--ios-surface-subtle)', borderRadius: '10px' }}
                  >
                    <div className="flex align-items-center gap-2">
                      <i className="pi pi-user" style={{ color: 'var(--ios-text-tertiary)', fontSize: '0.85rem' }} />
                      <span style={{ fontWeight: 500, fontSize: '0.88rem' }}>{client.clientName}</span>
                    </div>
                    <span
                      style={{
                        padding: '0.15rem 0.5rem',
                        borderRadius: '8px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        background:
                          client.trainingSessionsLast7Days === 0
                            ? 'rgba(239,68,68,0.1)'
                            : client.trainingSessionsLast7Days < 3
                              ? 'rgba(249,115,22,0.1)'
                              : 'rgba(34,197,94,0.1)',
                        color:
                          client.trainingSessionsLast7Days === 0
                            ? '#ef4444'
                            : client.trainingSessionsLast7Days < 3
                              ? '#f97316'
                              : '#22c55e'
                      }}
                    >
                      {client.trainingSessionsLast7Days} {intl.formatMessage({ id: 'coach.home.sessions' })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-column align-items-center justify-content-center p-3 text-center">
                <i
                  className="pi pi-info-circle"
                  style={{ color: '#3b82f6', fontSize: '2rem', marginBottom: '0.5rem' }}
                />
                <p style={{ color: 'var(--ios-text-secondary)', margin: 0, fontSize: '0.88rem' }}>
                  {intl.formatMessage({ id: 'coach.home.noFrequencyData7days' })}
                </p>
              </div>
            )}
          </DashboardCard>
        </div>

        {/* Quick actions */}
        <div className="col-12 md:col-6 lg:col-3 p-2">
          <DashboardCard
            icon="pi pi-bolt"
            iconColor="#f59e0b"
            title={intl.formatMessage({ id: 'coach.home.quickActions' })}
          >
            <div className="flex flex-column gap-2">
              <Button
                label={intl.formatMessage({ id: 'coach.home.createWorkout' })}
                icon="pi pi-plus-circle"
                className="p-button-outlined w-full"
                style={{
                  borderRadius: '12px',
                  borderColor: '#6366f1',
                  color: '#6366f1',
                  fontWeight: 500,
                  fontSize: '0.88rem'
                }}
                onClick={() =>
                  navigate('/plans/create', {
                    state: { changeToTemplate: false, returnTo: location.pathname + location.search }
                  })
                }
              />
              <Button
                label={intl.formatMessage({ id: 'coach.home.addExercise' })}
                icon="pi pi-plus"
                className="p-button-outlined w-full"
                style={{
                  borderRadius: '12px',
                  borderColor: '#737373',
                  color: '#525252',
                  fontWeight: 500,
                  fontSize: '0.88rem'
                }}
                onClick={() => navigate('/coach/profile')}
              />
              <Button
                label={intl.formatMessage({ id: 'coach.home.viewProfile' })}
                icon="pi pi-user"
                className="p-button-outlined w-full"
                style={{
                  borderRadius: '12px',
                  borderColor: '#3b82f6',
                  color: '#3b82f6',
                  fontWeight: 500,
                  fontSize: '0.88rem'
                }}
                onClick={() => navigate('/coach/profile')}
              />
            </div>
          </DashboardCard>
        </div>
      </div>

      {/* Client summary table */}
      <div
        style={{
          background: 'var(--ios-card-bg)',
          borderRadius: '20px',
          border: '1px solid var(--ios-card-border)',
          boxShadow: 'var(--ios-card-shadow)',
          marginTop: '1.25rem',
          overflow: 'hidden'
        }}
      >
        <DataTable
          value={combinedClientData}
          responsiveLayout="stack"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 20]}
          emptyMessage={intl.formatMessage({ id: 'coach.home.noClientsData' })}
          header={
            <div className="flex justify-content-between align-items-center" style={{ padding: '0.25rem 0' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, letterSpacing: '-0.015em' }}>
                {intl.formatMessage({ id: 'coach.home.clientsSummary' })}
              </h3>
              <Button
                label={intl.formatMessage({ id: 'coach.home.viewAll' })}
                icon="pi pi-external-link"
                className="p-button-text"
                style={{ fontSize: '0.85rem', fontWeight: 500, color: '#6366f1' }}
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
            style={{ width: '100px', textAlign: 'center' }}
          />
        </DataTable>
      </div>
    </div>
  );
}

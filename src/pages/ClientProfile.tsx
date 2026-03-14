import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputNumber } from 'primereact/inputnumber';
import { MultiSelect } from 'primereact/multiselect';
import { Dropdown } from 'primereact/dropdown';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { TabView, TabPanel } from 'primereact/tabview';
import { Chart } from 'primereact/chart';
import { Tag } from 'primereact/tag';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Calendar } from 'primereact/calendar';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { FormattedMessage } from 'react-intl';

import { useClientProfile } from '../hooks/client/useClientProfile';
import PaymentDialog from '../components/dialogs/PaymentDialog';
import { WorkoutStatus } from '../types/enums/workout-status';

const sectionCard: React.CSSProperties = {
  background: 'var(--ios-card-bg)',
  borderRadius: 'var(--ios-radius-xl)',
  border: '1px solid var(--ios-card-border)',
  boxShadow: 'var(--ios-card-shadow)',
  padding: '1rem'
};

const infoRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0.55rem 0',
  borderBottom: '1px solid var(--ios-divider)',
  fontSize: '0.88rem'
};

const infoLabel: React.CSSProperties = {
  fontWeight: 600,
  color: 'var(--ios-text-secondary)',
  fontSize: '0.78rem',
  textTransform: 'uppercase',
  letterSpacing: '0.03em'
};

const infoValue: React.CSSProperties = {
  color: 'var(--ios-text)',
  fontWeight: 500
};

const sectionTitle: React.CSSProperties = {
  fontSize: '0.9rem',
  fontWeight: 700,
  color: 'var(--ios-text)',
  margin: '0 0 0.75rem',
  letterSpacing: '-0.01em',
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem'
};

export default function ClientProfile() {
  const {
    intl,
    client,
    toast,
    personalInfo,
    setPersonalInfo,
    subscription,
    workoutHistory,
    activities,
    editDialogVisible,
    fitnessGoal,
    setFitnessGoal,
    activityLevel,
    setActivityLevel,
    progressData,
    filters,
    setFilters,
    statuses,
    isPaymentDialogVisible,
    handleEditPersonalInfo,
    handleEditDialogClose,
    handleSavePersonalInfo,
    handleOpenPaymentDialog,
    handlePaymentDialogClose,
    fitnessGoalOptions,
    activityLevelOptions,
    formatDate,
    getDayMonthYear,
    getSeverity
  } = useClientProfile();

  const statusItemTemplate = (option: string) => {
    return <span>{option}</span>;
  };

  const statusBodyTemplate = (rowData: { status: string }) => {
    return <Tag value={rowData.status} severity={getSeverity(rowData.status as WorkoutStatus)} />;
  };

  const statusFilterTemplate = (options: { value: string | null; filterApplyCallback: (value: string) => void }) => {
    return (
      <Dropdown
        value={options.value}
        options={statuses}
        onChange={(e) => options.filterApplyCallback(e.value)}
        itemTemplate={statusItemTemplate}
        placeholder="Select a Status"
        className="p-column-filter"
        showClear
        style={{ minWidth: '12rem' }}
      />
    );
  };

  const planNameFilterTemplate = (options: { value: string | null; filterApplyCallback: (value: string) => void }) => {
    return (
      <InputText
        value={options.value ?? ''}
        onChange={(e) => options.filterApplyCallback(e.target.value)}
        placeholder="Search by name"
        className="p-column-filter"
        style={{ minWidth: '12rem' }}
      />
    );
  };

  const descriptionFilterTemplate = (options: {
    value: string | null;
    filterApplyCallback: (value: string) => void;
  }) => {
    return (
      <InputText
        value={options.value ?? ''}
        onChange={(e) => options.filterApplyCallback(e.target.value)}
        placeholder="Search by description"
        className="p-column-filter"
        style={{ minWidth: '12rem' }}
      />
    );
  };

  const dateFilterTemplate = (options: { value: Date | null; filterApplyCallback: (value: Date | null) => void }) => {
    return (
      <Calendar
        value={options.value}
        onChange={(e) => options.filterApplyCallback(e.value as Date | null)}
        dateFormat="dd/mm/yy"
        placeholder="Select Date"
        showIcon
        style={{ minWidth: '12rem' }}
        locale={intl.locale}
      />
    );
  };

  const setPlanDetails = (rowData: {
    trainingSession: {
      trainingWeek?: { weekNumber?: number };
      dayNumber?: number;
    };
  }) => {
    return (
      <p style={{ margin: 0, fontSize: '0.85rem' }}>
        <FormattedMessage
          id="profile.table.week"
          values={{
            number: rowData.trainingSession.trainingWeek?.weekNumber || 'N/A'
          }}
        />{' '}
        - <FormattedMessage id="profile.table.day" values={{ number: rowData.trainingSession.dayNumber || 'N/A' }} />
      </p>
    );
  };

  return (
    <div style={{ padding: '0.75rem', maxWidth: '900px', margin: '0 auto' }}>
      <Toast ref={toast} />
      <ConfirmDialog />

      {/* Page Header */}
      <h1
        style={{
          fontSize: 'clamp(1.2rem, 3vw, 1.6rem)',
          fontWeight: 800,
          letterSpacing: '-0.03em',
          margin: '0 0 1rem',
          color: 'var(--ios-text)'
        }}
      >
        <FormattedMessage id="profile.title" />
      </h1>

      <div className="grid">
        {/* Left Column - Personal Info & Subscription */}
        <div className="col-12 md:col-4">
          {/* Personal Info Card */}
          <div style={{ ...sectionCard, marginBottom: '0.75rem' }}>
            <h3 style={sectionTitle}>
              <i className="pi pi-user" style={{ color: '#6366f1' }} />
              {intl.formatMessage({ id: 'profile.personalInfo' })}
            </h3>

            <div style={infoRow}>
              <span style={infoLabel}>
                <FormattedMessage id="profile.name" />
              </span>
              <span style={infoValue}>{personalInfo?.name}</span>
            </div>
            <div style={infoRow}>
              <span style={infoLabel}>
                <FormattedMessage id="profile.email" />
              </span>
              <span style={{ ...infoValue, fontSize: '0.82rem', wordBreak: 'break-all' }}>
                {personalInfo?.user?.email}
              </span>
            </div>
            <div style={infoRow}>
              <span style={infoLabel}>
                <FormattedMessage id="profile.birthdate" />
              </span>
              <span style={infoValue}>{formatDate(personalInfo?.birthdate)}</span>
            </div>
            <div style={infoRow}>
              <span style={infoLabel}>
                <FormattedMessage id="profile.gender" />
              </span>
              <span style={infoValue}>{personalInfo?.gender}</span>
            </div>
            <div style={{ ...infoRow, borderBottom: 'none' }}>
              <span style={infoLabel}>
                <FormattedMessage id="profile.phone" />
              </span>
              <span style={infoValue}>{personalInfo?.phoneNumber}</span>
            </div>

            <Button
              label={intl.formatMessage({ id: 'profile.edit' })}
              icon="pi pi-pencil"
              className="w-full mt-3"
              onClick={handleEditPersonalInfo}
              style={{
                background: 'rgba(99,102,241,0.1)',
                color: '#6366f1',
                border: 'none',
                borderRadius: 'var(--ios-radius-md)',
                fontWeight: 600,
                fontSize: '0.85rem'
              }}
            />
          </div>

          {/* Subscription Card */}
          <div style={sectionCard}>
            <h3 style={sectionTitle}>
              <i className="pi pi-credit-card" style={{ color: '#22c55e' }} />
              {intl.formatMessage({ id: 'profile.subscription' })}
            </h3>

            <div style={infoRow}>
              <span style={infoLabel}>
                <FormattedMessage id="profile.subscription.planName" />
              </span>
              <span style={infoValue}>{subscription?.coachPlan?.name}</span>
            </div>
            <div style={infoRow}>
              <span style={infoLabel}>
                <FormattedMessage id="profile.subscription.startDate" />
              </span>
              <span style={infoValue}>{formatDate(subscription?.subscription?.startDate)}</span>
            </div>
            <div style={infoRow}>
              <span style={infoLabel}>
                <FormattedMessage id="profile.subscription.endDate" />
              </span>
              <span style={infoValue}>{formatDate(subscription?.subscription?.endDate)}</span>
            </div>
            <div style={{ ...infoRow, borderBottom: 'none' }}>
              <span style={infoLabel}>
                <FormattedMessage id="profile.subscription.status" />
              </span>
              <Tag
                value={subscription?.subscription?.status || ''}
                severity={subscription?.subscription?.status === 'active' ? 'success' : 'warning'}
                style={{
                  borderRadius: 'var(--ios-radius-pill)',
                  fontSize: '0.72rem',
                  fontWeight: 600
                }}
              />
            </div>

            <Button
              label={intl.formatMessage({ id: 'payment.makePayment' })}
              icon="pi pi-credit-card"
              className="w-full mt-3"
              onClick={handleOpenPaymentDialog}
              style={{
                background: '#22c55e',
                border: 'none',
                borderRadius: 'var(--ios-radius-md)',
                fontWeight: 600,
                fontSize: '0.85rem'
              }}
            />
          </div>
        </div>

        {/* Right Column - Tabs */}
        <div className="col-12 md:col-8">
          <div style={sectionCard}>
            <TabView>
              <TabPanel
                header={intl.formatMessage({
                  id: 'profile.tabs.workoutHistory'
                })}
              >
                <DataTable
                  value={workoutHistory}
                  paginator
                  rows={6}
                  filters={filters}
                  globalFilterFields={['workout.planName', 'status']}
                  onFilter={(e) => setFilters(e.filters)}
                  emptyMessage={intl.formatMessage({
                    id: 'common.noResults'
                  })}
                  responsiveLayout="scroll"
                  size="small"
                  style={{ fontSize: '0.85rem' }}
                >
                  <Column
                    field="workout.planName"
                    header={intl.formatMessage({
                      id: 'profile.table.planName'
                    })}
                    sortable
                    filter
                    filterPlaceholder={intl.formatMessage({
                      id: 'common.search'
                    })}
                    filterElement={planNameFilterTemplate}
                  />
                  <Column
                    header={intl.formatMessage({
                      id: 'profile.table.details'
                    })}
                    body={setPlanDetails}
                  />
                  <Column
                    header={intl.formatMessage({
                      id: 'profile.table.trainingDate'
                    })}
                    body={(rowData: { trainingSession: { sessionDate: string | Date } }) =>
                      formatDate(getDayMonthYear(rowData.trainingSession).toISOString().split('T')[0])
                    }
                    sortable
                    filter
                    filterField="trainingSession.sessionDate"
                    filterElement={dateFilterTemplate}
                  />
                  <Column
                    field="realEndDate"
                    header={intl.formatMessage({
                      id: 'profile.table.dayTrained'
                    })}
                    body={(rowData: { realEndDate?: string }) => formatDate(rowData.realEndDate)}
                    sortable
                    filter
                    filterField="realEndDate"
                    filterElement={dateFilterTemplate}
                  />
                  <Column
                    field="status"
                    header={intl.formatMessage({
                      id: 'profile.table.status'
                    })}
                    body={statusBodyTemplate}
                    sortable
                    filter
                    filterElement={statusFilterTemplate}
                  />
                </DataTable>
              </TabPanel>

              <TabPanel
                header={intl.formatMessage({
                  id: 'profile.tabs.progress'
                })}
              >
                <div className="flex justify-content-center">
                  <Chart
                    type="pie"
                    data={progressData}
                    options={{ responsive: true }}
                    style={{ width: '100%', maxWidth: '320px' }}
                  />
                </div>
              </TabPanel>

              <TabPanel
                header={intl.formatMessage({
                  id: 'profile.tabs.activities'
                })}
              >
                <DataTable
                  value={activities}
                  paginator
                  rows={8}
                  rowsPerPageOptions={[8, 25, 50]}
                  filters={filters}
                  filterDisplay="menu"
                  globalFilterFields={['description']}
                  onFilter={(e) => setFilters(e.filters)}
                  emptyMessage={intl.formatMessage({
                    id: 'common.noResults'
                  })}
                  responsiveLayout="scroll"
                  size="small"
                  style={{ fontSize: '0.85rem' }}
                >
                  <Column
                    field="timestamp"
                    header={intl.formatMessage({
                      id: 'profile.table.date'
                    })}
                    body={(rowData: { timestamp: string }) => formatDate(rowData.timestamp)}
                    sortable
                    filter
                    filterField="timestamp"
                    filterElement={dateFilterTemplate}
                  />
                  <Column
                    field="description"
                    header={intl.formatMessage({
                      id: 'profile.table.action'
                    })}
                    sortable
                    filter
                    filterElement={descriptionFilterTemplate}
                  />
                </DataTable>
              </TabPanel>
            </TabView>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog
        header={
          <div className="flex align-items-center gap-2">
            <i className="pi pi-user-edit" style={{ color: '#6366f1' }} />
            <span style={{ fontWeight: 700 }}>{intl.formatMessage({ id: 'profile.dialog.edit' })}</span>
          </div>
        }
        visible={editDialogVisible}
        style={{
          width: 'min(92vw, 480px)',
          borderRadius: 'var(--ios-radius-xl)'
        }}
        onHide={handleEditDialogClose}
        draggable={false}
        resizable={false}
        dismissableMask
        footer={
          <div className="flex justify-content-end gap-2">
            <Button
              label={intl.formatMessage({ id: 'profile.dialog.cancel' })}
              icon="pi pi-times"
              onClick={handleEditDialogClose}
              className="p-button-text"
              style={{
                color: 'var(--ios-text-secondary)',
                fontSize: '0.85rem'
              }}
            />
            <Button
              label={intl.formatMessage({ id: 'profile.dialog.save' })}
              icon="pi pi-check"
              onClick={handleSavePersonalInfo}
              autoFocus
              style={{
                background: '#6366f1',
                border: 'none',
                borderRadius: 'var(--ios-radius-md)',
                fontWeight: 600,
                fontSize: '0.85rem'
              }}
            />
          </div>
        }
      >
        <div className="flex flex-column gap-3" style={{ padding: '0.25rem 0' }}>
          <div>
            <label
              htmlFor="fitnessGoal"
              style={{
                ...infoLabel,
                display: 'block',
                marginBottom: '0.3rem'
              }}
            >
              <FormattedMessage id="profile.dialog.fitnessGoal" />
            </label>
            <MultiSelect
              id="fitnessGoal"
              options={fitnessGoalOptions}
              value={fitnessGoal}
              onChange={(e) => setFitnessGoal(e.value)}
              placeholder={intl.formatMessage({ id: 'common.select' })}
              className="w-full"
              style={{
                borderRadius: 'var(--ios-radius-md)',
                border: '1px solid var(--ios-divider)'
              }}
            />
          </div>
          <div>
            <label
              htmlFor="activityLevel"
              style={{
                ...infoLabel,
                display: 'block',
                marginBottom: '0.3rem'
              }}
            >
              <FormattedMessage id="profile.dialog.activityLevel" />
            </label>
            <Dropdown
              id="activityLevel"
              options={activityLevelOptions}
              value={activityLevel}
              onChange={(e) => setActivityLevel(e.value)}
              placeholder={intl.formatMessage({ id: 'common.select' })}
              className="w-full"
              style={{
                borderRadius: 'var(--ios-radius-md)',
                border: '1px solid var(--ios-divider)'
              }}
            />
          </div>
          <div>
            <label
              htmlFor="editPhone"
              style={{
                ...infoLabel,
                display: 'block',
                marginBottom: '0.3rem'
              }}
            >
              <FormattedMessage id="profile.phone" />
            </label>
            <InputNumber
              maxLength={11}
              id="editPhone"
              useGrouping={false}
              value={personalInfo?.phoneNumber}
              onChange={(e) => setPersonalInfo({ ...personalInfo!, phoneNumber: e.value })}
              className="w-full"
              style={{
                borderRadius: 'var(--ios-radius-md)'
              }}
            />
          </div>
        </div>
      </Dialog>

      <PaymentDialog
        visible={isPaymentDialogVisible}
        onHide={handlePaymentDialogClose}
        subscription={subscription}
        coachId={client?.coach?.id as number}
      />
    </div>
  );
}

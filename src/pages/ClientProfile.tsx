import { Card } from 'primereact/card';
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

  // Templates for DataTable filters and cells
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
      <p>
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
    <div className="client-profile p-4">
      <Toast ref={toast} />
      <ConfirmDialog />

      <h1 className="text-4xl font-bold mb-4">
        <FormattedMessage id="profile.title" />
      </h1>

      <div className="grid">
        <div className="col-12 md:col-4">
          <Card title={intl.formatMessage({ id: 'profile.personalInfo' })} className="mb-4">
            <p>
              <strong>
                <FormattedMessage id="profile.name" />:
              </strong>{' '}
              {personalInfo?.name}
            </p>
            <p>
              <strong>
                <FormattedMessage id="profile.email" />:
              </strong>{' '}
              {personalInfo?.user?.email}
            </p>
            <p>
              <strong>
                <FormattedMessage id="profile.birthdate" />:
              </strong>{' '}
              {formatDate(personalInfo?.birthdate)}
            </p>
            <p>
              <strong>
                <FormattedMessage id="profile.gender" />:
              </strong>{' '}
              {personalInfo?.gender}
            </p>
            <p>
              <strong>
                <FormattedMessage id="profile.phone" />:
              </strong>{' '}
              {personalInfo?.phoneNumber}
            </p>
            <Button
              label={intl.formatMessage({ id: 'profile.edit' })}
              icon="pi pi-pencil"
              className="p-button-rounded p-button-warning mt-3"
              onClick={handleEditPersonalInfo}
            />
          </Card>

          <Card title={intl.formatMessage({ id: 'profile.subscription' })} className="mb-4">
            <p>
              <strong>
                <FormattedMessage id="profile.subscription.planName" />:
              </strong>{' '}
              {subscription?.coachPlan?.name}
            </p>
            <p>
              <strong>
                <FormattedMessage id="profile.subscription.startDate" />:
              </strong>{' '}
              {formatDate(subscription?.subscription?.startDate)}
            </p>
            <p>
              <strong>
                <FormattedMessage id="profile.subscription.endDate" />:
              </strong>{' '}
              {formatDate(subscription?.subscription?.endDate)}
            </p>
            <p>
              <strong>
                <FormattedMessage id="profile.subscription.status" />:
              </strong>{' '}
              {subscription?.subscription?.status}
            </p>
            <Button
              label={intl.formatMessage({ id: 'payment.makePayment' })}
              icon="pi pi-credit-card"
              className="p-button-rounded p-button-success mt-3"
              onClick={handleOpenPaymentDialog}
            />
          </Card>
        </div>

        <div className="col-12 md:col-8">
          <TabView>
            <TabPanel header={intl.formatMessage({ id: 'profile.tabs.workoutHistory' })}>
              <DataTable
                value={workoutHistory}
                paginator
                rows={6}
                filters={filters}
                globalFilterFields={['workout.planName', 'status']}
                onFilter={(e) => setFilters(e.filters)}
                emptyMessage={intl.formatMessage({ id: 'common.noResults' })}
                responsiveLayout="scroll"
              >
                <Column
                  field="workout.planName"
                  header={intl.formatMessage({ id: 'profile.table.planName' })}
                  sortable
                  filter
                  filterPlaceholder={intl.formatMessage({
                    id: 'common.search'
                  })}
                  filterElement={planNameFilterTemplate}
                />
                <Column header={intl.formatMessage({ id: 'profile.table.details' })} body={setPlanDetails} />
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
                  header={intl.formatMessage({ id: 'profile.table.status' })}
                  body={statusBodyTemplate}
                  sortable
                  filter
                  filterElement={statusFilterTemplate}
                />
              </DataTable>
            </TabPanel>

            <TabPanel header={intl.formatMessage({ id: 'profile.tabs.progress' })}>
              <div className="flex justify-content-center">
                <Chart type="pie" data={progressData} options={{ responsive: true }} style={{ width: '50%' }} />
              </div>
            </TabPanel>

            <TabPanel header={intl.formatMessage({ id: 'profile.tabs.activities' })}>
              <DataTable
                value={activities}
                paginator
                rows={8}
                rowsPerPageOptions={[8, 25, 50]}
                filters={filters}
                filterDisplay="menu"
                globalFilterFields={['description']}
                onFilter={(e) => setFilters(e.filters)}
                emptyMessage={intl.formatMessage({ id: 'common.noResults' })}
                responsiveLayout="scroll"
              >
                <Column
                  field="timestamp"
                  header={intl.formatMessage({ id: 'profile.table.date' })}
                  body={(rowData: { timestamp: string }) => formatDate(rowData.timestamp)}
                  sortable
                  filter
                  filterField="timestamp"
                  filterElement={dateFilterTemplate}
                />
                <Column
                  field="description"
                  header={intl.formatMessage({ id: 'profile.table.action' })}
                  sortable
                  filter
                  filterElement={descriptionFilterTemplate}
                />
              </DataTable>
            </TabPanel>
          </TabView>
        </div>
      </div>

      <Dialog
        header={intl.formatMessage({ id: 'profile.dialog.edit' })}
        visible={editDialogVisible}
        style={{ width: '50vw' }}
        onHide={handleEditDialogClose}
        draggable={false}
        resizable={false}
        dismissableMask
        footer={
          <div>
            <Button
              label={intl.formatMessage({ id: 'profile.dialog.cancel' })}
              icon="pi pi-times"
              onClick={handleEditDialogClose}
              className="p-button-text"
            />
            <Button
              label={intl.formatMessage({ id: 'profile.dialog.save' })}
              icon="pi pi-check"
              onClick={handleSavePersonalInfo}
              autoFocus
            />
          </div>
        }
      >
        <div className="p-fluid">
          <div className="p-field">
            <label htmlFor="fitnessGoal">
              <FormattedMessage id="profile.dialog.fitnessGoal" />
            </label>
            <MultiSelect
              id="fitnessGoal"
              options={fitnessGoalOptions}
              value={fitnessGoal}
              onChange={(e) => setFitnessGoal(e.value)}
              placeholder={intl.formatMessage({ id: 'common.select' })}
            />
          </div>
          <div className="p-field">
            <label htmlFor="activityLevel">
              <FormattedMessage id="profile.dialog.activityLevel" />
            </label>
            <Dropdown
              id="activityLevel"
              options={activityLevelOptions}
              value={activityLevel}
              onChange={(e) => setActivityLevel(e.value)}
              placeholder={intl.formatMessage({ id: 'common.select' })}
            />
          </div>
          <div className="p-field">
            <label htmlFor="editPhone">
              <FormattedMessage id="profile.phone" />
            </label>
            <InputNumber
              maxLength={11}
              id="editPhone"
              useGrouping={false}
              value={personalInfo?.phoneNumber}
              onChange={(e) => setPersonalInfo({ ...personalInfo!, phoneNumber: e.value })}
            />
          </div>
        </div>
      </Dialog>

      <PaymentDialog
        visible={isPaymentDialogVisible}
        onHide={handlePaymentDialogClose}
        subscription={subscription}
        clientId={client!.id}
        coachId={client?.coach?.id as number}
        coachPlanId={subscription?.coachPlan?.id as number}
      />
    </div>
  );
}

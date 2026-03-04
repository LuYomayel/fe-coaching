import React from 'react';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Timeline } from 'primereact/timeline';
import { Chart } from 'primereact/chart';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ProgressBar } from 'primereact/progressbar';
import { FormattedMessage } from 'react-intl';
import { PlanDetailsDialog } from '../components/dialogs/PlanDetailsDialog';
import { useStudentDetails } from '../hooks/student/useStudentDetails';

export default function StudentDetails() {
  const {
    intl,
    student,
    loading,
    setLoading,
    activities,
    progressData,
    currentPlans,
    completedPlans,
    selectedPlan,
    planDetailsVisible,
    setPlanDetailsVisible,
    error,
    setRefreshKey,
    handleBack,
    handleViewPlanDetails,
    handleDeletePlan,
    formatDate
  } = useStudentDetails();

  const actionBodyTemplate = (rowData: Record<string, unknown>) => {
    return (
      <React.Fragment>
        <Button
          icon="pi pi-eye"
          className="p-button-rounded p-button-info mr-2"
          onClick={() => handleViewPlanDetails(rowData as never)}
          tooltip={intl.formatMessage({
            id: 'studentDetails.tooltip.viewDetails'
          })}
          tooltipOptions={{ position: 'top' }}
        />
        {rowData.status !== 'completed' && (
          <Button
            icon="pi pi-trash"
            className="p-button-rounded p-button-danger"
            onClick={() => handleDeletePlan(rowData as never)}
            tooltip={intl.formatMessage({
              id: 'studentDetails.tooltip.deletePlan'
            })}
            tooltipOptions={{ position: 'top' }}
          />
        )}
      </React.Fragment>
    );
  };

  const progressBodyTemplate = (rowData: Record<string, unknown>) => {
    return <ProgressBar value={rowData.progress as number} showValue={false} style={{ height: '8px' }} />;
  };

  if (loading)
    return (
      <div className="p-4">
        <FormattedMessage id="studentDetails.loading" />
      </div>
    );
  if (error)
    return (
      <div className="p-4 text-red-500">
        <FormattedMessage id="studentDetails.error.fetchData" />
      </div>
    );

  return (
    <div className="p-4">
      <Button
        icon="pi pi-arrow-left"
        label={intl.formatMessage({ id: 'studentDetails.back' })}
        onClick={handleBack}
        className="mb-4"
      />

      <h1 className="text-4xl font-bold mb-4">
        <FormattedMessage id="studentDetails.title" values={{ name: student?.client?.name }} />
      </h1>

      <div className="grid">
        <div className="col-12 md:col-6 lg:col-4">
          <Card
            title={intl.formatMessage({
              id: 'studentDetails.personalInfo.title'
            })}
            className="mb-4"
          >
            <p>
              <strong>
                <FormattedMessage id="studentDetails.personalInfo.email" />:
              </strong>{' '}
              {student?.client?.user?.email}
            </p>
            <p>
              <strong>
                <FormattedMessage id="studentDetails.personalInfo.fitnessGoal" />:
              </strong>{' '}
              {student?.client?.fitnessGoal}
            </p>
            <p>
              <strong>
                <FormattedMessage id="studentDetails.personalInfo.activityLevel" />:
              </strong>{' '}
              {student?.client?.activityLevel}
            </p>
          </Card>
        </div>

        <div className="col-12 md:col-6 lg:col-4">
          <Card
            title={intl.formatMessage({
              id: 'studentDetails.activities.title'
            })}
            className="mb-4"
          >
            <Timeline
              value={activities}
              content={(item) => item.description}
              opposite={(item) => formatDate(item.timestamp)}
            />
          </Card>
        </div>

        <div className="col-12 md:col-6 lg:col-4">
          <Card title={intl.formatMessage({ id: 'studentDetails.progress.title' })} className="mb-4">
            <Chart type="pie" data={progressData} options={{ responsive: true }} />
          </Card>
        </div>
      </div>

      <Card title={intl.formatMessage({ id: 'studentDetails.plans.current' })} className="mb-4">
        <DataTable value={currentPlans} paginator rows={5} className="p-datatable-responsive">
          <Column field="workout.planName" header={intl.formatMessage({ id: 'studentDetails.plans.name' })} />
          <Column
            field="instanceName"
            header={intl.formatMessage({
              id: 'studentDetails.plans.description'
            })}
          />
          <Column field="personalizedNotes" header={intl.formatMessage({ id: 'studentDetails.plans.notes' })} />
          <Column
            field="expectedStartDate"
            header={intl.formatMessage({
              id: 'studentDetails.plans.startDate'
            })}
            body={(rowData) => formatDate(rowData.expectedStartDate)}
          />
          <Column
            field="expectedEndDate"
            header={intl.formatMessage({ id: 'studentDetails.plans.endDate' })}
            body={(rowData) => formatDate(rowData.expectedEndDate)}
          />
          <Column field="status" header={intl.formatMessage({ id: 'studentDetails.plans.status' })} />
          <Column
            field="progress"
            header={intl.formatMessage({ id: 'studentDetails.plans.progress' })}
            body={progressBodyTemplate}
          />
          <Column body={actionBodyTemplate} exportable={false} style={{ minWidth: '8rem' }} />
        </DataTable>
      </Card>

      <Card title={intl.formatMessage({ id: 'studentDetails.plans.completed' })} className="mb-4">
        <DataTable value={completedPlans} paginator rows={5} className="p-datatable-responsive">
          <Column field="workout.planName" header={intl.formatMessage({ id: 'studentDetails.plans.name' })} />
          <Column
            field="instanceName"
            header={intl.formatMessage({
              id: 'studentDetails.plans.description'
            })}
          />
          <Column field="personalizedNotes" header={intl.formatMessage({ id: 'studentDetails.plans.notes' })} />
          <Column
            field="expectedStartDate"
            header={intl.formatMessage({
              id: 'studentDetails.plans.startDate'
            })}
            body={(rowData) => formatDate(rowData.expectedStartDate)}
          />
          <Column
            field="expectedEndDate"
            header={intl.formatMessage({ id: 'studentDetails.plans.endDate' })}
            body={(rowData) => formatDate(rowData.expectedEndDate)}
          />
          <Column field="status" header={intl.formatMessage({ id: 'studentDetails.plans.status' })} />
          <Column
            field="progress"
            header={intl.formatMessage({ id: 'studentDetails.plans.progress' })}
            body={progressBodyTemplate}
          />
          <Column body={actionBodyTemplate} exportable={false} style={{ minWidth: '8rem' }} />
        </DataTable>
      </Card>

      <PlanDetailsDialog
        visible={planDetailsVisible}
        onHide={() => setPlanDetailsVisible(false)}
        planId={selectedPlan}
        clientId={String(student?.client?.user?.id || '')}
        setRefreshKey={setRefreshKey}
        setLoading={setLoading}
      />
    </div>
  );
}

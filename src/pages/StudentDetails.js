import React, { useState, useEffect, useRef, useContext } from 'react';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Timeline } from 'primereact/timeline';
import { Chart } from 'primereact/chart';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { Toast } from 'primereact/toast';
import { ProgressBar } from 'primereact/progressbar';
import { useNavigate, useParams } from 'react-router-dom';
import { useIntl, FormattedMessage } from 'react-intl';

import { useToast } from '../utils/ToastContext';
import { useConfirmationDialog } from '../utils/ConfirmationDialogContext';
import PlanDetails from '../dialogs/PlanDetails';
import { formatDate } from '../utils/UtilFunctions';
import { useSpinner } from '../utils/GlobalSpinner';
import { deleteWorkoutPlan } from '../services/workoutService';
import { fetchClientActivitiesByUserId } from '../services/usersService';
import { fetchSubscriptionForStudent } from '../services/subscriptionService';
import { UserContext } from '../utils/UserContext';

export default function StudentDetails() {
  const intl = useIntl();
  const navigate = useNavigate();
  const toast = useRef(null);

  const { client } = useContext(UserContext);
  const { studentId } = useParams();
  const [student, setStudent] = useState(null);
  const { loading, setLoading } = useSpinner();
  const [activities, setActivities] = useState([]);
  const [progressData, setProgressData] = useState({});
  const [currentPlans, setCurrentPlans] = useState([]);
  const [completedPlans, setCompletedPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [planDetailsVisible, setPlanDetailsVisible] = useState(false);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const showToast = useToast();
  const { showConfirmationDialog } = useConfirmationDialog();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const subscriptionData = await fetchSubscriptionForStudent(studentId);
        setStudent(subscriptionData);

        const completed = subscriptionData.workoutInstances.filter((workout) => workout.status === 'completed').length;
        const pending = subscriptionData.workoutInstances.filter((workout) => workout.status === 'pending').length;

        setProgressData({
          labels: ['Completed', 'Pending'],
          datasets: [
            {
              data: [completed, pending],
              backgroundColor: ['green', 'red'],
              hoverBackgroundColor: ['green', 'red']
            }
          ]
        });

        const activitiesData = await fetchClientActivitiesByUserId(client.user.id);
        setActivities(activitiesData);

        // Set currentPlans and completedPlans
        const plans = subscriptionData.workoutInstances;
        setCurrentPlans(plans.filter((plan) => plan.status !== 'completed'));
        setCompletedPlans(plans.filter((plan) => plan.status === 'completed'));

        setError(null);
      } catch (error) {
        setError('Failed to fetch student data');
        showToast('error', 'Error', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [
    studentId,
    refreshKey,
    client.user.id,
    activities,
    currentPlans,
    completedPlans,
    progressData,
    showToast,
    setLoading
  ]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleViewPlanDetails = (plan) => {
    setSelectedPlan(plan.id);
    setPlanDetailsVisible(true);
  };

  const handleDeletePlan = (plan) => {
    showConfirmationDialog({
      message: intl.formatMessage({ id: 'deletePlan.confirmation.message' }),
      header: intl.formatMessage({ id: 'common.confirmation' }),
      icon: 'pi pi-exclamation-triangle',
      accept: () => deletePlan(plan),
      reject: () => {}
    });
  };

  const deletePlan = async (plan) => {
    try {
      await deleteWorkoutPlan(plan.id, false);
      setCurrentPlans(currentPlans.filter((p) => p.id !== plan.id));
      showToast(
        'success',
        intl.formatMessage({ id: 'studentDetails.success.planDeleted' }, { name: plan.workout.planName })
      );
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      showToast('error', 'Error', error.message);
    }
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <React.Fragment>
        <Button
          icon="pi pi-eye"
          className="p-button-rounded p-button-info mr-2"
          onClick={() => handleViewPlanDetails(rowData)}
          tooltip={intl.formatMessage({
            id: 'studentDetails.tooltip.viewDetails'
          })}
          tooltipOptions={{ position: 'top' }}
        />
        {rowData.status !== 'completed' && (
          <Button
            icon="pi pi-trash"
            className="p-button-rounded p-button-danger"
            onClick={() => handleDeletePlan(rowData)}
            tooltip={intl.formatMessage({
              id: 'studentDetails.tooltip.deletePlan'
            })}
            tooltipOptions={{ position: 'top' }}
          />
        )}
      </React.Fragment>
    );
  };

  const progressBodyTemplate = (rowData) => {
    return <ProgressBar value={rowData.progress} showValue={false} style={{ height: '8px' }} />;
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
      <Toast ref={toast} />
      <ConfirmDialog />

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

      <Dialog
        header={intl.formatMessage({ id: 'studentDetails.dialog.planDetails' })}
        visible={planDetailsVisible}
        style={{ width: '50vw' }}
        onHide={() => setPlanDetailsVisible(false)}
        draggable={false}
        resizable={false}
        dismissableMask
      >
        {selectedPlan && (
          <PlanDetails
            planId={selectedPlan}
            setPlanDetailsVisible={setPlanDetailsVisible}
            setRefreshKey={setRefreshKey}
            setLoading={setLoading}
          />
        )}
      </Dialog>
    </div>
  );
}

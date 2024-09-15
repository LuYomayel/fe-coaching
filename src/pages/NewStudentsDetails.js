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

import { useToast } from '../utils/ToastContext';
import { useConfirmationDialog } from '../utils/ConfirmationDialogContext';
import PlanDetails from '../dialogs/PlanDetails';
import { formatDate } from '../utils/UtilFunctions';
import { useSpinner } from '../utils/GlobalSpinner';
import { deleteWorkoutPlan } from '../services/workoutService';
import { fetchClientActivitiesByUserId } from '../services/usersService';
import { fetchSubscriptionForStudent } from '../services/subscriptionService';
import { UserContext } from '../utils/UserContext';

export default function NewStudentDetails() {
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

                const completed = subscriptionData.workoutInstances.filter(workout => workout.status === 'completed').length;
                const pending = subscriptionData.workoutInstances.filter(workout => workout.status === 'pending').length;

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
                setCurrentPlans(plans.filter(plan => plan.status !== 'completed'));
                setCompletedPlans(plans.filter(plan => plan.status === 'completed'));

                setError(null);
            } catch (error) {
                setError('Failed to fetch student data');
                showToast('error', 'Error', error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [studentId, refreshKey]);

    const handleBack = () => {
        navigate(-1);
    };

    const handleViewPlanDetails = (plan) => {
        setSelectedPlan(plan.id);
        setPlanDetailsVisible(true);
    };

    const handleDeletePlan = (plan) => {
        showConfirmationDialog({
            message: 'Are you sure you want to delete this plan?',
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            accept: () => deletePlan(plan),
            reject: () => {}
        });
    };

    const deletePlan = async (plan) => {
        try {
            await deleteWorkoutPlan(plan.id, false);
            setCurrentPlans(currentPlans.filter(p => p.id !== plan.id));
            showToast('success', 'Plan deleted!', `You have deleted the plan ${plan.workout.planName} successfully!`);
            setRefreshKey(prev => prev + 1);
        } catch (error) {
            showToast('error', 'Error', error.message);
        }
    };

    const actionBodyTemplate = (rowData) => {
        return (
            <React.Fragment>
                <Button icon="pi pi-eye" className="p-button-rounded p-button-info mr-2" onClick={() => handleViewPlanDetails(rowData)} tooltip="View Details" tooltipOptions={{ position: 'top' }} />
                {rowData.status !== 'completed' && (
                    <Button icon="pi pi-trash" className="p-button-rounded p-button-danger" onClick={() => handleDeletePlan(rowData)} tooltip="Delete Plan" tooltipOptions={{ position: 'top' }} />
                )}
            </React.Fragment>
        );
    };

    const progressBodyTemplate = (rowData) => {
        return <ProgressBar value={rowData.progress} showValue={false} style={{ height: '8px' }} />;
    };

    if (loading) return <div className="p-4">Loading...</div>;
    if (error) return <div className="p-4 text-red-500">{error}</div>;

    return (
        <div className="p-4">
            <Toast ref={toast} />
            <ConfirmDialog />

            <Button icon="pi pi-arrow-left" label="Back" onClick={handleBack} className="mb-4" />

            <h1 className="text-4xl font-bold mb-4">{student?.client?.name}'s Details</h1>

            <div className="grid">
                <div className="col-12 md:col-6 lg:col-4">
                    <Card title="Personal Information" className="mb-4">
                        <p><strong>Email:</strong> {student?.client?.user?.email}</p>
                        <p><strong>Fitness Goal:</strong> {student?.client?.fitnessGoal}</p>
                        <p><strong>Activity Level:</strong> {student?.client?.activityLevel}</p>
                    </Card>
                </div>

                <div className="col-12 md:col-6 lg:col-4">
                    <Card title="Recent Activities" className="mb-4">
                        <Timeline value={activities} content={(item) => item.description} opposite={(item) => formatDate(item.timestamp)} />
                    </Card>
                </div>

                <div className="col-12 md:col-6 lg:col-4">
                    <Card title="Progress" className="mb-4">
                        <Chart type="pie" data={progressData} options={{ responsive: true }} />
                    </Card>
                </div>
            </div>

            <Card title="Current Training Plans" className="mb-4">
                <DataTable value={currentPlans} paginator rows={5} className="p-datatable-responsive">
                    <Column field="workout.planName" header="Plan Name" />
                    <Column field="instanceName" header="Description" />
                    <Column field="personalizedNotes" header="Notes" />
                    <Column field="expectedStartDate" header="Expected Start Date" body={(rowData) => formatDate(rowData.expectedStartDate)} />
                    <Column field="expectedEndDate" header="Expected End Date" body={(rowData) => formatDate(rowData.expectedEndDate)} />
                    <Column field="status" header="Status" />
                    <Column field="progress" header="Progress" body={progressBodyTemplate} />
                    <Column body={actionBodyTemplate} exportable={false} style={{ minWidth: '8rem' }} />
                </DataTable>
            </Card>

            <Card title="Completed Training Plans" className="mb-4">
                <DataTable value={completedPlans} paginator rows={5} className="p-datatable-responsive">
                    <Column field="workout.planName" header="Plan Name" />
                    <Column field="instanceName" header="Description" />
                    <Column field="personalizedNotes" header="Notes" />
                    <Column field="expectedStartDate" header="Start Date" body={(rowData) => formatDate(rowData.expectedStartDate)} />
                    <Column field="expectedEndDate" header="End Date" body={(rowData) => formatDate(rowData.expectedEndDate)} />
                    <Column field="status" header="Status" />
                    <Column field="progress" header="Progress" body={progressBodyTemplate} />
                    <Column body={actionBodyTemplate} exportable={false} style={{ minWidth: '8rem' }} />
                </DataTable>
            </Card>

            <Dialog header="Plan Details" visible={planDetailsVisible} style={{ width: '50vw' }} onHide={() => setPlanDetailsVisible(false)}>
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
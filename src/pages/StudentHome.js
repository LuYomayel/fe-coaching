import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { UserContext } from '../utils/UserContext';
import { useToast } from '../utils/ToastContext';

import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Chart } from 'primereact/chart';

import PlanDetails from '../dialogs/PlanDetails';
import { formatDate } from '../utils/UtilFunctions';

import '../styles/StudentHome.css';
const apiUrl = process.env.REACT_APP_API_URL;

const StudentHome = () => {
  const { user } = useContext(UserContext);
  const [workouts, setWorkouts] = useState([]);
  const [planDetailsVisible, setPlanDetailsVisible] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const showToast = useToast();
  const [progressData, setProgressData] = useState({
    labels: ['Completed', 'Pending'],
    datasets: [
      {
        data: [0, 0],
        // backgroundColor: ['#36A2EB', '#FFCE56'],
        // hoverBackgroundColor: ['#36A2EB', '#FFCE56']
      }
    ]
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${apiUrl}/workout/userId/${user.userId}`)
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json();
          console.log(errorData)
          throw new Error(errorData.message || 'Something went wrong');
        }
        return response.json()
      })
      .then(data => {
        const mappedData = data.filter(data => data.groups.length > 0);
        setWorkouts(mappedData);
        const completed = mappedData.filter(workout => workout.status === 'completed').length;
        const pending = mappedData.filter(workout => workout.status === 'pending').length;

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
      })
      .catch(error => showToast('error', 'Error', error.message));
  }, [user.userId, refreshKey]);

  const viewActionButtons = (rowData) => {
    return <div className='flex  gap-2'> 
      <Button icon="pi pi-eye" onClick={() => handleViewPlanDetails(rowData)} />
      <Button label="Start Training" onClick={() => handleStartTraining(rowData)} />
    </div>
  }

  const handleViewPlanDetails = (plan) => {
    setSelectedPlan(plan);
    setPlanDetailsVisible(true);
  };

  const hidePlanDetails = () => {
    setPlanDetailsVisible(false);
    setSelectedPlan(null);
  };

  const handleStartTraining = (plan) => {
    navigate(`/plans/start-session/${plan.id}`, { state: { isTraining: true, planId: plan.id } });
  };
  

  return (
    <div className="student-home-container">
      <h1>Welcome, {user.name}!</h1>
      <div className="student-home-content p-grid">
        <div></div>
        <div className="p-col-12 p-md-6">
          <Card title="Your Training Plans">
            <DataTable value={workouts} paginator rows={5}>
              <Column field="workout.planName" header="Plan Name" />
              <Column field="instanceName" header="Instance Name" />
              <Column field="expectedStartDate" header="Start Date" body={(rowData) => formatDate(rowData.expectedStartDate)} />
              <Column field="expectedEndDate" header="End Date" body={(rowData) => formatDate(rowData.expectedEndDate)} />
              <Column field="status" header="Status" />
              <Column body={viewActionButtons} header="Actions" />
            </DataTable>
          </Card>
        </div>
        <div className="p-col-12 p-md-6">
          <Card title="Progress">
            <Chart type="pie" data={progressData} />
          </Card>
        </div>

        <Dialog header="Plan Details" visible={planDetailsVisible} style={{ width: '80vw' }} onHide={hidePlanDetails}>
          {selectedPlan && <PlanDetails planId={selectedPlan.id} setPlanDetailsVisible={setPlanDetailsVisible} setRefreshKey={setRefreshKey} />}
        </Dialog>
      </div>
    </div>
  );
};

export default StudentHome;
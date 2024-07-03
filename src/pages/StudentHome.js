import React, { useContext, useEffect, useState } from 'react';
import { UserContext } from '../utils/UserContext';
// import { Link } from 'react-router-dom';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
// import { Chart } from 'primereact/chart';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import PlanDetails from '../dialogs/PlanDetails';
import '../styles/StudentHome.css';
const apiUrl = process.env.REACT_APP_API_URL;
const StudentHome = () => {
  const { user } = useContext(UserContext);
  const [workouts, setWorkouts] = useState([]);
  // const [progressData, setProgressData] = useState({});
  const [planDetailsVisible, setPlanDetailsVisible] = useState(false);
  // eslint-disable-next-line
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const formatDate = (value) => {
    if (!value) return '';
    const date = new Date(value);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Los meses son indexados desde 0
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  
  useEffect(() => {
    // Fetch workouts for the student
    fetch(`${apiUrl}/workout/userId/${user.userId}`)
      .then(response => response.json())
      .then(data => {
        console.log(user.userId)
        const mappedData = data.filter(data => data.groups.length > 0)
        setWorkouts(mappedData)
      })
      .catch(error => console.error('Error fetching workouts:', error));
// eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  const viewPlanDetailsTemplate = (rowData) => {
    return  <Button icon="pi pi-eye" onClick={() => handleViewPlanDetails(rowData)} />
  };

  const handleViewPlanDetails = (plan) => {
    setSelectedPlan(plan);
    setPlanDetailsVisible(true);
  };

  const hidePlanDetails = () => {
    setPlanDetailsVisible(false);
    setSelectedPlan(null);
  };

  return (
    <div className="student-home-container">
      <h1>Welcome, {user.name}!</h1>
      <div className="student-home-content p-grid">
        <div className="p-col-12 p-md-6">
          <Card title="Your Training Plans">
            <DataTable value={workouts} paginator rows={5}>
              <Column field="workout.planName" header="Plan Name" />
              <Column field="instanceName" header="Start Date" />
              <Column field="expectedStartDate" header="Start Date"  body={(rowData) => formatDate(rowData.expectedStartDate)}  />
              <Column field="expectedEndDate" header="End Date"  body={(rowData) => formatDate(rowData.expectedStartDate)} />
              <Column field="status" header="Status" />
              <Column body={viewPlanDetailsTemplate} header="View Details" />
            </DataTable>
          </Card>
        </div>
        <div className="p-col-12 p-md-6">
          <Card title="Progress">
            {/* <Chart type="pie" data={progressData} /> */}
          </Card>
        </div>

        <Dialog header="Plan Details" visible={planDetailsVisible} style={{ width: '80vw' }} onHide={hidePlanDetails}>
            {selectedPlan && <PlanDetails planId={selectedPlan.id} setPlanDetailsVisible={setPlanDetailsVisible} 
              setRefreshKey={setRefreshKey}  />}
          </Dialog>
      </div>
    </div>
  );
};

export default StudentHome;
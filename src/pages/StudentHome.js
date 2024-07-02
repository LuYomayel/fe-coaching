import React, { useContext, useEffect, useState } from 'react';
import { UserContext } from '../utils/UserContext';
import { Link } from 'react-router-dom';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Chart } from 'primereact/chart';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import PlanDetails from '../dialogs/PlanDetails';
import '../styles/StudentHome.css';
const apiUrl = process.env.REACT_APP_API_URL;
const StudentHome = () => {
  const { user } = useContext(UserContext);
  const [workouts, setWorkouts] = useState([]);
  const [progressData, setProgressData] = useState({});
  const [planDetailsVisible, setPlanDetailsVisible] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState(null);

    console.log(user)
  useEffect(() => {
    // Fetch workouts for the student
    fetch(`${apiUrl}/workout/userId/${user.userId}`)
      .then(response => response.json())
      .then(data => {
        console.log(data)
        const mappedData = data.filter(data => data.groups.length > 0)
        setWorkouts(mappedData)
      })
      .catch(error => console.error('Error fetching workouts:', error));

    // Fetch progress data for the student
//     fetch(`/api/progress?studentId=${user.id}`)
//       .then(response => response.json())
//       .then(data => {
//         const progressData = {
//           labels: data.labels,
//           datasets: [
//             {
//               data: data.values,
//               backgroundColor: ['#66BB6A', '#FFA726', '#EF5350'],
//               hoverBackgroundColor: ['#81C784', '#FFB74D', '#E57373']
//             }
//           ]
//         };
//         setProgressData(progressData);
//       })
//       .catch(error => console.error('Error fetching progress data:', error));
  }, [user.id]);

  const viewPlanDetailsTemplate = (rowData) => {
    return <Button icon="pi pi-eye" onClick={() => handleViewPlanDetails(rowData)} />;
  };

  const handleViewPlanDetails = (plan) => {
    console.log(plan)
    // return;
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
              <Column field="expectedStartDate" header="Start Date" />
              <Column field="expectedEndDate" header="End Date" />
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
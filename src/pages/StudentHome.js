import React, { useContext, useEffect, useState } from 'react';
import { UserContext } from '../utils/UserContext';
import { Link } from 'react-router-dom';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Chart } from 'primereact/chart';
import '../styles/StudentHome.css';
const apiUrl = process.env.REACT_APP_API_URL;
const StudentHome = () => {
  const { user } = useContext(UserContext);
  const [workouts, setWorkouts] = useState([]);
  const [progressData, setProgressData] = useState({});
    console.log(user)
  useEffect(() => {
    // Fetch workouts for the student
    fetch(`${apiUrl}/workouts/clientId/${user.id}`)
      .then(response => response.json())
      .then(data => setWorkouts(data))
      .catch(error => console.error('Error fetching workouts:', error));

    // Fetch progress data for the student
    fetch(`/api/progress?studentId=${user.id}`)
      .then(response => response.json())
      .then(data => {
        const progressData = {
          labels: data.labels,
          datasets: [
            {
              data: data.values,
              backgroundColor: ['#66BB6A', '#FFA726', '#EF5350'],
              hoverBackgroundColor: ['#81C784', '#FFB74D', '#E57373']
            }
          ]
        };
        setProgressData(progressData);
      })
      .catch(error => console.error('Error fetching progress data:', error));
  }, [user.id]);

  return (
    <div className="student-home-container">
      <h1>Welcome, {user.name}!</h1>
      <div className="student-home-content p-grid">
        <div className="p-col-12 p-md-6">
          <Card title="Your Training Plans">
            {/* <DataTable value={workouts} paginator rows={5}>
              <Column field="planName" header="Plan Name" />
              <Column field="expectedStartDate" header="Start Date" />
              <Column field="expectedEndDate" header="End Date" />
              <Column field="status" header="Status" />
              <Column header="Details" body={(rowData) => <Link to={`/student/plans/${rowData.id}`}>View Details</Link>} />
            </DataTable> */}
          </Card>
        </div>
        <div className="p-col-12 p-md-6">
          <Card title="Progress">
            <Chart type="pie" data={progressData} />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentHome;
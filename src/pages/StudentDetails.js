import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Chart } from 'primereact/chart';
        
import '../styles/StudentDetails.css';

const apiUrl = process.env.REACT_APP_API_URL;

const StudentDetails = () => {
  const { studentId } = useParams();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  useEffect(() => {
    fetch(`${apiUrl}/subscription/client/${studentId}`)
      .then(response => response.json())
      .then(data => {
        console.log(data)
        setStudent(data);
        setLoading(false);
      })
      .catch(error => {
        setLoading(false);
      });
  }, [studentId]);

  const handleBack = () => {
    navigate('/')
  }
  if (loading) return <p>Loading...</p>;
  
  // const completedCount = student.workouts.filter(plan => plan.status === 'completed').length;
  // const pendingCount = student.workouts.filter(plan => plan.status === 'pending').length;
  // const expiredCount = student.workouts.filter(plan => new Date(plan.expectedEndDate) < new Date() && plan.status !== 'completed').length;
  const expiredCount = 0;
  
  // const progressData = {
  //   labels: ['Completed', 'Pending', 'Expired'],
  //   datasets: [
  //     {
  //       data: [completedCount, pendingCount, expiredCount],
  //       backgroundColor: ['#4caf50', '#ffeb3b', '#f44336'],
  //       hoverBackgroundColor: ['#388e3c', '#fbc02d', '#d32f2f']
  //     }
  //   ]
  // };

  const formatDate = (value) => {
    if (!value) return '';
    const date = new Date(value);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Los meses son indexados desde 0
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };
  
  return (
    <div className="student-details-container">
      <div className='flex align-items-center justify-content-between'>
        <div>
          <Button icon="pi pi-arrow-left" onClick={handleBack} />
        </div>
        <div><h1>{student.client.user.name}'s Details</h1></div>
        <div>&nbsp;</div>
      </div>
      
      <div className='flex justify-content-between'>
        <div>
          <div className="flex flex-column">
            {/* <img src={student.profilePicture} alt="Profile" className="profile-picture" /> */}
            <h2>Personal Information</h2>
            <Card>
              <p><strong>Email:</strong> {student.client.user.email}</p>
              <p><strong>Fitness Goal:</strong> {student.client.fitnessGoal}</p>
              <p><strong>Activity Level:</strong> {student.client.activityLevel}</p>
            </Card>
          </div>
        </div>
      
        <div className='container'>
          <h2>Current Training Plans</h2>
          <DataTable value={student.workoutInstances} paginator rows={15} className="assigned-plans-table">
            <Column field="workout.planName" header="Plan Name" />
            <Column field="dateAssigned" header="Date Assigned" body={(rowData) => formatDate(rowData.dateAssigned)} />
            <Column field="status" header="Status" />
            <Column field="progress" header="Progress" />
          </DataTable>

          {/* <h2>Expired Training Plans</h2>
          <DataTable value={student.workoutInstances.filter(plan => plan.status === 'completed')} paginator rows={5} className="expired-plans-table">
            <Column field="planName" header="Plan Name" />
            <Column field="dateAssigned" header="Date Assigned" />
            <Column field="endDate" header="End Date" />
            <Column field="status" header="Status" />
          </DataTable> */}
        </div>

        
        <div className=''>
          <h2>Progress</h2>
          <Card title="Progress Chart">
            {/* <Chart type="pie" data={progressData} /> */}
          </Card>

          <h2>Activity Summary</h2>
          <Card title="Recent Activities">
            {/* Aquí podrías mapear las actividades recientes del estudiante */}
          </Card>

          <h2>Notes and Comments</h2>
          <Card title="Coach's Notes">
            {/* Sección para agregar notas y comentarios del coach */}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentDetails;
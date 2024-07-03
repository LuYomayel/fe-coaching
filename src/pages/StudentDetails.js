import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
// import { Chart } from 'primereact/chart';
import { Dialog } from 'primereact/dialog';
import { useToast } from '../utils/ToastContext';
import { useConfirmationDialog } from '../utils/ConfirmationDialogContext';
import PlanDetails from '../dialogs/PlanDetails';
import '../styles/StudentDetails.css';

const apiUrl = process.env.REACT_APP_API_URL;

const StudentDetails = () => {
  const { studentId } = useParams();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [planDetailsVisible, setPlanDetailsVisible] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const showToast = useToast();
  const { showConfirmationDialog } = useConfirmationDialog();
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
  }, [studentId, refreshKey]);

  const handleBack = () => {
    navigate(-1)
  }
  if (loading) return <p>Loading...</p>;

  const formatDate = (value) => {
    if (!value) return '';
    const date = new Date(value);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Los meses son indexados desde 0
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const viewPlanDetailsTemplate = (rowData) => {
    return <div className='flex align-items-center gap-1'>
      <Button icon="pi pi-eye" onClick={() => handleViewPlanDetails(rowData)} tooltip='View Plan'/>
      <Button icon="pi pi-trash" onClick={() => handleDeletePlan(rowData)} tooltip='Delete'/>
    </div>
    ;
  };

  const handleDeletePlan = (plan) =>{
    showConfirmationDialog({
      message: "Are you sure you want to delete this plan?",
      header: "Confirmation",
      icon: "pi pi-exclamation-triangle",
      accept: () => fetchDeletePlan(plan),
      reject: () => console.log('Rejected')
  });
  }

  const fetchDeletePlan = (plan) => {
    fetch(`${apiUrl}/workout/deleteInstance/${plan.id}`, {
      method: "DELETE",
      headers: {
        'Content-Type': 'application/json',
      },
    }).then((response) => {
      if(response.ok){
        showToast('success', 'Plan deleted!', `You have deleted the plan ${plan.workout.planName} successfully!`);
        setRefreshKey(old => old+1)
      }else{
        showToast('error', 'Something unexpected happened!', response.error)
      }
    });
  }

  const handleViewPlanDetails = (workoutInstance) => {
    setSelectedPlan(workoutInstance.id);
    setPlanDetailsVisible(true);
  };

  const hidePlanDetails = () => {
    setPlanDetailsVisible(false);
    setSelectedPlan(null);
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
            <Column field="instanceName" header="Description" />
            <Column field="personalizedNotes" header="Notes" />
            <Column field="expectedStartDate" header="Expected Start Date" body={(rowData) => formatDate(rowData.expectedStartDate)} />
            <Column field="expectedEndDate" header="Expected End Date" body={(rowData) => formatDate(rowData.expectedEndDate)} />
            <Column field="status" header="Status" />
            <Column field="progress" header="Progress" />
            <Column body={viewPlanDetailsTemplate} header="Actions" />
          </DataTable>

          <Dialog header="Plan Details" visible={planDetailsVisible} style={{ width: '80vw' }} onHide={hidePlanDetails}>
            {selectedPlan && <PlanDetails planId={selectedPlan} setPlanDetailsVisible={setPlanDetailsVisible} 
              setRefreshKey={setRefreshKey}  />}
          </Dialog>

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
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Chart } from 'primereact/chart';
import { Dialog } from 'primereact/dialog';
import { Timeline } from 'primereact/timeline';

import { useToast } from '../utils/ToastContext';
import { useConfirmationDialog } from '../utils/ConfirmationDialogContext';
import PlanDetails from '../dialogs/PlanDetails';

import { formatDate } from '../utils/UtilFunctions';

import '../styles/StudentDetails.css';
import { Fieldset } from 'primereact/fieldset';

const apiUrl = process.env.REACT_APP_API_URL;

const StudentDetails = () => {
  const { studentId } = useParams();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [planDetailsVisible, setPlanDetailsVisible] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activities, setActivities ] = useState([]);
  const [progressData, setProgressData] = useState({
    labels: ['Completed', 'Pending'],
    datasets: [
      {
        data: [0, 0],
        backgroundColor: ['green', 'red'],
              hoverBackgroundColor: ['green', 'red']
      }
    ]
  });
  const showToast = useToast();
  const { showConfirmationDialog } = useConfirmationDialog();
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${apiUrl}/subscription/client/${studentId}`)
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json();
          console.log(errorData)
          throw new Error(errorData.message || 'Something went wrong');
        }
        return response.json();
      })
      .then(data => {
        setStudent(data);

        const completed = data.workoutInstances.filter(workout => workout.status === 'completed').length;
        const pending = data.workoutInstances.filter(workout => workout.status === 'pending').length;

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

        setLoading(false);
      })
      .catch(error => {
        setLoading(false);
        showToast('error', 'Error', error.message);
      });
      // console.log('student id: ', studentId)
    fetch(`${apiUrl}/users/clientId/activities/${studentId}`)
      .then( async (response) => {
        if (!response.ok) {
          const errorData = await response.json();
          console.log(errorData)
          throw new Error(errorData.message || 'Something went wrong');
        }
        const data = await response.json();
        setActivities(data)
      })
      .catch(error => showToast('error', 'Error', error.message))
  }, [studentId, refreshKey]);

  const customizedMarker = (item) => {
    return (
      <span className="custom-marker p-shadow-2" style={{ backgroundColor: '#FFCE56' }}>
        <i className="pi pi-check" style={{ color: '#fff' }}></i>
      </span>
    );
  };

  const customizedContent = (item) => {
    return (
      <Card title={item.description}>
        <p>{new Date(item.timestamp).toLocaleString()}</p>
      </Card>
    );
  };

  const handleBack = () => {
    navigate(-1)
  }
  if (loading) return <p>Loading...</p>;

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
    }).then(async (response) => {
      if(response.ok){
        showToast('success', 'Plan deleted!', `You have deleted the plan ${plan.workout.planName} successfully!`);
        setRefreshKey(old => old+1)
      }else{
        const errorData = await response.json();
        console.log(errorData)
        throw new Error(errorData.message || 'Something went wrong');
      }
    })
    .catch(error => showToast('error', 'Error', error.message))
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
        <div><h1>{student.client.name}'s Details</h1></div>
        <div>&nbsp;</div>
      </div>
      
      <div className='flex justify-content-between gap-4'>
        <div className='w-4'>
          <div className="flex flex-column">
            {/* <img src={student.profilePicture} alt="Profile" className="profile-picture" /> */}
            <h2>Personal Information</h2>
            <Card>
              <p><strong>Email:</strong> {student.client.user.email}</p>
              <p><strong>Fitness Goal:</strong> {student.client.fitnessGoal}</p>
              <p><strong>Activity Level:</strong> {student.client.activityLevel}</p>
            </Card>
          </div>
          <Fieldset legend="Recent Activities">
            <Timeline value={activities} opposite={(item) => item.description} 
              content={(item) => <small className="text-color-secondary">{formatDate(item.timestamp)}</small>} align="alternate"/>
            {/* <Timeline value={activities} align="alternate" marker={customizedMarker} content={customizedContent} /> */}
          </Fieldset>
        </div>
      
        <div className='container flex-grow-1'>
          <h2>Current Training Plans</h2>
          <DataTable value={student.workoutInstances.filter( workout => workout.status === 'pending')} paginator rows={5} className="assigned-plans-table">
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

          <h2>Completed Training Plans</h2>
          <DataTable value={student.workoutInstances.filter( workout => workout.status === 'completed')} paginator rows={5} className="assigned-plans-table">
            <Column field="workout.planName" header="Plan Name" />
            <Column field="instanceName" header="Description" />
            <Column field="personalizedNotes" header="Notes" />
            <Column field="expectedStartDate" header="Expected Start Date" body={(rowData) => formatDate(rowData.expectedStartDate)} />
            <Column field="expectedEndDate" header="Expected End Date" body={(rowData) => formatDate(rowData.expectedEndDate)} />
            <Column field="status" header="Status" />
            <Column field="progress" header="Progress" />
            <Column body={viewPlanDetailsTemplate} header="Actions" />
          </DataTable>
        </div>

        
        <div className='w-2'>
          {/* <h2>Progress</h2> */}
          <Fieldset legend="Progress Chart">
            <Chart type="pie" data={progressData} />
          </Fieldset>

          {/* <h2>Activity Summary</h2> */}
          

          {/* <h2>Notes and Comments</h2>
          <Card title="Coach's Notes">
            
          </Card> */}
        </div>
      </div>
    </div>
  );
};

export default StudentDetails;
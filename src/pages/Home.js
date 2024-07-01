
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog  } from 'primereact/dialog';
import { useToast } from '../utils/ToastContext';
import PlanDetails from './PlanDetails';
import '../styles/Home.css';


const apiUrl = process.env.REACT_APP_API_URL;

const CoachHome = () => {
  const [students, setStudents] = useState([]);
  const [plans, setPlans] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [selectedPlans, setSelectedPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [planDetailsVisible, setPlanDetailsVisible] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const showToast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${apiUrl}/subscription/coach/1`)
      .then(response => response.json())
      .then(data => {
        setStudents(data)
      })
      .catch(error => showToast('error', `${error.message}`, 'Error fetching plan details'));

      fetch(`${apiUrl}/workout`)
      .then(response => response.json())
      .then(data => {
        setPlans(data);
      })
      .catch(error => showToast('error', `${error.message}`, 'Error fetching plan details'));
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  // const handleRowClick = (studentId) => {
  //   navigate(`/students/${studentId}/plans`);
  // };

  const onRowSelect = (event) => {
    setSelectedStudent(event.value);
    setSelectedPlans([])
  };

  const handleNewPlan = () => {
    // console.log(selectedPlans, selectedStudent)
    navigate('/plans/create')
  }

  const handleAssignPlan = () => {
    console.log(selectedPlans, selectedStudent)
    const body = {
      clientSubscription: selectedStudent,
      workouts: selectedPlans
    }
    fetch(`${apiUrl}/workout/assignWorkout`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }).then((response) => {
      return response.json();
    }).then( (data) => {
      if(data.alreadyAssignedWorkouts){
        showToast('warning', data.message, `${data.alreadyAssignedWorkouts.join(', ')}`)
      }else{
        showToast('success', data.message)
      }
      setRefreshKey(oldKey => oldKey+1)
      setSelectedPlans([])
      setSelectedStudent(null)
    })
  }

  const hidePlanDetails = () => {
    setPlanDetailsVisible(false);
    setSelectedPlan(null);
  };

  const handleViewPlanDetails = (plan) => {
    setSelectedPlan(plan);
    setPlanDetailsVisible(true);
  };

  const handleViewStudentDetails = (student) => {
    console.log(student)
    navigate(`/students/${student.id}/details`)
    
  };

  const isRowSelectable = (event) => {
    return selectedStudent ? 
      !selectedStudent.workouts.find( workout => workout.id === event.data.id)
    : true
  }
  const viewPlanDetailsTemplate = (rowData) => {
    return <Button icon="pi pi-eye" onClick={() => handleViewPlanDetails(rowData)} />;
  };

  const viewStudentDetailsTemplate = (rowData) => {
    return <Button icon="pi pi-eye" onClick={() => handleViewStudentDetails(rowData)} />;
  };

  return (
    <div>
      <h1>DashBoard</h1>
      <div className='flex align-content-center justify-content-between container'>
        <div>
          <h1>My Students</h1> 
          <DataTable value={students} paginator rows={10} selectionMode="radiobutton" dataKey='id' selection={selectedStudent} 
          onSelectionChange={(e) => setSelectedStudent(e.value)} onRowSelect={onRowSelect} className='flex-grow-1'>
            <Column selectionMode="single" headerStyle={{ width: '3rem' }}></Column>
            <Column field="client.user.name" header="Name" />
            <Column field="client.user.email" header="Email" />
            <Column field="client.fitnessGoal" header="Fitness Goal" />
            <Column field="client.activityLevel" header="Activity Level" />
            <Column body={viewStudentDetailsTemplate} header="View Details" />
          </DataTable>
        </div>
        <div>
          <h1>My Plans</h1> {/* Agregar un título para la segunda tabla */}
          <DataTable value={plans} paginator rows={10} selectionMode="radiobutton" dataKey='id' selection={selectedPlans}
          onSelectionChange={(e) => setSelectedPlans(e.value)} isDataSelectable={isRowSelectable} className='flex-grow-1'>
          <Column selectionMode="multiple" headerStyle={{ width: '3rem' }}></Column>
            <Column field="planName" header="Plan Name" />
            <Column field="startDate" header="Start Date" />
            <Column field="endDate" header="End Date" />
            <Column field="details" header="Details" />
            <Column body={viewPlanDetailsTemplate} header="View Details" />
          </DataTable>
        </div>
        <Dialog header="Plan Details" visible={planDetailsVisible} style={{ width: '80vw' }} onHide={hidePlanDetails}>
          {selectedPlan && <PlanDetails planId={selectedPlan.id} setPlanDetailsVisible={setPlanDetailsVisible} 
          setRefreshKey={setRefreshKey}  />}
        </Dialog>
        <div className='actions-section'>
          {selectedStudent && selectedPlans.length > 0 && (
            <Button 
              label="Assign Plans" 
              icon="pi pi-check" 
              className="p-button-rounded p-button-lg p-button-secondary create-plan-button" 
              onClick={handleAssignPlan} 
            />
          )}
          <Button label="Create New Plan" icon="pi pi-plus" className="p-button-rounded p-button-lg p-button-primary create-plan-button" onClick={handleNewPlan}/>
        </div>
      </div>
    </div>
  );
};

export default CoachHome;
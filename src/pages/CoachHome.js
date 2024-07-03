
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog  } from 'primereact/dialog';
import { useToast } from '../utils/ToastContext';
import PlanDetails from '../dialogs/PlanDetails';
import AssignPlanDialog from '../dialogs/AssignPlanDialog';
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
  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const showToast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
      fetch(`${apiUrl}/subscription/coach/1`)
        .then(response => response.json())
        .then(data => {
          setStudents(data);
        })
        .catch(error => showToast('error', 'Error fetching students', `${error.message}`));
    
        fetch(`${apiUrl}/workout`)
        .then(response => response.json())
        .then(data => {
          setPlans(data);
        })
        .catch(error => showToast('error', 'Error fetching plans' `${error.message}`));
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

  const hidePlanDetails = () => {
    setPlanDetailsVisible(false);
    setSelectedPlan(null);
  };

  const isRowSelectable = (event) => {
    // return selectedStudent ? 
    //   !selectedStudent.workoutInstances.find( workout => workout.id === event.data.id)
    // : 
    return true
  }
  const viewPlanDetailsTemplate = (rowData) => {
    return <Button icon="pi pi-eye" onClick={() => handleViewPlanDetails(rowData)} />;
  };

  const handleViewPlanDetails = (plan) => {
    console.log(plan)
    const workoutInstanceId = plan.workoutInstances.find(instances => instances.isTemplate === true).id
    // console.log(workoutInstanceId)
    setSelectedPlan(workoutInstanceId);
    setPlanDetailsVisible(true);
  };

  const viewStudentDetailsTemplate = (rowData) => {
    return <Button icon="pi pi-eye" onClick={() => handleViewStudentDetails(rowData)} />;
  };

  const handleViewStudentDetails = (student) => {
    navigate(`/students/${student.id}/details`)
  };

  const openAssignDialog = () => {
    if (selectedStudent && selectedPlans.length > 0) {
      setIsDialogVisible(true);
    } else {
      showToast('error', 'Please select both a student and at least one plan');
    }
  };

  const handleDialogHide = () => {
    setIsDialogVisible(false);
  };

  return (
    <div>
      <h1>DashBoard</h1>
      <div className='grid pr-3 pl-3'>
        <div className='col-12 md:col-6 '>
          <h1>My Students</h1> 
          <DataTable value={students} paginator rows={10} selectionMode="radiobutton" dataKey='id' selection={selectedStudent} 
          onSelectionChange={(e) => setSelectedStudent(e.value)} onRowSelect={onRowSelect} className='flex-grow-1'>
            <Column selectionMode="single" headerStyle={{ width: '3rem' }}></Column>
            <Column field="client.user.name" header="Name" />
            <Column field="client.user.email" header="Email" />
            <Column field="client.fitnessGoal" header="Fitness Goal" />
            <Column field="client.activityLevel" header="Activity Level" />
            <Column body={viewStudentDetailsTemplate} header="View Details" alignHeader={'center'} />
          </DataTable>
        </div>
        <div className='col-12 md:col-6'>
          <h1>My Plans</h1> {/* Agregar un título para la segunda tabla */}
          <DataTable value={plans}
            paginator rows={10}  dataKey='id' 
            onSelectionChange={(e) => setSelectedPlans(e.value)} isDataSelectable={isRowSelectable} className='flex-grow-1' selectionMode="radiobutton" selection={selectedPlans}
          >
            <Column selectionMode="multiple" headerStyle={{ width: '3rem' }}></Column>
            <Column field="planName" header="Plan Name" />
            <Column body={viewPlanDetailsTemplate} header="View Details" alignHeader={'center'} />
          </DataTable>
        </div>
        
        <div className='actions-section'>
          {selectedStudent && selectedPlans.length > 0 && (
            <Button 
              label="Assign Plans" 
              icon="pi pi-check" 
              className="p-button-rounded p-button-lg p-button-secondary create-plan-button" 
              onClick={openAssignDialog} 
            />
          )}
          <Button label="Create New Plan" icon="pi pi-plus" className="p-button-rounded p-button-lg p-button-primary create-plan-button" onClick={handleNewPlan}/>

          <Dialog header="Plan Details" visible={planDetailsVisible} style={{ width: '80vw' }} onHide={hidePlanDetails}>
            {selectedPlan && <PlanDetails planId={selectedPlan} setPlanDetailsVisible={setPlanDetailsVisible} 
              setRefreshKey={setRefreshKey}  />}
          </Dialog>

          <Dialog header="Assign Plan" visible={isDialogVisible} style={{ width: '50vw' }} onHide={handleDialogHide}>
            <AssignPlanDialog selectedStudent={selectedStudent} selectedPlans={selectedPlans} onClose={handleDialogHide} />
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default CoachHome;
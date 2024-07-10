
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog  } from 'primereact/dialog';
import { Card } from 'primereact/card';
import { useToast } from '../utils/ToastContext';
import PlanDetails from '../dialogs/PlanDetails';
import AssignPlanDialog from '../dialogs/AssignPlanDialog';
import NewStudentDialog from '../dialogs/NewStudentDialog';
import '../styles/Home.css';
import { UserContext } from '../utils/UserContext';

const apiUrl = process.env.REACT_APP_API_URL;

const CoachHome = () => {
  const [students, setStudents] = useState([]);
  const [plans, setPlans] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [selectedPlans, setSelectedPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const [refreshKey, setRefreshKey] = useState(0);

  const [planDetailsVisible, setPlanDetailsVisible] = useState(false);
  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const [isNewStudentDialogVisible, setIsNewStudentDialogVisible] = useState(false);

  const showToast = useToast();
  const { user } = useContext(UserContext)
  const navigate = useNavigate();

  useEffect(() => {
    if(!user) 
      console.log()
      fetch(`${apiUrl}/subscription/coach/userId/${user.userId}`)
        .then(async (response) => {
          if (!response.ok) {
            const errorData = await response.json();
            console.log(errorData)
            if(errorData.message === 'Coach not found')
              navigate('/complete-coach-profile')
            else
              throw new Error(errorData.message || 'Something went wrong');
          }
          const data = await response.json();
          setStudents(data)

        })
        .catch(error => showToast('error', 'Error fetching students', `${error.message}`));

      fetch(`${apiUrl}/workout/coach-workouts/userId/${user.userId}`)
        .then(async (response) => {
          if (!response.ok) {
            const errorData = await response.json();
            console.log(errorData)
            throw new Error(errorData.message || 'Something went wrong');
          }
          const data = await response.json()
          setPlans(data);
        })
        .catch(error => showToast('error', 'Error fetching plans' `${error.message}`));
        // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const onRowSelect = (event) => {
    setSelectedStudent(event.value);
    setSelectedPlans([])
  };

  const handleNewPlan = () => {
    navigate('/plans/create')
  }

  const hidePlanDetails = () => {
    setPlanDetailsVisible(false);
    setSelectedPlan(null);
  };

  const isRowSelectable = (event) => {
    return true
  }
  const viewPlanDetailsTemplate = (rowData) => {
    return <Button icon="pi pi-eye" onClick={() => handleViewPlanDetails(rowData)} />;
  };

  const handleViewPlanDetails = (plan) => {
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

  const openNewStudentDialog = () => {
    setIsNewStudentDialogVisible(true);
  };
  
  const handleNewStudentDialogHide = () => {
    setIsNewStudentDialogVisible(false);
    setRefreshKey(prevKey => prevKey + 1); // Refresh the list after adding a new student
  };

  return (
    <div>
      <h1>DashBoard</h1>
      <div className='grid pr-3 pl-3'>
        <div className='col-12 md:col-6 '>
          <h1>Active Students</h1> 
          {/* {students.map(client => (
            <Card key={client.id} title={client.name} subTitle={client.email} className="card">
              <p><strong>Fitness Goal:</strong> {client.fitnessGoal}</p>
              <p><strong>Activity Level:</strong> {client.activityLevel}</p>
              <Button label="View Details" icon="pi pi-eye" className="p-button-rounded p-button-info" />
            </Card>
          ))} */}
          <DataTable value={(students || [])} paginator rows={10} selectionMode="radiobutton" dataKey='id' selection={selectedStudent} 
          onSelectionChange={(e) => setSelectedStudent(e.value)} onRowSelect={onRowSelect} className='flex-grow-1'>
            <Column selectionMode="single" headerStyle={{ width: '3rem' }}></Column>
            <Column field="client.name" header="Name" />
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
          <Button label="Add New Student" icon="pi pi-plus" className="p-button-rounded p-button-lg p-button-primary create-student-button" onClick={openNewStudentDialog} />
          <Button label="Create New Plan" icon="pi pi-plus" className="p-button-rounded p-button-lg p-button-primary create-student-button" onClick={handleNewPlan}/>
        </div>

        <Dialog header="Plan Details" visible={planDetailsVisible} style={{ width: '80vw' }} onHide={hidePlanDetails}>
          {selectedPlan && <PlanDetails planId={selectedPlan} setPlanDetailsVisible={setPlanDetailsVisible} 
            setRefreshKey={setRefreshKey}  />}
        </Dialog>

        <Dialog header="Assign Plan" visible={isDialogVisible} style={{ width: '50vw' }} onHide={handleDialogHide}>
          <AssignPlanDialog selectedStudent={selectedStudent} selectedPlans={selectedPlans} onClose={handleDialogHide} />
        </Dialog>
        <Dialog header="New Student" visible={isNewStudentDialogVisible} style={{ width: '50vw' }} onHide={handleNewStudentDialogHide}>
          <NewStudentDialog onClose={handleNewStudentDialogHide} setRefreshKey={setRefreshKey} />
        </Dialog>
      </div>
    </div>
  );
};

export default CoachHome;
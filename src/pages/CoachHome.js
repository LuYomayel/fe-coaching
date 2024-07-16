
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog  } from 'primereact/dialog';
import { Card } from 'primereact/card';
import { TreeTable } from 'primereact/treetable';
import { useToast } from '../utils/ToastContext';
import PlanDetails from '../dialogs/PlanDetails';

import CreateTrainingCycleDialog from '../dialogs/CreateTrainingCycle';
import AssignPlanDialog from '../dialogs/AssignPlanDialog';
import NewStudentDialog from '../dialogs/NewStudentDialog';
import AssignWorkoutToCycleDialog from '../dialogs/AssignWorkoutToCycleDialog';
import AssignWorkoutToSessionDialog from '../dialogs/AssignWorkoutToSessionDialog';
import { useConfirmationDialog } from '../utils/ConfirmationDialogContext';

import { formatDate } from '../utils/UtilFunctions';
import '../styles/Home.css';
import { UserContext } from '../utils/UserContext';

const apiUrl = process.env.REACT_APP_API_URL;

const CoachHome = () => {
  const [students, setStudents] = useState([]);
  const [plans, setPlans] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedPlans, setSelectedPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const [refreshKey, setRefreshKey] = useState(0);
  const [nodes, setNodes] = useState([]);

  const [planDetailsVisible, setPlanDetailsVisible] = useState(false);
  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const [isNewStudentDialogVisible, setIsNewStudentDialogVisible] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [assignCycleVisible, setAssignCycleVisible] = useState(false);
  const [assignSessionVisible, setAssignSessionVisible] = useState(false);
  const [selectedCycleId, setSelectedCycleId] = useState(null);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const { showConfirmationDialog } = useConfirmationDialog();
  const showToast = useToast();
  const { user } = useContext(UserContext)
  const navigate = useNavigate();

  useEffect(() => {
    if(!user) 
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

        fetch(`${apiUrl}/workout/training-cycles/coachId/${user.userId}`)
        .then(async (response) => {
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Something went wrong');
          }
          return response.json();
        })
        .then(cycles => {
          const nodes = cycles.map(cycle => ({
            key: `cycle-${cycle.id}`,
            data: {
              type: 'cycle',
              name: cycle.name,
              client: cycle.client.name,
              startDate: cycle.startDate,
              endDate: cycle.endDate,
              clientId: cycle.client.id
            },
            children: cycle.trainingWeeks.map(week => ({
              key: `week-${week.id}`,
              data: {
                type: 'week',
                name: `Week - ${week.weekNumber}`,
                weekNumber: week.weekNumber,
                startDate: week.startDate,
                endDate: week.endDate,
              },
              children: week.trainingSessions.map(session => ({
                key: `session-${session.id}`,
                data: {
                  sessionId: session.id,
                  name: `Day - ${session.dayNumber}`,
                  type: 'session',
                  dayNumber: session.dayNumber,
                  sessionDate: session.sessionDate,
                  startDate: session.sessionDate,
                  clientId: cycle.client.id
                },
                children: session.workoutInstances.map(workoutInstance => ({
                  key: `workoutInstance-${workoutInstance.id}`,
                  data: {
                    type: 'workoutInstance',
                    name: workoutInstance.workout.planName,
                    instanceName: workoutInstance.instanceName,
                    status: workoutInstance.status,
                    sessionTime: workoutInstance.sessionTime,
                    generalFeedback: workoutInstance.generalFeedback,
                  }
                }))
              }))
            }))
          }));
          console.log(cycles);
          setNodes(nodes);
        })
        .catch(error => showToast('error', 'Error', error.message));
        // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const actionTemplate = (node) => {
    if (node.data.type === 'cycle') {
      return <Button tooltip="Assign Workouts" icon="pi pi-refresh" className='p-button-rounded p-button-success' onClick={() => handleOpenAssignCycle(node.key.split('-')[1], node.data.clientId)} />;
    } else if (node.data.type === 'session') {
      return <Button tooltip="Assign Workout" icon="pi pi-calendar" className='p-button-rounded p-button-success' onClick={() => handleOpenAssignSession(node.key.split('-')[1], node.data.clientId)} />;
    } else if (node.data.type === 'workoutInstance') {
      return (
      <div className="flex gap-2">
        <Button tooltip='View Details' icon="pi pi-eye" className="p-button-rounded p-button-info"onClick={() => handleViewPlanDetails(node.key.split('-')[1])} />
        <Button tooltip='Edit' icon="pi pi-pencil" className="p-button-rounded p-button-warning"onClick={() => navigate(`/plans/edit/${ node.key.split('-')[1]}`)} />
        <Button tooltip='Delete' icon="pi pi-trash" className="p-button-rounded p-button-danger"onClick={() => handleDeletePlan(node.key.split('-')[1])} />
      </div>
      );
    }
    return null;
  };

  const handleOpenAssignCycle = (cycleId, clientId) => {
    setSelectedClient(clientId)
    setSelectedCycleId(cycleId);
    setAssignCycleVisible(true);
  };

  const handleOpenAssignSession = (sessionId, clientId) => {
    setSelectedClient(clientId)
    setSelectedSessionId(sessionId);

    setAssignSessionVisible(true);
  };

  const handleNewPlan = () => {
    navigate('/plans/create')
  }

  const hidePlanDetails = () => {
    setPlanDetailsVisible(false);
    setSelectedPlan(null);
  };

  const handleViewPlanDetails = (workoutInstanceId) => {
    // const workoutInstanceId = plan.workoutInstances.find(instances => instances.isTemplate === true).id
    console.log(workoutInstanceId)
    setSelectedPlan(workoutInstanceId);
    setPlanDetailsVisible(true);
  };

  const handleDeletePlan = (workoutInstanceId) => {
    
    showConfirmationDialog({
      message: "Are you sure you want to delete this plan?",
      header: "Confirmation",
      icon: "pi pi-exclamation-triangle",
      accept: () => fetchDeletePlan(workoutInstanceId),
      reject: () => console.log('Rejected')
  });
  };

  const fetchDeletePlan = (workoutInstanceId) => {
    console.log(workoutInstanceId)
    const url = `${apiUrl}/workout/deleteInstance/${workoutInstanceId}`;
    fetch(`${url}`, {
      method: "DELETE",
      headers: {
        'Content-Type': 'application/json',
      },
    })
    .then(async (response) => {
      if(response.ok){
        setRefreshKey(prev => prev + 1); // Update the refresh key to re-fetch data
        showToast('success', `You have deleted the plan with success!`, 'Plan deleted!');  
      }else{
        const errorData = await response.json();
        console.log(errorData)
        throw new Error(errorData.message || 'Something went wrong');
      }
    })
    .catch( (error) => showToast('error', 'Error', error.message))
  }

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

  const showCreateCycleDialog = () => {
    setDialogVisible(true);
  };

  const hideCreateCycleDialog = () => {
    setRefreshKey(old => old+1)
    setDialogVisible(false);
  };

  const dateBodyTemplate = (node, field) => {
    return formatDate(node.data[field]);
  };

  return (
    <div className=''>
      {/* <h1>DashBoard</h1> */}
      <div className='w-11 mx-auto'>
        {/* <div className='col-12 md:col-6 '>
          <h1>Active Students</h1> 
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
          <h1>My Plans</h1> 
          <DataTable value={plans}
            paginator rows={10}  dataKey='id' 
            onSelectionChange={(e) => setSelectedPlans(e.value)} isDataSelectable={isRowSelectable} className='flex-grow-1' selectionMode="radiobutton" selection={selectedPlans}
          >
            <Column selectionMode="multiple" headerStyle={{ width: '3rem' }}></Column>
            <Column field="planName" header="Plan Name" />
            <Column body={viewPlanDetailsTemplate} header="View Details" alignHeader={'center'} />
          </DataTable>
          
        </div> */}
        <div>
        <h1>Training Cycles</h1>
          <TreeTable value={nodes}>
            <Column field="name" header="Cycle Name" expander />
            <Column field="client" header="Client" />
            <Column field="startDate" header="Start Date" body={(node) => dateBodyTemplate(node, 'startDate')} />
            <Column field="endDate" header="End Date" body={(node) => dateBodyTemplate(node, 'endDate')} />
            <Column header="Actions" body={actionTemplate} />
          </TreeTable>
        </div>
        <div className='actions-section'>
          <Button label="Create Training Cycle" icon="pi pi-plus" className="p-button-rounded p-button-lg p-button-secondary "  onClick={showCreateCycleDialog} />
          {/* <Button label="Add New Student" icon="pi pi-plus" className="p-button-rounded p-button-lg p-button-primary create-student-button" onClick={openNewStudentDialog} /> */}
          <Button label="Create New Plan" icon="pi pi-plus" className="p-button-rounded p-button-lg p-button-primary " onClick={handleNewPlan}/>
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
        <CreateTrainingCycleDialog visible={dialogVisible} onHide={hideCreateCycleDialog} />
        <AssignWorkoutToCycleDialog
          visible={assignCycleVisible}
          onHide={() => setAssignCycleVisible(false)}
          cycleId={selectedCycleId}
          clientId={selectedClient}
          setRefreshKey={setRefreshKey}
          />
        <AssignWorkoutToSessionDialog
          visible={assignSessionVisible}
          onHide={() => setAssignSessionVisible(false)}
          sessionId={selectedSessionId}
          clientId={selectedClient}
          setRefreshKey={setRefreshKey}
        />
      </div>
    </div>
  );
};

export default CoachHome;
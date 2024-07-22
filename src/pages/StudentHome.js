import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { UserContext } from '../utils/UserContext';
import { useToast } from '../utils/ToastContext';

import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';

import { TreeTable } from 'primereact/treetable';
import PlanDetails from '../dialogs/PlanDetails';
import { formatDate } from '../utils/UtilFunctions';

import '../styles/StudentHome.css';
import { useSpinner } from '../utils/GlobalSpinner';
const apiUrl = process.env.REACT_APP_API_URL;

const StudentHome = () => {
  const { user, client } = useContext(UserContext);

  const [planDetailsVisible, setPlanDetailsVisible] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const showToast = useToast();
  const [nodes, setNodes] = useState([]);
  const { loading, setLoading } = useSpinner();
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true)
    fetch(`${apiUrl}/workout/training-cycles/clientId/${user.userId}`)
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
        setNodes(nodes);
      })
      .catch(error => showToast('error', 'Error', error.message))
      .finally(()=>setLoading(false))
  }, [user.userId, refreshKey, showToast]);

  const handleViewPlanDetails = (plan) => {
    setLoading(true)
    setSelectedPlan(plan);
    setPlanDetailsVisible(true);
  };

  const hidePlanDetails = () => {
    setPlanDetailsVisible(false);
    setSelectedPlan(null);
  };

  const handleStartTraining = (workoutInstanceId) => {
    navigate(`/plans/start-session/${workoutInstanceId}`, { state: { isTraining: true, planId: workoutInstanceId } });
  };

  const dateBodyTemplate = (node, field) => {
    return formatDate(node.data[field]);
  };
  
  const actionTemplate = (node) => {
    
    if (node.data.type === 'workoutInstance') {
      return (
      <div className="flex gap-2">
        <Button tooltip='View Details' className="p-button-rounded p-button-info" icon="pi pi-eye" onClick={() => handleViewPlanDetails(node.key.split('-')[1])} />
        {node.data.status !== 'completed' && (<Button tooltip='Start Training' className="p-button-rounded p-button-success" icon="pi pi-chart-bar" onClick={() => handleStartTraining(node.key.split('-')[1])} />)}
      </div>
      );
    }
    return null;
  };

  return (
    <div className="student-home-container">
      <h1>Welcome, {client.name}!</h1>
      <div className="flex gap-5 ">
          <TreeTable value={nodes}>
            <Column field="name" header="Cycle Name" expander />
            <Column field="startDate" header="Start Date" body={(node) => dateBodyTemplate(node, 'startDate')} />
            <Column field="endDate" header="End Date" body={(node) => dateBodyTemplate(node, 'endDate')} />
            <Column header="Actions" body={actionTemplate} />
          </TreeTable>
       
        <Dialog header="Plan Details" visible={planDetailsVisible} style={{ width: '80vw' }} onHide={hidePlanDetails}>
          {selectedPlan && <PlanDetails planId={selectedPlan} setLoading={setLoading} setPlanDetailsVisible={setPlanDetailsVisible} setRefreshKey={setRefreshKey} />}
        </Dialog>
      </div>
    </div>
  );
};

export default StudentHome;
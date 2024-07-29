import React, { useState } from 'react';
import { TabView, TabPanel } from 'primereact/tabview';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { useConfirmationDialog } from '../utils/ConfirmationDialogContext';
import { useToast } from '../utils/ToastContext';
import { validateDates } from '../utils/UtilFunctions';
import { assignWorkout } from '../services/workoutService';
const apiUrl = process.env.REACT_APP_API_URL;
const AssignPlanDialog = ({ selectedStudent, selectedPlans, onClose }) => {
  const [currentPlans, setCurrentPlans] = useState(selectedPlans);
  const [activeIndex, setActiveIndex] = useState(0);
  const { showConfirmationDialog } = useConfirmationDialog();
  const showToast = useToast();
  const [assignmentData, setAssignmentData] = useState(
    selectedPlans.map(plan => ({
      planId: plan.id,
      expectedStartDate: null,
      expectedEndDate: null,
      notes: '',
      status: 'pending',
      instanceName: '',
    }))
  );
  const [loading, setLoading] = useState(false);

  const statusOptions = [
    { label: 'Pending', value: 'pending' },
    { label: 'In Progress', value: 'in-progress' },
    { label: 'Completed', value: 'completed' },
  ];

  const handleInputChange = (index, field, value) => {
    const newAssignmentData = [...assignmentData];
    newAssignmentData[index][field] = value;
    setAssignmentData(newAssignmentData);
  };

  const handleAssign = (index) => {
    const data = {
      studentId: selectedStudent.id,
      ...assignmentData[index],
    };

    const { isValid, message } = validateDates(data.expectedStartDate, data.expectedEndDate)
    if (!isValid) {
      showToast('error', 'Error', message);
      return;
    }

    showConfirmationDialog({
        message: "Are you sure you want to assign this plan?",
        header: "Confirmation",
        icon: "pi pi-exclamation-triangle",
        accept: () => confirmAssign(index),
        reject: () => console.log('Rejected u mf')
    });
  };

  const confirmAssign = async (index) => {
    const data = {
      studentId: selectedStudent.id,
      ...assignmentData[index],
    };
    try {
      setLoading(true);
      const result = await assignWorkout(data);
      showToast('success', 'Plan assigned successfully');
      onClose(); // Asumiendo que onClose hace algo relevante después de una asignación exitosa
    } catch (error) {
      showToast('error', 'Error', error.message);
    } finally {
      setLoading(false);
    }
    
  };

  return (
    <div>
      {/* {loading && <ProgressSpinner />} */}
      <TabView activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)}>
        {currentPlans.map((plan, index) => (
          <TabPanel key={index} header={plan.planName}>
            <div className="p-grid">
              <div className="p-col-6">
                <label htmlFor={`expectedStartDate-${index}`}>Expected Start Date*</label>
                <Calendar id={`expectedStartDate-${index}`} value={assignmentData[index].expectedStartDate} onChange={(e) => handleInputChange(index, 'expectedStartDate', e.value)} />
              </div>
              <div className="p-col-6">
                <label htmlFor={`expectedEndDate-${index}`}>Expected End Date*</label>
                <Calendar id={`expectedEndDate-${index}`} value={assignmentData[index].expectedEndDate} onChange={(e) => handleInputChange(index, 'expectedEndDate', e.value)} />
              </div>
              <div className="p-col-12">
                <label htmlFor={`notes-${index}`}>Description</label>
                <InputTextarea id={`notes-${index}`} value={assignmentData[index].instanceName} onChange={(e) => handleInputChange(index, 'instanceName', e.target.value)} rows={3} />
              </div>
              <div className="p-col-12">
                <label htmlFor={`notes-${index}`}>Notes</label>
                <InputTextarea id={`notes-${index}`} value={assignmentData[index].notes} onChange={(e) => handleInputChange(index, 'notes', e.target.value)} rows={3} />
              </div>
              <div className="p-col-12">
                <label htmlFor={`status-${index}`}>Status</label>
                <Dropdown id={`status-${index}`} value={assignmentData[index].status} options={statusOptions} onChange={(e) => handleInputChange(index, 'status', e.value)} />
              </div>
            </div>
            <div className="p-d-flex p-jc-between">
              <Button label="Cancel" icon="pi pi-times" className="p-button-danger" onClick={onClose} />
              <Button label="Assign" icon="pi pi-check" className="p-button-success" onClick={() => handleAssign(index)} loading={loading}/>
            </div>
            {/* <ConfirmDialog visible={showConfirm === index} onHide={() => setShowConfirm(false)} message="Are you sure you want to assign this plan?"
              header="Confirmation" icon="pi pi-exclamation-triangle" accept={() => confirmAssign(index)} reject={() => setShowConfirm(false)} /> */}
          </TabPanel>
        ))}
      </TabView>
    </div>
  );
};

export default AssignPlanDialog;
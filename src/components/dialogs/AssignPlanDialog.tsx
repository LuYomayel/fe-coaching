import { useState } from 'react';
import { TabView, TabPanel } from 'primereact/tabview';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { useIntl } from 'react-intl';
import { useConfirmationDialog } from '../../utils/ConfirmationDialogContext';
import { useToast } from '../../contexts/ToastContext';
import { validateDates } from '../../utils/UtilFunctions';
import { api } from '../../services/api-client';

interface IPlan {
  id: number;
  planName: string;
}

interface IStudent {
  id: number;
}

interface IAssignmentData {
  planId: number;
  expectedStartDate: Date | null;
  expectedEndDate: Date | null;
  notes: string;
  status: string;
  instanceName: string;
}

interface IAssignPlanDialogProps {
  selectedStudent: IStudent;
  selectedPlans: IPlan[];
  onClose: () => void;
}

const AssignPlanDialog = ({ selectedStudent, selectedPlans, onClose }: IAssignPlanDialogProps) => {
  const intl = useIntl();
  const { showConfirmationDialog } = useConfirmationDialog();
  const { showToast } = useToast();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentPlans] = useState<IPlan[]>(selectedPlans);
  const [activeIndex, setActiveIndex] = useState(0);
  const [assignmentData, setAssignmentData] = useState<IAssignmentData[]>(
    selectedPlans.map((plan) => ({
      planId: plan.id,
      expectedStartDate: null,
      expectedEndDate: null,
      notes: '',
      status: 'pending',
      instanceName: ''
    }))
  );
  const [loading, setLoading] = useState(false);

  const statusOptions = [
    { label: 'Pending', value: 'pending' },
    { label: 'In Progress', value: 'in-progress' },
    { label: 'Completed', value: 'completed' }
  ];

  const handleInputChange = (index: number, field: keyof IAssignmentData, value: unknown) => {
    setAssignmentData((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const handleAssign = (index: number) => {
    const data = assignmentData[index]!;
    const { isValid, message } = validateDates(data.expectedStartDate, data.expectedEndDate, intl);
    if (!isValid) {
      showToast('error', 'Error', message);
      return;
    }

    showConfirmationDialog({
      message: intl.formatMessage({ id: 'assignPlan.confirmation.message' }),
      header: intl.formatMessage({ id: 'common.confirmation' }),
      icon: 'pi pi-exclamation-triangle',
      accept: () => confirmAssign(index)
    });
  };

  const confirmAssign = async (index: number) => {
    const data = {
      studentId: selectedStudent.id,
      ...assignmentData[index]
    };
    try {
      setLoading(true);
      await api.workout.assignWorkout(data);
      showToast('success', 'Plan assigned successfully');
      onClose();
    } catch (error) {
      showToast('error', 'Error', (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <TabView activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)}>
        {currentPlans.map((plan, index) => {
          const assignment = assignmentData[index]!;
          return (
            <TabPanel key={index} header={plan.planName}>
              <div className="p-grid">
                <div className="p-col-6">
                  <label htmlFor={`expectedStartDate-${index}`}>Expected Start Date*</label>
                  <Calendar
                    id={`expectedStartDate-${index}`}
                    locale={intl.locale}
                    dateFormat="dd/mm/yy"
                    value={assignment.expectedStartDate}
                    onChange={(e) => handleInputChange(index, 'expectedStartDate', e.value)}
                  />
                </div>
                <div className="p-col-6">
                  <label htmlFor={`expectedEndDate-${index}`}>Expected End Date*</label>
                  <Calendar
                    id={`expectedEndDate-${index}`}
                    locale={intl.locale}
                    dateFormat="dd/mm/yy"
                    value={assignment.expectedEndDate}
                    onChange={(e) => handleInputChange(index, 'expectedEndDate', e.value)}
                  />
                </div>
                <div className="p-col-12">
                  <label htmlFor={`instanceName-${index}`}>Description</label>
                  <InputTextarea
                    id={`instanceName-${index}`}
                    value={assignment.instanceName}
                    onChange={(e) => handleInputChange(index, 'instanceName', e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="p-col-12">
                  <label htmlFor={`notes-${index}`}>Notes</label>
                  <InputTextarea
                    id={`notes-${index}`}
                    value={assignment.notes}
                    onChange={(e) => handleInputChange(index, 'notes', e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="p-col-12">
                  <label htmlFor={`status-${index}`}>Status</label>
                  <Dropdown
                    id={`status-${index}`}
                    value={assignment.status}
                    options={statusOptions}
                    onChange={(e) => handleInputChange(index, 'status', e.value)}
                  />
                </div>
              </div>
              <div className="flex justify-content-between">
                <Button label="Cancel" icon="pi pi-times" className="p-button-danger" onClick={onClose} />
                <Button
                  label="Assign"
                  icon="pi pi-check"
                  className="p-button-success"
                  onClick={() => handleAssign(index)}
                  loading={loading}
                />
              </div>
            </TabPanel>
          );
        })}
      </TabView>
    </div>
  );
};

export default AssignPlanDialog;

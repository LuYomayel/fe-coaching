import React, { useState, useEffect, useRef, useContext } from 'react';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Avatar } from 'primereact/avatar';
import { ProgressBar } from 'primereact/progressbar';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Dropdown } from 'primereact/dropdown';
import { Chart } from 'primereact/chart';
import { Toast } from 'primereact/toast';
import { deleteClient, fetchCoachStudents } from '../services/usersService';
import { useSpinner } from '../utils/GlobalSpinner';
import { useToast } from '../utils/ToastContext';
import { UserContext } from '../utils/UserContext';
import { useNavigate } from 'react-router-dom';
import { useConfirmationDialog } from '../utils/ConfirmationDialogContext';
import NewStudentDialog from '../dialogs/NewStudentDialog';
import AssignSubscriptionDialog from '../dialogs/AssignSubscriptionDialog';
import RegisterPaymentDialog from '../dialogs/RegisterPaymentDialog';
import StudentDetailDialog from '../dialogs/StudentDetailDialog';
import { cancelSubscription } from '../services/subscriptionService';
import { useChatSidebar } from '../utils/ChatSideBarContext';
import { formatDate } from '../utils/UtilFunctions';
// Mock data (replace with actual API calls in a real application)
const mockStudents = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', photo: 'https://randomuser.me/api/portraits/women/1.jpg', status: 'active', progress: 75, completedWorkouts: 15, pendingWorkouts: 5 },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', photo: 'https://randomuser.me/api/portraits/men/1.jpg', status: 'pending', progress: 30, completedWorkouts: 6, pendingWorkouts: 14 },
  { id: 3, name: 'Carol Davis', email: 'carol@example.com', photo: 'https://randomuser.me/api/portraits/women/2.jpg', status: 'completed', progress: 100, completedWorkouts: 20, pendingWorkouts: 0 },
];

const mockTrainingPlans = [
  { name: 'Beginner Plan', value: 'beginner' },
  { name: 'Intermediate Plan', value: 'intermediate' },
  { name: 'Advanced Plan', value: 'advanced' },
];

export default function NewManageStudentsPage() {
  const { user} = useContext(UserContext);
  const { openChatSidebar, setSelectedChat } = useChatSidebar();
  const [students, setStudents] = useState([]);
  const showToast = useToast();

  const [ selectedStudent, setSelectedStudent] = useState(null);
  const [ isNewStudentDialogVisible, setIsNewStudentDialogVisible] = useState(false);
  const [isSubscriptionDialogVisible, setIsSubscriptionDialogVisible] = useState(false);
  const [ isRegisterPaymentDialogVisible, setIsRegisterPaymentDialogVisible] = useState(false)
  const [ isStudentDetailVisible, setIsStudentDetailVisible] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const { showConfirmationDialog } = useConfirmationDialog();
  
  const [globalFilter, setGlobalFilter] = useState('');
  const [newStudentDialog, setNewStudentDialog] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: '', email: '', plan: '' });
  const toast = useRef(null);
  
  const { loading, setLoading } = useSpinner();
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true)
    const loadAllStudents = async () => {
      try {
        const data = await fetchCoachStudents(user.userId)
        console.log(data)
        setStudents(data)
      } catch (error) {
        showToast('error', 'Error fetching students', error.message)
      }
      finally{
        setLoading(false)
      }
    }
    loadAllStudents();
  }, [refreshKey, user.userId, showToast]);

  const statusBodyTemplate = (rowData) => {
    const status = rowData.user.subscription.status.toLowerCase();
    console.log(status)
    const statusColor = {
      active: 'bg-green-500',
      inactive: 'bg-red-500',
    };
    return <span className={`${statusColor[status]} text-white p-2 rounded-md`}>{rowData.user.subscription.status}</span>;
  };

  const actionBodyTemplate = (rowData) => {
    if(rowData.user.subscription.status === 'Active' ){
      return (
        <div className="flex justify-content-between">
          <Button icon="pi pi-user" className="p-button-rounded p-button-info mr-2" onClick={() => viewProfile(rowData.id)} />
          <Button icon="pi pi-dollar" className="p-button-rounded p-button-success mr-2" onClick={() => openRegisterPaymentDialog(rowData)}  tooltip='Register payment'/>
          <Button icon="pi pi-times" className="p-button-rounded p-button-danger mr-2" onClick={() => deleteCancelSubscription(rowData.user.subscription.clientSubscription.id)} tooltip='Delete Subscription'/>
          <Button icon="pi pi-comments" className="p-button-rounded p-button-warning" onClick={() => sendMessage(rowData)} />
        </div>
      );
    } else {
      return (
        <div className="flex justify-content-between">
            <Button icon="pi pi-user" className="p-button-rounded p-button-info mr-2" onClick={() => viewProfile(rowData.id)} />
            <Button icon="pi pi-calendar-plus" className="p-button-rounded p-button-success mr-2"  onClick={() => openSubscriptionDialog(rowData)} tooltip='Assign Subscription'/>
            <Button icon="pi pi-comments" className="p-button-rounded p-button-warning" onClick={() => sendMessage(rowData)} />
          </div>
        );
      }
  };

  const viewProfile = (clientId) => {
    navigate(`/client-dashboard/${clientId}`);
  };

  const updatePlan = (student) => {
    toast.current.show({ severity: 'success', summary: 'Update Plan', detail: `Updating plan for ${student.name}`, life: 3000 });
  };

  const sendMessage = (student) => {
    setSelectedChat(student);
    openChatSidebar();

    toast.current.show({ severity: 'info', summary: 'Send Message', detail: `Opening chat with ${student.name}`, life: 3000 });
  };

  const openNewStudentDialog = () => {
    setIsNewStudentDialogVisible(true);
  };

  const handleNewStudentDialogHide = () => {
    setIsNewStudentDialogVisible(false);
    setRefreshKey(prevKey => prevKey + 1);
  };

  const openSubscriptionDialog = (student) => {
    if(!student.user.isVerified)
      return showToast('error', 'Error', 'Client must verify the email address prior getting a subscription.')
    setSelectedStudent(student);
    setIsSubscriptionDialogVisible(true);
  };

  const openRegisterPaymentDialog = (student) => {
    setSelectedStudent(student);
    setIsRegisterPaymentDialogVisible(true);
  };

  const handleSubscriptionDialogHide = () => {
    setIsSubscriptionDialogVisible(false);
    setRefreshKey(prevKey => prevKey + 1);
  };
  
  const handleRegisterPaymentDialogHide = () => {
    setIsRegisterPaymentDialogVisible(false);
    setRefreshKey(prevKey => prevKey + 1);
  };

  const handleStudentDetailHide = () => {
    setIsStudentDetailVisible(false);
    setRefreshKey(prevKey => prevKey + 1);
  };

  const handleCancelSubscription = (clientSubscriptionId) => {
    cancelSubscription(clientSubscriptionId)
        .then(() => {
            setRefreshKey(old => old + 1);
            showToast('success', 'Subscription deleted successfully');
        })
        .catch((error) => {
            console.log(error);
            showToast('error', 'Error', error.message);
        });
};

  const deleteCancelSubscription = (clientSubscriptionId) => {
    showConfirmationDialog({
      message: "Are you sure you want to delete this client's subscription?",
      header: "Confirmation",
      icon: "pi pi-exclamation-triangle",
      accept: () => handleCancelSubscription(clientSubscriptionId),
      reject: () => console.log('Rejected u mf')
    });
  }

  const addNewStudent = () => {
    if (newStudent.name && newStudent.email && newStudent.plan) {
      const newStudentData = {
        id: students.length + 1,
        ...newStudent,
        photo: 'https://randomuser.me/api/portraits/lego/1.jpg',
        status: 'pending',
        progress: 0,
        completedWorkouts: 0,
        pendingWorkouts: 20
      };
      setStudents([...students, newStudentData]);
      setNewStudentDialog(false);
      setNewStudent({ name: '', email: '', plan: '' });
      toast.current.show({ severity: 'success', summary: 'Student Added', detail: `Added ${newStudent.name} to your students`, life: 3000 });
    } else {
      toast.current.show({ severity: 'error', summary: 'Error', detail: 'Please fill all fields', life: 3000 });
    }
  };

  const removeStudent = (student) => {
    confirmDialog({
      message: `Are you sure you want to remove ${student.name}?`,
      header: 'Confirm Removal',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        setStudents(students.filter(s => s.id !== student.id));
        toast.current.show({ severity: 'success', summary: 'Student Removed', detail: `${student.name} has been removed from your students`, life: 3000 });
      }
    });
  };

  return (
    <div className="manage-students-page p-4">
      <Toast ref={toast} />
      <ConfirmDialog />

      <Card title="Manage Students" subTitle="View and manage your students' progress" className="mb-4">
        <p>Use this page to track your students' progress, assign training plans, and communicate with them directly.</p>
      </Card>

      <div className="flex justify-content-between align-items-center mb-4">
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText 
            placeholder="Search students" 
            value={globalFilter} 
            onChange={(e) => setGlobalFilter(e.target.value)} 
          />
        </span>
        <Button label="Add New Student" icon="pi pi-plus" onClick={openNewStudentDialog}  />
      </div>

      <DataTable 
        value={students} 
        paginator 
        rows={10} 
        globalFilter={globalFilter}
        emptyMessage="No students found."
        responsiveLayout="scroll"
      >
        <Column field="name" header="Name" body={(rowData) => (
          <div className="flex align-items-center">
            <Avatar image={rowData.photo} shape="circle" className="mr-2" />
            <span>{rowData.name}</span>
          </div>
        )} />
        <Column field="user.email" header="Email" />
        <Column field="status" header="Status" body={statusBodyTemplate} />
        <Column body={(e) => <span data-label="Last Payment">{formatDate(e.user.subscription.lastPaymentDate)}</span>} header="Last Payment" className="last-payment-column" />
        <Column body={(e) => <span data-label="Next Payment">{formatDate(e.user.subscription.nextPaymentDate)}</span>} header="Next Payment" className="next-payment-column" />
        <Column field={(rowData) => rowData.user.subscription.status !== 'Inactive' ? `${rowData.user.subscription.clientSubscription.coachPlan.name}` : ''} header="Subscription Plan" />
        <Column body={actionBodyTemplate} header="Actions" />
        {/* <Column body={(rowData) => (
          <Button icon="pi pi-trash" className="p-button-rounded p-button-danger" onClick={() => removeStudent(rowData)} />
        )} /> */}
      </DataTable>

      <Dialog draggable={false}  resizable={false} header="New Student" className="responsive-dialog" visible={isNewStudentDialogVisible} style={{ width: '50vw' }} onHide={handleNewStudentDialogHide}>
        <NewStudentDialog onClose={handleNewStudentDialogHide} setRefreshKey={setRefreshKey} />
      </Dialog>

      <Dialog draggable={false}  resizable={false} header="Assign Subscription" className="responsive-dialog" visible={isSubscriptionDialogVisible} style={{ width: '50vw' }} onHide={handleSubscriptionDialogHide}>
        <AssignSubscriptionDialog studentId={selectedStudent?.id} coachId={user.userId} onClose={handleSubscriptionDialogHide} />
      </Dialog>
      
      <Dialog draggable={false}  resizable={false} header="Register Payment" className="responsive-dialog" visible={isRegisterPaymentDialogVisible} style={{ width: '50vw' }} onHide={handleRegisterPaymentDialogHide}>
        <RegisterPaymentDialog studentId={selectedStudent?.id} coachId={user.userId} onClose={handleRegisterPaymentDialogHide} 
          oldSubscription={selectedStudent?.user.subscription} oldCoachPlan={selectedStudent?.user.subscription.clientSubscription?.coachPlan}
        />
      </Dialog>

      <Dialog draggable={false}  resizable={false} header="Student Details" className="responsive-dialog" visible={isStudentDetailVisible} style={{ width: '50vw' }} onHide={handleStudentDetailHide}>
        <StudentDetailDialog student={selectedStudent} onClose={handleStudentDetailHide} />
      </Dialog>
    </div>
  );
}
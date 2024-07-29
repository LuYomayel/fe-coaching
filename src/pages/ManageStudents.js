import React, { useState, useEffect, useContext } from 'react';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { useToast } from '../utils/ToastContext';
import { UserContext } from '../utils/UserContext';
import AssignSubscriptionDialog from '../dialogs/AssignSubscriptionDialog';
import StudentDetailDialog from '../dialogs/StudentDetailDialog';
import NewStudentDialog from '../dialogs/NewStudentDialog';
import { useConfirmationDialog } from '../utils/ConfirmationDialogContext';
import { formatDate } from '../utils/UtilFunctions';
import RegisterPaymentDialog from '../dialogs/RegisterPaymentDialog';
import { useSpinner } from '../utils/GlobalSpinner';
import { useNavigate } from 'react-router-dom';
import { deleteClient, fetchCoachStudents } from '../services/usersService';
import { cancelSubscription } from '../services/subscriptionService';
const apiUrl = process.env.REACT_APP_API_URL;

const ManageStudents = () => {
  const { user } = useContext(UserContext);
  const showToast = useToast();
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isNewStudentDialogVisible, setIsNewStudentDialogVisible] = useState(false);
  const [isSubscriptionDialogVisible, setIsSubscriptionDialogVisible] = useState(false);
  const [isRegisterPaymentDialogVisible, setIsRegisterPaymentDialogVisible] = useState(false)
  const [isStudentDetailVisible, setIsStudentDetailVisible] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { showConfirmationDialog } = useConfirmationDialog();
  const { setLoading } = useSpinner()
  const navigate = useNavigate();
  useEffect(() => {
    setLoading(true)
    const loadAllStudents = async () => {
      try {
        const data = await fetchCoachStudents(user.userId)
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

  const handleDeleteUser = async (clientId) => {
    try {
      setLoading(true)
      const isDeleted = await deleteClient(clientId);
      if (isDeleted) {
        showToast('success', 'Client successfully deleted!');
        setRefreshKey(old => old + 1);
      }
    } catch (error) {
      showToast('error', 'Error', error.message);
    } finally {
      setLoading(false)
    }
  } 

  const deleteCancelSubscription = (clientSubscriptionId) => {
    showConfirmationDialog({
      message: "Are you sure you want to delete this client's subscription?",
      header: "Confirmation",
      icon: "pi pi-exclamation-triangle",
      accept: () => handleCancelSubscription(clientSubscriptionId),
      reject: () => console.log('Rejected u mf')
    });
  }

  const deleteClientConfirm = (clientId) => {
    showConfirmationDialog({
      message: "Are you sure you want to delete this client?",
      header: "Confirmation",
      icon: "pi pi-exclamation-triangle",
      accept: () => handleDeleteUser(clientId),
      reject: () => console.log('Rejected u mf')
    });
  }

  const handleViewDetails = (clientId) => {
    navigate(`/client-dashboard/${clientId}`);
  };

  const studentActionsTemplate = (rowData) => {
    // (rowData)
    if(rowData.user.subscription.status === 'Active' ){
      // console.log(rowData)
      return (
        <div className='flex gap-2'>
          {/* <Button icon="pi pi-pencil" onClick={() => openStudentDetail(rowData)} tooltip='View details'/> */}
          <Button icon="pi pi-dollar" onClick={() => openRegisterPaymentDialog(rowData)} tooltip='Register payment' className='p-button-rounded p-button-success'/>
          <Button icon="pi pi-times" onClick={() => deleteCancelSubscription(rowData.user.subscription.clientSubscription.id)} tooltip='Delete Subscription' className='p-button-rounded p-button-danger'/>
          <Button icon="pi pi-eye" onClick={() => handleViewDetails(rowData.id)} tooltip='View Details' className='p-button-rounded p-button-info'/>
          <Button icon="pi pi-trash" onClick={() => deleteClientConfirm(rowData.id)} tooltip='Delete Client' className='p-button-rounded p-button-danger'/>
        </div>
      );
    }else{
      return (
        <div className='flex gap-2'>
          {/* <Button icon="pi pi-pencil" onClick={() => openStudentDetail(rowData)} tooltip='View details'/> */}
          <Button icon="pi pi-calendar-plus" onClick={() => openSubscriptionDialog(rowData)} tooltip='Assign Subscription' className='p-button-rounded p-button-success'/>
          <Button icon="pi pi-eye" onClick={() => handleViewDetails(rowData.id)} tooltip='View Details' className='p-button-rounded p-button-info'/>
          <Button icon="pi pi-trash" onClick={() => deleteClientConfirm(rowData.id)} tooltip='Delete Client' className='p-button-rounded p-button-danger'/>
        </div>
      );
    }
  };

  const viewSubscriptionStatus = (rowData) => {
    if(rowData.user.subscription.status === 'Inactive'){
      return 'Inactive'
    }else{
      return `${formatDate(rowData.user.subscription.startDate)} - ${formatDate(rowData.user.subscription.endDate)}`
    }
  }

  return (
    <div className="manage-students">
      <h1>Manage Students</h1>
      <div className="actions-section">
        <Button label="Add New Student" icon="pi pi-plus" onClick={openNewStudentDialog} 
          className='p-button-rounded p-button-lg p-button-secondary create-plan-button'
        />
      </div>
      <div className='w-11 mx-auto'>
        <DataTable value={students} paginator rows={10} selectionMode="single" className="responsive-table" dataKey="id" onRowSelect={(e) => setSelectedStudent(e.value)}>
          <Column field="name" header="Name" body={(e) => <span data-label="Name">{e.name}</span>} className="name-column" />
          <Column header="Email" body={(e) => <span data-label="Email">{e.user.isVerified ? e.user.email : `${e.user.email} - No verificado`}</span>} className="email-column" />
          <Column body={(e) => <span data-label="Subscription">{viewSubscriptionStatus(e)}</span>} header="Subscription" className="subscription-column" />
          <Column body={(e) => <span data-label="Last Payment">{formatDate(e.user.subscription.lastPaymentDate)}</span>} header="Last Payment" className="last-payment-column" />
          <Column body={(e) => <span data-label="Next Payment">{formatDate(e.user.subscription.nextPaymentDate)}</span>} header="Next Payment" className="next-payment-column" />
          <Column body={(e) => <span data-label="Actions">{studentActionsTemplate(e)}</span>} header="Actions" className="actions-column" />
        </DataTable>
      </div>

      <Dialog header="New Student" className="responsive-dialog" visible={isNewStudentDialogVisible} style={{ width: '50vw' }} onHide={handleNewStudentDialogHide}>
        <NewStudentDialog onClose={handleNewStudentDialogHide} />
      </Dialog>

      <Dialog header="Assign Subscription" className="responsive-dialog" visible={isSubscriptionDialogVisible} style={{ width: '50vw' }} onHide={handleSubscriptionDialogHide}>
        <AssignSubscriptionDialog studentId={selectedStudent?.id} coachId={user.userId} onClose={handleSubscriptionDialogHide} />
      </Dialog>
      
      <Dialog header="Register Payment" className="responsive-dialog" visible={isRegisterPaymentDialogVisible} style={{ width: '50vw' }} onHide={handleRegisterPaymentDialogHide}>
        <RegisterPaymentDialog studentId={selectedStudent?.id} coachId={user.userId} onClose={handleRegisterPaymentDialogHide} 
          oldSubscription={selectedStudent?.user.subscription} oldCoachPlan={selectedStudent?.user.subscription.clientSubscription?.coachPlan}
        />
      </Dialog>

      <Dialog header="Student Details" className="responsive-dialog" visible={isStudentDetailVisible} style={{ width: '50vw' }} onHide={handleStudentDetailHide}>
        <StudentDetailDialog student={selectedStudent} onClose={handleStudentDetailHide} />
      </Dialog>
    </div>
  );
};

export default ManageStudents;
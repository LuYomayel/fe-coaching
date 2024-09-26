import React, { useState, useEffect, useRef, useContext } from 'react';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Avatar } from 'primereact/avatar';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { ConfirmDialog } from 'primereact/confirmdialog';
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
import { InputIcon } from 'primereact/inputicon';
import { IconField } from 'primereact/iconfield';

const apiUrl = process.env.REACT_APP_API_URL;
export default function NewManageStudentsPage() {
  const { user } = useContext(UserContext);
  const { openChatSidebar, setSelectedChat } = useChatSidebar();
  const [students, setStudents] = useState([]);
  const showToast = useToast();

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isNewStudentDialogVisible, setIsNewStudentDialogVisible] = useState(false);
  const [isSubscriptionDialogVisible, setIsSubscriptionDialogVisible] = useState(false);
  const [isRegisterPaymentDialogVisible, setIsRegisterPaymentDialogVisible] = useState(false);
  const [isStudentDetailVisible, setIsStudentDetailVisible] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const { showConfirmationDialog } = useConfirmationDialog();

  const [globalFilter, setGlobalFilter] = useState('');
  const toast = useRef(null);

  const { setLoading } = useSpinner();
  const [ isSendingVerification, setIsSendingVerification ] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    const loadAllStudents = async () => {
      try {
        const data = await fetchCoachStudents(user.userId);
        setStudents(data);
      } catch (error) {
        showToast('error', 'Error fetching students', error.message);
      } finally {
        setLoading(false);
      }
    };
    loadAllStudents();
  }, [refreshKey, user.userId, showToast, setLoading]);

  const statusBodyTemplate = (rowData) => {
    const status = rowData.user.subscription.status.toLowerCase();
    const statusColor = {
      active: 'bg-green-500',
      inactive: 'bg-red-500',
    };
    return (
      <span className={`${statusColor[status]} text-white p-2 rounded-md`}>
        {rowData.user.subscription.status}
      </span>
    );
  };

  const handleResendVerification = async (email) => {
    try {
      setIsSendingVerification(true);
      const response = await fetch(`${apiUrl}/auth/send-verification-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
      },
        body: JSON.stringify({ email }),
      });
     
      if (!response.ok) {
        const errorData = await response.json();
        console.log(errorData)

        throw new Error(errorData.message || 'Something went wrong');
      }
      else {
        showToast('success', 'Verification email sent successfully!');
      }
    } catch (error) {
      showToast('error', 'Error', error.message);
    } finally {
      setIsSendingVerification(false);
    }

  };

  const actionBodyTemplate = (rowData) => {
    if (rowData.user.subscription.status === 'Active') {
      return (
        <div className="flex gap-2">
          <Button
            icon="pi pi-user"
            className="p-button-rounded p-button-info"
            onClick={() => viewProfile(rowData.id)}
          />
          <Button
            icon="pi pi-dollar"
            className="p-button-rounded p-button-success"
            onClick={() => openRegisterPaymentDialog(rowData)}
            tooltip="Register payment"
          />
          <Button
            icon="pi pi-times"
            className="p-button-rounded p-button-danger"
            onClick={() =>
              deleteCancelSubscription(
                rowData.user.subscription.clientSubscription.id
              )
            }
            tooltip="Delete Subscription"
          />
          <Button
            icon="pi pi-comments"
            className="p-button-rounded p-button-warning"
            onClick={() => sendMessage(rowData)}
          />
          <Button
            icon="pi pi-trash"
            className="p-button-rounded p-button-danger"
            onClick={() => deleteClientConfirm(rowData.id)}
            tooltip="Delete Client"
          />
        </div>
      );
    } else {
      return (
        <div className="flex gap-2">
          <Button
            icon="pi pi-user"
            className="p-button-rounded p-button-info"
            onClick={() => viewProfile(rowData.id)}
          />
          {!rowData.user.isVerified && (
            <Button
              icon="pi pi-envelope"
              className="p-button-rounded p-button-success"
              onClick={() => handleResendVerification(rowData.user.email)}
              tooltip="Resend Verification Email"
              loading={isSendingVerification  }
            />
          )  
          }
          <Button
            icon="pi pi-calendar-plus"
            className="p-button-rounded p-button-success"
            onClick={() => openSubscriptionDialog(rowData)}
            tooltip="Assign Subscription"
          />
          <Button
            icon="pi pi-comments"
            className="p-button-rounded p-button-warning"
            onClick={() => sendMessage(rowData)}
          />
          <Button
            icon="pi pi-trash"
            className="p-button-rounded p-button-danger"
            onClick={() => deleteClientConfirm(rowData.id)}
            tooltip="Delete Client"
          />
        </div>
      );
    }
  };

  const viewProfile = (clientId) => {
    navigate(`/client-dashboard/${clientId}`);
  };

  const sendMessage = (student) => {
    setSelectedChat(student);
    openChatSidebar();
  };

  const openNewStudentDialog = () => {
    setIsNewStudentDialogVisible(true);
  };

  const handleNewStudentDialogHide = () => {
    setIsNewStudentDialogVisible(false);
    setRefreshKey((prevKey) => prevKey + 1);
  };

  const openSubscriptionDialog = (student) => {
    if (!student.user.isVerified)
      return showToast(
        'error',
        'Error',
        'Client must verify the email address prior to getting a subscription.'
      );
    setSelectedStudent(student);
    setIsSubscriptionDialogVisible(true);
  };

  const openRegisterPaymentDialog = (student) => {
    setSelectedStudent(student);
    setIsRegisterPaymentDialogVisible(true);
  };

  const handleSubscriptionDialogHide = () => {
    setIsSubscriptionDialogVisible(false);
    setRefreshKey((prevKey) => prevKey + 1);
  };

  const handleRegisterPaymentDialogHide = () => {
    setIsRegisterPaymentDialogVisible(false);
    setRefreshKey((prevKey) => prevKey + 1);
  };

  const handleStudentDetailHide = () => {
    setIsStudentDetailVisible(false);
    setRefreshKey((prevKey) => prevKey + 1);
  };

  const handleCancelSubscription = (clientSubscriptionId) => {
    cancelSubscription(clientSubscriptionId)
      .then(() => {
        setRefreshKey((old) => old + 1);
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
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => handleCancelSubscription(clientSubscriptionId),
      reject: () => console.log('Rejected'),
    });
  };

  const handleDeleteUser = async (clientId) => {
    try {
      setLoading(true);
      const isDeleted = await deleteClient(clientId);
      if (isDeleted) {
        showToast('success', 'Client successfully deleted!');
        setRefreshKey((old) => old + 1);
      }
    } catch (error) {
      showToast('error', 'Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteClientConfirm = (clientId) => {
    showConfirmationDialog({
      message: 'Are you sure you want to delete this client?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => handleDeleteUser(clientId),
      reject: () => console.log('Rejected'),
    });
  };

  return (
    <div className="manage-students-page p-4">
      <Toast ref={toast} />
      <ConfirmDialog />

      <Card
        title="Manage Students"
        subTitle="View and manage your students' progress"
        className="mb-4"
      >
        <p>
          Use this page to track your students' progress, assign training plans,
          and communicate with them directly.
        </p>
      </Card>

      <div className="flex justify-content-between align-items-center mb-4">
        <IconField iconPosition="left">
              <InputIcon className="pi pi-search"> </InputIcon>
              <InputText
                placeholder="Search students"
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
            />
          </IconField>
        
        <Button label="Add New Student" icon="pi pi-plus" onClick={openNewStudentDialog} />
      </div>

      <DataTable
        value={students}
        paginator
        rows={10}
        globalFilter={globalFilter}
        emptyMessage="No students found."
        responsiveLayout="scroll"
      >
        <Column
          field="name"
          header="Name"
          body={(rowData) => (
            <div className="flex align-items-center">
              <Avatar
                label={rowData.name.charAt(0)}
                shape="circle"
                className="mr-2"
              />
              <span>{rowData.name}</span>
            </div>
          )}
        />
        <Column field="user.email" header="Email" />
        <Column
          field="user.subscription.status"
          header="Status"
          body={statusBodyTemplate}
        />
        <Column
          body={(e) => (
            <span data-label="Last Payment">
              {formatDate(e.user.subscription.lastPaymentDate)}
            </span>
          )}
          header="Last Payment"
          className="last-payment-column"
        />
        <Column
          body={(e) => (
            <span data-label="Next Payment">
              {formatDate(e.user.subscription.nextPaymentDate)}
            </span>
          )}
          header="Next Payment"
          className="next-payment-column"
        />
        <Column
          field={(rowData) =>
            rowData.user.subscription.status !== 'Inactive'
              ? `${rowData.user.subscription.clientSubscription.coachPlan.name}`
              : ''
          }
          header="Subscription Plan"
        />
        <Column body={actionBodyTemplate} header="Actions" />
      </DataTable>

      <Dialog
        draggable={false}
        resizable={false}
        header="New Student"
        className="responsive-dialog"
        visible={isNewStudentDialogVisible}
        style={{ width: '50vw' }}
        onHide={handleNewStudentDialogHide}
      >
        <NewStudentDialog
          onClose={handleNewStudentDialogHide}
          setRefreshKey={setRefreshKey}
        />
      </Dialog>

      <Dialog
        draggable={false}
        resizable={false}
        header="Assign Subscription"
        className="responsive-dialog"
        visible={isSubscriptionDialogVisible}
        style={{ width: '50vw' }}
        onHide={handleSubscriptionDialogHide}
      >
        <AssignSubscriptionDialog
          studentId={selectedStudent?.id}
          coachId={user.userId}
          onClose={handleSubscriptionDialogHide}
        />
      </Dialog>

      <Dialog
        draggable={false}
        resizable={false}
        header="Register Payment"
        className="responsive-dialog"
        visible={isRegisterPaymentDialogVisible}
        style={{ width: '50vw' }}
        onHide={handleRegisterPaymentDialogHide}
      >
        <RegisterPaymentDialog
          studentId={selectedStudent?.id}
          coachId={user.userId}
          onClose={handleRegisterPaymentDialogHide}
          oldSubscription={selectedStudent?.user.subscription}
          oldCoachPlan={
            selectedStudent?.user.subscription.clientSubscription?.coachPlan
          }
        />
      </Dialog>

      <Dialog
        draggable={false}
        resizable={false}
        header="Student Details"
        className="responsive-dialog"
        visible={isStudentDetailVisible}
        style={{ width: '50vw' }}
        onHide={handleStudentDetailHide}
      >
        <StudentDetailDialog
          student={selectedStudent}
          onClose={handleStudentDetailHide}
        />
      </Dialog>
    </div>
  );
}
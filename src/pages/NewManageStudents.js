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
import { useIntl, FormattedMessage } from 'react-intl';

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

  const intl = useIntl();

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
        <FormattedMessage id={`students.status.${status}`} />
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
            tooltip={intl.formatMessage({ id: 'students.actions.viewProfile' })}
          />
          <Button
            icon="pi pi-dollar"
            className="p-button-rounded p-button-success"
            onClick={() => openRegisterPaymentDialog(rowData)}
            tooltip={intl.formatMessage({ id: 'students.actions.registerPayment' })}
          />
          <Button
            icon="pi pi-times"
            className="p-button-rounded p-button-danger"
            onClick={() => deleteCancelSubscription(rowData.user.subscription.clientSubscription.id)}
            tooltip={intl.formatMessage({ id: 'students.actions.deleteSubscription' })}
          />
          <Button
            icon="pi pi-comments"
            className="p-button-rounded p-button-warning"
            onClick={() => sendMessage(rowData)}
            tooltip={intl.formatMessage({ id: 'students.actions.sendMessage' })}
          />
          <Button
            icon="pi pi-trash"
            className="p-button-rounded p-button-danger"
            onClick={() => deleteClientConfirm(rowData.id)}
            tooltip={intl.formatMessage({ id: 'students.actions.deleteClient' })}
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
            tooltip={intl.formatMessage({ id: 'students.actions.viewProfile' })}
          />
          {!rowData.user.isVerified && (
            <Button
              icon="pi pi-envelope"
              className="p-button-rounded p-button-success"
              onClick={() => handleResendVerification(rowData.user.email)}
              tooltip={intl.formatMessage({ id: 'students.actions.resendVerificationEmail' })}
              loading={isSendingVerification  }
            />
          )  
          }
          <Button
            icon="pi pi-calendar-plus"
            className="p-button-rounded p-button-success"
            onClick={() => openSubscriptionDialog(rowData)}
            tooltip={intl.formatMessage({ id: 'students.actions.assignSubscription' })}
          />
          <Button
            icon="pi pi-comments"
            className="p-button-rounded p-button-warning"
            onClick={() => sendMessage(rowData)}
            tooltip={intl.formatMessage({ id: 'students.actions.sendMessage' })}
          />
          <Button
            icon="pi pi-trash"
            className="p-button-rounded p-button-danger"
            onClick={() => deleteClientConfirm(rowData.id)}
            tooltip={intl.formatMessage({ id: 'students.actions.deleteClient' })}
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
    // if (!student.user.isVerified)
    //   return showToast(
    //     'error',
    //     'Error',
    //     'Client must verify the email address prior to getting a subscription.'
    //   );
    console.log(student)
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
      message: intl.formatMessage({ id: 'coach.subscription.confirm.delete' }),
      header: intl.formatMessage({ id: 'common.confirmation' }),
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
      message: intl.formatMessage({ id: 'deleteStudent.confirmation.message' }),
      header: intl.formatMessage({ id: 'common.confirmation' }),
      icon: 'pi pi-exclamation-triangle',
      accept: () => handleDeleteUser(clientId),
      reject: () => console.log('Rejected'),
    });
  };

  return (
    <div className="manage-students-page p-4">
      <Toast ref={toast} />
      <ConfirmDialog />

      <Card className="mb-4">
        <h1 className="text-3xl font-bold">
          <FormattedMessage id="students.title" />
        </h1>
        <h2 className="text-xl text-gray-600">
          <FormattedMessage id="students.subtitle" />
        </h2>
        <p>
          <FormattedMessage id="students.description" />
        </p>
      </Card>

      <div className="flex justify-content-between align-items-center mb-4">
        <IconField iconPosition="left">
          <InputIcon className="pi pi-search" />
          <InputText
            placeholder={intl.formatMessage({ id: 'students.search' })}
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
          />
        </IconField>
        
        <Button 
          label={intl.formatMessage({ id: 'students.addNew' })} 
          icon="pi pi-plus" 
          onClick={openNewStudentDialog} 
        />
      </div>

      <DataTable
        value={students}
        paginator
        rows={10}
        globalFilter={globalFilter}
        emptyMessage={intl.formatMessage({ id: 'students.noStudents' })}
        responsiveLayout="scroll"
      >
        <Column
          field="name"
          header={intl.formatMessage({ id: 'students.table.name' })}
          body={(rowData) => (
            <div className="flex align-items-center">
              <Avatar label={rowData.name.charAt(0)} shape="circle" className="mr-2" />
              <span>{rowData.name}</span>
            </div>
          )}
        />
        <Column 
          field="user.email" 
          header={intl.formatMessage({ id: 'students.table.email' })} 
        />
        <Column
          field="user.subscription.status"
          header={intl.formatMessage({ id: 'students.table.status' })}
          body={statusBodyTemplate}
        />
        <Column
          body={(e) => (
            <span data-label={intl.formatMessage({ id: 'students.table.lastPayment' })}>
              {formatDate(e.user.subscription.lastPaymentDate)}
            </span>
          )}
          header={intl.formatMessage({ id: 'students.table.lastPayment' })}
          className="last-payment-column"
        />
        <Column
          body={(e) => (
            <span data-label={intl.formatMessage({ id: 'students.table.nextPayment' })}>
              {formatDate(e.user.subscription.nextPaymentDate)}
            </span>
          )}
          header={intl.formatMessage({ id: 'students.table.nextPayment' })}
          className="next-payment-column"
        />
        <Column
          field={(rowData) =>
            rowData.user.subscription.status !== 'Inactive'
              ? `${rowData.user.subscription.clientSubscription.coachPlan.name}`
              : ''
          }
          header={intl.formatMessage({ id: 'students.table.plan' })}
        />
        <Column 
          body={actionBodyTemplate} 
          header={intl.formatMessage({ id: 'students.table.actions' })} 
        />
      </DataTable>

      <Dialog
        header={intl.formatMessage({ id: 'students.dialog.newStudent' })}
        visible={isNewStudentDialogVisible}
        onHide={handleNewStudentDialogHide}
        draggable={false}
        resizable={false}
        dismissableMask
        className="responsive-dialog"
        style={{ width: '50vw' }}
      >
        <NewStudentDialog
          onClose={handleNewStudentDialogHide}
          setRefreshKey={setRefreshKey}
        />
      </Dialog>

      <Dialog
        draggable={false}
        resizable={false}
        dismissableMask
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
        dismissableMask
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
        dismissableMask
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
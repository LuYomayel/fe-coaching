import React, { useState, useEffect, useRef, useContext } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { deleteClient, fetchClientsSubscribed, fetchCoachPlans, fetchCoachStudents } from '../services/usersService';
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
import { formatDate } from '../utils/UtilFunctions';
import { InputIcon } from 'primereact/inputicon';
import { IconField } from 'primereact/iconfield';
import { useIntl, FormattedMessage } from 'react-intl';
import { Tooltip } from 'primereact/tooltip';
import { Tag } from 'primereact/tag';
import { ButtonGroup } from 'primereact/buttongroup';

const apiUrl = process.env.REACT_APP_API_URL;

export default function ManageStudentsPage() {
  const { user, coach } = useContext(UserContext);
  const [students, setStudents] = useState([]);
  const showToast = useToast();

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isNewStudentDialogVisible, setIsNewStudentDialogVisible] = useState(false);
  const [isSubscriptionDialogVisible, setIsSubscriptionDialogVisible] = useState(false);
  const [isRegisterPaymentDialogVisible, setIsRegisterPaymentDialogVisible] = useState(false);
  const [isStudentDetailVisible, setIsStudentDetailVisible] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [coachPlans, setCoachPlans] = useState([]);
  const { showConfirmationDialog } = useConfirmationDialog();
  const [totalClientsSubscribed, setTotalClientsSubscribed] = useState(0);
  const [maxClients, setMaxClients] = useState(0);
  const [globalFilter, setGlobalFilter] = useState('');
  const toast = useRef(null);

  const { setLoading } = useSpinner();
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const navigate = useNavigate();

  const intl = useIntl();

  // Función para calcular los días restantes de suscripción
  const calculateRemainingDays = (nextPaymentDate) => {
    if (!nextPaymentDate) return 0;

    const today = new Date();
    const paymentDate = new Date(nextPaymentDate);
    const timeDifference = paymentDate.getTime() - today.getTime();
    const daysDifference = Math.ceil(timeDifference / (1000 * 3600 * 24));

    return daysDifference > 0 ? daysDifference : 0;
  };

  useEffect(() => {
    setLoading(true);
    const loadClientsSubscribed = async () => {
      try {
        const { data } = await fetchClientsSubscribed(coach.id);
        setMaxClients(data.total);
        setTotalClientsSubscribed(data.clients.filter((client) => client.user.subscription.status === 'Active').length);
        setStudents(data.clients);
      } catch (error) {
        showToast('error', 'Error fetching clients subscribed', error.message);
      } finally {
        setLoading(false);
      }
    };

    const loadCoachPlans = async () => {
      try {
        const { data } = await fetchCoachPlans(user.userId);
        setCoachPlans(data);
      } catch (error) {
        showToast('error', 'Error fetching coach plans', error.message);
      }
    };

    loadClientsSubscribed();

    setTimeout(() => {
      loadCoachPlans();
    }, 100);
  }, [refreshKey, user.userId, showToast, setLoading, coach.id]);

  const handleResendVerification = async (email) => {
    try {
      setIsSendingVerification(true);

      const response = await fetch(`${apiUrl}/auth/send-verification-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.message || 'Something went wrong');
      } else {
        showToast(
          'success',
          intl.formatMessage({ id: 'student.success' }),
          intl.formatMessage({ id: 'student.verificationEmailSent' })
        );
      }
    } catch (error) {
      showToast('error', 'Error', error.message);
    } finally {
      setIsSendingVerification(false);
    }
  };

  const viewProfile = (clientId) => {
    navigate(`/client-dashboard/${clientId}`);
  };

  const openNewStudentDialog = () => {
    setIsNewStudentDialogVisible(true);
  };

  const handleNewStudentDialogHide = () => {
    setIsNewStudentDialogVisible(false);
    setRefreshKey((prevKey) => prevKey + 1);
  };

  const openSubscriptionDialog = (student) => {
    if (coachPlans.length === 0) {
      showToast(
        'warn',
        intl.formatMessage({ id: 'common.warning' }),
        intl.formatMessage({ id: 'student.error.noCoachPlans' }, true)
      );
      return;
    }
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
      reject: () => console.log('Rejected')
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
      reject: () => console.log('Rejected')
    });
  };

  // Filtrar estudiantes basados en la búsqueda global
  const filteredStudents = students.filter(
    (student) =>
      student.name?.toLowerCase().includes(globalFilter.toLowerCase()) ||
      student.user?.email?.toLowerCase().includes(globalFilter.toLowerCase()) ||
      student.fitnessGoal?.toLowerCase().includes(globalFilter.toLowerCase())
  );

  return (
    <div className="manage-students-page p-4">
      <Toast ref={toast} />
      <ConfirmDialog />
      <Card className="mb-4">
        <h1 className="text-3xl font-bold">
          <FormattedMessage id="students.title" values={{ count: totalClientsSubscribed, total: maxClients }} />
        </h1>
      </Card>
      {/*

      */}
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
      {/* Grid de tarjetas de estudiantes */}
      <div className="grid">
        {filteredStudents.length > 0 ? (
          filteredStudents.map((student) => {
            const remainingDays = calculateRemainingDays(student.user?.subscription?.nextPaymentDate);
            const isActive = student.user?.subscription?.status === 'Active';

            return (
              <div key={student.id} className="col-12 sm:col-6 lg:col-4 xl:col-3 p-2">
                <Card className="h-full">
                  <div className="flex flex-column align-items-center">
                    {/* Imagen del usuario */}
                    <img src="/image.webp" alt={student.name} className="w-10rem h-10rem border-circle shadow-4 mb-3" />

                    {/* Nombre del estudiante */}
                    <h3 className="m-2 text-center">{student.name}</h3>

                    {/* Objetivo fitness */}
                    {student.fitnessGoal && (
                      <div className="mb-3 text-center">
                        <strong>
                          <FormattedMessage id="students.fitnessGoal" />:
                        </strong>{' '}
                        {student.fitnessGoal}
                      </div>
                    )}

                    {/* Estado de la suscripción */}
                    <div className="mb-3">
                      <Tag
                        severity={isActive ? 'success' : 'danger'}
                        value={
                          isActive
                            ? intl.formatMessage({ id: 'students.status.active' })
                            : intl.formatMessage({ id: 'students.status.inactive' })
                        }
                      />
                    </div>

                    {/* Días restantes (solo si está activo) */}
                    {isActive && (
                      <div className="mb-3 text-center">
                        <strong>
                          <FormattedMessage id="students.remainingDays" />:
                        </strong>{' '}
                        {remainingDays}
                      </div>
                    )}

                    {/* Botones de acción */}
                    <div className="flex flex-wrap justify-content-center gap-2 mt-3">
                      <ButtonGroup>
                        <Button
                          icon="pi pi-user"
                          label={intl.formatMessage({ id: 'students.viewProfile' })}
                          className="p-button-info"
                          onClick={() => viewProfile(student.id)}
                        />

                        {isActive ? (
                          <>
                            <Button
                              icon="pi pi-dollar"
                              label={intl.formatMessage({ id: 'students.registerPayment' })}
                              className="p-button-success"
                              onClick={() => openRegisterPaymentDialog(student)}
                            />
                            <Button
                              icon="pi pi-times"
                              label={intl.formatMessage({ id: 'students.cancelSubscription' })}
                              className="p-button-danger"
                              onClick={() => deleteCancelSubscription(student.user.subscription.id)}
                            />
                          </>
                        ) : (
                          <Button
                            icon="pi pi-calendar-plus"
                            label={intl.formatMessage({ id: 'students.assignSubscription' })}
                            className="p-button-success"
                            onClick={() => openSubscriptionDialog(student)}
                          />
                        )}
                      </ButtonGroup>
                    </div>
                  </div>
                </Card>
              </div>
            );
          })
        ) : (
          <div className="col-12 text-center p-5">
            <p>{intl.formatMessage({ id: 'students.noStudents' })}</p>
          </div>
        )}
      </div>

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
        <NewStudentDialog onClose={handleNewStudentDialogHide} setRefreshKey={setRefreshKey} />
      </Dialog>

      <Dialog
        draggable={false}
        resizable={false}
        dismissableMask
        header={intl.formatMessage({
          id: 'students.dialog.assignSubscription'
        })}
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
          oldCoachPlan={selectedStudent?.user.subscription.clientSubscription?.coachPlan}
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
        <StudentDetailDialog student={selectedStudent} onClose={handleStudentDetailHide} />
      </Dialog>
    </div>
  );
}

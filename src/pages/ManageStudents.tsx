import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { InputIcon } from 'primereact/inputicon';
import { IconField } from 'primereact/iconfield';
import { FormattedMessage } from 'react-intl';
import { Tooltip } from 'primereact/tooltip';
import { Dropdown } from 'primereact/dropdown';

import StudentDialog from '../components/dialogs/StudentDialog';
import AssignSubscriptionDialog from '../components/dialogs/AssignSubscriptionDialog';
import RegisterPaymentDialog from '../components/dialogs/RegisterPaymentDialog';
import StudentDetailDialog from '../components/dialogs/StudentDetailDialog';

import { useManageStudents } from '../hooks/coach/useManageStudents';

export default function ManageStudentsPage() {
  const {
    user,
    toast,
    intl,
    selectedStudent,
    isNewStudentDialogVisible,
    isSubscriptionDialogVisible,
    isRegisterPaymentDialogVisible,
    isStudentDetailVisible,
    setRefreshKey,
    totalClientsSubscribed,
    maxClients,
    globalFilter,
    setGlobalFilter,
    currentView,
    setCurrentView,
    filterStatus,
    setFilterStatus,
    statusOptions,
    sortedStudents,
    calculateRemainingDays,
    handleResendVerification,
    viewProfile,
    openNewStudentDialog,
    handleNewStudentDialogHide,
    openSubscriptionDialog,
    openRegisterPaymentDialog,
    handleSubscriptionDialogHide,
    handleRegisterPaymentDialogHide,
    handleStudentDetailHide,
    deleteCancelSubscription,
    deleteStudentDialog,
    handleImageError
  } = useManageStudents();

  const truncateEmail = (email: string): string => {
    const atIndex = email.indexOf('@');
    if (atIndex === -1 || atIndex <= 6) return email;
    return `${email.substring(0, 3)}...${email.substring(atIndex)}`;
  };

  const renderStudentCards = () => {
    return (
      <div className="grid">
        {sortedStudents.length > 0 ? (
          sortedStudents.map((student) => {
            const remainingDays = calculateRemainingDays(student.user?.subscription?.nextPaymentDate);
            const isActive = student.user?.subscription?.status === 'Active';
            const isVerified = student.user?.isVerified;
            return (
              <div key={student.id} className="col-12 md:col-6 xl:col-4 p-2">
                <div className="student-card border-1 border-round surface-card shadow-2 p-0 h-full">
                  {/* Header de la tarjeta */}
                  <div className="student-card-header p-3 border-bottom-1 surface-border flex flex-column md:flex-row align-items-start md:align-items-center gap-3">
                    <div className="profile-image border-circle overflow-hidden flex-shrink-0 position-relative w-4rem h-4rem md:w-5rem md:h-5rem">
                      <img
                        src={student.avatar || 'defaultAvatar.png'}
                        alt={student.name}
                        onError={handleImageError}
                        className="w-full h-full"
                        style={{ objectFit: 'cover' }}
                      />
                      {!isVerified && (
                        <div className="verification-indicator">
                          <i className="pi pi-exclamation-circle text-red-500"></i>
                        </div>
                      )}
                    </div>
                    <div className="flex-grow-1 min-w-0">
                      <h3 className="text-lg font-semibold m-0 text-ellipsis white-space-nowrap overflow-hidden md:overflow-visible md:whitespace-normal">
                        {student.name}
                      </h3>
                      <p className="text-color-secondary mb-0 white-space-nowrap overflow-hidden text-overflow-ellipsis">
                        {student.user?.email ? truncateEmail(student.user.email) : ''}
                      </p>
                    </div>
                    <div className="status-indicators flex flex-row md:flex-column align-items-start md:align-items-center gap-2 flex-wrap">
                      {student.user?.subscription && (
                        <span
                          className={`status-badge border-round-2xl py-1 px-2 text-sm font-medium ${isActive ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}
                        >
                          <i className={`${isActive ? 'pi pi-check-circle' : 'pi pi-clock'} mr-1`}></i>
                          {isActive
                            ? intl.formatMessage({ id: 'students.status.active' })
                            : intl.formatMessage({ id: 'students.status.inactive' })}
                        </span>
                      )}
                      {!isVerified && (
                        <>
                          <span className="status-badge border-round-2xl py-1 px-2 text-sm font-medium bg-red-100 text-red-800 resend-verification cursor-pointer text-wrap text-overflow-ellipsis overflow-hidden white-space-nowrap">
                            <i className="pi pi-exclamation-circle mr-1"></i>
                            {intl.formatMessage({ id: 'students.status.unverified' })}
                          </span>
                          <Tooltip
                            target=".resend-verification"
                            content={intl.formatMessage({ id: 'students.status.unverified.tooltip' })}
                          />
                        </>
                      )}
                    </div>
                  </div>

                  {/* Cuerpo de la tarjeta con informacion clave */}
                  <div className="student-card-body p-3">
                    <div className="mb-2 flex align-items-center">
                      <i className="pi pi-flag text-primary mr-2 flex-shrink-0"></i>
                      <span className="font-medium mr-1 flex-shrink-0">
                        {intl.formatMessage({ id: 'students.fitnessGoal' })}:
                      </span>
                      <span className="text-sm break-words">{student.fitnessGoal || 'No definido'}</span>
                    </div>

                    {student.user?.subscription && (
                      <>
                        <div className="mb-2 flex align-items-center">
                          <i className="pi pi-calendar text-primary mr-2"></i>
                          <span className="font-medium mr-1">
                            {intl.formatMessage({ id: 'students.remainingDays' })}:
                          </span>
                          <span
                            className={`text-sm font-bold ${
                              remainingDays <= 3
                                ? 'text-red-500'
                                : remainingDays <= 7
                                  ? 'text-orange-500'
                                  : 'text-green-500'
                            }`}
                          >
                            {remainingDays}
                          </span>
                          <div className="days-indicator ml-2 flex-grow-1">
                            <div
                              className="days-bar border-round-sm"
                              style={{
                                height: '4px',
                                background: '#e9ecef',
                                position: 'relative',
                                overflow: 'hidden'
                              }}
                            >
                              <div
                                className={`days-progress border-round-sm ${
                                  remainingDays <= 3
                                    ? 'bg-red-500'
                                    : remainingDays <= 7
                                      ? 'bg-orange-500'
                                      : 'bg-green-500'
                                }`}
                                style={{
                                  width: `${Math.min(remainingDays * 3, 100)}%`,
                                  height: '100%'
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                        <div className="mb-2 flex align-items-center flex-wrap gap-1">
                          <i className="pi pi-credit-card text-primary mr-2 flex-shrink-0"></i>
                          <span className="font-medium mr-1 flex-shrink-0">
                            {intl.formatMessage({ id: 'students.table.plan' })}:
                          </span>
                          <span className="text-sm plan-chip border-round-sm py-1 px-2 bg-primary-50 text-primary-700 break-all md:break-normal">
                            {student.user.subscription.clientSubscription
                              ? student.user.subscription.clientSubscription.coachPlan.name
                              : 'N/A'}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Footer con botones de accion */}
                  <div className="student-card-footer p-3 pt-0 flex flex-wrap justify-content-between align-items-center gap-2">
                    <div className="action-buttons flex gap-2 flex-wrap">
                      <Button
                        icon="pi pi-user"
                        tooltip={intl.formatMessage({ id: 'students.viewProfile' })}
                        className="p-button-rounded p-button-info p-button-outlined flex-shrink-0"
                        onClick={() => viewProfile(student.id)}
                      />

                      {isActive ? (
                        <>
                          <Button
                            icon="pi pi-dollar"
                            tooltip={intl.formatMessage({ id: 'students.registerPayment' })}
                            className="p-button-rounded p-button-success p-button-outlined flex-shrink-0"
                            onClick={() => openRegisterPaymentDialog(student)}
                          />
                          <Button
                            icon="pi pi-times"
                            tooltip={intl.formatMessage({ id: 'students.cancelSubscription' })}
                            className="p-button-rounded p-button-danger p-button-outlined flex-shrink-0"
                            onClick={() => deleteCancelSubscription(student.user!.subscription!.id)}
                          />
                        </>
                      ) : (
                        <>
                          <Button
                            icon="pi pi-calendar-plus"
                            tooltip={intl.formatMessage({ id: 'students.assignSubscription' })}
                            className="p-button-rounded p-button-success p-button-outlined flex-shrink-0"
                            onClick={() => openSubscriptionDialog(student)}
                          />
                        </>
                      )}
                      {!isVerified && (
                        <Button
                          icon="pi pi-envelope"
                          tooltip={intl.formatMessage({ id: 'students.resendVerification' })}
                          className="p-button-rounded p-button-warning p-button-outlined flex-shrink-0"
                          onClick={() => handleResendVerification(student.user?.email)}
                        />
                      )}
                    </div>
                    <Button
                      icon="pi pi-trash"
                      tooltip={intl.formatMessage({ id: 'students.actions.deleteClient' })}
                      className="p-button-rounded p-button-danger p-button-text flex-shrink-0"
                      onClick={() => deleteStudentDialog(student.id)}
                    />
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-12 text-center p-5">
            <div className="no-results p-4">
              <i className="pi pi-search text-4xl text-color-secondary mb-3"></i>
              <p className="font-medium">{intl.formatMessage({ id: 'students.noStudents' })}</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="manage-students-page p-4">
      <Toast ref={toast} />
      <ConfirmDialog />

      {/* Cabecera con info y stats */}
      <div className="dashboard-header mb-4">
        <div className="grid">
          <div className="col-12 md:col-8">
            <Card className="h-full">
              <div className="flex flex-column md:flex-row align-items-start md:align-items-center justify-content-between">
                <div>
                  <h1 className="text-3xl font-bold mb-2">
                    <FormattedMessage
                      id="students.title"
                      values={{ count: totalClientsSubscribed, total: maxClients }}
                    />
                  </h1>
                  <p className="text-color-secondary m-0">
                    {intl.formatMessage(
                      { id: 'students.subtitle' },
                      { count: totalClientsSubscribed, total: maxClients }
                    )}
                  </p>
                </div>
                <Button
                  label={intl.formatMessage({ id: 'students.addNew' })}
                  icon="pi pi-plus"
                  className="p-button-primary mt-3 md:mt-0"
                  onClick={openNewStudentDialog}
                />
              </div>
            </Card>
          </div>
          <div className="col-12 md:col-4">
            <Card className="h-full">
              <div className="flex flex-column align-items-center justify-content-center text-center">
                <div className="text-4xl font-bold mb-2 text-primary">
                  {totalClientsSubscribed} / {maxClients}
                </div>
                <div className="text-sm text-color-secondary">
                  {intl.formatMessage(
                    { id: 'coach.subscription.clientsManaged' },
                    { current: totalClientsSubscribed, max: maxClients }
                  )}
                </div>
                <div className="progress-bar mt-3 w-full">
                  <div className="bg-gray-200 border-round-sm w-full" style={{ height: '8px' }}>
                    <div
                      className="bg-primary border-round-sm h-full"
                      style={{ width: `${(totalClientsSubscribed / maxClients) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Filtros y herramientas */}
      <div className="filter-tools p-3 mb-4 surface-card border-round shadow-1">
        <div className="flex flex-column md:flex-row align-items-start md:align-items-center justify-content-between gap-3">
          <div className="flex align-items-center gap-3 w-full md:w-auto">
            <IconField iconPosition="left" className="w-full md:w-auto">
              <InputIcon className="pi pi-search" />
              <InputText
                placeholder={intl.formatMessage({ id: 'students.search' })}
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="w-full"
              />
            </IconField>

            <Dropdown
              value={filterStatus}
              options={statusOptions}
              onChange={(e) => setFilterStatus(e.value)}
              placeholder="Filtrar por estado"
              className="w-full md:w-auto"
            />
          </div>

          <div className="view-toggle flex">
            <Button
              icon="pi pi-th-large"
              className={`p-button-rounded p-button-text ${currentView === 'grid' ? 'p-button-info' : ''}`}
              onClick={() => setCurrentView('grid')}
              tooltip="Vista de tarjetas"
            />
            <Button
              icon="pi pi-list"
              className={`p-button-rounded p-button-text ${currentView === 'list' ? 'p-button-info' : ''}`}
              onClick={() => setCurrentView('list')}
              tooltip="Vista de lista"
              disabled={true}
            />
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="students-content">{renderStudentCards()}</div>

      {/* Dialogos */}

      <StudentDialog
        onClose={handleNewStudentDialogHide}
        setRefreshKey={setRefreshKey}
        visible={isNewStudentDialogVisible}
        studentData={null}
      />

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
        <AssignSubscriptionDialog studentId={selectedStudent?.id ?? 0} onClose={handleSubscriptionDialogHide} />
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
        {selectedStudent?.user?.subscription && selectedStudent?.user?.subscription?.clientSubscription?.coachPlan && (
          <RegisterPaymentDialog
            studentId={selectedStudent.id}
            coachId={user?.userId ?? 0}
            onClose={handleRegisterPaymentDialogHide}
            oldSubscription={selectedStudent.user.subscription}
            oldCoachPlan={selectedStudent.user.subscription.clientSubscription.coachPlan}
          />
        )}
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
        {selectedStudent && (
          <StudentDetailDialog
            student={{
              id: selectedStudent.id,
              name: selectedStudent.name,
              email: selectedStudent.user?.email || '',
              fitnessGoal: selectedStudent.fitnessGoal || null,
              activityLevel: '',
              birthdate: null,
              gender: '',
              height: null,
              weight: null
            }}
            onClose={handleStudentDetailHide}
          />
        )}
      </Dialog>
    </div>
  );
}

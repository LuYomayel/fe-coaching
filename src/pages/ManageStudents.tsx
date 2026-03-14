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
    if (atIndex === -1 || atIndex <= 12) return email;
    return `${email.substring(0, 12)}...${email.substring(atIndex)}`;
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
                <div
                  style={{
                    background: 'var(--ios-card-bg)',
                    borderRadius: '20px',
                    border: '1px solid var(--ios-card-border)',
                    boxShadow: 'var(--ios-card-shadow)',
                    overflow: 'hidden',
                    height: '100%',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  {/* Header */}
                  <div
                    className="flex flex-column md:flex-row align-items-start md:align-items-center gap-3"
                    style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--ios-card-border)' }}
                  >
                    <div
                      style={{
                        width: '3.5rem',
                        height: '3.5rem',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        flexShrink: 0,
                        position: 'relative',
                        border: '2px solid var(--ios-card-border)'
                      }}
                    >
                      <img
                        src={student.avatar || 'defaultAvatar.png'}
                        alt={student.name}
                        onError={handleImageError}
                        className="w-full h-full"
                        style={{ objectFit: 'cover' }}
                      />
                      {!isVerified && (
                        <div
                          style={{
                            position: 'absolute',
                            bottom: -2,
                            right: -2,
                            background: 'var(--ios-card-bg)',
                            borderRadius: '50%',
                            padding: '1px'
                          }}
                        >
                          <i className="pi pi-exclamation-circle" style={{ color: '#ef4444', fontSize: '0.75rem' }} />
                        </div>
                      )}
                    </div>
                    <div className="flex-grow-1 min-w-0">
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, letterSpacing: '-0.01em' }}>
                        {student.name}
                      </h3>
                      <p style={{ color: 'var(--ios-text-tertiary)', margin: 0, fontSize: '0.82rem' }}>
                        {student.user?.email ? truncateEmail(student.user.email) : ''}
                      </p>
                    </div>
                    <div className="flex flex-row md:flex-column align-items-start md:align-items-end gap-1 flex-wrap">
                      {student.user?.subscription && (
                        <span
                          style={{
                            padding: '0.2rem 0.55rem',
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: isActive ? 'rgba(34,197,94,0.1)' : 'rgba(249,115,22,0.1)',
                            color: isActive ? '#22c55e' : '#f97316'
                          }}
                        >
                          <i
                            className={`${isActive ? 'pi pi-check-circle' : 'pi pi-clock'} mr-1`}
                            style={{ fontSize: '0.7rem' }}
                          />
                          {isActive
                            ? intl.formatMessage({ id: 'students.status.active' })
                            : intl.formatMessage({ id: 'students.status.inactive' })}
                        </span>
                      )}
                      {!isVerified && (
                        <>
                          <span
                            className="resend-verification cursor-pointer"
                            style={{
                              padding: '0.2rem 0.55rem',
                              borderRadius: '8px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              background: 'rgba(239,68,68,0.1)',
                              color: '#ef4444'
                            }}
                          >
                            <i className="pi pi-exclamation-circle mr-1" style={{ fontSize: '0.7rem' }} />
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

                  {/* Body */}
                  <div style={{ padding: '0.85rem 1.25rem' }}>
                    <div className="flex align-items-center mb-2" style={{ gap: '0.5rem' }}>
                      <i className="pi pi-flag" style={{ color: '#6366f1', fontSize: '0.85rem' }} />
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--ios-text)' }}>
                        {intl.formatMessage({ id: 'students.fitnessGoal' })}:
                      </span>
                      <span style={{ fontSize: '0.82rem', color: '#737373' }}>
                        {student.fitnessGoal || 'No definido'}
                      </span>
                    </div>

                    {student.user?.subscription && (
                      <>
                        <div className="flex align-items-center mb-2" style={{ gap: '0.5rem' }}>
                          <i className="pi pi-calendar" style={{ color: '#6366f1', fontSize: '0.85rem' }} />
                          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--ios-text)' }}>
                            {intl.formatMessage({ id: 'students.remainingDays' })}:
                          </span>
                          <span
                            style={{
                              fontSize: '0.82rem',
                              fontWeight: 700,
                              color: remainingDays <= 3 ? '#ef4444' : remainingDays <= 7 ? '#f97316' : '#22c55e'
                            }}
                          >
                            {remainingDays}
                          </span>
                          <div className="flex-grow-1 ml-2">
                            <div
                              style={{
                                height: '4px',
                                background: 'var(--ios-surface-muted)',
                                borderRadius: '4px',
                                overflow: 'hidden'
                              }}
                            >
                              <div
                                style={{
                                  width: `${Math.min(remainingDays * 3, 100)}%`,
                                  height: '100%',
                                  borderRadius: '4px',
                                  background:
                                    remainingDays <= 3 ? '#ef4444' : remainingDays <= 7 ? '#f97316' : '#22c55e'
                                }}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="flex align-items-center flex-wrap" style={{ gap: '0.5rem' }}>
                          <i className="pi pi-credit-card" style={{ color: '#6366f1', fontSize: '0.85rem' }} />
                          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--ios-text)' }}>
                            {intl.formatMessage({ id: 'students.table.plan' })}:
                          </span>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '8px',
                              background: 'rgba(99,102,241,0.08)',
                              color: '#6366f1',
                              fontWeight: 600
                            }}
                          >
                            {student.user.subscription.clientSubscription
                              ? student.user.subscription.clientSubscription.coachPlan.name
                              : 'N/A'}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Footer */}
                  <div
                    className="flex flex-wrap justify-content-between align-items-center"
                    style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--ios-card-border)' }}
                  >
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        icon="pi pi-user"
                        tooltip={intl.formatMessage({ id: 'students.viewProfile' })}
                        className="p-button-rounded p-button-outlined p-button-sm"
                        onClick={() => viewProfile(student.id)}
                        style={{ width: '2.2rem', height: '2.2rem', borderColor: '#3b82f6', color: '#3b82f6' }}
                      />
                      {isActive ? (
                        <>
                          <Button
                            icon="pi pi-dollar"
                            tooltip={intl.formatMessage({ id: 'students.registerPayment' })}
                            className="p-button-rounded p-button-outlined p-button-sm"
                            onClick={() => openRegisterPaymentDialog(student)}
                            style={{ width: '2.2rem', height: '2.2rem', borderColor: '#22c55e', color: '#22c55e' }}
                          />
                          <Button
                            icon="pi pi-times"
                            tooltip={intl.formatMessage({ id: 'students.cancelSubscription' })}
                            className="p-button-rounded p-button-outlined p-button-sm"
                            onClick={() => deleteCancelSubscription(student.user!.subscription!.id)}
                            style={{ width: '2.2rem', height: '2.2rem', borderColor: '#ef4444', color: '#ef4444' }}
                          />
                        </>
                      ) : (
                        <Button
                          icon="pi pi-calendar-plus"
                          tooltip={intl.formatMessage({ id: 'students.assignSubscription' })}
                          className="p-button-rounded p-button-outlined p-button-sm"
                          onClick={() => openSubscriptionDialog(student)}
                          style={{ width: '2.2rem', height: '2.2rem', borderColor: '#22c55e', color: '#22c55e' }}
                        />
                      )}
                      {!isVerified && (
                        <Button
                          icon="pi pi-envelope"
                          tooltip={intl.formatMessage({ id: 'students.resendVerification' })}
                          className="p-button-rounded p-button-outlined p-button-sm"
                          onClick={() => handleResendVerification(student.user?.email)}
                          style={{ width: '2.2rem', height: '2.2rem', borderColor: '#f59e0b', color: '#f59e0b' }}
                        />
                      )}
                    </div>
                    <Button
                      icon="pi pi-trash"
                      tooltip={intl.formatMessage({ id: 'students.actions.deleteClient' })}
                      className="p-button-rounded p-button-text p-button-sm"
                      onClick={() => deleteStudentDialog(student.id)}
                      style={{ width: '2.2rem', height: '2.2rem', color: '#ef4444' }}
                    />
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-12 text-center p-5">
            <div className="flex flex-column align-items-center p-4">
              <i
                className="pi pi-search"
                style={{ fontSize: '2.5rem', color: 'var(--ios-text-tertiary)', marginBottom: '0.75rem' }}
              />
              <p style={{ fontWeight: 500, color: '#737373' }}>{intl.formatMessage({ id: 'students.noStudents' })}</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ padding: '0.75rem' }}>
      <Toast ref={toast} />
      <ConfirmDialog />

      {/* Header */}
      <div className="grid mb-3">
        <div className="col-12 md:col-8 p-2">
          <div
            style={{
              background: 'var(--ios-card-bg)',
              borderRadius: '16px',
              padding: '1rem',
              border: '1px solid var(--ios-card-border)',
              boxShadow: 'var(--ios-card-shadow)',
              height: '100%'
            }}
          >
            <div className="flex flex-column md:flex-row align-items-start md:align-items-center justify-content-between gap-3">
              <div>
                <h1
                  style={{
                    fontSize: 'clamp(1.1rem, 3vw, 1.5rem)',
                    fontWeight: 800,
                    letterSpacing: '-0.03em',
                    margin: '0 0 0.25rem'
                  }}
                >
                  <FormattedMessage id="students.title" values={{ count: totalClientsSubscribed, total: maxClients }} />
                </h1>
                <p style={{ color: 'var(--ios-text-secondary)', margin: 0, fontSize: '0.9rem' }}>
                  {intl.formatMessage(
                    { id: 'students.subtitle' },
                    { count: totalClientsSubscribed, total: maxClients }
                  )}
                </p>
              </div>
              <Button
                label={intl.formatMessage({ id: 'students.addNew' })}
                icon="pi pi-plus"
                onClick={openNewStudentDialog}
                style={{
                  background: '#6366f1',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 600,
                  fontSize: '0.88rem'
                }}
              />
            </div>
          </div>
        </div>
        <div className="col-12 md:col-4 p-2">
          <div
            style={{
              background: 'var(--ios-card-bg)',
              borderRadius: '16px',
              padding: '1rem',
              border: '1px solid var(--ios-card-border)',
              boxShadow: 'var(--ios-card-shadow)',
              height: '100%',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                fontSize: '2rem',
                fontWeight: 800,
                color: '#6366f1',
                letterSpacing: '-0.03em',
                marginBottom: '0.25rem'
              }}
            >
              {totalClientsSubscribed} / {maxClients}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--ios-text-secondary)', marginBottom: '0.75rem' }}>
              {intl.formatMessage(
                { id: 'coach.subscription.clientsManaged' },
                { current: totalClientsSubscribed, max: maxClients }
              )}
            </div>
            <div
              style={{ height: '6px', background: 'var(--ios-surface-muted)', borderRadius: '6px', overflow: 'hidden' }}
            >
              <div
                style={{
                  width: `${(totalClientsSubscribed / maxClients) * 100}%`,
                  height: '100%',
                  borderRadius: '6px',
                  background: 'linear-gradient(90deg, #6366f1, #818cf8)'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div
        className="mb-3"
        style={{
          background: 'var(--ios-card-bg)',
          borderRadius: '16px',
          padding: '0.85rem 1rem',
          border: '1px solid var(--ios-card-border)',
          boxShadow: '0 1px 8px rgba(0,0,0,0.03)'
        }}
      >
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
          <div className="flex gap-1">
            <Button
              icon="pi pi-th-large"
              className={`p-button-rounded p-button-text ${currentView === 'grid' ? '' : ''}`}
              onClick={() => setCurrentView('grid')}
              tooltip="Vista de tarjetas"
              style={{
                color: currentView === 'grid' ? '#6366f1' : '#a3a3a3',
                background: currentView === 'grid' ? 'rgba(99,102,241,0.1)' : 'transparent'
              }}
            />
            <Button
              icon="pi pi-list"
              className="p-button-rounded p-button-text"
              onClick={() => setCurrentView('list')}
              tooltip="Vista de lista"
              disabled={true}
              style={{ color: currentView === 'list' ? '#6366f1' : '#a3a3a3' }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div>{renderStudentCards()}</div>

      {/* Dialogs */}
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
        header={intl.formatMessage({ id: 'students.dialog.assignSubscription' })}
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

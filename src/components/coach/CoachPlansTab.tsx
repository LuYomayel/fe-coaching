import { Button } from 'primereact/button';
import { useIntl } from 'react-intl';
import { useCoachPlanDialog } from '../../hooks/coach/useCoachPlanDialog';
import { CoachPlanDialog } from './CoachPlanDialog';
import { useToast } from '../../contexts/ToastContext';
import { useConfirmationDialog } from '../../utils/ConfirmationDialogContext';
import { api } from '../../services/api-client';
import { useCoachPlan } from 'hooks/coach/useCoachPlan';
import { formatDate } from 'utils/UtilFunctions';

export function CoachPlansTab() {
  const intl = useIntl();
  const { showToast } = useToast();
  const { showConfirmationDialog } = useConfirmationDialog();
  const { plans, loadPlans } = useCoachPlan();
  const dialog = useCoachPlanDialog(loadPlans);

  const handleDelete = (planId: number) => {
    showConfirmationDialog({
      message: intl.formatMessage({ id: 'coach.plan.confirm.delete' }),
      header: intl.formatMessage({ id: 'common.confirmation' }),
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          await api.subscription.deleteCoachPlan(planId);
          showToast('success', 'Success', 'Plan deleted successfully');
          loadPlans();
        } catch (e) {
          showToast('error', 'Error', (e as Error).message || 'Error deleting plan');
        }
      },
      reject: () => {
        console.log('Rejected');
      }
    });
  };

  return (
    <div style={{ padding: '0.75rem' }}>
      <div className="flex gap-2 mb-4">
        <Button
          label={intl.formatMessage({ id: 'common.add' }, { item: intl.formatMessage({ id: 'coach.plan.title' }) })}
          icon="pi pi-plus-circle"
          onClick={() => dialog.openCreate()}
          style={{
            background: '#6366f1',
            border: 'none',
            borderRadius: '12px',
            fontWeight: 600,
            fontSize: '0.88rem'
          }}
        />
      </div>

      <div
        style={{
          background: 'var(--ios-card-bg)',
          borderRadius: '20px',
          padding: '1.25rem',
          border: '1px solid var(--ios-card-border)',
          boxShadow: 'var(--ios-card-shadow)'
        }}
      >
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '-0.015em', margin: '0 0 1rem' }}>
          {intl.formatMessage({ id: 'coach.plans.title' })}
        </h3>

        <div className="grid">
          {plans.map((plan) => (
            <div key={plan.id} className="col-12 md:col-6 lg:col-4 p-2">
              <div
                style={{
                  background: 'var(--ios-surface-subtle)',
                  borderRadius: '16px',
                  padding: '1.25rem',
                  border: '1px solid var(--ios-card-border)',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                <div className="flex justify-content-between align-items-start mb-3">
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, letterSpacing: '-0.01em' }}>
                    {plan.name}
                  </h3>
                  <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#6366f1', letterSpacing: '-0.02em' }}>
                    ${plan.price}
                  </span>
                </div>
                <div className="flex flex-column gap-2 mb-3">
                  <div
                    className="flex align-items-center gap-2"
                    style={{ color: 'var(--ios-text-secondary)', fontSize: '0.85rem' }}
                  >
                    <i className="pi pi-credit-card" style={{ fontSize: '0.85rem' }} />
                    <span>
                      {intl.formatMessage({ id: 'coach.plan.paymentFrequency' })}:{' '}
                      <strong style={{ color: 'var(--ios-text)' }}>
                        {plan.paymentFrequency === 'monthly' &&
                          intl.formatMessage({ id: 'coach.plan.paymentFrequency.monthly' })}
                        {plan.paymentFrequency === 'weekly' &&
                          intl.formatMessage({ id: 'coach.plan.paymentFrequency.weekly' })}
                        {plan.paymentFrequency === 'per_session' &&
                          intl.formatMessage({ id: 'coach.plan.paymentFrequency.perSession' })}
                      </strong>
                    </span>
                  </div>
                  <div
                    className="flex align-items-center gap-2"
                    style={{ color: 'var(--ios-text-secondary)', fontSize: '0.85rem' }}
                  >
                    <i className="pi pi-clock" style={{ fontSize: '0.85rem' }} />
                    <span>
                      {intl.formatMessage({ id: 'common.created' })}:{' '}
                      <strong style={{ color: 'var(--ios-text)' }}>{formatDate(plan.createdAt || new Date())}</strong>
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 justify-content-end">
                  <Button
                    icon="pi pi-pencil"
                    className="p-button-rounded p-button-outlined p-button-sm"
                    onClick={() => dialog.openEdit(plan as any)}
                    tooltip={intl.formatMessage({ id: 'common.edit' })}
                    tooltipOptions={{ position: 'top' }}
                    style={{ width: '2.2rem', height: '2.2rem', borderColor: '#6366f1', color: '#6366f1' }}
                  />
                  <Button
                    icon="pi pi-trash"
                    className="p-button-rounded p-button-outlined p-button-sm"
                    onClick={() => handleDelete(plan.id)}
                    tooltip={intl.formatMessage({ id: 'common.delete' })}
                    tooltipOptions={{ position: 'top' }}
                    style={{ width: '2.2rem', height: '2.2rem', borderColor: '#ef4444', color: '#ef4444' }}
                  />
                </div>
              </div>
            </div>
          ))}

          {plans.length === 0 && (
            <div className="col-12">
              <div className="flex flex-column align-items-center justify-content-center p-5 text-center">
                <i
                  className="pi pi-info-circle"
                  style={{ fontSize: '2.5rem', color: 'var(--ios-text-tertiary)', marginBottom: '0.75rem' }}
                />
                <p style={{ color: 'var(--ios-text-secondary)', margin: 0 }}>
                  {intl.formatMessage({ id: 'coach.noPlans' })}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <CoachPlanDialog
        visible={dialog.visible}
        loading={dialog.loading}
        mode={dialog.mode}
        form={dialog.form}
        onHide={dialog.close}
        onChange={(key, value) => dialog.setField(key as any, value as any)}
        onSave={dialog.save}
      />
    </div>
  );
}

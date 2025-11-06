import { Card } from 'primereact/card';
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
    <div className="p-3">
      <div className="flex gap-2 mb-3">
        <Button
          label={intl.formatMessage({ id: 'common.add' }, { item: intl.formatMessage({ id: 'coach.plan.title' }) })}
          icon="pi pi-plus-circle"
          onClick={() => dialog.openCreate()}
          className="p-button-primary"
        />
      </div>

      <Card title={intl.formatMessage({ id: 'coach.plans.title' })}>
        <div className="grid">
          {plans.map((plan) => (
            <div key={plan.id} className="col-12 md:col-6 lg:col-4">
              <div className="surface-card shadow-2 border-round p-4">
                <div className="flex justify-content-between align-items-start mb-3">
                  <h3 className="text-xl font-bold m-0">{plan.name}</h3>
                  <span className="text-2xl font-bold text-primary">${plan.price}</span>
                </div>
                <div className="flex flex-column gap-2 mb-3">
                  <div className="flex align-items-center gap-2 text-600">
                    <i className="pi pi-calendar"></i>
                    <span>
                      {intl.formatMessage({ id: 'coach.workoutsPerWeek' })}: <strong>{plan.workoutsPerWeek}</strong>
                    </span>
                  </div>
                  {plan.includeMealPlan && (
                    <div className="flex align-items-center gap-2 text-green-600">
                      <i className="pi pi-check-circle"></i>
                      <span>{intl.formatMessage({ id: 'coach.includeMealPlan' })}</span>
                    </div>
                  )}
                  <div className="flex align-items-center gap-2 text-600">
                    <i className="pi pi-clock"></i>
                    <span>
                      {intl.formatMessage({ id: 'common.created' })}:{' '}
                      <strong>{formatDate(plan.createdAt || new Date())}</strong>
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 justify-content-end">
                  <Button
                    icon="pi pi-pencil"
                    className="p-button-rounded p-button-outlined"
                    onClick={() => dialog.openEdit(plan as any)}
                    tooltip={intl.formatMessage({ id: 'common.edit' })}
                    tooltipOptions={{ position: 'top' }}
                  />
                  <Button
                    icon="pi pi-trash"
                    className="p-button-rounded p-button-outlined p-button-danger"
                    onClick={() => handleDelete(plan.id)}
                    tooltip={intl.formatMessage({ id: 'common.delete' })}
                    tooltipOptions={{ position: 'top' }}
                  />
                </div>
              </div>
            </div>
          ))}

          {plans.length === 0 && (
            <div className="col-12">
              <div className="flex flex-column align-items-center justify-content-center p-5 text-center">
                <i className="pi pi-info-circle text-5xl mb-3 text-500"></i>
                <p className="text-600 mb-3">{intl.formatMessage({ id: 'coach.noPlans' })}</p>
                <Button
                  label={intl.formatMessage({ id: 'coach.createFirstPlan' })}
                  icon="pi pi-plus-circle"
                  onClick={() => dialog.openCreate()}
                  className="p-button-outlined"
                />
              </div>
            </div>
          )}
        </div>
      </Card>

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

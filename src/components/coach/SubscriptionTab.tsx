import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { useIntl } from 'react-intl';
import { useSubscriptionTab } from '../../hooks/coach/useSubscriptionTab';

interface Props {
  currentPlanId: number | null;
}

export function SubscriptionTab({ currentPlanId }: Props) {
  const intl = useIntl();
  const { plans } = useSubscriptionTab(currentPlanId);

  return (
    <div className="p-3 flex flex-column align-items-center justify-content-center" style={{ minHeight: 300 }}>
      <i className="pi pi-clock" style={{ fontSize: '4rem', color: '#b0b0b0' }}></i>
      <h2 className="mt-3" style={{ color: '#888' }}>
        {intl.formatMessage({ id: 'coach.subscription.comingSoon', defaultMessage: '¡Próximamente!' })}
      </h2>
      <p className="text-600 text-lg text-center mt-2" style={{ maxWidth: 400 }}>
        {intl.formatMessage({
          id: 'coach.subscription.comingSoonDescription',
          defaultMessage:
            'Pronto podrás gestionar y ver tus planes de suscripción desde aquí. ¡Estate atento a las novedades!'
        })}
      </p>
    </div>
  );
  return (
    <div className="p-3">
      <Card title={intl.formatMessage({ id: 'coach.subscription.plans' })}>
        <div className="grid">
          {plans.map((plan) => (
            <div key={plan.id} className="col-12 md:col-6 lg:col-4">
              <div
                className={`surface-card shadow-2 border-round p-4 ${plan.id === currentPlanId ? 'border-3 border-primary' : ''}`}
                style={{ position: 'relative' }}
              >
                {plan.id === currentPlanId && (
                  <div className="absolute top-0 right-0 bg-primary text-white px-3 py-1 border-round-bottom-left flex align-items-center gap-2">
                    <i className="pi pi-check-circle"></i>
                    <span className="font-semibold">
                      {intl.formatMessage({ id: 'coach.subscription.currentPlan' })}
                    </span>
                  </div>
                )}
                <div className="mb-3">
                  <h3 className="text-2xl font-bold m-0 mb-2">{plan.name}</h3>
                  <div className="flex align-items-baseline gap-1">
                    <span className="text-3xl font-bold text-primary">${plan.price}</span>
                    <span className="text-500">/mes</span>
                  </div>
                </div>
                <div className="flex flex-column gap-3 mb-4">
                  <div className="flex align-items-center gap-2 text-600">
                    <i className="pi pi-users text-xl"></i>
                    <span>
                      <strong>{plan.max_clients}</strong> {intl.formatMessage({ id: 'coach.subscription.maxClients' })}
                    </span>
                  </div>
                  <div className="flex align-items-center gap-2 text-600">
                    <i className="pi pi-calendar text-xl"></i>
                    <span>{intl.formatMessage({ id: 'coach.subscription.includedFeatures' })}</span>
                  </div>
                </div>
                {plan.id !== currentPlanId && (
                  <Button
                    label={intl.formatMessage({ id: 'coach.subscription.upgrade' })}
                    className="p-button-outlined w-full"
                    icon="pi pi-arrow-up"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

import { RefObject, useState, useEffect } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Button } from 'primereact/button';
import { useToast } from '../../contexts/ToastContext';
import { api } from 'services/api-client';
import { ISubscriptionPlan } from 'types/models';

export interface SubscriptionsProps {
  pricingRef: RefObject<HTMLDivElement | null>;
  onSignUpClick: () => void;
}

const Subscriptions = ({ pricingRef, onSignUpClick }: SubscriptionsProps) => {
  const [subscriptionPlans, setSubscriptionPlans] = useState<ISubscriptionPlan[]>([]);
  const { showToast } = useToast();
  const intl = useIntl();

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data } = await api.subscription.fetchCoachSubscriptionPlans();
        setSubscriptionPlans(data as ISubscriptionPlan[]);
      } catch (error) {
        showToast('error', 'Error', (error as Error).message);
      }
    };
    fetchPlans();
  }, [showToast]);

  return (
    <div ref={pricingRef} style={{ background: '#fafafa', padding: '4rem 0' }}>
      <div className="px-4 sm:px-6" style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div className="text-center mb-6">
          <h2
            style={{
              fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: '#171717',
              marginBottom: '0.75rem'
            }}
          >
            <FormattedMessage id="home.pricing.title" />
          </h2>
          <p style={{ color: '#737373', fontSize: '1.05rem', maxWidth: '32rem', margin: '0 auto', lineHeight: 1.6 }}>
            <FormattedMessage id="home.pricing.subtitle" />
          </p>
        </div>

        <div className="grid justify-content-center">
          {subscriptionPlans.map((plan) => (
            <div key={plan.id} className="col-12 sm:col-6 lg:col-3 p-2">
              <div
                style={{
                  background: '#fff',
                  borderRadius: '24px',
                  padding: '2rem 1.5rem',
                  border: '1px solid rgba(0,0,0,0.04)',
                  boxShadow: '0 2px 20px rgba(0,0,0,0.04)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  textAlign: 'center',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Top accent line */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: '15%',
                    right: '15%',
                    height: '3px',
                    background: 'linear-gradient(90deg, #6366f1, #818cf8)',
                    borderRadius: '0 0 4px 4px'
                  }}
                />

                <h3
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: '#171717',
                    marginBottom: '0.5rem',
                    letterSpacing: '-0.01em'
                  }}
                >
                  {plan.name}
                </h3>

                <div style={{ marginBottom: '1.5rem' }}>
                  <span
                    style={{
                      fontSize: '2.5rem',
                      fontWeight: 800,
                      color: '#6366f1',
                      letterSpacing: '-0.03em'
                    }}
                  >
                    ${plan.price}
                  </span>
                  <span style={{ color: '#a3a3a3', fontSize: '0.88rem', marginLeft: '2px' }}>
                    /<FormattedMessage id="home.pricing.perMonth" />
                  </span>
                </div>

                <div className="flex flex-column gap-3 mb-5" style={{ flexGrow: 1 }}>
                  {[
                    { msgId: 'home.pricing.maxClients', values: { max: plan.max_clients } },
                    { msgId: 'home.pricing.customPlans' },
                    { msgId: 'home.pricing.progressTracking' },
                    { msgId: 'home.pricing.support' }
                  ].map((item, i) => (
                    <div key={i} className="flex align-items-center gap-2" style={{ justifyContent: 'center' }}>
                      <i
                        className="pi pi-check"
                        style={{
                          fontSize: '0.75rem',
                          color: '#22c55e',
                          background: 'rgba(34, 197, 94, 0.1)',
                          borderRadius: '50%',
                          padding: '3px',
                          width: '1.2rem',
                          height: '1.2rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      />
                      <span style={{ color: '#525252', fontSize: '0.88rem' }}>
                        <FormattedMessage id={item.msgId} values={item.values} />
                      </span>
                    </div>
                  ))}
                </div>

                <Button
                  label={intl.formatMessage({ id: 'home.pricing.subscribe' })}
                  onClick={onSignUpClick}
                  className="w-full"
                  style={{
                    background: '#6366f1',
                    border: 'none',
                    borderRadius: '14px',
                    padding: '0.75rem',
                    fontWeight: 600,
                    fontSize: '0.92rem',
                    boxShadow: '0 2px 12px rgba(99, 102, 241, 0.2)'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Subscriptions;

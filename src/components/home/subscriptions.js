import React, { useState, useEffect } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { fetchCoachSubscriptionPlans } from '../../services/subscriptionService';
import { useToast } from '../../utils/ToastContext';

const Subscriptions = ({ pricingRef, onSignUpClick }) => {
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const showToast = useToast();
  const intl = useIntl();

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data } = await fetchCoachSubscriptionPlans();
        setSubscriptionPlans(data);
      } catch (error) {
        showToast('error', 'Error', error.message);
      }
    };
    fetchPlans();
  }, [showToast]);

  return (
    <div className="surface-ground py-8 sm:py-12" ref={pricingRef}>
      <div className="max-w-screen-lg mx-auto px-4 sm:px-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-900 mb-4">
            <FormattedMessage id="home.pricing.title" />
          </h2>
          <p className="text-600 text-lg max-w-2xl mx-auto">
            <FormattedMessage id="home.pricing.subtitle" />
          </p>
        </div>

        <div className="grid">
          {subscriptionPlans.map((plan) => (
            <div key={plan.id} className="col-12 sm:col-6 lg:col-3 p-3">
              <Card className="h-full shadow-3 border-round-xl hover:shadow-5 transition-all duration-300 relative overflow-hidden">
                {/* Header accent */}
                <div className="bg-primary h-1rem absolute top-0 left-0 right-0"></div>

                <div className="p-5 pt-6">
                  <div className="text-center mb-4">
                    <h3 className="text-2xl font-bold text-900 mb-2">{plan.name}</h3>
                    <div className="text-3xl font-bold text-primary mb-1">${plan.price}</div>
                    <div className="text-600">
                      <FormattedMessage id="home.pricing.perMonth" />
                    </div>
                  </div>

                  <div className="mb-5">
                    <div className="flex align-items-center justify-content-center mb-3">
                      <i className="pi pi-check-circle mr-2 text-green-500"></i>
                      <span className="text-700">
                        <FormattedMessage id="home.pricing.maxClients" values={{ max: plan.max_clients }} />
                      </span>
                    </div>
                    <div className="flex align-items-center justify-content-center mb-3">
                      <i className="pi pi-check-circle mr-2 text-green-500"></i>
                      <span className="text-700">
                        <FormattedMessage id="home.pricing.customPlans" />
                      </span>
                    </div>
                    <div className="flex align-items-center justify-content-center mb-3">
                      <i className="pi pi-check-circle mr-2 text-green-500"></i>
                      <span className="text-700">
                        <FormattedMessage id="home.pricing.progressTracking" />
                      </span>
                    </div>
                    <div className="flex align-items-center justify-content-center">
                      <i className="pi pi-check-circle mr-2 text-green-500"></i>
                      <span className="text-700">
                        <FormattedMessage id="home.pricing.support" />
                      </span>
                    </div>
                  </div>

                  <Button
                    label={intl.formatMessage({ id: 'home.pricing.subscribe' })}
                    className="p-button-rounded w-full p-button-lg"
                    onClick={onSignUpClick}
                  />
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default Subscriptions;

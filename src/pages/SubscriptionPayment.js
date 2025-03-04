import React, { useState, useRef, useEffect, useContext } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useToast } from '../utils/ToastContext';
import { fetchCoachSubscriptionPlans, makePayment, updateCoachSubscription } from '../services/subscriptionService';
import { UserContext } from '../utils/UserContext';

export default function SubscriptionPaymentPage({ setUserPayment, setIsPlanDialogVisible }) {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [plans, setPlans] = useState([]);
  const toast = useRef(null);
  const stripe = useStripe();
  const elements = useElements();
  const showToast = useToast();
  const { user } = useContext(UserContext);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data } = await fetchCoachSubscriptionPlans();
        const plans = data
          .filter((plan) => parseFloat(plan.price) !== 0)
          .map((plan) => ({
            ...plan,
            price: parseFloat(plan.price)
          }));
        console.log(plans);
        setPlans(plans);
      } catch (err) {
        console.error('Error fetching plans:', err);
        showToast('error', 'Error', err.error);
      }
    };

    fetchPlans();
  }, [showToast]);

  const handlePayment = async () => {
    if (!stripe || !elements) {
      showToast('error', 'Error', 'Stripe is not loaded yet.');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement
    });

    if (error) {
      showToast('error', 'Error', error.message);
      return;
    }

    try {
      const { data } = await makePayment({
        paymentMethodId: paymentMethod.id,
        amount: selectedPlan.price * 100
      });

      if (data.message === 'success') {
        await updateCoachSubscription({
          userId: user.userId,
          planId: selectedPlan.id
        });
        setUserPayment(selectedPlan);
        setIsPlanDialogVisible(false);
        showToast('success', 'Payment Successful', `Your payment for ${selectedPlan.name} plan has been processed.`);
      } else {
        showToast('error', 'Error', data.error || 'Payment failed');
      }
    } catch (err) {
      console.error('Payment processing error:', err);
      showToast('error', 'Error', 'An error occurred during payment processing.');
    }
  };

  return (
    <div className="min-h-screen flex flex-column">
      <Toast ref={toast} />
      <main className="flex-grow-1 container mx-auto p-4">
        <h2 className="text-3xl font-bold mb-4 text-center">Choose Your Subscription Plan</h2>
        <div className="grid">
          {plans.map((plan) => (
            <div key={plan.id} className="col-12 md:col-4 p-3">
              <Card className="h-full">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-4xl font-bold mb-4">
                  ${plan.price}
                  <span className="text-base font-normal">/month</span>
                </p>
                <ul className="list-none p-0 mb-4">
                  <li className="mb-2">✓ {plan.max_clients} clients</li>
                </ul>
                <Button label="Select" className="p-button-outlined w-full" onClick={() => setSelectedPlan(plan)} />
              </Card>
            </div>
          ))}
        </div>
        {selectedPlan && (
          <div>
            <CardElement />
            <Button label={`Pay $${selectedPlan.price} Now`} className="w-full" onClick={handlePayment} />
          </div>
        )}
      </main>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useToast } from '../contexts/ToastContext';
import { api } from '../services/api-client';
interface ISubscriptionPlan {
  id: number;
  name: string;
  price: number;
  max_clients: number;
}

interface ISubscriptionPaymentPageProps {
  onPlanConfirmed?: (plan: ISubscriptionPlan) => void;
  onClose?: () => void;
}

export default function SubscriptionPaymentPage({ onPlanConfirmed, onClose }: ISubscriptionPaymentPageProps) {
  const [selectedPlan, setSelectedPlan] = useState<ISubscriptionPlan | null>(null);
  const [plans, setPlans] = useState<ISubscriptionPlan[]>([]);
  const stripe = useStripe();
  const elements = useElements();
  const { showToast } = useToast();

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data } = await api.subscription.fetchCoachSubscriptionPlans();
        const filtered = (data || [])
          .filter((plan: ISubscriptionPlan) => plan.price !== 0)
          .map((plan: ISubscriptionPlan) => ({
            ...plan,
            price: typeof plan.price === 'string' ? parseFloat(plan.price) : plan.price
          }));
        setPlans(filtered);
      } catch (err) {
        console.error('Error fetching plans:', err);
        showToast('error', 'Error', (err as Error).message);
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
    if (!cardElement) return;

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement
    });

    if (error) {
      showToast('error', 'Error', error.message || 'Payment method creation failed');
      return;
    }

    if (!paymentMethod || !selectedPlan) return;

    try {
      const { data } = await api.subscription.makePayment({
        paymentMethodId: paymentMethod.id,
        amount: selectedPlan.price * 100
      });

      if (data?.message === 'success') {
        await api.subscription.updateCoachSubscription({
          planId: selectedPlan.id
        });
        if (onPlanConfirmed) {
          onPlanConfirmed(selectedPlan);
        }
        if (onClose) {
          onClose();
        }
        showToast('success', 'Payment Successful', `Your payment for ${selectedPlan.name} plan has been processed.`);
      } else {
        showToast('error', 'Error', data?.error || 'Payment failed');
      }
    } catch (err) {
      console.error('Payment processing error:', err);
      showToast('error', 'Error', 'An error occurred during payment processing.');
    }
  };

  return (
    <div className="min-h-screen flex flex-column">
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

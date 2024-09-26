import React, { useState, useRef, useEffect, useContext } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputMask } from 'primereact/inputmask';
import { RadioButton } from 'primereact/radiobutton';
import { Toast } from 'primereact/toast';
import { Divider } from 'primereact/divider';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useToast } from '../utils/ToastContext';
import { fetchCoachSubscriptionPlans, makePayment, updateCoachSubscription } from '../services/subscriptionService';
import { UserContext } from '../utils/UserContext';

const apiUrl = process.env.REACT_APP_API_URL;
export default function SubscriptionPaymentPage({ setUserPayment, setIsPlanDialogVisible }) {
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('credit');
    const [cardholderName, setCardholderName] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [expDate, setExpDate] = useState('');
    const [cvv, setCvv] = useState('');
    const toast = useRef(null); // Usar referencia para el toast
    const stripe = useStripe();
    const elements = useElements();
    const showToast = useToast();
    const [plans, setPlans] = useState([]);
    const { user } = useContext(UserContext);

    useEffect(() => {
            const fetchPlans = async () => {
                try {
                    const response = await fetchCoachSubscriptionPlans();
                    
                    console.log(response);
                    const data = response.filter((plan) => plan.price !== 0);
                    setPlans(data);

                } catch (err) {
                    console.error(err);
                }
            };

            fetchPlans();
        }, []);

    const showError = (message) => {
        toast.current.show({ severity: 'error', summary: 'Error', detail: message, life: 3000 });
    };

  const handlePayment = async () => {
        if (!stripe || !elements) {
            showError('Stripe is not loaded yet.');
            return;
        }

        const cardElement = elements.getElement(CardElement);
    
        // Crea un método de pago con Stripe
        const { error, paymentMethod } = await stripe.createPaymentMethod({
            type: 'card',
            card: cardElement,
        });

        // if (error) {
        //     showError(error.message);
        //     return;
        // }

        // Llamada al backend para crear el Payment Intent
        try {
            // const paymentResult = await makePayment({
            //     paymentMethodId: paymentMethod.id,
            //     amount: selectedPlan.price * 100,
            // })
            const paymentResult =  {
                success: true,
                error: null,
            }
            if (paymentResult.success) {
                await updateCoachSubscription({
                    userId: user.userId,  // El ID del usuario o coach
                    planId: selectedPlan.id,  // El plan seleccionado
                });
                setUserPayment({
                    cardholderName,
                    // paymentMethodId: paymentMethod.id,
                    paymentMethodId: 1,
                    ...selectedPlan
                });
                setIsPlanDialogVisible(false);
                showToast('success', 'Payment Successful', `Your payment for ${selectedPlan.name} plan has been processed.`);
            } else {
                showError(paymentResult.error || 'Payment failed');
            }
        } catch (err) {
            showError('An error occurred during payment processing.');
            console.error(err);
        }
    };

  return (
    <div className="min-h-screen flex flex-column">
      <Toast ref={toast} />
      
      {/* Header */}
      {/* <header className="bg-primary p-4">
        <div className="container mx-auto flex justify-content-between align-items-center">
          <h1 className="text-2xl font-bold text-white m-0">EaseTrain</h1>
          <nav>
            <ul className="list-none p-0 m-0 flex">
              <li><a href="#" className="text-white font-medium mr-4">Home</a></li>
              <li><a href="#" className="text-white font-medium mr-4">Pricing</a></li>
              <li><a href="#" className="text-white font-medium">Contact</a></li>
            </ul>
          </nav>
        </div>
      </header> */}

      {/* Main Content */}
      <main className="flex-grow-1 container mx-auto p-4">
        <h2 className="text-3xl font-bold mb-4 text-center">Choose Your Subscription Plan</h2>

        {/* Plan Selection */}
        <div className="grid">
          {plans.map((plan) => (
            <div key={plan.name} className="col-12 md:col-4 p-3">
              <Card className="h-full">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-4xl font-bold mb-4">${plan.price}<span className="text-base font-normal">/month</span></p>
                <ul className="list-none p-0 mb-4">
                  <li className="mb-2">✓ {plan.max_clients} clients</li>
                  {/* <li className="mb-2">✓ {plan.storage} storage</li> */}
                  {/* <li className="mb-2">✓ {plan.support} support</li> */}
                </ul>
                <Button 
                  label="Select" 
                  className="p-button-outlined w-full" 
                  onClick={() => setSelectedPlan(plan)}
                />
              </Card>
            </div>
          ))}
        </div>

        {/* Payment Section */}
        {selectedPlan && (
            <div>
                <CardElement />
                <Button 
                label={`Pay $${selectedPlan.price} Now`} 
                className="w-full" 
                onClick={handlePayment}
              />
            </div>
        )}
        {/* {selectedPlan && (
          <div className="mt-6">
            <h3 className="text-2xl font-bold mb-4">Payment Details</h3>
            <Card>
              <div className="grid">
                <div className="col-12 md:col-6 mb-4">
                  <label htmlFor="cardholderName" className="block mb-2">Cardholder Name</label>
                  <InputText id="cardholderName" value={cardholderName} onChange={(e) => setCardholderName(e.target.value)} className="w-full" />
                </div>
                <div className="col-12 md:col-6 mb-4">
                  <label htmlFor="cardNumber" className="block mb-2">Card Number</label>
                  <InputMask id="cardNumber" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} mask="9999 9999 9999 9999" className="w-full" />
                </div>
                <div className="col-6 md:col-3 mb-4">
                  <label htmlFor="expDate" className="block mb-2">Expiration Date</label>
                  <InputMask id="expDate" value={expDate} onChange={(e) => setExpDate(e.target.value)} mask="99/99" className="w-full" />
                </div>
                <div className="col-6 md:col-3 mb-4">
                  <label htmlFor="cvv" className="block mb-2">CVV</label>
                  <InputMask id="cvv" value={cvv} onChange={(e) => setCvv(e.target.value)} mask="999" className="w-full" />
                </div>
              </div>
              <Divider />
              <div className="flex align-items-center justify-content-between">
                <div className="flex align-items-center">
                  <RadioButton 
                    inputId="creditCard" 
                    name="paymentMethod" 
                    value="credit" 
                    onChange={(e) => setPaymentMethod(e.value)} 
                    checked={paymentMethod === 'credit'} 
                  />
                  <label htmlFor="creditCard" className="ml-2">Credit Card</label>
                </div>
                <div className="flex align-items-center ml-4">
                  <RadioButton 
                    inputId="paypal" 
                    name="paymentMethod" 
                    value="paypal" 
                    onChange={(e) => setPaymentMethod(e.value)} 
                    checked={paymentMethod === 'paypal'} 
                  />
                  <label htmlFor="paypal" className="ml-2">PayPal</label>
                </div>
              </div>
              <Divider />
              <Button 
                label={`Pay $${selectedPlan.price} Now`} 
                className="w-full" 
                onClick={handlePayment}
              />
            </Card>
          </div>
        )} */}
      </main>

      {/* Footer */}
      {/* <footer className="bg-gray-100 p-4 mt-6">
        <div className="container mx-auto text-center">
          <nav>
            <a href="#" className="text-gray-600 hover:text-primary mr-4">Terms of Service</a>
            <a href="#" className="text-gray-600 hover:text-primary mr-4">Privacy Policy</a>
            <a href="#" className="text-gray-600 hover:text-primary">Contact Us</a>
          </nav>
          <p className="text-sm text-gray-500 mt-2">© 2023 EaseTrain. All rights reserved.</p>
        </div>
      </footer> */}
    </div>
  );
}
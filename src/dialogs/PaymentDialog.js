import React, { useState, useEffect, useContext } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { useIntl } from 'react-intl';
import { useToast } from '../contexts/ToastContext';
import { useSpinner } from '../utils/GlobalSpinner';
import {
  createMercadoPagoPayment,
  checkMercadoPagoPaymentStatus,
  notifyBankTransfer,
  getCoachBankData
} from '../services/mercadoPagoService';
import { UserContext } from '../contexts/UserContext';

export default function PaymentDialog({ visible, onHide, subscription, clientId, coachId, coachPlanId }) {
  const intl = useIntl();
  const { showToast } = useToast();
  const { client } = useContext(UserContext);
  const { setLoading } = useSpinner();

  const [paymentMethod, setPaymentMethod] = useState(null);
  const [amount, setAmount] = useState('');
  const [bankData, setBankData] = useState(null);
  const [transferReference, setTransferReference] = useState('');
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [paymentId, setPaymentId] = useState(null);

  const paymentMethods = [
    { label: intl.formatMessage({ id: 'payment.mercadoPago' }), value: 'mercado_pago' },
    { label: intl.formatMessage({ id: 'payment.bankTransfer' }), value: 'bank_transfer' }
  ];

  useEffect(() => {
    console.log('visible', visible);
    console.log('coachId', coachId);
    if (visible && coachId) {
      fetchCoachBankData();
    }
  }, [visible, coachId]);

  // Verificar estado del pago de Mercado Pago cada 5 segundos
  useEffect(() => {
    let interval;
    if (paymentId && paymentStatus !== 'approved') {
      interval = setInterval(async () => {
        try {
          const { data } = await checkMercadoPagoPaymentStatus(paymentId);
          setPaymentStatus(data.status);

          if (data.status === 'approved') {
            clearInterval(interval);
            showToast('success', intl.formatMessage({ id: 'payment.success.paymentApproved' }));
            onHide();
          } else if (data.status === 'rejected') {
            clearInterval(interval);
            showToast('error', intl.formatMessage({ id: 'payment.error.paymentRejected' }));
          }
        } catch (error) {
          console.error('Error al verificar el estado del pago:', error);
        }
      }, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [paymentId, paymentStatus, onHide, showToast, intl]);

  const fetchCoachBankData = async () => {
    try {
      setLoading(true);
      const { data } = await getCoachBankData(coachId);
      console.log('getCoachBankData', data);
      setBankData(data);
    } catch (error) {
      showToast('error', intl.formatMessage({ id: 'error.fetchingBankData' }));
    } finally {
      setLoading(false);
    }
  };

  const handleMercadoPagoPayment = async () => {
    if (!amount || amount <= 0) {
      showToast('error', intl.formatMessage({ id: 'error.invalidAmount' }));
      return;
    }

    try {
      setLoading(true);
      const paymentData = {
        amount: parseFloat(amount),
        currency: 'ARS',
        description: `Pago de suscripción - ${subscription?.coachPlan?.name}`,
        payerEmail: subscription?.client?.email,
        payerName: `${subscription?.client?.firstName} ${subscription?.client?.lastName}`,
        coachId,
        clientId,
        coachPlanId
      };

      const response = await createMercadoPagoPayment(paymentData);
      setPaymentId(response.paymentId);
      setPaymentStatus('pending');
      window.location.href = response.initPoint;
    } catch (error) {
      showToast('error', intl.formatMessage({ id: 'error.creatingPayment' }));
    } finally {
      setLoading(false);
    }
  };

  const handleBankTransfer = async () => {
    if (!amount || amount <= 0) {
      showToast('error', intl.formatMessage({ id: 'error.invalidAmount' }));
      return;
    }

    if (!transferReference) {
      showToast('error', intl.formatMessage({ id: 'payment.error.enterTransferReference' }));
      return;
    }

    try {
      setLoading(true);
      const transferData = {
        amount: parseFloat(amount),
        currency: 'ARS',
        reference: transferReference,
        clientId,
        coachPlanId: subscription?.coachPlan?.id,
        description: `Pago de suscripción - ${subscription?.coachPlan?.name}. Cliente: ${client?.name}. Referencia: ${transferReference}`
      };

      await notifyBankTransfer(transferData, coachId);
      showToast('success', intl.formatMessage({ id: 'payment.success.transferNotified' }));
      onHide();
    } catch (error) {
      showToast('error', intl.formatMessage({ id: 'error.notifyingTransfer' }));
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (paymentMethod === 'mercado_pago') {
      await handleMercadoPagoPayment();
    } else if (paymentMethod === 'bank_transfer') {
      await handleBankTransfer();
    }
  };

  const renderBankTransferInfo = () => {
    console.log('bankData', bankData);
    if (!bankData) return null;

    return (
      <div className="bank-transfer-info mt-3">
        <h4>{intl.formatMessage({ id: 'payment.coachBankData' })}</h4>
        <p>
          <strong>{intl.formatMessage({ id: 'payment.bankName' })}:</strong> {bankData.bankName}
        </p>
        <p>
          <strong>{intl.formatMessage({ id: 'payment.accountType' })}:</strong> {bankData.accountType}
        </p>
        <p>
          <strong>{intl.formatMessage({ id: 'payment.accountNumber' })}:</strong> {bankData.accountNumber}
        </p>
        <p>
          <strong>{intl.formatMessage({ id: 'payment.cbu' })}:</strong> {bankData.cbu}
        </p>
        {bankData.alias && (
          <p>
            <strong>{intl.formatMessage({ id: 'payment.alias' })}:</strong> {bankData.alias}
          </p>
        )}
      </div>
    );
  };

  const renderMercadoPagoDescription = () => (
    <div className="mt-3 mb-3">
      <p>{intl.formatMessage({ id: 'payment.mercadoPagoDescription' })}</p>
    </div>
  );

  const renderBankTransferDescription = () => (
    <div className="mt-3 mb-3">
      <p>{intl.formatMessage({ id: 'payment.bankTransferDescription' })}</p>
    </div>
  );

  const renderPaymentStatus = () => {
    if (paymentStatus === 'pending') {
      return (
        <div className="mt-3 text-center">
          <p>{intl.formatMessage({ id: 'payment.redirecting' })}</p>
          <p>{intl.formatMessage({ id: 'payment.wait' })}</p>
        </div>
      );
    }
    return null;
  };

  const footer = (
    <div>
      <Button
        label={intl.formatMessage({ id: 'common.cancel' })}
        icon="pi pi-times"
        onClick={onHide}
        className="p-button-text"
      />
      <Button
        label={intl.formatMessage({ id: 'payment.process' })}
        icon="pi pi-check"
        onClick={handlePayment}
        disabled={!paymentMethod || !amount || amount <= 0}
      />
    </div>
  );

  return (
    <Dialog
      header={intl.formatMessage({ id: 'payment.title' })}
      visible={visible}
      style={{ width: '50vw' }}
      onHide={onHide}
      footer={footer}
      draggable={false}
      resizable={false}
      dismissableMask
    >
      <div className="payment-dialog-content">
        <div className="field">
          <label htmlFor="paymentMethod">{intl.formatMessage({ id: 'payment.method' })}</label>
          <Dropdown
            id="paymentMethod"
            value={paymentMethod}
            options={paymentMethods}
            onChange={(e) => setPaymentMethod(e.value)}
            placeholder={intl.formatMessage({ id: 'payment.selectMethod' })}
            className="w-100"
          />
        </div>

        {paymentMethod === 'mercado_pago' && renderMercadoPagoDescription()}
        {paymentMethod === 'bank_transfer' && renderBankTransferDescription()}

        <div className="field mt-3">
          <label htmlFor="amount">{intl.formatMessage({ id: 'payment.amount' })}</label>
          <InputText
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            className="w-100"
            placeholder={intl.formatMessage({ id: 'payment.enterAmount' })}
          />
        </div>

        {paymentMethod === 'bank_transfer' && (
          <>
            {renderBankTransferInfo()}
            <div className="field mt-3">
              <label htmlFor="transferReference">{intl.formatMessage({ id: 'payment.transferReference' })}</label>
              <InputText
                id="transferReference"
                value={transferReference}
                onChange={(e) => setTransferReference(e.target.value)}
                className="w-100"
                placeholder={intl.formatMessage({ id: 'payment.enterReference' })}
              />
            </div>
          </>
        )}

        {renderPaymentStatus()}
      </div>
    </Dialog>
  );
}

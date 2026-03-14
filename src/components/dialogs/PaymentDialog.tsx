import { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { useIntl } from 'react-intl';
import { useToast } from '../../contexts/ToastContext';
import { useUser } from '../../contexts/UserContext';
import { useSpinner } from '../../utils/GlobalSpinner';
import { api } from '../../services/api-client';

interface IBankDataResponse {
  bankName: string;
  accountType: string;
  accountNumber: string;
  cbu: string;
  alias?: string;
}

interface ISubscription {
  coachPlan?: { id: number; name: string };
  client?: { email: string; firstName: string; lastName: string };
}

interface IPaymentDialogProps {
  visible: boolean;
  onHide: () => void;
  subscription: ISubscription | null;
  coachId: number;
}

export default function PaymentDialog({ visible, onHide, subscription, coachId }: IPaymentDialogProps) {
  const intl = useIntl();
  const { showToast } = useToast();
  const { client } = useUser();
  const { setLoading } = useSpinner();

  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [bankData, setBankData] = useState<IBankDataResponse | null>(null);
  const [transferReference, setTransferReference] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);

  const paymentMethods = [
    { label: intl.formatMessage({ id: 'payment.mercadoPago' }), value: 'mercado_pago' },
    { label: intl.formatMessage({ id: 'payment.bankTransfer' }), value: 'bank_transfer' }
  ];

  useEffect(() => {
    if (visible && coachId) {
      fetchCoachBankData();
    }
  }, [visible, coachId]); // eslint-disable-line

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (paymentId && paymentStatus !== 'approved') {
      interval = setInterval(async () => {
        try {
          const { data } = await api.payment.checkMercadoPagoPaymentStatus(paymentId);
          setPaymentStatus(data?.status);

          if (data?.status === 'approved') {
            clearInterval(interval);
            showToast('success', intl.formatMessage({ id: 'payment.success.paymentApproved' }));
            onHide();
          } else if (data?.status === 'rejected') {
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
      const { data } = await api.payment.getCoachBankData(coachId);
      setBankData(data);
    } catch {
      showToast('error', intl.formatMessage({ id: 'error.fetchingBankData' }));
    } finally {
      setLoading(false);
    }
  };

  const handleMercadoPagoPayment = async () => {
    const parsedAmount = parseFloat(amount);
    if (!amount || parsedAmount <= 0) {
      showToast('error', intl.formatMessage({ id: 'error.invalidAmount' }));
      return;
    }

    try {
      setLoading(true);
      const paymentData = {
        amount: parsedAmount,
        description: `Pago de suscripcion - ${subscription?.coachPlan?.name}`
      };

      const response = await api.payment.createMercadoPagoPayment(coachId, paymentData);
      setPaymentId(response.data?.paymentId);
      setPaymentStatus('pending');
      if (response.data?.initPoint) {
        window.location.href = response.data.initPoint;
      }
    } catch {
      showToast('error', intl.formatMessage({ id: 'error.creatingPayment' }));
    } finally {
      setLoading(false);
    }
  };

  const handleBankTransfer = async () => {
    const parsedAmount = parseFloat(amount);
    if (!amount || parsedAmount <= 0) {
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
        amount: parsedAmount,
        currency: 'ARS',
        reference: transferReference,
        coachPlanId: subscription?.coachPlan?.id,
        description: `Pago de suscripcion - ${subscription?.coachPlan?.name}. Cliente: ${client?.name}. Referencia: ${transferReference}`
      };

      await api.payment.notifyBankTransfer(coachId, transferData);
      showToast('success', intl.formatMessage({ id: 'payment.success.transferNotified' }));
      onHide();
    } catch {
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

  const parsedAmount = parseFloat(amount);

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
        disabled={!paymentMethod || !amount || parsedAmount <= 0}
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
      <div className="p-3">
        <div className="field">
          <label htmlFor="paymentMethod">{intl.formatMessage({ id: 'payment.method' })}</label>
          <Dropdown
            id="paymentMethod"
            value={paymentMethod}
            options={paymentMethods}
            onChange={(e) => setPaymentMethod(e.value)}
            placeholder={intl.formatMessage({ id: 'payment.selectMethod' })}
            className="w-full"
          />
        </div>

        {paymentMethod === 'mercado_pago' && (
          <div className="mt-3 mb-3">
            <p>{intl.formatMessage({ id: 'payment.mercadoPagoDescription' })}</p>
          </div>
        )}
        {paymentMethod === 'bank_transfer' && (
          <div className="mt-3 mb-3">
            <p>{intl.formatMessage({ id: 'payment.bankTransferDescription' })}</p>
          </div>
        )}

        <div className="field mt-3">
          <label htmlFor="amount">{intl.formatMessage({ id: 'payment.amount' })}</label>
          <InputText
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            className="w-full"
            placeholder={intl.formatMessage({ id: 'payment.enterAmount' })}
          />
        </div>

        {paymentMethod === 'bank_transfer' && (
          <>
            {bankData && (
              <div className="mt-3">
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
            )}
            <div className="field mt-3">
              <label htmlFor="transferReference">{intl.formatMessage({ id: 'payment.transferReference' })}</label>
              <InputText
                id="transferReference"
                value={transferReference}
                onChange={(e) => setTransferReference(e.target.value)}
                className="w-full"
                placeholder={intl.formatMessage({ id: 'payment.enterReference' })}
              />
            </div>
          </>
        )}

        {paymentStatus === 'pending' && (
          <div className="mt-3 text-center">
            <p>{intl.formatMessage({ id: 'payment.redirecting' })}</p>
            <p>{intl.formatMessage({ id: 'payment.wait' })}</p>
          </div>
        )}
      </div>
    </Dialog>
  );
}

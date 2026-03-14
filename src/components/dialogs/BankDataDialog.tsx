import { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Checkbox, CheckboxChangeEvent } from 'primereact/checkbox';
import { useIntl } from 'react-intl';
import { useToast } from '../../contexts/ToastContext';
import { useSpinner } from '../../utils/GlobalSpinner';
import { api } from '../../services/api-client';

interface IBankData {
  bankTransferEnabled: boolean;
  mercadoPagoEnabled: boolean;
  bankName: string;
  accountNumber: string;
  accountType: string;
  cbu: string;
  alias: string;
  mercadoPagoAccessToken: string;
  mercadoPagoPublicKey: string;
  mercadoPagoUserId: string;
}

const EMPTY_BANK_DATA: IBankData = {
  bankTransferEnabled: false,
  mercadoPagoEnabled: false,
  bankName: '',
  accountNumber: '',
  accountType: '',
  cbu: '',
  alias: '',
  mercadoPagoAccessToken: '',
  mercadoPagoPublicKey: '',
  mercadoPagoUserId: ''
};

interface IBankDataDialogProps {
  visible: boolean;
  onHide: () => void;
}

export default function BankDataDialog({ visible, onHide }: IBankDataDialogProps) {
  const intl = useIntl();
  const { showToast } = useToast();
  const { setLoading } = useSpinner();

  const [bankData, setBankData] = useState<IBankData>({ ...EMPTY_BANK_DATA });
  const [isEditing, setIsEditing] = useState(false);

  const accountTypes = [
    { label: intl.formatMessage({ id: 'payment.accountType.savings' }), value: 'SAVINGS' },
    { label: intl.formatMessage({ id: 'payment.accountType.checking' }), value: 'CHECKING' }
  ];

  useEffect(() => {
    if (visible) {
      fetchBankData();
    }
  }, [visible]); // eslint-disable-line

  const fetchBankData = async () => {
    try {
      setLoading(true);
      const { data } = await api.payment.getMyCoachBankData();

      if (data) {
        setBankData({
          bankTransferEnabled: data.paymentMethod === 'BANK_TRANSFER',
          mercadoPagoEnabled: data.paymentMethod === 'MERCADO_PAGO',
          bankName: data.bankName || '',
          accountNumber: data.accountNumber || '',
          accountType: data.accountType || '',
          cbu: data.cbu || '',
          alias: data.alias || '',
          mercadoPagoAccessToken: data.mercadoPagoAccessToken || '',
          mercadoPagoPublicKey: data.mercadoPagoPublicKey || '',
          mercadoPagoUserId: data.mercadoPagoUserId || ''
        });
      } else {
        setBankData({ ...EMPTY_BANK_DATA });
      }
    } catch {
      showToast('error', intl.formatMessage({ id: 'error.fetchingBankData' }));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const dataToSave = {
        ...bankData,
        paymentMethod: bankData.bankTransferEnabled
          ? 'BANK_TRANSFER'
          : bankData.mercadoPagoEnabled
            ? 'MERCADO_PAGO'
            : ''
      };
      await api.payment.updateCoachBankData(dataToSave);
      showToast('success', intl.formatMessage({ id: 'payment.success.bankDataUpdated' }));
      setIsEditing(false);
      onHide();
    } catch {
      showToast('error', intl.formatMessage({ id: 'error.updatingBankData' }));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    fetchBankData();
  };

  const updateBankData = (field: keyof IBankData, value: string | boolean) => {
    setBankData((prev) => ({ ...prev, [field]: value }));
  };

  const footer = (
    <div>
      {!isEditing ? (
        <Button
          label={intl.formatMessage({ id: 'common.edit' })}
          icon="pi pi-pencil"
          onClick={() => setIsEditing(true)}
          className="p-button-primary"
        />
      ) : (
        <>
          <Button
            label={intl.formatMessage({ id: 'common.cancel' })}
            icon="pi pi-times"
            onClick={handleCancel}
            className="p-button-text"
          />
          <Button
            label={intl.formatMessage({ id: 'common.save' })}
            icon="pi pi-check"
            onClick={handleSave}
            className="p-button-primary"
          />
        </>
      )}
    </div>
  );

  return (
    <Dialog
      header={intl.formatMessage({ id: 'payment.bankData' })}
      visible={visible}
      style={{ width: '50vw' }}
      onHide={onHide}
      footer={footer}
      draggable={false}
      resizable={false}
      dismissableMask
    >
      <div className="field mb-4">
        <div className="flex flex-column gap-3">
          <div className="flex align-items-center">
            <Checkbox
              inputId="bankTransfer"
              checked={bankData.bankTransferEnabled}
              onChange={(e: CheckboxChangeEvent) => updateBankData('bankTransferEnabled', !!e.checked)}
              disabled={!isEditing}
            />
            <label htmlFor="bankTransfer" className="ml-2">
              {intl.formatMessage({ id: 'payment.method.bankTransfer' })}
            </label>
          </div>
          <div className="flex align-items-center">
            <Checkbox
              inputId="mercadoPago"
              checked={bankData.mercadoPagoEnabled}
              onChange={(e: CheckboxChangeEvent) => updateBankData('mercadoPagoEnabled', !!e.checked)}
              disabled={!isEditing}
            />
            <label htmlFor="mercadoPago" className="ml-2">
              {intl.formatMessage({ id: 'payment.method.mercadoPago' })}
            </label>
          </div>
        </div>
      </div>

      {bankData.bankTransferEnabled && (
        <div className="mb-4">
          <h3 className="text-xl font-bold mb-3">{intl.formatMessage({ id: 'payment.bankTransferDetails' })}</h3>
          <div className="grid">
            <div className="col-12 md:col-6 field">
              <label htmlFor="bankName">{intl.formatMessage({ id: 'payment.bankName' })}</label>
              <InputText
                id="bankName"
                value={bankData.bankName}
                onChange={(e) => updateBankData('bankName', e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div className="col-12 md:col-6 field">
              <label htmlFor="accountType">{intl.formatMessage({ id: 'payment.accountType' })}</label>
              <Dropdown
                id="accountType"
                value={bankData.accountType}
                options={accountTypes}
                onChange={(e) => updateBankData('accountType', e.value)}
                disabled={!isEditing}
              />
            </div>
            <div className="col-12 md:col-6 field">
              <label htmlFor="accountNumber">{intl.formatMessage({ id: 'payment.accountNumber' })}</label>
              <InputText
                id="accountNumber"
                value={bankData.accountNumber}
                onChange={(e) => updateBankData('accountNumber', e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div className="col-12 md:col-6 field">
              <label htmlFor="cbu">{intl.formatMessage({ id: 'payment.cbu' })}</label>
              <InputText
                id="cbu"
                value={bankData.cbu}
                onChange={(e) => updateBankData('cbu', e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div className="col-12 field">
              <label htmlFor="alias">{intl.formatMessage({ id: 'payment.alias' })}</label>
              <InputText
                id="alias"
                value={bankData.alias}
                onChange={(e) => updateBankData('alias', e.target.value)}
                disabled={!isEditing}
              />
            </div>
          </div>
        </div>
      )}

      {bankData.mercadoPagoEnabled && (
        <div className="mb-4">
          <h3 className="text-xl font-bold mb-3">{intl.formatMessage({ id: 'payment.mercadoPagoDetails' })}</h3>
          <div className="grid">
            <div className="col-12 field">
              <label htmlFor="mercadoPagoAccessToken">
                {intl.formatMessage({ id: 'payment.mercadoPagoAccessToken' })}
              </label>
              <InputText
                id="mercadoPagoAccessToken"
                value={bankData.mercadoPagoAccessToken}
                onChange={(e) => updateBankData('mercadoPagoAccessToken', e.target.value)}
                disabled={!isEditing}
                type="password"
              />
            </div>
            <div className="col-12 field">
              <label htmlFor="mercadoPagoPublicKey">{intl.formatMessage({ id: 'payment.mercadoPagoPublicKey' })}</label>
              <InputText
                id="mercadoPagoPublicKey"
                value={bankData.mercadoPagoPublicKey}
                onChange={(e) => updateBankData('mercadoPagoPublicKey', e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div className="col-12 field">
              <label htmlFor="mercadoPagoUserId">{intl.formatMessage({ id: 'payment.mercadoPagoUserId' })}</label>
              <InputText
                id="mercadoPagoUserId"
                value={bankData.mercadoPagoUserId}
                onChange={(e) => updateBankData('mercadoPagoUserId', e.target.value)}
                disabled={!isEditing}
              />
            </div>
          </div>
        </div>
      )}
    </Dialog>
  );
}

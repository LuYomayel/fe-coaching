import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { useIntl } from 'react-intl';
import { useToast } from '../contexts/ToastContext';
import { useSpinner } from '../utils/GlobalSpinner';
import { getCoachBankData, updateCoachBankData } from '../services/mercadoPagoService';
import { Checkbox } from 'primereact/checkbox';

export default function BankDataDialog({ visible, onHide, coachId }) {
  const intl = useIntl();
  const { showToast } = useToast();
  const { setLoading } = useSpinner();

  const [bankData, setBankData] = useState({
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
  });

  const [isEditing, setIsEditing] = useState(false);

  const accountTypes = [
    { label: intl.formatMessage({ id: 'payment.accountType.savings' }), value: 'SAVINGS' },
    { label: intl.formatMessage({ id: 'payment.accountType.checking' }), value: 'CHECKING' }
  ];

  useEffect(() => {
    if (visible && coachId) {
      fetchBankData();
    }
  }, [visible, coachId]);

  const fetchBankData = async () => {
    try {
      setLoading(true);
      const { data } = await getCoachBankData(coachId);

      // Convertir el formato antiguo al nuevo
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
        setBankData({
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
        });
      }
    } catch (error) {
      showToast('error', intl.formatMessage({ id: 'error.fetchingBankData' }));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      // Preparar los datos para enviar al servidor
      const dataToSave = {
        ...bankData,
        // Determinar el método de pago principal para compatibilidad con el backend
        paymentMethod: bankData.bankTransferEnabled
          ? 'BANK_TRANSFER'
          : bankData.mercadoPagoEnabled
            ? 'MERCADO_PAGO'
            : ''
      };

      await updateCoachBankData(coachId, dataToSave);
      showToast('success', intl.formatMessage({ id: 'payment.success.bankDataUpdated' }));
      setIsEditing(false);
      onHide();
    } catch (error) {
      showToast('error', intl.formatMessage({ id: 'error.updatingBankData' }));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    fetchBankData();
  };

  const renderBankTransferFields = () => (
    <div className="grid">
      <div className="col-12 md:col-6 field">
        <label htmlFor="bankName">{intl.formatMessage({ id: 'payment.bankName' })}</label>
        <InputText
          id="bankName"
          value={bankData.bankName}
          onChange={(e) => setBankData({ ...bankData, bankName: e.target.value })}
          disabled={!isEditing}
        />
      </div>
      <div className="col-12 md:col-6 field">
        <label htmlFor="accountType">{intl.formatMessage({ id: 'payment.accountType' })}</label>
        <Dropdown
          id="accountType"
          value={bankData.accountType}
          options={accountTypes}
          onChange={(e) => setBankData({ ...bankData, accountType: e.value })}
          disabled={!isEditing}
        />
      </div>
      <div className="col-12 md:col-6 field">
        <label htmlFor="accountNumber">{intl.formatMessage({ id: 'payment.accountNumber' })}</label>
        <InputText
          id="accountNumber"
          value={bankData.accountNumber}
          onChange={(e) => setBankData({ ...bankData, accountNumber: e.target.value })}
          disabled={!isEditing}
        />
      </div>
      <div className="col-12 md:col-6 field">
        <label htmlFor="cbu">{intl.formatMessage({ id: 'payment.cbu' })}</label>
        <InputText
          id="cbu"
          value={bankData.cbu}
          onChange={(e) => setBankData({ ...bankData, cbu: e.target.value })}
          disabled={!isEditing}
        />
      </div>
      <div className="col-12 field">
        <label htmlFor="alias">{intl.formatMessage({ id: 'payment.alias' })}</label>
        <InputText
          id="alias"
          value={bankData.alias}
          onChange={(e) => setBankData({ ...bankData, alias: e.target.value })}
          disabled={!isEditing}
        />
      </div>
    </div>
  );

  const renderMercadoPagoFields = () => (
    <div className="grid">
      <div className="col-12 field">
        <label htmlFor="mercadoPagoAccessToken">{intl.formatMessage({ id: 'payment.mercadoPagoAccessToken' })}</label>
        <InputText
          id="mercadoPagoAccessToken"
          value={bankData.mercadoPagoAccessToken}
          onChange={(e) => setBankData({ ...bankData, mercadoPagoAccessToken: e.target.value })}
          disabled={!isEditing}
          type="password"
        />
      </div>
      <div className="col-12 field">
        <label htmlFor="mercadoPagoPublicKey">{intl.formatMessage({ id: 'payment.mercadoPagoPublicKey' })}</label>
        <InputText
          id="mercadoPagoPublicKey"
          value={bankData.mercadoPagoPublicKey}
          onChange={(e) => setBankData({ ...bankData, mercadoPagoPublicKey: e.target.value })}
          disabled={!isEditing}
        />
      </div>
      <div className="col-12 field">
        <label htmlFor="mercadoPagoUserId">{intl.formatMessage({ id: 'payment.mercadoPagoUserId' })}</label>
        <InputText
          id="mercadoPagoUserId"
          value={bankData.mercadoPagoUserId}
          onChange={(e) => setBankData({ ...bankData, mercadoPagoUserId: e.target.value })}
          disabled={!isEditing}
        />
      </div>
    </div>
  );

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
              onChange={(e) => setBankData({ ...bankData, bankTransferEnabled: e.checked })}
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
              onChange={(e) => setBankData({ ...bankData, mercadoPagoEnabled: e.checked })}
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
          {renderBankTransferFields()}
        </div>
      )}

      {bankData.mercadoPagoEnabled && (
        <div className="mb-4">
          <h3 className="text-xl font-bold mb-3">{intl.formatMessage({ id: 'payment.mercadoPagoDetails' })}</h3>
          {renderMercadoPagoFields()}
        </div>
      )}
    </Dialog>
  );
}

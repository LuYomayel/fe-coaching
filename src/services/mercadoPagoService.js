const apiUrl = process.env.REACT_APP_API_URL;
const token = localStorage.getItem('token');

/**
 * Crea un pago a través de Mercado Pago
 * @param {Object} paymentData - Datos del pago
 * @param {number} paymentData.amount - Monto a pagar
 * @param {string} paymentData.currency - Moneda (por defecto 'ARS')
 * @param {string} paymentData.description - Descripción del pago
 * @param {string} paymentData.payerEmail - Email del pagador
 * @param {string} paymentData.payerName - Nombre del pagador
 * @param {string} paymentData.coachId - ID del coach
 * @param {string} paymentData.clientId - ID del cliente
 * @param {string} paymentData.coachPlanId - ID del plan del coach
 * @returns {Promise<Object>} - Respuesta del servidor con los datos de pago
 */
export const createMercadoPagoPayment = async (paymentData) => {
  try {
    const response = await fetch(`${apiUrl}/payment/mercado-pago/create`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentData)
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.message || 'Error al crear el pago');
    }

    return data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error al crear el pago');
  }
};

/**
 * Verifica el estado de un pago de Mercado Pago
 * @param {string} paymentId - ID del pago
 * @returns {Promise<Object>} - Estado del pago
 */
export const checkMercadoPagoPaymentStatus = async (paymentId) => {
  try {
    const response = await fetch(`${apiUrl}/payment/mercado-pago/status/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.message || 'Error al verificar el estado del pago');
    }

    return data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error al verificar el estado del pago');
  }
};

/**
 * Notifica al coach sobre una transferencia bancaria realizada
 * @param {Object} transferData - Datos de la transferencia
 * @param {string} transferData.coachId - ID del coach
 * @param {string} transferData.clientId - ID del cliente
 * @param {string} transferData.coachPlanId - ID del plan del coach
 * @param {string} transferData.amount - Monto transferido
 * @param {string} transferData.transferDate - Fecha de la transferencia
 * @param {string} transferData.reference - Referencia de la transferencia
 * @returns {Promise<Object>} - Respuesta del servidor
 */
export const notifyBankTransfer = async (transferData, coachId) => {
  try {
    const response = await fetch(`${apiUrl}/payment/bank-transfer/notify/${coachId}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(transferData)
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.message || 'Error al notificar la transferencia');
    }

    return data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error al notificar la transferencia');
  }
};

/**
 * Obtiene los datos bancarios del coach
 * @param {string} coachId - ID del coach
 * @returns {Promise<Object>} - Datos bancarios del coach
 */
export const getCoachBankData = async (coachId) => {
  try {
    const response = await fetch(`${apiUrl}/payment/coach-bank-data/${coachId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.message || 'Error al obtener los datos bancarios');
    }

    return data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error al obtener los datos bancarios');
  }
};

/**
 * Actualiza los datos bancarios del coach
 * @param {Object} bankData - Datos bancarios
 * @param {string} bankData.coachId - ID del coach
 * @param {string} bankData.bankName - Nombre del banco
 * @param {string} bankData.accountNumber - Número de cuenta
 * @param {string} bankData.accountType - Tipo de cuenta
 * @param {string} bankData.cbu - CBU o número de cuenta
 * @param {string} bankData.alias - Alias de la cuenta
 * @returns {Promise<Object>} - Respuesta del servidor
 */
export const updateCoachBankData = async (coachId, bankData) => {
  try {
    const response = await fetch(`${apiUrl}/payment/coach-bank-data/${coachId}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bankData)
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.message || 'Error al actualizar los datos bancarios');
    }

    return data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error al actualizar los datos bancarios');
  }
};

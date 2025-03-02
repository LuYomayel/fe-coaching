const apiUrl = process.env.REACT_APP_API_URL;
const token = localStorage.getItem('token')

const fetchCoachSubscription = async (coachId) => {
  const response = await fetch(`${apiUrl}/subscription/coach/${coachId}`);
  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data;
};

const fetchCoachSubscriptionPlans = async () => {
  const response = await fetch(`${apiUrl}/subscription/coach-subscription-plans`);
  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error || 'Something went wrong');
  }
  
  return data;
};

const fetchSubscriptionForStudent = async (studentId) => {
  const response = await fetch(`${apiUrl}/subscription/client/${studentId}`);
  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error || 'Something went wrong');
  }
  
  return data;
};

const fetchSubscriptionDetails = async (userId) => {
  const response = await fetch(`${apiUrl}/subscription/client-subscription/details/${userId}`);
  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error || 'Something went wrong');
  }
  
  return data;
};

const assignSubscription = async (body) => {
  const response = await fetch(`${apiUrl}/subscription/client`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data;
};    

const makePayment = async (body) => {
  const response = await fetch(`${apiUrl}/payment/create-payment-intent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({body}),
  });

  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data;
};

const updateCoachSubscription = async (body) => {
  const response = await fetch(`${apiUrl}/subscription/coach-subscription`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data;
};

const createOrUpdateCoachPlan = async (plan, planId, userId, mode) => {
  const url = mode === 'create' ? `${apiUrl}/subscription/coach/coachPlan` : `${apiUrl}/subscription/coach/coachPlan/${planId}`;
  const method = mode === 'create' ? 'POST' : 'PUT';
  
  const response = await fetch(url, {
    method: method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({...plan, coachId: userId}),
  });

  const {data, error} = await response.json();
  if (error) {
    throw new Error(error || 'Something went wrong');
  }

  if(data.affected && data.affected > 0) {
    return 'updated';
  } else {
    return data;
  }
};

const registerPayment = async (body) => {
  const response = await fetch(`${apiUrl}/subscription/update`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data;
};

const cancelSubscription = async (clientSubscriptionId) => {
  const response = await fetch(`${apiUrl}/subscription/clientSubscription/${clientSubscriptionId}`, {
    method: 'DELETE'
  });

  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data;
};

// Coach Home Page
const fetchClientsPaymentStatus = async (coachId) => {
  const response = await fetch(`${apiUrl}/subscription/clients-payment-status/${coachId}`);
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error || 'Something went wrong');
  }
  return data;
}

export {
  fetchCoachSubscription,
  fetchCoachSubscriptionPlans,
  fetchSubscriptionForStudent,
  fetchSubscriptionDetails,
  makePayment,
  updateCoachSubscription,
  assignSubscription,
  createOrUpdateCoachPlan,
  registerPayment,
  cancelSubscription,
  fetchClientsPaymentStatus
}
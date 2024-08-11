const apiUrl = process.env.REACT_APP_API_URL;

const fetchCoachSubscription = async (userId) => {
  const response = await fetch(`${apiUrl}/subscription/coach/${userId}`);

  if (!response.ok) {
    const errorData = await response.json();
    if (errorData.message && errorData.message === 'Coach not found') {
      throw new Error('Coach not found', { cause: errorData });
    }
    throw new Error(errorData.message || 'Something went wrong');
  }

  return response.json();  // Return the response to be used by the caller
};
const fetchCoachSubscriptionPlans = async () => {
  const response = await fetch(`${apiUrl}/subscription/coach-subscription-plans`);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Something went wrong');
  }
  
  return response.json();  // Return the data to be used by the caller
};
const fetchSubscriptionForStudent = async (studentId) => {
  const response = await fetch(`${apiUrl}/subscription/client/${studentId}`);
  if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Something went wrong');
  }
  return response.json();
};

const fetchSubscriptionDetails = async (userId) => {
  const response = await fetch(`${apiUrl}/subscription/client-subscription/details/${userId}`);
  if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Something went wrong');
  }
  return response.json();
};

const assignSubscription = async (body) => {
    const response = await fetch(`${apiUrl}/subscription/client`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  
    if (!response.ok) {
      const errorData = await response.json();
      // Handle cases where the error message might be an array or single message
      const errorMessage = errorData.message && Array.isArray(errorData.message.message)
        ? errorData.message.message.join(', ')
        : errorData.message || 'Something went wrong';
      throw new Error(errorMessage);
    }
  
  
    return response.json(); // Optional, depends if you need to process the response further
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
  if (!response.ok) {
    const errorData = await response.json();
    // Handle cases where the error message might be an array or single message
    const errorMessage = errorData.message && Array.isArray(errorData.message.message)
      ? errorData.message.message.join(', ')
      : errorData.message || 'Something went wrong';
    throw new Error(errorMessage);
  }

  if(mode === 'create'){
    return await response.json();
  }else{
    const data = await response.json();
    if(data.affected === 1)
      return true
    return false
  }
};
const registerPayment = async ( body) => {
  const response = await fetch(`${apiUrl}/subscription/update`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  console.log(body)
  if (!response.ok) {
    const errorData = await response.json();
    // Handle cases where the error message might be an array or single message
    const errorMessage = errorData.message && Array.isArray(errorData.message.message)
      ? errorData.message.message.join(', ')
      : errorData.message || 'Something went wrong';
    throw new Error(errorMessage);
  }

  return response.json();  // Return the response if needed for further processing
};

const cancelSubscription = async (clientSubscriptionId) => {
  const response = await fetch(`${apiUrl}/subscription/clientSubscription/${clientSubscriptionId}`, {
      method: 'DELETE'
  });
  if (!response.ok) {
      const errorData = await response.json();
      console.log(errorData);
      throw new Error(errorData.message || 'Something went wrong');
  }
  return response;
};

export {
    fetchCoachSubscription,
    fetchCoachSubscriptionPlans,
    fetchSubscriptionForStudent,
    fetchSubscriptionDetails,
    assignSubscription,
    createOrUpdateCoachPlan,
    registerPayment,
    cancelSubscription
}
const apiUrl = process.env.REACT_APP_API_URL;
const fetchCoach = async (userId) => {
    const response = await fetch(`${apiUrl}/users/coach/${userId}`);
    if (response.ok) {
      return await response.json();
    } else {
      throw new Error('Unable to fetch coach data');
    }
};
  
const fetchClient = async (userId) => {
    const response = await fetch(`${apiUrl}/users/client/${userId}`);
    if (response.ok) {
      return await response.json();
    } else {
      throw new Error('Unable to fetch client data');
    }
};

const fetchCoachPlans = async (userId) => {
    try {
      const response = await fetch(`${apiUrl}/users/coach/coachPlan/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch coach plans');
      }
      return await response.json(); // Returns the data directly
    } catch (error) {
      console.error('Error fetching coach plans:', error);
      throw error; // Rethrow to handle it in the UI component
    }
};

const fetchCoachStudents = async (userId) => {
    try {
      const response = await fetch(`${apiUrl}/users/coach/allStudents/${userId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Something went wrong.');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching students:', error);
      throw error;  // Rethrow to handle it in the UI component
    }
};

export const fetchClientActivities = async (studentId) => {
    const response = await fetch(`${apiUrl}/users/clientId/activities/${studentId}`, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
  
    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.message || 'Something went wrong';
      throw new Error(errorMessage);
    }
  
    return response.json(); // Directly returning parsed JSON data
  };

const saveStudent = async (body) => {
    const response = await fetch(`${apiUrl}/users/client`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });
  
    if (!response.ok) {
      const errorData = await response.json();
      // Handle cases where the error message might be an array or single message
      const errorMessage = errorData.message && Array.isArray(errorData.message)
        ? errorData.message.join(', ')
        : errorData.message || 'Something went wrong';
      throw new Error(errorMessage);
    }
  
    return await response.json();
};

const updateCoach = async (userId, body, token) => {
    const response = await fetch(`${apiUrl}/users/coach/${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
  
    if (!response.ok) {
      const errorData = await response.json();
      // Handle cases where the error message might be an array or single message
      const errorMessage = errorData.message && Array.isArray(errorData.message)
        ? errorData.message.join(', ')
        : errorData.message || 'Something went wrong';
      throw new Error(errorMessage);
    }
  
    return await response.json();
};

const updatePersonalInfo = async (personalInfoId, body) => {
    const response = await fetch(`${apiUrl}/users/client/${personalInfoId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });
  
    if (!response.ok) {

      const errorData = await response.json();
      if(errorData.message.message && errorData.message.message.length > 0)
        throw new Error(errorData.message.message.join(', '));
      const errorMessage = errorData.message || 'Something went wrong';
      throw new Error(errorMessage);
    }
  
    return response.json(); // You might want to return some data or just ensure it's processed correctly.
};

const deleteClient = async (clientId) => {
    const response = await fetch(`${apiUrl}/users/client/${clientId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      }
    });
  
    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.message || 'Something went wrong';
      throw new Error(errorMessage);
    }
  
    return response.ok;
};


export {
    fetchCoach,
    fetchClient,
    fetchCoachPlans,
    fetchCoachStudents,
    saveStudent,
    updateCoach,
    updatePersonalInfo,
    deleteClient
}
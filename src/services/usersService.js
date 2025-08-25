const apiUrl = process.env.REACT_APP_API_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };
};

const registerCoach = async (body) => {
  try {
    const response = await fetch(`${apiUrl}/auth/register`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body)
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error registering coach:', error);
    throw error;
  }
};

const login = async (body) => {
  try {
    console.log(apiUrl);
    const response = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body)
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};
const fetchUser = async (userId) => {
  try {
    const response = await fetch(`${apiUrl}/users/${userId}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error || 'Unable to fetch user data');
    }

    return data;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
};

const fetchCoach = async (userId) => {
  try {
    const response = await fetch(`${apiUrl}/users/coach/${userId}`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error || 'Unable to fetch coach data');
    }

    return data;
  } catch (error) {
    console.error('Error fetching coach:', error);
    throw error;
  }
};

const fetchClient = async (userId) => {
  try {
    const response = await fetch(`${apiUrl}/users/client/${userId}`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error || 'Unable to fetch client data');
    }

    return data;
  } catch (error) {
    console.error('Error fetching client:', error);
    throw error;
  }
};

const fetchClientByClientId = async (clientId) => {
  try {
    const response = await fetch(`${apiUrl}/users/client/clientId/${clientId}`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error || 'Unable to fetch client data');
    }

    return data;
  } catch (error) {
    console.error('Error fetching client by client ID:', error);
    throw error;
  }
};

const fetchCoachPlans = async (userId) => {
  try {
    const response = await fetch(`${apiUrl}/users/coach/coachPlan/${userId}`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error || 'Failed to fetch coach plans');
    }

    return data;
  } catch (error) {
    console.error('Error fetching coach plans:', error);
    throw error;
  }
};

const fetchCoachStudents = async (userId) => {
  try {
    const response = await fetch(`${apiUrl}/users/coach/allStudents/${userId}`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error || 'Failed to fetch students');
    }

    return data;
  } catch (error) {
    console.error('Error fetching students:', error);
    throw error;
  }
};

const fetchMessages = async (coachId, clientId, page = 1) => {
  try {
    const response = await fetch(`${apiUrl}/messages/${coachId}/${clientId}?page=${page}&limit=100`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error || 'Failed to fetch messages');
    }

    return data;
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
};

const markMessagesAsRead = async (senderId, receiverId) => {
  const body = {
    senderId,
    receiverId
  };

  try {
    const response = await fetch(`${apiUrl}/messages/mark-as-read/conversation/${senderId}/${receiverId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error || 'Failed to mark messages as read');
    }

    return data;
  } catch (error) {
    console.error('Error marking messages as read:', error);
    throw error;
  }
};

const fetchClientsSubscribed = async (coachId) => {
  try {
    const response = await fetch(`${apiUrl}/users/coach/clients-subscribed/${coachId}`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error || 'Failed to fetch clients subscribed');
    }

    return data;
  } catch (error) {
    console.error('Error fetching clients subscribed:', error);
    throw error;
  }
};

const fetchClientActivitiesByUserId = async (userId) => {
  try {
    const response = await fetch(`${apiUrl}/users/userId/activities/${userId}`, {
      headers: getAuthHeaders()
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error || 'Failed to fetch client activities');
    }

    return data;
  } catch (error) {
    console.error('Error fetching client activities:', error);
    throw error;
  }
};

const fetchLastMessages = async (coachId) => {
  try {
    const response = await fetch(`${apiUrl}/messages/coach/${coachId}/last-messages`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error || 'Failed to fetch last messages');
    }

    return data;
  } catch (error) {
    console.error('Error fetching last messages:', error);
    throw error;
  }
};

const fetchUnreadMessages = async (userId) => {
  try {
    const response = await fetch(`${apiUrl}/messages/get-unread-messages/${userId}`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error || 'Failed to fetch unread messages');
    }

    return data;
  } catch (error) {
    console.error('Error fetching unread messages:', error);
    throw error;
  }
};

const saveStudent = async (body) => {
  try {
    const response = await fetch(`${apiUrl}/users/client`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body)
    });

    const data = await response.json();
    console.log(data);
    if (data.error) {
      throw new Error(data.error || 'Failed to save student');
    }

    return data;
  } catch (error) {
    console.error('Error saving student:', error);
    throw error;
  }
};

const updateStudent = async (studentId, body) => {
  try {
    const response = await fetch(`${apiUrl}/users/client/${studentId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error || 'Failed to update student');
    }

    return data;
  } catch (error) {
    console.error('Error updating student:', error);
    throw error;
  }
};

const updateCoach = async (userId, body) => {
  try {
    const response = await fetch(`${apiUrl}/users/coach/${userId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error || 'Failed to update coach');
    }

    return data;
  } catch (error) {
    console.error('Error updating coach:', error);
    throw error;
  }
};

const updatePersonalInfo = async (personalInfoId, body) => {
  try {
    const response = await fetch(`${apiUrl}/users/client/${personalInfoId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error || 'Failed to update personal info');
    }

    return data;
  } catch (error) {
    console.error('Error updating personal info:', error);
    throw error;
  }
};

const updateClient = async (clientId, body) => {
  try {
    const response = await fetch(`${apiUrl}/students/${clientId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(body)
    });
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error || 'Failed to update client');
    }

    return data;
  } catch (error) {
    console.error('Error updating client:', error);
    throw error;
  }
};

const deleteClient = async (clientId) => {
  try {
    const response = await fetch(`${apiUrl}/users/client/${clientId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error || 'Failed to delete client');
    }

    return data;
  } catch (error) {
    console.error('Error deleting client:', error);
    throw error;
  }
};

const fetchClientStreak = async (clientId) => {
  try {
    const response = await fetch(`${apiUrl}/workout-streaks/client/${clientId}/active`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();

    return data;
  } catch (error) {
    console.error('Error fetching client streak:', error);
    throw error;
  }
};

const fetchClientDailyStreak = async (clientId) => {
  try {
    const response = await fetch(`${apiUrl}/workout-streaks/client/${clientId}/daily`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();

    return data;
  } catch (error) {
    console.error('Error fetching client daily streak:', error);
    throw error;
  }
};

const fetchAmIWorkingOutToday = async (clientId) => {
  try {
    const response = await fetch(`${apiUrl}/workout/am-i-traning-today/${clientId}`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();

    return data;
  } catch (error) {
    console.error('Error fetching am i working out today:', error);
    throw error;
  }
};

export {
  fetchUser, // checked
  fetchCoach, // checked
  fetchClient, // checked
  fetchMessages, // checked
  fetchCoachPlans, // checked
  fetchCoachStudents, // checked
  fetchClientActivitiesByUserId, // checked
  fetchClientByClientId, // checked
  fetchLastMessages, // checked
  saveStudent, // checked
  updateStudent, // checked
  updateCoach, // checked
  updatePersonalInfo, // checked
  deleteClient, // checked
  markMessagesAsRead, // checked
  fetchUnreadMessages, // checked
  updateClient, // checked
  fetchClientsSubscribed, // checked
  fetchClientStreak, // checked
  fetchClientDailyStreak, // checked
  fetchAmIWorkingOutToday, // checked
  registerCoach, // checked
  login // checked
};

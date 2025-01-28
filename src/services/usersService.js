const apiUrl = process.env.REACT_APP_API_URL;

const fetchUser = async (userId) => {
  const response = await fetch(`${apiUrl}/users/${userId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error || 'Unable to fetch user data');
  }

  return data;
};

const fetchCoach = async (userId) => {
  const response = await fetch(`${apiUrl}/users/coach/${userId}`);
  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error || 'Unable to fetch coach data');
  }

  return data;
};
  
const fetchClient = async (userId) => {
  const response = await fetch(`${apiUrl}/users/client/${userId}`);
  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error || 'Unable to fetch client data');
  }
  
  return data;
};

const fetchClientByClientId = async (clientId) => {
  const response = await fetch(`${apiUrl}/users/client/clientId/${clientId}`);
  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error || 'Unable to fetch client data');
  }

  return data;
};

const fetchCoachPlans = async (userId) => {
  try {
    const response = await fetch(`${apiUrl}/users/coach/coachPlan/${userId}`);
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
    const response = await fetch(`${apiUrl}/users/coach/allStudents/${userId}`);
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

const fetchMessages = async (coachId, clientId, page=1) => {
  try {
    const response = await fetch(`${apiUrl}/messages/${coachId}/${clientId}?page=${page}&limit=100`);
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error || 'Failed to fetch messages');
    }

    return data;
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
}

const markMessagesAsRead = async (senderId, receiverId) => {
  const body = {
    senderId,
    receiverId
  }
  
  try {
    const response = await fetch(`${apiUrl}/messages/mark-as-read/conversation/${senderId}/${receiverId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
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
}

const fetchClientActivities = async (studentId) => {
  const response = await fetch(`${apiUrl}/users/clientId/activities/${studentId}`, {
    headers: {
      'Content-Type': 'application/json',
    }
  });

  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error || 'Failed to fetch client activities');
  }

  return data;
};

const fetchRecentActivitiesByCoachId = async (coachId) => {
  const response = await fetch(`${apiUrl}/users/coachId/${coachId}/recent-activity`, {
    headers: {
      'Content-Type': 'application/json',
    }
  });

  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error || 'Failed to fetch recent activities');
  }

  return data;
}

const fetchClientActivitiesByUserId = async (userId) => {
  const response = await fetch(`${apiUrl}/users/userId/activities/${userId}`, {
    headers: {
      'Content-Type': 'application/json',
    }
  });

  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error || 'Failed to fetch client activities');
  }

  return data;
};

const fetchWorkoutProgressByCoachId = async (coachId) => {
  const response = await fetch(`${apiUrl}/users/coachId/${coachId}/workout-progress`, {
    headers: {
      'Content-Type': 'application/json',
    }
  });

  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error || 'Failed to fetch workout progress');
  }

  return data;
};

const fetchUpcomingSessionsByCoachId = async (coachId) => {
  const response = await fetch(`${apiUrl}/users/coachId/${coachId}/upcoming-sessions`, {
    headers: {
      'Content-Type': 'application/json',
    }
  });

  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error || 'Failed to fetch upcoming sessions');
  }

  return data;
};

const fetchLastMessages = async (coachId) => {
  const response = await fetch(`${apiUrl}/messages/coach/${coachId}/last-messages`);
  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error || 'Failed to fetch last messages');
  }

  return data;
};

const fetchUnreadMessages = async (userId) => {
  const response = await fetch(`${apiUrl}/messages/get-unread-messages/${userId}`);
  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error || 'Failed to fetch unread messages');
  }

  return data;
};

const saveStudent = async (body) => {
  const response = await fetch(`${apiUrl}/users/client`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body)
  });

  const data = await response.json();
  console.log(data)
  if (data.error) {
    throw new Error(data.error || 'Failed to save student');
  }

  return data;
};

const updateStudent = async (studentId, body) => {
  try {
    const response = await fetch(`${apiUrl}/users/client/${studentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
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

const updateCoach = async (userId, body, token) => {
  const response = await fetch(`${apiUrl}/users/coach/${userId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error || 'Failed to update coach');
  }

  return data;
};

const updatePersonalInfo = async (personalInfoId, body) => {
  const response = await fetch(`${apiUrl}/users/client/${personalInfoId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body)
  });

  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error || 'Failed to update personal info');
  }

  return data;
};

const updateClient = async (clientId, body) => {
  const response = await fetch(`${apiUrl}/students/${clientId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error || 'Failed to update client');
  }

  return data;
};

const deleteClient = async (clientId) => {
  const response = await fetch(`${apiUrl}/users/client/${clientId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    }
  });

  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error || 'Failed to delete client');
  }

  return data;
};

export {
    fetchUser,
    fetchCoach,
    fetchClient,
    fetchMessages,
    fetchCoachPlans,
    fetchCoachStudents,
    fetchClientActivitiesByUserId,
    fetchRecentActivitiesByCoachId,
    fetchWorkoutProgressByCoachId,
    fetchUpcomingSessionsByCoachId,
    fetchClientByClientId,
    fetchLastMessages,
    fetchClientActivities,
    saveStudent,
    updateStudent,
    updateCoach,
    updatePersonalInfo,
    deleteClient,
    markMessagesAsRead,
    fetchUnreadMessages,
    updateClient
}
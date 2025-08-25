const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const markNotificationAsRead = async (notificationId: any) => {
  const response = await fetch(`${apiUrl}/notifications/mark-as-read/${notificationId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  if (!response.ok) {
    const errorData = await response.json();
    // Handle cases where the error message might be an array or single message
    const errorMessage =
      errorData.message && Array.isArray(errorData.message.message)
        ? errorData.message.message.join(', ')
        : errorData.message || 'Something went wrong';
    throw new Error(errorMessage);
  }

  return await response.json();
};

const getUserNotifications = async (userId: any) => {
  const response = await fetch(`${apiUrl}/notifications/all/${userId}`, {
    headers: {
      'Content-Type': 'application/json'
    }
  });
  if (!response.ok) {
    const errorData = await response.json();
    console.log('Error data:', errorData);
    const errorMessage = errorData.message || 'Something went wrong';
    throw new Error(errorMessage);
  }

  return await response.json(); // Directly returning parsed JSON data
};
export { markNotificationAsRead, getUserNotifications };

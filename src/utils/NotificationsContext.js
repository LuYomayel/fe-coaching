// NotificationContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import {
  getUserNotifications,
  markNotificationAsRead
} from '../services/notificationsService';
import { UserContext } from './UserContext';
import { useToast } from './ToastContext';
const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useContext(UserContext);
  const showToast = useToast();
  useEffect(() => {
    // Cargar notificaciones al iniciar la aplicación
    // eslint-disable-next-line
    const loadNotifications = async () => {
      // console.log('User id:', user)
      const data = await getUserNotifications(user.userId);
      setNotifications(data);
      setUnreadCount(
        data.filter((notification) => !notification.isRead).length
      );
    };
    // if(user) loadNotifications();
  }, [user]);

  const markAsRead = async (notificationId) => {
    const response = await markNotificationAsRead(notificationId);
    if (response.affectedRows > 1) {
      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );
      setUnreadCount(unreadCount - 1);
    } else {
      showToast(
        'error',
        'Error',
        'Error al marcar la notificacion como leida.'
      );
    }
  };

  return (
    <NotificationContext.Provider
      value={{ notifications, markAsRead, unreadCount }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);

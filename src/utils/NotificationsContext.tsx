// NotificationContext.tsx
'use client';
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { getUserNotifications, markNotificationAsRead } from '../services/notificationsService';
import { UserContext } from './UserContext';
import { useToast } from './ToastContext';

interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

interface NotificationContextType {
  notifications: Notification[];
  markAsRead: (notificationId: string) => Promise<void>;
  unreadCount: number;
}

interface NotificationProviderProps {
  children: ReactNode;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const userContext = useContext(UserContext);
  const user = userContext?.user;
  const showToast = useToast();
  useEffect(() => {
    // Cargar notificaciones al iniciar la aplicación
    // eslint-disable-next-line
    const loadNotifications = async () => {
      // console.log('User id:', user)
      if (user?.userId) {
        const data = await getUserNotifications(user.userId);
        setNotifications(data);
        setUnreadCount(data.filter((notification: Notification) => !notification.isRead).length);
      }
    };
    // if(user) loadNotifications();
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    const response = await markNotificationAsRead(notificationId);
    if (response.affectedRows > 1) {
      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) =>
          notification.id === notificationId ? { ...notification, isRead: true } : notification
        )
      );
      setUnreadCount(unreadCount - 1);
    } else {
      showToast('error', 'Error', 'Error al marcar la notificacion como leida.');
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, markAsRead, unreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

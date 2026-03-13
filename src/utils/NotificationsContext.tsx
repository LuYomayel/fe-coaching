import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { api } from '../services/api-client';
import { useUser } from '../contexts/UserContext';
import { useToast } from '../contexts/ToastContext';

interface INotification {
  id: number;
  isRead: boolean;
  [key: string]: unknown;
}

interface INotificationContextValue {
  notifications: INotification[];
  markAsRead: (notificationId: number) => Promise<void>;
  unreadCount: number;
}

const NotificationContext = createContext<INotificationContextValue | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useUser();
  const { showToast } = useToast();

  useEffect(() => {
    // TODO: habilitar cuando se active notificaciones
    // const loadNotifications = async () => {
    //   const { data } = await api.notification.getUserNotifications(user!.userId);
    //   const notifs = data || [];
    //   setNotifications(notifs);
    //   setUnreadCount(notifs.filter((notification: INotification) => !notification.isRead).length);
    // };
    // if(user) loadNotifications();
  }, [user]);

  const markAsRead = async (notificationId: number) => {
    const response = await api.notification.markNotificationAsRead(notificationId);
    if (response.data?.affectedRows > 1) {
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

export const useNotifications = (): INotificationContextValue => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

import React, { useState, useRef, useContext, useEffect } from 'react';
import { Sidebar } from 'primereact/sidebar';
import { Button } from 'primereact/button';
import { Avatar } from 'primereact/avatar';
import { OverlayPanel } from 'primereact/overlaypanel';
import { Menu } from 'primereact/menu';
import { UserContext } from '../utils/UserContext';
import { useNavigate, Link } from 'react-router-dom';
import ChatSidebar from './ChatSideBar';
import { useChatSidebar } from '../utils/ChatSideBarContext';
import { markNotificationAsRead, getUserNotifications } from '../services/notificationsService'
import { Badge } from 'primereact/badge';
import { fetchLastMessages } from '../services/usersService'
import { useIntl, FormattedMessage } from 'react-intl';

export default function Header() {
  const intl = useIntl();
  const { isChatSidebarOpen, closeChatSidebar, openChatSidebar } = useChatSidebar();
  const op = useRef(null);
  const { user, coach, client, setUser } = useContext(UserContext);
  const navigate = useNavigate();
  const notificationOp = useRef(null);
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  // const [unreadMessages, setUnreadMessages] = useState(0)
  const {unreadMessages, setUnreadMessages} = useChatSidebar()
  const menuItems = [
    {
      label: intl.formatMessage({ id: 'header.home' }),
      icon: 'pi pi-home',
      command: () => navigate(user.userType === 'client' ? '/student' : '/coach'),
    },
    {
      label: intl.formatMessage({ id: 'header.profile' }),
      icon: 'pi pi-user',
      command: () => navigate(user.userType === 'client' ? '/student/profile' : '/coach/profile'),
    },
    {
      label: intl.formatMessage({ id: 'header.clients' }),
      icon: 'pi pi-users',
      command: () => {
        if (user.userType === 'coach') navigate('/manage-students');
      },
      visible: user?.userType === 'coach',  // Sólo visible para coach
    },
    {
      label: intl.formatMessage({ id: 'header.logout' }),
      icon: 'pi pi-power-off',
      command: () => handleLogout(),
    }
  ];

    const handleLogout = () => {
      localStorage.removeItem('token');
      setUser(null);
      navigate('/');
    };

    useEffect(() => {
      // Cargar notificaciones
      const fetchNotifications = async () => {
        const data = await getUserNotifications(user.userId);
        setNotifications(data);
        setUnreadCount(data.filter((notification) => !notification.isRead).length);
      };

      const fetchMessages = async () => {
        try {
          const messages = await fetchLastMessages(user.userId);
          const unreadMessageCount = messages.filter(msg => !msg.isRead).length;
          setUnreadMessages(unreadMessageCount);
        } catch (error) {
          console.error('Error fetching messages:', error);
        } finally {
        }
      };

      if (user) {
        fetchNotifications();
        fetchMessages();
      }
    }, [user, setUnreadMessages]);
    
    const handleNotificationClick = async (notificationId) => {
      await markNotificationAsRead(notificationId); // Marcar como leída en el backend
      setNotifications((prev) =>
        prev.map((notif) => (notif.id === notificationId ? { ...notif, isRead: true } : notif))
      );
      setUnreadCount(unreadCount - 1);
    };

    if (!user || (user && !user.isVerified) || (user && (!coach && !client)) || (user && client && client.user.subscription.status === 'Inactive')) {
      return null;
    }

  return (
    <div className="flex justify-content-between align-items-center p-3 surface-0 shadow-1">
      <div className="flex align-items-center">
        <Link to={user.userType === 'client' ? '/student' : '/coach'}>
          <img src="/logo512.png" alt="EaseTrain Logo" className="mr-2" style={{ height: '40px' }} />
        </Link>
        <span className="text-xl font-bold">EaseTrain</span>
      </div>
      <div className="flex align-items-center">
        <Button icon="pi pi-comments" onClick={openChatSidebar} className="p-button-text mr-2" label={intl.formatMessage({ id: 'header.chat' })} badge={unreadMessages > 0 ? unreadMessages : null} />
        <Button
          icon="pi pi-bell"
          onClick={(e) => notificationOp.current.toggle(e)}
          className="p-button-text mr-2"
          badge={unreadCount > 0 ? unreadCount : null}
        />
        <OverlayPanel ref={notificationOp} className="notification-panel">
          <div>
            <h4><FormattedMessage id="header.notifications" /></h4>
            {notifications.length === 0 && <p><FormattedMessage id="header.noNotifications" /></p>}
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification.id)}
                className={`notification-item ${notification.isRead ? 'read' : 'unread'}`}
              >
                <p>{notification.message}</p>
                <small>{new Date(notification.createdAt).toLocaleString()}</small>
                <Badge
                  value={notification.isRead ? '✔' : '⏳'}
                  severity={notification.isRead ? 'success' : 'warning'}
                />
              </div>
            ))}
          </div>
        </OverlayPanel>
        <Avatar image={user.profilePicture || '/image.webp'} shape="circle" onClick={(e) => op.current.toggle(e)} />
        <OverlayPanel ref={op}>
          <Menu model={menuItems} />
        </OverlayPanel>
      </div>
      <Sidebar visible={isChatSidebarOpen} position="right" onHide={() => closeChatSidebar()} style={{ width: '40rem' }}>
        <ChatSidebar isCoach={user.userType === 'coach'} />
      </Sidebar>
    </div>
  );
}
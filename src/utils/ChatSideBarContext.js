import { createContext, useState, useContext, useEffect } from 'react';
import { fetchUnreadMessages } from '../services/usersService';
import { UserContext } from './UserContext';

const ChatSidebarContext = createContext();

export const useChatSidebar = () => useContext(ChatSidebarContext);

export const ChatSidebarProvider = ({ children }) => {
  const [isChatSidebarOpen, setIsChatSidebarOpen] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [unreadMessages, setUnreadMessages] = useState([]);
  const openChatSidebar = () => setIsChatSidebarOpen(true);
  const closeChatSidebar = () => setIsChatSidebarOpen(false);
  const {user} = useContext(UserContext)
  useEffect(() => {

    const fetchMessages = async () => {
      try {
        const messages = await fetchUnreadMessages(user.userId);
        const unreadMessageCount = messages.filter(msg => !msg.isRead).length;
        setUnreadMessages(unreadMessageCount);
        console.log('Last messages: ', messages)
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
      }
    };

    if (user) {
      fetchMessages();
    }
  }, [user]);

  return (
    <ChatSidebarContext.Provider value={{ isChatSidebarOpen, selectedChat, unreadMessages, setUnreadMessages, setSelectedChat, openChatSidebar, closeChatSidebar }}>
      {children}
    </ChatSidebarContext.Provider>
  );
};
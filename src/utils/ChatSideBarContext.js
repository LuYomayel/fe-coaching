import { createContext, useState, useContext, useEffect } from 'react';
import { fetchUnreadMessages } from '../services/usersService';
import { UserContext } from './UserContext';
import io from 'socket.io-client';
import { useToast } from './ToastContext';

const apiUrl = process.env.REACT_APP_API_URL;

const ChatSidebarContext = createContext();

export const useChatSidebar = () => useContext(ChatSidebarContext);

export const ChatSidebarProvider = ({ children }) => {
  const [isChatSidebarOpen, setIsChatSidebarOpen] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [unreadMessages, setUnreadMessages] = useState([]);
  const openChatSidebar = () => setIsChatSidebarOpen(true);
  const closeChatSidebar = () => setIsChatSidebarOpen(false);
  const {user} = useContext(UserContext)
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false); // Estado de conexión del socket
  const showToast = useToast();
  useEffect(() => {
    // Establecer conexión con el socket
    const newSocket = io(apiUrl, {
      auth: { token: localStorage.getItem('token') }
    });
    setSocket(newSocket);

    // Manejar conexión y desconexión
    newSocket.on('connect', () => setIsConnected(true));
    newSocket.on('disconnect', () => setIsConnected(false));

    // Recibir nuevos mensajes
    newSocket.on('receiveMessage', (message) => {
      if(message.sender.id !== user.userId)
      if(isChatSidebarOpen && selectedChat.user.id !== message.sender.id){
        setUnreadMessages((prevCount) => prevCount + 1);
        console.log('Message: ', message.content, message)
        showToast('success', `New message from: ${message.sender.coach ? message.sender.coach.name : message.sender.client.name}`, message.content)
      }else if(!isChatSidebarOpen){
        setUnreadMessages((prevCount) => prevCount + 1);
        showToast('success', `New message from: ${message.sender.coach ? message.sender.coach.name : message.sender.client.name}`, message.content)
      }
    });

    return () => newSocket.disconnect();
  }, [selectedChat]);

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

    if (user && user.userId) {
      fetchMessages();
    }
  }, [user]);

  return (
    <ChatSidebarContext.Provider value={{ isChatSidebarOpen, selectedChat, unreadMessages, setUnreadMessages, setSelectedChat, openChatSidebar, closeChatSidebar }}>
      {children}
    </ChatSidebarContext.Provider>
  );
};
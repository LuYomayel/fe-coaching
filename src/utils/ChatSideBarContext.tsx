'use client';
import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { UserContext } from './UserContext';
import { authService } from '../services/authService';
// import io, { Socket } from 'socket.io-client'; // TEMPORALMENTE DESACTIVADO
import { useToast } from './ToastContext';

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

interface ChatUser {
  id: string;
  name: string;
  coach?: any;
  client?: any;
}

interface SelectedChat {
  user: ChatUser;
}

interface Message {
  id: string;
  content: string;
  sender: ChatUser;
}

interface ChatSidebarContextType {
  isChatSidebarOpen: boolean;
  selectedChat: SelectedChat | null;
  unreadMessages: number;
  setUnreadMessages: React.Dispatch<React.SetStateAction<number>>;
  setSelectedChat: React.Dispatch<React.SetStateAction<SelectedChat | null>>;
  openChatSidebar: () => void;
  closeChatSidebar: () => void;
}

interface ChatSidebarProviderProps {
  children: ReactNode;
}

const ChatSidebarContext = createContext<ChatSidebarContextType | undefined>(undefined);

export const useChatSidebar = (): ChatSidebarContextType => {
  const context = useContext(ChatSidebarContext);
  if (!context) {
    throw new Error('useChatSidebar must be used within a ChatSidebarProvider');
  }
  return context;
};

export const ChatSidebarProvider: React.FC<ChatSidebarProviderProps> = ({ children }) => {
  const [isChatSidebarOpen, setIsChatSidebarOpen] = useState<boolean>(false);
  const [selectedChat, setSelectedChat] = useState<SelectedChat | null>(null);
  const [unreadMessages, setUnreadMessages] = useState<number>(0);
  const openChatSidebar = () => setIsChatSidebarOpen(true);
  const closeChatSidebar = () => setIsChatSidebarOpen(false);
  const userContext = useContext(UserContext);
  const user = userContext?.user;
  // eslint-disable-next-line
  // const [socket, setSocket] = useState<Socket | null>(null); // TEMPORALMENTE DESACTIVADO
  // eslint-disable-next-line
  // const [isConnected, setIsConnected] = useState<boolean>(false); // TEMPORALMENTE DESACTIVADO
  const showToast = useToast();

  const handleReceiveMessage = useCallback(
    (message: Message) => {
      if (user && message.sender.id !== user.userId) {
        if (isChatSidebarOpen && selectedChat && selectedChat.user.id !== message.sender.id) {
          setUnreadMessages((prevCount) => prevCount + 1);
          console.log('Message: ', message.content, message);
          showToast(
            'success',
            `New message from: ${message.sender.coach ? message.sender.coach.name : message.sender.client.name}`,
            message.content
          );
        } else if (!isChatSidebarOpen) {
          setUnreadMessages((prevCount) => prevCount + 1);
          showToast(
            'success',
            `New message from: ${message.sender.coach ? message.sender.coach.name : message.sender.client.name}`,
            message.content
          );
        }
      }
    },
    [user, isChatSidebarOpen, selectedChat, showToast]
  );

  // Socket.IO temporalmente desactivado
  // useEffect(() => {
  //   if (!user?.userId) return;

  //   // Establecer conexión con el socket
  //   const newSocket = io(apiUrl || '', {
  //     auth: { token: authService.getToken() }
  //   });
  //   setSocket(newSocket);

  //   // Manejar conexión y desconexión
  //   newSocket.on('connect', () => setIsConnected(true));
  //   newSocket.on('disconnect', () => setIsConnected(false));

  //   // Recibir nuevos mensajes
  //   newSocket.on('receiveMessage', handleReceiveMessage);

  //   // Función de limpieza
  //   return () => {
  //     newSocket.disconnect();
  //   };
  // }, [user?.userId, handleReceiveMessage]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        //const messages = await fetchUnreadMessages(user.userId);
        //const unreadMessageCount = messages.filter(msg => !msg.isRead).length;
        setUnreadMessages(0);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    if (user && user.userId) {
      fetchMessages();
    }
  }, [user?.userId]);

  return (
    <ChatSidebarContext.Provider
      value={{
        isChatSidebarOpen,
        selectedChat,
        unreadMessages,
        setUnreadMessages,
        setSelectedChat,
        openChatSidebar,
        closeChatSidebar
      }}
    >
      {children}
    </ChatSidebarContext.Provider>
  );
};

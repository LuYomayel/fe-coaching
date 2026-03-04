import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useUser } from '../contexts/UserContext';

interface IChat {
  user: { id: number };
  [key: string]: unknown;
}

interface IChatSidebarContextValue {
  isChatSidebarOpen: boolean;
  selectedChat: IChat | null;
  unreadMessages: number;
  setUnreadMessages: (count: number | ((prev: number) => number)) => void;
  setSelectedChat: (chat: IChat | null) => void;
  openChatSidebar: () => void;
  closeChatSidebar: () => void;
}

const ChatSidebarContext = createContext<IChatSidebarContextValue | undefined>(undefined);

export const useChatSidebar = (): IChatSidebarContextValue => {
  const context = useContext(ChatSidebarContext);
  if (!context) {
    throw new Error('useChatSidebar must be used within a ChatSidebarProvider');
  }
  return context;
};

export const ChatSidebarProvider = ({ children }: { children: ReactNode }) => {
  const [isChatSidebarOpen, setIsChatSidebarOpen] = useState(false);
  const [selectedChat, setSelectedChat] = useState<IChat | null>(null);
  const [unreadMessages, setUnreadMessages] = useState<number>(0);
  const openChatSidebar = () => setIsChatSidebarOpen(true);
  const closeChatSidebar = () => setIsChatSidebarOpen(false);
  const { user } = useUser();

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setUnreadMessages(0);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    if (user && user.userId) {
      fetchMessages();
    }
  }, [user]);

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

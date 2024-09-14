import { createContext, useState, useContext } from 'react';

const ChatSidebarContext = createContext();

export const useChatSidebar = () => useContext(ChatSidebarContext);

export const ChatSidebarProvider = ({ children }) => {
  const [isChatSidebarOpen, setIsChatSidebarOpen] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const openChatSidebar = () => setIsChatSidebarOpen(true);
  const closeChatSidebar = () => setIsChatSidebarOpen(false);

  return (
    <ChatSidebarContext.Provider value={{ isChatSidebarOpen, selectedChat, setSelectedChat, openChatSidebar, closeChatSidebar }}>
      {children}
    </ChatSidebarContext.Provider>
  );
};
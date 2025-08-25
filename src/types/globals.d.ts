// Global type declarations for fixing ESLint no-undef errors

// Re-export all types to make them globally available
export * from './index';

// Make React types globally available
import { ReactNode, Dispatch, SetStateAction } from 'react';

declare global {
  // React types
  type ReactNode = import('react').ReactNode;
  type Dispatch<T> = import('react').Dispatch<T>;
  type SetStateAction<T> = import('react').SetStateAction<T>;

  // App-specific types
  interface AppContentProps {
    sidebarExpanded: boolean;
    setSidebarExpanded: (expanded: boolean) => void;
    isMobile: boolean;
  }

  // Context types
  interface LanguageContextType {
    locale: string;
    switchLanguage: (newLocale: string) => void;
  }

  interface ChatUser {
    id: number;
    email: string;
    coach?: any;
    client?: any;
  }

  interface SelectedChat {
    user: ChatUser;
  }

  interface Message {
    id: number;
    content: string;
    sender: ChatUser;
  }

  interface ChatSidebarContextType {
    isChatSidebarOpen: boolean;
    selectedChat: SelectedChat | null;
    unreadMessages: number;
    setUnreadMessages: Dispatch<SetStateAction<number>>;
    setSelectedChat: Dispatch<SetStateAction<SelectedChat | null>>;
    openChatSidebar: () => void;
    closeChatSidebar: () => void;
  }

  interface ChatSidebarProviderProps {
    children: ReactNode;
  }

  interface ConfirmationDialogState {
    visible: boolean;
    message: string;
    header?: string;
    icon?: string;
    accept?: () => void;
    reject?: () => void;
  }

  interface ShowConfirmationDialogProps {
    message: string;
    header?: string;
    icon?: string;
    accept?: () => void;
    reject?: () => void;
  }

  interface ConfirmationDialogContextType {
    showConfirmationDialog: (props: ShowConfirmationDialogProps) => void;
  }

  interface ConfirmationDialogProviderProps {
    children: ReactNode;
  }

  interface SpinnerContextType {
    loading: boolean;
    setLoading: (loading: boolean) => void;
  }

  interface SpinnerProviderProps {
    children: ReactNode;
  }

  interface NotificationItem {
    id: number;
    userId: number;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
  }

  interface NotificationContextType {
    notifications: NotificationItem[];
    markAsRead: (notificationId: number) => void;
    unreadCount: number;
  }

  interface NotificationProviderProps {
    children: ReactNode;
  }

  interface ThemeContextType {
    isDarkMode: boolean;
    setIsDarkMode: (isDarkMode: boolean) => void;
  }

  interface ThemeProviderProps {
    children: ReactNode;
  }

  type ToastSeverity = 'success' | 'info' | 'warn' | 'error';

  interface ShowToastFunction {
    (severity: ToastSeverity, summary: string, detail?: string, sticky?: boolean): void;
  }

  interface ToastProviderProps {
    children: ReactNode;
  }

  interface UserContextType {
    user: any;
    coach: any;
    client: any;
    setUser: (user: any) => void;
    setCoach: (coach: any) => void;
    setClient: (client: any) => void;
    isInitialized: boolean;
    isLoading: boolean;
  }

  interface UserProviderProps {
    children: ReactNode;
  }
}

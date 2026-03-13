/**
 * Tipos para contextos de React
 */

import { ReactNode } from 'react';
import { ICoach, IClient, IUser } from './models';

// ==================== USER CONTEXT ====================

export interface UserContextValue {
  user: IUser | null;
  coach: ICoach | null;
  client: IClient | null;
  setUser: (user: IUser) => void;
  setCoach: (coach: ICoach) => void;
  setClient: (client: IClient) => void;
  isInitialized: boolean;
  logout: () => void;
}

export interface UserProviderProps {
  children: ReactNode;
}

// ==================== THEME CONTEXT ====================

export type Theme = 'light' | 'dark';

export interface ThemeContextValue {
  isDarkMode: boolean;
  setIsDarkMode: (isDarkMode: boolean) => void;
  toggleTheme: () => void;
}

export interface ThemeProviderProps {
  children: ReactNode;
}

// ==================== TOAST CONTEXT ====================

export type ToastSeverity = 'success' | 'info' | 'warn' | 'error';

export interface ToastMessage {
  severity: ToastSeverity;
  summary: string;
  detail?: string;
  life?: number;
}

export interface ToastContextValue {
  showToast: (severity: ToastMessage['severity'], summary: string, detail?: string, sticky?: boolean) => void;
}

export interface ToastProviderProps {
  children: ReactNode;
}

// ==================== LANGUAGE CONTEXT ====================

export type Language = 'es' | 'en' | 'pt';

export interface LanguageContextValue {
  locale: Language;
  setLocale: (locale: Language) => void;
  messages: Record<string, string>;
}

export interface LanguageProviderProps {
  children: ReactNode;
}

// ==================== SPINNER CONTEXT ====================

export interface SpinnerContextValue {
  loading: boolean;
  showSpinner: () => void;
  hideSpinner: () => void;
  setLoading: (loading: boolean) => void;
}

export interface SpinnerProviderProps {
  children: ReactNode;
}

// ==================== CONFIRMATION DIALOG CONTEXT ====================

export interface ConfirmDialogOptions {
  message: string;
  header?: string;
  icon?: string;
  acceptLabel?: string;
  rejectLabel?: string;
  acceptClassName?: string;
  rejectClassName?: string;
  accept?: () => void;
  reject?: () => void;
}

export interface ConfirmationDialogContextValue {
  confirm: (options: ConfirmDialogOptions) => void;
}

export interface ConfirmationDialogProviderProps {
  children: ReactNode;
}

// ==================== CHAT SIDEBAR CONTEXT ====================

export interface Message {
  id: string;
  senderId: number;
  receiverId: number;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface ChatConversation {
  userId: number;
  userName: string;
  userImage?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  messages: Message[];
}

export interface ChatSidebarContextValue {
  isOpen: boolean;
  activeConversation: ChatConversation | null;
  conversations: ChatConversation[];
  openChat: (userId: number) => void;
  closeChat: () => void;
  toggleChat: () => void;
  sendMessage: (message: string) => void;
  markAsRead: (conversationId: number) => void;
  refreshConversations: () => Promise<void>;
}

export interface ChatSidebarProviderProps {
  children: ReactNode;
}

// ==================== NOTIFICATIONS CONTEXT ====================

export interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: number) => Promise<void>;
  addNotification: (notification: Notification) => void;
}

export interface NotificationProviderProps {
  children: ReactNode;
}

// ==================== DRAG & DROP CONTEXT ====================

export interface DragDropContextValue {
  activeId: string | null;
  isDragging: boolean;
  draggedItem: any;
}

export interface DragDropProviderProps {
  children: ReactNode;
}



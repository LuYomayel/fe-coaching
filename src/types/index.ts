// =============================================
// TIPOS COMPARTIDOS DEL BACKEND + EXTENSIONES FRONTEND
// =============================================

// Importar todos los tipos del archivo shared-types
export * from './shared-types';
import { IUser, IClient, ICoach } from './shared-types';

// =============================================
// EXTENSIONES ESPECÍFICAS PARA FRONTEND
// =============================================

// Tipos adicionales para componentes React
export interface ComponentProps {
  children?: React.ReactNode;
  className?: string;
  visible?: boolean;
  onHide?: () => void;
  [key: string]: any;
}

// Props para contextos React
export interface ContextProviderProps {
  children: React.ReactNode;
}

// Tipos para manejo de errores en frontend
export interface ErrorState {
  hasError: boolean;
  error?: Error;
}

// Tipos para eventos DOM
export interface TargetWithSrc extends EventTarget {
  src: string;
}

export interface KeyboardEventWithKey extends Event {
  key: string;
}

export interface ElementWithFocus extends Element {
  focus(): void;
}

export interface ElementWithValue extends Element {
  value: string;
}

// Tipos para filtros de DataTable
export interface TableFilter {
  value: any;
  matchMode: string;
}

export interface DataTableFilters {
  global: TableFilter;
  [key: string]:
    | TableFilter
    | {
        operator: string;
        constraints: TableFilter[];
      };
}

// Tipos para formularios
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'checkbox';
  required?: boolean;
  validation?: (value: any) => string | null;
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

// Tipos genéricos para eventos
export type AnyEvent = Event | React.SyntheticEvent;
export type AnyFunction = (...args: any[]) => any;

// =============================================
// TIPOS ESPECÍFICOS PARA CONTEXTOS
// =============================================

// Language Context
export interface LanguageContextType {
  locale: string;
  switchLanguage: (newLocale: string) => void;
}

// Toast Context
export type ToastSeverity = 'success' | 'info' | 'warn' | 'error';

export interface ShowToastFunction {
  (severity: ToastSeverity, summary: string, detail?: string, sticky?: boolean): void;
}

export interface ToastProviderProps {
  children: React.ReactNode;
}

// Theme Context
export interface ThemeContextType {
  isDarkMode: boolean;
  setIsDarkMode: (isDarkMode: boolean) => void;
}

export interface ThemeProviderProps {
  children: React.ReactNode;
}

// Spinner Context
export interface SpinnerContextType {
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export interface SpinnerProviderProps {
  children: React.ReactNode;
}

// User Context
export interface UserContextType {
  user: any;
  coach: any;
  client: any;
  setUser: (user: any) => void;
  setCoach: (coach: any) => void;
  setClient: (client: any) => void;
  isInitialized: boolean;
  isLoading: boolean;
}

export interface UserProviderProps {
  children: React.ReactNode;
}

// Confirmation Dialog Context
export interface ConfirmationDialogState {
  visible: boolean;
  message: string;
  header?: string;
  icon?: string;
  accept?: () => void;
  reject?: () => void;
}

export interface ShowConfirmationDialogProps {
  message: string;
  header?: string;
  icon?: string;
  accept?: () => void;
  reject?: () => void;
}

export interface ConfirmationDialogContextType {
  showConfirmationDialog: (props: ShowConfirmationDialogProps) => void;
}

export interface ConfirmationDialogProviderProps {
  children: React.ReactNode;
}

// Notifications Context
export interface NotificationItem {
  id: number;
  userId: number;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationContextType {
  notifications: NotificationItem[];
  markAsRead: (notificationId: number) => void;
  unreadCount: number;
}

export interface NotificationProviderProps {
  children: React.ReactNode;
}

// Chat Context
export interface ChatUser {
  id: number;
  email: string;
  coach?: any;
  client?: any;
}

export interface SelectedChat {
  user: ChatUser;
}

export interface Message {
  id: number;
  content: string;
  sender: ChatUser;
}

export interface ChatSidebarContextType {
  isChatSidebarOpen: boolean;
  selectedChat: SelectedChat | null;
  unreadMessages: number;
  setUnreadMessages: React.Dispatch<React.SetStateAction<number>>;
  setSelectedChat: React.Dispatch<React.SetStateAction<SelectedChat | null>>;
  openChatSidebar: () => void;
  closeChatSidebar: () => void;
}

export interface ChatSidebarProviderProps {
  children: React.ReactNode;
}

// =============================================
// TIPOS DE COMPATIBILIDAD LEGACY
// =============================================

// Tipos híbridos para compatibilidad entre backend (number IDs) y frontend (string IDs)
export interface User extends Omit<IUser, 'id'> {
  userId: string;
  exp?: number;
}

export interface Coach extends Omit<ICoach, 'id' | 'user'> {
  id: string;
  userId: string;
}

export interface Client extends Omit<IClient, 'id' | 'user'> {
  id: string;
  userId: string;
}

// App Content Props
export interface AppContentProps {
  sidebarExpanded: boolean;
  setSidebarExpanded: (expanded: boolean) => void;
  isMobile: boolean;
}

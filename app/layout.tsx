// ✅ Layout SSR-SAFE - Solo providers, sin window/useEffect
import React from 'react';

import { LanguageProvider } from '../src/i18n/LanguageContext';
import { ThemeProvider } from '../src/utils/ThemeContext';
import { ToastProvider } from '../src/utils/ToastContext';
import { UserProvider } from '../src/utils/UserContext';
import { ConfirmationDialogProvider } from '../src/utils/ConfirmationDialogContext';
import { SpinnerProvider } from '../src/utils/GlobalSpinner';
import { ChatSidebarProvider } from '../src/utils/ChatSideBarContext';
import { NotificationProvider } from '../src/utils/NotificationsContext';
import ClientLayout from './ClientLayout';
import '../src/index.css';
import '../src/App.css';
import '../src/primereact.css';
import 'primeflex/primeflex.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        <meta name="description" content="Fe Coaching - Plataforma de entrenamiento personal" />
        <link rel="apple-touch-icon" href="/logo192.png" />
        <link rel="manifest" href="/manifest.json" />
        <title>Fe Coaching</title>
      </head>
      <body>
        <SpinnerProvider>
          <LanguageProvider>
            <ThemeProvider>
              <UserProvider>
                <ToastProvider>
                  <NotificationProvider>
                    <ChatSidebarProvider>
                      <ConfirmationDialogProvider>
                        <ClientLayout>{children}</ClientLayout>
                      </ConfirmationDialogProvider>
                    </ChatSidebarProvider>
                  </NotificationProvider>
                </ToastProvider>
              </UserProvider>
            </ThemeProvider>
          </LanguageProvider>
        </SpinnerProvider>
      </body>
    </html>
  );
}

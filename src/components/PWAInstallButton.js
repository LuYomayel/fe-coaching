import React, { useState, useEffect } from 'react';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { showInstallPrompt, installPWA, requestNotificationPermission } from '../serviceWorkerRegistration';

const PWAInstallButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const toast = React.useRef(null);

  useEffect(() => {
    // Verificar si ya está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Escuchar el evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    // Escuchar cuando la app se instala
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallButton(false);
      setDeferredPrompt(null);

      if (toast.current) {
        toast.current.show({
          severity: 'success',
          summary: '¡Éxito!',
          detail: 'EaseTrain se ha instalado correctamente',
          life: 3000
        });
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      const result = await installPWA(deferredPrompt);

      if (result.outcome === 'accepted') {
        // Solicitar permisos de notificaciones después de la instalación
        setTimeout(async () => {
          const permission = await requestNotificationPermission();
          if (permission === 'granted' && toast.current) {
            toast.current.show({
              severity: 'info',
              summary: 'Notificaciones activadas',
              detail: 'Recibirás notificaciones importantes de EaseTrain',
              life: 4000
            });
          }
        }, 2000);
      }

      setDeferredPrompt(null);
      setShowInstallButton(false);
    } catch (error) {
      console.error('Error al instalar la PWA:', error);
      if (toast.current) {
        toast.current.show({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo instalar la aplicación',
          life: 3000
        });
      }
    }
  };

  const requestNotifications = async () => {
    try {
      const permission = await requestNotificationPermission();
      if (permission === 'granted' && toast.current) {
        toast.current.show({
          severity: 'success',
          summary: 'Notificaciones activadas',
          detail: 'Recibirás notificaciones importantes de EaseTrain',
          life: 3000
        });
      } else if (permission === 'denied' && toast.current) {
        toast.current.show({
          severity: 'warn',
          summary: 'Notificaciones desactivadas',
          detail: 'Puedes activarlas desde la configuración del navegador',
          life: 4000
        });
      }
    } catch (error) {
      console.error('Error al solicitar permisos:', error);
    }
  };

  if (isInstalled) {
    return (
      <div className="p-d-flex p-ai-center p-jc-center p-mt-3">
        <Toast ref={toast} />
        <div className="p-text-center">
          <i className="pi pi-check-circle" style={{ fontSize: '2rem', color: 'var(--green-500)' }}></i>
          <p className="p-mt-2 p-mb-3">¡EaseTrain ya está instalado!</p>
          <Button
            label="Activar notificaciones"
            icon="pi pi-bell"
            className="p-button-sm p-button-outlined"
            onClick={requestNotifications}
          />
        </div>
      </div>
    );
  }

  if (!showInstallButton) {
    return null;
  }

  return (
    <div className="p-d-flex p-ai-center p-jc-center p-mt-3">
      <Toast ref={toast} />
      <div className="p-text-center">
        <Button
          label="Instalar EaseTrain"
          icon="pi pi-download"
          className="p-button-lg p-button-raised"
          onClick={handleInstallClick}
          tooltip="Instala EaseTrain en tu dispositivo para un acceso más rápido"
          tooltipOptions={{ position: 'top' }}
        />
        <p className="p-mt-2 p-text-sm p-text-color-secondary">
          Instala la app para un acceso más rápido y funcionalidad offline
        </p>
      </div>
    </div>
  );
};

export default PWAInstallButton;

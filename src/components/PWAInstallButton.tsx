import { useState, useEffect } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { installPWA, requestNotificationPermission } from '../serviceWorkerRegistration';
import { useToast } from 'contexts/ToastContext';

const PWAInstallButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  const { showToast } = useToast();
  useEffect(() => {
    // Detectar iOS
    const isIOSDevice =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(isIOSDevice);

    // Verificar si ya está instalado
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone: boolean }).standalone
    ) {
      setIsInstalled(true);
      return;
    }

    // En iOS, siempre mostrar el botón ya que no hay beforeinstallprompt
    if (isIOSDevice) {
      setShowInstallButton(true);
      return;
    }

    // Para otros navegadores, escuchar el evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    // Escuchar cuando la app se instala
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallButton(false);
      setDeferredPrompt(null);
      showToast('success', '¡Éxito!', 'EaseTrain se ha instalado correctamente');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    // Si es iOS, mostrar instrucciones
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    // Para otros navegadores
    if (!deferredPrompt) return;

    try {
      const result = await installPWA(deferredPrompt);

      if (result.outcome === 'accepted') {
        // Solicitar permisos de notificaciones después de la instalación
        setTimeout(async () => {
          const permission = await requestNotificationPermission();
          if (permission === 'granted') {
            showToast('info', 'Notificaciones activadas', 'Recibirás notificaciones importantes de EaseTrain');
          }
        }, 2000);
      }

      setDeferredPrompt(null);
      setShowInstallButton(false);
    } catch (error) {
      console.error('Error al instalar la PWA:', error);
      showToast('error', 'Error', 'No se pudo instalar la aplicación');
    }
  };

  const requestNotifications = async () => {
    try {
      const permission = await requestNotificationPermission();
      if (permission === 'granted') {
        showToast('success', 'Notificaciones activadas', 'Recibirás notificaciones importantes de EaseTrain');
      } else if (permission === 'denied') {
        showToast('warn', 'Notificaciones desactivadas', 'Puedes activarlas desde la configuración del navegador');
      } else {
        showToast('error', 'Error', 'No se pudo solicitar permisos de notificaciones');
      }
    } catch (error) {
      console.error('Error al solicitar permisos de notificaciones:', error);
      showToast('error', 'Error', 'No se pudo solicitar permisos de notificaciones');
    }
  };

  if (isInstalled) {
    return (
      <div className="p-d-flex p-ai-center p-jc-center p-mt-3">
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

  const renderIOSInstructionsDialog = () => (
    <Dialog
      visible={showIOSInstructions}
      onHide={() => setShowIOSInstructions(false)}
      header="📱 Instalar EaseTrain en iOS"
      style={{ width: '90vw', maxWidth: '500px' }}
      modal
      dismissableMask
    >
      <div className="p-text-center">
        <div className="p-mb-4">
          <i className="pi pi-mobile" style={{ fontSize: '3rem', color: 'var(--primary-color)' }}></i>
        </div>

        <h3 className="p-mt-0 p-mb-3">Sigue estos pasos:</h3>

        <div className="p-text-left p-mb-4">
          <div className="p-d-flex p-ai-start p-mb-3">
            <span className="p-badge p-mr-2" style={{ minWidth: '24px' }}>
              1
            </span>
            <span>
              Toca el botón de <strong>Compartir</strong> <i className="pi pi-share-alt"></i> en la barra inferior de
              Safari
            </span>
          </div>

          <div className="p-d-flex p-ai-start p-mb-3">
            <span className="p-badge p-mr-2" style={{ minWidth: '24px' }}>
              2
            </span>
            <span>
              Desplázate hacia abajo y toca <strong>&quot;Agregar a pantalla de inicio&quot;</strong>{' '}
              <i className="pi pi-plus"></i>
            </span>
          </div>

          <div className="p-d-flex p-ai-start p-mb-3">
            <span className="p-badge p-mr-2" style={{ minWidth: '24px' }}>
              3
            </span>
            <span>
              Confirma tocando <strong>&quot;Agregar&quot;</strong> en la esquina superior derecha
            </span>
          </div>
        </div>

        <div
          className="p-p-3 p-border-1 surface-border border-round p-mb-4"
          style={{ backgroundColor: 'var(--surface-100)' }}
        >
          <p className="p-m-0 p-text-sm">
            <i className="pi pi-info-circle p-mr-2"></i>
            Después de instalarlo, podrás acceder a EaseTrain desde tu pantalla de inicio como una app nativa.
          </p>
        </div>

        <Button label="Entendido" className="p-button-primary" onClick={() => setShowIOSInstructions(false)} />
      </div>
    </Dialog>
  );

  return (
    <div className="p-d-flex p-ai-center p-jc-center p-mt-3">
      <div className="p-text-center">
        <Button
          label={isIOS ? 'Instalar en iPhone/iPad' : 'Instalar EaseTrain'}
          icon={isIOS ? 'pi pi-mobile' : 'pi pi-download'}
          className="p-button-lg p-button-raised"
          onClick={handleInstallClick}
          tooltip={
            isIOS
              ? 'Ver instrucciones para instalar en iOS'
              : 'Instala EaseTrain en tu dispositivo para un acceso más rápido'
          }
          tooltipOptions={{ position: 'top' }}
        />
        <p className="p-mt-2 p-text-sm p-text-color-secondary">
          {isIOS
            ? 'Toca para ver cómo instalar en iPhone/iPad'
            : 'Instala la app para un acceso más rápido y funcionalidad offline'}
        </p>
      </div>

      {renderIOSInstructionsDialog()}
    </div>
  );
};

export default PWAInstallButton;

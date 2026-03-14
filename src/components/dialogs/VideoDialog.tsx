import { Dialog } from 'primereact/dialog';
import { useIntl } from 'react-intl';

interface IVideoDialogProps {
  visible: boolean;
  onHide: () => void;
  videoUrl: string;
}

const VideoDialog = ({ visible, onHide, videoUrl }: IVideoDialogProps) => {
  const intl = useIntl();

  return (
    <Dialog
      header={
        <div className="flex align-items-center gap-2">
          <i className="pi pi-play-circle" style={{ color: '#6366f1', fontSize: '1rem' }} />
          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>
            {intl.formatMessage({ id: 'exercise.video.view' })}
          </span>
        </div>
      }
      visible={visible}
      style={{ width: 'min(90vw, 720px)', borderRadius: 'var(--ios-radius-xl)' }}
      onHide={onHide}
      dismissableMask
      draggable={false}
      resizable={false}
    >
      <div style={{ borderRadius: 'var(--ios-radius-md)', overflow: 'hidden' }}>
        <iframe
          width="100%"
          height="0"
          style={{ aspectRatio: '16/9', height: 'auto', border: 'none', display: 'block' }}
          src={videoUrl}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Exercise Video"
        />
      </div>
    </Dialog>
  );
};

export default VideoDialog;

import { Dialog } from 'primereact/dialog';
import ReactPlayer from 'react-player';

interface IMediaDialogProps {
  visible: boolean;
  onHide: () => void;
  mediaUrl: string | null;
  mediaType: string | null;
}

const MediaDialog = ({ visible, onHide, mediaUrl, mediaType }: IMediaDialogProps) => {
  if (!mediaType || !mediaUrl) {
    return null;
  }

  return (
    <Dialog
      draggable={false}
      resizable={false}
      dismissableMask
      header="Media Viewer"
      className="responsive-dialog"
      visible={visible}
      style={{ width: '50vw', height: '100vh' }}
      onHide={onHide}
    >
      {mediaType.startsWith('image/') ? (
        <img src={mediaUrl} alt="media" style={{ width: '100%', height: '100%' }} />
      ) : (
        <ReactPlayer url={mediaUrl} controls width="100%" height="100%" />
      )}
    </Dialog>
  );
};

export default MediaDialog;

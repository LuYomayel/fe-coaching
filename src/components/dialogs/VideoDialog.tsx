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
      header={intl.formatMessage({ id: 'exercise.video.view' })}
      visible={visible}
      style={{ width: '70vw' }}
      onHide={onHide}
      dismissableMask
      draggable={false}
      resizable={false}
      className="responsive-dialog"
    >
      <iframe
        width="100%"
        height="400"
        src={videoUrl}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Exercise Video"
      />
    </Dialog>
  );
};

export default VideoDialog;

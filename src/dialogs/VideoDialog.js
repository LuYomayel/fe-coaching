import React from 'react';
import { Dialog } from 'primereact/dialog';

const VideoDialog = ({ visible, onHide, videoUrl }) => {
  return (
    <Dialog header="Video" visible={visible} style={{ width: '50vw' }} onHide={onHide}>
      <iframe
        width="100%"
        height="400px"
        src={videoUrl}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Video"
      />
    </Dialog>
  );
};

export default VideoDialog;
import React from 'react';
import { Dialog } from 'primereact/dialog';
import ReactPlayer from 'react-player';
const MediaDialog = ({ visible, onHide, mediaUrl, mediaType }) => {
  if (!mediaType || !mediaUrl) {
    return null; // No renderizar nada si no están disponibles
  }

  return (
    <Dialog draggable={false} resizable={false} header="Media Viewer" className="responsive-dialog" visible={visible} style={{ width: '50vw', height: '100vh' }} onHide={onHide}>
      {mediaType.startsWith('image/') ? (
        <img src={mediaUrl} alt="media" style={{ width: '100%', height: '100%' }} />
      ) : (
        <ReactPlayer url={mediaUrl} controls width='100%' height={'100%'} />
      )}
    </Dialog>
  );
};

export default MediaDialog;
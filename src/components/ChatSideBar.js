import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { ListBox } from 'primereact/listbox';
import { Card } from 'primereact/card';
import { Avatar } from 'primereact/avatar';
import { FileUpload } from 'primereact/fileupload';
import { ProgressBar } from 'primereact/progressbar';
import { Message } from 'primereact/message';
import { UserContext } from '../utils/UserContext';
import io from 'socket.io-client';
import { fetchMessages, fetchCoachStudents, markMessagesAsRead } from '../services/usersService';
import { Dialog } from 'primereact/dialog';
import ReactPlayer from 'react-player';
import { useChatSidebar } from '../utils/ChatSideBarContext';
import '../styles/ChatSidebar.css';

const apiUrl = process.env.REACT_APP_API_URL;
const MAX_FILE_SIZE = 1000000000; // 1GB

export default function ChatSidebar({ isCoach }) {
  const { selectedChat, setSelectedChat } = useChatSidebar();
  const { user, coach, client } = useContext(UserContext);
  const { setUnreadMessages } = useChatSidebar();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [clients, setClients] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [dialogContent, setDialogContent] = useState(null);

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messageListRef = useRef(null);

  // Inicializar socket
  useEffect(() => {
    const newSocket = io(apiUrl, {
      auth: { token: localStorage.getItem('token') },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    setSocket(newSocket);

    newSocket.on('connect', () => setIsConnected(true));
    newSocket.on('disconnect', () => setIsConnected(false));
    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
      setErrorMessage('Error de conexión. Intentando reconectar...');
    });

    return () => newSocket.disconnect();
  }, []);

  // Manejar mensajes entrantes
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      if (selectedChat && message.sender.id === selectedChat.user.id) {
        setMessages((prevMessages) => [message, ...prevMessages]);
        markMessagesAsRead(selectedChat.user.id, user.userId);
      } else {
        setUnreadMessages((prev) => prev + 1);
      }
    };

    socket.on('receiveMessage', handleNewMessage);

    return () => socket.off('receiveMessage', handleNewMessage);
  }, [selectedChat, socket, user.userId, setUnreadMessages]);

  // Cargar clientes (solo para coaches)
  useEffect(() => {
    const loadClients = async () => {
      if (!isCoach || !coach) return;

      try {
        setLoading(true);
        const clientsData = await fetchCoachStudents(coach.user.id);
        setClients(clientsData);
      } catch (error) {
        console.error('Error loading clients:', error);
        setErrorMessage('Error al cargar los clientes');
      } finally {
        setLoading(false);
      }
    };

    loadClients();
  }, [isCoach, coach]);

  // Auto-seleccionar chat para clientes
  useEffect(() => {
    if (!isCoach && client?.coach) {
      setSelectedChat(client.coach);
    }
  }, [isCoach, client, setSelectedChat]);

  // Cargar mensajes del chat seleccionado
  const loadMessages = useCallback(
    async (userId, chatUserId) => {
      try {
        setLoading(true);
        const fetchedMessages = await fetchMessages(userId, chatUserId);
        const sortedMessages = fetchedMessages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        setMessages(sortedMessages);

        if (sortedMessages.length > 0) {
          const unreadCount = sortedMessages.filter((message) => !message.isRead).length;
          setUnreadMessages((prev) => prev - unreadCount);
          await markMessagesAsRead(chatUserId, userId);
        }
      } catch (error) {
        console.error('Error loading messages:', error);
        setErrorMessage('Error al cargar los mensajes');
      } finally {
        setLoading(false);
      }
    },
    [setUnreadMessages]
  );

  useEffect(() => {
    if (selectedChat && user) {
      loadMessages(user.userId, selectedChat.user.id);
    }
  }, [selectedChat, user, loadMessages]);

  const handleSelectChat = (clientSelected) => {
    setSelectedChat(clientSelected);
    setMessages([]);
    setErrorMessage(null);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !selectedFile) return;

    try {
      setLoading(true);
      let fileUrl = null;
      let fileType = null;

      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);

        const response = await fetch(`${apiUrl}/upload`, {
          method: 'POST',
          body: formData,
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }).catch((error) => {
          throw new Error(`Error en la carga: ${error.message}`);
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error al subir el archivo');
        }

        const data = await response.json();
        fileUrl = data.url;
        fileType = data.mimeType;
      }

      const newMsg = {
        senderId: user.userId,
        receiverId: selectedChat.user.id,
        content: newMessage,
        timestamp: new Date().toISOString(),
        fileUrl,
        fileType
      };

      socket.emit('sendMessage', newMsg);
      setMessages((prev) => [newMsg, ...prev]);
      setNewMessage('');
      clearFileSelection();
      setLoading(false);
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      setErrorMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/quicktime'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage('Formato de archivo no soportado. Use JPG, PNG, GIF o MP4.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage(`El archivo excede el límite de ${MAX_FILE_SIZE / 1000000}MB`);
      return;
    }

    setSelectedFile(file);
    setFilePreview(URL.createObjectURL(file));
    setErrorMessage(null);
  };

  const clearFileSelection = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.clear();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="chat-sidebar">
      <div className="flex justify-content-between align-items-center mb-3">
        <h2 className="text-xl font-bold">Chat</h2>
        {errorMessage && <Message severity="error" text={errorMessage} className="mb-2" />}
      </div>

      {isCoach && !selectedChat && (
        <div className="clients-list">
          <h3 className="text-lg font-semibold mb-2">Tus Clientes</h3>
          {loading ? (
            <ProgressBar mode="indeterminate" style={{ height: '6px' }} />
          ) : (
            <ListBox
              options={clients}
              optionLabel="name"
              onChange={(e) => handleSelectChat(e.value)}
              itemTemplate={(option) => (
                <div className="flex align-items-center p-2">
                  <Avatar
                    image={`/images/${option.photo}`}
                    shape="circle"
                    className="mr-2"
                    onError={(e) => (e.target.src = '/images/default-avatar.png')}
                  />
                  <span>{option.name}</span>
                </div>
              )}
            />
          )}
        </div>
      )}

      {selectedChat && (
        <div className="chat-window">
          <div className="chat-header">
            {isCoach && (
              <Button icon="pi pi-arrow-left" onClick={() => setSelectedChat(null)} className="p-button-text mr-2" />
            )}
            <Avatar
              image={`/images/${selectedChat.photo}`}
              shape="circle"
              className="mr-2"
              onError={(e) => (e.target.src = '/images/default-avatar.png')}
            />
            <h3 className="text-lg font-semibold">{selectedChat.name}</h3>
          </div>

          <div className="messages-list" ref={messageListRef}>
            {loading ? (
              <ProgressBar mode="indeterminate" style={{ height: '6px' }} />
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`message ${msg.sender?.id === user.userId || msg.senderId === user.userId ? 'sent' : 'received'}`}
                >
                  {msg.fileUrl && (
                    <div
                      className="message-attachment"
                      onClick={() =>
                        setDialogContent({
                          fileUrl: msg.fileUrl,
                          fileType: msg.fileType
                        })
                      }
                    >
                      {msg.fileType?.includes('video') ? (
                        <ReactPlayer url={msg.fileUrl} controls width="100%" height="200px" />
                      ) : (
                        <img src={msg.fileUrl} alt="attachment" className="message-image" />
                      )}
                    </div>
                  )}
                  {msg.content && <p className="message-content">{msg.content}</p>}
                  <small className="message-time">{new Date(msg.timestamp).toLocaleTimeString()}</small>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input">
            {filePreview && (
              <div className="file-preview">
                {selectedFile?.type.startsWith('image/') ? (
                  <img src={filePreview} alt="preview" />
                ) : (
                  <ReactPlayer url={filePreview} controls width="100%" height="150px" style={{ maxHeight: '150px' }} />
                )}
                <Button
                  icon="pi pi-times"
                  onClick={clearFileSelection}
                  className="remove-file-button p-button-rounded p-button-danger p-button-text"
                />
              </div>
            )}

            <div className="input-group">
              <InputText
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe un mensaje..."
                disabled={!isConnected || loading}
              />
              <FileUpload
                mode="basic"
                name="file"
                accept="image/*,video/*"
                maxFileSize={MAX_FILE_SIZE}
                customUpload
                uploadHandler={handleFileSelect}
                ref={fileInputRef}
                auto
                chooseOptions={{
                  icon: 'pi pi-paperclip',
                  iconOnly: true,
                  disabled: !isConnected || loading
                }}
                className="p-button-outlined"
              />
              <Button
                icon="pi pi-send"
                onClick={handleSendMessage}
                disabled={(!newMessage.trim() && !selectedFile) || !isConnected || loading}
              />
            </div>
          </div>
        </div>
      )}

      <Dialog
        visible={!!dialogContent}
        onHide={() => setDialogContent(null)}
        header="Archivo adjunto"
        maximizable
        className="media-dialog"
      >
        {dialogContent?.fileType?.includes('video') ? (
          <ReactPlayer url={dialogContent?.fileUrl} controls width="100%" height="100%" />
        ) : (
          <img src={dialogContent?.fileUrl} alt="attachment" className="dialog-image" />
        )}
      </Dialog>
    </Card>
  );
}

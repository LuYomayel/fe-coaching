import React, { useState, useEffect, useContext, useRef } from 'react';
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
import { fetchMessages, fetchCoachStudents } from '../services/usersService'; // Actualiza la función si es necesario
import { Dialog } from 'primereact/dialog';
import ReactPlayer from 'react-player';
import { useChatSidebar } from '../utils/ChatSideBarContext';

const apiUrl = process.env.REACT_APP_API_URL;

export default function ChatSidebar({ isCoach, openChatWithUserId, onClose }) {
  const { isChatOpen, closeChatSidebar, selectedChat, setSelectedChat } = useChatSidebar();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [clients, setClients] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false); // Estado de conexión del socket
  const [errorMessage, setErrorMessage] = useState(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogContent, setDialogContent] = useState(null);

  const { user, coach, client } = useContext(UserContext); // Contexto para obtener la información del usuario

  useEffect(() => {
    // Establecer conexión con el socket
    const newSocket = io(apiUrl, {
      auth: { token: localStorage.getItem('token') }
    });
    setSocket(newSocket);

    // Manejar conexión y desconexión
    newSocket.on('connect', () => setIsConnected(true));
    newSocket.on('disconnect', () => setIsConnected(false));

    // Recibir nuevos mensajes
    newSocket.on('receiveMessage', (message) => {
      if (selectedChat && message.sender.id === selectedChat.user.id) {
        setMessages((prevMessages) => [...prevMessages, message]);
      }
    });

    return () => newSocket.disconnect();
  }, [selectedChat]);

    // Efecto para cargar la lista de clientes cuando el usuario es un coach
    useEffect(() => {
        const fetchClients = async () => {
          if (isCoach && coach) {
              try {
                const clientsData = await fetchCoachStudents(coach.user.id); // Obtener lista de clientes del servicio
                setClients(clientsData); // Guardar clientes en el estado
              } catch (error) {
                console.error('Error fetching clients:', error);
              }
          } else if(!isCoach) {

              setSelectedChat(client.coach)
          }
        };
    
        fetchClients();
    }, [isCoach, coach]);

    const fetchMessagesFunc = async (userId, clientId) => {
        try {
            const messages = await fetchMessages(userId, clientId);
            return messages
        } catch (error) {
            console.error('Error fetching messages:', error);
            throw error;
        }
    };

    useEffect(() => {
        // Cargar los mensajes previos al seleccionar un chat
        const fetch = async () => {
          
            if (selectedChat) {
                const messages = await fetchMessagesFunc(user.userId, selectedChat.user.id);
                setMessages(messages);
            }
            console.log('Messages:');
        };
        fetch();
    }, [selectedChat]);


    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSelectChat = async (clientSelected) => {
      console.log('Client selected:', clientSelected);
        setSelectedChat(clientSelected); // Al seleccionar el cliente, se abre el chat
        setMessages([]); // Reiniciar mensajes al cambiar de chat
        const messages = await fetchMessagesFunc(user.userId, clientSelected.user.id)
        setMessages(messages);
    };

  const handleSendMessage = async () => {
    if (newMessage.trim() || selectedFile) {
      const newMsg = {
        senderId: user.userId,
        receiverId: selectedChat.user.id,
        content: newMessage,
        timestamp: new Date().toISOString(),
        fileUrl: selectedFile ? URL.createObjectURL(selectedFile) : null,
      };

      try {
        if (selectedFile) {
          // Lógica para subir el archivo al backend
          const formData = new FormData();
          formData.append('file', selectedFile);
          const response = await fetch(`${apiUrl}/upload`, { method: 'POST', body: formData });
          const data = await response.json();
          newMsg.fileUrl = data.url;
          newMsg.fileType = data.mimeType;
        }

        // Enviar el mensaje a través del socket
        socket.emit('sendMessage', newMsg);
        setMessages([...messages, newMsg]);
        setNewMessage("");
        setSelectedFile(null);
        setFilePreview(null);
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  };

  const handleFileSelect = (event) => {
    const file = event.files[0];
    setSelectedFile(file);
    setLoading(true);

    if (file && (file.type.startsWith('image/') || file.type.startsWith('video/'))) {
      const fileUrl = URL.createObjectURL(file);
      setFilePreview(fileUrl);
      setErrorMessage(null);
    } else {
      setErrorMessage('Please upload a valid image or video file.');
      setFilePreview(null);
    }

    setLoading(false);
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.clear();
  };

  const handleOpenDialog = (fileUrl, fileType) => {
    setDialogVisible(true);
    console.log('Message:', fileUrl, fileType);
    setDialogContent({ fileUrl, fileType });
  }

  const handleCloseDialog = () => {
    setDialogVisible(false);
    setDialogContent(null);
  }


  return (
    <Card className="chat-sidebar" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="flex justify-content-between align-items-center mb-3">
        <h2 className="text-xl font-bold">Chat</h2>
        <Button icon="pi pi-times" onClick={onClose} className="p-button-rounded p-button-text" />
      </div>
      
      {isCoach && !selectedChat && (
        <div>
            <h3 className="text-lg font-semibold mb-2">Your Clients</h3>
            <ListBox 
            options={clients} 
            optionLabel="name" 
            onChange={(e) => handleSelectChat(e.value)} 
            itemTemplate={(option) => (
                <div className="flex align-items-center p-2">
                <Avatar image={`/images/${option.photo}`} shape="circle" className="mr-2" />
                <span>{option.name}</span>
                </div>
            )}
            />
        </div>
        )}

      {selectedChat && (
        <div className="chat-window" style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
          <div className="flex align-items-center mb-3">
            {isCoach && (
              <Button icon="pi pi-arrow-left" onClick={() => setSelectedChat(null)} className="p-button-text mr-2" />
            )}
            <Avatar image={`/images/${selectedChat.photo}`} shape="circle" className="mr-2" />
            <h3 className="text-lg font-semibold">{selectedChat.name}</h3>
          </div>

          <div className="messages-list" style={{ flexGrow: 1, overflowY: 'auto' }}>
            {messages.map((msg) => (
              <div key={msg.id} className={`message ${msg.sender?.id === user.userId || msg.senderId === user.userId ? 'sent' : 'received'} mb-2`}>
                {msg.fileUrl && (
                  <div className="mb-2" onClick={() => handleOpenDialog(msg.fileUrl, msg.fileType)}>
                    {msg.fileUrl.includes('video') ? (
                      <ReactPlayer url={msg.fileUrl} controls className="max-w-full h-auto" />
                    ) : (
                      <img src={msg.fileUrl} alt="attachment" className="max-w-full h-auto cursor-pointer" />
                    )}
                  </div>
                )}
                <p className={`p-2 rounded-lg ${msg.sender?.id === user.userId || msg.senderId === user.userId ? 'bg-primary text-white' : 'bg-surface-200'}`}>
                  {msg.content}
                </p>
                <small className="text-color-secondary">{new Date(msg.timestamp).toLocaleTimeString()}</small>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="mt-3">
            {filePreview && (
              <div className="file-preview relative mb-2">
                {selectedFile.type.startsWith('image/') ? (
                  <img src={filePreview} alt="preview" className="max-w-full h-auto" />
                ) : (
                  <ReactPlayer url={filePreview} controls className="max-w-full h-auto" />
                )}
                <Button icon="pi pi-times" onClick={removeSelectedFile} className="p-button-rounded p-button-danger p-button-text absolute top-0 right-0" />
              </div>
            )}

            {errorMessage && <Message severity="error" text={errorMessage} className="mb-2" />}

            <div className="p-inputgroup">
              <InputText value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." />
              <FileUpload 
                mode="basic"
                name="file" 
                accept="image/*,video/*" 
                maxFileSize={1000000000}
                customUpload
                uploadHandler={handleFileSelect}
                auto
                chooseOptions={{ icon: 'pi pi-paperclip', iconOnly: true }}
                className="p-button-outlined"
              />
              <Button icon="pi pi-send" onClick={handleSendMessage} disabled={loading} />
            </div>

            {loading && <ProgressBar mode="indeterminate" style={{ height: '6px' }} className="mt-2" />}
          </div>
        </div>
      )}

      {/* Dialog to display image/video */}
      <Dialog header="Attachment" visible={dialogVisible} style={{ width: '50vw' }} onHide={handleCloseDialog}>
        {dialogContent && (
          <>
            {dialogContent.fileType.includes('video') ? (
              <ReactPlayer url={dialogContent.fileUrl} controls className="w-full h-auto" />
            ) : (
              <img src={dialogContent.fileUrl} alt="attachment" className="w-full h-auto" />
            )}
          </>
        )}
      </Dialog>

    </Card>
  );
}
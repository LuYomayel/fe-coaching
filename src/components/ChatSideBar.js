import React, { useState, useEffect, useContext, useRef } from 'react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { ListBox } from 'primereact/listbox';
import io from 'socket.io-client';
import { fetchCoachStudents, fetchMessages } from '../services/usersService';
import { UserContext } from '../utils/UserContext';
import { FileUpload } from 'primereact/fileupload';
import '../styles/ChatSidebar.css';
import MediaDialog from '../dialogs/MediaDialog';
import { ProgressSpinner } from 'primereact/progressspinner';
import { ProgressBar } from 'primereact/progressbar';
import { Message } from 'primereact/message';
import { useToast } from '../utils/ToastContext';
import ReactPlayer from 'react-player';
const apiUrl = process.env.REACT_APP_API_URL;

const ChatSidebar = () => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [selectedChat, setSelectedChat] = useState(null);
    const [clientsList, setClientsList] = useState([]);
    const { user, coach, client } = useContext(UserContext);
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false); // Estado de conexión del socket
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [mediaDialogVisible, setMediaDialogVisible] = useState(false);
    const [selectedMediaUrl, setSelectedMediaUrl] = useState(null);
    const [selectedMediaType, setSelectedMediaType] = useState(null);
    
    const fileInputRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [maxScroll, setMaxScroll] = useState(0);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [page, setPage] = useState(1);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);

    const { showToast } = useToast();

    useEffect(() => {
        // Obtener el token JWT desde el almacenamiento
        const token = localStorage.getItem('token');

        // Crear la conexión del socket
        const newSocket = io(apiUrl, {
            auth: {
                token: token
            }
        });
        // Guardar la instancia del socket en el estado
        setSocket(newSocket);
        // console.log('Socket created', newSocket);
        // Limpiar la conexión cuando el componente se desmonte
        return () => {
            if (newSocket) newSocket.disconnect();
        };
    }, []);
    
    useEffect(() => {
        if (socket) {
            console.log('Socket connected:', socket.connected);
            // Escuchar el evento de conexión
            socket.on('connect', () => {
                if(user.userType === 'client')handleSelectChat(client);
                // console.log('Socket connected');
                setIsConnected(true);
            });

            // Escuchar el evento de desconexión
            socket.on('disconnect', () => {
                // console.log('Socket disconnected');
                setIsConnected(false);
            });

            // Escuchar mensajes entrantes
            socket.on('receiveMessage', (message) => {
                if (
                    (message.sender.id === selectedChat.sender.userId && message.receiver.id === selectedChat.receiver.user.id) ||
                    (message.sender.id === selectedChat.receiver.user.id && message.receiver.id === selectedChat.sender.userId)
                ) {
                    console.log('Received message:', message);  
                    setMessages((prevMessages) => [message, ...prevMessages]);
                }
            });

            // Limpiar los eventos cuando se desmonte el componente
            return () => {
                socket.off('connect');
                socket.off('disconnect');
                socket.off('receiveMessage');
            };
        }
    }, [socket, selectedChat]);

    useEffect(() => {
        // Obtener la lista de clientes
        const fetchClients = async () => {
            if (coach) {
                const clients = await fetchCoachStudents(coach.user.id);
                setClientsList(clients);
            }
        };
        fetchClients();
    }, [coach]);

    const handleMediaClick = (url, type) => {
        setSelectedMediaUrl(url);
        setSelectedMediaType(type); // Aquí capturamos el tipo MIME correcto del archivo
        setMediaDialogVisible(true);
    };

    const handleFileSelect = (event) => {
        const file = event.files[0];
        setSelectedFile(file);
        setLoading(true);
    
        if (file && file.type.startsWith('video/')) {
            console.log('Selected video file:', file.name);
            const fileUrl = URL.createObjectURL(file);
            setFilePreview(fileUrl);
            setErrorMessage(null);
            setLoading(false);
        } else if (file && file.type.startsWith('image/')) {
            console.log('Selected image file:', file.name);
            const fileUrl = URL.createObjectURL(file);
            setFilePreview(fileUrl);
            setErrorMessage(null);
            setLoading(false);
        } else {
            console.error('Invalid file type:', file.type);
            setErrorMessage('Please upload a valid video or image file.');
            setFilePreview(null);
            setLoading(false);
        }
    };

    const removeSelectedFile = () => {
        setSelectedFile(null);
        setFilePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.clear();
        }
    };

    const sendMessage = async () => {        
        if (selectedChat && (newMessage.trim() || selectedFile) && socket) {
            const messageData = {
                senderId: selectedChat.sender.userId,
                receiverId: selectedChat.receiver.user.id,
                content: newMessage,
            };
        
            try {
                if (selectedFile) {
                    setLoading(true);
                    const formData = new FormData();
                    formData.append('file', selectedFile);
                    
                    // Subir el archivo al backend
                    const response = await fetch(`${apiUrl}/upload`, {
                        method: 'POST',
                        body: formData,
                    });
        
                    const data = await response.json();
                    messageData.fileUrl = data.url;
                    messageData.fileType = data.mimeType;
                }
    
                // Luego, enviar el mensaje con la URL del archivo si existe
                socket.emit('sendMessage', messageData);
    
                // Resetear el estado después de enviar el mensaje
                setNewMessage("");
                setSelectedFile(null);
                setFilePreview(null);

            } catch (error) {
                console.error('Error uploading file:', error);
            } finally {
                setLoading(false);
            }
        }
    };

    const fetchChatMessagesClient = async (senderId, receiverId) => {
        try {
            console.log('Page:', page); 
            setIsLoadingMessages(true);
            const chatMessages = await fetchMessages(senderId, receiverId, page);
            setMessages(prevMessages => [...prevMessages, ...chatMessages])
        } catch (error) {
            console.error('Error loading chat messages:', error);
        } finally {
            setIsLoadingMessages(false);
        }

    };

    const handleSelectChat = (receiver) => {
        const chat = {
            sender: user,
            receiver: receiver.userType === 'client' ? receiver : user.userType === 'client' ? client.coach : receiver,
        };
        setSelectedChat(chat);
        setIsInitialLoad(true);
        setMessages([]); // Reiniciar los mensajes al cambiar de chat
        setPage(1);
        fetchChatMessagesClient(chat.sender.userId, chat.receiver.user.id);
    };

    const handleBackToList = () => {
        setSelectedChat(null);
        setMessages([]);
        setIsInitialLoad(true);
        setPage(1);
    };

    const handleScroll = async (e) => {
        if (e.target.scrollTop <= maxScroll && messages.length >= page*20) { // Detecta si se alcanza la parte superior
            setPage(now => now + 1);
            await fetchChatMessagesClient(selectedChat.sender.userId, selectedChat.receiver.user.id); // Función para obtener más mensajes antiguos
        }
    };

    const handleOnUploadError = (event) => {
        console.error('Error uploading file:', event);
        showToast('error', 'Error', 'Error uploading file. Please try again.');
    };
    
    const handleUpload = () => {
        setLoading(true);
        console.log('Uploading file...');
    };
    useEffect(() => {
        const messagesContainer = document.querySelector('.messages-list');
        if (messagesContainer) {
            if (isLoadingMessages) {
                messagesContainer.removeEventListener('scroll', handleScroll); // Desactiva el scroll
            } else {
                messagesContainer.addEventListener('scroll', handleScroll); // Vuelve a activarlo
            }
        }
        return () => {
            if (messagesContainer) {
                messagesContainer.removeEventListener('scroll', handleScroll); // Limpia el event listener
            }
        };
    }, [isLoadingMessages, messages]);

    useEffect(() => {
        const messagesEnd = document.querySelector('.messages-list');
        if (messagesEnd) {
            if (isInitialLoad) {
                messagesEnd.scrollTop = messagesEnd.scrollHeight;
                setIsInitialLoad(false);
            }
            setMaxScroll(-1 * (messagesEnd.scrollHeight - messagesEnd.clientHeight -20));
        }
    }, [messages]); // Desplaza al último mensaje cada vez que los mensajes cambien

    return (
        <div>
            {!isConnected && (
                <div>
                    <p style={{ color: 'red' }}>Chat is currently unavailable. Please check your connection.</p>
                </div>
            )}

            {isConnected && coach && !selectedChat && (
                <div>
                    <h3>Your Clients</h3>
                    <ListBox 
                        options={clientsList} 
                        optionLabel="name" 
                        onChange={(e) => handleSelectChat(e.value)} 
                        style={{ width: '100%' }} 
                    />
                </div>
            )}
            {isConnected && coach && selectedChat && (
                <div className="chat-window">
                    <div className='flex justify-content-between align-content-center'>
                        <Button icon="pi pi-arrow-left" text onClick={handleBackToList} className="p-mb-3" />
                        <h3>{selectedChat.receiver.name}</h3>
                        <div>
                        </div>
                    </div>
                    <div className="messages-list flex-grow-1">
                        {messages.map((msg, index) => (
                            <div key={index} className={`message ${msg.sender.id === user.userId ? 'sent' : 'received'}`}>
                                 {msg.fileUrl ? (
                                    msg.fileType.startsWith('video') ? (
                                        <div>
                                            <ReactPlayer url={msg.fileUrl} controls width='100%' height='100%' onClick={() => handleMediaClick(msg.fileUrl, msg.fileType)} />
                                            {/* <video controls className="p-fluid p-shadow-2" style={{ maxHeight: '200px' }} onClick={() => handleMediaClick(msg.fileUrl, msg.fileType)}>
                                                <source src={msg.fileUrl} type={msg.fileType} />
                                            </video> */}
                                            <p>{msg.content}</p>
                                        </div>
                                    ) : (
                                        <div>
                                            <img src={msg.fileUrl} alt="attachment" className="p-fluid p-shadow-2" style={{ maxHeight: '200px' }} onClick={() => handleMediaClick(msg.fileUrl, msg.fileType)}/>
                                            <p>{msg.content}</p>
                                        </div>
                                    )
                                    
                                ) : (
                                    <p>{msg.content}</p>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className='input-preview-container' style={{position: 'relative'}}> 
                        {/* Mostrar vista previa del archivo */}
                        {filePreview && (
                            <div className="file-preview" style={{ position: 'relative', marginBottom: '0.25rem' }}>
                                {selectedFile.type.startsWith('image/') ? (
                                    <img src={filePreview} alt="preview" className="p-fluid p-shadow-2" style={{ maxHeight: '200px' }} />
                                ) : (
                                    <ReactPlayer url={filePreview} controls width='100%' max-height='200px' onClick={() => handleMediaClick(filePreview, selectedFile.type)} />
                                )}
                                <Button icon='pi pi-times' onClick={removeSelectedFile} className="p-button-danger p-button-sm" size='small' rounded text style={{ position: 'absolute', top: '2px', right: '2px', zIndex: 1 }} />
                            </div>
                        )}

                        <div className='p-inputgroup input-container'>
                            {errorMessage && <Message severity="error" text={errorMessage} />}
                            <InputText value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
                            <FileUpload 
                                mode='basic'
                                name="file" 
                                accept="image/*,video/*" 
                                customUpload
                                auto
                                ref={fileInputRef}
                                uploadHandler={handleFileSelect}
                                className='mr-1 ml-1'
                                headerClassName='custom-file-upload'
                                chooseOptions={{ icon: 'pi pi-paperclip', iconOnly: true }}
                                onError={handleOnUploadError}
                                maxFileSize={10000000000} 
                                disabled={loading}
                            />
                            <Button icon='pi pi-send' iconOnly text outlined onClick={sendMessage} />

                            {/* Mostrar indicador de carga si se está subiendo */}
                            {loading && (
                                <div className="loading-bar">
                                    <ProgressBar mode='indeterminate'/>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {isConnected && client && selectedChat && (
                <div className="chat-window">
                <h3>{selectedChat.receiver.name}</h3>
                <div className="messages-list flex-grow-1">
                    {messages.map((msg, index) => (
                        <div key={index} className={`message ${msg.sender.id === user.userId ? 'sent' : 'received'}`}>
                            {msg.fileUrl ? (
                                msg.fileType.startsWith('video') ? (
                                    <div>
                                        <ReactPlayer url={msg.fileUrl} controls width='100%' height='100%' onClick={() => handleMediaClick(msg.fileUrl, msg.fileType)} />
                                        <p>{msg.content}</p>
                                    </div>
                                ) : (
                                    <div>
                                        <img src={msg.fileUrl} alt="attachment" className="p-fluid p-shadow-2" style={{ maxHeight: '200px' }} onClick={() => handleMediaClick(msg.fileUrl, msg.fileType)}/>
                                        <p>{msg.content}</p>
                                    </div>
                                )
                                
                            ) : (
                                <p>{msg.content}</p>
                            )}
                        </div>
                    ))}
                </div>

                {/* Mostrar vista previa del archivo */}
                {filePreview && (
                    <div className="file-preview" style={{ position: 'relative', marginBottom: '0.25rem' }}>
                        {selectedFile.type.startsWith('image/') ? (
                            <img src={filePreview} alt="preview" className="p-fluid p-shadow-2" style={{ maxHeight: '200px' }} />
                        ) : (
                            <ReactPlayer url={filePreview} controls width='100%' max-height='200px' onClick={() => handleMediaClick(filePreview, selectedFile.type)} />
                        )}
                        <Button icon='pi pi-times' onClick={removeSelectedFile} className="p-button-danger p-button-sm" size='small' rounded text style={{ position: 'absolute', top: '2px', right: '2px', zIndex: 1 }} />
                    </div>
                )}

                <div className='input-preview-container' style={{position: 'relative'}}> 

                    <div className='p-inputgroup input-container'>
                        <InputText value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
                        <FileUpload 
                            mode='basic'
                            name="file" 
                            ref={fileInputRef}
                            accept="image/*,video/*" 
                            customUpload
                            auto
                            uploadHandler={handleFileSelect}
                            onUpload={handleUpload}
                            className='mr-1 ml-1'
                            headerClassName='custom-file-upload'
                            chooseOptions={{ icon: 'pi pi-paperclip', iconOnly: true }}
                            onError={handleOnUploadError}
                            maxFileSize={10000000000} 
                            disabled={loading}
                        />
                        <Button icon='pi pi-send' iconOnly text outlined onClick={sendMessage} disabled={loading} />

                        {/* Mostrar indicador de carga si se está subiendo */}
                        {loading && (
                            <div className="loading-bar">
                                <ProgressBar mode='indeterminate'/>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            )}
            <MediaDialog visible={mediaDialogVisible} onHide={() => setMediaDialogVisible(false)} mediaUrl={selectedMediaUrl} mediaType={selectedMediaType} />
        </div>
    
    );
};

export default ChatSidebar;
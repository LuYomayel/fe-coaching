import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';

const apiUrl = process.env.REACT_APP_API_URL;
const socket = io(apiUrl);
const Messaging = ({ currentUser, selectedUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    // Escuchar mensajes entrantes
    socket.on('receiveMessage', (message) => {
      setMessages(prevMessages => [...prevMessages, message]);
    });

    // Cleanup al desmontar el componente
    return () => {
      socket.off('receiveMessage');
    };
  }, []);

  const sendMessage = () => {
    socket.emit('sendMessage', {
      senderId: currentUser.id,
      receiverId: selectedUser.id,
      content: newMessage,
    });
    setNewMessage("");
  };

  return (
    <div>
      <div className="messages-list">
        {messages.map(msg => (
          <div key={msg.id} className={`message ${msg.sender.id === currentUser.id ? 'sent' : 'received'}`}>
            <p>{msg.content}</p>
          </div>
        ))}
      </div>
      <InputText value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
      <Button label="Send" onClick={sendMessage} />
    </div>
  );
};

export default Messaging;
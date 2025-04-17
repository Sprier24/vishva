import { useState, useRef, useEffect } from 'react';
import Message from './Message';
import InputArea from './InputArea';
import styles from '../styles/Home.module.css';

export default function ChatWindow({ chat, messages, setMessages }) {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim() === '') return;
    
    const newMsg = {
      id: messages.length + 1,
      text: newMessage,
      sender: 'me',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    
    setMessages([...messages, newMsg]);
    setNewMessage('');
  };

  return (
    <div className={styles.chatWindow}>
      <div className={styles.chatHeader}>
        <div className={styles.chatProfile}>
          <img src={chat.avatar} alt={chat.name} />
          <div>
            <h3>{chat.name}</h3>
            <p>Online</p>
          </div>
        </div>
        <div className={styles.chatActions}>
          <button className={styles.actionButton}>
            <i className="fas fa-search"></i>
          </button>
          <button className={styles.actionButton}>
            <i className="fas fa-ellipsis-v"></i>
          </button>
        </div>
      </div>
      
      <div className={styles.messagesContainer}>
        <div className={styles.messages}>
          {messages.map(message => (
            <Message key={message.id} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      <InputArea 
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        handleSendMessage={handleSendMessage}
      />
    </div>
  );
}
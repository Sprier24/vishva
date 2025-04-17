import styles from '../styles/Home.module.css';

export default function ChatList({ chats, currentChat, setCurrentChat }) {
  return (
    <div className={styles.chatList}>
      {chats.map(chat => (
        <div 
          key={chat.id} 
          className={`${styles.chatItem} ${currentChat?.id === chat.id ? styles.active : ''}`}
          onClick={() => setCurrentChat(chat)}
        >
          <div className={styles.chatAvatar}>
            <img src={chat.avatar} alt={chat.name} />
            {chat.unread > 0 && <span className={styles.unreadBadge}>{chat.unread}</span>}
          </div>
          <div className={styles.chatInfo}>
            <div className={styles.chatName}>{chat.name}</div>
            <div className={styles.chatPreview}>{chat.lastMessage}</div>
          </div>
          <div className={styles.chatTime}>{chat.time}</div>
        </div>
      ))}
    </div>
  );
}
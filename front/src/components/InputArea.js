import styles from '../styles/Home.module.css';

export default function InputArea({ newMessage, setNewMessage, handleSendMessage }) {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={styles.inputArea}>
      <div className={styles.inputActions}>
        <button className={styles.actionButton}>
          <i className="far fa-smile"></i>
        </button>
        <button className={styles.actionButton}>
          <i className="fas fa-paperclip"></i>
        </button>
      </div>
      <input
        type="text"
        placeholder="Type a message"
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        onKeyPress={handleKeyPress}
      />
      <button 
        className={styles.sendButton}
        onClick={handleSendMessage}
        disabled={!newMessage.trim()}
      >
        <i className="fas fa-paper-plane"></i>
      </button>
    </div>
  );
}
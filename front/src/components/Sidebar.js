import ChatList from './Chartlist';
import styles from '../styles/Home.module.css';

export default function Sidebar({ chats, currentChat, setCurrentChat }) {
  return (
    <div className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <div className={styles.userProfile}>
          <img 
            src="https://randomuser.me/api/portraits/men/1.jpg" 
            alt="Profile" 
            className={styles.profilePic}
          />
          <span>My Profile</span>
        </div>
        <div className={styles.sidebarActions}>
          <button className={styles.actionButton}>
            <i className="fas fa-ellipsis-v"></i>
          </button>
        </div>
      </div>
      
      <div className={styles.searchBar}>
        <input type="text" placeholder="Search or start new chat" />
      </div>
      
      <ChatList 
        chats={chats} 
        currentChat={currentChat} 
        setCurrentChat={setCurrentChat} 
      />
    </div>
  );
}
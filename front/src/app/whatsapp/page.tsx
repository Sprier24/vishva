"use client"
import { useState } from 'react'
import Head from 'next/head'
import Sidebar from '../../components/Sidebar'
import ChatWindow from '../../components/ChatWindow'
import styles from '../../styles/Home.module.css'

export default function Home() {
  const [currentChat, setCurrentChat] = useState(null)
  const [chats, setChats] = useState([
    {
      id: 1,
      name: 'John Doe',
      avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
      lastMessage: 'Hey, how are you?',
      time: '10:30 AM',
      unread: 2,
      online: true
    },
    {
      id: 2,
      name: 'Jane Smith',
      avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
      lastMessage: 'Can we meet tomorrow?',
      time: '9:15 AM',
      unread: 0,
      online: false
    },
    {
      id: 3,
      name: 'Work Group',
      avatar: 'https://randomuser.me/api/portraits/lego/3.jpg',
      lastMessage: 'Alice: The meeting is at 3pm',
      time: 'Yesterday',
      unread: 5,
      online: false
    }
  ])

  const [messages, setMessages] = useState([
    { id: 1, text: 'Hey there!', sender: 'other', time: '10:30 AM' },
    { id: 2, text: 'Hi! How are you?', sender: 'me', time: '10:31 AM' },
    { id: 3, text: "I'm good, thanks for asking. How about you?", sender: 'other', time: '10:32 AM' },
    { id: 4, text: "I'm doing well too. Just working on some projects.", sender: 'me', time: '10:33 AM' },
    { id: 5, text: "That sounds interesting! What kind of projects?", sender: 'other', time: '10:35 AM' }
  ])

  return (
    <div className={styles.container}>
      <Head>
        <title>WhatsApp Clone</title>
        <meta name="description" content="WhatsApp Clone with Next.js" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <div className={styles.whatsappContainer}>
          <Sidebar 
            chats={chats} 
            currentChat={currentChat} 
            setCurrentChat={setCurrentChat} 
          />
          {currentChat ? (
            <ChatWindow 
              chat={currentChat} 
              messages={messages} 
              setMessages={setMessages} 
            />
          ) : (
            <div className={styles.noChatSelected}>
              <div className={styles.noChatContent}>
                <img 
                  src="/whatsapp-logo.jpeg" 
                  alt="WhatsApp" 
                  className={styles.logo}
                />
                <h2>WhatsApp Web</h2>
                <p>Select a chat to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
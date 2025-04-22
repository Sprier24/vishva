'use client';

import React, { useEffect, useRef, useState } from 'react';
import ChatBubble from '../../components/ChatBubble';
import axios from 'axios';
import { PaperAirplaneIcon, ArrowPathIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { MicrophoneIcon, PaperClipIcon } from '@heroicons/react/24/solid';

const Chat = () => {
  const [messages, setMessages] = useState<{ sender: string; message: string }[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editMessageRef = useRef<HTMLDivElement>(null);
  const [isVoiceInputActive, setIsVoiceInputActive] = useState(false);

  useEffect(() => {
    if (editMessageRef.current) {
      editMessageRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      editMessageRef.current = null;
    } else {
      scrollToBottom();
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScroll = () => {
    const container = chatContainerRef.current;
    if (container) {
      const atBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 50;
      setShowScrollButton(!atBottom);
    }
  };

  const sendMessage = async (messageToSend: string, insertAfterIndex?: number) => {
    const userMessage = { sender: 'user', message: messageToSend };
    const newMessages = [...messages];

    let editScrollIndex = null;

    if (insertAfterIndex !== undefined) {
      newMessages.splice(insertAfterIndex + 1, 0, userMessage);
      editScrollIndex = insertAfterIndex + 1;
    } else {
      newMessages.push(userMessage);
    }

    setMessages(newMessages);

    setIsLoading(true);
    try {
      const res = await axios.post('http://localhost:8000/api/v1/chatbot/chat', {
        message: messageToSend,
      });

      const aiMessage = { sender: 'ai', message: res.data.message };
      setMessages((prev) => {
        const updated = [...prev];
        if (insertAfterIndex !== undefined) {
          updated.splice(insertAfterIndex + 2, 0, aiMessage);
        } else {
          updated.push(aiMessage);
        }
        return updated;
      });

      setTimeout(() => {
        if (editScrollIndex !== null) {
          const bubble = document.getElementById(`msg-${editScrollIndex}`);
          if (bubble) bubble.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditMessage = (text: string, index: number) => {
    sendMessage(text, index + 1);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(userInput);
      setUserInput('');
    }
  };

  const autoResizeTextarea = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 180);
      textarea.style.height = `${newHeight}px`;
      textarea.style.overflowY = newHeight >= 180 ? 'auto' : 'hidden';
    }
  };

  useEffect(() => {
    autoResizeTextarea();
  }, [userInput]);

  const refreshChat = () => {
    setMessages([]);
  };

  const handleVoiceInput = () => {
    const recognition = new (window as any).webkitSpeechRecognition() || new (window as any).SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
  
    setIsVoiceInputActive(true);
    recognition.start();
  
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setUserInput((prev) => (prev ? prev + ' ' + transcript : transcript));
    };
  
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsVoiceInputActive(false);
    };
  
    recognition.onend = () => {
      setIsVoiceInputActive(false);
    };
  };
  
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="p-4 shadow-sm bg-white border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg text-sidebar-primary-foreground">
              <Image src="/1500px.png" alt="" width={150} height={50} className="w-full h-auto max-w-[150px]" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-800">AI Assistant</h1>
              <p className="text-xs text-gray-500">{isLoading ? 'Typing...' : 'Online'}</p>
            </div>
          </div>
          <button
            onClick={refreshChat}
            className="text-blue-500 hover:bg-blue-100 p-2 rounded-full transition"
          >
            <ArrowPathIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Chat messages */}
      <div
        className="flex-1 overflow-y-auto px-4 py-6"
        ref={chatContainerRef}
        onScroll={handleScroll}
      >
        <div className="max-w-3xl mx-auto w-full">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center text-gray-500">
              <div className="w-16 h-16 mb-4 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                <PaperAirplaneIcon className="w-8 h-8 text-blue-500 transform rotate-45" />
              </div>
              <h3 className="text-lg font-medium mb-1">How can I help you today?</h3>
              <p className="text-sm max-w-md">Ask me anything or share your thoughts. I'm here to assist you.</p>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <div key={i} id={`msg-${i}`}>
                  <ChatBubble
                    sender={msg.sender as 'user' | 'ai'}
                    message={msg.message}
                    onEdit={msg.sender === 'user' ? (text) => handleEditMessage(text, i) : undefined}
                  />
                </div>
              ))}
              {isLoading && (
                <ChatBubble
                  sender="ai"
                  message={
                    <div className="flex space-x-1 animate-pulse">
                      <div className="w-2 h-2 rounded-full bg-gray-400" />
                      <div className="w-2 h-2 rounded-full bg-gray-400" />
                      <div className="w-2 h-2 rounded-full bg-gray-400" />
                    </div>
                  }
                />
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
        {showScrollButton && (
          <button
            className="fixed bottom-28 right-6 bg-white border border-gray-300 rounded-full shadow-md p-2 hover:bg-blue-50 transition"
            onClick={scrollToBottom}
          >
            <ChevronDownIcon className="w-5 h-5 text-blue-600" />
          </button>
        )}
      </div>

      {/* Input Section */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="max-w-3xl mx-auto w-full">
          {/* Textarea */}
          <div className="mb-2">
            <textarea
              ref={textareaRef}
              rows={1}
              className="w-full p-4 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{ maxHeight: '180px', minHeight: '44px', overflowY: 'hidden' }}
              placeholder="Type your message..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyPress}
            />
          </div>
          
          {/* Action Buttons Footer */}
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={handleVoiceInput}
                className={`p-2 rounded-full ${
                  isVoiceInputActive ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title={isVoiceInputActive ? 'Voice input is active' : 'Speak'}
              >
                <MicrophoneIcon className="w-5 h-5" />
              </button>
              
              {/* You can add a file upload button here if needed */}
              <button className="p-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200">
                <PaperClipIcon className="w-5 h-5" />
              </button>
            </div>
            
            <button
              onClick={() => {
                sendMessage(userInput);
                setUserInput('');
              }}
              disabled={isLoading || !userInput.trim()}
              className={`p-2 rounded-full ${
                isLoading || !userInput.trim()
                  ? 'bg-gray-100 text-gray-400'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </div>
          
          {/* Voice input status */}
          {isVoiceInputActive && (
            <div className="mt-2 text-center text-sm text-blue-500">
              Listening...
            </div>
          )}
          
          <p className="text-xs text-gray-500 mt-2 text-center">
            AI Assistant may produce inaccurate information. Consider verifying important info.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Chat;
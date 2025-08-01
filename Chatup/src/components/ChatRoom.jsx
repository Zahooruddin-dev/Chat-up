// src/components/ChatRoom.jsx
// This component implements the real-time chat room with a sidebar for private chats and online status.

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db, rtdb } from '../firebaseConfig'; // NEW: Import the Realtime Database instance
import { ref, onValue, set, onDisconnect } from 'firebase/database'; // NEW: Import Realtime Database functions
import {
  collection,
  query,
  orderBy,
  addDoc,
  serverTimestamp,
  onSnapshot,
  limit,
} from 'firebase/firestore';

// Get the app ID from the global variable (provided by Canvas)
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-chat-app';

// Function to generate a consistent chat ID for two users, regardless of who initiated the chat.
const getPrivateChatId = (user1Id, user2Id) => {
  return [user1Id, user2Id].sort().join('_');
};

function ChatRoom() {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [onlineStatus, setOnlineStatus] = useState({}); // NEW: State to store user online status
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const [activeChat, setActiveChat] = useState('public');
  const [targetUser, setTargetUser] = useState(null);

  const currentUserId = currentUser?.uid;

  // Collection references
  const publicMessagesRef = collection(db, `artifacts/${appId}/public/data/messages`);
  const usersCollectionRef = collection(db, `artifacts/${appId}/public/data/users`);
  const privateChatMessagesRef = targetUser ? collection(db, `artifacts/${appId}/privateChats/${getPrivateChatId(currentUserId, targetUser.uid)}/messages`) : null;

  // Effect to scroll to the bottom whenever messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Effect to set up the Realtime Database presence system
  useEffect(() => {
    if (!currentUserId) return;

    // The path in the Realtime Database for the user's status
    const userStatusDatabaseRef = ref(rtdb, `status/${currentUserId}`);
    // The path where we'll listen for all user statuses
    const allUsersStatusRef = ref(rtdb, 'status');

    // Set user's status to 'online'
    const isOnlineForRTDB = {
        state: 'online',
        last_changed: Date.now(),
    };
    set(userStatusDatabaseRef, isOnlineForRTDB);

    // Set up a listener for when the user disconnects
    onDisconnect(userStatusDatabaseRef).set({
        state: 'offline',
        last_changed: Date.now(),
    });

    // Listen for changes to all user statuses and update the state
    const unsubscribeStatus = onValue(allUsersStatusRef, (snapshot) => {
        const statuses = snapshot.val() || {};
        setOnlineStatus(statuses);
    });

    // Cleanup function to remove listeners
    return () => {
        // We don't remove the onDisconnect listener because we want it to fire even if the component unmounts
        unsubscribeStatus();
    };
  }, [currentUserId]);

  // Effect to set up the real-time listener for the user list (Firestore)
  useEffect(() => {
    if (!currentUserId) return;

    const q = query(usersCollectionRef, orderBy('email', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedUsers = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      // Filter out the current user and sort them by email
      setUsers(fetchedUsers.filter(user => user.uid !== currentUserId));
    }, (error) => {
      console.error("Error fetching users:", error);
    });

    return () => unsubscribe();
  }, [currentUserId]);

  // Effect to set up the real-time listener for the active chat (public or private)
  useEffect(() => {
    if (!currentUserId) return;

    let unsubscribe;
    let chatRef;

    if (activeChat === 'public') {
      const q = query(publicMessagesRef, orderBy('timestamp', 'asc'), limit(50));
      chatRef = q;
    } else if (targetUser) {
      const q = query(privateChatMessagesRef, orderBy('timestamp', 'asc'), limit(50));
      chatRef = q;
    }

    if (chatRef) {
      unsubscribe = onSnapshot(chatRef, (snapshot) => {
        const fetchedMessages = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMessages(fetchedMessages);
      }, (error) => {
        console.error("Error fetching messages:", error);
        setMessages([{ id: 'error', text: 'Failed to load messages. Please refresh.', senderId: 'system' }]);
      });
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [activeChat, targetUser, currentUserId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (inputValue.trim() === '' || isSending || !currentUserId) {
      return;
    }

    setIsSending(true);

    try {
      const messageData = {
        text: inputValue.trim(),
        senderId: currentUserId,
        senderEmail: currentUser?.email || 'Anonymous',
        timestamp: serverTimestamp(),
      };

      if (activeChat === 'public') {
        await addDoc(publicMessagesRef, messageData);
      } else if (targetUser) {
        await addDoc(privateChatMessagesRef, messageData);
      }

      setInputValue('');
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isSending) {
      handleSendMessage();
    }
  };

  const handleLogout = async () => {
    try {
      // Set the user's status to offline on logout
      const userStatusDatabaseRef = ref(rtdb, `status/${currentUserId}`);
      await set(userStatusDatabaseRef, { state: 'offline', last_changed: Date.now() });
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Logout failed:", error);
      alert("Failed to log out. Please try again.");
    }
  };

  const handleUserClick = (user) => {
    setTargetUser(user);
    setActiveChat(user.uid);
    setMessages([]);
  };

  const handlePublicChatClick = () => {
    setTargetUser(null);
    setActiveChat('public');
    setMessages([]);
  };

  return (
    <div className="chat-app-container">
      {/* Sidebar for Inboxes */}
      <div className="chat-inbox-sidebar">
        <div className="sidebar-header">
          <h2 className="sidebar-title">Inboxes</h2>
          <button onClick={handleLogout} className="button button-secondary button-small">
            Logout
          </button>
        </div>
        <div className="sidebar-inbox-list">
          {/* Public Chat Button */}
          <div
            className={`inbox-item ${activeChat === 'public' ? 'active' : ''}`}
            onClick={handlePublicChatClick}
          >
            <div className="inbox-item-name">Public Chat Room</div>
          </div>
          {/* List of other users for private chats */}
          {users.length > 0 && users.map((user) => {
            const isOnline = onlineStatus[user.uid]?.state === 'online'; // Check online status
            return (
              <div
                key={user.uid}
                className={`inbox-item ${activeChat === user.uid ? 'active' : ''}`}
                onClick={() => handleUserClick(user)}
              >
                <div className="inbox-item-name">
                    {user.email}
                    {/* NEW: Online/Offline indicator */}
                    <span className={`online-status-indicator ${isOnline ? 'online' : 'offline'}`} />
                </div>
              </div>
            );
          })}
          {users.length === 0 && (
            <p className="inbox-placeholder">No other users online. Invite a friend!</p>
          )}
        </div>
      </div>
      {/* Main Chat Area */}
      <div className="chatbot-main-container">
        {/* Chat Header */}
        <div className="chatbot-header">
          <h1 className="chatbot-title">
            {activeChat === 'public' ? 'Public Chat Room' : `Chatting with ${targetUser?.email}`}
          </h1>
          {currentUser && (
            <div className="user-info-display">
              <span className="user-email">Logged in as: {currentUser.email}</span>
            </div>
          )}
        </div>
        {/* Messages Display Area */}
        <div className="chatbot-messages-display custom-scrollbar">
          {messages.length === 0 && currentUserId && (
            <p className="chatbot-placeholder-message">
              {activeChat === 'public'
                ? 'No messages yet. Be the first to say hello!'
                : `Say hello to ${targetUser?.email}!`
              }
            </p>
          )}
          {messages.length === 0 && !currentUserId && (
            <p className="chatbot-placeholder-message">Loading messages...</p>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`chat-message ${
                msg.senderId === currentUserId ? 'user-message' : 'other-user-message'
              }`}
            >
              <div className="message-sender">
                {msg.senderId === currentUserId ? 'You' : msg.senderEmail || 'Anonymous'}
              </div>
              <div className="message-text">{msg.text}</div>
              {msg.timestamp && (
                <div className="message-timestamp">
                  {new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        {/* Input Area */}
        <div className="chatbot-input-area">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="chatbot-input"
            disabled={isSending || !currentUserId}
          />
          <button
            onClick={handleSendMessage}
            className="button button-primary"
            disabled={isSending || inputValue.trim() === '' || !currentUserId}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatRoom;

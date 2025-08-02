// src/components/ChatRoom.jsx
// This component implements the real-time chat room with a sidebar for private chats,
// online status, and a real-time unread message counter.

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db, rtdb } from '../firebaseConfig';
import { ref, onValue, set, onDisconnect } from 'firebase/database';
import {
  collection,
  query,
  orderBy,
  addDoc,
  serverTimestamp,
  onSnapshot,
  limit,
  doc,
  getDoc,
  setDoc,
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
  const [onlineStatus, setOnlineStatus] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [lastReadTimestamps, setLastReadTimestamps] = useState({});
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const [activeChat, setActiveChat] = useState('public');
  const [targetUser, setTargetUser] = useState(null);
  const [currentProfile, setCurrentProfile] = useState(null); // NEW: State to hold current user's profile

  const currentUserId = currentUser?.uid;

  // Collection references
  const publicMessagesRef = collection(
    db,
    `artifacts/${appId}/public/data/messages`
  );
  const usersCollectionRef = collection(
    db,
    `artifacts/${appId}/public/data/users`
  );
  const privateChatMessagesRef = targetUser
    ? collection(
        db,
        `artifacts/${appId}/privateChats/${getPrivateChatId(
          currentUserId,
          targetUser.uid
        )}/messages`
      )
    : null;
  const lastReadRef = collection(
    db,
    `artifacts/${appId}/users/${currentUserId}/lastRead`
  );

  // Effect to scroll to the bottom whenever messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Effect to set up the Realtime Database presence system
  useEffect(() => {
    if (!currentUserId) return;

    const userStatusDatabaseRef = ref(rtdb, `status/${currentUserId}`);
    const allUsersStatusRef = ref(rtdb, 'status');

    const isOnlineForRTDB = {
      state: 'online',
      last_changed: Date.now(),
    };
    set(userStatusDatabaseRef, isOnlineForRTDB);

    onDisconnect(userStatusDatabaseRef).set({
      state: 'offline',
      last_changed: Date.now(),
    });

    const unsubscribeStatus = onValue(allUsersStatusRef, (snapshot) => {
      const statuses = snapshot.val() || {};
      setOnlineStatus(statuses);
    });

    return () => {
      unsubscribeStatus();
    };
  }, [currentUserId]);

  // NEW: Effect to get the current user's profile
  useEffect(() => {
    if (!currentUserId) return;
    const docRef = doc(db, usersCollectionRef.path, currentUserId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setCurrentProfile(docSnap.data());
      }
    });
    return () => unsubscribe();
  }, [currentUserId]);

  // Effect to set up the real-time listener for the user list (Firestore)
  useEffect(() => {
    if (!currentUserId) return;

    const q = query(usersCollectionRef, orderBy('username', 'asc')); // NEW: Order by username

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedUsers = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(fetchedUsers.filter((user) => user.uid !== currentUserId));
      },
      (error) => {
        console.error('Error fetching users:', error);
      }
    );

    return () => unsubscribe();
  }, [currentUserId]);

  // NEW: Effect to listen for last read timestamps
  useEffect(() => {
    if (!currentUserId) return;
    const unsubscribe = onSnapshot(lastReadRef, (snapshot) => {
      const timestamps = {};
      snapshot.docs.forEach((doc) => {
        timestamps[doc.id] = doc.data().timestamp;
      });
      setLastReadTimestamps(timestamps);
    });

    return () => unsubscribe();
  }, [currentUserId]);

  // NEW: Effect to set up listeners for all private chats to get UNREAD message counts
  useEffect(() => {
    if (!currentUserId || users.length === 0) return;

    const unsubscribes = [];
    users.forEach((user) => {
      const chatId = getPrivateChatId(currentUserId, user.uid);
      const chatRef = collection(
        db,
        `artifacts/${appId}/privateChats/${chatId}/messages`
      );
      const q = query(chatRef);

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          // Calculate unread count based on last read timestamp
          const lastReadTimestamp = lastReadTimestamps[chatId] || 0;
          const unreadCount = snapshot.docs.filter((doc) => {
            const messageTimestamp = doc.data().timestamp?.toMillis();
            return messageTimestamp > lastReadTimestamp;
          }).length;

          setUnreadCounts((prevCounts) => ({
            ...prevCounts,
            [chatId]: unreadCount,
          }));
        },
        (error) => {
          console.error(
            `Error fetching private chat count for ${user.email}:`,
            error
          );
        }
      );
      unsubscribes.push(unsubscribe);
    });

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [currentUserId, users, lastReadTimestamps]);

  // Effect to set up the real-time listener for the active chat (public or private)
  useEffect(() => {
    if (!currentUserId) return;

    let unsubscribe;
    let chatRef;

    if (activeChat === 'public') {
      const q = query(
        publicMessagesRef,
        orderBy('timestamp', 'asc'),
        limit(50)
      );
      chatRef = q;
    } else if (targetUser) {
      const q = query(
        privateChatMessagesRef,
        orderBy('timestamp', 'asc'),
        limit(50)
      );
      chatRef = q;
    }

    if (chatRef) {
      unsubscribe = onSnapshot(
        chatRef,
        (snapshot) => {
          const fetchedMessages = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setMessages(fetchedMessages);
        },
        (error) => {
          console.error('Error fetching messages:', error);
          setMessages([
            {
              id: 'error',
              text: 'Failed to load messages. Please refresh.',
              senderId: 'system',
            },
          ]);
        }
      );
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
    if (inputValue.trim() === '' || isSending || !currentUserId || !currentProfile) {
      return;
    }

    setIsSending(true);

    try {
      const messageData = {
        text: inputValue.trim(),
        senderId: currentUserId,
        senderEmail: currentUser?.email || 'Anonymous', // Keep email for consistency, although we'll use username for display
        senderUsername: currentProfile.username, // NEW: Include username
        senderFullName: currentProfile.fullName, // NEW: Include full name
        timestamp: serverTimestamp(),
      };

      if (activeChat === 'public') {
        await addDoc(publicMessagesRef, messageData);
      } else if (targetUser) {
        await addDoc(privateChatMessagesRef, messageData);
      }

      setInputValue('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
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
      const userStatusDatabaseRef = ref(rtdb, `status/${currentUserId}`);
      await set(userStatusDatabaseRef, {
        state: 'offline',
        last_changed: Date.now(),
      });
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      alert('Failed to log out. Please try again.');
    }
  };

  const handleUserClick = async (user) => {
    setTargetUser(user);
    setActiveChat(user.uid);
    setMessages([]);

    // NEW: Update the last read timestamp for this chat
    if (currentUserId && user.uid) {
      const chatId = getPrivateChatId(currentUserId, user.uid);
      const lastReadDocRef = doc(db, lastReadRef.path, chatId);
      await setDoc(lastReadDocRef, { timestamp: Date.now() }, { merge: true });
    }
  };

  const handlePublicChatClick = () => {
    setTargetUser(null);
    setActiveChat('public');
    setMessages([]);
  };

  return (
    <div className='chat-app-container'>
      <div className='chat-inbox-sidebar'>
        <div className='sidebar-header'>
          <h2 className='sidebar-title'>Inboxes</h2>
          <button
            onClick={handleLogout}
            className='button button-secondary button-small'
          >
            Logout
          </button>
        </div>
        <div className='sidebar-inbox-list'>
          <div
            className={`inbox-item ${activeChat === 'public' ? 'active' : ''}`}
            onClick={handlePublicChatClick}
          >
            <div className='inbox-item-name'>Public Chat Room</div>
          </div>
          {users.length > 0 &&
            users.map((user) => {
              const isOnline = onlineStatus[user.uid]?.state === 'online';
              const chatId = getPrivateChatId(currentUserId, user.uid);
              const messageCount = unreadCounts[chatId] || 0;
              return (
                <div
                  key={user.uid}
                  className={`inbox-item ${
                    activeChat === user.uid ? 'active' : ''
                  }`}
                  onClick={() => handleUserClick(user)}
                >
                  <div className='inbox-item-name'>
                    {user.username} {/* NEW: Display username in the sidebar */}
                    <span
                      className={`online-status-indicator ${
                        isOnline ? 'online' : 'offline'
                      }`}
                    />
                    {messageCount > 0 && (
                      <span className='message-count-badge'>
                        {messageCount}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          {users.length === 0 && (
            <p className='inbox-placeholder'>
              No other users online. Invite a friend!
            </p>
          )}
        </div>
      </div>
      <div className='chatbot-main-container'>
        <div className='chatbot-header'>
          <h1 className='chatbot-title'>
            {/* NEW: Use full name for private chat header */}
            {activeChat === 'public'
              ? 'Public Chat Room'
              : `Chatting with ${targetUser?.fullName}`}
          </h1>
          {currentProfile && (
            <div className='user-info-display'>
              <span className='user-email'>
                Logged in as: {currentProfile.username} {/* NEW: Display current user's username */}
              </span>
            </div>
          )}
        </div>
        <div className='chatbot-messages-display custom-scrollbar'>
          {messages.length === 0 && currentUserId && (
            <p className='chatbot-placeholder-message'>
              {activeChat === 'public'
                ? 'No messages yet. Be the first to say hello!'
                : `Say hello to ${targetUser?.fullName}!`}
            </p>
          )}
          {messages.length === 0 && !currentUserId && (
            <p className='chatbot-placeholder-message'>Loading messages...</p>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`chat-message ${
                msg.senderId === currentUserId
                  ? 'user-message'
                  : 'other-user-message'
              }`}
            >
              <div className='message-sender'>
                {msg.senderId === currentUserId
                  ? 'You'
                  : msg.senderUsername || 'Anonymous'} {/* NEW: Display sender's username */}
              </div>
              <div className='message-text'>{msg.text}</div>
              {msg.timestamp && (
                <div className='message-timestamp'>
                  {new Date(msg.timestamp.seconds * 1000).toLocaleTimeString(
                    [],
                    { hour: '2-digit', minute: '2-digit' }
                  )}
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className='chatbot-input-area'>
          <input
            type='text'
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder='Type your message...'
            className='chatbot-input'
            disabled={isSending || !currentUserId}
          />
          <button
            onClick={handleSendMessage}
            className='button button-primary'
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

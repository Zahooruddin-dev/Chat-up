// src/components/ChatRoom.jsx
// This component implements the real-time chat room functionality using Firestore.
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebaseConfig'; // Import our Firestore instance
import {
  collection,
  query,
  orderBy,
  addDoc,
  serverTimestamp,
  onSnapshot,
  limit // Import limit for fetching latest messages
} from 'firebase/firestore';

function ChatRoom() {
  const [messages, setMessages] = useState([]); // Stores chat messages
  const [inputValue, setInputValue] = useState(''); // Stores current input field value
  const [isSending, setIsSending] = useState(false); // Prevents multiple sends
  const messagesEndRef = useRef(null); // Ref for auto-scrolling to the latest message
  const { currentUser, logout } = useAuth(); // Get user info and logout function from AuthContext
  const navigate = useNavigate();

  // Get the app ID from the global variable (provided by Canvas)
  // Fallback to a default if running outside Canvas for local testing
  const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-chat-app';
  const currentUserId = currentUser?.uid; // Get the authenticated user's UID

  // Firestore collection reference for messages
  // CORRECTED PATH: /artifacts/{appId}/public/data/messages
  const messagesCollectionRef = collection(db, `artifacts/${appId}/public/data/messages`);

  // Effect to scroll to the bottom of the messages display whenever messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Effect to set up the real-time listener for Firestore messages
  useEffect(() => {
    if (!currentUserId) {
      // Don't try to fetch messages if no user is authenticated yet
      return;
    }

    // Create a query to get messages, ordered by timestamp
    const q = query(messagesCollectionRef, orderBy('timestamp', 'asc'), limit(50)); // Fetch last 50 messages

    // Set up the real-time listener
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(fetchedMessages);
    }, (error) => {
      console.error("Error fetching messages:", error);
      // Display a user-friendly error message in the UI if needed
      setMessages([{ id: 'error', text: 'Failed to load messages. Please refresh.', senderId: 'system' }]);
    });

    // Cleanup function: unsubscribe from the listener when the component unmounts
    return () => unsubscribe();
  }, [currentUserId, appId]); // Re-run if user changes or app ID changes

  // Function to scroll the messages display to the very bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Function to handle sending a message
  const handleSendMessage = async () => {
    if (inputValue.trim() === '' || isSending || !currentUserId) {
      return; // Prevent sending empty messages, multiple sends, or if no user
    }

    setIsSending(true); // Disable input/button while sending

    try {
      await addDoc(messagesCollectionRef, {
        text: inputValue.trim(),
        senderId: currentUserId, // Store the sender's UID
        senderEmail: currentUser?.email || 'Anonymous', // Store sender's email for display
        timestamp: serverTimestamp(), // Firestore automatically adds a server timestamp
      });
      setInputValue(''); // Clear the input field after sending
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again."); // Simple alert for send failure
    } finally {
      setIsSending(false); // Re-enable input/button
    }
  };

  // Function to handle key presses in the input field (e.g., Enter key)
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isSending) {
      handleSendMessage();
    }
  };

  // Function to handle user logout
  const handleLogout = async () => {
    try {
      await logout(); // Call the Firebase logout function
      navigate('/login'); // Redirect to the login page after logout
    } catch (error) {
      console.error("Logout failed:", error);
      alert("Failed to log out. Please try again.");
    }
  };

  return (
    <div className="chatbot-main-container">
      {/* Chat Header */}
      <div className="chatbot-header">
        <h1 className="chatbot-title">Public Chat Room</h1> {/* Updated title */}
        {/* Display user's email and Firebase UID */}
        {currentUser && (
          <div className="user-info-display">
            <span className="user-email">Logged in as: {currentUser.email}</span>
            <span className="user-id">UID: {currentUser.uid.substring(0, 8)}...</span> {/* Truncate UID for display */}
          </div>
        )}
        <button onClick={handleLogout} className="button button-secondary button-small">
          Logout
        </button>
      </div>

      {/* Messages Display Area */}
      <div className="chatbot-messages-display custom-scrollbar">
        {messages.length === 0 && !currentUserId ? (
          <p className="chatbot-placeholder-message">Loading messages...</p>
        ) : messages.length === 0 && currentUserId ? (
          <p className="chatbot-placeholder-message">No messages yet. Be the first to say hello!</p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              // Apply different classes based on whether the message is from the current user
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
          ))
        )}
        <div ref={messagesEndRef} /> {/* Element to scroll into view */}
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
          disabled={isSending || !currentUserId} // Disable if sending or not authenticated
        />
        <button
          onClick={handleSendMessage}
          className="button button-primary"
          disabled={isSending || inputValue.trim() === '' || !currentUserId} // Disable if sending, empty, or not authenticated
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default ChatRoom;
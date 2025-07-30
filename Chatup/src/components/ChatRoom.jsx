// src/components/Chatbot.jsx
// Main chat interface, now integrated with Firebase Auth for user info and logout.
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Chatbot() { // This component will be renamed to ChatRoom.jsx in the next step
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout(); // Call the Firebase logout function
      navigate('/login'); // Redirect to the login page after logout
    } catch (error) {
      console.error("Logout failed:", error);
      alert("Failed to log out. Please try again."); // Simple alert for logout failure
    }
  };

  return (
    <div className="chatbot-main-container">
      {/* Chat Header */}
      <div className="chatbot-header">
        <h1 className="chatbot-title">Chat Room</h1> {/* Updated title */}
        {/* Display user's email from Firebase currentUser object */}
        {currentUser && <span className="user-display">Logged in as: {currentUser.email}</span>}
        <button onClick={handleLogout} className="button button-secondary button-small">
          Logout
        </button>
      </div>

      <div className="chatbot-messages-display">
        <p className="chatbot-placeholder-message">
          Welcome to the chat room!
        </p>
        <p className="chatbot-placeholder-message">
          In the next step, we'll implement real-time messaging using Firestore.
        </p>
      </div>
      <div className="chatbot-input-area">
        <input
          type="text"
          placeholder="Type your message..."
          className="chatbot-input"
          disabled
        />
        <button className="button button-primary" disabled>
          Send
        </button>
      </div>
    </div>
  );
}

export default Chatbot;
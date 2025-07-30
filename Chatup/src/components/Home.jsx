// src/components/Home.jsx
// This is the landing page of your application.
import React from 'react';
import { Link } from 'react-router-dom'; // Import Link for navigation

function Home() {
  return (
    <div className="home-container">
      <h1 className="home-title">Welcome to AI Chat Agent</h1>
      <p className="home-subtitle">
        Your personal assistant for basic queries, creative writing, and more.
        Experience a sleek, modern, and responsive chat interface.
      </p>
      <div className="home-buttons">
        {/* Link to the Login page */}
        <Link to="/login" className="button button-primary">
          Login
        </Link>
        {/* Link to the Chat page (accessible for now, will be protected later) */}
        <Link to="/chat" className="button button-secondary">
          Start Chatting (Guest)
        </Link>
      </div>
      <p className="home-note">
        Note: Guest mode does not save chat history.
      </p>
    </div>
  );
}

export default Home;
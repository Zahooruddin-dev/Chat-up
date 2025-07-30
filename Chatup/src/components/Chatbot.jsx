// src/components/Chatbot.jsx
// Main chatbot interface with interactive messaging, typing indicator, and context management.
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getChatbotResponse } from '../utils/chatbotProcessor'; // Import our chatbot logic

function Chatbot() {
  const [messages, setMessages] = useState([]); // Stores chat messages
  const [inputValue, setInputValue] = useState(''); // Stores current input field value
  const [isTyping, setIsTyping] = useState(false); // Controls the "Typing..." indicator
  const [conversationContext, setConversationContext] = useState('general'); // Manages the bot's context
  const messagesEndRef = useRef(null); // Ref for auto-scrolling to the latest message
  const { currentUser, logout } = useAuth(); // Get user info and logout function from AuthContext
  const navigate = useNavigate(); // Get navigate function from React Router

  // Effect to scroll to the bottom of the messages display whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Effect to display an initial welcome message from the bot
  useEffect(() => {
    // Only show welcome message if no messages are present and bot isn't already typing
    if (messages.length === 0 && !isTyping) {
      setIsTyping(true); // Show typing indicator
      setTimeout(() => {
        // Construct a personalized welcome message
        const welcomeMessage = {
          text: `Hello ${currentUser?.name || 'Guest'}! How can I assist you today?`,
          sender: 'bot',
        };
        setMessages([welcomeMessage]); // Add welcome message to chat
        setIsTyping(false); // Hide typing indicator
      }, 1000); // Simulate bot "thinking" time for welcome message
    }
  }, [currentUser, messages.length, isTyping]); // Dependencies for this effect

  // Function to scroll the messages display to the very bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Function to handle sending a message
  const handleSendMessage = async () => {
    if (inputValue.trim() === '') return; // Prevent sending empty messages

    const userMessage = { text: inputValue.trim(), sender: 'user' };
    setMessages((prevMessages) => [...prevMessages, userMessage]); // Add user's message to state
    setInputValue(''); // Clear the input field

    setIsTyping(true); // Show typing indicator

    // Simulate a network delay for the bot's response
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Get the bot's response and updated context from our processor
    const { response: botResponseText, newContext } = getChatbotResponse(userMessage.text, conversationContext);
    const botMessage = { text: botResponseText, sender: 'bot' };

    setMessages((prevMessages) => [...prevMessages, botMessage]); // Add bot's message to state
    setConversationContext(newContext); // Update the conversation context
    setIsTyping(false); // Hide typing indicator
  };

  // Function to handle key presses in the input field (e.g., Enter key)
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isTyping) { // Only send if Enter is pressed and bot isn't typing
      handleSendMessage();
    }
  };

  // Function to handle user logout
  const handleLogout = () => {
    logout(); // Call the logout function from AuthContext
    navigate('/login'); // Redirect to the login page after logout
  };

  return (
    <div className="chatbot-main-container">
      {/* Chat Header */}
      <div className="chatbot-header">
        <h1 className="chatbot-title">AI Chat Agent</h1>
        {/* Display user's name if logged in */}
        {currentUser && <span className="user-display">Logged in as: {currentUser.name || currentUser.email}</span>}
        <button onClick={handleLogout} className="button button-secondary button-small">
          Logout
        </button>
      </div>

      {/* Messages Display Area */}
      <div className="chatbot-messages-display custom-scrollbar">
        {messages.map((msg, index) => (
          <div
            key={index} // Use index as key (OK for static lists, but use unique IDs for dynamic data)
            className={`chat-message ${
              msg.sender === 'user' ? 'user-message' : 'bot-message'
            }`}
          >
            {msg.text}
          </div>
        ))}
        {/* Typing indicator */}
        {isTyping && (
          <div className="chat-message bot-message typing-indicator">
            Typing...
          </div>
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
          disabled={isTyping} // Disable input while bot is typing
        />
        <button
          onClick={handleSendMessage}
          className="button button-primary"
          disabled={isTyping || inputValue.trim() === ''} // Disable send if typing or input is empty
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default Chatbot;
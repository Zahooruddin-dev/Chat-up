// src/components/Login.jsx
// User login component with a sleek, dark theme, now integrated with AuthContext.
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Import useNavigate
import { useAuth } from '../context/AuthContext'; // Import useAuth hook

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth(); // Get the login function from AuthContext
  const navigate = useNavigate(); // Get the navigate function from React Router

  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent default form submission behavior
    setError(''); // Clear any previous error messages

    // Basic client-side validation
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    // --- Simulate a simple login for demonstration ---
    // In a real application, you would make an API call here
    // to your backend authentication service (e.g., Firebase Auth, Node.js API).
    // Example with a dummy user:
    if (email === 'user@example.com' && password === 'password123') {
      // If credentials match, call the login function from AuthContext
      // Pass a dummy user object. In a real app, this would be user data from your backend.
      login({ id: 'user123', email: email, name: 'Chat User' });
      navigate('/chat'); // Redirect to the chat page upon successful login
    } else {
      // Display an error message for invalid credentials
      setError('Invalid email or password. Try: user@example.com / password123');
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2 className="login-title">Login to Chat</h2>
        {/* Display error message if present */}
        {error && (
          <p className="error-message">
            {error}
          </p>
        )}
        <div className="form-group">
          <label htmlFor="email" className="form-label">Email</label>
          <input
            type="email"
            id="email"
            value={email} // Controlled component for email input
            onChange={(e) => setEmail(e.target.value)}
            className="form-input"
            placeholder="user@example.com"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password" className="form-label">Password</label>
          <input
            type="password"
            id="password"
            value={password} // Controlled component for password input
            onChange={(e) => setPassword(e.target.value)}
            className="form-input"
            placeholder="password123"
            required
          />
        </div>
        <button type="submit" className="button button-primary button-full-width">
          Login
        </button>
        <p className="login-signup-link">
          Don't have an account?{' '}
          <Link to="/" className="text-link">
            Go Home
          </Link>
        </p>
      </form>
    </div>
  );
}

export default Login;
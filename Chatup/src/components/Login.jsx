// src/components/Login.jsx
// User login component with Firebase Authentication integration.
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Import useAuth hook

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false); // State to toggle between login/register form
  const { login, register } = useAuth(); // Get login and register functions from AuthContext
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear any previous error messages

    try {
      if (isRegistering) {
        // Attempt to register the user
        await register(email, password);
        alert('Registration successful! You are now logged in.'); // Simple alert for success
      } else {
        // Attempt to log in the user
        await login(email, password);
      }
      navigate('/chat'); // Redirect to the chat page upon successful login/registration
    } catch (err) {
      // Handle Firebase authentication errors
      let errorMessage = 'An unexpected error occurred. Please try again.';
      if (err.code) {
        switch (err.code) {
          case 'auth/invalid-email':
            errorMessage = 'Invalid email address format.';
            break;
          case 'auth/user-disabled':
            errorMessage = 'This user account has been disabled.';
            break;
          case 'auth/user-not-found':
          case 'auth/wrong-password':
            errorMessage = 'Invalid email or password.';
            break;
          case 'auth/email-already-in-use':
            errorMessage = 'This email is already registered. Try logging in.';
            break;
          case 'auth/weak-password':
            errorMessage = 'Password should be at least 6 characters.';
            break;
          default:
            errorMessage = err.message;
        }
      }
      setError(errorMessage);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2 className="login-title">
          {isRegistering ? 'Register Account' : 'Login to Chat'}
        </h2>
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-input"
            placeholder="Enter your email"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password" className="form-label">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-input"
            placeholder="Enter your password"
            required
          />
        </div>
        <button type="submit" className="button button-primary button-full-width">
          {isRegistering ? 'Register' : 'Login'}
        </button>
        <p className="login-signup-link">
          {isRegistering ? (
            <>
              Already have an account?{' '}
              <span onClick={() => setIsRegistering(false)} className="text-link cursor-pointer">
                Login
              </span>
            </>
          ) : (
            <>
              Don't have an account?{' '}
              <span onClick={() => setIsRegistering(true)} className="text-link cursor-pointer">
                Register
              </span>
            </>
          )}
        </p>
        <p className="login-signup-link">
          <Link to="/" className="text-link">
            Go Home
          </Link>
        </p>
      </form>
    </div>
  );
}

export default Login;
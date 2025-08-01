// src/components/Login.jsx
// User login component with Firebase Authentication integration.
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebaseConfig';
import { doc, setDoc, getDoc } from 'firebase/firestore'; // Import getDoc

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-chat-app';

  // Function to create a user profile document in Firestore, but only if it doesn't already exist
  const createUserProfile = async (user) => {
    try {
      // CORRECTED PATH: /artifacts/{appId}/public/data/users/{userId}
      const userDocRef = doc(db, `artifacts/${appId}/public/data/users`, user.uid);
      const docSnap = await getDoc(userDocRef);

      if (!docSnap.exists()) {
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          createdAt: new Date(),
          // You can add more profile fields here if needed (e.g., displayName)
        });
        console.log("New user profile created successfully for:", user.email);
      } else {
        console.log("User profile already exists for:", user.email);
      }
    } catch (e) {
      console.error("Error creating user profile:", e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (isRegistering) {
        const user = await register(email, password);
        await createUserProfile(user); // Call the function to create a profile
        alert('Registration successful! You are now logged in.');
      } else {
        const user = await login(email, password);
        await createUserProfile(user); // Call the function to ensure a profile exists on login too
      }
      navigate('/chat');
    } catch (err) {
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
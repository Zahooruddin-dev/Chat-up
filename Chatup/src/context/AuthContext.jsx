// src/context/AuthContext.jsx
// Manages the user's authentication state using React Context and localStorage.
import React, { createContext, useState, useEffect, useContext } from 'react';

// Create the AuthContext. This will hold our authentication state and functions.
export const AuthContext = createContext(null);

// AuthProvider component: Wraps parts of your application to provide authentication context.
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null); // Stores the logged-in user's data
  const [loading, setLoading] = useState(true); // Indicates if auth state is being loaded

  useEffect(() => {
    // This effect runs once when the component mounts.
    // It checks if a user session exists in localStorage.
    const userFromStorage = localStorage.getItem('chat_agent_user');
    if (userFromStorage) {
      try {
        // Attempt to parse the stored user data.
        setCurrentUser(JSON.parse(userFromStorage));
      } catch (e) {
        // If parsing fails (e.g., corrupted data), log error and clear storage.
        console.error("Failed to parse user from local storage:", e);
        localStorage.removeItem('chat_agent_user');
      }
    }
    setLoading(false); // Authentication state has been determined (either logged in or not)
  }, []); // Empty dependency array means this effect runs only once on mount

  // Function to handle user login.
  // In a real app, this would involve API calls to a backend.
  const login = (userData) => {
    setCurrentUser(userData); // Set the current user in state
    localStorage.setItem('chat_agent_user', JSON.stringify(userData)); // Store user data in localStorage
  };

  // Function to handle user logout.
  const logout = () => {
    setCurrentUser(null); // Clear the current user from state
    localStorage.removeItem('chat_agent_user'); // Remove user data from localStorage
  };

  // The value prop makes the current user, login, logout, and loading state
  // available to any component that consumes this context.
  return (
    <AuthContext.Provider value={{ currentUser, login, logout, loading }}>
      {/* Only render children once the loading state is false (auth check is complete) */}
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Custom hook to easily access the authentication context in any functional component.
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // This check helps catch bugs where useAuth is called outside of AuthProvider.
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
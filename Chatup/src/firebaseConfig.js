// src/firebaseConfig.js
// This file initializes your Firebase application and exports necessary services.

// Import the functions you need from the Firebase SDKs
import { initializeApp } from 'firebase/app';
// Removed signInAnonymously, signInWithCustomToken from here as they are not needed globally
import { getAuth } from 'firebase/auth'; // Only getAuth is needed here
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration - DIRECTLY USE YOUR CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyD6swbDrL3D2A6awzxFFMgkc8r9xRtC0jg",
  authDomain: "chatup-59021.firebaseapp.com",
  projectId: "chatup-59021",
  storageBucket: "chatup-59021.firebasestorage.app",
  messagingSenderId: "649421237532",
  appId: "1:649421237532:web:2602a69f60aa0a1b39ded9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Firebase Authentication and Firestore instances
const auth = getAuth(app);
const db = getFirestore(app);

// Export the auth and db instances for use throughout your application
export { auth, db };

// Removed the initializeAuth() function and its call.
// Authentication is now solely managed by AuthContext.jsx based on user actions.
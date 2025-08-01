// src/firebaseConfig.js
// This file is now a simple initializer for Firebase services.
// Authentication logic has been moved to AuthContext.jsx to resolve startup errors.

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth'; // Re-added getAuth for use in AuthContext
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

// Your web app's Firebase configuration - DIRECTLY USING YOUR CONFIG
const firebaseConfig = {
    apiKey: "AIzaSyD6swbDrL3D2A6awzxFFMgkc8r9xRtC0jg",
    authDomain: "chatup-59021.firebaseapp.com",
    projectId: "chatup-59021",
    storageBucket: "chatup-59021.firebasestorage.app",
    messagingSenderId: "649421237532",
    appId: "1:649421237532:web:2602a69f60aa0a1b39ded9",
    databaseURL: "https://chatup-59021-default-rtdb.asia-southeast1.firebasedatabase.app" // Corrected database URL
};

// Initialize the Firebase app with the provided configuration.
const app = initializeApp(firebaseConfig);

// Initialize Firebase services and get their instances.
const auth = getAuth(app); // Get the auth instance
const db = getFirestore(app);
const rtdb = getDatabase(app);

// Export the initialized services so they can be imported and used
// in other parts of the application.
export { auth, db, rtdb, app };

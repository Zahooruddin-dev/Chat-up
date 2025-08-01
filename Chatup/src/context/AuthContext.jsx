// src/context/AuthContext.jsx
// Manages the user's authentication state using React Context and Firebase Authentication.
import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth } from '../firebaseConfig'; // Import our Firebase auth instance
import {
	onAuthStateChanged,
	signOut,
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
} from 'firebase/auth';

// Create the AuthContext. This will hold our authentication state and functions.
export const AuthContext = createContext(null);

// AuthProvider component: Wraps parts of your application to provide authentication context.
export const AuthProvider = ({ children }) => {
	const [currentUser, setCurrentUser] = useState(null); // Stores the logged-in user's data
	const [loading, setLoading] = useState(true); // Indicates if auth state is being loaded

	useEffect(() => {
		// This Firebase listener runs whenever the user's authentication state changes.
		// It's the most reliable way to get the current user.
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			setCurrentUser(user); // Update the current user in state
			setLoading(false); // Authentication state has been determined
		});

		// Cleanup function: unsubscribe from the listener when the component unmounts
		return () => unsubscribe();
	}, []); // Empty dependency array means this effect runs only once on mount

	// Function to handle user registration with email and password
	const register = async (email, password) => {
		try {
			const userCredential = await createUserWithEmailAndPassword(
				auth,
				email,
				password
			);
			// User is automatically logged in after registration
			return userCredential.user;
		} catch (error) {
			console.error('Firebase registration error:', error);
			throw error; // Re-throw to be handled by the component calling this function
		}
	};

	// Function to handle user login with email and password
	const login = async (email, password) => {
		try {
			const userCredential = await signInWithEmailAndPassword(
				auth,
				email,
				password
			);
			return userCredential.user;
		} catch (error) {
			console.error('Firebase login error:', error);
			throw error;
		}
	};

	// Function to handle user logout
	const logout = async () => {
		try {
			await signOut(auth);
		} catch (error) {
			console.error('Firebase logout error:', error);
			throw error;
		}
	};

	// The value prop makes the current user, login, logout, register, and loading state
	// available to any component that consumes this context.
	return (
		<AuthContext.Provider
			value={{ currentUser, login, logout, register, loading }}
		>
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

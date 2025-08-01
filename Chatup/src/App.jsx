// src/App.jsx
// This is the main application component, now handling routing and authentication context.
import React from 'react';
import {
	BrowserRouter as Router,
	Routes,
	Route,
	Navigate,
} from 'react-router-dom';

// Import our new page components
import Home from './components/Home';
import Login from './components/Login';
import ChatRoom from './components/ChatRoom'; // Changed from Chatbot to ChatRoom

// Import AuthProvider and useAuth from our context
import { AuthProvider, useAuth } from './context/AuthContext';

// PrivateRoute component to protect routes requiring authentication
const PrivateRoute = ({ children }) => {
	const { currentUser, loading } = useAuth(); // Get current user and loading state from context

	// Show a loading spinner or message while authentication state is being determined
	if (loading) {
		return (
			<div className='loading-screen'>
				<div className='spinner'></div>
				<p>Loading user session...</p>
			</div>
		);
	}

	// If user is not logged in, redirect to login page
	return currentUser ? children : <Navigate to='/login' replace />;
};

function App() {
	return (
		// Router wraps the entire application to enable routing
		<Router>
			{/* AuthProvider wraps the entire application to provide authentication context */}
			<AuthProvider>
				<Routes>
					{/* Define public routes */}
					<Route path='/' element={<Home />} />
					<Route path='/login' element={<Login />} />

					{/* Protected route for the chat room */}
					<Route
						path='/chat'
						element={
							<PrivateRoute>
								<ChatRoom /> {/* Render our ChatRoom component */}
							</PrivateRoute>
						}
					/>

					{/* Catch-all route for unmatched paths, redirects to Home */}
					<Route path='*' element={<Navigate to='/' replace />} />
				</Routes>
			</AuthProvider>
		</Router>
	);
}

export default App;

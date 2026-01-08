import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import Registration from './pages/Registration';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import './App.css';
import Profile from './pages/Profile';
import Analytics from './pages/Analytics';

function App() {
  return (
    <Router>
      <AppProvider>
        <div className="App">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/register" element={<Registration />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route 
                path="/profile" 
                element={
                <ProtectedRoute>
                    <Profile />
                </ProtectedRoute>
                } 
            />
            <Route 
                path="/analytics" 
                element={
                    <ProtectedRoute>
                    <Analytics />
                    </ProtectedRoute>
                } 
                />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </AppProvider>
    </Router>
  );
}

export default App;
// src/App.tsx

import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import VotingPage from './pages/VotingPage';
import AdminPage from './pages/AdminPage';
// import Navigation from './components/Navigation';
import ProtectedRoute from './components/ProtectedRoute';
import './admin.css';

const App: React.FC = () => {
  return (
    <Router>
      {/* <Navigation /> */}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/vote" element={<VotingPage />} />
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminPage />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
};

export default App;
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { FaLock, FaUser, FaExclamationTriangle } from 'react-icons/fa';
import { ref, get } from 'firebase/database';
import { db } from '../services/firebase';

// Interface untuk props AlertModal
interface AlertModalProps {
  show: boolean;
  message: string;
  onClose: () => void;
}

// Komponen AlertModal
const AlertModal: React.FC<AlertModalProps> = ({ show, message, onClose }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm overflow-y-auto h-full w-full flex items-center justify-center z-50" id="alert-modal">
      <div className="relative p-6 border-0 rounded-lg shadow-lg bg-white sm:w-96 mx-auto">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <FaExclamationTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-xl leading-6 font-bold text-gray-900 mb-2">Login Error</h3>
          <p className="text-sm text-gray-500 mb-4">{message}</p>
          <button
            className="w-full px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 transition duration-300 ease-in-out"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Superadmin credentials
const SUPERADMIN_USERNAME = 'faruqeclypst';
const SUPERADMIN_PASSWORD = 'Intanfaruq12#';

// Komponen ProtectedRoute
const ProtectedRoute: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated');
    setIsAuthenticated(authStatus === 'true');
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check for superadmin credentials first
    if (username === SUPERADMIN_USERNAME && password === SUPERADMIN_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem('isAuthenticated', 'true');
      return;
    }

    try {
      const adminsRef = ref(db, 'admins');
      const snapshot = await get(adminsRef);
      
      if (snapshot.exists()) {
        const admins = snapshot.val();
        const admin = Object.values(admins).find((admin: any) => 
          admin.username === username && admin.password === password
        );

        if (admin) {
          setIsAuthenticated(true);
          localStorage.setItem('isAuthenticated', 'true');
        } else {
          setAlertMessage('Invalid username or password!');
          setShowAlert(true);
        }
      } else {
        setAlertMessage('No admins found. Please contact the system administrator.');
        setShowAlert(true);
      }
    } catch (error) {
      console.error('Error during login:', error);
      setAlertMessage('An error occurred during login. Please try again.');
      setShowAlert(true);
    }
  };

  if (isAuthenticated === null) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  // Render form login
  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-2xl transform transition-all hover:scale-105 duration-300">
        <h2 className="text-3xl font-extrabold text-center text-gray-800 mb-8">Login Admin</h2>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="username">
              Username
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaUser className="h-5 w-5 text-gray-400" />
              </div>
              <input
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="password">
              Password
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <button
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
              type="submit"
            >
              Sign In
            </button>
          </div>
        </form>
        
        <p className="mt-8 text-center text-sm font-bold text-gray-600">
          &copy;{new Date().getFullYear()} Alfaruq Asri, S.Pd. 
          <span className="block">SMAN Modal Bangsa. All rights reserved.</span>
        </p>
      </div>

      <AlertModal
        show={showAlert}
        message={alertMessage}
        onClose={() => setShowAlert(false)}
      />
    </div>
  );
};

export default ProtectedRoute;
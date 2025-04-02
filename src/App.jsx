import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import LoginScreen from './screens/LoginScreen';
import UserDetailScreen from './screens/UserDetailsScreen';
import UserWeeklySummaries from './screens/UserWeeklySummaries';
import ManagerDashboardScreen from './screens/ManagerDashbaordScreen';
import RegisterScreen from './screens/RegisterScreen';
import EmployeeDashboard from './screens/EmployeeDashboard';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState('');

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('userToken');
      const userRole = localStorage.getItem('role');
      setRole(userRole);
      setIsLoggedIn(!!token);
      setIsLoading(false);
    };

    checkAuth();

    // Add event listener for storage changes
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);


  const AuthWrapper = ({ children }) => {
    const navigate = useNavigate();

    useEffect(() => {
      if (!isLoading) {
        const currentPath = window.location.pathname;
        // Skip redirection for login and register routes
        if (!isLoggedIn && currentPath !== '/login' && currentPath !== '/register') {
          navigate('/login');
        } else if (isLoggedIn && currentPath === '/') {
          navigate('/dashboard');
        }
      }
    }, [isLoggedIn, isLoading, navigate]);

    if (isLoading) {
      return (
        <div className="d-flex justify-content-center align-items-center vh-100">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      );
    }

    return children;
  };
  return (
    <Router>
      <AuthWrapper>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={
            !isLoggedIn ? (
              <LoginScreen setIsLoggedIn={setIsLoggedIn} setRole={setRole} />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          } />

          <Route path="/register" element={
            !isLoggedIn ? (
              <RegisterScreen setIsLoggedIn={setIsLoggedIn} setRole={setRole} />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          } />

          {/* Protected routes */}
          {isLoggedIn && (
            <>
              {role === 'manager' ? (
                <>
                  <Route path="/dashboard" element={<ManagerDashboardScreen setIsLoggedIn={setIsLoggedIn} />} />
                  <Route path="/user/:userId" element={<UserDetailScreen setIsLoggedIn={setIsLoggedIn} />} />
                  <Route path="/weekly-summaries/:weekId" element={<UserWeeklySummaries setIsLoggedIn={setIsLoggedIn} />} />
                </>
              ) : (
                <Route path="/dashboard" element={<EmployeeDashboard setIsLoggedIn={setIsLoggedIn} />} />
              )}
            </>
          )}

          {/* Fallback routes */}
          <Route path="*" element={
            isLoggedIn ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          } />
        </Routes>
      </AuthWrapper>
    </Router>
  );
}

export default App;
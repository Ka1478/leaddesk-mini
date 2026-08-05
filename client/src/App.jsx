import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import AdminPage from './components/AdminPage';
import LoginPage from './components/LoginPage';
import Footer from './components/Footer';

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname || '/');
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('leaddesk_token') || null);
  const [toast, setToast] = useState(null);

  // Auto clear toast after 4s
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Sync route on popstate
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Simple client-side router navigate function
  const navigate = (path) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  // Check auth session on load
  useEffect(() => {
    const checkAuth = async () => {
      if (!token) return;
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok && data.user) {
          setUser(data.user);
        } else {
          // Token expired or invalid
          localStorage.removeItem('leaddesk_token');
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.error('Session check failed:', err);
      }
    };

    checkAuth();
  }, [token]);

  const handleLogin = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('leaddesk_token', authToken);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      // Ignore network errors on logout
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('leaddesk_token');
    setToast({ type: 'info', text: 'You have logged out successfully.' });
    navigate('/');
  };

  return (
    <div className="app-root" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar currentPath={currentPath} navigate={navigate} user={user} onLogout={handleLogout} />

      <main style={{ flex: 1 }}>
        {currentPath === '/' && <LandingPage setToast={setToast} />}

        {currentPath === '/admin' && (
          user ? (
            <AdminPage user={user} setToast={setToast} token={token} />
          ) : (
            <LoginPage onLogin={handleLogin} setToast={setToast} navigate={navigate} />
          )
        )}

        {currentPath === '/login' && (
          <LoginPage onLogin={handleLogin} setToast={setToast} navigate={navigate} />
        )}
      </main>

      <Footer />

      {/* Global Toast Notification */}
      {toast && (
        <div className="toast">
          <span>{toast.text}</span>
        </div>
      )}
    </div>
  );
}

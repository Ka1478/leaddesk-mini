import React from 'react';

export default function Navbar({ currentPath, navigate, user, onLogout }) {
  return (
    <header className="navbar">
      <div className="container nav-container">
        <div 
          className="brand-logo"
          onClick={() => navigate('/')}
          style={{ cursor: 'pointer' }}
        >
          <span className="logo-main">LEADDESK</span>
          <span className="logo-accent">MINI</span>
        </div>

        <div>
          {currentPath === '/admin' ? (
            user ? (
              <button 
                className="admin-link" 
                onClick={onLogout}
                style={{ background: 'transparent' }}
              >
                Logout ({user.email.split('@')[0]}) →
              </button>
            ) : (
              <button 
                className="admin-link" 
                onClick={() => navigate('/')}
                style={{ background: 'transparent' }}
              >
                ← Back to Home
              </button>
            )
          ) : (
            <button 
              className="admin-link" 
              onClick={() => navigate('/admin')}
              style={{ background: 'transparent' }}
            >
              Admin →
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

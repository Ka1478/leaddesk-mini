import React, { useState } from 'react';
import { Shield, Mail, Lock, KeyRound, AlertCircle, ArrowRight } from 'lucide-react';

export default function LoginPage({ onLogin, setToast, navigate }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please provide both email and password');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const responseText = await res.text();
      let data = {};
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (e) {}

      if (!res.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      onLogin(data.user, data.token);
      setToast({ type: 'success', text: '🔐 Welcome back, Admin!' });
      navigate('/admin');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemoCredentials = () => {
    setEmail('admin@leaddesk.com');
    setPassword('AdminPass123!');
    setError(null);
  };

  return (
    <div className="container" style={{ padding: '5rem 1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div 
        style={{
          width: '100%',
          maxWidth: '460px',
          background: 'var(--bg-surface)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '2.8rem 2.4rem',
          boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, transparent 0%, var(--accent-gold) 50%, transparent 100%)',
          }}
        />

        <div style={{ textAlign: 'center', marginBottom: '2.2rem' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'rgba(217, 119, 6, 0.12)',
              border: '1px solid rgba(217, 119, 6, 0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
              color: 'var(--accent-gold)',
            }}
          >
            <Shield size={26} />
          </div>

          <div className="eyebrow-tag" style={{ justifyContent: 'center', marginBottom: '0.4rem' }}>
            PORTAL ACCESS
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 800, color: '#ffffff' }}>
            Admin Login
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: '0.4rem' }}>
            Sign in to manage lead tickets and pipeline status.
          </p>
        </div>

        {/* Demo Credentials Box */}
        <div
          style={{
            background: 'rgba(217, 119, 6, 0.06)',
            border: '1px solid rgba(217, 119, 6, 0.2)',
            borderRadius: '10px',
            padding: '1rem 1.1rem',
            marginBottom: '1.8rem',
            fontSize: '0.85rem',
          }}
        >
          <div style={{ fontWeight: 700, color: 'var(--accent-gold-light)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <KeyRound size={15} /> Test Admin Credentials:
          </div>
          <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', lineHeight: '1.6' }}>
            Email: <span style={{ color: '#ffffff' }}>admin@leaddesk.com</span><br />
            Password: <span style={{ color: '#ffffff' }}>AdminPass123!</span>
          </div>
          <button
            type="button"
            style={{
              width: '100%',
              marginTop: '0.75rem',
              padding: '0.5rem',
              fontSize: '0.82rem',
              fontWeight: 700,
              color: '#ffffff',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onClick={fillDemoCredentials}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(217, 119, 6, 0.2)';
              e.currentTarget.style.borderColor = 'rgba(217, 119, 6, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
            }}
          >
            Auto-fill Test Credentials
          </button>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(225, 29, 72, 0.12)',
              border: '1px solid rgba(225, 29, 72, 0.3)',
              color: '#f43f5e',
              padding: '0.85rem 1rem',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              fontSize: '0.88rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
            }}
          >
            <AlertCircle size={18} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.4rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }} htmlFor="admin-email">
              Admin Email
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '1.1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                type="email"
                id="admin-email"
                autoComplete="username"
                placeholder="admin@leaddesk.com"
                style={{
                  width: '100%',
                  padding: '0.9rem 1.1rem 0.9rem 2.9rem',
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '10px',
                  color: '#ffffff',
                  fontSize: '0.95rem',
                  transition: 'all 0.25s ease',
                }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.8rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }} htmlFor="admin-password">
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '1.1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                type="password"
                id="admin-password"
                autoComplete="current-password"
                placeholder="••••••••••••"
                style={{
                  width: '100%',
                  padding: '0.9rem 1.1rem 0.9rem 2.9rem',
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '10px',
                  color: '#ffffff',
                  fontSize: '0.95rem',
                  transition: 'all 0.25s ease',
                }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '1.1rem',
              background: '#11141b',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#ffffff',
              fontSize: '0.98rem',
              fontWeight: 700,
              letterSpacing: 0.05,
              borderRadius: '10px',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.6rem',
              transition: 'all 0.25s ease',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
            }}
            disabled={isSubmitting}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#232733';
              e.currentTarget.style.borderColor = 'rgba(217, 119, 6, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#11141b';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
            }}
          >
            {isSubmitting ? (
              'Authenticating...'
            ) : (
              <>
                Sign In to Admin Portal <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

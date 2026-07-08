import React, { useState } from 'react';
import { supabase } from '../config/supabaseClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMessage, faEye, faEyeSlash, faCheckCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons';

export default function Login() {
  const [isSignUpMode, setIsSignUpMode] = useState(false); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // Eye Toggle State
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const triggerNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    if (isSignUpMode) {
      const { error } = await supabase.auth.signUp({ email, password });
      setLoading(false);
      if (error) {
        triggerNotification(error.message, 'error');
      } else {
        triggerNotification('Sign-up successful! Please check your email to confirm.', 'success');
        setIsSignUpMode(false); 
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) {
        triggerNotification(error.message, 'error');
      } else {
        triggerNotification('Logged in successfully.', 'success');
      }
    }
  };

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh',
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      background: 'var(--bg)',
      fontFamily: 'var(--sans)',
      margin: 0, 
      padding: '24px', 
      boxSizing: 'border-box',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Toast Alert Banner Element */}
      <AnimatePresence>
        {notification && (
          <div style={{
            position: 'absolute',
            top: '24px',
            padding: '12px 24px',
            borderRadius: '16px',
            background: notification.type === 'error' ? 'var(--danger)' : 'var(--success)',
            color: '#ffffff',
            fontWeight: '600',
            fontSize: '14px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'thuFadeIn 0.3s cubic-bezier(0.2, 0, 0, 1) forwards'
          }}>
            <FontAwesomeIcon icon={notification.type === 'error' ? faTimesCircle : faCheckCircle} />
            <span>{notification.msg}</span>
          </div>
        )}
      </AnimatePresence>
      
      {/* iOS Premium Card Block */}
      <div style={{ 
        width: '100%', 
        maxWidth: '380px', 
        background: 'var(--card)', 
        padding: '40px 30px', 
        borderRadius: '24px', 
        boxShadow: '0 12px 40px rgba(0,0,0,0.5)', 
        border: '1px solid var(--border)', 
        textAlign: 'center', 
        boxSizing: 'border-box', 
        zIndex: 10 
      }}>
        {/* App Branding Icon Container */}
        <div style={{ 
          width: '64px', 
          height: '64px', 
          background: '#007aff', 
          borderRadius: '18px', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          margin: '0 auto 20px auto', 
          boxShadow: '0 8px 20px rgba(0,122,255,0.25)' 
        }}>
          <FontAwesomeIcon icon={faMessage} style={{ color: '#ffffff', fontSize: '26px' }} />
        </div>

        <h2 style={{ color: 'var(--text-h)', margin: '0 0 8px 0', fontSize: '24px', fontWeight: '700', letterSpacing: '-0.5px', fontFamily: 'var(--heading)' }}>
          {isSignUpMode ? 'Create Account' : 'Welcome to Imaginary talK'}
        </h2>
        <p style={{ color: 'var(--text)', margin: '0 0 32px 0', fontSize: '14px', fontWeight: '400' }}>
          {isSignUpMode ? 'Sign up to start chatting' : 'Sign in securely'}
        </p>

        {/* Credentials Form Submission Module */}
        <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input 
            type="email" 
            placeholder="Email Address" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            style={{ 
              width: '100%', 
              padding: '14px 16px', 
              background: 'var(--bg)', 
              border: '1px solid var(--border)', 
              borderRadius: '14px', 
              color: 'var(--text-h)', 
              fontSize: '15px', 
              outline: 'none', 
              boxSizing: 'border-box',
              fontFamily: 'var(--sans)',
              transition: 'border-color 0.2s'
            }}
          />
          
          {/* Password Field Integration with Absolute Eye Toggle */}
          <div style={{ position: 'relative', width: '100%' }}>
            <input 
              type={showPassword ? 'text' : 'password'} 
              placeholder="Account Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              style={{ 
                width: '100%', 
                padding: '14px 45px 14px 16px', 
                background: 'var(--bg)', 
                border: '1px solid var(--border)', 
                borderRadius: '14px', 
                color: 'var(--text-h)', 
                fontSize: '15px', 
                outline: 'none', 
                boxSizing: 'border-box',
                fontFamily: 'var(--sans)',
                transition: 'border-color 0.2s'
              }}
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{ 
                position: 'absolute', 
                right: '14px', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                background: 'none', 
                border: 'none', 
                color: 'var(--text)', 
                cursor: 'pointer', 
                fontSize: '16px',
                outline: 'none',
                padding: 0
              }}
            >
              <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
            </button>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              width: '100%', 
              padding: '15px', 
              background: '#007aff', 
              color: '#ffffff', 
              border: 'none', 
              borderRadius: '14px', 
              cursor: 'pointer', 
              fontWeight: '600', 
              fontSize: '15px', 
              marginTop: '8px', 
              opacity: loading ? 0.7 : 1,
              transition: 'opacity 0.2s, background-color 0.2s',
              fontFamily: 'var(--sans)'
            }}
          >
            {loading ? 'Processing...' : isSignUpMode ? 'Sign Up' : 'Log In'}
          </button>
        </form>

        {/* Toggle Mode Gateway Link */}
        <button 
          onClick={() => setIsSignUpMode(!isSignUpMode)} 
          disabled={loading}
          style={{ 
            width: '100%', 
            marginTop: '20px', 
            padding: '12px', 
            background: 'transparent', 
            color: '#007aff', 
            border: '1px solid var(--border)', 
            borderRadius: '14px', 
            cursor: 'pointer', 
            fontWeight: '600', 
            fontSize: '14px',
            fontFamily: 'var(--sans)',
            transition: 'background-color 0.2s, border-color 0.2s'
          }}
        >
          {isSignUpMode ? 'Already have an account? Log In' : 'New to ItalK? Create Account'}
        </button>
      </div>
    </div>
  );
}
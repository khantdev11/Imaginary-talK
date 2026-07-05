import React, { useState, useEffect } from 'react';
import { supabase } from './config/supabaseClient'; 
import Login from './components/Login';
import ChatRoom from './components/ChatRoom';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // True Full Screen Layout System Dynamic Injection
    const styleTag = document.createElement("style");
    styleTag.innerHTML = `
      html, body, #root {
        margin: 0 !important;
        padding: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        overflow: hidden !important;
        background-color: #000000 !important;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
      }
      ::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }
      ::-webkit-scrollbar-track {
        background: transparent;
      }
      ::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.12);
        border-radius: 10px;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.25);
      }
    `;
    document.head.appendChild(styleTag);

    // Synchronize Core Active Session
    const checkActiveSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      } catch (error) {
        console.error("Authentication handshake drop:", error);
      } finally {
        // App loading delay optimize
        setTimeout(() => setLoading(false), 400);
      }
    };

    checkActiveSession();

    // Live Subscription Listening State to Handle Logins/Logouts Autonomously
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
      if (document.head.contains(styleTag)) {
        document.head.removeChild(styleTag);
      }
    };
  }, []);

  return (
    <div style={{ 
      width: '100vw',
      height: '100vh',
      background: '#000000', 
      overflow: 'hidden',
      position: 'relative',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <AnimatePresence mode="wait">
        {loading ? (
          /* 🔄 PREMIUM MICRO-ANIMATION FLUID LOADING SCREEN */
          <motion.div 
            key="loading-screen"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100vh', 
              width: '100vw',
              background: '#000000',
              gap: '20px',
              position: 'absolute',
              zIndex: 9999
            }}
          >
            {/* Smooth Spring Accelerated Loading Spinner */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
              style={{
                width: '36px',
                height: '36px',
                border: '3.5px solid rgba(255, 255, 255, 0.08)',
                borderTop: '3.5px solid #007aff', // Premium iOS Active Blue Accent
                borderRadius: '50%'
              }}
            />
            
            <motion.h3 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              style={{ 
                fontSize: '13.5px', 
                fontWeight: '600', 
                letterSpacing: '-0.1px', 
                color: '#8e8e93',
                margin: 0
              }}
            >
              Connecting to ThuTalk Secure Channel...
            </motion.h3>
          </motion.div>
        ) : user ? (
          /* 📱 CHATROOM CONTAINER VIEWSPACE */
          <motion.div 
            key="chatroom-view"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
            style={{ width: '100%', height: '100%' }}
          >
            <ChatRoom currentUser={user} />
          </motion.div>
        ) : (
          /* 🔐 AUTHENTICATION GATEWAY GATEWAY */
          <motion.div 
            key="login-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{ width: '100%', height: '100%' }}
          >
            <Login />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
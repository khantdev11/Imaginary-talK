import React, { useState, useEffect } from 'react';
import { supabase } from './config/supabaseClient'; 
import Login from './components/Login';
import ChatRoom from './components/ChatRoom';
import { motion, AnimatePresence } from 'framer-motion';
// Firebase messaging ခေါ်သုံးရန်
import { requestNotificationPermission } from './config/firebaseClient';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. CSS Injections for Full Screen Layout
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
      @keyframes thu-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    `;
    document.head.appendChild(styleTag);

    // 2. Authentication Session Sync
    const checkActiveSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        // Login ဝင်ထားပြီးသားဆိုရင် Notification Permission ချက်ချင်းတောင်းမည်
        if (currentUser) {
          requestNotificationPermission(currentUser.id);
        }
      } catch (error) {
        console.error("Auth sync error:", error);
      } finally {
        setLoading(false);
      }
    };

    checkActiveSession();

    // 3. Auth Listener for Real-time state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);
      if (newUser) {
        requestNotificationPermission(newUser.id);
      }
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
          /* 🔄 FLUID LOADING ANIMATION */
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ 
              display: 'flex', flexDirection: 'column',
              justifyContent: 'center', alignItems: 'center', 
              height: '100vh', width: '100vw',
              background: '#000000', gap: '20px',
              position: 'absolute', zIndex: 9999
            }}
          >
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
              style={{
                width: '36px', height: '36px',
                border: '3.5px solid rgba(255, 255, 255, 0.08)',
                borderTop: '3.5px solid #007aff',
                borderRadius: '50%'
              }}
            />
            <h3 style={{ fontSize: '13px', color: '#8e8e93', margin: 0 }}>Connecting Secure Channel...</h3>
          </motion.div>
        ) : user ? (
          /* 📱 CHATROOM SCREEN */
          <motion.div 
            key="chat"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            style={{ width: '100%', height: '100%' }}
          >
            <ChatRoom currentUser={user} />
          </motion.div>
        ) : (
          /* 🔐 LOGIN SCREEN */
          <motion.div 
            key="login"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
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
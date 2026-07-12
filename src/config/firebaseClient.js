import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { supabase } from "./supabaseClient";

// Firebase App Configuration Network Metadata Context
const firebaseConfig = {
  apiKey: "AIzaSyCha_s66bMJxd9piHA5b21F7QZRmRSAi6k",
  authDomain: "thutalk-f47a5.firebaseapp.com",
  projectId: "thutalk-f47a5",
  storageBucket: "thutalk-f47a5.firebasestorage.app",
  messagingSenderId: "608395898549",
  appId: "1:608395898549:web:8671c236e8c3d923a1d8fc"
};

// Initialize Firebase Core Engine Sockets
const app = initializeApp(firebaseConfig);

// Export Web Messaging Encryption Channel Instance
export const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;

export const registerFirebaseServiceWorker = async () => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.warn('FCM Service Worker: serviceWorker API is not available in this runtime.');
    return null;
  }
  try {
    return await navigator.serviceWorker.register('/firebase-messaging-sw.js');
  } catch (error) {
    console.error('FCM Service Worker registration failed:', error);
    return null;
  }
};

/**
 * Request Native Web Notification Permissions via User Gesture Trigger Protocol
 * @param {string} userId - Current Authenticated Supabase User Unique Identifier ID
 */
export const requestNotificationPermission = async (userId) => {
  // ၁။ User ID control check parameters မပါလာပါက console error ချပြီး execution blocks ဖြတ်မည်
  if (!userId) {
    console.warn("FCM Telemetry: User ID parameter reference is missing.");
    return;
  }

  // ၂။ Server Side Rendering (SSR) သို့မဟုတ် Window interface environment မရှိပါက block လုပ်မည်
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn("FCM Telemetry: Native Web Notification API is not supported in this runtime client.");
    return;
  }

  try {
    // ၃။ Active user gesture interface thread မှ Permission request စတင်တောင်းခံခြင်း
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log("FCM Encryption Sockets: Notification permission interface granted.");
      
      if (!messaging) return;

      // ၄။ Secure Firebase Messaging Device Registration Token (FCM Token) ကို ဆွဲထုတ်ယူခြင်း
      const serviceWorkerRegistration = await registerFirebaseServiceWorker();
      const token = await getToken(messaging, { 
        vapidKey: 'BM7DFrbO5Y4a_lQK__W3BW9WiXVG1MMq5WT-WoYo-h3x24_j75wLH7PPQeZAnSJ1oGw-bgp2vZEb0Mx82gk3chg',
        serviceWorkerRegistration
      });
      
      if (token) {
        // ၅။ ရရှိလာတဲ့ Device registration dynamic token matrix ကို Supabase public profiles registry ledger ထဲသို့ synchronization လုပ်မည်
        const { error } = await supabase
          .from('profiles')
          .update({ fcm_token: token })
          .eq('id', userId);

        if (error) throw error;
        console.log("FCM Matrix: Notification web push token safely synchronized to Supabase Cloud Storage database pipeline.");
      } else {
        console.warn("FCM Matrix: Failed to retrieve secure registration token context link.");
      }
    } else {
      console.warn("FCM Encryption Sockets: Notification registration handshake refused by local client machine.");
    }
  } catch (error) {
    console.error("FCM Structural Pipeline Initialization Fault Exception:", error);
  }
};

export const listenForForegroundMessages = (callback) => {
  if (!messaging || typeof window === 'undefined') return () => {};
  return onMessage(messaging, (payload) => {
    if (typeof callback === 'function') callback(payload);
  });
};
import { initializeApp } from "firebase/app";
import { getMessaging, getToken } from "firebase/messaging";
import { supabase } from "./supabaseClient";

const firebaseConfig = {
  apiKey: "AIzaSyCha_s66bMJxd9piHA5b21F7QZRmRSAi6k",
  authDomain: "thutalk-f47a5.firebaseapp.com",
  projectId: "thutalk-f47a5",
  storageBucket: "thutalk-f47a5.firebasestorage.app",
  messagingSenderId: "608395898549",
  appId: "1:608395898549:web:8671c236e8c3d923a1d8fc"
};

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);

export const requestNotificationPermission = async (userId) => {
  if (!userId) {
    console.error("User ID is missing.");
    return;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, { 
        vapidKey: 'BM7DFrbO5Y4a_lQK__W3BW9WiXVG1MMq5WT-WoYo-h3x24_j75wLH7PPQeZAnSJ1oGw-bgp2vZEb0Mx82gk3chg' 
      });
      
      if (token) {
        await supabase
          .from('profiles')
          .update({ fcm_token: token })
          .eq('id', userId);
        console.log("FCM Notification token saved to Supabase!");
      }
    }
  } catch (error) {
    console.error("Notification initialization error:", error);
  }
};

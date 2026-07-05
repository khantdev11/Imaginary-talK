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

// Notification ခွင့်ပြုချက်တောင်းပြီး Token ကို Supabase ထဲသိမ်းမယ့် Function
export const requestNotificationPermission = async (userId) => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, { vapidKey: 'YOUR_VAPID_KEY' });
      
      // Token ကို Supabase User Profile ထဲသွားသိမ်းမယ်
      await supabase.from('profiles').update({ fcm_token: token }).eq('id', userId);
      console.log("Notification token saved!");
    }
  } catch (error) {
    console.error("Notification error:", error);
  }
};
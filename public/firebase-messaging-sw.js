importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// မင်းရဲ့ Firebase Project Settings ထဲက ID တွေကို ဒီမှာထည့်ပါ
firebase.initializeApp({
  apiKey: "AIzaSyCha_s66bMJxd9piHA5b21F7QZRmRSAi6k",
  authDomain: "thutalk-f47a5.firebaseapp.com",
  projectId: "thutalk-f47a5",
  storageBucket: "thutalk-f47a5.firebasestorage.app",
  messagingSenderId: "608395898549",
  appId: "1:608395898549:web:8671c236e8c3d923a1d8fc"
});

const messaging = firebase.messaging();

// Background မှာ Notification ဝင်လာရင် ပြပေးမယ့် Function
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.svg' // မင်းရဲ့ app icon လမ်းကြောင်း
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
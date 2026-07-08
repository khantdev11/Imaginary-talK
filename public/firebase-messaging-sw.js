importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Firebase Project Credentials Configuration Array
firebase.initializeApp({
  apiKey: "AIzaSyCha_s66bMJxd9piHA5b21F7QZRmRSAi6k",
  authDomain: "thutalk-f47a5.firebaseapp.com",
  projectId: "thutalk-f47a5",
  storageBucket: "thutalk-f47a5.firebasestorage.app",
  messagingSenderId: "608395898549",
  appId: "1:608395898549:web:8671c236e8c3d923a1d8fc"
});

const messaging = firebase.messaging();

// Background Layer မှာ Sockets Link ပိတ်ထားချိန် သို့မဟုတ် App အပြင်ရောက်နေချိန် Push Notification ပြသပေးမည့် နေရာ
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background data stream payload: ', payload);
  
  // ၁။ Payload ထဲက Title နဲ့ Body Content စာသားတွေကို Safe Extraction စနစ်တကျ ထုတ်ယူခြင်း
  const notificationTitle = payload.notification?.title || payload.data?.title || "ItalK Network Alert";
  
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || "New secure data packet stream transmitted.",
    icon: payload.notification?.icon || payload.data?.icon || '/favicon.svg', // App Icon Path
    badge: '/favicon.svg', // Android/Mobile Notification Status Bar အတွက် Badge Icon
    tag: payload.data?.room_id || 'italk-generic-notification', // Notification bubble တွေ တစ်ခုပေါ်တစ်ခု ထပ်မသွားအောင် ကာကွယ်ရန် unique tag ညှပ်ခြင်း
    renotify: true, // Notification အသစ်ဝင်လာရင် ဖုန်းကို တုန်ခါမှု/အသံ ပြန်ပေးရန်
    data: {
      click_action: payload.data?.click_action || payload.notification?.click_action || '/'
    }
  };

  // ၂။ Native Service Worker Core Thread မှတစ်ဆင့် Phone System / Desktop UI ပေါ်သို့ Out-of-App Push Notification တိုက်ရိုက်တွန်းတင်ပြသခြင်း
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// ၃။ Notification ကို User က နှိပ်လိုက်တဲ့အချိန်မှာ App (Website) ကို Auto ပွင့်လာစေပြီး Route Mapping လုပ်ပေးမည့် Event Listener 
self.addEventListener('notificationclick', (event) => {
  event.notification.close(); // ပွင့်လာတဲ့ notification box လေးကို ပိတ်ပေးမယ်

  const targetUrl = event.notification.data?.click_action || '/';

  // Active ဖြစ်နေတဲ့ window tab ရှိရင် အဲ့ဒီထဲမှာ ဖွင့်မယ်၊ မရှိရင် window အသစ် ဖွင့်ပေးမယ့် protocol logic
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
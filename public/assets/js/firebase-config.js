/**
 * Firebase Client Configuration
 * 
 * ⚠️ TEMPLATE - Cần thay bằng config thật từ Firebase Console.
 * 
 * Lấy config tại: Firebase Console > Project Settings > General > Your apps > Web app
 */

// TODO: Thay bằng config thật khi setup Firebase
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Kiểm tra Firebase SDK đã load chưa
if (typeof firebase !== 'undefined') {
  firebase.initializeApp(firebaseConfig);
  console.log('✅ Firebase Client SDK initialized');
} else {
  console.warn('⚠️ Firebase SDK chưa được load. Thêm script tags vào HTML.');
}

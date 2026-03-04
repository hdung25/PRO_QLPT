/**
 * Firebase Client Configuration
 * Project: Quản lý Nhà trọ
 * 
 * Firebase Console: https://console.firebase.google.com/project/quan-ly-nha-tro-a6d22
 */

const firebaseConfig = {
  apiKey: "AIzaSyA_OHKDYpILH1z-sOCUu-nSHdPW9vZ2AEg",
  authDomain: "quan-ly-nha-tro-a6d22.firebaseapp.com",
  projectId: "quan-ly-nha-tro-a6d22",
  storageBucket: "quan-ly-nha-tro-a6d22.firebasestorage.app",
  messagingSenderId: "361932304025",
  appId: "1:361932304025:web:75e05b00ac479073df9208",
  measurementId: "G-RCVGH111PG"
};

// Initialize Firebase (compat mode for browser)
if (typeof firebase !== 'undefined') {
  firebase.initializeApp(firebaseConfig);
  console.log('✅ Firebase Client SDK initialized - Project:', firebaseConfig.projectId);
} else {
  console.warn('⚠️ Firebase SDK chưa được load. Kiểm tra script tags trong HTML.');
}

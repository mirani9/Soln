/**
 * SENTINEL — Firebase Configuration
 * 
 * SETUP INSTRUCTIONS:
 * 1. Go to https://console.firebase.google.com
 * 2. Create a new project (or use existing)
 * 3. Enable Authentication (Email/Password + Google)
 * 4. Create a Realtime Database (start in test mode)
 * 5. Go to Project Settings → General → Your apps → Add web app
 * 6. Copy the config object and paste below
 */

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getDatabase, ref, onValue, push, set, update, query, orderByChild, limitToLast } from 'firebase/database';

// ─── Firebase Config ─────────────────────────────────────────────
// Replace with YOUR Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyAP9MaxuZvgb7kcTaedfJ4_fLGD6-rurls",
  authDomain: "sentinel-crisis-ai-f7492.firebaseapp.com",
  databaseURL: "https://sentinel-crisis-ai-f7492-default-rtdb.firebaseio.com",
  projectId: "sentinel-crisis-ai-f7492",
  storageBucket: "sentinel-crisis-ai-f7492.firebasestorage.app",
  messagingSenderId: "688205260430",
  appId: "1:688205260430:web:c808e60468b8ba58484bdf"
};

// ─── Initialize Firebase ─────────────────────────────────────────
let app, auth, database, googleProvider;
let firebaseEnabled = false;

try {
  if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    database = getDatabase(app);
    googleProvider = new GoogleAuthProvider();
    firebaseEnabled = true;
    console.log('✅ Firebase initialized');
  } else {
    console.warn('⚠️ Firebase not configured — using local mode. Update src/firebase/config.js with your credentials.');
  }
} catch (error) {
  console.error('Firebase init error:', error);
}

export {
  app,
  auth,
  database,
  googleProvider,
  firebaseEnabled,
  ref,
  onValue,
  push,
  set,
  update,
  query,
  orderByChild,
  limitToLast,
};

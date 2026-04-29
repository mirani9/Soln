/**
 * SENTINEL — Firebase Configuration
 * 
 * All Firebase credentials are loaded from environment variables.
 * See .env.example for the required variables.
 * 
 * SETUP:
 * 1. Copy .env.example to frontend/.env
 * 2. Fill in your Firebase project credentials
 * 3. Restart the dev server
 */

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getDatabase, ref, onValue, push, set, update, query, orderByChild, limitToLast } from 'firebase/database';

// ─── Firebase Config (loaded from environment variables) ─────────
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// ─── Initialize Firebase ─────────────────────────────────────────
let app, auth, database, googleProvider;
let firebaseEnabled = false;

try {
  if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "your_firebase_api_key_here") {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    database = getDatabase(app);
    googleProvider = new GoogleAuthProvider();
    firebaseEnabled = true;
    console.log('✅ Firebase initialized');
  } else {
    console.warn('⚠️ Firebase not configured — using local mode. Create frontend/.env with your credentials (see .env.example).');
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

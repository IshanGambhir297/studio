import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBqPHn9E5RReEbLXt_6JsTJKkIRQleR8MI",
  authDomain: "studio-4090709286-5832c.firebaseapp.com",
  projectId: "studio-4090709286-5832c",
  storageBucket: "studio-4090709286-5832c.firebasestorage.app",
  messagingSenderId: "54711138485",
  appId: "1:54711138485:web:7ec66b83c8e415ad33e6fc",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, googleProvider };

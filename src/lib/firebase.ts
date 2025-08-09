// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  projectId: "worksafe-ai-kogel",
  appId: "1:256398808652:web:81823c9c53440b56dd06e9",
  storageBucket: "worksafe-ai-kogel.firebasestorage.app",
  apiKey: "AIzaSyBgMgave8JnoDDWcV3x5RibHKUO2RinEj4",
  authDomain: "worksafe-ai-kogel.firebaseapp.com",
  measurementId: "",
  messagingSenderId: "256398808652"
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { db };

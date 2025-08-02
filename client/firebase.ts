import { getFirestore } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBqXH3X6u96pUDkWe-PqYALB7nNFOuSQQE",
  authDomain: "quickdesk-84a8b.firebaseapp.com",
  projectId: "quickdesk-84a8b",
  storageBucket: "quickdesk-84a8b.firebasestorage.app",
  messagingSenderId: "303438928800",
  appId: "1:303438928800:web:788598e556a5018ca322c5"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

export { auth, provider, signInWithPopup , db};
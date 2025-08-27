// firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBLiQf_NbqKJRW5F_pLjMOwzbNh84x7ARI",
  authDomain: "lan-party-scoreboard.firebaseapp.com",
  projectId: "lan-party-scoreboard",
  storageBucket: "lan-party-scoreboard.firebasestorage.app",
  messagingSenderId: "116193326168",
  appId: "1:116193326168:web:dd92824e1b9b6e9f88062d",
  measurementId: "G-R6TSK2S4Z4"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app); // ← C’est ça qu’il te manquait
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // <--- NOVO

const firebaseConfig = {
  apiKey: "AIzaSyAqA4wO8wk9oA5t-GsSgJm0dWNlGEuEr6Y",
  authDomain: "sys3-agenda.firebaseapp.com",
  projectId: "sys3-agenda",
  storageBucket: "sys3-agenda.firebasestorage.app",
  messagingSenderId: "602697434618",
  appId: "1:602697434618:web:11876e3f7da0d3dd2d1043"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app); // <--- Exportando a autenticação
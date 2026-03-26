import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAP4dH75GfO6QeVSeUQjNtDYDJVNsUriCA",
  authDomain: "agenda-gilmar-64bbc.firebaseapp.com",
  projectId: "agenda-gilmar-64bbc",
  storageBucket: "agenda-gilmar-64bbc.firebasestorage.app",
  messagingSenderId: "938069967558",
  appId: "1:938069967558:web:dbae1314432c965db00dc7"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

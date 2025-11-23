import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import {
  getReactNativePersistence,
  initializeAuth,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // ⬅️ NEW

// firebase/firebaseConfig.ts
const firebaseConfig = {
  apiKey: "AIzaSyDDpc8bE6iro1Awkwj_Ariz-y28en6-o6I",
  authDomain: "anisea-anime.firebaseapp.com",
  databaseURL: "https://anisea-anime.firebaseio.com",
  projectId: "anisea-anime",
  storageBucket: "anisea-anime.appspot.com", // ⬅️ INI YANG PENTING
  messagingSenderId: "178354570669",
  appId: "1:178354570669:web:fa781e3b6d4955cdce0d24",
  measurementId: "G-MQ55R1NEY0",
};


// --- Avoid double app init ---
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// --- React Native Auth with persistence ---
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// --- Firestore ---
export const db = getFirestore(app);

// --- Storage ---
export const storage = getStorage(app); // ⬅️ NEW

export default app;

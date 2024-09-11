// src/services/firebase.ts

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// TODO: Ganti dengan konfigurasi Firebase Anda
const firebaseConfig = {
  apiKey: "AIzaSyDX8goy2zIiOMBjWev3zNiZXmxK5E5W038",
  authDomain: "pilkosis-mosa.firebaseapp.com",
  projectId: "pilkosis-mosa",
  storageBucket: "pilkosis-mosa.appspot.com",
  messagingSenderId: "367877705611",
  appId: "1:367877705611:web:9b2dc9506fd3c8b26b698e"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);

// Inisialisasi Firestore
export const db = getFirestore(app);

// Inisialisasi Storage
export const storage = getStorage(app);
// src/services/firebase.ts

import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDX8goy2zIiOMBjWev3zNiZXmxK5E5W038",
  authDomain: "pilkosis-mosa.firebaseapp.com",
  databaseURL: "https://pilkosis-mosa-default-rtdb.asia-southeast1.firebasedatabase.app", 
  projectId: "pilkosis-mosa",
  storageBucket: "pilkosis-mosa.appspot.com",
  messagingSenderId: "367877705611",
  appId: "1:367877705611:web:2c962e30fa0257b06b698e",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const storage = getStorage(app);
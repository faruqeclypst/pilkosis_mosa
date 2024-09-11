// src/services/firebase.ts

import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDJc5VTrqjJ-55cHB1vm8II-7XquFkL7TE",
  authDomain: "webtestmosa.firebaseapp.com",
  databaseURL: "https://webtestmosa-default-rtdb.asia-southeast1.firebasedatabase.app", // Perbarui ini
  projectId: "webtestmosa",
  storageBucket: "webtestmosa.appspot.com",
  messagingSenderId: "615515289948",
  appId: "1:615515289948:web:00df3b2bfb28d6a243a999"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const storage = getStorage(app);
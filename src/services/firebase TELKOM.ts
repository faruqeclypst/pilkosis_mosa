// src/services/firebase.ts

import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAP4HjEYC7dxWDH8UkgBoGYOILf91FWVNE",
  authDomain: "pemos-telkom.firebaseapp.com",
  databaseURL: "https://pemos-telkom-default-rtdb.asia-southeast1.firebasedatabase.app", // Perbarui ini
  projectId: "pemos-telkom",
  storageBucket: "pemos-telkom.appspot.com",
  messagingSenderId: "171875754008",
  appId: "1:171875754008:web:8b16878237d1eb53f7a36d",
  measurementId: "G-4Z2MV3S4JS"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const storage = getStorage(app);
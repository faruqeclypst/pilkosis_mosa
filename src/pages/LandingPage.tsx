// src/pages/LandingPage.tsx

import React, { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import Hero from '../components/Hero';
import { SchoolInfo } from '../types';

const LandingPage: React.FC = () => {
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo>({ name: '', logo: '' });
  const [typedName, setTypedName] = useState('');

  useEffect(() => {
    // Mengambil informasi sekolah dari Firestore
    const fetchSchoolInfo = async () => {
      const schoolInfoRef = doc(db, 'schoolInfo', 'info');
      const docSnap = await getDoc(schoolInfoRef);
      if (docSnap.exists()) {
        setSchoolInfo(docSnap.data() as SchoolInfo);
      }
    };

    fetchSchoolInfo();
  }, []);

  useEffect(() => {
    // Efek mengetik untuk nama sekolah
    const typingSpeed = 100; // Kecepatan mengetik dalam milidetik

    const typeName = () => {
      if (!schoolInfo.name) return;
      let index = 0;
      const type = () => {
        if (index <= schoolInfo.name.length) {
          setTypedName(schoolInfo.name.slice(0, index));
          index++;
          setTimeout(type, typingSpeed);
        }
      };
      type();
    };

    typeName();

  }, [schoolInfo.name]);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500">
      <div className="flex-grow flex flex-col justify-center items-center px-4">
        <Hero 
          schoolName={typedName || schoolInfo.name} // Menggunakan schoolInfo.name sebagai fallback
          schoolLogo={schoolInfo.logo}
        />
      </div>
    </div>
  );
};

export default LandingPage;
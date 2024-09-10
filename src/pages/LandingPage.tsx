// src/pages/LandingPage.tsx

import React, { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import Hero from '../components/Hero';
import { SchoolInfo } from '../types';

const LandingPage: React.FC = () => {
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo>({ name: '', logo: '' });

  useEffect(() => {
    const fetchSchoolInfo = async () => {
      const schoolInfoRef = doc(db, 'schoolInfo', 'info');
      const docSnap = await getDoc(schoolInfoRef);
      if (docSnap.exists()) {
        setSchoolInfo(docSnap.data() as SchoolInfo);
      }
    };

    fetchSchoolInfo();
  }, []);

  return (
    <div>
      <Hero schoolName={schoolInfo.name} schoolLogo={schoolInfo.logo} />
    </div>
  );
};

export default LandingPage;
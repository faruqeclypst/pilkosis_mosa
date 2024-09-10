// src/components/admin/SchoolInfoSection.tsx

import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../services/firebase';
import { SchoolInfo } from '../../types';

interface SchoolInfoSectionProps {
  schoolInfo: SchoolInfo;
  setSchoolInfo: React.Dispatch<React.SetStateAction<SchoolInfo>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

const SchoolInfoSection: React.FC<SchoolInfoSectionProps> = ({ schoolInfo, setSchoolInfo, setError }) => {
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newSchoolLogo, setNewSchoolLogo] = useState<File | null>(null);

  const handleSchoolLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setNewSchoolLogo(file);
    }
  };

  const handleUpdateSchoolInfo = async () => {
    try {
      const schoolInfoRef = doc(db, 'schoolInfo', 'info');
      let logoUrl = schoolInfo.logo;

      if (newSchoolLogo) {
        const storageRef = ref(storage, `school/logo.${newSchoolLogo.name.split('.').pop()}`);
        await uploadBytes(storageRef, newSchoolLogo);
        logoUrl = await getDownloadURL(storageRef);
      }

      const updatedSchoolInfo: SchoolInfo = {
        name: newSchoolName || schoolInfo.name,
        logo: logoUrl
      };

      await setDoc(schoolInfoRef, updatedSchoolInfo, { merge: true });
      setSchoolInfo(updatedSchoolInfo);
      setNewSchoolName('');
      setNewSchoolLogo(null);
      console.log('School info updated successfully');
    } catch (err) {
      setError('Error updating school info: ' + (err as Error).message);
      console.error('Error updating school info:', err);
    }
  };

  return (
    <section id="school-info" className="admin-card">
      <h2 className="text-2xl font-semibold mb-4">Informasi Sekolah</h2>
      <div className="flex flex-col space-y-4">
        <input
          type="text"
          value={newSchoolName}
          onChange={(e) => setNewSchoolName(e.target.value)}
          placeholder="Nama Sekolah"
          className="admin-input"
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Logo Sekolah
          </label>
          <input
            type="file"
            onChange={handleSchoolLogoUpload}
            className="admin-input"
          />
        </div>
        {schoolInfo.logo && (
          <img 
            src={schoolInfo.logo} 
            alt="Logo Sekolah" 
            className="w-32 h-32 object-contain"
          />
        )}
        <button
          onClick={handleUpdateSchoolInfo}
          className="admin-btn admin-btn-primary"
        >
          Update Informasi Sekolah
        </button>
      </div>
      <p className="mt-2">Nama Sekolah Saat Ini: <span className="font-semibold">{schoolInfo.name}</span></p>
    </section>
  );
};

export default SchoolInfoSection;
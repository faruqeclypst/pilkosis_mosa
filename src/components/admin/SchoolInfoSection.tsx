// src/components/admin/SchoolInfoSection.tsx

import React, { useState, useEffect } from 'react';
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
  const [newSchoolName, setNewSchoolName] = useState(schoolInfo.name);
  const [newSchoolLogo, setNewSchoolLogo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(schoolInfo.logo);

  useEffect(() => {
    setNewSchoolName(schoolInfo.name);
    setPreviewUrl(schoolInfo.logo);
  }, [schoolInfo]);

  // Handle file upload and generate preview
  const handleSchoolLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setNewSchoolLogo(file);
      // Generate preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle updating school info
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
        name: newSchoolName,
        logo: logoUrl
      };

      await setDoc(schoolInfoRef, updatedSchoolInfo, { merge: true });
      setSchoolInfo(updatedSchoolInfo);
      setNewSchoolLogo(null);
      console.log('School info updated successfully');
    } catch (err) {
      setError('Error updating school info: ' + (err as Error).message);
      console.error('Error updating school info:', err);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 admin-card">
      {/* School Info Card */}
      <section className="admin-card">
        <h2 className="text-2xl font-semibold mb-4">Informasi Sekolah</h2>
        <div className="mb-4">
          <label htmlFor="schoolName" className="block text-sm font-medium text-gray-700 mb-2">
            Nama Sekolah
          </label>
          <input
            id="schoolName"
            type="text"
            value={newSchoolName}
            onChange={(e) => setNewSchoolName(e.target.value)}
            className="border rounded px-2 py-1 w-full"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="schoolLogo" className="block text-sm font-medium text-gray-700 mb-2">
            Logo Sekolah
          </label>
          <input
            id="schoolLogo"
            type="file"
            onChange={handleSchoolLogoUpload}
            className="border rounded px-2 py-1 w-full"
          />
        </div>
        <button
          onClick={handleUpdateSchoolInfo}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Update Informasi Sekolah
        </button>
        <p className="mt-4">Nama Sekolah Saat Ini: <span className="font-semibold">{schoolInfo.name}</span></p>
      </section>

      {/* Logo Preview Card */}
      <section className="admin-card">
        <h2 className="text-2xl font-semibold mb-4">Logo Sekolah</h2>
        <div className="flex items-center justify-center h-64">
          {previewUrl ? (
            <img 
              src={previewUrl} 
              alt="Preview Logo Sekolah" 
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <div className="text-gray-500">
              No logo uploaded
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default SchoolInfoSection;
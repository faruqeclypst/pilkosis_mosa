import React, { useState, useEffect } from 'react';
import { ref, set } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
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
    setPreviewUrl(schoolInfo.logo);
  }, [schoolInfo]);

  const handleSchoolLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setNewSchoolLogo(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateSchoolInfo = async () => {
    try {
      console.log('Updating school info...');
      const schoolInfoRef = ref(db, 'schoolInfo/info');
      let logoUrl = schoolInfo.logo;

      if (newSchoolLogo) {
        console.log('Uploading new logo...');
        const fileRef = storageRef(storage, `school/logo.${newSchoolLogo.name.split('.').pop()}`);
        await uploadBytes(fileRef, newSchoolLogo);
        logoUrl = await getDownloadURL(fileRef);
        console.log('New logo uploaded successfully:', logoUrl);
      }

      const updatedSchoolInfo: SchoolInfo = {
        name: newSchoolName,
        logo: logoUrl
      };

      console.log('Updating database with:', updatedSchoolInfo);
      await set(schoolInfoRef, updatedSchoolInfo);
      console.log('Database updated successfully');

      setSchoolInfo(updatedSchoolInfo);
      console.log('Local state updated with:', updatedSchoolInfo);

      setNewSchoolLogo(null);
      console.log('School info update completed');
    } catch (err) {
      const errorMessage = 'Error updating school info: ' + (err as Error).message;
      setError(errorMessage);
      console.error(errorMessage, err);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 admin-card">
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

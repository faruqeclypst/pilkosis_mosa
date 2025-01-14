import React, { useState, useEffect } from 'react';
import { ref, set } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../services/firebase';
import { SchoolInfo } from '../../types';
import { FaSchool, FaUpload } from 'react-icons/fa';

interface SchoolInfoSectionProps {
  schoolInfo: SchoolInfo;
  setSchoolInfo: React.Dispatch<React.SetStateAction<SchoolInfo>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

const SchoolInfoSection: React.FC<SchoolInfoSectionProps> = ({ schoolInfo, setSchoolInfo, setError }) => {
  const [newSchoolName, setNewSchoolName] = useState(schoolInfo.name);
  const [newSchoolLogo, setNewSchoolLogo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(schoolInfo.logo);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setPreviewUrl(schoolInfo.logo);
  }, [schoolInfo]);

  const handleSchoolLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Ukuran file terlalu besar. Maksimal 5MB');
        return;
      }
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
      setIsUpdating(true);
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

      await set(schoolInfoRef, updatedSchoolInfo);
      setSchoolInfo(updatedSchoolInfo);
      setNewSchoolLogo(null);
      
      // Show success message or notification here if needed
    } catch (err) {
      const errorMessage = 'Error updating school info: ' + (err as Error).message;
      setError(errorMessage);
      console.error(errorMessage, err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div id="school-info" className="p-4 md:p-6">
      <div className="flex items-center gap-3 mb-6">
        <FaSchool className="text-2xl text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-800">Informasi Sekolah</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
        {/* Form Section */}
        <div className="space-y-4">
          <div>
            <label htmlFor="schoolName" className="block text-sm font-medium text-gray-700 mb-2">
              Nama Sekolah
            </label>
            <input
              id="schoolName"
              type="text"
              value={newSchoolName}
              onChange={(e) => setNewSchoolName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Masukkan nama sekolah"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logo Sekolah
            </label>
            <div 
              className="mt-1 flex flex-col items-center justify-center px-4 py-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-500 transition-colors cursor-pointer"
              onClick={() => document.getElementById('schoolLogo')?.click()}
            >
              <div className="space-y-2 text-center">
                <FaUpload className="mx-auto h-8 w-8 text-gray-400" />
                <div className="text-sm text-gray-600">
                  <label htmlFor="schoolLogo" className="relative cursor-pointer text-blue-600 hover:text-blue-500">
                    <span>Upload file</span>
                    <input
                      id="schoolLogo"
                      type="file"
                      accept="image/*"
                      onChange={handleSchoolLogoUpload}
                      className="sr-only"
                    />
                  </label>
                  <p className="text-gray-500 mt-1">atau drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">
                  PNG, JPG, GIF up to 5MB
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleUpdateSchoolInfo}
            disabled={isUpdating}
            className="mobile-button w-full bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
          >
            {isUpdating ? 'Memperbarui...' : 'Update'}
          </button>
        </div>

        {/* Preview Section */}
        <div className="bg-gray-50 rounded-xl p-4 md:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Preview Logo</h3>
          <div className="aspect-square w-full max-w-sm mx-auto rounded-xl border border-gray-200 bg-white flex items-center justify-center overflow-hidden">
            {previewUrl ? (
              <img 
                src={previewUrl} 
                alt="Preview Logo Sekolah" 
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <div className="text-gray-400 text-center">
                <FaSchool className="mx-auto h-12 w-12 mb-2" />
                <p>Belum ada logo</p>
              </div>
            )}
          </div>
          <p className="mt-4 text-sm text-gray-600 text-center">
            Nama Sekolah Saat Ini: <span className="font-medium text-gray-900">{schoolInfo.name}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SchoolInfoSection;                 

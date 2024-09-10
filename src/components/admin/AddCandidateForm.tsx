// src/components/admin/AddCandidateForm.tsx

import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { compressAndConvertToWebP } from '../../utils/imageUtils';
import { uploadImageToFirebase } from '../../utils/firebaseUtils';

interface AddCandidateFormProps {
  setIsAddingNewCandidate: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

const AddCandidateForm: React.FC<AddCandidateFormProps> = ({ setIsAddingNewCandidate, setError }) => {
  const [newCandidate, setNewCandidate] = useState({
    name: '',
    kelas: '',
    vision: '',
    mission: '',
    photoUrl: '',
  });
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      setError(null);
      try {
        const preview = URL.createObjectURL(file);
        setPreviewUrl(preview);

        const processedFile = await compressAndConvertToWebP(file);
        console.log('File compressed:', processedFile);

        const downloadURL = await uploadImageToFirebase(processedFile, `candidates/${processedFile.name}`);
        console.log('File uploaded, URL:', downloadURL);

        setNewCandidate(prev => ({ ...prev, photoUrl: downloadURL }));
      } catch (err) {
        console.error('Error in upload process:', err);
        setError('Error uploading file: ' + (err as Error).message);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleAddCandidate = async () => {
    if (!newCandidate.name || !newCandidate.photoUrl) {
      setError('Nama dan foto kandidat harus diisi');
      return;
    }
    try {
      await addDoc(collection(db, 'candidates'), { 
        ...newCandidate, 
        voteCount: 0 
      });
      console.log('New candidate added with photo URL:', newCandidate.photoUrl);
      setNewCandidate({ name: '', kelas: '', vision: '', mission: '', photoUrl: '' });
      setPreviewUrl(null);
      setError(null);
      setIsAddingNewCandidate(false);
    } catch (err) {
      setError('Error adding candidate: ' + (err as Error).message);
    }
  };

  return (
    <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">Tambah Calon Baru</h3>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="col-span-2 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Nama"
              value={newCandidate.name}
              onChange={(e) => setNewCandidate({ ...newCandidate, name: e.target.value })}
              className="admin-input"
            />
            <input
              type="text"
              placeholder="Kelas"
              value={newCandidate.kelas}
              onChange={(e) => setNewCandidate({ ...newCandidate, kelas: e.target.value })}
              className="admin-input"
            />
          </div>
          <textarea
            placeholder="Visi"
            value={newCandidate.vision}
            onChange={(e) => setNewCandidate({ ...newCandidate, vision: e.target.value })}
            className="admin-textarea"
          />
          <textarea
            placeholder="Misi"
            value={newCandidate.mission}
            onChange={(e) => setNewCandidate({ ...newCandidate, mission: e.target.value })}
            className="admin-textarea"
          />
        </div>
        <div>
          <input
            type="file"
            onChange={handleFileUpload}
            className="admin-input mb-2"
            disabled={isUploading}
          />
          {isUploading && <p className="text-sm text-gray-600">Uploading...</p>}
          {previewUrl && (
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="w-full h-auto object-cover rounded-md"
            />
          )}
        </div>
      </div>
      <div className="flex justify-end space-x-2">
        <button
          onClick={() => setIsAddingNewCandidate(false)}
          className="admin-btn admin-btn-secondary"
        >
          Batal
        </button>
        <button
          onClick={handleAddCandidate}
          className="admin-btn admin-btn-primary"
          disabled={isUploading}
        >
          Tambah Calon
        </button>
      </div>
    </div>
  );
};

export default AddCandidateForm;
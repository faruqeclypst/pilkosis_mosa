// src/components/admin/CandidateList.tsx

import React, { useState, useRef } from 'react';
import { Candidate } from '../../types';
import { ref, set, push, update } from 'firebase/database';
import { db } from '../../services/firebase';
import { uploadImageToFirebase } from '../../utils/firebaseUtils';
import { compressAndConvertToWebP } from '../../utils/imageUtils';
import { FaUsers, FaEdit, FaTrash, FaImage } from 'react-icons/fa';

interface CandidateListProps {
  candidates: Candidate[];
  onDelete: (candidate: Candidate) => void;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

const CandidateList: React.FC<CandidateListProps> = ({ 
  candidates, 
  onDelete, 
  setError, 
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedCandidate, setEditedCandidate] = useState<Candidate | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newCandidate, setNewCandidate] = useState<Omit<Candidate, 'id' | 'voteCount'>>({
    name: '',
    kelas: '',
    vision: '',
    mission: '',
    photoUrl: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpdateCandidate = async (id: string, data: Partial<Candidate>) => {
    try {
      await update(ref(db, `candidates/${id}`), data);
      setEditingId(null);
      setEditedCandidate(null);
    } catch (err) {
      setError('Error updating candidate: ' + (err as Error).message);
    }
  };

  const handlePhotoClick = (candidateId: string) => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
      fileInputRef.current.setAttribute('data-candidate-id', candidateId);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const candidateId = event.target.getAttribute('data-candidate-id');
    if (file && candidateId) {
      try {
        const processedFile = await compressAndConvertToWebP(file);
        const downloadURL = await uploadImageToFirebase(processedFile, `candidates/${candidateId}/${processedFile.name}`);
        if (candidateId === 'new') {
          setNewCandidate(prev => ({ ...prev, photoUrl: downloadURL }));
        } else {
          await handleUpdateCandidate(candidateId, { photoUrl: downloadURL });
        }
      } catch (err) {
        setError('Error updating candidate photo: ' + (err as Error).message);
      }
    }
  };

  const startEditing = (candidate: Candidate) => {
    setEditingId(candidate.id);
    setEditedCandidate({ ...candidate });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditedCandidate(null);
  };

  const saveEditing = () => {
    if (editedCandidate) {
      handleUpdateCandidate(editedCandidate.id, editedCandidate);
    }
  };

  const handleAddNewCandidate = async () => {
    try {
      const newCandidateRef = push(ref(db, 'candidates'));
      await set(newCandidateRef, {
        ...newCandidate,
        voteCount: 0
      });
      setIsAddingNew(false);
      setNewCandidate({
        name: '',
        kelas: '',
        vision: '',
        mission: '',
        photoUrl: '',
      });
    } catch (err) {
      setError('Error adding new candidate: ' + (err as Error).message);
    }
  };

  return (
    <section id="candidates" className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FaUsers className="text-2xl text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-800">Daftar Calon</h2>
        </div>
        <button
          onClick={() => setIsAddingNew(true)}
          className="mobile-button inline-flex items-center bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Tambah
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Foto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kelas</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visi</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Misi</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isAddingNew && (
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">New</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div 
                      onClick={() => handlePhotoClick('new')}
                      className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
                    >
                      {newCandidate.photoUrl ? (
                        <img src={newCandidate.photoUrl} alt="New candidate" className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <FaImage className="text-gray-400 text-xl" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="text"
                      value={newCandidate.name}
                      onChange={(e) => setNewCandidate(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nama"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="text"
                      value={newCandidate.kelas}
                      onChange={(e) => setNewCandidate(prev => ({ ...prev, kelas: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Kelas"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      value={newCandidate.vision}
                      onChange={(e) => setNewCandidate(prev => ({ ...prev, vision: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Visi"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      value={newCandidate.mission}
                      onChange={(e) => setNewCandidate(prev => ({ ...prev, mission: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Misi"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <button 
                        onClick={handleAddNewCandidate}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Simpan
                      </button>
                      <button 
                        onClick={() => setIsAddingNew(false)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Batal
                      </button>
                    </div>
                  </td>
                </tr>
              )}
              {candidates.map((candidate, index) => (
                <tr key={candidate.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div 
                      onClick={() => handlePhotoClick(candidate.id)}
                      className="w-12 h-12 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      <img 
                        src={candidate.photoUrl} 
                        alt={candidate.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === candidate.id ? (
                      <input
                        type="text"
                        value={editedCandidate?.name || ''}
                        onChange={(e) => setEditedCandidate({ ...editedCandidate!, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <span className="text-sm text-gray-900">{candidate.name}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === candidate.id ? (
                      <input
                        type="text"
                        value={editedCandidate?.kelas || ''}
                        onChange={(e) => setEditedCandidate({ ...editedCandidate!, kelas: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <span className="text-sm text-gray-900">{candidate.kelas}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === candidate.id ? (
                      <input
                        value={editedCandidate?.vision || ''}
                        onChange={(e) => setEditedCandidate({ ...editedCandidate!, vision: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <span className="text-sm text-gray-900">{candidate.vision}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === candidate.id ? (
                      <input
                        value={editedCandidate?.mission || ''}
                        onChange={(e) => setEditedCandidate({ ...editedCandidate!, mission: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <span className="text-sm text-gray-900">{candidate.mission}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {editingId === candidate.id ? (
                      <div className="flex space-x-2">
                        <button 
                          onClick={saveEditing}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Simpan
                        </button>
                        <button 
                          onClick={cancelEditing}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => startEditing(candidate)}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <FaEdit className="mr-1" />
                          Edit
                        </button>
                        <button 
                          onClick={() => onDelete(candidate)}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <FaTrash className="mr-1" />
                          Hapus
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
      />
    </section>
  );
};

export default CandidateList;
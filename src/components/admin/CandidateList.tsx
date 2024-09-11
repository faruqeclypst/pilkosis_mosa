// src/components/admin/CandidateList.tsx

import React, { useState, useRef } from 'react';
import { Candidate } from '../../types';
import { ref, set, push, update } from 'firebase/database';
import { db } from '../../services/firebase';
import { uploadImageToFirebase } from '../../utils/firebaseUtils';
import { compressAndConvertToWebP } from '../../utils/imageUtils';
import '../../assets/css/AdminTable.css';

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
    <section id="candidates" className="admin-card">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Daftar Calon</h2>
        <button
          onClick={() => setIsAddingNew(true)}
          className="admin-btn admin-btn-primary"
        >
          Tambah Calon
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="admin-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Foto</th>
              <th>Nama</th>
              <th>Kelas</th>
              <th>Visi</th>
              <th>Misi</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {isAddingNew && (
              <tr>
                <td>New</td>
                <td>
                  <div className="photo-container" onClick={() => handlePhotoClick('new')}>
                    {newCandidate.photoUrl ? (
                      <img src={newCandidate.photoUrl} alt="New candidate" className="candidate-photo" />
                    ) : (
                      <div className="photo-placeholder">+</div>
                    )}
                  </div>
                </td>
                <td>
                  <input
                    type="text"
                    value={newCandidate.name}
                    onChange={(e) => setNewCandidate(prev => ({ ...prev, name: e.target.value }))}
                    className="admin-input"
                    placeholder="Nama"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={newCandidate.kelas}
                    onChange={(e) => setNewCandidate(prev => ({ ...prev, kelas: e.target.value }))}
                    className="admin-input"
                    placeholder="Kelas"
                  />
                </td>
                <td>
                  <input
                    value={newCandidate.vision}
                    onChange={(e) => setNewCandidate(prev => ({ ...prev, vision: e.target.value }))}
                    className="admin-input"
                    placeholder="Visi"
                  />
                </td>
                <td>
                  <input
                    value={newCandidate.mission}
                    onChange={(e) => setNewCandidate(prev => ({ ...prev, mission: e.target.value }))}
                    className="admin-input"
                    placeholder="Misi"
                  />
                </td>
                <td>
                  <button onClick={handleAddNewCandidate} className="admin-btn admin-btn-primary mr-2">Simpan</button>
                  <button onClick={() => setIsAddingNew(false)} className="admin-btn admin-btn-secondary">Batal</button>
                </td>
              </tr>
            )}
            {candidates.map((candidate, index) => (
              <tr key={candidate.id}>
                <td>{index + 1}</td>
                <td>
                  <div className="photo-container" onClick={() => handlePhotoClick(candidate.id)}>
                    <img 
                      src={candidate.photoUrl} 
                      alt={candidate.name} 
                      className="candidate-photo"
                    />
                  </div>
                </td>
                <td>
                  {editingId === candidate.id ? (
                    <input
                      type="text"
                      value={editedCandidate?.name || ''}
                      onChange={(e) => setEditedCandidate({ ...editedCandidate!, name: e.target.value })}
                      className="admin-input"
                    />
                  ) : (
                    candidate.name
                  )}
                </td>
                <td>
                  {editingId === candidate.id ? (
                    <input
                      type="text"
                      value={editedCandidate?.kelas || ''}
                      onChange={(e) => setEditedCandidate({ ...editedCandidate!, kelas: e.target.value })}
                      className="admin-input"
                    />
                  ) : (
                    candidate.kelas
                  )}
                </td>
                <td>
                  {editingId === candidate.id ? (
                    <input
                      value={editedCandidate?.vision || ''}
                      onChange={(e) => setEditedCandidate({ ...editedCandidate!, vision: e.target.value })}
                      className="admin-input"
                    />
                  ) : (
                    candidate.vision
                  )}
                </td>
                <td>
                  {editingId === candidate.id ? (
                    <input
                      value={editedCandidate?.mission || ''}
                      onChange={(e) => setEditedCandidate({ ...editedCandidate!, mission: e.target.value })}
                      className="admin-input"
                    />
                  ) : (
                    candidate.mission
                  )}
                </td>
                <td>
                  {editingId === candidate.id ? (
                    <>
                      <button onClick={saveEditing} className="admin-btn admin-btn-primary mr-2">Simpan</button>
                      <button onClick={cancelEditing} className="admin-btn admin-btn-secondary">Batal</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEditing(candidate)} className="admin-btn admin-btn-secondary mr-2">Edit</button>
                      <button onClick={() => onDelete(candidate)} className="admin-btn admin-btn-danger">Hapus</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        accept="image/*"
      />
    </section>
  );
};

export default CandidateList;
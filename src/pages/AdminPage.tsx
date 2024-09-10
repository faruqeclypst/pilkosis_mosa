// src/pages/AdminPage.tsx

import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Candidate, SchoolInfo } from '../types';
import SchoolInfoSection from '../components/admin/SchoolInfoSection';
import CandidateList from '../components/admin/CandidateList';
import StatisticsSection from '../components/admin/StatisticsSection';
import RankingTable from '../components/admin/RankingTable';
import ActionButtons from '../components/admin/ActionButtons';
import DeleteConfirmationModal from '../components/admin/DeleteConfirmationModal';
import ResetConfirmationModal from '../components/admin/ResetConfirmationModal';
import ResetVoteConfirmationModal from '../components/admin/ResetVoteConfirmationModal';
import { exportToPDF } from '../utils/pdfExport';

const AdminPage: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo>({ name: '', logo: '' });
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [candidateToDelete, setCandidateToDelete] = useState<Candidate | null>(null);
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  const [showResetVoteConfirmation, setShowResetVoteConfirmation] = useState(false);
  const [resetNotification, setResetNotification] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'candidates'), (snapshot) => {
      const candidatesData: Candidate[] = [];
      snapshot.forEach((doc) => {
        candidatesData.push({ id: doc.id, ...doc.data() } as Candidate);
      });
      setCandidates(candidatesData);
    }, (err) => {
      setError('Error fetching candidates: ' + err.message);
    });

    return () => unsubscribe();
  }, []);

  const handleDeleteCandidate = (candidate: Candidate) => {
    setCandidateToDelete(candidate);
    setShowDeleteConfirmation(true);
  };

  const confirmDeleteCandidate = async () => {
    if (candidateToDelete) {
      try {
        await deleteDoc(doc(db, 'candidates', candidateToDelete.id));
        console.log(`Kandidat ${candidateToDelete.name} berhasil dihapus`);
        setShowDeleteConfirmation(false);
        setCandidateToDelete(null);
      } catch (err) {
        setError('Error deleting candidate: ' + (err as Error).message);
      }
    }
  };

  const handleResetData = async () => {
    try {
      const batch = writeBatch(db);
      
      candidates.forEach((candidate) => {
        const candidateRef = doc(db, 'candidates', candidate.id);
        batch.delete(candidateRef);
      });
  
      await batch.commit();
  
      setCandidates([]);
      setShowResetConfirmation(false);
      setResetNotification('Semua data berhasil direset!');
      setTimeout(() => setResetNotification(null), 3000);
    } catch (err) {
      setError('Error resetting data: ' + (err as Error).message);
      console.error('Error resetting data:', err);
    }
  };

  const handleResetVotes = async () => {
    try {
      const batch = writeBatch(db);
      
      candidates.forEach((candidate) => {
        const candidateRef = doc(db, 'candidates', candidate.id);
        batch.update(candidateRef, { voteCount: 0 });
      });

      await batch.commit();
      setShowResetVoteConfirmation(false);
      setResetNotification('Vote berhasil direset!');
      setTimeout(() => setResetNotification(null), 3000);
    } catch (err) {
      setError('Error resetting votes: ' + (err as Error).message);
      console.error('Error resetting votes:', err);
    }
  };

  const handleExportToPDF = () => {
    exportToPDF(candidates, schoolInfo);
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-sidebar">
        <h1 className="text-2xl font-bold p-4">Admin Dashboard</h1>
        <nav>
          <ul className="space-y-2">
            <li><a href="#school-info" className="block p-2 hover:bg-gray-100">Informasi Sekolah</a></li>
            <li><a href="#candidates" className="block p-2 hover:bg-gray-100">Daftar Calon</a></li>
            <li><a href="#statistics" className="block p-2 hover:bg-gray-100">Statistik Pemilihan</a></li>
            <li><a href="#ranking" className="block p-2 hover:bg-gray-100">Peringkat Kandidat</a></li>
          </ul>
        </nav>
      </div>

      <div className="admin-content">
        <header className="admin-header">
          <h1 className="text-3xl font-bold">Dashboard Admin Pemilihan OSIS</h1>
        </header>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <SchoolInfoSection schoolInfo={schoolInfo} setSchoolInfo={setSchoolInfo} setError={setError} />
        
        <CandidateList 
          candidates={candidates} 
          onDelete={handleDeleteCandidate} 
          setError={setError}
        />
        
        <StatisticsSection candidates={candidates} />
        <RankingTable candidates={candidates} />
        
        <ActionButtons 
          onExportPDF={handleExportToPDF} 
          onResetVotes={() => setShowResetVoteConfirmation(true)} 
          onDeleteAll={() => setShowResetConfirmation(true)} 
        />

        {resetNotification && (
          <div className="mt-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{resetNotification}</span>
          </div>
        )}

        <DeleteConfirmationModal 
          show={showDeleteConfirmation} 
          candidate={candidateToDelete} 
          onConfirm={confirmDeleteCandidate} 
          onCancel={() => {
            setShowDeleteConfirmation(false);
            setCandidateToDelete(null);
          }} 
        />

        <ResetConfirmationModal 
          show={showResetConfirmation} 
          onConfirm={handleResetData} 
          onCancel={() => setShowResetConfirmation(false)} 
        />

        <ResetVoteConfirmationModal 
          show={showResetVoteConfirmation} 
          onConfirm={handleResetVotes} 
          onCancel={() => setShowResetVoteConfirmation(false)} 
        />
      </div>
    </div>
  );
};

export default AdminPage;
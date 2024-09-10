// src/pages/AdminPage.tsx

import React, { useState, useEffect } from 'react';
import { FaSchool, FaUsers, FaChartBar, FaTrophy, FaSignOutAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, doc, deleteDoc, writeBatch, getDoc } from 'firebase/firestore';
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
import TokenGenerator from '../components/admin/TokenGenerator';
import { exportToPDF } from '../utils/pdfExport';
import '../assets/css/AdminTable.css';

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo>({ name: '', logo: '' });
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [candidateToDelete, setCandidateToDelete] = useState<Candidate | null>(null);
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  const [showResetVoteConfirmation, setShowResetVoteConfirmation] = useState(false);
  const [resetNotification, setResetNotification] = useState<string | null>(null);

  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated');
    if (authStatus !== 'true') {
      navigate('/login', { replace: true });
    }

    const fetchCandidates = () => {
      const unsubscribe = onSnapshot(collection(db, 'candidates'), (snapshot) => {
        const candidatesData: Candidate[] = [];
        snapshot.forEach((doc) => {
          candidatesData.push({ id: doc.id, ...doc.data() } as Candidate);
        });
        setCandidates(candidatesData);
      }, (err) => {
        setError('Error fetching candidates: ' + err.message);
      });
      return unsubscribe;
    };

    const fetchSchoolInfo = async () => {
      try {
        const schoolInfoDoc = await getDoc(doc(db, 'schoolInfo', 'info'));
        if (schoolInfoDoc.exists()) {
          setSchoolInfo(schoolInfoDoc.data() as SchoolInfo);
        }
      } catch (err) {
        setError('Error fetching school info: ' + (err as Error).message);
      }
    };

    const unsubscribeCandidates = fetchCandidates();
    fetchSchoolInfo();

    return () => {
      unsubscribeCandidates();
    };
  }, [navigate]);

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

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-blue-800 text-white">
        <div className="p-6">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        </div>
        <nav className="mt-6">
          {[
            { text: "Informasi Sekolah", href: "#school-info", icon: <FaSchool /> },
            { text: "Daftar Calon", href: "#candidates", icon: <FaUsers /> },
            { text: "Statistik Pemilihan", href: "#statistics", icon: <FaChartBar /> },
            { text: "Peringkat Kandidat", href: "#ranking", icon: <FaTrophy /> },
          ].map((item, index) => (
            <a 
              key={index} 
              href={item.href} 
              className="flex items-center py-3 px-6 hover:bg-blue-700 transition-colors duration-200"
            >
              <span className="mr-3">{item.icon}</span>
              {item.text}
            </a>
          ))}
          <button
            onClick={handleLogout}
            className="w-full flex items-center text-left py-3 px-6 hover:bg-blue-700 transition-colors duration-200"
          >
            <FaSignOutAlt className="mr-3" />
            Logout
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
              <p className="font-bold">Error</p>
              <p>{error}</p>
            </div>
          )}

          {/* Dashboard Sections */}
          <div className="space-y-8">
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
            <TokenGenerator setError={setError} />
          </div>

          {/* Reset Notification */}
          {resetNotification && (
            <div className="mt-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md" role="alert">
              <p className="font-bold">Sukses</p>
              <p>{resetNotification}</p>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
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
  );
};

export default AdminPage;
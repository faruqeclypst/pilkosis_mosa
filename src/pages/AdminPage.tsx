// src/pages/AdminPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { FaSchool, FaUsers, FaChartBar, FaTrophy, FaSignOutAlt, FaUserCog } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { ref, onValue, remove, update, get, push } from 'firebase/database';
import { db } from '../services/firebase';
import { Candidate, SchoolInfo, Admin } from '../types';
import { useSwipeable } from 'react-swipeable';
import SchoolInfoSection from '../components/admin/SchoolInfoSection';
import CandidateList from '../components/admin/CandidateList';
import StatisticsSection from '../components/admin/StatisticsSection';
import RankingTable from '../components/admin/RankingTable';
import ActionButtons from '../components/admin/ActionButtons';
import DeleteConfirmationModal from '../components/admin/DeleteConfirmationModal';
import ResetConfirmationModal from '../components/admin/ResetConfirmationModal';
import ResetVoteConfirmationModal from '../components/admin/ResetVoteConfirmationModal';
import TokenGenerator from '../components/admin/TokenGenerator';
import AdminManagement from '../components/admin/AdminManagement';
import { exportToPDF } from '../utils/pdfExport';
import '../assets/css/AdminTable.css';

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo>({ name: '', logo: '' });
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [candidateToDelete, setCandidateToDelete] = useState<Candidate | null>(null);
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  const [showResetVoteConfirmation, setShowResetVoteConfirmation] = useState(false);
  const [resetNotification, setResetNotification] = useState<string | null>(null);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const [showInactivityAlert, setShowInactivityAlert] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Konfigurasi swipeable untuk sidebar
  const swipeHandlers = useSwipeable({
    onSwipedRight: (eventData) => {
      if (eventData.initial[0] < window.innerWidth * 0.25) {
        setSidebarOpen(true);
      }
    },
    onSwipedLeft: () => setSidebarOpen(false),
    trackMouse: true
  });

  const resetActivityTimer = useCallback(() => {
    setLastActivity(Date.now());
    setShowInactivityAlert(false);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('isAuthenticated');
    navigate('/login', { replace: true });
  }, [navigate]);

  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated');
    if (authStatus !== 'true') {
      navigate('/login', { replace: true });
    }

    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach(event => {
      window.addEventListener(event, resetActivityTimer);
    });

    const inactivityCheckInterval = setInterval(() => {
      const inactiveTime = Date.now() - lastActivity;
      if (inactiveTime > 4 * 60 * 1000 + 50 * 1000) { // Show alert after 4 minutes 50 seconds
        setShowInactivityAlert(true);
      }
      if (inactiveTime > 5 * 60 * 1000) { // Logout after 5 minutes
        logout();
      }
    }, 1000); // Check every second

    const fetchCandidates = () => {
      const candidatesRef = ref(db, 'candidates');
      const unsubscribe = onValue(candidatesRef, (snapshot) => {
        const candidatesData: Candidate[] = [];
        snapshot.forEach((childSnapshot) => {
          candidatesData.push({
            id: childSnapshot.key as string,
            ...childSnapshot.val()
          } as Candidate);
        });
        setCandidates(candidatesData);
      }, (err) => {
        setError('Error fetching candidates: ' + err.message);
      });
      return () => unsubscribe();
    };

    const fetchSchoolInfo = async () => {
      try {
        const schoolInfoRef = ref(db, 'schoolInfo/info');
        const snapshot = await get(schoolInfoRef);
        if (snapshot.exists()) {
          setSchoolInfo(snapshot.val() as SchoolInfo);
        }
      } catch (err) {
        setError('Error fetching school info: ' + (err as Error).message);
      }
    };

    const fetchAdmins = () => {
      const adminsRef = ref(db, 'admins');
      const unsubscribe = onValue(adminsRef, (snapshot) => {
        const adminsData: Admin[] = [];
        snapshot.forEach((childSnapshot) => {
          adminsData.push({
            id: childSnapshot.key as string,
            ...childSnapshot.val()
          } as Admin);
        });
        setAdmins(adminsData);
      }, (err) => {
        setError('Error fetching admins: ' + err.message);
      });
      return () => unsubscribe();
    };

    const unsubscribeCandidates = fetchCandidates();
    const unsubscribeAdmins = fetchAdmins();
    fetchSchoolInfo();

    return () => {
      unsubscribeCandidates();
      unsubscribeAdmins();
      activityEvents.forEach(event => {
        window.removeEventListener(event, resetActivityTimer);
      });
      clearInterval(inactivityCheckInterval);
    };
  }, [navigate, lastActivity, logout, resetActivityTimer]);

  const handleDeleteCandidate = (candidate: Candidate) => {
    setCandidateToDelete(candidate);
    setShowDeleteConfirmation(true);
  };

  const confirmDeleteCandidate = async () => {
    if (candidateToDelete) {
      try {
        await remove(ref(db, `candidates/${candidateToDelete.id}`));
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
      await remove(ref(db, 'candidates'));
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
      const updates: { [key: string]: number } = {};
      candidates.forEach((candidate) => {
        updates[`candidates/${candidate.id}/voteCount`] = 0;
      });
      await update(ref(db), updates);
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

  const handleAddAdmin = async (newAdmin: Omit<Admin, 'id'>) => {
    try {
      const adminsRef = ref(db, 'admins');
      await push(adminsRef, newAdmin);
    } catch (err) {
      setError('Error adding admin: ' + (err as Error).message);
    }
  };

  const handleUpdateAdmin = async (adminId: string, updatedAdmin: Partial<Admin>) => {
    try {
      const adminRef = ref(db, `admins/${adminId}`);
      await update(adminRef, updatedAdmin);
    } catch (err) {
      setError('Error updating admin: ' + (err as Error).message);
    }
  };

  const handleDeleteAdmin = async (adminId: string) => {
    try {
      const adminRef = ref(db, `admins/${adminId}`);
      await remove(adminRef);
    } catch (err) {
      setError('Error deleting admin: ' + (err as Error).message);
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex h-screen bg-gray-100" {...swipeHandlers}>
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-blue-800 text-white transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0`}>
        <div className="p-6">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        </div>
        <nav className="mt-6">
          {[
            { text: "Informasi Sekolah", href: "#school-info", icon: <FaSchool /> },
            { text: "Daftar Calon", href: "#candidates", icon: <FaUsers /> },
            { text: "Statistik Pemilihan", href: "#statistics", icon: <FaChartBar /> },
            { text: "Peringkat Kandidat", href: "#ranking", icon: <FaTrophy /> },
            { text: "Manajemen Token", href: "#token-management", icon: <FaUserCog /> },
            { text: "Manajemen Admin", href: "#admin-management", icon: <FaUserCog /> },
          ].map((item, index) => (
            <a
              key={index}
              href={item.href}
              className="flex items-center py-3 px-6 hover:bg-blue-700 transition-colors duration-200"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="mr-3">{item.icon}</span>
              {item.text}
            </a>
          ))}
          <button
            onClick={() => {
              handleLogout();
              setSidebarOpen(false);
            }}
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
            <AdminManagement 
              admins={admins}
              onAddAdmin={handleAddAdmin}
              onUpdateAdmin={handleUpdateAdmin}
              onDeleteAdmin={handleDeleteAdmin}
            />
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

      {/* Inactivity Alert */}
      {showInactivityAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <h2 className="text-xl font-bold mb-4">Peringatan Inaktivitas</h2>
            <p>Anda akan logout dalam 10 detik karena tidak aktif. Klik di mana saja untuk tetap masuk.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
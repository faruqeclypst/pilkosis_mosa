// src/pages/AdminPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { FaSchool, FaUsers, FaChartBar, FaTrophy, FaSignOutAlt, FaUserCog } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { ref, onValue, remove, update, get, push } from 'firebase/database';
import { db } from '../services/firebase';
import { Candidate, SchoolInfo, Admin } from '../types';
import SchoolInfoSection from '../components/admin/SchoolInfoSection';
import CandidateList from '../components/admin/CandidateList';
import StatisticsSection from '../components/admin/StatisticsSection';
import RankingTable from '../components/admin/RankingTable';
import DeleteConfirmationModal from '../components/admin/DeleteConfirmationModal';
import ResetConfirmationModal from '../components/admin/ResetConfirmationModal';
import ResetVoteConfirmationModal from '../components/admin/ResetVoteConfirmationModal';
import TokenGenerator from '../components/admin/token/TokenGenerator';
import AdminManagement from '../components/admin/AdminManagement';
import '../assets/css/AdminTable.css';

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo>({ name: '', logo: '' });
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [candidateToDelete, setCandidateToDelete] = useState<Candidate | null>(null);
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  const [showResetVoteConfirmation, setShowResetVoteConfirmation] = useState(false);
  const [resetNotification, setResetNotification] = useState<string | null>(null);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const [showInactivityAlert, setShowInactivityAlert] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      console.log('Admin updated successfully:', adminId);
    } catch (err) {
      setError('Error updating admin: ' + (err as Error).message);
      console.error('Error updating admin:', err);
    }
  };

  const handleDeleteAdmin = async (adminId: string) => {
    try {
      const adminRef = ref(db, `admins/${adminId}`);
      await remove(adminRef);
      console.log('Admin deleted successfully:', adminId);
    } catch (err) {
      setError('Error deleting admin: ' + (err as Error).message);
      console.error('Error deleting admin:', err);
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* Sidebar */}
      <div 
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-blue-800 to-blue-900 transform 
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
          transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col`}
      >
        {/* Sidebar Header */}
        <div className="flex-shrink-0 p-6 border-b border-blue-700/50">
          <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-blue-200">Sistem Pemilihan Ketua OSIS</p>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
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
              className="flex items-center px-6 py-3 text-sm text-blue-100 hover:bg-blue-700/50 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="inline-flex items-center justify-center w-5 h-5 mr-3 text-blue-200">
                {item.icon}
              </span>
              {item.text}
            </a>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="flex-shrink-0 p-4 border-t border-blue-700/50">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-sm text-red-200 hover:bg-blue-700/50 rounded-lg transition-colors"
          >
            <FaSignOutAlt className="mr-3" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 w-full">
        {/* Mobile Header */}
        <div className="sticky top-0 z-40 lg:hidden bg-white border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-gray-800">Admin Dashboard</h1>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Error Message */}
            {error && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg" role="alert">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                  <button 
                    onClick={() => setError(null)}
                    className="ml-auto pl-3"
                  >
                    <span className="sr-only">Dismiss</span>
                    <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Dashboard Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-base sm:text-lg font-semibold mb-2 sm:mb-4">Total Kandidat</h2>
                <p className="text-2xl sm:text-3xl font-bold text-blue-600">{candidates.length}</p>
              </div>
              <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-base sm:text-lg font-semibold mb-2 sm:mb-4">Total Suara</h2>
                <p className="text-2xl sm:text-3xl font-bold text-green-600">
                  {candidates.reduce((sum, candidate) => sum + (candidate.voteCount || 0), 0)}
                </p>
              </div>
              <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 md:col-span-2 lg:col-span-1">
                <h2 className="text-base sm:text-lg font-semibold mb-2 sm:mb-4">Status Pemilihan</h2>
                <p className="text-2xl sm:text-3xl font-bold text-purple-600">Aktif</p>
              </div>
            </div>

            {/* Content Sections */}
            <div className="mt-6 space-y-6">
              {/* School Info Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <SchoolInfoSection 
                  schoolInfo={schoolInfo} 
                  setSchoolInfo={setSchoolInfo}
                  setError={setError}
                />
              </div>

              {/* Other sections with proper mobile padding */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <CandidateList
                  candidates={candidates}
                  onDelete={handleDeleteCandidate}
                  setError={setError}
                />
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <StatisticsSection candidates={candidates} />
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <RankingTable candidates={candidates} />
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <TokenGenerator setError={setError} />
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <AdminManagement 
                  admins={admins}
                  onAddAdmin={handleAddAdmin}
                  onUpdateAdmin={handleUpdateAdmin}
                  onDeleteAdmin={handleDeleteAdmin}
                />
              </div>
            </div>
          </div>

          {/* Notifications */}
          {resetNotification && (
            <div className="fixed bottom-4 right-4 max-w-sm mx-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-lg shadow-lg" role="alert">
              <p className="font-bold">Sukses</p>
              <p>{resetNotification}</p>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

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

      {/* Inactivity Alert dengan design yang lebih baik */}
      {showInactivityAlert && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-xl max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Peringatan Inaktivitas</h2>
            <p className="text-gray-600">
              Anda akan logout dalam 10 detik karena tidak aktif. Klik di mana saja untuk tetap masuk.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
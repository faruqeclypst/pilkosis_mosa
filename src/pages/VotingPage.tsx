// src/pages/VotingPage.tsx

import React, { useEffect, useState, useCallback } from 'react';
import { collection, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Candidate } from '../types';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Pagination, Navigation } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

const VotingPage: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showThankYou, setShowThankYou] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'candidates'), (snapshot) => {
      const candidatesData: Candidate[] = [];
      snapshot.forEach((doc) => {
        candidatesData.push({ id: doc.id, ...doc.data() } as Candidate);
      });
      // Mengacak urutan kandidat
      setCandidates(shuffleArray(candidatesData));
    }, (err) => {
      setError('Error fetching candidates: ' + err.message);
    });

    return () => unsubscribe();
  }, []);

  // Fungsi untuk mengacak array
  const shuffleArray = (array: any[]) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const redirectToVoting = useCallback(() => {
    navigate('/');
  }, [navigate]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showThankYou && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prevCountdown) => prevCountdown - 1);
      }, 1000);
    } else if (showThankYou && countdown === 0) {
      redirectToVoting();
    }
    return () => clearInterval(timer);
  }, [showThankYou, countdown, redirectToVoting]);

  const handleVoteClick = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setShowConfirmation(true);
  };

  const handleConfirmVote = async () => {
    if (!selectedCandidate) return;

    try {
      const candidateRef = doc(db, 'candidates', selectedCandidate.id);
      await updateDoc(candidateRef, {
        voteCount: selectedCandidate.voteCount + 1
      });
      setShowConfirmation(false);
      setSelectedCandidate(null);
      setShowThankYou(true);
      setCountdown(3);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (err) {
      setError('Terjadi kesalahan saat melakukan voting. Silakan coba lagi.');
      console.error(err);
    }
  };

  const handleCancelVote = () => {
    setShowConfirmation(false);
    setSelectedCandidate(null);
  };

  if (showThankYou) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-500 to-purple-600"
      >
        <div className="container mx-auto px-4 py-8 text-center text-white">
          <motion.h1 
            initial={{ y: -50 }}
            animate={{ y: 0 }}
            className="text-4xl font-bold mb-4"
          >
            Terima Kasih Sudah Melakukan Voting
          </motion.h1>
          <motion.p 
            initial={{ y: 50 }}
            animate={{ y: 0 }}
            className="text-xl mb-8"
          >
            Calon Ketua OSIS SMAN MODAL BANGSA
          </motion.p>
          <motion.p 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-2xl font-bold"
          >
            Anda akan dialihkan ke halaman Voting dalam waktu {countdown} detik
          </motion.p>
        </div>
      </motion.div>      
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto px-4 py-8 max-w-4xl"
    >
      <h1 className="text-3xl font-bold mb-6 text-center text-blue-600">Pilih Calon Ketua OSIS</h1>
      {error && <div className="text-red-600 mb-4 text-center">{error}</div>}
      
      <Swiper
        effect={'coverflow'}
        grabCursor={true}
        centeredSlides={true}
        slidesPerView={1}
        coverflowEffect={{
          rotate: 50,
          stretch: 0,
          depth: 100,
          modifier: 1,
          slideShadows: true,
        }}
        pagination={{
          clickable: true,
        }}
        navigation={true}
        modules={[EffectCoverflow, Pagination, Navigation]}
        loop={true}
        className="mySwiper"
      >
        {candidates.map((candidate) => (
          <SwiperSlide key={candidate.id}>
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="bg-white shadow-xl rounded-lg overflow-hidden flex h-[500px] m-4"
            >
              <div className="w-2/5 h-full">
                <img src={candidate.photoUrl} alt={candidate.name} className="w-full h-full object-cover" />
              </div>
              <div className="w-3/5 p-6 flex flex-col">
                <div className="mb-4">
                  <h2 className="text-3xl font-bold text-blue-600 mb-2">{candidate.name}</h2>
                  <span className="text-md font-semibold text-gray-600 bg-gray-200 px-3 py-1 rounded-full">{candidate.kelas}</span>
                </div>
                <div className="mb-4 flex-grow overflow-auto">
                  <h3 className="font-semibold text-lg text-blue-500 mb-2">Visi:</h3>
                  <p className="text-gray-700 mb-4">{candidate.vision}</p>
                  <h3 className="font-semibold text-lg text-blue-500 mb-2">Misi:</h3>
                  <p className="text-gray-700">{candidate.mission}</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleVoteClick(candidate)}
                  className="mt-auto bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition-colors w-full text-lg font-semibold"
                >
                  Vote untuk {candidate.name}
                </motion.button>
              </div>
            </motion.div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Confirmation Pop-up */}
      {showConfirmation && selectedCandidate && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto flex items-center justify-center z-50" 
          id="my-modal"
        >
          <motion.div 
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            className="relative mx-auto p-5 border w-80 shadow-lg rounded-md bg-white"
          >
            <div className="mt-3 text-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Konfirmasi Pemilihan</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Anda yakin memilih {selectedCandidate.name} sebagai calon ketua OSIS?
                </p>
              </div>
              <div className="flex justify-center px-4 py-3 space-x-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  id="ok-btn"
                  className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-md w-20 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  onClick={handleConfirmVote}
                >
                  Ya
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  id="cancel-btn"
                  className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-md w-20 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  onClick={handleCancelVote}
                >
                  Tidak
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default VotingPage;
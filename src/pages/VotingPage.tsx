import React, { useEffect, useState, useRef } from 'react';
import { collection, doc, updateDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Candidate, SchoolInfo } from '../types';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation, Keyboard } from 'swiper/modules';
import { Swiper as SwiperType } from 'swiper';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import '../assets/css/VotingPage.css';

const VotingPage: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showThankYou, setShowThankYou] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);
  const navigate = useNavigate();

  const isMobile = window.innerWidth < 768;
  const swiperRef = useRef<SwiperType | null>(null);

  useEffect(() => {
    const fetchSchoolInfo = async () => {
      const schoolInfoRef = doc(db, 'schoolInfo', 'info');
      const docSnap = await getDoc(schoolInfoRef);
      if (docSnap.exists()) {
        setSchoolInfo(docSnap.data() as SchoolInfo);
      }
    };

    fetchSchoolInfo();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'candidates'), (snapshot) => {
      const candidatesData: Candidate[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Candidate));
      setCandidates(candidatesData);
    }, (err) => {
      setError('Error fetching candidates: ' + err.message);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showThankYou && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prevCountdown) => prevCountdown - 1);
      }, 1000);
    } else if (showThankYou && countdown === 0) {
      navigate('/');
    }
    return () => clearInterval(timer);
  }, [showThankYou, countdown, navigate]);

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

  const CandidateCard = ({ candidate }: { candidate: Candidate }) => (
    <motion.div
      whileHover={{ scale: 1.03, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}
      className="bg-white rounded-xl overflow-hidden shadow-lg transition-all duration-300 flex flex-col h-full"
    >
      <div className="relative h-80 md:h-96">
        <img 
          src={candidate.photoUrl} 
          alt={candidate.name} 
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
          <h2 className="text-2xl font-bold text-white mb-1">{candidate.name}</h2>
          <span className="inline-block bg-blue-500 text-white text-sm px-3 py-1 rounded-full">{candidate.kelas}</span>
        </div>
      </div>
      <div className="p-6 flex flex-col flex-grow">
        {/* <div className="mb-4 flex-grow">
          <h3 className="font-semibold text-lg text-blue-600 mb-2">Visi:</h3>
          <p className="text-gray-700 mb-4">{candidate.vision}</p>
          <h3 className="font-semibold text-lg text-blue-600 mb-2">Misi:</h3>
          <p className="text-gray-700">{candidate.mission}</p>
        </div> */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleVoteClick(candidate)}
          className="mt-auto w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-full transition-all duration-300 transform hover:shadow-lg text-lg font-semibold"
        >
          Vote untuk {candidate.name}
        </motion.button>
      </div>
    </motion.div>
  );

  if (showThankYou) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-500 to-purple-600 p-4"
      >
        <div className="text-center text-white">
          <motion.h1 
            initial={{ y: -50 }}
            animate={{ y: 0 }}
            className="text-3xl md:text-4xl font-bold mb-4"
          >
            Terima Kasih Sudah Melakukan Voting
          </motion.h1>
          <motion.p 
            initial={{ y: 50 }}
            animate={{ y: 0 }}
            className="text-lg md:text-xl mb-8"
          >
            Calon Ketua OSIS {schoolInfo?.name}
          </motion.p>
          <motion.p 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-xl md:text-2xl font-bold"
          >
            Anda akan dialihkan ke halaman utama dalam waktu {countdown} detik
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
      className="min-h-screen py-6 px-4"
      // className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100 py-12 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <motion.h1 
            initial={{ y: -50 }}
            animate={{ y: 0 }}
            className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-4"
          >
            Pilih Calon Ketua OSIS
          </motion.h1>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="inline-block"
          >
            <span className="block text-lg md:text-xl text-gray-600 border-b-2 border-blue-500 pb-2">
              {schoolInfo?.name}
            </span>
          </motion.div>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-8 rounded-md"
          >
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </motion.div>
        )}
        
        <div className="relative">
          {/* Tombol navigasi Swiper */}
          <div className="absolute top-1/2 left-0 transform -translate-y-1/2 z-10">
            <button className="swiper-button-prev"></button>
          </div>
          <div className="absolute top-1/2 right-0 transform -translate-y-1/2 z-10">
            <button className="swiper-button-next"></button>
          </div>

          <Swiper
            modules={[Pagination, Navigation, Keyboard]}
            spaceBetween={30}
            slidesPerView={isMobile ? 1 : 3}
            pagination={{ 
              clickable: true,
              el: '.custom-pagination',
            }}
            navigation={{
              nextEl: '.swiper-button-next',
              prevEl: '.swiper-button-prev',
            }}
            keyboard={{
              enabled: true,
            }}
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
            }}
            className={`mySwiper ${isMobile ? 'mobile-swiper' : 'desktop-swiper'}`}
          >
            {candidates.map((candidate) => (
              <SwiperSlide key={candidate.id}>
                <CandidateCard candidate={candidate} />
              </SwiperSlide>
            ))}
          </Swiper>
          <div className={`custom-pagination ${isMobile ? 'mt-6' : 'mt-4'}`}></div>
        </div>
      </div>

      <AnimatePresence>
        {showConfirmation && selectedCandidate && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm overflow-y-auto flex items-center justify-center z-50 p-4" 
            id="my-modal"
          >
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="relative mx-auto p-8 border w-full max-w-md shadow-2xl rounded-2xl bg-white"
            >
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Konfirmasi Pemilihan</h3>
                <p className="text-lg text-gray-600 mb-6">
                  Anda yakin memilih <span className="font-semibold text-blue-600">{selectedCandidate.name}</span> sebagai calon ketua OSIS?
                </p>
                <div className="flex justify-center space-x-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-lg font-medium rounded-full hover:shadow-lg transition-all duration-300"
                    onClick={handleConfirmVote}
                  >
                    Ya, Pilih
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white text-lg font-medium rounded-full hover:shadow-lg transition-all duration-300"
                    onClick={handleCancelVote}
                  >
                    Batal
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default VotingPage;
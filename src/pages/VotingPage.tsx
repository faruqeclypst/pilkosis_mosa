import React, { useEffect, useState, useRef } from 'react';
import { ref, get, update, query, orderByChild, equalTo } from 'firebase/database';
import { db } from '../services/firebase';
import { Candidate, SchoolInfo, Token } from '../types';
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
  const [countdown, setCountdown] = useState(5);
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);
  const [token, setToken] = useState('');
  const [isValidToken, setIsValidToken] = useState(false);
  const [tokenDocId, setTokenDocId] = useState<string | null>(null);
  const navigate = useNavigate();

  const isMobile = window.innerWidth < 768;
  const swiperRef = useRef<SwiperType | null>(null);

  useEffect(() => {
    const fetchSchoolInfo = async () => {
      const schoolInfoRef = ref(db, 'schoolInfo/info');
      const snapshot = await get(schoolInfoRef);
      if (snapshot.exists()) {
        setSchoolInfo(snapshot.val() as SchoolInfo);
      }
    };

    fetchSchoolInfo();
  }, []);

  useEffect(() => {
    if (isValidToken) {
      const fetchCandidates = async () => {
        try {
          const candidatesRef = ref(db, 'candidates');
          const snapshot = await get(candidatesRef);
          const candidatesData: Candidate[] = [];
          snapshot.forEach((childSnapshot) => {
            candidatesData.push({
              id: childSnapshot.key as string,
              ...childSnapshot.val()
            } as Candidate);
          });
          setCandidates(candidatesData);
        } catch (err) {
          console.error('Error fetching candidates:', err);
          setError('Error fetching candidates: ' + (err as Error).message);
        }
      };

      fetchCandidates();
    }
  }, [isValidToken]);

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

  const validateToken = async () => {
    setError(null);
    console.log('Attempting to validate token:', token);
    try {
      const tokensRef = ref(db, 'tokens');
      const tokenQuery = query(tokensRef, orderByChild('token'), equalTo(token));
      const snapshot = await get(tokenQuery);
      
      if (snapshot.exists()) {
        const tokenData = Object.values(snapshot.val())[0] as Token;
        const tokenId = Object.keys(snapshot.val())[0];
        console.log('Token document data:', tokenData);
        
        if (!tokenData.used) {
          setIsValidToken(true);
          setTokenDocId(tokenId);
          console.log('Token successfully validated');
        } else {
          setError('Token sudah digunakan');
          console.log('Token is already used');
        }
      } else {
        setError('Token tidak valid');
        console.log('No matching token found in database');
      }
    } catch (err) {
      console.error('Error during token validation:', err);
      setError('Terjadi kesalahan saat memvalidasi token');
    }
  };

  const handleVoteClick = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setShowConfirmation(true);
  };

  const handleConfirmVote = async () => {
    if (!selectedCandidate || !tokenDocId) return;

    try {
      // Update candidate vote count
      const candidateRef = ref(db, `candidates/${selectedCandidate.id}`);
      const candidateSnapshot = await get(candidateRef);
      const currentVotes = candidateSnapshot.val().voteCount || 0;
      await update(candidateRef, {
        voteCount: currentVotes + 1
      });

      // Mark token as used and store the candidate ID
      const tokenRef = ref(db, `tokens/${tokenDocId}`);
      await update(tokenRef, { 
        used: true,
        candidateId: selectedCandidate.id
      });

      setShowConfirmation(false);
      setSelectedCandidate(null);
      setShowThankYou(true);
      setCountdown(5);
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
  whileHover={{ scale: 1.05 }}
  className="bg-white rounded-2xl overflow-hidden transition-all duration-300 flex flex-col h-full"
>
      <div className="relative w-full pb-[133.33%]">
        <div className="absolute inset-0">
          <img 
            src={candidate.photoUrl} 
            alt={candidate.name} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h2 className="text-3xl font-bold text-white mb-2">{candidate.name}</h2>
            <span className="inline-block bg-blue-500 text-white text-sm font-bold px-4 py-2 rounded-full shadow-md">{candidate.kelas}</span>
          </div>
        </div>
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleVoteClick(candidate)}
          className="mt-auto w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-4 rounded-full transition-all duration-300 transform hover:shadow-lg text-lg font-semibold"
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
        <div className="text-center text-white p-12">
          <motion.h1 
            initial={{ y: -50 }}
            animate={{ y: 0 }}
            className="text-4xl md:text-5xl font-bold mb-6"
          >
            Terima Kasih Sudah Melakukan Voting
          </motion.h1>
          <motion.p 
            initial={{ y: 50 }}
            animate={{ y: 0 }}
            className="text-xl font-bold md:text-5xl mb-8"
          >
            Calon Ketua OSIS
          </motion.p>
          <motion.p 
            initial={{ y: 50 }}
            animate={{ y: 0 }}
            className="text-xl font-bold md:text-5xl mb-8"
          >
            {schoolInfo?.name}
          </motion.p>
          <motion.p 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-2xl md:text-3xl font-semi-bold"
          >
            Anda akan dialihkan ke halaman utama dalam waktu {countdown} detik
          </motion.p>
        </div>
      </motion.div>      
    );
  }

  if (!isValidToken) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500">
        <div className="bg-white p-12 rounded-3xl shadow-2xl max-w-md w-full">
          <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Masukkan Token Voting</h2>
          {error && <p className="text-red-500 font-bold mb-6 text-center">{error}</p>}
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="border-2 border-gray-300 rounded-full px-6 py-3 w-full mb-6 text-lg focus:outline-none focus:border-blue-500 transition-all duration-300"
            placeholder="Masukkan token"
          />
          <button
            onClick={validateToken}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-full hover:shadow-lg w-full text-lg font-semibold transition-all duration-300"
          >
            Validasi Token
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen py-12 px-6 bg-gradient-to-r from-blue-50 to-purple-50"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.h1 
            initial={{ y: -50 }}
            animate={{ y: 0 }}
            className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-6"
          >
            Pilih Calon Ketua OSIS
          </motion.h1>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="inline-block"
          >
            <span className="block text-xl md:text-2xl text-gray-700 border-b-4 border-blue-500 pb-2">
              {schoolInfo?.name}
            </span>
          </motion.div>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-100 border-l-4 border-red-500 text-red-700 p-6 mb-12 rounded-lg shadow-md"
          >
            <p className="font-bold text-lg mb-2">Error</p>
            <p>{error}</p>
          </motion.div>
        )}
        
        <div className="relative overflow-hidden px-12">
          <div className="absolute top-1/2 left-0 transform -translate-y-1/2 z-10">
            <button className="swiper-button-prev"></button>
          </div>
          <div className="absolute top-1/2 right-0 transform -translate-y-1/2 z-10">
            <button className="swiper-button-next"></button>
          </div>

          <Swiper
            modules={[Pagination, Navigation, Keyboard]}
            spaceBetween={40}
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
          <div className={`custom-pagination ${isMobile ? 'mt-8' : 'mt-6'}`}></div>
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
              className="relative mx-auto p-12 border w-full max-w-md shadow-2xl rounded-3xl bg-white"
            >
              <div className="text-center">
                <h3 className="text-3xl font-bold text-gray-900 mb-6">Konfirmasi Pemilihan</h3>
                <p className="text-xl text-gray-700 mb-8">
                  Anda yakin memilih <span className="font-semibold text-blue-600">{selectedCandidate.name}</span> sebagai calon ketua OSIS?
                </p>
                <div className="flex justify-center space-x-6">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-lg font-medium rounded-full hover:shadow-lg transition-all duration-300"
                    onClick={handleConfirmVote}
                  >
                    Ya, Pilih
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white text-lg font-medium rounded-full hover:shadow-lg transition-all duration-300"
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
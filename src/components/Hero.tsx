// src/components/Hero.tsx

import React from 'react';
import { Link } from 'react-router-dom';

interface HeroProps {
    schoolName: string;
    schoolLogo: string;
  }


  const Hero: React.FC<HeroProps> = React.memo(({ schoolName, schoolLogo }) => {
  return (
    <div className="bg-blue-600 text-white min-h-screen flex items-center justify-center">
      <div className="text-center">
        {schoolLogo && (
          <img 
            src={schoolLogo} 
            alt={`Logo ${schoolName}`} 
            className="mx-auto mb-8 w-32 h-32 object-contain"
          />
        )}
        <h1 className="text-5xl md:text-6xl font-bold mb-4">Pemilihan Ketua OSIS</h1>
        <h2 className="text-3xl md:text-4xl mb-8">{schoolName}</h2>
        <Link
          to="/vote"
          className="bg-white text-blue-600 px-8 py-3 rounded-full font-semibold text-xl hover:bg-blue-300 transition-colors inline-block"
        >
          Mulai Memilih
        </Link>
      </div>
    </div>
  );
});

export default Hero;
// src/components/Hero.tsx

import React from 'react';
import { Link } from 'react-router-dom';

interface HeroProps {
  schoolName: string;
  schoolLogo: string;
}

const Hero: React.FC<HeroProps> = React.memo(({ schoolName, schoolLogo }) => {
  return (
    <div className="min-h-screen flex flex-col justify-between text-white">
      <div className="text-center flex-grow flex flex-col items-center justify-center">
        {schoolLogo && (
          <img 
            src={schoolLogo} 
            // alt={`Logo ${schoolName}`} 
            className="mx-auto mb-8 w-32 h-32 object-contain"
          />
        )}
        <h1 className="text-5xl md:text-6xl font-bold mb-4">
          PEMOS {new Date().getFullYear()} 
        </h1>
        <h2 className="text-2xl md:text-2xl font-bold mb-8">
          {schoolName}
        </h2>
        <Link
          to="/vote"
          className="bg-white text-blue-600 px-8 py-3 rounded-full font-bold text-xl 
                     hover:bg-blue-200 transition-colors duration-300 ease-in-out 
                     transform hover:scale-105 inline-block shadow-lg"
        >
          Vote Sekarang
        </Link>
      </div>
      <footer className="py-4">
        <p className="text-center font-italic text-1xl text-white">
          &copy; {new Date().getFullYear()} SMA Negeri Modal Bangsa
        </p>
      </footer>
    </div>
  );
});

export default Hero;

// src/components/Navigation.tsx

import React from 'react';
import { Link } from 'react-router-dom';

const Navigation: React.FC = () => {
  return (
    <nav className="bg-blue-600 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">Pemilihan Ketua OSIS</Link>
        <div>
          <Link to="/" className="mr-4 hover:underline">Beranda</Link>
          <Link to="/vote" className="mr-4 hover:underline">Voting</Link>
          <Link to="/admin" className="hover:underline">Admin</Link>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
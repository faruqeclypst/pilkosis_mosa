import React, { useState } from 'react';
import TokenGenerator from '../components/admin/TokenGenerator';
import { Link } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';

const TokenGeneratorPage: React.FC = () => {
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <Link to="/admin" className="flex items-center text-blue-600 hover:text-blue-800 mb-6">
          <FaArrowLeft className="mr-2" />
          Kembali ke Dashboard
        </Link>
        
        <h1 className="text-3xl font-bold mb-6">Token Generator</h1>
        
        {error && (
          <div className="mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}
        
        <TokenGenerator setError={setError} />
      </div>
    </div>
  );
};

export default TokenGeneratorPage;
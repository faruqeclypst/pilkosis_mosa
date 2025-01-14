import React, { useState } from 'react';
import TokenGenerator from '../components/admin/token/TokenGenerator';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaKey } from 'react-icons/fa';

const TokenGeneratorPage: React.FC = () => {
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <Link 
                to="/admin" 
                className="flex items-center text-gray-500 hover:text-gray-700 transition-colors"
              >
                <FaArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                <span className="text-sm sm:text-base font-medium">Kembali ke Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center gap-3">
              <FaKey className="text-2xl sm:text-3xl text-blue-600" />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Token Generator</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Generate dan kelola token untuk pemilihan ketua OSIS
                </p>
              </div>
            </div>
          </div>
          
          {/* Error Alert */}
          {error && (
            <div className="mb-6 rounded-lg bg-red-50 p-4" role="alert">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Terjadi Kesalahan</h3>
                  <div className="mt-1 text-sm text-red-700">{error}</div>
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
          
          {/* Token Generator Component */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <TokenGenerator setError={setError} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto py-6 bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs sm:text-sm text-gray-500">
            © {new Date().getFullYear()} Sistem Pemilihan Ketua OSIS. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default TokenGeneratorPage;
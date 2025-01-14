import React from 'react';
import { FaKey, FaTrash } from 'react-icons/fa';

interface TokenGeneratorHeaderProps {
  onDeleteAllTokens: () => void;
}

const TokenGeneratorHeader: React.FC<TokenGeneratorHeaderProps> = ({
  onDeleteAllTokens,
}) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FaKey className="text-2xl text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-800">Token Management</h2>
        </div>
        <button
          onClick={onDeleteAllTokens}
          className="flex items-center px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
        >
          <FaTrash className="mr-2" />
          Hapus Semua Token
        </button>
      </div>
    </div>
  );
};

export default TokenGeneratorHeader; 
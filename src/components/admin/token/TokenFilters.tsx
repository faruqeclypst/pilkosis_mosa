import React from 'react';
import { Search, Filter } from 'lucide-react';

interface TokenFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  totalTokens: number;
  usedTokens: number;
  unusedTokens: number;
  expiredTokens: number;
}

const TokenFilters: React.FC<TokenFiltersProps> = ({
  searchTerm,
  onSearchChange,
  totalTokens,
  usedTokens,
  unusedTokens,
  expiredTokens,
}) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Total Token</p>
          <p className="text-2xl font-bold text-gray-900">{totalTokens}</p>
        </div>
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-600">Digunakan</p>
          <p className="text-2xl font-bold text-blue-700">{usedTokens}</p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <p className="text-sm text-green-600">Belum Digunakan</p>
          <p className="text-2xl font-bold text-green-700">{unusedTokens}</p>
        </div>
        <div className="p-4 bg-red-50 rounded-lg">
          <p className="text-sm text-red-600">Kadaluarsa</p>
          <p className="text-2xl font-bold text-red-700">{expiredTokens}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari token..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Filter Dropdown (Optional) */}
        <div className="sm:w-48">
          <button
            type="button"
            className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Filter className="mr-2 h-5 w-5 text-gray-400" />
            Filter
          </button>
        </div>
      </div>

      {/* Active Filters (Optional) */}
      <div className="mt-4 flex flex-wrap gap-2">
        {searchTerm && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            Search: {searchTerm}
            <button
              onClick={() => onSearchChange('')}
              className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-blue-200"
            >
              ×
            </button>
          </span>
        )}
      </div>
    </div>
  );
};

export default TokenFilters; 
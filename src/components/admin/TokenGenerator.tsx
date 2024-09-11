import React, { useState, useEffect } from 'react';
import { ref, onValue, push, remove, update, get } from 'firebase/database';
import { db } from '../../services/firebase';
import { Token } from '../../types';
import { saveAs } from 'file-saver';
import { ChevronLeft, ChevronRight, Search, ArrowUpDown } from 'lucide-react';
import '../../assets/css/AdminTable.css';

interface TokenGeneratorProps {
  setError: (error: string | null) => void;
}

const TokenGenerator: React.FC<TokenGeneratorProps> = ({ setError }) => {
  const [tokenCount, setTokenCount] = useState(5);
  const [generatingTokens, setGeneratingTokens] = useState(false);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [tokenToDelete, setTokenToDelete] = useState<Token | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [tokensPerPage] = useState(5);

  // Sorting state
  const [sortConfig, setSortConfig] = useState<{ key: keyof Token | 'number'; direction: 'ascending' | 'descending' } | null>(null);

  useEffect(() => {
    fetchTokens();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const fetchTokens = () => {
    setLoading(true);
    const tokensRef = ref(db, 'tokens');
    onValue(tokensRef, (snapshot) => {
      const tokensData: Token[] = Array.from(
        Object.entries(snapshot.val() || {}),
        ([id, value], index) => ({
          id,
          originalIndex: index,
          ...(value as Omit<Token, 'id' | 'originalIndex'>)
        })
      );
      setTokens(tokensData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching tokens: ", error);
      setError('Gagal mengambil data token');
      setLoading(false);
    });
  };

  const generateToken = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!&@#';
    
    let token = '';
    
    for (let i = 0; i < 3; i++) {
      token += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    
    token += numbers.charAt(Math.floor(Math.random() * numbers.length));
    token += symbols.charAt(Math.floor(Math.random() * symbols.length));
    
    return token.split('').sort(() => Math.random() - 0.5).join('');
  };

  const generateTokens = async () => {
    setGeneratingTokens(true);
    const newTokens: string[] = [];
    const tokensRef = ref(db, 'tokens');

    try {
      for (let i = 0; i < tokenCount; i++) {
        const token = generateToken();
        newTokens.push(token);
        await push(tokensRef, {
          token,
          used: false,
          candidateId: null
        });
      }
      console.log(`${tokenCount} token berhasil digenerate`);
      exportTokensToCSV(newTokens);
      fetchTokens();
    } catch (error) {
      console.error("Error generating tokens: ", error);
      setError('Gagal generate token');
    } finally {
      setGeneratingTokens(false);
    }
  };

  const exportTokensToCSV = (tokens: string[]) => {
    const csvContent = ["Token"].concat(tokens).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, "voting_tokens.csv");
  };

  const handleDeleteToken = async (token: Token) => {
    setTokenToDelete(token);
    setShowDeleteConfirmation(true);
  };

  const confirmDeleteToken = async () => {
    if (tokenToDelete) {
      try {
        await remove(ref(db, `tokens/${tokenToDelete.id}`));
        fetchTokens();
        setShowDeleteConfirmation(false);
        setTokenToDelete(null);
      } catch (error) {
        console.error("Error deleting token: ", error);
        setError('Gagal menghapus token');
      }
    }
  };

  const handleUpdateToken = async (id: string, used: boolean) => {
    try {
      const tokenRef = ref(db, `tokens/${id}`);
      const snapshot = await get(tokenRef);
      const tokenData = snapshot.val() as Token;

      if (used && !tokenData.used) {
        await update(tokenRef, { used: true });
      } else if (!used && tokenData.used) {
        if (tokenData.candidateId) {
          const candidateRef = ref(db, `candidates/${tokenData.candidateId}`);
          const candidateSnapshot = await get(candidateRef);
          const candidateData = candidateSnapshot.val();
          if (candidateData && candidateData.voteCount > 0) {
            await update(candidateRef, {
              voteCount: candidateData.voteCount - 1
            });
          }
        }
        await update(tokenRef, { used: false, candidateId: null });
      }

      fetchTokens();
    } catch (error) {
      console.error("Error updating token: ", error);
      setError('Gagal mengupdate status token');
    }
  };

  const handleDeleteAllTokens = async () => {
    setShowDeleteConfirmation(false);
    setLoading(true);
    try {
      const tokensRef = ref(db, 'tokens');
      await remove(tokensRef);
      console.log('All tokens deleted successfully');
      fetchTokens();
    } catch (error) {
      console.error("Error deleting all tokens: ", error);
      setError('Gagal menghapus semua token');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTokens();
    setRefreshing(false);
  };

  // Search function
  const filteredTokens = tokens.filter(token =>
    token.token.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sorting function
  const sortTokens = (tokensToSort: Token[]) => {
    if (sortConfig !== null) {
      return [...tokensToSort].sort((a, b) => {
        if (sortConfig.key === 'number') {
          return sortConfig.direction === 'ascending' 
            ? a.originalIndex - b.originalIndex
            : b.originalIndex - a.originalIndex;
        }
        if (sortConfig.key === 'used') {
          return sortConfig.direction === 'ascending'
            ? (a.used === b.used ? 0 : a.used ? 1 : -1)
            : (a.used === b.used ? 0 : a.used ? -1 : 1);
        }
        // Gunakan optional chaining dan nullish coalescing operator
        const aValue = a[sortConfig.key] ?? '';
        const bValue = b[sortConfig.key] ?? '';
        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return tokensToSort;
  };

  // Request sort function
  const requestSort = (key: keyof Token | 'number') => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Sort tokens
  const sortedTokens = sortTokens(filteredTokens);

  // Pagination logic
  const indexOfLastToken = currentPage * tokensPerPage;
  const indexOfFirstToken = indexOfLastToken - tokensPerPage;
  const currentTokens = sortedTokens.slice(indexOfFirstToken, indexOfLastToken);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Get sort direction
  const getSortDirection = (key: keyof Token | 'number') => {
    if (sortConfig && sortConfig.key === key) {
      return sortConfig.direction === 'ascending' ? '↑' : '↓';
    }
    return '';
  };

  return (
    <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl text-blue-600 font-bold mb-4">Generate Token Voting</h2>
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <input
          type="number"
          value={tokenCount}
          onChange={(e) => setTokenCount(parseInt(e.target.value))}
          className="border rounded px-3 py-2 w-24"
          min="1"
        />
        <button
          onClick={generateTokens}
          disabled={generatingTokens}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300 transition duration-300"
        >
          {generatingTokens ? 'Generating...' : 'Generate Tokens'}
        </button>
        <button
          onClick={() => {
            setTokenToDelete(null);
            setShowDeleteConfirmation(true);
          }}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition duration-300"
        >
          Hapus Semua Token
        </button>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-green-300 transition duration-300"
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      <p className="mb-4 text-sm text-gray-600">
        Token akan diekspor ke file CSV setelah di-generate.
      </p>

      <h3 className="text-l text-blue-600 font-bold mb-2">Status Penggunaan Token</h3>
      <p className="mb-2 text-sm text-gray-600">
        Klik "Set Digunakan" untuk menandai token telah digunakan, atau "Set Belum Digunakan" untuk mereset status token.
      </p>

      <div className="mb-4 relative">
        <input
          type="text"
          placeholder="Cari token..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full border rounded px-3 py-2 pl-10"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
      </div>

      {loading ? (
  <p>Loading tokens...</p>
) : (
  <div className="overflow-x-auto">
    <table className="admin-table">
      <thead>
        <tr>
          <th>
            <button onClick={() => requestSort('number')} className="flex items-center">
              No <ArrowUpDown size={16} className="ml-1" />
              {getSortDirection('number')}
            </button>
          </th>
          <th>
            <button onClick={() => requestSort('token')} className="flex items-center">
              Token <ArrowUpDown size={16} className="ml-1" />
              {getSortDirection('token')}
            </button>
          </th>
          <th>
            <button onClick={() => requestSort('used')} className="flex items-center">
              Status <ArrowUpDown size={16} className="ml-1" />
              {getSortDirection('used')}
            </button>
          </th>
          <th>Aksi</th>
        </tr>
      </thead>
      <tbody>
      {currentTokens.map((token) => (
    <tr key={token.id}>
      <td>{token.originalIndex + 1}</td>
      <td>{token.token}</td>
      <td className={token.used ? 'text-blue-500' : 'text-green-500'}>
        {token.used ? 'Digunakan' : 'Belum Digunakan'}
      </td>
            <td>
              <button
                onClick={() => handleUpdateToken(token.id, !token.used)}
                className={`admin-btn mr-2 ${
                  token.used ? 'admin-btn-success' : 'admin-btn-primary'
                }`}
              >
                {token.used ? 'Set Belum Digunakan' : 'Set Digunakan'}
              </button>
              <button
                onClick={() => handleDeleteToken(token)}
                className="admin-btn admin-btn-danger"
              >
                Hapus
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}

      <div className="mt-4 flex justify-between items-center">
        <button
          onClick={() => paginate(currentPage - 1)}
          disabled={currentPage === 1}
          className="bg-gray-300 text-gray-700 px-3 py-1 rounded hover:bg-gray-400 disabled:bg-gray-200"
        >
          <ChevronLeft size={20} />
        </button>
        <span>
          Page {currentPage} of {Math.ceil(sortedTokens.length / tokensPerPage)}
        </span>
        <button
          onClick={() => paginate(currentPage + 1)}
          disabled={currentPage === Math.ceil(sortedTokens.length / tokensPerPage)}
          className="bg-gray-300 text-gray-700 px-3 py-1 rounded hover:bg-gray-400 disabled:bg-gray-200"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-4">Konfirmasi Penghapusan</h3>
            <p className="mb-4">
              {tokenToDelete
                ? `Apakah Anda yakin ingin menghapus token: ${tokenToDelete.token}?`
                : 'Apakah Anda yakin ingin menghapus semua token?'}
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowDeleteConfirmation(false);
                  setTokenToDelete(null);
                }}
                className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
              >
                Batal
              </button>
              <button
                onClick={tokenToDelete ? confirmDeleteToken : handleDeleteAllTokens}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TokenGenerator;
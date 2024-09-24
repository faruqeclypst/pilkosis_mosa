import React, { useState, useEffect } from 'react';
import { ref, onValue, push, remove, update, get } from 'firebase/database';
import { db } from '../../services/firebase';
import { Token } from '../../types';
import { saveAs } from 'file-saver';
import { ChevronLeft, ChevronRight, Search, ArrowUpDown, Check, X, Trash2 } from 'lucide-react';
import '../../assets/css/AdminTable.css';

interface TokenGeneratorProps {
  setError: (error: string | null) => void;
}

const TokenGenerator: React.FC<TokenGeneratorProps> = ({ setError }) => {
  const [studentTokenCount, setStudentTokenCount] = useState(5);
  const [teacherTokenCount, setTeacherTokenCount] = useState(5);
  const [generatingTokens, setGeneratingTokens] = useState(false);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [tokenToDelete, setTokenToDelete] = useState<Token | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState({ student: 1, teacher: 1 });
  const [tokensPerPage] = useState(5);

  // Sorting state
  const [sortConfig, setSortConfig] = useState<{ key: keyof Token | 'number'; direction: 'ascending' | 'descending' } | null>(null);

  useEffect(() => {
    fetchTokens();
  }, []);

  useEffect(() => {
    setCurrentPage({ student: 1, teacher: 1 });
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

  const generateTokens = async (type: 'student' | 'teacher') => {
    setGeneratingTokens(true);
    const newTokens: string[] = [];
    const tokensRef = ref(db, 'tokens');
    const count = type === 'student' ? studentTokenCount : teacherTokenCount;

    try {
      for (let i = 0; i < count; i++) {
        const token = generateToken();
        newTokens.push(token);
        await push(tokensRef, {
          token,
          used: false,
          candidateId: null,
          type
        });
      }
      console.log(`${count} ${type} token berhasil digenerate`);
      exportTokensToCSV(newTokens, type);
      fetchTokens();
    } catch (error) {
      console.error("Error generating tokens: ", error);
      setError('Gagal generate token');
    } finally {
      setGeneratingTokens(false);
    }
  };

  const exportTokensToCSV = (tokens: string[], type: 'student' | 'teacher') => {
    const csvContent = ["Token"].concat(tokens).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `voting_tokens_${type}.csv`);
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
              voteCount: candidateData.voteCount - (tokenData.type === 'teacher' ? 2 : 1)
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
  const getPageTokens = (type: 'student' | 'teacher') => {
    const typeTokens = sortedTokens.filter(token => token.type === type);
    const indexOfLastToken = currentPage[type] * tokensPerPage;
    const indexOfFirstToken = indexOfLastToken - tokensPerPage;
    return typeTokens.slice(indexOfFirstToken, indexOfLastToken);
  };

  const paginate = (type: 'student' | 'teacher', pageNumber: number) => {
    setCurrentPage(prevState => ({ ...prevState, [type]: pageNumber }));
  };

  // Get sort direction
  const getSortDirection = (key: keyof Token | 'number') => {
    if (sortConfig && sortConfig.key === key) {
      return sortConfig.direction === 'ascending' ? '↑' : '↓';
    }
    return '';
  };

const renderTokenTable = (type: 'student' | 'teacher') => {
  const typeTokens = sortedTokens.filter(token => token.type === type);
  const startIndex = (currentPage[type] - 1) * tokensPerPage;
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-bold mb-4">
        {type === 'student' ? 'Token Siswa' : 'Token Guru'}
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="px-4 py-2">
                <button onClick={() => requestSort('number')} className="flex items-center">
                  No <ArrowUpDown size={16} className="ml-1" />
                  {getSortDirection('number')}
                </button>
              </th>
              <th className="px-4 py-2">
                <button onClick={() => requestSort('token')} className="flex items-center">
                  Token <ArrowUpDown size={16} className="ml-1" />
                  {getSortDirection('token')}
                </button>
              </th>
              <th className="px-4 py-2">
                <button onClick={() => requestSort('used')} className="flex items-center">
                  Status <ArrowUpDown size={16} className="ml-1" />
                  {getSortDirection('used')}
                </button>
              </th>
              <th className="px-4 py-2">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {getPageTokens(type).map((token, index) => (
              <tr key={token.id} className="border-b">
                <td className="px-4 py-2">{startIndex + index + 1}</td>
                <td className="px-4 py-2">{token.token}</td>
                <td className={`px-4 py-2 ${token.used ? 'text-blue-500' : 'text-green-500'}`}>
                  {token.used ? 'Digunakan' : 'Belum Digunakan'}
                </td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => handleUpdateToken(token.id, !token.used)}
                    className={`mr-2 p-1 rounded ${
                      token.used ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-500 hover:bg-blue-600'
                    } text-white`}
                    title={token.used ? 'Set Belum Digunakan' : 'Set Digunakan'}
                  >
                    {token.used ? <X size={18} /> : <Check size={18} />}
                  </button>
                  <button
                    onClick={() => handleDeleteToken(token)}
                    className="p-1 rounded bg-red-500 hover:bg-red-600 text-white"
                    title="Hapus"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex justify-between items-center">
        <button
          onClick={() => paginate(type, currentPage[type] - 1)}
          disabled={currentPage[type] === 1}
          className="bg-gray-300 text-gray-700 px-3 py-1 rounded hover:bg-gray-400 disabled:bg-gray-200"
        >
          <ChevronLeft size={20} />
        </button>
        <span>
          Page {currentPage[type]} of {Math.ceil(typeTokens.length / tokensPerPage)}
        </span>
        <button
          onClick={() => paginate(type, currentPage[type] + 1)}
          disabled={currentPage[type] === Math.ceil(typeTokens.length / tokensPerPage)}
          className="bg-gray-300 text-gray-700 px-3 py-1 rounded hover:bg-gray-400 disabled:bg-gray-200"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

  return (
    <div id="token-management" className="mt-8">
      <h2 className="text-2xl text-blue-600 font-bold mb-4">Generate Token Voting</h2>
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div>
            <label htmlFor="studentTokenCount" className="block text-sm font-medium text-gray-700">Jumlah Token Siswa</label>
            <input
              id="studentTokenCount"
              type="number"
              value={studentTokenCount}
              onChange={(e) => setStudentTokenCount(parseInt(e.target.value))}
              className="mt-1 block w-full border rounded px-3 py-2"
              min="1"
            />
          </div>
          <div>
            <label htmlFor="teacherTokenCount" className="block text-sm font-medium text-gray-700">Jumlah Token Guru</label>
            <input
              id="teacherTokenCount"
              type="number"
              value={teacherTokenCount}
              onChange={(e) => setTeacherTokenCount(parseInt(e.target.value))}
              className="mt-1 block w-full border rounded px-3 py-2"
              min="1"
            />
          </div>
          <div className="flex-col space-y-2">
            <button
              onClick={() => generateTokens('student')}
              disabled={generatingTokens}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300 transition duration-300 w-full"
            >
              {generatingTokens ? 'Generating...' : 'Generate Token Siswa'}
            </button>
            <button
              onClick={() => generateTokens('teacher')}
              disabled={generatingTokens}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-green-300 transition duration-300 w-full"
            >
              {generatingTokens ? 'Generating...' : 'Generate Token Guru'}
            </button>
          </div>
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
            className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 disabled:bg-yellow-300 transition duration-300"
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        <p className="mb-4 text-sm text-gray-600">
          Token akan diekspor ke file CSV setelah di-generate.
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h3 className="text-l text-blue-600 font-bold mb-2">Status Penggunaan Token</h3>
        <p className="mb-4 text-sm text-gray-600">
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
      </div>

      {loading ? (
        <p>Loading tokens...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {renderTokenTable('student')}
          {renderTokenTable('teacher')}
        </div>
      )}

      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm overflow-y-auto flex items-center justify-center z-50 p-4">
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
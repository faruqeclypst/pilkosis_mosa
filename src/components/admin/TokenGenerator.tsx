import React, { useState, useEffect } from 'react';
import { collection, writeBatch, doc, getDocs, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

interface TokenGeneratorProps {
  setError: (error: string | null) => void;
}

interface Token {
  id: string;
  token: string;
  used: boolean;
}

const TokenGenerator: React.FC<TokenGeneratorProps> = ({ setError }) => {
  const [tokenCount, setTokenCount] = useState(700);
  const [generatingTokens, setGeneratingTokens] = useState(false);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [tokenToDelete, setTokenToDelete] = useState<Token | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTokens();
  }, []);

  const fetchTokens = async () => {
    setLoading(true);
    try {
      const tokensSnapshot = await getDocs(collection(db, 'tokens'));
      const tokensData = tokensSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Token));
      setTokens(tokensData);
    } catch (error) {
      console.error("Error fetching tokens: ", error);
      setError('Gagal mengambil data token');
    } finally {
      setLoading(false);
    }
  };

  const generateToken = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!&@#';
    
    let token = '';
    
    // Generate 3 random letters
    for (let i = 0; i < 3; i++) {
      token += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    
    // Add 1 random number
    token += numbers.charAt(Math.floor(Math.random() * numbers.length));
    
    // Add 1 random symbol
    token += symbols.charAt(Math.floor(Math.random() * symbols.length));
    
    // Shuffle the token
    return token.split('').sort(() => Math.random() - 0.5).join('');
  };

  const generateTokens = async () => {
    setGeneratingTokens(true);
    const batch = writeBatch(db);
    const newTokens = [];

    for (let i = 0; i < tokenCount; i++) {
      const token = generateToken();
      const tokenRef = doc(collection(db, 'tokens'));
      batch.set(tokenRef, { token, used: false });
      newTokens.push(token);
    }

    try {
      await batch.commit();
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
    const csvContent = "data:text/csv;charset=utf-8," + tokens.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "voting_tokens.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteToken = async (token: Token) => {
    setTokenToDelete(token);
    setShowDeleteConfirmation(true);
  };

  const confirmDeleteToken = async () => {
    if (tokenToDelete) {
      try {
        await deleteDoc(doc(db, 'tokens', tokenToDelete.id));
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
      await updateDoc(doc(db, 'tokens', id), { used: !used });
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
      const batch = writeBatch(db);
      tokens.forEach((token) => {
        const tokenRef = doc(db, 'tokens', token.id);
        batch.delete(tokenRef);
      });
      await batch.commit();
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

  return (
    <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Generate Token Voting</h2>
      <div className="flex items-center space-x-4 mb-6">
        <input
          type="number"
          value={tokenCount}
          onChange={(e) => setTokenCount(parseInt(e.target.value))}
          className="border rounded px-3 py-2 w-40"
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

      <h3 className="text-xl font-bold mb-2">Status Penggunaan Token</h3>
      <p className="mb-2 text-sm text-gray-600">
        Klik "Set Digunakan" untuk menandai token telah digunakan, atau "Set Belum Digunakan" untuk mereset status token.
      </p>
      {loading ? (
        <p>Loading tokens...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="px-4 py-2 border">No</th>
                <th className="px-4 py-2 border">Token</th>
                <th className="px-4 py-2 border">Status</th>
                <th className="px-4 py-2 border">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {tokens.map((token, index) => (
                <tr key={token.id}>
                  <td className="px-4 py-2 border">{index + 1}</td>
                  <td className="px-4 py-2 border">{token.token}</td>
                  <td className={`px-4 py-2 border ${token.used ? 'text-red-500' : 'text-green-500'}`}>
                    {token.used ? 'Digunakan' : 'Belum Digunakan'}
                  </td>
                  <td className="px-4 py-2 border">
                    <button
                      onClick={() => handleUpdateToken(token.id, token.used)}
                      className={`px-2 py-1 rounded mr-2 ${
                        token.used
                          ? 'bg-green-500 hover:bg-green-600'
                          : 'bg-red-500 hover:bg-red-600'
                      } text-white`}
                    >
                      {token.used ? 'Set Belum Digunakan' : 'Set Digunakan'}
                    </button>
                    <button
                      onClick={() => handleDeleteToken(token)}
                      className="bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600"
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
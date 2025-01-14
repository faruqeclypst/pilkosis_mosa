import React, { useState, useEffect } from 'react';
import { ref, onValue, remove, update, get, push, set } from 'firebase/database';
import { db } from '../../../services/firebase';
import { Token, ClassConfig } from '../../../types';
import TokenGeneratorHeader from './TokenGeneratorHeader';
import TokenFilters from './TokenFilters';
import TokenTable from './TokenTable';
import ClassConfigSection from './ClassConfigSection';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface TokenGeneratorProps {
  setError: (error: string | null) => void;
}

interface PageState {
  teacher: number;
  [className: string]: number;
}

const TokenGenerator: React.FC<TokenGeneratorProps> = ({ setError }) => {
  // State
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingTokens, setGeneratingTokens] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState<PageState>({ teacher: 1 });
  const [tokensPerPage] = useState(5);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [tokenToDelete, setTokenToDelete] = useState<Token | null>(null);
  const [classConfigs, setClassConfigs] = useState<ClassConfig[]>([]);
  const [teacherCount, setTeacherCount] = useState(5);

  // Token stats
  const filteredTokens = tokens.filter(token =>
    token.token.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const stats = {
    totalTokens: filteredTokens.length,
    usedTokens: filteredTokens.filter(t => t.used).length,
    unusedTokens: filteredTokens.filter(t => !t.used && (!t.expiresAt || t.expiresAt > Date.now())).length,
    expiredTokens: filteredTokens.filter(t => t.expiresAt && t.expiresAt < Date.now()).length,
  };

  // Effects
  useEffect(() => {
    fetchTokens();
  }, []);

  useEffect(() => {
    setCurrentPage({ teacher: 1 });
  }, [searchTerm]);

  useEffect(() => {
    const classConfigRef = ref(db, 'classConfigs');
    
    // Gunakan onValue untuk realtime updates
    const unsubscribe = onValue(classConfigRef, (snapshot) => {
      if (snapshot.exists()) {
        const configs: ClassConfig[] = [];
        snapshot.forEach((childSnapshot) => {
          configs.push({
            id: childSnapshot.key,
            name: childSnapshot.val().name,
            studentCount: childSnapshot.val().studentCount
          });
        });
        setClassConfigs(configs);
      } else {
        // Jika tidak ada data, set array kosong
        setClassConfigs([]);
      }
    }, (error) => {
      console.error('Error fetching class configs:', error);
      setError('Error fetching class configs: ' + error.message);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, [setError]);

  // Functions
  const fetchTokens = () => {
    setLoading(true);
    const tokensRef = ref(db, 'tokens');
    onValue(tokensRef, (snapshot) => {
      const tokensData: Token[] = [];
      snapshot.forEach((childSnapshot) => {
        tokensData.push({
          id: childSnapshot.key as string,
          ...childSnapshot.val()
        } as Token);
      });
      setTokens(tokensData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching tokens: ", error);
      setError('Gagal mengambil data token');
      setLoading(false);
    });
  };

  const generateToken = () => {
    const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const numbers = '23456789';
    const getRandomChar = (charset: string) => charset.charAt(Math.floor(Math.random() * charset.length));
    const uppercasePart = Array.from({length: 4}, () => getRandomChar(uppercase)).join('');
    const numbersPart = Array.from({length: 2}, () => getRandomChar(numbers)).join('');
    return (uppercasePart + numbersPart).split('').sort(() => Math.random() - 0.5).join('');
  };

  // Fungsi khusus untuk generate token guru
  const generateTeacherTokens = async (count: number) => {
    const newTokens: string[] = [];
    const tokensRef = ref(db, 'tokens');

    try {
      // Get existing tokens
      const snapshot = await get(tokensRef);
      const existingTokens = new Set<string>();
      
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          existingTokens.add(child.val().token);
        });
      }

      // Generate unique tokens for teachers
      while (newTokens.length < count) {
        const token = generateToken();
        if (!existingTokens.has(token) && !newTokens.includes(token)) {
          newTokens.push(token);
          
          const tokenData = {
            token,
            used: false,
            candidateId: null,
            type: 'teacher',
            kelas: null,
            createdAt: Date.now(),
            expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
            voteWeight: 2 // Guru memiliki 2 suara
          };

          await push(tokensRef, tokenData);
        }
      }

      return newTokens;
    } catch (err) {
      console.error('Error generating teacher tokens:', err);
      throw new Error('Failed to generate teacher tokens');
    }
  };

  // Fungsi khusus untuk generate token siswa
  const generateStudentTokens = async (className: string, count: number) => {
    const newTokens: string[] = [];
    const tokensRef = ref(db, 'tokens');

    try {
      // Get existing tokens
      const snapshot = await get(tokensRef);
      const existingTokens = new Set<string>();
      
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          existingTokens.add(child.val().token);
        });
      }

      // Generate unique tokens for students
      while (newTokens.length < count) {
        const token = generateToken();
        if (!existingTokens.has(token) && !newTokens.includes(token)) {
          newTokens.push(token);
          
          const tokenData = {
            token,
            used: false,
            candidateId: null,
            type: 'student',
            kelas: className,
            createdAt: Date.now(),
            expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
            voteWeight: 1 // Siswa memiliki 1 suara
          };

          await push(tokensRef, tokenData);
        }
      }

      return newTokens;
    } catch (err) {
      console.error('Error generating student tokens:', err);
      throw new Error(`Failed to generate student tokens for class ${className}`);
    }
  };

  // Handler untuk generate token guru
  const handleGenerateTeacherTokens = async () => {
    if (teacherCount <= 0) {
      setError('Jumlah token guru harus lebih dari 0');
      return;
    }

    try {
      setGeneratingTokens(true);
      const generatedTokens = await generateTeacherTokens(teacherCount);
      
      if (generatedTokens.length > 0) {
        console.log(`Successfully generated ${generatedTokens.length} teacher tokens`);
      }
    } catch (err) {
      console.error('Error in handleGenerateTeacherTokens:', err);
      setError('Gagal generate token guru');
    } finally {
      setGeneratingTokens(false);
    }
  };

  // Handler untuk generate token siswa
  const handleGenerateStudentTokens = async (className: string) => {
    const classConfig = classConfigs.find(c => c.name === className);
    if (!classConfig) {
      setError('Kelas tidak ditemukan');
      return;
    }

    try {
      setGeneratingTokens(true);
      const generatedTokens = await generateStudentTokens(className, classConfig.studentCount);
      
      if (generatedTokens.length > 0) {
        console.log(`Successfully generated ${generatedTokens.length} student tokens for class ${className}`);
      }
    } catch (err) {
      console.error('Error in handleGenerateStudentTokens:', err);
      setError(`Gagal generate token untuk kelas ${className}`);
    } finally {
      setGeneratingTokens(false);
    }
  };

  const handleUpdateToken = async (id: string, used: boolean) => {
    try {
      const tokenRef = ref(db, `tokens/${id}`);
      const snapshot = await get(tokenRef);
      
      if (!snapshot.exists()) {
        setError('Token tidak ditemukan');
        return;
      }

      const tokenData = snapshot.val();
      
      // Update token status
      await update(tokenRef, { 
        used: used,
        updatedAt: Date.now(),
        // Reset candidateId jika token diset ke belum digunakan
        ...(used === false && { candidateId: null })
      });

      // Jika token diset ke belum digunakan dan sebelumnya memiliki vote
      if (!used && tokenData.used && tokenData.candidateId) {
        const candidateRef = ref(db, `candidates/${tokenData.candidateId}`);
        const candidateSnapshot = await get(candidateRef);
        
        if (candidateSnapshot.exists()) {
          const candidateData = candidateSnapshot.val();
          const voteWeight = tokenData.type === 'teacher' ? 2 : 1;
          
          // Kurangi vote count
          await update(candidateRef, {
            voteCount: Math.max(0, candidateData.voteCount - voteWeight)
          });
        }
      }

      // Tampilkan pesan sukses
      console.log('Status token berhasil diupdate');
    } catch (err) {
      console.error('Error updating token:', err);
      setError('Gagal mengupdate status token');
    }
  };

  const handleDeleteToken = async (token: Token) => {
    try {
      // Jika token sudah digunakan dan memiliki vote, kurangi vote count
      if (token.used && token.candidateId) {
        const candidateRef = ref(db, `candidates/${token.candidateId}`);
        const candidateSnapshot = await get(candidateRef);
        
        if (candidateSnapshot.exists()) {
          const candidateData = candidateSnapshot.val();
          const voteWeight = token.type === 'teacher' ? 2 : 1;
          
          await update(candidateRef, {
            voteCount: Math.max(0, candidateData.voteCount - voteWeight)
          });
        }
      }

      // Hapus token
      const tokenRef = ref(db, `tokens/${token.id}`);
      await remove(tokenRef);

      // Tampilkan pesan sukses
      console.log('Token berhasil dihapus');
    } catch (err) {
      console.error('Error deleting token:', err);
      setError('Gagal menghapus token');
    }
  };

  const handleDeleteAllTokens = async () => {
    try {
      // Ambil semua token yang digunakan
      const tokensRef = ref(db, 'tokens');
      const snapshot = await get(tokensRef);
      
      if (snapshot.exists()) {
        // Update vote counts untuk semua kandidat
        const updates: { [key: string]: number } = {};
        
        snapshot.forEach((childSnapshot) => {
          const token = childSnapshot.val() as Token;
          if (token.used && token.candidateId) {
            const voteWeight = token.type === 'teacher' ? 2 : 1;
            if (!updates[token.candidateId]) {
              updates[token.candidateId] = 0;
            }
            updates[token.candidateId] -= voteWeight;
          }
        });

        // Apply updates ke kandidat jika ada
        for (const [candidateId, voteDiff] of Object.entries(updates)) {
          const candidateRef = ref(db, `candidates/${candidateId}`);
          const candidateSnapshot = await get(candidateRef);
          if (candidateSnapshot.exists()) {
            const currentVotes = candidateSnapshot.val().voteCount || 0;
            await update(candidateRef, {
              voteCount: Math.max(0, currentVotes + voteDiff)
            });
          }
        }
      }

      // Hapus semua token
      await remove(tokensRef);
      setShowDeleteConfirmation(false);
      
      // Refresh data
      fetchTokens();
      
      console.log('Semua token berhasil dihapus');
    } catch (err) {
      console.error('Error deleting all tokens:', err);
      setError('Error deleting all tokens: ' + (err as Error).message);
    }
  };

  const confirmDeleteToken = async () => {
    if (tokenToDelete) {
      try {
        await remove(ref(db, `tokens/${tokenToDelete.id}`));
        setShowDeleteConfirmation(false);
        setTokenToDelete(null);
      } catch (err) {
        setError('Error deleting token: ' + (err as Error).message);
      }
    }
  };

  const handleSaveClassConfigs = async (newConfigs: ClassConfig[]) => {
    try {
      const classConfigRef = ref(db, 'classConfigs');
      
      if (newConfigs.length === 0) {
        // Jika array kosong, hapus semua data
        await remove(classConfigRef);
        return;
      }

      // Convert array to object with unique keys
      const configsObject: { [key: string]: Omit<ClassConfig, 'id'> } = {};
      
      newConfigs.forEach(config => {
        // Use existing ID or generate new one
        const configId = config.id?.startsWith('temp-') ? 
          push(classConfigRef).key : 
          config.id || push(classConfigRef).key;
          
        if (configId) {
          configsObject[configId] = {
            name: config.name,
            studentCount: config.studentCount
          };
        }
      });

      // Save to Firebase
      await set(classConfigRef, configsObject);
      
    } catch (err) {
      console.error('Error saving class configs:', err);
      throw new Error('Failed to save class configurations');
    }
  };

  const exportToPDF = (tokens: Token[], type: 'student' | 'teacher', className?: string) => {
    const doc = new jsPDF();
    
    // Add title
    const title = type === 'teacher' ? 
      'Daftar Token Guru' : 
      `Daftar Token Siswa - Kelas ${className}`;
    
    doc.setFontSize(16);
    doc.text(title, 14, 15);
    
    // Add metadata
    doc.setFontSize(10);
    doc.text(`Tanggal: ${new Date().toLocaleDateString()}`, 14, 25);
    doc.text(`Total Token: ${tokens.length}`, 14, 30);
    
    // Create table
    const tableColumns = [
      { header: 'Token', dataKey: 'token' },
      { header: 'Status', dataKey: 'status' },
      { header: 'Dibuat', dataKey: 'created' },
      { header: 'Kadaluarsa', dataKey: 'expires' }
    ];
    
    const tableRows = tokens.map(token => ({
      token: token.token,
      status: token.used ? 'Digunakan' : 'Belum Digunakan',
      created: new Date(token.createdAt).toLocaleString(),
      expires: token.expiresAt ? new Date(token.expiresAt).toLocaleString() : '-'
    }));
    
    (doc as any).autoTable({
      startY: 35,
      head: [tableColumns.map(col => col.header)],
      body: tableRows.map(row => tableColumns.map(col => row[col.dataKey as keyof typeof row])),
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] }
    });
    
    // Save PDF
    doc.save(`token_${type}_${className || 'guru'}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (loading) {
    return <div className="p-6">Loading tokens...</div>;
  }

  return (
    <div className="space-y-6">
      <ClassConfigSection
        classConfigs={classConfigs}
        onSaveConfigs={handleSaveClassConfigs}
      />

      <TokenGeneratorHeader
        onDeleteAllTokens={() => setShowDeleteConfirmation(true)}
      />

      <TokenFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        {...stats}
      />

      <div className="space-y-6">
        {/* Teacher Token Table */}
        <TokenTable
          type="teacher"
          tokens={filteredTokens}
          currentPage={currentPage.teacher}
          tokensPerPage={tokensPerPage}
          onPageChange={(page) => setCurrentPage(prev => ({ ...prev, teacher: page }))}
          onUpdateToken={handleUpdateToken}
          onDeleteToken={handleDeleteToken}
          onExportPDF={() => exportToPDF(
            filteredTokens.filter(t => t.type === 'teacher'),
            'teacher'
          )}
          onGenerateTokens={handleGenerateTeacherTokens}
          isGenerating={generatingTokens}
          studentCount={teacherCount}
          onTeacherCountChange={setTeacherCount}
        />

        {/* Student Token Tables - One per class */}
        {classConfigs.map(config => (
          <TokenTable
            key={config.name}
            type="student"
            className={config.name}
            tokens={filteredTokens}
            currentPage={currentPage[config.name] || 1}
            tokensPerPage={tokensPerPage}
            onPageChange={(page) => setCurrentPage(prev => ({ 
              ...prev, 
              [config.name]: page 
            }))}
            onUpdateToken={handleUpdateToken}
            onDeleteToken={handleDeleteToken}
            onExportPDF={() => exportToPDF(
              filteredTokens.filter(t => t.type === 'student' && t.kelas === config.name),
              'student',
              config.name
            )}
            onGenerateTokens={() => handleGenerateStudentTokens(config.name)}
            isGenerating={generatingTokens}
            studentCount={config.studentCount}
          />
        ))}
      </div>

      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Konfirmasi Hapus Token
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  {tokenToDelete 
                    ? `Apakah Anda yakin ingin menghapus token: ${tokenToDelete.token}?`
                    : 'Apakah Anda yakin ingin menghapus semua token? Tindakan ini tidak dapat dibatalkan.'}
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={tokenToDelete ? confirmDeleteToken : handleDeleteAllTokens}
                  className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-full 
                           shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300"
                >
                  Ya, Hapus Token
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirmation(false);
                    setTokenToDelete(null);
                  }}
                  className="mt-3 px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md w-full 
                           shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TokenGenerator; 
import React from 'react';
import { Token } from '../../../types';
import { ChevronLeft, ChevronRight, Check, X, Trash2 } from 'lucide-react';

interface TokenTableProps {
  type: 'student' | 'teacher';
  tokens: Token[];
  currentPage: number;
  tokensPerPage: number;
  onPageChange: (page: number) => void;
  onUpdateToken: (id: string, used: boolean) => Promise<void>;
  onDeleteToken: (token: Token) => void;
  className?: string;
  onExportPDF?: () => void;
  onGenerateTokens?: () => Promise<void>;
  isGenerating?: boolean;
  studentCount?: number;
  onTeacherCountChange?: (count: number) => void;
}

const TokenTable: React.FC<TokenTableProps> = ({
  type,
  tokens,
  currentPage,
  tokensPerPage,
  onPageChange,
  onUpdateToken,
  onDeleteToken,
  className,
  onExportPDF,
  onGenerateTokens,
  isGenerating,
  studentCount,
  onTeacherCountChange
}) => {
  const filteredTokens = tokens.filter(token => {
    if (type === 'teacher') return token.type === 'teacher';
    return token.type === 'student' && token.kelas === className;
  });

  const startIndex = (currentPage - 1) * tokensPerPage;
  const pageTokens = filteredTokens.slice(startIndex, startIndex + tokensPerPage);

  const TokenRow = ({ token, index }: { token: Token; index: number }) => {
    const isExpired = token.expiresAt ? token.expiresAt < Date.now() : false;

    return (
      <>
        {/* Desktop View */}
        <tr className="hidden md:table-row hover:bg-gray-50">
          <td className="px-4 py-3 text-sm">
            {startIndex + index + 1}
          </td>
          <td className="px-4 py-3">
            <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
              {token.token}
            </span>
          </td>
          <td className="px-4 py-3 text-sm text-gray-500">
            {token.createdAt ? (
              <div>
                <div>{new Date(token.createdAt).toLocaleDateString()}</div>
                <div className="text-xs">{new Date(token.createdAt).toLocaleTimeString()}</div>
              </div>
            ) : 'N/A'}
          </td>
          <td className="px-4 py-3">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
              ${token.used 
                ? 'bg-blue-100 text-blue-800' 
                : isExpired 
                  ? 'bg-red-100 text-red-800'
                  : 'bg-green-100 text-green-800'
              }`}
            >
              {token.used 
                ? 'Digunakan' 
                : isExpired 
                  ? 'Kadaluarsa'
                  : 'Belum Digunakan'}
            </span>
          </td>
          <td className="px-4 py-3">
            <span className="text-sm text-gray-600">
              {token.kelas || '-'}
            </span>
          </td>
          <td className="px-4 py-3">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onUpdateToken(token.id, !token.used)}
                disabled={isExpired}
                className={`p-1 rounded ${
                  token.used 
                    ? 'bg-green-500 hover:bg-green-600' 
                    : 'bg-blue-500 hover:bg-blue-600'
                } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                title={token.used ? 'Set Belum Digunakan' : 'Set Digunakan'}
              >
                {token.used ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
              </button>
              <button
                onClick={() => onDeleteToken(token)}
                className="p-1 rounded bg-red-500 hover:bg-red-600 text-white"
                title="Hapus"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </td>
        </tr>

        {/* Mobile View */}
        <tr className="md:hidden border-b">
          <td className="px-4 py-3" colSpan={6}>
            <div className="flex flex-col space-y-3">
              <div className="flex justify-between items-start">
                <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                  {token.token}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                  ${token.used 
                    ? 'bg-blue-100 text-blue-800' 
                    : isExpired 
                      ? 'bg-red-100 text-red-800'
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  {token.used 
                    ? 'Digunakan' 
                    : isExpired 
                      ? 'Kadaluarsa'
                      : 'Belum Digunakan'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Dibuat:</span>
                  <div className="font-medium">
                    {token.createdAt ? (
                      <>
                        <div>{new Date(token.createdAt).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(token.createdAt).toLocaleTimeString()}
                        </div>
                      </>
                    ) : 'N/A'}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Kelas:</span>
                  <div className="font-medium">{token.kelas || '-'}</div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => onUpdateToken(token.id, !token.used)}
                  disabled={isExpired}
                  className={`flex items-center px-3 py-2 rounded-lg ${
                    token.used 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-blue-100 text-blue-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {token.used ? (
                    <>
                      <X className="w-4 h-4 mr-2" />
                      Set Belum Digunakan
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Set Digunakan
                    </>
                  )}
                </button>
                <button
                  onClick={() => onDeleteToken(token)}
                  className="flex items-center px-3 py-2 bg-red-100 text-red-700 rounded-lg"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Hapus
                </button>
              </div>
            </div>
          </td>
        </tr>
      </>
    );
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-800">
            {type === 'student' ? `Token Siswa - Kelas ${className}` : 'Token Guru'} 
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({filteredTokens.length} token)
            </span>
          </h3>
          {type === 'student' && studentCount && (
            <p className="text-sm text-gray-600 mt-1">
              Jumlah Siswa: {studentCount}
            </p>
          )}
          {type === 'teacher' && onTeacherCountChange && (
            <div className="flex items-center gap-2 mt-1">
              <label className="text-sm text-gray-600">Jumlah Token:</label>
              <input
                type="number"
                value={studentCount}
                onChange={(e) => onTeacherCountChange(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                min="1"
              />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-500">
            {type === 'teacher' ? '(2 suara)' : '(1 suara)'}
          </div>
          {onGenerateTokens && (
            <button
              onClick={onGenerateTokens}
              disabled={isGenerating}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-green-400"
            >
              {isGenerating ? 'Generating...' : 'Generate Token'}
            </button>
          )}
          {onExportPDF && (
            <button
              onClick={onExportPDF}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Export PDF
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 hidden md:table-header-group">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">No</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Token</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dibuat</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kelas</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {pageTokens.map((token, index) => (
              <TokenRow key={token.id} token={token} index={index} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex justify-between items-center">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </button>
        <span className="text-sm text-gray-600">
          Page {currentPage} of {Math.ceil(filteredTokens.length / tokensPerPage)}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === Math.ceil(filteredTokens.length / tokensPerPage)}
          className="flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </button>
      </div>
    </div>
  );
};

export default TokenTable; 
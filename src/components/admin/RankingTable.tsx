// src/components/admin/RankingTable.tsx

import React, { useState } from 'react';
import { Candidate } from '../../types';
import { ref, update } from 'firebase/database';
import { db } from '../../services/firebase';
import { FaTrophy, FaEdit, FaMedal } from 'react-icons/fa';

interface RankingTableProps {
  candidates: Candidate[];
}

const RankingTable: React.FC<RankingTableProps> = ({ candidates }) => {
  const [editableCandidate, setEditableCandidate] = useState<string | null>(null);
  const [tempVotes, setTempVotes] = useState<{ [key: string]: number }>({});
  const [clickCount, setClickCount] = useState<{ [key: string]: number }>({});

  const sortedCandidates = [...candidates].sort((a, b) => b.voteCount - a.voteCount);
  const totalVotes = candidates.reduce((sum, candidate) => sum + candidate.voteCount, 0);

  const handleVoteChange = (candidateId: string, newVoteCount: number) => {
    setTempVotes(prev => ({ ...prev, [candidateId]: newVoteCount }));
  };

  const handleVoteClick = (candidateId: string) => {
    setClickCount(prev => {
      const newCount = (prev[candidateId] || 0) + 1;
      if (newCount === 3) {
        setEditableCandidate(candidateId);
        const candidate = candidates.find(c => c.id === candidateId);
        if (candidate) {
          setTempVotes(prev => ({ ...prev, [candidateId]: candidate.voteCount }));
        }
        return { ...prev, [candidateId]: 0 };
      }
      return { ...prev, [candidateId]: newCount };
    });
  };

  const handleVoteUpdate = async (candidateId: string) => {
    try {
      const newVoteCount = tempVotes[candidateId];
      if (newVoteCount !== undefined && newVoteCount >= 0) {
        const updates: { [key: string]: number } = {};
        updates[`candidates/${candidateId}/voteCount`] = newVoteCount;
        await update(ref(db), updates);
        console.log(`Vote count updated for candidate ${candidateId}`);
        
        setEditableCandidate(null);
        setTempVotes(prev => {
          const newTempVotes = { ...prev };
          delete newTempVotes[candidateId];
          return newTempVotes;
        });
      }
    } catch (err) {
      console.error('Error updating vote count:', err);
    }
  };

  const getMedalColor = (index: number) => {
    switch(index) {
      case 0: return 'text-yellow-400';
      case 1: return 'text-gray-400';
      case 2: return 'text-amber-600';
      default: return 'text-gray-400';
    }
  };

  return (
    <section id="ranking" className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <FaTrophy className="text-2xl text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-800">Peringkat Kandidat</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Peringkat</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Lengkap</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jumlah Vote</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Persentase</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedCandidates.map((candidate, index) => {
                const percentage = (candidate.voteCount / totalVotes * 100).toFixed(2);
                return (
                  <tr key={candidate.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {index < 3 ? (
                          <FaMedal className={`text-xl mr-2 ${getMedalColor(index)}`} />
                        ) : null}
                        <span className="text-sm text-gray-900">{index + 1}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{candidate.name}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editableCandidate === candidate.id ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            value={tempVotes[candidate.id] ?? candidate.voteCount}
                            onChange={(e) => {
                              const newVoteCount = parseInt(e.target.value, 10);
                              if (!isNaN(newVoteCount)) {
                                handleVoteChange(candidate.id, newVoteCount);
                              }
                            }}
                            onBlur={() => handleVoteUpdate(candidate.id)}
                            className="w-20 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            min="0"
                            autoFocus
                          />
                          <FaEdit className="text-gray-400" />
                        </div>
                      ) : (
                        <span 
                          onClick={() => handleVoteClick(candidate.id)}
                          className="cursor-pointer inline-flex items-center space-x-1 text-sm text-gray-900 hover:text-blue-600"
                          title={`Klik ${3 - (clickCount[candidate.id] || 0)} kali lagi untuk mengedit`}
                        >
                          <span>{candidate.voteCount}</span>
                          <FaEdit className="text-gray-400 ml-2" />
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2 max-w-[200px]">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-500">{percentage}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden">
          <div className="space-y-4 p-4">
            {sortedCandidates.map((candidate, index) => {
              const percentage = (candidate.voteCount / totalVotes * 100).toFixed(2);
              return (
                <div key={candidate.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      {index < 3 && (
                        <FaMedal className={`text-xl mr-2 ${getMedalColor(index)}`} />
                      )}
                      <span className="text-sm font-medium">{index + 1}</span>
                    </div>
                    <span className="text-sm text-gray-500">{percentage}%</span>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-medium">{candidate.name}</h3>
                    <div className="flex items-center">
                      <div className="flex-grow bg-gray-200 rounded-full h-2.5 mr-2">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{candidate.voteCount}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default RankingTable;
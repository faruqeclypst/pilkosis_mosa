// src/components/admin/RankingTable.tsx

import React, { useState } from 'react';
import { Candidate } from '../../types';
import { ref, update } from 'firebase/database';
import { db } from '../../services/firebase';

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

  return (
    <section id="ranking" className="admin-card">
      <h2 className="text-2xl font-semibold mb-4">Peringkat Kandidat</h2>
      <div className="overflow-x-auto">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Peringkat</th>
              <th>Nama Lengkap</th>
              <th>Jumlah Vote</th>
              <th>Persentase</th>
            </tr>
          </thead>
          <tbody>
            {sortedCandidates.map((candidate, index) => {
              const percentage = (candidate.voteCount / totalVotes * 100).toFixed(2);
              return (
                <tr key={candidate.id}>
                  <td>{index + 1}</td>
                  <td>{candidate.name}</td>
                  <td>
                    {editableCandidate === candidate.id ? (
                      <div>
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
                          className="admin-input w-20"
                          min="0"
                          autoFocus
                        />
                      </div>
                    ) : (
                      <span 
                        onClick={() => handleVoteClick(candidate.id)}
                        className="cursor-pointer"
                        title={`Klik ${3 - (clickCount[candidate.id] || 0)} kali lagi untuk mengedit`}
                      >
                        {candidate.voteCount}
                      </span>
                    )}
                  </td>
                  <td>{percentage}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default RankingTable;
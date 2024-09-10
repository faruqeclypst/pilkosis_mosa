// src/components/admin/StatisticsSection.tsx

import React, { useState } from 'react';
import { Candidate } from '../../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface StatisticsSectionProps {
  candidates: Candidate[];
}

const StatisticsSection: React.FC<StatisticsSectionProps> = ({ candidates }) => {
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  const totalVotes = candidates.reduce((sum, candidate) => sum + candidate.voteCount, 0);

  return (
    <section id="statistics" className="admin-card">
      <h2 className="text-2xl font-semibold mb-4">Statistik Pemilihan</h2>
      
      <div className="flex justify-between items-center mb-4">
        <p className="text-lg font-medium">
          Total Vote: <span className="font-bold">{totalVotes}</span>
        </p>
        <button
          onClick={() => setChartType(chartType === 'pie' ? 'bar' : 'pie')}
          className="admin-btn admin-btn-secondary"
        >
          Switch to {chartType === 'pie' ? 'Bar' : 'Pie'} Chart
        </button>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-xl font-semibold mb-2">
          {chartType === 'pie' ? 'Pie Chart' : 'Bar Chart'}
        </h3>
        <div id="chart-container" className="admin-chart-container">
          <ResponsiveContainer width="100%" height={400}>
            {chartType === 'pie' ? (
              <PieChart>
                <Pie
                  data={candidates}
                  dataKey="voteCount"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={150}
                  fill="#8884d8"
                  label={(entry) => `${entry.name}: ${entry.voteCount}`}
                >
                  {candidates.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            ) : (
              <BarChart
                data={candidates}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="voteCount" fill="#8884d8">
                  {candidates.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
};

export default StatisticsSection;
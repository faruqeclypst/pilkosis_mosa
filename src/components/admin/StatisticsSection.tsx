// src/components/admin/StatisticsSection.tsx

import React, { useState, useEffect } from 'react';
import { Candidate } from '../../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { FaChartPie, FaChartBar } from 'react-icons/fa';

interface StatisticsSectionProps {
  candidates: Candidate[];
}

const StatisticsSection: React.FC<StatisticsSectionProps> = ({ candidates }) => {
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  const totalVotes = candidates.reduce((sum, candidate) => sum + candidate.voteCount, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-medium">{payload[0].payload.name}</p>
          <p className="text-gray-600">Vote: {payload[0].value}</p>
          <p className="text-gray-600">
            {((payload[0].value / totalVotes) * 100).toFixed(2)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <section id="statistics" className="p-6">
      <div className="flex items-center gap-3 mb-6">
        {chartType === 'pie' ? (
          <FaChartPie className="text-2xl text-blue-600" />
        ) : (
          <FaChartBar className="text-2xl text-blue-600" />
        )}
        <h2 className="text-xl font-semibold text-gray-800">Statistik Pemilihan</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="space-y-1">
            <h3 className="text-lg font-medium text-gray-900">
              Total Suara Masuk
            </h3>
            <p className="text-3xl font-bold text-blue-600">
              {totalVotes}
              <span className="text-sm font-normal text-gray-500 ml-2">suara</span>
            </p>
          </div>
          
          <button
            onClick={() => setChartType(chartType === 'pie' ? 'bar' : 'pie')}
            className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {chartType === 'pie' ? <FaChartBar className="mr-2" /> : <FaChartPie className="mr-2" />}
            Switch to {chartType === 'pie' ? 'Bar' : 'Pie'} Chart
          </button>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 md:p-6">
          <div className="h-[300px] md:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'pie' ? (
                <PieChart>
                  <Pie
                    data={candidates}
                    dataKey="voteCount"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={isMobile ? 100 : 150}
                    fill="#8884d8"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {candidates.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend layout={isMobile ? "horizontal" : "vertical"} align="center" />
                </PieChart>
              ) : (
                <BarChart
                  data={candidates}
                  margin={{ 
                    top: 20, 
                    right: isMobile ? 10 : 30, 
                    left: isMobile ? 10 : 20, 
                    bottom: isMobile ? 60 : 5 
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    interval={0}
                    tick={{ fontSize: isMobile ? 10 : 12 }}
                  />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: '10px' }}/>
                  <Bar dataKey="voteCount" fill="#3B82F6">
                    {candidates.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatisticsSection;
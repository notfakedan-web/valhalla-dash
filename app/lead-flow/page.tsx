'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

// ============================================================================
// DATA TYPES
// ============================================================================

interface LeadFlowData {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  utm_term: string;
  submitted_at: string;
  goal: string;
  monthly_rev: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  familiarity: string;
  desired_income: string;
  biggest_issue: string;
  investment_amount: string;
  credit_score: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function LeadFlowPage() {
  const [data, setData] = useState<LeadFlowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedGoal, setSelectedGoal] = useState<string>('all');

  // ============================================================================
  // FETCH DATA
  // ============================================================================

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/lead-flow');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error('Error fetching lead flow data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // ============================================================================
  // FILTERING
  // ============================================================================

  const filteredData = data.filter((d) => {
    if (startDate && new Date(d.submitted_at) < new Date(startDate)) return false;
    if (endDate && new Date(d.submitted_at) > new Date(endDate)) return false;
    if (selectedSource !== 'all' && d.utm_source !== selectedSource) return false;
    if (selectedGoal !== 'all' && d.goal !== selectedGoal) return false;
    return true;
  });

  // ============================================================================
  // METRICS
  // ============================================================================

  const totalApplicants = filteredData.length;

  // Applicants over time
  const applicantsOverTime = filteredData
    .reduce((acc: { date: string; count: number }[], d) => {
      const date = d.submitted_at.split(' ')[0]; // Get date only
      const existing = acc.find((item) => item.date === date);
      if (existing) {
        existing.count += 1;
      } else {
        acc.push({ date, count: 1 });
      }
      return acc;
    }, [])
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Source breakdown
  const sourceBreakdown = filteredData
    .reduce((acc: { source: string; count: number; percentage: number }[], d) => {
      const existing = acc.find((item) => item.source === d.utm_source);
      if (existing) {
        existing.count += 1;
      } else {
        acc.push({ source: d.utm_source || 'Unknown', count: 1, percentage: 0 });
      }
      return acc;
    }, [])
    .map((item) => ({
      ...item,
      percentage: (item.count / totalApplicants) * 100,
    }))
    .sort((a, b) => b.count - a.count);

  // Monthly revenue breakdown
  const revenueBreakdown = filteredData.reduce(
    (acc: Record<string, number>, d) => {
      const rev = d.monthly_rev || 'Unknown';
      acc[rev] = (acc[rev] || 0) + 1;
      return acc;
    },
    {}
  );

  // Goal breakdown
  const goalBreakdown = filteredData.reduce(
    (acc: Record<string, number>, d) => {
      const goal = d.goal || 'Unknown';
      acc[goal] = (acc[goal] || 0) + 1;
      return acc;
    },
    {}
  );

  // Investment amount breakdown
  const investmentBreakdown = filteredData.reduce(
    (acc: Record<string, number>, d) => {
      const amount = d.investment_amount || 'Unknown';
      acc[amount] = (acc[amount] || 0) + 1;
      return acc;
    },
    {}
  );

  // Unique values for filters
  const uniqueSources = Array.from(new Set(data.map((d) => d.utm_source).filter(Boolean)));
  const uniqueGoals = Array.from(new Set(data.map((d) => d.goal).filter(Boolean)));

  // Colors for charts
  const COLORS = ['#06B6D4', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#EF4444'];

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-2xl">Loading lead flow data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl text-red-500 mb-4">Error loading data</div>
          <div className="text-gray-400">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">LEADS DATA</h1>
        <p className="text-gray-400">Agency scaling application tracking</p>
      </div>

      {/* Filters */}
      <div className="bg-gray-900 rounded-lg p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-gray-800 text-white px-4 py-2 rounded border border-gray-700 focus:border-cyan-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-gray-800 text-white px-4 py-2 rounded border border-gray-700 focus:border-cyan-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Source</label>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="w-full bg-gray-800 text-white px-4 py-2 rounded border border-gray-700 focus:border-cyan-500 focus:outline-none"
            >
              <option value="all">All Sources</option>
              {uniqueSources.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Goal</label>
            <select
              value={selectedGoal}
              onChange={(e) => setSelectedGoal(e.target.value)}
              className="w-full bg-gray-800 text-white px-4 py-2 rounded border border-gray-700 focus:border-cyan-500 focus:outline-none"
            >
              <option value="all">All Goals</option>
              {uniqueGoals.map((goal) => (
                <option key={goal} value={goal}>
                  {goal}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Total Applicants */}
      <div className="bg-cyan-500 rounded-lg p-8 mb-8 text-center">
        <div className="text-sm text-cyan-900 mb-2">TOTAL APPLICANTS</div>
        <div className="text-5xl font-bold">{totalApplicants.toLocaleString()}</div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Applicants Over Time */}
        <div className="bg-gray-900 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-300">APPLICANTS OVER TIME</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={applicantsOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#D1D5DB' }}
              />
              <Line type="monotone" dataKey="count" stroke="#06B6D4" strokeWidth={2} dot={{ fill: '#06B6D4' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Revenue Distribution */}
        <div className="bg-gray-900 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-300">CURRENT MONTHLY REVENUE</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={Object.entries(revenueBreakdown).map(([range, count]) => ({
                range,
                count,
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="range" stroke="#9CA3AF" angle={-45} textAnchor="end" height={100} />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#D1D5DB' }}
              />
              <Bar dataKey="count" fill="#06B6D4" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Source Breakdown */}
        <div className="bg-gray-900 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-300">TRAFFIC SOURCE</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={sourceBreakdown}
                dataKey="count"
                nameKey="source"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(entry) => `${entry.source}: ${entry.count}`}
              >
                {sourceBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#D1D5DB' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Investment Amount */}
        <div className="bg-gray-900 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-300">INVESTMENT CAPACITY</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={Object.entries(investmentBreakdown)
                .map(([range, count]) => ({ range, count }))
                .sort((a, b) => b.count - a.count)}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="range" stroke="#9CA3AF" angle={-45} textAnchor="end" height={100} />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#D1D5DB' }}
              />
              <Bar dataKey="count" fill="#8B5CF6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Goal Breakdown Cards */}
      <div className="bg-gray-900 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-300">AGENCY GOALS</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(goalBreakdown).map(([goal, count]) => (
            <div key={goal} className="bg-gray-800 rounded p-4">
              <div className="text-gray-400 text-sm mb-2">{goal}</div>
              <div className="text-3xl font-bold text-cyan-500">{count}</div>
              <div className="text-gray-500 text-sm">
                {((count / totalApplicants) * 100).toFixed(1)}% of total
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-gray-900 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-300">RECENT APPLICANTS</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left py-3 px-3 text-gray-400 font-medium">DATE</th>
                <th className="text-left py-3 px-3 text-gray-400 font-medium">NAME</th>
                <th className="text-left py-3 px-3 text-gray-400 font-medium">EMAIL</th>
                <th className="text-left py-3 px-3 text-gray-400 font-medium">PHONE</th>
                <th className="text-left py-3 px-3 text-gray-400 font-medium">CURRENT REV</th>
                <th className="text-left py-3 px-3 text-gray-400 font-medium">GOAL</th>
                <th className="text-left py-3 px-3 text-gray-400 font-medium">INVESTMENT</th>
                <th className="text-left py-3 px-3 text-gray-400 font-medium">SOURCE</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.slice(0, 100).map((item, index) => (
                <tr key={index} className="border-b border-gray-800 hover:bg-gray-800">
                  <td className="py-3 px-3 text-white">{item.submitted_at}</td>
                  <td className="py-3 px-3 text-white">{item.first_name} {item.last_name}</td>
                  <td className="py-3 px-3 text-white">{item.email}</td>
                  <td className="py-3 px-3 text-white">{item.phone}</td>
                  <td className="py-3 px-3 text-white">{item.monthly_rev}</td>
                  <td className="py-3 px-3 text-white">{item.goal}</td>
                  <td className="py-3 px-3 text-cyan-400 font-semibold">{item.investment_amount}</td>
                  <td className="py-3 px-3 text-white">
                    <span className="px-2 py-1 bg-cyan-900 text-cyan-300 rounded text-xs">
                      {item.utm_source || 'Direct'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredData.length > 100 && (
          <div className="text-center mt-4 text-gray-400">
            Showing 100 of {filteredData.length} results
          </div>
        )}
      </div>
    </div>
  );
}page.tsx       

export const dynamic = 'force-dynamic';

import React from 'react';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { TrendingUp, Users, Filter, DollarSign } from 'lucide-react';
import DateRangePicker from './DateRangePicker';

async function getSheetData() {
  try {
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(process.env.SHEET_ID!, serviceAccountAuth);
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];
    const rows = await sheet.getRows();

    // Mapping based on your exact header strings
    return rows.map(row => {
      const rawCash = row.get('Cash Collected') || '0';
      const cleanCash = parseFloat(rawCash.toString().replace(/[$, ]/g, '')) || 0;

      return {
        date: row.get('Date Call Was Taken') || '',
        closer: row.get('Closer Name') || 'N/A',
        setter: row.get('Setter Name') || 'N/A',
        prospect: row.get('Prospect Name') || 'N/A',
        outcome: row.get('Call Outcome') || 'N/A',
        cash: cleanCash,
        platform: row.get('What platform did the lead come from?') || 'Other',
      };
    });
  } catch (error) {
    console.error('--- GOOGLE API ERROR ---', error);
    return [];
  }
}

export default async function ValhallaDashboard({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  // Await params (Required for Next.js 15)
  const { start, end } = await searchParams;
  const allRawData = await getSheetData();

  // 1. FILTER DATA BY SELECTED DATES
  const filteredData = allRawData.filter((item) => {
    if (!item.date) return false;
    
    // Check if dates are selected in the UI
    const itemDate = new Date(item.date);
    if (isNaN(itemDate.getTime())) return true; // Show if date is unparseable

    if (start) {
      const startDate = new Date(start);
      if (itemDate < startDate) return false;
    }
    if (end) {
      const endDate = new Date(end);
      endDate.setHours(23, 59, 59, 999);
      if (itemDate > endDate) return false;
    }
    return true;
  });

  // 2. CALCULATE KPIs
  const totalCash = filteredData.reduce((acc, curr) => acc + curr.cash, 0);
  
  // Close Rate logic: Counts any outcome containing common success words
  const successWords = ['Closed', 'Collected', 'MRR', 'Full Pay', 'Deposit', 'Paid'];
  const closedCount = filteredData.filter(d => 
    successWords.some(word => d.outcome.toLowerCase().includes(word.toLowerCase()))
  ).length;
  
  const closeRate = filteredData.length > 0 
    ? ((closedCount / filteredData.length) * 100).toFixed(1) 
    : "0";

  // Platform Breakdown
  const platformCounts: Record<string, number> = {};
  filteredData.forEach(d => {
    const p = d.platform || 'Other';
    platformCounts[p] = (platformCounts[p] || 0) + 1;
  });

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12 font-sans selection:bg-cyan-500/30">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between mb-12 gap-8 border-b border-zinc-900 pb-10">
          <div>
            <h1 className="text-5xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600">
              VALHALLA <span className="text-zinc-500 font-light not-italic tracking-normal opacity-50">DASHBOARD</span>
            </h1>
            <p className="text-zinc-600 mt-2 uppercase text-[10px] tracking-[0.4em] font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Live Performance Feed (Tier 1)
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <DateRangePicker />
            <button className="w-full sm:w-auto bg-white text-black text-xs font-black px-8 py-3 rounded-2xl hover:bg-cyan-400 transition-all shadow-xl shadow-white/5 uppercase tracking-widest">
              Export CSV
            </button>
          </div>
        </header>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'TOTAL CASH', value: `$${totalCash.toLocaleString()}`, color: 'bg-cyan-600 shadow-cyan-900/20' },
            { label: 'CLOSE RATE', value: `${closeRate}%`, color: 'bg-zinc-900/50' },
            { label: 'TOTAL CALLS', value: filteredData.length, color: 'bg-zinc-900/50' },
            { label: 'PLATFORMS', value: Object.keys(platformCounts).length, color: 'bg-zinc-900/50' },
          ].map((s) => (
            <div key={s.label} className={`${s.color} p-8 rounded-[2.5rem] border border-white/5 relative group transition-all hover:scale-[1.02]`}>
              <p className="text-[10px] font-black tracking-[0.25em] opacity-40 mb-3 uppercase">{s.label}</p>
              <h2 className="text-4xl font-bold tracking-tighter">{s.value}</h2>
              <div className="absolute top-4 right-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <DollarSign size={40} />
              </div>
            </div>
          ))}
        </div>

        {/* Charts & Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          
          {/* Revenue Chart Visualization */}
          <div className="lg:col-span-2 bg-zinc-900/30 border border-zinc-800/50 rounded-[3rem] p-10 backdrop-blur-md">
            <h3 className="text-xl font-bold mb-10 flex items-center gap-3">
              <TrendingUp className="text-cyan-400" size={24} /> Revenue Trend
            </h3>
            <div className="h-[320px] flex items-end gap-2 px-2 border-b border-zinc-800/50 pb-2">
               {filteredData.length === 0 ? (
                 <div className="w-full h-full flex items-center justify-center text-zinc-700 font-bold uppercase tracking-widest text-xs">No data for selected range</div>
               ) : (
                 filteredData.slice(-25).map((d, i) => (
                   <div 
                     key={i} 
                     className="flex-1 bg-gradient-to-t from-cyan-600/20 to-cyan-400/40 hover:from-cyan-400 hover:to-blue-500 transition-all rounded-t-xl relative group cursor-help" 
                     style={{ height: `${totalCash > 0 ? Math.max(8, (d.cash / totalCash) * 1000) : 10}%` }}
                   >
                      <div className="hidden group-hover:block absolute -top-12 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-black px-3 py-1.5 rounded-lg z-20 whitespace-nowrap shadow-2xl">
                        ${d.cash.toLocaleString()}
                      </div>
                   </div>
                 ))
               )}
            </div>
            <div className="flex justify-between mt-6 text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] px-2">
               <span>{start || 'Earliest'}</span>
               <span>{end || 'Latest'}</span>
            </div>
          </div>

          {/* Platform Mix */}
          <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-[3rem] p-10 backdrop-blur-md">
            <h3 className="text-xl font-bold mb-10 flex items-center gap-3">
              <Users className="text-indigo-400" size={24} /> Platform Mix
            </h3>
            <div className="space-y-8">
              {filteredData.length > 0 ? Object.entries(platformCounts).map(([name, count]) => (
                <div key={name} className="group">
                  <div className="flex justify-between text-[10px] font-black mb-3 uppercase tracking-widest">
                    <span className="text-zinc-400 group-hover:text-white transition-colors">{name}</span>
                    <span className="text-cyan-500">{Math.round((count / filteredData.length) * 100)}%</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-800/50 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-cyan-500 to-blue-600 h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${(count / filteredData.length) * 100}%` }}
                    />
                  </div>
                </div>
              )) : (
                <div className="text-center text-zinc-700 py-20 text-xs font-bold uppercase tracking-widest">Awaiting Data...</div>
              )}
            </div>
          </div>
        </div>

        {/* Detailed Table Log */}
        <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-[3rem] overflow-hidden backdrop-blur-xl shadow-2xl">
          <div className="p-10 border-b border-zinc-800/50 flex justify-between items-center bg-zinc-900/40">
            <h3 className="font-black uppercase tracking-[0.3em] text-[10px] text-zinc-500 flex items-center gap-3">
              <Filter size={16} /> Transaction Battle Log
            </h3>
            <div className="px-4 py-1.5 bg-zinc-800 rounded-full text-[10px] font-black text-zinc-400 border border-white/5">
              RECORDS: {filteredData.length}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-zinc-600 text-[10px] font-black tracking-[0.2em] uppercase border-b border-zinc-800/30">
                  <th className="p-8">Date</th>
                  <th className="p-8">Closer</th>
                  <th className="p-8">Prospect</th>
                  <th className="p-8">Outcome</th>
                  <th className="p-8 text-right">Cash Collected</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/20">
                {filteredData.slice().reverse().map((row, i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="p-8 text-zinc-500 font-mono text-[11px]">{row.date}</td>
                    <td className="p-8 font-bold text-white tracking-tight">{row.closer}</td>
                    <td className="p-8 text-zinc-400 font-medium">{row.prospect}</td>
                    <td className="p-8">
                      <span className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                        successWords.some(x => row.outcome.toLowerCase().includes(x.toLowerCase()))
                          ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                          : 'bg-zinc-800/50 text-zinc-500 border-zinc-700/50'
                      }`}>
                        {row.outcome}
                      </span>
                    </td>
                    <td className="p-8 text-right font-mono font-bold text-cyan-400 tabular-nums">
                      ${row.cash.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

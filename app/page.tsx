export const dynamic = 'force-dynamic';

import React from 'react';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { TrendingUp, Users, DollarSign, Calendar, Filter } from 'lucide-react';

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

    return rows.map(row => ({
      date: row.get('Date') || '',
      closer: row.get('Closer') || 'N/A',
      setter: row.get('Setter') || 'N/A',
      prospect: row.get('Prospect') || 'N/A',
      outcome: row.get('Outcome') || 'N/A',
      cash: parseFloat(row.get('Cash Collected')?.toString().replace(/[$,]/g, '') || '0'),
      platform: row.get('Platform') || 'N/A',
    }));
  } catch (error) {
    console.error('Data Fetch Error:', error);
    return [];
  }
}

export default async function ValhallaDashboard() {
  const allData = await getSheetData();

  // 1. DATA PROCESSING (KPIs)
  const totalCash = allData.reduce((acc, curr) => acc + curr.cash, 0);
  
  // Close Rate: (Closed / Total Appointments)
  const closedCount = allData.filter(d => 
    ['MRR', 'Closed', 'Deposit collected'].includes(d.outcome)
  ).length;
  const closeRate = allData.length > 0 ? ((closedCount / allData.length) * 100).toFixed(1) : "0";

  // Lead Breakdown (Platform counts)
  const platformCounts: Record<string, number> = {};
  allData.forEach(d => {
    platformCounts[d.platform] = (platformCounts[d.platform] || 0) + 1;
  });

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6 border-b border-zinc-900 pb-8">
          <div>
            <h1 className="text-4xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
              VALHALLA <span className="text-zinc-500 font-light not-italic tracking-normal">DASHBOARD</span>
            </h1>
            <p className="text-zinc-600 mt-1 uppercase text-[10px] tracking-[0.3em] font-bold">Live Performance Feed (Tier 1)</p>
          </div>
          
          <div className="flex gap-4">
            <div className="flex items-center gap-2 bg-zinc-900 px-4 py-2 rounded-xl border border-zinc-800">
               <Calendar size={14} className="text-cyan-500" />
               <span className="text-xs font-bold text-zinc-400">Feb 1 - Feb 28, 2026</span>
            </div>
            <button className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-6 py-2 rounded-xl transition-all shadow-lg shadow-cyan-900/20">
              Export CSV
            </button>
          </div>
        </header>

        {/* Primary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'TOTAL CASH', value: `$${totalCash.toLocaleString()}`, color: 'bg-cyan-600' },
            { label: 'CLOSE RATE', value: `${closeRate}%`, color: 'bg-zinc-900' },
            { label: 'TOTAL CALLS', value: allData.length, color: 'bg-zinc-900' },
            { label: 'PLATFORMS', value: Object.keys(platformCounts).length, color: 'bg-zinc-900' },
          ].map((s) => (
            <div key={s.label} className={`${s.color} p-8 rounded-[2rem] border border-white/5 relative overflow-hidden`}>
              <p className="text-[10px] font-black tracking-[0.2em] opacity-60 mb-2 uppercase">{s.label}</p>
              <h2 className="text-3xl font-bold tracking-tight">{s.value}</h2>
            </div>
          ))}
        </div>

        {/* Chart & Platform Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2 bg-zinc-900/40 border border-zinc-800/50 rounded-[2.5rem] p-8">
            <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
              <TrendingUp className="text-cyan-500" size={20} /> Revenue Trend (Last 30 Days)
            </h3>
            <div className="h-[300px] flex items-end gap-2 px-2">
               {/* Visualizing simple bars based on data spread */}
               {allData.slice(-15).map((d, i) => (
                 <div key={i} className="flex-1 bg-cyan-500/20 hover:bg-cyan-500 transition-all rounded-t-lg relative group" style={{ height: `${Math.max(10, (d.cash / totalCash) * 500)}%` }}>
                    <div className="hidden group-hover:block absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-bold px-2 py-1 rounded">
                      ${d.cash}
                    </div>
                 </div>
               ))}
            </div>
            <div className="flex justify-between mt-4 text-[10px] font-bold text-zinc-700 uppercase tracking-widest px-2">
               <span>Start of Period</span>
               <span>End of Period</span>
            </div>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-[2.5rem] p-8">
            <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
              <Users className="text-blue-500" size={20} /> Platform Mix
            </h3>
            <div className="space-y-6">
              {Object.entries(platformCounts).map(([name, count]) => (
                <div key={name}>
                  <div className="flex justify-between text-[10px] font-bold mb-2 uppercase opacity-60">
                    <span>{name}</span>
                    <span>{Math.round((count / allData.length) * 100)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="bg-cyan-500 h-full" style={{ width: `${(count / allData.length) * 100}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Data Log */}
        <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-[2.5rem] overflow-hidden backdrop-blur-sm shadow-2xl">
          <div className="p-8 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/20">
            <h3 className="font-bold uppercase tracking-widest text-xs flex items-center gap-2">
              <Filter size={14} className="text-zinc-500" /> Transaction Battle Log
            </h3>
            <span className="text-xs text-zinc-600 font-mono">COUNT: {allData.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-zinc-500 text-[10px] font-black tracking-widest uppercase border-b border-zinc-800/50">
                  <th className="p-6">Date</th>
                  <th className="p-6">Closer</th>
                  <th className="p-6">Prospect</th>
                  <th className="p-6">Outcome</th>
                  <th className="p-6 text-right">Cash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/30">
                {allData.map((row, i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="p-6 text-zinc-500 font-mono text-xs italic">{row.date}</td>
                    <td className="p-6 font-bold text-cyan-400 group-hover:text-cyan-300 tracking-tight">{row.closer}</td>
                    <td className="p-6 text-zinc-300 font-medium">{row.prospect}</td>
                    <td className="p-6">
                      <span className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter border ${
                        row.outcome.includes('Closed') || row.outcome.includes('MRR') 
                          ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                          : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                      }`}>
                        {row.outcome}
                      </span>
                    </td>
                    <td className="p-6 text-right font-mono font-bold text-white tracking-tighter italic">
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

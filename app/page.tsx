export const dynamic = 'force-dynamic';

import React from 'react';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { TrendingUp, Users, Filter, DollarSign, AlertCircle } from 'lucide-react';
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
    
    // Always uses the first tab on the left
    const sheet = doc.sheetsByIndex[0];
    const rows = await sheet.getRows();

    return rows.map(row => {
      // FLEXIBLE GETTER: Finds headers even if they have weird spacing/caps
      const getVal = (search: string) => {
          const key = sheet.headerValues.find(h => h.toLowerCase().includes(search.toLowerCase()));
          return key ? row.get(key) : undefined;
      };

      const rawCash = getVal('Cash Collected') || '0';
      const cleanCash = parseFloat(rawCash.toString().replace(/[$, ]/g, '')) || 0;

      return {
        date: getVal('Date Call Was Taken') || '',
        closer: getVal('Closer Name') || 'N/A',
        setter: getVal('Setter Name') || 'N/A',
        prospect: getVal('Prospect Name') || 'N/A',
        outcome: getVal('Call Outcome') || 'N/A',
        cash: cleanCash,
        platform: getVal('platform') || 'Organic',
      };
    });
  } catch (error) {
    console.error('--- GOOGLE API ERROR ---', error);
    return null; // Return null to show error UI
  }
}

export default async function ValhallaDashboard({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  const { start, end } = await searchParams;
  const allRawData = await getSheetData();

  // ERROR UI: If connection failed entirely
  if (allRawData === null) {
      return (
          <div className="min-h-screen bg-black text-white flex items-center justify-center p-10">
              <div className="text-center">
                  <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
                  <h1 className="text-2xl font-bold">API Connection Error</h1>
                  <p className="text-zinc-500 mt-2">Check your Sheet ID and Vercel Environment Variables.</p>
              </div>
          </div>
      );
  }

  // 1. FILTER DATA BY PICKER
  const filteredData = allRawData.filter((item) => {
    if (!item.date) return false;
    
    const itemDate = new Date(item.date);
    // If date is unreadable, show it anyway so we can debug it in the table
    if (isNaN(itemDate.getTime())) return true; 

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

  // 2. DATA PROCESSING
  const totalCash = filteredData.reduce((acc, curr) => acc + curr.cash, 0);
  const successWords = ['Closed', 'Collected', 'MRR', 'Full Pay', 'Deposit', 'Paid'];
  const closedCount = filteredData.filter(d => 
    successWords.some(word => d.outcome.toLowerCase().includes(word.toLowerCase()))
  ).length;
  
  const closeRate = filteredData.length > 0 ? ((closedCount / filteredData.length) * 100).toFixed(1) : "0";

  const platformCounts: Record<string, number> = {};
  filteredData.forEach(d => {
    const p = d.platform || 'Other';
    platformCounts[p] = (platformCounts[p] || 0) + 1;
  });

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12 font-sans">
      <div className="max-w-7xl mx-auto">
        
        <header className="flex flex-col lg:flex-row lg:items-center justify-between mb-12 gap-8 border-b border-zinc-900 pb-10">
          <div>
            <h1 className="text-5xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
              VALHALLA DASHBOARD
            </h1>
            <p className="text-zinc-600 mt-2 uppercase text-[10px] tracking-[0.4em] font-bold flex items-center gap-3">
               {allRawData.length === 0 ? (
                 <span className="text-yellow-500">Connected, but sheet is empty. Ensure Service Account has Viewer access.</span>
               ) : (
                 <>
                   <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                   Live Performance Feed • {allRawData.length} total rows
                 </>
               )}
            </p>
          </div>
          
          <div className="flex gap-4">
            <DateRangePicker />
            <button className="bg-white text-black text-xs font-black px-8 py-3 rounded-2xl hover:bg-cyan-400 transition-all uppercase tracking-widest">
              Export CSV
            </button>
          </div>
        </header>

        {/* Primary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-cyan-600 p-8 rounded-[2.5rem] border border-white/5 transition-all hover:scale-[1.02]">
            <p className="text-[10px] font-black tracking-[0.2em] opacity-60 mb-2 uppercase">TOTAL CASH</p>
            <h2 className="text-4xl font-bold tracking-tighter">${totalCash.toLocaleString()}</h2>
          </div>
          <div className="bg-zinc-900/50 p-8 rounded-[2.5rem] border border-white/5 transition-all hover:scale-[1.02]">
            <p className="text-[10px] font-black tracking-[0.2em] opacity-40 mb-2 uppercase">CLOSE RATE</p>
            <h2 className="text-4xl font-bold tracking-tighter">{closeRate}%</h2>
          </div>
          <div className="bg-zinc-900/50 p-8 rounded-[2.5rem] border border-white/5 transition-all hover:scale-[1.02]">
            <p className="text-[10px] font-black tracking-[0.2em] opacity-40 mb-2 uppercase">TOTAL CALLS</p>
            <h2 className="text-4xl font-bold tracking-tighter">{filteredData.length}</h2>
          </div>
          <div className="bg-zinc-900/50 p-8 rounded-[2.5rem] border border-white/5 transition-all hover:scale-[1.02]">
            <p className="text-[10px] font-black tracking-[0.2em] opacity-40 mb-2 uppercase">PLATFORMS</p>
            <h2 className="text-4xl font-bold tracking-tighter">{Object.keys(platformCounts).length}</h2>
          </div>
        </div>

        {/* Chart & Platform Mix */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2 bg-zinc-900/30 border border-zinc-800/50 rounded-[3rem] p-10 backdrop-blur-md">
            <h3 className="text-xl font-bold mb-10 flex items-center gap-3 text-cyan-400">
              <TrendingUp size={24} /> Revenue Trend
            </h3>
            <div className="h-[300px] flex items-end gap-2 px-2 border-b border-zinc-800/50 pb-2">
               {filteredData.length === 0 ? (
                 <div className="w-full h-full flex items-center justify-center text-zinc-700 font-bold uppercase tracking-widest text-xs">
                   No data matching selected range
                 </div>
               ) : (
                 filteredData.slice(-25).map((d, i) => (
                   <div 
                     key={i} 
                     className="flex-1 bg-cyan-500/20 hover:bg-cyan-500 transition-all rounded-t-xl relative group cursor-help" 
                     style={{ height: `${totalCash > 0 ? Math.max(10, (d.cash / totalCash) * 800) : 10}%` }}
                   >
                      <div className="hidden group-hover:block absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-black px-2 py-1 rounded-lg z-10 whitespace-nowrap shadow-xl">
                        ${d.cash.toLocaleString()}
                      </div>
                   </div>
                 ))
               )}
            </div>
            <div className="flex justify-between mt-6 text-[10px] font-black text-zinc-700 uppercase tracking-widest px-2">
               <span>{start || 'Range Start'}</span>
               <span>{end || 'Range End'}</span>
            </div>
          </div>

          <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-[3rem] p-10 backdrop-blur-md">
            <h3 className="text-xl font-bold mb-10 flex items-center gap-3 text-indigo-400">
              <Users size={24} /> Platform Mix
            </h3>
            <div className="space-y-8">
              {filteredData.length > 0 ? Object.entries(platformCounts).map(([name, count]) => (
                <div key={name} className="group">
                  <div className="flex justify-between text-[10px] font-black mb-3 uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">
                    <span>{name}</span>
                    <span className="text-cyan-500">{Math.round((count / filteredData.length) * 100)}%</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="bg-cyan-500 h-full rounded-full transition-all duration-1000" style={{ width: `${(count / filteredData.length) * 100}%` }}></div>
                  </div>
                </div>
              )) : (
                <div className="text-center text-zinc-700 py-20 text-xs font-bold uppercase tracking-widest">Awaiting Range Selection...</div>
              )}
            </div>
          </div>
        </div>

        {/* Data Log */}
        <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-[3rem] overflow-hidden backdrop-blur-xl">
          <div className="p-10 border-b border-zinc-800/50 flex justify-between items-center bg-zinc-900/40">
            <h3 className="font-black uppercase tracking-[0.3em] text-[10px] text-zinc-500 flex items-center gap-3">
              <Filter size={16} /> Transaction Battle Log
            </h3>
            <span className="text-[10px] font-black text-zinc-600 uppercase">Visible: {filteredData.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-zinc-600 text-[10px] font-black tracking-[0.2em] uppercase border-b border-zinc-800/20">
                  <th className="p-8">Date</th>
                  <th className="p-8">Closer</th>
                  <th className="p-8">Prospect</th>
                  <th className="p-8">Outcome</th>
                  <th className="p-8 text-right">Cash</th>
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
                          : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                      }`}>
                        {row.outcome}
                      </span>
                    </td>
                    <td className="p-8 text-right font-mono font-bold text-cyan-400 italic">
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

export const dynamic = 'force-dynamic';

import React from 'react';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { TrendingUp, Users, Filter, DollarSign, AlertTriangle } from 'lucide-react';
import DateRangePicker from './DateRangePicker';

async function getSheetData() {
  // 1. PULL VARIABLES
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY;
  const id = process.env.SHEET_ID;

  // 2. PRE-FLIGHT CHECK (This will show in your Vercel Logs)
  if (!email || !key || !id) {
    console.error("MISSING VARS:", { email: !!email, key: !!key, id: !!id });
    return { error: "Missing Environment Variables", details: `Missing: ${!email ? 'Email ' : ''}${!key ? 'Key ' : ''}${!id ? 'SheetID' : ''}` };
  }

  try {
    const serviceAccountAuth = new JWT({
      email: email,
      // Aggressive newline replacement to handle Vercel formatting
      key: key.replace(/\\n/g, '\n').replace(/"/g, ''), 
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(id, serviceAccountAuth);
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];
    const rows = await sheet.getRows();

    const data = rows.map(row => {
      const getVal = (search: string) => {
          const foundKey = sheet.headerValues.find(h => h.toLowerCase().includes(search.toLowerCase()));
          return foundKey ? row.get(foundKey) : undefined;
      };

      const rawCash = getVal('Cash Collected') || '0';
      return {
        date: getVal('Date Call Was Taken') || '',
        closer: getVal('Closer Name') || 'N/A',
        setter: getVal('Setter Name') || 'N/A',
        prospect: getVal('Prospect Name') || 'N/A',
        outcome: getVal('Call Outcome') || 'N/A',
        cash: parseFloat(rawCash.toString().replace(/[$, ]/g, '')) || 0,
        platform: getVal('platform') || 'Organic',
      };
    });

    return { data };
  } catch (error: any) {
    console.error('--- GOOGLE API ERROR ---', error);
    return { error: "Google API Connection Failed", details: error.message };
  }
}

export default async function ValhallaDashboard({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  const { start, end } = await searchParams;
  const result = await getSheetData();

  // ERROR SCREEN
  if (result.error) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-10 font-sans">
        <AlertTriangle className="text-red-500 mb-4" size={64} />
        <h1 className="text-3xl font-black tracking-tighter uppercase">{result.error}</h1>
        <p className="text-zinc-500 mt-4 max-w-md text-center font-mono text-sm bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
          {result.details}
        </p>
        <button onClick={() => window.location.reload()} className="mt-8 bg-white text-black px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-cyan-400 transition-all">
          Retry Connection
        </button>
      </div>
    );
  }

  const allRawData = result.data || [];

  // FILTER LOGIC
  const filteredData = allRawData.filter((item) => {
    if (!item.date) return false;
    const itemDate = new Date(item.date);
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

  const totalCash = filteredData.reduce((acc, curr) => acc + curr.cash, 0);
  const successWords = ['Closed', 'Collected', 'MRR', 'Full Pay', 'Deposit', 'Paid'];
  const closedCount = filteredData.filter(d => 
    successWords.some(word => d.outcome.toLowerCase().includes(word.toLowerCase()))
  ).length;
  const closeRate = filteredData.length > 0 ? ((closedCount / filteredData.length) * 100).toFixed(1) : "0";

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col lg:flex-row lg:items-center justify-between mb-12 gap-8 border-b border-zinc-900 pb-10">
          <div>
            <h1 className="text-5xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
              VALHALLA DASHBOARD
            </h1>
            <p className="text-zinc-600 mt-2 uppercase text-[10px] tracking-[0.4em] font-bold flex items-center gap-3">
               <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
               Live Performance Feed • {allRawData.length} Total Rows
            </p>
          </div>
          <DateRangePicker />
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-cyan-600 p-8 rounded-[2.5rem] border border-white/5">
            <p className="text-[10px] font-black tracking-[0.2em] opacity-60 mb-2 uppercase">TOTAL CASH</p>
            <h2 className="text-4xl font-bold tracking-tighter">${totalCash.toLocaleString()}</h2>
          </div>
          <div className="bg-zinc-900/50 p-8 rounded-[2.5rem] border border-white/5">
            <p className="text-[10px] font-black tracking-[0.2em] opacity-40 mb-2 uppercase">CLOSE RATE</p>
            <h2 className="text-4xl font-bold tracking-tighter">{closeRate}%</h2>
          </div>
          <div className="bg-zinc-900/50 p-8 rounded-[2.5rem] border border-white/5">
            <p className="text-[10px] font-black tracking-[0.2em] opacity-40 mb-2 uppercase">TOTAL CALLS</p>
            <h2 className="text-4xl font-bold tracking-tighter">{filteredData.length}</h2>
          </div>
          <div className="bg-zinc-900/50 p-8 rounded-[2.5rem] border border-white/5">
            <p className="text-[10px] font-black tracking-[0.2em] opacity-40 mb-2 uppercase">SESSIONS</p>
            <h2 className="text-4xl font-bold tracking-tighter">{allRawData.length}</h2>
          </div>
        </div>

        <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-[3rem] overflow-hidden backdrop-blur-xl">
          <div className="p-10 border-b border-zinc-800/50 flex justify-between items-center bg-zinc-900/40">
            <h3 className="font-black uppercase tracking-[0.3em] text-[10px] text-zinc-500 flex items-center gap-3 font-mono">
               Data Log Output
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-zinc-600 text-[10px] font-black tracking-[0.2em] uppercase border-b border-zinc-800/20 font-mono">
                  <th className="p-8">Date</th>
                  <th className="p-8">Closer</th>
                  <th className="p-8">Outcome</th>
                  <th className="p-8 text-right">Cash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/20">
                {filteredData.slice().reverse().map((row, i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="p-8 text-zinc-500 font-mono text-[11px]">{row.date}</td>
                    <td className="p-8 font-bold text-white tracking-tight">{row.closer}</td>
                    <td className="p-8">
                      <span className="px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border bg-zinc-800 text-zinc-400 border-zinc-700">
                        {row.outcome}
                      </span>
                    </td>
                    <td className="p-8 text-right font-mono font-bold text-cyan-400">
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

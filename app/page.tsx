export const dynamic = 'force-dynamic';

import React from 'react';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import Filters from './Filters';

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

    return rows.map(row => {
      const getVal = (search: string) => {
          const foundKey = sheet.headerValues.find(h => h.toLowerCase().includes(search.toLowerCase()));
          return foundKey ? row.get(foundKey) : '';
      };
      return {
        date: getVal('Date Call Was Taken') || '',
        closer: getVal('Closer Name') || 'N/A',
        setter: getVal('Setter Name') || 'N/A',
        outcome: getVal('Call Outcome') || 'N/A',
        platform: getVal('What platform did') || 'Other',
        cash: parseFloat(getVal('Cash Collected')?.toString().replace(/[$, ]/g, '')) || 0,
        revenue: parseFloat(getVal('Revenue Generated')?.toString().replace(/[$, ]/g, '')) || 0,
      };
    });
  } catch (error) {
    console.error(error); return [];
  }
}

export default async function ValhallaDashboard({ searchParams }: { searchParams: Promise<any> }) {
  const params = await searchParams;
  const allData = await getSheetData();

  const platforms = Array.from(new Set(allData.map(d => d.platform))).filter(Boolean) as string[];
  const closers = Array.from(new Set(allData.map(d => d.closer))).filter(Boolean) as string[];
  const setters = Array.from(new Set(allData.map(d => d.setter))).filter(Boolean) as string[];

  const filtered = allData.filter(d => {
    if (params.start && new Date(d.date) < new Date(params.start)) return false;
    if (params.end && new Date(d.date) > new Date(params.end)) return false;
    if (params.platform && d.platform !== params.platform) return false;
    if (params.closer && d.closer !== params.closer) return false;
    if (params.setter && d.setter !== params.setter) return false;
    return true;
  });

  const totalCash = filtered.reduce((a, b) => a + b.cash, 0);
  const totalRev = filtered.reduce((a, b) => a + b.revenue, 0);
  const callsTaken = filtered.filter(d => !d.outcome.toLowerCase().includes('no show')).length;
  const callsClosed = filtered.filter(d => ['closed', 'paid', 'full pay', 'mrr'].some(x => d.outcome.toLowerCase().includes(x))).length;

  const dailyMap: Record<string, number> = {};
  filtered.forEach(d => {
    const day = d.date ? new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A';
    dailyMap[day] = (dailyMap[day] || 0) + d.cash;
  });
  const trend = Object.entries(dailyMap).slice(-25);

  const Stat = ({ label, value, sub, large }: any) => (
    <div className={`bg-[#0d0d0d] border border-zinc-900 rounded-xl p-6 ${large ? 'col-span-1 lg:col-span-2' : ''}`}>
      <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-3">{label}</p>
      <div className="flex items-baseline gap-2">
        <h2 className={`${large ? 'text-2xl' : 'text-lg'} font-black text-white tracking-tighter`}>{value}</h2>
        {sub && <span className="text-[9px] font-bold text-green-500">+{sub}%</span>}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white p-10 font-sans selection:bg-cyan-500/30">
      <div className="max-w-[1600px] mx-auto">
        <h1 className="text-xl font-black uppercase tracking-widest mb-10 text-center">Dashboard</h1>
        <Filters platforms={platforms} closers={closers} setters={setters} />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
           <div className="lg:col-span-2 bg-cyan-600 rounded-xl p-8 shadow-xl shadow-cyan-950/20">
              <p className="text-[9px] font-black text-white/50 uppercase tracking-[0.2em] mb-2">Cash Collected</p>
              <h2 className="text-3xl font-black tabular-nums">${totalCash.toLocaleString()}</h2>
           </div>
           <div className="lg:col-span-2 bg-zinc-900/30 rounded-xl p-8 border border-zinc-800">
              <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-2">Revenue Generated</p>
              <h2 className="text-3xl font-black tabular-nums">${totalRev.toLocaleString()}</h2>
           </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
          <Stat label="Show Rate" value={`${filtered.length > 0 ? ((callsTaken/filtered.length)*100).toFixed(1) : 0}%`} />
          <Stat label="Close Rate" value={`${callsTaken > 0 ? ((callsClosed/callsTaken)*100).toFixed(1) : 0}%`} />
          <Stat label="Calls Due" value={filtered.length} />
          <Stat label="Calls Taken" value={callsTaken} />
          <Stat label="Calls Closed" value={callsClosed} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          <Stat label="Avg. Cash / Call" value={`$${callsTaken > 0 ? (totalCash/callsTaken).toFixed(2) : 0}`} />
          <Stat label="Avg. Cash / Close" value={`$${callsClosed > 0 ? (totalCash/callsClosed).toFixed(2) : 0}`} />
        </div>

        <div className="bg-[#0d0d0d] border border-zinc-900 rounded-2xl p-10">
          <h3 className="text-[10px] font-black uppercase text-zinc-600 tracking-widest mb-12">Cash Collected Trend</h3>
          <div className="h-[350px] flex items-end gap-3 px-4">
            {trend.map(([date, cash], i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                <div className="relative w-full">
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-black text-cyan-400">${(cash/1000).toFixed(1)}K</div>
                  <div className="w-full bg-cyan-500 rounded-sm transition-all hover:bg-cyan-400" style={{ height: `${Math.max(4, (cash / (totalCash||1)) * 1200)}px` }} />
                </div>
                <span className="text-[8px] font-black text-zinc-700 uppercase whitespace-nowrap">{date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

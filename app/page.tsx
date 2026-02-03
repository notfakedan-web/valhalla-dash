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
        prospect: getVal('Prospect Name') || 'N/A',
        outcome: getVal('Call Outcome') || 'N/A',
        platform: getVal('What platform did') || 'Other',
        cash: parseFloat(getVal('Cash Collected')?.toString().replace(/[$, ]/g, '')) || 0,
        revenue: parseFloat(getVal('Revenue Generated')?.toString().replace(/[$, ]/g, '')) || 0,
      };
    });
  } catch (error) { console.error(error); return []; }
}

export default async function ValhallaDashboard({ searchParams }: { searchParams: Promise<any> }) {
  const params = await searchParams;
  const allRawData = await getSheetData();

  const platforms = Array.from(new Set(allRawData.map(d => d.platform))).filter(Boolean) as string[];
  const closers = Array.from(new Set(allRawData.map(d => d.closer))).filter(Boolean) as string[];
  const setters = Array.from(new Set(allRawData.map(d => d.setter))).filter(Boolean) as string[];

  const filtered = allRawData.filter(d => {
    const dDate = new Date(d.date);
    if (params.start && dDate < new Date(params.start)) return false;
    if (params.end && dDate > new Date(params.end)) return false;
    if (params.platform && d.platform !== params.platform) return false;
    if (params.closer && d.closer !== params.closer) return false;
    if (params.setter && d.setter !== params.setter) return false;
    return true;
  });

  // 1. ACCOUNTING: Total cash collected regardless of row type
  const totalCash = filtered.reduce((acc, curr) => acc + curr.cash, 0);
  const totalRev = filtered.reduce((a, b) => a + b.revenue, 0);

  // 2. PERFORMANCE: Exclude MRR, Downsells, and Test data from appointment counts
  const appointments = filtered.filter(d => {
    const outcome = d.outcome.toLowerCase();
    const isTest = d.prospect.toLowerCase().includes('test');
    const isRecurring = outcome.includes('mrr') || outcome.includes('downsell');
    return !isTest && !isRecurring;
  });

  const callsDue = appointments.length;
  const callsTaken = appointments.filter(d => !d.outcome.toLowerCase().includes('no show')).length;
  const callsClosed = appointments.filter(d => ['closed', 'deposit collected'].some(x => d.outcome.toLowerCase().includes(x))).length;

  const showRate = callsDue > 0 ? (callsTaken / callsDue) * 100 : 0;
  const closeRate = callsTaken > 0 ? (callsClosed / callsTaken) * 100 : 0;
  const avgCashCall = callsTaken > 0 ? totalCash / callsTaken : 0;
  const avgCashClose = callsClosed > 0 ? totalCash / callsClosed : 0;

  const dailyMap: Record<string, number> = {};
  filtered.forEach(d => {
    if (!d.date) return;
    const day = new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    dailyMap[day] = (dailyMap[day] || 0) + d.cash;
  });
  const trend = Object.entries(dailyMap).sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());

  const Stat = ({ label, value }: any) => (
    <div className="bg-[#0d0d0d] border border-zinc-900 rounded-xl p-6">
      <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-3">{label}</p>
      <h2 className="text-xl font-black text-white tracking-tighter">{value}</h2>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white p-10 font-sans">
      <div className="max-w-[1600px] mx-auto">
        <h1 className="text-xl font-black uppercase tracking-widest mb-10 text-center">Dashboard</h1>
        <Filters platforms={platforms} closers={closers} setters={setters} />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
           <div className="lg:col-span-2 bg-cyan-600 rounded-xl p-8"><p className="text-[9px] font-black text-white/50 uppercase mb-2">Cash Collected</p><h2 className="text-3xl font-black">${totalCash.toLocaleString()}</h2></div>
           <div className="lg:col-span-2 bg-zinc-900/30 rounded-xl p-8 border border-zinc-800"><p className="text-[9px] font-black text-zinc-600 uppercase mb-2">Revenue Generated</p><h2 className="text-3xl font-black">${totalRev.toLocaleString()}</h2></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
          <Stat label="Show Rate" value={`${showRate.toFixed(1)}%`} />
          <Stat label="Close Rate" value={`${closeRate.toFixed(1)}%`} />
          <Stat label="Calls Due" value={callsDue} />
          <Stat label="Calls Taken" value={callsTaken} />
          <Stat label="Calls Closed" value={callsClosed} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          <Stat label="Avg. Cash / Call" value={`$${avgCashCall.toFixed(2)}`} />
          <Stat label="Avg. Cash / Close" value={`$${avgCashClose.toFixed(2)}`} />
        </div>
        <div className="bg-[#0d0d0d] border border-zinc-900 rounded-2xl p-10">
          <h3 className="text-[10px] font-black uppercase text-zinc-600 mb-12 tracking-widest">Cash Collected Trend</h3>
          <div className="h-[350px] flex items-end gap-3 px-4">
            {trend.map(([date, cash], i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                <div className="relative w-full">
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-black text-cyan-400">${(cash/1000).toFixed(1)}K</div>
                  <div className="w-full bg-cyan-500 rounded-sm hover:bg-cyan-400" style={{ height: `${Math.max(4, (cash / (totalCash||1)) * 1200)}px` }} />
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

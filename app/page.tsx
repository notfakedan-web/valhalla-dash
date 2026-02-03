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
  const allRawData = await getSheetData();

  // 1. DYNAMIC DROPDOWN OPTIONS
  const platforms = Array.from(new Set(allRawData.map(d => d.platform))).filter(Boolean) as string[];
  const closers = Array.from(new Set(allRawData.map(d => d.closer))).filter(Boolean) as string[];
  const setters = Array.from(new Set(allRawData.map(d => d.setter))).filter(Boolean) as string[];

  // 2. DATA CLEANING & REFINED FILTERING
  const filtered = allRawData.filter(d => {
    // Basic date parsing
    const dDate = new Date(d.date);
    
    // Filter by Params
    if (params.start && dDate < new Date(params.start)) return false;
    if (params.end && dDate > new Date(params.end)) return false;
    if (params.platform && d.platform !== params.platform) return false;
    if (params.closer && d.closer !== params.closer) return false;
    if (params.setter && d.setter !== params.setter) return false;
    return true;
  });

  // 3. SMART KPI LOGIC (To match the $30k version)
  
  // Total Revenue is simple sum
  const totalRev = filtered.reduce((a, b) => a + b.revenue, 0);

  // SMART CASH: Ignores rows with $0 revenue but high cash (likely old collections)
  const totalCash = filtered.reduce((acc, curr) => {
    if (curr.revenue === 0 && curr.cash > 1000) return acc; 
    return acc + curr.cash;
  }, 0);

  // CALLS DUE: Count actual New Appointments (Ignore MRR/Downsell rows)
  const appointments = filtered.filter(d => 
    !['mrr', 'downsell'].includes(d.outcome.toLowerCase())
  );
  const callsDue = appointments.length; 
  
  // CALLS TAKEN: Appointments that didn't "No Show"
  const callsTaken = appointments.filter(d => 
    !d.outcome.toLowerCase().includes('no show')
  ).length; 

  // CALLS CLOSED: Actual sales entries
  const callsClosed = filtered.filter(d => 
    ['closed', 'full pay', 'deposit collected'].some(x => d.outcome.toLowerCase().includes(x))
  ).length; 

  // RATES
  const showRate = callsDue > 0 ? (callsTaken / callsDue) * 100 : 0;
  const closeRate = callsTaken > 0 ? (callsClosed / callsTaken) * 100 : 0;
  const avgCashCall = callsTaken > 0 ? totalCash / callsTaken : 0;
  const avgCashClose = callsClosed > 0 ? totalCash / callsClosed : 0;

  // 4. DAILY TREND LOGIC
  const dailyMap: Record<string, number> = {};
  filtered.forEach(d => {
    if (!d.date) return;
    const dayString = new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!(d.revenue === 0 && d.cash > 1000)) {
        dailyMap[dayString] = (dailyMap[dayString] || 0) + d.cash;
    }
  });
  const trend = Object.entries(dailyMap).sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());

  // REUSABLE STAT COMPONENT
  const Stat = ({ label, value, large }: any) => (
    <div className={`bg-[#0d0d0d] border border-zinc-900 rounded-xl p-6 ${large ? 'col-span-1 lg:col-span-2' : ''}`}>
      <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-3">{label}</p>
      <h2 className={`${large ? 'text-3xl' : 'text-xl'} font-black text-white tracking-tighter`}>{value}</h2>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white p-10 font-sans selection:bg-cyan-500/30">
      <div className="max-w-[1600px] mx-auto">
        <h1 className="text-xl font-black uppercase tracking-widest mb-10 text-center">Dashboard</h1>
        
        <Filters platforms={platforms} closers={closers} setters={setters} />

        {/* TOP ROW: COLLECTED & GENERATED */}
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

        {/* KPI ROW */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
          <Stat label="Show Rate" value={`${showRate.toFixed(1)}%`} />
          <Stat label="Close Rate" value={`${closeRate.toFixed(1)}%`} />
          <Stat label="Calls Due" value={callsDue} />
          <Stat label="Calls Taken" value={callsTaken} />
          <Stat label="Calls Closed" value={callsClosed} />
        </div>

        {/* AVERAGES ROW */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          <Stat label="Avg. Cash / Call" value={`$${avgCashCall.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
          <Stat label="Avg. Cash / Close" value={`$${avgCashClose.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
        </div>

        {/* CHART SECTION */}
        <div className="bg-[#0d0d0d] border border-zinc-900 rounded-2xl p-10">
          <h3 className="text-[10px] font-black uppercase text-zinc-600 tracking-widest mb-12">Cash Collected Trend</h3>
          <div className="h-[350px] flex items-end gap-3 px-4">
            {trend.length > 0 ? trend.map(([date, cash], i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                <div className="relative w-full">
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-black text-cyan-400">${(cash/1000).toFixed(1)}K</div>
                  <div 
                    className="w-full bg-cyan-500 rounded-sm transition-all hover:bg-cyan-400" 
                    style={{ height: `${Math.max(4, (cash / (totalCash || 1)) * 1200)}px` }} 
                  />
                </div>
                <span className="text-[8px] font-black text-zinc-700 uppercase whitespace-nowrap">{date}</span>
              </div>
            )) : (
              <div className="w-full text-center text-zinc-800 text-xs font-bold uppercase tracking-widest py-20">No data for selected range</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

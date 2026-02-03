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
          const foundKey = sheet.headerValues.find(h => h.toLowerCase().trim().includes(search.toLowerCase().trim()));
          return foundKey ? row.get(foundKey) : '';
      };
      
      return {
        timestamp: getVal('Timestamp') || '',
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
  } catch (error) { 
    console.error("Sheet Fetch Error:", error); 
    return []; 
  }
}

export default async function ValhallaDashboard({ searchParams }: { searchParams: Promise<any> }) {
  const params = await searchParams;
  const allRawData = await getSheetData();

  // 1. DATE RANGE LOGIC
  const today = new Date();
  const start = params.start ? new Date(params.start) : null;
  const end = params.end ? new Date(params.end) : null;
  // Ensure end date covers the full day
  if (end) end.setHours(23, 59, 59, 999);

  // 2. MAIN FILTERING
  const performanceData = allRawData.filter(d => {
    if (!d.date) return false;
    const dDate = new Date(d.date);
    if (start && dDate < start) return false;
    if (end && dDate > end) return false;
    if (params.platform && d.platform !== params.platform) return false;
    if (params.closer && d.closer !== params.closer) return false;
    if (params.setter && d.setter !== params.setter) return false;
    return true;
  });

  // 3. CASH CALCULATION (Filtered)
  const totalCash = performanceData.reduce((acc, curr) => acc + curr.cash, 0);
  
  // 4. APPOINTMENT LOGIC
  const appointments = performanceData.filter(d => {
    const out = d.outcome.toLowerCase();
    const prospect = d.prospect.toLowerCase();
    // Exclude Recurring Revenue or Tests from "New Appointments"
    return !out.includes('mrr') && !out.includes('downsell') && !prospect.includes('test');
  });

  const totalRev = appointments.reduce((acc, curr) => acc + curr.revenue, 0);

  // Calls Due = Total appointments scheduled
  const callsDue = appointments.length;

  // Calls Taken = Exclude No Shows/Reschedules
  const callsTaken = appointments.filter(d => 
    !['no show', 'rescheduled', 'cancelled'].some(x => d.outcome.toLowerCase().includes(x))
  ).length;

  // Calls Closed = Actual wins
  const callsClosed = appointments.filter(d => 
    ['closed', 'deposit collected', 'paid', 'full pay'].some(x => d.outcome.toLowerCase().includes(x))
  ).length;
  
  // Rates
  const showRate = callsDue > 0 ? (callsTaken / callsDue) * 100 : 0;
  const closeRate = callsTaken > 0 ? (callsClosed / callsTaken) * 100 : 0;
  
  // Averages
  // CHANGED: Using 'callsDue' for the first metric to show Value per Appointment (includes No Shows)
  const avgCashAppt = callsDue > 0 ? totalCash / callsDue : 0;
  const avgCashClose = callsClosed > 0 ? totalCash / callsClosed : 0;

  // 5. GRAPH LOGIC (Fill Missing Dates)
  let graphStart = start;
  let graphEnd = end;

  // Auto-range if no filters selected
  if (!graphStart && performanceData.length > 0) {
      const times = performanceData.map(d => new Date(d.date).getTime());
      graphStart = new Date(Math.min(...times));
  }
  if (!graphEnd && performanceData.length > 0) {
      const times = performanceData.map(d => new Date(d.date).getTime());
      graphEnd = new Date(Math.max(...times));
  }
  // Fallback defaults
  if (!graphStart) graphStart = new Date(today.getFullYear(), today.getMonth(), 1);
  if (!graphEnd) graphEnd = today;

  // Create a map for every single day in the range
  const dayMap = new Map<string, number>();
  // Clone start to avoid modifying the original reference
  for (let d = new Date(graphStart); d <= graphEnd; d.setDate(d.getDate() + 1)) {
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dayMap.set(label, 0);
  }

  // Populate map with data
  performanceData.forEach(d => {
    const day = new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    // Only set if it's within our view range (handles edge cases)
    if (dayMap.has(day)) {
        dayMap.set(day, (dayMap.get(day) || 0) + d.cash);
    }
  });

  const trend = Array.from(dayMap.entries());
  const maxCash = Math.max(...trend.map(([_, c]) => c), 1);

  // 6. OPTIONS FOR FILTERS
  const platforms = Array.from(new Set(allRawData.map(d => d.platform))).filter(Boolean) as string[];
  const closers = Array.from(new Set(allRawData.map(d => d.closer))).filter(Boolean) as string[];
  const setters = Array.from(new Set(allRawData.map(d => d.setter))).filter(Boolean) as string[];

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans selection:bg-cyan-500/30">
      <div className="max-w-[1600px] mx-auto p-6 md:p-10">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 relative z-[100]">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Global Command</span>
                    <div className="w-1 h-1 rounded-full bg-zinc-700" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">Sales Performance</span>
                </div>
                <h1 className="text-4xl font-black tracking-tighter text-white italic uppercase">Valhalla <span className="text-cyan-500">OS</span></h1>
            </div>
            <div className="flex items-center gap-4 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full">
                <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                <span className="text-[10px] font-black text-cyan-500 uppercase tracking-tighter">Terminal Live</span>
            </div>
        </div>

        {/* GRID LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 relative">
            
            {/* SIDEBAR FILTERS (1 column) */}
            <div className="lg:col-span-1 space-y-6 relative z-[60]">
                <div className="bg-zinc-900/40 border border-zinc-800/50 backdrop-blur-md p-6 rounded-3xl h-full">
                    <p className="text-[10px] font-black text-zinc-500 uppercase mb-6 tracking-widest text-center">Revenue Filter</p>
                    <Filters platforms={platforms} closers={closers} setters={setters} />
                </div>
            </div>

            {/* MAIN DASHBOARD (4 columns) */}
            <div className="lg:col-span-4 space-y-6 relative z-10">
                
                {/* KPI CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="relative group overflow-hidden bg-gradient-to-br from-cyan-600 to-blue-700 p-8 rounded-3xl shadow-2xl shadow-cyan-900/20">
                        <p className="text-xs font-black text-white/60 uppercase mb-1 tracking-widest">Net Cash Collected</p>
                        <h2 className="text-5xl font-black text-white tracking-tighter tabular-nums">
                            ${totalCash.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                        </h2>
                    </div>

                    <div className="bg-zinc-900/40 border border-zinc-800/50 p-8 rounded-3xl">
                        <p className="text-[10px] font-black text-zinc-500 uppercase mb-1 tracking-widest">Total Revenue</p>
                        <h3 className="text-5xl font-black text-white tracking-tighter italic tabular-nums">
                            ${totalRev.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                        </h3>
                    </div>
                </div>

                {/* MET

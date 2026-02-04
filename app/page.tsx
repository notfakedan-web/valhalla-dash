export const dynamic = 'force-dynamic';

import React from 'react';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import Filters from './Filters';

// --- 1. HELPER: FETCH SALES DATA ---
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

// --- 2. HELPER: FETCH APPLICATIONS COUNT ---
async function getApplicationsCount(start: Date | null, end: Date | null) {
    try {
        const serviceAccountAuth = new JWT({
            email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
        const doc = new GoogleSpreadsheet(process.env.LEAD_FLOW_SHEET_ID!, serviceAccountAuth);
        await doc.loadInfo();
        const sheet = doc.sheetsByIndex[0];
        const rows = await sheet.getRows();
        
        return rows.filter(row => {
            const rawDate = row.get('submitted at') || row.get('date');
            if (!rawDate) return false;
            let d = new Date(rawDate);
            if (isNaN(d.getTime()) && rawDate.includes('/')) {
                const p = rawDate.split(' ')[0].split('/');
                if (p.length === 3) d = new Date(parseInt(p[2]), parseInt(p[0])-1, parseInt(p[1]));
            }
            if (start && d < start) return false;
            if (end && d > end) return false;
            return true;
        }).length;
    } catch (e) { return 0; }
}

export default async function ValhallaDashboard({ searchParams }: { searchParams: Promise<any> }) {
  const params = await searchParams;
  const allRawData = await getSheetData();

  const today = new Date();
  const start = params.start ? new Date(params.start) : null;
  const end = params.end ? new Date(params.end) : null;
  if (end) end.setHours(23, 59, 59, 999);

  // FETCH APPLICATIONS
  const totalApplications = await getApplicationsCount(start, end);

  // MAIN FILTERING
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

  const totalCash = performanceData.reduce((acc, curr) => acc + curr.cash, 0);

  // NEW: Calculate MRR vs New Cash
  const mrrData = performanceData.filter(d => d.outcome.toLowerCase().includes('mrr'));
  const mrrCash = mrrData.reduce((acc, curr) => acc + curr.cash, 0);
  const newCash = totalCash - mrrCash;
  
  const appointments = performanceData.filter(d => {
    const out = d.outcome.toLowerCase();
    const prospect = d.prospect.toLowerCase();
    return !out.includes('mrr') && !out.includes('downsell') && !prospect.includes('test');
  });

  const totalRev = appointments.reduce((acc, curr) => acc + curr.revenue, 0);

  const callsDue = appointments.length;
  const callsTaken = appointments.filter(d => 
    !['no show', 'rescheduled', 'cancelled'].some(x => d.outcome.toLowerCase().includes(x))
  ).length;

  const callsClosed = appointments.filter(d => 
    ['closed', 'deposit collected', 'paid', 'full pay'].some(x => d.outcome.toLowerCase().includes(x))
  ).length;
  
  const showRate = callsDue > 0 ? (callsTaken / callsDue) * 100 : 0;
  const closeRate = callsTaken > 0 ? (callsClosed / callsTaken) * 100 : 0;
  
  const avgCashAppt = callsDue > 0 ? totalCash / callsDue : 0;
  const avgCashClose = callsClosed > 0 ? totalCash / callsClosed : 0;
  const avgCashApplication = totalApplications > 0 ? totalCash / totalApplications : 0;

  const recentAcquisitions = appointments
    .filter(d => d.cash > 0 && !['no show', 'cancelled', 'rescheduled'].some(o => d.outcome.toLowerCase().includes(o)))
    .slice(0, 5); 

  // GRAPH LOGIC
  let graphStart = start;
  let graphEnd = end;

  if (!graphStart && performanceData.length > 0) {
      const times = performanceData.map(d => new Date(d.date).getTime());
      graphStart = new Date(Math.min(...times));
  }
  if (!graphEnd && performanceData.length > 0) {
      const times = performanceData.map(d => new Date(d.date).getTime());
      graphEnd = new Date(Math.max(...times));
  }
  if (!graphStart) graphStart = new Date(today.getFullYear(), today.getMonth(), 1);
  if (!graphEnd) graphEnd = today;

  const dayMap = new Map<string, number>();
  for (let d = new Date(graphStart); d <= graphEnd; d.setDate(d.getDate() + 1)) {
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dayMap.set(label, 0);
  }

  performanceData.forEach(d => {
    const day = new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (dayMap.has(day)) {
        dayMap.set(day, (dayMap.get(day) || 0) + d.cash);
    }
  });

  const trend = Array.from(dayMap.entries());
  const maxCash = Math.max(...trend.map(([_, c]) => c), 1);

  const platforms = Array.from(new Set(allRawData.map(d => d.platform))).filter(Boolean) as string[];
  const closers = Array.from(new Set(allRawData.map(d => d.closer))).filter(Boolean) as string[];
  const setters = Array.from(new Set(allRawData.map(d => d.setter))).filter(Boolean) as string[];

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="max-w-[1600px] mx-auto">
        
        {/* HEADER & FILTERS */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 mb-12 relative z-[100]">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Global Command</span>
                    <div className="w-1 h-1 rounded-full bg-zinc-700" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">Sales Performance</span>
                </div>
                <h1 className="text-4xl font-black tracking-tighter text-white italic uppercase">Valhalla <span className="text-cyan-500">OS</span></h1>
            </div>
            
            <div className="bg-zinc-900/40 border border-zinc-800/50 backdrop-blur-md p-2 pl-6 rounded-2xl flex flex-wrap items-center gap-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mr-2">Filter Data:</span>
                <Filters platforms={platforms} closers={closers} setters={setters} />
            </div>
        </div>

        {/* MAIN DASHBOARD CONTENT */}
        <div className="space-y-6 relative z-10">
            
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

            {/* METRICS STRIP */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatBox label="Show Rate" value={`${showRate.toFixed(1)}%`} color="text-white" />
                <StatBox label="Close Rate" value={`${closeRate.toFixed(1)}%`} color="text-white" />
                <StatBox label="Appointments" value={appointments.length} color="text-white" />
                <StatBox label="Acquisitions" value={callsClosed} color="text-cyan-500" />
            </div>

            {/* CASH VELOCITY GRAPH */}
            <div className="bg-[#0c0c0c] border border-zinc-800/50 rounded-3xl p-8 shadow-inner relative overflow-hidden">
                <div className="flex items-center justify-between mb-10 relative z-10">
                    <h3 className="text-xs font-black uppercase text-zinc-400 tracking-widest">Cash Velocity</h3>
                    <span className="text-[10px] font-bold text-zinc-600 italic">Historical Settlement</span>
                </div>

                <div className="flex h-[320px] w-full relative pt-10 px-4">
                    <div className="absolute inset-x-0 top-10 bottom-12 flex flex-col justify-between pointer-events-none border-l border-zinc-800/50">
                        {[1, 0.75, 0.5, 0.25, 0].map((step) => (
                            <div key={step} className="flex items-center w-full">
                                <span className="absolute -left-12 text-[9px] font-bold text-zinc-700 w-10 text-right">
                                    ${((maxCash * step) / 1000).toFixed(1)}k
                                </span>
                                <div className="w-full border-t border-zinc-800/30" />
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-1 items-end justify-around gap-2 relative z-10 border-b border-zinc-800/50">
                        {trend.map(([date, cash], i) => {
                            const height = (cash / maxCash) * 230;
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center group max-w-[40px] relative">
                                    <div className="relative w-full">
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white text-black text-[10px] font-black px-2 py-1 rounded-md shadow-xl whitespace-nowrap z-30 pointer-events-none">
                                            ${cash.toLocaleString()}
                                        </div>
                                        <div 
                                            className={`w-full rounded-t-sm transition-all shadow-[0_0_20px_rgba(34,211,238,0.1)] ${cash > 0 ? 'bg-gradient-to-t from-cyan-600 to-cyan-400 group-hover:from-cyan-400 group-hover:to-cyan-300' : 'bg-zinc-800/30'}`}
                                            style={{ height: `${cash > 0 ? height : 4}px` }} 
                                        />
                                    </div>
                                    <span className="absolute -bottom-8 text-[9px] font-black text-zinc-600 uppercase group-hover:text-cyan-400 truncate w-full text-center">
                                        {date.split(',')[0]}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="absolute left-8 bottom-12 transform -rotate-90 origin-left text-[8px] font-black uppercase tracking-widest text-zinc-700">Price (USD)</div>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[8px] font-black uppercase tracking-widest text-zinc-700">Timeline (Date)</div>
            </div>

            {/* BOTTOM ANALYTICS - NOW WITH NEW METRICS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* UPGRADED EFFICIENCY ANALYTICS */}
                <div className="bg-[#0c0c0c] border border-zinc-800/50 rounded-3xl p-8">
                    <h3 className="text-xs font-black uppercase text-zinc-400 tracking-widest mb-6 text-center">Efficiency Analytics</h3>
                    <div className="space-y-4">
                        {/* New Revenue Split */}
                        <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-zinc-800/50">
                             <div className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/30 text-center">
                                <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">New Cash</p>
                                <p className="text-lg font-black text-white">${newCash.toLocaleString()}</p>
                             </div>
                             <div className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/30 text-center">
                                <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">MRR</p>
                                <p className="text-lg font-black text-white">${mrrCash.toLocaleString()}</p>
                             </div>
                        </div>

                        {/* Existing + New Metrics */}
                        <EfficiencyRow label="Total Applications" value={totalApplications.toString()} isCurrency={false} />
                        <EfficiencyRow label="Avg. Cash / Application" value={avgCashApplication.toFixed(0)} />
                        <EfficiencyRow label="Avg. Value / Appt" value={avgCashAppt.toFixed(0)} />
                        <EfficiencyRow label="Avg. Cash / Close" value={avgCashClose.toFixed(0)} />
                    </div>
                </div>

                {/* RECENT ACQUISITIONS */}
                <div className="bg-[#0c0c0c] border border-zinc-800/50 rounded-3xl p-8">
                    <h3 className="text-xs font-black uppercase text-zinc-400 tracking-widest mb-6 text-center">Recent Acquisitions</h3>
                    <div className="space-y-3">
                        {recentAcquisitions.length > 0 ? recentAcquisitions.map((lead, i) => (
                            <div key={i} className="flex justify-between items-center border-b border-zinc-800 pb-2">
                                <div>
                                    <p className="text-xs font-black uppercase text-white tracking-tight">{lead.prospect}</p>
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase">{lead.outcome}</p>
                                </div>
                                <p className="text-sm font-black text-cyan-500 italic">${lead.cash.toLocaleString()}</p>
                            </div>
                        )) : (
                            <div className="text-center py-6">
                                <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">No Recent Wins</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string, value: any, color: string }) {
    return (
        <div className="bg-zinc-900/40 border border-zinc-800/50 p-6 rounded-3xl transition-all group hover:border-cyan-500/20">
            <p className="text-[10px] font-black text-zinc-500 uppercase mb-2 tracking-widest text-center">{label}</p>
            <h3 className={`text-3xl font-black ${color} tracking-tighter tabular-nums text-center`}>{value}</h3>
        </div>
    );
}

function EfficiencyRow({ label, value, isCurrency = true }: { label: string, value: string, isCurrency?: boolean }) {
    return (
        <div className="flex items-center justify-between p-4 bg-zinc-900/60 rounded-2xl border border-zinc-800/30 hover:border-cyan-500/20 transition-all">
            <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">{label}</span>
            <span className="text-lg font-black text-cyan-500 italic tabular-nums">
                {isCurrency ? '$' : ''}{value}
            </span>
        </div>
    );
}

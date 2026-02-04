export const dynamic = 'force-dynamic';

import React from 'react';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import Filters from './Filters';

// --- HELPER 1: FETCH SALES DATA ---
async function getSalesData() {
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
  } catch (error) { console.error("Sales Fetch Error:", error); return []; }
}

// --- HELPER 2: FETCH APPLICATIONS (LEADS) ---
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
        
        // Count applications within date range
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
  const allSalesData = await getSalesData();

  // DATE RANGE LOGIC
  const today = new Date();
  const start = params.start ? new Date(params.start) : null;
  const end = params.end ? new Date(params.end) : null;
  if (end) end.setHours(23, 59, 59, 999);

  // 1. GET TOTAL APPLICATIONS (LEADS)
  const totalApplications = await getApplicationsCount(start, end);

  // 2. FILTER SALES DATA
  const performanceData = allSalesData.filter(d => {
    if (!d.date) return false;
    const dDate = new Date(d.date);
    if (start && dDate < start) return false;
    if (end && dDate > end) return false;
    if (params.platform && d.platform !== params.platform) return false;
    if (params.closer && d.closer !== params.closer) return false;
    if (params.setter && d.setter !== params.setter) return false;
    return true;
  });

  // 3. CORE METRICS
  const totalCash = performanceData.reduce((acc, curr) => acc + curr.cash, 0);
  
  // Exclude MRR from "New Deal" metrics if needed, or keep them. 
  // Based on your sheet, MRR is an outcome.
  const mrrData = performanceData.filter(d => d.outcome.toLowerCase().includes('mrr'));
  const mrrCash = mrrData.reduce((acc, curr) => acc + curr.cash, 0);
  const newCashCollected = totalCash - mrrCash;

  // Appointments (Exclude tests/junk)
  const appointments = performanceData.filter(d => {
    const out = d.outcome.toLowerCase();
    const prospect = d.prospect.toLowerCase();
    return !prospect.includes('test');
  });

  const totalRev = appointments.reduce((acc, curr) => acc + curr.revenue, 0);

  // Funnel Metrics
  const callsDue = appointments.length;
  
  const callsTaken = appointments.filter(d => 
    !['no show', 'rescheduled', 'cancelled'].some(x => d.outcome.toLowerCase().includes(x))
  ).length;

  const callsClosed = appointments.filter(d => 
    ['closed', 'deposit collected', 'paid', 'full pay'].some(x => d.outcome.toLowerCase().includes(x))
  ).length;
  
  // Rates
  const showRate = callsDue > 0 ? (callsTaken / callsDue) * 100 : 0;
  const closeRate = callsTaken > 0 ? (callsClosed / callsTaken) * 100 : 0;
  
  // Averages
  const avgCashCall = callsTaken > 0 ? totalCash / callsTaken : 0;
  const avgCashClose = callsClosed > 0 ? totalCash / callsClosed : 0;
  const avgCashApp = totalApplications > 0 ? totalCash / totalApplications : 0;

  // 4. GRAPH DATA & SPARKLINES
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
  
  // Generate simple sparkline path
  const sparklinePoints = trend.map(([_, val], i) => {
      const x = (i / (trend.length - 1)) * 100;
      const y = 100 - (val / maxCash) * 100;
      return `${x},${y || 100}`;
  }).join(' ');

  // Filters
  const platforms = Array.from(new Set(allSalesData.map(d => d.platform))).filter(Boolean) as string[];
  const closers = Array.from(new Set(allSalesData.map(d => d.closer))).filter(Boolean) as string[];
  const setters = Array.from(new Set(allSalesData.map(d => d.setter))).filter(Boolean) as string[];

  // Recent Wins (Exclude $0 or No Shows)
  const recentWins = appointments
    .filter(d => d.cash > 0 && !['no show', 'cancelled', 'rescheduled'].some(o => d.outcome.toLowerCase().includes(o)))
    .slice(0, 5);

  return (
    <div className="min-h-screen p-6 md:p-8 bg-[#050505] text-white">
      <div className="max-w-[1800px] mx-auto space-y-8">
        
        {/* HEADER & FILTERS */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 relative z-[100]">
            <div>
                <h1 className="text-3xl font-black tracking-tighter text-white uppercase mb-1">Dashboard</h1>
                <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest">Monitor your key metrics and performance</p>
            </div>
            
            <div className="bg-zinc-900/50 border border-zinc-800/50 backdrop-blur-md p-2 pl-6 rounded-xl flex flex-wrap items-center gap-4">
                <Filters platforms={platforms} closers={closers} setters={setters} />
            </div>
        </div>

        {/* ROW 1: THE BIG THREE (With Sparklines) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Cash Collected */}
            <div className="bg-zinc-900/40 border border-zinc-800/60 p-6 rounded-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-transparent opacity-50" />
                <div className="relative z-10 flex justify-between items-end">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 bg-blue-500/10 rounded-lg border border-blue-500/20 text-blue-500">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-widest text-zinc-400">Cash Collected</span>
                        </div>
                        <h2 className="text-4xl font-black tracking-tight text-white">${totalCash.toLocaleString()}</h2>
                    </div>
                    {/* Sparkline */}
                    <div className="w-24 h-12">
                         <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" className="overflow-visible">
                            <polyline points={sparklinePoints} fill="none" stroke="#3b82f6" strokeWidth="4" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                         </svg>
                    </div>
                </div>
            </div>

            {/* Revenue */}
            <div className="bg-zinc-900/40 border border-zinc-800/60 p-6 rounded-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 to-transparent opacity-50" />
                <div className="relative z-10 flex justify-between items-end">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                             <div className="p-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-emerald-500">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-widest text-zinc-400">Revenue</span>
                        </div>
                        <h2 className="text-4xl font-black tracking-tight text-white">${totalRev.toLocaleString()}</h2>
                    </div>
                    {/* Sparkline (Reused for demo visual) */}
                    <div className="w-24 h-12">
                         <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" className="overflow-visible">
                            <polyline points={sparklinePoints} fill="none" stroke="#10b981" strokeWidth="4" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                         </svg>
                    </div>
                </div>
            </div>

            {/* Close Rate */}
            <div className="bg-zinc-900/40 border border-zinc-800/60 p-6 rounded-2xl relative overflow-hidden group">
                 <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/10 to-transparent opacity-50" />
                 <div className="relative z-10 flex justify-between items-end">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                             <div className="p-1.5 bg-cyan-500/10 rounded-lg border border-cyan-500/20 text-cyan-500">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-widest text-zinc-400">Close Rate</span>
                        </div>
                        <h2 className="text-4xl font-black tracking-tight text-white">{closeRate.toFixed(1)}%</h2>
                    </div>
                     <div className="w-24 h-12">
                         <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" className="overflow-visible">
                            <polyline points={sparklinePoints} fill="none" stroke="#06b6d4" strokeWidth="4" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                         </svg>
                    </div>
                </div>
            </div>
        </div>

        {/* ROW 2: FUNNEL METRICS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard label="Show Rate" value={`${showRate.toFixed(1)}%`} />
            <MetricCard label="Calls Due" value={callsDue} />
            <MetricCard label="Calls Taken" value={callsTaken} />
            <MetricCard label="Calls Closed" value={callsClosed} />
        </div>

        {/* ROW 3: EFFICIENCY METRICS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard label="Avg. Cash / Call" value={`$${avgCashCall.toFixed(0)}`} />
            <MetricCard label="Avg. Cash / Close" value={`$${avgCashClose.toFixed(0)}`} />
            <MetricCard label="Avg. Cash / App" value={`$${avgCashApp.toFixed(0)}`} />
            {/* Placeholder for alignment or Total Applications */}
             <MetricCard label="Total Applications" value={totalApplications} />
        </div>

        {/* ROW 4: REVENUE BREAKDOWN */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-zinc-900/20 border border-zinc-800 p-6 rounded-2xl">
                <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-1">New Cash Collected</p>
                <h3 className="text-3xl font-black text-white tracking-tight">${newCashCollected.toLocaleString()}</h3>
                <p className="text-[9px] text-zinc-600 mt-2">Excludes recurring revenue</p>
            </div>
            <div className="bg-zinc-900/20 border border-zinc-800 p-6 rounded-2xl">
                <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-1">MRR Collected</p>
                <h3 className="text-3xl font-black text-white tracking-tight">${mrrCash.toLocaleString()}</h3>
                <p className="text-[9px] text-zinc-600 mt-2">Monthly recurring revenue</p>
            </div>
            <div className="bg-zinc-900/20 border border-zinc-800 p-6 rounded-2xl">
                <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-1">Total Gross Revenue</p>
                <h3 className="text-3xl font-black text-white tracking-tight">${totalRev.toLocaleString()}</h3>
                <p className="text-[9px] text-zinc-600 mt-2">Total contract value</p>
            </div>
        </div>

        {/* ROW 5: CHARTS & LISTS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             {/* Main Chart */}
            <div className="lg:col-span-2 bg-[#0c0c0c] border border-zinc-800/50 rounded-2xl p-6 relative overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                     <h3 className="text-[11px] font-black uppercase text-zinc-400 tracking-widest">Cash Velocity</h3>
                </div>
                
                {/* Reusing your graph logic */}
                <div className="h-[250px] w-full flex items-end justify-between gap-2">
                     {trend.map(([date, cash], i) => {
                            const height = (cash / maxCash) * 100;
                            return (
                                <div key={i} className="flex-1 h-full flex flex-col justify-end group">
                                    <div 
                                        className="w-full bg-cyan-600 hover:bg-cyan-400 transition-all rounded-t-sm relative" 
                                        style={{ height: `${height || 1}%` }}
                                    >
                                         <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-white text-black text-[9px] font-bold px-2 py-1 rounded whitespace-nowrap z-20">
                                            ${cash.toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                </div>
            </div>

            {/* Recent Wins */}
            <div className="bg-[#0c0c0c] border border-zinc-800/50 rounded-2xl p-6">
                <h3 className="text-[11px] font-black uppercase text-zinc-400 tracking-widest mb-6">Recent Acquisitions</h3>
                <div className="space-y-4">
                    {recentWins.length > 0 ? recentWins.map((lead, i) => (
                        <div key={i} className="flex justify-between items-center border-b border-zinc-800 pb-3">
                            <div>
                                <p className="text-xs font-bold text-white uppercase">{lead.prospect}</p>
                                <p className="text-[9px] text-zinc-500 font-bold uppercase">{lead.outcome}</p>
                            </div>
                            <p className="text-sm font-black text-cyan-500 italic">${lead.cash.toLocaleString()}</p>
                        </div>
                    )) : (
                        <p className="text-[10px] text-zinc-600 uppercase">No recent wins found.</p>
                    )}
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}

// Simple Card Component for consistency
function MetricCard({ label, value }: { label: string, value: string | number }) {
    return (
        <div className="bg-zinc-900/30 border border-zinc-800/50 p-5 rounded-xl hover:border-zinc-700 transition-colors">
            <p className="text-[10px] font-black text-zinc-500 uppercase mb-2 tracking-widest">{label}</p>
            <h3 className="text-2xl font-black text-white tracking-tight">{value}</h3>
        </div>
    );
}

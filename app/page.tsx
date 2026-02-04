export const dynamic = 'force-dynamic';

import React from 'react';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import Filters from './Filters';
import { TrendingUp, DollarSign, Percent, Users, Phone, CheckCircle2, FileText } from 'lucide-react';

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

  // MRR vs New Cash Split
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

  // Get last 10 calls for the log, regardless of outcome
  const recentCalls = appointments.slice(0, 10);

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
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 mb-10 relative z-[100]">
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
            
            {/* ROW 1: THE TOP 3 KEY METRICS (Hero Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* 1. Net Cash Collected */}
                <HeroCard 
                    label="Net Cash Collected" 
                    value={`$${totalCash.toLocaleString(undefined, { minimumFractionDigits: 0 })}`}
                    icon={<DollarSign size={24} className="text-cyan-400" />}
                    gradient="from-cyan-900/30 to-blue-900/10"
                    borderColor="border-cyan-500/30"
                />

                 {/* 2. Total Revenue (With MRR Highlight) */}
                <div className="relative group overflow-hidden bg-zinc-900/40 border border-emerald-500/30 p-8 rounded-3xl">
                    <div className={`absolute inset-0 bg-gradient-to-br from-emerald-900/30 to-teal-900/10 opacity-50`} />
                    <div className="relative z-10 h-full flex flex-col justify-between">
                         <div className="flex justify-between items-start mb-4">
                            <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Total Revenue</p>
                            <TrendingUp size={24} className="text-emerald-400" />
                        </div>
                        <h2 className="text-5xl font-black text-white tracking-tighter tabular-nums mb-6">
                             ${totalRev.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                        </h2>
                        
                        {/* MRR & New Cash Breakdown Highlights */}
                        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-emerald-500/20">
                            <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                                <p className="text-[9px] font-bold uppercase text-emerald-300 mb-1">New Cash</p>
                                <p className="text-lg font-black text-white">${newCash.toLocaleString()}</p>
                            </div>
                             <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                                <p className="text-[9px] font-bold uppercase text-emerald-300 mb-1">MRR Added</p>
                                <p className="text-lg font-black text-white">${mrrCash.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>

                 {/* 3. Close Rate */}
                 <HeroCard 
                    label="Close Rate (Taken to Closed)" 
                    value={`${closeRate.toFixed(1)}%`}
                    icon={<Percent size={24} className="text-purple-400" />}
                    gradient="from-purple-900/30 to-pink-900/10"
                    borderColor="border-purple-500/30"
                />
            </div>

            {/* ROW 2: ANALYTICS GRID (2x4) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Funnel Row */}
                <StatBox label="Show Rate" value={`${showRate.toFixed(1)}%`} icon={<Users size={16}/>} />
                <StatBox label="Calls Due" value={callsDue} icon={<Phone size={16}/>} />
                <StatBox label="Calls Taken" value={callsTaken} icon={<Phone size={16} className="fill-zinc-500/20"/>} />
                <StatBox label="Calls Closed" value={callsClosed} icon={<CheckCircle2 size={16} className="text-cyan-500"/>} highlight />

                {/* Efficiency Row */}
                <StatBox label="Total Applications" value={totalApplications} icon={<FileText size={16}/>} />
                <StatBox label="Cash / Application" value={`$${avgCashApplication.toFixed(0)}`} />
                <StatBox label="Cash / Appt" value={`$${avgCashAppt.toFixed(0)}`} />
                <StatBox label="Cash / Close" value={`$${avgCashClose.toFixed(0)}`} highlight />
            </div>


            {/* ROW 3: GRAPH & RECENT CALLS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* CASH COLLECTED GRAPH (Smaller, Bar + Line) */}
                <div className="lg:col-span-2 bg-[#0c0c0c] border border-zinc-800/50 rounded-3xl p-6 shadow-inner relative overflow-hidden h-[280px]">
                    <div className="flex items-center justify-between mb-6 relative z-10">
                        <h3 className="text-xs font-black uppercase text-zinc-400 tracking-widest">Cash Collected</h3>
                        <span className="text-[10px] font-bold text-zinc-600 italic">Daily Trend</span>
                    </div>

                    <div className="h-[180px] w-full relative z-10">
                         {/* Y-Axis Grid */}
                         <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6">
                            {[1, 0.5, 0].map(step => (
                                <div key={step} className="w-full border-t border-zinc-800/30 relative leading-none">
                                    <span className="absolute -left-8 -top-2 text-[8px] font-bold text-zinc-700 w-6 text-right">
                                        ${((maxCash * step) / 1000).toFixed(0)}k
                                    </span>
                                </div>
                            ))}
                        </div>

                        <svg className="absolute inset-0 w-full h-full overflow-visible pl-2 pb-6" preserveAspectRatio="none">
                             <defs>
                                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4"/><stop offset="100%" stopColor="#06b6d4" stopOpacity="0.05"/></linearGradient>
                                <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#22d3ee" /><stop offset="100%" stopColor="#818cf8" /></linearGradient>
                            </defs>
                            
                            {/* BARS */}
                            {trend.map(([_, count], i) => {
                                const barHeight = (count / maxCash) * 180;
                                const xPos = (i / (trend.length - 1 || 1)) * 100;
                                const width = 80 / (trend.length || 1);
                                return count > 0 && <rect key={i} x={`${xPos - width/2}%`} y={180 - barHeight} width={`${width}%`} height={barHeight} fill="url(#barGrad)" rx="2" />;
                            })}

                            {/* LINE TREND ON TOP */}
                             <polyline
                                fill="none" stroke="url(#lineGrad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                                points={trend.map(([_, count], i) => {
                                    const x = (i / (trend.length - 1 || 1)) * 1000;
                                    const y = 180 - (count / maxCash) * 180;
                                    return `${x},${y}`;
                                }).join(' ')}
                                viewBox="0 0 1000 180" style={{ vectorEffect: 'non-scaling-stroke' }}
                            />
                        </svg>

                         {/* X-Axis Labels */}
                         <div className="absolute inset-x-0 bottom-0 flex justify-between px-2">
                            {trend.filter((_, i) => i % Math.ceil(trend.length / 6) === 0).map(([date], i) => (
                                <span key={i} className="text-[8px] font-bold text-zinc-600 uppercase">{date}</span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RECENT CALLS LOG */}
                <div className="bg-[#0c0c0c] border border-zinc-800/50 rounded-3xl p-6 h-[280px] overflow-y-auto custom-scrollbar">
                    <h3 className="text-xs font-black uppercase text-zinc-400 tracking-widest mb-4 sticky top-0 bg-[#0c0c0c] py-2 z-10">Recent Calls</h3>
                    <div className="space-y-2">
                        {recentCalls.length > 0 ? recentCalls.map((call, i) => (
                            <div key={i} className="flex flex-col p-3 bg-zinc-900/30 rounded-xl border border-zinc-800/50 gap-2">
                                <div className="flex justify-between items-start">
                                    <p className="text-[11px] font-black uppercase text-white tracking-tight truncate">{call.prospect}</p>
                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${getOutcomeStyle(call.outcome)}`}>
                                        {call.outcome}
                                    </span>
                                </div>
                                <div className="flex justify-between items-end">
                                     <p className="text-[9px] text-zinc-600 uppercase">{call.closer}</p>
                                    <p className="text-xs font-black text-cyan-500 tabular-nums">${call.cash.toLocaleString()}</p>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-6"><span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">No Recent Calls</span></div>
                        )}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

// --- COMPONENTS ---

function HeroCard({ label, value, icon, gradient, borderColor }: any) {
    return (
        <div className={`relative group overflow-hidden bg-zinc-900/40 border ${borderColor} p-8 rounded-3xl`}>
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-50`} />
            <div className="relative z-10 h-full flex flex-col justify-between">
                 <div className="flex justify-between items-start mb-4">
                    <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">{label}</p>
                    {icon}
                </div>
                <h2 className="text-5xl font-black text-white tracking-tighter tabular-nums">
                    {value}
                </h2>
            </div>
        </div>
    )
}

function StatBox({ label, value, icon, highlight = false }: { label: string, value: any, icon?: React.ReactNode, highlight?: boolean }) {
    return (
        <div className={`bg-zinc-900/40 border ${highlight ? 'border-cyan-500/30 bg-cyan-900/10' : 'border-zinc-800/50'} p-5 rounded-2xl transition-all group hover:border-cyan-500/20 flex flex-col justify-between gap-3`}>
            <div className="flex items-center justify-between">
                 <p className={`text-[10px] font-black uppercase tracking-widest ${highlight ? 'text-cyan-300' : 'text-zinc-500'}`}>{label}</p>
                 {icon && <div className={`${highlight ? 'text-cyan-400' : 'text-zinc-600'} opacity-70`}>{icon}</div>}
            </div>
            <h3 className={`text-2xl font-black tracking-tighter tabular-nums ${highlight ? 'text-white' : 'text-zinc-100'}`}>{value.toLocaleString()}</h3>
        </div>
    );
}

// Helper for outcome badge colors
function getOutcomeStyle(outcome: string) {
    const lower = outcome.toLowerCase();
    if (lower.includes('closed') || lower.includes('paid') || lower.includes('full')) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (lower.includes('deposit') || lower.includes('mrr')) return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
    if (lower.includes('no show') || lower.includes('cancelled')) return 'bg-red-500/10 text-red-400 border-red-500/20';
    return 'bg-zinc-800 text-zinc-400 border-zinc-700';
}

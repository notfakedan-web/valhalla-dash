// 1. FORCE DYNAMIC REFRESH
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import React, { Suspense } from 'react';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import Filters from './Filters';
import { TrendingUp, DollarSign, Percent, Users, Phone, CheckCircle2, FileText, Activity, Loader2 } from 'lucide-react';

// --- HELPER 1: FETCH SALES DATA ---
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
  } catch (error) { return []; }
}

// --- HELPER 2: FETCH APPLICATIONS COUNT ---
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
            const getLeadVal = (search: string[]) => {
                 const k = sheet.headerValues.find(h => search.some(s => h.toLowerCase().trim().includes(s.toLowerCase().trim())));
                 return k ? row.get(k) : '';
            };

            const rawDate = getLeadVal(['Submitted At', 'Submitted', 'Date']);
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

// --- MAIN CONTENT ---
async function DashboardContent({ params }: any) {
  const allRawData = await getSheetData();

  const today = new Date();
  const start = params.start ? new Date(params.start) : null;
  const end = params.end ? new Date(params.end) : null;
  if (end) end.setHours(23, 59, 59, 999);

  const totalApplications = await getApplicationsCount(start, end);

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
  const callsTaken = appointments.filter(d => !['no show', 'rescheduled', 'cancelled'].some(x => d.outcome.toLowerCase().includes(x))).length;
  const callsClosed = appointments.filter(d => ['closed', 'deposit collected', 'paid', 'full pay'].some(x => d.outcome.toLowerCase().includes(x))).length;
  
  const showRate = callsDue > 0 ? (callsTaken / callsDue) * 100 : 0;
  const closeRate = callsTaken > 0 ? (callsClosed / callsTaken) * 100 : 0;
  
  const avgCashAppt = callsDue > 0 ? totalCash / callsDue : 0; 
  const avgCashClose = callsClosed > 0 ? totalCash / callsClosed : 0; 
  const avgCashApplication = totalApplications > 0 ? totalCash / totalApplications : 0;

  const recentCalls = appointments.slice(0, 20);

  // GRAPH LOGIC
  let graphStart = start; let graphEnd = end;
  if (!graphStart && performanceData.length > 0) { const times = performanceData.map(d => new Date(d.date).getTime()); graphStart = new Date(Math.min(...times)); }
  if (!graphEnd && performanceData.length > 0) { const times = performanceData.map(d => new Date(d.date).getTime()); graphEnd = new Date(Math.max(...times)); }
  if (!graphStart) graphStart = new Date(today.getFullYear(), today.getMonth(), 1);
  if (!graphEnd) graphEnd = today;

  const dayMap = new Map<string, number>();
  for (let d = new Date(graphStart); d <= graphEnd; d.setDate(d.getDate() + 1)) {
      dayMap.set(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), 0);
  }
  performanceData.forEach(d => {
    const day = new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (dayMap.has(day)) dayMap.set(day, (dayMap.get(day) || 0) + d.cash);
  });
  const trend = Array.from(dayMap.entries());
  const maxCash = Math.max(...trend.map(([_, c]) => c), 1);

  const CHART_HEIGHT = 220;
  const CHART_WIDTH = 1000;
  const BAR_MAX_HEIGHT = 180;
  const linePoints: string[] = [];
  trend.forEach(([_, count], i) => {
      const xPos = (i * (CHART_WIDTH / trend.length)) + ((CHART_WIDTH / trend.length) / 2);
      const y = CHART_HEIGHT - ((count / maxCash) * BAR_MAX_HEIGHT);
      linePoints.push(`${xPos},${y}`);
  });

  const platforms = Array.from(new Set(allRawData.map(d => d.platform))).filter(Boolean) as string[];
  const closers = Array.from(new Set(allRawData.map(d => d.closer))).filter(Boolean) as string[];
  const setters = Array.from(new Set(allRawData.map(d => d.setter))).filter(Boolean) as string[];

  return (
    <div className="min-h-screen p-6 md:p-10 bg-[#09090b] text-zinc-100 font-sans pt-16 lg:pt-10">
      
      {/* 1. FIXED BUTTON: LOCKED TO TOP RIGHT ON MOBILE & DESKTOP */}
      <div className="fixed top-20 right-4 lg:top-6 lg:right-10 z-[100] flex items-center gap-3">
        <div className="bg-zinc-900/90 border border-zinc-800 backdrop-blur-xl p-1.5 pl-3 rounded-xl flex items-center gap-3 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-cyan-500/20">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 hidden sm:block">Filters:</span>
          <Filters platforms={platforms} closers={closers} setters={setters} />
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto">
        <div className="space-y-6 relative z-10">
            {/* NET CASH COLLECTED SECTION - PUSHED UP */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-zinc-900/40 border border-cyan-500/30 backdrop-blur-sm p-6 rounded-2xl shadow-[0_0_30px_-10px_rgba(6,182,212,0.15)] flex flex-col justify-start h-40">
                     <div className="flex justify-between items-start mb-2">
                        <p className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">Net Cash Collected</p>
                        <DollarSign size={18} className="text-cyan-400" />
                    </div>
                    <h2 className="text-4xl font-bold text-white tracking-tight tabular-nums mb-auto">${totalCash.toLocaleString(undefined, { minimumFractionDigits: 0 })}</h2>
                    <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-cyan-950/30 border border-cyan-500/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400"></div>
                            <span className="text-[9px] font-bold text-cyan-200/70 uppercase">New:</span>
                            <span className="text-[10px] font-bold text-cyan-100 tabular-nums">${newCash.toLocaleString()}</span>
                        </div>
                         <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-cyan-950/30 border border-cyan-500/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                            <span className="text-[9px] font-bold text-cyan-200/70 uppercase">MRR:</span>
                            <span className="text-[10px] font-bold text-cyan-100 tabular-nums">${mrrCash.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
                <div className="bg-zinc-900/40 border border-emerald-500/30 backdrop-blur-sm p-6 rounded-2xl shadow-[0_0_30px_-10px_rgba(16,185,129,0.15)] flex flex-col justify-start h-40">
                     <div className="flex justify-between items-start mb-2">
                        <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Total Revenue</p>
                        <TrendingUp size={18} className="text-emerald-400" />
                    </div>
                    <h2 className="text-4xl font-bold text-white tracking-tight tabular-nums mb-auto">${totalRev.toLocaleString(undefined, { minimumFractionDigits: 0 })}</h2>
                </div>
                 <div className="bg-zinc-900/40 border border-purple-500/30 backdrop-blur-sm p-6 rounded-2xl shadow-[0_0_30px_-10px_rgba(168,85,247,0.15)] flex flex-col justify-start h-40">
                     <div className="flex justify-between items-start mb-2">
                        <p className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">Close Rate (Taken)</p>
                        <Percent size={18} className="text-purple-400" />
                    </div>
                    <h2 className="text-4xl font-bold text-white tracking-tight tabular-nums mb-auto">{closeRate.toFixed(1)}%</h2>
                </div>
            </div>

            {/* REST OF DASHBOARD */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatBox label="Show Rate" value={`${showRate.toFixed(1)}%`} icon={<Users size={14}/>} />
                <StatBox label="Calls Due" value={callsDue} icon={<Phone size={14}/>} />
                <StatBox label="Calls Taken" value={callsTaken} icon={<Phone size={14} className="fill-zinc-500/20"/>} />
                <StatBox label="Calls Closed" value={callsClosed} icon={<CheckCircle2 size={14} className="text-cyan-500"/>} highlight />
                <StatBox label="Total Applications" value={totalApplications} icon={<FileText size={14}/>} />
                <StatBox label="Cash / Application" value={`$${avgCashApplication.toFixed(0)}`} />
                <StatBox label="Cash / Appt" value={`$${avgCashAppt.toFixed(0)}`} />
                <StatBox label="Cash / Close" value={`$${avgCashClose.toFixed(0)}`} highlight />
            </div>

            <div className="bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm h-[340px]">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xs font-bold uppercase text-zinc-400 tracking-widest">Cash Flow Trend</h3>
                </div>
                <div className="h-[220px] w-full relative">
                    <svg className="w-full h-full overflow-visible pb-6" preserveAspectRatio="none" viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}>
                        <polyline fill="none" stroke="url(#lineGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={linePoints.join(' ')} className="opacity-90" />
                    </svg>
                </div>
            </div>

            <div className="bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-sm rounded-2xl overflow-hidden shadow-sm pb-10">
                <div className="p-4 border-b border-zinc-800/50 flex justify-between items-center bg-zinc-900/20">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Recent Activity Log</h3>
                </div>
                <div className="p-4 overflow-x-auto">
                     <div className="min-w-[800px]">
                        <div className="space-y-1">
                        {recentCalls.map((call, i) => (
                            <div key={i} className="grid grid-cols-6 items-center p-3 bg-zinc-800/20 rounded-lg group text-xs">
                                <div className="col-span-2 font-medium text-zinc-200 truncate pr-4">{call.prospect}</div>
                                <div><span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${getOutcomeStyle(call.outcome)}`}>{call.outcome}</span></div>
                                <div className="text-zinc-400">{call.closer}</div>
                                <div className="text-zinc-500 tabular-nums">{new Date(call.date).toLocaleDateString()}</div>
                                <div className={`text-right font-bold tabular-nums ${call.cash > 0 ? 'text-cyan-400' : 'text-zinc-500'}`}>${call.cash.toLocaleString()}</div>
                            </div>
                        ))}
                        </div>
                     </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

// --- SMALL COMPONENTS ---
function StatBox({ label, value, icon, highlight = false }: { label: string, value: any, icon?: React.ReactNode, highlight?: boolean }) {
    return (
        <div className={`bg-zinc-900/40 border ${highlight ? 'border-cyan-500/20 bg-cyan-500/5' : 'border-zinc-800/80'} backdrop-blur-sm p-4 rounded-xl transition-all hover:border-cyan-500/20 flex flex-col gap-2 font-sans shadow-sm`}>
            <div className="flex items-center justify-between">
                 <p className={`text-[10px] font-bold uppercase tracking-wider ${highlight ? 'text-cyan-400' : 'text-zinc-500'}`}>{label}</p>
                 {icon && <div className={`${highlight ? 'text-cyan-500' : 'text-zinc-600'} opacity-80`}>{icon}</div>}
            </div>
            <h3 className={`text-xl font-bold tracking-tight tabular-nums ${highlight ? 'text-white' : 'text-zinc-200'}`}>{value.toLocaleString()}</h3>
        </div>
    );
}

function getOutcomeStyle(outcome: string) {
    const lower = outcome.toLowerCase();
    if (lower.includes('closed') || lower.includes('paid') || lower.includes('full')) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (lower.includes('deposit') || lower.includes('mrr')) return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
    if (lower.includes('no show') || lower.includes('cancelled')) return 'bg-red-500/10 text-red-400 border-red-500/20';
    return 'bg-zinc-800/50 text-zinc-400 border-zinc-700/50';
}

function LoadingFallback() {
    return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
            <div className="text-center space-y-1">
                <h3 className="text-lg font-bold text-white uppercase tracking-widest animate-pulse">Loading Dashboard...</h3>
            </div>
        </div>
    );
}

export default async function ValhallaDashboard({ searchParams }: { searchParams: Promise<any> }) {
    const params = await searchParams;
    const key = JSON.stringify(params);
    return (
        <Suspense key={key} fallback={<LoadingFallback />}>
            <DashboardContent params={params} />
        </Suspense>
    );
}

// 1. FORCE DYNAMIC REFRESH
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import React from 'react';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import Filters from './Filters';
import { TrendingUp, DollarSign, Percent, Users, Phone, CheckCircle2, FileText, Activity } from 'lucide-react';

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
            const getLeadVal = (search: string) => {
                 const k = sheet.headerValues.find(h => h.toLowerCase().trim().includes(search.toLowerCase().trim()));
                 return k ? row.get(k) : '';
            };

            const rawDate = getLeadVal('submitted') || getLeadVal('date');
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

  // 1. DATA PROCESSING
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

  // GRAPH DATA PREP
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

  // CHART CONSTANTS
  const CHART_HEIGHT = 220;
  const CHART_WIDTH = 1000;
  const BAR_MAX_HEIGHT = 180;

  const linePoints: string[] = [];
  trend.forEach(([_, count], i) => {
      const x = (i / (trend.length - 1 || 1)) * CHART_WIDTH + (CHART_WIDTH / (trend.length || 1)) / 2;
      const y = CHART_HEIGHT - ((count / maxCash) * BAR_MAX_HEIGHT);
      linePoints.push(`${x},${y}`);
  });

  const platforms = Array.from(new Set(allRawData.map(d => d.platform))).filter(Boolean) as string[];
  const closers = Array.from(new Set(allRawData.map(d => d.closer))).filter(Boolean) as string[];
  const setters = Array.from(new Set(allRawData.map(d => d.setter))).filter(Boolean) as string[];

  return (
    <div className="min-h-screen p-6 md:p-10 bg-[#09090b] text-zinc-100 font-sans">
      <div className="max-w-[1600px] mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 mb-8 relative z-[100]">
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <Activity size={16} className="text-cyan-500" />
                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Executive Overview</span>
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-white">Valhalla <span className="text-cyan-500">OS</span></h1>
            </div>
            
            <div className="bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md p-2 pl-4 rounded-lg flex flex-wrap items-center gap-4 shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mr-2">Filters:</span>
                <Filters platforms={platforms} closers={closers} setters={setters} />
            </div>
        </div>

        {/* MAIN DASHBOARD */}
        <div className="space-y-6 relative z-10">
            
            {/* ROW 1: TOP 3 CARDS (ALIGNED & SLIM) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* 1. Net Cash */}
                <div className="bg-zinc-900/40 border border-cyan-500/20 backdrop-blur-sm p-6 rounded-2xl shadow-sm h-36 flex flex-col justify-between">
                     <div className="flex justify-between items-start">
                        <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Net Cash Collected</p>
                        <DollarSign size={18} className="text-cyan-400" />
                    </div>
                    {/* Aligned Number */}
                    <div className="flex-1 flex items-center">
                        <h2 className="text-4xl font-bold text-white tracking-tight tabular-nums">${totalCash.toLocaleString(undefined, { minimumFractionDigits: 0 })}</h2>
                    </div>
                </div>

                 {/* 2. Total Revenue (Breakdown Below) */}
                <div className="bg-zinc-900/40 border border-emerald-500/20 backdrop-blur-sm p-6 rounded-2xl shadow-sm h-36 flex flex-col justify-between">
                     <div className="flex justify-between items-start">
                        <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Total Revenue</p>
                        <TrendingUp size={18} className="text-emerald-400" />
                    </div>
                    
                    {/* Aligned Number Container */}
                    <div className="flex-1 flex flex-col justify-center gap-2">
                        <h2 className="text-4xl font-bold text-white tracking-tight tabular-nums">${totalRev.toLocaleString(undefined, { minimumFractionDigits: 0 })}</h2>
                        
                        {/* Breakdown Frames */}
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-zinc-800 bg-zinc-900/50">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                <span className="text-[9px] font-medium text-zinc-400 uppercase">New:</span>
                                <span className="text-[10px] font-bold text-white tabular-nums">${newCash.toLocaleString()}</span>
                            </div>
                             <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-zinc-800 bg-zinc-900/50">
                                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500"></div>
                                <span className="text-[9px] font-medium text-zinc-400 uppercase">MRR:</span>
                                <span className="text-[10px] font-bold text-white tabular-nums">${mrrCash.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                 {/* 3. Close Rate */}
                 <div className="bg-zinc-900/40 border border-purple-500/20 backdrop-blur-sm p-6 rounded-2xl shadow-sm h-36 flex flex-col justify-between">
                     <div className="flex justify-between items-start">
                        <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Close Rate (Taken)</p>
                        <Percent size={18} className="text-purple-400" />
                    </div>
                    {/* Aligned Number */}
                    <div className="flex-1 flex items-center">
                        <h2 className="text-4xl font-bold text-white tracking-tight tabular-nums">{closeRate.toFixed(1)}%</h2>
                    </div>
                </div>
            </div>

            {/* ROW 2: ANALYTICS GRID */}
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

            {/* ROW 3: CASH COLLECTED GRAPH */}
            <div className="bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm relative overflow-hidden h-[320px]">
                <div className="flex items-center justify-between mb-8 relative z-20">
                    <h3 className="text-xs font-bold uppercase text-zinc-400 tracking-widest">Cash Flow Trend</h3>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                        <span className="text-[10px] font-medium text-zinc-500">Daily Collections</span>
                    </div>
                </div>

                <div className="h-[200px] w-full relative z-10 select-none">
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6">
                        {[1, 0.5, 0].map(step => (
                            <div key={step} className="w-full border-t border-zinc-800/30 relative leading-none">
                                <span className="absolute -left-8 -top-2 text-[10px] font-medium text-zinc-600 w-6 text-right">
                                    ${((maxCash * step) / 1000).toFixed(0)}k
                                </span>
                            </div>
                        ))}
                    </div>

                    <svg className="absolute inset-0 w-full h-full overflow-visible pl-2 pb-6" preserveAspectRatio="none" viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}>
                        <defs>
                            <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#06b6d4" stopOpacity="0.6"/><stop offset="100%" stopColor="#06b6d4" stopOpacity="0.1"/></linearGradient>
                            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#22d3ee" /><stop offset="100%" stopColor="#0ea5e9" /></linearGradient>
                        </defs>
                        
                        {trend.map(([date, count], i) => {
                            const barHeight = (count / maxCash) * BAR_MAX_HEIGHT;
                            const xPos = (i / (trend.length - 1 || 1)) * CHART_WIDTH + (CHART_WIDTH / (trend.length || 1)) / 2 - ((CHART_WIDTH / (trend.length || 1)) * 0.8) / 2;
                            const width = (CHART_WIDTH / (trend.length || 1)) * 0.8;
                            const yPos = CHART_HEIGHT - barHeight;
                            const centerX = xPos + width / 2;

                            return (
                                <g key={i} className="group cursor-crosshair">
                                    <rect x={xPos} y={0} width={width} height={CHART_HEIGHT} fill="transparent" />
                                    {count > 0 && <rect x={xPos} y={yPos} width={width} height={barHeight} fill="url(#barGrad)" rx="2" className="opacity-40 transition-all duration-300 group-hover:opacity-80" />}
                                    
                                    <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                                        <rect x={centerX - 35} y={yPos - 35} width="70" height="26" rx="4" fill="#18181b" stroke="#27272a" strokeWidth="1" className="shadow-lg"/>
                                        <text x={centerX} y={yPos - 22} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="11" fontWeight="600">
                                            ${count.toLocaleString()}
                                        </text>
                                    </g>
                                </g>
                            );
                        })}
                        <polyline fill="none" stroke="url(#lineGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={linePoints.join(' ')} className="pointer-events-none opacity-90" />
                    </svg>

                    <div className="absolute inset-x-0 bottom-0 flex justify-between px-2">
                        {trend.filter((_, i) => i % Math.ceil(trend.length / 8) === 0).map(([date], i) => (
                            <span key={i} className="text-[10px] font-medium text-zinc-600 uppercase">{date}</span>
                        ))}
                    </div>
                </div>
            </div>

            {/* ROW 4: RECENT CALLS */}
            <div className="bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-sm rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-zinc-800/50 flex justify-between items-center bg-zinc-900/20">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Recent Activity Log</h3>
                </div>
                <div className="p-4 overflow-x-auto">
                     <div className="min-w-[800px]">
                        <div className="grid grid-cols-6 text-[10px] font-medium uppercase text-zinc-500 tracking-wider px-4 mb-3">
                            <div className="col-span-2">Prospect</div>
                            <div>Outcome</div>
                            <div>Closer</div>
                            <div>Date</div>
                            <div className="text-right">Cash collected</div>
                        </div>
                        <div className="space-y-1">
                        {recentCalls.map((call, i) => (
                            <div key={i} className="grid grid-cols-6 items-center p-3 bg-zinc-800/20 rounded-lg border border-transparent hover:border-zinc-700/50 transition-all group text-xs">
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

// --- COMPONENTS ---
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

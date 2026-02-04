export const dynamic = 'force-dynamic';

import React from 'react';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import Filters from './Filters';
import { Users, Phone, CheckCircle2, FileText } from 'lucide-react';

// --- DATA FETCHING HELPERS (Same as before) ---
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

// --- MAIN DASHBOARD COMPONENT ---
export default async function ValhallaDashboard({ searchParams }: { searchParams: Promise<any> }) {
  const params = await searchParams;
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

  // SPLIT MRR vs NEW CASH
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

  // Get larger slice for the bottom log
  const recentCalls = appointments.slice(0, 20);

  // GRAPH LOGIC (Original Tall Bar Chart)
  let graphStart = start;
  let graphEnd = end;
  if (!graphStart && performanceData.length > 0) { const times = performanceData.map(d => new Date(d.date).getTime()); graphStart = new Date(Math.min(...times)); }
  if (!graphEnd && performanceData.length > 0) { const times = performanceData.map(d => new Date(d.date).getTime()); graphEnd = new Date(Math.max(...times)); }
  if (!graphStart) graphStart = new Date(today.getFullYear(), today.getMonth(), 1);
  if (!graphEnd) graphEnd = today;

  const dayMap = new Map<string, number>();
  for (let d = new Date(graphStart); d <= graphEnd; d.setDate(d.getDate() + 1)) {
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dayMap.set(label, 0);
  }
  performanceData.forEach(d => {
    const day = new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (dayMap.has(day)) dayMap.set(day, (dayMap.get(day) || 0) + d.cash);
  });
  const trend = Array.from(dayMap.entries());
  const maxCash = Math.max(...trend.map(([_, c]) => c), 1);

  const platforms = Array.from(new Set(allRawData.map(d => d.platform))).filter(Boolean) as string[];
  const closers = Array.from(new Set(allRawData.map(d => d.closer))).filter(Boolean) as string[];
  const setters = Array.from(new Set(allRawData.map(d => d.setter))).filter(Boolean) as string[];

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="max-w-[1600px] mx-auto">
        
        {/* HEADER & FILTERS (TOP RIGHT) */}
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

        <div className="space-y-6 relative z-10">
            
            {/* ORIGINAL ROW 1: BIG KPI CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative group overflow-hidden bg-gradient-to-br from-cyan-600 to-blue-700 p-8 rounded-3xl shadow-2xl shadow-cyan-900/20">
                    <p className="text-xs font-black text-white/60 uppercase mb-1 tracking-widest">Net Cash Collected</p>
                    <h2 className="text-5xl font-black text-white tracking-tighter tabular-nums">${totalCash.toLocaleString(undefined, { minimumFractionDigits: 0 })}</h2>
                </div>
                <div className="bg-zinc-900/40 border border-zinc-800/50 p-8 rounded-3xl">
                    <p className="text-[10px] font-black text-zinc-500 uppercase mb-1 tracking-widest">Total Revenue</p>
                    <h3 className="text-5xl font-black text-white tracking-tighter italic tabular-nums">${totalRev.toLocaleString(undefined, { minimumFractionDigits: 0 })}</h3>
                </div>
            </div>

            {/* ORIGINAL ROW 2: METRICS STRIP */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatBox label="Show Rate" value={`${showRate.toFixed(1)}%`} icon={<Users size={16}/>}/>
                <StatBox label="Close Rate" value={`${closeRate.toFixed(1)}%`} icon={<CheckCircle2 size={16}/>}/>
                <StatBox label="Appointments" value={callsDue} icon={<Phone size={16}/>}/>
                <StatBox label="Acquisitions" value={callsClosed} icon={<CheckCircle2 size={16} className="text-cyan-500"/>} highlight/>
            </div>

            {/* ORIGINAL ROW 3 (SPLIT): GRAPH + SIDEBAR ANALYTICS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT: TALL CASH VELOCITY GRAPH (Original Style) */}
                <div className="lg:col-span-2 bg-[#0c0c0c] border border-zinc-800/50 rounded-3xl p-8 shadow-inner relative overflow-hidden h-[400px]">
                    <div className="flex items-center justify-between mb-10 relative z-10">
                        <h3 className="text-xs font-black uppercase text-zinc-400 tracking-widest">Cash Velocity</h3>
                        <span className="text-[10px] font-bold text-zinc-600 italic">Historical Settlement</span>
                    </div>
                    <div className="flex h-[280px] w-full relative pt-4 px-2">
                         <div className="absolute inset-x-0 top-4 bottom-0 flex flex-col justify-between pointer-events-none border-l border-zinc-800/50">
                            {[1, 0.75, 0.5, 0.25, 0].map((step) => (
                                <div key={step} className="flex items-center w-full relative"><span className="absolute -left-10 text-[9px] font-bold text-zinc-700 w-8 text-right">${((maxCash * step) / 1000).toFixed(0)}k</span><div className="w-full border-t border-zinc-800/30" /></div>
                            ))}
                        </div>
                        <div className="flex flex-1 items-end justify-around gap-1 relative z-10 border-b border-zinc-800/50 h-full pl-4">
                            {trend.map(([date, cash], i) => {
                                const height = (cash / maxCash) * 100;
                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                                         <div className="relative w-full h-full flex items-end">
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white text-black text-[9px] font-black px-2 py-1 rounded shadow-xl whitespace-nowrap z-30 pointer-events-none">${cash.toLocaleString()}</div>
                                            <div className={`w-full rounded-t-sm transition-all ${cash > 0 ? 'bg-gradient-to-t from-cyan-600 to-cyan-400 group-hover:from-cyan-400' : 'bg-zinc-800/30'}`} style={{ height: `${cash > 0 ? height : 1}%` }} />
                                        </div>
                                        <span className="absolute -bottom-6 text-[8px] font-black text-zinc-600 uppercase group-hover:text-cyan-400 truncate w-full text-center">{date.split(',')[0]}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* RIGHT: ANALYTICS & BREAKDOWN BLOCK (Combined) */}
                <div className="bg-[#0c0c0c] border border-zinc-800/50 rounded-3xl p-8 flex flex-col h-[400px]">
                    <h3 className="text-xs font-black uppercase text-zinc-400 tracking-widest mb-6 text-center">Analytics & Breakdown</h3>
                    
                    {/* Revenue Split Highlights */}
                    <div className="grid grid-cols-2 gap-3 mb-6 pb-6 border-b border-zinc-800/50">
                         <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 text-center">
                            <p className="text-[9px] font-bold uppercase text-emerald-300 mb-1">New Cash</p>
                            <p className="text-lg font-black text-white">${newCash.toLocaleString()}</p>
                        </div>
                         <div className="bg-cyan-500/10 p-3 rounded-xl border border-cyan-500/20 text-center">
                            <p className="text-[9px] font-bold uppercase text-cyan-300 mb-1">MRR Added</p>
                            <p className="text-lg font-black text-white">${mrrCash.toLocaleString()}</p>
                        </div>
                    </div>

                    {/* Efficiency Metrics List */}
                    <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-2">
                        <EfficiencyRow label="Total Applications" value={totalApplications.toString()} icon={<FileText size={14}/>} />
                        <EfficiencyRow label="Avg Cash / App" value={`$${avgCashApplication.toFixed(0)}`} />
                        <EfficiencyRow label="Avg Cash / Call" value={`$${avgCashAppt.toFixed(0)}`} />
                        <EfficiencyRow label="Avg Cash / Close" value={`$${avgCashClose.toFixed(0)}`} highlight />
                    </div>
                </div>
            </div>

            {/* ROW 4 (NEW BOTTOM SECTION): FULL WIDTH RECENT CALL LOG */}
            <div className="bg-[#0c0c0c] border border-zinc-800/50 rounded-3xl overflow-hidden">
                <div className="p-6 border-b border-zinc-800/50 bg-zinc-900/20 flex justify-between items-center">
                    <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Recent Call Log</h3>
                    <span className="text-[10px] font-bold text-zinc-600 italic">Last {recentCalls.length} calls</span>
                </div>
                <div className="p-6 overflow-x-auto">
                     <div className="min-w-[800px] space-y-2">
                        {/* Header */}
                        <div className="grid grid-cols-5 text-[9px] font-black uppercase text-zinc-500 tracking-widest px-4 mb-2">
                            <div>Prospect</div>
                            <div>Outcome</div>
                            <div>Closer</div>
                            <div>Date</div>
                            <div className="text-right">Cash collected</div>
                        </div>
                        {/* Rows */}
                        {recentCalls.map((call, i) => (
                            <div key={i} className="grid grid-cols-5 items-center p-3 bg-zinc-900/30 rounded-xl border border-zinc-800/30 hover:border-zinc-700 transition-all group">
                                <div className="text-[11px] font-bold text-white truncate pr-4">{call.prospect}</div>
                                <div><span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md border ${getOutcomeStyle(call.outcome)}`}>{call.outcome}</span></div>
                                <div className="text-[10px] font-medium text-zinc-400">{call.closer}</div>
                                <div className="text-[10px] font-mono text-zinc-500">{new Date(call.date).toLocaleDateString()}</div>
                                <div className={`text-right text-[11px] font-black tabular-nums ${call.cash > 0 ? 'text-cyan-400' : 'text-zinc-600'}`}>${call.cash.toLocaleString()}</div>
                            </div>
                        ))}
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
        <div className={`bg-zinc-900/40 border ${highlight ? 'border-cyan-500/30 bg-cyan-900/10' : 'border-zinc-800/50'} p-5 rounded-2xl transition-all group hover:border-cyan-500/20 flex flex-col justify-between gap-3`}>
            <div className="flex items-center justify-between">
                 <p className={`text-[10px] font-black uppercase tracking-widest ${highlight ? 'text-cyan-300' : 'text-zinc-500'}`}>{label}</p>
                 {icon && <div className={`${highlight ? 'text-cyan-400' : 'text-zinc-600'} opacity-70`}>{icon}</div>}
            </div>
            <h3 className={`text-2xl font-black tracking-tighter tabular-nums ${highlight ? 'text-white' : 'text-zinc-100'}`}>{value.toLocaleString()}</h3>
        </div>
    );
}

function EfficiencyRow({ label, value, icon, highlight = false }: { label: string, value: string, icon?: React.ReactNode, highlight?: boolean }) {
    return (
        <div className={`flex items-center justify-between p-3 rounded-xl border transition-all ${highlight ? 'bg-cyan-900/10 border-cyan-500/20' : 'bg-zinc-900/30 border-zinc-800/30 hover:border-cyan-500/10'}`}>
            <div className="flex items-center gap-2">
                {icon && <div className="text-zinc-600">{icon}</div>}
                <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">{label}</span>
            </div>
            <span className={`text-sm font-black tabular-nums ${highlight ? 'text-cyan-400' : 'text-white'}`}>{value}</span>
        </div>
    );
}

function getOutcomeStyle(outcome: string) {
    const lower = outcome.toLowerCase();
    if (lower.includes('closed') || lower.includes('paid') || lower.includes('full')) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (lower.includes('deposit') || lower.includes('mrr')) return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
    if (lower.includes('no show') || lower.includes('cancelled')) return 'bg-red-500/10 text-red-400 border-red-500/20';
    return 'bg-zinc-800 text-zinc-400 border-zinc-700';
}

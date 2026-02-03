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
  } catch (error) { console.error(error); return []; }
}

export default async function ValhallaDashboard({ searchParams }: { searchParams: Promise<any> }) {
  const params = await searchParams;
  const allRawData = await getSheetData();

  const start = params.start ? new Date(params.start) : null;
  const end = params.end ? new Date(params.end) : null;
  if (end) end.setHours(23, 59, 59, 999);

  // Filter Logic
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

  const accountingData = allRawData.filter(d => {
    if (!d.timestamp) return false;
    const tDate = new Date(d.timestamp);
    if (start && tDate < start) return false;
    if (end && tDate > end) return false;
    return true;
  });

  // KPI Calculations
  const totalCash = accountingData.reduce((acc, curr) => acc + curr.cash, 0);
  const appointments = performanceData.filter(d => {
    const out = d.outcome.toLowerCase();
    const prospect = d.prospect.toLowerCase();
    return !out.includes('mrr') && !out.includes('downsell') && !prospect.includes('test');
  });

  const totalRev = appointments.reduce((acc, curr) => acc + curr.revenue, 0);
  const callsTaken = appointments.filter(d => !['no show', 'rescheduled', 'cancelled'].some(x => d.outcome.toLowerCase().includes(x))).length;
  const callsClosed = appointments.filter(d => ['closed', 'deposit collected', 'paid', 'full pay'].some(x => d.outcome.toLowerCase().includes(x))).length;
  
  const showRate = appointments.length > 0 ? (callsTaken / appointments.length) * 100 : 0;
  const closeRate = callsTaken > 0 ? (callsClosed / callsTaken) * 100 : 0;

  // Chart Data
  const dailyMap: Record<string, number> = {};
  accountingData.forEach(d => {
    const day = new Date(d.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    dailyMap[day] = (dailyMap[day] || 0) + d.cash;
  });
  const trend = Object.entries(dailyMap).sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());
  const maxCash = Math.max(...trend.map(([_, c]) => c), 1);

  const platforms = Array.from(new Set(allRawData.map(d => d.platform))).filter(Boolean) as string[];
  const closers = Array.from(new Set(allRawData.map(d => d.closer))).filter(Boolean) as string[];
  const setters = Array.from(new Set(allRawData.map(d => d.setter))).filter(Boolean) as string[];

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans selection:bg-green-500/30">
      <div className="max-w-[1600px] mx-auto p-6 md:p-10">
        
        {/* TOP BAR */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Global Command</span>
                    <div className="w-1 h-1 rounded-full bg-zinc-700" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-green-400">Sales Performance</span>
                </div>
                <h1 className="text-4xl font-black tracking-tighter text-white italic uppercase">Valhalla <span className="text-green-500">OS</span></h1>
            </div>
            <div className="flex items-center gap-4">
                <div className="px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-black text-green-500 uppercase tracking-tighter">Terminal Live</span>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT SIDEBAR: FILTERS & PRIMARY KPI */}
            <div className="lg:col-span-3 space-y-6">
                <div className="bg-zinc-900/40 border border-zinc-800/50 backdrop-blur-md p-6 rounded-3xl">
                    <p className="text-[10px] font-black text-zinc-500 uppercase mb-6 tracking-widest">Revenue Filter</p>
                    <Filters platforms={platforms} closers={closers} setters={setters} />
                </div>

                <div className="relative group overflow-hidden bg-gradient-to-br from-green-600 to-emerald-800 p-8 rounded-3xl shadow-2xl shadow-green-900/20">
                    <p className="text-xs font-black text-white/60 uppercase mb-1 tracking-widest">Net Cash Collected</p>
                    <h2 className="text-5xl font-black text-white tracking-tighter tabular-nums">
                        ${totalCash.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                    </h2>
                    <div className="mt-4 flex items-center gap-2">
                        <span className="text-[10px] font-bold text-white/80 uppercase">Portfolio Liquidity</span>
                    </div>
                </div>

                <div className="bg-zinc-900/40 border border-zinc-800/50 p-6 rounded-3xl">
                    <p className="text-[10px] font-black text-zinc-500 uppercase mb-1 tracking-widest">Total Revenue</p>
                    <h3 className="text-3xl font-black text-white tracking-tighter italic">
                        ${totalRev.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                    </h3>
                </div>
            </div>

            {/* RIGHT MAIN CONTENT */}
            <div className="lg:col-span-9 space-y-6">
                
                {/* METRICS ROW */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatBox label="Show Rate" value={`${showRate.toFixed(1)}%`} color="text-white" />
                    <StatBox label="Close Rate" value={`${closeRate.toFixed(1)}%`} color="text-white" />
                    <StatBox label="Appointments" value={appointments.length} color="text-white" />
                    <StatBox label="Acquisitions" value={callsClosed} color="text-green-500" />
                </div>

                {/* CASH FLOW VELOCITY (LINE CHART STYLE) */}
                <div className="bg-[#0c0c0c] border border-zinc-800/50 rounded-3xl p-8 shadow-inner">
                    <div className="flex items-center justify-between mb-10">
                        <h3 className="text-xs font-black uppercase text-zinc-400 tracking-widest">Cash Velocity</h3>
                        <span className="text-[10px] font-bold text-zinc-600 italic">Historical Settlement</span>
                    </div>
                    <div className="h-[280px] w-full relative border-l border-b border-zinc-800/30">
                        <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#10b981" />
                                    <stop offset="100%" stopColor="#34d399" />
                                </linearGradient>
                            </defs>
                            <polyline
                                fill="none"
                                stroke="url(#lineGrad)"
                                strokeWidth="4"
                                strokeLinecap="round"
                                points={trend.map(([_, cash], i) => {
                                    const x = (i / (trend.length - 1)) * 1000;
                                    const y = 280 - (cash / maxCash) * 220;
                                    return `${x},${y}`;
                                }).join(' ')}
                                viewBox="0 0 1000 280"
                                style={{ vectorEffect: 'non-scaling-stroke' }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex">
                            {trend.map(([date, cash], i) => (
                                <div key={i} className="flex-1 flex flex-col justify-end group items-center relative h-full">
                                    <div className="absolute inset-0 group-hover:bg-green-500/5 transition-colors" />
                                    <div 
                                        className="w-3 h-3 bg-white rounded-full z-10 border-4 border-green-500 shadow-[0_0_15px_rgba(16,185,129,0.8)] transition-all group-hover:scale-125" 
                                        style={{ marginBottom: `${(cash / maxCash) * 220 - 6}px` }} 
                                    />
                                    <div className="absolute opacity-0 group-hover:opacity-100 bottom-full mb-10 bg-white text-black text-[9px] font-black px-2 py-1 rounded whitespace-nowrap z-20">
                                        ${(cash/1000).toFixed(1)}K
                                    </div>
                                    <span className="absolute -bottom-8 text-[9px] font-black text-zinc-600 uppercase transition-colors group-hover:text-green-400">{date}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* BOTTOM PERFORMANCE GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-[#0c0c0c] border border-zinc-800/50 rounded-3xl p-8">
                        <h3 className="text-xs font-black uppercase text-zinc-400 tracking-widest mb-6">Efficiency Analytics</h3>
                        <div className="space-y-4">
                            <EfficiencyRow label="Avg. Cash / Call" value={((totalCash / (callsTaken || 1))).toFixed(0)} />
                            <EfficiencyRow label="Avg. Cash / Close" value={((totalCash / (callsClosed || 1))).toFixed(0)} />
                        </div>
                    </div>

                    <div className="bg-[#0c0c0c] border border-zinc-800/50 rounded-3xl p-8">
                        <h3 className="text-xs font-black uppercase text-zinc-400 tracking-widest mb-6">Recent Acquisitions</h3>
                        <div className="space-y-3">
                            {appointments.slice(0, 3).map((lead, i) => (
                                <div key={i} className="flex justify-between items-center border-b border-zinc-800 pb-2">
                                    <div>
                                        <p className="text-xs font-black uppercase text-white tracking-tight">{lead.prospect}</p>
                                        <p className="text-[10px] text-zinc-500 font-bold uppercase">{lead.outcome}</p>
                                    </div>
                                    <p className="text-sm font-black text-green-500 italic">${lead.cash.toLocaleString()}</p>
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

function StatBox({ label, value, color }: { label: string, value: any, color: string }) {
    return (
        <div className="bg-zinc-900/40 border border-zinc-800/50 p-6 rounded-3xl hover:border-green-500/30 transition-all group">
            <p className="text-[10px] font-black text-zinc-500 uppercase mb-2 tracking-widest group-hover:text-zinc-300">{label}</p>
            <h3 className={`text-3xl font-black ${color} tracking-tighter tabular-nums`}>{value}</h3>
        </div>
    );
}

function EfficiencyRow({ label, value }: { label: string, value: string }) {
    return (
        <div className="flex items-center justify-between p-4 bg-zinc-900/60 rounded-2xl border border-zinc-800/30">
            <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">{label}</span>
            <span className="text-lg font-black text-green-500 italic">${value}</span>
        </div>
    );
}

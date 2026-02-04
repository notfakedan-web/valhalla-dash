// 1. FORCE DYNAMIC REFRESH
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import React from 'react';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import Filters from '../Filters'; // Assuming Filters is in the parent directory or adjust path
import { Users, Filter, TrendingUp, Search, Calendar, Globe, DollarSign } from 'lucide-react';

// --- HELPER: FETCH LEADS DATA ---
async function getLeadsData() {
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

    return rows.map(row => {
      const getVal = (search: string) => {
          const foundKey = sheet.headerValues.find(h => h.toLowerCase().trim().includes(search.toLowerCase().trim()));
          return foundKey ? row.get(foundKey) : '';
      };
      
      return {
        firstName: getVal('First Name') || 'Unknown',
        lastName: getVal('Last Name') || '',
        email: getVal('Email') || 'N/A',
        source: getVal('utm_source') || 'Organic',
        funds: getVal('funds') || 'Unknown', // "Cash on Hand" data
        date: getVal('Submitted At') || getVal('Date') || '',
      };
    });
  } catch (error) { return []; }
}

export default async function LeadsPage({ searchParams }: { searchParams: Promise<any> }) {
  const params = await searchParams;
  const allLeads = await getLeadsData();

  const today = new Date();
  const start = params.start ? new Date(params.start) : null;
  const end = params.end ? new Date(params.end) : null;
  if (end) end.setHours(23, 59, 59, 999);

  // 1. FILTER DATA
  const filteredLeads = allLeads.filter(l => {
    if (!l.date) return false;
    let d = new Date(l.date);
    if (isNaN(d.getTime()) && l.date.includes('/')) {
        const p = l.date.split(' ')[0].split('/');
        if (p.length === 3) d = new Date(parseInt(p[2]), parseInt(p[0])-1, parseInt(p[1]));
    }
    
    if (start && d < start) return false;
    if (end && d > end) return false;
    return true;
  });

  const totalLeads = filteredLeads.length;
  // Logic: "Qualified" if funds are NOT "$0-$500" or empty
  const qualifiedLeads = filteredLeads.filter(l => l.funds && !['$0-$500', '0-500', 'Unknown'].some(x => l.funds.includes(x))).length;
  const qualificationRate = totalLeads > 0 ? (qualifiedLeads / totalLeads) * 100 : 0;

  const recentLeads = filteredLeads.slice(0, 20);

  // 2. CASH ON HAND BREAKDOWN
  const fundMap = new Map<string, number>();
  filteredLeads.forEach(l => {
      const f = l.funds || 'Unknown';
      fundMap.set(f, (fundMap.get(f) || 0) + 1);
  });
  // Sort by count descending
  const fundBreakdown = Array.from(fundMap.entries()).sort((a, b) => b[1] - a[1]);

  // 3. GRAPH DATA
  let graphStart = start; let graphEnd = end;
  if (!graphStart && filteredLeads.length > 0) { 
      const times = filteredLeads.map(d => new Date(d.date).getTime()).filter(t => !isNaN(t)); 
      if(times.length) graphStart = new Date(Math.min(...times)); 
  }
  if (!graphEnd && filteredLeads.length > 0) { 
      const times = filteredLeads.map(d => new Date(d.date).getTime()).filter(t => !isNaN(t)); 
      if(times.length) graphEnd = new Date(Math.max(...times)); 
  }
  if (!graphStart) graphStart = new Date(today.getFullYear(), today.getMonth(), 1);
  if (!graphEnd) graphEnd = today;

  const dayMap = new Map<string, number>();
  for (let d = new Date(graphStart); d <= graphEnd; d.setDate(d.getDate() + 1)) {
      dayMap.set(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), 0);
  }
  filteredLeads.forEach(l => {
    const d = new Date(l.date);
    if (!isNaN(d.getTime())) {
        const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (dayMap.has(label)) dayMap.set(label, (dayMap.get(label) || 0) + 1);
    }
  });
  
  const trend = Array.from(dayMap.entries());
  const maxLeads = Math.max(...trend.map(([_, c]) => c), 5);

  // 4. CHART CONSTANTS
  const CHART_HEIGHT = 220;
  const CHART_WIDTH = 1000;
  const BAR_MAX_HEIGHT = 180;

  const linePoints: string[] = [];
  trend.forEach(([_, count], i) => {
      const x = (i / (trend.length - 1 || 1)) * CHART_WIDTH + (CHART_WIDTH / trend.length / 2);
      const y = CHART_HEIGHT - ((count / maxLeads) * BAR_MAX_HEIGHT);
      linePoints.push(`${x},${y}`);
  });

  return (
    <div className="min-h-screen p-6 md:p-10 bg-[#09090b] text-zinc-100 font-sans">
      <div className="max-w-[1600px] mx-auto">
        
        {/* HEADER & FILTERS */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 mb-8 relative z-[100]">
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <Search size={16} className="text-blue-500" />
                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Pipeline Intelligence</span>
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-white">Lead Flow <span className="text-blue-500">Vault</span></h1>
            </div>
            
            <div className="bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md p-2 pl-4 rounded-lg flex flex-wrap items-center gap-4 shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mr-2">Filter Data:</span>
                
                {/* 2. CALENDAR RESTORED (Visual Button) */}
                <button className="flex items-center gap-2 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 px-3 py-1.5 rounded text-xs font-medium text-zinc-300 transition-colors">
                    <Calendar size={14} />
                    {start ? `${start.toLocaleDateString()} - ${end?.toLocaleDateString()}` : 'Select Date Range'}
                </button>

                <div className="h-4 w-px bg-zinc-700 mx-2" />
                
                {/* Existing Filters */}
                <Filters platforms={['YouTube', 'Instagram', 'Ads']} closers={[]} setters={[]} />
            </div>
        </div>

        <div className="space-y-6 relative z-10">
            
            {/* ROW 1: TOP METRICS (MATCHING STYLE: Dark Glass + Colored Border) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* 1. Total Leads (Blue/Cyan Theme) */}
                <HeroCard 
                    label="Total Leads" 
                    value={totalLeads.toLocaleString()} 
                    icon={<Users size={18} className="text-blue-400" />}
                    accentColor="blue"
                />

                 {/* 2. Qualified Leads (Indigo Theme) */}
                <HeroCard 
                    label="Qualified (High Ticket)" 
                    value={qualifiedLeads.toLocaleString()} 
                    icon={<Filter size={18} className="text-indigo-400" />}
                    accentColor="indigo"
                />

                 {/* 3. Qualification Rate (Emerald Theme) */}
                 <HeroCard 
                    label="Qualification Rate" 
                    value={`${qualificationRate.toFixed(1)}%`} 
                    icon={<TrendingUp size={18} className="text-emerald-400" />}
                    accentColor="emerald"
                />
            </div>

            {/* ROW 2: SPLIT LAYOUT (Graph + Cash on Hand) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* LEFT: LEAD VOLUME GRAPH (2/3 Width) */}
                <div className="lg:col-span-2 bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm relative overflow-hidden h-[340px]">
                    <div className="flex items-center justify-between mb-8 relative z-20">
                        <h3 className="text-xs font-bold uppercase text-zinc-400 tracking-widest">Lead Volume Trend</h3>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            <span className="text-[10px] font-medium text-zinc-500">Daily Inbound</span>
                        </div>
                    </div>

                    <div className="h-[220px] w-full relative">
                        {/* SVG Layer */}
                        <div className="absolute inset-0 z-0">
                            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6">
                                {[1, 0.5, 0].map(step => (
                                    <div key={step} className="w-full border-t border-zinc-800/30 relative leading-none">
                                        <span className="absolute -left-8 -top-2 text-[10px] font-medium text-zinc-600 w-6 text-right">
                                            {((maxLeads * step)).toFixed(0)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <svg className="w-full h-full overflow-visible pl-2 pb-6" preserveAspectRatio="none" viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}>
                                <defs>
                                    <linearGradient id="leadBarGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6"/><stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1"/></linearGradient>
                                    <linearGradient id="leadLineGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#60a5fa" /><stop offset="100%" stopColor="#818cf8" /></linearGradient>
                                </defs>
                                {trend.map(([_, count], i) => {
                                    const barHeight = (count / maxLeads) * BAR_MAX_HEIGHT;
                                    const width = (CHART_WIDTH / trend.length) * 0.8;
                                    const x = (i * (CHART_WIDTH / trend.length)) + ((CHART_WIDTH / trend.length) - width) / 2;
                                    const y = CHART_HEIGHT - barHeight;
                                    return count > 0 && <rect key={i} x={x} y={y} width={width} height={barHeight} fill="url(#leadBarGrad)" rx="2" className="opacity-40" />;
                                })}
                                <polyline fill="none" stroke="url(#leadLineGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={linePoints.join(' ')} className="opacity-90" />
                            </svg>
                        </div>

                        {/* HTML Overlay Layer */}
                        <div className="absolute inset-0 z-10 pl-2 pb-6 flex items-end justify-between">
                            {trend.map(([date, count], i) => (
                                <div key={i} className="flex-1 h-full flex flex-col justify-end items-center group relative cursor-crosshair hover:bg-white/5 transition-colors rounded-lg">
                                    <div 
                                        className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200 bottom-0 mb-2 pointer-events-none transform translate-y-[-10px] group-hover:translate-y-0"
                                        style={{ bottom: `${(count / maxLeads) * 80}%`, marginBottom: '15px' }}
                                    >
                                        <div className="bg-[#18181b] border border-zinc-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap flex flex-col items-center">
                                            <span>{count} Leads</span>
                                            <div className="absolute -bottom-1 w-2 h-2 bg-[#18181b] border-b border-r border-zinc-700 transform rotate-45"></div>
                                        </div>
                                    </div>
                                    <div className="absolute -bottom-6 text-[10px] font-medium text-zinc-600 uppercase group-hover:text-zinc-300 transition-colors">{date}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT: CASH ON HAND (Restored) */}
                <div className="bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm h-[340px] flex flex-col">
                    <h3 className="text-xs font-bold uppercase text-zinc-400 tracking-widest mb-6">Cash on Hand</h3>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-5 custom-scrollbar">
                        {fundBreakdown.map(([range, count], i) => {
                            const pct = (count / totalLeads) * 100;
                            return (
                                <div key={i} className="group">
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wide group-hover:text-white transition-colors">{range}</span>
                                        <span className="text-[10px] font-bold text-zinc-500 group-hover:text-blue-400 transition-colors">{count} LEADS</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-1000 ease-out" 
                                            style={{ width: `${pct}%` }} 
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* ROW 3: RECENT LEADS TABLE */}
            <div className="bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-sm rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-zinc-800/50 flex justify-between items-center bg-zinc-900/20">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Incoming Lead Log</h3>
                </div>
                <div className="p-4 overflow-x-auto">
                     <div className="min-w-[800px]">
                        <div className="grid grid-cols-5 text-[10px] font-medium uppercase text-zinc-500 tracking-wider px-4 mb-3">
                            <div className="col-span-2">Name</div>
                            <div>Source</div>
                            <div>Funds</div>
                            <div className="text-right">Submitted</div>
                        </div>
                        <div className="space-y-1">
                        {recentLeads.map((lead, i) => (
                            <div key={i} className="grid grid-cols-5 items-center p-3 bg-zinc-800/20 rounded-lg border border-transparent hover:border-zinc-700/50 transition-all group text-xs">
                                <div className="col-span-2 flex flex-col">
                                    <span className="font-bold text-zinc-200">{lead.firstName} {lead.lastName}</span>
                                    <span className="text-[10px] text-zinc-500 lowercase">{lead.email}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Globe size={12} className="text-zinc-600" />
                                    <span className="text-zinc-300 font-medium capitalize">{lead.source}</span>
                                </div>
                                <div>
                                    <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${getFundsStyle(lead.funds)}`}>
                                        {lead.funds || 'N/A'}
                                    </span>
                                </div>
                                <div className="text-right text-zinc-500 tabular-nums">
                                    {lead.date ? new Date(lead.date).toLocaleDateString() : 'N/A'}
                                </div>
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
// Matches the "Screenshot 2026-02-04 at 4.10.15 PM.png" style
function HeroCard({ label, value, icon, accentColor }: any) {
    const colorMap: any = {
        blue: 'from-blue-500/10 to-transparent border-blue-500/30 text-blue-400',
        indigo: 'from-indigo-500/10 to-transparent border-indigo-500/30 text-indigo-400',
        emerald: 'from-emerald-500/10 to-transparent border-emerald-500/30 text-emerald-400',
    };
    const style = colorMap[accentColor] || 'from-zinc-500/10 to-transparent border-zinc-500/30 text-zinc-400';
    const [gradient, border, text] = style.split(' '); // Rough extraction for simplicity, or just use the whole string in class

    return (
        <div className={`relative overflow-hidden bg-zinc-900/40 border ${style.split(' ')[2]} backdrop-blur-sm p-6 rounded-2xl shadow-sm flex flex-col justify-between h-36`}>
            {/* Top Gradient Tint */}
            <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${style.split(' ')[0]} to-transparent opacity-50`}></div>
            
             <div className="relative z-10 flex justify-between items-start mb-3">
                <p className={`text-[11px] font-bold uppercase tracking-wider ${style.split(' ')[4]}`}>{label}</p>
                {icon}
            </div>
            <h2 className="relative z-10 text-4xl font-bold text-white tracking-tight tabular-nums mt-auto">{value}</h2>
        </div>
    )
}

function getFundsStyle(funds: string) {
    if (!funds || funds === 'Unknown') return 'bg-zinc-800 text-zinc-500 border-zinc-700';
    if (funds.includes('$10k') || funds.includes('10K') || funds.includes('$5k')) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (funds.includes('$3k') || funds.includes('3K')) return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    return 'bg-zinc-800/50 text-zinc-400 border-zinc-700/50';
}

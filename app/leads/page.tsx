export const dynamic = 'force-dynamic';

import React from 'react';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import Filters from '../Filters'; 

async function getLeadsData() {
  try {
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheetId = process.env.LEAD_FLOW_SHEET_ID;
    if (!sheetId) throw new Error("LEAD_FLOW_SHEET_ID is missing");

    const doc = new GoogleSpreadsheet(sheetId, serviceAccountAuth);
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];
    await sheet.loadHeaderRow();
    const rows = await sheet.getRows();

    return rows.map(row => {
      const getVal = (search: string) => {
          const foundKey = sheet.headerValues.find(h => h.trim().toLowerCase().includes(search.toLowerCase()));
          return foundKey ? row.get(foundKey) : '';
      };
      
      const rawDate = getVal('submitted at') || getVal('date') || '';
      let parsedDate = new Date(rawDate);
      // Handle DD/MM/YYYY vs MM/DD/YYYY formats if standard parsing fails
      if (isNaN(parsedDate.getTime()) && rawDate.includes('/')) {
        const parts = rawDate.split(' ')[0].split('/');
        if (parts.length === 3) {
            parsedDate = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
        }
      }

      return {
        source: getVal('SOURCE') || 'Other',
        funnel: getVal('FUNNEL') || 'N/A',
        cashOnHand: getVal('willing to invest') || getVal('RIGHT NOW') || 'Unknown',
        date: rawDate,
        isoDate: !isNaN(parsedDate.getTime()) ? parsedDate : null,
        name: getVal('NAME') || 'N/A',
        email: getVal('EMAIL') || 'N/A',
      };
    });
  } catch (error) { console.error(error); return []; }
}

export default async function LeadsPage({ searchParams }: { searchParams: Promise<any> }) {
  const params = await searchParams;
  const allLeads = await getLeadsData();

  // DATE RANGE LOGIC
  const start = params.start ? new Date(params.start) : null;
  const end = params.end ? new Date(params.end) : null;
  if (end) end.setHours(23, 59, 59, 999);

  // 1. FILTER LOGIC
  const filtered = allLeads.filter(d => {
    if (start && d.isoDate && d.isoDate < start) return false;
    if (end && d.isoDate && d.isoDate > end) return false;
    if (params.platform && d.source !== params.platform) return false;
    return true;
  });

  // 2. SORT LOGIC (Newest First)
  filtered.sort((a, b) => {
      if (!a.isoDate) return 1;
      if (!b.isoDate) return -1;
      return b.isoDate.getTime() - a.isoDate.getTime();
  });

  // 3. CHART DATA PREP
  const dailyCounts: Record<string, number> = {};
  
  // Pre-fill dates for smooth graph
  if (start && end) {
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          dailyCounts[label] = 0;
      }
  }

  filtered.forEach(d => {
      const label = d.isoDate ? d.isoDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Unknown';
      if (label !== 'Unknown') {
        dailyCounts[label] = (dailyCounts[label] || 0) + 1;
      }
  });

  const timeTrend = Object.entries(dailyCounts).sort((a, b) => {
    return new Date(a[0]).getTime() - new Date(b[0]).getTime();
  });
  
  const maxDayLeads = Math.max(...timeTrend.map(t => t[1]), 5);

  const cashMap: Record<string, number> = {};
  filtered.forEach(d => {
      const bracket = d.cashOnHand || 'Unknown';
      cashMap[bracket] = (cashMap[bracket] || 0) + 1;
  });
  const cashBrackets = Object.entries(cashMap).sort((a, b) => b[1] - a[1]);

  // FIXED LOGIC: Case-insensitive check for High Ticket Brackets
  const qualifiedLeads = filtered.filter(l => {
      const val = l.cashOnHand.toLowerCase();
      // Matches "3k-5k", "5k-10k", "10k+"
      return val.includes('3k') || val.includes('5k') || val.includes('10k');
  }).length;

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans selection:bg-cyan-500/30">
      <div className="max-w-[1600px] mx-auto p-6 md:p-10">
        
        {/* HEADER & FILTERS */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 mb-12 relative z-[100]">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Analytics</span>
                    <div className="w-1 h-1 rounded-full bg-zinc-700" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-500">Leads Intelligence</span>
                </div>
                <h1 className="text-4xl font-black tracking-tighter text-white italic uppercase">Lead Flow <span className="text-cyan-500">Vault</span></h1>
            </div>
            
            {/* Filter Container - Sizing matched to Home */}
            <div className="bg-zinc-900/40 border border-zinc-800/50 backdrop-blur-md p-2 pl-6 rounded-2xl flex flex-wrap items-center gap-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mr-2">Filter Data:</span>
                <Filters 
                    platforms={Array.from(new Set(allLeads.map(d => d.source)))} 
                    closers={[]} 
                    setters={[]} 
                    resetPath="/leads" // Fixes the reset button behavior
                />
            </div>
        </div>

        {/* LAYOUT GRID */}
        <div className="space-y-6 relative z-10">
            
            {/* KPI ROW */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Total Leads Card */}
                <div className="relative group overflow-hidden bg-gradient-to-br from-cyan-600 to-blue-700 p-6 rounded-3xl shadow-2xl shadow-cyan-900/20">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <svg width="60" height="60" viewBox="0 0 24 24" fill="white"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
                    </div>
                    {/* UPDATED LABEL */}
                    <p className="text-[10px] font-black text-white/60 uppercase mb-1 tracking-widest">Total Leads</p>
                    <h2 className="text-4xl font-black text-white tracking-tighter tabular-nums">{filtered.length}</h2>
                    <div className="mt-3 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        <span className="text-[9px] font-bold text-white/80 uppercase">Inbound</span>
                    </div>
                </div>

                {/* Qualified Leads */}
                <div className="bg-zinc-900/40 border border-zinc-800/50 p-6 rounded-3xl hover:border-cyan-500/20 transition-all">
                    <p className="text-[10px] font-black text-zinc-500 uppercase mb-1 tracking-widest">Qualified (High Ticket)</p>
                    <h3 className="text-4xl font-black text-white tracking-tighter italic tabular-nums">{qualifiedLeads}</h3>
                </div>

                {/* Spacers for 4-col grid */}
                <div className="hidden lg:block lg:col-span-2"></div>
            </div>

            {/* CHART ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* LINE CHART */}
                <div className="lg:col-span-2 bg-[#0c0c0c] border border-zinc-800/50 rounded-3xl p-8 shadow-inner relative overflow-hidden">
                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <h3 className="text-xs font-black uppercase text-zinc-400 tracking-widest">Growth Velocity</h3>
                        <span className="text-[10px] font-bold text-zinc-600 italic">Daily Submission Volume</span>
                    </div>
                    
                    <div className="h-[250px] w-full relative pt-4 pl-4">
                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6">
                            {[1, 0.75, 0.5, 0.25, 0].map(step => (
                                <div key={step} className="w-full border-t border-zinc-800/30 relative">
                                    <span className="absolute -left-8 -top-2 text-[8px] font-bold text-zinc-700 w-6 text-right">
                                        {(maxDayLeads * step).toFixed(0)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {timeTrend.length > 0 ? (
                          <>
                            <div className="absolute inset-0 flex items-end justify-between px-2 pb-6 z-10">
                                {timeTrend.map(([date, count], i) => (
                                    <div key={i} className="flex-1 flex flex-col justify-end group items-center relative h-full">
                                        <div className="absolute inset-0 bg-cyan-500/0 group-hover:bg-cyan-500/5 transition-colors rounded-t-sm" />
                                        <div 
                                            className="w-full bg-cyan-500/20 group-hover:bg-cyan-500 transition-all rounded-t-sm relative min-w-[4px] max-w-[20px]" 
                                            style={{ height: `${(count / maxDayLeads) * 100}%` }} 
                                        />
                                        <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-800 text-white text-[9px] font-bold px-2 py-1 rounded shadow-lg z-20 whitespace-nowrap pointer-events-none">
                                            {date}: {count} Leads
                                        </div>
                                        <span className="absolute -bottom-6 text-[8px] font-bold text-zinc-600 uppercase hidden group-hover:block whitespace-nowrap">
                                            {date}
                                        </span>
                                    </div>
                                ))}
                            </div>
                          </>
                        ) : (
                            <div className="h-full flex items-center justify-center text-zinc-600 text-xs font-bold uppercase tracking-widest">
                                No data for selected range
                            </div>
                        )}
                        
                        <div className="absolute -left-6 bottom-1/2 transform -rotate-90 origin-left text-[8px] font-black uppercase tracking-widest text-zinc-700">Volume (Leads)</div>
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[8px] font-black uppercase tracking-widest text-zinc-700">Timeline (Date)</div>
                    </div>
                </div>

                {/* INVESTMENT PROFILES */}
                <div className="bg-[#0c0c0c] border border-zinc-800/50 rounded-3xl p-8">
                    <h3 className="text-xs font-black uppercase text-zinc-400 tracking-widest mb-6">Investment Profiles</h3>
                    <div className="space-y-4">
                        {cashBrackets.map(([bracket, count]) => (
                            <div key={bracket} className="group">
                                <div className="flex justify-between text-[10px] font-bold uppercase text-zinc-500 mb-1">
                                    <span className="truncate max-w-[150px]">{bracket}</span>
                                    <span className="text-white">{count} Leads</span>
                                </div>
                                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-cyan-500 group-hover:bg-cyan-400 transition-all" style={{ width: `${(count / filtered.length) * 100}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* DATA TABLE */}
            <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-[40px] overflow-hidden backdrop-blur-xl shadow-2xl">
                <div className="p-8 border-b border-zinc-800/50 flex justify-between items-center bg-zinc-900/40">
                    <h3 className="text-sm font-black uppercase tracking-widest text-white">Acquisition Log</h3>
                    <span className="text-[10px] font-bold text-zinc-500 italic">Showing {filtered.length} Records</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-zinc-900/60 text-zinc-500 text-[10px] font-black uppercase tracking-widest border-b border-zinc-800/50">
                            <tr>
                                <th className="px-8 py-5">Origin</th>
                                <th className="px-8 py-5">Investment Intent</th>
                                <th className="px-8 py-5">Timestamp</th>
                                <th className="px-8 py-5">Identity</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/30">
                            {filtered.slice(0, 50).map((lead, i) => (
                                <tr key={i} className="hover:bg-cyan-500/[0.03] transition-colors group">
                                    <td className="px-8 py-6">
                                        <span className="bg-zinc-800 px-3 py-1 rounded-full text-[10px] font-black text-zinc-400 group-hover:text-cyan-400 transition-colors uppercase">{lead.source}</span>
                                    </td>
                                    <td className="px-8 py-6 text-sm font-bold text-white max-w-[280px] truncate uppercase tracking-tighter">{lead.cashOnHand}</td>
                                    <td className="px-8 py-6 text-[11px] text-zinc-500 font-mono italic">
                                        {lead.isoDate ? lead.isoDate.toLocaleString() : lead.date}
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-white uppercase tracking-tight">{lead.name}</span>
                                            <span className="text-[10px] text-zinc-500 font-medium">{lead.email}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}

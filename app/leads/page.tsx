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

  const filtered = allLeads.filter(d => {
    if (params.start && d.isoDate && d.isoDate < new Date(params.start)) return false;
    if (params.end && d.isoDate && d.isoDate > new Date(params.end)) return false;
    if (params.platform && d.source !== params.platform) return false;
    return true;
  });

  const dailyCounts: Record<string, number> = {};
  filtered.forEach(d => {
      const label = d.isoDate ? d.isoDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Unknown';
      dailyCounts[label] = (dailyCounts[label] || 0) + 1;
  });

  const timeTrend = Object.entries(dailyCounts).sort((a, b) => {
    if (a[0] === 'Unknown') return 1;
    return new Date(a[0]).getTime() - new Date(b[0]).getTime();
  });
  
  const maxDayLeads = Math.max(...timeTrend.map(t => t[1]), 1);

  const cashMap: Record<string, number> = {};
  filtered.forEach(d => {
      const bracket = d.cashOnHand || 'Unknown';
      cashMap[bracket] = (cashMap[bracket] || 0) + 1;
  });
  const cashBrackets = Object.entries(cashMap).sort((a, b) => b[1] - a[1]);

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans selection:bg-cyan-500/30">
      <div className="max-w-[1600px] mx-auto p-6 md:p-10">
        
        {/* TOP BAR / BREADCRUMB */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Analytics</span>
                    <div className="w-1 h-1 rounded-full bg-zinc-700" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">Leads Intelligence</span>
                </div>
                <h1 className="text-4xl font-black tracking-tighter text-white italic uppercase">Lead Flow <span className="text-cyan-500">Vault</span></h1>
            </div>
            <div className="flex items-center gap-4">
                <a href="/" className="px-5 py-2.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all">Back to OS</a>
                <div className="px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full">
                    <span className="text-[10px] font-black text-cyan-500 uppercase tracking-tighter">Live Sync Active</span>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT COLUMN: FILTERS & TOTAL */}
            <div className="lg:col-span-3 space-y-6">
                <div className="bg-zinc-900/40 border border-zinc-800/50 backdrop-blur-md p-6 rounded-3xl">
                    <p className="text-[10px] font-black text-zinc-500 uppercase mb-6 tracking-widest">Global Filters</p>
                    <Filters platforms={Array.from(new Set(allLeads.map(d => d.source)))} closers={[]} setters={[]} />
                </div>

                <div className="relative group overflow-hidden bg-gradient-to-br from-cyan-600 to-blue-700 p-8 rounded-3xl shadow-2xl shadow-cyan-900/20">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <svg width="80" height="80" viewBox="0 0 24 24" fill="white"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
                    </div>
                    <p className="text-xs font-black text-white/60 uppercase mb-1 tracking-widest">Total Acquisitions</p>
                    <h2 className="text-6xl font-black text-white tracking-tighter">{filtered.length}</h2>
                    <div className="mt-4 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                        <span className="text-[10px] font-bold text-white/80 uppercase">Inbound Pipeline</span>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: CHARTS */}
            <div className="lg:col-span-9 space-y-6">
                {/* APPLICANTS TREND */}
                <div className="bg-[#0c0c0c] border border-zinc-800/50 rounded-3xl p-8 shadow-inner">
                    <div className="flex items-center justify-between mb-10">
                        <h3 className="text-xs font-black uppercase text-zinc-400 tracking-widest">Growth Velocity</h3>
                        <span className="text-[10px] font-bold text-zinc-600 italic">Daily Submission Volume</span>
                    </div>
                    <div className="h-[280px] w-full relative">
                        {timeTrend.length > 1 && (
                          <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
                              <defs>
                                  <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                                      <stop offset="0%" stopColor="#22d3ee" />
                                      <stop offset="100%" stopColor="#818cf8" />
                                  </linearGradient>
                              </defs>
                              <polyline
                                  fill="none"
                                  stroke="url(#lineGrad)"
                                  strokeWidth="4"
                                  strokeLinecap="round"
                                  points={timeTrend.map(([_, count], i) => {
                                      const svgX = (i / (timeTrend.length - 1)) * 1000;
                                      const svgY = 280 - (count / maxDayLeads) * 220;
                                      return `${svgX},${svgY}`;
                                  }).join(' ')}
                                  viewBox="0 0 1000 280"
                                  style={{ vectorEffect: 'non-scaling-stroke' }}
                              />
                          </svg>
                        )}
                        <div className="absolute inset-0 flex border-b border-zinc-800/50">
                            {timeTrend.map(([date, count], i) => (
                                <div key={i} className="flex-1 flex flex-col justify-end group items-center relative h-full">
                                    <div className="absolute inset-0 bg-cyan-500/0 group-hover:bg-cyan-500/5 transition-colors" />
                                    <div 
                                        className="w-3 h-3 bg-white rounded-full z-10 border-4 border-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.8)] transition-all group-hover:scale-125" 
                                        style={{ marginBottom: `${(count / maxDayLeads) * 220 - 6}px` }} 
                                    />
                                    <span className="absolute -bottom-8 text-[9px] font-black text-zinc-600 uppercase transition-colors group-hover:text-cyan-400">{date}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* CASH BRACKETS */}
                <div className="bg-[#0c0c0c] border border-zinc-800/50 rounded-3xl p-8">
                    <h3 className="text-xs font-black uppercase text-zinc-400 tracking-widest mb-10">Investment Profiles</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {cashBrackets.map(([bracket, count], i) => (
                            <div key={i} className="bg-zinc-900/50 border border-zinc-800/50 p-5 rounded-2xl hover:border-cyan-500/50 transition-all">
                                <p className="text-[10px] font-black text-zinc-500 uppercase mb-3 truncate" title={bracket}>{bracket}</p>
                                <div className="flex items-end gap-3">
                                    <span className="text-3xl font-black text-white">{count}</span>
                                    <span className="text-[10px] font-bold text-cyan-500 mb-1.5 uppercase">leads</span>
                                </div>
                                <div className="mt-3 w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
                                    <div className="h-full bg-cyan-500" style={{ width: `${(count / filtered.length) * 100}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {/* DATA TABLE - Glass UI */}
        <div className="mt-12 bg-zinc-900/20 border border-zinc-800/50 rounded-[40px] overflow-hidden backdrop-blur-xl shadow-2xl">
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
                                <td className="px-8 py-6 text-[11px] text-zinc-500 font-mono italic">{lead.date}</td>
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
  );
}

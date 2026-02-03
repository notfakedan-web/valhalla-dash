export const dynamic = 'force-dynamic';

import React from 'react';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import Filters from '../Filters'; 

// REUSE THE FILTERS COMPONENT but we might need to adjust what props it takes 
// For now, I'll pass empty lists for closer/setter if they aren't relevant to leads, 
// or you can populate them if your lead sheet has that data.

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
      const get = (s: string) => {
        const k = sheet.headerValues.find(h => h.toLowerCase().includes(s.toLowerCase()));
        return k ? row.get(k) : '';
      };
      return {
        timestamp: get('Timestamp') || '',
        name: `${get('First Name')} ${get('Last Name')}`,
        email: get('Email') || '',
        phone: get('Phone') || '',
        intent: get('Willing to invest') || 'N/A',
        source: get('utm_source') || 'Direct',
        content: get('utm_content') || '',
        platform: get('utm_source') || 'Other', // Mapping source to platform for the filter
      };
    });
  } catch (error) { return []; }
}

export default async function LeadsPage({ searchParams }: { searchParams: Promise<any> }) {
  const params = await searchParams;
  const allLeads = await getLeadsData();

  // SORT BY NEWEST FIRST
  allLeads.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // DATE RANGE LOGIC
  const start = params.start ? new Date(params.start) : null;
  const end = params.end ? new Date(params.end) : null;
  if (end) end.setHours(23, 59, 59, 999);

  const filteredLeads = allLeads.filter(l => {
     if (!l.timestamp) return false;
     const tDate = new Date(l.timestamp);
     if (start && tDate < start) return false;
     if (end && tDate > end) return false;
     if (params.platform && l.source !== params.platform) return false;
     return true;
  });

  // METRICS
  const totalLeads = filteredLeads.length;
  // Simple check for "High Ticket" intent
  const qualifiedLeads = filteredLeads.filter(l => l.intent.includes('10k') || l.intent.includes('5k')).length;

  // CHART DATA: Growth Velocity (Leads per day)
  const dayMap = new Map<string, number>();
  // Auto-fill range logic (simplified for leads)
  if (filteredLeads.length > 0) {
      const times = filteredLeads.map(d => new Date(d.timestamp).getTime());
      const min = new Date(Math.min(...times));
      const max = new Date(Math.max(...times));
      for (let d = new Date(min); d <= max; d.setDate(d.getDate() + 1)) {
          dayMap.set(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), 0);
      }
  }
  
  filteredLeads.forEach(l => {
      const day = new Date(l.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (dayMap.has(day)) dayMap.set(day, (dayMap.get(day) || 0) + 1);
      else dayMap.set(day, 1); // Fallback
  });
  
  // Sort chart by date
  const trend = Array.from(dayMap.entries()).sort((a,b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());
  const maxLeads = Math.max(...trend.map(t => t[1]), 5);

  // INVESTMENT PROFILES
  const intents: Record<string, number> = {};
  filteredLeads.forEach(l => {
      const i = l.intent || 'Unknown';
      intents[i] = (intents[i] || 0) + 1;
  });

  const platforms = Array.from(new Set(allLeads.map(l => l.source))).filter(Boolean);

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="max-w-[1600px] mx-auto">

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
            
            <div className="bg-zinc-900/40 border border-zinc-800/50 backdrop-blur-md p-2 pl-6 rounded-2xl flex flex-wrap items-center gap-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mr-2">Global Filters:</span>
                {/* Reusing existing filters, passing empty arrays for irrelevant fields */}
                <Filters platforms={platforms} closers={[]} setters={[]} />
            </div>
        </div>

        <div className="space-y-6 relative z-10">
            
            {/* TOP KPI ROW */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="relative group overflow-hidden bg-gradient-to-br from-cyan-600 to-blue-700 p-8 rounded-3xl shadow-2xl shadow-cyan-900/20">
                    <p className="text-xs font-black text-white/60 uppercase mb-1 tracking-widest">Total Acquisitions (Leads)</p>
                    <h2 className="text-5xl font-black text-white tracking-tighter tabular-nums">{totalLeads}</h2>
                    <div className="mt-2 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                        <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest">Inbound Pipeline</span>
                    </div>
                </div>
                <div className="bg-zinc-900/40 border border-zinc-800/50 p-8 rounded-3xl">
                    <p className="text-[10px] font-black text-zinc-500 uppercase mb-1 tracking-widest">Qualified (High Ticket)</p>
                    <h3 className="text-5xl font-black text-white tracking-tighter italic tabular-nums">{qualifiedLeads}</h3>
                </div>
            </div>

            {/* CHARTS ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* LINE CHART (2/3 width) */}
                <div className="lg:col-span-2 bg-[#0c0c0c] border border-zinc-800/50 rounded-3xl p-8 shadow-inner relative overflow-hidden">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xs font-black uppercase text-zinc-400 tracking-widest">Growth Velocity</h3>
                        <span className="text-[10px] font-bold text-zinc-600 italic">Daily Volume</span>
                    </div>
                    
                    {/* Simplified Line Chart Visualization using Bars for robustness */}
                    <div className="flex h-[200px] items-end gap-2">
                        {trend.map(([date, count], i) => (
                            <div key={i} className="flex-1 flex flex-col items-center group relative">
                                <div className="w-full bg-cyan-500/20 group-hover:bg-cyan-500 rounded-t-sm transition-all relative" style={{ height: `${(count/maxLeads)*100}%` }}>
                                     <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-white text-black text-[10px] font-bold px-2 py-1 rounded">
                                        {count}
                                     </div>
                                </div>
                                <span className="text-[8px] text-zinc-600 uppercase mt-2 hidden group-hover:block absolute bottom-[-20px] whitespace-nowrap">{date}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* INVESTMENT PROFILES (1/3 width) */}
                <div className="bg-[#0c0c0c] border border-zinc-800/50 rounded-3xl p-8">
                    <h3 className="text-xs font-black uppercase text-zinc-400 tracking-widest mb-6">Investment Profiles</h3>
                    <div className="space-y-4">
                        {Object.entries(intents).map(([intent, count]) => (
                            <div key={intent} className="group">
                                <div className="flex justify-between text-[10px] font-bold uppercase text-zinc-500 mb-1">
                                    <span>{intent}</span>
                                    <span className="text-white">{count} Leads</span>
                                </div>
                                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-cyan-500 group-hover:bg-cyan-400 transition-all" style={{ width: `${(count/totalLeads)*100}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* DATA TABLE (Bottom) */}
            <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-[40px] overflow-hidden">
                <div className="p-8 border-b border-zinc-800/50 bg-zinc-900/40 flex justify-between items-center">
                    <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Acquisition Log</h3>
                    <span className="text-[10px] font-bold text-zinc-600 italic">Showing {filteredLeads.length} Records</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-zinc-900/60 text-zinc-500 text-[10px] font-black uppercase tracking-widest border-b border-zinc-800/50">
                            <tr>
                                <th className="px-8 py-5">Timestamp</th>
                                <th className="px-8 py-5">Identity</th>
                                <th className="px-8 py-5">Investment Intent</th>
                                <th className="px-8 py-5">Origin</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/30">
                            {filteredLeads.map((lead, i) => (
                                <tr key={i} className="hover:bg-cyan-500/[0.02] transition-colors group">
                                    <td className="px-8 py-5 text-[10px] font-bold text-zinc-600 uppercase font-mono">{new Date(lead.timestamp).toLocaleString()}</td>
                                    <td className="px-8 py-5">
                                        <div className="text-sm font-black text-white uppercase tracking-tight">{lead.name}</div>
                                        <div className="text-[10px] text-zinc-500">{lead.email}</div>
                                    </td>
                                    <td className="px-8 py-5 text-sm font-black text-cyan-500 italic">{lead.intent}</td>
                                    <td className="px-8 py-5">
                                        <span className="bg-zinc-800 text-zinc-400 text-[9px] font-bold uppercase px-2 py-1 rounded">
                                            {lead.source}
                                        </span>
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

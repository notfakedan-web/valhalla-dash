export const dynamic = 'force-dynamic';

import React from 'react';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import Filters from '../Filters'; // Adjust path to point back to root app folder

async function getLeadsData() {
  try {
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    // NOTE: Using the NEW environment variable here
    const doc = new GoogleSpreadsheet(process.env.LEAD_FLOW_SHEET_ID!, serviceAccountAuth);
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];
    const rows = await sheet.getRows();

    return rows.map(row => {
      const getVal = (search: string) => {
          const foundKey = sheet.headerValues.find(h => h.toLowerCase().includes(search.toLowerCase()));
          return foundKey ? row.get(foundKey) : '';
      };
      
      return {
        source: getVal('SOURCE') || 'Other',
        funnel: getVal('FUNNEL') || 'N/A',
        cashOnHand: getVal('CASH ON HAND') || 'Unknown',
        date: getVal('DATE') || '',
        name: getVal('NAME') || 'N/A',
        phone: getVal('PHONE') || 'N/A',
        email: getVal('EMAIL') || 'N/A',
      };
    });
  } catch (error) { console.error(error); return []; }
}

export default async function LeadsPage({ searchParams }: { searchParams: Promise<any> }) {
  const params = await searchParams;
  const allLeads = await getLeadsData();

  // 1. DYNAMIC FILTER OPTIONS
  const sourcesList = Array.from(new Set(allLeads.map(d => d.source))).filter(Boolean) as string[];
  const funnelsList = Array.from(new Set(allLeads.map(d => d.funnel))).filter(Boolean) as string[];

  // 2. FILTERING
  const filtered = allLeads.filter(d => {
    if (params.start && new Date(d.date) < new Date(params.start)) return false;
    if (params.end && new Date(d.date) > new Date(params.end)) return false;
    if (params.platform && d.source !== params.platform) return false;
    return true;
  });

  // 3. APPLICANTS OVER TIME (Line Chart Logic)
  const dailyCounts: Record<string, number> = {};
  filtered.forEach(d => {
      const day = d.date ? new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A';
      dailyCounts[day] = (dailyCounts[day] || 0) + 1;
  });
  const timeTrend = Object.entries(dailyCounts).sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());
  const maxDayLeads = Math.max(...timeTrend.map(t => t[1]), 1);

  // 4. CASH ON HAND BREAKDOWN (Bar Chart Logic)
  const cashMap: Record<string, number> = {};
  filtered.forEach(d => {
      const bracket = d.cashOnHand || 'Unknown';
      cashMap[bracket] = (cashMap[bracket] || 0) + 1;
  });
  const cashBrackets = Object.entries(cashMap).sort((a, b) => b[1] - a[1]);

  return (
    <div className="min-h-screen bg-black text-white p-10 font-sans">
      <div className="max-w-[1600px] mx-auto">
        
        {/* Navigation / Switcher */}
        <div className="flex gap-4 mb-8">
            <a href="/" className="text-[10px] font-black uppercase text-zinc-500 hover:text-white transition-all">Main Dashboard</a>
            <span className="text-zinc-800">/</span>
            <span className="text-[10px] font-black uppercase text-cyan-400">Leads Data</span>
        </div>

        <h1 className="text-2xl font-black uppercase tracking-widest mb-10 text-center">Leads Data</h1>
        
        <Filters platforms={sourcesList} closers={[]} setters={[]} />

        {/* APPLICANTS OVER TIME (LINE CHART STYLE) */}
        <div className="bg-[#0d0d0d] border border-zinc-900 rounded-3xl p-10 mb-8">
            <h3 className="text-[10px] font-black uppercase text-zinc-600 tracking-widest mb-12 text-center">Applicants Over Time</h3>
            <div className="h-[300px] w-full flex items-end gap-1 relative border-l border-b border-zinc-800 pb-4">
                {timeTrend.map(([date, count], i) => (
                    <div key={i} className="flex-1 flex flex-col justify-end group items-center relative">
                        {/* The Point */}
                        <div 
                            className="w-2 h-2 bg-cyan-400 rounded-full z-10 shadow-[0_0_10px_rgba(34,211,238,0.5)] transition-all group-hover:scale-150" 
                            style={{ marginBottom: `${(count / maxDayLeads) * 250}px` }} 
                        />
                        {/* The Hover Tooltip */}
                        <div className="absolute opacity-0 group-hover:opacity-100 bottom-full mb-4 bg-white text-black text-[9px] font-black px-2 py-1 rounded pointer-events-none whitespace-nowrap">
                            {count} Applicants
                        </div>
                        <span className="absolute -bottom-6 text-[7px] font-black text-zinc-700 uppercase -rotate-45">{date}</span>
                    </div>
                ))}
            </div>
        </div>

        {/* TOTAL BOX */}
        <div className="bg-cyan-600 rounded-2xl p-8 mb-8 text-center shadow-2xl shadow-cyan-950/20">
            <p className="text-[9px] font-black text-white/50 uppercase mb-2 tracking-widest">Total Applicants</p>
            <h2 className="text-4xl font-black">{filtered.length}</h2>
        </div>

        {/* CASH ON HAND (BAR CHART) */}
        <div className="bg-[#0d0d0d] border border-zinc-900 rounded-3xl p-10 mb-8">
            <h3 className="text-[10px] font-black uppercase text-zinc-600 tracking-widest mb-12 text-center">Cash On Hand Breakdown</h3>
            <div className="h-[250px] flex items-end justify-around gap-4 px-10">
                {cashBrackets.map(([bracket, count], i) => (
                    <div key={i} className="flex-1 flex flex-col items-center group">
                        <div 
                            className="w-12 bg-cyan-500 rounded-t-sm transition-all group-hover:bg-cyan-400 shadow-xl shadow-cyan-500/10" 
                            style={{ height: `${(count / filtered.length) * 200}px` }} 
                        />
                        <span className="text-[9px] font-black text-zinc-500 mt-4 uppercase tracking-tighter">{bracket}</span>
                        <span className="text-[10px] font-bold text-white mt-1">{count}</span>
                    </div>
                ))}
            </div>
        </div>

        {/* LEADS LOG TABLE */}
        <div className="bg-[#0d0d0d] border border-zinc-900 rounded-3xl overflow-hidden">
            <div className="p-8 border-b border-zinc-800 bg-zinc-900/20">
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Raw Lead Log</p>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px]">
                    <thead className="text-zinc-600 font-black uppercase tracking-widest border-b border-zinc-800">
                        <tr>
                            <th className="p-6">Source</th>
                            <th className="p-6">Cash On Hand</th>
                            <th className="p-6">Date</th>
                            <th className="p-6">Name</th>
                            <th className="p-6">Email</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                        {filtered.slice(0, 50).map((lead, i) => (
                            <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                                <td className="p-6 font-bold text-zinc-400">{lead.source}</td>
                                <td className="p-6 text-cyan-400 font-black uppercase">{lead.cashOnHand}</td>
                                <td className="p-6 text-zinc-500 font-mono italic">{lead.date}</td>
                                <td className="p-6 font-bold text-white uppercase">{lead.name}</td>
                                <td className="p-6 text-zinc-500">{lead.email}</td>
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

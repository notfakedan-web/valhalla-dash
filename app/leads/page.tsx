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
    if (!sheetId) throw new Error("LEAD_FLOW_SHEET_ID is missing in environment variables");

    const doc = new GoogleSpreadsheet(sheetId, serviceAccountAuth);
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];
    
    // Explicitly load headers to ensure Row K is mapped
    await sheet.loadHeaderRow();
    const rows = await sheet.getRows();

    return rows.map(row => {
      const getVal = (search: string) => {
          // Flexible matching for that long scaling society question
          const foundKey = sheet.headerValues.find(h => h.toLowerCase().includes(search.toLowerCase()));
          return foundKey ? row.get(foundKey) : '';
      };
      
      return {
        source: getVal('SOURCE') || 'Other',
        funnel: getVal('FUNNEL') || 'N/A',
        // This targets the long scaling society question / Row K
        cashOnHand: getVal('what would you be willing to invest') || getVal('funds you have RIGHT NOW') || 'Unknown',
        date: getVal('DATE') || '',
        name: getVal('NAME') || 'N/A',
        phone: getVal('PHONE') || 'N/A',
        email: getVal('EMAIL') || 'N/A',
      };
    });
  } catch (error) { 
    console.error("Lead Flow Error:", error); 
    return []; 
  }
}

export default async function LeadsPage({ searchParams }: { searchParams: Promise<any> }) {
  const params = await searchParams;
  const allLeads = await getLeadsData();

  // 1. FILTER OPTIONS
  const sourcesList = Array.from(new Set(allLeads.map(d => d.source))).filter(Boolean) as string[];

  // 2. FILTERING LOGIC
  const filtered = allLeads.filter(d => {
    if (params.start && new Date(d.date) < new Date(params.start)) return false;
    if (params.end && new Date(d.date) > new Date(params.end)) return false;
    if (params.platform && d.source !== params.platform) return false;
    return true;
  });

  // 3. APPLICANTS OVER TIME (LINE CHART DATA)
  const dailyCounts: Record<string, number> = {};
  filtered.forEach(d => {
      const day = d.date ? new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A';
      dailyCounts[day] = (dailyCounts[day] || 0) + 1;
  });
  const timeTrend = Object.entries(dailyCounts).sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());
  const maxDayLeads = Math.max(...timeTrend.map(t => t[1]), 1);

  // 4. CASH ON HAND BREAKDOWN
  const cashMap: Record<string, number> = {};
  filtered.forEach(d => {
      const bracket = d.cashOnHand || 'Unknown';
      cashMap[bracket] = (cashMap[bracket] || 0) + 1;
  });
  const cashBrackets = Object.entries(cashMap).sort((a, b) => b[1] - a[1]);

  return (
    <div className="min-h-screen bg-black text-white p-10 font-sans">
      <div className="max-w-[1600px] mx-auto">
        
        {/* Navigation */}
        <div className="flex gap-4 mb-8">
            <a href="/" className="text-[10px] font-black uppercase text-zinc-500 hover:text-white transition-all">Main Dashboard</a>
            <span className="text-zinc-800">/</span>
            <span className="text-[10px] font-black uppercase text-cyan-400">Leads Data</span>
        </div>

        <h1 className="text-2xl font-black uppercase tracking-widest mb-10 text-center">Lead Flow Intelligence</h1>
        
        <Filters platforms={sourcesList} closers={[]} setters={[]} />

        {/* APPLICANTS OVER TIME (SVG LINE CHART) */}
        <div className="bg-[#0d0d0d] border border-zinc-900 rounded-3xl p-10 mb-8">
            <h3 className="text-[10px] font-black uppercase text-zinc-600 tracking-widest mb-12 text-center">Applicants Trend</h3>
            <div className="h-[300px] w-full relative border-l border-b border-zinc-800">
                {timeTrend.length > 1 && (
                  <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
                      <polyline
                          fill="none"
                          stroke="#22d3ee"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={timeTrend.map(([_, count], i) => {
                              const x = (i / (timeTrend.length - 1)) * 100 + "%";
                              const y = 300 - (count / maxDayLeads) * 250;
                              // Standardizing SVG coordinate space to 1000 units
                              const svgX = (i / (timeTrend.length - 1)) * 1000;
                              return `${svgX},${y}`;
                          }).join(' ')}
                          style={{ vectorEffect: 'non-scaling-stroke' }}
                      />
                  </svg>
                )}
                
                {/* Dots and Tooltips overlay */}
                <div className="absolute inset-0 flex">
                    {timeTrend.map(([date, count], i) => (
                        <div key={i} className="flex-1 flex flex-col justify-end group items-center relative">
                            <div 
                                className="w-2.5 h-2.5 bg-cyan-400 rounded-full z-10 border-2 border-black shadow-[0_0_8px_rgba(34,211,238,0.6)] transition-all group-hover:scale-150" 
                                style={{ marginBottom: `${(count / maxDayLeads) * 250 - 5}px` }} 
                            />
                            <div className="absolute opacity-0 group-hover:opacity-100 bottom-full mb-10 bg-white text-black text-[9px] font-black px-2 py-1 rounded pointer-events-none whitespace-nowrap z-20">
                                {date}: {count} Leads
                            </div>
                            <span className="absolute -bottom-8 text-[7px] font-black text-zinc-700 uppercase -rotate-45">{date}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* TOTAL SUMMARY */}
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 rounded-2xl p-8 mb-8 text-center shadow-2xl">
            <p className="text-[9px] font-black text-white/50 uppercase mb-2 tracking-widest">Total Filtered Leads</p>
            <h2 className="text-5xl font-black">{filtered.length}</h2>
        </div>

        {/* CASH ON HAND (BAR CHART) */}
        <div className="bg-[#0d0d0d] border border-zinc-900 rounded-3xl p-10 mb-8">
            <h3 className="text-[10px] font-black uppercase text-zinc-600 tracking-widest mb-12 text-center">Investment Capacity</h3>
            <div className="h-[250px] flex items-end justify-around gap-4 px-10">
                {cashBrackets.map(([bracket, count], i) => (
                    <div key={i} className="flex-1 flex flex-col items-center group">
                        <div 
                            className="w-full max-w-[60px] bg-cyan-500/20 border-t-2 border-cyan-400 transition-all group-hover:bg-cyan-500/40" 
                            style={{ height: `${(count / (filtered.length || 1)) * 200}px` }} 
                        />
                        <span className="text-[8px] font-black text-zinc-500 mt-4 uppercase text-center leading-tight h-8 overflow-hidden">
                          {bracket.length > 30 ? bracket.substring(0, 30) + '...' : bracket}
                        </span>
                        <span className="text-[10px] font-bold text-white mt-1">{count}</span>
                    </div>
                ))}
            </div>
        </div>

        {/* RAW LOG TABLE */}
        <div className="bg-[#0d0d0d] border border-zinc-900 rounded-3xl overflow-hidden">
            <div className="p-8 border-b border-zinc-800 bg-zinc-900/20 flex justify-between items-center">
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Recent Lead Activity</p>
                <p className="text-[9px] font-bold text-zinc-700">Displaying top 50 leads</p>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px]">
                    <thead className="text-zinc-600 font-black uppercase tracking-widest border-b border-zinc-800">
                        <tr>
                            <th className="p-6">Source</th>
                            <th className="p-6">Investment Intent</th>
                            <th className="p-6">Date</th>
                            <th className="p-6">Name</th>
                            <th className="p-6">Email</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                        {filtered.slice(0, 50).map((lead, i) => (
                            <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                                <td className="p-6 font-bold text-zinc-400">{lead.source}</td>
                                <td className="p-6 text-cyan-400 font-black uppercase max-w-[200px] truncate">{lead.cashOnHand}</td>
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

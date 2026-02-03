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
  } catch (error) { console.error(error); return []; }
}

export default async function ValhallaDashboard({ searchParams }: { searchParams: Promise<any> }) {
  const params = await searchParams;
  const allRawData = await getSheetData();
  const start = params.start ? new Date(params.start) : null;
  const end = params.end ? new Date(params.end) : null;
  if (end) end.setHours(23, 59, 59, 999);

  const performanceData = allRawData.filter(d => {
    if (!d.date) return false;
    const dDate = new Date(d.date);
    if (start && dDate < start) return false;
    if (end && dDate > end) return false;
    if (params.platform && d.platform !== params.platform) return false;
    return true;
  });

  const totalCash = allRawData.filter(d => {
    if (!d.timestamp) return false;
    const tDate = new Date(d.timestamp);
    return !(start && tDate < start) && !(end && tDate > end);
  }).reduce((acc, curr) => acc + curr.cash, 0);

  const appointments = performanceData.filter(d => !d.outcome.toLowerCase().includes('mrr') && !d.prospect.toLowerCase().includes('test'));
  const totalRev = appointments.reduce((acc, curr) => acc + curr.revenue, 0);
  const callsTaken = appointments.filter(d => !['no show', 'rescheduled', 'cancelled'].some(x => d.outcome.toLowerCase().includes(x))).length;
  const callsClosed = appointments.filter(d => ['closed', 'paid', 'full pay'].some(x => d.outcome.toLowerCase().includes(x))).length;
  
  const dailyMap: Record<string, number> = {};
  allRawData.forEach(d => {
    if (!d.timestamp) return;
    const day = new Date(d.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    dailyMap[day] = (dailyMap[day] || 0) + d.cash;
  });
  const trend = Object.entries(dailyMap).sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());
  const maxCash = Math.max(...trend.map(([_, c]) => c), 1);

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 p-6 md:p-10">
      <div className="max-w-[1600px] mx-auto">
        
        {/* HEADER & FILTERS - High Z-Index Container */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 relative z-[100]">
            <div>
                <h1 className="text-4xl font-black tracking-tighter text-white italic uppercase">Valhalla <span className="text-cyan-500">OS</span></h1>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mt-1">Terminal Live Intelligence</p>
            </div>
            <Filters platforms={Array.from(new Set(allRawData.map(d => d.platform)))} closers={[]} setters={[]} />
        </div>

        {/* TOP ROW: PRIMARY KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-cyan-600 to-blue-700 p-8 rounded-[32px] shadow-2xl">
                <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">Cash Collected</p>
                <h2 className="text-4xl font-black text-white tracking-tighter">${totalCash.toLocaleString()}</h2>
            </div>
            <div className="bg-zinc-900/40 border border-zinc-800/50 p-8 rounded-[32px]">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Total Revenue</p>
                <h2 className="text-4xl font-black text-white tracking-tighter">${totalRev.toLocaleString()}</h2>
            </div>
            <StatBox label="Show Rate" value={`${((callsTaken/(appointments.length||1))*100).toFixed(1)}%`} />
            <StatBox label="Close Rate" value={`${((callsClosed/(callsTaken||1))*100).toFixed(1)}%`} />
        </div>

        {/* MIDDLE ROW: CHART */}
        <div className="grid grid-cols-1 gap-6 mb-8">
            <div className="bg-[#0c0c0c] border border-zinc-800/50 rounded-[40px] p-10 shadow-inner relative overflow-hidden">
                <div className="flex items-center justify-between mb-12">
                    <h3 className="text-xs font-black uppercase text-zinc-400 tracking-widest">Settlement Velocity</h3>
                </div>
                <div className="flex h-[300px] w-full items-end justify-around gap-2 relative border-b border-zinc-800/50 px-4">
                    {trend.map(([date, cash], i) => (
                        <div key={i} className="flex-1 flex flex-col items-center group max-w-[50px] relative">
                            <div className="absolute -top-10 opacity-0 group-hover:opacity-100 bg-white text-black text-[10px] font-black px-2 py-1 rounded shadow-xl transition-all z-20">
                                ${cash.toLocaleString()}
                            </div>
                            <div className="w-full bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t-sm transition-all group-hover:from-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.1)]" 
                                 style={{ height: `${(cash/maxCash)*250}px` }} />
                            <span className="absolute -bottom-8 text-[9px] font-black text-zinc-600 uppercase">{date}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* BOTTOM ROW: ACQUISITIONS */}
        <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-[40px] overflow-hidden">
            <div className="p-8 border-b border-zinc-800/50 bg-zinc-900/40 flex justify-between items-center">
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Acquisition Log</h3>
                <span className="text-[10px] font-bold text-zinc-600 italic">Recent 50</span>
            </div>
            <table className="w-full text-left">
                <thead className="bg-zinc-900/60 text-zinc-500 text-[10px] font-black uppercase tracking-widest border-b border-zinc-800/50">
                    <tr><th className="px-8 py-5">Prospect</th><th className="px-8 py-5">Outcome</th><th className="px-8 py-5">Cash</th></tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/30">
                    {appointments.slice(0, 50).map((lead, i) => (
                        <tr key={i} className="hover:bg-cyan-500/[0.02] transition-colors group">
                            <td className="px-8 py-5 text-sm font-black text-white uppercase tracking-tight">{lead.prospect}</td>
                            <td className="px-8 py-5 text-[10px] font-bold text-zinc-500 uppercase">{lead.outcome}</td>
                            <td className="px-8 py-5 text-sm font-black text-cyan-500 italic">${lead.cash.toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string, value: string }) {
    return (
        <div className="bg-zinc-900/40 border border-zinc-800/50 p-8 rounded-[32px] hover:border-cyan-500/30 transition-all">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">{label}</p>
            <h2 className="text-4xl font-black text-white tracking-tighter tabular-nums">{value}</h2>
        </div>
    );
}

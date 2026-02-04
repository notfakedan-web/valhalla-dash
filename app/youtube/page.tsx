// 1. FORCE DYNAMIC REFRESH
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import React from 'react';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { Youtube, TrendingUp, DollarSign, Users, Phone, CheckCircle2, Filter, Banknote, Activity, Calendar } from 'lucide-react';
import Link from 'next/link';
import Filters from '../Filters'; 

// --- HELPERS ---
const cleanName = (name: string) => name ? name.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
const cleanEmail = (email: string) => email ? email.toLowerCase().trim() : '';

// --- DATA FETCHING ---
async function getYouTubeAttribution(startStr?: string, endStr?: string) {
  try {
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    // Date Filtering Logic
    const startDate = startStr ? new Date(startStr) : null;
    const endDate = endStr ? new Date(endStr) : null;
    if (endDate) endDate.setHours(23, 59, 59, 999);

    const isWithinRange = (dateStr: string) => {
        if (!startDate && !endDate) return true;
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return false;
        if (startDate && d < startDate) return false;
        if (endDate && d > endDate) return false;
        return true;
    };

    // 1. LOAD DATA
    const salesDoc = new GoogleSpreadsheet(process.env.SHEET_ID!, serviceAccountAuth);
    await salesDoc.loadInfo();
    const salesRows = await salesDoc.sheetsByIndex[0].getRows();

    const leadsDoc = new GoogleSpreadsheet(process.env.LEAD_FLOW_SHEET_ID!, serviceAccountAuth);
    await leadsDoc.loadInfo();
    const leadsRows = await leadsDoc.sheetsByIndex[0].getRows();

    // 2. PROCESS SALES
    const salesByName = new Map();
    const salesByEmail = new Map();

    salesRows.forEach(row => {
        const get = (h: string) => row.get(salesDoc.sheetsByIndex[0].headerValues.find(header => header.toLowerCase().includes(h.toLowerCase())) || '');
        
        const data = {
            cash: parseFloat((get('Cash Collected') || '0').replace(/[$, ]/g, '')) || 0,
            revenue: parseFloat((get('Revenue') || '0').replace(/[$, ]/g, '')) || 0,
            calls: 1,
            taken: !['no show', 'cancelled', 'rescheduled'].some(x => (get('Call Outcome')||'').toLowerCase().includes(x)) ? 1 : 0,
            closed: ['closed', 'paid', 'deposit', 'full pay'].some(x => (get('Call Outcome')||'').toLowerCase().includes(x)) ? 1 : 0
        };

        const update = (map: any, key: string) => {
            const ex = map.get(key) || { cash: 0, revenue: 0, calls: 0, taken: 0, closed: 0 };
            map.set(key, { 
                cash: ex.cash + data.cash, revenue: ex.revenue + data.revenue,
                calls: ex.calls + data.calls, taken: ex.taken + data.taken, closed: ex.closed + data.closed
            });
        };
        update(salesByName, cleanName(get('Prospect Name') || get('Name')));
        update(salesByEmail, cleanEmail(get('Email')));
    });

    // 3. PROCESS LEADS & ATTRIBUTION
    const videoStats = new Map();

    leadsRows.forEach(row => {
        const get = (h: string) => row.get(leadsDoc.sheetsByIndex[0].headerValues.find(header => header.toLowerCase().includes(h.toLowerCase())) || '');
        const dateStr = get('Submitted At') || get('Date');
        
        // APPLY DATE FILTER
        if (!isWithinRange(dateStr)) return;

        // Video ID Extraction
        let videoId = 'Unknown Video';
        const content = get('utm_content') || get('content') || '';
        if (content.includes('youtu.be/')) videoId = content.split('youtu.be/')[1].split('?')[0];
        else if (content.includes('v=')) videoId = content.split('v=')[1].split('&')[0];
        else if (content) videoId = content;

        if (!videoStats.has(videoId)) videoStats.set(videoId, { id: videoId, leads: 0, qualified: 0, cash: 0, revenue: 0, calls: 0, taken: 0, closed: 0 });
        
        // Match Sale
        const sale = salesByName.get(cleanName(`${get('First Name')} ${get('Last Name')}`)) || salesByEmail.get(cleanEmail(get('Email'))) || { cash: 0, revenue: 0, calls: 0, taken: 0, closed: 0 };
        
        const curr = videoStats.get(videoId);
        curr.leads++;
        if ((get('funds')||'').toLowerCase().match(/3k|5k|10k|100k/)) curr.qualified++;
        curr.cash += sale.cash;
        curr.revenue += sale.revenue;
        curr.calls += sale.calls;
        curr.taken += sale.taken;
        curr.closed += sale.closed;
    });

    // 4. METADATA & RETURN
    const stats = await Promise.all(Array.from(videoStats.values()).filter((v: any) => v.id !== 'Unknown Video').map(async (v: any) => {
        try {
            const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${v.id}&format=json`, { next: { revalidate: 3600 } });
            const data = res.ok ? await res.json() : {};
            return { ...v, title: data.title || `Video ${v.id}`, thumbnail: data.thumbnail_url || null };
        } catch { return { ...v, title: `Video ${v.id}`, thumbnail: null }; }
    }));

    return stats;
  } catch (e) { return []; }
}

// --- CLIENT COMPONENTS ---
const UtmBuilder = () => (
    <div className="bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-sm rounded-2xl p-8 mb-8 shadow-lg relative z-10">
        <div className="flex items-center gap-2 mb-6">
            <Youtube size={18} className="text-red-500" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">YouTube Link Factory</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
            <input type="text" placeholder="Landing Page URL" className="bg-[#0a0a0a] border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:border-red-500/50 outline-none" />
            <input type="text" placeholder="YouTube Video URL" className="bg-[#0a0a0a] border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:border-red-500/50 outline-none" />
        </div>
        <button className="w-full mt-6 bg-white hover:bg-zinc-200 text-black font-black uppercase tracking-widest text-xs py-4 rounded-xl transition-colors">Generate Tracking Link</button>
    </div>
);

const SummaryCard = ({ label, value, highlight, icon }: any) => {
    const styles: any = {
        green: 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400 shadow-[0_0_20px_-10px_rgba(16,185,129,0.3)]',
        blue: 'bg-blue-950/20 border-blue-500/30 text-blue-400 shadow-[0_0_20px_-10px_rgba(59,130,246,0.3)]',
        purple: 'bg-purple-950/20 border-purple-500/30 text-purple-400 shadow-[0_0_20px_-10px_rgba(168,85,247,0.3)]',
        default: 'bg-[#121214] border-zinc-800/60 text-white'
    };
    const theme = styles[highlight] || styles.default;

    return (
        <div className={`${theme} border rounded-xl p-4 flex flex-col justify-between h-24 relative overflow-hidden group`}>
            {highlight && <div className={`absolute inset-0 bg-${highlight}-500/5 opacity-0 group-hover:opacity-100 transition-opacity`} />}
            <div className="flex justify-between items-start relative z-10">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${highlight ? 'opacity-90' : 'text-zinc-500'}`}>{label}</span>
                {icon && <div className="opacity-80">{icon}</div>}
            </div>
            <span className="text-2xl font-black tracking-tight relative z-10">{value}</span>
        </div>
    );
};

const SortButton = ({ label, icon, active, href }: any) => (
    <Link href={href} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'bg-[#121214] text-zinc-400 hover:text-white border border-zinc-800'}`}>
        {icon} {label}
    </Link>
);

// --- MAIN PAGE ---
export default async function YouTubePage({ searchParams }: { searchParams: Promise<any> }) {
  const params = await searchParams;
  const stats = await getYouTubeAttribution(params.start, params.end);
  const sort = params.sort || 'aov';

  // Sorting
  const sortedStats = [...stats].sort((a, b) => {
      if (sort === 'cash_call') return (b.cash/b.calls||0) - (a.cash/a.calls||0);
      if (sort === 'cash_app') return (b.cash/b.qualified||0) - (a.cash/a.qualified||0);
      if (sort === 'cash_optin') return (b.cash/b.leads||0) - (a.cash/a.leads||0);
      return (b.cash/b.closed||0) - (a.cash/a.closed||0); // Default AOV
  });

  // Aggregates
  const totals = stats.reduce((acc: any, v: any) => ({
      leads: acc.leads + v.leads,
      qualified: acc.qualified + v.qualified,
      calls: acc.calls + v.calls,
      taken: acc.taken + v.taken,
      closed: acc.closed + v.closed,
      cash: acc.cash + v.cash
  }), { leads: 0, qualified: 0, calls: 0, taken: 0, closed: 0, cash: 0 });

  const aggAov = totals.closed > 0 ? totals.cash / totals.closed : 0;
  const aggCashCall = totals.calls > 0 ? totals.cash / totals.calls : 0;
  const aggCashApp = totals.qualified > 0 ? totals.cash / totals.qualified : 0;
  const aggCashOpt = totals.leads > 0 ? totals.cash / totals.leads : 0;
  const aggCloseRate = totals.calls > 0 ? (totals.closed / totals.calls) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans p-6 md:p-10">
      <div className="max-w-[1600px] mx-auto space-y-12">
        
        {/* HEADER */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 mb-10 relative z-[100]">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Traffic Source</span>
                    <div className="w-1 h-1 rounded-full bg-zinc-700" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-500">YouTube Organic</span>
                </div>
                <h1 className="text-4xl font-black tracking-tighter text-white italic uppercase">Content <span className="text-red-500">Engine</span></h1>
            </div>
            
            {/* 1. FILTER FIX: Z-Index increased + Empty arrays to hide closers/setters */}
            <div className="bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md p-2 pl-4 rounded-lg flex flex-wrap items-center gap-4 shadow-sm relative z-[100]">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mr-2">Filter Data:</span>
                <Filters platforms={[]} closers={[]} setters={[]} />
            </div>
        </div>

        <UtmBuilder />

        {/* ANALYTICS HEADER & SORTING */}
        <div className="space-y-6 relative z-10">
            <div className="flex flex-col items-center gap-4">
                <h2 className="text-3xl font-black text-zinc-200 tracking-tight uppercase">Content Performance</h2>
                <p className="text-zinc-500 text-sm">Track performance metrics for your YouTube content</p>
            </div>

            <div className="flex flex-col md:flex-row justify-center items-center gap-4 pt-4">
                <span className="text-[10px] font-bold uppercase text-zinc-500">Sort by Metric</span>
                <div className="flex flex-wrap justify-center gap-2">
                    <SortButton label="AOV" icon={<TrendingUp size={14}/>} active={sort === 'aov'} href={`?sort=aov&start=${params.start||''}&end=${params.end||''}`} />
                    <SortButton label="Cash per Call" icon={<DollarSign size={14}/>} active={sort === 'cash_call'} href={`?sort=cash_call&start=${params.start||''}&end=${params.end||''}`} />
                    <SortButton label="Cash per Application" icon={<DollarSign size={14}/>} active={sort === 'cash_app'} href={`?sort=cash_app&start=${params.start||''}&end=${params.end||''}`} />
                    <SortButton label="Cash per Opt-in" icon={<DollarSign size={14}/>} active={sort === 'cash_optin'} href={`?sort=cash_optin&start=${params.start||''}&end=${params.end||''}`} />
                </div>
            </div>

            {/* UNIFIED SUMMARY GRID */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-11 gap-3">
                {/* Standard Funnel */}
                <SummaryCard label="Applications" value={totals.qualified.toLocaleString()} />
                <SummaryCard label="Opt-ins" value={totals.leads.toLocaleString()} />
                <SummaryCard label="AOV" value={`$${aggAov.toLocaleString(undefined, {maximumFractionDigits:0})}`} />
                <SummaryCard label="Cash/Call" value={`$${aggCashCall.toFixed(0)}`} />
                <SummaryCard label="Booked Calls" value={totals.calls.toLocaleString()} />
                <SummaryCard label="Closes/Booked" value={`${aggCloseRate.toFixed(1)}%`} />
                <SummaryCard label="Avg. Cash/App" value={`$${aggCashApp.toFixed(0)}`} />
                <SummaryCard label="Avg. Cash/Opt-in" value={`$${aggCashOpt.toFixed(0)}`} />

                {/* Highlighted Totals */}
                <SummaryCard label="Total Videos" value={stats.length.toString()} highlight="blue" icon={<Youtube size={14}/>} />
                <SummaryCard label="Total Calls" value={totals.calls.toLocaleString()} highlight="purple" icon={<Phone size={14}/>} />
                <SummaryCard label="Total Cash" value={`$${(totals.cash/1000).toFixed(1)}k`} highlight="green" icon={<DollarSign size={14}/>} />
            </div>

            {/* PAGINATION */}
            <div className="bg-[#121214] border border-zinc-800 rounded-lg py-3 px-6 text-center text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Page 1 of 1 | Showing {sortedStats.length} videos (Total: {sortedStats.length})
            </div>
        </div>

        {/* VIDEO GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative z-0">
            {sortedStats.map((video) => {
                const closeRate = video.taken > 0 ? (video.closed / video.taken) * 100 : 0;
                const showRate = video.calls > 0 ? (video.taken / video.calls) * 100 : 0;
                const aov = video.closed > 0 ? video.cash / video.closed : 0;

                return (
                    <div key={video.id} className="group bg-[#09090b] border border-zinc-800 hover:border-zinc-700 rounded-2xl overflow-hidden transition-all shadow-sm">
                        <div className="relative aspect-video w-full bg-zinc-900">
                            {video.thumbnail && <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] to-transparent opacity-90" />
                            <div className="absolute bottom-4 left-4 right-4">
                                <h3 className="text-sm font-bold text-white leading-snug line-clamp-2">{video.title}</h3>
                            </div>
                        </div>

                        <div className="p-5 grid grid-cols-2 gap-x-8 gap-y-4 text-xs">
                            <MetricRow label="Total Leads" value={video.leads} color="text-zinc-300" icon={<Users size={10} />} />
                            <MetricRow label="Qualified Leads" value={video.qualified} color="text-white" icon={<Filter size={10} />} />
                            <MetricRow label="Cash Collected" value={`$${video.cash.toLocaleString()}`} color="text-emerald-400" icon={<DollarSign size={10} />} />
                            <MetricRow label="Total Revenue" value={`$${video.revenue.toLocaleString()}`} color="text-emerald-400" icon={<Banknote size={10} />} />
                            <MetricRow label="Booked Calls" value={video.calls} color="text-zinc-300" icon={<Phone size={10} />} />
                            <MetricRow label="Show Rate" value={`${showRate.toFixed(1)}%`} color="text-blue-400" icon={<Activity size={10} />} />
                            <MetricRow label="Close Rate" value={`${closeRate.toFixed(1)}%`} color="text-blue-400" icon={<TrendingUp size={10} />} />
                            <MetricRow label="AOV" value={`$${aov.toLocaleString(undefined, {maximumFractionDigits:0})}`} color="text-purple-400" icon={<DollarSign size={10} />} />
                        </div>
                    </div>
                );
            })}
        </div>

      </div>
    </div>
  );
}

// --- SUB-COMPONENT ---
const MetricRow = ({ label, value, color, icon }: any) => (
    <div className="flex justify-between items-center w-full">
        <div className="flex items-center gap-2 text-zinc-500">{icon}<span className="text-[10px] font-bold uppercase tracking-wide">{label}</span></div>
        <span className={`font-black tracking-tight ${color}`}>{value}</span>
    </div>
);

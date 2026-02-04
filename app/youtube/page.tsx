// 1. FORCE DYNAMIC REFRESH
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import React from 'react';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { Link as LinkIcon, Copy, CheckCircle2, Youtube, TrendingUp, DollarSign, Users, Phone, Activity, MousePointer, Filter } from 'lucide-react';
import Image from 'next/image';

// --- HELPERS ---
const cleanName = (name: string) => {
  if (!name) return '';
  return name.toLowerCase().replace(/[^a-z0-9]/g, ''); 
};

const cleanEmail = (email: string) => {
  if (!email) return '';
  return email.toLowerCase().trim();
};

// --- DATA FETCHING ---
async function getYouTubeAttribution() {
  try {
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    // 1. LOAD SALES DATA
    const salesDoc = new GoogleSpreadsheet(process.env.SHEET_ID!, serviceAccountAuth);
    await salesDoc.loadInfo();
    const salesSheet = salesDoc.sheetsByIndex[0];
    const salesRows = await salesSheet.getRows();

    // Map now stores more than just cash/rev to calculate rates
    const salesByName = new Map<string, { cash: number, revenue: number, calls: number, taken: number, closed: number }>();
    const salesByEmail = new Map<string, { cash: number, revenue: number, calls: number, taken: number, closed: number }>();
    
    salesRows.forEach(row => {
        const get = (h: string) => {
            const k = salesSheet.headerValues.find(header => header.toLowerCase().includes(h.toLowerCase()));
            return k ? row.get(k) : '';
        };

        const rawName = get('Prospect Name') || get('Name'); 
        const rawEmail = get('Email');
        const outcome = (get('Call Outcome') || '').toLowerCase();
        
        const normalizedName = cleanName(rawName);
        const normalizedEmail = cleanEmail(rawEmail);
        
        const parseMoney = (val: string) => {
            if (!val) return 0;
            return parseFloat(val.toString().replace(/[$, ]/g, '')) || 0;
        };

        // Determine Call Stats
        const isCall = true; // Assuming every row is a call
        const isTaken = !['no show', 'cancelled', 'rescheduled'].some(x => outcome.includes(x));
        const isClosed = ['closed', 'paid', 'deposit', 'full pay'].some(x => outcome.includes(x));

        const data = {
            cash: parseMoney(get('Cash Collected')), 
            revenue: parseMoney(get('Revenue')),
            calls: 1,
            taken: isTaken ? 1 : 0,
            closed: isClosed ? 1 : 0
        };

        const updateMap = (map: Map<string, any>, key: string) => {
             const existing = map.get(key) || { cash: 0, revenue: 0, calls: 0, taken: 0, closed: 0 };
             map.set(key, { 
                 cash: existing.cash + data.cash, 
                 revenue: existing.revenue + data.revenue,
                 calls: existing.calls + data.calls,
                 taken: existing.taken + data.taken,
                 closed: existing.closed + data.closed
             });
        };

        if (normalizedName) updateMap(salesByName, normalizedName);
        if (normalizedEmail) updateMap(salesByEmail, normalizedEmail);
    });

    // 2. LOAD LEADS DATA
    const leadsDoc = new GoogleSpreadsheet(process.env.LEAD_FLOW_SHEET_ID!, serviceAccountAuth);
    await leadsDoc.loadInfo();
    const leadsSheet = leadsDoc.sheetsByIndex[0];
    const leadsRows = await leadsSheet.getRows();

    // Stats map extended for new metrics
    const videoStats = new Map<string, { 
        id: string, 
        leads: number, 
        qualified: number, 
        cash: number, 
        revenue: number,
        calls: number,
        taken: number,
        closed: number
    }>();

    leadsRows.forEach(row => {
        const getLeadVal = (search: string) => {
             const k = leadsSheet.headerValues.find(h => h.toLowerCase().includes(search.toLowerCase()));
             return k ? row.get(k) : '';
        };

        const rawContent = getLeadVal('utm_content') || getLeadVal('content') || '';
        let videoId = 'Unknown Video';
        if (rawContent) {
            try {
                if (rawContent.includes('youtu.be/')) videoId = rawContent.split('youtu.be/')[1].split('?')[0];
                else if (rawContent.includes('v=')) videoId = rawContent.split('v=')[1].split('&')[0];
                else videoId = rawContent; 
            } catch (e) { videoId = rawContent; }
        }

        const firstName = getLeadVal('First Name') || ''; 
        const lastName = getLeadVal('Last Name') || '';    
        const leadEmail = getLeadVal('Email') || '';
        const intent = (getLeadVal('willing to invest') || getLeadVal('right now') || getLeadVal('funds') || '').toLowerCase();
        
        // CHECK QUALIFICATION ($3k, $5k, $10k+)
        const isQualified = intent.includes('3k') || intent.includes('5k') || intent.includes('10k') || intent.includes('100k');

        const fullName = `${firstName} ${lastName}`;
        const normalizedLeadName = cleanName(fullName);
        const normalizedLeadEmail = cleanEmail(leadEmail);

        let sale = salesByName.get(normalizedLeadName);
        if (!sale && normalizedLeadEmail) {
            sale = salesByEmail.get(normalizedLeadEmail);
        }
        const finalSale = sale || { cash: 0, revenue: 0, calls: 0, taken: 0, closed: 0 };

        if (!videoStats.has(videoId)) {
            videoStats.set(videoId, { id: videoId, leads: 0, qualified: 0, cash: 0, revenue: 0, calls: 0, taken: 0, closed: 0 });
        }
        
        const current = videoStats.get(videoId)!;
        current.leads += 1;
        if (isQualified) current.qualified += 1;
        current.cash += finalSale.cash;
        current.revenue += finalSale.revenue;
        current.calls += finalSale.calls;
        current.taken += finalSale.taken;
        current.closed += finalSale.closed;
    });

    // 3. ENRICH WITH METADATA
    const rawStats = Array.from(videoStats.values()).filter(v => v.id !== 'Unknown Video');
    
    const enrichedStats = await Promise.all(rawStats.map(async (vid) => {
        try {
            const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${vid.id}&format=json`, { next: { revalidate: 3600 } });
            if (res.ok) {
                const data = await res.json();
                return { 
                    ...vid, 
                    title: data.title, 
                    thumbnail: data.thumbnail_url,
                    author: data.author_name 
                };
            }
            return { ...vid, title: `Video ID: ${vid.id}`, thumbnail: null };
        } catch (e) {
            return { ...vid, title: `Video ID: ${vid.id}`, thumbnail: null };
        }
    }));

    return enrichedStats.sort((a, b) => b.cash - a.cash || b.qualified - a.qualified);

  } catch (error) {
    console.error("Attribution Error:", error);
    return [];
  }
}

// --- CLIENT SIDE UTM BUILDER (Inlined for simplicity) ---
// Note: In a real app, this should be a separate client component file
const UtmBuilderSection = () => {
    // This is a client-side only section
    return (
        <form className="bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-sm rounded-2xl p-8 mb-12 shadow-lg">
             <div className="flex items-center gap-2 mb-6">
                <Youtube size={18} className="text-red-500" />
                <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">YouTube Link Factory</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-2">Landing Page URL</label>
                    <input type="text" placeholder="https://..." className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:border-red-500/50 outline-none transition-colors placeholder:text-zinc-700" />
                </div>
                <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-2">YouTube Video URL</label>
                    <input type="text" placeholder="https://youtu.be/..." className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:border-red-500/50 outline-none transition-colors placeholder:text-zinc-700" />
                </div>
            </div>
            <div className="mt-6">
                 <button type="button" className="w-full bg-white hover:bg-zinc-200 text-black font-black uppercase tracking-widest text-xs py-4 rounded-xl transition-colors">
                    Generate Tracking Link
                </button>
            </div>
        </form>
    );
};


export default async function YouTubePage() {
  const stats = await getYouTubeAttribution();

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans selection:bg-red-500/30">
      <div className="max-w-[1600px] mx-auto p-6 md:p-10">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Traffic Source</span>
                    <div className="w-1 h-1 rounded-full bg-zinc-700" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-500">YouTube Organic</span>
                </div>
                <h1 className="text-4xl font-black tracking-tighter text-white italic uppercase">Content <span className="text-red-500">Engine</span></h1>
            </div>
            <div className="flex items-center gap-4">
                <a href="/" className="px-5 py-2.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all">Back to OS</a>
            </div>
        </div>

        {/* UTM BUILDER */}
        <UtmBuilderSection />

        {/* VIDEO ROI INTELLIGENCE */}
        <div className="mb-6 flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
             <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Video ROI Intelligence</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {stats.map((video) => {
                // Calculations
                const closeRate = video.taken > 0 ? (video.closed / video.taken) * 100 : 0;
                const showRate = video.calls > 0 ? (video.taken / video.calls) * 100 : 0;
                const aov = video.closed > 0 ? video.cash / video.closed : 0;
                const closesBooked = video.calls > 0 ? (video.closed / video.calls) * 100 : 0;

                return (
                    <div key={video.id} className="group bg-zinc-900/30 border border-zinc-800 hover:border-zinc-700 rounded-2xl overflow-hidden transition-all duration-300">
                        {/* Thumbnail Header */}
                        <div className="relative aspect-video w-full overflow-hidden bg-zinc-900">
                            {video.thumbnail ? (
                                <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-zinc-700">
                                    <Youtube size={48} />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] to-transparent opacity-90" />
                            <div className="absolute bottom-4 left-4 right-4">
                                <h3 className="text-sm font-bold text-white leading-snug line-clamp-2">{video.title}</h3>
                            </div>
                        </div>

                        {/* Metrics Grid (Matches Image 4 Layout) */}
                        <div className="p-5 grid grid-cols-2 gap-y-4 gap-x-4 text-xs">
                            
                            {/* Row 1 */}
                            <MetricRow label="Cash Collected" value={`$${video.cash.toLocaleString()}`} color="text-emerald-400" icon={<DollarSign size={10} />} />
                            <MetricRow label="Qualified Leads" value={video.qualified} color="text-white" icon={<Filter size={10} />} />

                            {/* Row 2 */}
                            <MetricRow label="Close Rate" value={`${closeRate.toFixed(1)}%`} color="text-blue-400" icon={<TrendingUp size={10} />} />
                            <MetricRow label="Show Rate" value={`${showRate.toFixed(1)}%`} color="text-blue-400" icon={<Phone size={10} />} />

                            {/* Row 3 */}
                            <MetricRow label="Applicants" value={video.leads} color="text-zinc-300" icon={<Users size={10} />} />
                            <MetricRow label="Opt-ins" value="--" color="text-zinc-500" icon={<MousePointer size={10} />} /> 

                            {/* Row 4 */}
                            <MetricRow label="AOV" value={`$${aov.toLocaleString(undefined, {maximumFractionDigits:0})}`} color="text-purple-400" icon={<DollarSign size={10} />} />
                            <MetricRow label="Booked Calls" value={video.calls} color="text-white" icon={<CheckCircle2 size={10} />} />

                            {/* Row 5 */}
                            <div className="col-span-2 pt-2 border-t border-zinc-800/50 flex justify-between items-center">
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Closes / Booked</span>
                                <span className="text-sm font-black text-orange-400">{closesBooked.toFixed(1)}%</span>
                            </div>

                        </div>
                    </div>
                );
            })}
        </div>

      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---
function MetricRow({ label, value, color, icon }: any) {
    return (
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5 text-zinc-500">
                {icon}
                <span className="text-[10px] font-medium">{label}</span>
            </div>
            <span className={`font-black tracking-tight ${color}`}>{value}</span>
        </div>
    )
}

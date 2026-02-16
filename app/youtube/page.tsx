// 1. FORCE DYNAMIC REFRESH
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import React, { Suspense } from 'react';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import YouTubeClient from './YouTubeClient';
import Filters from '../Filters'; // Ensure this path is correct
import { Loader2 } from 'lucide-react';

// --- ROBUST HELPERS ---
const cleanName = (name: string) => name ? name.toLowerCase().replace(/[^a-z]/g, '') : '';
const cleanEmail = (email: string) => email ? email.toLowerCase().trim() : '';

// --- DATA FETCHING ---
async function getYouTubeAttribution(startStr?: string, endStr?: string) {
  try {
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

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

    const salesDoc = new GoogleSpreadsheet(process.env.SHEET_ID!, serviceAccountAuth);
    await salesDoc.loadInfo();
    const salesSheet = salesDoc.sheetsByIndex[0];
    const salesRows = await salesSheet.getRows();

    const leadsDoc = new GoogleSpreadsheet(process.env.LEAD_FLOW_SHEET_ID!, serviceAccountAuth);
    await leadsDoc.loadInfo();
    const leadsSheet = leadsDoc.sheetsByIndex[0];
    const leadsRows = await leadsSheet.getRows();

    const salesByName = new Map();
    const salesByEmail = new Map();

    salesRows.forEach(row => {
        const get = (search: string[]) => {
            const key = salesSheet.headerValues.find(h => search.some(s => h.toLowerCase().includes(s.toLowerCase())));
            return key ? row.get(key) : '';
        };
        const name = cleanName(get(['Prospect Name', 'Name', 'Client']));
        const email = cleanEmail(get(['Email', 'Contact']));
        const cashVal = get(['Cash Collected', 'Cash', 'Collected']);
        const revVal = get(['Revenue', 'Total Revenue']);
        const outcome = (get(['Call Outcome', 'Outcome', 'Status']) || '').toLowerCase();

        const data = {
            cash: parseFloat((cashVal || '0').toString().replace(/[$, ]/g, '')) || 0,
            revenue: parseFloat((revVal || '0').toString().replace(/[$, ]/g, '')) || 0,
            calls: 1,
            taken: !['no show', 'cancelled', 'rescheduled'].some(x => outcome.includes(x)) ? 1 : 0,
            closed: ['closed', 'paid', 'deposit', 'full pay'].some(x => outcome.includes(x)) ? 1 : 0
        };

        const updateMap = (map: any, key: string) => {
            if (!key) return;
            const existing = map.get(key) || { cash: 0, revenue: 0, calls: 0, taken: 0, closed: 0 };
            map.set(key, { 
                cash: existing.cash + data.cash, 
                revenue: existing.revenue + data.revenue,
                calls: existing.calls + data.calls, 
                taken: existing.taken + data.taken, 
                closed: existing.closed + data.closed
            });
        };
        updateMap(salesByName, name);
        updateMap(salesByEmail, email);
    });

    const videoStats = new Map();
    leadsRows.forEach(row => {
        const get = (search: string[]) => {
            const key = leadsSheet.headerValues.find(h => search.some(s => h.toLowerCase().includes(s.toLowerCase())));
            return key ? row.get(key) : '';
        };

        const dateStr = get(['Submitted At', 'Submitted', 'Date']);
        if (!isWithinRange(dateStr)) return;

        let videoId = 'Unknown Video';
        const content = get(['utm_content']) || '';
        if (content.includes('youtu.be/')) videoId = content.split('youtu.be/')[1].split('?')[0];
        else if (content.includes('v=')) videoId = content.split('v=')[1].split('&')[0];
        else if (content) videoId = content;

        if (!videoStats.has(videoId)) videoStats.set(videoId, { id: videoId, leads: 0, qualified: 0, cash: 0, revenue: 0, calls: 0, taken: 0, closed: 0 });
        const curr = videoStats.get(videoId);
        curr.leads++;

        const investAnswer = (get(['invest right now', 'willing to invest', 'funds you have']) || '').toLowerCase();
        if (investAnswer.match(/3k|5k|10k|20k/)) curr.qualified++;

        const leadEmail = cleanEmail(get(['Email']));
        const firstName = get(['First name', 'First Name']) || '';
        const lastName = get(['Last name', 'Last Name']) || '';
        const leadName = cleanName(firstName + lastName);
        
        const matchedSale = salesByEmail.get(leadEmail) || salesByName.get(leadName);
        if (matchedSale) {
            curr.cash += matchedSale.cash;
            curr.revenue += matchedSale.revenue;
            curr.calls += matchedSale.calls;
            curr.taken += matchedSale.taken;
            curr.closed += matchedSale.closed;
        }
    });

    const stats = await Promise.all(Array.from(videoStats.values()).filter((v: any) => v.id !== 'Unknown Video').map(async (v: any) => {
        try {
            const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${v.id}&format=json`, { next: { revalidate: 3600 } });
            const data = res.ok ? await res.json() : {};
            return { ...v, title: data.title || `Video ${v.id}`, thumbnail: data.thumbnail_url || null };
        } catch { return { ...v, title: `Video ${v.id}`, thumbnail: null }; }
    }));

    return stats;
  } catch (e) { console.error(e); return []; }
}

// --- SUB-COMPONENT: HANDLES ASYNC DATA & LAYOUT ---
async function YouTubeContent({ params }: any) {
    const stats = await getYouTubeAttribution(params.start, params.end);
    const sort = params.sort || 'aov';
  
    const sortedStats = [...stats].sort((a, b) => {
        if (sort === 'cash_call') return (b.cash/b.calls||0) - (a.cash/a.calls||0);
        if (sort === 'cash_app') return (b.cash/b.qualified||0) - (a.cash/a.qualified||0);
        if (sort === 'cash_optin') return (b.cash/b.leads||0) - (a.cash/a.leads||0);
        return (b.cash/b.closed||0) - (a.cash/a.closed||0); 
    });
  
    const totals = stats.reduce((acc: any, v: any) => ({
        leads: acc.leads + v.leads,
        qualified: acc.qualified + v.qualified,
        calls: acc.calls + v.calls,
        taken: acc.taken + v.taken,
        closed: acc.closed + v.closed,
        cash: acc.cash + v.cash
    }), { leads: 0, qualified: 0, calls: 0, taken: 0, closed: 0, cash: 0 });

    const uniquePlatforms = Array.from(new Set(stats.map((v: any) => v.id))).filter(Boolean);

    return (
      <div className="min-h-screen bg-[#09090b]">
        {/* ACTION BAR: RIGHT-ALIGNED FILTER, NO HEADERS */}
        <div className="max-w-[1600px] mx-auto p-6 md:p-10 pb-0">
            <div className="flex items-center justify-end mb-8">
                {/* Desktop View: Styled Box */}
                <div className="hidden md:flex bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md p-2 pl-4 rounded-lg items-center gap-4 shadow-sm relative z-50">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mr-2">Filter Data:</span>
                    <Filters platforms={[]} closers={[]} setters={[]} />
                </div>

                {/* Mobile View: Clean Calendar Picker Only */}
                <div className="md:hidden flex items-center relative z-50">
                    <Filters platforms={[]} closers={[]} setters={[]} />
                </div>
            </div>
        </div>

        <YouTubeClient 
          stats={sortedStats} 
          totals={totals} 
          params={params} 
          sort={sort} 
        />
      </div>
    );
}

// --- LOADING FALLBACK ---
function LoadingFallback() {
    return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
            <div className="text-center space-y-1">
                <h3 className="text-lg font-bold text-white uppercase tracking-widest animate-pulse">Loading Data...</h3>
                <p className="text-xs text-zinc-500 font-mono">Syncing with database</p>
            </div>
        </div>
    );
}

// --- MAIN PAGE ---
export default async function YouTubePage({ searchParams }: { searchParams: Promise<any> }) {
  const params = await searchParams;
  const key = JSON.stringify(params);

  return (
    <Suspense key={key} fallback={<LoadingFallback />}>
        <YouTubeContent params={params} />
    </Suspense>
  );
}

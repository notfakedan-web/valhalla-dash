export const dynamic = 'force-dynamic';

import React from 'react';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import UtmBuilder from './UtmBuilder';

async function getYouTubeAttribution() {
  try {
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    // 1. FETCH SALES DATA (Original Sheet)
    const salesDoc = new GoogleSpreadsheet(process.env.SHEET_ID!, serviceAccountAuth);
    await salesDoc.loadInfo();
    const salesSheet = salesDoc.sheetsByIndex[0];
    const salesRows = await salesSheet.getRows();

    const salesMap = new Map<string, { cash: number, revenue: number }>();
    salesRows.forEach(row => {
        const get = (h: string) => {
            const k = salesSheet.headerValues.find(header => header.toLowerCase().includes(h.toLowerCase()));
            return k ? row.get(k) : '';
        };
        const name = (get('Prospect Name') || get('Name') || '').toString().trim().toLowerCase();
        const parseMoney = (val: string) => parseFloat(val?.toString().replace(/[$, ]/g, '') || '0');
        if (name) {
            const existing = salesMap.get(name) || { cash: 0, revenue: 0 };
            salesMap.set(name, { 
                cash: existing.cash + parseMoney(get('Cash Collected')), 
                revenue: existing.revenue + parseMoney(get('Revenue Generated')) 
            });
        }
    });

    // 2. FETCH LEADS DATA (Lead Flow Sheet)
    const leadsDoc = new GoogleSpreadsheet(process.env.LEAD_FLOW_SHEET_ID!, serviceAccountAuth);
    await leadsDoc.loadInfo();
    const leadsSheet = leadsDoc.sheetsByIndex[0];
    const leadsRows = await leadsSheet.getRows();

    const videoStats = new Map<string, { id: string, leads: number, cash: number, revenue: number }>();

    leadsRows.forEach(row => {
        const getLeadVal = (search: string) => {
             const k = leadsSheet.headerValues.find(h => h.toLowerCase().includes(search.toLowerCase()));
             return k ? row.get(k) : '';
        };

        // ROBUST ID EXTRACTION: Handles full URLs or raw IDs
        const rawContent = getLeadVal('utm_content') || getLeadVal('content') || '';
        let videoId = 'Unknown Video';
        
        if (rawContent) {
            try {
                if (rawContent.includes('youtu.be/')) videoId = rawContent.split('youtu.be/')[1].split('?')[0];
                else if (rawContent.includes('v=')) videoId = rawContent.split('v=')[1].split('&')[0];
                else if (rawContent.length === 11) videoId = rawContent; // Standard ID length
                else videoId = rawContent; // Fallback
            } catch (e) { videoId = rawContent; }
        }

        const leadName = (getLeadVal('Name') || '').toString().trim().toLowerCase();
        const sale = salesMap.get(leadName) || { cash: 0, revenue: 0 };

        if (!videoStats.has(videoId)) {
            videoStats.set(videoId, { id: videoId, leads: 0, cash: 0, revenue: 0 });
        }
        
        const current = videoStats.get(videoId)!;
        current.leads += 1;
        current.cash += sale.cash;
        current.revenue += sale.revenue;
    });

    // 3. ENRICH WITH YOUTUBE METADATA (Title + Thumbnail)
    const rawStats = Array.from(videoStats.values()).filter(v => v.id !== 'Unknown Video');
    
    const enrichedStats = await Promise.all(rawStats.map(async (vid) => {
        try {
            // Using oEmbed for free, public metadata (No API Key needed)
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
            return { ...vid, title: `Video ${vid.id}`, thumbnail: null };
        } catch (e) {
            return { ...vid, title: `Video ${vid.id}`, thumbnail: null };
        }
    }));

    return enrichedStats.sort((a, b) => b.cash - a.cash);

  } catch (error) {
    console.error("Attribution Error:", error);
    return [];
  }
}

export default async function YouTubePage() {
  const stats = await getYouTubeAttribution();

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans selection:bg-red-500/30">
      <div className="max-w-[1600px] mx-auto p-6 md:p-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
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
        <UtmBuilder videoStats={stats} />
      </div>
    </div>
  );
}

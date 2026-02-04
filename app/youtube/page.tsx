export const dynamic = 'force-dynamic';

import React from 'react';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import UtmBuilder from './UtmBuilder';

// --- HELPERS ---
const cleanName = (name: string) => {
  if (!name) return '';
  return name.toLowerCase().replace(/[^a-z0-9]/g, ''); 
};

const cleanEmail = (email: string) => {
  if (!email) return '';
  return email.toLowerCase().trim();
};

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

    const salesByName = new Map<string, { cash: number, revenue: number }>();
    const salesByEmail = new Map<string, { cash: number, revenue: number }>();
    
    salesRows.forEach(row => {
        const get = (h: string) => {
            const k = salesSheet.headerValues.find(header => header.toLowerCase().includes(h.toLowerCase()));
            return k ? row.get(k) : '';
        };

        const rawName = get('Prospect Name') || get('Name'); 
        const rawEmail = get('Email');
        
        const normalizedName = cleanName(rawName);
        const normalizedEmail = cleanEmail(rawEmail);
        
        const parseMoney = (val: string) => {
            if (!val) return 0;
            return parseFloat(val.toString().replace(/[$, ]/g, '')) || 0;
        };

        const data = {
            cash: parseMoney(get('Cash Collected')), 
            revenue: parseMoney(get('Revenue'))
        };

        if (normalizedName) {
             const existing = salesByName.get(normalizedName) || { cash: 0, revenue: 0 };
             salesByName.set(normalizedName, { 
                 cash: existing.cash + data.cash, 
                 revenue: existing.revenue + data.revenue 
             });
        }
        if (normalizedEmail) {
             const existing = salesByEmail.get(normalizedEmail) || { cash: 0, revenue: 0 };
             salesByEmail.set(normalizedEmail, { 
                 cash: existing.cash + data.cash, 
                 revenue: existing.revenue + data.revenue 
             });
        }
    });

    // 2. LOAD LEADS DATA
    const leadsDoc = new GoogleSpreadsheet(process.env.LEAD_FLOW_SHEET_ID!, serviceAccountAuth);
    await leadsDoc.loadInfo();
    const leadsSheet = leadsDoc.sheetsByIndex[0];
    const leadsRows = await leadsSheet.getRows();

    // Added 'qualified' to stats tracking
    const videoStats = new Map<string, { id: string, leads: number, qualified: number, cash: number, revenue: number }>();

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
        const intent = (getLeadVal('willing to invest') || getLeadVal('right now') || '').toLowerCase();
        
        // CHECK QUALIFICATION ($3k, $5k, $10k+)
        const isQualified = intent.includes('3k') || intent.includes('5k') || intent.includes('10k');

        const fullName = `${firstName} ${lastName}`;
        const normalizedLeadName = cleanName(fullName);
        const normalizedLeadEmail = cleanEmail(leadEmail);

        let sale = salesByName.get(normalizedLeadName);
        if (!sale && normalizedLeadEmail) {
            sale = salesByEmail.get(normalizedLeadEmail);
        }
        const finalSale = sale || { cash: 0, revenue: 0 };

        if (!videoStats.has(videoId)) {
            videoStats.set(videoId, { id: videoId, leads: 0, qualified: 0, cash: 0, revenue: 0 });
        }
        
        const current = videoStats.get(videoId)!;
        current.leads += 1;
        if (isQualified) current.qualified += 1; // Increment Qualified Count
        current.cash += finalSale.cash;
        current.revenue += finalSale.revenue;
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

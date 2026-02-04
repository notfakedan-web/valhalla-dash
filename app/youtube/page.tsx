"use client";

import React, { useState, useEffect } from 'react';
import { Link as LinkIcon, Copy, CheckCircle2, Search, Youtube, TrendingUp, DollarSign, MousePointer, Filter, Eye, BarChart2, Percent, Activity } from 'lucide-react';

// --- HELPER: MOCK ANALYTICS DATA GENERATOR ---
// This simulates data you would get from Google Ads/YouTube Analytics APIs.
// It uses the video ID to create semi-deterministic realistic-looking numbers.
function getMockVideoAnalytics(videoId: string) {
    if (!videoId) return null;
    
    // Use videoId string length as a seed for pseudo-randomness
    const seed = videoId.length * 12345;
    const pseudoRandom = (offset: number) => ((seed + offset * 987) % 100) / 100;

    // 1. Top of Funnel
    const impressions = Math.floor(25000 + pseudoRandom(1) * 150000); // 25k - 175k
    
    // 2. Engagement Rates
    const viewRate = 0.12 + pseudoRandom(2) * 0.28; // 12% - 40% VTR
    const views = Math.floor(impressions * viewRate);
    const ctr = 0.008 + pseudoRandom(3) * 0.035; // 0.8% - 4.3% CTR

    // 3. Mid Funnel
    const clicks = Math.floor(views * ctr * 1.5); // Assuming some clicks come from impressions too

    // 4. Bottom Funnel (Leads)
    const conversionRate = 0.03 + pseudoRandom(4) * 0.12; // 3% - 15% click-to-lead
    const qualifiedLeads = Math.floor(clicks * conversionRate);

    // 5. Costs
    const cpc = 0.80 + pseudoRandom(5) * 3.50; // $0.80 - $4.30 CPC
    const spend = clicks * cpc;
    const cpv = spend / views;
    const cpm = (spend / impressions) * 1000;
    const cpl = qualifiedLeads > 0 ? spend / qualifiedLeads : 0;

    return {
        impressions, views, clicks, qualifiedLeads,
        spend, cpc, cpl, cpv, cpm, ctr, viewRate
    };
}


export default function YouTubePage() {
  // --- UTM STATE ---
  const [baseUrl, setBaseUrl] = useState('');
  const [source, setSource] = useState('youtube');
  const [medium, setMedium] = useState('organic');
  const [campaign, setCampaign] = useState('');
  const [term, setTerm] = useState('');
  const [content, setContent] = useState('');
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [copied, setCopied] = useState(false);

  // --- YOUTUBE STATE ---
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [videoData, setVideoData] = useState<any>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [error, setError] = useState('');

  // --- UTM EFFECT ---
  useEffect(() => {
    if (!baseUrl) { setGeneratedUrl(''); return; }
    try {
        const url = new URL(baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`);
        if (source) url.searchParams.set('utm_source', source);
        if (medium) url.searchParams.set('utm_medium', medium);
        if (campaign) url.searchParams.set('utm_campaign', campaign);
        if (term) url.searchParams.set('utm_term', term);
        if (content) url.searchParams.set('utm_content', content);
        setGeneratedUrl(url.toString());
    } catch (e) { setGeneratedUrl(''); }
  }, [baseUrl, source, medium, campaign, term, content]);

  const handleCopy = async () => {
      if (!generatedUrl) return;
      await navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  // --- YOUTUBE HANDLER ---
  const handleFetchVideo = async () => {
    setLoading(true); setError(''); setVideoData(null); setAnalyticsData(null);
    try {
      let videoId = '';
      if (videoUrl.includes('youtu.be/')) videoId = videoUrl.split('youtu.be/')[1].split('?')[0];
      else if (videoUrl.includes('youtube.com/watch')) videoId = new URLSearchParams(new URL(videoUrl).search).get('v') || '';
      
      if (!videoId) throw new Error("Invalid YouTube URL");

      // 1. Fetch Basic Info (OEmbed)
      const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
      if (!res.ok) throw new Error("Video not found");
      const data = await res.json();
      
      // 2. Generate Mock Analytics Data
      const mockAnalytics = getMockVideoAnalytics(videoId);

      setVideoData({ ...data, videoId });
      setAnalyticsData(mockAnalytics);

    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };


  return (
    <div className="min-h-screen p-6 md:p-10 bg-[#09090b] text-zinc-100 font-sans">
      <div className="max-w-[1200px] mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="flex items-center gap-3 mb-4">
            <LinkIcon size={20} className="text-cyan-500" />
             <h1 className="text-3xl font-bold tracking-tight text-white">Campaign <span className="text-cyan-500">Command Center</span></h1>
        </div>

        {/* ================= SECTION 1: UTM BUILDER (Keep at top) ================= */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-sm">
             <div className="flex items-center gap-2 mb-6">
                <Activity size={16} className="text-purple-400" />
                <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">UTM Link Constructor</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div>
                        <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block mb-1.5">Website URL *</label>
                        <input type="text" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://yourwebsite.com/landing-page" className="w-full bg-zinc-800/50 border border-zinc-700/50 focus:border-cyan-500/50 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-all" />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                             <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block mb-1.5">Source *</label>
                             <input type="text" value={source} onChange={(e) => setSource(e.target.value)} className="w-full bg-zinc-800/50 border border-zinc-700/50 focus:border-cyan-500/50 rounded-lg px-4 py-3 text-sm text-white outline-none transition-all" />
                        </div>
                        <div>
                             <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block mb-1.5">Medium *</label>
                             <input type="text" value={medium} onChange={(e) => setMedium(e.target.value)} className="w-full bg-zinc-800/50 border border-zinc-700/50 focus:border-cyan-500/50 rounded-lg px-4 py-3 text-sm text-white outline-none transition-all" />
                        </div>
                    </div>
                    <div>
                        <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block mb-1.5">Campaign Name</label>
                        <input type="text" value={campaign} onChange={(e) => setCampaign(e.target.value)} placeholder="e.g., summer_promo" className="w-full bg-zinc-800/50 border border-zinc-700/50 focus:border-cyan-500/50 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-all" />
                    </div>
                </div>

                 <div className="space-y-4 flex flex-col">
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                             <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block mb-1.5">Term (Keywords)</label>
                             <input type="text" value={term} onChange={(e) => setTerm(e.target.value)} placeholder="e.g., video_ad_1" className="w-full bg-zinc-800/50 border border-zinc-700/50 focus:border-cyan-500/50 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-all" />
                        </div>
                        <div>
                             <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block mb-1.5">Content (Ad Version)</label>
                             <input type="text" value={content} onChange={(e) => setContent(e.target.value)} placeholder="e.g., v2_hook_b" className="w-full bg-zinc-800/50 border border-zinc-700/50 focus:border-cyan-500/50 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-all" />
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-end mt-4">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block mb-1.5">Generated Tracking Link</label>
                        <div className="relative">
                            <div className="w-full bg-[#0c0c0c] border border-zinc-800 rounded-lg pl-4 pr-12 py-4 text-sm text-cyan-400 font-mono break-all min-h-[54px] flex items-center">
                                {generatedUrl || <span className="text-zinc-700 italic">Enter URL parameters above...</span>}
                            </div>
                            <button onClick={handleCopy} disabled={!generatedUrl} className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md transition-all ${copied ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white'} ${!generatedUrl && 'opacity-50 cursor-not-allowed'}`}>
                                {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>


        {/* ================= SECTION 2: YOUTUBE AD ANALYTICS (DEEP DIVE) ================= */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-sm space-y-6">
            
            {/* Search Input */}
            <div>
                 <div className="flex items-center gap-2 mb-4">
                    <Youtube size={16} className="text-red-500" />
                    <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">YouTube Ad Intelligence</h2>
                </div>
                <div className="flex gap-3">
                    <div className="relative flex-1">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <input type="text" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="Paste YouTube Video URL (e.g., https://www.youtube.com/watch?v=...)" className="w-full bg-[#0c0c0c] border border-zinc-800/80 focus:border-red-500/50 rounded-xl pl-12 pr-4 py-4 text-white placeholder-zinc-600 outline-none transition-all" onKeyDown={(e) => e.key === 'Enter' && handleFetchVideo()} />
                    </div>
                    <button onClick={handleFetchVideo} disabled={loading || !videoUrl} className={`px-8 py-4 rounded-xl font-bold uppercase tracking-wider text-xs transition-all ${loading ? 'bg-zinc-800 text-zinc-500 cursor-wait' : 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-lg shadow-red-900/20'}`}>
                        {loading ? 'Analyzing...' : 'Analyze Video'}
                    </button>
                </div>
                {error && <p className="text-red-400 text-sm mt-3 flex items-center gap-2"><Activity size={14}/> {error}</p>}
            </div>

            {videoData && analyticsData && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    
                    {/* Video Details Header */}
                    <div className="flex flex-col md:flex-row gap-6 items-start border-b border-zinc-800/50 pb-8">
                        <img src={videoData.thumbnail_url} alt={videoData.title} className="w-full md:w-64 aspect-video rounded-xl shadow-lg shadow-black/50 border border-zinc-800" />
                        <div className="flex-1 space-y-3">
                            <h3 className="text-2xl font-bold text-white leading-tight">{videoData.title}</h3>
                            <p className="text-zinc-400 text-sm font-medium">{videoData.author_name}</p>
                            <div className="flex items-center gap-3 pt-2">
                                {/* Mocking Likes/Comments for UI based on views */}
                                <div className="px-3 py-1.5 rounded-full bg-zinc-800/50 border border-zinc-700/50 text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                                    <TrendingUp size={12} className="text-green-400"/> {(analyticsData.views * (0.02 + Math.random()*0.03)).toFixed(0)} Likes
                                </div>
                                 <div className="px-3 py-1.5 rounded-full bg-zinc-800/50 border border-zinc-700/50 text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                                    <Activity size={12} className="text-blue-400"/> {(analyticsData.views * (0.001 + Math.random()*0.004)).toFixed(0)} Comments
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ---------- ROW 1: FUNNEL METRICS (HERO STYLE) ---------- */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <HeroMetric label="Impressions" value={analyticsData.impressions.toLocaleString()} icon={<Eye size={18} />} color="blue" />
                        <HeroMetric label="Views" value={analyticsData.views.toLocaleString()} icon={<Youtube size={18} />} color="cyan" />
                        <HeroMetric label="Clicks" value={analyticsData.clicks.toLocaleString()} icon={<MousePointer size={18} />} color="indigo" />
                        <HeroMetric label="Qualified Leads" value={analyticsData.qualifiedLeads.toLocaleString()} icon={<Filter size={18} />} color="emerald" highlight />
                    </div>

                    {/* ---------- ROW 2: EFFICIENCY & COST METRICS (STAT BOX STYLE) ---------- */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                         <StatMetric label="CTR (Click-Through)" value={`${(analyticsData.ctr * 100).toFixed(2)}%`} icon={<Percent size={14} />} />
                         <StatMetric label="View Rate (VTR)" value={`${(analyticsData.viewRate * 100).toFixed(1)}%`} icon={<Activity size={14} />} />
                         <StatMetric label="Total Ad Spend" value={`$${analyticsData.spend.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} icon={<DollarSign size={14} />} highlight color="red" />
                         <StatMetric label="Cost Per Lead (CPL)" value={`$${analyticsData.cpl.toFixed(2)}`} icon={<DollarSign size={14} />} highlight color="emerald" />
                    </div>

                    {/* Additional Data Points (Optional - can add a 3rd row for CPC, CPV, CPM) */}
                     <div className="grid grid-cols-3 gap-4 pt-4 border-t border-zinc-800/50">
                         <div className="flex justify-between text-xs"><span className="text-zinc-500 uppercase tracking-wider">Avg. CPC</span> <span className="font-bold tabular-nums">${analyticsData.cpc.toFixed(2)}</span></div>
                         <div className="flex justify-between text-xs"><span className="text-zinc-500 uppercase tracking-wider">Avg. CPV</span> <span className="font-bold tabular-nums">${analyticsData.cpv.toFixed(2)}</span></div>
                         <div className="flex justify-between text-xs"><span className="text-zinc-500 uppercase tracking-wider">CPM (1k Impr.)</span> <span className="font-bold tabular-nums">${analyticsData.cpm.toFixed(2)}</span></div>
                     </div>
                    
                </div>
            )}

        </div>
      </div>
    </div>
  );
}

// --- COMPONENTS (STYLED LIKE HOME/LEADS) ---

// Top Row "Hero" Style Cards
function HeroMetric({ label, value, icon, color, highlight }: any) {
    const colorStyles: any = {
        blue: { border: 'border-blue-500/20', text: 'text-blue-400', gradient: 'from-blue-500/10' },
        cyan: { border: 'border-cyan-500/20', text: 'text-cyan-400', gradient: 'from-cyan-500/10' },
        indigo: { border: 'border-indigo-500/20', text: 'text-indigo-400', gradient: 'from-indigo-500/10' },
        emerald: { border: 'border-emerald-500/20', text: 'text-emerald-400', gradient: 'from-emerald-500/10' },
    };
    const theme = colorStyles[color] || colorStyles.blue;

    return (
        <div className={`relative overflow-hidden bg-[#0c0c0c] border ${theme.border} p-6 rounded-2xl shadow-sm flex flex-col h-32 ${highlight ? 'shadow-[0_0_20px_-5px_rgba(16,185,129,0.2)]' : ''}`}>
             <div className={`absolute inset-x-0 top-0 h-16 bg-gradient-to-b ${theme.gradient} to-transparent opacity-40`}></div>
             <div className="relative z-10 flex justify-between items-start mb-3">
                <p className={`text-[10px] font-bold uppercase tracking-wider ${theme.text}`}>{label}</p>
                <div className={`${theme.text} opacity-80`}>{icon}</div>
            </div>
            <h3 className="relative z-10 text-3xl font-black text-white tracking-tight tabular-nums mt-auto">{value}</h3>
        </div>
    )
}

// Bottom Row "Stat Box" Style Cards
function StatMetric({ label, value, icon, highlight, color }: any) {
    let accentColor = 'text-zinc-500';
    let borderColor = 'border-zinc-800/80';
    let bgColor = 'bg-zinc-900/30';

    if (highlight) {
        if (color === 'red') {
             accentColor = 'text-red-400'; borderColor = 'border-red-500/30'; bgColor = 'bg-red-950/20';
        } else if (color === 'emerald') {
             accentColor = 'text-emerald-400'; borderColor = 'border-emerald-500/30'; bgColor = 'bg-emerald-950/20';
        }
    }

    return (
        <div className={`${bgColor} border ${borderColor} backdrop-blur-sm p-5 rounded-xl flex flex-col gap-3 font-sans shadow-sm transition-all hover:border-opacity-50`}>
            <div className="flex items-center justify-between">
                 <p className={`text-[10px] font-bold uppercase tracking-wider ${accentColor}`}>{label}</p>
                 <div className={`${accentColor} opacity-70`}>{icon}</div>
            </div>
            <h3 className="text-2xl font-black tracking-tight tabular-nums text-white">{value}</h3>
        </div>
    );
}

"use client";

import React, { useState } from 'react';
import { Youtube, TrendingUp, DollarSign, Users, Phone, CheckCircle2, Filter, Banknote, Activity, Calendar, Copy, Check, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';
import Filters from '../Filters'; 

// --- SUB-COMPONENTS ---
const MetricRow = ({ label, value, color, icon }: any) => (
    <div className="flex justify-between items-center w-full">
        <div className="flex items-center gap-2 text-zinc-500">{icon}<span className="text-[10px] font-bold uppercase tracking-wide">{label}</span></div>
        <span className={`font-black tracking-tight ${color}`}>{value}</span>
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

// --- MAIN CLIENT COMPONENT ---
export default function YouTubeClient({ stats, totals, params, sort }: any) {
    // State for the "Link Factory" inputs
    const [baseUrl, setBaseUrl] = useState('');
    const [manualVideoUrl, setManualVideoUrl] = useState('');
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [manualCopied, setManualCopied] = useState(false);

    // Helper: Extract ID from YouTube URL
    const extractVideoId = (url: string) => {
        if (!url) return '';
        if (url.includes('youtu.be/')) return url.split('youtu.be/')[1].split('?')[0];
        if (url.includes('v=')) return url.split('v=')[1].split('&')[0];
        return url; // fallback
    };

    // 1. Handle "Generate Tracking Link" (Big Button)
    const handleManualGenerate = () => {
        const targetUrl = baseUrl || "https://your-landing-page.com";
        const separator = targetUrl.includes('?') ? '&' : '?';
        const vidId = extractVideoId(manualVideoUrl);
        
        // If they provided a video URL, use that ID. Otherwise just base.
        const utmContent = vidId ? `&utm_content=${vidId}` : '';
        const link = `${targetUrl}${separator}utm_source=youtube&utm_medium=organic${utmContent}`;
        
        navigator.clipboard.writeText(link);
        setManualCopied(true);
        setTimeout(() => setManualCopied(false), 2000);
    };

    // 2. Handle "Copy Link" (Video Cards)
    const handleCardCopy = (videoId: string) => {
        const targetUrl = baseUrl || "https://your-landing-page.com";
        const separator = targetUrl.includes('?') ? '&' : '?';
        const link = `${targetUrl}${separator}utm_source=youtube&utm_medium=organic&utm_content=${videoId}`;
        
        navigator.clipboard.writeText(link);
        setCopiedId(videoId);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans p-6 md:p-10">
            <div className="max-w-[1600px] mx-auto space-y-12">
                
                {/* HEADER */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 mb-10 relative z-50">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Traffic Source</span>
                            <div className="w-1 h-1 rounded-full bg-zinc-700" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-500">YouTube Organic</span>
                        </div>
                        <h1 className="text-4xl font-black tracking-tighter text-white italic uppercase">Content <span className="text-red-500">Engine</span></h1>
                    </div>
                    
                    <div className="bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md p-2 pl-4 rounded-lg flex flex-wrap items-center gap-4 shadow-sm">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mr-2">Filter Data:</span>
                        <Filters platforms={[]} closers={[]} setters={[]} />
                    </div>
                </div>

                {/* LINK FACTORY */}
                <div className="bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-sm rounded-2xl p-8 mb-8 shadow-lg relative z-0">
                    <div className="flex items-center gap-2 mb-6">
                        <Youtube size={18} className="text-red-500" />
                        <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">YouTube Link Factory</h2>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <input 
                            type="text" 
                            placeholder="Landing Page URL (e.g. https://start.com)" 
                            value={baseUrl}
                            onChange={(e) => setBaseUrl(e.target.value)}
                            className="bg-[#0a0a0a] border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:border-red-500/50 outline-none" 
                        />
                        <input 
                            type="text" 
                            placeholder="YouTube Video URL (Optional)" 
                            value={manualVideoUrl}
                            onChange={(e) => setManualVideoUrl(e.target.value)}
                            className="bg-[#0a0a0a] border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:border-red-500/50 outline-none" 
                        />
                    </div>
                    
                    {/* --- THE RESTORED BUTTON --- */}
                    <button 
                        onClick={handleManualGenerate}
                        className="w-full bg-white hover:bg-zinc-200 text-black font-black uppercase tracking-widest text-xs py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                        {manualCopied ? <Check size={16} /> : null}
                        {manualCopied ? "Link Copied to Clipboard!" : "Generate Tracking Link"}
                    </button>
                </div>

                {/* ANALYTICS HEADER & SORTING */}
                <div className="space-y-6 relative z-0">
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
                        <SummaryCard label="Applications" value={totals.qualified.toLocaleString()} />
                        <SummaryCard label="Opt-ins" value={totals.leads.toLocaleString()} />
                        <SummaryCard label="AOV" value={`$${(totals.closed > 0 ? totals.cash / totals.closed : 0).toLocaleString(undefined, {maximumFractionDigits:0})}`} />
                        <SummaryCard label="Cash/Call" value={`$${(totals.calls > 0 ? totals.cash / totals.calls : 0).toFixed(0)}`} />
                        <SummaryCard label="Booked Calls" value={totals.calls.toLocaleString()} />
                        <SummaryCard label="Closes/Booked" value={`${(totals.calls > 0 ? (totals.closed / totals.calls) * 100 : 0).toFixed(1)}%`} />
                        <SummaryCard label="Avg. Cash/App" value={`$${(totals.qualified > 0 ? totals.cash / totals.qualified : 0).toFixed(0)}`} />
                        <SummaryCard label="Avg. Cash/Opt-in" value={`$${(totals.leads > 0 ? totals.cash / totals.leads : 0).toFixed(0)}`} />

                        <SummaryCard label="Total Videos" value={stats.length.toString()} highlight="blue" icon={<Youtube size={14}/>} />
                        <SummaryCard label="Total Calls" value={totals.calls.toLocaleString()} highlight="purple" icon={<Phone size={14}/>} />
                        <SummaryCard label="Total Cash" value={`$${(totals.cash/1000).toFixed(1)}k`} highlight="green" icon={<DollarSign size={14}/>} />
                    </div>

                    <div className="bg-[#121214] border border-zinc-800 rounded-lg py-3 px-6 text-center text-xs font-bold text-zinc-500 uppercase tracking-wider">
                        Page 1 of 1 | Showing {stats.length} videos (Total: {stats.length})
                    </div>
                </div>

                {/* VIDEO GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative z-0">
                    {stats.map((video: any) => {
                        const closeRate = video.taken > 0 ? (video.closed / video.taken) * 100 : 0;
                        const showRate = video.calls > 0 ? (video.taken / video.calls) * 100 : 0;
                        const aov = video.closed > 0 ? video.cash / video.closed : 0;

                        return (
                            <div key={video.id} className="group bg-[#09090b] border border-zinc-800 hover:border-zinc-700 rounded-2xl overflow-hidden transition-all shadow-sm flex flex-col">
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

                                {/* VIDEO CARD COPY BUTTON */}
                                <div className="mt-auto p-4 border-t border-zinc-800 bg-[#0c0c0e]">
                                    <button
                                        onClick={() => handleCardCopy(video.id)}
                                        className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 border ${
                                            copiedId === video.id 
                                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                                            : "bg-[#18181b] text-zinc-400 border-zinc-700 hover:bg-zinc-800 hover:text-white"
                                        }`}
                                    >
                                        {copiedId === video.id ? (
                                            <>
                                                <Check size={14} />
                                                <span>Copied Link</span>
                                            </>
                                        ) : (
                                            <>
                                                <LinkIcon size={14} />
                                                <span>Copy Tracking Link</span>
                                            </>
                                        )}
                                    </button>
                                    <div className="text-[10px] text-zinc-600 text-center mt-2 font-mono">
                                        utm_content={video.id}
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

"use client";

import React, { useState, useEffect } from 'react';
import { Youtube, TrendingUp, DollarSign, Users, Phone, Filter, Banknote, Activity, Check, Link as LinkIcon, Archive, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
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
    const [baseUrl, setBaseUrl] = useState('');
    const [manualVideoUrl, setManualVideoUrl] = useState('');
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [manualCopied, setManualCopied] = useState(false);
    const [optimisticVideos, setOptimisticVideos] = useState<any[]>([]);
    
    // Archive State
    const [archivedIds, setArchivedIds] = useState<string[]>([]);
    const [showArchive, setShowArchive] = useState(false);

    // Persistence: Load archives from LocalStorage
    useEffect(() => {
        const saved = localStorage.getItem('valhalla_archived_videos');
        if (saved) setArchivedIds(JSON.parse(saved));
    }, []);

    // Save archives to LocalStorage
    const updateArchives = (newIds: string[]) => {
        setArchivedIds(newIds);
        localStorage.setItem('valhalla_archived_videos', JSON.stringify(newIds));
    };

    const toggleArchive = (id: string) => {
        if (archivedIds.includes(id)) {
            updateArchives(archivedIds.filter(v => v !== id));
        } else {
            updateArchives([...archivedIds, id]);
        }
    };

    const extractVideoId = (url: string) => {
        if (!url) return '';
        if (url.includes('youtu.be/')) return url.split('youtu.be/')[1].split('?')[0];
        if (url.includes('v=')) return url.split('v=')[1].split('&')[0];
        return url; 
    };

    const handleManualGenerate = async () => {
        if (!baseUrl) {
            alert("Please enter your Typeform/Landing Page URL first.");
            return;
        }

        const separator = baseUrl.includes('?') ? '&' : '?';
        const vidId = extractVideoId(manualVideoUrl);
        const utmContent = vidId ? `&utm_content=${vidId}` : '';
        const link = `${baseUrl}${separator}utm_source=youtube&utm_medium=organic${utmContent}`;
        
        navigator.clipboard.writeText(link);
        setManualCopied(true);
        setTimeout(() => setManualCopied(false), 2000);

        if (vidId) {
            const existsInStats = stats.some((v: any) => v.id === vidId);
            const existsInLocal = optimisticVideos.some((v: any) => v.id === vidId);

            if (!existsInStats && !existsInLocal) {
                let newTitle = "New Tracked Video";
                try {
                    const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${vidId}&format=json`);
                    if (res.ok) {
                        const data = await res.json();
                        newTitle = data.title;
                    }
                } catch (e) { console.log("Could not fetch title"); }

                const newVideo = {
                    id: vidId,
                    title: newTitle,
                    thumbnail: `https://i.ytimg.com/vi/${vidId}/mqdefault.jpg`,
                    leads: 0, qualified: 0, cash: 0, revenue: 0, calls: 0, taken: 0, closed: 0,
                    savedUrl: baseUrl 
                };
                
                setOptimisticVideos(prev => [newVideo, ...prev]);
            }
        }
    };

    const handleCardCopy = (video: any) => {
        const targetUrl = video.savedUrl || baseUrl;
        if (!targetUrl) {
            alert("Please enter your Typeform/Landing Page URL in the box above to generate this link.");
            return;
        }
        const separator = targetUrl.includes('?') ? '&' : '?';
        const link = `${targetUrl}${separator}utm_source=youtube&utm_medium=organic&utm_content=${video.id}`;
        
        navigator.clipboard.writeText(link);
        setCopiedId(video.id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const allVideos = [...optimisticVideos, ...stats];
    const activeVideos = allVideos.filter(v => !archivedIds.includes(v.id));
    const archivedVideos = allVideos.filter(v => archivedIds.includes(v.id));

    return (
        <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans p-6 md:p-10">
            <div className="max-w-[1600px] mx-auto space-y-12">
                
                {/* ACTION BAR: RESPONSIVE FILTERS */}
                <div className="flex items-center justify-end mb-8 relative z-50">
                    <div className="hidden md:flex bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md p-2 pl-4 rounded-lg items-center gap-4 shadow-sm">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mr-2">Filter Data:</span>
                        <Filters platforms={[]} closers={[]} setters={[]} />
                    </div>
                    <div className="flex md:hidden items-center">
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
                            placeholder="Landing Page URL" 
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
                    <button onClick={handleManualGenerate} className="w-full bg-white hover:bg-zinc-200 text-black font-black uppercase tracking-widest text-xs py-4 rounded-xl transition-colors flex items-center justify-center gap-2">
                        {manualCopied ? <Check size={16} /> : null}
                        {manualCopied ? "Link Copied & Video Added!" : "Generate Tracking Link"}
                    </button>
                </div>

                {/* ACTIVE CONTENT SECTION */}
                <div className="space-y-6 relative z-0">
                    <div className="flex flex-col items-center gap-4">
                        <h2 className="text-3xl font-black text-zinc-200 tracking-tight uppercase">Content Performance</h2>
                        <p className="text-zinc-500 text-sm">Active Tracked Videos</p>
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

                    {/* VIDEO GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative z-0">
                        {activeVideos.map((video: any) => (
                            <VideoCard 
                                key={video.id} 
                                video={video} 
                                onCopy={handleCardCopy} 
                                onArchive={() => toggleArchive(video.id)}
                                isCopied={copiedId === video.id}
                            />
                        ))}
                    </div>
                </div>

                {/* ARCHIVE VAULT SECTION */}
                {archivedVideos.length > 0 && (
                    <div className="mt-20 border-t border-zinc-800 pt-10">
                        <button 
                            onClick={() => setShowArchive(!showArchive)}
                            className="flex items-center gap-3 mx-auto mb-10 px-6 py-3 bg-zinc-900/50 border border-zinc-800 rounded-full hover:bg-zinc-800 transition-colors"
                        >
                            <Archive size={16} className="text-zinc-500" />
                            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                                {showArchive ? "Hide Archive Vault" : `View Archive Vault (${archivedVideos.length})`}
                            </span>
                            {showArchive ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                        </button>

                        {showArchive && (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 opacity-60">
                                {archivedVideos.map((video: any) => (
                                    <VideoCard 
                                        key={video.id} 
                                        video={video} 
                                        onCopy={handleCardCopy} 
                                        onArchive={() => toggleArchive(video.id)}
                                        isCopied={copiedId === video.id}
                                        isArchived
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// --- CARD COMPONENT ---
function VideoCard({ video, onCopy, onArchive, isCopied, isArchived }: any) {
    const closeRate = video.taken > 0 ? (video.closed / video.taken) * 100 : 0;
    const showRate = video.calls > 0 ? (video.taken / video.calls) * 100 : 0;
    const aov = video.closed > 0 ? video.cash / video.closed : 0;

    return (
        <div className="group bg-[#09090b] border border-zinc-800 hover:border-zinc-700 rounded-2xl overflow-hidden transition-all shadow-sm flex flex-col relative">
            <button 
                onClick={onArchive}
                className="absolute top-3 right-3 z-20 p-2 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 text-white/40 hover:text-white hover:bg-red-500/20 transition-all opacity-0 group-hover:opacity-100"
                title={isArchived ? "Restore Video" : "Archive Video"}
            >
                {isArchived ? <RotateCcw size={14} /> : <Archive size={14} />}
            </button>

            <div className="relative aspect-video w-full bg-zinc-900">
                {video.thumbnail && <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />}
                <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] to-transparent opacity-90" />
                <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-sm font-bold text-white leading-snug line-clamp-2">{video.title}</h3>
                </div>
            </div>

            <div className="p-5 grid grid-cols-2 gap-x-8 gap-y-4 text-xs">
                <MetricRow label="Leads" value={video.leads} color="text-zinc-300" icon={<Users size={10} />} />
                <MetricRow label="Qualified" value={video.qualified} color="text-white" icon={<Filter size={10} />} />
                <MetricRow label="Cash" value={`$${video.cash.toLocaleString()}`} color="text-emerald-400" icon={<DollarSign size={10} />} />
                <MetricRow label="Close Rate" value={`${closeRate.toFixed(1)}%`} color="text-blue-400" icon={<TrendingUp size={10} />} />
            </div>

            <div className="mt-auto p-4 border-t border-zinc-800 bg-[#0c0c0e]">
                <button
                    onClick={() => onCopy(video)}
                    className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                        isCopied ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-[#18181b] text-zinc-400 border-zinc-700 hover:text-white"
                    }`}
                >
                    {isCopied ? <Check size={14} /> : <LinkIcon size={14} />}
                    <span>{isCopied ? "Copied" : "Copy Link"}</span>
                </button>
            </div>
        </div>
    );
}

'use client';

import React, { useState } from 'react';
import { Copy, Youtube, TrendingUp, DollarSign, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';

export default function UtmBuilder({ videoStats }: { videoStats: any[] }) {
  const [baseUrl, setBaseUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');

  const generateLink = () => {
    if (!baseUrl || !videoUrl) return;
    
    let videoId = '';
    try {
        if (videoUrl.includes('youtu.be/')) videoId = videoUrl.split('youtu.be/')[1].split('?')[0];
        else if (videoUrl.includes('v=')) videoId = videoUrl.split('v=')[1].split('&')[0];
    } catch (e) { videoId = 'unknown_video'; }

    const separator = baseUrl.includes('?') ? '&' : '?';
    const finalUrl = `${baseUrl}${separator}utm_source=youtube&utm_medium=social&utm_content=${videoId}&utm_campaign=organic`;
    
    setGeneratedLink(finalUrl);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    alert("Link Copied!");
  };

  return (
    <div className="space-y-8">
      
      {/* 1. BUILDER */}
      <div className="bg-[#0c0c0c] border border-zinc-800/50 p-8 rounded-[32px] shadow-inner relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <Youtube size={140} />
        </div>
        <div className="relative z-10">
            <h3 className="text-xl font-black uppercase italic text-white mb-1">YouTube Link <span className="text-red-500">Factory</span></h3>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-8">Create tracking links for your video descriptions</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">Typeform URL</label>
                    <input 
                        type="text" 
                        placeholder="https://form.typeform.com/to/xyz" 
                        value={baseUrl}
                        onChange={(e) => setBaseUrl(e.target.value)}
                        className="w-full bg-zinc-900/50 border border-zinc-800 text-xs font-bold text-white p-4 rounded-xl focus:outline-none focus:border-cyan-500 transition-all placeholder:text-zinc-700"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-red-500 tracking-widest">YouTube Video URL</label>
                    <input 
                        type="text" 
                        placeholder="https://youtu.be/..." 
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        className="w-full bg-zinc-900/50 border border-zinc-800 text-xs font-bold text-white p-4 rounded-xl focus:outline-none focus:border-red-500 transition-all placeholder:text-zinc-700"
                    />
                </div>
            </div>

            <button 
                onClick={generateLink}
                className="w-full bg-white text-black font-black uppercase tracking-widest py-4 rounded-xl hover:bg-cyan-400 hover:scale-[1.01] transition-all mb-6"
            >
                Generate Tracking Link
            </button>

            {generatedLink && (
                <div className="bg-zinc-900/80 border border-zinc-700 p-4 rounded-xl flex justify-between items-center animate-in fade-in slide-in-from-top-4">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <LinkIcon size={14} className="text-cyan-500 shrink-0" />
                        <code className="text-[10px] md:text-xs text-zinc-300 font-mono truncate">{generatedLink}</code>
                    </div>
                    <button onClick={copyToClipboard} className="ml-4 p-2 bg-cyan-500 hover:bg-cyan-400 text-black rounded-lg transition-colors">
                        <Copy size={16} />
                    </button>
                </div>
            )}
        </div>
      </div>

      {/* 2. ROI GRID */}
      <div className="flex items-center justify-between mt-12 mb-6">
        <h3 className="text-xl font-black uppercase italic text-white">Video ROI <span className="text-red-500">Intelligence</span></h3>
        <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase text-red-500 tracking-widest">Live Attribution</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videoStats.map((vid, i) => (
              <div key={i} className="bg-zinc-900/40 border border-zinc-800/50 rounded-3xl hover:border-red-500/30 transition-all group relative overflow-hidden flex flex-col">
                  
                  {/* THUMBNAIL AREA */}
                  <div className="h-40 w-full relative bg-zinc-800/50 overflow-hidden">
                      {vid.thumbnail ? (
                          <img src={vid.thumbnail} alt={vid.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-700"><ImageIcon size={40} /></div>
                      )}
                      <div className="absolute top-0 right-0 bg-black/80 px-3 py-1 rounded-bl-xl border-l border-b border-zinc-800 backdrop-blur-sm">
                          <span className="text-[10px] font-black text-white">#{i + 1}</span>
                      </div>
                  </div>

                  {/* CONTENT */}
                  <div className="p-6 flex-1 flex flex-col">
                      <h4 className="text-sm font-bold text-white mb-4 line-clamp-2 leading-tight min-h-[40px]" title={vid.title}>
                          {vid.title}
                      </h4>
                      
                      <div className="grid grid-cols-2 gap-4 border-t border-zinc-800/50 pt-4 mt-auto">
                          <div>
                              <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Pipeline</p>
                              <div className="flex items-center gap-2">
                                  <TrendingUp size={12} className="text-cyan-500" />
                                  <span className="text-lg font-black text-white">${(vid.revenue / 1000).toFixed(1)}k</span>
                              </div>
                          </div>
                          <div>
                              <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Cash</p>
                              <div className="flex items-center gap-2">
                                  <DollarSign size={12} className="text-green-500" />
                                  <span className="text-lg font-black text-white">${(vid.cash / 1000).toFixed(1)}k</span>
                              </div>
                          </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-zinc-800/50 flex justify-between items-center">
                           <span className="text-[9px] font-bold text-zinc-600 uppercase">Leads Generated</span>
                           <span className="text-xs font-black text-white">{vid.leads}</span>
                      </div>

                      <div className="mt-4 w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-red-600 to-red-400" style={{ width: `${(vid.cash / Math.max(...videoStats.map((v:any) => v.cash), 1)) * 100}%` }} />
                      </div>
                  </div>
              </div>
          ))}
      </div>
    </div>
  );
}

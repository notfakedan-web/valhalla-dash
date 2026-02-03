'use client';

import React, { useState } from 'react';
import { Copy, Link as LinkIcon, Youtube, TrendingUp, DollarSign } from 'lucide-react';

export default function UtmBuilder({ videoStats }: { videoStats: any[] }) {
  const [baseUrl, setBaseUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');

  const generateLink = () => {
    if (!baseUrl || !videoUrl) return;
    
    // Extract Video ID from various YouTube URL formats
    let videoId = '';
    try {
        if (videoUrl.includes('youtu.be/')) videoId = videoUrl.split('youtu.be/')[1].split('?')[0];
        else if (videoUrl.includes('v=')) videoId = videoUrl.split('v=')[1].split('&')[0];
    } catch (e) { videoId = 'unknown-video'; }

    // Clean base URL
    const cleanBase = baseUrl.split('?')[0];
    const finalUrl = `${cleanBase}#utm_source=youtube&utm_medium=social&utm_content=${videoId}`;
    setGeneratedLink(finalUrl);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    alert("Tracking Link Copied to Clipboard!");
  };

  return (
    <div className="space-y-8">
      
      {/* 1. THE BUILDER */}
      <div className="bg-[#0c0c0c] border border-zinc-800/50 p-8 rounded-[32px] shadow-inner relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10">
            <Youtube size={120} />
        </div>
        <div className="relative z-10">
            <h3 className="text-xl font-black uppercase italic text-white mb-1">UTM Link Factory</h3>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-8">Generate tracking links for your description</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-cyan-500 tracking-widest">Typeform URL</label>
                    <input 
                        type="text" 
                        placeholder="e.g., https://form.typeform.com/to/ExAmPle" 
                        value={baseUrl}
                        onChange={(e) => setBaseUrl(e.target.value)}
                        className="w-full bg-zinc-900/50 border border-zinc-800 text-xs font-bold text-white p-4 rounded-xl focus:outline-none focus:border-cyan-500 transition-all"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-red-500 tracking-widest">YouTube Video URL</label>
                    <input 
                        type="text" 
                        placeholder="e.g., https://youtu.be/dQw4w9WgXcQ" 
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        className="w-full bg-zinc-900/50 border border-zinc-800 text-xs font-bold text-white p-4 rounded-xl focus:outline-none focus:border-red-500 transition-all"
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
                    <code className="text-[10px] md:text-xs text-cyan-400 font-mono break-all">{generatedLink}</code>
                    <button onClick={copyToClipboard} className="ml-4 p-2 bg-zinc-800 hover:bg-white hover:text-black rounded-lg transition-colors">
                        <Copy size={16} />
                    </button>
                </div>
            )}
        </div>
      </div>

      {/* 2. ANALYTICS GRID */}
      <h3 className="text-xl font-black uppercase italic text-white mt-12 mb-6">Video ROI <span className="text-red-500">Intelligence</span></h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videoStats.map((vid, i) => (
              <div key={i} className="bg-zinc-900/40 border border-zinc-800/50 p-6 rounded-3xl hover:border-red-500/30 transition-all group">
                  <div className="flex justify-between items-start mb-6">
                      <div className="p-3 bg-red-500/10 rounded-xl text-red-500 group-hover:bg-red-500 group-hover:text-white transition-colors">
                          <Youtube size={20} />
                      </div>
                      <span className="text-[10px] font-black uppercase bg-zinc-800 text-zinc-400 px-2 py-1 rounded-md">
                          {vid.id || 'Unknown'}
                      </span>
                  </div>
                  
                  <h4 className="text-sm font-bold text-white mb-6 line-clamp-2 min-h-[40px]">{vid.title}</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Leads</p>
                          <div className="flex items-center gap-2">
                              <TrendingUp size={14} className="text-cyan-500" />
                              <span className="text-xl font-black text-white">{vid.leads}</span>
                          </div>
                      </div>
                      <div>
                          <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Pipeline</p>
                          <div className="flex items-center gap-2">
                              <DollarSign size={14} className="text-green-500" />
                              <span className="text-xl font-black text-white">${(vid.value / 1000).toFixed(1)}k</span>
                          </div>
                      </div>
                  </div>

                  {/* MINI BAR CHART */}
                  <div className="mt-6 w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-red-600 to-red-400" style={{ width: `${(vid.leads / Math.max(...videoStats.map((v:any) => v.leads))) * 100}%` }} />
                  </div>
              </div>
          ))}
      </div>

    </div>
  );
}

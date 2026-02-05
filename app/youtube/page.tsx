"use client";

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  Video, 
  RefreshCw, 
  Link, 
  Check 
} from 'lucide-react';

export default function Page() {
  // --- STATE ---
  const [channelId, setChannelId] = useState(''); 
  const [typeformUrl, setTypeformUrl] = useState(''); 
  const [videos, setVideos] = useState<any[]>([]); // Typed as any[] for flexibility
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // --- CONFIG ---
  // Replace 'YOUR_API_KEY_HERE' with your actual YouTube Data API Key
  const API_KEY = 'YOUR_API_KEY_HERE';

  // --- HELPERS ---
  const handleCopyLink = (videoId: string) => {
    // Default URL if none provided
    const baseUrl = typeformUrl || "https://form.typeform.com/to/example";
    const separator = baseUrl.includes('?') ? '&' : '?';
    
    // Construct the link with the video ID as utm_content
    const link = `${baseUrl}${separator}utm_source=youtube&utm_medium=organic&utm_content=${videoId}`;
    
    navigator.clipboard.writeText(link);
    setCopiedId(videoId);
    
    // Reset "Copied" status after 2 seconds
    setTimeout(() => setCopiedId(null), 2000);
  };

  const fetchChannelData = async () => {
    if (!channelId) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Get Channel Uploads Playlist ID
      const channelRes = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${API_KEY}`
      );
      const channelJson = await channelRes.json();
      
      if (!channelJson.items?.length) throw new Error('Channel not found');
      
      const uploadsId = channelJson.items[0].contentDetails.relatedPlaylists.uploads;

      // 2. Get Videos from Uploads Playlist
      const videosRes = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsId}&maxResults=9&key=${API_KEY}`
      );
      const videosJson = await videosRes.json();

      if (!videosJson.items?.length) {
        setVideos([]);
        return;
      }

      // 3. Get Video Stats (Views, Comments)
      const videoIds = videosJson.items.map((item: any) => item.contentDetails.videoId).join(',');
      const statsRes = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds}&key=${API_KEY}`
      );
      const statsJson = await statsRes.json();

      // Format data
      const formattedVideos = statsJson.items.map((item: any) => ({
        id: item.id,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.medium.url,
        publishedAt: item.snippet.publishedAt,
        viewCount: item.statistics.viewCount || 0,
        commentCount: item.statistics.commentCount || 0
      }));

      setVideos(formattedVideos);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch data. Check API Key or Channel ID.');
    } finally {
      setLoading(false);
    }
  };

  // --- ROI CALCULATIONS ---
  const totalViews = videos.reduce((acc, curr) => acc + parseInt(curr.viewCount), 0);
  // Est. Leads = 0.1% of views (Adjust this logic as needed)
  const estLeads = Math.floor(totalViews * 0.001); 

  return (
    <div className="p-6 bg-black min-h-screen text-gray-100 font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Video className="text-red-500" />
            YouTube ROI Dashboard
          </h1>
          <p className="text-gray-400 text-sm mt-1">Track content performance & generate funnel links.</p>
        </div>

        <div className="flex flex-col gap-2 w-full md:w-auto">
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Channel ID (UC...)" 
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm w-full md:w-48 focus:border-red-500 outline-none"
            />
             <input 
              type="text" 
              placeholder="Typeform URL" 
              value={typeformUrl}
              onChange={(e) => setTypeformUrl(e.target.value)}
              className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm w-full md:w-48 focus:border-red-500 outline-none"
            />
            <button 
              onClick={fetchChannelData}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {loading ? <RefreshCw className="animate-spin w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
              Fetch
            </button>
          </div>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-sm">
          {error}
        </div>
      )}

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 p-5 rounded-xl">
          <div className="flex items-center gap-3 text-gray-400 mb-2">
            <BarChart3 size={18} />
            <span className="text-sm font-medium">Total Views</span>
          </div>
          <div className="text-2xl font-bold text-white">{totalViews.toLocaleString()}</div>
        </div>
        
        <div className="bg-gray-900 border border-gray-800 p-5 rounded-xl">
          <div className="flex items-center gap-3 text-gray-400 mb-2">
            <Users size={18} />
            <span className="text-sm font-medium">Est. Leads (0.1%)</span>
          </div>
          <div className="text-2xl font-bold text-blue-400">{estLeads}</div>
        </div>

        <div className="bg-gray-900 border border-gray-800 p-5 rounded-xl">
          <div className="flex items-center gap-3 text-gray-400 mb-2">
            <TrendingUp size={18} />
            <span className="text-sm font-medium">Est. Value ($500/lead)</span>
          </div>
          <div className="text-2xl font-bold text-green-400">
            ${(estLeads * 500).toLocaleString()}
          </div>
        </div>
      </div>

      {/* VIDEO LIST */}
      <h2 className="text-lg font-semibold mb-4 text-white">Recent Uploads</h2>
      
      {videos.length === 0 && !loading && (
        <div className="text-gray-500 text-center py-12 bg-gray-900/50 rounded-xl border border-dashed border-gray-800">
          Enter a Channel ID and Typeform URL above to load videos.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos.map((video) => (
          <div 
            key={video.id} 
            className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col hover:border-gray-700 transition-all duration-200"
          >
            {/* Header: Thumbnail & Title */}
            <div className="flex gap-4 mb-4">
              <div className="relative w-28 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-800 group">
                <img 
                  src={video.thumbnail} 
                  alt={video.title} 
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-white line-clamp-2 mb-1" title={video.title}>
                  {video.title}
                </h3>
                <p className="text-xs text-gray-500 font-mono">
                  {new Date(video.publishedAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-gray-950/50 rounded-lg p-2 border border-gray-800/50">
                <div className="text-xs text-gray-500 mb-1">Views</div>
                <div className="text-sm font-semibold text-gray-200">
                  {parseInt(video.viewCount).toLocaleString()}
                </div>
              </div>
              <div className="bg-gray-950/50 rounded-lg p-2 border border-gray-800/50">
                <div className="text-xs text-gray-500 mb-1">Comments</div>
                <div className="text-sm font-semibold text-gray-200">
                  {parseInt(video.commentCount).toLocaleString()}
                </div>
              </div>
            </div>

            {/* COPY LINK BUTTON */}
            <div className="mt-auto">
              <button
                onClick={() => handleCopyLink(video.id)}
                className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-medium transition-all duration-200 border ${
                  copiedId === video.id 
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                    : "bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-750 hover:text-gray-200"
                }`}
              >
                {copiedId === video.id ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Link className="w-3.5 h-3.5" />
                    <span>Copy Funnel Link</span>
                  </>
                )}
              </button>
              <div className="text-[10px] text-gray-600 text-center mt-2 font-mono">
                utm_content={video.id}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

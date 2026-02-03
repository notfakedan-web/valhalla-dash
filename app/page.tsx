export const dynamic = 'force-dynamic';

import React from 'react';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import Filters from './Filters';

async function getSheetData() {
  try {
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(process.env.SHEET_ID!, serviceAccountAuth);
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];
    const rows = await sheet.getRows();

    return rows.map(row => {
      const getVal = (search: string) => {
          const foundKey = sheet.headerValues.find(h => h.toLowerCase().includes(search.toLowerCase()));
          return foundKey ? row.get(foundKey) : '';
      };
      
      return {
        timestamp: getVal('Timestamp') || '',
        date: getVal('Date Call Was Taken') || '',
        closer: getVal('Closer Name') || 'N/A',
        setter: getVal('Setter Name') || 'N/A',
        prospect: getVal('Prospect Name') || 'N/A',
        outcome: getVal('Call Outcome') || 'N/A',
        platform: getVal('What platform did') || 'Other',
        cash: parseFloat(getVal('Cash Collected')?.toString().replace(/[$, ]/g, '')) || 0,
        revenue: parseFloat(getVal('Revenue Generated')?.toString().replace(/[$, ]/g, '')) || 0,
      };
    });
  } catch (error) { console.error(error); return []; }
}

export default async function ValhallaDashboard({ searchParams }: { searchParams: Promise<any> }) {
  const params = await searchParams;
  const allRawData = await getSheetData();

  const start = params.start ? new Date(params.start) : null;
  const end = params.end ? new Date(params.end) : null;
  if (end) end.setHours(23, 59, 59, 999);

  const accountingData = allRawData.filter(d => {
    if (!d.timestamp) return false;
    const tDate = new Date(d.timestamp);
    if (start && tDate < start) return false;
    if (end && tDate > end) return false;
    return true;
  });

  const performanceData = allRawData.filter(d => {
    if (!d.date) return false;
    const dDate = new Date(d.date);
    if (start && dDate < start) return false;
    if (end && dDate > end) return false;
    if (params.platform && d.platform !== params.platform) return false;
    if (params.closer && d.closer !== params.closer) return false;
    if (params.setter && d.setter !== params.setter) return false;
    return true;
  });

  const totalCash = accountingData.reduce((acc, curr) => acc + curr.cash, 0);

  const appointments = performanceData.filter(d => {
    const out = d.outcome.toLowerCase();
    const prospect = d.prospect.toLowerCase();
    const isRecurring = out.includes('mrr') || out.includes('downsell');
    const isTest = prospect.includes('test');
    return !isRecurring && !isTest;
  });

  const totalRev = appointments.reduce((acc, curr) => acc + curr.revenue, 0);
  const newSaleCash = appointments.reduce((acc, curr) => acc + curr.cash, 0);

  const callsDue = appointments.length;
  const callsTaken = appointments.filter(d => 
    !['no show', 'rescheduled', 'cancelled'].some(x => d.outcome.toLowerCase().includes(x))
  ).length;

  const callsClosed = appointments.filter(d => 
    ['closed', 'deposit collected', 'paid', 'full pay'].some(x => d.outcome.toLowerCase().includes(x))
  ).length;

  const showRate = callsDue > 0 ? (callsTaken / callsDue) * 100 : 0;
  const closeRate = callsTaken > 0 ? (callsClosed / callsTaken) * 100 : 0;
  const avgCashCall = callsTaken > 0 ? newSaleCash / callsTaken : 0;
  const avgCashClose = callsClosed > 0 ? newSaleCash / callsClosed : 0;

  const dailyMap: Record<string, number> = {};
  accountingData.forEach(d => {
    const day = new Date(d.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    dailyMap[day] = (dailyMap[day] || 0) + d.cash;
  });
  const trend = Object.entries(dailyMap).sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());

  const platforms = Array.from(new Set(allRawData.map(d => d.platform))).filter(Boolean) as string[];
  const closers = Array.from(new Set(allRawData.map(d => d.closer))).filter(Boolean) as string[];
  const setters = Array.from(new Set(allRawData.map(d => d.setter))).filter(Boolean) as string[];

  const platformBreakdown: Record<string, number> = {};
  performanceData.forEach(d => {
    const platform = d.platform || 'Other';
    platformBreakdown[platform] = (platformBreakdown[platform] || 0) + 1;
  });
  
  const platformData = Object.entries(platformBreakdown)
    .map(([name, count]) => ({
      name,
      count,
      percentage: performanceData.length > 0 ? (count / performanceData.length) * 100 : 0
    }))
    .sort((a, b) => b.count - a.count);

  const colors = ['#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#6366f1', '#84cc16'];

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/30 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-500/30 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative max-w-[1800px] mx-auto px-8 py-12">
        {/* Header with ValhallaOS Branding */}
        <div className="mb-16">
          <div className="flex items-center gap-5 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 via-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-2xl shadow-purple-500/40">
              <svg className="w-7 h-7 text-black" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 18c-4.02-1-7-5.42-7-9.4V8.3l7-3.11 7 3.11v2.3c0 3.98-2.98 8.4-7 9.4z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-5xl font-black tracking-tight" style={{ fontFamily: "'Space Mono', monospace" }}>
                VALHALLA<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600">OS</span>
              </h1>
              <p className="text-sm text-zinc-500 font-medium tracking-wide" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Sales Intelligence & Performance Tracking System
              </p>
            </div>
          </div>
        </div>
        
        <Filters platforms={platforms} closers={closers} setters={setters} />

        {/* Hero Stats - Cash & Revenue */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="relative group overflow-hidden bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl p-10 shadow-2xl shadow-cyan-900/50">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">💰</span>
                <p className="text-xs font-black text-cyan-50 uppercase tracking-[0.3em]" style={{ fontFamily: "'Space Mono', monospace" }}>CASH COLLECTED</p>
              </div>
              <h2 className="text-6xl font-black tabular-nums mb-3" style={{ fontFamily: "'Space Mono', monospace" }}>${totalCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
              <div className="h-1.5 w-40 bg-white/40 rounded-full" />
            </div>
          </div>
          
          <div className="relative group overflow-hidden bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-10 shadow-2xl shadow-purple-900/50">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">📈</span>
                <p className="text-xs font-black text-purple-50 uppercase tracking-[0.3em]" style={{ fontFamily: "'Space Mono', monospace" }}>REVENUE GENERATED</p>
              </div>
              <h2 className="text-6xl font-black tabular-nums mb-3" style={{ fontFamily: "'Space Mono', monospace" }}>${totalRev.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
              <div className="h-1.5 w-40 bg-white/40 rounded-full" />
            </div>
          </div>
        </div>

        {/* Performance Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <MetricCard label="Show Rate" value={`${showRate.toFixed(1)}%`} icon="📞" color="from-cyan-500 to-blue-600" />
          <MetricCard label="Close Rate" value={`${closeRate.toFixed(1)}%`} icon="✅" color="from-green-500 to-emerald-600" />
          <MetricCard label="Calls Due" value={callsDue} icon="📋" color="from-amber-500 to-orange-600" />
          <MetricCard label="Calls Taken" value={callsTaken} icon="🎯" color="from-blue-500 to-indigo-600" />
          <MetricCard label="Calls Closed" value={callsClosed} icon="🔥" color="from-purple-500 to-pink-600" />
        </div>

        {/* Average Cash Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-cyan-500/30 rounded-2xl p-8 hover:border-cyan-400/60 transition-all shadow-xl hover:shadow-cyan-500/20 group">
            <p className="text-xs font-black text-zinc-500 uppercase tracking-[0.25em] mb-4" style={{ fontFamily: "'Space Mono', monospace" }}>💵 AVG. CASH PER CALL</p>
            <h2 className="text-5xl font-black text-cyan-400 tabular-nums group-hover:text-cyan-300 transition-colors" style={{ fontFamily: "'Space Mono', monospace" }}>${avgCashCall.toFixed(2)}</h2>
          </div>
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-purple-500/30 rounded-2xl p-8 hover:border-purple-400/60 transition-all shadow-xl hover:shadow-purple-500/20 group">
            <p className="text-xs font-black text-zinc-500 uppercase tracking-[0.25em] mb-4" style={{ fontFamily: "'Space Mono', monospace" }}>💎 AVG. CASH PER CLOSE</p>
            <h2 className="text-5xl font-black text-purple-400 tabular-nums group-hover:text-purple-300 transition-colors" style={{ fontFamily: "'Space Mono', monospace" }}>${avgCashClose.toFixed(2)}</h2>
          </div>
        </div>

        {/* Platform Traffic Breakdown */}
        <div className="bg-gradient-to-br from-zinc-900/90 to-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-3xl p-12 mb-10 shadow-2xl">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="text-2xl font-black uppercase tracking-wide" style={{ fontFamily: "'Space Mono', monospace" }}>Traffic Sources</h3>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Pie Chart */}
            <div className="flex justify-center">
              <div className="relative w-96 h-96">
                <svg viewBox="0 0 200 200" className="transform -rotate-90 drop-shadow-2xl">
                  {platformData.map((item, i) => {
                    const prevPercentage = platformData.slice(0, i).reduce((sum, p) => sum + p.percentage, 0);
                    const percentage = item.percentage;
                    const startAngle = (prevPercentage / 100) * 360;
                    const endAngle = ((prevPercentage + percentage) / 100) * 360;
                    
                    const x1 = 100 + 88 * Math.cos((startAngle * Math.PI) / 180);
                    const y1 = 100 + 88 * Math.sin((startAngle * Math.PI) / 180);
                    const x2 = 100 + 88 * Math.cos((endAngle * Math.PI) / 180);
                    const y2 = 100 + 88 * Math.sin((endAngle * Math.PI) / 180);
                    
                    const largeArc = percentage > 50 ? 1 : 0;
                    const pathData = `M 100 100 L ${x1} ${y1} A 88 88 0 ${largeArc} 1 ${x2} ${y2} Z`;
                    
                    return (
                      <path
                        key={i}
                        d={pathData}
                        fill={colors[i % colors.length]}
                        className="hover:opacity-80 transition-all cursor-pointer"
                        style={{ 
                          filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.5))',
                          strokeWidth: '2',
                          stroke: '#000'
                        }}
                      />
                    );
                  })}
                  
                  {/* Center Circle */}
                  <circle cx="100" cy="100" r="55" fill="#0a0a0a" stroke="#18181b" strokeWidth="3" />
                </svg>
                
                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-xs font-black text-zinc-600 uppercase tracking-[0.2em]" style={{ fontFamily: "'Space Mono', monospace" }}>TOTAL</p>
                  <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600 my-1" style={{ fontFamily: "'Space Mono', monospace" }}>{performanceData.length}</p>
                  <p className="text-xs font-bold text-zinc-600 uppercase">CALLS</p>
                </div>
              </div>
            </div>
            
            {/* Legend */}
            <div className="space-y-4">
              {platformData.map((item, i) => (
                <div key={i} className="flex items-center justify-between gap-6 bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 hover:bg-zinc-900 transition-all group cursor-pointer">
                  <div className="flex items-center gap-5">
                    <div 
                      className="w-6 h-6 rounded-lg flex-shrink-0 shadow-xl group-hover:scale-110 transition-transform" 
                      style={{ backgroundColor: colors[i % colors.length] }}
                    />
                    <span className="text-lg font-bold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>{item.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-white tabular-nums" style={{ fontFamily: "'Space Mono', monospace" }}>{item.count}</p>
                    <p className="text-xs font-bold text-zinc-500">{item.percentage.toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cash Flow Timeline */}
        <div className="bg-gradient-to-br from-zinc-900/90 to-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-3xl p-12 shadow-2xl">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-2xl">📈</span>
            </div>
            <h3 className="text-2xl font-black uppercase tracking-wide" style={{ fontFamily: "'Space Mono', monospace" }}>Cash Flow Timeline</h3>
          </div>
          
          <div className="h-[400px] flex items-end gap-2 px-6">
            {trend.map(([date, cash], i) => {
              const maxCash = Math.max(...trend.map(([_, c]) => c));
              const heightPercentage = maxCash > 0 ? (cash / maxCash) * 100 : 0;
              const barHeight = Math.max(16, (heightPercentage / 100) * 330);
              
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-5 group">
                  <div className="relative w-full">
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all text-sm font-black text-cyan-400 whitespace-nowrap bg-zinc-900 px-4 py-2 rounded-xl border border-cyan-500/50 shadow-xl" style={{ fontFamily: "'Space Mono', monospace" }}>
                      ${(cash/1000).toFixed(1)}K
                    </div>
                    <div 
                      className="w-full bg-gradient-to-t from-cyan-500 via-cyan-400 to-cyan-300 rounded-t-xl group-hover:from-cyan-400 group-hover:via-cyan-300 group-hover:to-cyan-200 transition-all shadow-2xl shadow-cyan-500/30 group-hover:shadow-cyan-400/50" 
                      style={{ height: `${barHeight}px` }} 
                    />
                  </div>
                  <span className="text-[11px] font-black text-zinc-600 uppercase whitespace-nowrap" style={{ fontFamily: "'Space Mono', monospace" }}>{date}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-10 border-t border-zinc-800/50 text-center">
          <p className="text-sm text-zinc-600 font-medium" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Powered by <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600 font-black">ValhallaOS</span> • Sales Intelligence Platform v1.0
          </p>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon, color }: { label: string, value: any, icon: string, color: string }) {
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${color} rounded-xl p-6 shadow-xl hover:scale-105 transition-all group cursor-pointer`}>
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">{icon}</span>
          <p className="text-[10px] font-black text-white/80 uppercase tracking-wider" style={{ fontFamily: "'Space Mono', monospace" }}>{label}</p>
        </div>
        <h2 className="text-3xl font-black text-white tracking-tight" style={{ fontFamily: "'Space Mono', monospace" }}>{value}</h2>
      </div>
    </div>
  );
}

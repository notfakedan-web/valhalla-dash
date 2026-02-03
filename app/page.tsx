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

  const colors = ['#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7'];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-[1600px] mx-auto px-8 py-10">
        {/* Header */}
        <div className="mb-12 pb-6 border-b border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-1">
                VALHALLA<span className="text-green-500">OS</span>
              </h1>
              <p className="text-sm text-zinc-500 font-medium">Sales Performance Dashboard</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <p className="text-xs font-bold text-green-500 uppercase tracking-wide">Live</p>
            </div>
          </div>
        </div>
        
        <Filters platforms={platforms} closers={closers} setters={setters} />

        {/* Main Cash & Revenue Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-8 shadow-2xl">
            <p className="text-xs font-bold text-green-100 uppercase tracking-widest mb-2">Cash Collected</p>
            <h2 className="text-6xl font-bold tabular-nums text-white">${totalCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
          </div>
          
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 shadow-xl">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Total Revenue</p>
            <h2 className="text-6xl font-bold tabular-nums text-white">${totalRev.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <MetricCard label="Show Rate" value={`${showRate.toFixed(1)}%`} />
          <MetricCard label="Close Rate" value={`${closeRate.toFixed(1)}%`} />
          <MetricCard label="Calls Due" value={callsDue} />
          <MetricCard label="Calls Taken" value={callsTaken} />
          <MetricCard label="Calls Closed" value={callsClosed} highlight />
        </div>

        {/* Average Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-green-500/40 transition-all">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Avg. Cash / Call</p>
            <h2 className="text-4xl font-bold text-green-500 tabular-nums">${avgCashCall.toFixed(2)}</h2>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-green-500/40 transition-all">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Avg. Cash / Close</p>
            <h2 className="text-4xl font-bold text-green-500 tabular-nums">${avgCashClose.toFixed(2)}</h2>
          </div>
        </div>

        {/* Platform Breakdown */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-10 mb-8">
          <h3 className="text-lg font-bold uppercase tracking-wide mb-8">Traffic Sources</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Pie Chart */}
            <div className="flex justify-center">
              <div className="relative w-80 h-80">
                <svg viewBox="0 0 200 200" className="transform -rotate-90">
                  {platformData.map((item, i) => {
                    const prevPercentage = platformData.slice(0, i).reduce((sum, p) => sum + p.percentage, 0);
                    const percentage = item.percentage;
                    const startAngle = (prevPercentage / 100) * 360;
                    const endAngle = ((prevPercentage + percentage) / 100) * 360;
                    
                    const x1 = 100 + 85 * Math.cos((startAngle * Math.PI) / 180);
                    const y1 = 100 + 85 * Math.sin((startAngle * Math.PI) / 180);
                    const x2 = 100 + 85 * Math.cos((endAngle * Math.PI) / 180);
                    const y2 = 100 + 85 * Math.sin((endAngle * Math.PI) / 180);
                    
                    const largeArc = percentage > 50 ? 1 : 0;
                    const pathData = `M 100 100 L ${x1} ${y1} A 85 85 0 ${largeArc} 1 ${x2} ${y2} Z`;
                    
                    return (
                      <path
                        key={i}
                        d={pathData}
                        fill={colors[i % colors.length]}
                        className="hover:opacity-80 transition-opacity"
                        stroke="#0a0a0a"
                        strokeWidth="2"
                      />
                    );
                  })}
                  
                  <circle cx="100" cy="100" r="50" fill="#0a0a0a" stroke="#18181b" strokeWidth="2" />
                </svg>
                
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-xs font-bold text-zinc-600 uppercase">Total</p>
                  <p className="text-5xl font-bold text-white">{performanceData.length}</p>
                  <p className="text-xs font-medium text-zinc-600">CALLS</p>
                </div>
              </div>
            </div>
            
            {/* Legend */}
            <div className="space-y-3">
              {platformData.map((item, i) => (
                <div key={i} className="flex items-center justify-between gap-4 bg-zinc-800/50 rounded-lg p-4 hover:bg-zinc-800 transition-all">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-4 h-4 rounded flex-shrink-0" 
                      style={{ backgroundColor: colors[i % colors.length] }}
                    />
                    <span className="text-base font-medium text-white">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-white">{item.count}</p>
                    <p className="text-xs text-zinc-500">{item.percentage.toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cash Flow Chart */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-10">
          <h3 className="text-lg font-bold uppercase tracking-wide mb-10">Cash Flow</h3>
          
          <div className="h-[350px] flex items-end gap-2">
            {trend.map(([date, cash], i) => {
              const maxCash = Math.max(...trend.map(([_, c]) => c));
              const heightPercentage = maxCash > 0 ? (cash / maxCash) * 100 : 0;
              const barHeight = Math.max(12, (heightPercentage / 100) * 290);
              
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                  <div className="relative w-full">
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold text-green-400 whitespace-nowrap bg-zinc-800 px-3 py-1.5 rounded-lg">
                      ${(cash/1000).toFixed(1)}K
                    </div>
                    <div 
                      className="w-full bg-green-500 rounded-t hover:bg-green-400 transition-colors" 
                      style={{ height: `${barHeight}px` }} 
                    />
                  </div>
                  <span className="text-[10px] font-medium text-zinc-600 uppercase">{date}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 pt-8 border-t border-zinc-800 text-center">
          <p className="text-xs text-zinc-600">ValhallaOS Sales Intelligence v1.0</p>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, highlight }: { label: string, value: any, highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-6 transition-all ${highlight ? 'bg-green-500/10 border border-green-500/30' : 'bg-zinc-900 border border-zinc-800'}`}>
      <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">{label}</p>
      <h2 className={`text-3xl font-bold tabular-nums ${highlight ? 'text-green-500' : 'text-white'}`}>{value}</h2>
    </div>
  );
}

// app/page.tsx
import React from 'react';
import { TrendingUp, Users, DollarSign, Calendar, BarChart3, ArrowUpRight } from 'lucide-react';

export default function ValhallaDashboard() {
  // Mock data - In the next step, we connect this to your GOOGLE_PRIVATE_KEY
  const stats = [
    { label: 'CASH COLLECTED', value: '$12,450.00', trend: '+14.2%', color: 'bg-cyan-500' },
    { label: 'REVENUE GENERATED', value: '$45,200.00', trend: '+8.1%', color: 'bg-zinc-900' },
    { label: 'CLOSE RATE', value: '24.5%', trend: '+2.4%', color: 'bg-zinc-900' },
    { label: 'SHOW RATE', value: '68.2%', trend: '-1.2%', color: 'bg-zinc-900' },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12 font-sans">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tighter italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
              VALHALLA <span className="text-zinc-500 font-light not-italic tracking-normal">DASHBOARD</span>
            </h1>
            <p className="text-zinc-500 mt-1 uppercase text-xs tracking-[0.2em] font-bold">Performance Intelligence Tier 1</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {['Platform', 'Coach', 'Closer', 'Setter'].map((filter) => (
              <select key={filter} className="bg-zinc-900 border border-zinc-800 text-sm rounded-lg px-4 py-2 outline-none focus:ring-2 ring-cyan-500/50 transition-all">
                <option>Select {filter}</option>
              </select>
            ))}
          </div>
        </header>

        {/* Top KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((s) => (
            <div key={s.label} className={`${s.color} p-8 rounded-3xl border border-white/5 relative overflow-hidden group hover:scale-[1.02] transition-transform cursor-default`}>
              <div className="relative z-10">
                <p className="text-[10px] font-black tracking-[0.2em] opacity-60 mb-2">{s.label}</p>
                <h2 className="text-3xl font-bold tracking-tight">{s.value}</h2>
                <span className={`inline-flex items-center mt-3 px-2 py-1 rounded-full text-[10px] font-bold ${s.trend.startsWith('+') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {s.trend} <ArrowUpRight size={10} className="ml-1" />
                </span>
              </div>
              <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <DollarSign size={120} />
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2 bg-zinc-900/40 border border-zinc-800/50 rounded-3xl p-8 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <TrendingUp className="text-cyan-500" size={20} /> Cash Collected Trend
              </h3>
              <div className="flex gap-2">
                <div className="w-3 h-3 bg-cyan-500 rounded-full"></div>
                <span className="text-[10px] font-bold opacity-50 uppercase">Current Month</span>
              </div>
            </div>
            {/* Chart Placeholder - You'll add Recharts here later */}
            <div className="h-[300px] w-full bg-zinc-800/20 rounded-2xl border border-dashed border-zinc-700 flex items-center justify-center text-zinc-600 text-xs font-bold uppercase tracking-widest">
              Visualizing Real-time Data Feed...
            </div>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-3xl p-8 backdrop-blur-sm">
            <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
              <Users className="text-blue-500" size={20} /> Lead Breakdown
            </h3>
            <div className="space-y-6">
              {[
                { label: 'Instagram', val: 65, color: 'bg-cyan-500' },
                { label: 'Facebook', val: 20, color: 'bg-blue-600' },
                { label: 'Cold Outbound', val: 15, color: 'bg-zinc-700' },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs font-bold mb-2 uppercase opacity-60">
                    <span>{item.label}</span>
                    <span>{item.val}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className={`${item.color} h-full`} style={{ width: `${item.val}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Data Table Area */}
        <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-3xl overflow-hidden backdrop-blur-sm">
          <div className="p-6 border-b border-zinc-800">
            <h3 className="font-bold uppercase tracking-widest text-xs">Recent Battle Log</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="text-zinc-500 border-b border-zinc-800">
                  <th className="p-4 font-medium">DATE</th>
                  <th className="p-4 font-medium">CLOSER</th>
                  <th className="p-4 font-medium">PROSPECT</th>
                  <th className="p-4 font-medium">OUTCOME</th>
                  <th className="p-4 font-medium">CASH</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 text-zinc-400">02/02/26</td>
                    <td className="p-4 font-bold text-cyan-500">Daniel B.</td>
                    <td className="p-4">Alex Thompson</td>
                    <td className="p-4 text-xs">
                      <span className="px-2 py-1 bg-green-500/10 text-green-400 rounded-md border border-green-500/20 uppercase font-black">Closed</span>
                    </td>
                    <td className="p-4 font-mono font-bold">$2,500.00</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

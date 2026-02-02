'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Calendar } from 'lucide-react';

export default function DateRangePicker() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get current dates from URL or default to empty
  const start = searchParams.get('start') || '';
  const end = searchParams.get('end') || '';

  const handleDateChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Update the URL without a full page reload
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 bg-zinc-900/50 p-2 rounded-2xl border border-zinc-800">
      <div className="flex items-center gap-2 px-3">
        <Calendar size={16} className="text-cyan-500" />
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Filter Range</span>
      </div>
      
      <input
        type="date"
        value={start}
        onChange={(e) => handleDateChange('start', e.target.value)}
        className="bg-zinc-800 text-xs font-bold text-white px-3 py-2 rounded-xl outline-none border border-zinc-700 focus:border-cyan-500 transition-all cursor-pointer"
      />
      
      <span className="text-zinc-600 font-bold text-xs">—</span>
      
      <input
        type="date"
        value={end}
        onChange={(e) => handleDateChange('end', e.target.value)}
        className="bg-zinc-800 text-xs font-bold text-white px-3 py-2 rounded-xl outline-none border border-zinc-700 focus:border-cyan-500 transition-all cursor-pointer"
      />

      {(start || end) && (
        <button 
          onClick={() => router.push('/')}
          className="text-[9px] font-black text-zinc-500 hover:text-white uppercase px-2"
        >
          Clear
        </button>
      )}
    </div>
  );
}

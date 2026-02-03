'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import CalendarPicker from './CalendarPicker';

export default function Filters({ platforms, closers, setters }: { platforms: string[], closers: string[], setters: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const update = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
    router.push(`?${params.toString()}`);
  };

  const Select = ({ label, options, param }: { label: string, options: string[], param: string }) => (
    <div className="relative">
      <select 
        onChange={(e) => update(param, e.target.value)}
        value={searchParams.get(param) || ''}
        className="appearance-none bg-[#0d0d0d] border border-zinc-800 text-[11px] font-bold text-zinc-400 pl-4 pr-10 py-2.5 rounded-xl focus:outline-none focus:border-zinc-600 transition-all cursor-pointer min-w-[150px]"
      >
        <option value="">Select {label}</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-700 pointer-events-none" size={12} />
    </div>
  );

  return (
    <div className="flex flex-wrap gap-3 items-center mb-8">
      <CalendarPicker />
      <Select label="Platform" options={platforms} param="platform" />
      <Select label="Closer" options={closers} param="closer" />
      <Select label="Setter" options={setters} param="setter" />
      <button onClick={() => router.push('/')} className="px-4 py-2.5 text-[10px] font-black text-zinc-600 hover:text-white uppercase tracking-tighter transition-all">Reset</button>
    </div>
  );
}

"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Youtube, Menu, X } from 'lucide-react';

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="lg:hidden sticky top-0 z-[999] bg-[#050505] border-b border-zinc-900/50">
      <div className="flex items-center justify-between p-4">
        {/* Mobile Logo Text */}
        <span className="text-sm font-black tracking-widest text-white uppercase">VALHALLA OS</span>

        {/* Hamburger Button */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-zinc-400 hover:text-white bg-zinc-900/50 rounded-lg border border-zinc-800"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 bg-[#050505] border-b border-zinc-800 shadow-2xl p-4 flex flex-col gap-2 h-screen animate-in slide-in-from-top-5">
            <Link 
                href="/" 
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-4 px-4 py-4 rounded-xl transition-all border ${pathname === '/' ? 'bg-zinc-900 border-zinc-700 text-white' : 'border-transparent text-zinc-500'}`}
            >
                <LayoutDashboard size={18} className={pathname === '/' ? 'text-cyan-400' : ''} />
                <span className="text-sm font-bold uppercase tracking-widest">Dashboard</span>
            </Link>

            <Link 
                href="/leads" 
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-4 px-4 py-4 rounded-xl transition-all border ${pathname === '/leads' ? 'bg-zinc-900 border-zinc-700 text-white' : 'border-transparent text-zinc-500'}`}
            >
                <Users size={18} className={pathname === '/leads' ? 'text-cyan-400' : ''} />
                <span className="text-sm font-bold uppercase tracking-widest">Lead Flow</span>
            </Link>

            <Link 
                href="/youtube" 
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-4 px-4 py-4 rounded-xl transition-all border ${pathname === '/youtube' ? 'bg-zinc-900 border-zinc-700 text-white' : 'border-transparent text-zinc-500'}`}
            >
                <Youtube size={18} className={pathname === '/youtube' ? 'text-red-500' : ''} />
                <span className="text-sm font-bold uppercase tracking-widest">YouTube ROI</span>
            </Link>
        </div>
      )}
    </div>
  );
}

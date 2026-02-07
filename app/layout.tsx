import './globals.css'
import Link from 'next/link';
import Image from 'next/image'; // Added this import
import { LayoutDashboard, Users, Youtube } from 'lucide-react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#050505] text-zinc-100 flex min-h-screen font-sans selection:bg-cyan-500/30">
        
        {/* SIDEBAR: Valhalla OS Theme */}
        <aside className="w-64 border-r border-zinc-900/50 flex-col justify-between hidden lg:flex shrink-0 bg-[#050505] fixed h-full z-50">
          
          {/* TOP SECTION */}
          <div className="p-6">
            
            {/* --- NEW LOGO BRANDING --- */}
            <div className="flex flex-col items-center gap-4 mb-10 mt-4">
              {/* Logo Container */}
              <div className="relative w-24 h-24 opacity-90 hover:opacity-100 transition-opacity">
                <Image 
                  src="/valhalla-logo.png" 
                  alt="Valhalla OS" 
                  fill 
                  className="object-contain"
                  priority 
                />
              </div>
              
              {/* Text Branding */}
              <h1 className="text-sm font-bold tracking-[0.25em] text-white uppercase text-center">
                VALHALLA OS
              </h1>
            </div>
            
            {/* NAVIGATION */}
            <nav className="flex flex-col gap-2">
              <p className="px-4 text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-2 mt-4">Main Terminal</p>
              
              <Link href="/" className="group flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-zinc-900/40 transition-all border border-transparent hover:border-zinc-800/50">
                  <LayoutDashboard size={16} className="text-zinc-600 group-hover:text-cyan-400 transition-colors" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-white transition-colors">Dashboard</span>
              </Link>
              
              <Link href="/leads" className="group flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-zinc-900/40 transition-all border border-transparent hover:border-zinc-800/50">
                  <Users size={16} className="text-zinc-600 group-hover:text-cyan-400 transition-colors" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-white transition-colors">Lead Flow</span>
              </Link>

              <Link href="/youtube" className="group flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-zinc-900/40 transition-all border border-transparent hover:border-zinc-800/50">
                  <Youtube size={16} className="text-zinc-600 group-hover:text-red-500 transition-colors" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-white transition-colors">YouTube ROI</span>
              </Link>
            </nav>
          </div>

          {/* BOTTOM SECTION (Status) */}
          <div className="p-8 border-t border-zinc-900/50">
             <div className="bg-zinc-900/30 rounded-xl p-4 border border-zinc-800/50">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">System Online</span>
                </div>
                <p className="text-[9px] text-zinc-600 font-mono">v2.4.0-stable</p>
             </div>
          </div>

        </aside>

        {/* MAIN CONTENT WRAPPER */}
        <main className="flex-1 lg:ml-64 relative">
          {children}
        </main>
      </body>
    </html>
  )
}

import './globals.css'
import Link from 'next/link';
import { LayoutDashboard, Users, Youtube } from 'lucide-react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 flex min-h-screen font-sans selection:bg-cyan-500/30">
        
        {/* SIDEBAR */}
        <aside className="w-64 border-r border-gray-200 flex-col justify-between hidden lg:flex shrink-0 bg-white fixed h-full z-50 shadow-sm">
          
          {/* TOP SECTION */}
          <div className="p-6">
            
            {/* --- LOGO SECTION (EMBEDDED SVG) --- */}
            <div className="flex flex-col items-center gap-4 mb-10 mt-6">
              <div className="text-black hover:text-cyan-600 transition-colors duration-300">
                {/* THIS IS YOUR LOGO AS CODE - WILL NEVER BREAK */}
                <svg width="60" height="60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M50 5C50 5 65 35 85 35C105 35 95 65 75 75C55 85 50 95 50 95C50 95 45 85 25 75C5 65 -5 35 15 35C35 35 50 5 50 5Z" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M50 25C50 25 60 45 75 45C90 45 80 65 65 70C50 75 50 80 50 80C50 80 50 75 35 70C20 65 10 45 25 45C40 45 50 25 50 25Z" stroke="currentColor" strokeWidth="4" className="opacity-50"/>
                  <circle cx="50" cy="55" r="10" fill="currentColor" className="text-cyan-600" />
                </svg>
              </div>
              
              {/* Brand Text */}
              <h1 className="text-sm font-bold tracking-[0.25em] text-black uppercase text-center">
                VALHALLA OS
              </h1>
            </div>
            
            {/* NAVIGATION */}
            <nav className="flex flex-col gap-2">
              <p className="px-4 text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 mt-4">Main Terminal</p>
              
              <Link href="/" className="group flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 transition-all border border-transparent hover:border-gray-200">
                  <LayoutDashboard size={16} className="text-gray-500 group-hover:text-cyan-600 transition-colors" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-black transition-colors">Dashboard</span>
              </Link>
              
              <Link href="/leads" className="group flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 transition-all border border-transparent hover:border-gray-200">
                  <Users size={16} className="text-gray-500 group-hover:text-cyan-600 transition-colors" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-black transition-colors">Lead Flow</span>
              </Link>

              <Link href="/youtube" className="group flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 transition-all border border-transparent hover:border-gray-200">
                  <Youtube size={16} className="text-gray-500 group-hover:text-red-500 transition-colors" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-black transition-colors">YouTube ROI</span>
              </Link>
            </nav>
          </div>

          {/* BOTTOM SECTION */}
          <div className="p-8 border-t border-gray-200">
             <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-gray-900 uppercase tracking-wider">System Online</span>
                </div>
                <p className="text-[9px] text-gray-500 font-mono">v2.4.0-stable</p>
             </div>
          </div>

        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 lg:ml-64 relative bg-gray-50">
          {children}
        </main>
      </body>
    </html>
  )
}

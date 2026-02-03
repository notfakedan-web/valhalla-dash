import './globals.css'
import Link from 'next/link';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-black text-white flex min-h-screen">
        {/* SIDEBAR */}
        <aside className="w-64 border-r border-zinc-900 p-8 flex flex-col gap-10 hidden lg:flex shrink-0">
          <div className="flex items-center gap-2 mb-4">
             <div className="w-8 h-8 bg-cyan-500 rounded-full" />
             <span className="font-black uppercase tracking-tighter">Valhalla</span>
          </div>
          <nav className="flex flex-col gap-6">
            <Link href="/" className="text-[11px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-all">Dashboard</Link>
            <Link href="/leads" className="text-[11px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-all">Lead Flow</Link>
          </nav>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </body>
    </html>
  )
}

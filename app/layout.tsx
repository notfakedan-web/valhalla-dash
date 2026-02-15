import './globals.css'
import Link from 'next/link';
import { LayoutDashboard, Users, Youtube } from 'lucide-react';
import MobileNav from './components/MobileNav'; // <--- ADDED THIS IMPORT

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* Added 'flex-col lg:flex-row' to fix mobile stacking */}
      <body className="bg-[#050505] text-zinc-100 flex flex-col lg:flex-row min-h-screen font-sans selection:bg-cyan-500/30">
        
        {/* --- MOBILE NAV (Visible only on mobile) --- */}
        <MobileNav />

        {/* SIDEBAR (Hidden on mobile via 'hidden lg:flex') */}
        <aside className="w-64 border-r border-zinc-900/50 flex-col justify-between hidden lg:flex shrink-0 bg-[#050505] fixed h-full z-50">
          
          {/* TOP SECTION */}
          <div className="p-6">
            
            {/* --- LOGO SECTION --- */}
            <div className="flex flex-col items-center gap-4 mb-10 mt-6">
              <div className="text-white hover:text-cyan-400 transition-colors duration-300">
                <svg 
                  width="80" 
                  height="80" 
                  viewBox="0 0 921 830" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                  className="object-contain"
                >
                  <path d="M0 0 C15.90795435 6.12061364 30.2433098 16.83683497 43.94921875 26.80859375 C46.07747829 28.33734356 48.18727574 29.7611733 50.39453125 31.16015625 C51.25433594 31.76730469 52.11414063 32.37445313 53 33 C53 33.66 53 34.32 53 35 C53.53625 35.2475 54.0725 35.495 54.625 35.75 C57.5823982 37.30652537 60.29724051 39.03435673 63 41 C63 41.66 63 42.32 63 43 C63.52980469 43.22171875 64.05960938 43.4434375 64.60546875 43.671875 C67.846016 45.46924216 70.525547 47.83458712 73.3125 50.25 C74.17427856 50.99044556 74.17427856 50.99044556 75.0534668 51.74584961 C76.1891163 52.72167053 77.32367202 53.69876609 78.45703125 54.67724609 C80.3872714 56.33199944 82.35216251 57.94361473 84.3125 59.5625 C85.199375 60.366875 86.08625 61.17125 87 62 C87 62.66 87 63.32 87 64 C87.556875 64.226875 88.11375 64.45375 88.6875 64.6875 C91.67961603 66.38572802 93.61600535 68.50764196 96 71 C96.69222656 71.67160156 97.384453

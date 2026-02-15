import React from 'react';
import Image from 'next/image';

export default function Logo({ className = "w-20 h-20" }: { className?: string }) {
  return (
    <div className={`relative ${className} flex items-center justify-center`}>
      <Image 
        src="/valhalla-logo.png"  // This works automatically because file is in 'public'
        alt="Valhalla OS" 
        fill
        className="object-contain"
        priority
        unoptimized
      />
    </div>
  );
}

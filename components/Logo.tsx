import React from 'react';
import logoOjk from '../styles/logo ojk.png';

export default function Logo({ collapsed = false }: { collapsed?: boolean }) {
  if (collapsed) {
    return (
      <div className="flex justify-center items-center h-14 w-full" title="OJK Jawa Barat">
        {/* Collapsed view: clean square scaling */}
        <img 
          src={logoOjk.src} 
          alt="OJK" 
          className="h-10 w-auto object-contain" 
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center select-none w-full">
      {/* Expanded view: spans full sidebar width (using w-full) with automatic proportional height */}
      <img 
        src={logoOjk.src} 
        alt="OJK Jawa Barat Logo" 
        className="w-full h-auto max-h-[84px] object-contain px-1" 
      />
      {/* Sub-label showing regional branch */}
      <div className="text-[10px] font-black text-slate-400 tracking-[0.25em] mt-3 border-t border-slate-100 pt-1.5 w-full text-center uppercase select-none">
        Jawa Barat
      </div>
    </div>
  );
}

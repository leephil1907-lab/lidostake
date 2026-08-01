'use client';

import { useState, useEffect } from 'react';
import { useAppKit, useAppKitAccount } from '@reown/appkit/react';
import { CONFIG } from '@/lib/contracts';
import { Sun, Moon, Shield } from 'lucide-react';

interface NavbarProps {
  isOwner: boolean;
  onShowAdmin: () => void;
}

export default function Navbar({ isOwner, onShowAdmin }: NavbarProps) {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('lido-theme');
    const dark = saved ? saved === 'dark' : true;
    setIsDark(dark);
    if (dark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, []);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    localStorage.setItem('lido-theme', newDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark');
  };

  const shortAddr = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <header className="sticky top-0 z-50 border-b" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="https://lido.fi/static/images/favicon/favicon-32x32.png" alt="Lido" className="w-8 h-8 rounded-full" />
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg" style={{ color: 'var(--text)' }}>Lido Stake</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#00A3FF] text-white font-semibold">Pro</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isOwner && (
            <>
              <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-gradient-to-r from-[#00A3FF] to-[#0066CC] text-white uppercase tracking-wider">Owner</span>
              <button onClick={onShowAdmin} className="px-3 py-1.5 rounded-lg text-xs font-bold border border-[#00A3FF] text-[#00A3FF] hover:bg-[#00A3FF] hover:text-white transition-all flex items-center gap-1">
                <Shield className="w-3 h-3" /> Admin
              </button>
            </>
          )}
          <button onClick={toggleTheme} className="p-2 rounded-lg hover:opacity-80 transition-opacity">
            {isDark ? <Sun className="w-5 h-5" style={{ color: 'var(--text2)' }} /> : <Moon className="w-5 h-5" style={{ color: 'var(--text2)' }} />}
          </button>
          {isConnected && address ? (
            <button onClick={() => open()} className="px-4 py-2 rounded-xl font-semibold text-sm border hover:opacity-80 transition-opacity" style={{ borderColor: 'var(--border)', color: 'var(--text2)' }}>
              {shortAddr(address)}
            </button>
          ) : (
            <button onClick={() => open()} className="px-4 py-2 bg-[#00A3FF] text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              Connect wallet
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CloudOff, CheckCircle2, LogIn, Menu, Upload, Wifi, WifiOff, Table as TableIcon } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { QuickMenu } from './QuickMenu';

export function Header() {
  const { user, profile, signInWithGoogle, loading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(() => 
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [sheetsConnected, setSheetsConnected] = useState(false);

  useEffect(() => {
    const checkSheets = async () => {
      try {
        const res = await fetch('/api/auth/google/status');
        const data = await res.json();
        setSheetsConnected(data.connected);
      } catch (e) {}
    };
    checkSheets();

    if (typeof window !== 'undefined') {
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  return (
    <>
      <header className="fixed top-0 w-full z-50 bg-background flex items-center justify-between px-6 h-16 font-headline tracking-tight border-b border-outline-variant/10">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary hover:bg-primary/10 transition-colors lg:hidden"
          >
            <Menu size={20} />
          </button>
          <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-container-high flex items-center justify-center relative hidden lg:flex">
          {user ? (
            <Image
              src={user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`}
              alt="operator profile"
              fill
              className="object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full bg-surface-container flex items-center justify-center">
              <span className="text-xs text-on-surface-variant">?</span>
            </div>
          )}
        </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold text-primary leading-none">Operações no Café</span>
            {profile && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">
                  {profile.role}: {profile.displayName?.split(' ')[0]}
                </span>
                {(profile.role === 'admin' || user?.email?.toLowerCase() === 'dhyonathan63@gmail.com') && (
                  <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[8px] font-black rounded uppercase tracking-tighter border border-primary/20">
                    Admin
                  </span>
                )}
              </div>
            )}
          </div>
      </div>
      
      <div className="flex items-center gap-4">
        {!user && !loading && (
          <button 
            onClick={signInWithGoogle}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-full text-xs font-bold transition-all hover:scale-105 active:scale-95"
          >
            <LogIn size={14} />
            Conectar
          </button>
        )}
        
        {user && (
          <div className="flex items-center gap-2">
            {(profile?.role === 'admin' || user?.email?.toLowerCase() === 'dhyonathan63@gmail.com') && (
              <Link 
                href="/admin/import"
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-[0.65rem] font-black uppercase tracking-widest hover:bg-primary/20 transition-colors"
              >
                <Upload size={14} />
                Importar
              </Link>
            )}
            <div className="flex items-center gap-2 px-3 py-1 bg-surface-container rounded-full">
              {sheetsConnected ? (
                <TableIcon size={14} className="text-primary" />
              ) : (
                <TableIcon size={14} className="text-on-surface-variant opacity-30" />
              )}
              {isOnline ? (
                <>
                  <Wifi size={14} className="text-primary" />
                  <span className="font-label text-[0.65rem] uppercase tracking-widest text-on-surface-variant">Online</span>
                </>
              ) : (
                <>
                  <WifiOff size={14} className="text-error" />
                  <span className="font-label text-[0.65rem] uppercase tracking-widest text-error">Offline</span>
                </>
              )}
            </div>
          </div>
        )}
        
        <button 
          onClick={() => setIsMenuOpen(true)}
          className="text-primary hover:bg-surface-container p-2 rounded-full transition-colors hidden lg:flex"
        >
          <Menu size={24} />
        </button>
      </div>
      
      <QuickMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </header>
  </>
);
}

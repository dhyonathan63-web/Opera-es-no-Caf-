'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, History, Settings, PlusCircle, Map as MapIcon, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

import { useAuth } from '@/hooks/use-auth';

export function BottomNav() {
  const pathname = usePathname();
  const { user, profile } = useAuth();

  const navItems = [
    { name: 'Painel', href: '/', icon: LayoutDashboard },
    { name: 'Nova Entrada', href: '/new-entry', icon: PlusCircle },
    { name: 'Histórico', href: '/history', icon: History },
    { name: 'Gerenciar', href: '/admin/manage', icon: Settings, adminOnly: true },
    { name: 'Importar', href: '/admin/import', icon: Upload, adminOnly: true },
    { name: 'Arquivos', href: '/files', icon: MapIcon, adminOnly: true },
    { name: 'Configurações', href: '/settings', icon: Settings, adminOnly: true },
  ];

  const isAdmin = profile?.role === 'admin' || user?.email?.toLowerCase() === 'dhyonathan63@gmail.com';
  const filteredItems = navItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center h-20 px-4 pb-safe bg-surface-container border-t border-outline-variant/20 z-50 shadow-[0_-4px_40px_rgba(215,228,236,0.06)] md:hidden">
      {filteredItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center transition-all px-4 py-1 rounded-xl",
              isActive ? "bg-primary/10 text-primary" : "text-tertiary hover:text-primary"
            )}
          >
            <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            <span className="font-label text-[0.65rem] uppercase tracking-wider mt-1">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { user, profile } = useAuth();

  const navItems = [
    { name: 'Painel', href: '/', icon: LayoutDashboard },
    { name: 'Nova Entrada', href: '/new-entry', icon: PlusCircle },
    { name: 'Histórico', href: '/history', icon: History },
    { name: 'Gerenciar', href: '/admin/manage', icon: Settings, adminOnly: true },
    { name: 'Importar', href: '/admin/import', icon: Upload, adminOnly: true },
    { name: 'Arquivos', href: '/files', icon: MapIcon, adminOnly: true },
    { name: 'Configurações', href: '/settings', icon: Settings, adminOnly: true },
  ];

  const isAdmin = profile?.role === 'admin' || user?.email?.toLowerCase() === 'dhyonathan63@gmail.com';
  const filteredItems = navItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 h-full w-80 bg-background flex-col py-8 px-6 z-[60] border-r border-outline-variant/10">
      <div className="mb-10 px-2">
        <h2 className="text-primary font-black text-2xl tracking-tighter">Operações no Café</h2>
        <p className="text-on-surface-variant font-label text-xs uppercase tracking-widest mt-1">Gestão de Frota</p>
      </div>
      
      <nav className="flex flex-col gap-2">
        {filteredItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-4 p-4 rounded-xl transition-all font-medium",
                isActive ? "bg-surface-container text-primary" : "text-on-surface hover:bg-surface-container/50"
              )}
            >
              <item.icon size={20} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-8 px-2 border-t border-outline-variant/10">
        <span className="text-on-surface-variant font-label text-[10px] uppercase tracking-[0.2em]">Status do Sistema</span>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs font-bold text-on-surface">v2.1.0</span>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            <span className="text-[10px] font-bold text-primary uppercase">Conectado</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  LayoutDashboard, 
  PlusCircle, 
  History, 
  MapIcon, 
  Settings, 
  LogOut,
  Download,
  Cloud,
  Tractor,
  Droplets,
  Sprout,
  Search,
  Upload
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface QuickMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

import { useAuth } from '@/hooks/use-auth';

export function QuickMenu({ isOpen, onClose }: QuickMenuProps) {
  const pathname = usePathname();
  const { user, profile, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const menuItems = [
    { name: 'Painel Geral', href: '/', icon: LayoutDashboard, description: 'Visão geral da frota e clima', tags: ['dashboard', 'home', 'inicio'] },
    { name: 'Nova Operação', href: '/new-entry', icon: PlusCircle, description: 'Registrar nova atividade de campo', tags: ['add', 'novo', 'registrar', 'entrada'] },
    { name: 'Histórico Completo', href: '/history', icon: History, description: 'Logs detalhados e auditoria', tags: ['logs', 'passado', 'relatorio'] },
    { name: 'Importar Dados', href: '/admin/import', icon: Upload, description: 'Migração em massa de logs', tags: ['excel', 'importar', 'migrar'], adminOnly: true },
    { name: 'Arquivos e Dados', href: '/files', icon: MapIcon, description: 'Exportações e estrutura de pastas', tags: ['excel', 'download', 'arquivos'], adminOnly: true },
    { name: 'Configurações', href: '/settings', icon: Settings, description: 'Perfil e ajustes do sistema', tags: ['ajustes', 'perfil', 'conta'], adminOnly: true },
  ];

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags.some(tag => tag.includes(searchTerm.toLowerCase()));
    
    const isAdmin = profile?.role === 'admin' || user?.email?.toLowerCase() === 'dhyonathan63@gmail.com';
    const hasPermission = !item.adminOnly || isAdmin;
    
    return matchesSearch && hasPermission;
  });

  const quickActions = [
    { name: 'Exportar Excel', icon: Download, action: () => { window.location.href = '/history'; } },
    { name: 'Sincronizar Nuvem', icon: Cloud, action: () => { alert('Sincronização iniciada...'); } },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-xl z-[60]"
          />

          {/* Menu Content */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-x-0 bottom-0 top-16 md:top-20 md:inset-x-auto md:right-6 md:bottom-6 md:w-[480px] bg-surface-container-high md:rounded-3xl shadow-2xl z-[70] overflow-hidden flex flex-col border-t md:border border-outline-variant/20"
          >
            <div className="p-6 border-b border-outline-variant/10 flex items-center justify-between bg-surface-container-highest/50">
              <div>
                <h2 className="text-2xl font-black tracking-tighter text-primary">Menu de Possibilidades</h2>
                <p className="text-[0.65rem] font-label uppercase tracking-widest text-on-surface-variant mt-1">Navegação Rápida</p>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface hover:text-primary transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 bg-surface-container-highest/30 border-b border-outline-variant/10">
              <div className="relative flex items-center">
                <Search className="absolute left-4 text-on-surface-variant" size={18} />
                <input 
                  type="text"
                  placeholder="O que você deseja fazer?"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-12 bg-surface-container pl-12 pr-4 rounded-xl border-none outline-none ring-0 focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-on-surface-variant/50 font-medium"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              {/* Main Navigation */}
              <section>
                <h3 className="font-label text-[0.65rem] uppercase tracking-widest text-on-surface-variant mb-4 ml-1">
                  {searchTerm ? 'Resultados da Busca' : 'Navegar para'}
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {filteredItems.length > 0 ? (
                    filteredItems.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={onClose}
                          className={cn(
                            "group flex items-center gap-4 p-4 rounded-2xl transition-all border-2",
                            isActive 
                              ? "bg-primary/10 border-primary text-primary" 
                              : "bg-surface-container border-transparent hover:border-outline-variant/20 text-on-surface"
                          )}
                        >
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                            isActive ? "bg-primary text-on-primary" : "bg-surface-container-highest text-on-surface-variant group-hover:text-primary"
                          )}>
                            <item.icon size={24} />
                          </div>
                          <div>
                            <p className="font-bold leading-none">{item.name}</p>
                            <p className="text-xs text-on-surface-variant mt-1">{item.description}</p>
                          </div>
                        </Link>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center bg-surface-container rounded-2xl border-2 border-dashed border-outline-variant/10">
                      <p className="text-on-surface-variant text-sm italic">Nenhuma possibilidade encontrada para &quot;{searchTerm}&quot;</p>
                    </div>
                  )}
                </div>
              </section>

              {!searchTerm && (
                <>
                  {/* Quick Actions */}
                  <section>
                    <h3 className="font-label text-[0.65rem] uppercase tracking-widest text-on-surface-variant mb-4 ml-1">Ações Rápidas</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {quickActions.map((action) => (
                        <button
                          key={action.name}
                          onClick={() => { action.action(); onClose(); }}
                          className="flex flex-col items-center justify-center p-6 bg-surface-container rounded-2xl border-2 border-transparent hover:border-primary/30 hover:bg-primary/5 transition-all group"
                        >
                          <action.icon size={24} className="text-primary mb-3 group-hover:scale-110 transition-transform" />
                          <span className="text-xs font-bold uppercase tracking-wider">{action.name}</span>
                        </button>
                      ))}
                    </div>
                  </section>

                  {/* System Info */}
                  <div className="bg-surface-container-highest/30 rounded-2xl p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Tractor size={18} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-bold">Operações no Café v2.1.0</p>
                        <p className="text-[0.6rem] text-on-surface-variant uppercase tracking-widest">Sistema Operacional</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => { logout(); onClose(); }}
                      className="text-error hover:bg-error/10 p-2 rounded-lg transition-colors"
                    >
                      <LogOut size={20} />
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

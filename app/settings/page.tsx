'use client';

import React, { useEffect } from 'react';
import { Header } from '@/components/Header';
import { BottomNav, Sidebar } from '@/components/Navigation';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { 
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Database,
  Cloud,
  LogOut,
  ChevronRight,
  Loader2,
  Upload
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const { user, profile, isAuthReady, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const isAdmin = profile?.role === 'admin' || user?.email?.toLowerCase() === 'dhyonathan63@gmail.com';
    if (isAuthReady && profile && !isAdmin) {
      router.replace('/');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthReady, profile, router]);

  const isAdmin = profile?.role === 'admin' || user?.email?.toLowerCase() === 'dhyonathan63@gmail.com';
  if (!isAuthReady || (profile && !isAdmin)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 lg:pb-0 lg:pl-80">
      <Header />
      <Sidebar />
      
      <main className="pt-24 px-6 max-w-4xl mx-auto">
        <div className="mb-12">
          <h1 className="text-[3.5rem] font-black leading-none text-primary tracking-tighter mb-2">Configurações</h1>
          <p className="font-label text-tertiary text-sm tracking-widest uppercase">Configuração do Sistema</p>
        </div>

        <div className="space-y-8 pb-12">
          <section>
            <h2 className="font-label text-xs uppercase tracking-widest text-on-surface-variant mb-4 ml-1">Conta</h2>
            <div className="bg-surface-container rounded-2xl overflow-hidden divide-y divide-outline-variant/10">
              <SettingsItem icon={User} title="Informações do Perfil" subtitle="Atualize seus dados pessoais" />
              <SettingsItem icon={Bell} title="Notificações" subtitle="Configure alertas e atualizações da frota" />
              <SettingsItem icon={Shield} title="Segurança" subtitle="Gerencie senhas e chaves de acesso" />
            </div>
          </section>

          <section>
            <h2 className="font-label text-xs uppercase tracking-widest text-on-surface-variant mb-4 ml-1">Sistema</h2>
            <div className="bg-surface-container rounded-2xl overflow-hidden divide-y divide-outline-variant/10">
              <Link href="/admin/manage">
                <SettingsItem icon={SettingsIcon} title="Gerenciar Recursos" subtitle="Adicionar tratores, implementos e tarefas" />
              </Link>
              <Link href="/admin/import">
                <SettingsItem icon={Upload} title="Importar Dados" subtitle="Migrar logs de planilhas externas" />
              </Link>
              <SettingsItem icon={Database} title="Gerenciamento de Dados" subtitle="Exportar logs e limpar cache local" />
              <SettingsItem icon={Cloud} title="Sincronização em Nuvem" subtitle="Configurar integração com Google Sheets" />
            </div>
          </section>

          <button 
            onClick={logout}
            className="w-full h-16 bg-surface-container-high rounded-2xl flex items-center justify-center gap-3 text-error font-bold hover:bg-surface-variant transition-colors mt-8"
          >
            <LogOut size={20} />
            Sair da Conta
          </button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

function SettingsItem({ icon: Icon, title, subtitle }: any) {
  return (
    <button className="w-full p-6 flex items-center justify-between hover:bg-surface-container-high transition-colors group text-left">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-background rounded-xl flex items-center justify-center group-hover:bg-surface-container-highest transition-colors">
          <Icon size={20} className="text-primary" />
        </div>
        <div>
          <p className="font-bold text-on-surface">{title}</p>
          <p className="text-sm text-on-surface-variant">{subtitle}</p>
        </div>
      </div>
      <ChevronRight size={20} className="text-on-surface-variant group-hover:text-primary transition-transform group-hover:translate-x-1" />
    </button>
  );
}

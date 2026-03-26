'use client';

import React, { useEffect } from 'react';
import { Header } from '@/components/Header';
import { BottomNav, Sidebar } from '@/components/Navigation';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  Download, 
  ExternalLink, 
  FolderOpen,
  Database,
  Info,
  Loader2
} from 'lucide-react';

export default function FilesPage() {
  const { user, profile, isAuthReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const isAdmin = profile?.role === 'admin' || user?.email?.toLowerCase() === 'dhyonathan63@gmail.com';
    if (isAuthReady && profile && !isAdmin) {
      router.replace('/');
    }
  }, [isAuthReady, profile, user, router]);

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
          <h1 className="text-[3.5rem] font-black leading-none text-primary tracking-tighter mb-2">Arquivos</h1>
          <p className="font-label text-tertiary text-sm tracking-widest uppercase">Gerenciamento de Dados e Exportações</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
          <div className="bg-surface-container rounded-2xl p-8 border-l-4 border-primary">
            <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
              <Download size={28} className="text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Exportações Recentes</h2>
            <p className="text-on-surface-variant mb-6">
              Os arquivos exportados (Excel) são baixados diretamente para a pasta de <strong>Downloads</strong> do seu navegador.
            </p>
            <div className="bg-background rounded-xl p-4 flex items-center gap-3 text-sm text-on-surface-variant">
              <Info size={18} className="text-primary shrink-0" />
              <span>Verifique o histórico de downloads do seu navegador (Ctrl+J ou Cmd+J).</span>
            </div>
          </div>

          <div className="bg-surface-container rounded-2xl p-8 border-l-4 border-secondary">
            <div className="w-14 h-14 bg-secondary/10 rounded-xl flex items-center justify-center mb-6">
              <FolderOpen size={28} className="text-secondary" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Arquivos do Projeto</h2>
            <p className="text-on-surface-variant mb-6">
              O código-fonte e os arquivos de configuração deste aplicativo estão localizados no <strong>Explorador de Arquivos</strong> do AI Studio Build.
            </p>
            <div className="bg-background rounded-xl p-4 flex items-center gap-3 text-sm text-on-surface-variant">
              <ExternalLink size={18} className="text-secondary shrink-0" />
              <span>Acesse a aba &quot;Code&quot; no painel esquerdo para ver a estrutura de pastas.</span>
            </div>
          </div>

          <div className="md:col-span-2 bg-surface-container rounded-2xl p-8 border-l-4 border-tertiary">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-tertiary/10 rounded-xl flex items-center justify-center">
                <Database size={28} className="text-tertiary" />
              </div>
              <h2 className="text-2xl font-bold">Base de Dados</h2>
            </div>
            <p className="text-on-surface-variant mb-6">
              Todas as operações registradas são armazenadas de forma segura no <strong>Google Firestore</strong>.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-background p-4 rounded-xl text-center">
                <p className="text-2xl font-black text-primary">Nuvem</p>
                <p className="text-[0.6rem] uppercase tracking-widest text-on-surface-variant mt-1">Sincronização</p>
              </div>
              <div className="bg-background p-4 rounded-xl text-center">
                <p className="text-2xl font-black text-secondary">Real-time</p>
                <p className="text-[0.6rem] uppercase tracking-widest text-on-surface-variant mt-1">Atualização</p>
              </div>
              <div className="bg-background p-4 rounded-xl text-center">
                <p className="text-2xl font-black text-tertiary">Seguro</p>
                <p className="text-[0.6rem] uppercase tracking-widest text-on-surface-variant mt-1">Armazenamento</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

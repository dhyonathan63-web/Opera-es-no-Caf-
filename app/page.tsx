'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { BottomNav, Sidebar } from '@/components/Navigation';
import { 
  Tractor, 
  PlusCircle, 
  Thermometer, 
  Droplets, 
  CheckCircle2, 
  History, 
  AlertCircle,
  Map as MapIcon,
  Waves,
  Fuel,
  Cloud,
  Loader2,
  Settings,
  Upload,
  Bug
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, query, where, onSnapshot, limit, orderBy } from 'firebase/firestore';

export default function Dashboard() {
  const { user, profile, isAuthReady } = useAuth();
  const [stats, setStats] = useState<any>({ totalHours: 0, entries: 0, hoursByCrop: {}, hoursByOperator: {}, topTaskByCrop: {} });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loading = !isAuthReady || (user && isDataLoading);

  useEffect(() => {
    if (!isAuthReady) return;

    const isAdmin = profile?.role === 'admin' || user?.email?.toLowerCase() === 'dhyonathan63@gmail.com';
    
    let q;
    if (user) {
      q = query(
        collection(db, 'operations'),
        orderBy('createdAt', 'desc')
      );
    } else {
      // For anonymous users, show all recent activity but maybe limited
      q = query(
        collection(db, 'operations'),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const today = new Date().toISOString().split('T')[0];
      let totalToday = 0;
      const cropTotals: Record<string, number> = {};
      const operatorTotals: Record<string, number> = {};
      const cropTaskFrequency: Record<string, Record<string, number>> = {};

      const docs = snapshot.docs.map(doc => {
        const data = doc.data();
        const hours = (data.finalMeter - data.initialMeter) || 0;
        
        if (data.date === today) {
          totalToday += hours;
        }

        // Calculate hours by crop
        const crop = data.crop || 'Sem Safra';
        cropTotals[crop] = (cropTotals[crop] || 0) + hours;

        // Calculate hours by operator
        const operator = data.operatorName || 'Desconhecido';
        operatorTotals[operator] = (operatorTotals[operator] || 0) + hours;

        // Track task frequency per crop
        const task = data.task || 'Outros';
        if (!cropTaskFrequency[crop]) cropTaskFrequency[crop] = {};
        cropTaskFrequency[crop][task] = (cropTaskFrequency[crop][task] || 0) + 1;

        return { id: doc.id, ...data, hours };
      });

      // Determine top task for each crop
      const topTaskByCrop: Record<string, string> = {};
      Object.entries(cropTaskFrequency).forEach(([crop, tasks]) => {
        const topTask = Object.entries(tasks).reduce((a, b) => a[1] > b[1] ? a : b)[0];
        topTaskByCrop[crop] = topTask;
      });

      setStats({ 
        totalHours: totalToday, 
        entries: docs.length,
        hoursByCrop: cropTotals,
        hoursByOperator: operatorTotals,
        topTaskByCrop
      });
      
      // Sort by date and createdAt desc
      const sorted = [...docs].sort((a: any, b: any) => {
        const dateCompare = (b.date || '').localeCompare(a.date || '');
        if (dateCompare !== 0) return dateCompare;
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
      
      setRecentActivity(sorted.slice(0, 3));
      setIsDataLoading(false);
      setLastUpdated(new Date());
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'operations');
      setIsDataLoading(false);
    });

    return () => unsubscribe();
  }, [user, profile, isAuthReady]);

  return (
    <div className="min-h-screen pb-24 lg:pb-0 lg:pl-80 overflow-y-auto touch-pan-y">
      <Header />
      <Sidebar />
      
      <main className="pt-24 px-6 max-w-7xl mx-auto">
        <section className="mb-12">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <h2 className="font-label text-sm uppercase tracking-[0.2em] text-primary">Bom dia, Operador</h2>
              {(profile?.role === 'admin' || user?.email?.toLowerCase() === 'dhyonathan63@gmail.com') && (
                <span className="px-2 py-0.5 bg-primary text-on-primary text-[10px] font-black rounded uppercase tracking-widest">
                  Administrador
                </span>
              )}
            </div>
            {lastUpdated && (
              <div className="flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-full">
                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                <span className="text-[0.6rem] font-bold text-primary uppercase tracking-tighter">
                  Sincronizado: {lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-on-background">Visão Geral</h1>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-surface-container rounded-xl p-8 flex flex-col justify-between min-h-[280px]">
            <div className="w-full">
              <span className="font-label text-xs uppercase tracking-widest text-on-surface-variant">Total de Horas por Café</span>
              <div className="mt-6 space-y-4 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                {loading ? (
                  <div className="flex items-center gap-2 text-primary">
                    <Loader2 className="animate-spin" size={20} />
                    <span className="font-bold">Carregando dados...</span>
                  </div>
                ) : Object.keys(stats.hoursByCrop).length === 0 ? (
                  <p className="text-on-surface-variant italic">Nenhum dado registrado.</p>
                ) : (
                  Object.entries(stats.hoursByCrop)
                    .sort((a: any, b: any) => b[1] - a[1])
                    .map(([crop, hours]: [string, any]) => (
                      <div key={crop} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-primary group-hover:scale-150 transition-transform" />
                          <span className="font-bold text-on-surface truncate max-w-[150px] sm:max-w-none">{crop}</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black text-primary tracking-tighter">{hours.toFixed(1)}</span>
                          <span className="text-xs font-medium text-tertiary">hrs</span>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 mt-8 pt-4 border-t border-outline-variant/10">
              <div className="flex -space-x-2">
                {[1, 2].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-surface-container bg-surface-container-high overflow-hidden relative">
                    <Image
                      src={`https://picsum.photos/seed/worker${i}/40/40`}
                      alt="avatar do trabalhador"
                      fill
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ))}
              </div>
              <p className="text-sm font-body text-on-surface-variant">
                {stats.entries} operações registradas no total
              </p>
            </div>
          </div>

          <div className="bg-surface-container-high rounded-xl p-8 flex flex-col justify-between border-l-4 border-primary min-h-[280px]">
            <div className="w-full">
              <div className="flex justify-between items-start">
                <span className="font-label text-xs uppercase tracking-widest text-primary">Horas por Operador</span>
                <Tractor size={20} className="text-primary" />
              </div>
              
              <div className="mt-6 space-y-4 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                {loading ? (
                  <div className="flex items-center gap-2 text-primary">
                    <Loader2 className="animate-spin" size={16} />
                    <span className="text-xs font-bold">Carregando...</span>
                  </div>
                ) : !stats.hoursByOperator || Object.keys(stats.hoursByOperator).length === 0 ? (
                  <p className="text-on-surface-variant text-xs italic">Nenhum operador registrado.</p>
                ) : (
                  Object.entries(stats.hoursByOperator)
                    .sort((a: any, b: any) => b[1] - a[1])
                    .map(([operator, hours]: [string, any]) => (
                      <div key={operator} className="flex items-center justify-between group">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          <span className="text-sm font-bold text-on-surface truncate max-w-[120px]">{operator}</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl font-black text-primary tracking-tighter">{hours.toFixed(1)}</span>
                          <span className="text-[10px] font-medium text-tertiary">hrs</span>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
            <div className="mt-8 pt-4 border-t border-outline-variant/10">
              <div className="flex justify-between items-center text-[0.7rem] font-label text-on-surface-variant tracking-wider uppercase">
                <span>Eficiência Total</span>
                <span>Ativo</span>
              </div>
            </div>
          </div>

          <Link 
            href="/new-entry"
            className="md:col-span-1 bg-primary rounded-xl p-8 flex flex-col justify-center items-center text-center group cursor-pointer active:scale-95 transition-all duration-200 bg-gradient-to-br from-primary to-primary-container"
          >
            <div className="w-16 h-16 bg-on-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <PlusCircle size={32} className="text-on-primary" />
            </div>
            <h3 className="text-on-primary text-xl font-bold">Nova Entrada</h3>
            <p className="text-on-primary/70 text-sm mt-2 font-body">Registrar atividade de campo</p>
          </Link>

          <div className="bg-surface-container rounded-xl p-6 flex items-center gap-6">
            <div className="w-14 h-14 bg-secondary-container/30 rounded-full flex items-center justify-center">
              <History size={24} className="text-secondary" />
            </div>
            <div>
              <span className="font-label text-[0.6rem] uppercase tracking-widest text-on-surface-variant">Total de Entradas</span>
              <p className="text-2xl font-bold text-on-surface">{loading ? '...' : stats.entries}</p>
            </div>
          </div>
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-surface-container rounded-xl p-6 flex flex-col justify-center min-h-[120px]">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-10 h-10 bg-secondary-container/30 rounded-full flex items-center justify-center shrink-0">
                  <CheckCircle2 size={20} className="text-secondary" />
                </div>
                <span className="font-label text-[0.6rem] uppercase tracking-widest text-on-surface-variant">Top Operação por Safra</span>
              </div>
              <div className="space-y-1 max-h-[60px] overflow-y-auto custom-scrollbar">
                {loading ? (
                  <p className="text-xs font-bold text-on-surface animate-pulse">Calculando...</p>
                ) : !stats.topTaskByCrop || Object.keys(stats.topTaskByCrop).length === 0 ? (
                  <p className="text-xs text-on-surface-variant italic">Sem dados</p>
                ) : (
                  Object.entries(stats.topTaskByCrop).map(([crop, task]) => (
                    <div key={crop} className="flex justify-between items-center text-xs">
                      <span className="text-on-surface-variant font-medium truncate max-w-[80px]">{crop}:</span>
                      <span className="font-bold text-on-surface truncate ml-2">{task as string}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="bg-surface-container rounded-xl p-6 flex items-center gap-6">
              <div className="w-14 h-14 bg-tertiary-container/20 rounded-full flex items-center justify-center">
                <Droplets size={24} className="text-tertiary" />
              </div>
              <div>
                <span className="font-label text-[0.6rem] uppercase tracking-widest text-on-surface-variant">Umidade</span>
                <p className="text-2xl font-bold text-on-surface">68%</p>
              </div>
            </div>
          </div>
        </div>

        <section className="mt-12 mb-6">
          <h2 className="text-2xl font-bold text-on-surface">Ações e Possibilidades</h2>
        </section>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
          <Link href="/new-entry" className="p-6 bg-surface-container rounded-2xl flex flex-col items-center text-center hover:bg-primary/10 transition-colors group">
            <PlusCircle size={24} className="text-primary mb-3 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold uppercase tracking-wider">Nova Entrada</span>
          </Link>
          <Link href="/history" className="p-6 bg-surface-container rounded-2xl flex flex-col items-center text-center hover:bg-primary/10 transition-colors group">
            <History size={24} className="text-primary mb-3 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold uppercase tracking-wider">Histórico</span>
          </Link>
          {(profile?.role === 'admin' || user?.email?.toLowerCase() === 'dhyonathan63@gmail.com') && (
            <>
              <Link href="/files" className="p-6 bg-surface-container rounded-2xl flex flex-col items-center text-center hover:bg-primary/10 transition-colors group">
                <MapIcon size={24} className="text-primary mb-3 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold uppercase tracking-wider">Arquivos</span>
              </Link>
              <Link href="/admin/import" className="p-6 bg-surface-container rounded-2xl flex flex-col items-center text-center hover:bg-primary/10 transition-colors group">
                <Upload size={24} className="text-primary mb-3 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold uppercase tracking-wider">Importar</span>
              </Link>
              <Link href="/settings" className="p-6 bg-surface-container rounded-2xl flex flex-col items-center text-center hover:bg-primary/10 transition-colors group">
                <Settings size={24} className="text-primary mb-3 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold uppercase tracking-wider">Ajustes</span>
              </Link>
            </>
          )}
        </div>

        <section className="mt-16 mb-8">
          <h2 className="text-2xl font-bold text-on-surface">Atividade Recente da Frota</h2>
        </section>

        <div className="space-y-3 pb-12">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-primary" />
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="p-10 text-center bg-surface-container rounded-xl border border-dashed border-outline-variant/20">
              <p className="text-on-surface-variant">Nenhuma atividade recente encontrada.</p>
            </div>
          ) : (
            recentActivity.map((op) => (
              <ActivityItem 
                key={op.id}
                icon={op.task.includes('Pulverização') ? Bug : Tractor} 
                title={op.task} 
                subtitle={`${op.tractor} - ${op.sector}`} 
                status={op.date} 
                statusIcon={CheckCircle2}
                statusColor="text-primary"
              />
            ))
          )}
          
          {/* Mock alerts for visual depth as per design */}
          <ActivityItem 
            icon={Cloud} 
            title="Status do Sistema" 
            subtitle="Todos os sistemas operacionais" 
            status="Online" 
            statusIcon={CheckCircle2}
            statusColor="text-primary"
          />
        </div>
      </main>

      <BottomNav />
      
      <button className="fixed right-6 bottom-28 md:bottom-6 w-14 h-14 bg-surface-container-highest rounded-full flex items-center justify-center shadow-lg border border-outline-variant/20 active:scale-95 transition-transform z-40">
        <MapIcon size={24} className="text-primary" />
      </button>
    </div>
  );
}

function ActivityItem({ 
  icon: Icon, 
  title, 
  subtitle, 
  status, 
  statusIcon: StatusIcon, 
  statusColor,
  isError = false
}: any) {
  return (
    <div className="bg-surface-container-low p-6 rounded-xl flex items-center justify-between hover:bg-surface-container transition-colors group">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-surface-container-high rounded-full flex items-center justify-center">
          <Icon size={20} className="text-on-surface-variant" />
        </div>
        <div>
          <p className="font-bold">{title}</p>
          <p className="text-sm text-on-surface-variant">{subtitle}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-label text-xs uppercase tracking-widest mb-1 ${statusColor}`}>{status}</p>
        <StatusIcon size={20} className={statusColor} fill={isError ? "currentColor" : "none"} />
      </div>
    </div>
  );
}

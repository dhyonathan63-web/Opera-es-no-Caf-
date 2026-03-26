'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { BottomNav, Sidebar } from '@/components/Navigation';
import { 
  Tractor, 
  Search, 
  Calendar,
  Grid3X3,
  Pencil,
  Cloud,
  CloudOff,
  History as HistoryIcon,
  Droplets,
  Sprout,
  Bug,
  ChevronDown,
  Loader2,
  Download
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { utils, writeFile } from 'xlsx';

import { EditOperationModal } from '@/components/EditOperationModal';

export default function HistoryPage() {
  const { user, profile, isAuthReady } = useAuth();
  const [operations, setOperations] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('Todos os Setores');
  const [selectedDate, setSelectedDate] = useState('');
  const [editingOperation, setEditingOperation] = useState<any | null>(null);
  const [limitCount, setLimitCount] = useState(20);
  const [hasMore, setHasMore] = useState(true);

  const loading = !isAuthReady || (user && isDataLoading);
  const isAdmin = profile?.role === 'admin' || user?.email?.toLowerCase() === 'dhyonathan63@gmail.com';

  useEffect(() => {
    if (!user || !isAuthReady) return;

    let q = query(
      collection(db, 'operations'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOperations(docs);
      setIsDataLoading(false);
      
      // If we got fewer results than the limit, there are no more items
      setHasMore(docs.length === limitCount);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'operations');
      setIsDataLoading(false);
    });

    // Separate listener for true total count
    let qTotal = query(collection(db, 'operations'));
    
    const unsubscribeTotal = onSnapshot(qTotal, (snapshot) => {
      setTotalCount(snapshot.size);
    }, (error) => {
      console.error("Error fetching total count:", error);
    });

    return () => {
      unsubscribe();
      unsubscribeTotal();
    };
  }, [user, isAuthReady, isAdmin, limitCount]);

  const filteredOperations = operations.filter(op => {
    const matchesSearch = op.task.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         op.tractor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSector = selectedSector === 'Todos os Setores' || op.sector === selectedSector;
    const matchesDate = !selectedDate || op.date === selectedDate;
    
    return matchesSearch && matchesSector && matchesDate;
  }).sort((a: any, b: any) => {
    // Ordenar por data da operação (mais recente primeiro)
    const dateCompare = (b.date || '').localeCompare(a.date || '');
    if (dateCompare !== 0) return dateCompare;
    
    // Se a data for igual, ordenar por hora de criação (mais recente primeiro)
    const timeA = a.createdAt?.seconds || 0;
    const timeB = b.createdAt?.seconds || 0;
    return timeB - timeA;
  });

  const exportToExcel = () => {
    const dataToExport = filteredOperations.map(op => ({
      'Data': op.date,
      'Operação': op.task,
      'Setor': op.sector,
      'Trator': op.tractor,
      'Implemento': op.implement,
      'Safra': op.crop,
      'Horímetro Inicial': op.initialMeter,
      'Horímetro Final': op.finalMeter,
      'Total Horas': (op.finalMeter - op.initialMeter || 0).toFixed(1),
      'Operador': op.operatorName,
      'Sincronizado': op.synced ? 'Sim' : 'Não',
      'ID': op.id
    }));

    const worksheet = utils.json_to_sheet(dataToExport);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Histórico");
    
    const dateStr = new Date().toISOString().split('T')[0];
    writeFile(workbook, `Historico_Operacoes_${dateStr}.xlsx`);
  };

  const getIcon = (task: string) => {
    if (task.includes('Pulverização')) return Bug;
    if (task.includes('Irrigação')) return Droplets;
    if (task.includes('Plantio') || task.includes('Fertilização')) return Sprout;
    return Tractor;
  };

  return (
    <div className="min-h-screen pb-24 lg:pb-0 lg:pl-80 overflow-y-auto touch-pan-y">
      <Header />
      <Sidebar />
      
      <main className="pt-20 px-6 max-w-5xl mx-auto">
        <section className="mt-12 mb-8">
          <p className="font-label text-[0.75rem] uppercase tracking-wider text-primary mb-2">Logs e Auditoria</p>
          <h1 className="text-5xl font-extrabold tracking-tight text-on-surface leading-none">Histórico de Operações</h1>
          <div className="mt-4 flex flex-wrap gap-4 items-center">
            <div className="flex items-center bg-surface-container-high rounded-full px-4 py-1.5 gap-2">
              <HistoryIcon size={14} className="text-primary" />
              <span className="font-label text-[0.75rem] font-medium uppercase tracking-wider">
                {loading ? 'CARREGANDO...' : `TOTAL: ${totalCount} ENTRADAS`}
              </span>
            </div>
            <button 
              onClick={exportToExcel}
              disabled={filteredOperations.length === 0}
              className="flex items-center bg-primary/10 text-primary hover:bg-primary/20 transition-colors rounded-full px-4 py-1.5 gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={14} />
              <span className="font-label text-[0.75rem] font-bold uppercase tracking-wider">Exportar para Excel</span>
            </button>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-10">
          <div className="md:col-span-6">
            <div className="relative flex flex-col">
              <label className="font-label text-[0.75rem] text-on-surface-variant mb-1 ml-1">Buscar Operação</label>
              <div className="h-16 bg-surface-container-highest flex items-center px-4 rounded-xl group focus-within:ring-2 focus-within:ring-primary/20 transition-all border-b-2 border-transparent focus-within:border-primary">
                <Search className="text-on-surface-variant mr-3" size={20} />
                <input 
                  className="bg-transparent border-none outline-none ring-0 focus:ring-0 w-full text-on-surface placeholder:text-outline-variant/60" 
                  placeholder="Por equipamento ou tarefa..." 
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="md:col-span-3">
            <div className="relative flex flex-col">
              <label className="font-label text-[0.75rem] text-on-surface-variant mb-1 ml-1">Setor</label>
              <div className="h-16 bg-surface-container-highest flex items-center px-4 rounded-xl">
                <Grid3X3 className="text-on-surface-variant mr-3" size={16} />
                <select 
                  className="bg-transparent border-none outline-none ring-0 focus:ring-0 w-full text-on-surface font-medium appearance-none cursor-pointer"
                  value={selectedSector}
                  onChange={(e) => setSelectedSector(e.target.value)}
                >
                  <option>Todos os Setores</option>
                  <option>Setor 1</option>
                  <option>Setor 2</option>
                  <option>Setor 3</option>
                  <option>Setor 4</option>
                  <option>Setor 5</option>
                  <option>Setor 6</option>
                  <option>Setor 07</option>
                  <option>Setor 08</option>
                  <option>Setor 09</option>
                  <option>Setor 10</option>
                </select>
              </div>
            </div>
          </div>
          <div className="md:col-span-3">
            <div className="relative flex flex-col">
              <label className="font-label text-[0.75rem] text-on-surface-variant mb-1 ml-1">Data</label>
              <div className="h-16 bg-surface-container-highest flex items-center px-4 rounded-xl">
                <Calendar className="text-on-surface-variant mr-3" size={16} />
                <input 
                  className="bg-transparent border-none outline-none ring-0 focus:ring-0 w-full text-on-surface text-sm cursor-pointer" 
                  type="date" 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        </section>

        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-primary" size={40} />
            </div>
          ) : filteredOperations.length === 0 ? (
            <div className="text-center py-20 bg-surface-container rounded-xl border-2 border-dashed border-outline-variant/20">
              <p className="text-on-surface-variant">Nenhuma operação encontrada.</p>
              {!user && <p className="text-primary font-bold mt-2">Por favor, conecte sua conta para ver o histórico.</p>}
            </div>
          ) : (
            filteredOperations.map((op) => (
              <HistoryCard 
                key={op.id}
                icon={getIcon(op.task)} 
                title={`${op.task} - ${op.sector}`} 
                hours={`${(op.finalMeter - op.initialMeter || 0).toFixed(1)} horas`} 
                date={op.date} 
                status={op.synced ? "Sincronizado" : "Offline"} 
                uuid={op.id.slice(0, 8).toUpperCase()}
                isSynced={op.synced}
                canEdit={isAdmin}
                onEdit={() => setEditingOperation(op)}
              />
            ))
          )}
        </div>

        {editingOperation && (
          <EditOperationModal 
            operation={editingOperation}
            onClose={() => setEditingOperation(null)}
            onSuccess={() => {
              // onSnapshot will handle the update
            }}
          />
        )}

        {hasMore && filteredOperations.length > 0 && (
          <div className="mt-12 mb-20 flex justify-center">
            <button 
              onClick={() => setLimitCount(prev => prev + 20)}
              className="px-8 py-4 bg-surface-container-high text-primary font-bold rounded-xl hover:bg-surface-variant transition-colors flex items-center gap-2 group"
            >
              Carregar logs anteriores
              <ChevronDown className="group-hover:translate-y-1 transition-transform" size={20} />
            </button>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

function HistoryCard({ icon: Icon, title, hours, date, status, uuid, isSynced, canEdit, onEdit }: any) {
  return (
    <div className="group bg-surface-container-low hover:bg-surface-container transition-all p-6 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div className="flex items-center gap-6">
        <div className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center",
          isSynced ? "bg-primary/10" : "bg-secondary/10"
        )}>
          <Icon size={32} className={isSynced ? "text-primary" : "text-secondary"} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-on-surface mb-1">{title}</h3>
          <div className="flex items-center gap-4 text-on-surface-variant font-label text-sm">
            <span className="flex items-center gap-1"><HistoryIcon size={12} /> {hours}</span>
            <span className="flex items-center gap-1"><Calendar size={12} /> {date}</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-none border-outline-variant/10 pt-4 md:pt-0">
        <div className="flex flex-col items-end">
          <span className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold uppercase tracking-widest text-[0.65rem]",
            isSynced ? "bg-primary/20 text-primary" : "bg-surface-container-highest text-secondary"
          )}>
            {isSynced ? <Cloud size={10} fill="currentColor" /> : <CloudOff size={10} />}
            {status}
          </span>
          <p className="text-[0.65rem] text-outline-variant mt-1 font-label">{uuid}</p>
        </div>
        
        {canEdit && (
          <button 
            onClick={onEdit}
            className="w-12 h-12 flex items-center justify-center rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all active:scale-95 border border-primary/20"
            title="Editar Operação"
          >
            <Pencil size={20} />
          </button>
        )}
      </div>
    </div>
  );
}

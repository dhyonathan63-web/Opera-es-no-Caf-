'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { BottomNav, Sidebar } from '@/components/Navigation';
import { useAuth } from '@/hooks/use-auth';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query
} from 'firebase/firestore';
import {
  Tractor,
  Plus,
  Trash2,
  Loader2,
  User,
  Settings,
  Wrench,
  ClipboardList,
  MapPin,
  Link as LinkIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

type ManageTab = 'tractors' | 'implements' | 'tasks' | 'operators' | 'areas_kml' | 'users';

const emptyKmlArea = {
  name: '',
  crop: '',
  sector: '',
  hectares: '',
  kmlLink: '',
};

function getCollectionName(tab: ManageTab) {
  switch (tab) {
    case 'tractors': return 'tractors';
    case 'implements': return 'implements';
    case 'tasks': return 'tasks';
    case 'operators': return 'operators';
    case 'areas_kml': return 'areas_kml';
    case 'users': return 'users';
  }
}

function getItemName(item: any, tab: ManageTab) {
  if (tab === 'users') return item.displayName || item.email || item.id;
  if (tab === 'areas_kml') return item.name || item.nome || item.NOME_AREA || item.id;
  return item.name || item.nome || item.id;
}

export default function AdminManagePage() {
  const { user, profile, isAuthReady } = useAuth();
  const [activeTab, setActiveTab] = useState<ManageTab>('tractors');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItemName, setNewItemName] = useState('');
  const [newKmlArea, setNewKmlArea] = useState(emptyKmlArea);
  const [isAdding, setIsAdding] = useState(false);

  const isAdmin = profile?.role === 'admin' || user?.email?.toLowerCase() === 'dhyonathan63@gmail.com';

  useEffect(() => {
    if (!isAdmin || !isAuthReady) return;

    const collectionName = getCollectionName(activeTab);
    setLoading(true);

    const q = query(collection(db, collectionName));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setItems(docs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, collectionName);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeTab, isAdmin, isAuthReady]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    setIsAdding(true);
    try {
      await addDoc(collection(db, activeTab), {
        name: newItemName.trim(),
        active: true,
        createdAt: new Date().toISOString()
      });
      setNewItemName('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, activeTab);
    } finally {
      setIsAdding(false);
    }
  };

  const handleAddKmlArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKmlArea.name.trim() || !newKmlArea.crop.trim() || !newKmlArea.sector.trim() || !newKmlArea.kmlLink.trim()) {
      alert('Preencha nome da área, safra/café, setor e link do KML.');
      return;
    }

    setIsAdding(true);
    try {
      await addDoc(collection(db, 'areas_kml'), {
        name: newKmlArea.name.trim(),
        crop: newKmlArea.crop.trim(),
        sector: newKmlArea.sector.trim(),
        hectares: newKmlArea.hectares ? Number(String(newKmlArea.hectares).replace(',', '.')) : '',
        kmlLink: newKmlArea.kmlLink.trim(),
        active: true,
        createdAt: new Date().toISOString()
      });
      setNewKmlArea(emptyKmlArea);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'areas_kml');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este item?')) return;
    try {
      await deleteDoc(doc(db, activeTab, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, activeTab);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'users');
    }
  };

  if (!isAuthReady || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 lg:pb-0 lg:pl-80 overflow-y-auto touch-pan-y">
      <Header />
      <Sidebar />

      <main className="pt-24 px-6 max-w-5xl mx-auto">
        <div className="mb-12">
          <h1 className="text-[3.5rem] font-black leading-none text-primary tracking-tighter mb-2">Gerenciamento</h1>
          <p className="font-label text-tertiary text-sm tracking-widest uppercase">Administração de Recursos da Frota</p>
        </div>

        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          <TabButton active={activeTab === 'tractors'} onClick={() => setActiveTab('tractors')} icon={Tractor} label="Tratores" />
          <TabButton active={activeTab === 'implements'} onClick={() => setActiveTab('implements')} icon={Wrench} label="Implementos" />
          <TabButton active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} icon={ClipboardList} label="Operações" />
          <TabButton active={activeTab === 'operators'} onClick={() => setActiveTab('operators')} icon={User} label="Operadores" />
          <TabButton active={activeTab === 'areas_kml'} onClick={() => setActiveTab('areas_kml')} icon={MapPin} label="Áreas/KML" />
          <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={Settings} label="Usuários" />
        </div>

        {activeTab !== 'users' && activeTab !== 'areas_kml' && (
          <form onSubmit={handleAddItem} className="mb-8 flex gap-4">
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder={`Nome do novo ${
                activeTab === 'tractors' ? 'trator' :
                activeTab === 'implements' ? 'implemento' :
                activeTab === 'tasks' ? 'tipo de operação' :
                'operador'
              }...`}
              className="flex-1 h-14 bg-surface-container px-6 rounded-xl border-2 border-transparent focus:border-primary outline-none transition-all font-bold"
            />
            <button
              type="submit"
              disabled={isAdding || !newItemName.trim()}
              className="w-14 h-14 bg-primary text-on-primary rounded-xl flex items-center justify-center hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              {isAdding ? <Loader2 className="animate-spin" size={24} /> : <Plus size={24} />}
            </button>
          </form>
        )}

        {activeTab === 'areas_kml' && (
          <form onSubmit={handleAddKmlArea} className="mb-8 bg-surface-container p-6 rounded-2xl border border-primary/10">
            <div className="mb-5">
              <h2 className="font-black text-primary text-2xl tracking-tight">Cadastrar KML verdadeiro</h2>
              <p className="text-on-surface-variant text-sm mt-1">Use a mesma Safra/Café e o mesmo Setor que o operador seleciona na Nova Entrada.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                value={newKmlArea.name}
                onChange={(e) => setNewKmlArea(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nome da área. Ex: Talhão 01"
                className="h-14 bg-background px-4 rounded-xl border-2 border-transparent focus:border-primary outline-none font-bold"
              />
              <input
                value={newKmlArea.kmlLink}
                onChange={(e) => setNewKmlArea(prev => ({ ...prev, kmlLink: e.target.value }))}
                placeholder="Link do arquivo KML"
                className="h-14 bg-background px-4 rounded-xl border-2 border-transparent focus:border-primary outline-none font-bold"
              />
              <input
                value={newKmlArea.crop}
                onChange={(e) => setNewKmlArea(prev => ({ ...prev, crop: e.target.value }))}
                placeholder="Safra/Café. Ex: 2025 ou Café 2025"
                className="h-14 bg-background px-4 rounded-xl border-2 border-transparent focus:border-primary outline-none font-bold"
              />
              <input
                value={newKmlArea.sector}
                onChange={(e) => setNewKmlArea(prev => ({ ...prev, sector: e.target.value }))}
                placeholder="Setor. Ex: Setor 01"
                className="h-14 bg-background px-4 rounded-xl border-2 border-transparent focus:border-primary outline-none font-bold"
              />
              <input
                value={newKmlArea.hectares}
                onChange={(e) => setNewKmlArea(prev => ({ ...prev, hectares: e.target.value }))}
                placeholder="Hectares. Ex: 12,50"
                className="h-14 bg-background px-4 rounded-xl border-2 border-transparent focus:border-primary outline-none font-bold"
              />
              <button
                type="submit"
                disabled={isAdding}
                className="h-14 bg-primary text-on-primary rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-50 font-black uppercase tracking-wider"
              >
                {isAdding ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
                Salvar KML
              </button>
            </div>
          </form>
        )}

        <div className="bg-surface-container rounded-2xl overflow-hidden divide-y divide-outline-variant/10">
          {loading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-on-surface-variant italic">Nenhum item cadastrado.</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="p-6 flex items-center justify-between gap-4 hover:bg-surface-container-high transition-colors">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 bg-background rounded-lg flex items-center justify-center shrink-0">
                    {activeTab === 'tractors' && <Tractor size={18} className="text-primary" />}
                    {activeTab === 'implements' && <Wrench size={18} className="text-primary" />}
                    {activeTab === 'tasks' && <ClipboardList size={18} className="text-primary" />}
                    {activeTab === 'areas_kml' && <MapPin size={18} className="text-primary" />}
                    {(activeTab === 'operators' || activeTab === 'users') && <User size={18} className="text-primary" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-on-surface truncate">{getItemName(item, activeTab)}</p>
                    {activeTab === 'users' && <p className="text-xs text-on-surface-variant uppercase tracking-widest">{item.role}</p>}
                    {activeTab === 'areas_kml' && (
                      <div className="text-xs text-on-surface-variant font-bold mt-1 space-y-1">
                        <p>{item.crop || item.safraCafe || item.CAFE || 'Sem safra/café'} • {item.sector || item.setor || item.SETOR || 'Sem setor'} • {item.hectares || item.HECTARES || 'ha não informado'} ha</p>
                        {(item.kmlLink || item.linkKml || item.LINK_KML) && (
                          <a
                            href={item.kmlLink || item.linkKml || item.LINK_KML}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline"
                          >
                            <LinkIcon size={12} /> Abrir KML
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {activeTab === 'users' ? (
                    <select
                      value={item.role}
                      onChange={(e) => handleUpdateRole(item.id, e.target.value)}
                      className="bg-background px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="operator">Operador</option>
                      <option value="admin">Administrador</option>
                    </select>
                  ) : (
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-2 text-on-surface-variant hover:text-error transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-all whitespace-nowrap border-2",
        active
          ? "bg-primary/10 border-primary text-primary"
          : "bg-surface-container border-transparent text-on-surface-variant hover:bg-surface-container-high"
      )}
    >
      <Icon size={16} />
      {label}
    </button>
  );
}

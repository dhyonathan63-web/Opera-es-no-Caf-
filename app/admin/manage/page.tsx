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
  query, 
  orderBy 
} from 'firebase/firestore';
import { 
  Tractor, 
  Plus, 
  Trash2, 
  Loader2, 
  User, 
  Settings, 
  Save,
  Wrench,
  ClipboardList
} from 'lucide-react';
import { cn } from '@/lib/utils';

type ManageTab = 'tractors' | 'implements' | 'tasks' | 'operators' | 'users';

export default function AdminManagePage() {
  const { user, profile, isAuthReady } = useAuth();
  const [activeTab, setActiveTab] = useState<ManageTab>('tractors');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItemName, setNewItemName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const isAdmin = profile?.role === 'admin' || user?.email?.toLowerCase() === 'dhyonathan63@gmail.com';

  useEffect(() => {
    if (!isAdmin || !isAuthReady) return;

    let collectionName = '';
    switch (activeTab) {
      case 'tractors': collectionName = 'tractors'; break;
      case 'implements': collectionName = 'implements'; break;
      case 'tasks': collectionName = 'tasks'; break;
      case 'operators': collectionName = 'operators'; break;
      case 'users': collectionName = 'users'; break;
    }

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
      
      <main className="pt-24 px-6 max-w-4xl mx-auto">
        <div className="mb-12">
          <h1 className="text-[3.5rem] font-black leading-none text-primary tracking-tighter mb-2">Gerenciamento</h1>
          <p className="font-label text-tertiary text-sm tracking-widest uppercase">Administração de Recursos da Frota</p>
        </div>

        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          <TabButton 
            active={activeTab === 'tractors'} 
            onClick={() => setActiveTab('tractors')} 
            icon={Tractor} 
            label="Tratores" 
          />
          <TabButton 
            active={activeTab === 'implements'} 
            onClick={() => setActiveTab('implements')} 
            icon={Wrench} 
            label="Implementos" 
          />
          <TabButton 
            active={activeTab === 'tasks'} 
            onClick={() => setActiveTab('tasks')} 
            icon={ClipboardList} 
            label="Operações" 
          />
          <TabButton 
            active={activeTab === 'operators'} 
            onClick={() => setActiveTab('operators')} 
            icon={User} 
            label="Operadores" 
          />
          <TabButton 
            active={activeTab === 'users'} 
            onClick={() => setActiveTab('users')} 
            icon={Settings} 
            label="Usuários" 
          />
        </div>

        {activeTab !== 'users' && (
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
              <div key={item.id} className="p-6 flex items-center justify-between hover:bg-surface-container-high transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-background rounded-lg flex items-center justify-center">
                    {activeTab === 'tractors' && <Tractor size={18} className="text-primary" />}
                    {activeTab === 'implements' && <Wrench size={18} className="text-primary" />}
                    {activeTab === 'tasks' && <ClipboardList size={18} className="text-primary" />}
                    {(activeTab === 'operators' || activeTab === 'users') && <User size={18} className="text-primary" />}
                  </div>
                  <div>
                    <p className="font-bold text-on-surface">
                      {activeTab === 'users' ? item.displayName || item.email : item.name}
                    </p>
                    {activeTab === 'users' && (
                      <p className="text-xs text-on-surface-variant uppercase tracking-widest">{item.role}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
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

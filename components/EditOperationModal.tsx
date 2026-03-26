'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, Trash2 } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { doc, updateDoc, deleteDoc, collection, onSnapshot } from 'firebase/firestore';

interface EditOperationModalProps {
  operation: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditOperationModal({ operation, onClose, onSuccess }: EditOperationModalProps) {
  const [formData, setFormData] = useState({
    task: operation.task || '',
    sector: operation.sector || '',
    tractor: operation.tractor || '',
    implement: operation.implement || '',
    crop: operation.crop || '',
    initialMeter: operation.initialMeter || 0,
    finalMeter: operation.finalMeter || 0,
    date: operation.date || '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [tractors, setTractors] = useState<any[]>([]);
  const [implementList, setImplementList] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    const unsubTractors = onSnapshot(collection(db, 'tractors'), (snap) => {
      const list = snap.docs.map(d => d.data().name);
      setTractors(list.length > 0 ? list : ['John Deere 6115J', 'Massey Ferguson 4707', 'Case IH Farmall 80']);
    });
    const unsubImplements = onSnapshot(collection(db, 'implements'), (snap) => {
      const list = snap.docs.map(d => d.data().name);
      setImplementList(list.length > 0 ? list : ['Arado de Aiveca', 'Grade Niveladora', 'Pulverizador 2000L', 'Semeadora Direta']);
    });
    const unsubTasks = onSnapshot(collection(db, 'tasks'), (snap) => {
      const list = snap.docs.map(d => d.data().name);
      setTasks(list.length > 0 ? list : ['Preparação de Solo', 'Plantio', 'Pulverização', 'Colheita']);
    });

    return () => {
      unsubTractors();
      unsubImplements();
      unsubTasks();
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('Meter') ? parseFloat(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const opRef = doc(db, 'operations', operation.id);
      await updateDoc(opRef, {
        ...formData,
        updatedAt: new Date().toISOString()
      });
      onSuccess();
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `operations/${operation.id}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Tem certeza que deseja excluir esta operação?')) return;
    setIsDeleting(true);
    try {
      const opRef = doc(db, 'operations', operation.id);
      await deleteDoc(opRef);
      onSuccess();
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `operations/${operation.id}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface-container w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-8 py-6 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-high shrink-0">
          <div>
            <h2 className="text-2xl font-black text-primary tracking-tight">Editar Operação</h2>
            <p className="text-[0.65rem] uppercase tracking-widest text-on-surface-variant font-bold">ID: {operation.id.toUpperCase()}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-variant rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(100vh-160px)] custom-scrollbar">
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[0.65rem] font-black uppercase tracking-widest text-primary ml-1">Tarefa</label>
                <select
                  name="task"
                  value={formData.task}
                  onChange={handleChange}
                  className="w-full h-14 bg-background px-4 rounded-xl border-2 border-transparent focus:border-primary outline-none transition-all font-bold"
                >
                  {tasks.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[0.65rem] font-black uppercase tracking-widest text-primary ml-1">Setor</label>
                <select
                  name="sector"
                  value={formData.sector}
                  onChange={handleChange}
                  className="w-full h-14 bg-background px-4 rounded-xl border-2 border-transparent focus:border-primary outline-none transition-all font-bold"
                >
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
                  <option>Geral</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[0.65rem] font-black uppercase tracking-widest text-primary ml-1">Trator</label>
                <select
                  name="tractor"
                  value={formData.tractor}
                  onChange={handleChange}
                  className="w-full h-14 bg-background px-4 rounded-xl border-2 border-transparent focus:border-primary outline-none transition-all font-bold"
                >
                  {tractors.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[0.65rem] font-black uppercase tracking-widest text-primary ml-1">Implemento</label>
                <select
                  name="implement"
                  value={formData.implement}
                  onChange={handleChange}
                  className="w-full h-14 bg-background px-4 rounded-xl border-2 border-transparent focus:border-primary outline-none transition-all font-bold"
                >
                  {implementList.map(i => <option key={i}>{i}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[0.65rem] font-black uppercase tracking-widest text-primary ml-1">Horímetro Inicial</label>
                <input
                  type="number"
                  step="0.1"
                  name="initialMeter"
                  value={formData.initialMeter}
                  onChange={handleChange}
                  className="w-full h-14 bg-background px-4 rounded-xl border-2 border-transparent focus:border-primary outline-none transition-all font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[0.65rem] font-black uppercase tracking-widest text-primary ml-1">Horímetro Final</label>
                <input
                  type="number"
                  step="0.1"
                  name="finalMeter"
                  value={formData.finalMeter}
                  onChange={handleChange}
                  className="w-full h-14 bg-background px-4 rounded-xl border-2 border-transparent focus:border-primary outline-none transition-all font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[0.65rem] font-black uppercase tracking-widest text-primary ml-1">Safra</label>
                <select
                  name="crop"
                  value={formData.crop}
                  onChange={handleChange}
                  className="w-full h-14 bg-background px-4 rounded-xl border-2 border-transparent focus:border-primary outline-none transition-all font-bold"
                >
                  <option>2023</option>
                  <option>2024</option>
                  <option>2025</option>
                  <option>2026</option>
                  <option>2027</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[0.65rem] font-black uppercase tracking-widest text-primary ml-1">Data</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full h-14 bg-background px-4 rounded-xl border-2 border-transparent focus:border-primary outline-none transition-all font-bold"
                />
              </div>
            </div>

            <div className="pt-6 flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting || isSaving}
                className="flex-1 h-14 flex items-center justify-center gap-2 bg-error/10 text-error font-black uppercase tracking-widest rounded-xl hover:bg-error/20 transition-all disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="animate-spin" size={20} /> : <Trash2 size={20} />}
                Excluir
              </button>
              <button
                type="submit"
                disabled={isSaving || isDeleting}
                className="flex-[2] h-14 flex items-center justify-center gap-2 bg-primary text-on-primary font-black uppercase tracking-widest rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                Salvar Alterações
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

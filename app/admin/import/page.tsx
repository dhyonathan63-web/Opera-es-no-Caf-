'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { BottomNav, Sidebar } from '@/components/Navigation';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Loader2, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { parseRawData } from '@/lib/data-parser';

export default function ImportPage() {
  const { profile, isAuthReady, user } = useAuth();
  const router = useRouter();
  const [rawData, setRawData] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [results, setResults] = useState<{ success: number; failed: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
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

  const handleImport = async () => {
    if (!rawData.trim()) return;
    setIsImporting(true);
    setError(null);
    setResults(null);

    try {
      const parsed = parseRawData(rawData);
      let successCount = 0;
      let failedCount = 0;

      for (const op of parsed) {
        try {
          await addDoc(collection(db, 'operations'), {
            ...op,
            operatorId: user?.uid || 'ADMIN_IMPORT', // Use current user ID as creator
            createdAt: serverTimestamp(),
            synced: true
          });
          successCount++;
        } catch (err) {
          console.error('Failed to import operation:', op, err);
          handleFirestoreError(err, OperationType.WRITE, 'operations');
          failedCount++;
        }
      }

      setResults({ success: successCount, failed: failedCount });
    } catch (err) {
      setError('Erro ao processar os dados. Verifique o formato.');
      console.error(err);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="min-h-screen pb-24 lg:pb-0 lg:pl-80">
      <Header />
      <Sidebar />
      
      <main className="pt-24 px-6 max-w-4xl mx-auto">
        <div className="mb-12">
          <h1 className="text-[3.5rem] font-black leading-none text-primary tracking-tighter mb-2">Importar Dados</h1>
          <p className="font-label text-tertiary text-sm tracking-widest uppercase">Ferramenta de Migração de Logs</p>
        </div>

        <div className="bg-surface-container rounded-2xl p-8 border-l-4 border-primary mb-8">
          <h2 className="text-2xl font-bold mb-4">Instruções</h2>
          <p className="text-on-surface-variant mb-4">
            Cole os dados tabulados (Excel/Google Sheets) no campo abaixo. O formato esperado é:
          </p>
          <code className="block bg-background p-4 rounded-xl text-xs mb-6 overflow-x-auto">
            Horímetro Inicial | Operador | Trator | Implemento | Tarefa | Safra | Setor | Horímetro Final | Data | Horas Totais
          </code>
          
          <textarea
            className="w-full h-64 bg-background p-4 rounded-xl border-2 border-outline-variant/20 focus:border-primary outline-none ring-0 focus:ring-2 focus:ring-primary/10 text-on-surface font-mono text-sm mb-6"
            placeholder="Cole os dados aqui..."
            value={rawData}
            onChange={(e) => setRawData(e.target.value)}
            disabled={isImporting}
          />

          <div className="flex items-center gap-4">
            <button
              onClick={handleImport}
              disabled={isImporting || !rawData.trim()}
              className="flex items-center gap-2 px-8 py-4 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isImporting ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Importando...
                </>
              ) : (
                <>
                  <Upload size={20} />
                  Iniciar Importação
                </>
              )}
            </button>
            
            {results && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-primary font-bold">
                  <CheckCircle2 size={20} />
                  {results.success} Sucessos
                </div>
                {results.failed > 0 && (
                  <div className="flex items-center gap-2 text-error font-bold">
                    <AlertCircle size={20} />
                    {results.failed} Falhas
                  </div>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="mt-6 p-4 bg-error/10 text-error rounded-xl flex items-center gap-3">
              <AlertCircle size={20} />
              <p className="font-bold">{error}</p>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from '@/components/Header';
import { BottomNav, Sidebar } from '@/components/Navigation';
import { 
  Tractor, 
  Save, 
  Calendar,
  ChevronDown,
  Loader2,
  CheckCircle2,
  Table as TableIcon,
  Link as LinkIcon
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, serverTimestamp, onSnapshot, addDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

type CadastroItem = {
  id?: string;
  name?: string;
  nome?: string;
  NOME?: string;
  modelo?: string;
  MODELO?: string;
  codigo?: string;
  CODIGO?: string;
  code?: string;
  barcode?: string;
  barCode?: string;
  codigoBarras?: string;
  codigo_barras?: string;
  CODIGO_BARRAS?: string;
  'CÓDIGO'?: string;
  operacao?: string;
  OPERACAO?: string;
  operacaoPadrao?: string;
  task?: string;
  [key: string]: any;
};

type ScanTarget = 'tractor' | 'implement';

const defaultTractors: CadastroItem[] = [
  { name: 'John Deere 6115J', codigo: 'JD-6115J' },
  { name: 'Massey Ferguson 4707', codigo: 'MF-4707' },
  { name: 'Case IH Farmall 80', codigo: 'CASE-F80' },
];

const defaultImplements: CadastroItem[] = [
  { name: 'Arado de Aiveca', codigo: 'IMP-ARADO' },
  { name: 'Grade Niveladora', codigo: 'IMP-GRADE' },
  { name: 'Pulverizador 2000L', codigo: 'IMP-PULV-2000' },
  { name: 'Semeadora Direta', codigo: 'IMP-SEMEADORA' },
];

const defaultTasks = ['Preparação de Solo', 'Plantio', 'Pulverização', 'Colheita'];
const defaultOperators = ['Operador 1', 'Operador 2', 'Operador 3', 'Dhyonathan'];

function normalizeCode(value: unknown) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase();
}

function getItemName(item: CadastroItem | string) {
  if (typeof item === 'string') return item;
  return String(item.name || item.nome || item.NOME || item.modelo || item.MODELO || item.id || '');
}

function getItemCode(item: CadastroItem | string) {
  if (typeof item === 'string') return item;
  return String(
    item.codigo ||
      item.CODIGO ||
      item['CÓDIGO'] ||
      item.code ||
      item.barcode ||
      item.barCode ||
      item.codigoBarras ||
      item.codigo_barras ||
      item.CODIGO_BARRAS ||
      item.id ||
      getItemName(item)
  );
}

function getSearchTokens(item: CadastroItem | string) {
  if (typeof item === 'string') return [normalizeCode(item)];

  const keys = [
    'codigo',
    'CODIGO',
    'CÓDIGO',
    'code',
    'barcode',
    'barCode',
    'codigoBarras',
    'codigo_barras',
    'CODIGO_BARRAS',
    'id',
    'name',
    'nome',
    'NOME',
    'modelo',
    'MODELO',
  ];

  return keys
    .map((key) => normalizeCode(item[key]))
    .filter(Boolean);
}

function mapCadastroDoc(doc: any): CadastroItem {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    name: data.name || data.nome || data.NOME || data.modelo || data.MODELO || doc.id,
    codigo: data.codigo || data.CODIGO || data['CÓDIGO'] || data.code || data.barcode || data.codigoBarras || data.codigo_barras || doc.id,
  };
}

export default function NewEntry() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanLoopRef = useRef<number | null>(null);
  const scanActiveRef = useRef(false);

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [tractors, setTractors] = useState<CadastroItem[]>([]);
  const [implementList, setImplementList] = useState<CadastroItem[]>([]);
  const [tasks, setTasks] = useState<string[]>([]);
  const [operators, setOperators] = useState<string[]>([]);
  const [sheetsConnected, setSheetsConnected] = useState(false);
  const [checkingSheets, setCheckingSheets] = useState(true);
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [scanTarget, setScanTarget] = useState<ScanTarget | null>(null);
  const [scanError, setScanError] = useState('');
  const [scanStatus, setScanStatus] = useState('');
  const [manualCodes, setManualCodes] = useState({ tractor: '', implement: '' });

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    tractor: '',
    implement: '',
    task: '',
    crop: '2023',
    sector: 'Setor 1',
    initialMeter: '',
    finalMeter: '',
    operatorName: '',
  });

  useEffect(() => {
    const unsubTractors = onSnapshot(collection(db, 'tractors'), (snap) => {
      const list = snap.docs.map(mapCadastroDoc);
      const finalList = list.length > 0 ? list : defaultTractors;
      setTractors(finalList);
      if (!formData.tractor && finalList.length > 0) {
        setFormData(prev => ({ ...prev, tractor: getItemName(finalList[0]) }));
      }
    });

    const unsubImplements = onSnapshot(collection(db, 'implements'), (snap) => {
      const list = snap.docs.map(mapCadastroDoc);
      const finalList = list.length > 0 ? list : defaultImplements;
      setImplementList(finalList);
      if (!formData.implement && finalList.length > 0) {
        setFormData(prev => ({ ...prev, implement: getItemName(finalList[0]) }));
      }
    });

    const unsubTasks = onSnapshot(collection(db, 'tasks'), (snap) => {
      const list = snap.docs.map(d => String(d.data().name || d.data().nome || d.id));
      const finalList = list.length > 0 ? list : defaultTasks;
      setTasks(finalList);
      if (!formData.task && finalList.length > 0) {
        setFormData(prev => ({ ...prev, task: finalList[0] }));
      }
    });

    const unsubOperators = onSnapshot(collection(db, 'operators'), (snap) => {
      const list = snap.docs.map(d => String(d.data().name || d.data().nome || d.id));
      const finalList = list.length > 0 ? list : defaultOperators;
      setOperators(finalList);
      if (!formData.operatorName && finalList.length > 0) {
        setFormData(prev => ({ ...prev, operatorName: finalList[0] }));
      }
    });

    return () => {
      unsubTractors();
      unsubImplements();
      unsubTasks();
      unsubOperators();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkSheetsStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/google/status');
      const data = await res.json();
      setSheetsConnected(Boolean(data.connected));
    } catch (error) {
      console.error('Error checking sheets status:', error);
    } finally {
      setCheckingSheets(false);
    }
  }, []);

  useEffect(() => {
    checkSheetsStatus();

    const savedQueue = localStorage.getItem('sheets_offline_queue');
    if (savedQueue) {
      setOfflineQueue(JSON.parse(savedQueue));
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        setSheetsConnected(true);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkSheetsStatus]);

  const stopScanner = useCallback(() => {
    scanActiveRef.current = false;

    if (scanLoopRef.current) {
      window.cancelAnimationFrame(scanLoopRef.current);
      scanLoopRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setScanTarget(null);
  }, []);

  useEffect(() => {
    return () => stopScanner();
  }, [stopScanner]);

  const applyBarcode = useCallback((target: ScanTarget, rawCode: string) => {
    const cleanCode = normalizeCode(rawCode);
    const list = target === 'tractor' ? tractors : implementList;
    const found = list.find(item => getSearchTokens(item).includes(cleanCode));

    if (!found) {
      setScanError(`Código ${rawCode} não encontrado no cadastro de ${target === 'tractor' ? 'tratores' : 'implementos'}.`);
      return false;
    }

    const itemName = getItemName(found);
    const itemCode = getItemCode(found);

    setFormData(prev => {
      const next = {
        ...prev,
        [target]: itemName,
      };

      if (target === 'implement') {
        const suggestedTask = found.operacaoPadrao || found.operacao || found.OPERACAO || found.task;
        if (suggestedTask && tasks.includes(String(suggestedTask))) {
          next.task = String(suggestedTask);
        }
      }

      return next;
    });

    setScanStatus(`${target === 'tractor' ? 'Trator' : 'Implemento'} encontrado: ${itemName} — código ${itemCode}`);
    setScanError('');
    setManualCodes(prev => ({ ...prev, [target]: '' }));
    return true;
  }, [tractors, implementList, tasks]);

  const startBarcodeScan = useCallback(async (target: ScanTarget) => {
    stopScanner();
    setScanTarget(target);
    setScanError('');
    setScanStatus('Aponte a câmera para o código de barras cadastrado.');

    if (!navigator.mediaDevices?.getUserMedia) {
      setScanError('Este aparelho/navegador não liberou câmera. Use o campo manual abaixo.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const BarcodeDetectorCtor = (window as any).BarcodeDetector;
      if (!BarcodeDetectorCtor) {
        setScanError('Leitor automático não está disponível neste navegador. Use o campo manual.');
        return;
      }

      const detector = new BarcodeDetectorCtor({
        formats: [
          'code_128',
          'code_39',
          'code_93',
          'ean_13',
          'ean_8',
          'itf',
          'upc_a',
          'upc_e',
          'codabar',
        ],
      });

      scanActiveRef.current = true;

      const tick = async () => {
        if (!scanActiveRef.current) return;

        try {
          const video = videoRef.current;
          if (video && video.readyState >= 2) {
            const barcodes = await detector.detect(video);
            if (barcodes.length > 0) {
              const value = String(barcodes[0].rawValue || '');
              if (applyBarcode(target, value)) {
                stopScanner();
                return;
              }
            }
          }
        } catch (error) {
          console.error('Erro ao ler código de barras:', error);
        }

        scanLoopRef.current = window.requestAnimationFrame(tick);
      };

      tick();
    } catch (error) {
      console.error('Erro ao abrir câmera:', error);
      setScanError('Não foi possível abrir a câmera. Verifique permissão da câmera ou use o código manual.');
    }
  }, [applyBarcode, stopScanner]);

  const applyManualCode = (target: ScanTarget) => {
    const code = manualCodes[target];
    if (!code.trim()) {
      setScanError('Digite o código de barras primeiro.');
      return;
    }
    applyBarcode(target, code);
  };

  const syncOfflineQueue = useCallback(async () => {
    const queue = [...offlineQueue];
    const failed: any[] = [];

    for (const item of queue) {
      try {
        const res = await fetch('/api/sheets/append', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        });
        if (!res.ok) throw new Error('Failed to sync');
      } catch (error) {
        failed.push(item);
      }
    }

    setOfflineQueue(failed);
    localStorage.setItem('sheets_offline_queue', JSON.stringify(failed));
  }, [offlineQueue]);

  useEffect(() => {
    if (isOnline && offlineQueue.length > 0 && sheetsConnected) {
      syncOfflineQueue();
    }
  }, [isOnline, sheetsConnected, offlineQueue.length, syncOfflineQueue]);

  const handleConnectSheets = async () => {
    try {
      const res = await fetch(`/api/auth/google/url?uid=${user?.uid || ''}`);
      const { url } = await res.json();
      window.open(url, 'google_auth_popup', 'width=600,height=700');
    } catch (error) {
      console.error('Error getting auth URL:', error);
      alert('Erro ao conectar com o Google');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sheetsConnected) {
      alert('O sistema não está conectado ao Google Sheets. Peça ao administrador para realizar a conexão.');
      return;
    }

    setSubmitting(true);
    try {
      const operationData = {
        ...formData,
        operatorId: user?.uid || 'anonymous',
        operatorName: formData.operatorName || profile?.displayName || user?.displayName || 'Operador Desconhecido',
        initialMeter: parseFloat(formData.initialMeter),
        finalMeter: formData.finalMeter ? parseFloat(formData.finalMeter) : null,
        createdAt: serverTimestamp(),
        synced: true,
      };

      try {
        await addDoc(collection(db, 'operations'), operationData);
      } catch (fsError) {
        console.error('Error saving to Firestore:', fsError);
      }

      if (!isOnline) {
        const newQueue = [...offlineQueue, operationData];
        setOfflineQueue(newQueue);
        localStorage.setItem('sheets_offline_queue', JSON.stringify(newQueue));
        setSuccess(true);
        setTimeout(() => router.push('/'), 1500);
        return;
      }

      const res = await fetch('/api/sheets/append', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(operationData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao salvar na planilha');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const renderBarcodeControls = (target: ScanTarget) => {
    const label = target === 'tractor' ? 'trator' : 'implemento';

    return (
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
        <input
          value={manualCodes[target]}
          onChange={(e) => setManualCodes(prev => ({ ...prev, [target]: e.target.value }))}
          className="h-12 bg-surface-container-highest px-4 rounded-lg border border-outline-variant/20 text-sm font-bold text-on-surface focus:ring-2 focus:ring-primary/50 outline-none"
          placeholder={`Digite o código do ${label}`}
          type="text"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => applyManualCode(target)}
            className="h-12 px-4 bg-surface-container-highest text-primary rounded-lg font-black text-xs uppercase tracking-wider active:scale-95 transition-all"
          >
            Buscar
          </button>
          <button
            type="button"
            onClick={() => startBarcodeScan(target)}
            className="h-12 px-4 bg-primary text-on-primary rounded-lg font-black text-xs uppercase tracking-wider active:scale-95 transition-all"
          >
            Ler câmera
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-24 lg:pb-0 lg:pl-80 overflow-y-auto touch-pan-y">
      <Header />
      <Sidebar />

      <main className="pt-24 px-6 max-w-4xl mx-auto">
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-[3.5rem] font-black leading-none text-primary tracking-tighter mb-2">Nova Entrada</h1>
            <p className="font-label text-tertiary text-sm tracking-widest uppercase">Rastreamento de Operação de Campo</p>
          </div>

          {!checkingSheets && !sheetsConnected && (profile?.role === 'admin' || user?.email?.toLowerCase() === 'dhyonathan63@gmail.com') && (
            <button
              onClick={handleConnectSheets}
              className="flex items-center gap-3 px-6 py-3 bg-surface-container-high text-primary rounded-xl font-bold hover:bg-primary hover:text-on-primary transition-all active:scale-95"
            >
              <LinkIcon size={18} />
              Conectar Google Planilhas
            </button>
          )}

          {!checkingSheets && !sheetsConnected && !(profile?.role === 'admin' || user?.email?.toLowerCase() === 'dhyonathan63@gmail.com') && (
            <div className="flex items-center gap-3 px-6 py-3 bg-error/10 text-error rounded-xl font-bold border border-error/20">
              <LinkIcon size={18} />
              Aguardando Conexão do Admin
            </div>
          )}

          {sheetsConnected && (
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-3 px-6 py-3 bg-primary/10 text-primary rounded-xl font-bold border border-primary/20">
                <TableIcon size={18} />
                Planilha Conectada
              </div>
              {offlineQueue.length > 0 && (
                <span className="text-[10px] text-primary uppercase font-black tracking-tighter">
                  {offlineQueue.length} entradas aguardando sincronização
                </span>
              )}
            </div>
          )}
        </div>

        {scanTarget && (
          <section className="mb-8 bg-surface-container-high rounded-2xl p-4 border border-primary/20">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-primary font-black text-xl tracking-tight">
                  Leitor de código de barras — {scanTarget === 'tractor' ? 'Trator' : 'Implemento'}
                </h2>
                <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wider mt-1">Use a câmera ou digite o código cadastrado.</p>
              </div>
              <button
                type="button"
                onClick={stopScanner}
                className="px-4 py-2 rounded-lg bg-background text-on-surface font-black text-xs uppercase tracking-wider active:scale-95"
              >
                Fechar
              </button>
            </div>
            <video
              ref={videoRef}
              className="w-full max-h-[360px] bg-black rounded-xl object-cover"
              playsInline
              muted
            />
            <div className="mt-4">{renderBarcodeControls(scanTarget)}</div>
          </section>
        )}

        {(scanStatus || scanError) && (
          <div className={`mb-8 rounded-xl px-5 py-4 font-bold text-sm ${scanError ? 'bg-error/10 text-error border border-error/20' : 'bg-primary/10 text-primary border border-primary/20'}`}>
            {scanError || scanStatus}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-12 pb-12">
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 bg-surface-container-low p-6 rounded-xl flex flex-col justify-end min-h-[140px] relative group">
              <label className="font-label text-[0.75rem] text-on-surface-variant uppercase tracking-wider mb-2">Data da Operação</label>
              <div className="flex items-center justify-between">
                <input
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="bg-transparent border-none text-2xl font-bold text-on-surface p-0 focus:ring-0 w-full cursor-pointer"
                  type="date"
                  required
                />
                <Calendar className="text-on-surface-variant group-hover:text-primary transition-colors" size={24} />
              </div>
            </div>

            <div className="bg-surface-container-high p-6 rounded-xl flex flex-col justify-end min-h-[140px] relative group">
              <label className="font-label text-[0.75rem] text-on-surface-variant uppercase tracking-wider mb-2">Operador</label>
              <div className="flex items-center justify-between">
                <select
                  name="operatorName"
                  value={formData.operatorName}
                  onChange={handleChange}
                  className="bg-transparent border-none text-xl font-bold text-primary p-0 focus:ring-0 w-full cursor-pointer appearance-none"
                >
                  {operators.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <ChevronDown className="text-primary group-hover:scale-110 transition-transform" size={20} />
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-surface-container p-8 rounded-xl flex flex-col gap-4 border-l-4 border-primary/20">
              <div className="flex items-center gap-3 text-primary">
                <Tractor size={20} />
                <label className="font-label text-[0.75rem] uppercase tracking-wider">Trator</label>
              </div>
              <select
                name="tractor"
                value={formData.tractor}
                onChange={handleChange}
                className="bg-surface-container-highest h-16 px-4 rounded-lg border-none text-lg font-bold text-on-surface focus:ring-2 focus:ring-primary/50 transition-all appearance-none cursor-pointer"
              >
                {tractors.map(t => (
                  <option key={getItemCode(t)} value={getItemName(t)}>{getItemName(t)}</option>
                ))}
              </select>
              {renderBarcodeControls('tractor')}
            </div>

            <div className="bg-surface-container p-8 rounded-xl flex flex-col gap-4 border-l-4 border-tertiary/20">
              <div className="flex items-center gap-3 text-tertiary">
                <Tractor size={20} />
                <label className="font-label text-[0.75rem] uppercase tracking-wider">Implemento</label>
              </div>
              <select
                name="implement"
                value={formData.implement}
                onChange={handleChange}
                className="bg-surface-container-highest h-16 px-4 rounded-lg border-none text-lg font-bold text-on-surface focus:ring-2 focus:ring-primary/50 transition-all appearance-none cursor-pointer"
              >
                {implementList.map(i => (
                  <option key={getItemCode(i)} value={getItemName(i)}>{getItemName(i)}</option>
                ))}
              </select>
              {renderBarcodeControls('implement')}
            </div>
          </div>

          <section className="bg-surface-container-low rounded-2xl overflow-hidden p-1 gap-1 grid grid-cols-1 md:grid-cols-3">
            <div className="bg-background p-6">
              <label className="font-label text-[0.75rem] text-on-surface-variant uppercase tracking-wider block mb-4">Operação</label>
              <select
                name="task"
                value={formData.task}
                onChange={handleChange}
                className="w-full bg-surface-container-high h-12 px-3 rounded-lg border-none font-medium"
              >
                {tasks.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="bg-background p-6">
              <label className="font-label text-[0.75rem] text-on-surface-variant uppercase tracking-wider block mb-4">Safra / Café</label>
              <select
                name="crop"
                value={formData.crop}
                onChange={handleChange}
                className="w-full bg-surface-container-high h-12 px-3 rounded-lg border-none font-medium"
              >
                <option>2023</option>
                <option>2024</option>
                <option>2025</option>
                <option>2026</option>
                <option>2027</option>
              </select>
            </div>
            <div className="bg-background p-6">
              <label className="font-label text-[0.75rem] text-on-surface-variant uppercase tracking-wider block mb-4">Setor</label>
              <select
                name="sector"
                value={formData.sector}
                onChange={handleChange}
                className="w-full bg-surface-container-high h-12 px-3 rounded-lg border-none font-medium"
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
              </select>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="flex flex-col gap-2">
              <label className="font-label text-[0.75rem] text-primary uppercase tracking-widest font-bold">Horímetro Inicial</label>
              <div className="relative group">
                <input
                  name="initialMeter"
                  value={formData.initialMeter}
                  onChange={handleChange}
                  className="w-full h-20 bg-surface-container-highest border-none text-4xl font-black text-on-surface px-6 rounded-xl focus:ring-0 transition-all group-hover:bg-surface-variant"
                  placeholder="0000.0"
                  type="number"
                  step="0.1"
                  required
                />
                <div className="absolute bottom-0 left-0 w-full h-1 bg-primary scale-x-0 group-focus-within:scale-x-100 transition-transform origin-left"></div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-label text-[0.75rem] text-secondary uppercase tracking-widest font-bold">Horímetro Final</label>
              <div className="relative group">
                <input
                  name="finalMeter"
                  value={formData.finalMeter}
                  onChange={handleChange}
                  className="w-full h-20 bg-surface-container-highest border-none text-4xl font-black text-on-surface px-6 rounded-xl focus:ring-0 transition-all group-hover:bg-surface-variant"
                  placeholder="0000.0"
                  type="number"
                  step="0.1"
                />
                <div className="absolute bottom-0 left-0 w-full h-1 bg-secondary scale-x-0 group-focus-within:scale-x-100 transition-transform origin-left"></div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-outline-variant/20 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-4 bg-surface-container-high py-3 px-6 rounded-full">
              <span className="font-label text-xs uppercase tracking-widest text-on-surface-variant">Sincronizar com Planilhas</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input defaultChecked className="sr-only peer" type="checkbox" />
                <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <button
              disabled={submitting || success}
              className="w-full md:w-auto px-12 h-16 bg-gradient-to-br from-primary to-primary-container text-on-primary font-black text-lg rounded-xl flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-primary/10 disabled:opacity-50"
              type="submit"
            >
              {submitting ? (
                <Loader2 className="animate-spin" size={24} />
              ) : success ? (
                <CheckCircle2 size={24} />
              ) : (
                <Save size={24} />
              )}
              {success ? 'Salvo!' : submitting ? 'Salvando...' : 'Salvar Entrada'}
            </button>
          </div>
        </form>
      </main>

      <BottomNav />
    </div>
  );
}

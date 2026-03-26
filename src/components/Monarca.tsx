import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Target, Save, Plus, Maximize2, X, Calendar, Edit3, 
  Trash2, CalendarPlus, Clock, History, Eye, ShieldCheck, 
  Lock, ChevronRight, BarChart3
} from 'lucide-react';

/**
 * COMPONENTE MONARCA MASTER - VERSÃO 2026
 * Desenvolvido para Gilmar - Foco em Auditoria e Privacidade
 */
const Monarca = ({ 
  notes = [], 
  objectives = [], 
  sessions = [], 
  setNotes, 
  setObjectives, 
  setSessions 
}: any) => {
  
  // --- SEGURANÇA CONTRA TELA BRANCA ---
  // Garante que o código não trave se o Firebase enviar dados vazios
  const safeSessions = useMemo(() => Array.isArray(sessions) ? sessions : [], [sessions]);
  const safeObjectives = useMemo(() => Array.isArray(objectives) ? objectives : [], [objectives]);
  const safeNotes = useMemo(() => Array.isArray(notes) ? notes : [], [notes]);

  // --- ESTADOS DO CRONÔMETRO ---
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const timerRef = useRef<any>(null);

  // --- ESTADOS DE INTERFACE ---
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [showHist, setShowHist] = useState(false);
  const [viewDiarioHist, setViewDiarioHist] = useState(false);

  // --- ESTADOS DE EDIÇÃO ---
  const [newObj, setNewObj] = useState('');
  const [editingObjId, setEditingObjId] = useState<string | null>(null);
  const [diarioContent, setDiarioContent] = useState('');
  const [editingDiarioId, setEditingDiarioId] = useState<string | null>(null);

  // --- ESTADOS DE AUDITORIA MANUAL (CALENDÁRIO) ---
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualTime, setManualTime] = useState('00:00:00');

  // --- FUNÇÕES DE CONVERSÃO DE TEMPO ---
  const tToS = (t: string) => {
    if (!t) return 0;
    const parts = t.split(':').map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return 0;
  };

  const sToT = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const formatDisplay = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return `${h}:${m.toString().padStart(2, '0')} hs`;
  };

  // --- MOTOR DE ESTATÍSTICAS (Sincronizado com Firebase) ---
  const stats = useMemo(() => {
    const agora = new Date();
    const mesAtual = (agora.getMonth() + 1).toString().padStart(2, '0');
    const anoAtual = agora.getFullYear().toString();
    
    // Somatório Mensal Rigoroso
    const totalMes = safeSessions.reduce((acc: number, item: any) => {
      const p = item.data?.split('/') || [];
      return (p[1] === mesAtual && p[2] === anoAtual) ? acc + tToS(item.tempo) : acc;
    }, 0);
    
    // Somatório Anual
    const totalAno = safeSessions.reduce((acc: number, item: any) => {
      const p = item.data?.split('/') || [];
      return (p[2] === anoAtual) ? acc + tToS(item.tempo) : acc;
    }, 0);

    // Agrupamento para o Histórico
    const agrupado = safeSessions.reduce((acc: any, item: any) => {
      if (!item.data) return acc;
      acc[item.data] = (acc[item.data] || 0) + tToS(item.tempo);
      return acc;
    }, {});

    const historyOrdenado = Object.keys(agrupado).map(data => ({
      data,
      tempo: sToT(agrupado[data]),
      segundos: agrupado[data]
    })).sort((a, b) => b.data.split('/').reverse().join('').localeCompare(a.data.split('/').reverse().join('')));

    return { 
      mensal: formatDisplay(totalMes), 
      anual: formatDisplay(totalAno), 
      mesNome: agora.toLocaleString('pt-BR', { month: 'long' }).toUpperCase(),
      history: historyOrdenado
    };
  }, [safeSessions]);

  // --- EFEITO DO CRONÔMETRO ---
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isActive]);

  return (
    <div className="space-y-6 pb-24 animate-in fade-in max-w-full overflow-hidden">
      
      {/* 1. PAINEL DO CRONÔMETRO */}
      <div className="bg-zinc-900 p-8 sm:p-12 rounded-[50px] text-center border-b-8 border-red-700 shadow-2xl flex flex-col items-center">
        <div className="flex gap-2 mb-6">
          <div className="bg-red-700/20 text-red-500 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-700/30">
            {stats.mesNome}: {stats.mensal}
          </div>
          <div className="bg-zinc-800 text-zinc-500 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-zinc-700">
            TOTAL ANO: {stats.anual}
          </div>
        </div>
        
        <div className="py-6 select-none">
          <span className="text-7xl sm:text-9xl font-black text-white font-mono tracking-tighter italic leading-none drop-shadow-2xl">
            {sToT(seconds)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full mt-6">
          <button 
            onClick={() => setIsActive(!isActive)} 
            className={`py-6 rounded-3xl font-black text-xs uppercase shadow-xl active:scale-95 transition-all ${isActive ? 'bg-orange-600' : 'bg-green-700'} text-white`}
          >
            {isActive ? 'PAUSAR' : 'INICIAR'}
          </button>
          <button 
            onClick={() => { 
              if(seconds === 0) return; 
              const hoje = new Date().toLocaleDateString('pt-BR');
              setSessions([{ id: Date.now().toString(), tempo: sToT(seconds), data: hoje }, ...safeSessions]); 
              setSeconds(0); setIsActive(false); 
            }} 
            className="bg-zinc-800 py-6 rounded-3xl font-black text-xs text-white border border-zinc-700 active:scale-95 shadow-lg"
          >
            SALVAR
          </button>
        </div>
        
        <button 
          onClick={() => setShowHist(true)} 
          className="mt-8 w-full text-zinc-600 font-black text-[10px] uppercase flex items-center justify-center gap-3 tracking-[0.3em] hover:text-red-600 transition-colors"
        >
          <BarChart3 size={14}/> AUDITORIA E ESTATÍSTICAS
        </button>
      </div>

      {/* 2. OBJETIVOS (Sincronizado com Firebase) */}
      <div className="bg-black p-8 rounded-[40px] border-b-8 border-zinc-800 shadow-2xl">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-white font-black italic text-xl uppercase flex items-center gap-3">
            <Target className="text-red-600" /> Objetivos
          </h2>
          <button 
            onClick={() => setIsFocusMode(true)} 
            className="bg-zinc-900 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 border border-zinc-800 active:scale-95"
          >
            <Maximize2 size={14}/> MODO FOCO
          </button>
        </div>
        
        <div className="flex gap-2 mb-6">
          <input 
            type="text" 
            value={newObj} 
            onChange={(e) => setNewObj(e.target.value)} 
            placeholder="Nova meta..." 
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-6 text-white text-sm outline-none focus:border-red-600" 
          />
          <button 
            onClick={() => { 
              if(!newObj.trim()) return; 
              if(editingObjId) {
                setObjectives(safeObjectives.map((o: any) => o.id === editingObjId ? { ...o, texto: newObj } : o));
                setEditingObjId(null);
              } else {
                setObjectives([{id: Date.now().toString(), texto: newObj}, ...safeObjectives]); 
              }
              setNewObj(''); 
            }} 
            className="bg-red-700 text-white p-5 rounded-2xl shadow-xl active:scale-90"
          >
            {editingObjId ? <Save size={24}/> : <Plus size={24}/>}
          </button>
        </div>

        <div className="space-y-3">
          {safeObjectives.map((obj: any) => (
            <div key={obj.id} className="bg-zinc-900/40 p-5 rounded-3xl border border-zinc-800/50 flex justify-between items-center group">
              <span className="text-zinc-300 text-sm italic font-bold">"{obj.texto}"</span>
              <div className="flex gap-4">
                <button onClick={() => { setEditingObjId(obj.id); setNewObj(obj.texto); }} className="text-blue-500 font-black text-[9px] uppercase">Editar</button>
                <button onClick={() => setObjectives(safeObjectives.filter((o: any) => o.id !== obj.id))} className="text-red-600 font-black text-[9px] uppercase">Excluir</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. MEMORIAL (DIÁRIO COM PRIVACIDADE) */}
      <div className="bg-zinc-900 p-8 rounded-[40px] border-b-8 border-amber-600 shadow-2xl">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-white font-black italic text-xl flex items-center gap-3 uppercase text-amber-500">Memorial de Luta</h2>
          <button 
            onClick={() => setViewDiarioHist(!viewDiarioHist)} 
            className="text-zinc-500 text-[10px] uppercase font-black px-4 py-2 rounded-xl border border-zinc-800"
          >
            {viewDiarioHist ? 'ESCREVER RELATO' : 'VER HISTÓRICO'}
          </button>
        </div>
        
        {!viewDiarioHist ? (
          <div className="animate-in fade-in">
            <textarea 
              className="w-full bg-zinc-800 p-6 rounded-[30px] text-white font-medium border-2 border-zinc-700 outline-none focus:border-amber-500 italic h-52 resize-none mb-4 shadow-inner" 
              value={diarioContent} 
              onChange={(e) => setDiarioContent(e.target.value)} 
              placeholder="O que você determinou hoje?" 
            />
            <button 
              onClick={() => {
                if(!diarioContent.trim()) return;
                if (editingDiarioId) {
                  setNotes(safeNotes.map((e: any) => e.id === editingDiarioId ? { ...e, content: diarioContent } : e));
                  setEditingDiarioId(null);
                } else {
                  setNotes([{ id: Date.now().toString(), date: new Date().toLocaleDateString('pt-BR'), content: diarioContent }, ...safeNotes]);
                }
                setDiarioContent(''); setViewDiarioHist(true); 
              }} 
              className="w-full bg-amber-600 text-white py-6 rounded-3xl font-black uppercase text-xs flex items-center justify-center gap-3 shadow-2xl active:scale-95"
            >
              <ShieldCheck size={20}/> CONCLUIR E OCULTAR
            </button>
          </div>
        ) : (
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar animate-in slide-in-from-right">
            {safeNotes.map((e: any) => (
              <div key={e.id} className="bg-zinc-800/30 p-6 rounded-[30px] border border-zinc-700/50 flex justify-between items-center group">
                <div className="flex-1 pr-4">
                  <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">{e.date}</span>
                  <p className="text-zinc-500 text-xs italic mt-1 font-bold flex items-center gap-2"><Lock size={12}/> Registro Protegido</p>
                </div>
                <button 
                  onClick={() => { setDiarioContent(e.content); setEditingDiarioId(e.id); setViewDiarioHist(false); }} 
                  className="bg-zinc-900 px-5 py-3 rounded-2xl text-blue-400 font-black text-[9px] uppercase border border-zinc-700 shadow-md active:scale-90"
                >
                  ABRIR
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. MODO FOCO (TELA CHEIA) */}
      {isFocusMode && (
        <div className="fixed inset-0 bg-black z-[600] flex flex-col animate-in zoom-in overflow-hidden">
          <div className="flex justify-end p-10">
            <button onClick={() => setIsFocusMode(false)} className="text-zinc-800 hover:text-white transition-colors">
              <X size={64}/>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-8 pb-32">
            <div className="max-w-5xl mx-auto flex flex-col items-center justify-center min-h-full gap-16 text-center">
              {safeObjectives.map((o: any) => (
                <div key={o.id} className="w-full py-10 border-b border-zinc-900/30 last:border-0">
                  <p className="text-white font-black italic uppercase leading-tight tracking-tighter" style={{ fontSize: 'clamp(2rem, 10vw, 8rem)' }}>"{o.texto}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. AUDITORIA (CALENDÁRIO DE EDIÇÃO) */}
      {showHist && (
        <div className="fixed inset-0 bg-black z-[500] p-6 overflow-y-auto animate-in fade-in pb-32">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-white font-black uppercase text-sm tracking-[0.3em] italic">Auditoria Monarca</h2>
            <button onClick={() => setShowHist(false)} className="bg-red-700 text-white p-3 rounded-full shadow-2xl active:scale-90"><X/></button>
          </div>

          <div className="bg-zinc-900 p-8 rounded-[40px] border-2 border-dashed border-red-700/30 mb-10 shadow-2xl">
            <p className="text-white font-black text-[10px] uppercase mb-6 flex items-center gap-3 tracking-widest italic">
              <CalendarPlus size={16} className="text-red-600"/> Ajuste Retroativo de Tempo
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-500 uppercase ml-2">Escolher Data</label>
                <input 
                  type="date" 
                  className="w-full bg-zinc-800 p-4 rounded-2xl text-sm font-bold text-white border border-zinc-700 outline-none focus:border-red-600" 
                  value={manualDate} 
                  onChange={e => setManualDate(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-500 uppercase ml-2">Tempo (HH:MM:SS)</label>
                <input 
                  type="text" 
                  placeholder="00:00:00" 
                  className="w-full bg-zinc-800 p-4 rounded-2xl text-sm font-bold text-white border border-zinc-700 outline-none focus:border-red-600" 
                  value={manualTime} 
                  onChange={e => setManualTime(e.target.value)} 
                />
              </div>
            </div>
            <button 
              onClick={() => {
                const dF = manualDate.split('-').reverse().join('/');
                const hF = safeSessions.filter((h: any) => h.data !== dF);
                setSessions([{ id: Date.now().toString(), tempo: manualTime, data: dF }, ...hF]);
                setManualTime('00:00:00');
              }} 
              className="w-full bg-red-700 text-white py-5 rounded-[25px] font-black text-xs uppercase shadow-xl active:scale-95 transition-all"
            >
              GRAVAR NO HISTÓRICO
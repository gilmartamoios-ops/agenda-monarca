import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Clock, History, Save, Target, Edit3, Trash2, X, Maximize2, Calendar, Trophy, Plus, ChevronLeft, ChevronRight, Zap } from 'lucide-react';

const Monarca = () => {
  const [seconds, setSeconds] = useState(() => parseInt(localStorage.getItem('mon-daimoku-sec') || '0'));
  const [isActive, setIsActive] = useState(() => localStorage.getItem('mon-active') === 'true');
  const [history, setHistory] = useState<any[]>(() => JSON.parse(localStorage.getItem('mon-daimoku-hist') || '[]'));
  const [objetivos, setObjetivos] = useState<any[]>(() => JSON.parse(localStorage.getItem('mon-daimoku-obj') || '[]'));
  
  const [diarioContent, setDiarioContent] = useState('');
  const [diarioEntries, setDiarioEntries] = useState<any[]>(() => JSON.parse(localStorage.getItem('mon-diario-entries') || '[]'));
  const [editingDiarioId, setEditingDiarioId] = useState<string | null>(null);
  const [viewDiarioHist, setViewDiarioHist] = useState(false);
  const [showHist, setShowHist] = useState(false);
  
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [newObj, setNewObj] = useState('');
  const [editingObjId, setEditingObjId] = useState<string | null>(null);

  const startTimeRef = useRef<number | null>(localStorage.getItem('mon-start-time') ? parseInt(localStorage.getItem('mon-start-time')!) : null);

  const tToS = (t: string) => {
    const p = t.split(':').map(Number);
    return p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2] : 0;
  };

  const sToT = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const sToTFormat = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return `${h}:${m.toString().padStart(2, '0')} hs`;
  };
  const historyAgrupado = useMemo(() => {
    const grupos: { [key: string]: number } = {};
    history.forEach(item => {
      grupos[item.data] = (grupos[item.data] || 0) + tToS(item.tempo);
    });
    return Object.keys(grupos).map(data => ({ data, tempo: sToT(grupos[data]), segundos: grupos[data] }))
      .sort((a, b) => b.data.split('/').reverse().join('').localeCompare(a.data.split('/').reverse().join('')));
  }, [history]);

  const monthlyStats = useMemo(() => {
    const stats: { [key: string]: number } = {};
    const mesesNomes = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
    history.forEach(item => {
      const [, m, y] = item.data.split('/');
      const chave = `${mesesNomes[parseInt(m) - 1]}/${y}`;
      stats[chave] = (stats[chave] || 0) + tToS(item.tempo);
    });
    return Object.keys(stats).map(mes => ({ mes, total: sToTFormat(stats[mes]), segundos: stats[mes] })).sort((a, b) => b.segundos - a.segundos);
  }, [history]);

  const totals = useMemo(() => {
    const agora = new Date();
    const mes = (agora.getMonth() + 1).toString().padStart(2, '0');
    const ano = agora.getFullYear().toString();
    const sMes = history.reduce((acc, i) => i.data.split('/')[1] === mes && i.data.split('/')[2] === ano ? acc + tToS(i.tempo) : acc, 0);
    const sAno = history.reduce((acc, i) => i.data.split('/')[2] === ano ? acc + tToS(i.tempo) : acc, 0);
    return { mensal: sToTFormat(sMes), anual: sToTFormat(sAno), mesNome: agora.toLocaleString('pt-BR', {month:'long'}).toUpperCase() };
  }, [history]);

  useEffect(() => {
    localStorage.setItem('mon-daimoku-sec', seconds.toString());
    localStorage.setItem('mon-daimoku-hist', JSON.stringify(history));
    localStorage.setItem('mon-active', isActive.toString());
    localStorage.setItem('mon-daimoku-obj', JSON.stringify(objetivos));
    if (isActive && startTimeRef.current) localStorage.setItem('mon-start-time', startTimeRef.current.toString());
    else localStorage.removeItem('mon-start-time');
  }, [seconds, history, isActive, objetivos]);

  useEffect(() => {
    let interval: any;
    if (isActive) {
      if (!startTimeRef.current) startTimeRef.current = Date.now() - (seconds * 1000);
      interval = setInterval(() => { setSeconds(Math.floor((Date.now() - startTimeRef.current!) / 1000)); }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive]);
  return (
    <div className="space-y-6 pb-12 animate-in fade-in max-w-full overflow-hidden">
      {/* PAINEL DO RELÓGIO */}
      <div className="bg-zinc-900 p-6 sm:p-10 rounded-[45px] text-center border-b-8 border-red-700 shadow-2xl relative flex flex-col items-center justify-center">
        <div className="w-full flex justify-center mb-4">
            <span className="bg-red-700 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-500/30">
              {totals.mesNome}: {totals.mensal}
            </span>
        </div>
        <div className="w-full py-6 flex justify-center items-center overflow-hidden">
          <span className="text-5xl sm:text-7xl font-black text-white font-mono tracking-tighter leading-none">
            {sToT(seconds)}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 w-full mt-4">
          <button onClick={() => setIsActive(!isActive)} className={`py-5 rounded-3xl font-black text-xs uppercase ${isActive ? 'bg-orange-600' : 'bg-green-700'} text-white shadow-lg active:scale-95 transition-transform`}>
            {isActive ? 'PAUSA' : 'INICIO'}
          </button>
          <button onClick={() => { if(seconds===0)return; setHistory([{id:Date.now().toString(), tempo:sToT(seconds), data:new Date().toLocaleDateString('pt-BR')}, ...history]); setSeconds(0); setIsActive(false); }} className="bg-zinc-800 py-5 rounded-3xl font-black text-xs text-white border border-zinc-700 active:scale-95 transition-transform">
            SALVAR
          </button>
        </div>
        <button onClick={() => setShowHist(true)} className="mt-6 w-full text-zinc-500 font-black text-[10px] uppercase flex items-center justify-center gap-2">
          <Calendar size={14}/> Calendário e Estatísticas
        </button>
      </div>

      {/* CÉLULA DE OBJETIVOS */}
      <div className="bg-black p-8 rounded-[40px] border-b-8 border-zinc-800 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-white font-black italic text-xl uppercase flex items-center gap-3">
            <Target className="text-red-600" /> Objetivos
          </h2>
          <button onClick={() => setIsFocusMode(true)} className="bg-zinc-800 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 border border-zinc-700 active:scale-95 transition-transform">
            <Maximize2 size={12}/> Modo Foco
          </button>
        </div>
        
        <div className="flex gap-2 mb-6">
          <input type="text" value={newObj} onChange={(e) => setNewObj(e.target.value)} placeholder={editingObjId ? "Editando..." : "Novo objetivo..."} className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-4 text-white text-sm outline-none focus:border-red-600" />
          <button onClick={() => { 
            if(!newObj.trim()) return; 
            if(editingObjId) {
              setObjetivos(objetivos.map(o => o.id === editingObjId ? { ...o, texto: newObj } : o));
              setEditingObjId(null);
            } else {
              setObjetivos([{id:Date.now().toString(), texto:newObj}, ...objetivos]); 
            }
            setNewObj(''); 
          }} className="bg-red-700 text-white p-4 rounded-2xl">
            {editingObjId ? <Save size={20}/> : <Plus size={20}/>}
          </button>
        </div>

        <div className="space-y-3">
          {objetivos.map(obj => (
            <div key={obj.id} className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800/50 flex justify-between items-center">
              <span className="text-zinc-300 text-sm italic font-medium">{obj.texto}</span>
              <div className="flex gap-4">
                <button onClick={() => { setEditingObjId(obj.id); setNewObj(obj.texto); }} className="text-blue-400 font-black text-[10px] uppercase">Editar</button>
                <button onClick={() => setObjetivos(objetivos.filter(o => o.id !== obj.id))} className="text-red-500 font-black text-[10px] uppercase">Excluir</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* DIÁRIO */}
      <div className="bg-zinc-900 p-8 rounded-[40px] border-b-8 border-amber-600 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-white font-black italic text-xl flex items-center gap-3 uppercase">Diário</h2>
          <button onClick={() => setViewDiarioHist(!viewDiarioHist)} className="text-zinc-500 text-[10px] uppercase font-black px-3 py-1 rounded-lg border border-zinc-800">{viewDiarioHist ? 'Escrever' : 'Histórico'}</button>
        </div>
        {!viewDiarioHist ? (
          <>
            <textarea className="w-full bg-zinc-800 p-6 rounded-3xl text-white font-medium border-2 border-zinc-700 outline-none focus:border-amber-500 italic h-48 resize-none mb-4" value={diarioContent} onChange={(e) => setDiarioContent(e.target.value)} />
            <button onClick={() => {
              if(!diarioContent.trim()) return;
              if (editingDiarioId) {
                setDiarioEntries(diarioEntries.map(e => e.id === editingDiarioId ? { ...e, content: diarioContent } : e));
                setEditingDiarioId(null);
              } else {
                setDiarioEntries([{ id: Date.now().toString(), date: new Date().toLocaleDateString('pt-BR'), content: diarioContent }, ...diarioEntries]);
              }
              setDiarioContent(''); setViewDiarioHist(true);
            }} className="w-full bg-amber-600 text-white py-5 rounded-3xl font-black uppercase text-xs flex items-center justify-center gap-3 shadow-lg">
              <Save size={18}/> {editingDiarioId ? 'SALVAR EDIÇÃO' : 'SALVAR NO DIÁRIO'}
            </button>
          </>
        ) : (
          <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
            {diarioEntries.map(e => (
              <div key={e.id} className="bg-zinc-800/40 p-5 rounded-3xl border border-zinc-700/50 flex justify-between items-start">
                <div className="flex-1 pr-4">
                  <span className="text-[10px] font-black text-amber-500">{e.date}</span>
                  <p className="text-zinc-300 text-sm italic mt-1">{e.content}</p>
                </div>
                <button onClick={() => { setDiarioContent(e.content); setEditingDiarioId(e.id); setViewDiarioHist(false); }} className="text-blue-400 font-black text-[10px] uppercase">Editar</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODO FOCO: APENAS OBJETIVOS COM ROLAGEM CORRIGIDA */}
      {isFocusMode && (
        <div className="fixed inset-0 bg-black z-[600] flex flex-col animate-in zoom-in overflow-hidden">
          {/* Botão de sair fixo no topo */}
          <div className="flex justify-end p-8">
            <button onClick={() => setIsFocusMode(false)} className="text-zinc-800 hover:text-white transition-colors">
              <X size={48}/>
            </button>
          </div>
          
          {/* Área de conteúdo rolável */}
          <div className="flex-1 overflow-y-auto px-6 pb-20">
            <div className="max-w-5xl mx-auto flex flex-col items-center justify-center min-h-full gap-12 text-center">
              {objetivos.length > 0 ? (
                objetivos.map(o => (
                  <div key={o.id} className="w-full py-6 border-b border-zinc-900/30 last:border-0">
                    <p 
                      className="text-white font-black italic uppercase leading-none tracking-tighter"
                      style={{ fontSize: objetivos.length > 5 ? 'clamp(1.5rem, 6vw, 3.5rem)' : 'clamp(2.5rem, 12vw, 7rem)' }}
                    >
                      "{o.texto}"
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-zinc-800 text-4xl font-black uppercase tracking-tighter">Sem objetivos definidos</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* HISTÓRICO DE ESTATÍSTICAS (MANTIDO) */}
      {showHist && (
        <div className="fixed inset-0 bg-black z-[500] p-6 overflow-y-auto animate-in fade-in">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-white font-black uppercase text-sm tracking-widest">Estatísticas</h2>
            <button onClick={() => setShowHist(false)} className="bg-red-700 text-white p-2 rounded-full"><X/></button>
          </div>
          <div className="bg-zinc-900 p-8 rounded-[40px] border border-red-700/30 mb-6 text-center shadow-2xl">
            <p className="text-zinc-500 text-[10px] font-black uppercase mb-1">Total do Ano</p>
            <p className="text-4xl sm:text-5xl text-white font-black">{totals.anual}</p>
          </div>
          <div className="bg-zinc-900 p-5 rounded-[35px] border border-zinc-800 mb-6">
            <div className="grid grid-cols-2 gap-3">
              {monthlyStats.map(m => (
                <div key={m.mes} className="bg-zinc-800/50 p-3 rounded-2xl flex justify-between items-center border border-zinc-700">
                  <span className="text-zinc-400 text-[9px] font-black">{m.mes}</span>
                  <span className="text-white text-[10px] font-mono font-bold">{m.total}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4 pb-20">
            {historyAgrupado.map(h => (
              <div key={h.data} className="bg-zinc-900 p-5 rounded-[30px] border border-zinc-800 flex justify-between items-center shadow-lg">
                <div>
                  <p className="text-zinc-500 text-[10px] font-black uppercase">{h.data}</p>
                  <p className="text-white font-mono text-2xl font-black">{h.tempo}</p>
                </div>
                <button onClick={() => setHistory(history.filter(x => x.data !== h.data))} className="text-red-500"><Trash2 size={18}/></button>
              </div>
            ))}
          </div>
        </div>
      )}
      <style>{`
        input, textarea { color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; caret-color: #ffffff !important; }
        .animate-in { animation: fadeIn 0.3s ease-out; }
        .zoom-in { animation: zoomIn 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes zoomIn { from { opacity: 0; scale: 0.95; } to { opacity: 1; scale: 1; } }
      `}</style>
    </div>
  );
};

export default Monarca;
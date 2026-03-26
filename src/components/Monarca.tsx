import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Target, Save, Plus, Maximize2, X, Calendar, Edit3, Trash2, CalendarPlus, Clock, History, Eye, EyeOff } from 'lucide-react';

// Props exatas vindo do seu App.tsx
const Monarca = ({ notes, objectives, sessions, timerState, setNotes, setObjectives, setSessions, setTimerState }: any) => {
  
  // --- ESTADOS INTERNOS ---
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [diarioContent, setDiarioContent] = useState('');
  const [editingDiarioId, setEditingDiarioId] = useState<string | null>(null);
  const [viewDiarioHist, setViewDiarioHist] = useState(false);
  const [showHist, setShowHist] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [newObj, setNewObj] = useState('');
  const [editingObjId, setEditingObjId] = useState<string | null>(null);

  // --- ESTADOS DE AUDITORIA MANUAL ---
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualTime, setManualTime] = useState('00:00:00');

  // --- MOTORES DE CONVERSÃO ---
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

  // --- LÓGICA DE ESTATÍSTICAS (Sincronizado com Sessions do App.tsx) ---
  const stats = useMemo(() => {
    const agora = new Date();
    const mesAtual = (agora.getMonth() + 1).toString().padStart(2, '0');
    const anoAtual = agora.getFullYear().toString();
    
    const sMes = sessions.reduce((acc: number, i: any) => {
      const p = i.data.split('/');
      return (p[1] === mesAtual && p[2] === anoAtual) ? acc + tToS(i.tempo) : acc;
    }, 0);
    
    const sAno = sessions.reduce((acc: number, i: any) => {
      const p = i.data.split('/');
      return (p[2] === anoAtual) ? acc + tToS(i.tempo) : acc;
    }, 0);

    const agrupado = sessions.reduce((acc: any, i: any) => {
      acc[i.data] = (acc[i.data] || 0) + tToS(i.tempo);
      return acc;
    }, {});

    const historyOrdenado = Object.keys(agrupado).map(data => ({
      data,
      tempo: sToT(agrupado[data]),
      segundos: agrupado[data]
    })).sort((a, b) => b.data.split('/').reverse().join('').localeCompare(a.data.split('/').reverse().join('')));

    return { 
      mensal: sToTFormat(sMes), 
      anual: sToTFormat(sAno), 
      mesNome: agora.toLocaleString('pt-BR', { month: 'long' }).toUpperCase(),
      history: historyOrdenado
    };
  }, [sessions]);

  // --- CONTROLE DO CRONÔMETRO ---
  useEffect(() => {
    let interval: any;
    if (isActive) {
      interval = setInterval(() => setSeconds(s => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  return (
    <div className="space-y-6 pb-24 animate-in fade-in">
      
      {/* 1. PAINEL DO RELÓGIO */}
      <div className="bg-zinc-900 p-8 rounded-[45px] text-center border-b-8 border-red-700 shadow-2xl flex flex-col items-center">
        <div className="bg-red-700/20 text-red-500 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 border border-red-700/30">
          {stats.mesNome}: {stats.mensal}
        </div>
        <div className="py-6">
          <span className="text-6xl sm:text-8xl font-black text-white font-mono tracking-tighter italic">
            {sToT(seconds)}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4 w-full mt-6">
          <button onClick={() => setIsActive(!isActive)} className={`py-6 rounded-3xl font-black text-xs uppercase shadow-xl ${isActive ? 'bg-orange-600' : 'bg-green-700'} text-white`}>
            {isActive ? 'PAUSA' : 'INICIO'}
          </button>
          <button onClick={() => { 
            if(seconds === 0) return; 
            const hoje = new Date().toLocaleDateString('pt-BR');
            setSessions([{ id: Date.now().toString(), tempo: sToT(seconds), data: hoje }, ...sessions]); 
            setSeconds(0); setIsActive(false); 
          }} className="bg-zinc-800 py-6 rounded-3xl font-black text-xs text-white border border-zinc-700 active:scale-95 transition-all">
            SALVAR
          </button>
        </div>
        <button onClick={() => setShowHist(true)} className="mt-8 w-full text-zinc-600 font-black text-[10px] uppercase flex items-center justify-center gap-2 tracking-[0.2em] hover:text-red-600 transition-colors">
          <Calendar size={14}/> AUDITORIA E ESTATÍSTICAS
        </button>
      </div>

      {/* 2. OBJETIVOS */}
      <div className="bg-black p-8 rounded-[40px] border-b-8 border-zinc-800 shadow-2xl">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-white font-black italic text-xl uppercase flex items-center gap-3"><Target className="text-red-600" /> Objetivos</h2>
          <button onClick={() => setIsFocusMode(true)} className="bg-zinc-800 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 border border-zinc-700 active:scale-95">
            <Maximize2 size={14}/> MODO FOCO
          </button>
        </div>
        <div className="flex gap-2 mb-6">
          <input type="text" value={newObj} onChange={(e) => setNewObj(e.target.value)} placeholder="Novo objetivo..." className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-6 text-white text-sm outline-none focus:border-red-600 transition-colors" />
          <button onClick={() => { 
            if(!newObj.trim()) return; 
            if(editingObjId) {
              setObjectives(objectives.map((o: any) => o.id === editingObjId ? { ...o, texto: newObj } : o));
              setEditingObjId(null);
            } else {
              setObjectives([{id: Date.now().toString(), texto: newObj}, ...objectives]); 
            }
            setNewObj(''); 
          }} className="bg-red-700 text-white p-5 rounded-2xl shadow-xl active:scale-90">
            {editingObjId ? <Save size={24}/> : <Plus size={24}/>}
          </button>
        </div>
        <div className="space-y-3">
          {objectives.map((obj: any) => (
            <div key={obj.id} className="bg-zinc-900/40 p-5 rounded-3xl border border-zinc-800/50 flex justify-between items-center group">
              <span className="text-zinc-300 text-sm italic font-bold">"{obj.texto}"</span>
              <div className="flex gap-4">
                <button onClick={() => { setEditingObjId(obj.id); setNewObj(obj.texto); }} className="text-blue-500 font-black text-[9px] uppercase">Editar</button>
                <button onClick={() => setObjectives(objectives.filter((o: any) => o.id !== obj.id))} className="text-red-600 font-black text-[9px] uppercase">Excluir</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. DIÁRIO (MEMORIAL DE LUTA) COM PRIVACIDADE */}
      <div className="bg-zinc-900 p-8 rounded-[40px] border-b-8 border-amber-600 shadow-2xl">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-white font-black italic text-xl flex items-center gap-3 uppercase text-amber-500">Memorial de Luta</h2>
          <button onClick={() => setViewDiarioHist(!viewDiarioHist)} className="text-zinc-500 text-[10px] uppercase font-black px-4 py-2 rounded-xl border border-zinc-800">
            {viewDiarioHist ? 'ESCREVER RELATO' : 'VER HISTÓRICO'}
          </button>
        </div>
        
        {!viewDiarioHist ? (
          <div className="animate-in fade-in">
            <textarea 
              className="w-full bg-zinc-800 p-6 rounded-[30px] text-white font-medium border-2 border-zinc-700 outline-none focus:border-amber-500 italic h-52 resize-none mb-4 shadow-inner" 
              value={diarioContent} 
              onChange={(e) => setDiarioContent(e.target.value)} 
              placeholder="Sua determinação..." 
            />
            <button onClick={() => {
              if(!diarioContent.trim()) return;
              if (editingDiarioId) {
                setNotes(notes.map((e: any) => e.id === editingDiarioId ? { ...e, content: diarioContent } : e));
                setEditingDiarioId(null);
              } else {
                setNotes([{ id: Date.now().toString(), date: new Date().toLocaleDateString('pt-BR'), content: diarioContent }, ...notes]);
              }
              setDiarioContent(''); setViewDiarioHist(true); 
            }} className="w-full bg-amber-600 text-white py-6 rounded-3xl font-black uppercase text-xs flex items-center justify-center gap-3 shadow-2xl active:scale-95">
              <Save size={20}/> CONCLUIR E GUARDAR
            </button>
          </div>
        ) : (
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar animate-in slide-in-from-right">
            {notes.map((e: any) => (
              <div key={e.id} className="bg-zinc-800/30 p-6 rounded-[30px] border border-zinc-700/50 flex justify-between items-center group">
                <div className="flex-1 pr-4">
                  <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">{e.date}</span>
                  <p className="text-zinc-500 text-xs italic mt-1 font-bold">Registro guardado e oculto.</p>
                </div>
                <button onClick={() => { setDiarioContent(e.content); setEditingDiarioId(e.id); setViewDiarioHist(false); }} className="bg-zinc-900 px-5 py-3 rounded-2xl text-blue-400 font-black text-[9px] uppercase border border-zinc-700 shadow-md active:scale-90">ABRIR</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. MODO FOCO */}
      {isFocusMode && (
        <div className="fixed inset-0 bg-black z-[600] flex flex-col animate-in zoom-in overflow-hidden">
          <div className="flex justify-end p-10"><button onClick={() => setIsFocusMode(false)} className="text-zinc-800 hover:text-white transition-colors"><X size={64}/></button></div>
          <div className="flex-1 overflow-y-auto px-8 pb-32">
            <div className="max-w-5xl mx-auto flex flex-col items-center justify-center min-h-full gap-16 text-center">
              {objectives.map((o: any) => (
                <div key={o.id} className="w-full py-10 border-b border-zinc-900/30 last:border-0">
                  <p className="text-white font-black italic uppercase leading-tight tracking-tighter" style={{ fontSize: 'clamp(2rem, 10vw, 8rem)' }}>"{o.texto}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. AUDITORIA E CALENDÁRIO DE EDIÇÃO */}
      {showHist && (
        <div className="fixed inset-0 bg-black z-[500] p-6 overflow-y-auto animate-in fade-in pb-32">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-white font-black uppercase text-sm tracking-[0.3em] italic">Auditoria Monarca</h2>
            <button onClick={() => setShowHist(false)} className="bg-red-700 text-white p-3 rounded-full shadow-2xl active:scale-90"><X/></button>
          </div>

          {/* PAINEL DE AJUSTE MANUAL (ESTE É O CALENDÁRIO QUE VOCÊ PEDIU) */}
          <div className="bg-zinc-900 p-8 rounded-[40px] border-2 border-dashed border-red-700/30 mb-10 shadow-2xl">
            <p className="text-white font-black text-[10px] uppercase mb-6 flex items-center gap-3 tracking-widest italic">
              <CalendarPlus size={16} className="text-red-600"/> Lançamento / Ajuste Manual
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-2">Data Retroativa</label>
                <input type="date" className="w-full bg-zinc-800 p-4 rounded-2xl text-sm font-bold text-white border border-zinc-700 outline-none focus:border-red-600" value={manualDate} onChange={e => setManualDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-2">Tempo (HH:MM:SS)</label>
                <input type="text" placeholder="00:00:00" className="w-full bg-zinc-800 p-4 rounded-2xl text-sm font-bold text-white border border-zinc-700 outline-none focus:border-red-600" value={manualTime} onChange={e => setManualTime(e.target.value)} />
              </div>
            </div>
            <button onClick={() => {
              const dF = manualDate.split('-').reverse().join('/');
              const hF = sessions.filter((h: any) => h.data !== dF);
              setSessions([{ id: Date.now().toString(), tempo: manualTime, data: dF }, ...hF]);
              setManualTime('00:00:00');
            }} className="w-full bg-red-700 text-white py-5 rounded-[25px] font-black text-xs uppercase shadow-xl active:scale-95 transition-all">
              GRAVAR NO HISTÓRICO MASTER
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-10 text-center">
            <div className="bg-zinc-900 p-8 rounded-[40px] border border-zinc-800 shadow-xl">
                <p className="text-zinc-500 text-[9px] font-black uppercase mb-2">Este Mês</p>
                <p className="text-3xl text-white font-black italic">{stats.mensal}</p>
            </div>
            <div className="bg-zinc-900 p-8 rounded-[40px] border border-zinc-800 shadow-xl">
                <p className="text-zinc-500 text-[9px] font-black uppercase mb-2">Este Ano</p>
                <p className="text-3xl text-white font-black italic">{stats.anual}</p>
            </div>
          </div>

          <div className="space-y-4">
            {stats.history.map((h: any) => (
              <div key={h.data} className="bg-zinc-900 p-6 rounded-[35px] border border-zinc-800 flex justify-between items-center shadow-lg group">
                <div className="flex-1">
                  <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">{h.data}</p>
                  <p className="text-white font-mono text-3xl font-black italic">{h.tempo}</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => { 
                    setManualDate(h.data.split('/').reverse().join('-')); 
                    setManualTime(h.tempo);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }} className="bg-zinc-800 p-4 rounded-2xl text-blue-500 border border-zinc-700 active:scale-90 shadow-md"><Edit3 size={20}/></button>
                  <button onClick={() => { if(window.confirm('Excluir?')) setSessions(sessions.filter((x: any) => x.data !== h.data)) }} className="bg-zinc-800 p-4 rounded-2xl text-red-600 border border-zinc-700 active:scale-90 shadow-md"><Trash2 size={20}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        input, textarea { color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; caret-color: #ffffff !important; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-in { animation: fadeIn 0.4s ease-out; }
      `}</style>
    </div>
  );
};

export default Monarca;
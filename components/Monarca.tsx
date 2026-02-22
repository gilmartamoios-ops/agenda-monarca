
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Note, Objective, SessionData } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface MonarcaProps {
  notes: Note[];
  objectives: Objective[];
  sessions: SessionData[];
  timerState: { isRunning: boolean; startTime: number | null; elapsedBeforeStart: number; };
  setNotes: (n: Note[]) => void;
  setObjectives: (o: Objective[]) => void;
  setSessions: (s: SessionData[]) => void;
  setTimerState: (t: any) => void;
}

const Monarca: React.FC<MonarcaProps> = ({ notes, objectives, sessions, timerState, setNotes, setObjectives, setSessions, setTimerState }) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [newNote, setNewNote] = useState('');
  const [newObjective, setNewObjective] = useState('');
  const [viewingObjective, setViewingObjective] = useState<string | null>(null);
  
  const [editingObjId, setEditingObjId] = useState<string | null>(null);
  const [editingObjText, setEditingObjText] = useState('');

  const [editingSessionDate, setEditingSessionDate] = useState<string | null>(null);
  const [editTime, setEditTime] = useState({ hours: 0, minutes: 0 });
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (timerState.isRunning && timerState.startTime) {
      const update = () => {
        const now = Date.now();
        const elapsedSinceStart = now - timerState.startTime!;
        setCurrentTime(timerState.elapsedBeforeStart + elapsedSinceStart);
      };
      update();
      timerRef.current = window.setInterval(update, 1000);
    } else {
      setCurrentTime(timerState.elapsedBeforeStart);
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerState.isRunning, timerState.startTime, timerState.elapsedBeforeStart]);

  const toggleTimer = () => {
    if (timerState.isRunning) {
      const now = Date.now();
      const sessionDuration = now - timerState.startTime!;
      const totalSession = timerState.elapsedBeforeStart + sessionDuration;
      if (totalSession > 1000) {
        setSessions([...sessions, { duration: totalSession, date: new Date().toISOString() }]);
      }
      setTimerState({ isRunning: false, startTime: null, elapsedBeforeStart: 0 });
      setCurrentTime(0);
    } else {
      setTimerState({ isRunning: true, startTime: Date.now(), elapsedBeforeStart: currentTime });
    }
  };

  const resetTimer = () => {
    setTimerState({ isRunning: false, startTime: null, elapsedBeforeStart: 0 });
    setCurrentTime(0);
  };

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    return `${h.toString().padStart(2, '0')}:${(m % 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  };

  const chartData = useMemo(() => {
    const monthlyData: Record<string, number> = {};
    sessions.forEach(s => {
      const month = new Date(s.date).toLocaleString('pt-BR', { month: 'short' });
      monthlyData[month] = (monthlyData[month] || 0) + s.duration;
    });
    return Object.entries(monthlyData).map(([name, val]) => ({
      name,
      minutes: Math.round(val / 60000),
      label: `${Math.floor(val / 3600000)}h ${Math.round((val % 3600000) / 60000)}m`
    }));
  }, [sessions]);

  const moveObjective = (id: string, direction: 'up' | 'down') => {
    const index = objectives.findIndex(obj => obj.id === id);
    if (index === -1) return;
    const newObjectives = [...objectives];
    if (direction === 'up' && index > 0) {
      [newObjectives[index], newObjectives[index - 1]] = [newObjectives[index - 1], newObjectives[index]];
    } else if (direction === 'down' && index < objectives.length - 1) {
      [newObjectives[index], newObjectives[index + 1]] = [newObjectives[index + 1], newObjectives[index]];
    }
    setObjectives(newObjectives);
  };

  const deleteObjective = (id: string) => setObjectives(objectives.filter(o => o.id !== id));
  const saveEditedObjective = () => {
    if (!editingObjId || !editingObjText.trim()) return;
    setObjectives(objectives.map(o => o.id === editingObjId ? { ...o, text: editingObjText } : o));
    setEditingObjId(null);
  };

  const handleEditSession = (dateStr: string) => {
    const daySessions = sessions.filter(s => s.date.startsWith(dateStr));
    const totalMs = daySessions.reduce((acc, s) => acc + s.duration, 0);
    setEditTime({ hours: Math.floor(totalMs / 3600000), minutes: Math.floor((totalMs % 3600000) / 60000) });
    setEditingSessionDate(dateStr);
  };

  const saveEditedSession = () => {
    if (!editingSessionDate) return;
    const newDuration = (editTime.hours * 3600000) + (editTime.minutes * 60000);
    const otherSessions = sessions.filter(s => !s.date.startsWith(editingSessionDate));
    if (newDuration > 0) setSessions([...otherSessions, { duration: newDuration, date: editingSessionDate + "T12:00:00Z" }]);
    else setSessions(otherSessions);
    setEditingSessionDate(null);
  };

  const deleteSessionDate = () => {
    if (!editingSessionDate) return;
    setSessions(sessions.filter(s => !s.date.startsWith(editingSessionDate)));
    setEditingSessionDate(null);
  };

  const renderCalendar = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const firstDay = (new Date(year, month, 1).getDay() || 7) - 1;
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} className="h-16 border border-gray-50 dark:border-zinc-800 bg-gray-50/20 dark:bg-zinc-900/20" />);
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
      const daySessions = sessions.filter(s => s.date.startsWith(dateStr));
      const totalMs = daySessions.reduce((acc, s) => acc + s.duration, 0);
      days.push(
        <button key={d} onClick={() => handleEditSession(dateStr)} className="h-16 border border-gray-50 dark:border-zinc-800 p-1 flex flex-col items-center justify-start hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors relative">
          <span className="text-[10px] text-gray-400 dark:text-zinc-600 font-bold">{d}</span>
          {totalMs > 0 && <div className="text-[9px] font-black text-red-700 dark:text-red-400 leading-tight mt-1">{Math.floor(totalMs / 3600000)}h{Math.floor((totalMs % 3600000) / 60000)}m</div>}
        </button>
      );
    }
    return days;
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-[40px] border border-gray-100 dark:border-zinc-800 shadow-xl text-center relative overflow-hidden transition-colors">
        <div className="absolute top-0 left-0 w-full h-1 bg-red-700 dark:bg-red-900 opacity-20"></div>
        <h3 className="text-gray-400 dark:text-zinc-500 font-black uppercase tracking-[0.2em] text-xs mb-4">Daimoku</h3>
        <div className="text-6xl font-black text-gray-900 dark:text-zinc-100 font-mono mb-8 tabular-nums tracking-tighter">
          {formatTime(currentTime)}
        </div>
        <div className="flex justify-center space-x-4">
          <button onClick={toggleTimer} className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl transition-all shadow-lg ${timerState.isRunning ? 'bg-orange-500 shadow-orange-100 dark:bg-orange-600 dark:shadow-orange-950/20' : 'bg-red-700 shadow-red-100 dark:bg-red-900 dark:shadow-red-950/20'}`}>
            {timerState.isRunning ? '⏸' : '▶'}
          </button>
          <button onClick={resetTimer} className="w-20 h-20 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-400 dark:text-zinc-500 text-2xl hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors">⏹</button>
        </div>
        <div className="mt-6 flex flex-col items-center">
          <p className="text-[10px] text-gray-400 dark:text-zinc-500 uppercase font-bold tracking-widest mb-4">
            {timerState.isRunning ? 'Cronômetro Ativo' : 'Clique para Iniciar a Sessão'}
          </p>
          <button onClick={() => setShowCalendar(!showCalendar)} className="flex items-center text-[10px] font-black text-red-700 dark:text-red-400 uppercase tracking-widest px-4 py-2 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-100 dark:border-red-900 hover:opacity-80 transition-all">
            <span className="mr-2">{showCalendar ? 'Ocultar Histórico' : 'Editar Histórico'}</span>
            {showCalendar ? '🔼' : '📅'}
          </button>
        </div>
      </div>

      {showCalendar && (
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm animate-fade-in transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 dark:text-zinc-100 flex items-center">
              <span className="mr-2">📅</span> Histórico de Horas
            </h3>
            <div className="flex items-center space-x-2 dark:text-zinc-300">
              <button onClick={() => setCalendarDate(new Date(calendarDate.setMonth(calendarDate.getMonth() - 1)))} className="p-1">◀</button>
              <span className="text-xs font-bold capitalize">{calendarDate.toLocaleString('pt-BR', { month: 'short', year: 'numeric' })}</span>
              <button onClick={() => setCalendarDate(new Date(calendarDate.setMonth(calendarDate.getMonth() + 1)))} className="p-1">▶</button>
            </div>
          </div>
          <div className="grid grid-cols-7 border border-gray-50 dark:border-zinc-800 rounded-xl overflow-hidden shadow-inner">
            {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((d, i) => (
              <div key={i} className="bg-gray-50 dark:bg-zinc-800 py-1 text-center text-[9px] font-black text-gray-400 dark:text-zinc-500">{d}</div>
            ))}
            {renderCalendar()}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm transition-colors">
        <h3 className="font-bold text-gray-800 dark:text-zinc-100 mb-6">Estatística Mensal</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#71717a' }} />
              <Tooltip cursor={{ fill: 'transparent' }} content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return <div className="bg-white dark:bg-zinc-800 p-2 rounded-lg shadow-lg border border-gray-100 dark:border-zinc-700"><p className="text-xs font-bold text-red-700 dark:text-red-400">{payload[0].payload.label}</p></div>;
                }
                return null;
              }} />
              <Bar dataKey="minutes" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#b91c1c' : '#f87171'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm transition-colors">
        <h3 className="font-bold text-gray-800 dark:text-zinc-100 mb-4 flex items-center">
          <span className="mr-2">🎯</span> Objetivos do Monarca
        </h3>
        <div className="flex gap-2 mb-4">
          <input type="text" placeholder="Escreva um novo objetivo..."
            className="flex-1 p-3 rounded-2xl bg-gray-50 dark:bg-zinc-800 border-none outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-zinc-100 transition-colors"
            value={newObjective} onChange={e => setNewObjective(e.target.value)}
          />
          <button onClick={() => { if(newObjective) { setObjectives([...objectives, { id: Date.now().toString(), text: newObjective }]); setNewObjective(''); } }} className="bg-red-700 dark:bg-red-800 text-white px-6 rounded-2xl font-bold">+</button>
        </div>
        <div className="space-y-2">
          {objectives.map(obj => (
            <div key={obj.id} className="flex flex-col p-3 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 group transition-all hover:bg-white dark:hover:bg-zinc-700 hover:shadow-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-zinc-200 truncate flex-1 mr-4">{obj.text}</span>
                <button onClick={() => setViewingObjective(obj.text)} className="text-[9px] font-black text-red-700 dark:text-red-400 uppercase tracking-widest px-3 py-1 bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-gray-100 dark:border-zinc-700">Visualizar</button>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-zinc-700">
                <div className="flex space-x-2">
                  <button onClick={() => moveObjective(obj.id, 'up')} className="p-1.5 bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-gray-100 dark:border-zinc-700 text-xs dark:text-zinc-400">⬆️</button>
                  <button onClick={() => moveObjective(obj.id, 'down')} className="p-1.5 bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-gray-100 dark:border-zinc-700 text-xs dark:text-zinc-400">⬇️</button>
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => { setEditingObjId(obj.id); setEditingObjText(obj.text); }} className="p-1.5 bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-gray-100 dark:border-zinc-700 text-xs dark:text-zinc-400">✏️</button>
                  <button onClick={() => deleteObjective(obj.id)} className="p-1.5 bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-gray-100 dark:border-zinc-700 text-xs dark:text-zinc-400">🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm flex flex-col h-[600px] transition-colors">
        <h3 className="font-bold text-gray-800 dark:text-zinc-100 mb-4 flex items-center">
          <span className="mr-2">🏯</span> Sabedoria do Buda
        </h3>
        <div className="flex flex-col gap-2 mb-6">
          <textarea placeholder="O que você aprendeu hoje?"
            className="w-full p-4 h-32 rounded-2xl bg-gray-50 dark:bg-zinc-800 border-none outline-none focus:ring-2 focus:ring-red-500 resize-none italic text-gray-900 dark:text-zinc-200"
            value={newNote} onChange={e => setNewNote(e.target.value)}
          />
          <button onClick={() => { if(newNote) { setNotes([...notes, { id: Date.now().toString(), content: newNote, date: new Date().toISOString() }]); setNewNote(''); } }} className="w-full bg-red-700 dark:bg-red-900 text-white py-4 rounded-2xl font-bold shadow-lg">Insights</button>
        </div>
        <div className="flex-1 overflow-y-auto pr-2 space-y-4 hide-scrollbar">
          {notes.slice().reverse().map(note => (
            <div key={note.id} className="p-4 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 relative group animate-fade-in transition-colors">
              <div className="text-[10px] font-bold text-red-700 dark:text-red-400 uppercase tracking-widest mb-2">
                {new Date(note.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
              <p className="text-sm text-gray-700 dark:text-zinc-300 leading-relaxed font-serif">{note.content}</p>
              <div className="h-px w-8 bg-red-200 dark:bg-red-900 mt-4"></div>
            </div>
          ))}
        </div>
      </div>

      {editingObjId && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-scale-up">
            <h4 className="text-lg font-bold text-gray-800 dark:text-zinc-100 mb-4">Editar Objetivo</h4>
            <textarea className="w-full p-4 h-32 rounded-2xl bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-zinc-100 mb-6"
              value={editingObjText} onChange={(e) => setEditingObjText(e.target.value)}
            />
            <div className="flex space-x-3">
              <button onClick={() => setEditingObjId(null)} className="flex-1 py-3 bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 rounded-2xl font-bold">Cancelar</button>
              <button onClick={saveEditedObjective} className="flex-1 py-3 bg-red-700 dark:bg-red-800 text-white rounded-2xl font-bold">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {editingSessionDate && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-scale-up">
            <h4 className="text-lg font-bold text-gray-800 dark:text-zinc-100 mb-4">Editar Tempo Acumulado</h4>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase">Horas</label>
                <input type="number" min="0" max="23" className="w-full p-3 bg-gray-50 dark:bg-zinc-800 rounded-2xl border-none outline-none focus:ring-2 focus:ring-red-500 text-center font-bold text-gray-900 dark:text-zinc-100"
                  value={editTime.hours} onChange={e => setEditTime({...editTime, hours: parseInt(e.target.value) || 0})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase">Minutos</label>
                <input type="number" min="0" max="59" className="w-full p-3 bg-gray-50 dark:bg-zinc-800 rounded-2xl border-none outline-none focus:ring-2 focus:ring-red-500 text-center font-bold text-gray-900 dark:text-zinc-100"
                  value={editTime.minutes} onChange={e => setEditTime({...editTime, minutes: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex space-x-3">
                <button onClick={() => setEditingSessionDate(null)} className="flex-1 py-3 bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 rounded-2xl font-bold">Cancelar</button>
                <button onClick={saveEditedSession} className="flex-1 py-3 bg-red-700 dark:bg-red-800 text-white rounded-2xl font-bold">Salvar</button>
              </div>
              <button onClick={deleteSessionDate} className="w-full py-3 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 rounded-2xl font-bold border border-red-100 dark:border-red-900">Excluir Registro</button>
            </div>
          </div>
        </div>
      )}

      {viewingObjective && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-3xl p-8 shadow-2xl animate-scale-up">
            <div className="text-center">
              <span className="text-4xl mb-4 block">🏮</span>
              <h4 className="text-xs uppercase font-black text-red-700 dark:text-red-400 tracking-[0.3em] mb-6">Foco Monarca</h4>
              <p className="text-xl font-bold text-gray-800 dark:text-zinc-100 leading-relaxed font-serif mb-8 italic">"{viewingObjective}"</p>
              <button onClick={() => setViewingObjective(null)} className="w-full py-4 bg-red-700 dark:bg-red-800 text-white rounded-2xl font-bold shadow-lg">Fechar Foco</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Monarca;

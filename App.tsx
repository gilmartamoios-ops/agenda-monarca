import React, { useState, useEffect } from 'react';
import { AppState } from './types';
import Agenda from './components/Agenda';
import Finance from './components/Finance';
import Tasks from './components/Tasks';
import Monarca from './components/Monarca';
import DailyNotes from './components/DailyNotes';
import { db } from './services/firebase'; // Importando a conexão que criamos
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

const PalaceIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
    <path d="M2 20h20M4 20v-7l8-5 8 5v7M8 12h8M12 8v4M6 20v-2h4v2M14 20v-2h4v2" />
    <path d="M5 10l7-5 7 5" />
    <path d="M12 3v2" />
  </svg>
);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'agenda' | 'finance' | 'tasks' | 'monarca' | 'notes'>('agenda');
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<AppState>({
    appointments: [],
    transactions: [],
    tasks: [],
    notes: [],
    dailyNotes: [],
    objectives: [],
    sessions: [],
    financeCategories: ['Alimentação', 'Transporte', 'Saúde', 'Moradia', 'Educação'],
    taskStands: ['A Fazer', 'Em Andamento', 'Concluído'],
    isDarkMode: false,
    timerState: { isRunning: false, startTime: null, elapsedBeforeStart: 0 }
  });

  // ESCUTA EM TEMPO REAL (Sincronização Rigorosa entre PC e Xiaomi)
  useEffect(() => {
    const docRef = doc(db, 'users', 'gilmar_perfil'); // ID fixo para seu uso pessoal
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as AppState;
        setState(data);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // SALVAMENTO AUTOMÁTICO
  useEffect(() => {
    if (!loading) {
      const docRef = doc(db, 'users', 'gilmar_perfil');
      setDoc(docRef, state);
      
      // Manter a funcionalidade do Dark Mode no sistema
      if (state.isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [state, loading]);

  const updateState = (updates: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const toggleDarkMode = () => {
    updateState({ isDarkMode: !state.isDarkMode });
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black text-red-700 font-bold">Carregando Agenda Monarca...</div>;
  }

  return (
    <div className={`min-h-screen flex flex-col max-w-lg mx-auto transition-colors duration-300 ${state.isDarkMode ? 'bg-black border-zinc-800' : 'bg-white border-gray-200'} border-x`}>
      <header className="bg-red-700 dark:bg-red-900 text-white p-4 sticky top-0 z-50 flex items-center justify-between shadow-md transition-colors">
        <div className="flex items-center">
          <PalaceIcon />
          <h1 className="text-xl font-bold tracking-tight">Agenda Monarca</h1>
        </div>
        <button 
          onClick={toggleDarkMode}
          className="p-2 rounded-full hover:bg-white/10 transition-colors focus:outline-none"
          aria-label="Alternar Tema"
        >
          {state.isDarkMode ? (
            <span className="text-xl">🌙</span>
          ) : (
            <span className="text-xl">☀️</span>
          )}
        </button>
      </header>

      <main className={`flex-1 pb-24 px-4 pt-4 overflow-y-auto transition-colors ${state.isDarkMode ? 'bg-black text-zinc-100' : 'bg-gray-50 text-gray-900'}`}>
        {activeTab === 'agenda' && (
          <Agenda appointments={state.appointments} setAppointments={(appts) => updateState({ appointments: appts })} />
        )}
        {activeTab === 'finance' && (
          <Finance 
            transactions={state.transactions} 
            categories={state.financeCategories}
            setTransactions={(trans) => updateState({ transactions: trans })}
            setCategories={(cats) => updateState({ financeCategories: cats })}
          />
        )}
        {activeTab === 'tasks' && (
          <Tasks 
            tasks={state.tasks} 
            stands={state.taskStands}
            setTasks={(ts) => updateState({ tasks: ts })}
            setStands={(ss) => updateState({ taskStands: ss })}
          />
        )}
        {activeTab === 'notes' && (
          <DailyNotes 
            dailyNotes={state.dailyNotes} 
            setDailyNotes={(notes) => updateState({ dailyNotes: notes })} 
          />
        )}
        {activeTab === 'monarca' && (
          <Monarca 
            notes={state.notes}
            objectives={state.objectives}
            sessions={state.sessions}
            timerState={state.timerState}
            setNotes={(n) => updateState({ notes: n })}
            setObjectives={(o) => updateState({ objectives: o })}
            setSessions={(s) => updateState({ sessions: s })}
            setTimerState={(t) => updateState({ timerState: t })}
          />
        )}
      </main>

      <nav className={`fixed bottom-0 left-0 right-0 py-3 flex justify-around max-w-lg mx-auto z-50 shadow-lg border-t transition-colors ${state.isDarkMode ? 'bg-zinc-900 border-zinc-800 shadow-zinc-950/50' : 'bg-white border-gray-200 shadow-lg'}`}>
        {[
          { id: 'agenda', icon: '📅', label: 'Agenda' },
          { id: 'notes', icon: '📝', label: 'Notas' },
          { id: 'finance', icon: '💰', label: 'Finanças' },
          { id: 'tasks', icon: '✅', label: 'Tarefas' },
          { id: 'monarca', icon: '⛩️', label: 'Monarca' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex flex-col items-center transition-all ${activeTab === tab.id ? 'text-red-700 dark:text-red-400 scale-110' : 'text-gray-400'}`}
          >
            <span className="text-2xl">{tab.icon}</span>
            <span className="text-[10px] font-bold uppercase tracking-tighter">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;

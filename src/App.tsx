import React, { useState, useEffect, useRef } from 'react';
import { AppState } from './types';
import Agenda from './components/Agenda';
import Finance from './components/Finance';
import Tasks from './components/Tasks';
import Monarca from './components/Monarca';
import DailyNotes from './components/DailyNotes';
import Investments from './components/Investments';
import { db } from './services/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

const MASTER_PASSWORD = "Xavante1000#";

const PalaceIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="mr-2"
  >
    <path d="M2 20h20M4 20v-7l8-5 8 5v7M8 12h8M12 8v4M6 20v-2h4v2M14 20v-2h4v2" />
    <path d="M5 10l7-5 7 5" />
    <path d="M12 3v2" />
  </svg>
);

const App: React.FC = () => {

  const [activeTab, setActiveTab] = useState<
    'agenda' |
    'finance' |
    'tasks' |
    'monarca' |
    'notes' |
    'investments'
  >('agenda');

  const [loading, setLoading] =
    useState(true);

  const skipNextSave =
    useRef(true);

    const firebaseLoaded =
  useRef(false);

  const [isAuthenticated, setIsAuthenticated] =
    useState(false);

  const [passwordInput, setPasswordInput] =
    useState("");

const [menuOpen, setMenuOpen] =
  useState(false);

  const [state, setState] =
    useState<AppState>({
      appointments: [],
      transactions: [],
      tasks: [],
      notes: [],
      dailyNotes: [],
      objectives: [],
      sessions: [],
      financeCategories: [
        'Alimentação',
        'Transporte',
        'Saúde',
        'Moradia',
        'Educação'
      ],
      taskStands: [
        'A Fazer',
        'Em Andamento',
        'Concluído'
      ],
      isDarkMode: false,
      timerState: {
        isRunning: false,
        startTime: null,
        elapsedBeforeStart: 0
      }
    });

  useEffect(() => {

    const authStatus =
      localStorage.getItem(
        'monarca_session'
      );

    if (authStatus === 'active') {
      setIsAuthenticated(true);
    }

  }, []);

  const handleLogin = () => {

    if (
      passwordInput ===
      MASTER_PASSWORD
    ) {

      setIsAuthenticated(true);

      localStorage.setItem(
        'monarca_session',
        'active'
      );

    } else {

      alert("Acesso Negado.");

      setPasswordInput("");

    }

  };

  const handleLogout = () => {

    localStorage.removeItem(
      'monarca_session'
    );

    setIsAuthenticated(false);

    window.location.reload();

  };

  useEffect(() => {

    if (!isAuthenticated) return;

    const docRef =
      doc(
        db,
        'users',
        'gilmar_perfil'
      );

    const unsubscribe =
      onSnapshot(
        docRef,
        (docSnap) => {

          if (docSnap.exists()) {

  setState(
    docSnap.data() as AppState
  );

  firebaseLoaded.current = true;

}

          skipNextSave.current = true;

          setLoading(false);

        },
        (error) => {

          console.error(
            'Erro ao sincronizar a Agenda:',
            error
          );

          setLoading(false);

        }
      );

    return () => unsubscribe();

  }, [isAuthenticated]);

  useEffect(() => {

       if (!isAuthenticated) {
      return;
    }

    state.isDarkMode
      ? document.documentElement.classList.add('dark')
      : document.documentElement.classList.remove('dark');

    if (loading) {
      return;
    }

    if (!firebaseLoaded.current) {
      return;
    }

    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }

    const docRef =
      doc(
        db,
        'users',
        'gilmar_perfil'
      );

    const backupRef =
      doc(
        db,
        'users',
        'gilmar_perfil',
        'backups',
        'ultimo_backup'
      );

    const hasData =
      state.appointments.length > 0 ||
      state.transactions.length > 0 ||
      state.tasks.length > 0 ||
      state.notes.length > 0 ||
      state.dailyNotes.length > 0 ||
      state.objectives.length > 0 ||
      state.sessions.length > 0;

    const saveData = async () => {

      try {

        if (hasData) {

          await setDoc(
            backupRef,
            {
              ...state,
              backupAt:
                new Date().toISOString()
            }
          );

        }

        await setDoc(
          docRef,
          state
        );

      } catch (error) {

        console.error(
          'Erro ao salvar a Agenda:',
          error
        );

        alert(
          'Não foi possível salvar a Agenda. Seus dados continuam na tela.'
        );

      }

    };

       saveData();

  }, [
    state,
    loading,
    isAuthenticated
  ]);

  const updateState = (
    updates: Partial<AppState>
  ) => {

    setState(prev => ({
      ...prev,
      ...updates
    }));

  };

  const toggleDarkMode = () =>
    updateState({
      isDarkMode:
        !state.isDarkMode
    });

  if (!isAuthenticated) {

    return (

      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white text-center">

        <div className="flex items-center mb-8 text-red-700">

          <PalaceIcon />

          <h1 className="text-2xl font-black uppercase">
            Monarca Alpha
          </h1>

        </div>

        <input
          type="password"
          placeholder="Senha Master"
          value={passwordInput}
          onChange={(e) =>
            setPasswordInput(
              e.target.value
            )
          }
          onKeyDown={(e) =>
            e.key === 'Enter' &&
            handleLogin()
          }
          className="w-full bg-zinc-900 border-2 border-zinc-800 p-4 rounded-2xl text-center mb-4 outline-none text-white"
        />

        <button
          onClick={handleLogin}
          className="w-full bg-red-700 font-black py-4 rounded-2xl"
        >
          DESBLOQUEAR
        </button>

      </div>

    );

  }

  if (loading) {

    return (

      <div className="min-h-screen flex items-center justify-center bg-black text-red-700 font-bold italic">
        Sincronizando...
      </div>

    );

  }

  return (

    <div className={`min-h-screen flex flex-col max-w-lg mx-auto border-x ${
      state.isDarkMode
        ? 'bg-black border-zinc-800 text-white'
        : 'bg-white border-gray-200 text-gray-900'
    }`}>

      <header className="bg-red-700 dark:bg-red-900 text-white p-4 sticky top-0 z-50 flex items-center justify-between shadow-md">

        <div className="flex items-center">

          <PalaceIcon />

          <h1 className="text-xl font-bold tracking-tight">
            Agenda Monarca
          </h1>

        </div>

        <div className="flex items-center gap-2 relative">

  <button
    onClick={() =>
      setMenuOpen(!menuOpen)
    }
    className="bg-black/20 px-3 py-2 rounded-xl text-sm font-black"
  >
    ☰
  </button>

  <button
    onClick={toggleDarkMode}
    className="p-2"
  >
    {state.isDarkMode
      ? '🌙'
      : '☀️'}
  </button>

  <button
    onClick={handleLogout}
    className="bg-black/20 hover:bg-black/40 px-3 py-1 rounded-lg text-[10px] font-black uppercase border border-white/10 transition-all"
  >
    Sair
  </button>

  {menuOpen && (

    <div className="absolute top-14 right-0 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden min-w-[180px] z-[999]">

      {[
        {
          id: 'agenda',
          i: '📅',
          l: 'Agenda'
        },
        {
          id: 'notes',
          i: '📝',
          l: 'Notas'
        },
        {
          id: 'finance',
          i: '💰',
          l: 'Finanças'
        },
        {
          id: 'investments',
          i: '📈',
          l: 'Investimentos'
        },
        {
          id: 'tasks',
          i: '✅',
          l: 'Tarefas'
        },
        {
          id: 'monarca',
          i: '⛩️',
          l: 'Monarca'
        }
      ].map((tab) => (

        <button
          key={tab.id}
          onClick={() => {

            setActiveTab(
              tab.id as any
            );

            setMenuOpen(false);

          }}
          className={`w-full flex items-center gap-3 px-4 py-4 text-left text-sm font-bold transition-all ${
            activeTab === tab.id
              ? 'bg-red-700 text-white'
              : 'text-zinc-300 hover:bg-zinc-800'
          }`}
        >

          <span>
            {tab.i}
          </span>

          <span>
            {tab.l}
          </span>

        </button>

      ))}

    </div>

  )}

</div>

      </header>

      <main className="flex-1 pb-24 px-4 pt-4 overflow-y-auto">

        {activeTab === 'agenda' && (
          <Agenda
            appointments={state.appointments}
            setAppointments={(a) =>
              updateState({
                appointments: a
              })
            }
          />
        )}

        {activeTab === 'finance' && (
          <Finance
            transactions={state.transactions}
            categories={state.financeCategories}
            setTransactions={(t) =>
              updateState({
                transactions: t
              })
            }
            setCategories={(c) =>
              updateState({
                financeCategories: c
              })
            }
          />
        )}

        {activeTab === 'tasks' && (
          <Tasks
            tasks={state.tasks}
            stands={state.taskStands}
            setTasks={(t) =>
              updateState({
                tasks: t
              })
            }
            setStands={(s) =>
              updateState({
                taskStands: s
              })
            }
          />
        )}

        {activeTab === 'notes' && (
          <DailyNotes
            dailyNotes={state.dailyNotes}
            setDailyNotes={(n) =>
              updateState({
                dailyNotes: n
              })
            }
          />
        )}

        {activeTab === 'monarca' && (
          <Monarca
            notes={state.notes}
            objectives={state.objectives}
            sessions={state.sessions}
            timerState={state.timerState}
            setNotes={(n) =>
              updateState({
                notes: n
              })
            }
            setObjectives={(o) =>
              updateState({
                objectives: o
              })
            }
            setSessions={(s) =>
              updateState({
                sessions: s
              })
            }
            setTimerState={(t) =>
              updateState({
                timerState: t
              })
            }
          />
        )}

        {activeTab === 'investments' && (
          <Investments />
        )}

      </main>



    </div>

  );

};

export default App;
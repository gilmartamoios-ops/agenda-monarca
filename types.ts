
export interface Appointment {
  id: string;
  title: string;
  date: string;
  time: string;
  details: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'receita' | 'despesa';
  category: string;
  date: string;
}

export interface Task {
  id: string;
  title: string;
  stand: string;
  details: string;
  order: number;
}

export interface Note {
  id: string;
  content: string;
  date: string;
}

export interface Objective {
  id: string;
  text: string;
}

export interface SessionData {
  duration: number; // in milliseconds
  date: string;
}

export interface AppState {
  appointments: Appointment[];
  transactions: Transaction[];
  tasks: Task[];
  notes: Note[];
  dailyNotes: Note[];
  objectives: Objective[];
  sessions: SessionData[];
  financeCategories: string[];
  taskStands: string[];
  isDarkMode: boolean;
  timerState: {
    isRunning: boolean;
    startTime: number | null;
    elapsedBeforeStart: number;
  };
}

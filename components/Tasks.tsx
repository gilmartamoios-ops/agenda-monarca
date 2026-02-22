
import React, { useState, useMemo } from 'react';
import { Task } from '../types';

interface TasksProps {
  tasks: Task[];
  stands: string[];
  setTasks: (t: Task[]) => void;
  setStands: (s: string[]) => void;
}

const Tasks: React.FC<TasksProps> = ({ tasks, stands, setTasks, setStands }) => {
  const [formData, setFormData] = useState({ title: '', stand: '', details: '' });
  const [isAddingStand, setIsAddingStand] = useState(false);
  const [newStandName, setNewStandName] = useState('');
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [statusFilterModal, setStatusFilterModal] = useState<string | null>(null);

  const moveTask = (id: string, direction: 'up' | 'down') => {
    const sorted = [...tasks].sort((a,b) => a.order - b.order);
    const index = sorted.findIndex(t => t.id === id);
    if (direction === 'up' && index > 0) {
      const other = sorted[index - 1];
      const temp = other.order;
      other.order = sorted[index].order;
      sorted[index].order = temp;
    } else if (direction === 'down' && index < sorted.length - 1) {
      const other = sorted[index + 1];
      const temp = other.order;
      other.order = sorted[index].order;
      sorted[index].order = temp;
    }
    setTasks(sorted);
  };

  const handleSaveTask = () => {
    if (!formData.title || !formData.stand) return;
    if (editingTask) {
      setTasks(tasks.map(t => t.id === editingTask.id ? { ...formData, id: t.id, order: t.order } : t));
    } else {
      setTasks([...tasks, { ...formData, id: Date.now().toString(), order: tasks.length }]);
    }
    setFormData({ title: '', stand: '', details: '' });
    setEditingTask(null);
    setIsDetailsOpen(false);
  };

  const handleAddStand = () => {
    if (newStandName && !stands.includes(newStandName)) {
      setStands([...stands, newStandName]);
      setFormData({ ...formData, stand: newStandName });
      setNewStandName('');
      setIsAddingStand(false);
    }
  };

  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const filteredTasks = useMemo(() => {
    return tasks
      .filter(t => !statusFilterModal || t.stand === statusFilterModal)
      .sort((a,b) => a.order - b.order);
  }, [tasks, statusFilterModal]);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm space-y-4 transition-colors">
        <h3 className="font-bold text-gray-800 dark:text-zinc-100">Nova Tarefa</h3>
        <input
          type="text" placeholder="Título da tarefa"
          className="w-full p-3 rounded-2xl bg-gray-50 dark:bg-zinc-800 border-none outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-zinc-100"
          value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
        />
        {!isAddingStand ? (
          <select
            className="w-full p-3 rounded-2xl bg-gray-50 dark:bg-zinc-800 border-none outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-zinc-100 font-medium"
            value={formData.stand} onChange={e => e.target.value === 'NEW' ? setIsAddingStand(true) : setFormData({ ...formData, stand: e.target.value })}
          >
            <option value="" className="text-gray-400 dark:text-zinc-500">Selecione o Status</option>
            {stands.map(s => <option key={s} value={s} className="text-gray-900 dark:text-zinc-100">{s}</option>)}
            <option value="NEW" className="text-red-700 dark:text-red-400 font-bold">+ Novo Stand</option>
          </select>
        ) : (
          <div className="flex gap-2">
            <input autoFocus placeholder="Nome do Status"
              className="flex-1 p-3 rounded-2xl bg-red-50 dark:bg-red-950/30 border-none outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-zinc-100"
              value={newStandName} onChange={e => setNewStandName(e.target.value)}
            />
            <button onClick={handleAddStand} className="bg-red-700 dark:bg-red-800 text-white px-4 rounded-2xl font-bold">Adicionar</button>
            <button onClick={() => setIsAddingStand(false)} className="bg-gray-200 dark:bg-zinc-700 text-gray-600 dark:text-zinc-300 px-4 rounded-2xl">X</button>
          </div>
        )}
        <div className="flex space-x-3">
          <button onClick={() => { setEditingTask(null); setFormData({ title: '', stand: '', details: '' }); setIsDetailsOpen(true); }} className="flex-1 py-3 text-gray-500 dark:text-zinc-400 font-bold rounded-2xl border-2 border-gray-100 dark:border-zinc-800 hover:border-red-100 dark:hover:border-red-900 transition-colors">Detalhes</button>
          <button onClick={handleSaveTask} className="flex-2 bg-red-700 dark:bg-red-900 text-white py-3 px-8 rounded-2xl font-bold shadow-lg shadow-red-100 dark:shadow-red-950/20">Criar Tarefa</button>
        </div>
      </div>

      <div className="flex space-x-2 overflow-x-auto pb-2 hide-scrollbar">
        <button onClick={() => setStatusFilterModal(null)} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all border ${!statusFilterModal ? 'bg-red-700 dark:bg-red-900 text-white border-red-700 dark:border-red-900' : 'bg-white dark:bg-zinc-900 text-gray-400 dark:text-zinc-500 border-gray-100 dark:border-zinc-800'}`}>Todas</button>
        {stands.map(s => (
          <button key={s} onClick={() => setStatusFilterModal(s)} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all border ${statusFilterModal === s ? 'bg-red-700 dark:bg-red-900 text-white border-red-700 dark:border-red-900' : 'bg-white dark:bg-zinc-900 text-gray-400 dark:text-zinc-500 border-gray-100 dark:border-zinc-800'}`}>{s}</button>
        ))}
      </div>

      <div className="space-y-3 pb-8">
        {filteredTasks.length > 0 ? filteredTasks.map(t => (
          <div key={t.id} className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm flex items-center justify-between group transition-colors">
            <div className="flex-1">
              <div className="font-bold text-gray-800 dark:text-zinc-200">{t.title}</div>
              <div className="inline-block mt-1 bg-gray-50 dark:bg-zinc-800 text-[10px] uppercase font-black text-gray-400 dark:text-zinc-500 px-4 py-1 rounded-full border border-gray-100 dark:border-zinc-700 min-w-[80px] text-center">{t.stand}</div>
            </div>
            <div className="flex items-center space-x-2">
              <button onClick={() => moveTask(t.id, 'up')} className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg dark:text-zinc-400">⬆️</button>
              <button onClick={() => moveTask(t.id, 'down')} className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg dark:text-zinc-400">⬇️</button>
              <button onClick={() => { setEditingTask(t); setFormData(t); setIsDetailsOpen(true); }} className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg dark:text-zinc-400">👁️</button>
            </div>
          </div>
        )) : <div className="text-center py-10"><div className="text-4xl mb-2">🐚</div><p className="text-gray-400 dark:text-zinc-600 font-medium italic">Tudo em ordem no momento.</p></div>}
      </div>

      {isDetailsOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl transition-colors">
            <div className="p-6 space-y-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-zinc-100 flex items-center"><span className="mr-2">🔎</span> Detalhes da Tarefa</h3>
              <div className="space-y-4">
                <input type="text" placeholder="Título"
                  className="w-full p-3 rounded-2xl border border-gray-200 dark:border-zinc-800 focus:ring-2 focus:ring-red-500 outline-none text-gray-900 dark:text-zinc-100 bg-white dark:bg-zinc-800"
                  value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
                <select className="w-full p-3 rounded-2xl border border-gray-200 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-zinc-100 bg-white dark:bg-zinc-800"
                  value={formData.stand} onChange={e => setFormData({ ...formData, stand: e.target.value })}
                >
                  {stands.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <textarea placeholder="Descrição completa..."
                  className="w-full p-3 h-48 rounded-2xl border border-gray-200 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-red-500 resize-none text-gray-900 dark:text-zinc-100 bg-white dark:bg-zinc-800"
                  value={formData.details} onChange={e => setFormData({ ...formData, details: e.target.value })}
                />
              </div>
              <div className="flex space-x-3 pt-2">
                <button onClick={() => { if(editingTask) handleDeleteTask(editingTask.id); setIsDetailsOpen(false); }} className="flex-1 py-3 font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-2xl">Excluir</button>
                <button onClick={handleSaveTask} className="flex-2 bg-red-700 dark:bg-red-900 text-white py-3 px-8 font-bold rounded-2xl shadow-lg">Salvar</button>
              </div>
              <button onClick={() => setIsDetailsOpen(false)} className="w-full text-center text-sm text-gray-400 dark:text-zinc-500 py-2">Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;

import React, { useState, useMemo } from 'react';
import { Task } from '../types';
import { Settings, Plus, Trash2, ArrowUp, ArrowDown, Eye, X, Check, Edit3 } from 'lucide-react';

interface TasksProps {
  tasks: Task[];
  stands: string[];
  setTasks: (t: Task[]) => void;
  setStands: (s: string[]) => void;
}

const Tasks: React.FC<TasksProps> = ({ tasks, stands, setTasks, setStands }) => {
  const [formData, setFormData] = useState({ title: '', stand: '', details: '' });
  const [isAddingStand, setIsAddingStand] = useState(false);
  const [isManagingStands, setIsManagingStands] = useState(false);
  const [newStandName, setNewStandName] = useState('');
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [statusFilterModal, setStatusFilterModal] = useState<string | null>(null);

  const tToS = (t: string) => t;
  const handleDeleteStand = (standName: string) => {
    if (window.confirm(`Excluir o status "${standName}"? As tarefas deste status ficarão sem categoria.`)) {
      setStands(stands.filter(s => s !== standName));
      setTasks(tasks.map(t => t.stand === standName ? { ...t, stand: '' } : t));
    }
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

  const moveTask = (id: string, direction: 'up' | 'down') => {
    const newTasks = [...tasks];
    const index = newTasks.findIndex(t => t.id === id);
    if (direction === 'up' && index > 0) {
      [newTasks[index].order, newTasks[index - 1].order] = [newTasks[index - 1].order, newTasks[index].order];
    } else if (direction === 'down' && index < newTasks.length - 1) {
      [newTasks[index].order, newTasks[index + 1].order] = [newTasks[index + 1].order, newTasks[index].order];
    }
    setTasks(newTasks.sort((a, b) => a.order - b.order));
  };

  const handleAddStand = () => {
    if (newStandName && !stands.includes(newStandName)) {
      setStands([...stands, newStandName]);
      setFormData({ ...formData, stand: newStandName });
      setNewStandName('');
      setIsAddingStand(false);
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks
      .filter(t => !statusFilterModal || t.stand === statusFilterModal)
      .sort((a, b) => a.order - b.order);
  }, [tasks, statusFilterModal]);
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-gray-800 dark:text-zinc-100">Nova Tarefa</h3>
          <button 
            onClick={() => setIsManagingStands(!isManagingStands)}
            className={`p-2 rounded-xl transition-all ${isManagingStands ? 'bg-red-100 text-red-600 ring-2 ring-red-500' : 'bg-zinc-100 text-zinc-500'}`}
          >
            <Settings size={18} className={isManagingStands ? "animate-spin-slow" : ""} />
          </button>
        </div>

        <input
          type="text" placeholder="Título da tarefa"
          className="w-full p-3 rounded-2xl bg-gray-50 dark:bg-zinc-800 border-none outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-zinc-100"
          value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
        />
        
        {!isAddingStand ? (
          <select
            className="w-full p-3 rounded-2xl bg-gray-50 dark:bg-zinc-800 border-none outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-zinc-100 font-medium"
            value={formData.stand} 
            onChange={e => e.target.value === 'NEW' ? setIsAddingStand(true) : setFormData({ ...formData, stand: e.target.value })}
          >
            <option value="">Selecione o Status</option>
            {stands.map(s => <option key={s} value={s}>{s}</option>)}
            <option value="NEW" className="text-red-700 font-bold">+ Novo Status</option>
          </select>
        ) : (
          <div className="flex gap-2">
            <input autoFocus placeholder="Nome do Status" className="flex-1 p-3 rounded-2xl bg-red-50 dark:bg-red-950/30 border-none outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-zinc-100"
              value={newStandName} onChange={e => setNewStandName(e.target.value)} />
            <button onClick={handleAddStand} className="bg-red-700 text-white px-4 rounded-2xl font-bold"><Check size={18}/></button>
            <button onClick={() => setIsAddingStand(false)} className="bg-gray-200 text-gray-600 px-4 rounded-2xl"><X size={18}/></button>
          </div>
        )}

        <div className="flex space-x-3">
          <button onClick={() => { setIsDetailsOpen(true); }} className="flex-1 py-3 text-gray-500 font-bold rounded-2xl border-2 border-gray-100 dark:border-zinc-800">Detalhes</button>
          <button onClick={handleSaveTask} className="flex-2 bg-red-700 text-white py-3 px-8 rounded-2xl font-bold">
            {editingTask ? 'Salvar Edição' : 'Criar Tarefa'}
          </button>
        </div>
      </div>

      <div className="flex space-x-2 overflow-x-auto pb-2 hide-scrollbar">
        <button onClick={() => setStatusFilterModal(null)} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap border ${!statusFilterModal ? 'bg-red-700 text-white' : 'bg-white dark:bg-zinc-900 text-gray-400 border-gray-100 dark:border-zinc-800'}`}>Todas</button>
        {stands.map(s => (
          <div key={s} className="relative flex-shrink-0">
            <button onClick={() => setStatusFilterModal(s)} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap border ${statusFilterModal === s ? 'bg-red-700 text-white border-red-700' : 'bg-white dark:bg-zinc-900 text-gray-400 border-gray-100 dark:border-zinc-800'}`}>{s}</button>
            {isManagingStands && (
              <button onClick={(e) => { e.stopPropagation(); handleDeleteStand(s); }} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 shadow-lg z-10"><X size={10} strokeWidth={4} /></button>
            )}
          </div>
        ))}
      </div>
      {/* LISTAGEM DE TAREFAS */}
      <div className="space-y-3">
        {filteredTasks.map((task) => (
          <div key={task.id} className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-gray-100 dark:border-zinc-800 flex items-center justify-between group">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                  {task.stand}
                </span>
              </div>
              <h4 className="font-bold text-gray-800 dark:text-zinc-100">{task.title}</h4>
            </div>
            
            <div className="flex items-center space-x-1">
              {/* Botões de Ordenação: Subir e Descer */}
              <div className="flex flex-col">
                <button onClick={() => moveTask(task.id, 'up')} className="p-1 text-gray-400 hover:text-gray-600" title="Mover para cima"><ArrowUp size={16}/></button>
                <button onClick={() => moveTask(task.id, 'down')} className="p-1 text-gray-400 hover:text-gray-600" title="Mover para baixo"><ArrowDown size={16}/></button>
              </div>
              
              <button onClick={() => { setEditingTask(task); setFormData(task); setIsDetailsOpen(true); }} className="p-2 text-blue-500"><Edit3 size={16}/></button>
              <button onClick={() => setTasks(tasks.filter(t => t.id !== task.id))} className="p-2 text-red-500"><Trash2 size={16}/></button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL DE DETALHES/EDIÇÃO */}
      {isDetailsOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-[40px] p-8 shadow-2xl animate-in zoom-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-xl text-gray-900 dark:text-white uppercase">Detalhes da Tarefa</h3>
              <button onClick={() => setIsDetailsOpen(false)} className="text-gray-400"><X/></button>
            </div>
            <textarea 
              className="w-full h-48 bg-gray-50 dark:bg-zinc-800 p-4 rounded-3xl outline-none focus:ring-2 focus:ring-red-500 text-gray-800 dark:text-zinc-200 mb-6"
              placeholder="Descreva os detalhes aqui..."
              value={formData.details}
              onChange={e => setFormData({...formData, details: e.target.value})}
            />
            <button onClick={() => setIsDetailsOpen(false)} className="w-full bg-zinc-900 dark:bg-white dark:text-black text-white py-4 rounded-2xl font-black uppercase">Fechar e Salvar</button>
          </div>
        </div>
      )}

      <style>{`
        .animate-spin-slow { animation: spin-slow 4s linear infinite; }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default Tasks;
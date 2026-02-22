
import React, { useState } from 'react';
import { Appointment } from '../types';

interface AgendaProps {
  appointments: Appointment[];
  setAppointments: (appts: Appointment[]) => void;
}

const Agenda: React.FC<AgendaProps> = ({ appointments, setAppointments }) => {
  const [view, setView] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedDayAppts, setSelectedDayAppts] = useState<Appointment[]>([]);
  const [formData, setFormData] = useState({ title: '', date: '', time: '', details: '' });
  const [editingId, setEditingId] = useState<string | null>(null);

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => {
    let day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; 
  };

  const getWeekDays = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - (day === 0 ? 6 : day - 1);
    const monday = new Date(today.setDate(diff));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  };

  const weekDays = getWeekDays();

  const handleSave = () => {
    if (!formData.title || !formData.date) return;
    if (editingId) {
      setAppointments(appointments.map(a => a.id === editingId ? { ...formData, id: editingId } : a));
    } else {
      setAppointments([...appointments, { ...formData, id: Date.now().toString() }]);
    }
    setFormData({ title: '', date: '', time: '', details: '' });
    setEditingId(null);
    setIsModalOpen(false);
    setIsDetailsOpen(false);
  };

  const handleEdit = (appt: Appointment) => {
    setFormData(appt);
    setEditingId(appt.id);
    setIsDetailsOpen(true);
  };

  const handleDelete = (id: string) => {
    setAppointments(appointments.filter(a => a.id !== id));
    setSelectedDayAppts(selectedDayAppts.filter(a => a.id !== id));
  };

  const formatDateString = (date: Date) => date.toISOString().split('T')[0];

  const renderMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const totalDays = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const cells = [];
    
    for (let i = 0; i < firstDay; i++) cells.push(<div key={`empty-${i}`} className="h-24 border border-gray-100 dark:border-zinc-800 bg-gray-50/30 dark:bg-zinc-900/30" />);
    
    for (let day = 1; day <= totalDays; day++) {
      const dateStr = formatDateString(new Date(year, month, day));
      const dayAppts = appointments.filter(a => a.date === dateStr);
      cells.push(
        <div key={day} className="h-24 border border-gray-100 dark:border-zinc-800 p-1 relative flex flex-col transition-colors">
          <span className="text-xs font-semibold text-gray-500 dark:text-zinc-500">{day}</span>
          {dayAppts.length > 0 && (
            <button
              onClick={() => { setSelectedDayAppts(dayAppts); setIsModalOpen(true); }}
              className="mt-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 text-[10px] px-1 py-0.5 rounded border border-red-200 dark:border-red-800 font-bold truncate"
            >
              Ver {dayAppts.length}
            </button>
          )}
        </div>
      );
    }
    return cells;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white dark:bg-zinc-900 p-2 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm transition-colors">
        <div className="flex bg-gray-100 dark:bg-zinc-800 rounded-lg p-1">
          <button onClick={() => setView('week')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'week' ? 'bg-white dark:bg-zinc-700 shadow-sm text-red-700 dark:text-red-400' : 'text-gray-500 dark:text-zinc-500'}`}>Semana</button>
          <button onClick={() => setView('month')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'month' ? 'bg-white dark:bg-zinc-700 shadow-sm text-red-700 dark:text-red-400' : 'text-gray-500 dark:text-zinc-500'}`}>Folhinha</button>
        </div>
        <button onClick={() => { setEditingId(null); setFormData({ title: '', date: '', time: '', details: '' }); setIsDetailsOpen(true); }} className="bg-red-700 dark:bg-red-800 text-white p-2 rounded-full shadow-lg hover:opacity-90 transition-all">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
        </button>
      </div>

      {view === 'week' ? (
        <div className="space-y-4">
          {weekDays.map(day => {
            const dateStr = formatDateString(day);
            const dayAppts = appointments.filter(a => a.date === dateStr).sort((a,b) => a.time.localeCompare(b.time));
            return (
              <div key={dateStr} className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden transition-colors">
                <div className="bg-gray-50 dark:bg-zinc-800 px-4 py-2 border-b border-gray-100 dark:border-zinc-700 flex justify-between items-center">
                  <h3 className="font-bold text-gray-800 dark:text-zinc-100">
                    {day.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </h3>
                  {dayAppts.length > 0 && <span className="bg-red-700 dark:bg-red-900 text-white text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Hoje</span>}
                </div>
                <div className="p-4 space-y-3">
                  {dayAppts.length > 0 ? dayAppts.map(appt => (
                    <div key={appt.id} className="flex items-start group p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-zinc-700">
                      <div className="text-sm font-mono text-gray-400 dark:text-zinc-500 mt-1 w-12">{appt.time || '--:--'}</div>
                      <div className="ml-3 flex-1">
                        <div className="font-semibold text-gray-800 dark:text-zinc-200">{appt.title}</div>
                        {appt.details && <div className="text-xs text-gray-500 dark:text-zinc-500 italic mt-0.5">{appt.details}</div>}
                      </div>
                      <div className="flex space-x-2">
                        <button onClick={() => handleEdit(appt)} className="text-blue-500 dark:text-blue-400 hover:scale-110 transition-transform">✏️</button>
                        <button onClick={() => handleDelete(appt.id)} className="text-red-500 dark:text-red-400 hover:scale-110 transition-transform">🗑️</button>
                      </div>
                    </div>
                  )) : <div className="text-sm text-gray-400 dark:text-zinc-600 italic">Nenhum agendamento</div>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-md overflow-hidden transition-colors">
          <div className="flex items-center justify-between p-4 bg-red-700 dark:bg-red-900 text-white">
            <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}>◀</button>
            <h2 className="text-lg font-bold capitalize">{currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</h2>
            <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}>▶</button>
          </div>
          <div className="grid grid-cols-7 border-b border-gray-100 dark:border-zinc-800">
            {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(d => (
              <div key={d} className="p-2 text-center text-xs font-bold text-gray-400 dark:text-zinc-500 bg-gray-50 dark:bg-zinc-800">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">{renderMonth()}</div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl transition-colors">
            <div className="bg-red-700 dark:bg-red-900 p-4 text-white flex justify-between items-center">
              <h3 className="font-bold">Agendamentos do Dia</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-2xl">&times;</button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-4 hide-scrollbar">
              {selectedDayAppts.map(appt => (
                <div key={appt.id} className="p-3 bg-gray-50 dark:bg-zinc-800 rounded-2xl border border-gray-200 dark:border-zinc-700">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-mono text-red-600 dark:text-red-400 font-bold">{appt.time}</span>
                    <div className="flex space-x-3">
                      <button onClick={() => handleEdit(appt)} className="text-sm dark:text-zinc-300">✏️</button>
                      <button onClick={() => handleDelete(appt.id)} className="text-sm dark:text-zinc-300">🗑️</button>
                    </div>
                  </div>
                  <div className="font-bold text-gray-800 dark:text-zinc-200 mt-1">{appt.title}</div>
                  <p className="text-xs text-gray-500 dark:text-zinc-500 mt-2">{appt.details}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {isDetailsOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl ring-1 ring-black/5 transition-colors">
            <div className="p-6 space-y-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-zinc-100 flex items-center">
                <span className="mr-2">📝</span> {editingId ? 'Editar Detalhes' : 'Novo Agendamento'}
              </h3>
              <div className="space-y-3">
                <input type="text" placeholder="O que agendar?"
                  className="w-full p-3 rounded-2xl border border-gray-200 dark:border-zinc-800 focus:ring-2 focus:ring-red-500 outline-none text-gray-900 dark:text-zinc-100 bg-white dark:bg-zinc-800"
                  value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-3">
                  <input type="date"
                    className="p-3 rounded-2xl border border-gray-200 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-zinc-100 bg-white dark:bg-zinc-800"
                    value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })}
                  />
                  <input type="time"
                    className="p-3 rounded-2xl border border-gray-200 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-zinc-100 bg-white dark:bg-zinc-800"
                    value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })}
                  />
                </div>
                <textarea placeholder="Mais detalhes..."
                  className="w-full p-3 h-32 rounded-2xl border border-gray-200 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-red-500 resize-none text-gray-900 dark:text-zinc-100 bg-white dark:bg-zinc-800"
                  value={formData.details} onChange={e => setFormData({ ...formData, details: e.target.value })}
                />
              </div>
              <div className="flex space-x-3 pt-2">
                <button onClick={() => setIsDetailsOpen(false)} className="flex-1 py-3 font-semibold text-gray-500 dark:text-zinc-400 bg-gray-100 dark:bg-zinc-800 rounded-2xl">Cancelar</button>
                <button onClick={handleSave} className="flex-2 bg-red-700 dark:bg-red-800 text-white py-3 px-8 font-bold rounded-2xl shadow-lg shadow-red-200">Salvar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Agenda;

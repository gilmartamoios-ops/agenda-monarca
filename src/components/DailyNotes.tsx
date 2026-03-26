import React, { useState } from 'react';
import { Note } from '../types';

interface DailyNotesProps {
  dailyNotes: Note[];
  setDailyNotes: (notes: Note[]) => void;
}

const DailyNotes: React.FC<DailyNotesProps> = ({ dailyNotes, setDailyNotes }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [noteContent, setNoteContent] = useState('');
  const [isListView, setIsListView] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const renderLinks = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer" 
             className="text-blue-400 underline font-black break-all"
             onClick={(e) => e.stopPropagation()}>
            {part}
          </a>
        );
      }
      return part;
    });
  };

  const handleSave = () => {
    const trimmed = noteContent.trim();
    if (!trimmed) return alert("Escreva algo antes de salvar.");
    let newNotes: Note[];
    if (editingId) {
      newNotes = dailyNotes.map(n => n.id === editingId ? { ...n, content: trimmed, date: selectedDate } : n);
      setEditingId(null);
    } else {
      newNotes = [...dailyNotes, { id: Date.now().toString(), content: trimmed, date: selectedDate }];
    }
    setDailyNotes(newNotes);
    setNoteContent('');
  };
  const handleDelete = (id?: string) => {
    const targetId = id || editingId;
    if (!targetId) return setNoteContent('');
    if (window.confirm("Excluir nota definitivamente?")) {
      setDailyNotes(dailyNotes.filter(n => n.id !== targetId));
      if (targetId === editingId) { setEditingId(null); setNoteContent(''); }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm">
        <h3 className="font-black text-gray-800 dark:text-zinc-100 uppercase tracking-widest text-xs">Diário de Notas</h3>
        <button onClick={() => setIsListView(!isListView)}
          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${isListView ? 'bg-red-700 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
          {isListView ? 'Voltar' : 'Histórico'}
        </button>
      </div>

      {!isListView ? (
        <div className="space-y-4">
          <div className="bg-zinc-900 p-6 rounded-[40px] border-b-8 border-red-700 shadow-2xl min-h-[450px] flex flex-col">
            <input type="date" className="bg-zinc-800 text-white p-3 rounded-2xl mb-4 border-none outline-none font-bold"
              value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
            
            <textarea
              placeholder="O que deseja registrar hoje?..."
              className="flex-1 w-full bg-zinc-800/50 p-6 rounded-3xl border-2 border-zinc-700/50 focus:border-red-700 outline-none resize-none font-medium text-lg text-white placeholder-zinc-600 italic"
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff' }}
            />
            
            <div className="grid grid-cols-2 gap-4 mt-6">
              <button onClick={handleSave} className={`${editingId ? 'bg-blue-600' : 'bg-red-700'} text-white py-4 rounded-2xl font-black uppercase text-xs shadow-lg`}>
                {editingId ? 'Atualizar 🔄' : 'Salvar 💾'}
              </button>
              <button onClick={() => handleDelete()} className="py-4 rounded-2xl font-black uppercase text-xs bg-zinc-800 text-red-400 border border-zinc-700">
                {editingId ? 'Excluir' : 'Limpar'} 🗑️
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4 pb-10">
          {dailyNotes.length > 0 ? (
            [...dailyNotes].sort((a,b) => b.id.localeCompare(a.id)).map(note => (
              <div key={note.id} className="bg-zinc-900 p-6 rounded-[35px] border border-zinc-800 shadow-lg mb-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-black text-red-700 uppercase">{note.date}</span>
                  <div className="flex space-x-2">
                    <button onClick={() => { setSelectedDate(note.date); setNoteContent(note.content); setEditingId(note.id); setIsListView(false); }} 
                            className="p-2 bg-zinc-800 rounded-xl text-blue-400 text-xs font-bold">✏️ Editar</button>
                    <button onClick={() => handleDelete(note.id)} className="p-2 bg-zinc-800 rounded-xl text-red-400 text-xs">🗑️</button>
                  </div>
                </div>
                <div className="bg-zinc-800 p-5 rounded-2xl border border-zinc-700/50">
                  <div className="text-zinc-200 text-sm leading-relaxed whitespace-pre-wrap">
                    {renderLinks(note.content)}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 text-zinc-500 font-bold uppercase tracking-widest">Sem registros históricos.</div>
          )}
        </div>
      )}<style>{`
        textarea, input, select {
          background-color: #18181b !important;
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
        }
        ::placeholder { color: #52525b !important; opacity: 1; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(1); }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default DailyNotes;

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

  const handleSave = () => {
    const trimmedContent = noteContent.trim();
    if (!trimmedContent) {
      alert("Por favor, escreva algo antes de salvar.");
      return;
    }

    let newNotesList: Note[];

    if (editingId) {
      newNotesList = dailyNotes.map(n => 
        n.id === editingId ? { ...n, content: trimmedContent, date: selectedDate } : n
      );
      setEditingId(null);
    } else {
      const newNote: Note = {
        id: Date.now().toString(),
        content: trimmedContent,
        date: selectedDate
      };
      newNotesList = [...dailyNotes, newNote];
    }

    setDailyNotes(newNotesList);
    setNoteContent('');
    alert("Nota gravada e enviada para a lista!");
  };

  const handleDelete = (id?: string) => {
    const targetId = id || editingId;
    if (!targetId) {
      if (noteContent) setNoteContent('');
      return;
    }

    if (window.confirm("Tem certeza que deseja excluir esta nota definitivamente?")) {
      const updatedNotes = dailyNotes.filter(n => n.id !== targetId);
      setDailyNotes(updatedNotes);
      if (targetId === editingId) {
        setEditingId(null);
        setNoteContent('');
      }
    }
  };

  const handleEditFromList = (note: Note) => {
    setSelectedDate(note.date);
    setNoteContent(note.content);
    setEditingId(note.id);
    setIsListView(false);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setNoteContent('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm transition-colors">
        <h3 className="font-black text-gray-800 dark:text-zinc-100 uppercase tracking-widest text-xs">Diário de Notas</h3>
        <button 
          onClick={() => setIsListView(!isListView)}
          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${isListView ? 'bg-red-700 dark:bg-red-900 text-white' : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700'}`}
        >
          {isListView ? 'Voltar para Escrita' : 'Ver Histórico'}
        </button>
      </div>

      {!isListView ? (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm flex items-center space-x-3 transition-colors">
            <span className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-tighter">Data do Registro:</span>
            <input 
              type="date" 
              className="flex-1 bg-gray-50 dark:bg-zinc-800 border-none outline-none p-3 rounded-2xl text-sm font-bold text-gray-800 dark:text-zinc-100 focus:ring-2 focus:ring-red-500 transition-all"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          <div className="bg-white dark:bg-zinc-900 p-6 rounded-[40px] border border-gray-100 dark:border-zinc-800 shadow-xl relative min-h-[450px] flex flex-col group transition-colors">
            <div className={`absolute top-0 left-0 w-full h-1.5 transition-opacity rounded-t-full ${editingId ? 'bg-blue-500 opacity-60' : 'bg-red-700 dark:bg-red-900 opacity-20'}`}></div>
            
            <div className="mb-4 flex justify-between items-center">
              <span className={`text-[9px] font-black uppercase tracking-widest ${editingId ? 'text-blue-600 dark:text-blue-400' : 'text-gray-300 dark:text-zinc-600'}`}>
                {editingId ? '📍 Editando Registro Existente' : '🖋️ Novo Registro'}
              </span>
              {editingId && (
                <button onClick={handleCancelEdit} className="text-[9px] font-black text-red-500 dark:text-red-400 uppercase">Cancelar Edição</button>
              )}
            </div>

            <textarea
              placeholder="O que você deseja registrar hoje? Escreva aqui e salve para enviar à lista..."
              className="flex-1 w-full bg-transparent border-none outline-none resize-none font-serif text-lg text-gray-800 dark:text-zinc-200 leading-relaxed placeholder-gray-300 dark:placeholder-zinc-700 italic p-2"
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
            />
            
            <div className="grid grid-cols-2 gap-4 mt-6">
              <button 
                onClick={handleSave}
                className={`${editingId ? 'bg-blue-600 dark:bg-blue-800' : 'bg-red-700 dark:bg-red-900'} text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center space-x-2`}
              >
                <span>{editingId ? 'Atualizar' : 'Salvar'}</span>
                <span>{editingId ? '🔄' : '💾'}</span>
              </button>
              <button 
                onClick={() => handleDelete()}
                className={`py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center space-x-2 bg-gray-100 dark:bg-zinc-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 border border-gray-100 dark:border-zinc-700 shadow-sm`}
              >
                <span>{editingId ? 'Excluir' : 'Limpar'}</span>
                <span>🗑️</span>
              </button>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 dark:text-zinc-600 text-center font-bold uppercase tracking-widest">Clique em Salvar para enviar a nota ao Histórico.</p>
        </div>
      ) : (
        <div className="space-y-4 animate-fade-in pb-10">
          {dailyNotes.length > 0 ? (
            [...dailyNotes].sort((a,b) => b.id.localeCompare(a.id)).map(note => (
              <div key={note.id} className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-red-700 dark:bg-red-500 rounded-full"></span>
                    <span className="text-[10px] font-black text-gray-800 dark:text-zinc-200 uppercase tracking-widest">
                      {new Date(note.date + "T12:00:00").toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleEditFromList(note)}
                      className="p-2.5 bg-gray-50 dark:bg-zinc-800 rounded-xl text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors border border-gray-100 dark:border-zinc-700"
                    >
                      ✏️ Editar
                    </button>
                    <button 
                      onClick={() => handleDelete(note.id)}
                      className="p-2.5 bg-gray-50 dark:bg-zinc-800 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors border border-gray-100 dark:border-zinc-700"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <div className="bg-gray-50/50 dark:bg-zinc-950/50 p-4 rounded-2xl border border-gray-50 dark:border-zinc-800">
                  <p className="text-gray-700 dark:text-zinc-300 text-sm font-serif italic leading-relaxed whitespace-pre-wrap">
                    "{note.content}"
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white dark:bg-zinc-900 p-12 rounded-[40px] border border-dashed border-gray-200 dark:border-zinc-800 text-center flex flex-col items-center">
              <span className="text-4xl mb-4 opacity-30">📭</span>
              <p className="text-gray-400 dark:text-zinc-500 text-sm font-bold uppercase tracking-widest">Sem registros históricos.</p>
              <button 
                onClick={() => setIsListView(false)}
                className="mt-6 text-red-700 dark:text-red-400 text-xs font-black underline uppercase tracking-widest"
              >
                Criar minha primeira nota
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DailyNotes;

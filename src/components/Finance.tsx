import React, { useState, useMemo, useEffect } from 'react';
import { Trash2, Edit3, Printer, TrendingUp, Settings, Save, X, Calendar, Search } from 'lucide-react';

const Finance = ({ transactions, setTransactions, categories, setCategories }: any) => {
  const [formData, setFormData] = useState({ 
    description: '', 
    amount: '', 
    type: 'despesa' as 'receita' | 'despesa', 
    category: 'Depósito em Conta', 
    date: new Date().toISOString().split('T')[0] 
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showCatManager, setShowCatManager] = useState(false);
  const [newCat, setNewCat] = useState('');

  // COMANDOS DE AUDITORIA DE PERÍODO (Início e Fim)
  const [dateStart, setDateStart] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [dateEnd, setDateEnd] = useState(new Date().toISOString().split('T')[0]);

  // Lógica de filtragem por intervalo de datas
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t: any) => {
      return t.date >= dateStart && t.date <= dateEnd;
    }).sort((a: any, b: any) => b.date.localeCompare(a.date));
  }, [transactions, dateStart, dateEnd]);

  const renderLinks = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, i) => {
      if (part.match(urlRegex)) {
        return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline break-all font-bold" onClick={(e) => e.stopPropagation()}>{part}</a>;
      }
      return part;
    });
  };
  const stats = useMemo(() => {
    const income = filteredTransactions.filter((t: any) => t.type === 'receita').reduce((sum: number, t: any) => sum + t.amount, 0);
    const expense = filteredTransactions.filter((t: any) => t.type === 'despesa').reduce((sum: number, t: any) => sum + t.amount, 0);
    const saldo1 = income - expense;
    
    const invest = saldo1 > 0 ? saldo1 * 0.20 : 0;
    const lazer = saldo1 > 0 ? saldo1 * 0.15 : 0;
    const emergencial = saldo1 > 0 ? saldo1 * 0.15 : 0;
    const saldo2 = saldo1 - (invest + lazer + emergencial);
    
    const expenseCatTotals = filteredTransactions.filter((t: any) => t.type === 'despesa').reduce((acc: any, t: any) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount; return acc;
    }, {});

    return { income, expense, saldo1, saldo2, invest, lazer, emergencial, expenseCatTotals };
  }, [filteredTransactions]);
  return (
    <div className="space-y-6 pb-24">
      {/* SELETOR DE AUDITORIA DE PERÍODO ESPECÍFICO */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-[30px] border dark:border-zinc-800 shadow-sm no-print space-y-3">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase text-red-700 tracking-widest px-2">
          <Search size={14}/> Auditoria de Período
        </div>
        <div className="flex gap-2">
          <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 p-3 rounded-2xl flex flex-col">
            <span className="text-[8px] font-bold text-zinc-400 uppercase">Início</span>
            <input type="date" className="bg-transparent text-xs font-black outline-none dark:text-white" value={dateStart} onChange={(e) => setDateStart(e.target.value)} />
          </div>
          <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 p-3 rounded-2xl flex flex-col">
            <span className="text-[8px] font-bold text-zinc-400 uppercase">Fim</span>
            <input type="date" className="bg-transparent text-xs font-black outline-none dark:text-white" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} />
          </div>
        </div>
      </div>

      {/* PAINEL DE LANÇAMENTOS (Ajustado Xiaomi) */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-[35px] shadow-sm space-y-4 no-print border dark:border-zinc-800">
        <div className="flex justify-between items-center">
          <h3 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Painel de Lançamentos</h3>
          <button onClick={() => setShowCatManager(!showCatManager)} className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-zinc-500"><Settings size={18}/></button>
        </div>

        {showCatManager && (
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-3xl border-2 border-dashed border-zinc-200">
            <div className="flex gap-2 mb-4">
              <input type="text" placeholder="Nova Conta..." className="flex-1 p-3 rounded-xl text-xs font-bold text-zinc-900" value={newCat} onChange={e => setNewCat(e.target.value)} />
              <button onClick={() => { if(newCat) { setCategories([...categories, newCat]); setNewCat(''); } }} className="bg-zinc-900 text-white px-5 rounded-xl font-bold">+</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((c: string) => (
                <span key={c} className="bg-white dark:bg-zinc-900 px-3 py-1 rounded-full text-[9px] font-black border uppercase flex items-center gap-2">
                  {c} <button onClick={() => setCategories(categories.filter((cat: string) => cat !== c))} className="text-red-500">×</button>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex bg-gray-100 dark:bg-zinc-800 rounded-2xl p-1">
          <button onClick={() => setFormData({...formData, type: 'receita'})} className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${formData.type === 'receita' ? 'bg-green-600 text-white shadow-lg' : 'text-zinc-400'}`}>ENTRADA</button>
          <button onClick={() => setFormData({...formData, type: 'despesa'})} className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${formData.type === 'despesa' ? 'bg-red-700 text-white shadow-lg' : 'text-zinc-400'}`}>SAÍDA</button>
        </div>
        
        <input type="date" className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800 border-none text-sm font-bold text-zinc-500" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
        <input type="text" placeholder="Descrição da Operação" className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800 border-none text-sm font-bold text-zinc-900 dark:text-white" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
        
        <div className="flex gap-2">
          <input type="number" placeholder="R$ 0,00" className="flex-1 min-w-0 p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800 border-none text-sm font-black text-zinc-900 dark:text-white" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
          <select className="flex-1 min-w-0 p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800 text-xs font-bold text-zinc-500 border-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
            <option value="Depósito em Conta">Depósito em Conta</option>
            {categories.map((c: string) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <button onClick={() => {
          const val = parseFloat(formData.amount);
          if (!formData.description || isNaN(val)) return;
          if (editingId) {
            setTransactions(transactions.map((t: any) => t.id === editingId ? { ...formData, amount: val, id: editingId } : t));
            setEditingId(null);
          } else {
            setTransactions([{ ...formData, amount: val, id: Date.now().toString() }, ...transactions]);
          }
          setFormData({ description: '', amount: '', type: 'despesa', category: 'Depósito em Conta', date: new Date().toISOString().split('T')[0] });
        }} className="w-full bg-red-700 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95">
          {editingId ? 'ATUALIZAR REGISTRO' : 'CONFIRMAR OPERAÇÃO'}
        </button>
      </div>
      <div className="bg-zinc-900 rounded-[40px] p-8 text-white shadow-2xl border-b-8 border-red-700 no-print">
        <div className="flex justify-between items-start mb-6">
          <div className="space-y-4">
            <div><div className="text-[10px] uppercase opacity-40 font-black mb-1">Saldo 1 (Auditoria)</div><div className="text-4xl font-black italic">R$ {stats.saldo1.toFixed(2)}</div></div>
            <div><div className="text-[10px] uppercase opacity-40 font-black mb-1 text-blue-400">Saldo 2 (Disponível)</div><div className="text-2xl font-black text-blue-400 italic">R$ {stats.saldo2.toFixed(2)}</div></div>
          </div>
          <button onClick={() => setShowPreview(true)} className="bg-blue-600 w-16 h-16 rounded-2xl flex flex-col items-center justify-center gap-1 active:scale-95 shadow-lg"><TrendingUp size={20}/><span className="text-[8px] font-black uppercase tracking-tighter">Corretor</span></button>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-[35px] overflow-hidden shadow-sm border dark:border-zinc-800">
        <div className="p-5 border-b dark:border-zinc-800 text-[10px] font-black uppercase text-gray-400 tracking-widest">
          Movimentações do Período Selecionado
        </div>
        <div className="divide-y dark:divide-zinc-800">
          {filteredTransactions.map((t: any) => (
            <div key={t.id} className="p-5 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-zinc-800/50">
              <div className="flex items-center gap-4">
                <div className="flex flex-col gap-2">
                  <button onClick={() => { setFormData({...t, amount: t.amount.toString()}); setEditingId(t.id); window.scrollTo(0,0); }} className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Edit3 size={14}/></button>
                  <button onClick={() => setTransactions(transactions.filter((x: any) => x.id !== t.id))} className="p-2 bg-red-50 text-red-500 rounded-lg"><Trash2 size={14}/></button>
                </div>
                <div><div className="text-sm font-bold dark:text-zinc-100">{renderLinks(t.description)}</div><div className="text-[9px] text-gray-400 font-black uppercase tracking-widest">{t.date} | {t.category}</div></div>
              </div>
              <div className={`text-sm font-black ${t.type === 'receita' ? 'text-green-600' : 'text-red-600'}`}>R$ {t.amount.toFixed(2)}</div>
            </div>
          ))}
        </div>
      </div>

      {showPreview && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex flex-col no-print">
          <div className="p-4 bg-zinc-100 flex justify-between items-center sticky top-0 shadow-xl" style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))' }}>
            <div className="flex gap-2">
               <button onClick={() => setShowPreview(false)} className="bg-zinc-900 text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase active:scale-90">✕ FECHAR</button>
               <button onClick={() => window.print()} className="bg-blue-600 text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase active:scale-90 flex items-center gap-2"><Printer size={16}/> PDF</button>
            </div>
            <span className="text-[10px] font-black text-zinc-400 tracking-widest pr-4 italic uppercase">Gestão Monarca</span>
          </div>
          <div className="bg-white flex-1 overflow-y-auto p-10 text-zinc-900 font-serif print:p-0">
             <div className="text-center border-b-4 border-black pb-8 mb-8">
                <h1 className="text-2xl font-black uppercase italic tracking-tighter">Balanço de Gestão Profissional</h1>
                <p className="text-[10px] font-black uppercase mt-2">Período Selecionado: {dateStart.split('-').reverse().join('/')} até {dateEnd.split('-').reverse().join('/')}</p>
             </div>
             {/* Conteúdo do Balanço (Grelha de Saldo1, Saldo2, Lazer, Emerg, Invest) permanece igual, mas com os dados do período */}
             <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-6 bg-zinc-50 rounded-3xl border"><p className="text-[9px] font-black uppercase text-zinc-400 mb-2 tracking-widest">Saldo 1 (Período)</p><p className="text-2xl font-black italic">R$ {stats.saldo1.toFixed(2)}</p></div>
                <div className="p-6 bg-blue-50 border-blue-100 rounded-3xl border"><p className="text-[9px] font-black uppercase text-blue-400 mb-2 tracking-widest">Disponível (Período)</p><p className="text-2xl font-black italic text-blue-800">R$ {stats.saldo2.toFixed(2)}</p></div>
             </div>
             <div className="grid grid-cols-3 gap-2 text-center mb-10">
                <div className="p-3 border rounded-2xl"><p className="text-[8px] font-black text-zinc-400 uppercase">Lazer</p><p className="text-xs font-bold text-orange-600">R$ {stats.lazer.toFixed(2)}</p></div>
                <div className="p-3 border rounded-2xl"><p className="text-[8px] font-black text-zinc-400 uppercase">Emerg.</p><p className="text-xs font-bold text-blue-600">R$ {stats.emergencial.toFixed(2)}</p></div>
                <div className="p-3 border rounded-2xl"><p className="text-[8px] font-black text-zinc-400 uppercase">Invest.</p><p className="text-xs font-bold text-green-600">R$ {stats.invest.toFixed(2)}</p></div>
             </div>
             <div className="border-t pt-6 mb-10 text-xs">
                <h4 className="text-[10px] font-black uppercase mb-4 text-zinc-400 tracking-widest border-b pb-2">Gastos no Período</h4>
                {Object.entries(stats.expenseCatTotals).map(([cat, total]: any) => (
                  <p key={cat} className="flex justify-between italic mb-2 border-b border-zinc-50 pb-1">{cat}: <span>R$ {total.toFixed(2)}</span></p>
                ))}
             </div>
             <div className="p-8 bg-zinc-900 text-white rounded-[40px] border-l-[10px] border-red-700 italic text-sm leading-relaxed whitespace-pre-wrap print:bg-zinc-100 print:text-zinc-900 print:border-black">
                --- PARECER DO CORRETOR ESTRATÉGICO PARA O PERÍODO SELECIONADO ---
                VALOR PARA ALOCAÇÃO: R$ {stats.invest.toFixed(2)}
                
                Este balanço reflete exclusivamente as movimentações ocorridas entre {dateStart.split('-').reverse().join('/')} e {dateEnd.split('-').reverse().join('/')}.
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Finance;
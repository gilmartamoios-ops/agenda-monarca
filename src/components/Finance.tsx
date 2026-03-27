import React, { useState, useMemo, useEffect } from 'react';
import { 
  Trash2, Edit3, Printer, TrendingUp, Settings, Save, X, 
  Calendar, Search, ArrowUpCircle, ArrowDownCircle, Wallet, History 
} from 'lucide-react';

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

  const [dateStart, setDateStart] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [dateEnd, setDateEnd] = useState(new Date().toISOString().split('T')[0]);

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
    
    // CORREÇÃO AQUI: Agora o balanço por conta respeita o filtro de data
    const accountStats = filteredTransactions.reduce((acc: any, t: any) => {
      if (!acc[t.category]) acc[t.category] = { income: 0, expense: 0, balance: 0 };
      if (t.type === 'receita') acc[t.category].income += t.amount;
      else acc[t.category].expense += t.amount;
      acc[t.category].balance = acc[t.category].income - acc[t.category].expense;
      return acc;
    }, {});

    return { income, expense, saldo1, saldo2, invest, lazer, emergencial, accountStats };
  }, [filteredTransactions]);
  return (
    <div className="space-y-6 pb-24 animate-in fade-in">
      
      {/* 1. SELETOR DE AUDITORIA (CONTROLE DE PERÍODO) */}
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

      {/* 2. PAINEL DE LANÇAMENTOS */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-[35px] shadow-sm space-y-4 no-print border dark:border-zinc-800">
        <div className="flex justify-between items-center">
          <h3 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Novo Lançamento</h3>
          <button onClick={() => setShowCatManager(!showCatManager)} className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-zinc-500 hover:text-red-700 transition-colors">
            <Settings size={18}/>
          </button>
        </div>

        {showCatManager && (
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-3xl border-2 border-dashed border-zinc-200">
            <div className="flex gap-2 mb-4">
              <input type="text" placeholder="Nome da Conta (ex: Binance)..." className="flex-1 p-3 rounded-xl text-xs font-bold text-zinc-900 dark:bg-zinc-900 dark:text-white outline-none" value={newCat} onChange={e => setNewCat(e.target.value)} />
              <button onClick={() => { if(newCat) { setCategories([...categories, newCat]); setNewCat(''); } }} className="bg-zinc-900 text-white px-5 rounded-xl font-black">+</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((c: string) => (
                <span key={c} className="bg-white dark:bg-zinc-900 px-3 py-1 rounded-full text-[9px] font-black border uppercase flex items-center gap-2 dark:text-zinc-300">
                  {c} <button onClick={() => setCategories(categories.filter((cat: string) => cat !== c))} className="text-red-500 font-bold">×</button>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex bg-gray-100 dark:bg-zinc-800 rounded-2xl p-1">
          <button onClick={() => setFormData({...formData, type: 'receita'})} className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-2 ${formData.type === 'receita' ? 'bg-green-600 text-white shadow-lg' : 'text-zinc-400'}`}>
            <ArrowUpCircle size={14}/> ENTRADA
          </button>
          <button onClick={() => setFormData({...formData, type: 'despesa'})} className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-2 ${formData.type === 'despesa' ? 'bg-red-700 text-white shadow-lg' : 'text-zinc-400'}`}>
            <ArrowDownCircle size={14}/> SAÍDA
          </button>
        </div>
        
        <input type="date" className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800 border-none text-sm font-bold text-zinc-500" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
        <input type="text" placeholder="Descrição da Operação" className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800 border-none text-sm font-bold text-zinc-900 dark:text-white outline-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
        
        <div className="flex gap-2">
          <input type="number" placeholder="R$ 0,00" className="flex-1 min-w-0 p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800 border-none text-sm font-black text-zinc-900 dark:text-white outline-none" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
          <select className="flex-1 min-w-0 p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800 text-xs font-bold text-zinc-500 border-none outline-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
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
        }} className="w-full bg-zinc-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all">
          {editingId ? 'ATUALIZAR REGISTRO' : 'CONFIRMAR OPERAÇÃO'}
        </button>
      </div>

      {/* 3. RESUMO DE SALDOS TOTAIS */}
      <div className="bg-zinc-900 rounded-[40px] p-8 text-white shadow-2xl border-b-8 border-red-700 no-print">
        <div className="flex justify-between items-start">
          <div className="space-y-4">
            <div>
              <div className="text-[10px] uppercase opacity-40 font-black mb-1">Saldo Auditoria (Período)</div>
              <div className="text-4xl font-black italic">R$ {stats.saldo1.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase opacity-40 font-black mb-1 text-blue-400">Saldo Disponível (Período)</div>
              <div className="text-2xl font-black text-blue-400 italic">R$ {stats.saldo2.toFixed(2)}</div>
            </div>
          </div>
          <button onClick={() => setShowPreview(true)} className="bg-blue-600 w-16 h-16 rounded-2xl flex flex-col items-center justify-center gap-1 active:scale-95 shadow-lg">
            <TrendingUp size={20}/>
            <span className="text-[8px] font-black uppercase tracking-tighter">Corretor</span>
          </button>
        </div>
      </div>
      {/* 4. LISTAGEM DE MOVIMENTAÇÕES (HISTÓRICO FILTRADO) */}
      <div className="bg-white dark:bg-zinc-900 rounded-[35px] overflow-hidden shadow-sm border dark:border-zinc-800">
        <div className="p-5 border-b dark:border-zinc-800 text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
          <History size={14}/> Histórico de Auditoria
        </div>
        <div className="divide-y dark:divide-zinc-800">
          {filteredTransactions.map((t: any) => (
            <div key={t.id} className="p-5 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="flex flex-col gap-2">
                  <button onClick={() => { setFormData({...t, amount: t.amount.toString()}); setEditingId(t.id); window.scrollTo({top: 0, behavior: 'smooth'}); }} className="p-2 bg-blue-50 text-blue-600 rounded-lg active:scale-90"><Edit3 size={14}/></button>
                  <button onClick={() => { if(window.confirm('Excluir lançamento?')) setTransactions(transactions.filter((x: any) => x.id !== t.id)) }} className="p-2 bg-red-50 text-red-500 rounded-lg active:scale-90"><Trash2 size={14}/></button>
                </div>
                <div>
                  <div className="text-sm font-bold dark:text-zinc-100">{renderLinks(t.description)}</div>
                  <div className="text-[9px] text-gray-400 font-black uppercase tracking-widest">{t.date} | {t.category}</div>
                </div>
              </div>
              <div className={`text-sm font-black ${t.type === 'receita' ? 'text-green-600' : 'text-red-600'}`}>
                {t.type === 'receita' ? '+' : '-'} R$ {t.amount.toFixed(2)}
              </div>
            </div>
          ))}
          {filteredTransactions.length === 0 && (
            <div className="p-10 text-center text-zinc-400 text-[10px] font-black uppercase tracking-widest italic">Nenhum registro no período selecionado</div>
          )}
        </div>
      </div>

      {/* 5. MODAL DO CORRETOR (ESTRATÉGIA POR PERÍODO) */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex flex-col no-print animate-in fade-in">
          <div className="p-4 bg-zinc-100 flex justify-between items-center sticky top-0 shadow-xl">
            <div className="flex gap-2">
               <button onClick={() => setShowPreview(false)} className="bg-zinc-900 text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase active:scale-90">✕ VOLTAR</button>
               <button onClick={() => window.print()} className="bg-blue-600 text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase active:scale-90 flex items-center gap-2"><Printer size={16}/> PDF</button>
            </div>
            <span className="text-[10px] font-black text-zinc-400 tracking-widest pr-4 italic uppercase">Análise Estratégica Monarca</span>
          </div>

          <div className="bg-white flex-1 overflow-y-auto p-10 text-zinc-900 font-serif">
             <div className="text-center border-b-4 border-black pb-8 mb-8">
                <h1 className="text-2xl font-black uppercase italic tracking-tighter">Balanço de Auditoria</h1>
                <p className="text-[10px] font-black uppercase mt-2">Intervalo: {dateStart.split('-').reverse().join('/')} até {dateEnd.split('-').reverse().join('/')}</p>
             </div>

             {/* RESUMO POR CONTA (AGORA RESPEITANDO O PERÍODO SELECIONADO) */}
             <div className="mb-10">
                <h4 className="text-[10px] font-black uppercase mb-4 text-red-700 tracking-[0.3em] border-b pb-2">Posição no Período por Conta</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(stats.accountStats).map(([account, data]: any) => (
                    <div key={account} className="p-4 bg-zinc-50 border rounded-2xl flex justify-between items-center shadow-sm">
                      <div>
                        <p className="text-[9px] font-black uppercase text-zinc-400">{account}</p>
                        <p className={`text-lg font-black ${data.balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>R$ {data.balance.toFixed(2)}</p>
                      </div>
                      <div className="text-right text-[8px] font-bold uppercase opacity-60">
                        <p className="text-green-600">IN: R$ {data.income.toFixed(2)}</p>
                        <p className="text-red-600">OUT: R$ {data.expense.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-6 bg-zinc-50 rounded-3xl border">
                  <p className="text-[9px] font-black uppercase text-zinc-400 mb-2">Lucro Líquido</p>
                  <p className="text-2xl font-black italic">R$ {stats.saldo1.toFixed(2)}</p>
                </div>
                <div className="p-6 bg-blue-50 border-blue-100 rounded-3xl border">
                  <p className="text-[9px] font-black uppercase text-blue-400 mb-2">Disponível Real</p>
                  <p className="text-2xl font-black italic text-blue-800">R$ {stats.saldo2.toFixed(2)}</p>
                </div>
             </div>

             <div className="grid grid-cols-3 gap-2 text-center mb-10">
                <div className="p-3 border rounded-2xl">
                  <p className="text-[8px] font-black text-zinc-400 uppercase">Lazer</p>
                  <p className="text-xs font-bold text-orange-600">R$ {stats.lazer.toFixed(2)}</p>
                </div>
                <div className="p-3 border rounded-2xl">
                  <p className="text-[8px] font-black text-zinc-400 uppercase">Reserva</p>
                  <p className="text-xs font-bold text-blue-600">R$ {stats.emergencial.toFixed(2)}</p>
                </div>
                <div className="p-3 border rounded-2xl">
                  <p className="text-[8px] font-black text-zinc-400 uppercase">Aporte</p>
                  <p className="text-xs font-bold text-green-600">R$ {stats.invest.toFixed(2)}</p>
                </div>
             </div>

             <div className="p-8 bg-zinc-900 text-white rounded-[40px] border-l-[10px] border-red-700 italic text-sm leading-relaxed whitespace-pre-wrap">
                --- PARECER DO CORRETOR MONARCA ---
                VALOR RECOMENDADO PARA ATIVOS: R$ {stats.invest.toFixed(2)}

                Auditoria finalizada. Os valores acima refletem exclusivamente a movimentação financeira do período solicitado.
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Finance;
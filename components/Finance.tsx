import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { getMarketAnalysis } from '../services/geminiService';

interface FinanceProps {
  transactions: Transaction[];
  categories: string[];
  setTransactions: (t: Transaction[]) => void;
  setCategories: (c: string[]) => void;
}

const Finance: React.FC<FinanceProps> = ({ transactions, categories, setTransactions, setCategories }) => {
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
  
  const [filterRange, setFilterRange] = useState({ start: firstDayOfMonth, end: lastDayOfMonth });

  const [formData, setFormData] = useState({ 
    description: '', 
    amount: '', 
    type: 'despesa' as 'receita' | 'despesa', 
    category: '', 
    date: new Date().toISOString().split('T')[0] 
  });
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const stats = useMemo(() => {
    const filtered = transactions.filter(t => {
      return t.date >= filterRange.start && t.date <= filterRange.end;
    });

    const sorted = [...filtered].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const totalIncome = filtered
      .filter(t => t.type === 'receita')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const totalExpense = filtered
      .filter(t => t.type === 'despesa')
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpense;

    const multiplier = balance > 0 ? balance : 0;
    const lazer = multiplier * 0.15;
    const investimento = multiplier * 0.20;
    const reserva = multiplier * 0.15;

    const catIncome: Record<string, number> = {};
    const catExpense: Record<string, number> = {};
    filtered.forEach(t => {
      const target = t.type === 'receita' ? catIncome : catExpense;
      target[t.category] = (target[t.category] || 0) + t.amount;
    });

    return { balance, totalIncome, totalExpense, lazer, investimento, reserva, catIncome, catExpense, sorted };
  }, [transactions, filterRange]);

  const handleSaveTransaction = () => {
    if (!formData.description || !formData.amount || !formData.category || !formData.date) return;
    
    const amountNum = parseFloat(formData.amount);
    if (isNaN(amountNum)) return;

    if (editingId) {
      setTransactions(transactions.map(t => t.id === editingId ? { ...formData, amount: amountNum, id: editingId } : t));
      setEditingId(null);
    } else {
      setTransactions([...transactions, {
        ...formData,
        amount: amountNum,
        id: Date.now().toString()
      }]);
    }
    
    setFormData({ 
      description: '', 
      amount: '', 
      type: 'despesa', 
      category: '', 
      date: new Date().toISOString().split('T')[0] 
    });
  };

  const handleEdit = (t: Transaction) => {
    setFormData({
      description: t.description,
      amount: t.amount.toString(),
      type: t.type,
      category: t.category,
      date: t.date
    });
    setEditingId(t.id);
    setOpenDropdownId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: string) => {
    setTransactions(transactions.filter(t => t.id !== id));
    setOpenDropdownId(null);
  };

  const handleAddCategory = () => {
    if (newCatName && !categories.includes(newCatName)) {
      setCategories([...categories, newCatName]);
      setFormData({ ...formData, category: newCatName });
      setNewCatName('');
      setIsAddingCategory(false);
    }
  };

  const handleMarketAnalysis = async () => {
    // Correção: Agora chama o serviço diretamente sem depender do IA Studio
    setIsAnalyzing(true);
    try {
      const result = await getMarketAnalysis(stats.investimento);
      setAnalysis(result);
    } catch (e: any) {
      alert("Erro ao processar a análise estratégica. Verifique sua conexão.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleShareAnalysis = async () => {
    if (!analysis) return;
    const textToShare = `Estratégia de Investimento Monarca (R$ ${stats.investimento.toFixed(2)}):\n\n${analysis}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Agenda Monarca - Estratégia Financeira', text: textToShare });
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(textToShare);
      alert('Estratégia copiada para a área de transferência!');
    } catch (err) {
      alert('Não foi possível compartilhar automaticamente.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm transition-colors">
        <h4 className="text-[10px] uppercase font-black text-gray-400 dark:text-zinc-500 mb-3 tracking-widest text-center">Definir Período de Análise</h4>
        <div className="flex items-center gap-2">
          <input 
            type="date" 
            className="flex-1 p-2 text-xs rounded-xl bg-gray-50 dark:bg-zinc-800 border-none outline-none focus:ring-1 focus:ring-red-500 text-gray-900 dark:text-zinc-100"
            value={filterRange.start}
            onChange={(e) => setFilterRange({...filterRange, start: e.target.value})}
          />
          <span className="text-gray-300 dark:text-zinc-700">➜</span>
          <input 
            type="date" 
            className="flex-1 p-2 text-xs rounded-xl bg-gray-50 dark:bg-zinc-800 border-none outline-none focus:ring-1 focus:ring-red-500 text-gray-900 dark:text-zinc-100"
            value={filterRange.end}
            onChange={(e) => setFilterRange({...filterRange, end: e.target.value})}
          />
        </div>
      </div>

      <div className="bg-gradient-to-br from-red-700 to-red-900 dark:from-red-900 dark:to-black rounded-3xl p-6 text-white shadow-xl transition-all">
        <div className="flex justify-between items-start mb-2">
          <div>
            <div className="text-xs opacity-80 uppercase tracking-widest font-bold mb-1">Saldo do Período</div>
            <div className="text-3xl font-black">R$ {stats.balance.toFixed(2)}</div>
            <div className="text-[10px] opacity-60 mt-1 italic">(Total Entradas - Total Saídas)</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] opacity-80 uppercase font-bold">Total Receita</div>
            <div className="text-lg font-bold">R$ {stats.totalIncome.toFixed(2)}</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-6">
          <div className="bg-white/10 dark:bg-white/5 p-3 rounded-2xl backdrop-blur-sm border border-white/20">
            <div className="text-[9px] uppercase opacity-70 font-bold">Lazer (15%)</div>
            <div className="font-bold text-xs">R$ {stats.lazer.toFixed(2)}</div>
          </div>
          <div className="bg-white/10 dark:bg-white/5 p-3 rounded-2xl backdrop-blur-sm border border-white/20">
            <div className="text-[9px] uppercase opacity-70 font-bold">Reserva (15%)</div>
            <div className="font-bold text-xs">R$ {stats.reserva.toFixed(2)}</div>
          </div>
          <div className="bg-white/10 dark:bg-white/5 p-3 rounded-2xl backdrop-blur-sm border border-white/20">
            <div className="text-[9px] uppercase opacity-70 font-bold">Investir (20%)</div>
            <div className="font-bold text-xs">R$ {stats.investimento.toFixed(2)}</div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm space-y-4 transition-colors">
        <h3 className="font-bold text-gray-800 dark:text-zinc-100">{editingId ? 'Editar Lançamento' : 'Novo Lançamento'}</h3>
        <input
          type="text" placeholder="Descrição"
          className="w-full p-3 rounded-2xl bg-gray-50 dark:bg-zinc-800 border-none outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-zinc-100"
          value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            type="number" placeholder="Valor"
            className="p-3 rounded-2xl bg-gray-50 dark:bg-zinc-800 border-none outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-zinc-100"
            value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })}
          />
          <input
            type="date"
            className="p-3 rounded-2xl bg-gray-50 dark:bg-zinc-800 border-none outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-zinc-100 font-medium"
            value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })}
          />
        </div>
        <select
          className="w-full p-3 rounded-2xl bg-gray-50 dark:bg-zinc-800 border-none outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-zinc-100 font-medium"
          value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as any })}
        >
          <option value="despesa">Despesa (Saída)</option>
          <option value="receita">Receita (Entrada)</option>
        </select>
        
        {!isAddingCategory ? (
          <select
            className="w-full p-3 rounded-2xl bg-gray-50 dark:bg-zinc-800 border-none outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-zinc-100 font-medium"
            value={formData.category} onChange={e => e.target.value === 'NEW' ? setIsAddingCategory(true) : setFormData({ ...formData, category: e.target.value })}
          >
            <option value="" className="text-gray-400 dark:text-zinc-500">Selecione a Categoria</option>
            {categories.map(c => <option key={c} value={c} className="text-gray-900 dark:text-zinc-100">{c}</option>)}
            <option value="NEW" className="text-red-600 dark:text-red-400 font-bold">+ Nova Categoria</option>
          </select>
        ) : (
          <div className="flex gap-2">
            <input
              autoFocus placeholder="Nome da Categoria"
              className="flex-1 p-3 rounded-2xl bg-red-50 dark:bg-red-950/30 border-none outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-zinc-100"
              value={newCatName} onChange={e => setNewCatName(e.target.value)}
            />
            <button onClick={handleAddCategory} className="bg-red-700 dark:bg-red-800 text-white px-4 rounded-2xl font-bold">Adicionar</button>
            <button onClick={() => setIsAddingCategory(false)} className="bg-gray-200 dark:bg-zinc-700 text-gray-600 dark:text-zinc-300 px-4 rounded-2xl">X</button>
          </div>
        )}
        
        <div className="flex gap-2">
          {editingId && (
            <button 
              onClick={() => {
                setEditingId(null);
                setFormData({ description: '', amount: '', type: 'despesa', category: '', date: new Date().toISOString().split('T')[0] });
              }} 
              className="flex-1 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 py-4 rounded-2xl font-bold hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
            >
              Cancelar
            </button>
          )}
          <button 
            onClick={handleSaveTransaction} 
            className={`flex-[2] ${editingId ? 'bg-blue-600 shadow-blue-100' : 'bg-red-700 dark:bg-red-900 shadow-red-100'} text-white py-4 rounded-2xl font-bold shadow-lg hover:opacity-90 transition-all`}
          >
            {editingId ? 'Atualizar Lançamento' : 'Registrar Lançamento'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm transition-colors">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold text-green-700 dark:text-green-500">Receitas</h4>
            <span className="text-sm font-black text-green-700 dark:text-green-500">R$ {stats.totalIncome.toFixed(2)}</span>
          </div>
          <div className="space-y-2

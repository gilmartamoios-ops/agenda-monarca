import React, { useState, useMemo } from 'react';
import {
  Trash2,
  Edit3,
  Settings,
  ArrowUpCircle,
  ArrowDownCircle,
  Search,
  History
} from 'lucide-react';

const Finance = ({
  transactions,
  setTransactions,
  categories,
  setCategories
}: any) => {

  const [viewMode, setViewMode] =
    useState<'book' | 'calendar'>('book');

  const [currentPageDate, setCurrentPageDate] =
    useState(new Date().toISOString().split('T')[0]);

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'despesa' as 'receita' | 'despesa',
    category: 'Depósito em Conta',
    date: new Date().toISOString().split('T')[0]
  });

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [showCatManager, setShowCatManager] =
    useState(false);

  const [newCat, setNewCat] =
    useState('');

  const [dateStart, setDateStart] =
    useState(
      new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1
      ).toISOString().split('T')[0]
    );

  const [dateEnd, setDateEnd] =
    useState(new Date().toISOString().split('T')[0]);

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t: any) =>
        t.date >= dateStart &&
        t.date <= dateEnd
      )
      .sort((a: any, b: any) =>
        b.date.localeCompare(a.date)
      );
  }, [transactions, dateStart, dateEnd]);

  const currentDayTransactions =
    useMemo(() => {
      return transactions
        .filter(
          (t: any) =>
            t.date === currentPageDate
        )
        .sort((a: any, b: any) =>
          b.id.localeCompare(a.id)
        );
    }, [transactions, currentPageDate]);

  const currentDayBalance =
    useMemo(() => {
      return currentDayTransactions.reduce(
        (acc: number, t: any) =>
          t.type === 'receita'
            ? acc + t.amount
            : acc - t.amount,
        0
      );
    }, [currentDayTransactions]);

  const changeDay = (
    direction: 'next' | 'prev'
  ) => {

    const date = new Date(currentPageDate);

    if (direction === 'next') {
      date.setDate(date.getDate() + 1);
    } else {
      date.setDate(date.getDate() - 1);
    }

    setCurrentPageDate(
      date.toISOString().split('T')[0]
    );
  };

  const renderLinks = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    return text
      .split(urlRegex)
      .map((part, i) => {

        if (part.match(urlRegex)) {

          return (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline break-all font-bold"
            >
              {part}
            </a>
          );
        }

        return part;
      });
  };

  return (

    <div className="space-y-6 pb-24">

      {/* VISUALIZAÇÃO */}

      <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-2xl">

        <button
          onClick={() => setViewMode('book')}
          className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${
            viewMode === 'book'
              ? 'bg-zinc-900 text-white'
              : 'text-zinc-500'
          }`}
        >
          📖 LIVRO CAIXA
        </button>

        <button
          onClick={() => setViewMode('calendar')}
          className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${
            viewMode === 'calendar'
              ? 'bg-zinc-900 text-white'
              : 'text-zinc-500'
          }`}
        >
          📅 FOLHINHA
        </button>

      </div>

      {/* AUDITORIA */}

      <div className="bg-white dark:bg-zinc-900 p-4 rounded-[30px] border dark:border-zinc-800 shadow-sm space-y-3">

        <div className="flex items-center gap-2 text-[10px] font-black uppercase text-red-700 tracking-widest px-2">
          <Search size={14}/>
          Auditoria de Período
        </div>

        <div className="flex gap-2">

          <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 p-3 rounded-2xl flex flex-col">

            <span className="text-[8px] font-bold text-zinc-400 uppercase">
              Início
            </span>

            <input
              type="date"
              className="bg-transparent text-xs font-black outline-none dark:text-white"
              value={dateStart}
              onChange={(e) =>
                setDateStart(e.target.value)
              }
            />

          </div>

          <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 p-3 rounded-2xl flex flex-col">

            <span className="text-[8px] font-bold text-zinc-400 uppercase">
              Fim
            </span>

            <input
              type="date"
              className="bg-transparent text-xs font-black outline-none dark:text-white"
              value={dateEnd}
              onChange={(e) =>
                setDateEnd(e.target.value)
              }
            />

          </div>

        </div>

      </div>

      {/* FORMULÁRIO */}

      <div className="bg-white dark:bg-zinc-900 p-6 rounded-[35px] shadow-sm space-y-4 border dark:border-zinc-800">

        <div className="flex justify-between items-center">

          <h3 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">
            Novo Lançamento
          </h3>

          <button
            onClick={() =>
              setShowCatManager(!showCatManager)
            }
            className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-zinc-500"
          >
            <Settings size={18}/>
          </button>

        </div>

        {showCatManager && (

          <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-3xl border-2 border-dashed border-zinc-200">

            <div className="flex gap-2 mb-4">

              <input
                type="text"
                placeholder="Nova conta..."
                className="flex-1 p-3 rounded-xl text-xs font-bold text-zinc-900 dark:bg-zinc-900 dark:text-white outline-none"
                value={newCat}
                onChange={(e) =>
                  setNewCat(e.target.value)
                }
              />

              <button
                onClick={() => {

                  if(newCat){

                    setCategories([
                      ...categories,
                      newCat
                    ]);

                    setNewCat('');
                  }

                }}
                className="bg-zinc-900 text-white px-5 rounded-xl font-black"
              >
                +
              </button>

            </div>

          </div>

        )}

        <div className="flex bg-gray-100 dark:bg-zinc-800 rounded-2xl p-1">

          <button
            onClick={() =>
              setFormData({
                ...formData,
                type: 'receita'
              })
            }
            className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-2 ${
              formData.type === 'receita'
                ? 'bg-green-600 text-white'
                : 'text-zinc-400'
            }`}
          >
            <ArrowUpCircle size={14}/>
            ENTRADA
          </button>

          <button
            onClick={() =>
              setFormData({
                ...formData,
                type: 'despesa'
              })
            }
            className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-2 ${
              formData.type === 'despesa'
                ? 'bg-red-700 text-white'
                : 'text-zinc-400'
            }`}
          >
            <ArrowDownCircle size={14}/>
            SAÍDA
          </button>

        </div>

        <input
          type="date"
          className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800 border-none text-sm font-bold text-zinc-500"
          value={formData.date}
          onChange={(e) =>
            setFormData({
              ...formData,
              date: e.target.value
            })
          }
        />

        <input
          type="text"
          placeholder="Descrição da Operação"
          className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800 border-none text-sm font-bold text-zinc-900 dark:text-white outline-none"
          value={formData.description}
          onChange={(e) =>
            setFormData({
              ...formData,
              description: e.target.value
            })
          }
        />

        <div className="flex gap-2">

          <input
            type="number"
            placeholder="R$ 0,00"
            className="flex-1 p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800 border-none text-sm font-black text-zinc-900 dark:text-white outline-none"
            value={formData.amount}
            onChange={(e) =>
              setFormData({
                ...formData,
                amount: e.target.value
              })
            }
          />

          <select
            className="flex-1 p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800 text-xs font-bold text-zinc-500 border-none outline-none"
            value={formData.category}
            onChange={(e) =>
              setFormData({
                ...formData,
                category: e.target.value
              })
            }
          >

            <option value="Depósito em Conta">
              Depósito em Conta
            </option>

            {categories.map((c: string) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}

          </select>

        </div>

        <button
          onClick={() => {

            const val =
              parseFloat(formData.amount);

            if (
              !formData.description ||
              isNaN(val)
            ) return;

            if (editingId) {

              setTransactions(
                transactions.map((t: any) =>
                  t.id === editingId
                    ? {
                        ...formData,
                        amount: val,
                        id: editingId
                      }
                    : t
                )
              );

              setEditingId(null);

            } else {

              setTransactions([
                {
                  ...formData,
                  amount: val,
                  id: Date.now().toString()
                },
                ...transactions
              ]);

            }

            setFormData({
              description: '',
              amount: '',
              type: 'despesa',
              category: 'Depósito em Conta',
              date:
                new Date()
                  .toISOString()
                  .split('T')[0]
            });

          }}
          className="w-full bg-zinc-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em]"
        >

          {editingId
            ? 'ATUALIZAR REGISTRO'
            : 'CONFIRMAR OPERAÇÃO'}

        </button>

      </div>

      {/* LIVRO */}

      {viewMode === 'book' ? (

        <div className="bg-[#f8f1df] dark:bg-zinc-900 rounded-[40px] p-6 border shadow-xl">

          <div className="flex justify-between items-center mb-6">

            <button
              onClick={() =>
                changeDay('prev')
              }
              className="bg-zinc-900 text-white w-12 h-12 rounded-2xl"
            >
              ←
            </button>

            <div className="text-center">

              <p className="text-[10px] uppercase text-zinc-500 font-black">
                Livro Caixa
              </p>

              <h2 className="text-xl font-black italic">
                {currentPageDate
                  .split('-')
                  .reverse()
                  .join('/')}
              </h2>

            </div>

            <button
              onClick={() =>
                changeDay('next')
              }
              className="bg-zinc-900 text-white w-12 h-12 rounded-2xl"
            >
              →
            </button>

          </div>

          <div className="space-y-4">

            {currentDayTransactions.length > 0 ? (

              currentDayTransactions.map((t: any) => (

                <div
                  key={t.id}
                  className="bg-white dark:bg-zinc-800 p-4 rounded-3xl border flex justify-between items-center"
                >

                  <div>

                    <p className="font-bold dark:text-white">
                      {renderLinks(t.description)}
                    </p>

                    <p className="text-[10px] uppercase text-zinc-400 font-black">
                      {t.category}
                    </p>

                  </div>

                  <div className="text-right">

                    <p className={`font-black text-lg ${
                      t.type === 'receita'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>

                      {t.type === 'receita'
                        ? '+'
                        : '-'}

                      R$ {t.amount.toFixed(2)}

                    </p>

                    <div className="flex gap-2 justify-end mt-2">

                      <button
                        onClick={() => {

                          setFormData({
                            ...t,
                            amount:
                              t.amount.toString()
                          });

                          setEditingId(t.id);

                          window.scrollTo({
                            top: 0,
                            behavior: 'smooth'
                          });

                        }}
                        className="text-blue-500"
                      >
                        ✏️
                      </button>

                      <button
                        onClick={() => {

                          if(
                            window.confirm(
                              'Excluir lançamento?'
                            )
                          ){

                            setTransactions(
                              transactions.filter(
                                (x: any) =>
                                  x.id !== t.id
                              )
                            );

                          }

                        }}
                        className="text-red-500"
                      >
                        🗑️
                      </button>

                    </div>

                  </div>

                </div>

              ))

            ) : (

              <div className="text-center py-20 text-zinc-400 italic">
                Nenhum lançamento neste dia
              </div>

            )}

          </div>

          <div className="mt-8 bg-zinc-900 text-white p-6 rounded-3xl">

            <p className="text-[10px] uppercase opacity-50 font-black">
              Saldo do Dia
            </p>

            <h2 className={`text-4xl font-black italic ${
              currentDayBalance >= 0
                ? 'text-green-400'
                : 'text-red-400'
            }`}>

              R$ {currentDayBalance.toFixed(2)}

            </h2>

          </div>

        </div>

      ) : (

        <div className="bg-white dark:bg-zinc-900 rounded-[35px] overflow-hidden shadow-sm border dark:border-zinc-800">

          <div className="p-5 border-b dark:border-zinc-800 text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
            <History size={14}/>
            Histórico de Auditoria
          </div>

          <div className="divide-y dark:divide-zinc-800">

            {filteredTransactions.map((t: any) => (

              <div
                key={t.id}
                className="p-5 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
              >

                <div className="flex items-center gap-4">

                  <div className="flex flex-col gap-2">

                    <button
                      onClick={() => {

                        setFormData({
                          ...t,
                          amount:
                            t.amount.toString()
                        });

                        setEditingId(t.id);

                        window.scrollTo({
                          top: 0,
                          behavior: 'smooth'
                        });

                      }}
                      className="p-2 bg-blue-50 text-blue-600 rounded-lg"
                    >
                      <Edit3 size={14}/>
                    </button>

                    <button
                      onClick={() => {

                        if(
                          window.confirm(
                            'Excluir lançamento?'
                          )
                        ){

                          setTransactions(
                            transactions.filter(
                              (x: any) =>
                                x.id !== t.id
                            )
                          );

                        }

                      }}
                      className="p-2 bg-red-50 text-red-500 rounded-lg"
                    >
                      <Trash2 size={14}/>
                    </button>

                  </div>

                  <div>

                    <div className="text-sm font-bold dark:text-zinc-100">
                      {renderLinks(t.description)}
                    </div>

                    <div className="text-[9px] text-gray-400 font-black uppercase tracking-widest">
                      {t.date} | {t.category}
                    </div>

                  </div>

                </div>

                <div className={`text-sm font-black ${
                  t.type === 'receita'
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}>

                  {t.type === 'receita'
                    ? '+'
                    : '-'}

                  R$ {t.amount.toFixed(2)}

                </div>

              </div>

            ))}

          </div>

        </div>

      )}

    </div>

  );

};

export default Finance;

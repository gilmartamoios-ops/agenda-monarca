
import React, { useRef, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Radar from './Radar';

const INVEST_AI_URL =
  'https://niuviqzodlihbuqtlsvr.supabase.co/functions/v1/invest-ai';

const INVEST_SIMULATOR_URL =
  'https://niuviqzodlihbuqtlsvr.supabase.co/functions/v1/swift-responder';

const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY || '';

interface EvolutionPoint {
  month: number;
  contributed: number;
  value: number;
  gain: number;
}

interface Scenario {
  name: string;
  description: string;
  annualReturn: number;
  monthlyReturn: number;
  finalValue: number;
  totalContributed: number;
  projectedGain: number;
  evolution: EvolutionPoint[];
}

interface SimulatorResult {
  updatedAt: string;
  educationalNotice: string;
  inputs: {
    amount: number;
    monthlyContribution: number;
    profile: string;
    term: number;
    goal: string;
  };
  summary: {
    totalInitialAmount: number;
    monthlyContribution: number;
    totalContributed: number;
    termMonths: number;
  };
  scenarios: Scenario[];
  methodology: {
    description: string;
    important: string;
  };
  nextStep: string;
}

const Investments = () => {
  const analysisRef = useRef<HTMLDivElement>(null);
    const [showRadar, setShowRadar] = useState(false);

  const [amount, setAmount] = useState('');
  const [monthlyContribution, setMonthlyContribution] =
    useState('500');

  const [profile, setProfile] = useState('moderado');
  const [term, setTerm] = useState('24');
  const [goal, setGoal] = useState('crescimento');

  const [loading, setLoading] = useState(false);
  const [simulationLoading, setSimulationLoading] =
    useState(false);

  const [analysis, setAnalysis] = useState('');
  const [simulation, setSimulation] =
    useState<SimulatorResult | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatPercent = (value: number) => {
  return (value * 100).toFixed(2) + '%';
};
  const handleSimulation = async () => {
    if (!amount) {
      return;
    }

    try {
      setSimulationLoading(true);

      const response = await fetch(
  INVEST_SIMULATOR_URL,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization:
        'Bearer ' + SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      amount,
      monthlyContribution,
      profile,
      term,
      goal,
    }),
  }
);

      const data = await response.json();

      console.log(
        'Simulador status:',
        response.status
      );

      console.log(
        'Simulador resposta:',
        data
      );

      if (!response.ok) {
        throw new Error(
          data?.error ||
          data?.message ||
          'Erro ao consultar o simulador.'
        );
      }

      setSimulation(data);
    } catch (error) {
      console.error(
        'Erro no simulador:',
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : 'Erro na simulação.'
      );
    } finally {
      setSimulationLoading(false);
    }
  };

    const handleAnalysis = async () => {
    if (!amount) {
      alert('Digite um valor.');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(INVEST_AI_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: 'Bearer ' + SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          amount,
          monthlyContribution,
          profile,
          term,
          goal,
        }),
      });

      const data = await response.json();

      console.log('Status IA:', response.status);
      console.log('Resposta IA:', data);

      if (!response.ok) {
        throw new Error(
          data?.error ||
          data?.message ||
          'Erro ao consultar a análise.'
        );
      }

      setAnalysis(
        data?.analysis ||
        data?.result ||
        'Sem resposta da IA.'
      );


    } catch (error) {
      console.error('Erro:', error);

      alert(
        error instanceof Error
          ? error.message
          : 'Erro na análise.'
      );
    } finally {
      setLoading(false);
    }
  };

  const copyAnalysis = async () => {
    if (!analysis) return;

    try {
      await navigator.clipboard.writeText(
        analysis
      );

      alert('Análise copiada!');
    } catch (error) {
      console.error(error);

      alert(
        'Não foi possível copiar a análise.'
      );
    }
  };

  const downloadPDF = async () => {
    if (!analysisRef.current) return;

    const canvas = await html2canvas(
      analysisRef.current,
      {
        scale: 2,
        backgroundColor: '#ffffff',
      }
    );

    const imgData =
      canvas.toDataURL('image/png');

    const pdf =
      new jsPDF('p', 'mm', 'a4');

    const pdfWidth = 210;
    const pdfHeight = 297;
    const margin = 10;

    const usableWidth =
      pdfWidth - margin * 2;

    const imgWidth = usableWidth;

    const imgHeight =
      (canvas.height * imgWidth) /
      canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(
      imgData,
      'PNG',
      margin,
      margin,
      imgWidth,
      imgHeight
    );

    heightLeft -=
      pdfHeight - margin * 2;

    while (heightLeft > 0) {
      position =
        heightLeft -
        imgHeight +
        margin;

      pdf.addPage();

      pdf.addImage(
        imgData,
        'PNG',
        margin,
        position,
        imgWidth,
        imgHeight
      );

      heightLeft -=
        pdfHeight - margin * 2;
    }

    pdf.save(
      'agenda-monarca-investimentos.pdf'
    );
  };

  const printAnalysis = () => {
    window.print();
  };

  const clearAnalysis = () => {
    setAnalysis('');
    setSimulation(null);
  };

  const scenarioCardClass = (
    scenarioName: string
  ) => {
    if (scenarioName === 'Desfavorável') {
      return 'border-red-200 dark:border-red-900';
    }

    if (scenarioName === 'Favorável') {
      return 'border-emerald-200 dark:border-emerald-900';
    }

    return 'border-yellow-200 dark:border-yellow-900';
  };

  return (
    <div className="space-y-6 pb-24">

      {showRadar && (
  <div className="fixed inset-0 z-[9999] bg-black/80 overflow-y-auto">

    <div className="min-h-screen bg-white dark:bg-zinc-950">

      <div className="sticky top-0 z-[10000] bg-zinc-900 text-white p-4 flex items-center justify-between shadow-xl">

        <h2 className="font-black text-lg">
          📡 Radar de Mercado
        </h2>

        <button
          type="button"
          onClick={() => setShowRadar(false)}
          className="bg-red-600 text-white px-5 py-3 rounded-xl text-xs font-black"
        >
          FECHAR
        </button>

      </div>

      <div className="max-w-lg mx-auto p-4">
        <Radar />
      </div>

    </div>

  </div>
)}

      <div className="bg-zinc-900 rounded-[40px] p-8 border-b-8 border-yellow-600 shadow-2xl">

        <div className="mb-8">

          <h1 className="text-3xl font-black text-white italic">
            Investimentos IA
          </h1>

          <p className="text-zinc-400 text-sm mt-2">
            Copiloto patrimonial macroeconômico
          </p>

        </div>

        <button
 onClick={() => setShowRadar(true)}
  className="w-full mb-6 bg-yellow-600 text-zinc-900 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-2"
>
  📡 Radar de Mercado
</button>
        <div className="space-y-4">

          <div>
            <label className="text-xs uppercase font-black text-zinc-500">
              Valor que deseja investir
            </label>

            <input
              type="number"
              placeholder="R$ 0,00"
              value={amount}
              onChange={(e) =>
                setAmount(e.target.value)
              }
              className="w-full mt-2 p-4 rounded-2xl bg-zinc-800 text-white outline-none font-bold"
            />
          </div>

          <div>
            <label className="text-xs uppercase font-black text-zinc-500">
              Aporte mensal
            </label>

            <input
              type="number"
              placeholder="R$ 0,00"
              value={monthlyContribution}
              onChange={(e) =>
                setMonthlyContribution(
                  e.target.value
                )
              }
              className="w-full mt-2 p-4 rounded-2xl bg-zinc-800 text-white outline-none font-bold"
            />
          </div>

          <div>
            <label className="text-xs uppercase font-black text-zinc-500">
              Perfil de risco
            </label>

            <select
              value={profile}
              onChange={(e) =>
                setProfile(e.target.value)
              }
              className="w-full mt-2 p-4 rounded-2xl bg-zinc-800 text-white outline-none font-bold"
            >
              <option value="conservador">
                Conservador
              </option>

              <option value="moderado">
                Moderado
              </option>

              <option value="arrojado">
                Arrojado
              </option>
            </select>
          </div>

          <div>
            <label className="text-xs uppercase font-black text-zinc-500">
              Prazo
            </label>

            <select
              value={term}
              onChange={(e) =>
                setTerm(e.target.value)
              }
              className="w-full mt-2 p-4 rounded-2xl bg-zinc-800 text-white outline-none font-bold"
            >
              <option value="6">
                6 meses
              </option>

              <option value="12">
                12 meses
              </option>

              <option value="24">
                24 meses
              </option>

              <option value="60">
                5 anos
              </option>
            </select>
          </div>

          <div>
            <label className="text-xs uppercase font-black text-zinc-500">
              Objetivo
            </label>

            <select
              value={goal}
              onChange={(e) =>
                setGoal(e.target.value)
              }
              className="w-full mt-2 p-4 rounded-2xl bg-zinc-800 text-white outline-none font-bold"
            >
              <option value="crescimento">
                Crescimento
              </option>

              <option value="protecao">
                Proteção patrimonial
              </option>

              <option value="renda">
                Geração de renda
              </option>
            </select>
          </div>

          <button
            onClick={handleSimulation}
            disabled={
              loading ||
              simulationLoading
            }
            className="w-full bg-yellow-600 text-zinc-900 py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl disabled:opacity-50"
          >
            {simulationLoading
  ? 'Calculando Cenários...'
  : 'Simular Futuro'}
          </button>

        </div>
      </div>

      {simulation && (
        <div className="space-y-6">

          <div className="bg-white dark:bg-zinc-900 rounded-[35px] p-8 border dark:border-zinc-800 shadow-xl">

            <div className="mb-6">

              <h2 className="text-2xl font-black dark:text-white">
                Simulador Patrimonial
              </h2>

              <p className="text-sm text-zinc-500 mt-2">
                Visualização educacional da possível
                trajetória do patrimônio.
              </p>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              {simulation.scenarios.map(
                (scenario) => (

                  <div
                    key={scenario.name}
                    className={
  'border rounded-3xl p-5 ' +
  scenarioCardClass(scenario.name)
}
                  >

                    <p className="text-xs uppercase font-black text-zinc-500">
                      {scenario.name}
                    </p>

                    <p className="text-2xl font-black mt-2 dark:text-white">
                      {formatCurrency(
                        scenario.finalValue
                      )}
                    </p>

                    <p className="text-xs text-zinc-500 mt-1">
                      patrimônio ao final
                    </p>

                    <div className="mt-4 space-y-2 text-sm">

                      <div className="flex justify-between items-start gap-2 min-w-0">
                        <span className="text-zinc-500">
                          Retorno hipotético
                        </span>

                        <strong className="dark:text-white shrink-0 text-right">
                          {formatPercent(
                            scenario.annualReturn
                          )}
                        </strong>
                      </div>

                      <div className="flex justify-between gap-3">
                        <span className="text-zinc-500">
                          Total aportado
                        </span>

                        <strong className="dark:text-white shrink-0 text-right">
                          {formatCurrency(
                            scenario.totalContributed
                          )}
                        </strong>
                      </div>

                      <div className="flex justify-between gap-3">
                        <span className="text-zinc-500">
                          Ganho/perda
                        </span>

                        <strong
                          className={
                            scenario.projectedGain >= 0
                              ? 'text-emerald-600'
                              : 'text-red-600'
                          }
                        >
                          {formatCurrency(
                            scenario.projectedGain
                          )}
                        </strong>
                      </div>

                    </div>

                  </div>

                )
              )}

            </div>

          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-[35px] p-8 border dark:border-zinc-800 shadow-xl">

            <h2 className="text-2xl font-black dark:text-white mb-6">
              Trajetória patrimonial
            </h2>

            <div className="overflow-x-auto">

              <div
                className="min-w-[900px] grid grid-cols-12 gap-2 items-end"
                style={{
                  height: '360px',
                }}
              >

                {simulation.scenarios[1]?.evolution
                  .filter(
                    (_, index) =>
                      index === 0 ||
                      index %
                        Math.max(
                          1,
                          Math.ceil(
                            simulation.inputs.term /
                              12
                          )
                        ) ===
                        0 ||
                      index ===
                        simulation.inputs.term
                  )
                  .map((point) => {

                    const base =
                      simulation.scenarios[1];

                    const maxValue =
                      Math.max(
                        ...simulation.scenarios.flatMap(
                          (scenario) =>
                            scenario.evolution.map(
                              (item) =>
                                item.value
                            )
                        )
                      );

                    const height =
                      maxValue > 0
                        ? (point.value /
                            maxValue) *
                          100
                        : 0;

                    return (
                      <div
                        key={point.month}
                        className="flex flex-col items-center justify-end h-full"
                      >

                        <div className="text-[10px] font-bold text-zinc-500 mb-2">
                          {formatCurrency(
                            point.value
                          )}
                        </div>

                        <div
                          className="w-10 bg-yellow-500 rounded-t-xl transition-all"
                          style={{
                         height: height + '%',
                            minHeight:
                              point.value > 0
                                ? '8px'
                                : '0px',
                          }}
                        />

                        <div className="text-[10px] text-zinc-500 mt-2">
                          {point.month}m
                        </div>

                      </div>
                    );
                  })}

              </div>

            </div>

            <p className="text-xs text-zinc-500 mt-6">
              A visualização acima utiliza o cenário-base
              como referência. Os três cenários completos
              permanecem disponíveis nos cálculos do
              simulador.
            </p>

          </div>

          <div className="bg-yellow-50 dark:bg-yellow-950/20 rounded-[30px] p-6 border border-yellow-200 dark:border-yellow-900">

            <p className="text-sm font-bold text-zinc-700 dark:text-yellow-100">
              {simulation.educationalNotice}
            </p>

            <p className="text-xs text-zinc-500 dark:text-yellow-200/70 mt-3">
              {simulation.methodology.important}
            </p>

          </div>

        </div>
      )}

      {analysis && (
        <div
          ref={analysisRef}
          className="bg-white dark:bg-zinc-900 rounded-[35px] p-8 border dark:border-zinc-800 shadow-xl"
        >

          <div className="flex flex-wrap gap-3 mb-6">

            <button
              onClick={copyAnalysis}
              className="bg-zinc-900 text-white px-4 py-2 rounded-xl text-sm font-bold"
            >
              Copiar
            </button>

            <button
              onClick={downloadPDF}
              className="bg-yellow-600 text-zinc-900 px-4 py-2 rounded-xl text-sm font-bold"
            >
              Baixar PDF
            </button>

            <button
              onClick={printAnalysis}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold"
            >
              Imprimir
            </button>

            <button
              onClick={clearAnalysis}
              className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-bold"
            >
              Nova Análise
            </button>

          </div>

          <h2 className="text-2xl font-black mb-6 dark:text-white">
            Análise da IA
          </h2>

          <div className="whitespace-pre-wrap text-sm leading-relaxed dark:text-zinc-300">
            {analysis}
          </div>

        </div>
      )}

    </div>
  );
};

export default Investments;
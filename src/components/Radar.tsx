import React, { useEffect, useMemo, useState } from 'react';
import {
  RefreshCw,
  Printer,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Minus,
  Newspaper,
  BarChart3,
  ShieldCheck,
  Clock
} from 'lucide-react';

const SUPABASE_URL =
  'https://niuviqzodlihbuqtlsvr.supabase.co/functions/v1/radar';

const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY || '';

interface RadarIndicator {
  name: string;
  value: string | number;
  unit?: string;
  variation?: number | null;
  period?: string;
  source?: string;
  symbol?: string;
}

interface RadarPoint {
  label: string;
  value: number;
}

interface RadarSeries {
  name: string;
  unit?: string;
  points: RadarPoint[];
  startDate?: string | null;
  endDate?: string | null;
  pointCount?: number;
}

interface RadarNews {
  title: string;
  summary?: string;
  source: string;
  date?: string;
  url?: string;
}

interface RadarData {
  updatedAt?: string;
  headline?: string;
  context?: string;

  indicators?: {
    juros?: RadarIndicator[];
    inflacao?: RadarIndicator[];
    cambio?: RadarIndicator[];
    atividade?: RadarIndicator[];
    mercados?: RadarIndicator[];
  };

  charts?: RadarSeries[];

  marketWatch?: {
    principais?: {
      iene?: RadarSeries;
      dolar?: RadarSeries;
      ouro?: RadarSeries;
      bitcoin?: RadarSeries;
    };
    adicionais?: {
      prata?: RadarSeries;
      ibovespa?: RadarSeries;
    };
  };

  bolsa?: {
    indice?: RadarIndicator | null;
    historico?: RadarSeries;
  };

  news?: RadarNews[];

  sources?: {
    name: string;
    url: string;
  }[];
}

const emptyRadar: RadarData = {
  updatedAt: '',
  headline: '',
  context: '',
  indicators: {
    juros: [],
    inflacao: [],
    cambio: [],
    atividade: [],
    mercados: []
  },
  charts: [],
  marketWatch: {
    principais: {},
    adicionais: {}
  },
  bolsa: {
    indice: null
  },
  news: [],
  sources: []
};

const formatDate = (date?: string) => {
  if (!date) return '';

  try {
    return new Date(date).toLocaleString('pt-BR');
  } catch {
    return date;
  }
};

const formatChartDate = (date?: string) => {
  if (!date) return '';

  if (date.includes('/')) {
    return date;
  }

  try {
    return new Date(`${date}T12:00:00`)
      .toLocaleDateString('pt-BR');
  } catch {
    return date;
  }
};

const formatNumber = (value: number) => {
  if (!Number.isFinite(value)) return '';

  if (Math.abs(value) >= 1000) {
    return value.toLocaleString('pt-BR', {
      maximumFractionDigits: 2
    });
  }

  if (Math.abs(value) >= 100) {
    return value.toLocaleString('pt-BR', {
      maximumFractionDigits: 2
    });
  }

  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4
  });
};

const VariationIcon = ({
  value
}: {
  value?: number | null;
}) => {
  if (value === undefined || value === null) {
    return (
      <Minus
        size={14}
        className="text-zinc-400"
      />
    );
  }

  if (value > 0) {
    return (
      <TrendingUp
        size={14}
        className="text-green-600"
      />
    );
  }

  if (value < 0) {
    return (
      <TrendingDown
        size={14}
        className="text-red-600"
      />
    );
  }

  return (
    <Minus
      size={14}
      className="text-zinc-400"
    />
  );
};

const IndicatorCard = ({
  indicator
}: {
  indicator: RadarIndicator;
}) => {
  return (
    <div className="bg-zinc-50 dark:bg-zinc-800 rounded-2xl p-4 border dark:border-zinc-700">

      <div className="flex justify-between items-start gap-3">

        <div>

          <p className="text-[9px] uppercase tracking-widest font-black text-zinc-400">
            {indicator.name}
          </p>

          <p className="text-xl font-black mt-1 dark:text-white">
            {typeof indicator.value === 'number'
              ? formatNumber(indicator.value)
              : indicator.value}

            {indicator.unit && (
              <span className="text-xs ml-1 text-zinc-400">
                {indicator.unit}
              </span>
            )}
          </p>

        </div>

        <VariationIcon
          value={indicator.variation}
        />

      </div>

      <div className="mt-2 flex justify-between gap-2">

        <span className="text-[9px] text-zinc-400">
          {indicator.period || 'Período não informado'}
        </span>

        {indicator.source && (
          <span className="text-[9px] font-bold text-zinc-500 text-right">
            {indicator.source}
          </span>
        )}

      </div>

    </div>
  );
};

const MiniChart = ({
  series
}: {
  series: RadarSeries;
}) => {

  const points = (series.points || [])
    .filter(
      point =>
        Number.isFinite(point.value)
    );

  const values = points.map(
    point => point.value
  );

  const min =
    values.length > 0
      ? Math.min(...values)
      : 0;

  const max =
    values.length > 0
      ? Math.max(...values)
      : 1;

  const first =
    points.length > 0
      ? points[0]
      : undefined;

  const last =
    points.length > 0
      ? points[points.length - 1]
      : undefined;

  const range =
    max - min === 0
      ? 1
      : max - min;

  const width = 760;
  const height = 270;
  const paddingLeft = 55;
  const paddingRight = 25;
  const paddingTop = 30;
  const paddingBottom = 55;

  const coordinates = points.map(
    (point, index) => {

      const x =
        points.length <= 1
          ? width / 2
          : paddingLeft +
            (
              index /
              (points.length - 1)
            ) *
              (
                width -
                paddingLeft -
                paddingRight
              );

      const y =
        height -
        paddingBottom -
        (
          (point.value - min) /
          range
        ) *
          (
            height -
            paddingTop -
            paddingBottom
          );

      return {
        x,
        y,
        label: point.label,
        value: point.value
      };
    }
  );

  const path =
    coordinates.length > 0
      ? coordinates
          .map(
            (point, index) =>
              `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
          )
          .join(' ')
      : '';

  /*
   * Escolhe alguns pontos para mostrar seus valores
   * sem colocar dezenas de números sobrepostos.
   */
  const labelIndexes = (() => {

    if (points.length <= 6) {
      return points.map(
        (_, index) => index
      );
    }

    const indexes = [
      0,
      Math.floor(points.length * 0.25),
      Math.floor(points.length * 0.5),
      Math.floor(points.length * 0.75),
      points.length - 1
    ];

    return [...new Set(indexes)];

  })();

  return (
    <div className="bg-zinc-50 dark:bg-zinc-800 rounded-3xl p-5 border dark:border-zinc-700">

      <div className="flex items-center justify-between mb-4">

        <div>

          <p className="text-[10px] uppercase tracking-widest font-black text-zinc-400">
            {series.name}
          </p>

          {series.unit && (
            <p className="text-[9px] text-zinc-400 mt-1">
              Unidade: {series.unit}
            </p>
          )}

        </div>

        <BarChart3
          size={18}
          className="text-yellow-600"
        />

      </div>

      {coordinates.length > 1 ? (

        <div className="overflow-hidden">

          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto"
          >

            {/* LINHAS DE REFERÊNCIA */}

            <line
              x1={paddingLeft}
              y1={paddingTop}
              x2={width - paddingRight}
              y2={paddingTop}
              stroke="currentColor"
              opacity="0.08"
            />

            <line
              x1={paddingLeft}
              y1={height / 2}
              x2={width - paddingRight}
              y2={height / 2}
              stroke="currentColor"
              opacity="0.08"
            />

            <line
              x1={paddingLeft}
              y1={height - paddingBottom}
              x2={width - paddingRight}
              y2={height - paddingBottom}
              stroke="currentColor"
              opacity="0.08"
            />

            {/* ESCALA VERTICAL */}

            <text
              x="5"
              y={paddingTop + 4}
              fontSize="10"
              fill="currentColor"
              opacity="0.55"
            >
              {formatNumber(max)}
            </text>

            <text
              x="5"
              y={height / 2 + 4}
              fontSize="10"
              fill="currentColor"
              opacity="0.55"
            >
              {formatNumber(
                min + range / 2
              )}
            </text>

            <text
              x="5"
              y={height - paddingBottom + 4}
              fontSize="10"
              fill="currentColor"
              opacity="0.55"
            >
              {formatNumber(min)}
            </text>

            {/* LINHAS DOS EIXOS */}

            <line
              x1={paddingLeft}
              y1={height - paddingBottom}
              x2={width - paddingRight}
              y2={height - paddingBottom}
              stroke="currentColor"
              opacity="0.15"
            />

            <line
              x1={paddingLeft}
              y1={paddingTop}
              x2={paddingLeft}
              y2={height - paddingBottom}
              stroke="currentColor"
              opacity="0.15"
            />

            {/* LINHA PRINCIPAL */}

            <path
              d={path}
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-yellow-600"
            />

            {/* PONTOS */}

            {coordinates.map(
              (point, index) => (

                <circle
                  key={index}
                  cx={point.x}
                  cy={point.y}
                  r={
                    labelIndexes.includes(index)
                      ? 5
                      : 2.5
                  }
                  className="fill-yellow-600"
                />

              )
            )}

            {/* VALORES SOBRE O GRÁFICO */}

            {labelIndexes.map(index => {

              const point =
                coordinates[index];

              if (!point) return null;

              return (
                <text
                  key={`value-${index}`}
                  x={point.x}
                  y={
                    Math.max(
                      16,
                      point.y - 10
                    )
                  }
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="700"
                  fill="currentColor"
                  opacity="0.85"
                >
                  {formatNumber(
                    point.value
                  )}
                </text>
              );

            })}

          </svg>

          {/* DATAS */}

          <div className="flex justify-between text-[8px] text-zinc-400 mt-1">

            <span>
              {formatChartDate(
                first?.label
              )}
            </span>

            <span>
              {formatChartDate(
                last?.label
              )}
            </span>

          </div>

          {/* RESUMO NUMÉRICO */}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">

            <div className="bg-white dark:bg-zinc-900 rounded-xl p-2">

              <p className="text-[8px] uppercase font-black text-zinc-400">
                Inicial
              </p>

              <p className="text-xs font-black dark:text-white mt-1">
                {first
                  ? formatNumber(first.value)
                  : '—'}
              </p>

              <p className="text-[8px] text-zinc-400 mt-1">
                {formatChartDate(
                  first?.label
                )}
              </p>

            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-xl p-2">

              <p className="text-[8px] uppercase font-black text-zinc-400">
                Final
              </p>

              <p className="text-xs font-black dark:text-white mt-1">
                {last
                  ? formatNumber(last.value)
                  : '—'}
              </p>

              <p className="text-[8px] text-zinc-400 mt-1">
                {formatChartDate(
                  last?.label
                )}
              </p>

            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-xl p-2">

              <p className="text-[8px] uppercase font-black text-zinc-400">
                Mínimo
              </p>

              <p className="text-xs font-black dark:text-white mt-1">
                {formatNumber(min)}
              </p>

            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-xl p-2">

              <p className="text-[8px] uppercase font-black text-zinc-400">
                Máximo
              </p>

              <p className="text-xs font-black dark:text-white mt-1">
                {formatNumber(max)}
              </p>

            </div>

          </div>

          <div className="text-[8px] text-zinc-400 mt-3 text-right">
            {points.length} observações no período
          </div>

        </div>

      ) : (

        <div className="py-12 text-center text-xs text-zinc-400 italic">
          Série histórica ainda não disponível.
        </div>

      )}

    </div>
  );
};

const Radar: React.FC = () => {

  const [radar, setRadar] =
    useState<RadarData>(emptyRadar);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  const [period, setPeriod] =
    useState('90');

  const loadRadar = async () => {

    try {

      setLoading(true);
      setError('');

      const response =
        await fetch(
          SUPABASE_URL,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',

              apikey:
                SUPABASE_ANON_KEY,

              Authorization:
                `Bearer ${SUPABASE_ANON_KEY}`
            },

            body: JSON.stringify({
              period
            })
          }
        );

      const data =
        await response.json();

      if (!response.ok) {

        throw new Error(
          data?.error ||
          data?.message ||
          'Não foi possível atualizar o Radar.'
        );

      }

      setRadar({
        ...emptyRadar,
        ...data
      });

    } catch (err) {

      console.error(
        'Erro no Radar:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Erro ao atualizar o Radar.'
      );

    } finally {

      setLoading(false);

    }

  };

  useEffect(() => {

    loadRadar();

  }, []);

  const allIndicators =
    useMemo(
      () => ({
        juros:
          radar.indicators?.juros || [],

        inflacao:
          radar.indicators?.inflacao || [],

        cambio:
          radar.indicators?.cambio || [],

        atividade:
          radar.indicators?.atividade || [],

        mercados:
          radar.indicators?.mercados || []
      }),
      [radar]
    );

  /*
   * =====================================================
   * MERCADOS PRINCIPAIS
   *
   * A Edge Function já envia esses dados em
   * marketWatch.principais.
   *
   * Agora o componente realmente os utiliza.
   * =====================================================
   */

  const mainMarkets =
    useMemo(
      () => {

        const principais =
          radar.marketWatch?.principais;

        if (!principais) {
          return [];
        }

        return [
          principais.iene,
          principais.dolar,
          principais.ouro,
          principais.bitcoin
        ].filter(
          (
            series
          ): series is RadarSeries =>
            Boolean(
              series &&
              series.points &&
              series.points.length > 0
            )
        );

      },
      [radar]
    );

  /*
   * =====================================================
   * GRÁFICOS ADICIONAIS
   * =====================================================
   */

  const additionalMarkets =
    useMemo(
      () => {

        const adicionais =
          radar.marketWatch?.adicionais;

        if (!adicionais) {
          return [];
        }

        return [
          adicionais.prata,
          adicionais.ibovespa
        ].filter(
          (
            series
          ): series is RadarSeries =>
            Boolean(
              series &&
              series.points &&
              series.points.length > 0
            )
        );

      },
      [radar]
    );

  const printRadar = () => {

    window.print();

  };

  return (

    <div className="space-y-6 pb-24">

      {/* CABEÇALHO */}

      <div className="bg-zinc-900 rounded-[40px] p-8 border-b-8 border-yellow-600 shadow-2xl no-print">

        <div className="flex justify-between items-start gap-4">

          <div>

            <h1 className="text-3xl font-black text-white italic">
              Radar
            </h1>

            <p className="text-zinc-400 text-sm mt-2">
              Observatório de mercado e contexto econômico
            </p>

          </div>

          <div className="bg-yellow-600 text-zinc-900 p-3 rounded-2xl">
            <BarChart3 size={22} />
          </div>

        </div>

        <div className="mt-6 bg-zinc-800 rounded-2xl p-4">

          <div className="flex items-center gap-2">

            <ShieldCheck
              size={16}
              className="text-green-400"
            />

            <span className="text-[10px] uppercase tracking-widest font-black text-green-400">
              Função educacional
            </span>

          </div>

          <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
            O Radar organiza dados, indicadores e notícias
            para produzir contexto de mercado. Ele não
            recomenda compra ou venda de ativos e não
            determina alocação patrimonial.
          </p>

        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">

          <div>

            <label className="text-[9px] uppercase font-black text-zinc-500">
              Período de observação
            </label>

            <select
              value={period}
              onChange={(e) =>
                setPeriod(e.target.value)
              }
              className="w-full mt-2 p-3 rounded-xl bg-zinc-800 text-white outline-none font-bold text-sm"
            >

              <option value="30">
                Últimos 30 dias
              </option>

              <option value="90">
                Últimos 90 dias
              </option>

              <option value="180">
                Últimos 6 meses
              </option>

              <option value="365">
                Últimos 12 meses
              </option>

            </select>

          </div>

          <div className="flex items-end">

            <button
              onClick={loadRadar}
              disabled={loading}
              className="w-full bg-yellow-600 text-zinc-900 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest disabled:opacity-50 flex items-center justify-center gap-2"
            >

              <RefreshCw
                size={15}
                className={
                  loading
                    ? 'animate-spin'
                    : ''
                }
              />

              {loading
                ? 'Atualizando...'
                : 'Atualizar Radar'}

            </button>

          </div>

        </div>

      </div>

      {/* ERRO */}

      {error && (

        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-3xl p-5">

          <p className="text-xs font-bold text-red-700 dark:text-red-400">
            {error}
          </p>

          <p className="text-[10px] text-red-600 dark:text-red-500 mt-2">
            Os dados do Radar dependem da camada segura
            de coleta de fontes. Tente atualizar novamente.
          </p>

        </div>

      )}

      {/* CONTEXTO */}

      {(radar.headline ||
        radar.context) && (

        <div className="bg-white dark:bg-zinc-900 rounded-[35px] p-7 border dark:border-zinc-800 shadow-sm">

          <div className="flex items-center gap-2 mb-5">

            <TrendingUp
              size={18}
              className="text-yellow-600"
            />

            <h2 className="text-xs uppercase tracking-widest font-black">
              Contexto de Mercado
            </h2>

          </div>

          {radar.headline && (

            <h3 className="text-xl font-black dark:text-white mb-4">
              {radar.headline}
            </h3>

          )}

          {radar.context && (

            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap">
              {radar.context}
            </p>

          )}

          {radar.updatedAt && (

            <div className="flex items-center gap-2 mt-5 text-[9px] text-zinc-400 uppercase font-black">

              <Clock size={12} />

              Atualizado em:
              {' '}
              {formatDate(radar.updatedAt)}

            </div>

          )}

        </div>

      )}

      {/* INDICADORES */}

      <div className="space-y-4">

        <h2 className="px-2 text-[10px] uppercase tracking-widest font-black text-zinc-400">
          Indicadores monitorados
        </h2>

        {[
          ['Juros', allIndicators.juros],
          ['Inflação', allIndicators.inflacao],
          ['Câmbio', allIndicators.cambio],
          ['Atividade econômica', allIndicators.atividade]
        ].map(
          ([title, indicators]) => (

            <div
              key={title as string}
              className="bg-white dark:bg-zinc-900 rounded-[30px] p-5 border dark:border-zinc-800"
            >

              <h3 className="text-xs font-black uppercase mb-4 dark:text-white">
                {title as string}
              </h3>

              {(indicators as RadarIndicator[]).length > 0 ? (

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                  {(indicators as RadarIndicator[]).map(
                    (indicator, index) => (

                      <IndicatorCard
                        key={`${indicator.name}-${index}`}
                        indicator={indicator}
                      />

                    )
                  )}

                </div>

              ) : (

                <p className="text-xs text-zinc-400 italic">
                  Aguardando dados da fonte.
                </p>

              )}

            </div>

          )
        )}

      </div>

      {/* =================================================
          MERCADOS
          ================================================= */}

      <div className="bg-white dark:bg-zinc-900 rounded-[30px] p-5 border dark:border-zinc-800">

        <div className="flex items-center justify-between mb-4">

          <div>

            <h3 className="text-xs font-black uppercase dark:text-white">
              Mercados
            </h3>

            <p className="text-[9px] text-zinc-400 mt-1">
              Principais referências internacionais e de mercado
            </p>

          </div>

          <BarChart3
            size={18}
            className="text-yellow-600"
          />

        </div>

        {allIndicators.mercados.length > 0 ? (

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

            {allIndicators.mercados
              .filter(indicator =>
               ['Yuan chinês', 'Dólar', 'Ouro', 'Prata', 'Bitcoin', 'Ibovespa']
                  .includes(indicator.name)
              )
              .map(
                (indicator, index) => (

                  <IndicatorCard
                    key={`${indicator.name}-${index}`}
                    indicator={indicator}
                  />

                )
              )}

          </div>

        ) : (

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

            {[
              'Iene japonês',
              'Dólar',
              'Ouro',
              'Bitcoin'
            ].map(name => (

              <div
                key={name}
                className="bg-zinc-50 dark:bg-zinc-800 rounded-2xl p-4 border dark:border-zinc-700"
              >

                <p className="text-[9px] uppercase tracking-widest font-black text-zinc-400">
                  {name}
                </p>

                <p className="text-xs text-zinc-400 italic mt-2">
                  Aguardando dados da fonte.
                </p>

              </div>

            ))}

          </div>

        )}

      </div>

      {/* =================================================
          GRÁFICOS MACRO
          ================================================= */}

      {radar.charts &&
        radar.charts.length > 0 && (

          <div className="space-y-4">

            <h2 className="px-2 text-[10px] uppercase tracking-widest font-black text-zinc-400">
              Séries históricas
            </h2>

            {radar.charts.map(
              (series, index) => (

                <MiniChart
                  key={`${series.name}-${index}`}
                  series={series}
                />

              )
            )}

          </div>

        )}

      {/* =================================================
          4 GRÁFICOS PRINCIPAIS DE MERCADO
          ================================================= */}

      {mainMarkets.length > 0 && (

        <div className="space-y-4">

          <div>

            <h2 className="px-2 text-[10px] uppercase tracking-widest font-black text-zinc-400">
              Mercados — principais referências
            </h2>

            <p className="px-2 text-[9px] text-zinc-400 mt-1">
              Iene, dólar, ouro e Bitcoin
            </p>

          </div>

          {mainMarkets.map(
            (series, index) => (

              <MiniChart
                key={`market-main-${series.name}-${index}`}
                series={series}
              />

            )
          )}

        </div>

      )}

      {/* =================================================
          BOLSA
          ================================================= */}

      {radar.bolsa?.historico &&
        radar.bolsa.historico.points?.length > 0 && (

          <div className="space-y-4">

            <div>

              <h2 className="px-2 text-[10px] uppercase tracking-widest font-black text-zinc-400">
                Bolsa de valores
              </h2>

              <p className="px-2 text-[9px] text-zinc-400 mt-1">
                Ibovespa — referência do mercado acionário brasileiro
              </p>

            </div>

            {radar.bolsa.indice && (

              <IndicatorCard
                indicator={
                  radar.bolsa.indice
                }
              />

            )}

            <MiniChart
              series={
                radar.bolsa.historico
              }

            />

          </div>

      )}

      {/* =================================================
          MERCADOS ADICIONAIS
          ================================================= */}

      {additionalMarkets.length > 0 && (

        <div className="space-y-4">

          <h2 className="px-2 text-[10px] uppercase tracking-widest font-black text-zinc-400">
            Referências adicionais
          </h2>

          {additionalMarkets.map(
            (series, index) => (

              <MiniChart
                key={`market-add-${series.name}-${index}`}
                series={series}
              />

            )
          )}

        </div>

      )}

      {/* NOTÍCIAS */}

      <div className="bg-white dark:bg-zinc-900 rounded-[35px] p-6 border dark:border-zinc-800">

        <div className="flex items-center gap-2 mb-5">

          <Newspaper
            size={18}
            className="text-yellow-600"
          />

          <h2 className="text-xs uppercase tracking-widest font-black">
            Notícias que ajudam a explicar o cenário
          </h2>

        </div>

        {radar.news &&
        radar.news.length > 0 ? (

          <div className="space-y-3">

            {radar.news.map(
              (news, index) => (

                <article
                  key={index}
                  className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border dark:border-zinc-700"
                >

                  <div className="flex justify-between gap-3">

                    <div>

                      <h3 className="text-sm font-black dark:text-white">
                        {news.title}
                      </h3>

                      {news.summary && (

                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
                          {news.summary}
                        </p>

                      )}

                    </div>

                    {news.url && (

                      <a
                        href={news.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-yellow-600 shrink-0"
                      >

                        <ExternalLink size={16} />

                      </a>

                    )}

                  </div>

                  <div className="flex gap-3 mt-3 text-[9px] uppercase font-black text-zinc-400">

                    <span>
                      {news.source}
                    </span>

                    {news.date && (
                      <span>
                        {news.date}
                      </span>
                    )}

                  </div>

                </article>

              )
            )}

          </div>

        ) : (

          <div className="py-10 text-center">

            <Newspaper
              size={28}
              className="mx-auto text-zinc-300 mb-3"
            />

            <p className="text-xs text-zinc-400 italic">
              Nenhuma notícia carregada.
            </p>

          </div>

        )}

      </div>

      {/* FONTES */}

      <div className="bg-zinc-900 rounded-[35px] p-6 text-white">

        <div className="flex items-center gap-2 mb-5">

          <ShieldCheck
            size={18}
            className="text-green-400"
          />

          <h2 className="text-xs uppercase tracking-widest font-black">
            Fontes consultadas
          </h2>

        </div>

        {radar.sources &&
        radar.sources.length > 0 ? (

          <div className="space-y-2">

            {radar.sources.map(
              (source, index) => (

                <a
                  key={index}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl p-3 transition-colors"
                >

                  <span className="text-xs font-bold">
                    {source.name}
                  </span>

                  <ExternalLink
                    size={14}
                    className="text-yellow-600"
                  />

                </a>

              )
            )}

          </div>

        ) : (

          <div className="space-y-2">

            <div className="bg-zinc-800 rounded-xl p-3 text-xs font-bold">
              Banco Central do Brasil
            </div>

            <div className="bg-zinc-800 rounded-xl p-3 text-xs font-bold">
              IBGE
            </div>

            <p className="text-[9px] text-zinc-500 mt-3">
              As fontes definitivas serão informadas
              pela camada de coleta do Radar.
            </p>

          </div>

        )}

      </div>

      {/* RODAPÉ / IMPRESSÃO */}

      <div className="bg-white dark:bg-zinc-900 rounded-[30px] p-5 border dark:border-zinc-800 no-print">

        <div className="flex items-center justify-between gap-4">

          <div>

            <p className="text-[9px] uppercase tracking-widest font-black text-zinc-400">
              Relatório de observação
            </p>

            <p className="text-xs text-zinc-500 mt-1">
              Radar de Mercado — uso educacional
            </p>

          </div>

          <button
            onClick={printRadar}
            className="bg-zinc-900 text-white px-5 py-3 rounded-xl text-xs font-black flex items-center gap-2"
          >

            <Printer size={15} />

            Imprimir

          </button>

        </div>

      </div>

    </div>

  );
};

export default Radar;

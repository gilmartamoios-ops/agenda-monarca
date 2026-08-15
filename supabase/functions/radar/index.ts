import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface RadarRequest {
  period?: string;
}

interface SeriesPoint {
  label: string;
  value: number;
}

const BCB_API =
  "https://api.bcb.gov.br/dados/serie/bcdata.sgs";

function formatDateBR(date: Date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

function formatDateISO(date: Date) {
  return date.toISOString().slice(0, 10);
}

async function getBCBSeries(
  seriesId: number,
  periodDays: number
): Promise<SeriesPoint[]> {
  const end = new Date();

  const start = new Date();
  start.setDate(end.getDate() - periodDays);

  const url =
    `${BCB_API}.${seriesId}/dados` +
    `?formato=json` +
    `&dataInicial=${encodeURIComponent(formatDateBR(start))}` +
    `&dataFinal=${encodeURIComponent(formatDateBR(end))}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `BCB ${seriesId}: HTTP ${response.status}`
    );
  }

  const data = await response.json();

  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map((item: any) => ({
      label: item.data,
      value: Number(
        String(item.valor).replace(",", ".")
      ),
    }))
    .filter(
      (item: SeriesPoint) =>
        Number.isFinite(item.value)
    );
}

async function getYahooSeries(
  symbol: string,
  periodDays: number
): Promise<SeriesPoint[]> {
  const end = Math.floor(Date.now() / 1000);

  const startDate = new Date();
  startDate.setDate(
    startDate.getDate() - periodDays
  );

  const start = Math.floor(
    startDate.getTime() / 1000
  );

  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}` +
    `?period1=${start}` +
    `&period2=${end}` +
    `&interval=1d` +
    `&events=history`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Mercado ${symbol}: HTTP ${response.status}`
    );
  }

  const data = await response.json();

  const result =
    data?.chart?.result?.[0];

  if (!result) {
    return [];
  }

  const timestamps =
    result.timestamp || [];

  const closes =
    result.indicators?.quote?.[0]?.close || [];

  const points: SeriesPoint[] = [];

  for (
    let i = 0;
    i < timestamps.length;
    i++
  ) {
    const value = Number(closes[i]);

    if (!Number.isFinite(value)) {
      continue;
    }

    const date = new Date(
      timestamps[i] * 1000
    );

    points.push({
      label: formatDateISO(date),
      value,
    });
  }

  return points;
}

function last<T>(items: T[]) {
  return items.length
    ? items[items.length - 1]
    : undefined;
}

function createSeries(
  name: string,
  unit: string,
  points: SeriesPoint[]
) {
  return {
    name,
    unit,
    points,
    startDate:
      points.length
        ? points[0].label
        : null,
    endDate:
      points.length
        ? points[points.length - 1].label
        : null,
    pointCount: points.length,
  };
}

function createMarketIndicator(
  name: string,
  symbol: string,
  unit: string,
  point?: SeriesPoint,
  source = "Yahoo Finance"
) {
  if (!point) {
    return null;
  }

  return {
    name,
    symbol,
    value: point.value,
    unit,
    period: point.label,
    source,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({
        error: "Método não permitido.",
      }),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }

  try {
    const body: RadarRequest =
      await req.json().catch(() => ({}));

    const period =
      Number(body.period) || 90;

    /*
     * =====================================================
     * MACROECONOMIA
     * =====================================================
     */

    let selicHistory: SeriesPoint[] = [];
    let ipcaHistory: SeriesPoint[] = [];
    let dollarHistory: SeriesPoint[] = [];
    let activityHistory: SeriesPoint[] = [];

    try {
      selicHistory =
        await getBCBSeries(1178, period);
    } catch (error) {
      console.error("Selic:", error);
    }

    try {
      ipcaHistory =
        await getBCBSeries(
          433,
          Math.max(period, 365)
        );
    } catch (error) {
      console.error("IPCA:", error);
    }

    try {
      dollarHistory =
        await getBCBSeries(1, period);
    } catch (error) {
      console.error("Dólar BCB:", error);
    }

    try {
      activityHistory =
        await getBCBSeries(
          24363,
          Math.max(period, 730)
        );
    } catch (error) {
      console.error("IBC-Br:", error);
    }

    /*
     * =====================================================
     * MERCADOS
     *
     * 1. Iene
     * 2. Dólar
     * 3. Ouro
     * 4. Prata
     * 5. Bitcoin
     * 6. Ibovespa
     * =====================================================
     */

    let yenHistory: SeriesPoint[] = [];
    let marketDollarHistory: SeriesPoint[] = [];
    let goldHistory: SeriesPoint[] = [];
    let silverHistory: SeriesPoint[] = [];
    let bitcoinHistory: SeriesPoint[] = [];
    let ibovespaHistory: SeriesPoint[] = [];

    try {
      yenHistory =
        await getYahooSeries(
          "JPYBRL=X",
          period
        );
    } catch (error) {
      console.error("Iene:", error);
    }

    try {
      marketDollarHistory =
        await getYahooSeries(
          "BRL=X",
          period
        );
    } catch (error) {
      console.error(
        "Dólar mercado:",
        error
      );
    }

    try {
      goldHistory =
        await getYahooSeries(
          "GC=F",
          period
        );
    } catch (error) {
      console.error("Ouro:", error);
    }

    try {
      silverHistory =
        await getYahooSeries(
          "SI=F",
          period
        );
    } catch (error) {
      console.error("Prata:", error);
    }

    try {
      bitcoinHistory =
        await getYahooSeries(
          "BTC-USD",
          period
        );
    } catch (error) {
      console.error(
        "Bitcoin:",
        error
      );
    }

    try {
      ibovespaHistory =
        await getYahooSeries(
          "^BVSP",
          period
        );
    } catch (error) {
      console.error(
        "Ibovespa:",
        error
      );
    }

    /*
     * =====================================================
     * ÚLTIMOS VALORES
     * =====================================================
     */

    const currentSelic =
      last(selicHistory);

    const currentIpca =
      last(ipcaHistory);

    const currentDollar =
      last(dollarHistory);

    const currentActivity =
      last(activityHistory);

    const currentYen =
      last(yenHistory);

    const currentMarketDollar =
      last(marketDollarHistory);

    const currentGold =
      last(goldHistory);

    const currentSilver =
      last(silverHistory);

    const currentBitcoin =
      last(bitcoinHistory);

    const currentIbovespa =
      last(ibovespaHistory);

    /*
     * =====================================================
     * INDICADORES MACRO
     * =====================================================
     */

    const juros =
      currentSelic
        ? [
            {
              name: "Meta Selic",
              value:
                `${currentSelic.value.toFixed(2)}%`,
              unit: "a.a.",
              period:
                currentSelic.label,
              source:
                "Banco Central do Brasil",
            },
          ]
        : [];

    const inflacao =
      currentIpca
        ? [
            {
              name: "IPCA",
              value:
                `${currentIpca.value.toFixed(2)}%`,
              unit: "no mês",
              period:
                currentIpca.label,
              source:
                "IBGE / Banco Central do Brasil",
            },
          ]
        : [];

    const cambio =
      currentDollar
        ? [
            {
              name:
                "Dólar comercial",
              value:
                currentDollar.value.toFixed(4),
              unit:
                "referência BCB",
              period:
                currentDollar.label,
              source:
                "Banco Central do Brasil",
            },
          ]
        : [];

    const atividade =
      currentActivity
        ? [
            {
              name:
                "Atividade econômica — IBC-Br",
              value:
                currentActivity.value.toFixed(2),
              unit:
                "índice",
              period:
                currentActivity.label,
              source:
                "Banco Central do Brasil",
            },
          ]
        : [];

    /*
     * =====================================================
     * MERCADOS
     * =====================================================
     */

    const marketIndicators = [
      createMarketIndicator(
        "Iene japonês",
        "JPY",
        "BRL por JPY",
        currentYen
      ),

      createMarketIndicator(
        "Dólar",
        "USD",
        "BRL por USD",
        currentMarketDollar
      ),

      createMarketIndicator(
        "Ouro",
        "XAU",
        "US$",
        currentGold
      ),

      createMarketIndicator(
        "Bitcoin",
        "BTC",
        "US$",
        currentBitcoin
      ),

      createMarketIndicator(
        "Prata",
        "XAG",
        "US$",
        currentSilver
      ),

      createMarketIndicator(
        "Ibovespa",
        "IBOV",
        "pontos",
        currentIbovespa,
        "B3 / Yahoo Finance"
      ),
    ].filter(Boolean);

    /*
     * =====================================================
     * GRÁFICOS
     *
     * TODOS possuem:
     * - pontos
     * - valores
     * - datas
     * - período inicial
     * - período final
     * - quantidade de observações
     * =====================================================
     */

    const charts = [
      createSeries(
        "Selic — histórico",
        "% a.a.",
        selicHistory
      ),

      createSeries(
        "IPCA — histórico",
        "%",
        ipcaHistory
      ),

      createSeries(
        "Dólar — histórico",
        "R$ / US$",
        marketDollarHistory
      ),

      createSeries(
        "Atividade econômica — IBC-Br",
        "índice",
        activityHistory
      ),

      createSeries(
        "Iene — histórico",
        "BRL / JPY",
        yenHistory
      ),

      createSeries(
        "Ouro — histórico",
        "US$",
        goldHistory
      ),

      createSeries(
        "Prata — histórico",
        "US$",
        silverHistory
      ),

      createSeries(
        "Bitcoin — histórico",
        "US$",
        bitcoinHistory
      ),

      createSeries(
        "Ibovespa — histórico",
        "pontos",
        ibovespaHistory
      ),
    ].filter(
      (series) =>
        series.points.length > 0
    );

    /*
     * =====================================================
     * CONTAGEM
     * =====================================================
     */

    const indicatorCount =
      juros.length +
      inflacao.length +
      cambio.length +
      atividade.length;

    /*
     * =====================================================
     * FONTES
     * =====================================================
     */

    const sources = [
      {
        name:
          "Banco Central do Brasil",
        url:
          "https://www.bcb.gov.br/",
      },
      {
        name: "IBGE",
        url:
          "https://www.ibge.gov.br/",
      },
      {
        name: "Ipea",
        url:
          "https://www.ipea.gov.br/",
      },
      {
        name:
          "Tesouro Nacional",
        url:
          "https://www.gov.br/tesouronacional/",
      },
      {
        name:
          "B3 — Brasil, Bolsa, Balcão",
        url:
          "https://www.b3.com.br/",
      },
      {
        name:
          "Yahoo Finance",
        url:
          "https://finance.yahoo.com/",
      },
    ];

    /*
     * =====================================================
     * RESPOSTA
     * =====================================================
     */

    const radar = {
      updatedAt:
        new Date().toISOString(),

      headline:
        `Radar atualizado — ` +
        `${indicatorCount} indicador(es) ` +
        `econômico(s) carregado(s).`,

      context:
        `O Radar organiza indicadores ` +
        `econômicos, mercados, séries históricas ` +
        `e referências de bolsa para produzir ` +
        `contexto educacional do ambiente ` +
        `econômico e de mercado. ` +
        `O período selecionado foi de ${period} dias. ` +
        `Os dados não constituem recomendação ` +
        `individualizada de investimento.`,

      indicators: {
        juros,
        inflacao,
        cambio,
        atividade,
        mercados:
          marketIndicators,
      },

      charts,

      marketWatch: {
        principais: {
          iene: createSeries(
            "Iene — histórico",
            "BRL / JPY",
            yenHistory
          ),

          dolar: createSeries(
            "Dólar — histórico",
            "R$ / US$",
            marketDollarHistory
          ),

          ouro: createSeries(
            "Ouro — histórico",
            "US$",
            goldHistory
          ),

          bitcoin: createSeries(
            "Bitcoin — histórico",
            "US$",
            bitcoinHistory
          ),
        },

        adicionais: {
          prata: createSeries(
            "Prata — histórico",
            "US$",
            silverHistory
          ),

          ibovespa: createSeries(
            "Ibovespa — histórico",
            "pontos",
            ibovespaHistory
          ),
        },
      },

      bolsa: {
        indice:
          currentIbovespa
            ? {
                name:
                  "Ibovespa",
                value:
                  currentIbovespa.value,
                unit:
                  "pontos",
                period:
                  currentIbovespa.label,
                source:
                  "B3 / Yahoo Finance",
              }
            : null,

        historico:
          createSeries(
            "Ibovespa — histórico",
            "pontos",
            ibovespaHistory
          ),
      },

      news: [],

      sources,
    };

    return new Response(
      JSON.stringify(radar),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type":
            "application/json",
        },
      }
    );
  } catch (error) {
    console.error(
      "Erro interno no Radar:",
      error
    );

    return new Response(
      JSON.stringify({
        error:
          "Erro interno na função Radar.",
        message:
          error instanceof Error
            ? error.message
            : "Erro desconhecido.",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type":
            "application/json",
        },
      }
    );
  }
});
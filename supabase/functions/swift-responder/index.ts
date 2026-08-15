import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface SimulatorRequest {
  amount?: number | string;
  monthlyContribution?: number | string;
  profile?: string;
  term?: number | string;
  goal?: string;
}

interface Scenario {
  name: string;
  description: string;
  annualReturn: number;
  monthlyReturn: number;
  finalValue: number;
  totalContributed: number;
  projectedGain: number;
  evolution: {
    month: number;
    contributed: number;
    value: number;
    gain: number;
  }[];
}

function parseNumber(value: number | string | undefined): number {
  if (value === undefined || value === null || value === "") {
    return 0;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const normalized = String(value)
    .replace(/\./g, "")
    .replace(",", ".");

  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : 0;
}

function getProfileReturns(profile: string) {
  switch (profile) {
    case "conservador":
      return {
        unfavorable: 0.06,
        base: 0.09,
        favorable: 0.12,
      };

    case "arrojado":
      return {
        unfavorable: -0.05,
        base: 0.14,
        favorable: 0.24,
      };

    case "moderado":
    default:
      return {
        unfavorable: 0.02,
        base: 0.11,
        favorable: 0.17,
      };
  }
}

function calculateScenario(
  name: string,
  description: string,
  annualReturn: number,
  amount: number,
  monthlyContribution: number,
  term: number
): Scenario {
  const monthlyReturn =
    Math.pow(1 + annualReturn, 1 / 12) - 1;

  let value = amount;

  const evolution = [];

  for (let month = 0; month <= term; month++) {
    const contributed =
      amount + monthlyContribution * month;

    const gain = value - contributed;

    evolution.push({
      month,
      contributed: Number(contributed.toFixed(2)),
      value: Number(value.toFixed(2)),
      gain: Number(gain.toFixed(2)),
    });

    if (month < term) {
      value =
        value * (1 + monthlyReturn) +
        monthlyContribution;
    }
  }

  const totalContributed =
    amount + monthlyContribution * term;

  const finalValue = value;

  const projectedGain =
    finalValue - totalContributed;

  return {
    name,
    description,
    annualReturn,
    monthlyReturn,
    finalValue: Number(finalValue.toFixed(2)),
    totalContributed: Number(totalContributed.toFixed(2)),
    projectedGain: Number(projectedGain.toFixed(2)),
    evolution,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
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

    const body: SimulatorRequest =
      await req.json().catch(() => ({}));

    const amount = parseNumber(body.amount);

    const monthlyContribution =
      parseNumber(body.monthlyContribution);

    const profile =
      body.profile || "moderado";

    const term = Math.max(
      1,
      Math.floor(parseNumber(body.term) || 24)
    );

    const goal =
      body.goal || "crescimento";

    if (amount <= 0) {
      return new Response(
        JSON.stringify({
          error:
            "O valor inicial do investimento deve ser maior que zero.",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const returns =
      getProfileReturns(profile);

    const scenarios: Scenario[] = [
      calculateScenario(
        "Desfavorável",
        "Cenário de pressão sobre os investimentos. Não representa previsão de perda.",
        returns.unfavorable,
        amount,
        monthlyContribution,
        term
      ),

      calculateScenario(
        "Base",
        "Cenário central utilizado exclusivamente para fins educacionais.",
        returns.base,
        amount,
        monthlyContribution,
        term
      ),

      calculateScenario(
        "Favorável",
        "Cenário de desempenho positivo. Não representa promessa de rentabilidade.",
        returns.favorable,
        amount,
        monthlyContribution,
        term
      ),
    ];

    const result = {
      updatedAt: new Date().toISOString(),

      educationalNotice:
        "Esta simulação é exclusivamente educacional. Os retornos utilizados são premissas hipotéticas e não constituem previsão, garantia ou promessa de rentabilidade.",

      inputs: {
        amount,
        monthlyContribution,
        profile,
        term,
        goal,
      },

      summary: {
        totalInitialAmount: amount,
        monthlyContribution,
        totalContributed:
          amount + monthlyContribution * term,
        termMonths: term,
      },

      scenarios,

      methodology: {
        description:
          "A simulação utiliza capitalização mensal e cenários hipotéticos de retorno anual. O objetivo é demonstrar como diferentes premissas podem alterar a trajetória patrimonial.",

        important:
          "Os cenários não incorporam ainda dados reais do Radar. Essa integração será realizada em uma etapa posterior.",
      },

      nextStep:
        "Integrar as condições macroeconômicas observadas pelo Radar às premissas do simulador.",
    };

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error(
      "Erro no simulador de investimentos:",
      error
    );

    return new Response(
      JSON.stringify({
        error:
          "Erro interno no simulador de investimentos.",

        message:
          error instanceof Error
            ? error.message
            : "Erro desconhecido.",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
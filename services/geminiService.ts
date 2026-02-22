import { GoogleGenAI } from "@google/genai";

export const getMarketAnalysis = async (investmentAmount: number) => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY_NOT_FOUND");
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-3-flash-preview";

  const prompt = `
    Aja como um consultor de investimentos sênior especialista no mercado financeiro brasileiro atual.
    Com base em um orçamento de investimento disponível de R$ ${investmentAmount.toFixed(2)}, elabore uma estratégia completa:
    
    1. Opções de Investimento: Proponha alternativas específicas para Curto Prazo (resgate imediato/1 ano), Médio Prazo (2 a 5 anos) e Longo Prazo (5 anos+).
    2. Alocação: Sugira exatamente quanto (em R$) deve ser aplicado em cada uma dessas opções, totalizando o orçamento fornecido.
    3. Instituições: Liste quais bancos ou corretoras oferecem as melhores condições (taxas, rentabilidade e facilidade) para esses ativos no momento.
    4. Cenário de Mercado: Considere as tendências atuais (Taxa Selic, Inflação/IPCA e comportamento da bolsa) para justificar as escolhas.

    Forneça uma resposta direta, prática e formatada em tópicos curtos. Use um tom encorajador e profissional.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};
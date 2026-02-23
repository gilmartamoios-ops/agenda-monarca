import { GoogleGenAI } from "@google/genai";

export const getMarketAnalysis = async (investmentAmount: number) => {
  // Usando a chave que já está no seu projeto Firebase para simplificar
  const apiKey = "AIzaSyAP4dH75GfO6QeVSeUQjNtDYDJVNsUriCA"; 
  const ai = new GoogleGenAI(apiKey);
  
  // Nome do modelo corrigido para a versão estável atual
  const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    Aja como um consultor de investimentos sênior especialista no mercado financeiro brasileiro atual.
    Com base em um orçamento de investimento disponível de R$ ${investmentAmount.toFixed(2)}, elabore uma estratégia completa:
    1. Opções de Investimento: Proponha alternativas específicas para Curto Prazo, Médio Prazo e Longo Prazo.
    2. Alocação: Sugira exatamente quanto (em R$) em cada opção.
    3. Instituições: Liste bancos ou corretoras com melhores condições.
    4. Cenário de Mercado: Considere Selic e Inflação.
    Forneça uma resposta direta, prática e formatada em tópicos curtos.
  `;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text(); // Corrigido para função text()
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};

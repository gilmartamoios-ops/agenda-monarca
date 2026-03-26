export const generateResponse = async (identity: string, task: string) => {
  const API_KEY = "AIzaSyCJiSlO_3dfSvE0ypj5m3VGqrdjcnDBB-U";
  // URL estável para o modelo Flash
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${identity}\n\nTarefa: ${task}` }] }]
      })
    });

    const data = await response.json();
    if (response.ok && data.candidates) {
      return data.candidates[0].content.parts[0].text;
    }
    return `ERRO: ${data.error?.message || 'Falha na resposta'}`;
  } catch (error) {
    return "ERRO DE CONEXÃO: Verifique o sinal.";
  }
};
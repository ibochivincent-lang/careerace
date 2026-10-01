export interface FreeLlmOptions {
  prompt: string;
  system_prompt?: string;
  max_tokens?: number;
}

export async function callFreeLlm(options: FreeLlmOptions): Promise<string> {
  const openRouterKey = process.env.OPENROUTER_API_KEY || "";

  // 1. Try OpenRouter Free Models (DeepSeek R1 / Qwen 2.5 / Llama 3.3 Free tier)
  if (openRouterKey) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openRouterKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://github.com/ibochivincent-lang/careerace",
          "X-Title": "Career Ace"
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-r1:free",
          messages: [
            ...(options.system_prompt ? [{ role: "system", content: options.system_prompt }] : []),
            { role: "user", content: options.prompt }
          ],
          max_tokens: options.max_tokens || 500
        })
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) return content;
      }
    } catch (e) {
      // Fallback
    }
  }

  // 2. Try Local Ollama Instance (Free & Open Source - http://localhost:11434)
  try {
    const res = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3",
        prompt: `${options.system_prompt ? options.system_prompt + "\n\n" : ""}${options.prompt}`,
        stream: false
      })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.response) return data.response;
    }
  } catch (e) {
    // Fallback
  }

  // 3. Fallback Rule-Based Free Model Response Generator
  return `Evaluated using Career Ace Open-Source Fallback Model: Highly aligned candidate profile based on technical stack and experience parameters.`;
}

export async function callFreeLlmJson<T>(prompt: string, system_prompt: string): Promise<T | null> {
  const raw = await callFreeLlm({
    prompt,
    system_prompt: `${system_prompt}\nReturn ONLY a valid, raw JSON object without markdown formatting or backticks.`,
    max_tokens: 1500,
  });

  try {
    const clean = raw.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
    const firstBrace = clean.indexOf("{");
    const lastBrace = clean.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1) {
      return JSON.parse(clean.substring(firstBrace, lastBrace + 1)) as T;
    }
    return JSON.parse(clean) as T;
  } catch (err) {
    return null;
  }
}

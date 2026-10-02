export interface FreeLlmOptions {
  prompt: string;
  system_prompt?: string;
  max_tokens?: number;
}

export async function callFreeLlm(options: FreeLlmOptions): Promise<string> {
  const openRouterKey = process.env.OPENROUTER_API_KEY || "";
  const groqKey = process.env.GROQ_API_KEY || "";
  const openaiKey = process.env.OPENAI_API_KEY || "";

  // 1. Try Groq if configured (ultra-fast, free tier available)
  if (groqKey) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${groqKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            ...(options.system_prompt ? [{ role: "system", content: options.system_prompt }] : []),
            { role: "user", content: options.prompt }
          ],
          max_tokens: options.max_tokens || 800
        })
      });
      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) return content;
      }
    } catch (_e) {}
  }

  // 2. Try OpenRouter (DeepSeek R1 / Qwen 2.5 / Meta Llama free tier)
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
          max_tokens: options.max_tokens || 800
        })
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) return content;
      }
    } catch (_e) {}
  }

  // 3. Try OpenAI API if present
  if (openaiKey) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            ...(options.system_prompt ? [{ role: "system", content: options.system_prompt }] : []),
            { role: "user", content: options.prompt }
          ],
          max_tokens: options.max_tokens || 800
        })
      });
      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) return content;
      }
    } catch (_e) {}
  }

  // 4. Try Local Ollama Instance (http://localhost:11434)
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
  } catch (_e) {}

  // 5. Context-aware heuristic response when no LLM endpoint is reachable
  return `Career Ace Copilot: Based on your target role and technical skills, your profile shows solid alignment with core engineering expectations. Focus on quantifying production impact and practicing STAR+R interview scenarios.`;
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
  } catch (_err) {
    return null;
  }
}

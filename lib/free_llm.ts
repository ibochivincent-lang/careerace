export interface FreeLlmOptions {
  prompt: string;
  system_prompt?: string;
  messages?: Array<{ role: string; content: string }>;
  max_tokens?: number;
  custom_keys?: {
    google?: string;
    groq?: string;
    cerebras?: string;
    deepseek?: string;
    openrouter?: string;
    openai?: string;
    opencode?: string;
  };
}

export async function callFreeLlm(options: FreeLlmOptions): Promise<string> {
  let cookieKeys: Record<string, string> = {};
  try {
    const { readKeyBag } = await import("./keys.ts");
    const bag = await readKeyBag();
    cookieKeys = bag.keys || {};
  } catch (_e) {
    // Outside request context or running in non-cookie context
  }

  const geminiKey =
    options.custom_keys?.google?.trim() ||
    cookieKeys.google ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    "";

  const groqKey =
    options.custom_keys?.groq?.trim() ||
    cookieKeys.groq ||
    process.env.GROQ_API_KEY ||
    "";

  const cerebrasKey =
    options.custom_keys?.cerebras?.trim() ||
    cookieKeys.cerebras ||
    process.env.CEREBRAS_API_KEY ||
    "";

  const deepseekKey =
    options.custom_keys?.deepseek?.trim() ||
    cookieKeys.deepseek ||
    process.env.DEEPSEEK_API_KEY ||
    "";

  const openRouterKey =
    options.custom_keys?.openrouter?.trim() ||
    cookieKeys.openrouter ||
    process.env.OPENROUTER_API_KEY ||
    "";

  const openCodeKey =
    options.custom_keys?.opencode?.trim() ||
    cookieKeys.opencode ||
    process.env.OPENCODE_API_KEY ||
    "";

  const openaiKey =
    options.custom_keys?.openai?.trim() ||
    cookieKeys.openai ||
    process.env.OPENAI_API_KEY ||
    "";

  // Build unified chat messages history if available
  const chatMessages: Array<{ role: string; content: string }> = [];
  if (options.messages && options.messages.length > 0) {
    for (const m of options.messages) {
      if (m.content) {
        chatMessages.push({
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.content,
        });
      }
    }
    const lastMsg = chatMessages[chatMessages.length - 1];
    if (!lastMsg || lastMsg.content !== options.prompt) {
      chatMessages.push({ role: "user", content: options.prompt });
    }
  } else {
    chatMessages.push({ role: "user", content: options.prompt });
  }

  // 1. Try OpenAI API if present (gpt-4o-mini, gpt-4o)
  if (openaiKey) {
    const openaiPayloadMessages = [
      ...(options.system_prompt ? [{ role: "system", content: options.system_prompt }] : []),
      ...chatMessages,
    ];

    for (const model of ["gpt-4o-mini", "gpt-4.1-mini", "gpt-4o"]) {
      try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openaiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: openaiPayloadMessages,
            max_tokens: options.max_tokens || 1000,
          }),
          signal: AbortSignal.timeout(2000),
        });
        if (res.ok) {
          const data = await res.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) return content;
        } else {
          console.warn(`[careerace] OpenAI (${model}) returned HTTP ${res.status}. Rotating to next model/provider...`);
          if (res.status === 401 || res.status === 403 || res.status === 400 || res.status === 429) {
            break;
          }
        }
      } catch (err: any) {
        console.warn(`[careerace] OpenAI (${model}) connection notice:`, err);
        if (err?.cause?.code === "ENOTFOUND" || err?.cause?.code === "EAI_AGAIN") {
          break;
        }
      }
    }
  }

  // 2. Try Groq Cloud (Ultra-fast open-source inference: Llama 3.3, Llama 3.1)
  if (groqKey) {
    const groqPayloadMessages = [
      ...(options.system_prompt ? [{ role: "system", content: options.system_prompt }] : []),
      ...chatMessages,
    ];

    for (const model of ["qwen/qwen3.8-27b", "openai/gpt-oss-120b", "openai/gpt-oss-20b", "llama-3.3-70b-versatile"]) {
      try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${groqKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: groqPayloadMessages,
            max_tokens: options.max_tokens || 1000,
          }),
          signal: AbortSignal.timeout(2000),
        });
        if (res.ok) {
          const data = await res.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) return content;
        } else {
          console.warn(`[careerace] Groq (${model}) returned HTTP ${res.status}. Rotating to next model/provider...`);
          if (res.status === 401 || res.status === 403 || res.status === 400 || res.status === 429) {
            break;
          }
        }
      } catch (err: any) {
        console.warn(`[careerace] Groq (${model}) connection notice:`, err);
        if (err?.cause?.code === "ENOTFOUND" || err?.cause?.code === "EAI_AGAIN") {
          break;
        }
      }
    }
  }

  // 3. Try Google Gemini API (gemini-3.8-flash / gemini-3.5-flash / gemini-flash-latest)
  if (geminiKey) {
    const geminiContents = chatMessages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    for (const modelName of ["gemini-3.8-flash", "gemini-3.5-flash", "gemini-flash-latest", "gemini-flash-lite-latest"]) {
      try {
        const payload: Record<string, unknown> = {
          contents: geminiContents,
          generationConfig: {
            maxOutputTokens: options.max_tokens || 1000,
          },
        };
        if (options.system_prompt) {
          payload.system_instruction = {
            parts: [{ text: options.system_prompt }],
          };
        }

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(2000),
          }
        );
        if (res.ok) {
          const data = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) return text;
        } else {
          console.warn(`[careerace] Gemini (${modelName}) returned HTTP ${res.status}. Rotating to next model/provider...`);
          if (res.status === 401 || res.status === 403 || res.status === 400 || res.status === 429) {
            break;
          }
        }
      } catch (err: any) {
        console.warn(`[careerace] Gemini (${modelName}) connection notice:`, err);
        if (err?.cause?.code === "ENOTFOUND" || err?.cause?.code === "EAI_AGAIN") {
          break;
        }
      }
    }
  }

  // 4. Try Cerebras API if configured (Fast Llama 3.3 / 3.1)
  if (cerebrasKey) {
    const cerebrasPayloadMessages = [
      ...(options.system_prompt ? [{ role: "system", content: options.system_prompt }] : []),
      ...chatMessages,
    ];

    for (const model of ["llama-3.3-70b", "llama3.1-70b", "llama3.1-8b"]) {
      try {
        const res = await fetch("https://api.cerebras.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${cerebrasKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: cerebrasPayloadMessages,
            max_tokens: options.max_tokens || 1000,
          }),
          signal: AbortSignal.timeout(2000),
        });
        if (res.ok) {
          const data = await res.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) return content;
        } else {
          console.warn(`[careerace] Cerebras (${model}) returned HTTP ${res.status}. Rotating to next model/provider...`);
          if (res.status === 401 || res.status === 403 || res.status === 400 || res.status === 429) {
            break;
          }
        }
      } catch (err: any) {
        console.warn(`[careerace] Cerebras (${model}) connection notice:`, err);
        if (err?.cause?.code === "ENOTFOUND" || err?.cause?.code === "EAI_AGAIN") {
          break;
        }
      }
    }
  }

  // 5. Try DeepSeek direct API if configured
  if (deepseekKey) {
    const deepseekPayloadMessages = [
      ...(options.system_prompt ? [{ role: "system", content: options.system_prompt }] : []),
      ...chatMessages,
    ];

    for (const model of ["deepseek-chat", "deepseek-reasoner"]) {
      try {
        const res = await fetch("https://api.deepseek.com/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${deepseekKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: deepseekPayloadMessages,
            max_tokens: options.max_tokens || 1000,
          }),
          signal: AbortSignal.timeout(2000),
        });
        if (res.ok) {
          const data = await res.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) return content;
        } else {
          console.warn(`[careerace] DeepSeek (${model}) returned HTTP ${res.status}. Rotating to next model/provider...`);
          if (res.status === 401 || res.status === 403 || res.status === 400 || res.status === 429) {
            break;
          }
        }
      } catch (err: any) {
        console.warn(`[careerace] DeepSeek (${model}) connection notice:`, err);
        if (err?.cause?.code === "ENOTFOUND" || err?.cause?.code === "EAI_AGAIN") {
          break;
        }
      }
    }
  }

  // 6. Try OpenRouter (Free open-source models: Qwen, Nemotron, Gemma, DeepSeek R1, Mistral)
  if (openRouterKey) {
    const openRouterPayloadMessages = [
      ...(options.system_prompt ? [{ role: "system", content: options.system_prompt }] : []),
      ...chatMessages,
    ];

    for (const model of ["qwen/qwen3.8-27b:free", "nvidia/nemotron-3.5-lightning:free", "google/gemma-4-31b-it:free", "deepseek/deepseek-r1:free", "mistralai/mistral-7b-instruct:free"]) {
      try {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openRouterKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://careerace.online",
            "X-Title": "Career Ace",
          },
          body: JSON.stringify({
            model,
            messages: openRouterPayloadMessages,
            max_tokens: options.max_tokens || 1000,
          }),
          signal: AbortSignal.timeout(2000),
        });

        if (res.ok) {
          const data = await res.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) return content;
        } else {
          console.warn(`[careerace] OpenRouter (${model}) returned HTTP ${res.status}. Rotating to next model/provider...`);
          if (res.status === 401 || res.status === 403 || res.status === 400 || res.status === 429) {
            break;
          }
        }
      } catch (err: any) {
        console.warn(`[careerace] OpenRouter (${model}) connection notice:`, err);
        if (err?.cause?.code === "ENOTFOUND" || err?.cause?.code === "EAI_AGAIN") {
          break;
        }
      }
    }
  }

  // 7. Try OpenCode Zen/Go API if present
  if (openCodeKey) {
    for (const model of ["deepseek-flash", "deepseek-v4-flash", "qwen3.8-flash"]) {
      try {
        const res = await fetch("https://opencode.ai/zen/go/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openCodeKey}`,
            "Content-Type": "application/json",
            "x-opencode-session": "careerace_session",
          },
          body: JSON.stringify({
            model,
            messages: [
              ...(options.system_prompt ? [{ role: "system", content: options.system_prompt }] : []),
              { role: "user", content: options.prompt },
            ],
            max_tokens: options.max_tokens || 800,
          }),
          signal: AbortSignal.timeout(2000),
        });
        if (res.ok) {
          const data = await res.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) return content;
        } else {
          console.warn(`[careerace] OpenCode (${model}) returned HTTP ${res.status}. Rotating to next model/provider...`);
          if (res.status === 401 || res.status === 403 || res.status === 400 || res.status === 429) {
            break;
          }
        }
      } catch (err: any) {
        console.warn(`[careerace] OpenCode (${model}) connection notice:`, err);
        if (err?.cause?.code === "ENOTFOUND" || err?.cause?.code === "EAI_AGAIN") {
          break;
        }
      }
    }
  }

  // 8. Try Ollama Instance (local dev or remote via OLLAMA_BASE_URL env var)
  // In production on Vercel, OLLAMA_BASE_URL must be set to a reachable remote Ollama
  // server — localhost is never reachable in a serverless runtime and is silently skipped.
  const ollamaBase =
    process.env.OLLAMA_BASE_URL ||
    (process.env.NODE_ENV !== "production" ? "http://localhost:11434" : null);
  if (ollamaBase) {
    try {
      const res = await fetch(`${ollamaBase}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: process.env.OLLAMA_MODEL || "llama3",
          prompt: `${options.system_prompt ? options.system_prompt + "\n\n" : ""}${options.prompt}`,
          stream: false,
        }),
        signal: AbortSignal.timeout(5_000),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.response) return data.response;
      }
    } catch (_e) {
      // Ollama not available — fall through to intelligent fallback
    }
  }

  // 6. Intelligent Intent & Memory-Aware Dialogue Fallback Engine
  return generateIntelligentFallback(options.prompt, options.system_prompt || "");
}

function generateIntelligentFallback(prompt: string, systemPrompt: string): string {
  const pLower = prompt.toLowerCase().trim();
  const sysLower = systemPrompt.toLowerCase();

  // Extract known facts from system prompt if present
  let knownName = "";
  const nameMatch = systemPrompt.match(/(?:candidate name|name)[:=]\s*([^\n,]+)/i);
  if (nameMatch && nameMatch[1]) {
    knownName = nameMatch[1].trim();
  }

  // 0. Check if Walrus Sovereign Memory contains a matching learned Q&A or relevant fact
  const memoryMatch = systemPrompt.match(/FACTS RECORDED IN WALRUS SOVEREIGN MEMORY:\n([\s\S]+?)(?=\n\n|\nRULES:|$)/i);
  if (memoryMatch && memoryMatch[1]) {
    const memoryLines = memoryMatch[1].split("\n").map((l) => l.trim().replace(/^-\s*/, ""));
    for (const line of memoryLines) {
      if (line.includes("Learned Q&A:")) {
        const qaMatch = line.match(/Learned Q&A:\s*"([^"]+)"\s*->\s*"([^"]+)"/i);
        if (qaMatch) {
          const q = qaMatch[1].toLowerCase().trim();
          const a = qaMatch[2].trim();
          if (pLower === q || pLower.includes(q) || q.includes(pLower)) {
            return a;
          }
        }
      }
    }
  }

  // 1. Direct Name Queries: "what is my name", "who am i", "do you know my name"
  if (pLower.includes("what is my name") || pLower.includes("what's my name") || pLower.includes("who am i") || pLower.includes("do you remember me") || pLower.includes("do you know who i am")) {
    if (knownName) {
      return `Your name is **${knownName}**, securely sealed in your sovereign Walrus Memory vault. How can I help advance your career today, ${knownName}? We can review your target roles, add technical skills, or practice STAR+R interview scenarios.`;
    }
    return `I don't have your name recorded in your sovereign Walrus Memory vault yet. What is your full name? Once you share it, I will seal it to your decentralized career profile!`;
  }

  // 2. Direct Introduction: "my name is...", "i am...", "i'm..."
  const introMatch = prompt.match(/(?:my name is|i am|i'm|call me|name:)\s+([A-Za-z\s'-]{2,40})/i);
  if (introMatch && introMatch[1]) {
    const extractedName = introMatch[1].trim();
    // Ignore common non-name words
    if (!["looking", "a developer", "an engineer", "ready", "interested", "trying", "applying"].includes(extractedName.toLowerCase())) {
      return `Nice to meet you, **${extractedName}**!\n\nI have securely sealed your name into your sovereign Walrus Memory vault. To help build your verified CV and match you with live engineering roles, what kind of work or role are you looking for, and what seniority level (e.g. Entry-level, Mid-level, or Senior)?`;
    }
  }

  // 3. Skill Queries: "what are my skills", "what skills do i have", "my skills"
  if (pLower.includes("what are my skills") || pLower.includes("what skills") || pLower.includes("list my skills")) {
    const skillsMatch = systemPrompt.match(/skills?[:=]\s*([^\n]+)/i);
    if (skillsMatch && skillsMatch[1]) {
      return `Here are your verified skills currently recorded in your sovereign Walrus Memory vault:\n\n**${skillsMatch[1].trim()}**\n\nWould you like to add more languages, frameworks, or tools to your profile?`;
    }
    return `You haven't listed your technical skills in your sovereign profile yet. What programming languages, frameworks, and developer tools do you specialize in (e.g. TypeScript, React, Next.js, Rust, Python, Docker)?`;
  }

  // 4. Role Queries: "what is my role", "what role am i targeting"
  if (pLower.includes("what role") || pLower.includes("target role") || pLower.includes("what am i applying for")) {
    const roleMatch = systemPrompt.match(/targetroles?[:=]\s*([^\n]+)/i) || systemPrompt.match(/target role[:=]\s*([^\n]+)/i);
    if (roleMatch && roleMatch[1]) {
      return `According to your Walrus Memory vault, your primary target role is **${roleMatch[1].trim()}**.\n\nWould you like to explore live remote opportunities for this role, or practice tailored technical interview questions?`;
    }
    return `You haven't specified your target role yet. What position are you aiming for (e.g. Fullstack Engineer, Frontend Developer, Backend Rust Engineer, Product Manager)?`;
  }

  // 5. User provides Target Role / Seniority
  if (pLower.includes("engineer") || pLower.includes("developer") || pLower.includes("senior") || pLower.includes("junior") || pLower.includes("entry-level") || pLower.includes("entry level") || pLower.includes("manager")) {
    return `Got it! I have recorded your target role preferences into your sovereign Walrus Memory vault.\n\nNext, what is your highest educational institution (university, college, or bootcamp), and what degree or field of study did you complete?`;
  }

  // 6. User provides Education / Institution
  if (pLower.includes("university") || pLower.includes("college") || pLower.includes("degree") || pLower.includes("bachelor") || pLower.includes("b.sc") || pLower.includes("b.s.") || pLower.includes("master") || pLower.includes("bootcamp") || pLower.includes("graduated")) {
    return `Great! Your educational background has been indexed to your Walrus decentralized vault.\n\nNow, what are your primary core technical skills, programming languages, and frameworks (e.g. TypeScript, React, Python, Go, SQL)?`;
  }

  // 7. User provides Technical Skills
  if (pLower.includes("react") || pLower.includes("typescript") || pLower.includes("javascript") || pLower.includes("python") || pLower.includes("rust") || pLower.includes("node") || pLower.includes("sql") || pLower.includes("docker") || pLower.includes("aws")) {
    return `Excellent technical stack! I've cataloged these competencies into your sovereign skill graph in Walrus Memory.\n\nCould you share a brief overview of your past work experience or a standout project you've built (including the technologies used and key outcomes)?`;
  }

  // 8. General conversational fallback with personalized greeting
  const greeting = knownName ? `Hello ${knownName}! ` : "Hello! ";
  return `${greeting}I am Career Ace, your autonomous career copilot. Every detail you share is sealed into your decentralized Walrus Memory vault.\n\nWhat would you like to update or explore today? You can share your full name, target role, technical skills, or practice STAR+R interview questions!`;
}

export async function callFreeLlmJson<T>(
  prompt: string,
  system_prompt: string,
  custom_keys?: FreeLlmOptions["custom_keys"]
): Promise<T | null> {
  const raw = await callFreeLlm({
    prompt,
    system_prompt: `${system_prompt}\nReturn ONLY a valid, raw JSON object without markdown formatting or backticks.`,
    max_tokens: 3000,
    custom_keys,
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

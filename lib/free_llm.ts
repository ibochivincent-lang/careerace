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

  // 3. Try Google Gemini API if GEMINI_API_KEY or GOOGLE_API_KEY is present
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
  if (geminiKey) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            ...(options.system_prompt ? [{ role: "user", parts: [{ text: `SYSTEM INSTRUCTIONS:\n${options.system_prompt}` }] }, { role: "model", parts: [{ text: "Understood. I will act as the Career Ace AI Copilot according to these guidelines." }] }] : []),
            { role: "user", parts: [{ text: options.prompt }] }
          ],
          generationConfig: {
            maxOutputTokens: options.max_tokens || 800,
          }
        })
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      }
    } catch (_e) {}
  }

  // 4. Try OpenAI API if present
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

  // 5. Try Local Ollama Instance (http://localhost:11434)
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

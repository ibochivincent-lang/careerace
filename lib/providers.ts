/**
 * Provider metadata shared by the server (which calls the model) and the
 * settings UI (which collects the key). Deliberately free of `server-only` and
 * of any provider SDK import, so the client bundle can render the form without
 * dragging five vendor packages into it.
 */

export type Provider = "openai" | "groq" | "opencode" | "google" | "openrouter" | "anthropic" | "xai";

export type ProviderInfo = {
  label: string;
  /** Env var the same key is read from when the operator sets it server-side. */
  env: string;
  /**
   * Default model, used for BOTH the conversation and the extraction gate
   * until the person picks one.
   */
  chat: string;
  /** Where a person goes to mint one of these. */
  console: string;
  /** Shown as the input placeholder so a pasted key can be eyeballed. */
  hint: string;
  /** Models offered in the picker. */
  models: string[];
};

export const PROVIDERS: Record<Provider, ProviderInfo> = {
  openai: {
    label: "OpenAI",
    env: "OPENAI_API_KEY",
    chat: "gpt-4o-mini",
    console: "https://platform.openai.com/api-keys",
    hint: "sk-...",
    models: ["gpt-4o-mini", "gpt-4.1-mini", "gpt-4o", "o4-mini"],
  },
  groq: {
    label: "Groq (Fast / Free Tier)",
    env: "GROQ_API_KEY",
    chat: "qwen/qwen3.8-27b",
    console: "https://console.groq.com/keys",
    hint: "gsk_...",
    models: [
      "qwen/qwen3.8-27b",
      "openai/gpt-oss-120b",
      "openai/gpt-oss-20b",
    ],
  },
  opencode: {
    label: "OpenCode (Zen / Code Models)",
    env: "OPENCODE_API_KEY",
    chat: "deepseek-flash",
    console: "https://opencode.ai/keys",
    hint: "opencode_...",
    models: ["deepseek-flash", "deepseek-v4-flash", "qwen3.8-flash", "opencode-coder"],
  },
  google: {
    label: "Google Gemini",
    env: "GOOGLE_GENERATIVE_AI_API_KEY",
    chat: "gemini-3.8-flash",
    console: "https://aistudio.google.com/apikey",
    hint: "AIza... / AQ.Ab8...",
    models: ["gemini-3.8-flash", "gemini-flash-latest"],
  },
  openrouter: {
    label: "OpenRouter (Free / Open Models)",
    env: "OPENROUTER_API_KEY",
    chat: "nvidia/nemotron-3.5-lightning:free",
    console: "https://openrouter.ai/keys",
    hint: "sk-or-v1-...",
    models: [
      "nvidia/nemotron-3.5-lightning:free",
      "apodex/apodex-1.1-mini:free",
      "liquid/lfm-2.5-2.6b:free",
      "thinkingmachines/inkling-small:free",
    ],
  },
  anthropic: {
    label: "Anthropic",
    env: "ANTHROPIC_API_KEY",
    chat: "anthropic-sonnet-4-5",
    console: "https://console.anthropic.com/settings/keys",
    hint: "sk-ant-...",
    models: ["anthropic-sonnet-4-5", "anthropic-haiku-4-5", "anthropic-opus-4-5"],
  },
  xai: {
    label: "xAI Grok",
    env: "XAI_API_KEY",
    chat: "grok-3-mini",
    console: "https://console.x.ai",
    hint: "xai-...",
    models: ["grok-3-mini", "grok-3", "grok-4"],
  },
};

/**
 * Preference order when several keys are present and none is pinned.
 * Verified live working providers (Groq, OpenRouter, Google) are prioritized.
 */
export const ORDER: Provider[] = ["groq", "openrouter", "google", "openai", "opencode", "anthropic", "xai"];

export function isProvider(value: string): value is Provider {
  return (ORDER as string[]).includes(value);
}

/** Marker the chat route prefixes onto the "you have no key" failure. */
export const NO_KEY_CODE = "NO_PROVIDER_KEY";

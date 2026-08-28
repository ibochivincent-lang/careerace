/**
 * Bring your own key.
 *
 * Nothing in this project is tied to one model vendor. A key can arrive two
 * ways and both are first class:
 *
 *   1. From the person using the app, entered in Settings and held encrypted
 *      in their own cookie (lib/keys.ts). This is what a visitor to a deployed
 *      instance uses — they spend their own credit, not the operator's.
 *   2. From the environment, set by whoever deployed it. This is what a local
 *      clone or a single-tenant deployment uses.
 *
 * Two jobs run against the model, and they must never drift apart:
 *   chatModel()    — talks to the student.
 *   extractModel() — the write gate. Reads one turn and emits structured JSON.
 *
 * Both resolve through the same `model()` below, so they share the provider,
 * the key and the model id.
 *
 * The selection RULES live in ./model-select, which is pure and tested. This
 * module is only the part that needs the request and the vendor SDKs.
 */
import "server-only";
import type { LanguageModelV1 } from "ai";
import { NO_KEY_CODE, type Provider } from "./providers.ts";
import { readKeyBag } from "./keys.ts";
import { keyFor, modelId, resolveModels, availableProviders, resolveProvider } from "./model-select.ts";

export type { Provider };
export { availableProviders, resolveProvider };

// Each factory is given the key explicitly rather than left to read the
// environment, because the key usually is not in the environment — it came
// from the person's cookie.
async function factory(provider: Provider, apiKey: string) {
  switch (provider) {
    case "anthropic":
      return (await import("@ai-sdk/anthropic")).createAnthropic({ apiKey });
    case "openai":
      return (await import("@ai-sdk/openai")).createOpenAI({ apiKey });
    case "google":
      return (await import("@ai-sdk/google")).createGoogleGenerativeAI({ apiKey });
    case "xai":
      return (await import("@ai-sdk/xai")).createXai({ apiKey });
    case "groq":
      return (await import("@ai-sdk/groq")).createGroq({ apiKey });
  }
}

async function model(role: "chat" | "extract"): Promise<LanguageModelV1> {
  const bag = await readKeyBag();
  const provider = resolveProvider(bag);
  const apiKey = keyFor(provider, bag);
  if (!apiKey) throw new Error(`${NO_KEY_CODE}: No key for ${provider}.`);

  const create = await factory(provider, apiKey);
  return create(modelId(provider, role, bag)) as LanguageModelV1;
}

/** The model that talks to the student. */
export const chatModel = () => model("chat");

/** The model behind the write gate. Same provider, key and model as the chat. */
export const extractModel = () => model("extract");

/** For the answer's provenance chip: who is answering, on what. */
export async function describeModel() {
  const { provider, chat, extract } = resolveModels(await readKeyBag());
  return { provider, chat, extract };
}

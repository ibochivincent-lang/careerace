/**
 * Pure model selection — no I/O, no `server-only`, no provider SDK.
 *
 * Split out of ./model for the same reason ./facts is split out of
 * ./memory-core: the rules that decide WHICH provider, WHICH key and WHICH
 * model answer a turn are worth testing without a network, a cookie jar or a
 * vendor package. Otherwise nothing verifies that the conversation and the
 * write gate agree about which model they are talking to.
 */
import { PROVIDERS, ORDER, isProvider, NO_KEY_CODE, type Provider } from "./providers.ts";

/** Keys and model choices belonging to one person. */
export type KeyBag = {
  keys: Partial<Record<Provider, string>>;
  models: Partial<Record<Provider, string>>;
  active?: Provider;
};

export type Env = Record<string, string | undefined>;

/**
 * The key for one provider. The person's own key beats the deployment's,
 * because they are the one paying for it and the one who just chose it.
 */
export function keyFor(provider: Provider, bag: KeyBag, env: Env = process.env): string | null {
  const own = bag.keys[provider]?.trim();
  if (own) return own;
  return env[PROVIDERS[provider].env]?.trim() || null;
}

export function availableProviders(bag: KeyBag, env: Env = process.env): Provider[] {
  return ORDER.filter((p) => Boolean(keyFor(p, bag, env)));
}

/**
 * Which provider answers. The person's pinned choice wins, then
 * EA_MODEL_PROVIDER for a deployment that forces one, then whichever key exists.
 */
export function resolveProvider(bag: KeyBag, env: Env = process.env): Provider {
  const chosen = bag.active;
  if (chosen && keyFor(chosen, bag, env)) return chosen;

  const pinned = env.EA_MODEL_PROVIDER?.trim().toLowerCase();
  if (pinned) {
    if (!isProvider(pinned)) {
      throw new Error(`EA_MODEL_PROVIDER="${pinned}" is not one of: ${ORDER.join(", ")}`);
    }
    if (!keyFor(pinned, bag, env)) {
      throw new Error(`EA_MODEL_PROVIDER is "${pinned}" but no key for it is set.`);
    }
    return pinned;
  }

  const found = availableProviders(bag, env)[0];
  if (!found) {
    /*
     * Prefixed with a code the UI branches on. Without it the browser gets a
     * sentence it can only print — and "add a key" is an action, not a
     * message, so the chat needs to offer the settings panel instead of a
     * useless Try again.
     */
    throw new Error(
      `${NO_KEY_CODE}: No model key yet. Add one in Settings, or set any of ` +
        `${ORDER.map((p) => PROVIDERS[p].env).join(", ")} on the server.`,
    );
  }
  return found;
}

/**
 * The model id for a role.
 *
 * Extraction follows the model the person actually chose. A separate small
 * default per provider — an id this repo guessed at and never checked against
 * the provider's live roster — means the write gate can fail on every single
 * turn while the conversation looks perfectly healthy. The chosen model is
 * known to work: it just answered.
 *
 * EA_EXTRACT_MODEL still splits them, for anyone who wants the cheap tier on
 * the gate. Correctness first: a cheaper gate that silently drops a
 * misconception is not a saving.
 */
export function modelId(
  provider: Provider,
  role: "chat" | "extract",
  bag: KeyBag,
  env: Env = process.env,
): string {
  const chat =
    bag.models[provider]?.trim() || env.EA_CHAT_MODEL?.trim() || PROVIDERS[provider].chat;

  if (role === "extract") return env.EA_EXTRACT_MODEL?.trim() || chat;
  return chat;
}

/**
 * Everything a turn needs to know, resolved once. Both jobs read the SAME
 * provider, the SAME key and — unless deliberately split — the SAME model, for
 * every provider. That is the property the tests pin down.
 */
export function resolveModels(bag: KeyBag, env: Env = process.env) {
  const provider = resolveProvider(bag, env);
  const apiKey = keyFor(provider, bag, env);
  if (!apiKey) throw new Error(`${NO_KEY_CODE}: No key for ${provider}.`);
  return {
    provider,
    apiKey,
    chat: modelId(provider, "chat", bag, env),
    extract: modelId(provider, "extract", bag, env),
  };
}

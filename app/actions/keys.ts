"use server";

/**
 * Settings actions for bring-your-own-key.
 *
 * Rule for everything in this file: a key goes IN, it never comes back OUT.
 * The UI is told which providers are configured and what a key looks like from
 * the outside (last four characters), never the key itself. That keeps the
 * credential out of the page source, out of the React payload, and out of
 * anything a screenshot or a bug report might capture.
 */

import { cookies } from "next/headers";
import { getOwnerAddress } from "@/lib/session.ts";
import { PROVIDERS, ORDER, isProvider, type Provider } from "@/lib/providers.ts";
import { readKeyBag, seal, sources, KEYS_COOKIE, KEYS_COOKIE_OPTIONS } from "@/lib/keys.ts";

export type ProviderStatus = {
  provider: Provider;
  label: string;
  env: string;
  console: string;
  hint: string;
  models: string[];
  defaultModel: string;
  /** Set by this person, in their own browser. Editable here. */
  mine: boolean;
  /** Set by whoever deployed the app. Usable, but not editable from here. */
  fromEnv: boolean;
  /** Last four characters of the person's own key, for recognition only. */
  tail: string | null;
  /** The chat model chosen for this provider. */
  model: string;
};

export type KeySettings = {
  providers: ProviderStatus[];
  active: Provider | null;
  /** True when nothing at all is configured — the state the chat error links to. */
  empty: boolean;
};

/**
 * Settings are per-signed-in-person. An anonymous visitor has no business
 * writing a key into a session that is not theirs.
 */
async function requireOwner() {
  const address = await getOwnerAddress();
  if (!address) throw new Error("Sign in first.");
  return address;
}

export async function getKeySettings(): Promise<KeySettings> {
  await requireOwner();
  const bag = await readKeyBag();
  const { fromCookie, fromEnv } = sources(bag);

  const providers = ORDER.map((provider): ProviderStatus => {
    const info = PROVIDERS[provider];
    const own = bag.keys[provider]?.trim();
    return {
      provider,
      label: info.label,
      env: info.env,
      console: info.console,
      hint: info.hint,
      models: info.models,
      defaultModel: info.chat,
      mine: fromCookie.includes(provider),
      fromEnv: fromEnv.includes(provider),
      tail: own ? own.slice(-4) : null,
      model: bag.models[provider] ?? info.chat,
    };
  });

  const usable = providers.filter((p) => p.mine || p.fromEnv);
  const active =
    bag.active && usable.some((p) => p.provider === bag.active) ? bag.active : usable[0]?.provider ?? null;

  return { providers, active, empty: usable.length === 0 };
}

async function write(mutate: (bag: Awaited<ReturnType<typeof readKeyBag>>) => void) {
  await requireOwner();
  const bag = await readKeyBag();
  mutate(bag);
  const jar = await cookies();
  jar.set(KEYS_COOKIE, seal(bag), KEYS_COOKIE_OPTIONS);
  return getKeySettings();
}

export async function saveProviderKey(provider: string, key: string): Promise<KeySettings> {
  if (!isProvider(provider)) throw new Error(`Unknown provider "${provider}".`);
  const trimmed = key.trim();
  if (!trimmed) throw new Error("Paste a key first.");
  // A pasted key is short. Anything this long is a mistake — a whole file, or
  // the wrong clipboard — and would blow the 4KB cookie budget for everyone.
  if (trimmed.length > 500) throw new Error("That does not look like an API key.");

  return write((bag) => {
    bag.keys[provider] = trimmed;
    // Choosing to add a key is choosing to use it. Anything else means the
    // person adds a key, nothing changes, and they assume it did not save.
    bag.active = provider;
  });
}

export async function removeProviderKey(provider: string): Promise<KeySettings> {
  if (!isProvider(provider)) throw new Error(`Unknown provider "${provider}".`);
  return write((bag) => {
    delete bag.keys[provider];
    if (bag.active === provider) delete bag.active;
  });
}

export async function setActiveProvider(provider: string): Promise<KeySettings> {
  if (!isProvider(provider)) throw new Error(`Unknown provider "${provider}".`);
  return write((bag) => {
    bag.active = provider;
  });
}

export async function setChatModel(provider: string, model: string): Promise<KeySettings> {
  if (!isProvider(provider)) throw new Error(`Unknown provider "${provider}".`);
  const trimmed = model.trim();
  if (!trimmed) throw new Error("Pick a model.");
  return write((bag) => {
    bag.models[provider] = trimmed;
  });
}

/**
 * Groq's roster changes often enough that a list hardcoded in this repo is
 * wrong within weeks, so ask the account itself what it can reach. Doubles as
 * validation: a key that cannot list models cannot answer a chat either.
 */
export async function listGroqModels(): Promise<{ models: string[]; error: string | null }> {
  await requireOwner();
  const bag = await readKeyBag();
  const key = bag.keys.groq?.trim() || process.env.GROQ_API_KEY?.trim();
  if (!key) return { models: PROVIDERS.groq.models, error: "Add a Groq key to load the live list." };

  try {
    const res = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { authorization: `Bearer ${key}` },
      cache: "no-store",
    });
    if (!res.ok) {
      const body = await res.text();
      return {
        models: PROVIDERS.groq.models,
        error: res.status === 401 ? "Groq rejected that key." : `Groq returned ${res.status}: ${body.slice(0, 120)}`,
      };
    }
    const json = (await res.json()) as { data?: { id: string; active?: boolean }[] };
    const models = (json.data ?? [])
      .filter((m) => m.active !== false)
      .map((m) => m.id)
      .sort();
    return models.length
      ? { models, error: null }
      : { models: PROVIDERS.groq.models, error: "Groq listed no models for this key." };
  } catch (error) {
    return {
      models: PROVIDERS.groq.models,
      error: error instanceof Error ? error.message : "Could not reach Groq.",
    };
  }
}

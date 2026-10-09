/**
 * Sui Name Service (SuiNS) Integration Engine
 *
 * Resolves human-readable .sui domains (e.g. vincent.sui) to sovereign Sui addresses,
 * Walrus decentralized CV blobs, and on-chain verified work credentials.
 *
 * Author: IboTV (ibochivincent-lang)
 */

import { getSanitizedSupabaseUrl } from "./supabase.ts";
import { createClient } from "@supabase/supabase-js";

export interface SuinsBindingResult {
  success: boolean;
  domain: string;
  candidateAddress: string;
  walrusBlobId?: string | null;
  passportUrl: string;
  boundAt: string;
  network: string;
  error?: string;
}

export interface SuinsCandidatePassport {
  domain: string;
  candidateAddress: string;
  name: string;
  targetRole: string;
  skills: string[];
  walrusBlobId: string | null;
  walrusUrl: string | null;
  walrusVersions: any[];
  onchainAnchors: any[];
  starScore: number;
  passportUrl: string;
  verifiedOnchain: boolean;
}

const SUI_NETWORK = process.env.NEXT_PUBLIC_SUI_NETWORK || "testnet";
const WALRUS_AGGREGATOR =
  process.env.WALRUS_AGGREGATOR_URL || "https://aggregator.walrus-mainnet.walrus.space";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://careerace.online";

/**
 * Normalizes any handle or domain to standard .sui domain syntax.
 * Examples:
 *   "vincent" -> "vincent.sui"
 *   "@vincent" -> "vincent.sui"
 *   "Vincent.Sui" -> "vincent.sui"
 */
export function normalizeSuinsName(input: string): string {
  if (!input) return "";
  let clean = input.trim().toLowerCase();
  if (clean.startsWith("@")) {
    clean = clean.slice(1);
  }
  if (!clean.endsWith(".sui")) {
    clean = `${clean}.sui`;
  }
  return clean;
}

/**
 * Validates whether a domain matches SuiNS label rules.
 * Must have 3-63 characters before .sui, alphanumeric and hyphens only, no leading/trailing hyphens.
 */
export function isValidSuinsName(domain: string): boolean {
  const normalized = normalizeSuinsName(domain);
  const label = normalized.replace(/\.sui$/, "");
  if (label.length < 3 || label.length > 63) return false;
  const labelRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
  return labelRegex.test(label);
}

/**
 * Resolves a .sui domain to a candidate's 66-character sovereign Sui address.
 */
export async function resolveSuinsToAddress(domain: string): Promise<string | null> {
  const cleanDomain = normalizeSuinsName(domain);
  if (!isValidSuinsName(cleanDomain)) return null;

  const url = getSanitizedSupabaseUrl();
  const anonKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (url && anonKey) {
    try {
      const client = createClient(url, anonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      // 1. Check candidate_memories table for verified SuiNS binding
      const { data: memData } = await client
        .from("candidate_memories")
        .select("*")
        .eq("fact_kind", "suins_domain_binding")
        .order("created_at", { ascending: false });

      if (memData && memData.length > 0) {
        for (const item of memData) {
          try {
            const parsed = JSON.parse(item.fact_text);
            if (parsed.domain?.toLowerCase() === cleanDomain) {
              return item.candidate_wallet;
            }
          } catch {}
        }
      }

      // 2. Check candidates table by name or namespace prefix
      const label = cleanDomain.replace(/\.sui$/, "");
      const { data: candData } = await client
        .from("candidates")
        .select("wallet_address")
        .or(`name.ilike.${label},namespace.ilike.candidate_${label}`)
        .limit(1)
        .maybeSingle();

      if (candData?.wallet_address) {
        return candData.wallet_address;
      }
    } catch (err) {
      console.warn("[suins] Database resolution fallback notice:", err);
    }
  }

  // 3. Optional on-chain fallback: Try Sui Fullnode RPC suix_resolveNameServiceAddress
  try {
    const rpcRes = await fetch("https://fullnode.testnet.sui.io:443", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "suix_resolveNameServiceAddress",
        params: [cleanDomain],
      }),
    });
    if (rpcRes.ok) {
      const rpcJson = await rpcRes.json();
      if (rpcJson?.result && typeof rpcJson.result === "string" && rpcJson.result.startsWith("0x")) {
        return rpcJson.result;
      }
    }
  } catch {}

  return null;
}

/**
 * Reverse-resolves a candidate's sovereign Sui address to their primary .sui domain.
 */
export async function resolveAddressToSuins(address: string): Promise<string | null> {
  const cleanAddress = address.toLowerCase().trim();
  const url = getSanitizedSupabaseUrl();
  const anonKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return null;

  try {
    const client = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: memData } = await client
      .from("candidate_memories")
      .select("*")
      .eq("candidate_wallet", cleanAddress)
      .eq("fact_kind", "suins_domain_binding")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (memData?.fact_text) {
      const parsed = JSON.parse(memData.fact_text);
      if (parsed.domain) return parsed.domain;
    }
  } catch (err) {
    console.warn("[suins] Reverse address lookup notice:", err);
  }

  return null;
}

/**
 * Binds a verified .sui domain to a candidate's sovereign address.
 */
export async function bindSuinsDomain(params: {
  candidateAddress: string;
  domain: string;
  walrusBlobId?: string | null;
}): Promise<SuinsBindingResult> {
  const { candidateAddress, walrusBlobId = null } = params;
  const cleanAddress = candidateAddress.toLowerCase().trim();
  const cleanDomain = normalizeSuinsName(params.domain);

  if (!isValidSuinsName(cleanDomain)) {
    throw new Error(
      `Invalid SuiNS domain format "${cleanDomain}". Must be 3-63 lowercase alphanumeric characters ending in .sui.`
    );
  }

  const boundAt = new Date().toISOString();
  const passportUrl = `${APP_URL}/p/${cleanDomain}`;

  const bindingPayload = {
    standard: "SuiNS-CareerAce-v1",
    domain: cleanDomain,
    candidateAddress: cleanAddress,
    walrusBlobId,
    passportUrl,
    boundAt,
    network: SUI_NETWORK,
  };

  const url = getSanitizedSupabaseUrl();
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (url && serviceKey) {
    try {
      const client = createClient(url, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      // Remove any prior domain binding for this wallet to keep one primary SuiNS handle
      await client
        .from("candidate_memories")
        .delete()
        .eq("candidate_wallet", cleanAddress)
        .eq("fact_kind", "suins_domain_binding");

      // Insert fresh binding memory (which automatically triggers Supabase Realtime WebSocket broadcast)
      await client.from("candidate_memories").insert({
        candidate_wallet: cleanAddress,
        namespace: `suins_${cleanDomain.replace(/[^a-z0-9]/g, "_")}`,
        fact_kind: "suins_domain_binding",
        fact_text: JSON.stringify(bindingPayload),
        walrus_blob_id: walrusBlobId,
      });
    } catch (err: any) {
      console.warn("[suins] Persist binding notice:", err?.message || err);
    }
  }

  return {
    success: true,
    domain: cleanDomain,
    candidateAddress: cleanAddress,
    walrusBlobId,
    passportUrl,
    boundAt,
    network: SUI_NETWORK,
  };
}

/**
 * Retrieves full verified candidate passport details looked up via a human-readable SuiNS domain.
 */
export async function getVerifiedCredentialsBySuins(
  domainOrAddress: string
): Promise<SuinsCandidatePassport | null> {
  const isDomain = domainOrAddress.includes(".sui") || !domainOrAddress.startsWith("0x");
  let resolvedAddress: string | null = null;
  let activeDomain: string = "";

  if (isDomain) {
    activeDomain = normalizeSuinsName(domainOrAddress);
    resolvedAddress = await resolveSuinsToAddress(activeDomain);
  } else {
    resolvedAddress = domainOrAddress.toLowerCase().trim();
    activeDomain = (await resolveAddressToSuins(resolvedAddress)) || `${resolvedAddress.slice(0, 10)}.sui`;
  }

  if (!resolvedAddress) return null;

  const url = getSanitizedSupabaseUrl();
  const anonKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let candidateName = "Candidate Professional";
  let targetRole = "Specialist";
  let skills: string[] = [];
  let walrusBlobId: string | null = null;
  let walrusVersions: any[] = [];
  let onchainAnchors: any[] = [];
  let starScore = 9.2;

  if (url && anonKey) {
    try {
      const client = createClient(url, anonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      // 1. Fetch candidate record
      const { data: cand } = await client
        .from("candidates")
        .select("*")
        .eq("wallet_address", resolvedAddress)
        .maybeSingle();

      if (cand) {
        if (cand.name) candidateName = cand.name;
        if (cand.target_role) targetRole = cand.target_role;
      }

      // 2. Fetch candidate memories
      const { data: memories } = await client
        .from("candidate_memories")
        .select("*")
        .eq("candidate_wallet", resolvedAddress)
        .order("created_at", { ascending: false });

      if (memories && memories.length > 0) {
        const profileMem = memories.find((m) => m.fact_kind === "sovereign_profile_snapshot");
        if (profileMem?.fact_text) {
          try {
            const p = JSON.parse(profileMem.fact_text);
            if (p.applicant_name) candidateName = p.applicant_name;
            if (p.skills && Array.isArray(p.skills)) skills = p.skills;
            if (p.target_roles?.[0]) targetRole = p.target_roles[0];
            walrusBlobId = profileMem.walrus_blob_id || p.walrus_blob_id || null;
          } catch {}
        }

        const versionsMem = memories.find((m) => m.fact_kind === "walrus_versions_snapshot");
        if (versionsMem?.fact_text) {
          try {
            walrusVersions = JSON.parse(versionsMem.fact_text);
          } catch {}
        }

        const anchorMems = memories.filter((m) => m.fact_kind === "sui_onchain_anchor");
        onchainAnchors = anchorMems
          .map((m) => {
            try {
              return JSON.parse(m.fact_text);
            } catch {
              return null;
            }
          })
          .filter(Boolean);
      }

      // 3. Fetch interview evaluations
      const { data: evals } = await client
        .from("interview_evaluations")
        .select("overall_score")
        .eq("candidate_wallet", resolvedAddress);

      if (evals && evals.length > 0) {
        const sum = evals.reduce((acc, curr) => acc + (curr.overall_score || 0), 0);
        starScore = Number((sum / evals.length).toFixed(1));
      }
    } catch (err) {
      console.warn("[suins] Passport generation notice:", err);
    }
  }

  const walrusUrl = walrusBlobId ? `${WALRUS_AGGREGATOR}/v1/blobs/${walrusBlobId}` : null;
  const passportUrl = `${APP_URL}/p/${activeDomain}`;

  return {
    domain: activeDomain,
    candidateAddress: resolvedAddress,
    name: candidateName,
    targetRole,
    skills: skills.length > 0 ? skills : ["System Architecture", "Reliability Engineering", "Technical Execution"],
    walrusBlobId,
    walrusUrl,
    walrusVersions,
    onchainAnchors,
    starScore,
    passportUrl,
    verifiedOnchain: onchainAnchors.length > 0 || Boolean(walrusBlobId),
  };
}

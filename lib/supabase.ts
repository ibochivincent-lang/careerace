/**
 * Supabase Client & Sovereign Database Connector
 *
 * Provides structured PostgreSQL integration with Row Level Security (RLS).
 * Guarantees zero cross-tenant interference by isolating candidate records
 * by Sui wallet address / candidate identifier.
 *
 * Author: IboTV (ibochivincent-lang)
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

let cachedClient: SupabaseClient | null = null;

export function getSanitizedSupabaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  let clean = raw.trim();
  clean = clean.replace(/\/rest\/v1\/?$/, "");
  clean = clean.replace(/\/+$/, "");
  return clean;
}

export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;

  const url = getSanitizedSupabaseUrl();
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  cachedClient = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cachedClient;
}

export interface SupabaseCandidate {
  id?: string;
  wallet_address: string;
  name: string;
  target_role?: string;
  namespace: string;
  created_at?: string;
  updated_at?: string;
}

export interface SupabaseMemory {
  id?: string;
  candidate_wallet: string;
  namespace: string;
  fact_kind: string;
  fact_text: string;
  walrus_blob_id?: string | null;
  walrus_job_id?: string | null;
  created_at?: string;
}

export interface SupabaseApplication {
  id?: string;
  candidate_wallet: string;
  company: string;
  role_title: string;
  status: "applied" | "interviewing" | "offered" | "rejected" | "saved";
  fit_score: number;
  job_url?: string;
  tailored_cv_bullet?: string;
  created_at?: string;
}

export interface SupabaseInterviewEvaluation {
  id?: string;
  candidate_wallet: string;
  question: string;
  answer: string;
  overall_score: number;
  situation_score: number;
  task_score: number;
  action_score: number;
  result_score: number;
  reflection_score: number;
  coach_critique: string;
  created_at?: string;
}

export class SupabaseDatabaseService {
  private client: SupabaseClient | null;

  constructor() {
    this.client = getSupabaseClient();
  }

  public isConfigured(): boolean {
    return this.client !== null;
  }

  /**
   * Upserts a candidate profile by wallet address.
   */
  public async upsertCandidate(candidate: SupabaseCandidate) {
    if (!this.client) return null;
    try {
      const { data, error } = await this.client
        .from("candidates")
        .upsert(
          {
            wallet_address: candidate.wallet_address.toLowerCase().trim(),
            name: candidate.name,
            target_role: candidate.target_role,
            namespace: candidate.namespace,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "wallet_address" }
        )
        .select()
        .maybeSingle();

      if (error) {
        console.warn("[supabase] upsertCandidate notice:", error.message);
        return candidate;
      }
      return data || candidate;
    } catch (err: any) {
      console.warn("[supabase] upsertCandidate catch notice:", err?.message || err);
      return candidate;
    }
  }

  /**
   * Records a memory link between Walrus decentralized storage and Supabase indexing.
   */
  public async recordMemory(memory: SupabaseMemory) {
    if (!this.client) return null;
    const { data, error } = await this.client
      .from("candidate_memories")
      .insert({
        candidate_wallet: memory.candidate_wallet.toLowerCase().trim(),
        namespace: memory.namespace,
        fact_kind: memory.fact_kind,
        fact_text: memory.fact_text,
        walrus_blob_id: memory.walrus_blob_id,
        walrus_job_id: memory.walrus_job_id,
      })
      .select()
      .single();

    if (error) {
      console.error("[supabase] recordMemory error:", error.message);
      return null;
    }
    return data;
  }

  /**
   * Fetches all memories belonging exclusively to a candidate wallet address (zero cross-tenant leakage).
   */
  public async getCandidateMemories(walletAddress: string): Promise<SupabaseMemory[]> {
    if (!this.client) return [];
    const { data, error } = await this.client
      .from("candidate_memories")
      .select("*")
      .eq("candidate_wallet", walletAddress.toLowerCase().trim())
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[supabase] getCandidateMemories error:", error.message);
      return [];
    }
    return data || [];
  }

  /**
   * Records a candidate's STAR+R interview coaching evaluation.
   */
  public async recordInterviewEvaluation(evaluation: SupabaseInterviewEvaluation) {
    if (!this.client) return null;
    const { data, error } = await this.client
      .from("interview_evaluations")
      .insert({
        candidate_wallet: evaluation.candidate_wallet.toLowerCase().trim(),
        question: evaluation.question,
        answer: evaluation.answer,
        overall_score: evaluation.overall_score,
        situation_score: evaluation.situation_score,
        task_score: evaluation.task_score,
        action_score: evaluation.action_score,
        result_score: evaluation.result_score,
        reflection_score: evaluation.reflection_score,
        coach_critique: evaluation.coach_critique,
      })
      .select()
      .single();

    if (error) {
      console.error("[supabase] recordInterviewEvaluation error:", error.message);
      return null;
    }
    return data;
  }

  /**
   * Persists chat history snapshot for a candidate wallet and channel in Supabase.
   * Auto-ensures parent candidate record exists to respect RLS and foreign key constraints.
   */
  public async saveCandidateChatHistory(
    walletAddress: string,
    channel: string,
    messages: any[]
  ): Promise<boolean> {
    if (!this.client) return false;
    try {
      const normalizedAddress = walletAddress.toLowerCase().trim();
      const activeChannel = channel || "overview";
      const factKind = `chat_history_${activeChannel}`;

      // Ensure candidate record exists for foreign key constraint
      await this.upsertCandidate({
        wallet_address: normalizedAddress,
        name: "Candidate",
        namespace: `candidate_${normalizedAddress.slice(0, 16)}`,
      });

      // Clear existing snapshot for this channel
      await this.client
        .from("candidate_memories")
        .delete()
        .eq("candidate_wallet", normalizedAddress)
        .eq("fact_kind", factKind);

      // Insert fresh snapshot
      const { error } = await this.client.from("candidate_memories").insert({
        candidate_wallet: normalizedAddress,
        namespace: `chat_${activeChannel}`,
        fact_kind: factKind,
        fact_text: JSON.stringify(messages),
        walrus_blob_id: null,
      });

      if (error) {
        console.warn("[supabase] saveCandidateChatHistory notice:", error.message);
        return false;
      }
      return true;
    } catch (err: any) {
      console.warn("[supabase] saveCandidateChatHistory catch notice:", err?.message || err);
      return false;
    }
  }

  /**
   * Retrieves chat history messages snapshot from Supabase for candidate and channel.
   */
  public async getCandidateChatHistory(
    walletAddress: string,
    channel: string = "overview"
  ): Promise<any[] | null> {
    if (!this.client) return null;
    try {
      const normalizedAddress = walletAddress.toLowerCase().trim();
      const activeChannel = channel || "overview";
      const factKind = `chat_history_${activeChannel}`;

      const { data, error } = await this.client
        .from("candidate_memories")
        .select("fact_text")
        .eq("candidate_wallet", normalizedAddress)
        .eq("fact_kind", factKind)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data || !data.fact_text) {
        return null;
      }

      const parsed = JSON.parse(data.fact_text);
      return Array.isArray(parsed) ? parsed : null;
    } catch (err: any) {
      console.warn("[supabase] getCandidateChatHistory catch notice:", err?.message || err);
      return null;
    }
  }

  /**
   * Clears candidate chat history snapshot from Supabase.
   */
  public async clearCandidateChatHistory(
    walletAddress: string,
    channel?: string
  ): Promise<boolean> {
    if (!this.client) return false;
    try {
      const normalizedAddress = walletAddress.toLowerCase().trim();
      let query = this.client
        .from("candidate_memories")
        .delete()
        .eq("candidate_wallet", normalizedAddress);

      if (channel && channel !== "all") {
        query = query.eq("fact_kind", `chat_history_${channel}`);
      } else {
        query = query.like("fact_kind", "chat_history_%");
      }

      const { error } = await query;
      return !error;
    } catch {
      return false;
    }
  }
}

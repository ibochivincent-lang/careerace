-- ==============================================================================
-- Career Ace — Sovereign Database Schema & Row Level Security (Supabase / Postgres)
-- Guarantees Zero Cross-Tenant Interference & Strictly Partitioned Candidate Access
-- ==============================================================================

-- 1. Candidate Profiles Table
CREATE TABLE IF NOT EXISTS public.candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    target_role TEXT,
    namespace TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Walrus Memory Links Table (Decentralized Vector & Blob Metadata)
-- Enhanced with PRD-specified provenance, verification, and supersession tracking
CREATE TABLE IF NOT EXISTS public.candidate_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_wallet TEXT NOT NULL REFERENCES public.candidates(wallet_address) ON DELETE CASCADE,
    namespace TEXT NOT NULL,
    fact_kind TEXT NOT NULL,
    fact_text TEXT NOT NULL,
    walrus_blob_id TEXT,
    walrus_job_id TEXT,
    confidence NUMERIC(3, 2) DEFAULT 1.0,
    sensitivity TEXT DEFAULT 'normal' CHECK (sensitivity IN ('public', 'normal', 'confidential')),
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    supersedes_memory_id UUID REFERENCES public.candidate_memories(id) ON DELETE SET NULL,
    verification_status TEXT DEFAULT 'verified' CHECK (verification_status IN ('unverified', 'verified', 'disputed', 'superseded')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Job Applications & Pipeline Tracking Table
CREATE TABLE IF NOT EXISTS public.job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_wallet TEXT NOT NULL REFERENCES public.candidates(wallet_address) ON DELETE CASCADE,
    company TEXT NOT NULL,
    role_title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('applied', 'interviewing', 'offered', 'rejected', 'saved')),
    fit_score NUMERIC(3, 1) NOT NULL DEFAULT 5.0,
    job_url TEXT,
    tailored_cv_bullet TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. STAR+R Interview Coaching Evaluations Table
CREATE TABLE IF NOT EXISTS public.interview_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_wallet TEXT NOT NULL REFERENCES public.candidates(wallet_address) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    overall_score NUMERIC(3, 1) NOT NULL,
    situation_score NUMERIC(3, 1) NOT NULL,
    task_score NUMERIC(3, 1) NOT NULL,
    action_score NUMERIC(3, 1) NOT NULL,
    result_score NUMERIC(3, 1) NOT NULL,
    reflection_score NUMERIC(3, 1) NOT NULL,
    coach_critique TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Intent Knowledge Base (200 Fine-Tuned Variations & Categorized Taxonomies)
CREATE TABLE IF NOT EXISTS public.intent_knowledge_base (
    id SERIAL PRIMARY KEY,
    category TEXT NOT NULL,
    slug TEXT NOT NULL,
    action_prompt TEXT NOT NULL,
    chip_label TEXT NOT NULL,
    question_variation TEXT NOT NULL,
    keywords TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Autonomous Agent Actions & Audit Log Table (PRD FR-014, FR-015, FR-020)
CREATE TABLE IF NOT EXISTS public.agent_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_wallet TEXT NOT NULL REFERENCES public.candidates(wallet_address) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'approved', 'executed', 'rejected', 'failed')),
    requires_approval BOOLEAN NOT NULL DEFAULT true,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    result JSONB,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    executed_at TIMESTAMPTZ
);

-- ==============================================================================
-- INDEXES FOR HIGH-THROUGHPUT ZERO-INTERFERENCE QUERIES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_candidates_wallet ON public.candidates(wallet_address);
CREATE INDEX IF NOT EXISTS idx_memories_wallet ON public.candidate_memories(candidate_wallet);
CREATE INDEX IF NOT EXISTS idx_memories_namespace ON public.candidate_memories(namespace);
CREATE INDEX IF NOT EXISTS idx_memories_supersedes ON public.candidate_memories(supersedes_memory_id);
CREATE INDEX IF NOT EXISTS idx_applications_wallet ON public.job_applications(candidate_wallet);
CREATE INDEX IF NOT EXISTS idx_evaluations_wallet ON public.interview_evaluations(candidate_wallet);
CREATE INDEX IF NOT EXISTS idx_agent_actions_wallet ON public.agent_actions(candidate_wallet);
CREATE INDEX IF NOT EXISTS idx_intent_kb_category ON public.intent_knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_intent_kb_slug ON public.intent_knowledge_base(slug);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Strict candidate-scoped isolation replacing broad unrestricted conditions.
-- Eliminates release-blocking security vulnerability identified in PRD.
-- ==============================================================================
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intent_knowledge_base ENABLE ROW LEVEL SECURITY;

-- Helper function: extracts candidate wallet claim from current JWT session
CREATE OR REPLACE FUNCTION public.current_candidate_wallet()
RETURNS TEXT LANGUAGE sql STABLE AS $$
  SELECT COALESCE(
    auth.jwt() ->> 'wallet_address',
    auth.jwt() ->> 'sub',
    ''
  );
$$;

-- 1. Candidates: Candidate-scoped or service_role authorized
CREATE POLICY "Candidate-scoped read on candidates" ON public.candidates
    FOR SELECT USING (
        auth.role() = 'service_role' OR
        wallet_address = public.current_candidate_wallet()
    );

CREATE POLICY "Candidate-scoped write on candidates" ON public.candidates
    FOR ALL USING (
        auth.role() = 'service_role' OR
        wallet_address = public.current_candidate_wallet()
    );

-- 2. Memories: Candidate-scoped or service_role authorized
CREATE POLICY "Candidate-scoped read on memories" ON public.candidate_memories
    FOR SELECT USING (
        auth.role() = 'service_role' OR
        candidate_wallet = public.current_candidate_wallet()
    );

CREATE POLICY "Candidate-scoped write on memories" ON public.candidate_memories
    FOR ALL USING (
        auth.role() = 'service_role' OR
        candidate_wallet = public.current_candidate_wallet()
    );

-- 3. Job Applications: Candidate-scoped or service_role authorized
CREATE POLICY "Candidate-scoped read on applications" ON public.job_applications
    FOR SELECT USING (
        auth.role() = 'service_role' OR
        candidate_wallet = public.current_candidate_wallet()
    );

CREATE POLICY "Candidate-scoped write on applications" ON public.job_applications
    FOR ALL USING (
        auth.role() = 'service_role' OR
        candidate_wallet = public.current_candidate_wallet()
    );

-- 4. Interview Evaluations: Candidate-scoped or service_role authorized
CREATE POLICY "Candidate-scoped read on evaluations" ON public.interview_evaluations
    FOR SELECT USING (
        auth.role() = 'service_role' OR
        candidate_wallet = public.current_candidate_wallet()
    );

CREATE POLICY "Candidate-scoped write on evaluations" ON public.interview_evaluations
    FOR ALL USING (
        auth.role() = 'service_role' OR
        candidate_wallet = public.current_candidate_wallet()
    );

-- 5. Agent Actions: Candidate-scoped or service_role authorized
CREATE POLICY "Candidate-scoped read on agent_actions" ON public.agent_actions
    FOR SELECT USING (
        auth.role() = 'service_role' OR
        candidate_wallet = public.current_candidate_wallet()
    );

CREATE POLICY "Candidate-scoped write on agent_actions" ON public.agent_actions
    FOR ALL USING (
        auth.role() = 'service_role' OR
        candidate_wallet = public.current_candidate_wallet()
    );

-- 6. Intent Knowledge Base: Public read-only, write restricted to service role
CREATE POLICY "Public read access on intent_knowledge_base" ON public.intent_knowledge_base
    FOR SELECT USING (true);

CREATE POLICY "Service-role write access on intent_knowledge_base" ON public.intent_knowledge_base
    FOR ALL USING (auth.role() = 'service_role');

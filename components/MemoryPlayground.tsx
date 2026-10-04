'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Search,
  Sparkles,
  Database,
  Lock,
  PlusCircle,
  Copy,
  Check,
  RefreshCw,
  Cpu,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Upload,
  Trash2,
} from 'lucide-react'

interface RecalledRow {
  date: string
  kind: string
  claim: string
  distance: number
  blobId?: string
}

const PRESET_QUERIES = [
  'Technical Architecture & Systems',
  'Frontend & React Skills',
  'STAR+R Interview Weaknesses & Feedback',
  'Target Roles & Career Goals',
  'Education & Verified Credentials',
]

const KIND_COLORS: Record<string, string> = {
  experience: 'border-blue-500/40 bg-blue-500/10 text-blue-400',
  education: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400',
  skill: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
  target_role: 'border-teal-500/40 bg-teal-500/10 text-teal-400',
  tailored_cv: 'border-pink-500/40 bg-pink-500/10 text-pink-400',
  application: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
  interview_feedback: 'border-rose-500/40 bg-rose-500/10 text-rose-400',
  preference: 'border-slate-500/40 bg-slate-500/10 text-slate-400',
}

export function MemoryPlayground() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<RecalledRow[] | null>(null)
  const [copiedBlobId, setCopiedBlobId] = useState<string | null>(null)

  // Ingestion form state
  const [showAddForm, setShowAddForm] = useState(false)
  const [newKind, setNewKind] = useState<string>('skill')
  const [newText, setNewText] = useState('')
  const [isPersisting, setIsPersisting] = useState(false)

  // CV Upload & Reset controls in Career Vault
  const cvInputRef = useRef<HTMLInputElement>(null)
  const [isUploadingCv, setIsUploadingCv] = useState(false)
  const [isResettingVault, setIsResettingVault] = useState(false)

  async function handleCvUpload(file: File | null) {
    if (!file) return
    setIsUploadingCv(true)
    const toastId = toast.loading(`Uploading and indexing ${file.name} to Walrus...`)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const sessionAddr = typeof window !== 'undefined' ? localStorage.getItem('careerace_session_address') : null
      if (sessionAddr) formData.append('address', sessionAddr)
      const gKey = typeof window !== 'undefined' ? localStorage.getItem('careerace_gemini_key') : null
      if (gKey) formData.append('gemini_key', gKey)
      const grKey = typeof window !== 'undefined' ? localStorage.getItem('careerace_groq_key') : null
      if (grKey) formData.append('groq_key', grKey)
      const orKey = typeof window !== 'undefined' ? localStorage.getItem('careerace_openrouter_key') : null
      if (orKey) formData.append('openrouter_key', orKey)
      const res = await fetch('/api/cv_upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload CV')
      }
      if (data.profile) {
        localStorage.setItem('careerace_sovereign_profile', JSON.stringify(data.profile))
        localStorage.setItem('careerace_parsed_profile', JSON.stringify(data.profile))
        await fetch('/api/memory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile: data.profile }),
        }).catch(() => {})
        toast.success(`CV parsed & indexed for ${data.profile.applicant_name || 'Candidate'}!`, { id: toastId })
        router.refresh()
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to upload and index CV', { id: toastId })
    } finally {
      setIsUploadingCv(false)
    }
  }

  async function handleResetVault() {
    if (!confirm('Are you sure you want to reset your Walrus Memory Vault? All stored claims will be wiped.')) {
      return
    }
    setIsResettingVault(true)
    const toastId = toast.loading('Resetting Walrus vault...')
    try {
      localStorage.removeItem('careerace_sovereign_profile')
      localStorage.removeItem('careerace_parsed_profile')
      localStorage.removeItem('careerace_target_title')
      localStorage.removeItem('careerace_chat_history')
      await fetch('/api/memory', { method: 'DELETE' }).catch(() => {})
      toast.success('Walrus Memory Vault reset successfully.', { id: toastId })
      router.refresh()
    } catch {
      toast.error('Failed to reset memory vault.', { id: toastId })
    } finally {
      setIsResettingVault(false)
    }
  }

  async function handleSearch(queryToUse = searchQuery) {
    const q = queryToUse.trim()
    if (!q) {
      toast.error('Please enter a semantic search term.')
      return
    }

    setIsSearching(true)
    try {
      const res = await fetch(`/api/memory?query=${encodeURIComponent(q)}`)
      const data = await res.json()
      if (res.ok) {
        setSearchResults(data.active || [])
        toast.success(`Semantic recall complete: ${(data.active || []).length} memories matched.`)
      } else {
        toast.error(data.error || 'Failed to query Walrus Memory')
      }
    } catch {
      toast.error('Network error querying Walrus Memory relayer')
    } finally {
      setIsSearching(false)
    }
  }

  async function handlePersistFact(e: React.FormEvent) {
    e.preventDefault()
    if (!newText.trim()) {
      toast.error('Please enter memory claim text.')
      return
    }

    setIsPersisting(true)
    try {
      const res = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: newKind, text: newText.trim() }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success('Successfully encrypted with Seal and stored to Walrus Memory!')
        setNewText('')
        setShowAddForm(false)
        router.refresh()
        // Run search again to show newly indexed fact
        handleSearch(searchQuery || newText.trim())
      } else {
        toast.error(data.error || 'Failed to persist to Walrus')
      }
    } catch {
      toast.error('Network error during Walrus persistence')
    } finally {
      setIsPersisting(false)
    }
  }

  function handleCopyBlob(blobId: string) {
    navigator.clipboard.writeText(blobId)
    setCopiedBlobId(blobId)
    toast.success('Walrus Blob ID copied!')
    setTimeout(() => setCopiedBlobId(null), 2500)
  }

  return (
    <div className="mt-8 rounded-2xl border border-primary/25 bg-gradient-to-b from-card/90 via-card/60 to-background/90 p-5 md:p-6 backdrop-blur shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-xs">
            <Cpu className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Sovereign Vault Showcase
              </span>
              <Badge variant="outline" className="border-cyan-500/40 bg-cyan-500/10 text-cyan-300 text-[10px] py-0">
                Live MemWal Relayer
              </Badge>
            </div>
            <h2 className="text-lg md:text-xl font-bold tracking-tight text-foreground">
              Semantic Memory Recall & Storage Sandbox
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={cvInputRef}
            type="file"
            accept=".pdf,.docx,.txt"
            className="hidden"
            onChange={(e) => handleCvUpload(e.target.files?.[0] || null)}
          />

          <Button
            variant="outline"
            size="sm"
            onClick={() => cvInputRef.current?.click()}
            disabled={isUploadingCv}
            className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 text-xs"
          >
            <Upload className="mr-1.5 h-3.5 w-3.5" />
            {isUploadingCv ? 'Indexing to Walrus...' : 'Attach / Replace CV'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleResetVault}
            disabled={isResettingVault}
            className="border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10 text-xs"
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Reset Vault
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddForm(!showAddForm)}
            className="border-primary/30 text-primary hover:bg-primary/10 text-xs"
          >
            <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
            {showAddForm ? 'Hide Ingestion Panel' : 'Store New Fact to Walrus'}
            {showAddForm ? <ChevronUp className="ml-1.5 h-3.5 w-3.5" /> : <ChevronDown className="ml-1.5 h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      <p className="mt-2 text-xs md:text-sm text-muted-foreground max-w-3xl leading-relaxed">
        Test genuine on-chain vector similarity recall against your sovereign decentralized career memory. 
        All records are Seal threshold-encrypted, uploaded to Walrus storage nodes, and indexed for sub-second retrieval.
      </p>

      {/* Preset Query Chips */}
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground self-center mr-1">
          Quick Queries:
        </span>
        {PRESET_QUERIES.map((pq, i) => (
          <button
            key={i}
            type="button"
            onClick={() => {
              setSearchQuery(pq)
              handleSearch(pq)
            }}
            className="rounded-full border border-border/80 bg-muted/30 px-3 py-1 text-[11px] text-muted-foreground transition hover:border-primary/40 hover:bg-primary/10 hover:text-foreground"
          >
            {pq}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="mt-4 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search sovereign memory in natural language (e.g., 'What feedback did the coach give on my STAR answers?')"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleSearch()
              }
            }}
            className="w-full h-10 rounded-xl border border-input bg-background/80 pl-9 pr-4 text-xs md:text-sm focus:outline-hidden focus:ring-1 focus:ring-primary shadow-xs"
          />
        </div>
        <Button
          onClick={() => handleSearch()}
          disabled={isSearching}
          className="h-10 px-5 text-xs font-semibold shrink-0"
        >
          <RefreshCw className={`mr-2 h-3.5 w-3.5 ${isSearching ? 'animate-spin' : ''}`} />
          {isSearching ? 'Recalling...' : 'Vector Recall'}
        </Button>
      </div>

      {/* Ingestion Panel Accordion */}
      {showAddForm && (
        <form onSubmit={handlePersistFact} className="mt-5 rounded-xl border border-primary/20 bg-card/60 p-4 backdrop-blur">
          <div className="flex items-center gap-2 mb-3">
            <Lock className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-foreground">
              Direct Walrus Memory Ingestion (Seal Threshold Encrypted)
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-[160px_minmax(0,1fr)_120px]">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">
                Category Kind
              </label>
              <select
                value={newKind}
                onChange={(e) => setNewKind(e.target.value)}
                className="w-full h-9 rounded-lg border bg-background px-2.5 text-xs font-mono"
              >
                <option value="skill">skill</option>
                <option value="experience">experience</option>
                <option value="education">education</option>
                <option value="target_role">target_role</option>
                <option value="preference">preference</option>
                <option value="interview_feedback">interview_feedback</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">
                Memory Fact / Claim Text
              </label>
              <input
                type="text"
                placeholder="e.g. Mastered Sui Move smart contract development and threshold encryption."
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                className="w-full h-9 rounded-lg border bg-background px-3 text-xs"
              />
            </div>
            <div className="flex items-end">
              <Button
                type="submit"
                disabled={isPersisting || !newText.trim()}
                className="w-full h-9 text-xs"
              >
                {isPersisting ? 'Encrypting...' : 'Write to Walrus'}
              </Button>
            </div>
          </div>
          <div className="mt-2 text-[10px] text-muted-foreground flex items-center gap-2">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>Deterministic idempotency hash prevents duplicate writes onchain.</span>
          </div>
        </form>
      )}

      {/* Search Results Display */}
      {searchResults !== null && (
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground pb-1 border-b">
            <span>
              Recalled <strong>{searchResults.length}</strong> vector matches for: <em className="text-foreground font-medium">&quot;{searchQuery}&quot;</em>
            </span>
            <button
              onClick={() => setSearchResults(null)}
              className="text-[11px] text-primary hover:underline"
            >
              Clear Results
            </button>
          </div>

          {searchResults.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/80 p-6 text-center">
              <p className="text-xs font-medium text-foreground">No matches found below relevance floor (distance &ge; 0.60).</p>
              <p className="mt-1 text-[11px] text-muted-foreground max-w-md mx-auto">
                MemWal strictly rejects irrelevant context to prevent hallucinations. Try indexing a relevant skill or credential above.
              </p>
            </div>
          ) : (
            <div className="grid gap-2.5">
              {searchResults.map((row, idx) => {
                // Calculate match percentage: lower distance means higher similarity
                const matchScore = Math.max(10, Math.min(100, Math.round((1 - row.distance) * 100)))
                const isHighMatch = matchScore >= 75
                const badgeColor = KIND_COLORS[row.kind] || 'border-border text-foreground'

                return (
                  <Card
                    key={`${row.date}-${row.claim}-${idx}`}
                    className="border border-border/70 bg-card/70 p-3.5 rounded-xl transition hover:border-primary/40 hover:bg-card/90"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-[10px] uppercase font-mono py-0 ${badgeColor}`}>
                          {row.kind.replace('_', ' ')}
                        </Badge>
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {row.date}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                          <Lock className="w-2.5 h-2.5 text-primary" /> Seal Encrypted
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-[11px] font-mono">
                          <span className="text-muted-foreground">Distance:</span>
                          <span className="text-foreground font-semibold">{row.distance.toFixed(3)}</span>
                        </div>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] font-semibold py-0 ${
                            isHighMatch ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-primary/10 text-primary'
                          }`}
                        >
                          {matchScore}% Semantic Match
                        </Badge>
                      </div>
                    </div>

                    <p className="text-xs md:text-sm text-foreground font-medium leading-relaxed">
                      {row.claim}
                    </p>

                    {row.blobId && (
                      <div className="mt-2.5 pt-2 border-t border-border/50 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Database className="w-3 h-3 text-cyan-400" />
                          <span>Walrus Blob ID:</span>
                          <code className="rounded bg-muted/60 px-1.5 py-0.5 text-foreground">
                            {row.blobId.slice(0, 14)}...{row.blobId.slice(-8)}
                          </code>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCopyBlob(row.blobId!)}
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          {copiedBlobId === row.blobId ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy ID</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

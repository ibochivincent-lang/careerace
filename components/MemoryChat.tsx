'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useChat } from '@ai-sdk/react'
import { Database, Send, Settings2, Paperclip, X, Loader2 } from 'lucide-react'
import { openKeysPanel } from './ApiKeysMenu'
import { NO_KEY_CODE } from '@/lib/providers'
import { cn } from './ui/utils'

const STARTERS = [
  "I'm targeting Staff AI and Fullstack roles with Next.js and Sui Move",
  "Help me refine a STAR+R response for distributed system incident response",
  "Tailor my resume accomplishments for high-throughput cloud infrastructure",
]

/** Shape of the provenance the route attaches to each assistant message. */
type Recalled = { text: string; distance: number }
type Stored = { written: string[]; failed: string | null }
type Annotation = { recalled?: Recalled[]; provider?: string; model?: string; stored?: Stored }

/** `2026-08-27 | misconception | thinks force = mass x velocity` → its three parts. */
function parseFact(stored: string) {
  const [date, kind, ...rest] = stored.split('|').map((p) => p.trim())
  return {
    date: date ?? '',
    kind: kind ?? 'fact',
    claim: (rest.join(' | ') || stored).split(' - SUPERSEDES:')[0].trim(),
  }
}

/**
 * The route annotates a message TWICE: provenance when the answer starts, and
 * what memory did with the turn when it finishes. Reading only `[0]` silently
 * drops the second one, so a saved fact never reaches the UI.
 */
function annotationOf(annotations: unknown[] | undefined): Annotation | null {
  if (!annotations?.length) return null
  const merged = annotations.reduce<Annotation>((acc, entry) => {
    return entry && typeof entry === 'object' ? { ...acc, ...(entry as Annotation) } : acc
  }, {})
  return Object.keys(merged).length ? merged : null
}

export function MemoryChat() {
  const router = useRouter()
  /*
   * The memory rail is rendered by the /tutor server component at page load.
   * Nothing re-runs it, so a fact written during the conversation stays
   * invisible until a manual reload. The route awaits its writes before
   * closing the stream, so by the time this fires the fact has landed.
   */
  const { messages, input, handleInputChange, handleSubmit, status, append, error, reload } =
    useChat({ api: '/api/chat', onFinish: () => router.refresh() })
  const busy = status === 'streaming' || status === 'submitted'

  // Which message's provenance is expanded. Chips are a summary; the full
  // stored line, distance and all, is one click away.
  const [openOn, setOpenOn] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [attachedFile, setAttachedFile] = useState<string | null>(null)
  const [uploadingFile, setUploadingFile] = useState(false)

  async function handleChatFileSelect(file: File | null) {
    if (!file) return
    setUploadingFile(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/cv_upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (res.ok) {
        setAttachedFile(file.name)
        const applicant = data.profile?.applicant_name || 'Candidate'
        const skills = data.profile?.skills?.slice(0, 10).join(', ') || 'Extracted'
        append({
          role: 'user',
          content: `I have uploaded my CV (${file.name}). Candidate: ${applicant}. Skills: ${skills}. Please review my career profile and coach me for top engineering roles.`,
        })
      }
    } catch (err) {
      console.error('CV upload error in coach:', err)
    } finally {
      setUploadingFile(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col px-4">
      {messages.length === 0 ? (
        <div className="flex flex-1 flex-col justify-center py-16">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">What are we fixing today?</h1>
          <p className="mt-3 max-w-[48ch] text-sm text-muted-foreground leading-relaxed">
            I already know where you went wrong last time. Ask me anything, or let me ask you.
          </p>

          <div className="mt-7 flex flex-wrap gap-2">
            {STARTERS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => append({ role: 'user', content: s })}
                className="rounded-full border px-3.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <ol className="flex flex-col gap-6 overflow-y-auto py-8">
          {messages.map((m) => {
            if (m.role === 'user') {
              return (
                <li key={m.id} className="flex justify-end">
                  <p className="max-w-[78%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-secondary px-4 py-2.5 text-sm text-secondary-foreground">
                    {m.content}
                  </p>
                </li>
              )
            }

            const note = annotationOf(m.annotations)
            const recalled = note?.recalled ?? []
            const stored = note?.stored
            const open = openOn === m.id

            return (
              <li key={m.id} className="flex gap-3">
                <span aria-hidden className="mt-1 size-6 shrink-0 rounded-full bg-brand-gradient" />

                <div className="min-w-0 flex-1 rounded-xl border bg-card px-4 py-3">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.content}</p>

                  {recalled.length > 0 && (
                    <div className="mt-3.5 flex flex-wrap gap-2">
                      {recalled.map((fact, i) => {
                        const { kind, claim } = parseFact(fact.text)
                        return (
                          <button
                            key={`${m.id}-${i}`}
                            type="button"
                            onClick={() => setOpenOn(open ? null : m.id)}
                            aria-expanded={open}
                            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Database className="w-3 h-3" />
                            <span className="font-mono uppercase tracking-wide text-[9.5px]">{kind}</span>
                            <span className="truncate max-w-[22ch]">{claim}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {open && stored?.failed && (
                    <p className="mt-3 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 font-mono text-[11px] text-destructive">
                      {stored.failed}
                    </p>
                  )}

                  {open && recalled.length > 0 && (
                    <ul className="mt-3 flex flex-col gap-1.5 rounded-lg border bg-muted/40 px-3 py-2.5">
                      {recalled.map((fact, i) => (
                        <li key={`${m.id}-full-${i}`} className="flex items-baseline justify-between gap-4 font-mono text-[11px] text-muted-foreground">
                          <span className="truncate">{fact.text}</span>
                          <span className="shrink-0 opacity-70">{fact.distance.toFixed(3)}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/*
                    Reading and writing are different events and this footer must
                    not conflate them: "nothing stored yet" whenever the turn
                    RECALLED nothing is also true of every first turn and of a
                    turn that just saved a misconception. Report the two
                    separately, and never claim the record is empty on the
                    strength of a recall.
                  */}
                  <div className="mt-3.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t pt-2.5">
                    <span className="text-[11px] text-muted-foreground">{note?.model ?? ''}</span>
                    <span className="flex flex-wrap items-center gap-2">
                      {stored?.failed ? (
                        <button
                          type="button"
                          onClick={() => setOpenOn(open ? null : m.id)}
                          aria-expanded={open}
                          className="rounded-full bg-destructive/10 px-2.5 py-1 text-[11px] text-destructive"
                        >
                          could not save this turn — why?
                        </button>
                      ) : stored?.written.length ? (
                        <span
                          className="rounded-full bg-secondary px-2.5 py-1 text-[11px] text-secondary-foreground"
                          title={stored.written.join('\n')}
                        >
                          saved {stored.written.length} fact{stored.written.length === 1 ? '' : 's'}
                        </span>
                      ) : null}
                      <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">
                        {recalled.length
                          ? `recalled ${recalled.length} fact${recalled.length === 1 ? '' : 's'}`
                          : 'recalled nothing'}
                      </span>
                    </span>
                  </div>
                </div>
              </li>
            )
          })}

          {busy && (
            <li className="flex items-center gap-1.5 pl-9 text-muted-foreground" aria-live="polite">
              {[0, 150, 300].map((d) => (
                <span key={d} className="size-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: `${d}ms` }} />
              ))}
            </li>
          )}
        </ol>
      )}

      {/* A failed turn must never look like a silent one. The route fails closed
          when memory is unreachable, so this is the only place the student finds
          out the tutor is teaching blind — say it, don't swallow it. */}
      {error && (() => {
        /*
         * A missing model key is not a transient failure, so offering "Try
         * again" is a lie — retrying calls the same route with the same absent
         * key and fails identically. Send the person to the thing that
         * actually fixes it instead.
         */
        const needsKey = error.message.includes(NO_KEY_CODE)
        const text = needsKey
          ? error.message.split(`${NO_KEY_CODE}:`).pop()!.trim()
          : error.message || 'Something went wrong.'

        return (
          <p
            role="alert"
            className={cn(
              'mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-dashed px-4 py-3 text-[13px] text-muted-foreground',
              needsKey && 'border-reward/60',
            )}
          >
            {text}
            {needsKey ? (
              <button
                type="button"
                onClick={() => openKeysPanel()}
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs text-foreground hover:bg-accent"
              >
                <Settings2 className="w-3.5 h-3.5" /> Add a model key
              </button>
            ) : (
              <button
                type="button"
                onClick={() => reload()}
                className="rounded-full border px-3 py-1 text-xs text-foreground hover:bg-accent"
              >
                Try again
              </button>
            )}
          </p>
        )
      })()}

      <div className="flex-1" />

      <form onSubmit={handleSubmit} className="sticky bottom-0 bg-background pb-6 pt-3">
        <div className="rounded-xl border bg-card px-3 pb-3 pt-3">
          {attachedFile && (
            <div className="mb-2 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs text-foreground">
              <Paperclip className="h-3.5 w-3.5 text-primary" />
              <span className="truncate max-w-[240px] font-medium">{attachedFile}</span>
              <button
                type="button"
                onClick={() => setAttachedFile(null)}
                className="ml-auto text-muted-foreground hover:text-foreground"
                title="Remove attachment"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <input
            value={input}
            onChange={handleInputChange}
            aria-label="Message"
            placeholder={attachedFile ? "Ask about your attached CV or interview strategy…" : "Attach your CV or tell Career Coach what you're targeting…"}
            className="w-full bg-transparent px-1 pb-3 text-sm outline-none placeholder:text-muted-foreground"
          />

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                className="hidden"
                onChange={(e) => handleChatFileSelect(e.target.files?.[0] || null)}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingFile}
                className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                title="Attach candidate CV"
              >
                {uploadingFile ? (
                  <Loader2 className="w-3 h-3 animate-spin text-primary" />
                ) : (
                  <Paperclip className="w-3 h-3 text-primary" />
                )}
                <span>{uploadingFile ? 'Parsing...' : 'Attach CV'}</span>
              </button>

              <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] text-muted-foreground">
                <span aria-hidden className="size-1.5 rounded-full bg-primary" />
                Memory on
              </span>
            </div>

            <button
              type="submit"
              disabled={busy || !input.trim()}
              aria-label="Send"
              className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-25"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

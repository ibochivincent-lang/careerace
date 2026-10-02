'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import { KeyRound, Check, Trash2, ExternalLink } from 'lucide-react'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from './ui/dialog'
import { Button } from './ui/button'
import { cn } from './ui/utils'
import {
  getKeySettings, saveProviderKey, removeProviderKey, setActiveProvider,
  setChatModel, listGroqModels, type KeySettings,
} from '@/app/actions/keys'

/**
 * Bring-your-own-key panel.
 *
 * Opened from the header, and also from the chat when a turn fails for want of
 * a key — a missing key is not a transient error, so "Try again" would be a
 * lie. The event is the cheapest way for an unrelated component to reach this
 * one without dragging a provider around the whole app.
 */
const OPEN_EVENT = 'careerace:open-keys'
const LEGACY_EVENT = 'examace:open-keys'

export function openKeysPanel() {
  window.dispatchEvent(new CustomEvent(OPEN_EVENT))
  window.dispatchEvent(new CustomEvent(LEGACY_EVENT))
}

export function ApiKeysMenu() {
  const [open, setOpen] = useState(false)
  const [settings, setSettings] = useState<KeySettings | null>(null)
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [groqNote, setGroqNote] = useState<string | null>(null)
  const [groqModels, setGroqModels] = useState<string[] | null>(null)
  const [pending, start] = useTransition()

  useEffect(() => {
    const onOpen = () => setOpen(true)
    window.addEventListener(OPEN_EVENT, onOpen)
    window.addEventListener(LEGACY_EVENT, onOpen)
    return () => {
      window.removeEventListener(OPEN_EVENT, onOpen)
      window.removeEventListener(LEGACY_EVENT, onOpen)
    }
  }, [])

  const load = useCallback(() => {
    getKeySettings()
      .then(setSettings)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Could not load key settings.'))
  }, [])

  useEffect(() => {
    if (open) load()
  }, [open, load])

  function run(action: () => Promise<KeySettings>) {
    setError(null)
    start(async () => {
      try {
        setSettings(await action())
      } catch (e) {
        setError(e instanceof Error ? e.message : 'That did not work.')
      }
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Model keys"
        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      >
        <KeyRound className="w-4 h-4" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Model keys</DialogTitle>
            <DialogDescription>
              Your key is sealed with AES-256-GCM and kept in an httpOnly cookie in your own
              browser — never on our disk, and out of reach of page scripts. It is not protection
              against whoever runs this server, and we will not pretend otherwise.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <p role="alert" className="rounded-lg border border-destructive/40 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          {!settings ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
          ) : (
            <ul className="space-y-3">
              {settings.providers.map((p) => {
                const usable = p.mine || p.fromEnv
                const models = p.provider === 'groq' && groqModels ? groqModels : p.models
                return (
                  <li key={p.provider} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium flex items-center gap-2">
                          {p.label}
                          {settings.active === p.provider && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] text-secondary-foreground">
                              <Check className="w-3 h-3" /> answering
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {p.mine
                            ? `your key ····${p.tail}`
                            : p.fromEnv
                              ? `set on the server as ${p.env} — not editable here`
                              : 'no key yet'}
                        </p>
                      </div>
                      <a
                        href={p.console}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                      >
                        get one <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    {!p.mine && !p.fromEnv && (
                      <div className="mt-2.5 flex gap-2">
                        <input
                          type="password"
                          value={drafts[p.provider] ?? ''}
                          onChange={(e) => setDrafts((d) => ({ ...d, [p.provider]: e.target.value }))}
                          placeholder={p.hint}
                          aria-label={`${p.label} API key`}
                          className="flex-1 rounded-lg border bg-input-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                        />
                        <Button
                          size="sm"
                          disabled={pending || !(drafts[p.provider] ?? '').trim()}
                          onClick={() => run(() => saveProviderKey(p.provider, drafts[p.provider] ?? ''))}
                        >
                          Save
                        </Button>
                      </div>
                    )}

                    {usable && (
                      <div className="mt-2.5 flex flex-wrap items-center gap-2">
                        <select
                          value={p.model}
                          onChange={(e) => run(() => setChatModel(p.provider, e.target.value))}
                          aria-label={`${p.label} model`}
                          className="rounded-lg border bg-input-background px-2 py-1 text-xs"
                        >
                          {[...new Set([p.model, ...models])].map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>

                        {settings.active !== p.provider && (
                          <Button size="sm" variant="outline" disabled={pending}
                            onClick={() => run(() => setActiveProvider(p.provider))}>
                            Use this one
                          </Button>
                        )}

                        {p.provider === 'groq' && (
                          <Button
                            size="sm" variant="ghost" disabled={pending}
                            onClick={() =>
                              start(async () => {
                                const { models: live, error: err } = await listGroqModels()
                                setGroqModels(live)
                                setGroqNote(err)
                              })
                            }
                          >
                            Load live list
                          </Button>
                        )}

                        {p.mine && (
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => run(() => removeProviderKey(p.provider))}
                            className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> remove
                          </button>
                        )}
                      </div>
                    )}

                    {p.provider === 'groq' && groqNote && (
                      <p className="mt-2 text-[11px] text-muted-foreground">{groqNote}</p>
                    )}
                  </li>
                )
              })}
            </ul>
          )}

          <p className={cn('text-[11px] leading-relaxed text-muted-foreground', settings?.empty && 'text-foreground')}>
            The same key answers you and runs the write gate that decides what enters your record.
            They are deliberately the same model: a gate running on a model nobody chose fails
            silently on every turn while the conversation looks perfectly healthy.
          </p>
        </DialogContent>
      </Dialog>
    </>
  )
}

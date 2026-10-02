import { AppShell } from '@/components/AppShell'
import { Database, ShieldCheck, Loader2 } from 'lucide-react'

export default function MemoryLoading() {
  return (
    <AppShell>
      <div className="flex min-h-screen flex-col">
        {/* Header Skeleton */}
        <div className="border-b bg-background/95 backdrop-blur">
          <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4 lg:px-10">
            <div className="flex items-center gap-2">
              <div className="h-4 w-28 bg-muted animate-pulse rounded" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-7 w-20 bg-muted animate-pulse rounded-full" />
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-5xl px-4 py-8 lg:px-10 space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-8 border-b pb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                  Walrus Memory
                </span>
                <span className="font-mono text-xs text-muted-foreground">careerace:profile</span>
              </div>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">Your Sovereign Career Vault</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Connecting to decentralized Walrus storage and decrypting your candidate credentials...
              </p>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-card/60 text-xs text-muted-foreground">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
              <span>Decrypting Walrus Blobs</span>
            </div>
          </div>

          {/* Skeleton Table */}
          <div className="overflow-hidden rounded-xl border bg-card">
            <div className="grid grid-cols-[104px_140px_minmax(0,1fr)_88px_76px] gap-4 border-b bg-muted/40 px-4 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              <span>Date</span>
              <span>Kind</span>
              <span>Career Record</span>
              <span>Distance</span>
              <span>Action</span>
            </div>

            <div className="divide-y divide-border/40 p-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="grid grid-cols-[104px_140px_minmax(0,1fr)_88px_76px] gap-4 items-center px-4 py-3.5">
                  <div className="h-3 w-16 bg-muted/80 rounded animate-pulse" />
                  <div className="h-5 w-20 bg-muted/80 rounded-full animate-pulse" />
                  <div className="h-3 w-3/4 bg-muted/80 rounded animate-pulse" />
                  <div className="h-3 w-12 bg-muted/80 rounded animate-pulse" />
                  <div className="h-6 w-14 bg-muted/80 rounded animate-pulse ml-auto" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

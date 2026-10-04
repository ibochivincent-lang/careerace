'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, AlertTriangle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'

export function ResetVaultButton() {
  const router = useRouter()
  const [isResetting, setIsResetting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  async function handleResetVault() {
    setIsResetting(true)
    const toastId = toast.loading('Resetting sovereign Career Vault on Walrus...')
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('careerace_sovereign_profile')
        localStorage.removeItem('careerace_parsed_profile')
        localStorage.removeItem('careerace_target_title')
        localStorage.removeItem('careerace_chat_history')
        localStorage.removeItem('careerace_walrus_versions')
        localStorage.removeItem('careerace_reminder_pref')
      }

      await fetch('/api/memory', { method: 'DELETE' }).catch(() => {})
      toast.success('Your Sovereign Career Vault has been completely reset.', { id: toastId })
      setShowConfirm(false)
      router.refresh()
    } catch {
      toast.error('Failed to reset memory vault.', { id: toastId })
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <Card className="p-6 border border-destructive/30 bg-destructive/5 rounded-2xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-destructive" />
            Reset Career Vault
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-xl leading-relaxed">
            Wipe all locally cached profiles, tailored resume snapshots, and publish a cryptographic retraction tombstone to Walrus Sovereign Memory.
          </p>
        </div>

        {!showConfirm ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowConfirm(true)}
            className="border-destructive/40 text-destructive hover:bg-destructive/10 text-xs font-semibold gap-1.5 shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Reset Vault
          </Button>
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="destructive"
              size="sm"
              disabled={isResetting}
              onClick={handleResetVault}
              className="text-xs font-semibold gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {isResetting ? 'Resetting...' : 'Confirm Reset'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={isResetting}
              onClick={() => setShowConfirm(false)}
              className="text-xs"
            >
              Cancel
            </Button>
          </div>
        )}
      </div>

      {showConfirm && (
        <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/10 flex items-center gap-2 text-xs text-destructive">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            Warning: This action will purge your verified career profile and stored resume versions across sessions.
          </span>
        </div>
      )}
    </Card>
  )
}

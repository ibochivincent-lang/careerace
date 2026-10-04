'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  ShieldCheck,
  Anchor,
  FileCheck,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Copy,
  Check,
  Ship,
  Clock,
  QrCode,
  Award,
  Upload,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'
import type { MaritimeVerificationResult } from '@/app/api/maritime/verify/route'

interface MaritimeStcwVerifierModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  candidateName?: string
  candidateAddress?: string
  onVerificationComplete?: (result: MaritimeVerificationResult) => void
}

export function MaritimeStcwVerifierModal({
  open,
  onOpenChange,
  candidateName = 'Vincent Lang',
  candidateAddress = '',
  onVerificationComplete,
}: MaritimeStcwVerifierModalProps) {
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationResult, setVerificationResult] = useState<MaritimeVerificationResult | null>(null)
  const [activeStep, setActiveStep] = useState<'input' | 'scanning' | 'verified'>('input')
  const [customDocText, setCustomDocText] = useState('')
  const [copiedBlob, setCopiedBlob] = useState(false)

  // Run autonomous 1-click verification
  async function handleRunVerification(customText?: string) {
    setIsVerifying(true)
    setActiveStep('scanning')

    try {
      const res = await fetch('/api/maritime/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentText: customText || customDocText || undefined,
          candidateName,
          targetAddress: candidateAddress,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Verification failed')
      }

      setVerificationResult(data.verification)
      setActiveStep('verified')
      toast.success('STCW & Sea-Time verified! Encrypted Soulbound Walrus credential minted.')

      if (onVerificationComplete) {
        onVerificationComplete(data.verification)
      }
    } catch (err: any) {
      toast.error(err.message || 'Verification failed')
      setActiveStep('input')
    } finally {
      setIsVerifying(false)
    }
  }

  function handleCopyBlobId(id: string) {
    navigator.clipboard.writeText(id)
    setCopiedBlob(true)
    toast.success('Copied Walrus Blob ID!')
    setTimeout(() => setCopiedBlob(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden border border-border/80 bg-card rounded-2xl shadow-2xl">
        {/* Header Banner */}
        <div className="p-6 bg-gradient-to-r from-blue-950 via-slate-900 to-emerald-950 text-white border-b border-border/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <Anchor className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                Maritime STCW &amp; Sea-Time Verifier
                <Badge variant="outline" className="text-[10px] border-emerald-400/40 text-emerald-300 bg-emerald-500/10 font-mono">
                  Soulbound Walrus
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-300 mt-0.5">
                Autonomous OCR verification for Seaman’s Discharge Books, STCW-78/2010 certificates, and engine room sea-time logs.
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {activeStep === 'input' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-300">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Official Maritime Verification Standards</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Extracts and audits STCW 78/2010 Regulations (Reg III/1 OICEW, Reg III/2 Chief Engineer, Reg VI/1-VI/4 Safety),
                  validates issuing maritime administrations (MCA, USCG, DMA, NIMASA), and tallies qualifying engine room sea days across commercial vessels.
                </p>
              </div>

              {/* Document Input or 1-Click Action */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Paste Seaman's Book / STCW Certificate Text (Optional)</span>
                  <span className="text-[11px] text-muted-foreground font-normal">Or run 1-Click Autonomous Audit</span>
                </label>
                <textarea
                  value={customDocText}
                  onChange={(e) => setCustomDocText(e.target.value)}
                  placeholder="Paste OCR text from your Seaman's Discharge Book, STCW Certificate of Competency, or Sea-Time Discharge slips..."
                  rows={4}
                  className="w-full p-3 rounded-xl border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <Button
                  onClick={() => handleRunVerification()}
                  disabled={isVerifying}
                  className="w-full sm:flex-1 gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs h-10"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>1-Click Autonomous Sea-Time Audit</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    setCustomDocText(
                      `SEAMAN'S DISCHARGE BOOK & STCW COCs\nName: ${candidateName}\nSTCW Reg III/1 & III/2 - Marine Engineer Officer\nAdministration: Maritime & Coastguard Agency (MCA)\nCert No: UK-MCA/ENG/984210-C\nVessel 1: MAERSK MC-KINNEY MOLLER (IMO 9619907) - 59,360 kW - 250 Sea Days\nVessel 2: DEEP BLUE (IMO 9215438) - DP-2 Pipelay - 24,000 kW - 196 Sea Days\nTotal: 446 Qualifying Sea Days`
                    )
                  }}
                  className="w-full sm:w-auto text-xs h-10 border-border"
                >
                  Load Sample Marine Record
                </Button>
              </div>
            </div>
          )}

          {activeStep === 'scanning' && (
            <div className="p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mx-auto text-blue-500 animate-pulse">
                <Anchor className="w-8 h-8 animate-spin" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-foreground">Auditing Maritime Records &amp; Sea Days...</h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Parsing STCW 78/2010 regulations, validating IMO vessel registries, and computing tamper-proof Soulbound Walrus cryptographic hash.
                </p>
              </div>
            </div>
          )}

          {activeStep === 'verified' && verificationResult && (
            <div className="space-y-5">
              {/* Soulbound Verification Certificate Card */}
              <div className="p-5 rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-500/5 via-card to-blue-500/5 shadow-md space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/80">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                      <FileCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">{verificationResult.certificateName}</span>
                        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] py-0 px-1.5 font-mono">
                          {verificationResult.complianceScore}% Verified
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Issuing Authority: <span className="font-semibold text-foreground">{verificationResult.issuingAuthority}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block">Total Sea Service</span>
                    <span className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
                      {verificationResult.seaDaysTotal} Days
                    </span>
                  </div>
                </div>

                {/* Key Credentials Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-lg border border-border/70 bg-muted/20">
                    <span className="text-[10px] text-muted-foreground block">Candidate</span>
                    <span className="font-semibold text-foreground truncate block">{verificationResult.candidateName}</span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-border/70 bg-muted/20">
                    <span className="text-[10px] text-muted-foreground block">STCW Reg</span>
                    <span className="font-semibold text-foreground truncate block">{verificationResult.stcwRegulation}</span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-border/70 bg-muted/20">
                    <span className="text-[10px] text-muted-foreground block">Certificate No</span>
                    <span className="font-semibold text-foreground font-mono truncate block">{verificationResult.certificateNumber}</span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-border/70 bg-muted/20">
                    <span className="text-[10px] text-muted-foreground block">Validity</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 truncate block">Active to {verificationResult.expiryDate}</span>
                  </div>
                </div>

                {/* Vessel Sea-Time Log Records */}
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Verified Vessel Sea-Service Logs
                  </span>
                  <div className="space-y-1.5">
                    {verificationResult.vessels.map((v, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 p-2.5 rounded-xl border border-border/60 bg-card text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <Ship className="w-4 h-4 text-blue-500 shrink-0" />
                          <div>
                            <span className="font-bold text-foreground">{v.name}</span>
                            <span className="text-muted-foreground ml-1.5 text-[11px]">IMO: {v.imo} · {v.type} ({v.propulsionKW})</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-right">
                          <span className="text-[11px] text-muted-foreground">{v.rank} · {v.dates}</span>
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md text-[11px]">
                            {v.seaDays} sea days
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Soulbound Walrus Protocol Cryptographic Anchor */}
                <div className="p-3 rounded-xl border border-emerald-500/30 bg-zinc-950 text-zinc-300 font-mono text-[11px] space-y-1.5">
                  <div className="flex items-center justify-between text-zinc-400 text-[10px] border-b border-zinc-800 pb-1">
                    <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Soulbound Walrus Credential Minted
                    </span>
                    <span>Epoch 10 · Sui Testnet</span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <span className="text-zinc-500 shrink-0">Walrus Blob:</span>
                    <span className="text-zinc-300 truncate">{verificationResult.walrusBlobId}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyBlobId(verificationResult.walrusBlobId)}
                      className="text-zinc-400 hover:text-white p-1 hover:bg-zinc-800 rounded"
                    >
                      {copiedBlob ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-zinc-500 shrink-0">SHA-256 Digest:</span>
                    <span className="text-zinc-400 truncate text-[10px]">{verificationResult.sha256Digest}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveStep('input')}
                  className="text-xs gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Verify Another Document</span>
                </Button>

                <div className="flex items-center gap-2">
                  <a
                    href={verificationResult.walrusUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border text-xs font-medium hover:bg-muted text-foreground transition-colors"
                  >
                    <span>Inspect Walrus Proof</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <Button
                    size="sm"
                    onClick={() => {
                      onOpenChange(false)
                      toast.success('Maritime credential attached to candidate profile!')
                    }}
                    className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                  >
                    Attach to CV &amp; Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

"use client";

import React, { useState } from "react";
import {
  Database,
  History,
  ExternalLink,
  Copy,
  RotateCcw,
  Check,
  ShieldCheck,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Trash2,
  Anchor
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { ParsedCv } from "@/lib/cv_parser";

export interface WalrusResumeVersionItem {
  id: string;
  versionNumber: number;
  label: string;
  company: string;
  role: string;
  atsScore: number;
  blobId: string;
  walrusUrl: string;
  createdAt: string;
  profileSnapshot: ParsedCv;
  tailoredText?: string;
  encrypted?: boolean;
  suiTxDigest?: string;
  suiExplorerUrl?: string;
  suiObjectId?: string;
  fileSize?: number;
}

interface WalrusVersionDrawerProps {
  versions: WalrusResumeVersionItem[];
  activeVersionId?: string | null;
  onRestoreVersion: (version: WalrusResumeVersionItem) => void;
  onClearHistory?: () => void;
  onAnchorToSui?: (version: WalrusResumeVersionItem) => Promise<void>;
}

export function WalrusVersionDrawer({
  versions,
  activeVersionId,
  onRestoreVersion,
  onClearHistory,
  onAnchorToSui,
}: WalrusVersionDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedBlobId, setCopiedBlobId] = useState<string | null>(null);

  function handleCopyBlob(blobId: string) {
    navigator.clipboard.writeText(blobId);
    setCopiedBlobId(blobId);
    toast.success("Walrus Blob ID copied to clipboard!");
    setTimeout(() => setCopiedBlobId(null), 2000);
  }

  if (!versions || versions.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-border/80 bg-muted/20 backdrop-blur-xs p-4 space-y-3 transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-foreground">
                Walrus Decentralized Version History
              </h4>
              <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30 bg-emerald-500/10">
                {versions.length} {versions.length === 1 ? "Version" : "Versions"} Anchored
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Immutable encrypted snapshots stored on Mysten Labs Walrus mainnet.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onClearHistory && versions.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearHistory}
              className="text-[11px] h-7 text-muted-foreground hover:text-red-400"
              title="Clear local version history cache"
            >
              Clear Cache
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="text-xs h-7 gap-1 text-emerald-600 dark:text-emerald-400 font-semibold"
          >
            <History className="w-3.5 h-3.5" />
            {isOpen ? "Hide History" : "View Versions"}
            {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </Button>
        </div>
      </div>

      {isOpen && (
        <div className="pt-2 border-t border-border/60 space-y-2.5 max-h-72 overflow-y-auto pr-1">
          {versions.map((ver, idx) => {
            const isCurrent = activeVersionId === ver.id;
            return (
              <div
                key={ver.id || idx}
                className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isCurrent
                    ? "border-emerald-500/60 bg-emerald-500/10 shadow-xs"
                    : "border-border/60 bg-card hover:border-emerald-500/30 hover:bg-emerald-500/5"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-foreground">
                      v{ver.versionNumber || versions.length - idx} · {ver.role}
                    </span>
                    <span className="text-xs text-muted-foreground">@ {ver.company}</span>
                    {ver.encrypted && (
                      <Badge variant="outline" className="text-[9px] text-muted-foreground border-emerald-500/30">
                        <ShieldCheck className="w-2.5 h-2.5 mr-0.5 text-emerald-500" />
                        AES-256
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground flex-wrap">
                    <span>{new Date(ver.createdAt).toLocaleString()}</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400">
                      Blob: {ver.blobId.slice(0, 10)}...{ver.blobId.slice(-6)}
                    </span>
                    {ver.suiTxDigest && (
                      <a
                        href={ver.suiExplorerUrl || `https://suiscan.xyz/${process.env.NEXT_PUBLIC_SUI_NETWORK === 'mainnet' ? 'mainnet' : 'testnet'}/tx/${ver.suiTxDigest}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-medium text-sky-600 dark:text-sky-400 hover:underline"
                        title="View verifiable Sui Move on-chain transaction anchor"
                      >
                        <Anchor className="w-3 h-3 text-sky-500" />
                        <span>Sui Anchored ({ver.suiTxDigest.slice(0, 8)}...)</span>
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {onAnchorToSui && !ver.suiTxDigest && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onAnchorToSui(ver)}
                      className="h-7 px-2 text-[11px] border-sky-500/40 text-sky-600 dark:text-sky-400 hover:bg-sky-500/10 flex items-center gap-1"
                      title="Anchor this Walrus blob on the Sui blockchain"
                    >
                      <Anchor className="w-3 h-3" />
                      <span>Anchor Sui</span>
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyBlob(ver.blobId)}
                    className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                    title="Copy Walrus Blob ID"
                  >
                    {copiedBlobId === ver.blobId ? (
                      <Check className="w-3 h-3 text-emerald-500 mr-1" />
                    ) : (
                      <Copy className="w-3 h-3 mr-1" />
                    )}
                    Blob
                  </Button>

                  <a
                    href={ver.walrusUrl || `https://aggregator.walrus-mainnet.walrus.space/v1/blobs/${ver.blobId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 h-7 px-2 text-[11px] rounded-md border border-border text-muted-foreground hover:text-foreground bg-background hover:bg-muted/40 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Explorer
                  </a>

                  <Button
                    size="sm"
                    variant={isCurrent ? "secondary" : "outline"}
                    onClick={() => onRestoreVersion(ver)}
                    className={`h-7 px-2.5 text-[11px] font-semibold gap-1 ${
                      isCurrent
                        ? "bg-emerald-600 text-white hover:bg-emerald-500"
                        : "border-border/80 hover:bg-muted"
                    }`}
                  >
                    <RotateCcw className="w-3 h-3" />
                    {isCurrent ? "Active" : "Restore"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

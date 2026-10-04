"use client";

import React, { useState } from "react";
import {
  Database,
  ExternalLink,
  Copy,
  RotateCcw,
  Check,
  ShieldCheck,
  X,
  History,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { WalrusResumeVersionItem } from "@/components/WalrusVersionDrawer";

export interface WalrusVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  versions: WalrusResumeVersionItem[];
  activeVersionId?: string | null;
  onRestoreVersion: (version: WalrusResumeVersionItem) => void;
  onClearHistory?: () => void;
}

export function WalrusVersionModal({
  isOpen,
  onClose,
  versions,
  activeVersionId,
  onRestoreVersion,
  onClearHistory,
}: WalrusVersionModalProps) {
  const [copiedBlobId, setCopiedBlobId] = useState<string | null>(null);

  if (!isOpen) return null;

  function handleCopyBlob(blobId: string) {
    navigator.clipboard.writeText(blobId);
    setCopiedBlobId(blobId);
    toast.success("Walrus Blob ID copied to clipboard!");
    setTimeout(() => setCopiedBlobId(null), 2000);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="walrus-history-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in-0 duration-200"
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-border/80 bg-card shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="p-4 px-5 border-b border-border/80 bg-muted/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 flex items-center justify-center shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="walrus-history-modal-title" className="font-bold text-sm text-foreground">
                  Walrus Decentralized Version History
                </h3>
                <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30 bg-emerald-500/10 font-mono">
                  {versions.length} {versions.length === 1 ? "Snapshot" : "Snapshots"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Cryptographically anchored on Mysten Labs Walrus testnet. Restore any version anytime.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {onClearHistory && versions.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearHistory}
                className="text-xs h-8 text-muted-foreground hover:text-red-400 gap-1 mr-1"
                title="Clear local version history cache"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
              aria-label="Close Walrus history dialog"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Versions List */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1 text-xs">
          {versions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <History className="w-8 h-8 mx-auto mb-2 opacity-40 text-emerald-500" />
              <p className="font-medium">No Walrus snapshots recorded yet.</p>
              <p className="text-[11px] mt-1">
                Click &ldquo;Save to Walrus&rdquo; in your resume editor to commit an encrypted immutable snapshot.
              </p>
            </div>
          ) : (
            versions.map((ver, idx) => {
              const isCurrent = activeVersionId === ver.id;
              return (
                <div
                  key={ver.id || idx}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isCurrent
                      ? "border-emerald-500/60 bg-emerald-500/10 shadow-xs"
                      : "border-border/70 bg-card hover:border-emerald-500/30 hover:bg-emerald-500/5"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-foreground">
                        v{ver.versionNumber || versions.length - idx} · {ver.role}
                      </span>
                      {ver.company && (
                        <span className="text-xs text-muted-foreground">@ {ver.company}</span>
                      )}
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
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
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
                      href={ver.walrusUrl || `https://aggregator.walrus-testnet.walrus.space/v1/blobs/${ver.blobId}`}
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
                      onClick={() => {
                        onRestoreVersion(ver);
                        onClose();
                      }}
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
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 px-5 border-t border-border/80 bg-muted/20 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Decentralized blobs stored on Walrus testnet.</span>
          <Button variant="outline" size="sm" onClick={onClose} className="h-7 text-xs">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import {
  Database,
  X,
  ShieldCheck,
  Loader2,
  Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface SaveWalrusSnapshotModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: string;
  defaultCompany?: string;
  isSaving?: boolean;
  onConfirmSave: (role: string, company: string) => void;
}

const POPULAR_ROLE_SUGGESTIONS = [
  "Engine Cadet",
  "Full-Stack Developer",
  "Frontend Engineer",
  "Backend Engineer",
  "Marine Systems Engineer",
  "Naval Architect"
];

export function SaveWalrusSnapshotModal({
  isOpen,
  onClose,
  defaultRole = "Full-Stack Developer",
  defaultCompany = "General",
  isSaving = false,
  onConfirmSave,
}: SaveWalrusSnapshotModalProps) {
  const [role, setRole] = useState(defaultRole);
  const [company, setCompany] = useState(defaultCompany);

  useEffect(() => {
    if (isOpen) {
      setRole(defaultRole || "Full-Stack Developer");
      setCompany(defaultCompany || "General");
    }
  }, [isOpen, defaultRole, defaultCompany]);

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!role.trim()) return;
    onConfirmSave(role.trim(), company.trim() || "General");
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-walrus-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in-0 duration-200"
    >
      <div className="w-full max-w-lg rounded-2xl border border-border/80 bg-card shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 px-5 border-b border-border/80 bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 flex items-center justify-center shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 id="save-walrus-title" className="font-bold text-sm text-foreground">
                Anchor CV Version to Walrus
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Save a decentralized snapshot with a specific role identity
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            disabled={isSaving}
            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">
              Role / Specialization Identity <span className="text-emerald-500">*</span>
            </label>
            <input
              type="text"
              required
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Engine Cadet, Frontend Engineer, Full-Stack Developer"
              className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            
            {/* Quick role suggestions */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[10px] text-muted-foreground flex items-center gap-1 mr-1">
                <Briefcase className="w-3 h-3" /> Quick tag:
              </span>
              {POPULAR_ROLE_SUGGESTIONS.map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => setRole(sug)}
                  className={`text-[10.5px] px-2 py-0.5 rounded-md border transition-colors ${
                    role === sug
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold"
                      : "border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  }`}
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">
              Target Company / Focus (Optional)
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Maersk, General, Vercel"
              className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-[11px] text-muted-foreground flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              This snapshot is securely anchored to Walrus storage. Once saved, you can select this specific CV version on the <strong className="text-foreground">Job Board</strong> to instantly auto-apply with matched credentials.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSaving}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSaving || !role.trim()}
              className="h-8 text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Anchoring Snapshot...</span>
                </>
              ) : (
                <>
                  <Database className="w-3.5 h-3.5" />
                  <span>Anchor to Walrus</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

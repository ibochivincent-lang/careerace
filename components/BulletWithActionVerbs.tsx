"use client";

import React, { useState, useMemo } from "react";
import { Sparkles, X, Check, Zap, PlusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  analyzeBulletActionVerbs,
  replaceBulletActionVerb,
  integrateKeywordIntoBullet,
  type VerbSuggestion
} from "@/lib/action_verbs";

interface BulletWithActionVerbsProps {
  bullet: string;
  onUpdate: (newBullet: string) => void;
  onDelete: () => void;
  index: number;
  fontFamily?: string;
  className?: string;
  targetRole?: string;
  allKeywords?: string[];
  isHighlighted?: boolean;
}

export function BulletWithActionVerbs({
  bullet,
  onUpdate,
  onDelete,
  index,
  fontFamily,
  className = "",
  targetRole,
  allKeywords = [],
  isHighlighted = false,
}: BulletWithActionVerbsProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [localHighlight, setLocalHighlight] = useState(false);

  // Combine external prop highlight (from AI Copilot) and local chip highlight
  const activeHighlight = isHighlighted || localHighlight;

  // Role-tailored action verbs analysis
  const analysis = useMemo(
    () => analyzeBulletActionVerbs(bullet, targetRole),
    [bullet, targetRole]
  );

  // Detect matched ATS keywords within this specific bullet
  const matchedKeywords = useMemo(() => {
    if (!allKeywords || allKeywords.length === 0 || !bullet.trim()) return [];
    const lowerBullet = bullet.toLowerCase();
    return allKeywords
      .filter((kw) => {
        if (!kw || kw.trim().length < 2) return false;
        const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return new RegExp(`\\b${escaped}\\b`, "i").test(lowerBullet);
      })
      .slice(0, 5);
  }, [allKeywords, bullet]);

  // Find suggested missing keywords from candidate skills / JD not yet in this bullet
  const suggestedMissingKeywords = useMemo(() => {
    if (!allKeywords || allKeywords.length === 0) return [];
    const lowerBullet = bullet.toLowerCase();
    return allKeywords
      .filter((kw) => {
        if (!kw || kw.trim().length < 2) return false;
        const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return !new RegExp(`\\b${escaped}\\b`, "i").test(lowerBullet);
      })
      .slice(0, 3);
  }, [allKeywords, bullet]);

  function handleSelectVerb(suggestion: VerbSuggestion) {
    const replaced = replaceBulletActionVerb(bullet, suggestion.verb);
    onUpdate(replaced);
    setLocalHighlight(true);
    setTimeout(() => setLocalHighlight(false), 3200);
    const weakLabel = analysis.weakPhrase ? `'${analysis.weakPhrase}'` : "opening verb";
    toast.success(
      `Replaced ${weakLabel} with '${suggestion.verb}' (+${suggestion.points} ATS points)`
    );
  }

  function handleIntegrateKeyword(keyword: string) {
    const integrated = integrateKeywordIntoBullet(bullet, keyword);
    onUpdate(integrated);
    setLocalHighlight(true);
    setTimeout(() => setLocalHighlight(false), 3200);
    toast.success(`Integrated "${keyword}" into bullet!`);
  }

  const showSuggestions = isFocused || isHovered;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group/bullet relative space-y-1.5 rounded-lg p-2 transition-all duration-300 ${
        activeHighlight
          ? "ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-slate-900 bg-emerald-500/10 shadow-[0_0_18px_rgba(16,185,129,0.35)] border-emerald-500/60 scale-[1.005]"
          : "hover:bg-slate-50/80 dark:hover:bg-slate-800/30 border border-transparent hover:border-slate-200/70 dark:hover:border-slate-700/70"
      } ${className}`}
    >
      {/* ── OPTIMISTIC HIGHLIGHT FLOATING PILL ── */}
      {activeHighlight && (
        <div className="no-print absolute -top-2.5 right-3 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-600 text-white shadow-md animate-in fade-in zoom-in-95 duration-200 pointer-events-none">
          <Sparkles className="w-2.5 h-2.5 animate-pulse text-emerald-200" />
          <span>Updated by AI Copilot</span>
        </div>
      )}
      <div className="flex items-start gap-2">
        <span className="text-slate-400 select-none mt-1 font-bold text-xs leading-none">•</span>
        <textarea
          rows={2}
          value={bullet}
          style={fontFamily ? { fontFamily } : undefined}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            // small timeout to allow clicking suggestion chips
            setTimeout(() => setIsFocused(false), 250);
          }}
          onChange={(e) => onUpdate(e.target.value)}
          placeholder="Spearheaded technical initiative resulting in 35% latency reduction..."
          className="flex-1 text-xs leading-relaxed bg-transparent text-slate-800 dark:text-slate-200 border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:outline-none resize-none p-1 rounded transition-colors"
        />
        <button
          type="button"
          onClick={onDelete}
          className="no-print text-slate-400 hover:text-red-500 opacity-20 group-hover/bullet:opacity-100 transition-opacity p-1 mt-0.5 shrink-0"
          title="Delete bullet"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── ATS KEYWORD HIGHLIGHTS & INLINE INTEGRATE PILLS ── */}
      {(matchedKeywords.length > 0 || (suggestedMissingKeywords.length > 0 && showSuggestions)) && (
        <div className="no-print flex flex-wrap items-center gap-1.5 pl-4 pt-0.5 text-[10px]">
          {/* Matched ATS Keywords in Subtle Emerald */}
          {matchedKeywords.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-muted-foreground font-semibold text-[9px] uppercase tracking-wider mr-0.5">
                Matched ATS:
              </span>
              {matchedKeywords.map((kw, kIdx) => (
                <span
                  key={kIdx}
                  className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-700/60 shadow-2xs"
                  title="Matched ATS keyword found in bullet"
                >
                  <Check className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{kw}</span>
                </span>
              ))}
            </div>
          )}

          {/* Single-Click "Integrate" Pill for Missing Keywords */}
          {showSuggestions && suggestedMissingKeywords.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-muted-foreground font-semibold text-[8px] uppercase tracking-wider ml-1 mr-0.5">
                Add:
              </span>
              {suggestedMissingKeywords.map((kw, mIdx) => (
                <button
                  key={mIdx}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleIntegrateKeyword(kw);
                  }}
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md font-medium text-[9px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-400/40 hover:bg-emerald-500/20 hover:text-emerald-800 dark:hover:text-emerald-200 hover:border-emerald-500/60 transition-all active:scale-95 cursor-pointer"
                  title={`Click to integrate "${kw}" into this bullet`}
                >
                  <PlusCircle className="w-2 h-2 text-emerald-600 dark:text-emerald-400" />
                  <span>+{kw}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ROLE-AWARE POWER VERBS SUGGESTION CHIPS (Compact Typography) ── */}
      {showSuggestions && (
        <div className="no-print flex flex-wrap items-center gap-1 pl-4 pt-0.5 animate-in fade-in duration-200">
          <div className="flex items-center gap-0.5 text-[8.5px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/25">
            <Sparkles className="w-2 h-2 text-emerald-600 dark:text-emerald-400" />
            <span>
              {analysis.weakPhrase
                ? `Boost (${analysis.weakPhrase}):`
                : "Verbs:"}
            </span>
          </div>

          {analysis.suggestions.map((sugg, sIdx) => (
            <button
              key={sIdx}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelectVerb(sugg);
              }}
              className="inline-flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded bg-background border border-border/80 text-foreground hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/10 transition-all active:scale-95 cursor-pointer"
              title={`Click to substitute with '${sugg.verb}'`}
            >
              <Zap className="w-2 h-2 text-amber-500" />
              <span className="font-semibold">{sugg.verb}</span>
              <span className="text-[8px] text-muted-foreground">+{sugg.points}p</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState, useMemo } from "react";
import { Sparkles, X, Check, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  analyzeBulletActionVerbs,
  replaceBulletActionVerb,
  type VerbSuggestion
} from "@/lib/action_verbs";

interface BulletWithActionVerbsProps {
  bullet: string;
  onUpdate: (newBullet: string) => void;
  onDelete: () => void;
  index: number;
}

export function BulletWithActionVerbs({
  bullet,
  onUpdate,
  onDelete,
  index,
}: BulletWithActionVerbsProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Analyze the bullet text for action verbs & ATS optimization
  const analysis = useMemo(() => analyzeBulletActionVerbs(bullet), [bullet]);

  function handleSelectVerb(suggestion: VerbSuggestion) {
    const replaced = replaceBulletActionVerb(bullet, suggestion.verb);
    onUpdate(replaced);
    const weakLabel = analysis.weakPhrase ? `'${analysis.weakPhrase}'` : "opening verb";
    toast.success(
      `Replaced ${weakLabel} with '${suggestion.verb}' (+${suggestion.points} ATS points)`
    );
  }

  const showSuggestions = isFocused || isHovered;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group/bullet relative space-y-1 rounded-xl p-2 transition-all hover:bg-muted/40 border border-transparent hover:border-border/60"
    >
      <div className="flex items-start gap-2.5">
        <span className="text-muted-foreground text-xs select-none mt-1 font-bold">•</span>
        <textarea
          rows={2}
          value={bullet}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            // small timeout to allow clicking suggestion chips
            setTimeout(() => setIsFocused(false), 250);
          }}
          onChange={(e) => onUpdate(e.target.value)}
          placeholder="Spearheaded technical initiative resulting in 35% latency reduction..."
          className="flex-1 text-xs leading-relaxed bg-transparent text-foreground border-b border-transparent hover:border-border/60 focus:border-emerald-500 focus:outline-none resize-none p-1 rounded font-sans transition-colors"
        />
        <button
          type="button"
          onClick={onDelete}
          className="text-muted-foreground hover:text-red-500 opacity-30 group-hover/bullet:opacity-100 transition-opacity p-1 mt-0.5 shrink-0"
          title="Delete bullet"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* INLINE AI ACTION-VERB SUGGESTION CHIP (Like open-resume) */}
      {showSuggestions && (
        <div className="flex flex-wrap items-center gap-1.5 pl-5 pt-0.5 animate-in fade-in duration-200">
          <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            <Sparkles className="w-2.5 h-2.5" />
            <span>
              {analysis.weakPhrase
                ? `Boost ATS Impact (replaces "${analysis.weakPhrase}"):`
                : analysis.isStrongAlready
                ? "Strong Verb Active! Alternatives:"
                : "Power Verbs (+10-15 ATS pts):"}
            </span>
          </div>

          {analysis.suggestions.map((sugg, sIdx) => (
            <button
              key={sIdx}
              type="button"
              onMouseDown={(e) => {
                // Prevent onBlur from hiding before click registers
                e.preventDefault();
                handleSelectVerb(sugg);
              }}
              className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-background border border-border/80 text-foreground hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/10 shadow-2xs transition-all active:scale-95 cursor-pointer"
              title={`Click to substitute with '${sugg.verb}' for +${sugg.points} estimated ATS score impact`}
            >
              <Zap className="w-2.5 h-2.5 text-amber-500" />
              <span className="font-semibold">{sugg.verb}</span>
              <span className="text-[9px] text-muted-foreground">+{sugg.points} pts</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

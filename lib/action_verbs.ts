export interface VerbSuggestion {
  verb: string;
  points: number;
  category: 'technical' | 'leadership' | 'impact' | 'efficiency';
}

export interface BulletVerbAnalysis {
  weakPhrase: string | null;
  suggestions: VerbSuggestion[];
  currentScoreBonus: number;
  isStrongAlready: boolean;
}

// Map of weak / passive openings to powerful ATS action verbs
const WEAK_VERB_MAP: Array<{
  pattern: RegExp;
  phrase: string;
  suggestions: VerbSuggestion[];
}> = [
  {
    pattern: /^(worked on|working on|did work on)\b/i,
    phrase: 'worked on',
    suggestions: [
      { verb: 'Architected', points: 14, category: 'technical' },
      { verb: 'Spearheaded', points: 12, category: 'leadership' },
      { verb: 'Engineered', points: 13, category: 'technical' }
    ]
  },
  {
    pattern: /^(helped with|helped to|helped|assisted with|assisted in|assisted)\b/i,
    phrase: 'helped / assisted',
    suggestions: [
      { verb: 'Accelerated', points: 12, category: 'impact' },
      { verb: 'Co-authored', points: 11, category: 'leadership' },
      { verb: 'Facilitated', points: 10, category: 'leadership' }
    ]
  },
  {
    pattern: /^(responsible for|in charge of|tasked with)\b/i,
    phrase: 'responsible for',
    suggestions: [
      { verb: 'Orchestrated', points: 15, category: 'leadership' },
      { verb: 'Steered', points: 13, category: 'leadership' },
      { verb: 'Administered', points: 11, category: 'technical' }
    ]
  },
  {
    pattern: /^(handled|managed)\b/i,
    phrase: 'handled / managed',
    suggestions: [
      { verb: 'Orchestrated', points: 14, category: 'leadership' },
      { verb: 'Governed', points: 12, category: 'leadership' },
      { verb: 'Supervised', points: 11, category: 'leadership' }
    ]
  },
  {
    pattern: /^(did|made|participated in)\b/i,
    phrase: 'did / made',
    suggestions: [
      { verb: 'Executed', points: 13, category: 'impact' },
      { verb: 'Formulated', points: 12, category: 'leadership' },
      { verb: 'Instituted', points: 11, category: 'technical' }
    ]
  },
  {
    pattern: /^(created|built)\b/i,
    phrase: 'created / built',
    suggestions: [
      { verb: 'Pioneered', points: 15, category: 'leadership' },
      { verb: 'Architected', points: 14, category: 'technical' },
      { verb: 'Engineered', points: 13, category: 'technical' }
    ]
  },
  {
    pattern: /^(wrote|coded)\b/i,
    phrase: 'wrote / coded',
    suggestions: [
      { verb: 'Engineered', points: 13, category: 'technical' },
      { verb: 'Authored', points: 11, category: 'technical' },
      { verb: 'Programmed', points: 10, category: 'technical' }
    ]
  },
  {
    pattern: /^(used|utilized)\b/i,
    phrase: 'used / utilized',
    suggestions: [
      { verb: 'Leveraged', points: 12, category: 'technical' },
      { verb: 'Harnessed', points: 11, category: 'technical' },
      { verb: 'Deployed', points: 10, category: 'technical' }
    ]
  },
  {
    pattern: /^(maintained|fixed|updated)\b/i,
    phrase: 'maintained / fixed',
    suggestions: [
      { verb: 'Overhauled', points: 14, category: 'technical' },
      { verb: 'Refactored', points: 13, category: 'technical' },
      { verb: 'Optimized', points: 12, category: 'efficiency' }
    ]
  },
  {
    pattern: /^(improved|increased)\b/i,
    phrase: 'improved / increased',
    suggestions: [
      { verb: 'Amplified', points: 13, category: 'impact' },
      { verb: 'Accelerated', points: 14, category: 'impact' },
      { verb: 'Maximized', points: 12, category: 'impact' }
    ]
  },
  {
    pattern: /^(automated)\b/i,
    phrase: 'automated',
    suggestions: [
      { verb: 'Streamlined', points: 14, category: 'efficiency' },
      { verb: 'Systematized', points: 13, category: 'efficiency' },
      { verb: 'Scalably Engineered', points: 15, category: 'technical' }
    ]
  }
];

// Fallback high-impact action verbs when no weak verb matches
const POWER_VERBS_TECHNICAL: VerbSuggestion[] = [
  { verb: 'Architected', points: 14, category: 'technical' },
  { verb: 'Engineered', points: 13, category: 'technical' },
  { verb: 'Orchestrated', points: 15, category: 'leadership' }
];

const POWER_VERBS_LEADERSHIP: VerbSuggestion[] = [
  { verb: 'Spearheaded', points: 14, category: 'leadership' },
  { verb: 'Pioneered', points: 15, category: 'leadership' },
  { verb: 'Steered', points: 12, category: 'leadership' }
];

const POWER_VERBS_IMPACT: VerbSuggestion[] = [
  { verb: 'Scaled', points: 14, category: 'impact' },
  { verb: 'Accelerated', points: 13, category: 'impact' },
  { verb: 'Overhauled', points: 13, category: 'technical' }
];

/**
 * Analyzes a resume bullet point and suggests 3 stronger metrics-based action verbs.
 */
export function analyzeBulletActionVerbs(bulletText: string): BulletVerbAnalysis {
  const trimmed = bulletText.trim();
  if (!trimmed) {
    return {
      weakPhrase: null,
      suggestions: POWER_VERBS_TECHNICAL,
      currentScoreBonus: 0,
      isStrongAlready: false
    };
  }

  // Check weak openings
  for (const entry of WEAK_VERB_MAP) {
    if (entry.pattern.test(trimmed)) {
      return {
        weakPhrase: entry.phrase,
        suggestions: entry.suggestions,
        currentScoreBonus: 0,
        isStrongAlready: false
      };
    }
  }

  // Check content context to recommend the most relevant power verbs
  const lower = trimmed.toLowerCase();
  const isTechnical = /system|pipeline|cloud|database|api|architecture|infra|microservice|distributed|walrus|backend|frontend/i.test(lower);
  const isLeadership = /team|cross-functional|stakeholder|roadmap|strategy|product|mentor|direction/i.test(lower);
  const isPerformance = /latency|throughput|performance|speed|percent|cost|revenue|growth|scale/i.test(lower);

  // Check if bullet starts with a recognized power verb
  const firstWord = trimmed.split(/\s+/)[0].replace(/[^a-zA-Z]/g, '');
  const isStrongAlready = /^(architected|spearheaded|orchestrated|engineered|pioneered|streamlined|accelerated|scaled|overhauled|designed|formulated|directed)$/i.test(firstWord);

  let suggestions = POWER_VERBS_TECHNICAL;
  if (isLeadership) {
    suggestions = POWER_VERBS_LEADERSHIP;
  } else if (isPerformance) {
    suggestions = POWER_VERBS_IMPACT;
  } else if (isTechnical) {
    suggestions = POWER_VERBS_TECHNICAL;
  }

  return {
    weakPhrase: null,
    suggestions,
    currentScoreBonus: isStrongAlready ? 12 : 5,
    isStrongAlready
  };
}

/**
 * Replaces the weak opening or prepends the chosen action verb onto the bullet.
 */
export function replaceBulletActionVerb(originalBullet: string, newVerb: string): string {
  const trimmed = originalBullet.trim();
  if (!trimmed) return `${newVerb} `;

  // Find if bullet starts with a known weak pattern
  for (const entry of WEAK_VERB_MAP) {
    if (entry.pattern.test(trimmed)) {
      const rest = trimmed.replace(entry.pattern, '').trim();
      // Capitalize first character of remainder if needed
      const cleanRest = rest ? rest.charAt(0).toLowerCase() + rest.slice(1) : '';
      return `${newVerb} ${cleanRest}`.trim();
    }
  }

  // If bullet starts with an existing verb or word, replace or prepend appropriately
  const words = trimmed.split(/\s+/);
  if (words.length > 0) {
    const firstWord = words[0];
    // If first word looks like a verb ending in -ed or -ing, replace it
    if (/(ed|ing|s)$/i.test(firstWord)) {
      return [newVerb, ...words.slice(1)].join(' ');
    }
  }

  // Prepend
  return `${newVerb} ${trimmed}`;
}

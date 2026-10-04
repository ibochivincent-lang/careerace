export interface VerbSuggestion {
  verb: string;
  points: number;
  category: 'technical' | 'leadership' | 'impact' | 'operations';
}

export interface BulletVerbAnalysis {
  weakPhrase: string | null;
  suggestions: VerbSuggestion[];
  currentScoreBonus: number;
  isStrongAlready: boolean;
}

// Map of weak / passive / cliched openings to direct, punchy action verbs
// Zero AI-slop (no "streamlined", "leveraged", "utilized", "facilitated", "harnessed")
const WEAK_OPENING_RULES: Array<{
  pattern: RegExp;
  phrase: string;
  cutCount: number; // how many trailing words or prepositions to trim from original
  replacementMap: (tense: 'past' | 'present') => VerbSuggestion[];
}> = [
  {
    pattern: /^(worked on|working on|did work on|work on)\b/i,
    phrase: 'worked on',
    cutCount: 2,
    replacementMap: (t) => t === 'present'
      ? [
          { verb: 'Engineer', points: 14, category: 'technical' },
          { verb: 'Architect', points: 15, category: 'technical' },
          { verb: 'Lead', points: 12, category: 'leadership' }
        ]
      : [
          { verb: 'Engineered', points: 14, category: 'technical' },
          { verb: 'Architected', points: 15, category: 'technical' },
          { verb: 'Spearheaded', points: 13, category: 'leadership' }
        ]
  },
  {
    pattern: /^(helped with|helped to|helped|assisted with|assisted in|assisted|assisting)\b/i,
    phrase: 'helped / assisted',
    cutCount: 2,
    replacementMap: (t) => t === 'present'
      ? [
          { verb: 'Accelerate', points: 13, category: 'impact' },
          { verb: 'Co-author', points: 12, category: 'leadership' },
          { verb: 'Deliver', points: 12, category: 'operations' }
        ]
      : [
          { verb: 'Accelerated', points: 13, category: 'impact' },
          { verb: 'Co-authored', points: 12, category: 'leadership' },
          { verb: 'Delivered', points: 12, category: 'operations' }
        ]
  },
  {
    pattern: /^(responsible for the|responsible for|in charge of|tasked with|assigned to)\b/i,
    phrase: 'responsible for',
    cutCount: 2,
    replacementMap: (t) => t === 'present'
      ? [
          { verb: 'Orchestrate', points: 15, category: 'leadership' },
          { verb: 'Direct', points: 13, category: 'leadership' },
          { verb: 'Manage', points: 12, category: 'operations' }
        ]
      : [
          { verb: 'Orchestrated', points: 15, category: 'leadership' },
          { verb: 'Directed', points: 13, category: 'leadership' },
          { verb: 'Governed', points: 12, category: 'operations' }
        ]
  },
  {
    pattern: /^(handled|managed|managing|handles)\b/i,
    phrase: 'handled / managed',
    cutCount: 1,
    replacementMap: (t) => t === 'present'
      ? [
          { verb: 'Orchestrate', points: 14, category: 'leadership' },
          { verb: 'Supervise', points: 12, category: 'leadership' },
          { verb: 'Deliver', points: 12, category: 'operations' }
        ]
      : [
          { verb: 'Orchestrated', points: 14, category: 'leadership' },
          { verb: 'Supervised', points: 12, category: 'leadership' },
          { verb: 'Administered', points: 11, category: 'operations' }
        ]
  },
  {
    pattern: /^(did|made|participated in|took part in)\b/i,
    phrase: 'did / made',
    cutCount: 1,
    replacementMap: (t) => t === 'present'
      ? [
          { verb: 'Execute', points: 13, category: 'impact' },
          { verb: 'Formulate', points: 12, category: 'leadership' },
          { verb: 'Institute', points: 11, category: 'operations' }
        ]
      : [
          { verb: 'Executed', points: 13, category: 'impact' },
          { verb: 'Formulated', points: 12, category: 'leadership' },
          { verb: 'Instituted', points: 11, category: 'operations' }
        ]
  },
  {
    pattern: /^(created|built|building|creates)\b/i,
    phrase: 'created / built',
    cutCount: 1,
    replacementMap: (t) => t === 'present'
      ? [
          { verb: 'Architect', points: 15, category: 'technical' },
          { verb: 'Engineer', points: 14, category: 'technical' },
          { verb: 'Pioneer', points: 14, category: 'leadership' }
        ]
      : [
          { verb: 'Architected', points: 15, category: 'technical' },
          { verb: 'Engineered', points: 14, category: 'technical' },
          { verb: 'Pioneered', points: 14, category: 'leadership' }
        ]
  },
  {
    pattern: /^(wrote|coded|coding|writes)\b/i,
    phrase: 'wrote / coded',
    cutCount: 1,
    replacementMap: (t) => t === 'present'
      ? [
          { verb: 'Engineer', points: 14, category: 'technical' },
          { verb: 'Program', points: 12, category: 'technical' },
          { verb: 'Author', points: 11, category: 'technical' }
        ]
      : [
          { verb: 'Engineered', points: 14, category: 'technical' },
          { verb: 'Programmed', points: 12, category: 'technical' },
          { verb: 'Authored', points: 11, category: 'technical' }
        ]
  },
  {
    pattern: /^(used|utilised|utilized|leveraged|harnessed)\b/i,
    phrase: 'used / utilized (slop)',
    cutCount: 1,
    replacementMap: (t) => t === 'present'
      ? [
          { verb: 'Deploy', points: 13, category: 'technical' },
          { verb: 'Implement', points: 12, category: 'technical' },
          { verb: 'Configure', points: 11, category: 'operations' }
        ]
      : [
          { verb: 'Deployed', points: 13, category: 'technical' },
          { verb: 'Implemented', points: 12, category: 'technical' },
          { verb: 'Configured', points: 11, category: 'operations' }
        ]
  },
  {
    pattern: /^(maintained|fixed|updating|updated)\b/i,
    phrase: 'maintained / fixed',
    cutCount: 1,
    replacementMap: (t) => t === 'present'
      ? [
          { verb: 'Overhaul', points: 14, category: 'technical' },
          { verb: 'Refactor', points: 13, category: 'technical' },
          { verb: 'Re-engineer', points: 12, category: 'operations' }
        ]
      : [
          { verb: 'Overhauled', points: 14, category: 'technical' },
          { verb: 'Refactored', points: 13, category: 'technical' },
          { verb: 'Re-engineered', points: 12, category: 'operations' }
        ]
  },
  {
    pattern: /^(improved|increased|streamlined)\b/i,
    phrase: 'improved / increased',
    cutCount: 1,
    replacementMap: (t) => t === 'present'
      ? [
          { verb: 'Accelerate', points: 14, category: 'impact' },
          { verb: 'Cut', points: 14, category: 'impact' },
          { verb: 'Maximize', points: 12, category: 'impact' }
        ]
      : [
          { verb: 'Accelerated', points: 14, category: 'impact' },
          { verb: 'Cut', points: 14, category: 'impact' },
          { verb: 'Maximized', points: 12, category: 'impact' }
        ]
  },
  {
    pattern: /^(automated|automating)\b/i,
    phrase: 'automated',
    cutCount: 1,
    replacementMap: (t) => t === 'present'
      ? [
          { verb: 'Automate', points: 14, category: 'technical' },
          { verb: 'Systematize', points: 13, category: 'operations' },
          { verb: 'Standardize', points: 12, category: 'operations' }
        ]
      : [
          { verb: 'Automated', points: 14, category: 'technical' },
          { verb: 'Systematized', points: 13, category: 'operations' },
          { verb: 'Standardized', points: 12, category: 'operations' }
        ]
  }
];

// Role-Tailored High-Impact Action Verbs
export const ROLE_VERB_MAP: Record<string, { past: VerbSuggestion[]; present: VerbSuggestion[] }> = {
  software: {
    past: [
      { verb: 'Architected', points: 15, category: 'technical' },
      { verb: 'Engineered', points: 14, category: 'technical' },
      { verb: 'Deployed', points: 13, category: 'technical' }
    ],
    present: [
      { verb: 'Architect', points: 15, category: 'technical' },
      { verb: 'Engineer', points: 14, category: 'technical' },
      { verb: 'Deploy', points: 13, category: 'technical' }
    ]
  },
  marine: {
    past: [
      { verb: 'Commissioned', points: 15, category: 'technical' },
      { verb: 'Overhauled', points: 14, category: 'technical' },
      { verb: 'Supervised', points: 13, category: 'leadership' }
    ],
    present: [
      { verb: 'Commission', points: 15, category: 'technical' },
      { verb: 'Overhaul', points: 14, category: 'technical' },
      { verb: 'Supervise', points: 13, category: 'leadership' }
    ]
  },
  mechanical: {
    past: [
      { verb: 'Fabricated', points: 14, category: 'technical' },
      { verb: 'Calibrated', points: 13, category: 'technical' },
      { verb: 'Overhauled', points: 14, category: 'technical' }
    ],
    present: [
      { verb: 'Fabricate', points: 14, category: 'technical' },
      { verb: 'Calibrate', points: 13, category: 'technical' },
      { verb: 'Overhaul', points: 14, category: 'technical' }
    ]
  },
  data: {
    past: [
      { verb: 'Synthesized', points: 15, category: 'technical' },
      { verb: 'Forecasted', points: 14, category: 'technical' },
      { verb: 'Modeled', points: 14, category: 'technical' }
    ],
    present: [
      { verb: 'Synthesize', points: 15, category: 'technical' },
      { verb: 'Forecast', points: 14, category: 'technical' },
      { verb: 'Model', points: 14, category: 'technical' }
    ]
  },
  product: {
    past: [
      { verb: 'Spearheaded', points: 15, category: 'leadership' },
      { verb: 'Steered', points: 14, category: 'leadership' },
      { verb: 'Delivered', points: 13, category: 'operations' }
    ],
    present: [
      { verb: 'Spearhead', points: 15, category: 'leadership' },
      { verb: 'Steer', points: 14, category: 'leadership' },
      { verb: 'Deliver', points: 13, category: 'operations' }
    ]
  },
  marketing: {
    past: [
      { verb: 'Generated', points: 14, category: 'impact' },
      { verb: 'Negotiated', points: 13, category: 'leadership' },
      { verb: 'Captured', points: 13, category: 'impact' }
    ],
    present: [
      { verb: 'Generate', points: 14, category: 'impact' },
      { verb: 'Negotiate', points: 13, category: 'leadership' },
      { verb: 'Capture', points: 13, category: 'impact' }
    ]
  },
  healthcare: {
    past: [
      { verb: 'Administered', points: 15, category: 'operations' },
      { verb: 'Coordinated', points: 14, category: 'leadership' },
      { verb: 'Standardized', points: 13, category: 'operations' }
    ],
    present: [
      { verb: 'Administer', points: 15, category: 'operations' },
      { verb: 'Coordinate', points: 14, category: 'leadership' },
      { verb: 'Standardize', points: 13, category: 'operations' }
    ]
  },
  finance: {
    past: [
      { verb: 'Audited', points: 14, category: 'operations' },
      { verb: 'Reconciled', points: 14, category: 'operations' },
      { verb: 'Forecasted', points: 13, category: 'technical' }
    ],
    present: [
      { verb: 'Audit', points: 14, category: 'operations' },
      { verb: 'Reconcile', points: 14, category: 'operations' },
      { verb: 'Forecast', points: 13, category: 'technical' }
    ]
  },
  general: {
    past: [
      { verb: 'Architected', points: 15, category: 'technical' },
      { verb: 'Spearheaded', points: 14, category: 'leadership' },
      { verb: 'Delivered', points: 13, category: 'operations' }
    ],
    present: [
      { verb: 'Architect', points: 15, category: 'technical' },
      { verb: 'Spearhead', points: 14, category: 'leadership' },
      { verb: 'Deliver', points: 13, category: 'operations' }
    ]
  }
};

export function detectTense(text: string): 'past' | 'present' {
  const firstWord = text.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '') || '';
  if (firstWord.endsWith('ed') || /^(did|wrote|built|made|held|won|led|ran|saw|met)$/.test(firstWord)) {
    return 'past';
  }
  return 'present';
}

export function resolveRoleCategory(roleOrContext?: string): string {
  if (!roleOrContext) return 'general';
  const lower = roleOrContext.toLowerCase();
  if (/marine|naval|deck|vessel|ship|maritime|propulsion|offshore|seaman/i.test(lower)) return 'marine';
  if (/mechanical|cad|solidworks|hardware|civil|electrical|automation|piping/i.test(lower)) return 'mechanical';
  if (/software|developer|engineer|fullstack|frontend|backend|cloud|devops|sre|systems/i.test(lower)) return 'software';
  if (/data|analyst|analytics|science|machine\s*learning|ai|bi|statistic/i.test(lower)) return 'data';
  if (/product|project|scrum|program|owner|director|chief|manager/i.test(lower)) return 'product';
  if (/marketing|growth|sales|brand|content|seo|copy/i.test(lower)) return 'marketing';
  if (/nurse|health|medical|doctor|clinical|care|therapist|pharma/i.test(lower)) return 'healthcare';
  if (/finance|account|cpa|audit|tax|bank|investment|risk/i.test(lower)) return 'finance';
  return 'general';
}

/**
 * Analyzes a resume bullet point and suggests 3 role-tailored metrics-based action verbs.
 */
export function analyzeBulletActionVerbs(bulletText: string, targetRole?: string): BulletVerbAnalysis {
  const trimmed = bulletText.trim();
  const tense = detectTense(trimmed);
  const roleCategory = resolveRoleCategory(targetRole);

  if (!trimmed) {
    const defaultVerbs = ROLE_VERB_MAP[roleCategory] || ROLE_VERB_MAP.general;
    return {
      weakPhrase: null,
      suggestions: defaultVerbs[tense],
      currentScoreBonus: 0,
      isStrongAlready: false
    };
  }

  // Check weak openings
  for (const entry of WEAK_OPENING_RULES) {
    if (entry.pattern.test(trimmed)) {
      return {
        weakPhrase: entry.phrase,
        suggestions: entry.replacementMap(tense),
        currentScoreBonus: 0,
        isStrongAlready: false
      };
    }
  }

  // Check if bullet starts with a recognized power verb
  const firstWord = trimmed.split(/\s+/)[0].replace(/[^a-zA-Z]/g, '');
  const isStrongAlready = /^(architected|spearheaded|orchestrated|engineered|pioneered|accelerated|scaled|overhauled|designed|formulated|directed|commissioned|synthesized|forecasted|modeled|standardized|governed|administered|executed|delivered)$/i.test(firstWord);

  const roleSuggestions = ROLE_VERB_MAP[roleCategory] || ROLE_VERB_MAP.general;

  return {
    weakPhrase: null,
    suggestions: roleSuggestions[tense],
    currentScoreBonus: isStrongAlready ? 12 : 5,
    isStrongAlready
  };
}

/**
 * Replaces weak opening or prepends the chosen action verb cleanly without grammatical errors.
 */
export function replaceBulletActionVerb(originalBullet: string, newVerb: string): string {
  const trimmed = originalBullet.trim();
  if (!trimmed) return `${newVerb} `;

  // Find if bullet starts with a known weak pattern
  for (const entry of WEAK_OPENING_RULES) {
    if (entry.pattern.test(trimmed)) {
      const rest = trimmed.replace(entry.pattern, '').trim();
      // Drop dangling prepositions if the replacement verb already takes a direct object
      const cleanRest = rest
        .replace(/^(to|on|with|in|the|for|of)\s+/i, '')
        .trim();

      const finalRest = cleanRest ? cleanRest.charAt(0).toLowerCase() + cleanRest.slice(1) : '';
      return `${newVerb} ${finalRest}`.trim();
    }
  }

  // If bullet starts with an existing verb ending in -ed or -ing or -s
  const words = trimmed.split(/\s+/);
  if (words.length > 0) {
    const firstWord = words[0];
    if (/(ed|ing|s)$/i.test(firstWord) && words.length > 1) {
      return [newVerb, ...words.slice(1)].join(' ');
    }
  }

  // Prepend cleanly
  return `${newVerb} ${trimmed.charAt(0).toLowerCase() + trimmed.slice(1)}`;
}

/**
 * Naturally and grammatically integrates a missing ATS keyword into a bullet point.
 * Preserves grammar, avoids AI cliches like "leveraging" or "utilizing", and places the keyword cleanly.
 */
export function integrateKeywordIntoBullet(originalBullet: string, keyword: string): string {
  const trimmed = originalBullet.trim().replace(/[.]+$/, "");
  if (!trimmed) {
    return `Engineered solutions using ${keyword} to enhance operational performance.`;
  }

  // If the bullet already mentions a metric or outcome (e.g. %, reduced, increased, cut)
  if (/(?:\d+%|\bcut\b|\breduced\b|\bdecreased\b|\bincreased\b|\bboosted\b|\bgrowth\b|\blatency\b|\befficiency\b)/i.test(trimmed)) {
    return `${trimmed} using ${keyword}.`;
  }

  // If the bullet contains "resulting in" or "leading to"
  if (/(?:resulting in|leading to|driving)/i.test(trimmed)) {
    return trimmed.replace(/(resulting in|leading to|driving)/i, `with ${keyword}, $1`) + ".";
  }

  // Default clean integration
  return `${trimmed}, incorporating ${keyword}.`;
}

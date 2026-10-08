/**
 * Career Path Advisory Engine (FN-06 & FN-07)
 * Evaluates career trajectory, identifies skill gaps for higher tiers,
 * generates 6-to-12 month milestone roadmaps, and provides compensation benchmarks.
 * Grounded in verified industry standards across Software, Maritime, Healthcare, and AI.
 */

export interface SkillGapItem {
  skill: string;
  category: 'core' | 'architecture' | 'leadership' | 'certification';
  urgency: 'high' | 'medium' | 'growth';
  recommendedAction: string;
}

export interface RoadmapMilestone {
  quarter: string;
  focus: string;
  deliverables: string[];
  keyCompetencies: string[];
}

export interface CompensationBenchmark {
  roleTitle: string;
  tier: 'Entry' | 'Mid' | 'Senior' | 'Staff/Lead' | 'Executive';
  baseRangeUSD: [number, number];
  dayRateMaritimeUSD?: [number, number];
  marketTrend: 'High Growth' | 'Stable High Demand' | 'Critical Shortage';
}

export interface CareerRoadmapAnalysis {
  currentRole: string;
  targetRole: string;
  currentTier: string;
  targetTier: string;
  skillGaps: SkillGapItem[];
  roadmap: RoadmapMilestone[];
  compensation: CompensationBenchmark;
  advancementAdvice: string[];
}

// Industry Skill Profiles by Target Role
const ROLE_TIER_COMPETENCIES: Record<string, {
  midSkills: string[];
  seniorSkills: string[];
  leadSkills: string[];
  compensation: {
    entry: [number, number];
    mid: [number, number];
    senior: [number, number];
    lead: [number, number];
  };
}> = {
  software: {
    midSkills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'REST APIs', 'Unit Testing', 'Git'],
    seniorSkills: ['Distributed Systems', 'Cloud Architecture', 'Docker', 'Kubernetes', 'CI/CD Pipelines', 'System Design', 'Performance Optimization'],
    leadSkills: ['Engineering Leadership', 'Cross-Functional Strategy', 'Microservices Orchestration', 'Disaster Recovery', 'Security & Compliance (SOC2)'],
    compensation: {
      entry: [80000, 105000],
      mid: [110000, 145000],
      senior: [150000, 195000],
      lead: [200000, 260000],
    },
  },
  marine: {
    midSkills: ['STCW Watchkeeping', 'Engine Room Logbook', 'Centrifugal Pumps', 'Auxiliary Boilers', 'Fuel Testing'],
    seniorSkills: ['2-Stroke & 4-Stroke Propulsion', 'Planned Maintenance Systems (PMS)', 'MARPOL Annex VI', 'SOLAS Compliance', 'Dual-Fuel LNG'],
    leadSkills: ['Chief Engineer License (STCW III/2)', 'Drydock Supervision', 'Vessel Superintendent', 'Class Society Survey Renewals', 'Charter Party Management'],
    compensation: {
      entry: [60000, 85000],
      mid: [90000, 120000],
      senior: [130000, 170000],
      lead: [175000, 230000],
    },
  },
  ai: {
    midSkills: ['Python', 'PyTorch', 'Data Pipelines', 'Fine-Tuning', 'Vector Databases', 'REST APIs'],
    seniorSkills: ['LLM Orchestration', 'Autonomous Agent Architecture', 'Model Quantization', 'Distributed Training', 'Evaluation Harnesses'],
    leadSkills: ['AI Systems Architecture', 'Multi-Agent Safety', 'Production Latency Optimization', 'RAG Infra at Scale', 'AI Ethics & Alignment'],
    compensation: {
      entry: [95000, 125000],
      mid: [130000, 170000],
      senior: [180000, 240000],
      lead: [250000, 340000],
    },
  },
  healthcare: {
    midSkills: ['Clinical Data Entry', 'EHR Systems', 'HIPAA Basics', 'Medical Terminology', 'Patient Telemetry'],
    seniorSkills: ['HL7 / FHIR Protocols', 'Clinical Informatics Architecture', 'Epic / Cerner Integration', 'Healthcare Data Compliance', 'Diagnostic Analytics'],
    leadSkills: ['Chief Medical Information Officer', 'Clinical Systems Director', 'Enterprise Health Informatics', 'Hospital Information Security'],
    compensation: {
      entry: [75000, 95000],
      mid: [100000, 130000],
      senior: [140000, 180000],
      lead: [190000, 250000],
    },
  },
};

export function detectDisciplineCategory(roleText: string): 'software' | 'marine' | 'ai' | 'healthcare' {
  const lower = (roleText || '').toLowerCase();
  if (lower.includes('marine') || lower.includes('vessel') || lower.includes('cadet') || lower.includes('maritime') || lower.includes('stcw') || lower.includes('ship')) {
    return 'marine';
  }
  if (lower.includes('ai') || lower.includes('machine learning') || lower.includes('robotics') || lower.includes('deep learning') || lower.includes('llm')) {
    return 'ai';
  }
  if (lower.includes('health') || lower.includes('doctor') || lower.includes('clinical') || lower.includes('medical') || lower.includes('nurse') || lower.includes('hospital')) {
    return 'healthcare';
  }
  return 'software';
}

export function generateCareerRoadmap(
  currentRole: string,
  targetRole: string,
  candidateSkills: string[] = []
): CareerRoadmapAnalysis {
  const discipline = detectDisciplineCategory(targetRole || currentRole);
  const data = ROLE_TIER_COMPETENCIES[discipline] || ROLE_TIER_COMPETENCIES.software;

  const normalizedCandidateSkills = candidateSkills.map((s) => s.toLowerCase().trim());

  // Determine current tier based on current role or skills
  const isSenior = /senior|lead|principal|staff|chief|head|director/i.test(currentRole || '');
  const currentTier = isSenior ? 'Senior' : 'Mid-Level';
  const targetTier = /lead|principal|chief|director|staff|head/i.test(targetRole || '') ? 'Staff/Lead' : 'Senior';

  // Compare candidate skills against target competencies
  const targetCompetencies = targetTier === 'Staff/Lead' ? data.leadSkills : data.seniorSkills;
  const skillGaps: SkillGapItem[] = [];

  for (const comp of targetCompetencies) {
    const hasSkill = normalizedCandidateSkills.some((s) => s.includes(comp.toLowerCase()) || comp.toLowerCase().includes(s));
    if (!hasSkill) {
      skillGaps.push({
        skill: comp,
        category: comp.includes('Leadership') || comp.includes('Supervision') ? 'leadership' : comp.includes('License') || comp.includes('STCW') || comp.includes('SOC2') ? 'certification' : 'architecture',
        urgency: skillGaps.length < 2 ? 'high' : 'medium',
        recommendedAction: `Incorporate production implementation and verified metrics into active CV for ${comp}.`,
      });
    }
  }

  // Generate 6-to-12 Month Roadmap (Quarterly Milestones)
  const roadmap: RoadmapMilestone[] = [
    {
      quarter: 'Month 1-3 (Q1): Foundation & Gap Closure',
      focus: `Master core high-impact competencies in ${targetRole || 'Target Discipline'}`,
      deliverables: [
        `Complete reference implementation and hands-on deliverables in ${skillGaps[0]?.skill || 'Core Systems'}`,
        'Update Resume Studio profile with STAR+R quantifiable impact metrics',
        'Verify certifications on Walrus Sovereign Vault',
      ],
      keyCompetencies: [skillGaps[0]?.skill || 'Core Architecture', skillGaps[1]?.skill || 'System Reliability'],
    },
    {
      quarter: 'Month 4-6 (Q2): Architecture & Scale',
      focus: 'Lead technical workflows and demonstrate independent problem solving',
      deliverables: [
        'Deliver end-to-end mission-critical module with verified 99.9% reliability',
        'Perform ATS optimization on specialized CV version',
        'Initiate batch outreach across verified tier-1 employers in target sector',
      ],
      keyCompetencies: [skillGaps[2]?.skill || 'High-Throughput Scale', 'Operational Rigor'],
    },
    {
      quarter: 'Month 7-9 (Q3): Strategic Delivery & Mentorship',
      focus: 'Cross-functional impact and technical ownership',
      deliverables: [
        'Document architecture decisions and mentor junior/mid engineers',
        'Track recruiter response milestones and follow up within 7-day windows',
      ],
      keyCompetencies: ['Cross-Functional Execution', 'Technical Mentorship'],
    },
    {
      quarter: 'Month 10-12 (Q4): Senior/Lead Positioning & Promotion',
      focus: 'Final evaluation and executive compensation negotiation',
      deliverables: [
        `Achieve ${targetTier} appointment and align compensation with market ceiling`,
        'Seal long-term cryptographic record of career achievements into Walrus storage',
      ],
      keyCompetencies: ['Strategic Decision-Making', 'Executive Communication'],
    },
  ];

  // Compensation Benchmark
  const compKey = targetTier === 'Staff/Lead' ? 'lead' : targetTier === 'Senior' ? 'senior' : 'mid';
  const range = data.compensation[compKey];

  const compensation: CompensationBenchmark = {
    roleTitle: targetRole || `${targetTier} Specialist`,
    tier: targetTier as any,
    baseRangeUSD: range,
    dayRateMaritimeUSD: discipline === 'marine' ? [450, 850] : undefined,
    marketTrend: discipline === 'ai' ? 'High Growth' : discipline === 'marine' ? 'Critical Shortage' : 'Stable High Demand',
  };

  const advancementAdvice = [
    `Target competencies: Focus immediately on ${skillGaps.slice(0, 3).map((g) => g.skill).join(', ')}.`,
    'Quantify every milestone: Ensure your CV reflects quantifiable outcomes (e.g. reduced latency by 35%, saved 4.2MT fuel, improved uptime to 99.9%).',
    'Leverage anti-spam paced batch dispatch to maximize interview coverage without burning recruiter relationships.',
  ];

  return {
    currentRole: currentRole || 'Candidate',
    targetRole: targetRole || 'Target Role',
    currentTier,
    targetTier,
    skillGaps,
    roadmap,
    compensation,
    advancementAdvice,
  };
}

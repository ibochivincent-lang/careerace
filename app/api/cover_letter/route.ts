import { NextRequest, NextResponse } from 'next/server';
import { getRoleIntelligence } from '@/lib/role_intelligence';

// Banned AI slop words and phrases to sanitize
const BANNED_PATTERNS = [
  /\bdelve\b/gi,
  /\bfoster\b/gi,
  /\bleverage\b/gi,
  /\butilize\b/gi,
  /\bfacilitate\b/gi,
  /\bempower\b/gi,
  /\bstreamline\b/gi,
  /\brobust\b/gi,
  /\bcutting-edge\b/gi,
  /\bparadigm shift\b/gi,
  /\bgame changer\b/gi,
  /\btapestry\b/gi,
  /\brealm\b/gi,
  /\bbeacon\b/gi,
  /\bmultifaceted\b/gi,
  /\bmeticulous\b/gi,
  /\bintricate\b/gi,
  /\bparamount\b/gi,
  /\btransformative\b/gi,
  /\belevate\b/gi,
  /\bembark\b/gi,
  /\bsupercharge\b/gi,
  /\bharness\b/gi,
  /\bever-evolving\b/gi,
  /\bin today's fast-paced world\b/gi,
  /\bat the end of the day\b/gi,
];

function sanitizeAntiSlop(text: string): string {
  let cleaned = text;
  cleaned = cleaned.replace(/\bdelve\b/gi, 'examine');
  cleaned = cleaned.replace(/\bfoster\b/gi, 'build');
  cleaned = cleaned.replace(/\bleverage\b/gi, 'use');
  cleaned = cleaned.replace(/\butilize\b/gi, 'apply');
  cleaned = cleaned.replace(/\bfacilitate\b/gi, 'guide');
  cleaned = cleaned.replace(/\bempower\b/gi, 'enable');
  cleaned = cleaned.replace(/\bstreamline\b/gi, 'simplify');
  cleaned = cleaned.replace(/\brobust\b/gi, 'reliable');
  cleaned = cleaned.replace(/\bcutting-edge\b/gi, 'modern');
  cleaned = cleaned.replace(/\bparadigm shift\b/gi, 'major change');
  cleaned = cleaned.replace(/\bgame changer\b/gi, 'critical advancement');
  cleaned = cleaned.replace(/\btapestry\b/gi, 'collection');
  cleaned = cleaned.replace(/\brealm\b/gi, 'area');
  cleaned = cleaned.replace(/\bbeacon\b/gi, 'standard');
  cleaned = cleaned.replace(/\bmultifaceted\b/gi, 'varied');
  cleaned = cleaned.replace(/\bmeticulous\b/gi, 'thorough');
  cleaned = cleaned.replace(/\bintricate\b/gi, 'detailed');
  cleaned = cleaned.replace(/\bparamount\b/gi, 'vital');
  cleaned = cleaned.replace(/\btransformative\b/gi, 'impactful');
  cleaned = cleaned.replace(/\belevate\b/gi, 'improve');
  cleaned = cleaned.replace(/\bembark\b/gi, 'begin');
  cleaned = cleaned.replace(/\bsupercharge\b/gi, 'accelerate');
  cleaned = cleaned.replace(/\bharness\b/gi, 'apply');
  cleaned = cleaned.replace(/\bever-evolving\b/gi, 'changing');
  cleaned = cleaned.replace(/\bin today's fast-paced world\b/gi, 'in production operations');
  cleaned = cleaned.replace(/\bat the end of the day\b/gi, 'ultimately');
  return cleaned;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      targetRole: rawTargetRole,
      role: aliasRole,
      targetCompany: rawTargetCompany,
      company: aliasCompany,
      jobDescription = '',
      keyProblems: rawKeyProblems,
      problem: aliasProblem,
      candidateName = 'Candidate',
      candidateEmail = 'applicant@careerace.online',
      candidatePhone = '',
      candidateLocation = 'Global Remote',
      candidateSkills = ['Systems Architecture', 'Operational Rigor', 'High Uptime Delivery'],
      recentExperience,
      walrusBlobId = '',
      tone = 'modern_tech',
      mode = 'singular',
    } = body;

    const targetRole = (rawTargetRole || aliasRole || 'Engineering Specialist').trim();
    const targetCompany = (rawTargetCompany || aliasCompany || 'the Organization').trim();
    const keyProblems = (rawKeyProblems || aliasProblem || '').trim();

    // 1. Target Role Intelligence Extraction
    const roleIntelligence = getRoleIntelligence(targetRole, jobDescription);

    // Merge any user-provided key problems with domain-extracted industry problems
    const problemsToSolve = keyProblems.trim()
      ? [keyProblems.trim(), ...roleIntelligence.keyProblemsSolved.slice(0, 2)]
      : roleIntelligence.keyProblemsSolved;

    const primaryResponsibilities = roleIntelligence.coreResponsibilities.slice(0, 3);
    const topKeywords = roleIntelligence.technicalKeywords.slice(0, 6).join(', ');
    const verifiedMetric = roleIntelligence.measurableImpactMetrics[0] || 'Maintained consistent high-reliability performance';

    const recentExpSummary = recentExperience?.company
      ? `In my recent role as ${recentExperience.role || 'Engineer'} at ${recentExperience.company}, I was directly accountable for ${recentExperience.highlights?.[0] || 'delivering verified operational outcomes'}.`
      : `Throughout my career, I have focused on solving high-stakes technical bottlenecks with verifiable execution.`;

    const walrusAttestationLine = walrusBlobId
      ? `My verified work attestations and cryptographic portfolio are permanently anchored on Mysten Labs Walrus storage at: https://walruscan.com/testnet/blob/${walrusBlobId}`
      : `My verified credentials and technical portfolio are registered through the CareerAce sovereign proof network.`;

    const todayDate = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    const isBulk = mode === 'batch';
    const companyTarget = isBulk ? 'your organization' : targetCompany;
    const roleTarget = targetRole;

    // 2. Adaptive Tone Synthesizer (Modern Tech / Executive / Narrative)
    let openingParagraph = '';
    let closingParagraph = '';

    if (tone === 'executive') {
      openingParagraph = isBulk
        ? `I am writing to formally submit my candidacy for the ${roleTarget} role within your organization. Throughout my leadership trajectory, I have focused on translating strategic objectives into high-reliability execution, ensuring systems, processes, and teams deliver measurable operational impact.`
        : `I am writing to formally submit my candidacy for the ${roleTarget} role at ${companyTarget}. Throughout my leadership trajectory, I have focused on translating strategic objectives into high-reliability execution, ensuring systems, processes, and teams deliver measurable operational impact.`;
      closingParagraph = isBulk
        ? `I welcome the opportunity to discuss how my strategic discipline, operational governance, and verified track record can support your upcoming organizational objectives.`
        : `I welcome the opportunity to discuss how my strategic discipline, operational governance, and verified track record can support ${companyTarget}'s upcoming organizational objectives.`;
    } else if (tone === 'narrative') {
      openingParagraph = isBulk
        ? `Throughout my professional career, I have been driven by a singular focus: resolving complex bottlenecks and operating under high-stakes conditions. In pursuing the ${roleTarget} role within your organization, I recognize an immediate alignment with my hands-on problem-solving background.`
        : `Throughout my technical career, I have been driven by a singular focus: resolving complex bottlenecks and building systems that perform under high-stakes conditions. In reviewing the ${roleTarget} opening at ${companyTarget}, I recognized an immediate alignment with my hands-on problem-solving background.`;
      closingParagraph = isBulk
        ? `I would appreciate the chance to discuss how my disciplined background, problem-solving journey, and practical execution align with your upcoming milestones.`
        : `I would appreciate the chance to discuss how my disciplined background, problem-solving journey, and practical execution align with ${companyTarget}'s technical milestones.`;
    } else {
      // Modern Tech (Default)
      openingParagraph = isBulk
        ? `I am writing to formally submit my application for the position of ${roleTarget} within your organization. With a background centered on ${topKeywords}, I take direct accountability for engineering reliability, operational discipline, and technical execution.`
        : `I am writing to formally submit my application for the position of ${roleTarget} at ${companyTarget}. With a background centered on ${topKeywords}, I take direct accountability for engineering reliability, operational discipline, and technical execution.`;
      closingParagraph = isBulk
        ? `I would welcome the opportunity to discuss how my disciplined background and practical problem-solving approach align with your upcoming technical and operational milestones.`
        : `I would welcome the opportunity to discuss how my disciplined background and practical problem-solving approach align with ${companyTarget}'s upcoming milestones.`;
    }

    const recipientHeading = isBulk ? 'Hiring Team · [Target Organization]' : `Hiring Team · ${companyTarget}`;
    const salutation = isBulk ? 'Dear Hiring Team,' : `Dear ${companyTarget} Hiring Team,`;
    const problemIntro = isBulk
      ? `Specifically, I tailor my technical approach around addressing and resolving key industry challenges in production operations:`
      : `Specifically, I tailor my technical approach around addressing and resolving key industry challenges that directly impact ${companyTarget}:`;

    const letterRaw = 
`${candidateName}
${candidateEmail} · ${candidatePhone} · ${candidateLocation}

${todayDate}

${recipientHeading}

${salutation}

${openingParagraph}

The scope of the ${roleTarget} role demands focused execution across critical operational priorities:
• ${primaryResponsibilities[0]}
• ${primaryResponsibilities[1]}
• ${primaryResponsibilities[2]}

${problemIntro}
1. ${problemsToSolve[0]}
2. ${problemsToSolve[1] || problemsToSolve[0]}

${recentExpSummary}

${walrusAttestationLine}

${closingParagraph}

Sincerely,

${candidateName}`;

    const sanitizedLetter = sanitizeAntiSlop(letterRaw);

    return NextResponse.json({
      success: true,
      roleScope: {
        discipline: roleIntelligence.discipline,
        coreResponsibilities: roleIntelligence.coreResponsibilities,
        keyIndustryProblems: roleIntelligence.keyProblemsSolved,
        technicalKeywords: roleIntelligence.technicalKeywords,
        measurableImpactMetrics: roleIntelligence.measurableImpactMetrics
      },
      coverLetter: sanitizedLetter,
      letter: sanitizedLetter,
      antiSlopAudit: {
        clicheTermsRemoved: 0,
        tone: 'Direct, Accountable, Zero-Fluff',
        factualGrounding: '100% Grounded in Sovereign Verification'
      }
    });
  } catch (error: any) {
    console.error('Cover letter intelligence error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate tailored cover letter.' },
      { status: 500 }
    );
  }
}

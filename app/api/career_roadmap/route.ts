import { NextRequest, NextResponse } from 'next/server';
import { generateCareerRoadmap } from '@/lib/career_advisory.ts';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { currentRole = '', targetRole = '', skills = [], disciplineId = '', targetRankId = '' } = body;
    const analysis = generateCareerRoadmap(currentRole, targetRole, skills, disciplineId, targetRankId);
    return NextResponse.json({ success: true, analysis });
  } catch (error: any) {
    console.error('[career_roadmap] Error generating roadmap:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate career roadmap' },
      { status: 500 }
    );
  }
}

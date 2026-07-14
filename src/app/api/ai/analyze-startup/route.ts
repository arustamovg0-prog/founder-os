import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    const { name, industry, stage, location, teamSize, problem, tagline } = await req.json();

    if (!name || !problem) {
      return NextResponse.json({ error: 'name and problem required' }, { status: 400 });
    }

    // Demo mode — возвращаем готовый AI Summary без вызова Gemini
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true' || !process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        executiveSummaryAI: `${name} is a ${stage}-stage ${industry} startup from ${location}, addressing: "${problem.slice(0, 80)}...". With a team of ${teamSize}, the company is positioned to capture significant market share in the Central Asian ${industry} sector. Early indicators suggest strong product-market fit potential based on problem clarity and market context.`,
        aiScores: {
          overallReadinessScore: stage === 'growth' ? 72 : stage === 'mvp' ? 55 : stage === 'validation' ? 35 : 20,
          pitchDeckScore: 0,
        },
        strengths: [
          `Clear problem statement in the ${industry} vertical`,
          `Local market knowledge in ${location}`,
          'Lean founding team with focused execution',
        ],
        weaknesses: [
          'No pitch deck uploaded yet — required for AI scoring',
          'Early stage — traction metrics TBD',
        ],
        recommendation: stage === 'growth' || stage === 'mvp' ? 'consider' : 'pass',
        nextSteps: `Upload a pitch deck to get a full AI analysis. Focus on validating the core hypothesis: "${problem.slice(0, 50)}..." with at least 20 paying customers before moving to fundraising.`,
      });
    }

    const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `
You are an expert startup analyst at UNTITLED accelerator in Central Asia.

Analyze this new startup:
- Name: ${name}
- Tagline: ${tagline || 'N/A'}
- Industry: ${industry}
- Stage: ${stage}
- Location: ${location}
- Team Size: ${teamSize}
- Problem: "${problem}"

Return ONLY a valid JSON object:
{
  "executiveSummaryAI": "3 sentence objective executive summary",
  "aiScores": {
    "overallReadinessScore": 0-100,
    "pitchDeckScore": 0
  },
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2"],
  "recommendation": "pass" | "consider" | "strong_pass",
  "nextSteps": "specific 2-sentence actionable advice"
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const match = text.match(/\{[\s\S]*\}/);

    if (!match) {
      throw new Error('Invalid Gemini response');
    }

    const aiData = JSON.parse(match[0]);
    return NextResponse.json(aiData);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error('[analyze-startup]', err.message);
    return NextResponse.json({ error: 'AI analysis failed' }, { status: 500 });
  }
}

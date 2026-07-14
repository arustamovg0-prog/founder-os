import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebaseAdmin';

const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const SCORING_PROMPT = `You are an expert venture capitalist evaluating a startup for investment readiness.
You must return your evaluation strictly as a valid JSON object matching this schema:
{
  "overallReadinessScore": number (0-100),
  "pitchDeck": number (0-100),
  "marketFit": number (0-100),
  "traction": number (0-100),
  "team": number (0-100)
}
Do NOT wrap the output in markdown code blocks like \`\`\`json. Return only the raw JSON.`;

export async function POST(req: NextRequest) {
  try {
    const { startupId } = await req.json();
    if (!startupId) return NextResponse.json({ error: 'startupId required' }, { status: 400 });

    // Verify auth
    if (process.env.NEXT_PUBLIC_DEMO_MODE !== 'true') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const token = authHeader.split('Bearer ')[1];
      await getAdminAuth().verifyIdToken(token);
    }

    // Demo Mode without API KEY
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true' && !process.env.GEMINI_API_KEY) {
      await new Promise(r => setTimeout(r, 2000));
      const mockScores = {
        overallReadinessScore: 82,
        pitchDeck: 75,
        marketFit: 88,
        traction: 90,
        team: 75,
      };
      
      const db = getAdminFirestore();
      await db.collection('startups').doc(startupId).update({
        aiScores: mockScores
      });
      return NextResponse.json({ scores: mockScores });
    }

    // Fetch startup data
    const db = getAdminFirestore();
    const snap = await db.collection('startups').doc(startupId).get();
    if (!snap.exists) return NextResponse.json({ error: 'Startup not found' }, { status: 404 });
    const startup = snap.data();

    // Prepare context for Gemini
    const context = `
    Analyze this startup:
    Name: ${startup?.name}
    Industry: ${startup?.industry}
    Stage: ${startup?.stage}
    Metrics: MRR $${startup?.metrics?.mrr || 0}, MAU ${startup?.metrics?.users || 0}, LTV/CAC ${startup?.metrics?.ltvCacRatio || 0}x
    Runway: ${startup?.metrics?.runwayMonths || 0} months
    Data Room: Pitch Deck ${startup?.dataRoom?.pitchDeckUrl ? 'Uploaded' : 'Missing'}, Financial Model ${startup?.dataRoom?.financialModelUrl ? 'Uploaded' : 'Missing'}
    `;

    const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(`${SCORING_PROMPT}\n\n${context}`);
    let text = result.response.text().trim();
    
    // Clean markdown formatting if present
    if (text.startsWith('\`\`\`json')) {
      text = text.replace(/^\`\`\`json/m, '').replace(/\`\`\`$/m, '').trim();
    } else if (text.startsWith('\`\`\`')) {
      text = text.replace(/^\`\`\`/m, '').replace(/\`\`\`$/m, '').trim();
    }

    const scores = JSON.parse(text);

    // Save to Firestore
    await db.collection('startups').doc(startupId).update({
      aiScores: scores
    });

    return NextResponse.json({ scores });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error('[ai-score]', err.message);
    return NextResponse.json({ error: 'scoring failed' }, { status: 500 });
  }
}

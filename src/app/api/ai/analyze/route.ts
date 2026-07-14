import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAdminAuth } from '@/lib/firebaseAdmin';

const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    const { startupData } = await req.json();

    if (!startupData) {
      return NextResponse.json({ error: 'startupData required' }, { status: 400 });
    }

    // Auth verification
    if (process.env.NEXT_PUBLIC_DEMO_MODE !== 'true') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      try {
        const token = authHeader.split('Bearer ')[1];
        await getAdminAuth().verifyIdToken(token);
      } catch (err) {
        console.error('API Auth Error', err);
        return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
      }
    }

    // Demo mode fallback
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true' || !process.env.GEMINI_API_KEY) {
      await new Promise(r => setTimeout(r, 1500));
      return NextResponse.json({ 
        score: Math.floor(Math.random() * 20) + 70, // 70-90
        summary: `Demo mode analysis for ${startupData.name}. Add GEMINI_API_KEY for real analysis.`
      });
    }

    const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `
      You are an expert Venture Capital Analyst. 
      Review the following startup profile and provide an "AI Readiness Score" from 0 to 100 based on its potential for investment.
      Also provide a 1-2 sentence concise summary/feedback on what the founder should focus on.

      Startup Data:
      Name: ${startupData.name}
      Industry: ${startupData.industry}
      Tagline/One-liner: ${startupData.tagline}
      Metrics (MRR): $${startupData.metrics?.mrr || 0}
      Metrics (Users): ${startupData.metrics?.users || 0}
      Stage: ${startupData.stage}

      Return ONLY a JSON object exactly matching this schema (do not wrap in markdown \`\`\`json or backticks):
      {
        "score": number,
        "summary": "string"
      }
    `;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    
    if (text.startsWith('\`\`\`json')) {
      text = text.replace(/^\`\`\`json/, '').replace(/\`\`\`$/, '').trim();
    } else if (text.startsWith('\`\`\`')) {
      text = text.replace(/^\`\`\`/, '').replace(/\`\`\`$/, '').trim();
    }

    const parsed = JSON.parse(text);

    return NextResponse.json(parsed);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error('[analyze]', err.message);
    return NextResponse.json({ error: 'analysis failed', details: err.message }, { status: 500 });
  }
}

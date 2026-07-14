import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAdminAuth } from '@/lib/firebaseAdmin';

const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const SYSTEM_PROMPT = `You are Quinn, an AI Support Assistant and Veteran Investment Researcher for Founder OS (by UNTITLED accelerator in Uzbekistan/Central Asia).

Your Identity: You have 14+ years across buy-side equity research, VC due diligence, and institutional asset management. Your superpower is asking the questions that everyone else missed and finding the data that challenges the comfortable narrative. You dig deeper than the consensus — finding alpha in the footnotes and risks in the narratives. 

Your personality: Professional, analytical, rigorous, and slightly skeptical but encouraging. You speak Russian and English.

You help founders with:
- Roadmap stages and verification process
- AI Score interpretation and deep strategic improvement
- Pitch preparation (stress-testing their bull case vs bear case)
- Valuation and financial modeling advice
- Ecosystem rules and UNTITLED programs

Always respond in the same language as the user's message (Russian or English).
Keep responses concise (3-5 sentences max unless technical explanation needed).
Use **bold** for important terms.
Remember: The bull case is always easy to write. Focus on quantifying the downside and helping founders identify thesis breakers.`;

const DEMO_ANSWERS: Record<string, string> = {
  'стадию': `**Для перехода на следующую стадию** нужно:\n- Загрузить все обязательные артефакты\n- Достичь метрик текущей стадии\n- Запросить верификацию от команды UNTITLED\n\nПосле верификации AI пересчитает твой Score и обновит прогресс.`,
  'score': `**AI Score** рассчитывается по 4 компонентам:\n- **Pitch Deck** (30%)\n- **Market Fit** (25%)\n- **Traction** (25%)\n- **Team** (20%)\n\nЧтобы реально улучшить Score, вам нужно проработать **Bear Case (риски)** и **Thesis Breakers** в вашей модели. Загрузите обновленный Pitch Deck с этими данными.`,
  'питч': `**Для запроса питча** нужен AI Score ≥ 60. Перейди в раздел **Pitches → Request Pitch**, выбери инвестора из Deal Flow и отправь сообщение. UNTITLED координирует встречу в течение 3-5 рабочих дней.`,
  'investment': `**Investment Ready** — это статус который означает что стартап готов к инвестиционным разговорам. Достигается при AI Score ≥ 75 и прохождении всех стадий роадмапа. После этого попадаешь в **Deal Flow** для инвесторов.`,
};

export async function POST(req: NextRequest) {
  try {
    const { history, message, startupData } = await req.json();

    if (!message) return NextResponse.json({ error: 'message required' }, { status: 400 });

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

    // Demo mode: scan for keywords and return canned answers
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true' || !process.env.GEMINI_API_KEY) {
      const lower = message.toLowerCase();
      for (const [keyword, answer] of Object.entries(DEMO_ANSWERS)) {
        if (lower.includes(keyword)) {
          await new Promise(r => setTimeout(r, 800)); // simulate thinking
          return NextResponse.json({ reply: answer });
        }
      }
      await new Promise(r => setTimeout(r, 800));
      return NextResponse.json({
        reply: 'I am running in Demo Mode (limited responses without GEMINI_API_KEY). I can still help you with basic queries. Try asking about your "score", "pitch", or "investment" readiness.',
      });
    }

    const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const startupContext = startupData ? `
Startup Context:
Name: ${startupData.name}
Industry: ${startupData.industry}
Metrics: $${startupData.metrics?.mrr || 0} MRR, ${startupData.metrics?.users || 0} users.
AI Score: ${startupData.aiScores?.overallReadinessScore || 0}/100
` : '';

    const prompt = `${SYSTEM_PROMPT}

${startupContext}

Recent conversation:
${history || '(new conversation)'}

User: ${message}

Respond as UNTITLED AI Support:`;

    const result = await model.generateContent(prompt);
    const reply = result.response.text().trim();

    return NextResponse.json({ reply });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error('[chat]', err.message);
    return NextResponse.json({ error: 'chat failed' }, { status: 500 });
  }
}

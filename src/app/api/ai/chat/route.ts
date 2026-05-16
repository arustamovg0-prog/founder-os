import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const SYSTEM_PROMPT = `You are an AI support assistant for Founder OS — the startup ecosystem management platform by UNTITLED accelerator in Uzbekistan/Central Asia.

Your personality: Professional, concise, encouraging. You speak Russian and English.

You help founders with:
- Roadmap stages and verification process
- AI Score interpretation and improvement tips
- Pitch preparation and investor communication
- Platform features and navigation
- Ecosystem rules and UNTITLED programs

Always respond in the same language as the user's message (Russian or English).
Keep responses concise (3-5 sentences max unless technical explanation needed).
Use **bold** for important terms and bullet points for lists.
Never make up specific investor names, dates, or financial figures.`;

const DEMO_ANSWERS: Record<string, string> = {
  'стадию': `**Для перехода на следующую стадию** нужно:\n- Загрузить все обязательные артефакты\n- Достичь метрик текущей стадии\n- Запросить верификацию от команды UNTITLED\n\nПосле верификации AI пересчитает твой Score и обновит прогресс.`,
  'score': `**AI Score** рассчитывается по 4 компонентам:\n- **Pitch Deck** (30%) — качество документа\n- **Market Fit** (25%) — ответ рынка\n- **Traction** (25%) — MAU, MRR, рост\n- **Team** (20%) — состав и опыт команды\n\nЗагрузи Pitch Deck — это самый быстрый способ поднять Score.`,
  'питч': `**Для запроса питча** нужен AI Score ≥ 60. Перейди в раздел **Pitches → Request Pitch**, выбери инвестора из Deal Flow и отправь сообщение. UNTITLED координирует встречу в течение 3-5 рабочих дней.`,
  'investment': `**Investment Ready** — это статус который означает что стартап готов к инвестиционным разговорам. Достигается при AI Score ≥ 75 и прохождении всех стадий роадмапа. После этого попадаешь в **Deal Flow** для инвесторов.`,
};

export async function POST(req: NextRequest) {
  try {
    const { history, message } = await req.json();

    if (!message) return NextResponse.json({ error: 'message required' }, { status: 400 });

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
        reply: 'Demo mode: limited responses. Add GEMINI_API_KEY for full AI assistant. Try asking: "Kak uluchshit AI Score?"',
      });
    }

    const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `${SYSTEM_PROMPT}

Recent conversation:
${history || '(new conversation)'}

User: ${message}

Respond as UNTITLED AI Support:`;

    const result = await model.generateContent(prompt);
    const reply = result.response.text().trim();

    return NextResponse.json({ reply });
  } catch (err: any) {
    console.error('[chat]', err.message);
    return NextResponse.json({ error: 'chat failed' }, { status: 500 });
  }
}

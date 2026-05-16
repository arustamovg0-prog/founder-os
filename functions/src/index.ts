/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║       FOUNDER OS — Firebase Cloud Functions                   ║
 * ║       Turn Chaos Into System · UNTITLED Ecosystem             ║
 * ╠═══════════════════════════════════════════════════════════════╣
 * ║  Functions:                                                   ║
 * ║  1. onPitchDeckUploaded  — AI Scoring Pipeline               ║
 * ║  2. investorMatchEngine  — Weekly digest + SendGrid email     ║
 * ║  3. onStageVerified      — Notify founder on approval         ║
 * ║  4. onPitchFeedback      — Post-pitch AI loop                 ║
 * ║  5. onUserCreated        — Set Custom Claims + onboarding     ║
 * ║  6. aiRoadmapHints       — Daily AI hints for stuck startups  ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as sgMail from '@sendgrid/mail';

admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage();
const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Init SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function log(fn: string, msg: string, data?: any) {
  functions.logger.info(`[${fn}] ${msg}`, data || {});
}

async function writeNotification(userId: string, notif: { type: string; title: string; body: string; href?: string }) {
  await db.collection('notifications').add({
    userId, ...notif, read: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.SENDGRID_API_KEY) {
    functions.logger.warn('SendGrid not configured — skipping email to:', to);
    return;
  }
  await sgMail.send({
    to, from: process.env.SENDGRID_FROM_EMAIL || 'noreply@founderos.io',
    subject, html,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. AI PITCH SCORING PIPELINE
// Trigger: файл загружен в Storage → startup_documents/{startupId}/{fileName}
// Flow: Download PDF → Extract text → Gemini scoring → Firestore update → Notify
// ─────────────────────────────────────────────────────────────────────────────

export const onPitchDeckUploaded = functions
  .region('us-central1')
  .runWith({ memory: '1GB', timeoutSeconds: 300 })
  .storage.object()
  .onFinalize(async (object: any) => {
    const filePath = object.name || '';

    // Проверяем что это pitch deck (PDF в папке startup_documents)
    if (!filePath.startsWith('startup_documents/') || !filePath.endsWith('.pdf')) {
      return null;
    }

    const pathParts = filePath.split('/');
    const startupId = pathParts[1];

    if (!startupId) {
      functions.logger.error('Cannot extract startupId from path:', filePath);
      return null;
    }

    log('onPitchDeckUploaded', `Processing pitch deck for startup: ${startupId}`);

    try {
      // 1. Получаем данные стартапа из Firestore
      const startupDoc = await db.collection('startups').doc(startupId).get();
      if (!startupDoc.exists) {
        functions.logger.error('Startup not found:', startupId);
        return null;
      }
      const startupData = startupDoc.data()!;

      // 2. Скачиваем PDF из Cloud Storage
      const bucket = storage.bucket(object.bucket);
      const file = bucket.file(filePath);
      const [fileBuffer] = await file.download();

      // 3. Анализируем с Gemini 1.5 Pro
      const model = gemini.getGenerativeModel({ model: 'gemini-1.5-pro' });
      const pdfBase64 = fileBuffer.toString('base64');

      const scoringPrompt = `
You are an expert startup investment analyst. Analyze this pitch deck for a startup called "${startupData.name}" 
in the ${startupData.industry} industry at the "${startupData.stage}" stage.

Evaluate and return ONLY a valid JSON object with this exact structure:
{
  "overallReadinessScore": <0-100>,
  "pitchDeckScore": <0-100>,
  "scores": {
    "problemClarity": <0-10>,
    "solutionStrength": <0-10>,
    "marketSize": <0-10>,
    "businessModel": <0-10>,
    "traction": <0-10>,
    "team": <0-10>,
    "financials": <0-10>,
    "competitiveAdvantage": <0-10>
  },
  "executiveSummary": "<2-3 sentence objective summary>",
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2"],
  "recommendation": "pass" | "consider" | "strong_pass",
  "nextSteps": "<specific actionable advice for the founder>"
}
`;

      const result = await model.generateContent([
        scoringPrompt,
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: pdfBase64,
          },
        },
      ]);

      const responseText = result.response.text().trim();

      // 4. Парсим JSON из ответа Gemini
      let aiData;
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        aiData = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      } catch {
        functions.logger.error('Failed to parse Gemini JSON response:', responseText.slice(0, 500));
        return null;
      }

      if (!aiData) return null;

      // 5. Обновляем Firestore
      const updateData = {
        'aiScores.pitchDeckScore': aiData.pitchDeckScore,
        'aiScores.overallReadinessScore': aiData.overallReadinessScore,
        'aiScores.scores': aiData.scores,
        'aiScores.lastAnalyzedAt': admin.firestore.FieldValue.serverTimestamp(),
        executiveSummaryAI: aiData.executiveSummary,
        strengths: aiData.strengths,
        weaknesses: aiData.weaknesses,
        aiRecommendation: aiData.recommendation,
        aiNextSteps: aiData.nextSteps,
      };

      await db.collection('startups').doc(startupId).update(updateData);

      // 6. Если score >= 75 — переводим в investment_ready
      if (aiData.overallReadinessScore >= 75 && startupData.stage !== 'investment_ready') {
        await db.collection('startups').doc(startupId).update({
          status: 'investment_ready',
        });
        log('onPitchDeckUploaded', `Startup ${startupId} reached investment_ready! Score: ${aiData.overallReadinessScore}`);
      }

      // 7. Логируем в Digital Footprint
      await db.collection('digital_footprint').doc(startupId).collection('logs').add({
        event: 'ai_pitch_deck_scored',
        score: aiData.overallReadinessScore,
        pitchDeckScore: aiData.pitchDeckScore,
        recommendation: aiData.recommendation,
        filePath,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 8. Уведомляем фаундера
      if (startupData.founderIds?.length > 0) {
        for (const founderId of startupData.founderIds) {
          await writeNotification(founderId, {
            type: 'ai_score_ready',
            title: `AI Score готов: ${aiData.overallReadinessScore}/100`,
            body: `Pitch Deck проанализирован — ${aiData.recommendation === 'strong_pass' ? '🚀 Strong Pass!' : aiData.recommendation === 'pass' ? '✅ Pass' : '🤔 Consider'}`,
            href: '/founder/data-room',
          });
        }
      }

      log('onPitchDeckUploaded', `Scoring complete for ${startupId}. Score: ${aiData.overallReadinessScore}`);
      return { success: true, score: aiData.overallReadinessScore };

    } catch (err) {
      functions.logger.error('onPitchDeckUploaded error:', err);
      return null;
    }
  });

// ─────────────────────────────────────────────────────────────────────────────
// 2. INVESTOR MATCH ENGINE
// Trigger: Cloud Scheduler — каждый понедельник в 09:00 UTC
// Flow: Читаем всех инвесторов → Список investment_ready стартапов
//       → Gemini генерирует персонализированный топ-3 → Email через SendGrid
// ─────────────────────────────────────────────────────────────────────────────

export const investorMatchEngine = functions
  .region('us-central1')
  .runWith({ memory: '512MB', timeoutSeconds: 540 })
  .pubsub
  .schedule('every monday 09:00')
  .timeZone('Asia/Tashkent')
  .onRun(async () => {
    log('investorMatchEngine', 'Starting weekly match engine run');

    try {
      // 1. Получаем всех инвесторов
      const investorsSnap = await db.collection('users').where('role', '==', 'investor').get();
      const investors = investorsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

      // 2. Получаем investment_ready стартапы
      const startupsSnap = await db.collection('startups')
        .where('status', '==', 'investment_ready')
        .orderBy('aiScores.overallReadinessScore', 'desc')
        .limit(20)
        .get();
      const startups = startupsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

      if (startups.length === 0) {
        log('investorMatchEngine', 'No investment_ready startups found, skipping');
        return null;
      }

      const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });

      // 3. Для каждого инвестора — генерируем персонализированный digest
      for (const investor of investors) {
        const matchPrompt = `
You are an AI matching engine for a startup investment platform.

Investor profile:
- Name: ${investor.displayName}
- Focus areas: ${investor.focusAreas?.join(', ') || 'General tech'}
- Preferred stage: ${investor.preferredStage || 'Series A and earlier'}
- Ticket size: ${investor.ticketSize || 'Not specified'}

Available startups (top ${Math.min(10, startups.length)}):
${startups.slice(0, 10).map((s: any, i: number) => `
${i + 1}. ${s.name} (${s.industry}, ${s.stage})
   AI Score: ${s.aiScores?.overallReadinessScore || 'N/A'}/100
   MRR: $${s.metrics?.mrr?.toLocaleString() || 0}
   MAU: ${s.metrics?.mau?.toLocaleString() || 0}
   Location: ${s.location}
   Summary: ${s.executiveSummaryAI || 'No summary available'}
`).join('')}

Return ONLY a valid JSON:
{
  "topMatches": [
    {
      "startupName": "string",
      "matchScore": 0-100,
      "reason": "2 sentence explanation why this investor should consider this startup",
      "keyMetric": "most impressive metric"
    }
  ],
  "weeklyInsight": "1-2 sentence market insight for this investor"
}

Rank top 3 matches based on alignment with investor profile.
`;

        const result = await model.generateContent(matchPrompt);
        const responseText = result.response.text().trim();

        let matchData;
        try {
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          matchData = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        } catch {
          continue;
        }

        if (!matchData?.topMatches?.length) continue;

        // 4. Сохраняем digest в Firestore
        await db.collection('investor_digests').add({
          investorId: investor.id,
          topMatches: matchData.topMatches,
          weeklyInsight: matchData.weeklyInsight,
          generatedAt: admin.firestore.FieldValue.serverTimestamp(),
          week: new Date().toISOString().split('T')[0],
        });

        // 5. In-app уведомление
        await writeNotification(investor.id, {
          type: 'new_startup',
          title: '🎯 Еженедельный AI Match Digest',
          body: `${matchData.topMatches.length} персонализированных рекомендаций готово`,
          href: '/investor/deal-flow',
        });

        // 6. SendGrid email digest
        if (investor.email) {
          const topHtml = matchData.topMatches.map((m: any, i: number) => `
            <tr style="border-bottom:1px solid #1e1e3a">
              <td style="padding:14px;font-size:13px;color:#a78bfa;font-weight:700">${i + 1}. ${m.startupName}</td>
              <td style="padding:14px;font-size:13px;color:#10b981;font-weight:700">${m.matchScore}/100</td>
              <td style="padding:14px;font-size:12px;color:#94a3b8">${m.reason}</td>
            </tr>`).join('');

          const html = `
            <!DOCTYPE html><html><body style="margin:0;padding:0;background:#050510;font-family:Inter,sans-serif">
            <div style="max-width:600px;margin:0 auto;padding:40px 24px">
              <div style="text-align:center;margin-bottom:32px">
                <h1 style="color:#a78bfa;font-size:24px;margin:0">⚡ Founder OS</h1>
                <p style="color:#475569;font-size:13px;margin:8px 0 0">Weekly AI Match Digest</p>
              </div>
              <div style="background:#0d0d20;border:1px solid rgba(124,58,237,0.2);border-radius:16px;padding:28px">
                <h2 style="color:#f8fafc;font-size:18px;margin:0 0 8px">Привет, ${investor.displayName || 'Investor'}!</h2>
                <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 24px">
                  ${matchData.weeklyInsight}
                </p>
                <h3 style="color:#a78bfa;font-size:13px;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px">🎯 Топ совпадения этой недели</h3>
                <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#050510;border-radius:10px;overflow:hidden">
                  ${topHtml}
                </table>
                <div style="text-align:center;margin-top:28px">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://founderos.io'}/investor/deal-flow"
                     style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#7c3aed,#3b82f6);color:white;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px">
                    Открыть Deal Flow →
                  </a>
                </div>
              </div>
              <p style="text-align:center;color:#334155;font-size:11px;margin-top:24px">
                UNTITLED Ecosystem · Turn Chaos Into System
              </p>
            </div></body></html>`;

          await sendEmail(investor.email, '🎯 Founder OS — Еженедельный AI Match Digest', html);
          log('investorMatchEngine', `Email sent to: ${investor.email}`);
        }

        log('investorMatchEngine', `Digest complete for: ${investor.displayName}`);
      }

      log('investorMatchEngine', `Completed run. Processed ${investors.length} investors`);
      return { success: true, investors: investors.length, startups: startups.length };

    } catch (err) {
      functions.logger.error('investorMatchEngine error:', err);
      return null;
    }
  });

// ─────────────────────────────────────────────────────────────────────────────
// 3. ON STAGE VERIFIED
// Trigger: Firestore update на startup_roadmap_progress/.../stages/{stageId}
// Flow: Если status === 'verified' → notify founder
// ─────────────────────────────────────────────────────────────────────────────

export const onStageVerified = functions
  .region('us-central1')
  .firestore
  .document('startup_roadmap_progress/{startupId}/stages/{stageId}')
  .onUpdate(async (change: any, context: any) => {
    const before = change.before.data();
    const after = change.after.data();
    const { startupId, stageId } = context.params;

    // Только если статус изменился на verified или rejected
    if (before.verificationStatus === after.verificationStatus) return null;

    const isApproved = after.verificationStatus === 'verified';
    const isRejected = after.verificationStatus === 'rejected';

    if (!isApproved && !isRejected) return null;

    // Получаем стартап для founderIds
    const startupDoc = await db.collection('startups').doc(startupId).get();
    if (!startupDoc.exists) return null;
    const { name: startupName, founderIds = [] } = startupDoc.data() as any;

    for (const founderId of founderIds) {
      await writeNotification(founderId, {
        type: isApproved ? 'stage_approved' : 'stage_rejected',
        title: isApproved ? '✅ Стадия одобрена!' : '❌ Стадия отклонена',
        body: isApproved
          ? `UNTITLED верифицировал этап "${after.title || stageId}" для ${startupName}`
          : `Требуются доработки для "${after.title || stageId}": ${after.rejectionComment || '—'}`,
        href: '/founder/roadmap',
      });
    }

    // Логируем событие
    await db.collection('digital_footprint').doc(startupId).collection('logs').add({
      event: isApproved ? 'stage_verified' : 'stage_rejected',
      stageId,
      comment: after.rejectionComment || null,
      verifiedBy: after.verifiedBy || 'admin',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    log('onStageVerified', `Stage ${stageId} for ${startupId}: ${after.verificationStatus}`);
    return null;
  });

// ─────────────────────────────────────────────────────────────────────────────
// 4. ON PITCH FEEDBACK (Post-Pitch AI Loop)
// Trigger: pitch_events/{pitchId} обновляется с investor feedback
// Flow: Gemini анализирует фидбек → генерирует action plan → уведомляет фаундера
// ─────────────────────────────────────────────────────────────────────────────

export const onPitchFeedback = functions
  .region('us-central1')
  .runWith({ memory: '256MB', timeoutSeconds: 120 })
  .firestore
  .document('pitch_events/{pitchId}')
  .onUpdate(async (change: any, context: any) => {
    const before = change.before.data();
    const after = change.after.data();

    // Триггер только при добавлении фидбека
    if (before.status === after.status && before.feedback) return null;
    if (!after.feedback || after.status !== 'feedback_submitted') return null;

    const { pitchId } = context.params;
    log('onPitchFeedback', `Analyzing post-pitch feedback for: ${pitchId}`);

    try {
      const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const feedback = after.feedback;
      const prompt = `
You are a startup coach analyzing investor feedback after a pitch meeting.

Startup: ${after.startupName || 'Unknown'}
Investor verdict: ${feedback.verdict}
Scores: Team ${feedback.teamScore}/5, Product ${feedback.productScore}/5, Market ${feedback.marketScore}/5, Financials ${feedback.financialsScore}/5
Comments: "${feedback.comments || 'No comments'}"

Generate a concise action plan for the founder. Return ONLY valid JSON:
{
  "summary": "2 sentence summary of the feedback",
  "actionPlan": ["action1", "action2", "action3"],
  "nextInvestorReadinessScore": 0-100,
  "timeToReady": "estimated weeks/months to address feedback"
}
`;

      const result = await model.generateContent(prompt);
      let analysis;
      try {
        const text = result.response.text().trim();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      } catch { analysis = null; }

      if (analysis) {
        // Обновляем питч с AI анализом
        await db.collection('pitch_events').doc(pitchId).update({
          'feedback.aiAnalysis': analysis,
          'feedback.analyzedAt': admin.firestore.FieldValue.serverTimestamp(),
        });

        // Уведомляем фаундера
        if (after.founderIds?.length) {
          for (const founderId of after.founderIds) {
            await writeNotification(founderId, {
              type: 'feedback_received',
              title: `Фидбек проанализирован AI`,
              body: analysis.summary,
              href: '/founder/pitches',
            });
          }
        }
      }

      return null;
    } catch (err) {
      functions.logger.error('onPitchFeedback error:', err);
      return null;
    }
  });

// ─────────────────────────────────────────────────────────────────────────────
// 5. ON USER CREATED (New Registration)
// Trigger: Новый пользователь в Firebase Auth
// Flow: Устанавливаем Custom Claims (роль) → Создаём onboarding запись → Уведомляем Admin
// ─────────────────────────────────────────────────────────────────────────────

export const onUserCreated = functions
  .region('us-central1')
  .auth.user()
  .onCreate(async (user: any) => {
    log('onUserCreated', `New user: ${user.email} (${user.uid})`);

    try {
      // Читаем профиль из Firestore (создаётся при регистрации на клиенте)
      const userDoc = await db.collection('users').doc(user.uid).get();
      const userData = userDoc.exists ? userDoc.data() : null;
      const role = userData?.role || 'founder';

      // Устанавливаем Custom Claims
      await admin.auth().setCustomUserClaims(user.uid, {
        role,
        linkedStartupId: userData?.linkedStartupId || null,
      });

      // Создаём onboarding запись
      if (role === 'founder') {
        await db.collection('onboarding').doc(user.uid).set({
          step: 1,
          completed: false,
          startedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      // Уведомляем всех adminов о новой регистрации
      const adminsSnap = await db.collection('users').where('role', '==', 'admin').get();
      for (const adminDoc of adminsSnap.docs) {
        await writeNotification(adminDoc.id, {
          type: 'new_startup',
          title: 'Новый пользователь',
          body: `${userData?.displayName || user.email} зарегистрировался как ${role}`,
          href: '/admin/startups',
        });
      }

      log('onUserCreated', `Claims set for ${user.uid}: role=${role}`);
      return null;
    } catch (err) {
      functions.logger.error('onUserCreated error:', err);
      return null;
    }
  });

// ─────────────────────────────────────────────────────────────────────────────
// 6. AI ROADMAP HINTS — Daily scheduler for stuck startups
// ─────────────────────────────────────────────────────────────────────────────

export const aiRoadmapHints = functions
  .region('us-central1')
  .runWith({ memory: '256MB', timeoutSeconds: 300 })
  .pubsub.schedule('every day 08:00').timeZone('Asia/Tashkent')
  .onRun(async () => {
    log('aiRoadmapHints', 'Running daily roadmap hints check');

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const snap = await db.collection('startups')
      .where('lastActivityAt', '<', sevenDaysAgo)
      .where('stage', 'not-in', ['investment_ready'])
      .limit(30).get();

    if (snap.empty) { log('aiRoadmapHints', 'No stuck startups'); return null; }

    const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });

    for (const startupDoc of snap.docs) {
      const s = startupDoc.data();
      try {
        const result = await model.generateContent(
          `Startup coach at UNTITLED. Startup: "${s.name}" (${s.industry}, ${s.stage}).
           MRR:$${s.metrics?.mrr||0} MAU:${s.metrics?.mau||0} Days stuck:7+
           Give ONE specific actionable hint (2-3 sentences) to unblock them this week.
           Return ONLY JSON: {"hint":"string","category":"product|market|funding|team|legal"}`
        );
        const match = result.response.text().match(/\{[\s\S]*\}/);
        if (!match) continue;
        const { hint, category } = JSON.parse(match[0]);

        // Сохраняем в AI Copilot history
        await db.collection('ai_copilot_messages').add({
          startupId: startupDoc.id, role: 'assistant',
          content: `💡 **AI Roadmap Hint (${category}):** ${hint}`,
          source: 'roadmap_hints_scheduler',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Уведомляем и отправляем email фаундерам
        for (const founderId of (s.founderIds || [])) {
          await writeNotification(founderId, {
            type: 'feedback_received', title: '💡 AI Roadmap Hint',
            body: hint.slice(0, 90) + '...', href: '/founder/ai-copilot',
          });
        }
        if (s.founderEmail) {
          await sendEmail(
            s.founderEmail, `💡 AI Hint для ${s.name}`,
            `<div style="max-width:560px;margin:0 auto;padding:32px;background:#050510;font-family:Inter,sans-serif">
              <h2 style="color:#a78bfa">⚡ Founder OS · AI Roadmap Hint</h2>
              <div style="background:#0d0d20;border:1px solid rgba(124,58,237,0.2);border-radius:12px;padding:20px">
                <p style="color:#64748b;font-size:12px">${s.name} · ${s.stage} · ${category}</p>
                <p style="color:#f8fafc;font-size:15px;line-height:1.7">${hint}</p>
              </div>
              <p style="text-align:center;margin-top:20px">
                <a href="${process.env.NEXT_PUBLIC_APP_URL||'https://founderos.io'}/founder/ai-copilot"
                   style="padding:12px 28px;background:#7c3aed;color:white;text-decoration:none;border-radius:8px">
                  Открыть AI Copilot →
                </a>
              </p>
            </div>`
          );
        }
        log('aiRoadmapHints', `Hint sent for ${s.name} (${category})`);
      } catch (e) { functions.logger.warn('hint failed for', startupDoc.id, e); }
    }

    log('aiRoadmapHints', `Done. Processed ${snap.size} startups`);
    return null;
  });

// ─────────────────────────────────────────────────────────────────────────────
// 7. SMART ALERTS — onStartupMetricUpdate
// Trigger: startups/{startupId} document update
// Flow: MRR drop >20% in 30d OR runway <3mo → notify founders + investors + Gemini action plan
// ─────────────────────────────────────────────────────────────────────────────

export const onStartupMetricUpdate = functions
  .region('us-central1')
  .runWith({ memory: '256MB', timeoutSeconds: 120 })
  .firestore
  .document('startups/{startupId}')
  .onUpdate(async (change: any, context: any) => {
    const before = change.before.data();
    const after = change.after.data();
    const { startupId } = context.params;

    const prevMrr = before.metrics?.mrr || 0;
    const newMrr = after.metrics?.mrr || 0;
    const prevRunway = before.metrics?.runwayMonths || 99;
    const newRunway = after.metrics?.runwayMonths || 99;

    const mrrDropPct = prevMrr > 0 ? ((prevMrr - newMrr) / prevMrr) * 100 : 0;
    const isMrrAlert = mrrDropPct >= 20;
    const isRunwayAlert = newRunway <= 3 && prevRunway > 3;

    if (!isMrrAlert && !isRunwayAlert) return null;

    log('onStartupMetricUpdate', `ALERT for ${startupId}: MRR drop=${mrrDropPct.toFixed(1)}%, runway=${newRunway}mo`);

    const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const alertType = isMrrAlert ? 'MRR_DROP' : 'RUNWAY_CRITICAL';

    // Generate AI action plan
    let actionPlan = '';
    try {
      const result = await model.generateContent(
        `Startup "${after.name}" (${after.industry}) has a critical alert: ${
          isMrrAlert
            ? `MRR dropped from $${prevMrr} to $${newMrr} (${mrrDropPct.toFixed(0)}% drop in 30 days)`
            : `Runway is critically low at ${newRunway} months`
        }.
        Give a 3-step emergency action plan. Return ONLY JSON:
        {"steps": ["step1", "step2", "step3"], "urgency": "critical|high"}`
      );
      const match = result.response.text().match(/\{[\s\S]*\}/);
      if (match) actionPlan = JSON.parse(match[0]).steps?.join(' → ') || '';
    } catch { /* action plan optional */ }

    const title = isMrrAlert ? `⚠️ MRR Alert: -${mrrDropPct.toFixed(0)}%` : `🚨 Critical Runway: ${newRunway} мес.`;
    const body = isMrrAlert
      ? `MRR упал с $${prevMrr.toLocaleString()} до $${newMrr.toLocaleString()}${actionPlan ? '. ' + actionPlan.slice(0, 80) : ''}`
      : `Осталось ${newRunway} месяц runway${actionPlan ? '. ' + actionPlan.slice(0, 80) : ''}`;

    // Notify all founders
    for (const founderId of (after.founderIds || [])) {
      await writeNotification(founderId, { type: 'feedback_received', title, body, href: '/founder' });
    }

    // Notify linked investors (who have this startup in their digests)
    const digestsSnap = await db.collection('investor_digests')
      .where('topMatches', 'array-contains', after.name)
      .limit(10).get();
    for (const d of digestsSnap.docs) {
      await writeNotification(d.data().investorId, {
        type: 'feedback_received',
        title: `Portfolio Alert: ${after.name}`,
        body,
        href: '/investor/crm',
      });
    }

    // Save alert log
    await db.collection('startup_alerts').add({
      startupId, alertType, prevMrr, newMrr, prevRunway, newRunway,
      mrrDropPct, actionPlan,
      resolvedAt: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    log('onStartupMetricUpdate', `Alert logged for ${startupId}: ${alertType}`);
    return null;
  });

// ─────────────────────────────────────────────────────────────────────────────
// 8. FOUNDER WEEKLY DIGEST (Cloud Scheduler)
// Schedule: Every Monday at 9:00 AM
// Action: Generates a weekly recap of metrics and AI Copilot top 3 actions
// ─────────────────────────────────────────────────────────────────────────────

export const founderWeeklyDigest = functions
  .region('us-central1')
  .pubsub.schedule('0 9 * * 1')
  .timeZone('Asia/Tashkent')
  .onRun(async () => {
    log('founderWeeklyDigest', 'Starting weekly digest for founders...');
    const startupsSnap = await db.collection('startups').where('status', '==', 'active').get();

    const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });

    let count = 0;
    for (const doc of startupsSnap.docs) {
      const data = doc.data();
      const founderIds = data.founderIds || [];
      if (founderIds.length === 0) continue;

      try {
        const prompt = `
        You are Founder OS AI Copilot. Write a short weekly digest for startup "${data.name}".
        Current MRR: $${data.metrics?.mrr || 0}. Score: ${data.aiScores?.overallReadinessScore || 0}.
        Provide exactly 3 actionable bullet points for what the founder should focus on this week to improve their AI Score and MRR.
        Return raw text (no markdown formatting outside of bullets).
        `;
        const res = await model.generateContent(prompt);
        const advice = res.response.text().trim();

        const html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #334155;">
            <h2 style="color: #7c3aed;">Weekly Founder Digest: ${data.name}</h2>
            <p>Here is your ecosystem snapshot for the week.</p>
            <table width="100%" cellpadding="10" style="background: #f8fafc; border-radius: 8px; text-align: center;">
              <tr>
                <td><strong>AI Score</strong><br/>${data.aiScores?.overallReadinessScore || 0}/100</td>
                <td><strong>MRR</strong><br/>$${data.metrics?.mrr || 0}</td>
                <td><strong>MAU</strong><br/>${data.metrics?.mau || 0}</td>
              </tr>
            </table>
            <h3>AI Copilot Top 3 Actions This Week:</h3>
            <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 12px; border-radius: 4px;">
              ${advice.replace(/\n/g, '<br/>')}
            </div>
            <p style="margin-top: 20px;"><a href="https://founder-os-test.web.app/founder" style="display:inline-block; padding: 10px 20px; background: #7c3aed; color: #fff; text-decoration: none; border-radius: 6px;">Open Dashboard</a></p>
          </div>
        `;

        for (const fId of founderIds) {
          const uDoc = await db.collection('users').doc(fId).get();
          if (uDoc.exists && uDoc.data()?.email) {
            await sendEmail(uDoc.data()!.email, `Your Weekly Founder Digest: ${data.name}`, html);
            count++;
          }
        }
      } catch (err: any) {
        log('founderWeeklyDigest', `Error for ${data.name}: ${err.message}`, 'error');
      }
    }

    log('founderWeeklyDigest', `Done. Sent ${count} emails.`);
    return null;
  });

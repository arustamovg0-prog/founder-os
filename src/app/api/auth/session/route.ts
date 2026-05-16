import { NextRequest, NextResponse } from 'next/server';
import { createSessionCookie, setUserClaims, getAdminFirestore } from '@/lib/firebaseAdmin';

const SESSION_COOKIE = '__session';
const ROLE_COOKIE = '__founder_os_role';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 14; // 14 дней (секунды)

/**
 * POST /api/auth/session
 *
 * Тело запроса: { idToken: string }
 *
 * Клиент вызывает этот endpoint сразу после signInWithEmailAndPassword.
 * Сервер создаёт подписанный Session Cookie и устанавливает Custom Claims.
 *
 * Ответ: { ok: true, role: string } или { error: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { idToken } = body as { idToken: string };

    if (!idToken) {
      return NextResponse.json({ error: 'idToken is required' }, { status: 400 });
    }

    // 1. Создаём подписанный Session Cookie (14 дней)
    const sessionCookie = await createSessionCookie(idToken);

    // 2. Получаем роль пользователя из Firestore
    const db = getAdminFirestore();
    const { getAuth } = await import('firebase-admin/auth');

    // Верифицируем ID Token чтобы получить UID
    const { uid } = await (await import('firebase-admin/auth'))
      .getAuth()
      .verifyIdToken(idToken);

    let role: 'founder' | 'investor' | 'admin' = 'founder';
    let linkedStartupId: string | undefined;

    try {
      const userDoc = await db.collection('users').doc(uid).get();
      if (userDoc.exists) {
        const data = userDoc.data()!;
        role = data.role || 'founder';
        linkedStartupId = data.linkedStartupId;
      }
    } catch {
      // Firestore недоступен — используем дефолт
    }

    // 3. Устанавливаем Custom Claims (роль в JWT токене)
    await setUserClaims(uid, { role, linkedStartupId });

    // 4. Создаём ответ с cookies
    const response = NextResponse.json({ ok: true, role });

    // Подписанный Session Cookie (httpOnly — недоступен из JS)
    response.cookies.set(SESSION_COOKIE, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    });

    // Role cookie (доступен proxy.ts для быстрого редиректа)
    response.cookies.set(ROLE_COOKIE, role, {
      httpOnly: false, // Edge runtime в proxy.ts читает без httpOnly
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    });

    return response;
  } catch (err: any) {
    console.error('[/api/auth/session] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 401 }
    );
  }
}

/**
 * DELETE /api/auth/session
 *
 * Выход — удаляем cookies на сервере.
 */
export async function DELETE() {
  const response = NextResponse.json({ ok: true });

  response.cookies.set(SESSION_COOKIE, '', { maxAge: 0, path: '/' });
  response.cookies.set(ROLE_COOKIE, '', { maxAge: 0, path: '/' });

  return response;
}

/**
 * Firebase Admin SDK — Server-side only
 * Используется для:
 *  - Верификации ID токенов (Firebase Auth)
 *  - Создания Session Cookies (2-недельные сессии)
 *  - Установки Custom Claims (роль пользователя)
 *  - Чтения Firestore без клиентских ограничений
 *
 * НИКОГДА не импортируй этот файл в client components!
 * Только в Server Components, Server Actions, API Routes.
 */

import admin from 'firebase-admin';
import type { App } from 'firebase-admin/app';

// ─── Singleton pattern — один инстанс на весь сервер ──────────────────────────
let adminApp: App;

function getAdminApp(): App {
  if (adminApp) return adminApp;

  if (admin.apps.length > 0) {
    adminApp = admin.apps[0] as App;
    return adminApp;
  }

  // Продакшен: используем GOOGLE_APPLICATION_CREDENTIALS (Service Account JSON)
  // Vercel: добавь переменную FIREBASE_ADMIN_SDK_JSON с содержимым service-account.json
  const serviceAccountJson = process.env.FIREBASE_ADMIN_SDK_JSON;

  if (serviceAccountJson) {
    try {
      const serviceAccount = JSON.parse(serviceAccountJson);
      adminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
    } catch (err) {
      console.error('[Firebase Admin] Failed to parse service account:', err);
      adminApp = initWithEnvVars();
    }
  } else {
    // Dev: используем отдельные переменные окружения
    adminApp = initWithEnvVars();
  }

  return adminApp;
}

function initWithEnvVars(): App {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    // Demo mode — вернём заглушку (Admin не работает без credentials)
    console.warn('[Firebase Admin] Running in demo mode — no Admin credentials provided.');
    return admin.initializeApp({ projectId: 'founder-os-demo' });
  }

  return admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

// ─── Экспорты ─────────────────────────────────────────────────────────────────

export function getAdminAuth() {
  return admin.auth(getAdminApp());
}

export function getAdminFirestore() {
  return admin.firestore(getAdminApp());
}

export function getAdminStorage() {
  return admin.storage(getAdminApp());
}

// ─── Session Cookie helpers ───────────────────────────────────────────────────

const SESSION_DURATION_MS = 60 * 60 * 24 * 14 * 1000; // 14 дней

/**
 * Создаёт подписанный Session Cookie из Firebase ID Token.
 * Вызывается в /api/auth/session после логина на клиенте.
 */
export async function createSessionCookie(idToken: string): Promise<string> {
  const auth = getAdminAuth();
  const cookie = await auth.createSessionCookie(idToken, {
    expiresIn: SESSION_DURATION_MS,
  });
  return cookie;
}

/**
 * Верифицирует Session Cookie и возвращает decoded claims.
 * Используется в proxy.ts для защиты маршрутов.
 */
export async function verifySessionCookie(sessionCookie: string) {
  const auth = getAdminAuth();
  try {
    return await auth.verifySessionCookie(sessionCookie, true); // checkRevoked=true
  } catch {
    return null;
  }
}

/**
 * Устанавливает Custom Claims для пользователя (роль, startupId).
 * Вызывается при регистрации или изменении роли через Admin Panel.
 */
export async function setUserClaims(
  uid: string,
  claims: { role: 'founder' | 'investor' | 'admin'; linkedStartupId?: string }
) {
  const auth = getAdminAuth();
  await auth.setCustomUserClaims(uid, claims);
}

/**
 * Отзывает все токены пользователя (logout на всех устройствах).
 */
export async function revokeUserTokens(uid: string) {
  const auth = getAdminAuth();
  await auth.revokeRefreshTokens(uid);
}

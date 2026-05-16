import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ─── Маршруты и требуемые роли ──────────────────────────────────────────────

const PROTECTED_ROUTES: Record<string, string[]> = {
  '/founder': ['founder'],
  '/investor': ['investor'],
  '/admin': ['admin'],
};

// Публичные маршруты — доступны без авторизации
const PUBLIC_ROUTES = ['/', '/login'];

// Дашборд по роли — куда редиректить после входа
const ROLE_DASHBOARD: Record<string, string> = {
  founder: '/founder',
  investor: '/investor',
  admin: '/admin',
};

// ─── Cookie ключи ────────────────────────────────────────────────────────────
const SESSION_COOKIE = '__session';       // Firebase Session Cookie
const ROLE_COOKIE = '__founder_os_role';  // Роль, кешируется при логине

// ─── Proxy (Next.js 16 convention, replaces middleware) ──────────────────────

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Статические файлы и API роуты — пропускаем
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 2. Получаем сессию и роль из cookies
  const sessionCookie = request.cookies.get(SESSION_COOKIE)?.value;
  const roleCookie = request.cookies.get(ROLE_COOKIE)?.value as
    | 'founder'
    | 'investor'
    | 'admin'
    | undefined;

  const isAuthenticated = !!sessionCookie;
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  // 3. Неавторизованный пытается зайти на защищённый маршрут
  if (!isAuthenticated && !isPublicRoute) {
    const loginUrl = new URL('/', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 4. Авторизованный пытается зайти на публичный маршрут (логин)
  if (isAuthenticated && isPublicRoute && roleCookie) {
    const dashboard = ROLE_DASHBOARD[roleCookie] || '/founder';
    return NextResponse.redirect(new URL(dashboard, request.url));
  }

  // 5. Проверка доступа к защищённому разделу по роли
  if (isAuthenticated && roleCookie) {
    const matchedRoute = Object.keys(PROTECTED_ROUTES).find((route) =>
      pathname.startsWith(route)
    );

    if (matchedRoute) {
      const allowedRoles = PROTECTED_ROUTES[matchedRoute];
      const hasAccess = allowedRoles.includes(roleCookie);

      if (!hasAccess) {
        // Редирект на дашборд своей роли
        const correctDashboard = ROLE_DASHBOARD[roleCookie] || '/';
        return NextResponse.redirect(new URL(correctDashboard, request.url));
      }
    }
  }

  // 6. Добавляем заголовки безопасности
  const response = NextResponse.next();

  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );

  return response;
}

// ─── Конфигурация matcher ─────────────────────────────────────────────────────

export const config = {
  matcher: [
    /*
     * Применяем middleware ко всем маршрутам КРОМЕ:
     * - _next/static (статические файлы)
     * - _next/image (оптимизация изображений)
     * - favicon.ico
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
};

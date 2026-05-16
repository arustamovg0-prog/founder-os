# ⚡ Founder OS — Turn Chaos Into System

> AI-powered CRM и платформа управления стартап-экосистемой для **UNTITLED**.  
> Три портала. Один путь: от идеи до инвестиций.

---

## 🗂 Содержание

- [Стек технологий](#-стек-технологий)
- [Архитектура системы](#-архитектура-системы)
- [Структура папок](#-структура-папок)
- [Быстрый старт](#-быстрый-старт)
- [Переменные окружения](#-переменные-окружения)
- [Роли и доступы](#-роли-и-доступы)
- [Деплой](#-деплой)

---

## 🛠 Стек технологий

| Слой | Технология | Версия |
|------|-----------|--------|
| **Framework** | Next.js (App Router) | 16.x |
| **Language** | TypeScript | 5.x |
| **Styling** | Tailwind CSS + Custom CSS | 4.x |
| **Auth & DB** | Firebase Auth + Firestore | 10.x |
| **Storage** | Firebase Cloud Storage | 10.x |
| **AI Layer** | Google Gemini API | 1.5 Pro |
| **Charts** | Recharts | 2.x |
| **Icons** | Lucide React | latest |
| **Notifications** | react-hot-toast | 2.x |
| **State** | Zustand | 4.x |
| **Hosting** | Vercel | — |

---

## 🏗 Архитектура системы

```
┌─────────────────────────────────────────────────────┐
│                  FOUNDER OS PLATFORM                 │
├────────────────┬──────────────────┬─────────────────┤
│  Founder Portal│  Investor Portal │  Admin Dashboard │
│  /founder/*    │  /investor/*     │  /admin/*        │
└───────┬────────┴────────┬─────────┴────────┬────────┘
        │                 │                  │
        └─────────────────┴──────────────────┘
                          │
               ┌──────────▼──────────┐
               │   Next.js API +     │
               │   Firebase Auth     │
               │   (middleware.ts)   │
               └──────────┬──────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
┌───────▼──────┐ ┌────────▼───────┐ ┌──────▼──────┐
│  Firestore   │ │ Cloud Storage  │ │ Gemini API  │
│  (Main DB)   │ │ (Decks/Docs)   │ │ (AI Layer)  │
└──────────────┘ └────────────────┘ └─────────────┘
```

### Потоки данных

| Событие | Триггер | Результат |
|---------|---------|-----------|
| Upload Pitch Deck | Founder загружает PDF | Gemini скорирует → `aiScores.pitchDeckScore` |
| Submit Feedback | Investor оценивает питч | AI Post-Pitch Loop → `startup.status` обновляется |
| Stage Complete | Founder отмечает артефакты | Admin получает задачу на верификацию |
| Score ≥ 75 | AI Score достигает порога | Статус `investment_ready`, разблокируется питч |

---

## 📁 Структура папок

```
founder-os/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── layout.tsx              # Root layout (AuthProvider, Toaster)
│   │   ├── page.tsx                # Login / Landing page
│   │   ├── founder/                # Founder Portal
│   │   │   ├── layout.tsx          # Sidebar layout
│   │   │   ├── page.tsx            # Dashboard (KPIs, AI Score, Activity)
│   │   │   ├── roadmap/page.tsx    # Roadmap Engine (5 стадий)
│   │   │   ├── data-room/page.tsx  # Документы + Drag & Drop upload
│   │   │   ├── pitches/page.tsx    # Pitch requests management
│   │   │   └── ai-copilot/page.tsx # AI Chat (Gemini context-aware)
│   │   ├── investor/               # Investor Portal
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx            # Dashboard (Deal Pipeline)
│   │   │   ├── deal-flow/page.tsx  # Фильтруемый каталог стартапов
│   │   │   ├── pitches/page.tsx    # Incoming requests + Feedback Modal
│   │   │   └── portfolio/page.tsx  # Watchlist + Charts
│   │   └── admin/                  # Admin Panel
│   │       ├── layout.tsx
│   │       ├── page.tsx            # Ecosystem Overview + Alerts
│   │       ├── startups/page.tsx   # Expandable startup management
│   │       ├── stages/page.tsx     # Stage Verification Queue
│   │       └── analytics/page.tsx  # Charts: MRR, Radar, Leaderboard
│   ├── components/
│   │   └── Sidebar.tsx             # Role-aware navigation
│   ├── contexts/
│   │   └── AuthContext.tsx         # Firebase Auth + Profile state
│   ├── lib/
│   │   ├── firebase.ts             # Firebase app initialization
│   │   └── mockData.ts             # Demo data (startups, pitches, logs)
│   ├── types/
│   │   └── index.ts                # TypeScript типы всей платформы
│   └── middleware.ts               # Route protection by role
├── .env.local                      # Firebase + Gemini API keys (не в git!)
├── .env.example                    # Шаблон переменных
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

---

## 🚀 Быстрый старт

### 1. Клонирование и установка

```bash
git clone <repo-url>
cd founder-os
npm install
```

### 2. Настройка переменных окружения

```bash
cp .env.example .env.local
# Заполни значения из Firebase Console и Google AI Studio
```

### 3. Запуск в режиме разработки

```bash
npm run dev
# → http://localhost:3000
```

### 4. Демо-режим (без Firebase)

Платформа работает **без Firebase** в демо-режиме с тестовыми данными.  
На странице входа нажми одну из кнопок быстрого входа:

| Кнопка | Роль | Доступ |
|--------|------|--------|
| 🚀 Founder Demo | `founder` | `/founder/*` |
| 💼 Investor Demo | `investor` | `/investor/*` |
| ⚡ Admin Demo | `admin` | `/admin/*` |

### 5. Сборка для продакшена

```bash
npm run build
npm run start
```

---

## 🔐 Переменные окружения

Создай файл `.env.local` в корне проекта:

```bash
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Google Gemini API
GEMINI_API_KEY=

# App Config
NEXT_PUBLIC_APP_ENV=development   # development | production
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> ⚠️ **Никогда не коммить `.env.local` в git.** Файл добавлен в `.gitignore`.

---

## 👥 Роли и доступы

| Роль | Маршруты | Описание |
|------|----------|----------|
| `founder` | `/founder/*` | Управление своим стартапом, загрузка документов, отправка питч-запросов |
| `investor` | `/investor/*` | Просмотр Deal Flow, ответы на питч-запросы, отправка фидбека |
| `admin` | `/admin/*` | Полный контроль экосистемы, верификация стадий, аналитика |

**Middleware** автоматически редиректит:
- Неавторизованных → `/` (Login)
- Неверная роль → соответствующий дашборд своей роли

---

## 🌐 Деплой на Vercel

```bash
# Первый деплой (привязка проекта)
vercel

# Продакшен деплой
vercel --prod

# Установи переменные окружения в Vercel Dashboard:
# Settings → Environment Variables → добавь все из .env.local
```

### CI/CD (рекомендуется)

1. Подключи репозиторий к Vercel
2. При каждом `git push main` → автоматический деплой
3. Pull Request → Preview deployment

---

## 📐 Firestore Collections

| Коллекция | Описание |
|-----------|----------|
| `users/{uid}` | Профили пользователей + роли |
| `startups/{startupId}` | Данные стартапов, метрики, AI-скоры |
| `roadmap_stages/{stageId}` | Шаблоны стадий (системные) |
| `startup_roadmap_progress/{id}/stages/{id}` | Прогресс по стадиям |
| `digital_footprint/{startupId}/logs/{id}` | Аудит-лог всех событий |
| `pitch_events/{pitchId}` | Питч-сессии от запроса до закрытия |

---

## 🤖 AI Copilot — возможности

| Функция | Триггер | Модель |
|---------|---------|--------|
| Скоринг Pitch Deck | Upload PDF → GCS | Gemini 1.5 Pro |
| Post-Pitch Analysis | Investor feedback submitted | Gemini 1.5 Pro |
| Executive Summary | Metrics updated | Gemini 1.5 Flash |
| Roadmap AI Hints | Stage stuck > 7 days | Gemini 1.5 Flash |
| Startup Chat | Founder asks question | Gemini 1.5 Pro |

---

*Founder OS v1.0 · UNTITLED Ecosystem · Turn Chaos Into System*

# 🚀 Founder OS — Deployment Guide
> Complete step-by-step guide from zero to production

---

## 📋 Prerequisites

```bash
node --version   # >= 18
npm --version    # >= 9
git --version
```

---

## ⚡ Quick Setup (Automated)

```bash
# Полный автоматический setup одной командой:
bash scripts/setup.sh
```

---

## 🔥 Step 1 — Firebase Project

### 1.1 Create Firebase Project

1. Зайди на [console.firebase.google.com](https://console.firebase.google.com)
2. **Add project** → Название: `founder-os-prod`
3. Включи **Google Analytics** (опционально)

### 1.2 Enable Services

```
Authentication → Sign-in methods → Enable:
  ✅ Email/Password
  ✅ Email link (passwordless sign-in)

Firestore Database → Create database → Production mode

Storage → Get started → Production mode
```

### 1.3 Get SDK Config

```
Project Settings → General → Your apps → Add app (Web)
→ Copy the config object
```

Заполни `.env.local`:
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=founder-os-prod.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=founder-os-prod
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=founder-os-prod.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 1.4 Service Account (Admin SDK)

```
Project Settings → Service Accounts → Generate new private key
→ Скачай JSON файл
```

Скопируй **всё содержимое JSON** в одну строку и вставь в `.env.local`:
```bash
FIREBASE_ADMIN_SDK_JSON={"type":"service_account","project_id":"..."}
```

### 1.5 Deploy Security Rules

```bash
# Login to Firebase CLI
npx firebase-tools login

# Обнови .firebaserc с твоим project ID
echo '{"projects":{"default":"founder-os-prod"}}' > .firebaserc

# Deploy rules + indexes
npx firebase-tools deploy --only firestore:rules,firestore:indexes,storage
```

---

## 🤖 Step 2 — Gemini API Key

1. Зайди на [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. **Create API Key** → выбери проект `founder-os-prod`
3. Скопируй ключ в `.env.local`:

```bash
GEMINI_API_KEY=AIzaSy...
```

---

## 🌐 Step 3 — GitHub Repository

### 3.1 Create Repo

```bash
# На GitHub.com → New repository → founder-os
# Затем:
git remote add origin https://github.com/YOUR_USERNAME/founder-os.git
git push -u origin main
```

### 3.2 Add GitHub Actions Secrets

Зайди: **GitHub repo → Settings → Secrets and variables → Actions → New repository secret**

| Secret | Где получить |
|--------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Project Settings |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Project Settings |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase Project Settings |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase Project Settings |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase Project Settings |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase Project Settings |
| `GEMINI_API_KEY` | Google AI Studio |
| `FIREBASE_ADMIN_SDK_JSON` | Service Account JSON (одна строка) |
| `FIREBASE_TOKEN` | `npx firebase-tools login:ci` |
| `VERCEL_TOKEN` | Vercel → Account Settings → Tokens |
| `VERCEL_ORG_ID` | `.vercel/project.json` после `vercel link` |
| `VERCEL_PROJECT_ID` | `.vercel/project.json` после `vercel link` |

```bash
# Получить FIREBASE_TOKEN:
npx firebase-tools login:ci

# Получить VERCEL_ORG_ID и VERCEL_PROJECT_ID:
vercel link
cat .vercel/project.json
```

---

## 🚀 Step 4 — Vercel Deployment

### 4.1 Connect to Vercel

```bash
# Install Vercel CLI (если нет)
npm install -g vercel

# Link project
vercel link

# Первый деплой
vercel --prod
```

### 4.2 Environment Variables на Vercel

Зайди: **Vercel Dashboard → Project → Settings → Environment Variables**

Добавь все переменные из `.env.local` **КРОМЕ** `NEXT_PUBLIC_DEMO_MODE` (в продакшене: `false`).

**Важные настройки:**
```
NEXT_PUBLIC_DEMO_MODE = false      ← Выключить demo mode!
NEXT_PUBLIC_APP_ENV = production
NEXT_PUBLIC_APP_URL = https://your-project.vercel.app
```

### 4.3 Auto-deploy

После подключения GitHub → Vercel:
- `git push main` → автоматический production deploy
- Pull Request → Preview deploy + комментарий с URL

---

## ☁️ Step 5 — Cloud Functions

### 5.1 Setup

```bash
cd functions
npm install

# Установи Gemini API Key для Functions:
npx firebase-tools functions:config:set gemini.key="YOUR_GEMINI_KEY"
```

### 5.2 Deploy

```bash
# Из корневой папки:
npx firebase-tools deploy --only functions

# Или отдельно:
cd functions && npm run build
npx firebase-tools deploy --only functions:onPitchDeckUploaded
npx firebase-tools deploy --only functions:investorMatchEngine
```

### 5.3 Test Locally (Emulators)

```bash
# Запуск всех эмуляторов
npx firebase-tools emulators:start

# Доступны:
# Auth:      http://localhost:9099
# Firestore: http://localhost:8080
# Storage:   http://localhost:9199
# Functions: http://localhost:5001
# UI:        http://localhost:4000
```

---

## 📧 Step 6 — Email (SendGrid, опционально)

### 6.1 Setup SendGrid

1. [sendgrid.com](https://sendgrid.com) → Создай аккаунт
2. Settings → API Keys → Create → Full Access
3. Добавь в `.env.local`:

```bash
SENDGRID_API_KEY=SG.xxx...
SENDGRID_FROM_EMAIL=noreply@founderos.io
```

4. Verify sender: Settings → Sender Authentication

---

## ✅ Verification Checklist

```
□ Firebase project создан и настроен
□ Auth: Email/Password + Email Link включены
□ Firestore Security Rules задеплоены
□ Storage Rules задеплоены
□ .env.local заполнен (все NEXT_PUBLIC_FIREBASE_* + GEMINI_API_KEY)
□ NEXT_PUBLIC_DEMO_MODE=false
□ npm run build — билд без ошибок
□ Vercel проект подключён
□ Cloud Functions задеплоены
□ GitHub Actions secrets добавлены
□ CI workflow проходит зелёным
```

---

## 🔒 Security Notes

> ⚠️ **НИКОГДА не коммить в git:**
> - `.env.local`
> - `service-account.json`
> - Любые файлы с ключами API

> ⚠️ **Firestore Rules** должны быть задеплоены ДО открытия публичного доступа.

> ✅ **FIREBASE_ADMIN_SDK_JSON** хранить только в environment variables (Vercel/GitHub Secrets), не в файлах.

---

## 🆘 Troubleshooting

| Проблема | Решение |
|----------|---------|
| `Firebase: API key not valid` | Проверь `NEXT_PUBLIC_FIREBASE_API_KEY` в `.env.local` |
| `Permission denied (Firestore)` | Задеплой `firestore.rules` + проверь Custom Claims |
| `Session cookie invalid` | `FIREBASE_ADMIN_SDK_JSON` не настроен или истёк |
| `Gemini 403` | Проверь `GEMINI_API_KEY` и billing в Google Cloud |
| `Build fails on Vercel` | Добавь все `NEXT_PUBLIC_*` переменные в Vercel Dashboard |
| `Functions timeout` | Увеличь `timeoutSeconds` в function config (max 540s) |

---

*Founder OS · UNTITLED Ecosystem · Turn Chaos Into System*

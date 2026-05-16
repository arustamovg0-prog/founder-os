#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════════╗
# ║     FOUNDER OS — Automated Setup Script                      ║
# ║     Turn Chaos Into System · UNTITLED Ecosystem              ║
# ╠══════════════════════════════════════════════════════════════╣
# ║  Запуск: bash scripts/setup.sh                               ║
# ║  Требует: node, npm, git, firebase-tools, vercel CLI         ║
# ╚══════════════════════════════════════════════════════════════╝

set -e

RESET='\033[0m'
BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'

log() { echo -e "${CYAN}[Founder OS]${RESET} $1"; }
ok()  { echo -e "${GREEN}✓${RESET} $1"; }
warn(){ echo -e "${YELLOW}⚠${RESET}  $1"; }
err() { echo -e "${RED}✗ ERROR:${RESET} $1"; exit 1; }

echo ""
echo -e "${BOLD}⚡ Founder OS Setup Script${RESET}"
echo -e "${CYAN}   Turn Chaos Into System${RESET}"
echo ""

# ─── 1. Check dependencies ────────────────────────────────────────────────────
log "Checking dependencies..."

command -v node >/dev/null 2>&1 || err "Node.js not found. Install from https://nodejs.org"
command -v npm  >/dev/null 2>&1 || err "npm not found"
command -v git  >/dev/null 2>&1 || err "git not found"

NODE_VER=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VER" -lt 18 ]; then
  err "Node.js >= 18 required (current: $(node --version))"
fi

ok "Node.js $(node --version) ✓"
ok "npm $(npm --version) ✓"

# ─── 2. Install dependencies ──────────────────────────────────────────────────
log "Installing Next.js dependencies..."
npm install --silent
ok "Next.js dependencies installed"

log "Installing Cloud Functions dependencies..."
cd functions && npm install --silent && cd ..
ok "Cloud Functions dependencies installed"

# ─── 3. Setup .env.local ──────────────────────────────────────────────────────
if [ ! -f ".env.local" ]; then
  log "Creating .env.local from template..."
  cp .env.example .env.local
  ok ".env.local created — заполни Firebase/Gemini ключи!"
else
  warn ".env.local already exists — skipping"
fi

# ─── 4. Firebase CLI ──────────────────────────────────────────────────────────
log "Checking Firebase CLI..."
if ! command -v firebase >/dev/null 2>&1; then
  warn "Firebase CLI not found. Installing..."
  npm install -g firebase-tools
  ok "Firebase CLI installed"
else
  ok "Firebase CLI $(firebase --version) ✓"
fi

# Firebase login check
if ! firebase projects:list >/dev/null 2>&1; then
  warn "Not logged in to Firebase. Running: firebase login"
  firebase login
fi

# ─── 5. Vercel CLI ────────────────────────────────────────────────────────────
log "Checking Vercel CLI..."
if ! command -v vercel >/dev/null 2>&1; then
  warn "Vercel CLI not found. Installing..."
  npm install -g vercel
  ok "Vercel CLI installed"
else
  ok "Vercel CLI $(vercel --version) ✓"
fi

# ─── 6. Git setup ─────────────────────────────────────────────────────────────
log "Checking Git config..."
if ! git config user.email >/dev/null 2>&1; then
  warn "Git user not configured"
  read -p "Enter Git email: " GIT_EMAIL
  read -p "Enter Git name: " GIT_NAME
  git config --global user.email "$GIT_EMAIL"
  git config --global user.name "$GIT_NAME"
  ok "Git configured"
fi

# ─── 7. Build verification ────────────────────────────────────────────────────
log "Running build verification..."
if npm run build >/dev/null 2>&1; then
  ok "Build successful ✓"
else
  err "Build failed. Run 'npm run build' for details."
fi

# ─── 8. Firebase project setup ────────────────────────────────────────────────
echo ""
echo -e "${BOLD}Firebase Project Setup${RESET}"
echo ""

read -p "Enter Firebase Project ID (из Firebase Console): " FB_PROJECT
if [ -n "$FB_PROJECT" ]; then
  # Обновляем .firebaserc
  cat > .firebaserc << EOF
{
  "projects": {
    "default": "$FB_PROJECT"
  }
}
EOF
  ok "Firebase project set: $FB_PROJECT"
  
  log "Deploying Firestore rules and indexes..."
  firebase deploy --only firestore:rules,firestore:indexes,storage --project "$FB_PROJECT" && ok "Firebase rules deployed"
fi

# ─── 9. Vercel project setup ──────────────────────────────────────────────────
echo ""
echo -e "${BOLD}Vercel Deployment Setup${RESET}"
echo ""

read -p "Deploy to Vercel now? (y/N): " DEPLOY_VERCEL
if [ "$DEPLOY_VERCEL" = "y" ] || [ "$DEPLOY_VERCEL" = "Y" ]; then
  log "Linking Vercel project..."
  vercel link --yes
  
  log "Setting environment variables on Vercel..."
  # Читаем .env.local и устанавливаем NEXT_PUBLIC_ переменные
  while IFS='=' read -r key value; do
    [[ "$key" =~ ^#.*$ ]] && continue
    [[ -z "$key" ]] && continue
    [[ -z "$value" ]] && continue
    vercel env add "$key" production <<< "$value" 2>/dev/null || true
  done < .env.local
  
  log "Deploying to Vercel production..."
  vercel --prod
  ok "Deployed to Vercel ✓"
fi

# ─── 10. GitHub Actions secrets guide ────────────────────────────────────────
echo ""
echo -e "${BOLD}GitHub Actions — Required Secrets${RESET}"
echo ""
echo "Добавь следующие secrets в GitHub → Settings → Secrets → Actions:"
echo ""
echo -e "  ${CYAN}VERCEL_TOKEN${RESET}               — Vercel Dashboard → Account → Tokens"
echo -e "  ${CYAN}VERCEL_ORG_ID${RESET}              — vercel.json или 'vercel env pull'"
echo -e "  ${CYAN}VERCEL_PROJECT_ID${RESET}           — .vercel/project.json после 'vercel link'"
echo -e "  ${CYAN}FIREBASE_TOKEN${RESET}              — 'npx firebase-tools login:ci'"
echo -e "  ${CYAN}FIREBASE_ADMIN_SDK_JSON${RESET}     — Firebase Console → Service Accounts → Download"
echo -e "  ${CYAN}GEMINI_API_KEY${RESET}              — https://aistudio.google.com/app/apikey"
echo -e "  ${CYAN}NEXT_PUBLIC_FIREBASE_*${RESET}      — Firebase Console → Project Settings → SDK"
echo ""
echo -e "  Быстрая команда для Firebase CLI token:"
echo -e "  ${YELLOW}npx firebase-tools login:ci${RESET}"
echo ""

# ─── Done ────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}✅ Founder OS Setup Complete!${RESET}"
echo ""
echo -e "  Dev server:  ${CYAN}npm run dev${RESET}  →  http://localhost:3000"
echo -e "  Demo login:  🚀 Founder | 💼 Investor | ⚡ Admin"
echo ""
echo -e "${CYAN}  Turn Chaos Into System · UNTITLED Ecosystem${RESET}"
echo ""

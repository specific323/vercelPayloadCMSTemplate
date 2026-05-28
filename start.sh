#!/usr/bin/env bash
# ============================================================
# start.sh — 從這個 template 建立新的 PayloadCMS + Vercel + Neon 專案
# 使用方式：chmod +x start.sh && ./start.sh
# ============================================================

set -e  # 任何指令失敗就停止

# ── 顏色 ─────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC}   $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }
step()    { echo -e "\n${BOLD}━━━ $1 ━━━${NC}"; }

# ── 前置檢查 ──────────────────────────────────────────────────
step "前置檢查"

command -v git  >/dev/null 2>&1 || error "git 未安裝"
command -v pnpm >/dev/null 2>&1 || error "pnpm 未安裝。請先執行：npm install -g pnpm"
command -v gh   >/dev/null 2>&1 || warn  "gh CLI 未安裝，跳過自動建立 GitHub repo"
command -v vercel >/dev/null 2>&1 || warn "vercel CLI 未安裝（pnpm add -g vercel）"

success "前置檢查完成"

# ── 取得專案名稱 ───────────────────────────────────────────────
step "專案設定"

echo -e "${BOLD}請輸入新專案名稱${NC}（英文、數字、連字號，例如 my-blog）："
read -r PROJECT_NAME

if [[ -z "$PROJECT_NAME" ]]; then
  error "專案名稱不能為空"
fi

if [[ ! "$PROJECT_NAME" =~ ^[a-z0-9-]+$ ]]; then
  error "專案名稱只能包含小寫英文、數字和連字號"
fi

DEST_DIR="$(pwd)/../$PROJECT_NAME"

if [[ -d "$DEST_DIR" ]]; then
  error "目錄 $DEST_DIR 已存在，請選擇其他名稱"
fi

echo -e "${BOLD}GitHub 帳號${NC}（用於建立 repo，例如 specific323）："
read -r GITHUB_USER

echo ""
info "將建立專案：${BOLD}$PROJECT_NAME${NC}"
info "目標目錄：$DEST_DIR"
echo -e "${YELLOW}確認？(y/N)${NC} "
read -r CONFIRM
[[ "$CONFIRM" =~ ^[Yy]$ ]] || { info "已取消"; exit 0; }

# ── 複製 template ─────────────────────────────────────────────
step "複製 template"

cp -r "$(pwd)" "$DEST_DIR"
cd "$DEST_DIR"

# 清除不需要的檔案
rm -rf .git
rm -rf node_modules
rm -f .env.local
rm -f migrations/*.ts migrations/*.json migrations/index.ts 2>/dev/null || true

success "Template 複製完成：$DEST_DIR"

# ── 更新 package.json ─────────────────────────────────────────
step "更新 package.json"

# 用 node 更新 package name
node -e "
  const fs = require('fs');
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  pkg.name = '$PROJECT_NAME';
  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
  console.log('package.json name 更新為：$PROJECT_NAME');
"

success "package.json 更新完成"

# ── 安裝依賴 ──────────────────────────────────────────────────
step "安裝依賴（pnpm install）"

pnpm install
success "依賴安裝完成"

# ── 初始化 git ────────────────────────────────────────────────
step "初始化 Git"

git init
git add -A
git commit -m "init: bootstrap from vercelPayloadCMSTemplate"

success "Git 初始化完成"

# ── 建立 GitHub repo ──────────────────────────────────────────
step "建立 GitHub Repo"

if command -v gh >/dev/null 2>&1 && [[ -n "$GITHUB_USER" ]]; then
  if gh auth status >/dev/null 2>&1; then
    info "建立 GitHub repo：$GITHUB_USER/$PROJECT_NAME"
    gh repo create "$PROJECT_NAME" --public --source=. --push
    success "GitHub repo 建立完成：https://github.com/$GITHUB_USER/$PROJECT_NAME"
  else
    warn "gh 未登入，跳過自動建立 GitHub repo"
    warn "請手動執行：gh auth login"
  fi
else
  warn "跳過 GitHub repo 建立（gh CLI 未安裝或未填帳號）"
  echo ""
  info "手動步驟："
  echo "  1. 前往 https://github.com/new 建立 repo：$PROJECT_NAME"
  echo "  2. git remote add origin https://github.com/你的帳號/$PROJECT_NAME.git"
  echo "  3. git push -u origin main"
fi

# ── Vercel 連結 ───────────────────────────────────────────────
step "Vercel 設定"

if command -v vercel >/dev/null 2>&1; then
  echo ""
  warn "接下來需要手動操作："
  echo ""
  echo -e "  ${BOLD}1.${NC} 前往 Vercel → Import Git Repository"
  echo -e "     https://vercel.com/new"
  echo -e "  ${BOLD}2.${NC} 選剛建立的 repo，直接 Deploy"
  echo -e "  ${BOLD}3.${NC} 部署完後到專案 Storage → Connect → Neon"
  echo -e "  ${BOLD}4.${NC} 加入環境變數："
  echo -e "     PAYLOAD_SECRET = \$(openssl rand -hex 32)"
  echo -e "     NEXT_PUBLIC_SERVER_URL = https://<你的專案>.vercel.app"
  echo ""
  echo -e "${YELLOW}完成 Neon 連接後，按 Enter 繼續...${NC}"
  read -r

  info "嘗試連結 Vercel 專案..."
  vercel link --yes 2>/dev/null && success "Vercel 已連結" || warn "Vercel 連結失敗，請手動執行：vercel link"
else
  warn "vercel CLI 未安裝，跳過"
fi

# ── 拉取環境變數 + 建立 Migration ─────────────────────────────
step "資料庫 Migration"

if command -v vercel >/dev/null 2>&1; then
  info "拉取 Vercel 環境變數..."
  vercel env pull .env.local 2>/dev/null && success ".env.local 已建立" || {
    warn "無法拉取環境變數（Vercel 可能尚未連結或 Neon 尚未設定）"
    warn "請手動執行以下步驟後重試"
    echo ""
    echo "  vercel env pull .env.local"
    echo "  pnpm payload migrate:create --name initial"
    echo "  pnpm payload migrate"
    echo "  git add migrations/ src/payload-types.ts"
    echo "  git commit -m 'feat: add initial migration'"
    echo "  git push"
    echo ""
    echo -e "${GREEN}腳本完成（需要手動補充 migration 步驟）${NC}"
    exit 0
  }

  info "建立初始 migration..."
  NODE_OPTIONS=--no-deprecation pnpm payload migrate:create --name initial
  success "Migration 檔案建立完成"

  info "執行 migration（建立資料表）..."
  NODE_OPTIONS=--no-deprecation pnpm payload migrate
  success "資料表建立完成"

  info "提交 migration 檔案..."
  git add migrations/ src/payload-types.ts
  git commit -m "feat: add initial migration"
  git push
  success "Migration 已推送至 GitHub"
else
  warn "vercel CLI 未安裝，請手動執行 migration"
  echo ""
  echo "  vercel env pull .env.local"
  echo "  pnpm payload migrate:create --name initial"
  echo "  pnpm payload migrate"
  echo "  git add migrations/ src/payload-types.ts"
  echo "  git commit -m 'feat: add initial migration'"
  echo "  git push"
fi

# ── 完成 ──────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}${BOLD}  完成！專案 $PROJECT_NAME 已建立${NC}"
echo -e "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${BOLD}下一步：${NC}"
echo -e "  1. 觸發 Vercel 重新部署（push 剛才的 migration commit 應該會自動觸發）"
echo -e "  2. 前往 https://<你的專案>.vercel.app/admin 建立第一個管理員帳號"
echo -e "  3. 本地開發：cd $DEST_DIR && pnpm dev"
echo ""

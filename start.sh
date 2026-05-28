#!/usr/bin/env bash
set -e

# ── 安裝依賴 ──────────────────────────────────────────────────
if [ ! -d "node_modules" ]; then
  echo "📦 安裝依賴..."
  pnpm install
fi

# ── 環境變數 ──────────────────────────────────────────────────
if [ ! -f ".env.local" ]; then
  echo "⚠️  找不到 .env.local，嘗試從 Vercel 拉取..."
  if command -v vercel >/dev/null 2>&1; then
    vercel env pull .env.local
    echo "✅ .env.local 已建立"
  else
    echo "❌ 請先建立 .env.local（參考 .env.example）"
    echo "   或安裝 vercel CLI：pnpm add -g vercel"
    exit 1
  fi
fi

# ── 產生 importMap（本地 dev 必要） ───────────────────────────
echo "🗺️  產生 importMap..."
NODE_OPTIONS=--no-deprecation pnpm payload generate:importMap

# ── 啟動 ──────────────────────────────────────────────────────
echo "🚀 啟動開發伺服器..."
pnpm dev

# Vercel + PayloadCMS + Neon PostgreSQL Template

> 可重複使用的 starter template。下次新專案直接 fork 這個 repo，只需要設定環境變數和資料庫。

## 技術堆疊

| 套件 | 版本 | 說明 |
|------|------|------|
| PayloadCMS | 3.85.0 | Headless CMS + REST/GraphQL API |
| Next.js | 16.2.6 | App Router + Server Components |
| Vercel Neon | PostgreSQL | Serverless 資料庫 |
| @payloadcms/db-postgres | 3.85.0 | PostgreSQL adapter |
| React | 19.2.6 | UI framework |

---

## 專案結構

```
src/
├── app/
│   ├── (payload)/              # PayloadCMS admin 路由群組
│   │   ├── layout.tsx          # RootLayout + CSS + serverFunction
│   │   ├── admin/
│   │   │   ├── [[...segments]]/
│   │   │   │   ├── page.tsx    # Admin 主頁面
│   │   │   │   └── not-found.tsx
│   │   │   └── importMap.js    # 自動生成，勿手動編輯
│   │   └── api/
│   │       └── [...slug]/route.ts  # REST API endpoints
│   └── (frontend)/             # 前台路由群組
│       ├── layout.tsx          # 前台 HTML layout
│       ├── page.tsx            # 首頁
│       └── posts/
│           ├── page.tsx        # 文章列表
│           └── [slug]/page.tsx # 文章詳情
├── collections/
│   ├── Users.ts
│   ├── Posts.ts
│   └── Media.ts
├── payload.config.ts           # Payload 主設定
└── payload-types.ts            # 自動生成的 TypeScript 型別
migrations/
├── 20260528_031152.ts          # 初始 schema migration
└── index.ts
```

---

## 從這個 Template 新開專案的步驟

### Step 1 — Fork / Clone

```bash
# Fork 這個 repo 到你的 GitHub
# 或 clone 然後建新的 remote
git clone https://github.com/specific323/vercelPayloadCMSTemplate.git my-new-project
cd my-new-project
git remote set-url origin https://github.com/你的帳號/my-new-project.git
git push -u origin main
```

### Step 2 — 在 Vercel 匯入專案

1. 前往 [vercel.com/new](https://vercel.com/new)
2. 選 Import Git Repository → 選剛 push 的 repo
3. 直接 **Deploy**（先讓它 build）

### Step 3 — 連接 Neon 資料庫

Vercel Dashboard → 你的專案 → **Storage** → **Connect Database** → **Neon**

完成後 Vercel 會自動注入：
- `DATABASE_URL` — pooled 連線（runtime 用）
- `DATABASE_URL_UNPOOLED` — direct 連線（migration 用）

### Step 4 — 設定環境變數

**Settings → Environment Variables** 新增：

| 變數 | 值 | 說明 |
|------|-----|------|
| `PAYLOAD_SECRET` | `openssl rand -hex 32` | JWT 簽名密鑰，必填 |
| `NEXT_PUBLIC_SERVER_URL` | `https://你的專案.vercel.app` | 部署 URL |

### Step 5 — 重新部署 + 建立 migration

```bash
# 本地拉取真實的 DB 連線資訊
vercel env pull .env.local

# 建立初始 migration（只有第一次需要）
pnpm payload migrate:create --name initial

# 執行 migration（建立資料表）
pnpm payload migrate

# 提交 migration 檔案
git add migrations/ src/payload-types.ts
git commit -m "feat: add initial migration"
git push
```

Vercel 偵測到 push 後會自動重新部署。

### Step 6 — 建立第一個管理員

部署完成後前往 `https://你的專案.vercel.app/admin`，建立第一個使用者帳號。

---

## 本地開發

```bash
# 安裝依賴
pnpm install

# 拉取 Vercel 環境變數到本地
vercel env pull .env.local

# 啟動開發伺服器
pnpm dev

# 開啟 http://localhost:3000
```

---

## 新增 Collection

1. 在 `src/collections/` 新增 `MyCollection.ts`
2. 在 `src/payload.config.ts` 的 `collections` 陣列加入
3. 執行 `pnpm payload migrate:create --name add-my-collection`
4. 執行 `pnpm payload migrate`（本地）或推上去讓 Vercel build 跑

---

## 重要注意事項

### 資料庫連線策略（Neon + Vercel）

```ts
// payload.config.ts
db: postgresAdapter({
  pool: {
    // 一律用 pooled 連線（PgBouncer）作為 runtime 連線
    // Neon 文件建議 serverless 環境使用 pooled 連線
    connectionString: process.env.DATABASE_URL,
  },
  migrationDir: path.resolve(dirname, '../migrations'),
}),
```

Build script 跑 migration 時臨時切換為 direct 連線：
```json
"build": "payload generate:importMap && cross-env DATABASE_URL=$DATABASE_URL_UNPOOLED payload migrate && next build"
```

### Admin Layout 必須用 RootLayout

```tsx
// src/app/(payload)/layout.tsx
// 必須使用 @payloadcms/next/layouts 的 RootLayout
// 沒有它，admin UI 的 React context (useConfig) 會是 undefined
import '@payloadcms/next/css'  // CSS 也必須手動 import
```

### PayloadCMS 3.85 API 重點

```tsx
// page.tsx — 3.85 需要傳 config
RootPage({ config, importMap, params, searchParams })

// not-found.tsx — 3.85 需要傳 config
NotFoundPage({ config, importMap, params, searchParams })

// metadata — 3.85 不接受 importMap
generatePageMetadata({ config, params, searchParams })
```

---

## Collections 說明

### Users
- 欄位：email（auth）、name、role（admin/editor/user）

### Posts
- 欄位：title、slug（auto-generate）、excerpt、content（RichText）、featuredImage、author、tags、status（draft/published）、publishedAt
- 公開查詢只顯示 `status: published`

### Media
- 支援圖片上傳
- 自動產生 thumbnail / card / tablet 三種尺寸
- 若要在 Vercel 上傳圖片，需設定 Vercel Blob（加 `BLOB_READ_WRITE_TOKEN`）

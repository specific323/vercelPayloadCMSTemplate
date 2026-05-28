# 建置過程備忘錄 — 2026-05-28

> 這份文件記錄了從零建立 Vercel + PayloadCMS + Neon 的完整過程，
> 包含所有踩過的坑，讓下次不需要重新摸索。

---

## 最終版本

- PayloadCMS: **3.85.0**
- Next.js: **16.2.6**（⚠️ 不能用 15.5.x，PayloadCMS 3.85 不支援）
- React: 19.2.6

---

## 坑 1：Next.js 版本衝突

**問題**：`create-payload-app` 預設裝 `next@^15.3.0`，但 PayloadCMS 3.85 的 peer dependency 要求是 `>=16.2.6`。

**解法**：`package.json` 改成 `"next": "^16.2.6"`。

---

## 坑 2：pnpm lockfile checksum 不符

**問題**：曾經建立過 `.pnpmfile.cjs` 再刪掉，導致 lockfile 記錄的 `pnpmfileChecksum` 和實際不符，Vercel `pnpm install` 直接 fail。

**解法**：本地跑 `pnpm install --no-frozen-lockfile` 重新產生 lockfile，commit 推上去。

---

## 坑 3：importMap.js 沒有被 commit

**問題**：`importMap.js` 加入了 `.gitignore`，Vercel 拿到的 repo 裡沒有這個檔案，Turbopack 在 build 時找不到而報錯。

**解法**：build script 改成先跑 `payload generate:importMap`：
```json
"build": "payload generate:importMap && next build"
```

---

## 坑 4：TypeScript 嚴格模式各種 implicit any

**問題**：Vercel build 開了嚴格模式的 TypeScript check（`isolatedModules: true`），本地 `tsc --noEmit` 不會報的錯在 Vercel 會報。

解決了以下問題：
- `.map((item, i) =>` 的 callback 參數缺型別
- `Posts.ts` 的 `access.read` 回傳值型別不符 `Where`
- `tsconfig.json` 缺少 `allowJs: true`（importMap.js 需要）

---

## 坑 5：PayloadCMS 3.85 的 Admin View API 改變

**問題**：舊的 PayloadCMS 範例不需要傳 `config`，但 3.85 的 `RootPage`、`NotFoundPage` 都需要。

**解法**：
```tsx
// page.tsx
RootPage({ config, importMap, params, searchParams })

// not-found.tsx
NotFoundPage({ config, importMap, params, searchParams })

// metadata — 注意：不接受 importMap
generatePageMetadata({ config, params, searchParams })
```

---

## 坑 6：資料庫 schema 不存在

**問題**：Neon 連上了但表格不存在，`payload migrate` 找不到 migrations 目錄。

**根本原因**：需要先建立 migration 檔案才能跑 migrate。

**解法（完整流程）**：
```bash
# 1. 拉取真實 DB 連線資訊
vercel env pull .env.local

# 2. 建立初始 migration（不需要 DB，只掃描 schema）
pnpm payload migrate:create --name initial

# 3. 對真實 DB 執行 migration
pnpm payload migrate

# 4. 提交 migration 檔案
git add migrations/ src/payload-types.ts
git push
```

Build script 加上 migrate（用 unpooled 連線避免 PgBouncer 問題）：
```json
"build": "payload generate:importMap && cross-env DATABASE_URL=$DATABASE_URL_UNPOOLED payload migrate && next build"
```

---

## 坑 7：Neon pooled vs unpooled 連線策略

**問題**：
- `DATABASE_URL`（pooled / PgBouncer）：適合 serverless runtime，但 `push:true`（DDL）會被擋
- `DATABASE_URL_UNPOOLED`（direct）：適合 migration，但在 Vercel serverless function 裡容易 timeout

**解法**：
- **Runtime**（payload.config.ts pool）→ `DATABASE_URL`（pooled）
- **Migration**（build script）→ `DATABASE_URL_UNPOOLED`（direct）

---

## 坑 8：PAYLOAD_SECRET 和 NEXT_PUBLIC_SERVER_URL 沒設定

**問題**：admin `/create-first-user` 頁面 500，`TypeError: Cannot destructure property 'config'`。

**部分原因**：`PAYLOAD_SECRET` 和 `NEXT_PUBLIC_SERVER_URL` 沒有加入 Vercel 環境變數。

```bash
# 產生 PAYLOAD_SECRET
openssl rand -hex 32

# Vercel 加入
vercel env add PAYLOAD_SECRET production
vercel env add NEXT_PUBLIC_SERVER_URL production
```

---

## 坑 9：(payload)/layout.tsx 缺少 RootLayout

**問題（最難找的坑）**：admin 頁面一直出現 `TypeError: Cannot destructure property 'config' of 'Z(...)' as it is undefined`。

**根本原因**：`@payloadcms/ui` 的客戶端元件使用 `useConfig()` hook，這個 hook 從 `RootConfigContext` 取值。但 `RootConfigContext` 的 Provider（`ConfigProvider`）是由 `@payloadcms/next/layouts` 的 `RootLayout` 設定的。我們的 `(payload)/layout.tsx` 只是 `return children`，根本沒有設置這個 context。

**解法**：
```tsx
// src/app/(payload)/layout.tsx
import { RootLayout, handleServerFunctions } from '@payloadcms/next/layouts'
import config from '@payload-config'
import { importMap } from './admin/importMap.js'
import '@payloadcms/next/css'  // ← CSS 必須手動 import！

export default async function Layout({ children }) {
  const serverFunction = async (args) => {
    'use server'
    return handleServerFunctions({ ...args, config, importMap })
  }
  return (
    <RootLayout config={config} importMap={importMap} serverFunction={serverFunction as any}>
      {children}
    </RootLayout>
  )
}
```

**注意**：
- `serverFunction` 必須是 inline closure（不能放獨立 `.ts` 檔，Turbopack 無法把 `.js` 解析為 `.ts`）
- `handleServerFunctions` 需要 `config` 和 `importMap` 注入，client 端呼叫時不會自動帶這兩個值
- `'use server'` 只能放在 function 內部，不能在有 non-async export 的 file 頂部
- `@payloadcms/next/css` 必須手動 import，`RootLayout` 不會自動載入 CSS

---

## 坑 10：next.config.ts 的 output: 'standalone'

**問題**：加了 `output: 'standalone'` 導致 PayloadCMS SSR context 鏈斷掉。

**解法**：Vercel 不需要 standalone mode，直接移除：
```ts
const nextConfig: NextConfig = {}  // 空的就好
```

---

## Vercel 環境變數清單

| 變數 | 來源 | 說明 |
|------|------|------|
| `DATABASE_URL` | Neon 自動注入 | Pooled 連線 |
| `DATABASE_URL_UNPOOLED` | Neon 自動注入 | Direct 連線 |
| `PAYLOAD_SECRET` | 手動設定 | `openssl rand -hex 32` |
| `NEXT_PUBLIC_SERVER_URL` | 手動設定 | `https://xxx.vercel.app` |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob（選用）| 媒體上傳用 |

---

## Build Script 最終版本

```json
"build": "cross-env NODE_OPTIONS=--no-deprecation payload generate:importMap && cross-env DATABASE_URL=$DATABASE_URL_UNPOOLED payload migrate && next build"
```

順序說明：
1. `payload generate:importMap` — 生成 admin UI 的 import map
2. `payload migrate` — 對 DB 執行 pending migrations（用 unpooled 連線）
3. `next build` — 正常 Next.js 建置

---

## 下次從這個 Template 開始時的 Checklist

- [ ] Fork repo
- [ ] `git remote set-url origin` 改成新 repo
- [ ] Vercel 匯入並 deploy（先讓它跑）
- [ ] Vercel Storage 連接 Neon
- [ ] 加入 `PAYLOAD_SECRET`（openssl rand -hex 32）
- [ ] 加入 `NEXT_PUBLIC_SERVER_URL`
- [ ] 本地跑 `vercel env pull .env.local`
- [ ] 本地跑 `pnpm payload migrate:create --name initial`
- [ ] 本地跑 `pnpm payload migrate`（建立資料表）
- [ ] commit migration files，push
- [ ] 等 Vercel 部署完成
- [ ] 前往 `/admin` 建立第一個使用者

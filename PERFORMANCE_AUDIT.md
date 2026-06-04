# Performance audit — QBO Bank Entry (Finza)

**Date:** 2026-06-04  
**Stack:** Next.js 15, React 19, Supabase, QuickBooks Online API

---

## 1. Why the project was ~1.3 GB on disk

| Folder / file | Size (MB) | Should deploy? | Notes |
|---------------|-----------|----------------|-------|
| `.next/` | **728** | No (build on CI/host) | Mostly webpack cache (`*.pack`); safe to delete locally |
| `node_modules/` | **688** | No | Installed via `npm ci` on server |
| `.git/` | 5 | No | Normal |
| `src/` | **0.72** | Yes | Actual application code is small |
| `public/` | 0 | Yes | No large media found |
| `scripts/test_upload.pdf` | &lt;1 | No | Test artifact; now in `.gitignore` |

**Total measured:** ~1,423 MB  
**Typical “bloated repo” cause:** `node_modules` + `.next` cache committed or copied to production — not source code.

### Safe cleanup (local)

```powershell
cd C:\Users\Hp\Desktop\Projects\QBO_BANK_ENTRY
npm run clean          # removes .next, dist, build, .cache, coverage
# Optional: reinstall deps only when needed
Remove-Item -Recurse -Force node_modules; npm ci
```

**Do not delete** `node_modules` or `.next` on the server **during** a running app — only on build agents before `npm ci && npm run build`.

---

## 2. Unused / removed dependencies

| Package | Action | Reason |
|---------|--------|--------|
| `isomorphic-git` | **Removed** | Not imported anywhere in `src/` |

Run `npm run depcheck` to find more candidates before removing.

---

## 3. Bundle size (production `next build`)

### Before (estimated from pre-change patterns)

| Route | Issue |
|-------|--------|
| `/` (dashboard) | 3× separate QuickBooks P&amp;L API calls (KPI + cash flow + expenses) |
| `/reports/mis` | **~437 kB** First Load JS (recharts + jspdf + html2canvas on main bundle) |
| `/reports/debtors`, `/creditors` | jspdf + xlsx in initial chunk |
| Middleware | `getUser()` on **every** `/api/*` request |

### After (measured)

| Route | First Load JS | Change |
|-------|---------------|--------|
| `/` | **123 kB** | Shared `DashboardReportsProvider` — 2 parallel QBO calls instead of 3+ |
| `/reports/mis` | **136 kB** | Was ~437 kB — charts & export libs lazy-loaded |
| `/reports/debtors` | **160 kB** | PDF/Excel libs load on export only |
| `/reports/creditors` | **160 kB** | Same |
| `/bank-entries` | **296 kB** | `BankUploadWizard` code-split |
| Middleware | **80.5 kB** | API routes skip session refresh |

Analyze locally:

```powershell
npm run analyze   # opens bundle analyzer after build
```

---

## 4. Slow API endpoints (root causes)

| Endpoint | Slowness driver | Mitigation applied |
|----------|-----------------|-------------------|
| `/api/qbo/reports/profit-and-loss` | QuickBooks external API + retries | 5 min in-memory cache + `Cache-Control: private, max-age=300` |
| `/api/qbo/reports/aged-receivables` | Same | Same cache layer |
| `/api/qbo/reports/aged-payables` | Same | Same cache layer |
| `/api/qbo/accounts` | QBO + token refresh | Called once per dashboard load (shared provider) |
| `/api/qbo/company-info` | Extra round-trip | Removed from debtors/creditors pages (use Zustand company name) |
| Header on every navigation | Duplicate `companies` + `status` + `company-info` | Fixed duplicate `useEffect` fetches |

**Still slow by nature:** PDF parser routes (`pdfjs-dist`), QBO bulk post, setup suggest-rules (historical QBO scan).

---

## 5. Database

| Issue | Fix |
|-------|-----|
| No indexes on `client_id` / `company_id` | Run `performance_indexes.sql` in Supabase SQL editor |
| `select('*')` on lists | Narrowed to required columns in `companies`, `clients`, `rules` |

```sql
-- File: performance_indexes.sql
```

---

## 6. Fixes applied (file reference)

| Area | Files |
|------|--------|
| `.gitignore` | `.gitignore` — deploy artifacts, env, uploads, logs |
| `.dockerignore` | `.dockerignore` |
| Bundle analyzer | `next.config.ts`, `package.json` (`analyze` script) |
| Middleware perf | `src/utils/supabase/middleware.ts` |
| Report caching | `src/lib/qbo-report-cache.ts`, P&amp;L + aged AR/AP routes |
| Dashboard dedupe | `src/components/dashboard/DashboardReportsProvider.tsx`, KPI/CashFlow/Expense charts |
| Code splitting | `bank-entries/page.tsx`, `MisReportCharts.tsx`, chart subcomponents |
| Lazy exports | `debtors/page.tsx`, `creditors/page.tsx`, `mis/page.tsx` |
| Header API dedupe | `src/components/layout/Header.tsx` |
| Removed `force-dynamic` | `src/app/(dashboard)/layout.tsx` |
| Vercel prod install | `vercel.json` — `npm ci` |
| Size audit script | `scripts/measure-project-size.ps1` |

---

## 7. Commands — local development

```powershell
cd C:\Users\Hp\Desktop\Projects\QBO_BANK_ENTRY
npm ci
npm run clean          # optional: drop stale .next cache
npm run build          # production bundle
npm run start          # serve production build (NOT npm run dev)
```

Use **`npm run start`** to validate real-world performance. `npm run dev` is slower and not representative.

```powershell
# Bundle report
npm run analyze

# Dependency audit
npm run depcheck

# Disk usage
powershell -File scripts\measure-project-size.ps1
```

Apply DB indexes (once per Supabase project):

```sql
-- Paste contents of performance_indexes.sql in Supabase → SQL Editor → Run
```

---

## 8. Commands — deploy (Vercel)

1. Ensure env vars are set in Vercel (not in git): `NEXT_PUBLIC_SUPABASE_*`, QBO secrets.
2. Build command: `npm run build` (default in `vercel.json`).
3. Install command: `npm ci` (faster, reproducible).
4. Do **not** upload `node_modules`, `.next`, `.env`, or `scripts/test_upload.pdf`.

```powershell
npx vercel --prod
```

For Docker/other hosts: copy only repo source + `package.json` / lockfile → `npm ci` → `npm run build` → `npm run start` on port 3000.

---

## 9. Recommended follow-ups (not changed — need your confirmation)

1. **Delete `.next` from git** if it was ever committed: `git rm -r --cached .next`
2. **MIS / financials** — add search debounce if you add client-side filtering on large tables.
3. **Rules panel** — lazy-load `xlsx` on import/export only (same pattern as debtors).
4. **QBO `qbo.ts`** — reduce `console.log` in production (noise + minor CPU).
5. **Server-side pagination** for `bank_entries` if tables grow past ~500 rows per company.
6. Run `npm audit fix` for dependency vulnerabilities (35 reported at audit time).

---

## 10. Expected user-visible impact

- **Navigation:** Faster — middleware no longer hits Supabase on every API poll.
- **Dashboard:** One coordinated load instead of three competing P&amp;L requests.
- **MIS report page:** Much smaller initial JS; charts load after first paint.
- **Debtors/Creditors:** No extra `company-info` call; auto-refresh 60s instead of 5s when enabled.
- **Disk:** Project still ~1.4 GB **with** `node_modules` + `.next`; **~1–2 MB** source-only for git/deploy.

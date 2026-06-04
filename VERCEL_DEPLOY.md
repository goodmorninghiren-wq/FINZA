# Deploy Finza to Vercel

This guide walks through deploying the Finza QuickBooks Bank Entry app to [Vercel](https://vercel.com) from GitHub.

## Prerequisites

- GitHub repo: [goodmorninghiren-wq/FINZA](https://github.com/goodmorninghiren-wq/FINZA)
- [Vercel account](https://vercel.com/signup) (free tier works)
- [Supabase project](https://supabase.com) with schema from `supabase_schema.sql`
- [Intuit Developer app](https://developer.intuit.com) (QuickBooks OAuth)

---

## Step 1: Push code to GitHub

If not already pushed:

```bash
git remote set-url origin https://github.com/goodmorninghiren-wq/FINZA.git
git add .
git commit -m "Prepare Finza for Vercel deployment"
git push -u origin master
```

> Use `main` instead of `master` if your default branch is `main`.

---

## Step 2: Import project in Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import Git Repository**
3. Connect your GitHub account if prompted
4. Select **goodmorninghiren-wq/FINZA**
5. Framework preset should auto-detect **Next.js**
6. Leave build settings as defaults:
   - **Build Command:** `next build`
   - **Output Directory:** (default)
   - **Install Command:** `npm install`

Do **not** deploy yet — add environment variables first.

---

## Step 3: Environment variables

In Vercel → **Project → Settings → Environment Variables**, add every variable from `.env.template`.

Copy values from your local `.env.local` (never commit that file).

### Required (core app)

| Variable | Notes |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only; keep secret |
| `DATABASE_URL` | Supabase Postgres connection string |
| `NEXT_PUBLIC_QBO_CLIENT_ID` | Intuit Developer → Keys & OAuth |
| `QBO_CLIENT_SECRET` | Server-only; keep secret |
| `NEXT_PUBLIC_QBO_ENVIRONMENT` | `sandbox` or `production` |
| `QBO_TOKEN_SECRET` | Random 32+ char secret for token encryption |

Generate `QBO_TOKEN_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Optional (features)

| Variable | Used for |
|----------|----------|
| `NEXT_PUBLIC_QBO_REDIRECT_URI` | Fallback only; OAuth uses dynamic URL on Vercel |
| `GEMINI_API_KEY` | PDF parsing via Gemini |
| `N8N_WEBHOOK_URL` | n8n PDF parser webhook |
| `MAKE_WEBHOOK_URL` | Make.com webhook (alternative) |
| `EMAIL_USER` | Outbound email |
| `EMAIL_PASS` | SMTP password / app password |
| `EMAIL_HOST` | Default: `smtp.gmail.com` |
| `EMAIL_FROM_NAME` | Default: `Finza Reporting` |

Apply variables to **Production**, **Preview**, and **Development** as needed.

---

## Step 4: QuickBooks OAuth redirect URIs

After the first Vercel deploy, copy your production URL (e.g. `https://finza.vercel.app`).

In [Intuit Developer Portal](https://developer.intuit.com) → **My Apps** → your app → **Keys & OAuth** → **Redirect URIs**, add:

```
https://YOUR-VERCEL-DOMAIN.vercel.app/api/auth/qbo/callback
```

Also add preview deployments if you use OAuth on preview branches:

```
https://*.vercel.app/api/auth/qbo/callback
```

> Intuit may not support wildcards — add each preview URL you need, or test OAuth only on production.

The app builds the redirect URI automatically from the request host, so you do **not** need to change `NEXT_PUBLIC_QBO_REDIRECT_URI` for Vercel unless you use a custom domain.

---

## Step 5: Supabase auth redirect URLs

In Supabase → **Authentication** → **URL Configuration**:

| Setting | Value |
|---------|--------|
| **Site URL** | `https://YOUR-VERCEL-DOMAIN.vercel.app` |
| **Redirect URLs** | `https://YOUR-VERCEL-DOMAIN.vercel.app/**` |

Add `http://localhost:3000/**` for local development.

---

## Step 6: Deploy

1. Click **Deploy** in Vercel (or push to GitHub to trigger auto-deploy)
2. Wait for the build to finish (`npm run build` must pass)
3. Open your Vercel URL and test `/login`

---

## Step 7: Custom domain (optional)

1. Vercel → **Project → Settings → Domains**
2. Add your domain and follow DNS instructions
3. Update Intuit redirect URI and Supabase Site URL to the custom domain

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Login fails / Supabase errors | Verify all Supabase env vars; check Supabase URL config |
| QuickBooks OAuth fails | Redirect URI in Intuit must exactly match `https://your-domain/api/auth/qbo/callback` |
| 500 on deploy | Check Vercel **Functions** logs; ensure `SUPABASE_SERVICE_ROLE_KEY` is set |
| Build fails | Run `npm run build` locally; fix TypeScript errors before pushing |

---

## Local vs production

| | Local | Vercel |
|---|--------|--------|
| Dev command | `npm run dev` | Auto on git push |
| Env file | `.env.local` | Vercel dashboard |
| QBO redirect | Dynamic from `localhost:3000` | Dynamic from Vercel domain |
| SSL bypass | `npm run dev` only | Not needed (proper HTTPS) |

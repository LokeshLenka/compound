# Personal Hub — Frontend

Next.js 16 (App Router) + TypeScript + Tailwind v4 + shadcn/ui (base-ui) + TanStack Query + TipTap. Data lives in Supabase (see `../backend`).

## Local development

1. Start the Supabase stack (from `../backend`): `npx supabase start`
2. Copy `.env.example` → `.env.local` and fill in the local values from `npx supabase status --output env` in `../backend`:
   - `NEXT_PUBLIC_SUPABASE_URL` (e.g. `http://127.0.0.1:54321`)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (local linking/tests only — never exposed to the browser)
3. `pnpm dev` → http://localhost:3000

Demo seed account (after `supabase db reset` in backend): `demo@personalhub.local` / `demo123456`.

## Commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | Start dev server (Next 16 + Turbopack) |
| `pnpm build` | Production build |
| `pnpm lint` | ESLint (`eslint .`) |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Vitest unit tests |
| `pnpm e2e` | Playwright E2E (needs local Supabase + dev server; auto-starts dev server) |

## Architecture

- Data access ONLY via Supabase clients in `src/lib/supabase/*` (browser singleton + server client + session-refresh middleware). No ad-hoc fetch calls.
- Auth gate lives in `src/proxy.ts` (Next 16 replaces `middleware.ts` with `proxy`).
- TanStack Query per feature (`src/features/<feature>/use-*.ts`); optimistic updates for check-ins and mutations.
- Server components are only used for the shell/layout; every page is a client component that loads its own data.

## Deploying to Vercel

1. Push the frontend repo to GitHub and import it as a Vercel project (framework auto-detected: Next.js). `vercel.json` pins the framework.
2. Create a Supabase project (cloud), apply migrations: `npx supabase db push` and seed via `node scripts/seed.mjs` (backend repo).
3. Add env vars in Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Deploy the `delete-account` edge function to the cloud project: `supabase functions deploy delete-account` (needs service-role access). Required for the Settings → Delete account flow.
5. Enable email confirmation on the cloud project (local dev has it off for convenience).

All tables are RLS-restricted to `auth.uid()`, so the cloud app works with the exact same migrations as local.

## E2E notes

- Playwright tests register their own throwaway user via the UI (email `e2e-<ts>@test.local`), so parallel runs never collide.
- `playwright.config.ts` reuses an already-running dev server; set `reuseExistingServer: false` for CI.
- Run `pnpm exec playwright install chromium` once after a fresh clone.
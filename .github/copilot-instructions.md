AUTO-GENERATED FROM AGENTS.md — DO NOT EDIT DIRECTLY. To update: edit AGENTS.md, then run npm run sync-ai-rules

<!-- prettier-ignore-start -->

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

### Stack overview
Next.js 16.2.2 (App Router + Turbopack), React 19, Tailwind CSS 4, TypeScript 5. Auth via Clerk, data via Azure/Postgres through the data-plane adapters. Optional services degrade gracefully: Anthropic Claude, OpenAI, Stripe, Resend, PostHog. Legacy Supabase/Neo4j/Pinecone names may still exist in compatibility shims, tests, migrations, or deprecation docs; do not introduce new runtime dependencies on them.

### Running the dev server
```
npm run dev          # starts on http://localhost:3000
```
Clerk authentication wraps the entire app. The root `/` route and `/sign-in` are public. Most other routes require a valid Clerk session. Without real `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`, only the homepage renders; all other pages redirect to Clerk's auth flow.

The `.env.local` file must contain a validly-formatted `pk_test_*` key (base64-encoded Clerk frontend API domain) or Clerk middleware will crash with "Publishable key not valid." — a bare string like `pk_test_placeholder` is rejected at the SDK level.

### Linting
```
npx eslint src/      # ESLint 9 flat config in eslint.config.mjs
```

### Testing
- **Unit / behavior tests:** `npm run test:nav`, `npm run test:behaviors` — fast, no external deps.
- **Integration tests:** `npm run test:integration` — most pass without a DB; suites that hit the Azure/Postgres data plane will fail with placeholder credentials.
- **E2E tests:** `npm run test:e2e` — requires Playwright browsers (`npx playwright install chromium`) and a running dev server with real Clerk + Azure/Postgres credentials.
- Jest picks up Playwright `*.spec.ts` files from `tests/e2e/` by default; the dedicated scripts (`test:nav`, `test:behaviors`, `test:integration`) correctly scope to their directories.

### Env vars
Required for the app to serve any page:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (must be valid `pk_test_*` or `pk_live_*` format)
- `CLERK_SECRET_KEY`

Required for data-backed pages:
- `DATABASE_URL`
- Any legacy `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, or `SUPABASE_SERVICE_ROLE_KEY` references are compatibility-era residue. New runtime code must use the Azure/Postgres data-plane adapters, not direct Supabase clients.

Optional (features degrade gracefully): `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `STRIPE_SECRET_KEY`, `RESEND_API_KEY`.

### Node.js version
The Dockerfile uses `node:24-bookworm-slim`. Use Node.js 24.x for consistency.

## Release control discipline

Every non-trivial change must be traceable as a controlled release candidate, not just as a PR. Before opening or updating a PR, classify the release lane, explain the layer impact, identify client applicability, record QA/validation, and describe rollout plus rollback.

Use these lanes consistently:
- `global-control-lane`: shared app/control-plane behavior for all clients unless feature-gated.
- `client-data-lane`: client-scoped schema, RLS, seed, ingestion, retrieval, or private data-plane changes.
- `internal-admin`: AbarVa-only operations/admin capability.
- `public-demo`: public route, demo path, investor/founder-facing artifact.
- `experimental`: feature-flagged or non-default capability.

If a PR changes release-relevant files, add or update a release record under `docs/releases/records/` using `docs/releases/templates/release-record-template.md`. The record must explain, in plain English, what changed, what layer changed, which clients are affected, what QA/validation was done, how it rolls out, how it rolls back, and what audit evidence exists. `npm run release:check` enforces this in CI; do not bypass it without explicit Anand approval.

<!-- prettier-ignore-end -->

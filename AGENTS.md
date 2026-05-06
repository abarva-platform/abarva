<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

### Stack overview
Next.js 16.2.2 (App Router + Turbopack), React 19, Tailwind CSS 4, TypeScript 5. Auth via Clerk, data via Supabase (Postgres), optional services: Anthropic Claude, OpenAI, Pinecone, Neo4j, Stripe, Resend, PostHog.

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
- **Integration tests:** `npm run test:integration` — most pass without a DB; ~34 suites that hit Supabase will fail with placeholder credentials.
- **E2E tests:** `npm run test:e2e` — requires Playwright browsers (`npx playwright install chromium`) and a running dev server with real Clerk + Supabase credentials.
- Jest picks up Playwright `*.spec.ts` files from `tests/e2e/` by default; the dedicated scripts (`test:nav`, `test:behaviors`, `test:integration`) correctly scope to their directories.

### Env vars
Required for the app to serve any page:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (must be valid `pk_test_*` or `pk_live_*` format)
- `CLERK_SECRET_KEY`

Required for data-backed pages:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`

Optional (features degrade gracefully): `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `PINECONE_API_KEY`, `NEO4J_URI`/`NEO4J_USERNAME`/`NEO4J_PASSWORD`, `STRIPE_SECRET_KEY`, `RESEND_API_KEY`.

### Node.js version
The Dockerfile uses `node:24-bookworm-slim`. Use Node.js 24.x for consistency.

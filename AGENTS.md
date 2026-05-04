<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

### Tech stack summary
Next.js 16.2.2 (App Router, Turbopack) + React 19 + Tailwind CSS 4 + Clerk auth + Supabase (Postgres) + Neo4j + Pinecone. See `package.json` for the full dependency list.

### Environment variables
The app requires a `.env.local` file. Required secrets are injected as environment variables via the Cursor Secrets panel. On session start, generate `.env.local` from the environment:
```bash
node -e "const fs=require('fs'); const keys=['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY','CLERK_SECRET_KEY','NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY','DATABASE_URL']; fs.writeFileSync('.env.local', keys.filter(k=>process.env[k]).map(k=>k+'='+process.env[k]).join('\n')+'\n');"
```
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` must be a structurally valid Clerk key (`pk_test_<base64>`) or the middleware throws before any route renders.
- `DATABASE_URL` is only needed for migrations (`npm run db:migrate`) and seed scripts, not for the dev server itself.
- The marketing homepage (`/`) is public; authenticated routes (`/home`, `/tower`, `/intelligence/ask`, `/engagements`) require real Clerk credentials and redirect to the Clerk-hosted sign-in at `*.accounts.dev`.

### Running the dev server
`npm run dev` starts the Next.js Turbopack dev server on port 3000. See `README.md` for standard commands.

### Lint / Test / Build commands
- **Lint**: `npm run lint` (ESLint 9, flat config in `eslint.config.mjs`)
- **Unit/behavior tests**: `npm run test:nav`, `npm run test:behaviors`
- **Integration tests**: `npm run test:integration` (Jest)
- **Full pre-commit suite**: `npm run test:before-commit` (nav + behaviors + integration + build)
- **E2E**: `npm run test:e2e` (Playwright, requires Chromium — `npx playwright install chromium`)
- **Build**: `npm run build`

### Gotchas
- The root `npm test` runs Jest against **all** files including `tests/e2e/*.spec.ts`, which causes Playwright-inside-Jest failures. Use the targeted test scripts (`test:nav`, `test:behaviors`, `test:integration`) or pass `--testPathIgnorePatterns='tests/e2e'` when running `npx jest` directly.
- The `src/__tests__/__mocks__/passthrough-plugin.ts` file triggers a "no tests" Jest failure when matched — this is a known mock file, not a test suite.
- Some integration tests (43 suites as of this writing) fail on `main` due to code expectation mismatches, not environment issues.
- Playwright `--with-deps` may fail due to missing font packages in minimal Ubuntu; `npx playwright install chromium` (without `--with-deps`) works after the Chrome system deps are already present.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

### Stack overview

Next.js 16.2.2 (App Router + Turbopack), React 19, Tailwind CSS 4, TypeScript 5. Auth via Clerk, data via Azure/Postgres through the data-plane adapters. Production answer generation uses Anthropic Claude through the audited AI egress path. Optional non-reasoning utilities may degrade gracefully when configured (for example embeddings, Stripe, Resend, PostHog). Legacy Supabase/Neo4j/Pinecone names may still exist in compatibility shims, tests, migrations, or deprecation docs; do not introduce new runtime dependencies on them.

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

Required for production answer generation:

- `ANTHROPIC_API_KEY`

Optional (features degrade gracefully): `STRIPE_SECRET_KEY`, `RESEND_API_KEY`, and explicitly scoped non-reasoning model utilities such as embeddings/demo audio when approved. `OPENAI_API_KEY` must not be required by Sentinel, Nexus, Source chat, Tower synthesis, or any production answer-generation path.

### Node.js version

The Dockerfile uses `node:24-bookworm-slim`. Use Node.js 24.x for consistency.

## Architecture and provider enforcement

These rules are executable policy, not guidance. Every agent and PR must preserve them:

- Azure/Postgres via `DATABASE_URL` is the runtime data plane. Do not point runtime code, CI checks, or operator jobs at Supabase.
- Do not add Supabase runtime imports, Supabase env requirements, Supabase host literals, or `ALLOW_LEGACY_SUPABASE_CORPUS` fallbacks.
- Do not add Pinecone or Neo4j runtime dependencies. Retrieval and graph/data-plane work must use Azure/Postgres/Azure Search unless Anand explicitly opens a migration lane.
- Production answer generation for Sentinel, Nexus, Source chat, Tower synthesis, CXO answers, and agent reasoning must use Anthropic/Claude through the audited egress path. Do not require `OPENAI_API_KEY` for production answer synthesis.
- OpenAI may appear only in explicitly scoped non-reasoning utilities (for example embeddings or demo audio) and must not be imported or required by production answer-generation paths.
- **Production is Azure Container Apps, never Vercel.** `app.abarva.ai` is served by the ACA app `ca-abarva-web-lab-eastus` (resource group `rg-abarva-controlplane-lab-eastus`). Verify any time: `dig +short app.abarva.ai` → `*.azurecontainerapps.io` / inbound IP `4.255.59.220`, never a Vercel IP. Vercel holds **no** abarva domain and serves no production traffic. If `vercel project ls` shows a `nexus` project, that is NOT the prod target — ignore it. If Vercel enters your plan, you are confused: re-check with `dig`. Tool/plugin availability does **not** authorize Vercel deploys, env changes, or production assumptions. Vercel references belong only in deprecation/shutdown runbooks. Marketing (`abarva.ai`/`www`) runs on its own ACA app `ca-abarva-marketing-eastus`.
- **A GitHub merge does NOT deploy to production.** Shipping merged `main` is a manual ACA step: (1) `az acr build -r acrabarvalab001 -t abarva/web:rc-<sha> .` from a clean `origin/main` checkout; (2) `az containerapp update -n ca-abarva-web-lab-eastus -g rg-abarva-controlplane-lab-eastus --image acrabarvalab001.azurecr.io/abarva/web:rc-<sha> --revision-suffix <s>`; (3) poll `healthState==Healthy` and the web replica `ready:true` **before** shifting traffic; (4) `az containerapp ingress traffic set -n ca-abarva-web-lab-eastus -g rg-abarva-controlplane-lab-eastus --revision-weight <rev>=100`. A green `Post-deploy crawl` after a merge only proves the OLD live page is healthy (the job crawls `https://app.abarva.ai`), NOT that your change shipped — confirm the serving revision's image SHA. The ACA app is shared/multi-revision; uncoordinated deploys can flip the traffic pointer, so re-check the serving revision after deploying. **Work from a clean `origin/main` checkout — the primary working copy may be a stale `codex/*` branch that predates current rules.**
- Run `npm run audit:architecture-rules` before opening or updating PRs that touch runtime, provider, data-plane, CI, or config files. The GitHub `Architecture Rules` workflow enforces this on PRs.

## Release control discipline

Every non-trivial change must be traceable as a controlled release candidate, not just as a PR. Before opening or updating a PR, classify the release lane, explain the layer impact, identify client applicability, record QA/validation, and describe rollout plus rollback.

### GitHub repository governance

The canonical GitHub repository is `https://github.com/abarva-platform/abarva`. The former personal-account path `anandsundaram-hash/abarva` may redirect for a while, but new branches, PRs, release evidence, and automation should target the `abarva-platform` organization repo.

`main` is protected by repository rulesets in speed mode. Do not push directly to `main`. Open a PR and use squash merge. The current speed-mode bar is intentionally PR-only for rapid agent execution: local validation is expected, but GitHub does not block merges on queued CI runners.

Merge queue and the fuller pilot-hardening check suite can be re-enabled when the team moves from build speed to customer-pilot governance.

If GitHub CLI auth behaves strangely on this machine, check for an invalid shell-level `GH_TOKEN`; prefer `env -u GH_TOKEN gh ...` so the GitHub CLI keychain credential is used.

Use these lanes consistently:

- `global-control-lane`: shared app/control-plane behavior for all clients unless feature-gated.
- `client-data-lane`: client-scoped schema, RLS, seed, ingestion, retrieval, or private data-plane changes.
- `internal-admin`: AbarVa-only operations/admin capability.
- `public-demo`: public route, demo path, investor/founder-facing artifact.
- `experimental`: feature-flagged or non-default capability.

If a PR changes release-relevant files, add or update a release record under `docs/releases/records/` using `docs/releases/templates/release-record-template.md`. The record must explain, in plain English, what changed, what layer changed, which clients are affected, what QA/validation was done, how it rolls out, how it rolls back, and what audit evidence exists. `npm run release:check` enforces this in CI; do not bypass it without explicit Anand approval.

### Deployment authority and runtime invariant

Only the repo-owned ACA main deploy workflow may shift shared Product/Lab web traffic. Feature-branch, local, or ad-hoc Azure commands must not mutate shared web traffic, revision weights, or the web Container App template. Preview/client environments need their own Container App or explicit environment lane; do not test a branch by writing to the shared runtime.

ACA web and worker runtimes must use digest-pinned images (`@sha256:...`) for runtime updates. Do not use mutable branch tags such as `lab-*`, `tower-*`, `htmlfix-*`, or `promptfix-*` as a live runtime image. Any `az containerapp update` that changes env vars, flags, scale, or secrets for a shared runtime must also pass the currently approved digest-pinned `--image`; otherwise Azure can create a new revision from a stale template image.

After any deploy or flag/env update, prove the ACA runtime invariant before claiming the change is live: the Container App template image, the 100% traffic revision image, and all required worker job images must match the approved digest. Then run the required live signed-in client proof for affected clients. A PR or release record may say `merged`, `deployed`, or `flagged`; it may not say `live-proven` until those checks are captured.

### ACA data-build job rule

Mutating operator data builds must run as Azure Container Apps Jobs, not through production web requests and not as long-running manual `az containerapp exec` sessions. Use `docs/ops/aca-data-build-job-rule.md` for the required job contract: job name, run id, tenant scope, build version, input source version, idempotency key, progress/status output, Blob proof bundle, validation output, quality-gate output, and release record. Break-glass `az containerapp exec` is allowed only for read-only inspection or a documented exception. Do not wire product surfaces to new data-plane builds until the job output, quality gate, and human review pass.

## Context & corpus governance (MANDATORY — all agents, all tenants)

Every context/corpus object (tenant facts, enterprise chunks, uploaded evidence, artifacts,
patterns, signals, metrics, vendor/system/KPI/financial records, graph edges, search chunks) MUST
conform to the canonical policy before any agent (Nexus, Sentinel, Atlas, Source, Tower, Steward,
or future agents) may use it. This binds every agent — Codex, Claude Code, Cursor, or otherwise.

- **Canonical contract:** `src/lib/governance/context-corpus-policy.ts` (`GovernedObject` + Zod +
  `evaluateGovernedObject`). Policy: `docs/governance/CONTEXT_CORPUS_POLICY.md`. Target data model:
  `docs/governance/CONTEXT_CORPUS_DATA_ARCHITECTURE.md`.
- **No raw context to models.** Agents consume only `buildValidatedAgentContextBundle`; objects that
  evaluate to `block` never reach Claude.
- **`agent_ready` is earned, not assumed.** Requires source_basis + confidence + provenance +
  Azure-native index (`fts_indexed`/`search_indexed`) + end-to-end cite-render verification.
  "Loaded" ≠ "indexed" ≠ "retrievable" ≠ "cited" — report each state separately.
- **Tenants come from code** (`CANONICAL_TENANT_KEYS`), never a hand-typed list. No tenant
  exceptions in any scanner/validator/report/test.
- **Real client names never appear** in any agent-usable object or response. Cover names are
  canonical; real identities are `restricted`, mapped at ingest, stored ops-only.
- **No Pinecone runtime; Azure-native retrieval only.** Anthropic-only governs reasoning, not
  embeddings (OpenAI `text-embedding-3-*` → Azure AI Search is allowed).
- **Enforcement is strict:** CI validators (`validate:context-corpus*`) gate every PR; the runtime
  bundle filters at query time. Any dataset that fails policy is `not_reviewed`/`blocked` until
  fixed. Temporary exceptions live in `docs/governance/policy-exceptions.json` with owner + reason
  - expiry + remediation PR — CI fails on expiry. No silent or blanket exceptions.
- **New datasets declare a manifest first.** Before loading ANY new context/corpus dataset, add a
  manifest under `docs/governance/dataset-manifests/<dataset_id>.json` (template:
  `docs/governance/DATASET_POLICY_MANIFEST_TEMPLATE.json`; process:
  `docs/governance/NEW_DATASET_ONBOARDING_POLICY.md`). `validate:context-corpus manifests` gates it.
  No load without a passing manifest — no matter which agent or operator runs it.

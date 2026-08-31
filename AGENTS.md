<!-- BEGIN:nextjs-agent-rules -->

# Start here: the data operating model

**Before touching tenant data, templates, loaders, adapters, or any product surface, read
[docs/architecture/ENTERPRISE_INFORMATION_ARCHITECTURE.md](docs/architecture/ENTERPRISE_INFORMATION_ARCHITECTURE.md).**

It is the constitution for how information moves through the product, and it wins over any other
document until amended. Four layers, and the boundaries are not negotiable:

```
1  CLIENT INTAKE      organised by WHO OWNS THE DATA, never by our schema
2  SOURCE ADAPTERS    one per intake tab; the client never sees this
3  CANONICAL MODEL    THE SOURCE OF TRUTH — every object has an ID
4  PRODUCTS           Home · Tower · Moves · Source · Intelligence · Learn · Pricing
```

**No product owns data.** Tower does not own spend, Home does not own applications, Moves does not
own programs, Source does not own vendors. Every product is a projection of layer 3.

Two rules that have cost the most when broken:

- **Identity is declared, never inferred.** Not from a directory name, not from a filename, not from
  a folder's label. Tenancy comes from `datasets/tenant-inputs/tenant-input-registry.json`.
- **Run `node scripts/tower/fact-lineage-report.mjs` before quoting Tower or tenant-intake
  headline metrics.** Default `quote` mode evaluates active tenant intake only; `--mode
  migration-audit` compares active intake against legacy standardized packs. If a Tower or
  tenant-intake figure is `ONE_SOURCE`, say so when you quote it. If it is `CONFLICT`, do not quote
  it at all.
- **For product/read-model figures outside that script's coverage, use the owning projection's
  lineage and readback proof.** Run `node scripts/source/source-substrate-lineage-report.mjs` before
  quoting Source figures such as portfolio annual value, contract count, vendor count, Contract 360
  totals, optimization opportunity amount, evidence-readiness counts, finance-confirmed value,
  Cube/consumption metrics, or Source read-model values. State the counting basis. If a Source figure
  is `ONE_SOURCE`, say so when you quote it. If it is `CONFLICT`, do not quote it at all. If it is
  `ABSENT`, treat it as unknown rather than zero. Do not present the Tower lineage report as proof
  for Source projection numbers.

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

## Production deployment lane

`app.abarva.ai` is deployed through Azure Container Apps, not Vercel. Do not use Vercel deploys, Vercel production aliases, Vercel rollback commands, or `*.vercel.app` URLs as evidence that the live product is current.

Canonical production/lab release path:

1. Build an image from the exact git SHA with `az acr build`.
2. Deploy that image to `ca-abarva-web-lab-eastus` with `az containerapp update`.
3. Wait for the new revision to become healthy.
4. Assign 100% ingress traffic to the new ACA revision.
5. Verify `https://app.abarva.ai` with live route/browser checks.

Use [docs/runbooks/azure-container-apps-deploy.md](/Users/anand/Projects/nexus/docs/runbooks/azure-container-apps-deploy.md) as the operator runbook. Vercel files in this repository are legacy sentinels or historical records only; they are not an approved deployment path for `app.abarva.ai`.

## Client data-plane boundary

Repo-baked tenant input files are a synthetic-demo shortcut only. Real client source files must live
in that client's private Blob/source landing zone, be hashed and manifested inside that private data
plane, be processed by ACA data-build jobs inside the client VNet, and land in client-scoped
Postgres/ECL before product projections read them. Do not bake real client source files into a
shared web image, commit client-derived source-intelligence digests to the public repo, or treat the
demo path as the production architecture. The controlling architecture statement is
[docs/architecture/CLIENT_DATA_PLANE_ARCHITECTURE.md](/Users/anand/Projects/nexus/docs/architecture/CLIENT_DATA_PLANE_ARCHITECTURE.md).

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

### Public-repo disclosure discipline (MANDATORY — all agents)

`https://github.com/abarva-platform/abarva` is a **public** repository. Every commit message, PR
title/body, code comment, and release record in it is visible to anyone — competitors, prospective
pilot customers doing diligence, anyone browsing the org — not just the team.

- Never write a real client's name, a real incident's narrative detail, a dispute/legal status, or
  any other real-client-confidential fact into a commit message, PR title/body, code comment, or
  release record. This applies even when referencing today's synthetic fixture tenants
  (Meridian, Apex, Lakeshore, First Capital, and any future ones) out of habit — write the habit you
  want once real client engagements exist, not the one that's harmless today only because the data
  is fake.
- If a change needs to reference an incident, defect, or process failure for context, point at an
  internal, non-public tracker or doc by ID (e.g. an internal ticket number) rather than narrating
  the specifics inline in a public artifact. If no such private tracker exists yet for a given
  incident, describe the *mechanism* of the fix (what code path was wrong, what invariant was
  missing) without describing the *narrative* (whose engagement it was, what the client-facing
  consequence was, what dispute or remediation is ongoing).
- Before dispatching a subagent (or writing anything yourself) that will produce a commit message,
  PR body, code comment, or release record, check whether the content you're asking it to produce
  would be safe if a stranger read it on a public GitHub page today. If unsure whether the repo's
  visibility might change, or whether a given tenant is truly synthetic, ask rather than assume.

## V6 graph substrate guidance

Do not choose a graph database or build graph visuals before fixing graph semantics. The canonical AbarVa graph path is Azure/Postgres first:

- `intelligence_v6.business_records` holds canonical V6 source objects.
- `intelligence_v6.relationship_edges` holds raw V6 edge ingestion.
- `intelligence_v6.relationship_types`, `intelligence_v6.graph_nodes`, `intelligence_v6.graph_edges`, and `intelligence_v6.graph_quality_reports` are the physical canonical graph substrate. They were added by migration `20260702190000_intelligence_v6_graph_physical.sql`.
- Materialized V6 graph nodes/edges must be tenant-scoped, evidence-backed, normalized through `relationship_types`, and quality-scored before use in executive UI or model prompts.
- Relationship types must come from a canonical dictionary; evidence notes, caveats, and V4/V6 transformation comments must not be stored as relationship verbs.
- Azure Cosmos DB for Apache Gremlin and Apache AGE are optional future acceleration layers, not the first fix. Use them only after canonical nodes, normalized edges, relationship type dictionary, graph quality reports, tenant fencing, and source lineage are proven.

When working on Home, Intelligence, Source, Moves, or Tower graph behavior, preserve this rule: Postgres owns the governed graph substrate; graph engines and visual libraries consume clean slices, they do not define the source of truth.

Module adoption rule: do not replace a working module path just because the physical graph tables exist. Use the V6 graph substrate in shadow/read-only mode first, compare it with the current module read path, and adopt only when answer quality, tenant safety, and latency are same-or-better. Tower numbers remain deterministic: Tower read models and metric/fact tables own values; Claude owns narrative; the graph may explain dependency context but must never calculate spend, value, ROI, or risk metrics.

### Deployment authority and runtime invariant

Only the repo-owned ACA main deploy workflow may shift shared Product/Lab web traffic. Feature-branch, local, or ad-hoc Azure commands must not mutate shared web traffic, revision weights, or the web Container App template. Preview/client environments need their own Container App or explicit environment lane; do not test a branch by writing to the shared runtime.

ACA web and worker runtimes must use digest-pinned images (`@sha256:...`) for runtime updates. Do not use mutable branch tags such as `lab-*`, `tower-*`, `htmlfix-*`, or `promptfix-*` as a live runtime image. Any `az containerapp update` that changes env vars, flags, scale, or secrets for a shared runtime must also pass the currently approved digest-pinned `--image`; otherwise Azure can create a new revision from a stale template image.

After any deploy or flag/env update, prove the ACA runtime invariant before claiming the change is live: the Container App template image, the 100% traffic revision image, and all required worker job images must match the approved digest. Then run the required live signed-in client proof for affected clients. A PR or release record may say `merged`, `deployed`, or `flagged`; it may not say `live-proven` until those checks are captured.

### ACR build and registry policy

The shared Product/Lab web image registry is `acrabarvalab001` and must remain on the Premium SKU. Every agent and workload that touches ACR, Docker builds, image retention, or ACA deployment must preserve this policy:

- Shared web images are built only by `.github/workflows/aca-main-deploy.yml`; agents must not run ad-hoc `az acr build`, local `docker push`, or branch workflows against `acrabarvalab001/abarva/web`.
- The main deploy workflow must use Docker Buildx with GitHub Actions cache (`cache-from: type=gha`, `cache-to: type=gha,mode=max`) before pushing the `main-<sha>` tag to ACR.
- The workflow must assert `acrabarvalab001` is Premium before building. If the SKU is not Premium, the deploy stops instead of silently falling back to the slower/older registry contract.
- Image pruning is dry-run first. Keep the active ACA digest, keep a rollback window, and do not use `acr purge --untagged` unless a named break-glass approval explains why digest-pinned pulls cannot be affected.
- `npm run release:check` enforces these markers and blocks unsafe ACR build/prune/cache drift.

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

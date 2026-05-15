# Backlog execution log — 2026-05-15

> Continuation of `audit-2026-05-13/UPDATE_LOG.md` + `UPDATE_LOG_2026-05-14.md`. Captures the 2026-05-15 session after Codex's overnight Azure-lab run.

## Context for this run

Codex shipped **five Azure lab PRs overnight** (#1942 ACR + budgets · #1946 Service Bus + Event Grid · #1948 AI Search · #1949 real image · #1950 Container App runtime shell). The three-lane architecture (Control / Private Data / Intelligence-Model) is now empirically established. Boundary Codex flagged: real Clerk/Supabase/model secrets not yet injected to Azure — endpoint smoke deferred until Key Vault env wiring lands.

My role this session: ship non-overlapping backlog items in parallel while Codex works on Key Vault env projection.

## PRs landed this session

| PR | Type | Headline |
|---|---|---|
| [#1951](https://github.com/anandsundaram-hash/abarva/pull/1951) | docs | **Backlog rev d** — A2b + B1 promoted to partial · in flight; Azure lab tally refreshed |
| [#1952](https://github.com/anandsundaram-hash/abarva/pull/1952) | code + docs | **A2c** `tenant:bootstrap` orchestrator + verify-render module + README; **B5b** Purview integration design |

Total: 2 PRs, 3 backlog items closed (A2c in code; B5b in design; backlog status refreshed).

## A2c — what shipped

`scripts/tenant-bootstrap.ts` + `tenant-bootstrap-verify.ts` + `README-tenant-bootstrap.md`. One-command tenant onboarding that chains the existing 6 manual steps in the correct order:

1. Validate `--tenant` arg
2. Env-var pre-flight (CLERK / SUPABASE / ANTHROPIC)
3. Clerk CXO persona provisioning → `scripts/provision-cxo-personas.ts --apply`
4. Supabase migrations → `npm run db:migrate`
5. Baseline seeds → `npm run db:seed`
6. 14-segment setup-data pack → `src/scripts/setup-data/load-<tenant>-setup-data.ts`
7. **Verify-render** — asserts all 15 coverage tiles + 6 cards return non-empty data via the broker
8. Structured report; non-zero exit on failure

Safety model: **dry-run is the default**. `--apply` must be explicit.

npm scripts wired:
```
npm run tenant:bootstrap -- --tenant <key>
npm run tenant:bootstrap:dry -- --tenant <key>
npm run tenant:refresh -- --tenant <key> --apply
```

Why this matters: audit 2026-05-13 found the seed → broker → UI pipeline is many-to-many. Loading the 14-segment folder is necessary but not sufficient. Verify-render is the load-bearing assertion — it's what makes "bootstrap" mean "the CXO will see populated tiles when they open `/intelligence#enterprise-context`" instead of "we ran some seeds and hoped."

## B5b — what's in the design

`docs/security/B5b-PURVIEW-INTEGRATION-DESIGN.md`. Full design (not implementation) for layering Microsoft Purview classification over the existing pattern-based `sensitive-upload-guard.ts`.

Key design decisions captured:
- Keep sync `evaluateSensitiveUpload` on the Tier-1 UI hot path (with background Purview re-evaluation that can retroactively quarantine)
- Add async `evaluateSensitiveUploadWithPurview` for Tier-2 (Azure landing zone) + Tier-3 (direct integration)
- 5-level taxonomy mapping table from Purview sensitivity labels (public / general / confidential / highly_confidential) to our existing 5 classifications
- Per-tenant Purview accounts in production, shared in lab, customer's own Purview tenancy for Enterprise (B4 in-VPC)
- Identity-only auth via managed identity (no API keys)
- 5-step rollout: lab → bench → dual-write → pilot → enforce, gated by an A3 feature flag (`purview_authoritative`, tenant-default-off)
- Failure-mode matrix: Purview-unreachable falls back to pattern guard in degraded mode + alert on > 30 min
- Cost ceiling: ~$50-100/mo lab, ~$300-500/mo per pilot tenant

Implementation (Bicep + async function + migration of 7 upload routes) is intentionally **not** in this PR. Codex follows with the Bicep modules.

## QA bar held

- `npx tsc --noEmit` clean on every commit
- `npx tsx scripts/tenant-bootstrap.ts --help` smoke run — prints full usage block
- Dry-run default — script cannot accidentally mutate
- Verify-render dynamic-imports the read-model so `--help` is fast

## Backlog status after this run

**Engineering:**
- A1 partial · in flight (#1945)
- A2a done (#1941); A2b partial (#1946 backbone, Codex consumer Function next); **A2c done (#1952)**
- A3 done (#1943)

**Azure / infrastructure:**
- B1 partial · in flight (AZLAB6-15 + 5 ADRs)
- B5a done (#1941); **B5b design done (#1952)**, implementation pending
- B-foundation: 7 Azure PRs landed (#1938, #1940, #1942, #1946, #1948, #1949, #1950)

**Pilot ops + GTM:**
- C1, C2, C3, C4 drafted (#1943, #1944)
- D1, D2, D3, D5, D6 drafted (#1943, #1944)
- D4 still open (founder action: Delaware C-corp formation gates D5 submission)

## What still requires Codex / a human

1. **Codex: Key Vault env-projection** + `/api/health` smoke against `ca-abarva-web-lab-eastus`
2. **Codex: A2b Function** — consumer that pulls from `q-context-ingestion-events`, runs the sensitive-upload guard, triggers broker rebuild (foundation already shipped in #1946)
3. **Codex: B5b implementation** — Bicep + async function migration (design ready in this PR)
4. **Founder: D4 C-corp formation** — gates D5 submission
5. **Founder: D5 submit** — applications are 95% drafted
6. **Founder: D3 attorney call** — memo ready
7. **Founder: D1 landing test** — 2-3 real CXO conversations to confirm language

## Pattern that's working

Codex on infrastructure (Bicep, Azure resources, deployment pipelines) + me on application logic (tenant-bootstrap, feature flags, sensitive-data guard, regression suites) + me on design docs (CAIQ, Purview design, narrative, monetization, runbooks) — running in parallel, no overlap, all merged through auto-merge after CI passes. Three PRs from each of us in 48 hours.

## Files this PR touches

- `audit-2026-05-13/UPDATE_LOG_2026-05-15.md` — this file

That's it. The actual work landed in #1951 and #1952 above.

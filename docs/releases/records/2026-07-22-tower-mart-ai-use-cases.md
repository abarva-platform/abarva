# 2026-07-22-tower-mart-ai-use-cases — Restore AI use-case candidates in the unified projection

## Release ID

`2026-07-22-tower-mart-ai-use-cases`

## Status

`candidate`

## Plain-English Summary

After the first successful governed Tower mart write, the live page proved the core CFO numbers exactly ($650.0M budget / $487.5M run / $162.5M change / $53.7M AI-tagged / $3.8M finance-validated / $0 realized) but showed a real regression against the prior pipeline: **AI Portfolio dropped to 0 items and Candidate AI Opportunities to 0** (previously 80 and 242).

Root cause was in this projection, not the infrastructure: the V3 adapter read only `08_it_budget_spend_value.csv`, `09_programs_initiatives.csv`, and `SA08`. The prior pipeline also read **`10_ai_automation_use_cases.csv`** — 251 rows for Meridian, the discovery/opportunity lens that supplies candidate AI ideas. Without it the portfolio had only the 12 funded programs, none of which carry an `ai_spend_type`, so the section rendered empty.

This PR adds `10_ai_automation_use_cases` to the adapter. Each active use case becomes its own portfolio identity, so the assembler classifies it as a `candidate_opportunity` and counts it. A candidate carries no money by definition, so the emitted fact is text/zero-valued rather than a fabricated figure — the value invariant is satisfied without inventing a number. Use cases already linked to a funded program roll up under that program instead of standing alone.

It also tightens what qualifies as a **decision lane**: a lane now requires real economics (approved funding, promised, or finance-validated value), not merely a program identity. An AI use case may reference a program code that has no funding row; those now surface as portfolio candidates rather than creating an empty, undecidable lane. This keeps the lane list short and genuinely decidable — you cannot fund/fix/freeze/stop something with no economics.

Verified against the real Meridian CSVs: core numbers unchanged and exact; candidates restored to 243; decision lanes back to 12; AI portfolio 255 rows.

## Layer Impact

- `global-control-lane`: `src/lib/cio-tower/mart-projection/{facts-from-v3,assemble-mart}.ts` — projection library. Pure functions; no runtime behavior until the projection job runs.
- `internal-admin` lane: `src/scripts/tower/project-tower-mart.ts` — CLI now reads the use-cases CSV.

## Client Applicability

- All clients: the adapter is tenant-generic (any tenant whose V3 pack has `10_ai_automation_use_cases.csv`).
- Feature flag: none.

## Changes Included

- `facts-from-v3.ts` — `factsFromV3AiUseCases()` + wired into `projectV3ToFacts`; `V3FactInput.aiUseCases`.
- `assemble-mart.ts` — decision lanes require real economics (funding/promised/validated), not a bare program identity.
- `project-tower-mart.ts` — read `10_ai_automation_use_cases.csv`.

## QA / Validation

- Pass: `jest src/lib/cio-tower/mart-projection/__tests__/` — 49/49.
- Pass: `tsc --noEmit` — zero errors in the changed files.
- Pass: end-to-end dry-run against real Meridian V3 CSVs — core numbers **unchanged and exact** ($650.0M / $487.5M / $162.5M / $53.7M / $35.5M / $3.8M / $0); candidates 0 → **243**; decision lanes **12** (restored from the transient 13); AI portfolio 0 → **255**.
- Not run here: the live governed write with this fix — next operator step after deploy.

## Rollout Plan

Merge via squash to `main`; aca-main-deploy builds the image. Then re-run the governed `project:tower-mart:meridian:write-job` ACA job so the mart carries the restored candidates/portfolio.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (existing, unmodified).
- Shared runtime mutators: none.
- ACA runtime invariant: unaffected.
- Live signed-in proof required: after the re-run write — confirm AI Portfolio and Candidate AI Opportunities are populated and core numbers still exact.

## Rollback Plan

Revert the PR. The write is idempotent (full per-tenant refresh); re-running restores the prior projection output.

## Audit Evidence

- Prior write's proof bundle showed `ai_portfolio: 12` (all `funded_program`, `ai_spend_type: null`) and `candidate_ai_opportunities: 0`.
- Dry-run after this change: candidates 243, lanes 12, portfolio 255, core numbers identical.
- PR URL: pending.

## Known Gaps

- Real `tower_*` telemetry remains un-ingested for all tenants, so usage/adoption evidence stays gap-only (correctly, not invented).
- Candidate count is 243 vs the prior pipeline's 242 — the one-row difference is a use-case-linked program with no funding row, now classified as a candidate rather than an empty decision lane. This is the more correct classification.

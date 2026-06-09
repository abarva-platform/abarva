# Context & Corpus Governance — Enforcement Tracker (2026-06-08)

Human view of `context-corpus-enforcement-tracker.json` (the machine source a CI check reads).
Update after every PR. Brief: `CONTEXT_CORPUS_GOVERNANCE_BRIEF_2026-06-08.md`.

**Resolved decisions:** RLS = phase-2 · signals plane = fast-follow · client private-data-plane =
when first client signs · compat-bridge retirement = gradual (block new `.from()` after PR-5).

| Slice | Scope                                                              | Status  | PR    |
| ----- | ------------------------------------------------------------------ | ------- | ----- |
| PR-0  | Target data architecture (design)                                  | ✅ done | #3328 |
| PR-1  | Policy doc + canonical types/Zod/enums + trackers + AGENTS.md hook | ✅ done | #3329 |
| PR-2  | Inventory scanner + aggregation + report/runbook (all tenants)     | ✅ done | #3330 |
| PR-3  | Readiness sidecar + additive migration + dry-run/backfill          | ✅ done | #3332 |
| PR-4  | CI validators + workflow + exception file (the hard gate)          | ✅ done | #3333 |
| PR-5  | Runtime `buildValidatedAgentContextBundle` + adapters + broker     | ✅ done | #3334 |
| PR-6  | Tenant coverage report (end-to-end, readiness ledger)              | ✅ done | #3335 |
| PR-7  | Visible citations — 7a Sentinel ✅ (#3322); 7b Nexus ✅ (this PR)  | ✅ done | #3322 |
| PR-8  | New-dataset onboarding gate (manifest required)                    | ✅ done | #3336 |

**Overall: 100% (9 / 9 slices done).** The AbarVa-wide Context & Corpus Governance
Framework is fully built and merged: contract (PR-1) → inventory (PR-2) →
readiness ledger (PR-3) → strict CI gate (PR-4) → runtime validated-bundle seam
(PR-5) → end-to-end coverage (PR-6) → visible citations (PR-7) → new-dataset
onboarding gate (PR-8). Remaining work is operator-run ACA jobs (apply the PR-3
migration; run inventory/backfill/coverage on the live private DB).

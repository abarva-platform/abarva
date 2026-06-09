# Context & Corpus Governance — Enforcement Tracker (2026-06-08)

Human view of `context-corpus-enforcement-tracker.json` (the machine source a CI check reads).
Update after every PR. Brief: `CONTEXT_CORPUS_GOVERNANCE_BRIEF_2026-06-08.md`.

**Resolved decisions:** RLS = phase-2 · signals plane = fast-follow · client private-data-plane =
when first client signs · compat-bridge retirement = gradual (block new `.from()` after PR-5).

| Slice | Scope                                                              | Status         | PR        |
| ----- | ------------------------------------------------------------------ | -------------- | --------- |
| PR-0  | Target data architecture (design)                                  | ✅ done        | #3328     |
| PR-1  | Policy doc + canonical types/Zod/enums + trackers + AGENTS.md hook | ✅ done        | #3329     |
| PR-2  | Inventory scanner + aggregation + report/runbook (all tenants)     | ✅ done        | #3330     |
| PR-3  | Readiness sidecar + additive migration + dry-run/backfill          | ✅ done        | #3332     |
| PR-4  | CI validators + workflow + exception file (the hard gate)          | ✅ done        | #3333     |
| PR-5  | Runtime `buildValidatedAgentContextBundle` + adapters + broker     | ✅ done        | #3334     |
| PR-6  | Tenant coverage report (end-to-end, readiness ledger)              | ✅ done        | #3335     |
| PR-7  | Visible citations — 7a Sentinel ✅ (#3322); 7b Nexus               | 🔄 in-progress | #3322     |
| PR-8  | New-dataset onboarding gate (manifest required)                    | ✅ done        | (this PR) |

**Overall: ~94% (8.5 / 9 slices: PR-0..PR-6, PR-8 done; PR-7a done).**
Next (final): PR-7b — Nexus visible citations (mirror the #3322 Sentinel fix on
the Nexus surface) closes the arc.

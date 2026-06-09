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
| PR-6  | Tenant coverage report (end-to-end, readiness ledger)              | ✅ done        | (this PR) |
| PR-7  | Visible citations — 7a Sentinel ✅ (#3322); 7b Nexus               | 🔄 in-progress | #3322     |
| PR-8  | New-dataset onboarding gate (manifest required)                    | ⏳ queued      | —         |

**Overall: ~83% (7.5 / 9 slices: PR-0..PR-6 done; PR-7a done).**
Next: PR-8 (new-dataset onboarding gate + manifest template) — then PR-7b (Nexus
visible citations) closes the arc. PR-8 makes every NEW dataset declare a policy
manifest before it can load.

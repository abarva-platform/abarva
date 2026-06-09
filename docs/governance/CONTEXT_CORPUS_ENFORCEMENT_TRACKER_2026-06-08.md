# Context & Corpus Governance — Enforcement Tracker (2026-06-08)

Human view of `context-corpus-enforcement-tracker.json` (the machine source a CI check reads).
Update after every PR. Brief: `CONTEXT_CORPUS_GOVERNANCE_BRIEF_2026-06-08.md`.

**Resolved decisions:** RLS = phase-2 · signals plane = fast-follow · client private-data-plane =
when first client signs · compat-bridge retirement = gradual (block new `.from()` after PR-5).

| Slice | Scope                                                              | Status         | PR    |
| ----- | ------------------------------------------------------------------ | -------------- | ----- |
| PR-0  | Target data architecture (design)                                  | ✅ done        | #3328 |
| PR-1  | Policy doc + canonical types/Zod/enums + trackers + AGENTS.md hook | 🔄 in-progress | —     |
| PR-2  | Inventory scanner + report (all datasets, all tenants)             | ⏳ queued      | —     |
| PR-3  | Readiness fields + additive migration + dry-run/backfill           | ⏳ queued      | —     |
| PR-4  | CI validators + workflow + exception file (the hard gate)          | ⏳ queued      | —     |
| PR-5  | Runtime `buildValidatedAgentContextBundle`                         | ⏳ queued      | —     |
| PR-6  | Tenant coverage report (end-to-end, every canonical key)           | ⏳ queued      | —     |
| PR-7  | Visible citations — 7a Sentinel ✅ (#3322); 7b Nexus               | 🔄 in-progress | #3322 |
| PR-8  | New-dataset onboarding gate (manifest required)                    | ⏳ queued      | —     |

**Overall: ~17% (1.5 / 9 slices: PR-0 done, PR-7a done, PR-1 in flight).**
Next: finish PR-1 → PR-2.

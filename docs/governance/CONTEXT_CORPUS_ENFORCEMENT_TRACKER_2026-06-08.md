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

## Known gap (2026-07-22) — "PR-5 done" ≠ every live answer route calls the gate

Discovered while grounding a new Source aVa-chat feature (`SOURCE-ANALYTICS-CHAT-001`,
`docs/backlog/source-product-backlog.md`), verified by direct grep, not assumed:

- **`src/app/api/intelligence/ask/route.ts`** — the actual live request handler behind both
  the Home "Know" agent-answer path (`buildHomeKnowAgentAnswer` →
  `composeHomeKnowAvaAnswer`, `src/lib/home/know/home-know-agent-answer.ts`) and the
  Intelligence "Analyze" agent-answer path (`buildStructuredExhibits` +
  `composeAvaAnswer`, called at lines ~598/935/1050) — **never calls
  `buildValidatedAgentContextBundle`** (`src/lib/governance/agent-context-bundle.ts`).
  Confirmed by grep: zero matches for `buildValidatedAgentContextBundle` or
  `GovernedCandidate` anywhere in this route or under `src/lib/intelligence/`.
- `composeAvaAnswer` (`src/lib/ava-answer/composeAvaAnswer.ts`) is a pure formatting
  function — it hardcodes `safety: { tenantFencePassed: true, rawIdsSuppressed: true, ... }`
  on every packet it builds, rather than deriving those flags from an actual governance
  check. The packet *asserts* it passed governance; nothing upstream in this call chain
  actually ran it through the gate.
- The only real, working invocation of `buildValidatedAgentContextBundle` for Source
  (`src/lib/source/archetypes/grounded-answer.ts`'s `buildGroundedSourceAnswer`) is
  explicitly documented by its own header comment as a **code-level proof only** — its one
  non-test caller is a scenario fixture, not a live route reachable from a browser request.
- **Net effect**: PR-5's "runtime validated-bundle seam" is real, merged, and callable — but
  as of 2026-07-22 no live, user-facing chat-answer route (Home, Intelligence, or Source)
  actually calls it. The 9/9 "done" status above is accurate for what was *built*; it should
  not be read as "every live agent answer is governance-verified today" — that's a distinct,
  still-open claim.
- **Not fixed as part of this discovery** — flagging only, per explicit user decision
  (2026-07-22): build the new Source chat-answer feature as the first surface to actually
  wire the gate into a live route, and track retrofitting Home/Intelligence's existing live
  paths as separate, deliberate follow-up work — not silently patched in the same pass as an
  unrelated new feature.

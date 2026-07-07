# 2026-07-06-source-analytics-door1-adapter — Door 1 ← merged deterministic evaluators adapter

## Release ID

`2026-07-06-source-analytics-door1-adapter`

## Status

`candidate`

## Plain-English Summary

Closes the **evaluator→Door 1 adapter** gap called out in
`2026-07-06-source-analytics-door1.md` (Known Gaps). Door 1 declares its OWN
`ValueLeverResult` (`src/lib/source/door1/types.ts`); the now-merged deterministic
evaluators declare a **sibling** `ValueLeverResult`
(`src/lib/source/facts/evaluators/types.ts`) with different field names. The two do
NOT unify by structural typing. This slice adds the small **pure adapter** the
reconciliation contract in `door1/types.ts` describes, so Door 1 can consume the
canonical merged evaluators as a drop-in producer of its own result shape instead of
its self-contained reference evaluator. Dark behind `source_analytics` (off for all).

- **`src/lib/source/door1/evaluators-adapter.ts`** — `adaptEvaluatorResult(evaluatorResult, rule, citations)`:
  a pure function mapping one `evaluators.ValueLeverResult` onto one Door 1
  `ValueLeverResult`, field by field per the documented map: `key→ruleKey`,
  `name→name`, `valueType→valueType`, `confidence→confidence`, `basis→basis`,
  `insufficientEvidence→status`, `low`/`high→low`/`high` (**nulled when insufficient**),
  `missingEvidence→missingFactKeys`, `evidenceRefs[]→citations[]` (joined via a
  `factKey → {doc,locator}` lookup passed in), `category` recovered from the archetype
  `ValueLeverRule`, and the band `unit` fixed to `usd`.
- The fact/citation lookups are **passed in, not fetched** — the adapter stays pure
  (inputs → output).

Honesty invariants preserved across the seam: an insufficient-evidence result NEVER
emits a number (`low`/`high` nulled, missing keys routed to `missingFactKeys`); a
consumed fact with no citation in the map is surfaced **honestly** (empty locator,
`doc: 'citation unavailable'`) — never fabricated.

## Layer Impact

- `experimental` (lane): the adapter is part of the `source/door1/` library, reachable
  only when `source_analytics` is on (off for all). No default behavior changes.
- `global-control-lane`: a new pure module in `source/door1/` (inert until the flag is on).
- No schema, migration, RLS, or data-plane change in this slice.

## Client Applicability

- All clients: no behavior change — the flag is off; nothing calls the adapter.
- Specific clients: none enrolled.
- Feature flag: `source_analytics` (default off).

## Changes Included

- `src/lib/source/door1/evaluators-adapter.ts` (new — the pure adapter).
- `src/lib/source/door1/index.ts` (export `adaptEvaluatorResult` + `CitationLookup`/`FactCitation` types).
- `src/lib/source/door1/__tests__/door1-evaluators-adapter.test.ts` (new — 4 tests).

## QA / Validation

- `npx jest src/lib/source/door1` → **4 suites / 15 tests pass** (11 existing + 4 new
  adapter tests: computed→'computed' with joined citations; insufficient→'insufficient_evidence'
  with NULL band + missing keys; category/unit recovered from the rule; uncited consumed
  fact surfaced honestly, not fabricated). **pass.**
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` (full project, 8 GB heap) →
  **0 errors** (exit 0). **pass.**
- `npx eslint` on the changed files → clean. **pass.**
- Not live-proven: the flag is off; nothing calls the adapter. **inert by design.**

## Rollout Plan

Merge to `main` via PR + squash. The adapter stays dark (`source_analytics` off). Wiring
`adaptEvaluatorResult` into Door 1's `diagnose.ts` (replacing the reference
`evaluateLeverRule`) plus reading the `factKey → {doc,locator}` citation map out of
`source_event_facts` is the follow-on integration step before a tenant is enabled. No
migration is introduced by this slice.

## Deployment Authority

- Repo-owned ACA main deploy per `docs/runbooks/azure-container-apps-deploy.md`.
- Shared runtime mutators: none — the adapter is a pure function, reachable only under an
  enabled flag (off for all), so no shared runtime behavior ships.
- Migration run path: none in this slice (adapter reuses the keystone `source_event_facts`
  read that Door 1 already depends on).
- Feature/env flag update path: `includeTenants` in registry or
  `ABARVA_FEATURE_SOURCE_ANALYTICS_TENANTS`.
- Live signed-in proof required: at first tenant enablement (not this slice — inert).

## Rollback Plan

Revert the PR. The adapter is a standalone pure module with no call site on `main` yet
(Door 1 still runs its reference evaluator); removing it has no runtime effect.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/4511
- CI: `release:check`, jest, tsc, eslint, architecture-rules.
- Tests assert the honesty invariants: insufficient results emit no number; uncited
  consumed facts are flagged, not fabricated.

## Known Gaps

- **Call-site wiring**: `diagnose.ts` still calls the self-contained `evaluateLeverRule`.
  Swapping it to `evaluateValueLever` (merged orchestrator) + `adaptEvaluatorResult` +
  the `source_event_facts` citation join is the next integration step.
- `unit`: the adapter fixes the Door 1 band unit to `usd` (both sibling producers emit
  USD-over-term bands). The reconciliation note's "read `unit` from the fact `FactSpec`"
  refers to input units (usd_per_year / pct / fte), not the output band unit — see the
  deviation note in the PR description.

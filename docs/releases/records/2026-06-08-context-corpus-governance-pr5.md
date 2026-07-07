# 2026-06-08-context-corpus-governance-pr5 — Validated agent context bundle

## Release ID

`2026-06-08-context-corpus-governance-pr5`

## Status

`candidate`

## Plain-English Summary

PR-5 of the Context & Corpus Governance Framework: the runtime seam. Introduces
`buildValidatedAgentContextBundle` — the single function every agent context
bundle should pass through before it reaches a model — plus adapters that map the
three historical bundle shapes (broker `EnterpriseAgentContextBundle`, Sentinel
`AskSource`) onto one `GovernedCandidate` form, and a `DecisionReasoningRequest`
envelope that wraps the validated bundle. The seam runs each candidate through the
PR-1 policy contract, fences sensitive (pii/phi/restricted) data out of agent
bundles by default, and splits candidates into `usable` (reach the model) vs
`blocked` (never do). It is wired additively into the broker: both broker builders
attach an optional `governance` field; nothing existing breaks.

## Layer Impact

**global-control-lane**: new governance runtime module + adapters, and one
additive optional field (`governance?`) on `EnterpriseAgentContextBundle`
populated by the broker. Pure/DB-free seam; no schema, no migration, no data
change. Existing consumers ignore the new field.

## Client Applicability

- All clients: the seam applies uniformly; sensitive data is fenced for every
  tenant by default; `client_key` is validated against canonical keys (real
  client names are blocked).
- Runtime: the broker now computes a governance verdict per bundle; no behavior
  change for consumers that don't read it yet.
- Feature flag: none.

## Changes Included

- `src/lib/governance/agent-context-bundle.ts` — `GovernedCandidate`,
  `buildValidatedAgentContextBundle` (with sensitive-fence + `allowSensitive`),
  `DecisionReasoningRequest` + `buildDecisionReasoningRequest`.
- `src/lib/governance/context-bundle-adapters.ts` — `fromEnterpriseBundle` /
  `fromEnterpriseItem` / `fromAskSource`.
- `src/lib/governance/__tests__/agent-context-bundle.test.ts` — 10 tests.
- `src/lib/knowledge/agent-context-broker.ts` — additive `governance?` field +
  `withGovernance` wiring in both builders.
- `docs/governance/CONTEXT_CORPUS_VALIDATED_BUNDLE_2026-06-08.md`. Trackers updated.

## QA / Validation

- `jest src/lib/governance` — **42/42 passed** (incl. the 10 new seam/adapter tests).
- `jest agent-context-broker` — 22/23; the 1 failure
  ("is not imported by app routes yet") is **pre-existing on main** (a stale
  guard — the broker is now intentionally wired into the chat route) and is
  unrelated to this PR (flagged separately).
- `tsc --noEmit` — **passed** (0 errors repo-wide).
- `eslint` (changed files) — **passed**.
- `npm run validate:context-corpus` — **passed** (PR-4 gate still green).

## Rollout Plan

Merge to `main`. The broker attaches the governance verdict immediately; consumers
adopt `governance.usable` incrementally. Follow-on: migrate the Sentinel/Nexus
runtime paths onto the seam, then tighten the PR-4 `agent-readiness` check to
require this call site.

## Rollback Plan

Revert this PR. The only runtime touch is one additive optional field on the
broker bundle; removing it restores the prior shape exactly. No migration, no data.

## Audit Evidence

- PR URL + CI run. Seam doc + tests. Brief + PR-0..PR-4.

## Known Gaps

`retrievability` / `cited_render_verified_at` for broker items default to the
conservative floor until populated from the PR-3 readiness ledger, so
`agentReadyCount` is 0 for fixture-sourced bundles by design (no auto-promotion).
The Sentinel/Nexus call sites are not yet migrated onto the seam (follow-on).

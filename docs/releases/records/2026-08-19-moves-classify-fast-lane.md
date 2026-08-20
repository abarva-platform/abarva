# 2026-08-19-moves-classify-fast-lane — Classify complexity tier + P1→P5 fast lane

## Release ID

`2026-08-19-moves-classify-fast-lane`

## Status

`candidate`

## Plain-English Summary

Two related additions to Moves. First, the P0 intake fields shipped in the prior
release (2026-08-19-moves-extended-p0-intake-fields) gain one more optional tag:
a Complexity Tier (Straightforward, Substantial, or Complex), set by a named
owner, not auto-derived. Second, and separately gated, a Move tagged
Straightforward can now advance directly from P1 Charter to P5 Mobilize &
Handoff — skipping the Discover, Design, and Business Case phases — via a single
decision gate, rather than working through every phase like every other Move.
Both are off by default for every tenant and only reachable today for
`meridian-health`.

## Layer Impact

Release lane: `client-data-lane` (tenant-scoped Moves capability, two
independent feature flags, no global schema or shared-behavior change).

- **Layer 4 (Products) — Moves.** The P0 tier field is a UI-only addition to the
  existing Segment group. The fast-lane capability changes what phase
  transitions are reachable, but only under an explicit, narrow condition.
- **Layer 3 (Canonical Model) — narrow, additive change.** `governance.ts`'s
  `findGateRule` gains an optional third parameter (`{ fastLaneEligible }`);
  omitted or false, its behavior for every `(fromPhase, toPhase)` pair —
  including `(1, 5)` itself — is unchanged from before this feature existed.
  `evaluateGate` only computes `fastLaneEligible` for the exact `(1, 5)` pair,
  and only after an early `getProgramById` fetch used solely to check the
  Move's tier and the tenant's flag. No schema migration — the tier is stored
  in the same `engagements.charter` JSONB key as the other extended-intake
  fields (`p0_extended_intake_fields_v1`).

## Client Applicability

- All clients: no change (both flags default off).
- Specific clients: `meridian-health` (enrolled in both
  `moves_extended_intake_fields_v1` and the new
  `moves_classify_fast_lane_v1`).
- Internal only: no.
- Public/demo only: no.
- Feature flags: `moves_extended_intake_fields_v1` (existing, now also carries
  the tier field), `moves_classify_fast_lane_v1` (new, tenant policy, default
  off).

## Changes Included

- PR: https://github.com/abarva-platform/abarva/pull/6528
- Commit: `feat(moves): classify complexity tier + P1->P5 fast lane`
- Files: `src/lib/programs/governance.ts`,
  `src/lib/programs/p0-extended-intake-fields.ts`, `src/lib/features/registry.ts`,
  `src/components/strategic-moves/StrategicMoveOriginateClient.tsx`, plus
  updated tests in `governance-gates.test.ts`, `governance-evaluate-gates.test.ts`,
  `p0-extended-intake-fields.test.ts`, and `StrategicMoveOriginateClient.test.tsx`.
- Builds on the prior release: `2026-08-19-moves-extended-p0-intake-fields`
  (PR #6526).

## QA / Validation

- `npx tsc -p tsconfig.json --noEmit` — 0 errors, full project.
- `npx eslint` on every touched file — 0 errors, 0 warnings.
- 76/76 tests passing in the directly-touched area, including new coverage:
  - `findGateRule` pure-function tests confirming the fast-lane rule is
    reachable ONLY for the exact `(1, 5)` pair with `fastLaneEligible: true`,
    and that every other pair (including `(1,5)` itself without that opt-in)
    is byte-identical to before this feature.
  - `evaluateGate` tests covering: tier unset, tier set but tenant not
    enrolled, tenant enrolled but tier not Straightforward, both conditions
    met (passes), the normal P1→P2 path remains available and unaffected for
    an eligible Move, and no other `(fromPhase, toPhase)` pair is affected.
  - `resolveMoveTier` pure-function tests, including malformed/unrecognized
    tier values defaulting safely to `null`.
  - P0 component tests: the Segment group now renders 7 fields (17 total
    steps), and the submit payload includes `tier` correctly with the flag on
    vs. off.
- Broader regression sweep: `src/lib/programs/__tests__/`,
  `src/lib/agent/tools/program/`, `src/app/api/v1/programs/` — 685/687 passing.
  The 2 failures (`clientname-tenant-resolution.test.ts`,
  `current-state-doc-ingest.test.ts`) are pre-existing and unrelated —
  confirmed identical with this branch's changes stashed out before this work
  began.
- Live signed-in browser click-through was not captured — same pre-existing
  local infra gap recorded in the prior release record (no local network route
  to the private Azure Postgres VNet). Recorded as a known gap, not silently
  skipped.

## Rollout Plan

Merge to `main`. `.github/workflows/aca-main-deploy.yml` builds and deploys the
shared Product/Lab web image automatically on merge — no ad-hoc Azure commands
run by this change. Both flags are off by default, so the deploy itself
carries no behavior change for any tenant beyond `meridian-health`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (existing,
  unmodified).
- Shared runtime mutators: none — no `az` CLI commands, no Container App
  template changes, no environment variable changes in this PR.
- Approved image digest: n/a — standard deploy workflow builds and pins as
  usual.
- ACA runtime invariant: unaffected.
- Worker image invariant: unaffected — no worker code touched.
- Feature/env flag update path: `src/lib/features/registry.ts` (in-repo, code
  reviewed via this PR) — Meridian enrolled via `includeTenants` directly in
  code, matching the precedent from the prior release.
- Live signed-in proof required: yes, deferred — see Known Gaps.

## Rollback Plan

Revert this PR (single squash commit) and merge to `main`; the next
`aca-main-deploy` run redeploys the prior image. No migration to reverse — the
tier field is an additional key inside the existing extended-intake JSONB
bundle, ignored by all existing readers. No tenant needs to be un-enrolled
since only `meridian-health` was ever enrolled in either flag.

## Audit Evidence

- PR: https://github.com/abarva-platform/abarva/pull/6528
- Local typecheck/lint/test output captured in this session's transcript.
- `git log` on `feat/moves-p1-classify-fast-lane` for the exact commit.

## Known Gaps

- **Live signed-in browser proof is not yet captured**, for the same reason
  recorded in the prior release. Should be captured on the next pass against a
  reachable environment.
- **The tier is a human-entered tag, not an auto-derived score.** PHS's source
  model derives Simple/Medium/Complex from signals (data-source count, new-PHI
  path or not, output type) that Moves does not yet capture. Modeling tier as
  an explicit named-owner classification is an honest choice given the missing
  signals, not a shortcut — but a future increment could tighten this once
  those signals exist.
- **The fast-lane's own gate check (`fast_lane_decision_recorded`) is
  intentionally minimal** — it re-confirms the tier tag, relying on the P0→P1
  gate (already passed to reach `fromPhase===1`) for the "real sponsor, real
  decision" guarantee. If a future audit wants a stronger, independently
  recorded decision artifact for the fast lane specifically (beyond the tier
  tag itself), that is a deliberate scope boundary of this increment, not an
  oversight.

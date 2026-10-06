# 2026-10-02-depth-aware-architecture-floor — Depth-aware architecture floor

## Release ID

`2026-10-02-depth-aware-architecture-floor`

## Status

`candidate`

## Plain-English Summary

The target-state-architecture deliverable required the same minimum length for
every engagement — 9,000 words and 10 slides — no matter how much scope the
engagement had actually confirmed. That minimum was set for a full, enterprise-
wide design. A smaller, narrower piece of work was held to the same length, and
the only way an author reaches that length when there is little confirmed
material is to pad with content that is not grounded in evidence — which is the
opposite of what the product's governance is for.

This change makes the minimum scale with confirmed scope. A full-scope piece of
work still has to meet the full 9,000-word / 10-slide bar. A smaller one gets a
smaller — but still substantial — minimum, derived from how much confirmed
material actually backs it. The minimum only ever scales down, never up, and
never below half the full bar, so nothing becomes trivially thin.

## Layer Impact

Release lane: `global-control-lane` — shared Moves deliverable-authoring
behavior for all clients, not feature-gated (scoped in code to one deliverable
type).

- `PRODUCTS` (Moves): the architecture deliverable's length floor is now a
  function of confirmed scope rather than a single fixed number. No change to
  what evidence is used, how figures are traced, or any other quality rule.

No change to the canonical model, source adapters, or client intake.

## Client Applicability

- All clients: yes — applies to every Move that generates a target-state
  architecture deliverable.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none; the behavior is on by default. It is scoped by an explicit
  deliverable allowlist (`target_state_architecture` only) in code.

## Changes Included

- `src/lib/deliverables/shared/depth-aware-floor.ts` (new): pure deterministic
  floor-derivation function + the depth-scaled-deliverable allowlist.
- `src/lib/deliverables/orchestrator/types.ts`: optional `QualityBar.slideFloor`.
- `src/lib/deliverables/orchestrator/build-request.ts` and
  `src/lib/programs/deliverables/orchestrated/build-request.ts`: apply the
  derived floor to `minBodyWords` and `slideFloor`.
- `src/lib/deliverables/slide-contract.ts`: `judgeSlideCount` honors an optional
  (lower-only) floor override.
- `src/lib/deliverables/orchestrator/prompt-builder.ts`: the deck-length
  instruction states the derived floor to the generator.
- `src/lib/deliverables/orchestrator/quality-validator.ts`: the slide gate reads
  the override.
- Tests: new `depth-aware-floor.test.ts`; updated `slide-contract`,
  `quality-bar-wiring` suites.

## QA / Validation

- `npx jest src/lib/deliverables src/lib/programs/deliverables` — 113 suites /
  1,344 tests pass.
- New unit tests cover the scaling rule, monotonicity in confirmed scope, the
  lower clamp (never below half, never above base), slide-floor lower-only
  behavior, and that non-scaled types and the rest of the architecture contract
  do not drift from the registry.
- Scoped `tsc` over the changed files: no type errors.
- `eslint` over the changed files: clean.
- `npm run release:check --base origin/main --head HEAD`: all other gates pass.

## Rollout Plan

Merge to main via squash. No runtime rollout step of its own: it takes effect in
the normal web image the repo-owned ACA main deploy workflow builds and deploys
from the merge SHA. No migration, no flag, no env change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (on merge
  to main).
- Shared runtime mutators: none introduced.
- Approved image digest: the digest the main deploy workflow produces for the
  merge SHA.
- ACA runtime invariant: unchanged; this PR adds no env/flag/scale/secret change.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, for the architecture deliverable on an
  affected Move, after the normal deploy — a small-scope Move no longer forced
  to the full floor, a full-scope Move still held to it.

## Rollback Plan

Revert the PR and redeploy from the reverted SHA through the main deploy
workflow. No migration or data change to unwind; the floor derivation is pure
and request-time only.

## Audit Evidence

- PR URL: (added on open).
- CI run on the PR.
- Local test + lint + scoped typecheck output above.

## Known Gaps

- The allowlist contains only `target_state_architecture` today. `roadmap`
  (5,000-word floor) is a candidate but stays on its fixed floor until it is
  shown to force padding on a real small-scope Move.
- The evidence-volume band boundaries are a reasoned starting point calibrated
  against synthetic-Move evidence counts, not a measured curve; revisit once
  real-engagement counts exist.

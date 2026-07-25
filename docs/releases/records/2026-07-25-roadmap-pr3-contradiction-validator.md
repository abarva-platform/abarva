# 2026-07-25-roadmap-pr3-contradiction-validator — PR3: blocking governance-contradiction validator

## Release ID

`2026-07-25-roadmap-pr3-contradiction-validator`

## Status

`candidate`

## Plain-English Summary

PR3 of the roadmap governed-artifact-synchronization series. Adds a **blocking** validator that
compares a generated artifact's client-facing governance assertions against the authoritative server
state and fails generation on any contradiction — so a stale or self-contradictory governed artifact
can never ship.

Rules (each unit-tested):

- **stale_charter_signoff_claim** — the artifact says charter signoff is still required/outstanding,
  but the charter is signed off.
- **stale_architecture_claim** — the artifact says architecture is not captured/approved, but an
  accepted architecture is present.
- **false_finality_claim** — a review draft asserts it is final / board-approved.
- **prohibited_generation_contradiction** — the artifact says "no generation until the gate is
  approved" while itself being a generated artifact.
- **internal_identifier_leak** — a raw internal actor UUID appears in client-facing text (structural
  element ids and URLs are not flagged).

A violation is folded into the quality-bar result (`pass: false` with the contradiction reason), so
existing callers treat it as a hard quality block without a new status.

## Layer Impact

- **global-control-lane**: shared Move artifact generation quality gate, every tenant.

## Client Applicability

- All clients: yes — every generated Move artifact is now blocked if it contradicts authoritative
  governance state.

## Changes Included

- `src/lib/deliverables/governance-contradiction-validator.ts` — new pure
  `validateGovernanceConsistency(html, state)` + `AuthoritativeGovernanceState` + `GovernanceViolation`.
- `src/lib/deliverables/generate-artifact.ts` — derives the authoritative state from context
  (`decisions` → charter/gate closure, `ctx.architecture` → architecture accepted, generation mode +
  gate → finality) and blocks both generated-return paths on any contradiction.
- Tests: `governance-contradiction-validator.test.ts` — every rule fires on a real contradiction and
  is silent when the claim is genuinely true (charter-not-signed-off, architecture-not-accepted,
  actually-final), structural UUID not flagged, multiple violations aggregated.

## QA / Validation

- `npx jest` (validator + generate-artifact) — 21/21 pass.
- `npx eslint` — clean.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` — pass.
- Live signed-in proof — covered by PR7 (a deliberately contradictory generation is blocked).

## Rollout Plan

Squash-merge to `main`; repo-owned `aca-main-deploy.yml` deploys. No flag, no migration.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- ACA runtime invariant: to be verified after deploy.
- Live signed-in proof required: covered by the PR7 cross-format proof.

## Rollback Plan

Revert the merge commit. No schema/data changes.

## Audit Evidence

- PR: to be opened. PR3 of the series (PR1 context sync #5613, PR2 lifecycle #5615).
- Prior context: #5613, #5615, #5610, #5608, #5596/#5599.

## Known Gaps

The roadmap pilot stays OPEN. This validator runs on the generate-artifact (legacy golden-bar) path;
the orchestrator path shares the same generate-artifact entry for single-artifact generation. Wiring
into any orchestrator-only render path and into the PPTX/DOCX renderers happens as those land (PR5/6).
Remaining: PR4 shared renderer-neutral roadmap presentation contract (version + content hash); PR5
editable PPTX; PR6 editable DOCX + synchronized HTML; PR7 cross-format + application-level proof.
Closure language stays: **story-first renderer proven; governed-artifact synchronization, executive
packaging and editable PPTX delivery remain open.**

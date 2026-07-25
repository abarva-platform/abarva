# 2026-07-25-roadmap-governance-artifact-sync — governed-artifact state accuracy (fast-follow GOV-1/2/4)

## Release ID

`2026-07-25-roadmap-governance-artifact-sync`

## Status

`candidate`

## Plain-English Summary

The REF_EXECUTIVE_ROADMAP live proof (PR #5608) proved the story-first renderer but exposed a
**governance-state accuracy failure**: the generated roadmap's draft banner and "client input before
final" content asserted stale/false governance facts (charter signoff still required, phase gate not
approved, architecture not captured) on a Move whose charter, P1/P2/P3 gates and architecture were
all signed off, plus a raw internal actor UUID and a self-contradictory "no generation until the gate
is approved" statement on an artifact that had just been generated.

This release lands the contained, source-level fixes (fast-follow items GOV-1 partial, GOV-2, GOV-4):

1. **Draft banner no longer prints hardcoded false claims.** `generate-artifact.ts`'s
   `formatDraftCaveatText()` previously prepended four static strings ("sponsor assignment / charter
   signoff / phase gate approval is still required", plus a baseline-ratification line) to every
   draft, regardless of real state. Those are removed; the banner is now built purely from the
   state-derived caveats (`assertPhaseReadyForGeneration`'s `draftCaveats` + the real context
   readiness gaps). With no genuine open items, it prints only the intro.
2. **Draft intro is accurate.** `STRATEGIC_MOVES_DRAFT_CAVEAT` no longer asserts specific upstream
   items as outstanding; it states only what a draft always is — a pre-exit-gate review draft, not
   final until this phase's exit gate is approved.
3. **No self-contradiction (GOV-2).** `assert-phase-ready.ts` now uses two distinct reason strings:
   the hard-block path keeps "no generation until the gate is approved" (correct when generation is
   actually blocked); the caveat carried into an intentionally-generated draft instead says "exit
   approval is still pending — this is a pre-exit review draft," which no longer contradicts the
   draft's own existence.
4. **No internal UUID in client output (GOV-4).** `solution-options/approve/route.ts` stops writing
   the raw `ctx.userId` into client-facing decision text / `humanApprovalNotes` (it now references
   the approver by role with the decision id as an audit back-reference; the raw id stays only in the
   ops-facing `decisionLineage`). A defensive, label-anchored UUID redaction was added to
   `sanitizeClientFacingArtifactHtml` — it removes a UUID that follows an approver/actor/user label in
   visible text while deliberately never touching element ids, `data-*` attributes, or URL path
   segments (which also contain UUIDs).

## Layer Impact

- **global-control-lane**: shared Move deliverable generation + client-facing sanitize, both
  generation pipelines, every tenant.

## Client Applicability

- All clients: yes — every Move artifact generated after this deploys gets accurate, state-derived
  draft governance language and the UUID redaction guard.

## Changes Included

- `src/lib/deliverables/generate-artifact.ts` — `formatDraftCaveatText()` rewritten to build only
  from real state; exported for direct unit testing.
- `src/lib/deliverables/strategic-moves-artifact-standard.ts` — accurate `STRATEGIC_MOVES_DRAFT_CAVEAT`
  intro (no false upstream claims).
- `src/lib/programs/assert-phase-ready.ts` — separate `gateBlocker` (hard-block wording) vs
  `gateDraftCaveat` (accurate exit-pending wording); draft paths carry the latter.
- `src/app/api/v1/programs/[programId]/solution-options/approve/route.ts` — client-safe decision +
  role-based approval note; raw user id confined to audit lineage.
- `src/lib/deliverables/client-facing-artifact-sanitize.ts` — label-anchored internal-UUID redaction.
- Tests: `assert-phase-ready.test.ts` (non-contradictory draft wording, hard-block wording),
  `generate-artifact.test.ts` (new `formatDraftCaveatText` suite — no hardcoded claims, intro-only
  when nothing open), `client-facing-artifact-sanitize.test.ts` (labeled UUID redacted; element
  ids/URLs untouched).

## QA / Validation

- `npx jest` on the 3 affected suites — 24/24 pass.
- `npx eslint` on all changed files — clean.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` — pass.
- Live signed-in proof — not yet; GOV-5 (regenerate the same Move and verify accurate governance
  state) is the explicit verification step and remains open.

## Rollout Plan

Squash-merge to `main`; repo-owned `aca-main-deploy.yml` deploys. No flag, no migration.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- ACA runtime invariant: to be verified after deploy.
- Live signed-in proof required: yes — GOV-5 (regenerate roadmap on Move
  `3fc8e69f-ec3c-4f41-9311-2cf997d3e7f6`, confirm the banner reflects charter signed off / P1-P3
  closed / architecture approved, no UUID, no contradiction).

## Rollback Plan

Revert the merge commit. No schema/data changes.

## Audit Evidence

- PR: to be opened.
- Prior context: PRs #5596/#5599 (roadmap story-first pilot), #5608 (live proof that surfaced this).

## Known Gaps

The pilot stays OPEN — this does NOT close the roadmap pilot. Remaining fast-follow before closure:

- **GOV-1 (deeper half): stale context readiness.** "architecture is not captured or approved" comes
  from `contextReadyForPhase(ctx, 4)` finding `ctx.architecture` empty even though the P3 Target-State
  Architecture was signed off — the approved P3 architecture is not being folded into `ctx.architecture`
  for P4 (`loadPriorDigests` population gap). This release removes the hardcoded false claims but not
  this readiness-derived one; it needs its own correct fix so readiness is accurate.
- **GOV-2 (full): four-state gate model.** One `Phase N gate approved` flag still conflates P4 entry /
  generation eligibility / review status / P4 exit-final. This release fixes the contradictory
  _language_; a proper state model is still owed.
- **GOV-3: contradiction validator.** A validator that BLOCKS any generated artifact whose governance
  statements contradict actual signed-off/gate state is not yet built.
- **GOV-5: regenerate + verify** on the same Move.
- **GOV-6: executive density.** The ~4,600-word / 13-section roadmap fails the sub-1-minute executive
  read; split the executive story (primary 2-4pp) from the detailed appendix/workbook, or enforce a
  tighter executive ceiling.

Correct label for the pilot remains: **story-first renderer PROVEN; governed-artifact synchronization
still OPEN.**

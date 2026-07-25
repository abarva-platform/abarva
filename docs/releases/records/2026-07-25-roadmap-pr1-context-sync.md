# 2026-07-25-roadmap-pr1-context-sync — PR1: authoritative P4 context synchronization

## Release ID

`2026-07-25-roadmap-pr1-context-sync`

## Status

`candidate`

## Plain-English Summary

First PR of the roadmap governed-artifact-synchronization series. The live proof showed a P4 roadmap
asserting "architecture is not captured or approved" even though the P3 Target-State Architecture had
been signed off — because the accepted P3 architecture was not reliably folded into the P4
`SolutionContext.architecture`, so the readiness check reported it missing.

This PR fixes that **by deriving architecture readiness from the accepted, authoritative P3
architecture deliverable — not by suppressing the warning** — and makes the exclusion rules explicit
and unit-tested.

- New pure module `prior-deliverable-precedence.ts`: `resolveAuthoritativeArchitecture(priors, scope)`
  returns the architecture ONLY from an **accepted** (`signed_off`), **same-Move**, **same-tenant**
  P3 architecture deliverable (`target_state_architecture` / `solution_design`) that actually carries
  architecture content, with a lineage reference. Candidate, draft, rejected, superseded, cross-Move
  and cross-tenant material is excluded. It also declares the authoritative **context precedence**:
  accepted structured evidence > accepted prior deliverable > current-phase capture >
  candidate/unreviewed (non-authoritative).
- `assemble-solution-context.ts`: new optional source `loadPriorDeliverables`; when present and
  `ctx.architecture` is not already set, the resolver populates it from the accepted P3 architecture
  and records a lineage note (`humanApprovalNotes`). No fabrication, no suppression.
- `moves-generate-deps.ts`: implements `loadPriorDeliverables` — queries the architecture-bearing
  deliverables for the Move with their real `status` + `signed_off_version`, maps status to the
  acceptance model (`accepted` only when signed off at the signed-off version), scopes to this Move
  (`engagement_id`) and tenant, and derives an architecture summary from structured data or content.

Everything is scoped to this Move + tenant at the query level; the pure resolver re-checks scope as
defense in depth.

## Layer Impact

- **global-control-lane**: shared Move context assembly, both generation pipelines, every tenant.

## Client Applicability

- All clients: yes — every P4 generation after this reflects an accepted P3 architecture as present
  (with lineage) instead of falsely reporting it uncaptured.

## Changes Included

- `src/lib/programs/prior-deliverable-precedence.ts` — new pure resolver + precedence + acceptance
  model + architecture type keys + lineage note.
- `src/lib/programs/assemble-solution-context.ts` — optional `loadPriorDeliverables` source + step 1b
  authoritative-architecture resolution.
- `src/lib/deliverables/moves-generate-deps.ts` — real `loadPriorDeliverables` implementation +
  `acceptanceFromStatus` / `architectureSummaryFrom` helpers.
- Tests: `prior-deliverable-precedence.test.ts` — accepted satisfies; unreviewed/candidate/rejected/
  superseded/cross-Move/cross-tenant excluded; content-less accepted rejected; accepted preferred
  over draft; lineage note carries the audit ref.

## QA / Validation

- `npx jest` (precedence + assemble-solution-context + generate-artifact) — 29/29 pass.
- `npx eslint` on changed files — clean.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` — pass.
- Live signed-in proof — deferred: regenerate the same Meridian Move and confirm the
  "architecture not captured" caveat disappears **for the right reason** (accepted P3 architecture
  now present with lineage), per the PR1 acceptance step. Tracked, not yet run.

## Rollout Plan

Squash-merge to `main`; repo-owned `aca-main-deploy.yml` deploys. No flag, no migration.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- ACA runtime invariant: to be verified after deploy.
- Live signed-in proof required: yes — Meridian Move `3fc8e69f-ec3c-4f41-9311-2cf997d3e7f6`
  regeneration verifying the architecture caveat is gone for the right reason.

## Rollback Plan

Revert the merge commit. No schema/data changes (read-only query addition).

## Audit Evidence

- PR: to be opened. First of the roadmap governed-artifact-sync series (PR2 lifecycle model, PR3
  contradiction validator, PR4 shared presentation contract, PR5 PPTX, PR6 DOCX+HTML, PR7 proof).
- Prior context: PR #5610 (banner/UUID/language fixes), #5608 (live proof), #5596/#5599 (pilot).

## Known Gaps

The roadmap pilot stays OPEN. This PR is PR1 of 7; it fixes architecture-readiness derivation +
precedence + exclusions only. Remaining: PR2 unified lifecycle state model (entry_approved /
generation_eligible / review_draft / exit_approved_final consumed by all routes+renderers); PR3
blocking contradiction validator; PR4 shared renderer-neutral roadmap presentation contract with
version + content hash; PR5 editable executive PPTX (pptxgenjs); PR6 editable detailed DOCX +
synchronized HTML; PR7 cross-format + application-level proof (structural validation + LibreOffice
headless round trip + Microsoft PowerPoint acceptance). Closure language stays: **story-first
renderer proven; governed-artifact synchronization, executive packaging and editable PPTX delivery
remain open.**

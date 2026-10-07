# 2026-10-06-moves-reviewed-evidence-cabinet — Approved evidence stays visible in the Files & Evidence cabinet

## Release ID

`2026-10-06-moves-reviewed-evidence-cabinet`

## Status

`candidate`

## Plain-English Summary

After a reviewer approved a Move's discovery evidence in the signed-in Files &
Evidence cabinet, the approved items disappeared from view: the pending-review
queue emptied (correct), but nothing replaced it, so the cabinet showed no
record of what had been accepted. The only remaining signal was an internal
approved-evidence count used for freshness — never rendered. A reviewer or
auditor could not see, after the fact, which evidence the phase generator was
actually allowed to use.

This adds a read-only **Reviewed evidence** section to the cabinet. The
artifacts read now returns a light list of human-approved program evidence
(title, evidence family, target phase, approval date) alongside the existing
pending-review queue, and the panel renders it as an audit trail beneath the
pending section. It is deliberately read-only — it is a record of what a
reviewer accepted, not a second editing surface, so it cannot be used to change
or re-decide an evidence item.

The new read uses the same per-tenant alias matching as the pending-review
loader, so approved rows written under either tenant representation surface.

## Layer Impact

Release lane: `global-control-lane` — shared cabinet read + UI behavior for all
workspaces. No schema change; the new read is a filtered projection
(`decision = approved`) of an existing table.

- `3 CANONICAL MODEL` / program evidence: a new approved-evidence projection
  read, scoped per-tenant and per-Move.
- `4 PRODUCTS` / Moves: the Files & Evidence cabinet gains a read-only reviewed
  section.

## Client Applicability

- All workspaces: additive. Workspaces with no approved program evidence see no
  new section (empty list renders nothing).
- Internal only: No.
- Public/demo only: No.
- Feature flag: none — additive and read-only.

## Changes Included

- `src/app/api/v1/programs/[programId]/artifacts/route.ts` — new
  `loadReviewedEvidence(ctx, programId)` loader (reviews with
  `decision = approved`, joined to evidence items, per-tenant alias match),
  returned as `reviewedEvidence` in the GET response.
- `src/components/strategic-moves/FileCabinetPanel.tsx` — new read-only
  "Reviewed evidence" section populated from `reviewedEvidence`.

## QA / Validation

- `jest` (artifacts route) — **PASS**: 16/16.
- `tsc --noEmit` — **PASS**: 0 errors.
- `eslint` (changed files) — **PASS**: 0 errors.
- Behavior check — the loader filters `decision = approved` and mirrors the
  pending loader's per-tenant alias set, so it cannot widen to another tenant;
  the UI section renders only when the list is non-empty.
- Live signed-in re-check — **NOT RUN here**; to be confirmed by the Move smoke
  re-check once approved evidence exists for a Move.

## Rollout Plan

Merge to `main` via squash PR. Ships with the next web image via the repo-owned
`aca-main-deploy` workflow. No flag; the section appears wherever approved
program evidence exists.

## Rollback Plan

Revert the PR. The cabinet returns to showing only the pending-review queue. No
data or migration impact.

## Deployment Authority

No ad-hoc Azure action. Ships only via the repo-owned `aca-main-deploy` workflow
on merge to `main`; shifts no shared traffic and touches no Container App
template, revision weight, or secret. The change performs no writes.

## Known Gaps

- The read is DB-dependent and not unit-tested against a live row set here;
  covered by the live smoke re-check.
- Two further program-evidence reads (`approved-move-evidence-snapshot`,
  `approved-inputs-pack-store`) feed deliverable-generation context and remain a
  separate normalization fast-follow.

## Audit Evidence

- CI: `jest`, `tsc`, `eslint`, `npm run release:check`.

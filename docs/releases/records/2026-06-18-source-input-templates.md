# 2026-06-18-source-input-templates — Downloadable input templates on the simple Source front

## Release ID

`2026-06-18-source-input-templates`

## Status

`candidate`

## Plain-English Summary

Most enterprise users have the data a sourcing step asks for (an incumbent
contract, a ticket-volume export, a vendor pricing sheet) but no idea what shape
to hand it over in — so they stall. Each required-input row on the simple Source
front now has a **Template** download: a blank, pre-shaped Excel workbook with a
Cover sheet (what we need, why, where it usually lives) and an Intake sheet with
the right columns already laid out. The user fills it in and uploads it on the
same step; it attaches to that exact item automatically, because the template's
filename carries the same matching token the upload reconciler already uses. No
new screen, no new step.

## Layer Impact

- `global-control-lane`: shared Source canvas behavior. New read-only download
  route (`/api/v1/source/:eventId/evidence/:requirementId/template`), a new
  server-only XLSX generator (`lib/source/exports/input-template.ts`), one
  exported helper on the existing upload matcher, and a "Template" link on each
  required-input row in `SimpleStageFront`. No schema, no migration, no data
  change. The download is gated by the same Source contributor rights the upload
  path requires.

## Client Applicability

- All clients: yes — wherever the simple Source front renders. It is additive
  (a new link); it changes no existing behavior.
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none for the template link itself; the simple front it lives on
  is gated by `source_simple_front`.

## Changes Included

- Branch `feat/source-input-templates`.
- `src/lib/source/exports/input-template.ts` — blank-template XLSX generator +
  reconcile-safe filename builder.
- `src/lib/source/canvas-substrate/upload-sync.ts` — export
  `templateFilenameTokenForRequirement` (single source of truth with the matcher).
- `src/app/api/v1/source/[eventId]/evidence/[requirementId]/template/route.ts` —
  GET download route (tenancy + event-within-client + contributor-rights gated).
- `src/components/source/canvas/SimpleStageFront.tsx` — "Template" link per row.
- Tests: `input-template.test.ts` (round-trip reconcile across all requirements,
  workbook structure, structured-vs-narrative columns).

## QA / Validation

- `npx jest input-template.test.ts upload-sync.test.ts` → all pass. The
  round-trip test caught and fixed a real silent-misattach collision (stage word
  / literal "template" overlapping sibling keywords) before merge.
- `npx eslint` on all five changed files → exit 0.
- Typecheck runs in CI ("Typecheck + reasoning-layer tests").
- Manual signed-in download + fill + upload reconcile verification on First
  Capital is run after deploy.

## Rollout Plan

Merge to main on green PR check → ACA image build/deploy via `aca-main-deploy`.
No migration, no flag flip. The link is visible wherever `source_simple_front`
is already enabled.

## Rollback Plan

Revert the commit / redeploy prior `main-<sha>`. Pure additive code path; the
download route and generator have no persistent side effects to unwind.

## Audit Evidence

- PR: (filled on open) `feat/source-input-templates`
- CI: PR check rollup (Typecheck, ESLint, Release record, Production readiness)
- Local proof: jest pass incl. round-trip; eslint exit 0
- Post-deploy: signed-in template download → fill → upload → row shows attached

## Known Gaps

Narrative requirements get a generic four-column intake sheet rather than a
bespoke column model; only the seven highest-value structured requirements have
tailored columns. Server-side validation of a filled template's contents is out
of scope — the existing upload reconcile handles attachment, not field-level QA.

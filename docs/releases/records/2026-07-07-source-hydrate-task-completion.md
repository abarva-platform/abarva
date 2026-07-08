# 2026-07-07-source-hydrate-task-completion — Source canvas: hydrate upload-task completion from persisted evidence

## Release ID

`2026-07-07-source-hydrate-task-completion`

## Status

`candidate`

## Plain-English Summary

Fixes a real UX defect found in live Source testing: on the redesigned three-beat
stage canvas, an upload / PROVIDE task showed "not done" (empty circle) and the
"N of M complete" counter reset to zero after a page reload or a tab switch — even
though the uploaded facts were actually persisted (the ✦ Intelligence insight the
same facts drive stayed live). The task's done-state was client/session-only React
state that starts empty on every mount and was never re-derived from the persisted
evidence on load.

This change makes the server re-derive each upload task's done-state from
already-persisted evidence when the page loads, and threads that into the checklist
and the progress bar so a reloaded page reflects reality. The derivation is honest:
a task is marked complete ONLY because its evidence reached a usable, persisted
state — its template's facts already exist for the event, or its mapped document is
registered as an artifact — never a fabricated "done" without evidence. The
in-session "just uploaded" success path is unchanged.

## Layer Impact

- `global-control-lane`: shared app/control-plane behavior for the Source stage
  canvas, gated behind the existing `source_analytics` feature flag. No schema,
  data-plane, or migration changes; this is a read-derive-and-render change over
  facts/artifacts already read by the route. The gate-advance logic, insights math,
  and the ingest/write path are untouched.

## Client Applicability

- All clients: No.
- Specific clients: Only tenants with the `source_analytics` flag ON (the redesigned
  analytics canvas). Flag-off tenants fall through the untouched legacy canvas path.
- Internal only: No.
- Public/demo only: No.
- Feature flag: `source_analytics` (unchanged; this change lives entirely inside the
  already-gated analytics branch of the event detail route).

## Changes Included

- `src/lib/source/facts/view/task-evidence-hydration.ts` (new) — pure, deterministic
  hydrator: for a `provide` task bound to a `factTemplateCode`, mark it complete when
  any of that template's column fact keys is present in the event's committed facts
  (via `TEMPLATE_FACT_MAPS`); for a template-less `provide` task (e.g. the signed
  sponsor letter) mark it complete when at least one artifact is registered for the
  stage. Writes nothing.
- `src/app/(maestro)/source/events/[eventId]/page.tsx` — thread the hydrator into the
  analytics branch: reuse the facts already read via `readEventFacts`, add the
  already-existing `listSourceArtifactsForSourceEventId` read, stamp
  `evidenceComplete` on the built stage view's tasks. Non-fatal (falls back to
  in-session behavior on error).
- `src/components/source/canvas/analytics/view-model.ts` — add `evidenceComplete?:
  boolean` to `StageTaskView`.
- `src/components/source/canvas/analytics/TaskChecklist.tsx` — seed the in-session
  done-set + open-first-task logic from `evidenceComplete`; the counter reflects it.
- `src/components/source/canvas/analytics/ScopeAnalyticsStage.tsx` — the top progress
  bar / "N of M complete" counter counts `evidenceComplete` tasks.
- `src/lib/source/facts/view/__tests__/task-evidence-hydration.test.ts` (new) and
  additions to `src/components/source/canvas/analytics/__tests__/TaskChecklist.upload.test.tsx`.

## QA / Validation

- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`: pass
  for the changed files. 124 pre-existing project errors remain (below the ~131
  baseline), NONE referencing any changed file — net-new type errors = 0, confirmed
  by grepping the 157-line tsc log for every changed file.
- `npx eslint` on all changed files: pass (exit 0, clean).
- `npx jest task-evidence-hydration.test.ts TaskChecklist.upload.test.tsx`: pass
  (18/18). New tests assert a stage view whose event HAS a template's facts marks
  that task complete on build and the counter reflects it; a task without persisted
  evidence stays not-complete; confirm/decide tasks are never stamped; and the
  checklist renders the hydrated done-state on mount without a fresh upload. The
  existing TaskChecklist upload tests stayed green.
- `node scripts/release-check.mjs --base origin/main --head HEAD`: pass (Status:
  pass).

## Rollout Plan

Merge to `main` via squash PR after review. No runtime image build, migration, or
flag change is required by this record — the behavior is already gated behind
`source_analytics` and ships as ordinary application code with the next main deploy
through the repo-owned ACA main deploy workflow. Do NOT merge or deploy from this
branch directly.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (the only lane
  that may build the shared web image and shift shared Product/Lab traffic).
- Shared runtime mutators: none — this change does not run any `az containerapp`
  command, does not touch env vars, flags, scale, secrets, revision weights, DNS, or
  worker jobs.
- Approved image digest: not applicable in this record — the next main deploy pins
  the digest per the runbook; this change introduces no new image contract.
- ACA runtime invariant: unchanged; to be proven at deploy time (template image =
  100%-traffic revision image = approved digest) by the standard deploy runbook, not
  by this branch.
- Worker image invariant: unchanged; no worker job images are affected.
- Feature/env flag update path: none — `source_analytics` gating is reused as-is; no
  new flag or env var is introduced.
- Live signed-in proof required: yes at deploy time — a signed-in Source event on a
  `source_analytics` tenant should show an uploaded/ingested task remaining green
  after a hard reload / tab switch, with the "N of M complete" counter correct.

## Rollback Plan

Pure application code, no data or schema migration — revert the squash-merge commit
and redeploy `main` through the repo-owned ACA main deploy workflow. No migration
rollback constraints. Worst case, the change is inert for any tenant with
`source_analytics` OFF.

## Audit Evidence

- PR URL: (to be added on open — branch `fix/source-hydrate-task-completion` against
  `abarva-platform/abarva`).
- tsc log: 157 lines, 124 errors, 0 referencing changed files (net-new = 0).
- eslint: exit 0 on all changed files.
- jest: 18/18 passing across the two suites.
- `scripts/release-check.mjs` local run: pass.

## Known Gaps

- Artifact-derived completion for a template-less `provide` task (the sponsor letter)
  is matched at STAGE granularity (any artifact registered for the stage marks the
  stage's single template-less provide task complete), not per-task, because the
  canvas dropzone currently uploads without a per-task artifact code. This is
  sufficient for today's single-sponsor-letter task per stage; a per-task artifact
  binding would tighten it if a stage ever carries multiple distinct document uploads.
- The canvas CSV/XLSX dropzone still does not itself upload a PDF sponsor letter
  (pre-existing, out of scope); this change only derives and renders done-state from
  whatever evidence already persisted.

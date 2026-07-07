# 2026-06-18-source-approve-autogenerate — Approving a step writes its deliverable (Moves parity)

## Release ID

`2026-06-18-source-approve-autogenerate`

## Status

`candidate`

## Plain-English Summary

On the simple Source front, finishing a step used to need two separate clicks: a
"Write my <deliverable>" button and then a "Continue" button to advance. Users
forgot the first one, so they advanced with no document written. This collapses
the two into one decision: the primary action now reads "Approve & write
<deliverable>", and clicking it both starts writing that step's deliverable
(server-side, lands in the deliverables explorer / File Cabinet) and advances to
the next step. On the final step, where there is nothing to advance to, the
action simply writes the deliverable. This matches the refined Moves "Approve &
Build" model the founder asked Source to mirror — there is no longer a separate
"generate deliverable" button to miss.

## Layer Impact

- `global-control-lane`: shared Source canvas UX (`SimpleStageFront`). Pure
  client-side behavior change — folds the standalone generate button into the
  advance action. The generation and stage-advance APIs it calls are unchanged;
  the advance is not blocked on the (possibly slow) generation, which runs
  server-side as before.

## Client Applicability

- All clients: yes — wherever the simple Source front renders.
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: the simple front itself is gated by `source_simple_front`; this
  change has no separate flag.

## Changes Included

- Branch `feat/source-approve-autogenerate` (stacked on `feat/source-input-templates`).
- `src/components/source/canvas/SimpleStageFront.tsx` — `handleApproveAndContinue`
  (generate current deliverable + advance); single primary "Approve & write
  <deliverable>" button; removed the standalone write button and separate
  Continue button; "Next step:" line relabeled "Then:".
- Tests: `source-simple-front.test.tsx` (+2: approve = generate + advance; final
  stage = write only), `source-event-canvas-render.test.tsx` (SSR labels updated).

## QA / Validation

- `npx jest source-simple-front.test.tsx source-event-canvas-render.test.tsx`
  → 45 passed, incl. the two new approve-contract tests.
- `npx eslint` on the three changed files → exit 0.
- Typecheck runs in CI.
- Manual signed-in click-through (approve writes + advances) on First Capital
  after deploy.

## Rollout Plan

Merge after `feat/source-input-templates` (#2) lands — GitHub retargets the base
to main on that merge. Then ACA image build/deploy via `aca-main-deploy`. No
migration, no flag flip.

## Rollback Plan

Revert the commit / redeploy prior `main-<sha>`. Pure UI behavior change; nothing
persistent to unwind.

## Audit Evidence

- PR: (filled on open) `feat/source-approve-autogenerate`
- CI: PR check rollup
- Local proof: jest 45/45; eslint exit 0
- Post-deploy: signed-in approve → doc appears in explorer + stage advances

## Known Gaps

If a generation fails immediately (e.g. missing upstream evidence), the user
still advances; the failure surfaces in the deliverables explorer rather than
blocking the advance. A pre-advance readiness nudge is a possible follow-up but
is intentionally out of scope to keep the "one calm decision" model.

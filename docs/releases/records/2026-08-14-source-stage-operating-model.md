# 2026-08-14-source-stage-operating-model - Source Stage Operating Model

## Release ID

`2026-08-14-source-stage-operating-model`

## Status

`candidate`

## Plain-English Summary

Adds a typed local workflow contract for the 11-stage Source New Event journey
and renders it in the stage canvas. Each stage now has plain-language local
steps that show what is done, what is active now, what is blocked, and what is
next. The stage canvas remains one focused task area; the global 11-stage rail
continues to show where the user is in the overall process.

This is UI/config only. It does not change workflow persistence, upload parsing,
data-plane records, approval automation, stage advancement, or tenant data.

## Layer Impact

- Release lane: `global-control-lane`.
- Products: Source New Event stage canvas gains local workflow state display.
- Client Intake: No change.
- Source Adapters: No change.
- Canonical Model: No change.

## Client Applicability

- All clients: shared Source New Event UI/config behavior.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/source/stage-canvas-config.ts`
- `src/components/source/SourceStageCanvasPanel.tsx`
- `scripts/qa/source-stage-shell-layout-harness.ts`

## QA / Validation

- Pass: local `npm run qa:source-stage-shell-layout`.
- Pass: local `npm run qa:source-responses-layout`.
- Pass: local prettier check for changed files.
- Pass: local `npm run release:check`.
- Not run yet: GitHub Source Layout Smoke workflow.

## Rollout Plan

Merge through normal PR after validation. The UI change deploys through the
repo-owned ACA main workflow when the merge reaches `main`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None in this change.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Required for affected Source event route after
  deploy.

## Rollback Plan

Revert the PR. This removes the local workflow renderer and contract, returning
the stage canvas to the prior generic gate/deliverable layout.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/6281
- Local validation: pass for stage shell harness, Responses harness, Prettier,
  and release check.
- GitHub Source Layout Smoke: pending.
- ACA deploy proof: pending.
- Signed-in Source route proof: pending after deploy.

## Known Gaps

This slice derives local step state from existing stage and artifact state. It
does not persist substep completion, evidence acceptance, upload parsing, or
approval unlocks. Those remain in later evidence, parser, and durable-gate
slices.

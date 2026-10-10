# 2026-10-10 — Moves live-walk landing settle

## Release ID

`2026-10-10-moves-walk-landing-settle`

## Status

`candidate`

## Plain-English Summary

The read-only acceptance walk now waits for a phase page's actual content
landmark before checking its tenant label. An asynchronous opening state can
outlast the assertion's default wait even when the page subsequently renders.
The walk still records page-settling time and still fails when content or tenant
identity does not appear within the explicit limit.

## Layer Impact

- Release lane: `experimental` acceptance workflow.
- Layer 4: no product runtime code or generated content changes.
- Control plane: the signed-in browser assertion order and timeout change.
  No Move or tenant data is written.

## Client Applicability

- All clients: no product change.
- Specific clients: none.
- Internal only: read-only acceptance workflow.
- Public/demo only: no.
- Feature flag: unchanged.

## Changes Included

- The landing check waits for the phase's content landmark before asserting
  the visible tenant label, using the existing bounded content wait.
- The per-step speed score remains measured from navigation to settled head;
  slower pages do not gain score from this assertion change.

## QA / Validation

- Focused Playwright discovery: PASS, one signed-in test discovered.
- Typecheck and changed-file lint: PASS.
- Release check: PASS, 11 of 11 gates.
- Signed-in post-deploy acceptance: pending.

## Rollout Plan

Squash-merge after validation. The repo-owned ACA main deploy then triggers the
read-only walk. Accept page status only from the resulting proof artifact.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: assigned by that workflow.
- ACA runtime invariant: verify web template, active revision, traffic and
  required worker images before claiming deployment.
- Worker image invariant: same approved digest.
- Feature/env flag update path: none.
- Live signed-in proof required: post-deploy walk artifact.

## Rollback Plan

Revert this PR through a new PR. The change affects only a read-only test.

## Audit Evidence

- This PR and its validation results.
- Post-deploy signed-in walk artifact containing `proof.json`, `summary.md`
  and screenshots.

## Known Gaps

- The measured UX findings from the first live walk remain product work; this
  assertion change does not improve page layout, accessibility or speed.
- The active fixture reaches only its current phase. Later pages remain
  `not_reachable` until a governed full-journey fixture exists.

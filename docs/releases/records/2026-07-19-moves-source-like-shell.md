# 2026-07-19-moves-source-like-shell — Moves Source-Style Phase Shell

## Release ID

`2026-07-19-moves-source-like-shell`

## Status

`candidate`

## Plain-English Summary

Moves phase workspaces and the `/strategic-moves/new` origination route now use a more Source-like shell: a dark move context bar, persistent move explorer, workspace surface tabs where available, clearer phase progress, and workflow tabs that read as navigation controls. The change keeps the existing runtime actions intact while making the phase flow easier to understand.

## Layer Impact

- `global-control-lane`: Updates shared Moves UI behavior and navigation framing for all tenants that use the standalone phase workspace.
- Runtime data contracts: No schema, evidence, candidate, tenant-access, or generation contract changes.

## Client Applicability

- All clients: Yes, for Moves phase workspace UI.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`
  - Adds Source-style move context bar.
  - Adds main workspace surface tabs for Steps, Files, Guides, and Intelligence.
  - Adds header progress card and clearer phase rail gate-count display.
  - Keeps existing File Cabinet, Session Playbook, Phase Intelligence, P0 capture, upload, and Approve & Build components wired through the same runtime paths.
- `src/components/strategic-moves/StrategicMoveOriginateClient.tsx`
  - Updates the mounted `/strategic-moves/new` P0 context strip to the same Moves shell vocabulary.
- `src/components/strategic-moves/StrategicMoves.module.css`
  - Restyles the P0 origination route to use the wider Source-like canvas, progress card, dark context strip, and tab-like question groups.
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
  - Updates terminal phase rail assertion to match gate-count display.

## QA / Validation

- Pass: `npx eslint src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`
- Pass: `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx --runInBand`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json`
- Pass: `git diff --check`
- Pending: post-PR ACA deployment proof.
- Pending: signed-in browser proof on `app.abarva.ai` showing the new shell on `/strategic-moves/new` and a phase route.

## Rollout Plan

Merge the PR to `main`, allow the repo-owned Azure Container Apps deployment workflow to build and deploy the digest-pinned image, then verify `app.abarva.ai` in a signed-in browser on an existing or disposable Move.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: Pending deployment.
- ACA runtime invariant: Pending deployment.
- Worker image invariant: No worker image change expected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert this PR and redeploy the prior ACA image through the repo-owned deployment workflow. No migrations or data rollback are required.

## Audit Evidence

- PR URL: Pending.
- ACA deployment: Pending.
- Signed-in screenshots: Pending.

## Known Gaps

- This slice changes the Moves shell and workflow framing only. It does not change document quality scoring, generated deliverable prompts, evidence ingestion, or gate/blocker policy.

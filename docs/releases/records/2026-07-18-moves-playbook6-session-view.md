# 2026-07-18-moves-playbook6-session-view — Moves: Session Playbook as a Workspace View

## Release ID

`2026-07-18-moves-playbook6-session-view`

## Status

`candidate`

## Plain-English Summary

`MOVES-PLAYBOOK-6` from the Moves UX backlog: a transformation leader running a phase inside Nexus needs the session prep kit (discussion guides, frameworks, capture templates, gates) in-product, not in a separate consulting binder. `SessionPlaybookPanel.tsx` already does this — it's a real, working component hitting a real API (`/api/v1/programs/{moveId}/playbook`) — but it had no mount point: it was deliberately removed from the Prepare tab earlier the same day (commit `62c3b5d96`, #4962, "Remove legacy Moves prepare wall") because it cluttered that tab, and a regression test now guards against re-adding it there.

Rather than reverting that same-day decluttering, this release gives the panel its own home: a second sidebar-accessible workspace view, "Session Playbook," parallel to the existing "Files & Evidence" view. Clicking it swaps the main panel to the playbook (crumb + header + `SessionPlaybookPanel`) without touching the Prepare tab or any other phase content. The existing "Ask about this phase" AVA copy now reads "Ask about this workspace" whenever either non-phase view (Files & Evidence or Session Playbook) is active, matching the prior convention.

## Layer Impact

- `global-control-lane`: `MovesPhaseStandaloneClient.tsx` is the shared Strategic Moves phase workspace for every tenant.

## Client Applicability

- All clients: yes.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`:
  - `WorkspaceView` type extended from `"phase" | "files"` to `"phase" | "files" | "playbook"`.
  - New sidebar button "Session Playbook" added next to the existing "Files & Evidence" button, following the identical `mxw-lib-link`/`viewing` pattern.
  - New `workspaceView === "playbook"` render branch (crumb, `mxw-stage-head` header, `<SessionPlaybookPanel moveId={move.id} phase={phase.phase} />`), inserted as a sibling of the existing "files" branch — the default "phase" flow is untouched.
  - `continueStep()`'s early-return guard widened from `workspaceView === "files"` to `workspaceView !== "phase"` so the substep-advance action can't fire from either non-phase view.
  - AVA panel copy: `"Ask about this workspace"` now shows for `workspaceView !== "phase"` (previously only for `"files"`).

## QA / Validation

- Pass: `npx eslint src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false`
- Pass: `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx` — 20/20, including `"does not load the legacy facilitated session playbook on the Prepare tab"`, which still passes unmodified — confirming the new sidebar view does not leak `SessionPlaybookPanel` (or its API fetch) onto the default Prepare view.
- Not run: live signed-in browser proof (no valid local Clerk session in this environment).

## Rollout Plan

Merge to `main`, deploy through the repo-owned ACA main deploy workflow. No data migration, no flag, no worker job — purely additive UI.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none.
- Approved image digest: produced by the ACA main deploy workflow after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: yes — open a real Move's phase workspace post-deploy, click "Session Playbook" in the sidebar, confirm it renders real session data (not the retired Prepare-tab inline copy) and that the Prepare tab itself is unchanged.

## Rollback Plan

Revert this PR and redeploy through the ACA main deploy workflow. No data or schema changes to unwind.

## Audit Evidence

- This PR's diff.
- `MovesPhaseStandaloneClient.test.tsx` full pass (20/20).
- ACA main deploy run after merge.
- Post-deploy live signed-in proof (pending).

## Known Gaps

- The panel is not surfaced from the Prepare tab itself — a facilitator has to know to look in the sidebar. A future pass could add a small inline pointer ("Open Session Playbook →") on Prepare without reintroducing the removed inline block.
- `SessionPlaybookPanel`'s own content/API surface was not modified — this release only adds a mount point.

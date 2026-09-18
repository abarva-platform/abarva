# 2026-09-17-agent-dock-ai-output-labels - Restore The AI Output Marker And Citation Gap

## Release ID

`2026-09-17-agent-dock-ai-output-labels`

## Status

`candidate`

## Plain-English Summary

Every agent turn in the shared agent dock is meant to carry two visible governance affordances: an "AI Draft — Review before acting" marker, and a citation-gap notice when substantive agent prose arrives with no citation. Both were added deliberately in June 2026 and both were removed on 7 July 2026 by a large refactor of the dock component that rewrote its render tree. The affordances were not replaced.

Since then, every surface that uses the dock has rendered agent answers with no AI-output marker, and uncited agent prose has looked exactly like evidenced prose. Tests asserting both have been failing on `main` continuously for about ten weeks; nothing surfaced them because that directory is outside the narrowly scoped pre-commit test scripts and repository rulesets are in speed mode.

This restores both, using the same primitives and the same call shape the dock used before the refactor.

## Layer Impact

`global-control-lane`, Layer 4 product UI only. No schema, migration, adapter, projection or route change. Both restored components already exist and are used by other surfaces.

## Client Applicability

- All clients: every surface that renders the shared agent dock.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None. The markers follow the dock's existing `showReviewChrome` gate, exactly as before.

## Changes Included

- `src/components/agent/AgentDock.tsx`: restores the `AILabel` marker in the agent byline and the `CitationGapNotice` under uncited substantive agent prose, both behind the dock's existing review-chrome gate.

## QA / Validation

Measured against a clean `origin/main` tree over the same scope
(`src/components/agent`, `src/lib/agent`, `src/components/agent-answer`):

- Baseline: 30 failing tests across 79 suites.
- With this change: 26 failing. Four tests fixed, none broken. Status: **pass** for the two restored affordances; the four newly passing tests are the AI-draft marker and citation-gap assertions.
- Full-project `tsc --noEmit`: **pass**. Scoped ESLint: **pass**, no errors.
- **Correction, 18 Sep 2026:** the local typecheck quoted above did not run. `npx tsc --noEmit` on the authoring machine exits 134 — a V8 out-of-memory crash that emits no diagnostics — and its output was filtered for `error TS`, so the crash read as clean. The authoritative typecheck for this change is the CI job on its pull request, which passed. Re-running locally as `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit` exits 0. The ESLint and test results above were produced by commands that completed and are unaffected.
- Signed-in acceptance on the deployed build: **not run** — blocked, the host machine is locked.

## Still failing, and why they are not in this change

Three tests in the same suite remain red, and they are a different class — the
July refactor changed behavior rather than dropping a governance control:

- `mode picker › switches modes and persists each choice` expects a `pin-top`
  control. `pin-top` is still declared in `DockMode` and `DOCK_MODES` and is
  still persistable, but the picker renders no button for it. Either the control
  was dropped unintentionally or the mode should be retired from the type; both
  are product calls, and adding a control back is a design change rather than a
  restoration.
- Two `thread render` tests expect structured artifacts and response parts to
  render inside the dock. That rendering moved during the refactor.

These need a decision on intent before either the code or the tests change.

## Rollout Plan

Squash-merge after required checks pass; the repo-owned ACA main deploy workflow publishes the change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None in this change.
- Approved image digest: To be recorded after deploy.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Open any agent dock surface, ask a question, and confirm the answer carries the AI Draft marker; confirm a substantive uncited answer also shows the citation-gap notice.

## Rollback Plan

Revert through a new PR and the repo-owned deploy workflow. Nothing persisted changes.

## Audit Evidence

PR link, before/after failure counts over the same scope, and CI to be added when available.

## Known Gaps

- No signed-in browser proof yet.
- The conditions that hid this for ten weeks are unchanged: `src/components/agent/__tests__` is outside `test:nav`, `test:behaviors` and `test:integration`, and speed-mode rulesets do not block merges on queued runners. Widening that scope is a separate change and is the one that stops the next silent removal.

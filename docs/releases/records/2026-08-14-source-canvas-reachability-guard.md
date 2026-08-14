# 2026-08-14-source-canvas-reachability-guard — Source canvas reachability guard

## Release ID

`2026-08-14-source-canvas-reachability-guard`

## Status

`candidate`

## Plain-English Summary

A change can pass every test, clear CI and deploy successfully while no route mounts the component it changed. That is what happened to PR #6284: it rewrote `src/components/source/canvas/workspace-tabs/EvidenceTab.tsx` into an upload checklist — 425 lines, with tests and an updated e2e spec. That file's only importer is `src/components/source/canvas/UniversalCanvasShell.tsx`, and the event route stopped mounting that shell. The work was correct and it deployed, but no user could reach it. The same checklist was then built again, correctly, in the live `SourceAnalyticsCanvas`.

Nothing in the pipeline could have caught that, because every signal a PR produces — unit tests, lint, typecheck, CI, deploy, invariant — is satisfied by unreachable code.

This adds an audit that walks the import graph from the 615 Next.js route entry points under `src/app` and reports components under `src/components/source` that nothing reaches. Existing unreachable files are recorded in a baseline, so the check fails only when a **new** one appears, or when the baseline lists a file that has become reachable again.

The audit found **131 unreachable files** out of 230 Source components. That number is recorded, not fixed: removing them is a deletion, which is a human gate.

## Layer Impact

- Release lane: `global-control-lane`.
- Products: none at runtime. This adds an audit script, a baseline file, an npm script and a test.
- Canonical model: No change.
- Source adapters: No change.
- Client intake: No change.

## Client Applicability

- All clients: No runtime change reaches any client.
- Specific clients: None.
- Internal only: Yes — this is a build-time guard.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `scripts/audit/source-canvas-reachability.mjs` (new audit)
- `docs/architecture/source-canvas-orphans.json` (new baseline, 131 entries)
- `src/components/source/__tests__/source-canvas-reachability.test.ts` (new enforcement)
- `package.json` (adds `audit:source-canvas-reachability`)

## QA / Validation

- The audit was validated against known cases before the baseline was written:
  - `UniversalCanvasShell.tsx` — reported unreachable; confirmed by grep to have zero importers outside code comments.
  - `workspace-tabs/EvidenceTab.tsx` — reported unreachable; confirmed its only importer is the shell above.
  - `scope/ScopeStageView.tsx` — reported unreachable; confirmed its only importer is the shell. The live Scope Files checklist is rendered by `SourceAnalyticsCanvas`, which the audit reports as reachable.
  - `analytics/SourceAnalyticsCanvas.tsx` and `responses/ResponsesStageView.tsx` — reported reachable; both have been proven live in signed-in browser checks.
- One apparent false positive was investigated and was not one: `src/components/source/FileCabinetPanel.tsx` is unreachable, while the similarly named `src/components/strategic-moves/FileCabinetPanel.tsx` is mounted by a Moves route. A name-based grep conflates the two; the audit resolves imports to file paths and separates them. This is the reason the audit is more reliable than grep for this question.
- The guard was verified to fail in both directions before being kept:
  - adding an unreferenced component under `src/components/source` makes it exit 1 and name the file;
  - adding a stale entry to the baseline makes it exit 1 and ask for a refresh.
  - Restoring each case returns exit 0.
- `npx jest src/components/source/__tests__/source-canvas-reachability.test.ts` — passes, and was confirmed to fail when a new orphan is introduced.
- `npx eslint` on both new files — clean.
- `git diff --check` — clean.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — see PR body.

## Rollout Plan

Merge through PR to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the resulting `main` image. There is no runtime change to roll out; the guard takes effect in CI on merge.

## Deployment Authority

- Repo-owned deploy workflow: Standard.
- Shared runtime mutators: None in this PR.
- ACA runtime invariant: Standard post-deploy check applies, though nothing user-visible changes.
- Live signed-in proof required: No. This PR changes no rendered surface. Claiming live UI proof for it would be meaningless.

## Rollback Plan

Revert this PR. Nothing at runtime depends on the audit.

## Audit Evidence

- PR URL: pending.
- Audit output before baselining: 615 route entry points scanned, 131 unreachable files reported out of 230 Source components.
- Validation of the audit against known-reachable and known-unreachable components, recorded in the QA section above.
- Guard failure proofs: exit 1 with the offending filename on a newly introduced orphan; exit 1 with a refresh instruction on a stale baseline; exit 0 once each is corrected.
- Baseline committed at `docs/architecture/source-canvas-orphans.json` so the current state is reviewable rather than implicit.

## Known Gaps

- **The 131 unreachable files are recorded, not removed.** Removing them is a deletion and needs explicit human approval. Until then they continue to carry maintenance cost and can absorb work that never reaches a user.
- The audit resolves static `import`/`require`/dynamic-`import()` specifiers. A component mounted only through a computed specifier or a runtime registry lookup would be reported unreachable. None of the validated cases used that pattern, but the baseline should be reviewed rather than trusted blindly if such a pattern is introduced.
- The watched scope is `src/components/source` only. Home, Tower, Moves and Intelligence are not covered; the same audit would work for them by extending `WATCHED`.
- The audit reports reachability, not usage. A component reachable from a route may still be rendered only under a condition that never occurs.

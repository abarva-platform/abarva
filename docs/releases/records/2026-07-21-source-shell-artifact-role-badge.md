# 2026-07-21-source-shell-artifact-role-badge — SOURCE-SHELL-002: artifact role badge (Authoritative/Evidence)

## Release ID

`2026-07-21-source-shell-artifact-role-badge`

## Status

`candidate` — PR open, not yet merged. See Known Gaps for the live signed-in proof plan.

## Plain-English Summary

The user's independent Source Event Shell redesign mockup showed each file in the Files tab
tagged with a role badge — `AUTHORITATIVE` for artifacts required to gate the stage,
`EVIDENCE` for supporting context — alongside its lifecycle status. Live Source already
computed this exact distinction (`ArtifactLifecyclePanel`'s "Gate-defining"/"Supporting"
classification, sourced from each artifact's canonical spec in
`canonical-specs/artifact-specs.ts`), but only showed it in the aggregate quality-matrix
panel, not per file. This surfaces the same, single source of truth as a badge on each
individual file card (`FileCard`), and turns the file's status from plain inline text into a
proper chip, matching the mockup's visual pattern. No new derivation logic, no new data
source — reuses `specByCode(artifactCode).gateDefining`, the same lookup
`ArtifactLifecyclePanel` already depends on, so there is exactly one source of truth for
"does this artifact gate the stage," not two.

This is `SOURCE-SHELL-002` from the Source Event Shell design-closure plan (Phase 2 of 4;
Phase 1, the stage-header lead-agent fix, shipped separately as PR #5192).

## Layer Impact

- `global-control-lane`: `source-event-shell-v2.ts` (`toFileItem()`, `SourceShellFileItem`
  type) and `SourceAnalyticsCanvas.tsx` (`FileCard`, new `ArtifactRoleBadge`). No schema, no
  API route, no migration.

## Client Applicability

- All clients: yes — no gate, no flag, affects every Source event's Files tab.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/source/source-event-shell-v2.ts`: `SourceShellFileItem` gains `artifactRole:
"authoritative" | "evidence"`, computed in `toFileItem()` via
  `specByCode(artifactCode)?.gateDefining`. Unknown/unmatched artifact codes default to
  `"evidence"` — fail-safe, never falsely gates.
- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx`: new `ArtifactRoleBadge`
  component; `FileCard` now renders it and restyles the status text (`item.state`) as a chip
  instead of plain inline text; `FileCard`'s root now carries
  `data-testid="source-shell-file-card-{id}"` for precise per-card test scoping.
- `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.artifactRoleBadge.test.tsx`
  (new).
- This release record.

## QA / Validation

- `pass` — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p
tsconfig.json` — full project, 0 errors.
- `pass` — `npx eslint` on all three changed/added files — 0 errors, 0 warnings.
- `pass` — **new functional tests**, not shape-only: render the real `SourceAnalyticsCanvas`
  with two real, currently-registered artifact spec codes (`d01_strategy_memo`, gate-defining;
  `d03_archetype_decision`, not gate-defining — verified against the live registry in a
  `beforeAll` guard so the fixture itself fails loudly if those codes are ever renamed), fire a
  real click to open the Files tab (not a mocked navigation), and assert the actual rendered
  badge text differs correctly between the two cards (`Authoritative` vs `Evidence`) and that
  each card's real (unmocked) status value renders verbatim. A third case confirms an unknown
  artifact code defaults to `Evidence` rather than silently gating. 2/2 passed.
- `pass` — full `SourceAnalyticsCanvas.__tests__` + `source-event-shell-v2.test.ts` sweep:
  55/57 passed. The 2 failures (`StrategyStage.test.tsx`,
  `SourceAnalyticsCanvas.thread.test.tsx`) were confirmed pre-existing on a clean `origin/main`
  checkout via `git stash` + re-run (same 2 failures, same error, before this diff existed) —
  zero regressions from this change.
- `pending` — live signed-in click-through against the deployed feature. Unlike prior Source
  work this session, this one is genuinely followable: a real, already-authenticated Chrome
  session (claude-in-chrome, signed in as Lakeshore) is available in this environment. Local
  `npm run dev` cannot substitute for this — the private Postgres data plane is not reachable
  from localhost — so this step happens **after** merge and ACA deploy, driving the real
  `app.abarva.ai` Files tab for a real Lakeshore Source event. Evidence to be appended to this
  record once performed.

## Rollout Plan

Merge to `main` via the repo-owned ACA main-deploy workflow. Pure UI change to an existing,
already-shipped workspace — no migration, no flag.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: to be recorded after merge and deploy.
- ACA runtime invariant: to be verified after merge and deploy.
- Worker image invariant: N/A.
- Feature/env flag update path: none.
- Live signed-in proof required: yes — planned and followable this time (see QA /
  Validation), not just flagged as a standing gap.

## Rollback Plan

Revert the merge commit. Reverting restores the prior plain-text status + no role badge — a
regression in information density, not a functional defect (the underlying spec/gate data is
unchanged and unaffected).

## Audit Evidence

- PR: to be added once opened.
- Test/typecheck/lint logs: see QA / Validation.
- Live click-through evidence: to be appended after deploy.

## Known Gaps

- Live signed-in proof pending merge + deploy (see QA / Validation) — this record will be
  updated with real evidence once performed, not left open indefinitely like the standing
  `SOURCE-GUIDEBOOK-002` gap.
- This closes only the role-badge half of the two-axis badge requirement from the mockup
  comparison. The Files-tab lifecycle-explainer banner was evaluated separately and found to
  already exist in substance (`ArtifactLifecyclePanel`'s intro paragraph states the same
  draft→client-final→authoritative lifecycle, in different phrasing than the mockup) — adding
  a second, differently-worded banner would duplicate existing UI rather than close a real gap,
  so it was deliberately not added here.

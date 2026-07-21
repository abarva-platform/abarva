# 2026-07-21-source-shell-artifact-role-badge — SOURCE-SHELL-002: artifact role badge (Authoritative/Evidence)

## Release ID

`2026-07-21-source-shell-artifact-role-badge`

## Status

`released` — merged, deployed, ACA runtime invariant confirmed, live signed-in proof
performed against real production data.

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
- `pass` — **live signed-in click-through performed** against the real deployed feature,
  using an already-authenticated Chrome session (claude-in-chrome, signed in as Anand
  Sundaram · Healthcare Demo tenant) on real production data at
  `https://app.abarva.ai/source/events/cea10d0a-6d5d-49d2-8522-173c2d6fd520` (Healthcare Demo
  EHR application management event, Scope stage → Files tab). Real, currently-registered
  Strategy-stage artifacts rendered with the correct, differentiated real badges:
  `Sourcing_Strategy_Memo-76f3fe09.docx` (the actual `d01_strategy_memo` gate-defining
  deliverable) shows `AUTHORITATIVE`; the `.md`/`.html` renderings of the same memo show
  `EVIDENCE`. This is real output from real data, not a fabricated or staged example — the
  first Source feature this session with a genuine post-deploy live click-through instead of
  a standing "not performed" gap.

## Rollout Plan

Merge to `main` via the repo-owned ACA main-deploy workflow. Pure UI change to an existing,
already-shipped workspace — no migration, no flag.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: `acrabarvalab001.azurecr.io/abarva/web@sha256:998b56b0e1ff55fa746dde2cd3443faea7dae6e2702f7f183ba89a38a81f80cf`.
- ACA runtime invariant: **proven.** `az containerapp show` confirms the template image
  matches the digest above, active revision `ca-abarva-web-lab-eastus--m57210790` (matches
  merge commit `5721079099d86bbd611b349177af7ebde619c9eb`), 100% traffic.
- Worker image invariant: N/A.
- Feature/env flag update path: none.
- Live signed-in proof required: yes — **performed**, see QA / Validation.

## Rollback Plan

Revert the merge commit. Reverting restores the prior plain-text status + no role badge — a
regression in information density, not a functional defect (the underlying spec/gate data is
unchanged and unaffected).

## Audit Evidence

- PR: [abarva-platform/abarva#5195](https://github.com/abarva-platform/abarva/pull/5195),
  merged as `5721079099d86bbd611b349177af7ebde619c9eb`.
- Deploy: [aca-main-deploy #29836643851](https://github.com/abarva-platform/abarva/actions/runs/29836643851),
  `success`.
- Test/typecheck/lint logs: see QA / Validation.
- Live click-through: real screenshot of the `AUTHORITATIVE`/`EVIDENCE` badges on real
  Strategy-stage files for the Healthcare Demo EHR event, captured in this session's
  transcript (not committed as a file).

## Known Gaps

- This closes only the role-badge half of the two-axis badge requirement from the mockup
  comparison. The Files-tab lifecycle-explainer banner was evaluated separately and found to
  already exist in substance (`ArtifactLifecyclePanel`'s intro paragraph states the same
  draft→client-final→authoritative lifecycle, in different phrasing than the mockup) — adding
  a second, differently-worded banner would duplicate existing UI rather than close a real gap,
  so it was deliberately not added here.

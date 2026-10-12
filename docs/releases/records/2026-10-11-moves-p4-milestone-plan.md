# 2026-10-11 — Moves P4 reviewed milestone plan

## Release ID

`2026-10-11-moves-p4-milestone-plan`

## Status

`candidate`

## Plain-English Summary

The P4 workstream page could save only a milestone name and count milestones from any phase as complete. It now captures a reviewed roadmap plan with stable milestone IDs, workstreams, owner roles, planned windows, timing sources and predecessor IDs. Completion requires a valid sequence and the existing capture path’s saved readback. A name alone, an unreviewed row, an unresolved dependency or a cycle holds the step open.

## Layer Impact

- Release lane: `global-control-lane`, within the existing enrolled step-page surface.
- Layer 3: declares a versioned `p4_roadmap_plan` step record beside existing phase-capture answers. The existing tenant-scoped capture writer, revision fence and audit path store it; no schema, seed, identity, approval or gate changes.
- Layer 4: Moves edits that record and projects its completion. The host and page use the same completeness model; saved-state checks include declared records.
- Document generation reads reviewed planning words and timing sources. Gate phrase readers receive only the team’s words; invalid and incomplete plans contribute no words.

## Client Applicability

- All clients: unchanged outside the existing enrolled step-page surface.
- Specific clients: synthetic demo enrollment only.
- Internal only: no.
- Public/demo only: synthetic demo enrollment.
- Feature flag: existing `moves_step_pages_p4p5_v1`, `moves_step_pages_v3` and `moves_capture_v2`; flag-off and legacy capture retain their existing page and completion path.

## Changes Included

- Structured editor for milestone scope, role ownership, sequence and timing provenance.
- Explicit dependency review, including no-predecessor milestones; self, foreign, duplicate and cyclic dependencies hold completion.
- Edits reopen review; removing a predecessor reopens review on dependent milestones.
- Save failures keep exact refusal text and offer a reviewed retry. Malformed stored records stay intact for repair.
- Declared record and text readers use the existing capture/generation pipeline.
- The Tower handoff prompt explicitly asks for a comparator and source lineage.

## QA / Validation

- Pass: four model/editor/page/registry suites, 137 tests; the full host suite, 349 tests; four capture-route/generation/reader suites, 88 tests. Total: nine suites, 574 tests on local fixtures.
- Pass: Node 24 typecheck, zero diagnostics.
- Pass: 16 mutation checks killed, sources restored after every run; targeted ESLint, library and route/export reachability; coverage and tenancy write/check; manual regeneration/check; all 11 release gates. Covered files rise from 2,829 to 2,831, exactly the two new model/editor test files.
- Pass: actual component renders at 1440 and 390 in light/dark, with the editor expanded and no horizontal overflow. Compared with template v1.10; the temporary render test was removed. These fixtures exclude the signed-in host and agent dock.
- Not run: exact-head CI, merge, runtime invariant or fresh signed-in P4 acceptance.

## Rollout Plan

Open a controlled PR after local validation and reconciliation of actual main. Complete exact-head CI and a fresh fetched-ref coverage-count scan of every open Moves PR, including drafts, before squash merge. Generated artifacts are regenerated from the actual tree after main overlaps. The repository-owned main ACA workflow owns deployment; observe the demo cutoff and freeze.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: assigned by the main workflow; none claimed here.
- ACA runtime invariant: web template and 100% serving revision must match the approved digest.
- Worker image invariant: required worker images must match the approved digest.
- Feature/env flag update path: unchanged, through the repository-owned lane.
- Live signed-in proof required: on a fresh synthetic Move, save and read the exact milestone record, inspect generated roadmap content, verify readiness and operator attribution, and separately review gate signatures and decision persistence.

## Rollback Plan

Revert the UI/reader patch through a PR and the repository-owned main workflow, or withdraw the existing step-page enrollment through that lane. Preserve any stored planning record. No migration or data cleanup is required.

## Audit Evidence

- Focused test and typecheck results above.
- Mutation, visual and generated-artifact checks above.
- Candidate PR, exact-head CI, coverage scan, runtime digest and fresh signed-in proof remain separate evidence layers.

## Known Gaps

- Fresh Move and P4 artifact acceptance are pending with the sole execution owner.
- The planning record does not backfill the separate execution milestone tracker. The governed roadmap build consumes the reviewed capture record.
- Owner roles are reviewed text; a saved role does not grant permissions or sign a document.
- Gate hard-check logic is unchanged. Independently verify all current document signatures and durable gate-decision readback before P4 acceptance.

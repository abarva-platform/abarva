# 2026-09-12-source-directives-off-reader-surfaces — Authoring notes off reader surfaces

## Release ID

`2026-09-12-source-directives-off-reader-surfaces`

## Status

`candidate`

## Plain-English Summary

Two kinds of builder content were reaching an executive reader on Contract 360
tabs. Both were found by reading the deployed page.

**An authoring directive presented as a decision consequence.** The governed tab
record carries an `action_prompt` column authored as an instruction to whatever
renders the tab — for example "render evidence lanes only when rows exist,
otherwise show the specific missing input", or "keep contract value, actual
spend, invoiced, paid and finance-confirmed outcomes in separate ledgers". The
narrative used it whenever a tab recorded no missing evidence, and the side
panel labelled the result "Decision consequence". On a tab with nothing missing
— which is most tabs on a well-loaded contract — an executive was reading an
instruction meant for the implementer, presented as the consequence of their
decision. A blocker is a missing input; where none is recorded there is now no
blocker and no card, which is the honest reading.

**A raw identifier in the provenance line.** The provenance read "Economics
intelligence · system_generated_from_reviewed_sources". That line is exactly
what a reader consults to judge how far to trust the tab, and the identifier
also undersells itself: it means the tab was generated from rows a person had
already reviewed, which is a strong provenance rather than a machine
disclaimer. Each status the projector can write now has words; an unrecognised
one is stripped rather than guessed at, so a status added upstream cannot leak
snake_case onto the surface.

## Layer Impact

- **Release lane:** `global-control-lane` — shared Contract 360 narrative derivation for all clients, not feature-gated.
- **Layer 4 / Products:** Tab narrative blocker and provenance derivation; the side panel's consequence card.
- **Layer 3:** No canonical facts, source assertions, or data-plane rows change. The `action_prompt` column is left exactly as authored and is simply no longer read as a reader-facing blocker.
- **Layer 2:** No adapter or intake changes.

## Client Applicability

- **All clients:** Applies to every contract whose tabs read a governed intelligence record.
- **Specific clients:** None.
- **Internal only:** No.
- **Public/demo only:** No.
- **Feature flag:** None.

## Changes Included

- `WorkspaceExecutiveShell.tsx`: the narrative blocker reads only `missing_evidence_summary`; `reviewStatusInWords` maps each status the projector writes and strips an unrecognised one; the side panel omits the consequence card when nothing is blocked.
- `governedDirectives.test.ts`: six tests covering both defects and both refusals.

## QA / Validation

- Focused Jest: 25 suites, 214 tests passed across the workspace slice.
- **Mutation-tested both guards.** Restoring the `action_prompt` fallback fails one test; leaking the raw `review_status` fails another. Neither guard is decorative.
- Repository TypeScript: clean.
- ESLint on both changed files: clean.
- Required follow-up: read the deployed Economics and Relationship tabs and confirm no snake_case identifier in the provenance line and no consequence card where nothing is missing.

## Rollout Plan

Merge through the protected `main` PR path. The repo-owned ACA deploy workflow
builds a digest-pinned image and updates the shared lab runtime. No migration or
operator data-build job is required for this presentation-only change.

## Deployment Authority

- **Repo-owned deploy workflow:** `.github/workflows/aca-main-deploy.yml`
- **Shared runtime mutators:** None outside the workflow.
- **Approved image digest:** Recorded after deployment.
- **ACA runtime invariant:** Required before calling the change live-proven.
- **Worker image invariant:** Not applicable.
- **Feature/env flag update path:** Not applicable.
- **Live signed-in proof required:** Yes, on Contract 360 Economics and Relationship.

## Rollback Plan

Revert the PR or select the prior known-good digest through the repo-owned ACA
deployment lane. No source data or migration rollback is required.

## Audit Evidence

- PR and CI checks for this branch.
- Focused Jest, mutation-test results, TypeScript, and ESLint output.
- ACA deployment run, digest invariant, and the deployed-page read.

## Known Gaps

The `action_prompt` column is still authored as a rendering directive. This
change stops it reaching a reader but does not re-author it, and a future
surface that reads the column will inherit the same problem. Re-authoring those
values as reader-facing next steps — or renaming the column so its purpose is
unmistakable — belongs to whoever owns the projector.

One tab is an exception worth noting: on Optimize, `action_prompt` prefers real
recorded next actions over the directive literal. Those actions still render in
the Optimize body's sequence view, so nothing is lost here, but the column
mixes two kinds of content and only the directive kind was ever the problem.

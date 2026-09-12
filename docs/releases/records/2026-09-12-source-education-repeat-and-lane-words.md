# 2026-09-12-source-education-repeat-and-lane-words — Education repeat, lane labels, fragment casing

## Release ID

`2026-09-12-source-education-repeat-and-lane-words`

## Status

`candidate`

## Plain-English Summary

Three findings from reading the deployed Education and Evidence tabs.

**The same paragraph twice, back to back.** The Education narrative used the
archetype guide's `focus` as its blocker when every applicable step was loaded.
On this record `focus` and `body` are the same 200-character paragraph, so the
card printed its own body again immediately beneath itself. With every
applicable step loaded there is no next move, and saying nothing is accurate.
The tab body already opens with that paragraph and the side panel repeats it as
the coaching focus, so the narrative now keeps only its headline there — the
one part not already on screen.

**Two lane labels that named a table instead of a source.** The evidence-lane
list captions each lane with where its rows come from, in words: "finance
ledger", "contract record". Two were out of step — `contract_pdf · restricted`
named a table, and `source` named the product the reader is already looking at,
which says nothing about provenance. They now read "contract document ·
restricted" and "governed analysis".

**A lowercase authored fragment set into prose.** Some authored governed fields
are written as bare fragments with no terminal punctuation — "finance
confirmation required before realized-value claim". Rendered into a paragraph
that reads as a machine token rather than a statement, which undercuts the claim
it makes. A fragment is now opened and closed as a sentence; one that already
begins with a capital or ends in punctuation is left alone, so authored text is
not rewritten.

The predicate added in the previous change is renamed. It decides whether the
narrative's body is already on screen, which is now true for two different
reasons, and its old name claimed something narrower than it checks.

## Layer Impact

- **Release lane:** `global-control-lane` — shared Contract 360 narrative and evidence-lane presentation for all clients, not feature-gated.
- **Layer 4 / Products:** Education narrative, evidence-lane captions, governed-fragment casing.
- **Layer 3:** No canonical facts, source assertions, or data-plane rows change. Authored fields are read as written.
- **Layer 2:** No adapter or intake changes.

## Client Applicability

- **All clients:** Applies to every contract with a governed archetype guide or evidence-lane list.
- **Specific clients:** None.
- **Internal only:** No.
- **Public/demo only:** No.
- **Feature flag:** None.

## Changes Included

- `WorkspaceExecutiveShell.tsx`: Education blocker returns nothing where there is no next step; Education joins the headline-only case; `asSentence`; the predicate is renamed to `narrativeBodyIsAlreadyOnScreen`.
- `Contract360Surfaces.tsx`: two evidence-lane captions put into words.
- `governedDirectives.test.ts`: five more tests covering fragment casing and its three refusals.

## QA / Validation

- Focused Jest: 26 suites, 224 tests passed across the workspace slice.
- Repository TypeScript: clean.
- ESLint on all three changed files: clean.
- Required follow-up: read the deployed Education tab and confirm the archetype paragraph appears once per column, and the Evidence tab for the lane captions.

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
- **Live signed-in proof required:** Yes, on Contract 360 Education and Evidence.

## Rollback Plan

Revert the PR or select the prior known-good digest through the repo-owned ACA
deployment lane. No source data or migration rollback is required.

## Audit Evidence

- PR and CI checks for this branch.
- Focused Jest, TypeScript, and ESLint output.
- ACA deployment run, digest invariant, and the deployed-page read.

## Known Gaps

The archetype paragraph still appears in two columns: the tab body's lead and
the side panel's coaching focus. Both are legitimate placements for that text
and removing either loses a column's purpose, so this change stops the third
and fourth copies rather than choosing between the two that remain.

Sentence casing is applied to the narrative blocker, which is where a bare
fragment was observed. Other surfaces render authored fields directly and have
not been audited for the same casing problem.

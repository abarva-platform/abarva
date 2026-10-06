# 2026-09-12-source-not-required-reason-once — One statement of a not-required lane

## Release ID

`2026-09-12-source-not-required-reason-once`

## Status

`candidate`

## Plain-English Summary

On a Contract 360 tab whose evidence lane the archetype does not require, the
governed applicability reason was rendering four times on one screen — the same
sentence, word for word, in four places.

Found by reading the deployed page. Every test was green through it, because
each of the four renders is correct in isolation and no test renders more than
one of them at a time.

Three of the four are removed:

- The Performance card row marked the state *and* restated the reason. It now
  marks the state and points at the panel that carries the reason.
- The right-hand governed statement and the side panel's narrative stack both
  read the same governed record with the same arguments, so wherever the panel
  takes its narrative branch the statement repeated its body and blocker
  verbatim. The statement now keeps only its headline there.
- On a not-required tab the narrative's body *is* the applicability reason,
  which the tab body's applicability panel states in full. The side panel no
  longer repeats it.

What survives is one statement of the reason in the tab body, one decision
consequence and provenance in the side panel, one headline, and one compact
marker on the card. No governed claim is dropped.

## Layer Impact

- **Release lane:** `global-control-lane` — shared Contract 360 composition for all clients, not feature-gated.
- **Layer 4 / Products:** Contract 360 right-column and Performance card composition.
- **Layer 3:** No canonical facts, source assertions, or data-plane rows change. The governed education and tab-intelligence records are unchanged and still read.
- **Layer 2:** No adapter or intake changes.

## Client Applicability

- **All clients:** Applies to every contract with a not-required evidence lane.
- **Specific clients:** None.
- **Internal only:** No.
- **Public/demo only:** No.
- **Feature flag:** None.

## Changes Included

- `WorkspaceExecutiveShell.tsx`: `sidePanelRendersTabNarrative` predicate mirroring the panel's branch order; `headlineOnly` on the governed statement; `bodyOwnedElsewhere` on the narrative stack.
- `Contract360Economics.tsx`: the not-required card marks the state instead of restating the reason.
- `contractPerformanceCards.test.tsx`: pins that the card does not repeat the reason.
- `WorkspaceClient.ecl-browser.test.tsx`: a tab-to-tab differential — the statement keeps its blocker where the panel beside it does not render the narrative, and drops it where the panel does.

## QA / Validation

- Focused Jest: 24 suites, 208 tests passed across the workspace slice.
- Repository TypeScript: clean.
- ESLint on all four changed files: clean.
- **Required follow-up, and the only check that would have caught this:** read the deployed Performance tab and count the occurrences of the applicability sentence. It must appear once. No unit test in this suite renders more than one of the four surfaces together, so the invariant is not test-enforced.

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
- **Live signed-in proof required:** Yes, on a contract whose archetype leaves a lane not required.

## Rollback Plan

Revert the PR or select the prior known-good digest through the repo-owned ACA
deployment lane. No source data or migration rollback is required.

## Audit Evidence

- PR and CI checks for this branch.
- Focused Jest, TypeScript, and ESLint output.
- ACA deployment run, digest invariant, and the deployed-page occurrence count.

## Known Gaps

The "one statement per page" invariant is enforced by reading the deployed page,
not by a test. A test that could enforce it has to render the whole contract
grid against a fixture whose archetype leaves a lane not required, which this
suite does not currently have; the existing full-shell fixture has performance
rows and therefore takes the required branch.

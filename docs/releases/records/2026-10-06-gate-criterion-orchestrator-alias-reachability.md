# 2026-10-06 Gate criterion reads the spelling its document is stored under

## Release ID

`2026-10-06-gate-criterion-orchestrator-alias-reachability`

## Status

`candidate`

## Plain-English Summary

One phase-exit criterion asked for a document under a name nothing in the product ever saves it as, so the document could be generated, approved and signed off and the criterion named after it still read as unmet.

The delivery-ownership criterion on the plan phase looked up three spellings. None of them is a key any producer can write: two are not registered document types at all, and the third is the internal name the generation orchestrator uses while a document is being built. The acceptance path translates that internal name back to the registered key before it saves the row, so the saved row never matched. The criterion then passed only when a human happened to type a particular word into the phase notes.

The criterion now also reads the registered key for the Operating Model Design — the design-phase document that names the work split and accountability it is about. The internal name is kept alongside it so any older row stays readable. This only widens what can satisfy the criterion; nothing that passed before stops passing.

A new guard covers the mechanism rather than the one instance. Internal orchestrator names and registered document keys are interchangeable-looking strings kept in separate files, so the guard joins the two and reports any criterion that reads the internal name without also reading the registered key. It also reports any criterion whose document lookups name nothing a producer can write, so a criterion can no longer be defined in terms of a document that cannot exist.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 only, and read-side only. The phase-gate evaluator is a projection: it reads rows the canonical model already holds and decides whether a criterion is met. No schema, no writer, no new producer, and no change to what any document contains or to how any value is calculated. The registered document key this criterion now reads was already produced by the design phase's generation set and already read by a sibling criterion on the same evaluator.

## Client Applicability

- All clients: the criterion is part of the shared phase-gate contract and is evaluated for every client.
- Specific clients: none.
- Internal only: none.
- Public/demo only: none.
- Feature flag: none. The change is a strict widening of one criterion's accepted keys, so it has no off state to gate.

Reachability varies by confirmed solution route, by existing design: the Operating Model Design is built on the default and material process-change routes and deliberately not built on the technical-product or bounded process-change routes. On those two routes the criterion keeps only its free-text paths, which is the intended scope boundary and not a gap this release introduces.

## Changes Included

The phase-gate evaluator's delivery-ownership criterion, and one new behavior suite in the Programs unit test directory. The regenerated test-CI coverage census is included because a test file was added. No product surface, prompt, migration, loader, or external integration changed.

## QA / Validation

- PASS — new suite, 12 cases: the criterion passes from a signed-off row under the registered key with no phase notes and no charter text, so neither free-text path can carry it; it still reports unmet with no row and with an unrelated row; the internal-name-to-registered-key mapping is checked against the function the acceptance path calls; the detector is shown to fail on a reconstructed pre-fix evaluator; and the class sweep asserts a positive result rather than an empty one.
- PASS — mutation testing, 10 of 10 killed. Removing the registered key fails 5 cases. Removing the internal name, drifting the mapping, narrowing the writability predicate, blanking the key extractor, dropping the extractor's comment tolerance, removing the justified exemption, and stubbing either detector loop each fail at least one case. Two earlier versions of the suite had mutations survive on vacuous assertions; both were rewritten to assert a positive subject before this was recorded.
- PASS — full Programs unit directory, 129 suites / 1313 tests.
- PASS — typecheck, exit 0.
- PASS — scoped lint on both changed files, exit 0.
- PASS — coverage census regenerated: total and covered each rose by one, uncovered unchanged, which is the shape that shows the new suite is swept by an existing required job rather than left unrun.
- NOT RUN — signed-in walk. This is a read-side evaluator change with no surface of its own; proving it live needs a Move that has generated and approved the design-phase document, which depends on work outside this release.

## Rollout Plan

Merge by PR and let the repo-owned ACA main workflow build and deploy an immutable image. No flag to enable, no data to backfill, no migration to apply. The criterion begins reading the additional key as soon as the new revision takes traffic.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` on main.
- Shared runtime mutators: none in this PR.
- Approved image digest: resolved from the official run after merge.
- ACA runtime invariant: web template and the sole healthy 100%-traffic revision must match the approved digest.
- Worker image invariant: both required workers must match that digest.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, once a Move has an approved design-phase operating-model document to read.

## Rollback Plan

Revert the commit through a PR and redeploy via the repo-owned main workflow. Nothing persisted changes, so reverting restores the previous evaluation exactly; any criterion that was met before this change remains met after a revert.

## Audit Evidence

PR diff and hosted checks, the local red-first and mutation logs quoted under QA, the regenerated coverage census in the diff, and the official ACA run for the merged image.

## Known Gaps

- The criterion reads presence rather than sign-off, so a document still in review ticks it. That is pre-existing and shared with several sibling criteria on the same evaluator; it is asserted in the new suite so it is recorded rather than discovered, and tightening it would make a soft criterion stricter and is a separate decision.
- One remaining criterion names only unwritable document keys and is correct anyway, because it also reads a module row. The guard exempts it by name with that reason and separately checks the module path still exists in the evaluator.
- Three cases in the evaluator's switch are implemented but named in no rule's checks, so they are never evaluated. Measured this release, not changed: removing them is a separate cleanup and reasoning from them is the trap, which is why the guard enumerates declared criteria rather than switch cases.
- Two richer document structures exist that no phase key routes to, so those phases fall back to the generic brief. Known, not addressed here.

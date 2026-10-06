# 2026-09-19 Wire QA Integration Directory

## Release ID

`2026-09-19-wire-qa-integration-directory`

## Status

`candidate`

## Plain-English Summary

A directory of 37 integration suites holding 915 assertions was run by no workflow. Running it for the first time found 6 red suites and 9 failing assertions, every one dating from work that shipped without re-measuring a QA artifact. This wires the directory into the integration workflow behind a quarantine ratchet, so 31 suites and 763 assertions run on every pull request from today, and the 6 that are red are excluded by name, with a reason, an owner, and a check that re-runs each one and fails if it starts passing.

## Layer Impact

- Release lane: `global-control-lane`.
- CI configuration and audit tooling only.
- No product runtime behavior changes, no schema change, no migration.

## Client Applicability

- All clients: no client-facing change.
- Internal release assurance only.

## Changes Included

- Wire `src/__tests__/integration/qa` into the integration workflow as its own step, with the runner and the directory named literally so the changed-suite visibility gate can see them.
- Add a quarantine list naming the 6 red suites, each with the one case that fails, the measured values behind it, and an owning backlog item.
- Add a ratchet check modelled on the sibling Admin one: it rejects a malformed entry, a stale entry naming a suite that no longer exists, a duplicate, a list above the ceiling, a list **below** the ceiling, and — the check that matters — a quarantined suite that now passes.
- Add the ignore-argument helper that derives the exclusion flags from the list, so the list is the single place an exclusion is expressed.
- Classify the new check in the gate registry, which refused it as unclassified. A check nobody has classified is a check whose meaning nobody has decided.
- Make the dark-directory ratchet two-directional. It refused a newly unreached directory and allowed its own list to go stale, so wiring a directory left a name behind that meant nothing. The repository's quarantine checks already refuse exactly that — a list below its ceiling fails there. Two controls in one repository with opposite rules is one too many.
- Clear the two stale entries the new direction found: the directory this change wires, and one that was already stale before it.

## QA / Validation

- PASS: the wired command runs 31 suites and 765 assertions green.
- PASS: the ratchet check exits 0 and reports 6 excluded of 37.
- PASS: mutation harness against the ratchet catches 7 of 7 — clearing an entry without lowering the ceiling, appending a seventh, quarantining a suite that actually passes, stripping a reason, stripping an owner, naming a suite that does not exist, and naming the same suite twice.
- PASS: the directory-coverage behavior suite passes 13 of 13, including the new staleness assertion.
- The new direction found a second stale entry on its first run — a directory wired some time ago whose name was never cleared. That is the argument for the change better than any reasoning about it.
- PASS: mutation harness against the ratchet catches 3 of 3, testing both directions: re-adding a stale name, re-adding the newly wired directory, and unwiring a directory without recording it.
- Two required checks failed on the first merge attempt and both were right: the gate registry refused an unclassified check, and the order check refused the entry inserted out of alphabetical position.
- Measured before changing: 37 suites, 915 tests, 6 suites and 9 assertions red.

## Rollout Plan

Merge through the protected pull-request lane. CI configuration only; no deployment behavior changes.

## Rollback Plan

Remove the workflow step, the package script, and the three files under `scripts/quality/`. The directory returns to being unreached, which is the state it was in before.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None.
- Approved image digest: Not applicable; no image change.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: No. CI configuration only.

## Audit Evidence

- First-run measurement of the directory.
- Green run with exclusions applied.
- Ratchet check output and the mutation harness result.
- Directory-coverage behavior suite output.

## Known Gaps

**The 765 assertions this makes visible are not new coverage; they are coverage that existed and was never collected.** Saying otherwise would be the overstating this work exists to refuse. The 6 excluded suites run nowhere, and their passing assertions are not counted either.

Three owning items carry the exclusions and none is decided here: the Intelligence retirement leaves three QA artifacts asserting a shape the product replaced, an admin route a canon regression expects does not exist, and brand-asset enforcement reports three real failures against an expected zero. Clearing any of them means re-measuring what the artifact claims, not relaxing the number it asserts.

# 2026-09-19 Quarantine-Wired List Is Checked

## Release ID

`2026-09-19-quarantine-wired-list-is-checked`

## Status

`candidate`

## Plain-English Summary

The behavior suite that holds wired integration directories to their coverage rules keeps a hand-maintained list of the directories that run with a quarantine. Wiring a directory earlier the same day added a quarantine and did not add it to that list, so every case iterating the list skipped that directory from the day it landed, and nothing said so. The omission was found and repaired separately. This adds the check that would have caught it: the entries and the quarantine scripts on disk must be the same set, in both directions.

## Layer Impact

- Release lane: `global-control-lane`.
- One behavior suite. No production code, no runtime behavior change.
- No schema change, no migration.

## Client Applicability

- All clients: no client-facing change.
- Internal release assurance only.

## Changes Included

- Add a case asserting that the quarantine scripts present under the quality directory and the scripts named by the hand-maintained list are the same set.
- Check both directions. A quarantine with no entry means every case iterating the list silently skips that directory; an entry naming a script that no longer exists means the list describes a quarantine that was removed, and the cases iterating it assert against nothing.
- Assert the directory listing is non-empty before comparing, so a listing that returned nothing cannot pass against a list that also happens to be empty.
- State the hazard in the failure message rather than only the difference, so the failure reads as a consequence rather than as a list needing an update.

## QA / Validation

- PASS: the suite passes 16 of 16.
- PASS: mutation harness catches 3 of 3 — dropping the entry whose omission caused the original defect, adding a quarantine script with no entry, and pointing an entry at a script that does not exist.
- The first of those reproduces the exact defect this change exists to prevent: with the entry removed, the suite reports 15 cases instead of 16 and two failures, where before this change it reported a clean pass.

## Rollout Plan

Merge through the protected pull-request lane. Test-only change.

## Rollback Plan

Remove the case. No runtime, data, or schema rollback is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None.
- Approved image digest: Not applicable; no image change.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: No. Test-only change.

## Audit Evidence

- Suite output before and after.
- Mutation harness output across both directions.

## Known Gaps

The backlog item offered two routes: derive the list from the workflow commands and their scripts, or check that every quarantine script has an entry. This takes the second. Deriving the whole list would mean parsing workflow command strings to recover which directory each quarantine belongs to, and a parser that silently recovers the wrong directory would be worse than the hand-maintained list it replaced. The check is exact and fails loudly; the derivation is not attempted.

The other fields on each entry — the workflow path and the excluded root files — are still hand-maintained and unchecked by this. A wrong workflow path in an entry would make the cases assert against the wrong file, and nothing here would notice.

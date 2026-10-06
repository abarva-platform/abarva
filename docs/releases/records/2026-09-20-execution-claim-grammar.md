# Execution Claim Grammar

## Release ID

`2026-09-20-execution-claim-grammar`

## Status

`candidate`

## Plain-English Summary

The internal queue now recognizes every timestamped claim format already used in its append-only operator log. This prevents it from offering an item that another execution session is actively working.

## Layer Impact

- Release lane: `internal-admin`.
- Layers 1-4: no client intake, adapter, canonical model, or product behavior changes.
- Internal execution control: the repository-owned queue parser and its behavioral contract change.

## Client Applicability

- All clients: No runtime product change.
- Specific clients: None.
- Internal only: Yes, execution operators receive the change.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Recognize canonical non-bulleted `item` claims and the established timestamped `item`, `CLAIM`, and `CLAIMED` forms.
- Keep prose before the `## Claim log` marker non-authoritative.
- Document one canonical format for new claim records.
- Add behavioral fixtures for each grammar, release precedence, and the preamble boundary.
- Place item `T-600` on the structure-only platform track.

## QA / Validation

- PASS: 19 child-process behavioral checks.
- PASS: four mutation variants independently removed the non-bulleted, `item`, `CLAIM`, and `CLAIMED` grammars and each made the suite fail.
- PASS: the real operator queue changed from one false claimable item to zero while preserving the active claim.
- PASS: focused ESLint.
- PASS: repository TypeScript check.
- PASS: release control check after this record adopted the canonical template.

## Rollout Plan

Squash-merge through the normal pull-request lane. The repository-owned ACA workflow may rebuild the unchanged application image after merge, but this tool has no product runtime entry point. No migration, data build, feature flag, or operator-state rewrite is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` may run after merge.
- Shared runtime mutators: None in this change.
- Approved image digest: Record if the normal main deploy runs.
- ACA runtime invariant: Read-only verification only.
- Worker image invariant: Read-only verification only.
- Feature/env flag update path: None.
- Live signed-in proof required: No; no product route changes.

## Rollback Plan

Revert the pull request. The operator log is append-only and requires no rollback.

## Audit Evidence

- Item `T-600`.
- Behavioral suite `scripts/exec/build-execution-queue.test.mjs`.
- Pull request, CI checks, merge SHA, and read-only deployment evidence.

## Known Gaps

The queue continues to treat an explicit `RELEASED` record as the only terminal claim-log state. Board proof rungs independently remove completed work from the claimable population.

# Re-enable the Intelligence Shell QA Suite

## Release ID

`2026-09-20-qa-intelligence-shell-suite-reenabled`

## Status

`candidate`

## Plain-English Summary

The Intelligence shell QA suite now passes all of its assertions, but its old
quarantine entry still prevented it from running in the integration workflow.
This removes that expired entry so the suite returns to the default test set.

## Layer Impact

- Release lane: `global-control-lane`.
- Tooling / CI only: changes one QA quarantine manifest. No product surface,
  runtime route, canonical data, adapter, schema, or client data changes.

## Client Applicability

- All clients: no direct product change.
- Specific clients: none.
- Internal only: yes.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Remove the passing `intelligence-tower-shell-control.test.ts` suite from the
  QA integration quarantine.
- Lower the quarantine ceiling from five to four so the cleared slot cannot be
  silently reused.

## QA / Validation

- The suite was run directly: 10 tests passed.
- The quarantine validator detected the stale entry before the edit.
- After removal, the quarantine validator and integration workflow must pass.
- Release validation and diff hygiene must pass before merge.

## Rollout Plan

Squash-merge through a protected pull request. This changes CI selection only;
the repo-owned deploy workflow may still produce the normal main image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none.
- Approved image digest: produced by the repo-owned workflow.
- ACA runtime invariant: required if a runtime deploy occurs.
- Worker image invariant: required if a runtime deploy occurs.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: no product behavior changes.

## Rollback Plan

Revert the squash commit to restore the quarantine entry. The quarantine
validator will then report the entry as stale while the suite continues to pass.

## Audit Evidence

- Direct Jest output for the re-enabled suite.
- Quarantine-validator output before and after removal.
- Pull-request checks and release validation.

## Known Gaps

- Other QA suites remain quarantined under their own recorded owners and
  reasons; this release changes none of them.

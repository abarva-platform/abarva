# 2026-10-01 Home Claim Row-Lineage Gate

## Release ID

`2026-10-01-home-claim-row-lineage-gate`

## Status

`candidate`

## Plain-English Summary

Home now requires each published chapter claim to cite at least one serving row with a verified source-record link before describing the executive narrative as coherent with the live record. A scope note or aggregate signal can still help orient a claim, but cannot establish its source lineage alone.

## Layer Impact

- `global-control-lane`, Layer 4 Home serving projection: tightens the read-time narrative coherence check. No canonical object, source row, or tenant record changes.

## Client Applicability

- All clients: the shared Home read path uses this check when published chapter claims are served.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Home projection bundle coherence check and planted claim-evidence regressions.
- No migration or data build.

## QA / Validation

- PASS: focused projection-bundle tests, Home test ratchet with no baseline movement, TypeScript, touched-file lint, and formatting.
- Pending before merge: release check and required PR CI.
- Not run until deployment: signed-in Home record-source and narrative-coherence proof.

## Rollout Plan

Squash-merge the reviewed PR to main, then use only the repository-owned ACA main deploy workflow. No tenant data load or feature-flag change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: record after deployment.
- ACA runtime invariant: confirm the web template and 100% traffic revision use the approved digest.
- Worker image invariant: confirm required worker jobs use that digest.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR through normal review and redeploy with the ACA main workflow. No data rollback is required.

## Audit Evidence

- PR checks, exact merge SHA, ACA main deploy run, digest readback, and signed-in Home proof to be recorded in the private completion ledger.

## Known Gaps

This is a necessary lineage gate, not claim-content verification. Source-file review, complete row links, current claim generation, and a comparable prior state remain separate requirements.

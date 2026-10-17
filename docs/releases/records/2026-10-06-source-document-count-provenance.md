# 2026-10-06-source-document-count-provenance — Preserve document count provenance

## Release ID

`2026-10-06-source-document-count-provenance`

## Status

`candidate`

## Plain-English Summary

The Source contract view now keeps citable page-text counts separate from document-extraction counts. Contract coaching uses the extracted fact rows it describes, while page-text evidence continues to use the governed coverage read. This prevents one row type from being presented as another when both are present on the same page.

## Layer Impact

- **Release lane: `global-control-lane`.** The Source presentation rule applies across clients that use the contract workspace.
- **Layer 4, Source projection:** Changes count selection and rendering input for the contract workspace. The canonical facts, adapters, and underlying rows are unchanged.

## Client Applicability

- All clients: Source contract workspaces that load document detail.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Source availability controls apply; no new flag.

## Changes Included

- Preserve `document_page_text_rows` from the governed coverage read rather than replacing it with the length of document extractions during contract-detail hydration.
- Use the same document-extraction row read for contract coaching that the document evidence panel counts.
- Add differing-population regression cases for the contract workspace.
- Refresh the CI test coverage census to match the current test tree.

## QA / Validation

- Full affected workspace test directory: 37 suites and 343 tests passed.
- TypeScript `tsc --noEmit` with the repository's 8 GiB Node heap: exit 0.
- ESLint on changed files: exit 0.
- Mutation checks: substituting extraction length back into page-text coverage and substituting page-text coverage into contract coaching each caused the corresponding behavior test to fail.
- Library orphan audit: no change against baseline. Test coverage census write/check: passed.
- `release:check`: all 11 gates passed. PR checks remain to be recorded before merge.

## Rollout Plan

Merge through a squash PR. The repository-owned ACA main deploy workflow builds and deploys the merged SHA. No data job, migration, or manual tenant write is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None in this change.
- Approved image digest: Determined by the repo-owned deploy workflow after merge.
- ACA runtime invariant: Verify template, active 100% revision, and required worker images against the approved digest after deploy.
- Worker image invariant: Required; no worker code changes.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, before any `live-proven` claim.

## Rollback Plan

Revert the squash commit through a PR and deploy that revert through the main workflow. No schema or data rollback is needed.

## Audit Evidence

- This release record, changed-file diff, affected test output, TypeScript and ESLint exits, mutation results, PR checks, and eventual repo-owned deploy proof.

## Known Gaps

- `opportunity_rows` has differing producer definitions across read paths; this release does not choose an authority or change that count. The decision requires separate measurement before changing its consumers.
- The Source page has not been verified in a signed-in session on the deployed SHA.
- Open PRs #7685 and #7614 overlap the workspace files; rebase and inspect those diffs before merge.

# 2026-10-12 — Current-source test census reconciliation

## Release ID

`2026-10-12-test-census-source-reconciliation`

## Status

`candidate`

## Plain-English Summary

Regenerate the test coverage inventory from the integrated source tree. An already committed component test is reached by an existing CI directory sweep, but the committed generated inventory retained the previous totals. This change records the actual test sources and their existing CI coverage.

## Layer Impact

- Release lane: `internal-admin`.
- Layers 1, 2 and 3: no intake, adapter, identity, permission or canonical data changes.
- Layer 4: no product code changes. The generated engineering audit artifact is reconciled with committed sources.

## Client Applicability

- All clients: no product or data behavior change.
- Specific clients: none.
- Internal only: engineering coverage inventory and release evidence.
- Public/demo only: none.
- Feature flag: no flag or enrollment change.

## Changes Included

- Genuine regeneration of `docs/architecture/test-ci-coverage-census.json` from current integrated source. After the real predecessor landed, this PR has no remaining census diff and retains the source-audit control record only.
- The earlier audit established 3,012 test files and 2,847 covered files rather than the stale committed 3,011 / 2,846. The genuine predecessor added one test and landed actual 3,013 / 2,848. Regeneration on `691a1b4337c3916038495ad3a6e491a46ab4dd40` matches those current totals. No test file, CI invocation, quarantine or threshold is added or changed by this PR.
- The previously committed `src/components/tower/command-center/views/__tests__/story-copy-boundaries.test.tsx` is covered by its existing component-directory sweep.
- Controlled current-source audit of the prior authentication repair: all 21 prior candidate files have identical committed blobs on the audited main source. The regenerated census difference is recorded separately.

## QA / Validation

- Pass: complete Node 24.19 current-source behavior gate on `e4863a6ca6a06d54bcc62911715ae7bdb5639f56`: 214 suites / 2,253 tests. Lines and statements 90.01%, functions 71.96%, branches 72.79%. Existing thresholds and exclusions are unchanged.
- Pass: every one of the 90 required catalog run commands on the same source, including all 246 Programs suites / 3,860 tests and both named native-access/origination contracts / 9 tests.
- Pass: all four changed authentication and tenancy suites / 50 tests. Ordinary-session, unavailable-profile, exact-actor, permission and reconciliation cases remain covered.
- Pass: Node 24 typecheck; ESLint for all 18 changed TypeScript/test files; library-orphan, route and export reachability checks with no new findings; all 19 export-resolver tests.
- Pass: genuine tenancy and manual regeneration with no diff, followed by their checks; tenancy checker includes 15 tests.
- Pass: genuine census regeneration from the clean test tree. The transient behavior probe is absent from the persistent artifact.
- Fail, interim: the first release-control run correctly refused an uncommitted census edit without a release record. Pass: after adding this controlled record, all 11 release-control gates ran and passed on the final candidate.
- Fail, supplementary: a broad full-auth sweep has ten failures in five pre-existing quarantined suites. The exact same ten cases reproduce on pre-repair source `087c997f377ab8b65801661879b0d30f5b1b7043`; no new failing case, quarantine or threshold change.
- Mutation: no executable code changes in this PR. The earlier repair's 14 killed semantic mutants remain applicable because its executable source blobs are unchanged.
- Visual: no component or layout change; browser and runtime acceptance remain unverified by this source-only audit.

## Rollout Plan

Publish the remaining source-audit release record through a controlled PR with complete current-head CI and an immediate actual-scope fetched-ref census check. The real predecessor already corrected the generated artifact; this PR no longer changes it. No runtime or data rollout is introduced by this documentation-only correction. Any shared runtime release remains owned by the repository main deployment workflow. Runtime acceptance of the earlier authentication repair remains separate from this source audit.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none.
- Approved image digest: not changed by this PR.
- ACA and worker image invariant: verified independently by the runtime owner before live acceptance of the earlier repair.
- Feature/env flag update path: no changes.
- Live signed-in proof required: current-source test results do not establish actor, membership, origination, approval or financial acceptance.

## Rollback Plan

If the generated artifact becomes stale again, regenerate it from the actual new source and submit the result through another controlled PR. Do not replace computed totals by hand or restore a stale count. No data rollback applies.

## Audit Evidence

The exact audited source revision, complete local gate logs, genuine generation diff, PR head and current-head CI are preserved by the owning workstream. Predecessor preflight and merge-sequence receipts remain preserved privately; this post-merge audit does not replace them. Runtime identities and private evidence remain outside the public repository.

## Known Gaps

Exact new-head CI and the final actual-scope release guard are required before merge. The pre-predecessor candidate passed all 35 workflows and all 19 required contexts; that earlier-head credit is historical after the actual-main merge. No live account reconciliation, Move creation, seed load, ROM approval, financial acceptance or browser acceptance is claimed by this source correction. The supplementary full-auth sweep retains ten failures in five pre-existing quarantined suites; all ten reproduce on the unchanged pre-repair main source, with no new failing cases. The existing quarantine is unchanged.

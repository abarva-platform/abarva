# Context Admission Completion

## Release ID

`2026-10-17-context-admission-completion`

## Status

candidate

## Plain-English Summary

Complete a non-serving admission rehearsal with explicit business relationship types, deny-on-unknown access lineage, retained document citation metadata and stricter graph shadow comparison. This is engineering validation, not a tenant refresh or product launch.

## Layer Impact

- Release lane: `client-data-lane`.
- Layer 1: no source templates, registry bindings or private intake changed by this release.
- Layer 2: the offline candidate adapter preserves access revision dependencies and validated citation sidecars.
- Layer 3: test-only relationship/schema drafts and shadow contracts validate declared business links and evidence drift in disposable Postgres.
- Layer 4: no product route, reader, model prompt, data selection or metric changes.

## Client Applicability

- All clients: no automatic behavioral or data change.
- Specific clients: none activated.
- Internal only: offline admission and disposable test tooling.
- Public/demo only: generic fictional test fixture.
- Feature flag: none enabled or changed.

## Changes Included

Explicit six-predicate admission map, unknown/deny access fingerprints across canonical families, document sidecar roundtrip, disposable source-record metadata retention, V6 shadow v2 evidence comparison, focused tests and the existing disposable-Postgres workflow test inventory.

## QA / Validation

- Pass: 123 pure adapter, manifest, policy, access and shadow contract tests.
- Pass: 256 focused deterministic rule and strict readiness tests.
- Pass: five generic local Postgres 18 physical tests with independent raw-byte/SQL readback, RLS, foreign keys, replay and shadow checks.
- Pass: Home ratchet at existing baseline, no movement; corpus governance with existing approval warnings retained.
- Pass: typecheck, focused lint, all 11 release gates and independent final code review.
- Pending: exact-head CI including Postgres 16, merge and runtime invariant. Results remain in the PR/release proof rather than being presumed from local tests.

## Rollout Plan

Open a public-safe PR, validate the exact head and squash merge. Only the repo-owned ACA main workflow may build and update shared runtime images. No SQL draft is placed in a migration directory, no active manifest is added, and no private load, index, serving or product adoption follows from this merge.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: supplied by the successful main deploy artifact, not a mutable tag.
- ACA runtime invariant: independently read back template and 100%-traffic revision against that digest.
- Worker image invariant: verify every required worker against the same approved digest.
- Feature/env flag update path: none required or authorized by this change.
- Live signed-in proof required: not applicable to activation; no product path or data is changed. No live UI or data-readiness claim is made.

## Rollback Plan

Revert the PR through a new PR and the approved ACA main workflow if tooling regresses. No production schema/data rollback is required because this release applies no shared migration or private data mutation. Preserve independent proof artifacts and immutable prior packages.

## Audit Evidence

Inspect the semantic map, acceptance document, test-only SQL draft, pure tests, generic physical workflow and exact-head CI. Private producer repair and independent data-quality receipts remain private and are not data-admission approval.

## Known Gaps

Human source authority/access ratification and an approved exact-version private manifest/load remain separate gates. Private persistence, indexing, retrieval, cite-render proof, serving and product adoption are not performed. Generic test success does not establish enterprise facts, realized value or graph readiness.

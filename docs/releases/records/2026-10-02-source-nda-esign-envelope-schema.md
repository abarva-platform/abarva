# 2026-10-02-source-nda-esign-envelope-schema — Governed envelope storage contract

## Release ID

`2026-10-02-source-nda-esign-envelope-schema`

## Status

`candidate`

## Plain-English Summary

Authors a tenant- and event-fenced record for NDA signing-service envelopes. It links each envelope to a canonical supplier, an accepted event candidate, and an applicable Legal-published template. A completed envelope must carry immutable signed-document and completion-certificate references with hashes. An envelope is workflow state, not executed-NDA approval or coverage.

## Layer Impact

- Release lane: `client-data-lane`.
- Layer 3 Canonical Model: adds a governed envelope relation with foreign keys, state checks, rewrite protection and row-level security. It does not insert tenant rows.
- Layer 4 Products: no route uses the relation yet; the existing upload path is unchanged.

## Client Applicability

- All clients: schema becomes available only after a separately authorized migration apply.
- Specific clients: none.
- Internal only: no direct user surface.
- Public/demo only: demo envelopes are constrained to the declared lab tenant.
- Feature flag: off; no caller exists in this release.

## Changes Included

- Author-only `20261002172500_source_nda_esign_envelopes.sql`.
- Focused storage-contract test in the existing Source integration suite.
- No migration apply, provider call, email, envelope row, or executed NDA.

## QA / Validation

- Red-first missing-migration test, then three passing contract cases.
- Mutation changing accepted-candidate validation to draft turned the identity test red; validation was restored.
- Destructive-pattern scan, TypeScript, lint, release checks and CI outcomes are recorded with the PR.
- SQL was not applied to a database in this change; runtime constraint behavior remains unproven until authorized apply and readback.

## Rollout Plan

Merge the author-only migration through a PR. Do not apply it until the operator separately authorizes this exact file and the repo-owned migration workflow confirms no additional pending migrations.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` for code release only.
- Shared runtime mutators: none in this change.
- Approved image digest: determined by the main workflow.
- ACA runtime invariant: verify template, 100%-traffic revision and worker digests after code deployment.
- Worker image invariant: match the approved digest.
- Feature/env flag update path: separate reviewed change.
- Live signed-in proof required: later send/completion slice after authorized migration apply.

## Rollback Plan

Before apply, revert this PR. After apply, stop callers and preserve any envelope/audit rows; use a reviewed forward migration rather than destructive rollback.

## Audit Evidence

- PR, local and CI test logs, migration status run and separately authorized apply/readback when available.

## Known Gaps

No applied schema, send route, provider adapter, verified webhook, document filing or executed-NDA authority write is claimed.

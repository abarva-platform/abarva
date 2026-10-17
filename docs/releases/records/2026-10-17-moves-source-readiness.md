# 2026-10-17-moves-source-readiness — complete exact source admission

## Release ID
`2026-10-17-moves-source-readiness`

## Status
`candidate`

## Plain-English Summary
Reviewed evidence and saved phase answers could be inspected but their preparation path could not index them or produce canonical readiness. This release adds separate operator stages for indexing, citation-proof validation and readiness, so document generation can use sources only after their exact versions pass the full existing admission contract.

## Layer Impact
Release lanes: `internal-admin` and `global-control-lane`, with exact operations restricted to declared synthetic inputs.
- Layer 2: exact source bytes, current reviews and authoritative operator identity are verified.
- Layer 3: immutable source chunks enter the tenant-scoped search namespace; canonical readiness is inserted only after index and browser citation proof. Native source and phase records are unchanged.
- Layer 4: the signed-in citation proof accepts the same authenticated person mapping as normal tenancy. Generation retains its validated-context gate.

## Client Applicability
- All clients: authenticated source proof identity handling only.
- Specific clients: no automatic index or readiness mutations.
- Internal only: private operator stages, exact load approval and digest-pinned execution.
- Public/demo only: source preparation remains limited to registry-declared synthetic tenants.
- Feature flag: explicit apply plus verified delegated approval for the exact Move, source set, count and release record.

## Changes Included
Serialized exact-source index adapter, readiness proof contract, ACA operator entry and authoritative identity verification. Saved phase answers use the exact selected-row revision contract of the evidence consumer, an authenticated citation page and an exact JSON snapshot download. The existing phase scope remains unchanged. Citation inspection tolerates an existing readiness row only when its native binding is unchanged. Cohorts support up to 32 exact sources.

## QA / Validation
PASS: 139 targeted source preparation, saved-answer scope, identity, broker, admission, delegation and route tests. TypeScript, scoped ESLint and all release checks must pass before merge. NOT RUN: live operator execution, signed-in original downloads and citation rendering, final admission readback and blocked-document regeneration.

## Rollout Plan
Merge by PR, deploy through the repo-owned main workflow, verify runtime invariants, then run plan, index, promote and independent verify stages through the standard ACA operator wrapper. The index writer holds a shared source-namespace advisory lock and native source row locks, validates the exact approved plan, records per-document creation receipts, verifies complete index content and rechecks native versions. A readiness stage separately checks actual signed-in render/download receipts and the prior index proof before inserting absent canonical rows.

## Deployment Authority
- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: that workflow only.
- Approved image digest: retained with the successful main deployment evidence.
- ACA runtime invariant: web template and healthy 100% traffic revision match the approved digest.
- Worker image invariant: both required delivery workers match the same digest.
- Feature/env flag update path: no shared web flags; operator execution overrides only.
- Live signed-in proof required: exact retrieved quote, locator, original bytes and visible rendering for every eligible source.

## Rollback Plan
No index documents are automatically deleted. New chunks remain `not_reviewed` and excluded from ordinary corpus retrieval; a failed or interrupted run grants no canonical readiness. Canonical inserts are transactional and never overwrite an existing readiness row. After promotion, a separately approved rollback must quarantine only rows with the exact run and native source binding, retaining their proof and original source history. A changed source automatically fails admission until reverified. No phase or gate rollback is involved.

## Audit Evidence
PR and release checks, deployment and runtime invariant, private exact cohort and approval proofs, source/Blob hashes, index receipts and readback, signed-in screenshots and render/download receipts, canonical policy validation, final consumer admission diagnostics and operator idle restoration.

## Known Gaps
Synthetic readiness proves source fidelity and retrievability; it does not establish production controls, client attestation, measured benefits or Finance approval. No real-client ingestion capability is released here.

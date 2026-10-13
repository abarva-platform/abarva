# Moves chat and native evidence admission

## Release ID

`2026-10-12-moves-chat-evidence-admission`

## Status

`candidate`

## Plain-English Summary

Moves chat and native deliverable assembly now check recorded canonical readiness
before using stored source content. Approval alone does not grant model access.
Missing, unreadable, unbound, stale and policy-blocked proof are distinct states.
Admitted content and citations retain their existing presentation.

The chat ledger uses the resolved viewed phase. Native generation checks saved
capture, ledger, current reviewed upload and exact signed prior-artifact sources
before citation packing. With no admitted evidence, it blocks before public
research, planning, architecture, document generation or persistence. Raw queued
decision/predecessor/option narratives are excluded from Move model inputs; their
source content must enter through the admitted evidence path.

## Layer Impact

- Layer 3: reads existing objects, reviews, source versions and canonical readiness.
  It creates no stored records, readiness, indexing or citation proof.
- Layer 4: narrows model context in existing Move chat and generation paths.
- Release lane: `global-control-lane`.

## Client Applicability

- All clients: existing Move evidence consumers, with no tenant exceptions.
- Internal only: no.
- Public/demo only: no.
- Feature flag: an admission check on existing consumers; no new product surface.
- Other generation modules retain their existing path.

## Changes Included

- Shared read-only admission uses `buildValidatedAgentContextBundle` with
  `requireAgentReady: true` and recorded policy, index and cite-render proof.
- Reviewed uploads bind the declared evidence/review/source-artifact identities,
  scope, phase, version, original byte hash and current approved extraction.
- Saved captures, ledger entries and signed prior artifacts bind their exact
  stored content and approved version. Retrieved chunks without a declared native
  origin/admission remain excluded from this scoped Move path.
- Focused consumer, reader, route, native assembly and service regressions.

## Proposed Provenance Binding Contract

The existing readiness table identity remains `object_table`, `object_id`,
canonical `client_key` and `tenant_id`. Existing policy fields and provenance are
validated by the canonical schema. The consumer separately requires the following
explicit key inside the existing flexible provenance JSON; it does not synthesize
this key or readiness:

`provenance.move_source_binding` contains `version: 1`, `move_id`, `phase` and
`source_revision_sha256`. Uploaded evidence also requires `source_artifact_id`,
`source_artifact_version`, `source_blob_sha256`, `review_id`, `review_updated_at`
and `reviewed_extraction_sha256`, matched to the current stored rows.

`source_revision_sha256` uses SHA-256 over UTF-8 `JSON.stringify` bytes after
recursive object-key sorting by JavaScript binary string comparison. Array order
is retained; valid Date values become ISO timestamps. Uploads project the exact
column lists declared in `move-agent-admission.ts`, normalize selected `_at`
fields to ISO, and hash `{ evidence, review, artifact }`. The extraction hash uses
the existing normalized reviewed-extraction contract. These are explicit consumer
digests, not a claim about database physical bytes or another ledger's encoding.

For capture and ledger sources, the digest covers the selected stored row. For a
prior artifact it covers the artifact row, exact approved version links and
matching approval pointers. Recorded `provenance.source_file` must match the
explicit Blob path or declared table/object locator. Index, cite-render and policy
validation timestamps must cover the current source/review revision. Missing
binding is unbound; a verified differing binding or older proof is stale.

## QA / Validation

- PASS: nine focused suites, 158 tests, including the worker import boundary.
- PASS: 14 behavioral mutations killed; original bytes restored and tests pass.
- PASS: changed-file lint with zero warnings, no new library/route/export orphans,
  19 export-audit tests, five static corpus checks and census reconciliation.
- Census: 3023 to 3025 suites, 2858 to 2860 PR-covered; exactly two new covered suites.
- PASS: full typecheck, including the changed test files, with zero errors.
- PASS: all 11 release gates against the declared base; exact final-head receipt
  is retained in the private local validation bundle.
- No model, database, operator or shared runtime operation was performed.

## Rollout Plan

Review the exact local candidate, then use the protected-main PR and squash-merge
lane. Only the repository-owned main deployment workflow publishes to shared
runtime. This consumer candidate includes no data migration or readiness promotion.
Actual ready-source availability needs its own bounded operator proof and review.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: that workflow only; no local deploy or dispatch.
- Approved image digest: not assigned to this local candidate.
- ACA invariant: template and 100% traffic revision match the approved digest.
- Worker invariant: all required worker jobs match that digest.
- Feature/env update: none.
- Live signed-in proof: phase/client/Move fencing, actual source-version admission,
  preserved citations, honest unavailable states and no model bypass on deployed code.

## Rollback Plan

Revert through a PR and the main deploy workflow. No stored source or readiness
needs reversal. The prior direct evidence path is not proof that unadmitted sources
are safe for model access.

## Audit Evidence

Inspect the exact diff, source-column and binding contract, mocked regressions,
mutation receipt, test census and local validation receipt. Publication/runtime
proof must be recorded separately after release.

## Known Gaps

- Existing approvals may lack canonical index/cite proof or the explicit source
  binding. They remain visible in the cabinet and excluded from model evidence.
- A complete scoped producer for new native revision/index/cite proof is not
  included. A broad conservative readiness backfill cannot grant admission.
- Excluded raw option/predecessor context may reduce generation completeness until
  the exact source is admitted; an unrelated admitted source cannot unlock it.
- Separate assumption-register, approved-public-source, value-model and measurement
  contracts retain their existing controls. This candidate does not certify every
  model-context path or change their readiness production.
- No deployment, signed-in candidate proof or actual model question was performed.

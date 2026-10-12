# Reviewed Integrated Insight Admission

## Release ID

`2026-10-12-home-integrated-insight-admission`

## Status

`candidate`

## Plain-English Summary

Completes a gated path from deterministic insight candidates into the common Home record.
Private operator jobs require an exact human review, earned agent readiness and a matching
serving approval. Candidate storage is unchanged. Existing records and retired assessments
are not activated by this release.

## Layer Impact

Release lane: `client-data-lane`.

- Layer 3: read-only canonical input verification; no canonical facts or relationships change.
- Layer 4: additive, tenant-fenced admission of reviewed findings into the common Home reader.
- Governance: immutable review receipts, exact record/version binding and existing policy gates.
- Operations: bounded private ACA refresh and admission jobs with independent readback proofs.

## Client Applicability

- All clients: reusable reader and operator code, dormant without an exact admission.
- Specific clients: no new tenant data or approval is included in this release.
- Internal only: private review and refresh operations.
- Public/demo only: no new public route or synthetic fact promotion.
- Feature flag: no active dataset, tenant flag or assessment pointer changes.

## Changes Included

The Home insight review contract, additive admission table and serving view, private admission
job, explicit refresh orchestrator, common-reader integration and equality-token versioning.
The existing chapter, advisor citation and walkthrough export paths consume the same enriched
bundle. Each finding belongs to one chapter; caveats and source references remain attached.

## QA / Validation

- PASS: 31 focused suites / 351 tests for insight admission, Home readers, advisor, exports,
  tenant fences and canvas behavior.
- PASS: 63 deterministic and disposable Postgres tests, including both real migrations,
  immutable receipts, exact candidate content, independent admission readback and RLS.
- PASS: real Home selection/retirement/tenant-fence proof against two disposable Postgres
  tenants. The workflow trigger list now includes the reader's new policy dependencies.
- PASS: existing synthetic v1/v2 canonical loads, pre-projection tamper readback,
  Home projection and 20 promotion/retirement checks against a disposable database.
  Both physical-admission and tenant-fence dependency trigger contracts are retained.
- PASS: Home ratchet 749/777, 12 baselined suites, no movement; no baseline rewrite.
- PASS: Node 24 TypeScript with an 8 GiB heap and changed-file ESLint. The default 4 GiB
  TypeScript run exhausted memory before the successful full rerun.
- PASS: local 26-page fixture PDF retained all 51 published claims in extracted text.
- NOT-RUN: private production admission, refresh, retrieval and signed-in insight-serving proof.

## Rollout Plan

Protected PR and squash merge, then only the repo-owned ACA main deploy workflow. Apply only
the named additive migration in the private ACA Job lane. A separate exact-version load,
human review receipt, serving approval and private admission job are required. Upstream
load completion alone never changes what Home shows. Re-run the explicit refresh command
for a committed approved version; changed versions stop instead of reusing approval.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none; data builds use the existing private operator wrapper.
- Approved image digest: recorded from the successful ACA main deployment before job execution.
- ACA runtime invariant: web template and 100% traffic revision must match the approved digest.
- Worker image invariant: required worker images must match the same approved digest.
- ACR build policy: Premium SKU, Buildx and GitHub Actions cache remain unchanged.
- Feature/env flag update path: none; no shared runtime flags or traffic are changed locally.
- Live signed-in proof required: affected Home views, advisor citations and export after admission.

## Rollback Plan

Stop admission jobs or revoke the version's committed serving approval. A later image without
that approval refuses the admission. Revert code through a PR if needed. Preserve candidate,
admission and canonical rows for audit; no destructive down migration is part of rollback.

## Audit Evidence

PR and CI, disposable database migration/readback/RLS tests, immutable review proof hash,
private job proof URIs, independent readback, idle restoration and signed-in serving proof.
Tenant-specific results stay in private storage, not this public release record.

## Known Gaps

No tenant refresh is authorized by this code release. A coherent active Home record is a
precondition, not something the admission job manufactures. Cross-assessment identities need
declared mappings, never name-based joins. Upstream workstream completion is not an automatic
event trigger; the private refresh invocation remains explicit and exact-version-bound.
Full PDF visual parity and general advisor semantic quality remain separate work.

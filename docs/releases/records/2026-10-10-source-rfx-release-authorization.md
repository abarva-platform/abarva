# 2026-10-10-source-rfx-release-authorization - Prepared package release authorization

## Release ID

`2026-10-10-source-rfx-release-authorization`

## Status

`candidate`

## Plain-English Summary

A named operator can authorize the release of one prepared RFx package version. The decision is bound to the stored snapshot hash and current source authorities, including the frozen executed-NDA document hash. Authorization does not send an invitation, grant supplier access, or establish receipt.

## Layer Impact

- Release lane: `client-data-lane`.
- Layer 3, canonical model: an append-only, tenant-scoped authorization decision refers to a prepared package version and rechecks its artifact, supplier contact policy, named contact, and NDA or waiver authority at insert using the database clock.
- Layer 4, Source: an authenticated operator route records the decision and reads its exact-version status. No supplier-facing route or email is included.

## Client Applicability

- All clients: code is present but the write fails closed until the migration is separately authorized and applied.
- Specific clients: none.
- Internal only: named Source stage approvers may call the route after rollout.
- Public/demo only: no.
- Feature flag: none; unavailable schema blocks writes.

## Changes Included

- `supabase/migrations/20261010150000_source_event_rfx_release_authorization.sql`
- `src/lib/source/rfx-delivery/authorize-prepared-package-version.ts`
- `src/lib/source/rfx-delivery/release-authorization-repository.ts`
- `src/app/api/v1/source/[eventId]/rfx-release/authorize/route.ts` (operator write and readback)
- `src/lib/source/rfx-delivery/release-snapshot.ts` and `source-backed-preview.ts` freeze and verify the executed-NDA document hash for new prepared versions.
- Focused behavior tests in the existing RFx suites.

## QA / Validation

- PASS: red-first writer, route, NDA-hash, and source-backed preview tests, then focused Jest suites.
- PASS: tenant-scoped authorization readback tests distinguish missing from unavailable evidence.
- PASS: TypeScript typecheck, targeted ESLint, and migration seal check.
- PASS: release gate (11 of 11), CI coverage census, tenancy-fence census, and product-reachability orphan audit.
- NOT RUN: SQL has not been applied to a database in this candidate; data-plane behavior requires an authorized apply and readback.

## Rollout Plan

Squash-merge after applicable CI passes. The repo-owned ACA main deploy may publish the route, which remains unavailable until a separately authorized migration apply. Do not release or deliver a package as part of deployment. A later portal handoff must bind supplier access to this authorization and the exact package version.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none in this change.
- Approved image digest: determined by the main deploy workflow, not this record.
- ACA runtime invariant: template, 100% revision and workers must be checked before a deployed claim.
- Worker image invariant: no worker change; verify required workers with the release.
- Feature/env flag update path: none.
- Live signed-in proof required: named operator refusal before migration; authorization/readback only after a separately authorized migration and explicit test decision.

## Rollback Plan

Revert the route and writer through a PR if needed. The new table is append-only; do not drop or rewrite authorization evidence as an automatic rollback. A data-plane rollback requires a separate reviewed plan.

## Audit Evidence

The PR, CI results, deployment run, and any future migration audit artifact and signed-in readback are separate evidence. This record does not claim a database apply, external delivery, or supplier receipt.

## Known Gaps

- The migration is authored only and needs exact authorization before apply.
- The supplier portal does not yet serve a release-authorized package or bind an invitation to this version.
- Previously prepared NDA-backed versions without a frozen executed-document hash must be prepared again before authorization.
- Supplier submission and scorecard joins remain separate work.

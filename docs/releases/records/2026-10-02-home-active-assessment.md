# 2026-10-02-home-active-assessment - Explicit Home assessment selection

## Release ID

`2026-10-02-home-active-assessment`

## Status

`candidate`

## Plain-English Summary

Home can select a proved assessment by an explicit tenant-scoped declaration. The schema and reader change alone do not switch any tenant. A separate private operator job checks the source-linked projection, independent proof, serving views, and deterministic business spine before declaring it active.

## Layer Impact

- Release lane: `client-data-lane`.
- Canonical model: no canonical objects or source rows change.
- Products: Home alone reads the declared assessment. Other product assessment selectors are unchanged.
- Data plane: one assessment-selection row may be inserted for the approved synthetic lab tenant after the admission gate passes.

## Client Applicability

- All clients: the inert Home reader fallback and table schema.
- Specific clients: only a tenant explicitly admitted by the private job can switch assessment.
- Internal only: the digest-pinned operator job and its proof.
- Public/demo only: the initial approved synthetic lab admission.
- Feature flag: none; the tenant-scoped declaration is the switch.

## Changes Included

- `supabase/migrations/20261002013000_home_active_assessment.sql`
- `src/lib/home/preview/home-assessment-selection.ts`
- `scripts/ecl/promote_synthetic_enterprise_home.ts`
- `scripts/ecl/retire_synthetic_enterprise_home.ts`
- `.github/workflows/ecl-physical-admission.yml` migration and generated-spine rehearsal.
- Focused selection, proof-contract, and existing Home reader tests.

## QA / Validation

- Focused Home selection, bundle, and enterprise-context tests: 30 passed.
- Serving-view resilience tests: 5 passed. Home ratchet: 808/836, 12 baselined suites, no new failures locally.
- Promotion proof and generated V2 enterprise-spine contract: passed, including count, source-link, scope, and attestation rejection cases.
- Typecheck, focused lint, and release gate: passed locally.
- Migration rehearsal, CI, live admission, and signed-in browser proof: pending.

## Rollout Plan

1. Merge the PR and deploy the exact main SHA through the repo-owned ACA main workflow.
2. Apply the idempotent table migration through the approved digest-pinned private operator job.
3. Confirm the schema is inert: Home still reads the previously selected assessment.
4. Run the proof-bound private job in `check` mode, which writes only an operator proof, then in `promote` mode only if that non-promoting preflight passes.
5. Verify the Home record marker, family counts, source coverage, and executive content in a signed-in browser.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: recorded by the successful main deploy.
- ACA runtime invariant: required before any live claim.
- Worker image invariant: required before any live claim.
- Feature/env flag update path: not used.
- Live signed-in proof required: yes, for the admitted synthetic tenant.

## Rollback Plan

Run the guarded, digest-pinned `ecl:synthetic-enterprise-v2:retire-home-job` private operation with explicit rollback approval and the original projection proof URI. This restores the existing Home fallback assessment without deleting canonical or projection rows. A code rollback uses a new PR and the repo-owned main deploy workflow. The additive table remains in place.

## Audit Evidence

PR, CI, exact-SHA ACA deploy and runtime-invariant output, private migration/admission job logs and Blob proof, plus signed-in Home screenshots are required before marking released.

## Known Gaps

This release does not publish a new executive narrative, change aVa, or update export composition. Those remain separate acceptance gates.

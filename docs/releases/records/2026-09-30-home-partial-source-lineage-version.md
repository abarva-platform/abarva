# 2026-09-30-home-partial-source-lineage-version - Home partial source-lineage version

## Release ID

`2026-09-30-home-partial-source-lineage-version`

## Status

`candidate`

## Plain-English Summary

Home now versions verified source links even while source coverage is incomplete. The page, aVa request, and walkthrough export must agree on that version, so adding or correcting a source link cannot leave an open reader with a stale evidence state. The reader and export also state how many record rows have verified source links and which evidence families remain incomplete.

## Layer Impact

- `global-control-lane`: Home's served reader, aVa version check, evidence label, and export presentation change for all applicable tenants.
- Client intake, source adapters, and canonical records are unchanged. This release reads existing links and writes no tenant data.

## Client Applicability

- All clients: Tenants using the served Home projection.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Home controls only; no new flag.

## Changes Included

- Include the partial verified source-link set in Home's context version and page/export equality marker.
- Refuse aVa answers and exports when verified links change after a reader opens the page.
- Show source-link coverage and incomplete families in the Home rail, aVa's unverified-narrative response, and HTML/PDF walkthrough exports.
- Add regression tests for a link-only change without row or narrative changes.

## QA / Validation

- Focused Home tests: 57 passed across six suites.
- Home ratchet: 764/792 tests, 12 baselined failing suites, no movement.
- TypeScript typecheck, touched-file ESLint, and diff whitespace check passed.
- CI and signed-in browser verification remain required before live-proven status.

## Rollout Plan

Squash merge a reviewed PR to main. Deploy only through the repository-owned ACA main workflow. No migration or data build is included.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside that workflow.
- Approved image digest: Record after deploy.
- ACA runtime invariant: Verify template and healthy 100%-traffic revision match the approved digest.
- Worker image invariant: Verify required worker job images match the approved digest.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, including record source, coverage, and export parity.

## Rollback Plan

Revert through a new reviewed PR and deploy the resulting main image through the ACA main workflow. No tenant data rollback is required.

## Audit Evidence

PR, CI, deploy run, digest invariant, and signed-in browser observations will be recorded in the private completion ledger after rollout.

## Known Gaps

This release does not create missing canonical source links or regenerate the executive narrative. A complete source-set hash and coherent narrative still require a separately governed data build and review. Coverage reports record-row links, not source endorsement of every narrative claim.

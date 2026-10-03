# 2026-10-01-home-source-date-coverage — Registered source dates in Home

## Release ID

`2026-10-01-home-source-date-coverage`

## Status

`candidate`

## Plain-English Summary

Home now distinguishes registered source-file dates from an attested data-current-through date. The date coverage travels with the served record into the page, guarded advisor response, and HTML/PDF walkthrough export. Missing file dates remain visible in the coverage denominator; no date is inferred from narrative generation time.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3: read-only use of existing source-file dates and quality metadata.
- Layer 4: Home record-version metadata and provenance presentation. No canonical or tenant data write.

## Client Applicability

- All clients: Home tenants with an ECL serving projection and dated source-file catalog.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Compute a registered source-date span and dated-file denominator from the scoped source catalog.
- Keep `dataAsOf` unset without independent currency attestation.
- Present the same qualified date label in Home, guarded advisor output, and both walkthrough exports.
- Regress source-date changes against the record token and partial date coverage.

## QA / Validation

- Four focused Home suites: 67 tests passed.
- TypeScript passed with an 8 GB Node heap; touched-file ESLint and Prettier passed.
- `npm run release:check` passed; the Home ratchet held at 771/799 with the same 12 baselined failing suites and no movement.
- A changed registered source date changes the source-catalog hash and record token even when projection rows do not change.

## Rollout Plan

Merge through a PR. Deploy only through the repo-owned ACA main workflow, then confirm the page, advisor, and export agree in a signed-in session. No operator data build or flag change is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this change.
- Approved image digest: determined by the main deploy workflow.
- ACA runtime invariant: verify the web template and 100% traffic revision use the approved digest.
- Worker image invariant: verify both required worker jobs use the same approved digest.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: registered source dates must appear without a data-current-through claim.

## Rollback Plan

Revert the PR and redeploy through the approved main workflow. No tenant data rollback is needed.

## Audit Evidence

- PR checks, focused Home test output, release gate, and signed-in Home/advisor/export readback.

## Known Gaps

- A registered file date is not a data-currency attestation. The underlying record may still have incomplete source quality, row linkage, or mixed narrative provenance.

# 2026-09-30 Home Segment Serving Plan

## Release ID

`2026-09-30-home-segment-serving-plan`

## Status

`candidate`

## Plain-English Summary

A dry-run admission planner now identifies which canonical business-segment records and declared function-to-segment relationships could become source-linked Home rows. It requires an exact tenant and assessment, source-file name and hash, canonical row and native identity, parsed ECL source record, and accepted typed graph edge. Missing or ambiguous matches are withheld with reasons. The existing canonical product fanout also routes segment records to Home. This release does not write a serving projection or change the page.

## Layer Impact

Release lane: `client-data-lane`.

- Layer 1: no intake change; the planner receives expected hashes from a separately governed source-set read.
- Layer 2: no adapter change.
- Layer 3: consumes canonical records and declared typed graph edges without changing them.
- Layer 4: adds a dry-run Home admission plan and corrects the existing product-routing list; no Home read-model write or UI change.

## Client Applicability

- All clients: the pure planner and routing contract are shared.
- Specific clients: no tenant is loaded or promoted.
- Internal only: operator dry-run and tests.
- Public/demo only: no surface change.
- Feature flag: none.

## Changes Included

- Match canonical source coordinates to exactly one accepted ECL source file and parsed source record under the same tenant and assessment.
- Carry only declared `BELONGS_TO_SEGMENT` edges whose source coordinates and evidence key match the canonical function.
- Withhold quarantined, duplicate, unresolved, ambiguous, or unmatched records and relationships rather than inferring membership.
- Keep declared owner-role and financial values distinct from verified person ownership or realized value.
- Withhold non-finite, negative, or out-of-range percentage values from candidate metrics.
- Include canonical business segments in the Home dry-run product fanout.

## QA / Validation

- Focused planner tests: passed, covering accepted rows and planted failures for changed hashes, wrong source identity, non-parsed or duplicate rows, missing/ambiguous/unsupported edges, and quarantined canonical identities.
- Synthetic active-intake fanout dry-run: passed; segment records route to Home and product read-model writes remain zero.
- Typecheck and touched-file lint: passed. PR CI: not-run at record creation.
- No database write, manifest approval, or signed-in segment proof is claimed.

## Rollout Plan

Merge through a protected PR and deploy only through the repo-owned ACA main workflow. The planner remains a candidate generator. A separately approved source-set manifest, digest-pinned ACA Job, source-catalog readback, quality gate, human review, ECL serving producer, and citation proof are required before Home publication.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only for shared web traffic.
- Shared runtime mutators: none in this release.
- Approved image digest: determined by the main deploy run.
- ACA runtime invariant: verify web template, 100%-traffic revision, and required worker jobs after deployment.
- Worker image invariant: must match the approved digest.
- Feature/env flag update path: none.
- Live signed-in proof required: confirm existing Home state remains honestly labelled; do not claim segments are served.

## Rollback Plan

Revert through protected main and the approved deploy workflow. No tenant data or schema reversal is involved.

## Audit Evidence

Inspect the PR, focused tests, synthetic dry-run report, required CI, ACA deploy, and signed-in Home record-state check. A future publication proof bundle is separate.

## Known Gaps

- The planner is not connected to a production source-catalog reader or ECL projection writer.
- Candidate output is not approved for claims, aVa, or export; no segment family is visible in Home.
- The active canonical intake and the currently served ECL assessment are different source sets. Their counts must not be blended into one current narrative.

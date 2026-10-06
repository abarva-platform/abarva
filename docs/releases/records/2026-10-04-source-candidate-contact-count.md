# Source Candidate Contact Count

## Release ID

`2026-10-04-source-candidate-contact-count`

## Status

`candidate`

## Plain-English Summary

The accepted-candidate panel counted contacts copied into a registry payload, while governed supplier contacts are stored separately. Count active contacts from the canonical contact table so a newly loaded contact appears in the panel, and do not call a supplier contact-ready from stale payload data.

## Layer Impact

- Release lane: `global-control-lane` for a read-only Source projection.
- Layer 1 and 2: unchanged.
- Layer 3: read `source.vendor_contact` using the accepted supplier's tenant and vendor identity; no canonical write.
- Layer 4: Stage 04 displays the canonical active-contact count. Event-specific contact approval, supplier approach and NDA coverage remain separate.

## Client Applicability

- All clients: the Stage 04 read model uses canonical active-contact counts when an accepted supplier has contact records.
- Specific clients: none.
- Internal and public/demo: same read-only behavior; no supplier communication.
- Feature flag: none.

## Changes Included

- Add a tenant- and supplier-keyed active contact count to the accepted-candidate read.
- Use that count for the panel number and its contact-presence check; policy `review_required` and `do_not_contact` still block.
- Add positive and stale-payload negative behavior tests.

## QA / Validation

- Red-first tests failed when the canonical contact table was not queried and when stale payload data marked a supplier ready.
- A deliberate restoration of the old payload readiness check failed the negative test; restoring the canonical count returned it to green.
- Focused tests, Node 24 typecheck, scoped lint, release-check and diff check must pass before merge.
- Official runtime and signed-in event readback remain separate post-merge evidence.

## Rollout Plan

Squash merge through PR after applicable CI and review. Only the repo-owned ACA main workflow may update the shared runtime. Verify immutable digest parity for web template, 100%-traffic revision and required workers, then replay the exact signed-in Stage 04 panel. No data job or migration is part of this release.

## Deployment Authority

- Repo-owned workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none in this PR.
- Approved digest: verify after the official main deploy.
- Signed-in proof: compare the panel with a read-only canonical contact count after deployment.

## Rollback Plan

Revert the code through a PR and the official main deploy workflow. No data rows are written by this release.

## Audit Evidence

- The synthetic lab operator proof and an independent read-only database query established four active canonical contacts before this read-model change; the existing Stage 04 UI still displayed zero.
- The exact signed-in replay and deployment evidence must be appended after release, not inferred from tests.

## Known Gaps

- A canonical contact record is not event-specific permission to approach a supplier.
- The separate contact-approval authority, published NDA template, provider send, signed file, and NDA coverage remain unproven by this panel change.

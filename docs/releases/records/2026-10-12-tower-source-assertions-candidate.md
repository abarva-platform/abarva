# 2026-10-12-tower-source-assertions-candidate — Preserve source-stated value fields

## Release ID

`2026-10-12-tower-source-assertions-candidate`

## Status

`candidate`

## Plain-English Summary

Adds an inactive Tower candidate that retains source-reported spend, program, outcome, usage, risk, and contract fields already present in the registered synthetic intake. Declared-ID Foundation rows become individual canonical objects. Approved funding and claimable value remain unknown.

## Layer Impact

Release lane: `client-data-lane`.

- Layer 1: uses the exact existing registered source set; no file or source membership changes.
- Layer 2: maps selected source columns by declared IDs and file-row hashes. Raw relationships and maturity records remain source records, not accepted canonical links or maturity objects.
- Layer 3: adds declared-ID Foundation objects and typed source measures alongside program, outcome, spend, usage, and separate benefit-feed objects. The benefit-feed population is not joined to the separately identified AI use-case intake.
- Layer 4: an inactive projection carries the source-stated fields, caveats, and measure links. No new Foundation page or graph edge is published. Approved and claimable product amount columns remain null.

## Client Applicability

- All clients: no automatic change.
- Specific clients: one registry-selected synthetic tenant may be staged only after a separate exact-version load approval.
- Internal only: candidate build and review.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Adds a versioned candidate mapping while preserving the existing active assessment and earlier candidate variants.
- Retains the program source's expected value separately from its planning budget.
- Retains source-reported spend history, forecast and savings opportunity, program dates and progress, outcome source context, usage periods and events, and risk/contract context without promoting them into an approved headline.
- Retains outcome, benefit, and usage feed Finance-labeled amounts, benefit-feed spend, source promises, and statuses as separate source assertions with record lineage and plain-language caveats. Conflicting feeds remain separate.
- Loads declared-ID Foundation records as individual objects. Raw relationship and maturity rows remain in Layer 2; neither becomes a graph edge or an inferred maturity object. Evidence register content remains excluded because approval is absent.
- Requires full source-to-canonical-to-projection parity for mapped fields and refuses an unsupported claimable or approved amount.
- Adds a manifest with `load_approval` and `serving_approval` null.

## QA / Validation

- Focused candidate and physical-plan tests pass, including altered-source refusal and refusal to stage without exact-version approval.
- The dataset manifest validator passes. The local dry-stage candidate and physical quality gate pass against the unchanged registered source hashes; the dry-stage output records exact row and measure counts and `materialized: false`.
- Focused ESLint, MJS syntax checks, the Tower quote-mode lineage report, and all release-control gates pass. Review the dry-stage candidate fingerprint, source hashes, row and measure counts, source-assertion coverage gate, and approval refusal before any operator job.
- No physical database stage, private Blob proof, deploy, promotion, or signed-in page proof is claimed by this release.

## Rollout Plan

Review the dry candidate and its exact source/version binding. A named exact-version load approval is required before any private ACA stage. Separate independent database and Blob readback, a serving approval, guarded promotion, and signed-in checks would be required before any product use.

## Deployment Authority

- Repo-owned deploy workflow: only `.github/workflows/aca-main-deploy.yml` may change shared web traffic.
- Shared runtime mutators: none in this candidate.
- Approved image digest: capture only if a later governed stage is approved.
- ACA runtime invariant and worker image invariant: verify at any later deployment or stage.
- Feature/env flag update path: none.
- Live signed-in proof required: after a separately approved promotion.

## Rollback Plan

This candidate changes no stored data or active selector. If later staged, preserve the prior active assessment and use the guarded lifecycle rollback only after its own proof and authorization.

## Audit Evidence

The local dry-stage candidate, quality gate, source-field parity checks, and exact source-file hashes are the review evidence. A dry run is not a physical load or serving proof.

## Known Gaps

The source does not supply an approved fiscal-year funding basis. Some feed amounts and statuses conflict, evidence is not approved for loading, and the AI intake lacks a declared identity crosswalk to benefit and usage feeds. Relationship rows lack independent graph evidence and some endpoint IDs; maturity rows lack declared semantic IDs. Foundation rows have no new Layer 4 story yet. Source-stated labels cannot by themselves establish Finance clearance or realized value.

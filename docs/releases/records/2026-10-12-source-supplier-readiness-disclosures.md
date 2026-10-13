# Source Supplier Readiness Disclosures

## Release ID

`2026-10-12-source-supplier-readiness-disclosures`

## Status

Candidate. Local validation is not deployment or signed-in acceptance.

## Plain-English Summary

The supplier workspace brings accepted-panel counts forward and reduces repeated audit prose. Registry matches, acceptance history, source references and NDA review notes remain inspectable through native disclosures. Eligibility, contact restrictions, NDA coverage, blocking reasons and next actions stay visible. An unavailable registry stays expanded and is not described as zero matches.

## Release Lane

`global-control-lane`

## Layer Impact

`global-control-lane`: Layer 4 product presentation only. No intake, adapter, canonical identity, source data, approval, contact, release, or NDA authority is changed.

## Client Applicability

All clients using the existing Source New supplier phase. No feature flag or client-specific data change.

## Changes Included

- Existing supplier/NDA workspace component and stylesheet.
- Existing supplier panel and workspace render suites, already named in the AI surface control catalog workflow.
- No new route, migration, loader, dependency or background job.

## Design Authority

`docs/design/source-end-to-end-redesign-brief.md:52` requires concrete task state with owner and source; line 54 requires evidence-based gates. Disclosures retain audit evidence while prioritizing the current state and action. This advances the on-page intelligence and client-collaboration promises, without changing any evidence gate.

## QA / Validation

- Red-first render assertions: two failures on the unchanged component.
- Eight supplier-workspace suites: 159 passing tests.
- Mutation: deleting acceptance/source content fails the new render assertion.
- Mutation: default-expanding NDA review detail fails the new render assertion.
- Existing acceptance form authority fields and withheld-request tests remain passing.
- TypeScript passes with an 8 GiB heap (the initial default-heap run exhausted memory). Scoped lint and diff checks pass. Release checks and exact-head CI are required before rollout.
- Fresh signed-in pre-change inspection identified repeated audit text. A local generated HTML fixture was not browser-validated because file URL navigation was blocked. Post-deploy signed-in visual validation remains required; no local visual-equivalence claim is made.

## Rollout Plan

Review the exact candidate, squash merge through a PR, then use only `.github/workflows/aca-main-deploy.yml`. Verify the digest-pinned template, healthy 100%-traffic revision, required worker images and live health. Reopen the supplier phase signed in and inspect collapsed/expanded disclosures, visible blockers, form authority and page overflow before claiming live proof.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: that main workflow only.
- Approved image digest: resolve from the successful main workflow; not yet assigned for this candidate.
- ACA runtime invariant: template and single healthy 100%-traffic revision must match the approved digest.
- Worker image invariant: both required delivery workers must match that digest.
- Feature/env flag update path: none.
- Live signed-in proof required: supplier counts, contact restrictions, registry unavailability, NDA blockers and expandable evidence.

## Rollback Plan

Revert this presentation-only release through a reviewed PR and the main ACA workflow. There is no data mutation to undo.

## Audit Evidence

Exact PR/check/deploy references will be recorded separately as they occur. The private readiness review retains route observations and the generated local fixture; it is not a financial-data certification.

## Known Gaps

This release does not supply missing contract evidence, publish an NDA, contact suppliers, release an RFP, establish response completeness, compute commercial value, or certify model citations. Those remain separate governed work.

# Home Advisor Evidence Basis

## Release ID

`2026-10-13-home-advisor-evidence-basis`

## Status

`candidate`

## Plain-English Summary

Preserve the population behind cited supplier-spend shares in advisor answers and keep published interpretation limits visible in briefing exports. Explicit short bullet requests are respected even when the request contains punctuation or evidence-related modifiers.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Home presentation and response validation only.
- No intake, adapter, canonical model, tenant data, financial value, cross-module alignment, security or model-provider changes.

## Client Applicability

- All clients: shared Home advisor and export presentation.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no; synthetic basis remains explicit.
- Feature flag: none added.

## Changes Included

- A bounded validation check detects when a cited supplier-spend concentration acquires an unsupported broader spend denominator. One audited correction is allowed within the existing deadline; unresolved responses are withheld with their source claims retained.
- Financial values are not recalculated or text-replaced. This check is not a general entailment verifier.
- Explicit one-to-four bullet requests accept concise and evidence-related modifiers without widening factual scope.
- Page and export share existing interpretation caveats. Narrative assertions and evidence references remain unchanged; local limitations distinguish modelled leadership references, combined business populations and supplier-spend implications.

## QA / Validation

- Initial regression sweep: 98 advisor tests passed.
- Pass: 62 independent supplier-basis and bullet-request tests, including unrelated citations, named supplier pairs, caveats, explicit exclusions and proposed-scenario boundaries.
- Pass: integrated Home validation, 848 tests across 60 suites.
- Pass: focused lint and controlled-release gates, 11 of 11 executed and passed.
- Independent review closed all five reproduced guard findings using eight mocked full-response checks. This is bounded pattern validation, not a general entailment or live-proof claim.
- Pass: full repository typecheck through the owned Node 24 command.
- Post-release signed-in acceptance remains pending and is reported separately.
- Signed-in acceptance identified the response and export mechanisms being corrected. No post-release acceptance claim is made here.

## Rollout Plan

Publish a public-safe PR against the organization repository after local validation and independent review. Squash merge through protected main after required checks pass. Deploy only through `.github/workflows/aca-main-deploy.yml`.

## Deployment Authority

- Shared runtime mutators: repo-owned ACA main workflow only.
- Approved image digest: resolved from the successful main workflow.
- Runtime invariant: web template, healthy 100%-traffic revision and all owned worker images must match the approved digest.
- Live signed-in proof required: concise advisor answers with cited financial basis, response-linked suggestions, source identity and exported interpretation limitations.

## Rollback Plan

Revert this PR through another protected-main PR and deploy through the main workflow. No data rollback is required.

## Audit Evidence

Local tests and independent review are summarized before publication. Merge, deploy, runtime parity and signed-in acceptance are reported separately. Private browser evidence is not committed to the public repository.

## Known Gaps

General semantic entailment is not established by this bounded check. Full interactive chart/map PDF parity, canonical detail refresh, cross-module reconciliation and unverified discovery approvals remain outside this release.

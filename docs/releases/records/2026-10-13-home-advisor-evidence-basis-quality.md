# Home Advisor Evidence Basis and Executive Readability

## Release ID

`2026-10-13-home-advisor-evidence-basis-quality`

## Status

`candidate`

## Plain-English Summary

Home advisor answers carry the reference-data declaration already present in their selected record. Modelled leadership responses cannot be published as actual testimony, and concern counts cannot be restated as a measure of how many people trust data. Executive answers retain bold business labels and a short next step after the existing safety scrub.

## Layer Impact

Release lane: `global-control-lane`.

- Layers 1-3: no input, canonical-object, source-selection, schema, graph, load or approval changes.
- Layer 4: Home answer generation, its existing bounded correction, and visible answer basis. The declaration comes from the resolved bundle, never a tenant name or inferred identity.
- Existing authorization, full-record token fencing, audited reasoning, source count checks and citation validation remain unchanged.

## Client Applicability

- All clients: existing authorized Home advisor consumers.
- Specific clients: no tenant-specific exception. Reference qualification applies only when the selected bundle explicitly declares reference data.
- Internal only: no new operator capability.
- Public/demo only: no new public access or attestation.
- Feature flag: none added. Other modules' shared chat behavior is unchanged.

## Changes Included

- Pass the existing declared reference basis into Home's prompt and visible answer footer.
- Qualify modelled leadership assertions and reject unsupported trust-population wording through the existing single bounded repair.
- Withhold unsafe prose if correction fails, including responses without citations; supporting citations remain available.
- Consolidate conflicting presentation instructions to at most four default supporting points, rather than silently discarding a fifth point.
- Preserve authored bold business labels only after the complete label and body have been safety-scrubbed.
- Retain one short supported next-step or business-implication sentence alongside structured points.

## QA / Validation

- Seven focused Home answer, API, conversation, mounted chat, shared-dock, list-marker and tenant-name suites: 159 tests passing.
- Full TypeScript and scoped ESLint passed with Node 24. All eleven release controls passed.
- Existing integration workflow suite set: 4,898 tests passing across 180 suites; its existing one-suite/twenty-test skips are preserved.
- Behavioral tests cover declared, false and absent reference basis; successful and failed correction; unsafe no-citation and no-data answers; retained safe formatting; internal-label suppression; and four-point correction.
- Signed-in answer quality remains a post-deployment gate, not a local-test claim.

## Rollout Plan

Protected PR, exact-current-head validation, delegated release review, squash merge, then the repo-owned ACA main deploy workflow. No tenant refresh or serving promotion is included.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: that workflow only.
- Approved image digest: capture from the exact approved main deploy artifact.
- ACA runtime invariant: template and sole 100% traffic-holder revision match the approved digest.
- Worker image invariant: both required workers match the approved digest.
- Feature/env flag update path: none.
- Live signed-in proof required: concise labelled points, qualified reference basis, no unsupported testimony, retained citations, three follow-ups and conversation scroll behavior.

## Rollback Plan

Protected revert through the same main workflow. No data or schema rollback is required.

## Audit Evidence

PR diff, current-head tests and CI, controlled review, official deployment artifact, independent runtime invariant, and private signed-in DOM and screenshot captures. Private proof stays outside the public repository.

## Known Gaps

This repair does not refresh Home data, activate an additional graph or prove full walkthrough/PDF acceptance. Pattern checks do not replace underlying claim entailment. Answers are validated before display rather than token-streamed from unvalidated model JSON.

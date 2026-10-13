# Home Advisor Proposal Admission

## Release ID

`2026-10-13-home-advisor-proposal-admission`

## Status

`candidate`

## Plain-English Summary

Keep an explicitly user-proposed target an assumption throughout Home answer admission and display. Do not reject it merely because nearby prose discusses cited evidence, and do not treat it as a sourced result. Preserve conditional source effects rather than upgrading them to categorical executive conclusions.

## Layer Impact

Layer 4, Products. Release lane: `global-control-lane`. Home answer admission and visible reference qualifications change. Shared claim validation adds a Home-only percentage-proposal classification. Percentage extraction preserves signs for all packets; other surfaces do not acquire the Home proposal exception. No canonical records, financial calculations, loaders, permissions or data builds change.

## Client Applicability

- All clients: Authenticated Home advisor.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing controls remain unchanged.

## Changes Included

- Share numeric-occurrence proposal qualification between Home narrative and packet admission.
- Recognize ordinary target-first wording and connected negated measured-result/savings qualifications.
- Preserve rejection of achieved results, invented figures and a neighboring baseline borrowing a target label.
- Reject a target presented as a recorded baseline, negated proposal markers and malformed percentage units; preserve signed percentage inputs.
- Classify admitted user-proposed percentages as assumptions, with no evidence reference or factual credit.
- Keep requested original-reference limits visible in the answer, including partial and unavailable answers.
- Protect recognized conditional effect language against certainty upgrades using cited source statements.
- Keep unavailable-graph replies concise and on-question without presenting summary excerpts as verified connections.

## QA / Validation

- Fail, before change: Target-first phrasing and connected negative qualifications unnecessarily trigger correction. A valid proposal next to evidence prose fails shared packet admission.
- Pass: 571 affected tests across 30 suites, scoped lint, Node 24 typecheck and all 11 release gates.
- Pass: Independent bounded re-review confirmed reproduced admission defects corrected, with no remaining high-confidence findings.
- Required before merge: Focused and affected tests, typecheck, lint, release checks, independent review and protected CI.
- Required after deployment: Full and short discovery prompts, business overview, cross-domain answers, record-count parity, exhibits, conversation and actual export proof.

## Rollout Plan

Protected squash merge followed by `.github/workflows/aca-main-deploy.yml`. Independently check the exact runtime image, traffic, workers and health before signed-in acceptance.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: That workflow only.
- Approved image digest: Resolve from the exact merge SHA; retain private proof.
- ACA runtime invariant: Template and healthy 100% traffic revision match the approved digest.
- Worker image invariant: All required jobs match.
- Feature/env flag update path: No change.
- Live signed-in proof required: Answer relevance, proposal basis, qualified source effects, citations, exhibits and exports.

## Rollback Plan

Revert through a PR and the same main workflow. No data rollback.

## Audit Evidence

Private production reproduction, regression cases, review, CI, exact-SHA deployment, independent runtime proof and signed-in acceptance.

## Known Gaps

Numerical membership and recognized conditional-effect wording are bounded checks, not general semantic entailment. This release does not refresh data, create original-passage references, verify a canonical graph or complete another module's continuation.

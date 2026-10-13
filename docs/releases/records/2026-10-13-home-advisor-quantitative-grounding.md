# Home Advisor Quantitative Grounding

## Release ID

`2026-10-13-home-advisor-quantitative-grounding`

## Status

`candidate`

## Plain-English Summary

Prevent quantities available only in orientation summaries or unselected datasets from appearing as cited business facts in Home advisor narrative. A number must be present in an admitted cited claim. A user-supplied scenario target remains explicitly proposed and unmeasured locally; it does not become achieved performance.

## Layer Impact

Layer 4, Products: Home advisor answer admission. Release lane: `global-control-lane`. No source data, canonical objects, tenant rows, retrieval permissions, model provider, financial calculations or other products change.

## Client Applicability

- All clients: Authenticated Home advisor.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing controls remain unchanged.

## Changes Included

- Check digit-based quantities, percentages and USD display units against admitted cited statements before publishing narrative.
- Identify the failed quantity constraint to the existing single correction attempt. Retain its original deadline and fail-closed behavior.
- Remove unsupported numerical caveats from correction and recovery paths.
- Do not turn an unsupported whole-family absence assertion into apparent current evidence by substituting a newer count.
- Preserve deterministic count answers and dataset exhibits, which remain separate from model-authored narrative.
- Route explicit business overviews and their follow-ups to business context, including when technology is the active focus. Reinforce preservation of combined subjects and conditional claims without claiming a new semantic entailment validator.
- State the original-reference limit when a question requests source titles or document references: current citations identify published Home claims, not original document passages.
- Apply caveat admission across correction, withholding and recovery; recheck quantities after public formatting so a supplied subset cannot acquire the full inventory count.
- Bind a user-proposed exception to its particular numerical occurrence, preserve signs and recognize USD prefix/suffix display forms.
- Include audited client acquisition in the existing answer deadline; do not start generation after that budget is exhausted.

## QA / Validation

- Fail, before change: Signed-in narrative used a summary-only quantitative fact without a supporting claim or selected exhibit.
- Pass: Focused regressions cover all narrative fields, unknown and uncited claims, orientation-only numbers, percentage/count distinction, proposal/result distinction, display units, failed correction and explicit business-overview routing.
- Pass: 421 affected tests across 22 suites, focused lint and all 11 release checks.
- Pass: Final Node 24 typecheck and independent re-review; 13 targeted read-only probes passed with no remaining high-confidence findings.
- Required before merge: Protected CI.
- Required after deployment: Exact-SHA ACA workflow, independent runtime invariant and signed-in answer/exhibit/export acceptance.

## Rollout Plan

Protected squash merge followed by the repo-owned ACA main deploy workflow. Test full and short discovery questions, cross-domain questions, deterministic counts and an explicit exhibit request in the signed-in product.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: That workflow only.
- Approved image digest: Resolve from the exact merge SHA and retain private proof.
- ACA runtime invariant: Template and healthy 100% traffic revision match the approved digest.
- Worker image invariant: All required worker jobs match.
- Feature/env flag update path: No change.
- Live signed-in proof required: Cited quantities, proposal qualifications, answer relevance, dataset exhibits and exports.

## Rollback Plan

Revert through a PR and the same main workflow. No data rollback.

## Audit Evidence

Private signed-in reproduction, regressions, independent review, PR checks, deployment record and runtime proof.

## Known Gaps

Numerical membership is not semantic entailment: shared numbers do not prove matching subjects, causality or combined-population meaning. This additive check does not establish full source-passage coverage, refresh data, integrate other products or export interactive maps.

# Home Advisor Attestation Intent

## Release ID

`2026-10-13-home-advisor-attestation-intent`

## Status

`candidate`

## Plain-English Summary

Keep business questions on the grounded answer path when they include instructions to distinguish synthetic examples from verified evidence. Only a direct interview-basis request uses the declaration-only shortcut.

Give the existing single correction attempt the specific failed qualification or presentation constraints. Do not relax the guards, add retries or disclose answer content in diagnostic metadata.

## Layer Impact

Layer 4, Products: Home advisor intent routing. Release lane: `global-control-lane`. No tenant rows, source versions, model context permissions or other products change.

## Client Applicability

- All clients: Authenticated Home advisor.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing controls remain unchanged.

## Changes Included

- Require a direct basis request before returning only the record declaration.
- Mixed business/basis questions retain the modelled-material qualification and citation gates on the normal answer path.
- Regressions cover mixed requests and preserve direct-basis behavior.
- The single correction request identifies failed constraints without copying answer text or adding model calls. Its deadline and withholding behavior are unchanged.

## QA / Validation

- Fail, before change: Signed-in mixed request returned only interview-basis copy instead of addressing its business question.
- Pass: 393 affected advisor, route and component tests across 20 suites, focused lint and all 11 release checks.
- Pass: Independent bounded re-review; four concrete edge cases corrected, no remaining findings.
- Pass: Final Node 24 typecheck on the combined main base.
- Not run: Protected CI, exact-SHA ACA deployment, independent runtime invariant and signed-in mixed-request acceptance are required.

## Rollout Plan

Protected squash merge, then repo-owned ACA main workflow. Re-test both the mixed business request and direct interview-basis questions on the signed-in surface.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: That workflow only.
- Approved image digest: Resolve from the exact merge SHA and save in private proof.
- ACA runtime invariant: Template and healthy 100% traffic revision match the approved digest.
- Worker image invariant: All required worker jobs match.
- Feature/env flag update path: No change.
- Live signed-in proof required: Business answers stay relevant, qualification and citations remain intact, and direct attestation requests remain deterministic.

## Rollback Plan

Revert through a PR and the same main workflow. No data rollback.

## Audit Evidence

Private signed-in reproduction, regression tests, independent review, PR checks, deploy record and runtime proof.

## Known Gaps

This is not data refresh, complete source-passage coverage, cross-module integration or full visual export.

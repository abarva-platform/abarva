# 2026-09-23-source-new-demo-decision — Source New demo walkthrough

## Release ID

`2026-09-23-source-new-demo-decision`

## Status

`candidate`

## Plain-English Summary

A signed-in operator can opt into a presentation walkthrough with `?demo=1` and self-acknowledge the visible Source New phases. The acknowledgements exist only in the current browser view. The governed event stage, approval record, sponsor signature, evidence state, and supplier actions do not change.

## Layer Impact

Release lane: `public-demo`. Layer 4 (Products): Source New displays a separate demo rail and read-only previews of later phases. There is no change to intake, adapters, or canonical data.

## Client Applicability

- All clients: The optional, non-persistent presentation view is available on signed-in Source New event pages when explicitly requested.
- Specific clients: None.
- Internal only: No.
- Public/demo only: The walkthrough is for demonstrations; it does not publish data.
- Feature flag: URL opt-in `demo=1`; default remains the governed view.

## Changes Included

- Source New page reads the explicit demo query parameter.
- Source New workspace provides browser-only acknowledgements, phase previews, and a separate demo decision list.
- Mounted behavior tests cover the default-off posture, phase progression, unchanged governed decision trail, and absence of writes.
- No migration or new API route.

## QA / Validation

- Red-first mounted test failed because the demo mode and decision were absent, then passed after implementation.
- 57 mounted workspace tests and 4 page tests pass.
- TypeScript typecheck passes.
- Mutation proof: defaulting demo mode to on makes the default-off behavioral test fail; restoring the default returns it to green.
- CI, deployed runtime proof, and signed-in replay remain pending at candidate time.

## Rollout Plan

Squash-merge the reviewed PR after applicable checks pass. Only the repo-owned ACA main workflow may deploy the digest-pinned image. Verify runtime digest, then repeat the signed-in demo action on a synthetic event. No data build or tenant import is part of rollout.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: None outside that workflow.
- Approved image digest: Pending deployment.
- ACA runtime invariant: Pending deployment.
- Worker image invariant: Pending deployment.
- Feature/env flag update path: None; query opt-in only.
- Live signed-in proof required: Yes, separate from merge and runtime proof.

## Rollback Plan

Revert the PR and redeploy through the repo-owned workflow. Browser-only acknowledgements disappear on refresh and do not require data rollback.

## Audit Evidence

Focused test output, mutation test output, PR checks, ACA runtime-invariant artifact, and signed-in replay notes.

## Known Gaps

This is presentation navigation, not governed self-approval. The event cannot become production-ready through this mode. Only phases represented in Source New are previewed; later sourcing stages remain subject to their governed workflow.

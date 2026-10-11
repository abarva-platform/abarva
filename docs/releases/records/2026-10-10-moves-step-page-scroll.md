# 2026-10-10 — Moves step-page scroll containment

## Release ID

`2026-10-10-moves-step-page-scroll`

## Status

`candidate`

## Plain-English Summary

Long Moves step pages now scroll inside the fixed-height workspace pane. The page's own scroll area keeps work rows and footer actions reachable when the surrounding pane clips overflow.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3: no data, schema, adapter, or loader change.
- Layer 4: the existing Moves step-page CSS module gains vertical scrolling. No gate, approval, record, or phase transition logic changes.

## Client Applicability

- All clients: only clients with the existing Moves step-page flags enabled receive this CSS correction; legacy capture views are unchanged.
- Enrolled client: the synthetic demo tenant currently uses the step-page surface.

## Changes Included

- Make the step-page root the vertical scroll container inside its existing workspace pane.
- Add a browser regression check at phone and desktop widths for reaching an end-of-page action without horizontal overflow.

## QA / Validation

- Focused Chromium browser regression at 390 and 1440 in light and dark: pass.
- Mutation check: removing the scroll rule made the browser regression fail; the rule was restored and the test passed again.
- The signed-in walk now checks that the Root causes row and its end-of-step action can be reached by wheel scrolling at 1440px and 390px; deployed result pending.
- Typecheck and changed-file ESLint: pass.
- Library orphan audit and route/export reachability: pass with no new findings.
- Test coverage census: pass, `coveredTestFiles` remains 2,827 because the browser case was added to an existing suite.
- Tenancy fence census: write and check pass, with no new API route.
- Nexus manual check: pass, no generated change.
- Release gates: pass, all 11 gates.
- Signed-in read-only reachability check after the repo-owned deploy: pending.

## Rollout Plan

Squash merge after CI and the open-PR coverage-count collision check. The repo-owned ACA main deploy workflow updates the shared runtime. Confirm the runtime image invariant and use a signed-in read-only browser walk to verify the work row and footer are reachable at phone and desktop widths.

## Deployment Authority

- Shared web traffic: repo-owned `.github/workflows/aca-main-deploy.yml` only.
- Approved image digest and runtime invariant: established and checked by that workflow.
- Live proof: signed-in read-only browser walk after deploy.

## Rollback Plan

Revert this CSS rule through a release PR if it causes a regression. Saved records, approvals, and gate state remain untouched.

## Audit Evidence

- Pull request, CI, browser regression, mutation result, and post-deploy signed-in observation when available.

## Known Gaps

- The browser regression uses synthetic long content. It cannot prove deployed reachability until the signed-in walk after deploy.
- The broader step-page journey and its governed actions remain separate from this CSS correction.

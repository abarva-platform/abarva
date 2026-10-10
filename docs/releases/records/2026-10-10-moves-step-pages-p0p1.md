# 2026-10-10 Moves P0/P1 step pages

## Release ID

`2026-10-10-moves-step-pages-p0p1`

## Status

`candidate`

## Plain-English Summary

The first two Moves phases gain individual step pages for capture, review and gate actions. The phase address opens the first unfinished step when its enrolled flag is on. The old capture flow remains reachable through the explicit legacy hatch for a signed-in parity walk.

## Layer Impact

Release lane: `experimental`. Product projection: P0 and P1 capture presentation, review provenance and phase routing. Canonical tenant data, source adapters and persistence schema are unchanged. The existing capture autosave is enabled for the flagged P0 step pages; governed gate submission remains the approval path.

## Client Applicability

- All clients: No; flag-off routing stays on the existing capture flow.
- Specific clients: None named in this public record.
- Internal only: No.
- Public/demo only: Enrolled synthetic demo environment.
- Feature flag: `moves_step_pages_p0p1_v1`, with the existing capture and step-page prerequisites.

## Changes Included

Eight capture step pages in phase-owned slots, existing generic gate pages for each phase with the remaining P0 recommendation captured before approval, reviewed text-step records, shared structured business-change editor, charter-basis controls, mounted-view routing census, redirect status message, and sunset ledger update. No migration or new route is included.

## QA / Validation

- Pass: opening Edit leaves the persisted capture intact; Cancel and navigation away leave the saved answer readable, and only Save changes writes a replacement.
- Pass: P0 and P1 host tests confirm the phase address opens the first incomplete step with all pages present and the flag on; the explicit legacy query stays on the capture flow.
- Pass after rebasing onto current main: 6,790 Programs unit tests across 424 suites and 386 focused page, gate, host, text-reader and routing tests across five suites. The mounted P3 Step 3 view remains in routing.
- Pass: fifteen behavior mutations each caused a focused test failure, then were restored, including Edit clearing capture, legacy redirect, and missing flag-on landing.
- Pass: 164 real-component renders across desktop/mobile, light/dark, capture, gate and Edit states; no horizontal overflow at 390px.
- Pass: TypeScript, changed-file lint, orphan and route/export reachability checks.
- Pass: test census rose by exactly two covered files to 2,800; tenancy-fence census checks and generated product manual check passed.
- Pass: Prettier ran on every added or changed file.
- Pass: release check.
- Not run: signed-in product walk; requires the deployed revision and test identity after merge.

## Rollout Plan

Squash merge through a PR. The repo-owned ACA main deploy workflow builds and deploys a digest-pinned image. Only after runtime invariant checks and a signed-in P0/P1 walk may the release be called live-proven. Flag enrollment is limited to the synthetic demo environment.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` after merge.
- Shared runtime mutators: None in this PR.
- Approved image digest: Determined by the deploy workflow; none claimed here.
- ACA runtime invariant: Must be checked after deploy.
- Worker image invariant: Must be checked after deploy.
- Feature/env flag update path: Existing tenant feature registry; no runtime mutation from this PR.
- Live signed-in proof required: Yes, including capture, evidence, basis and gate paths.

## Rollback Plan

Disable `moves_step_pages_p0p1_v1` for the enrolled tenant or revert the PR and deploy through the repo-owned main workflow. Existing capture and gate records remain readable. No schema rollback is needed.

## Audit Evidence

The PR diff, local test and quality-check output, mutation-probe notes, and P0/P1 renders under the brief's `renders/p0p1` directory. Runtime and signed-in evidence are pending deployment.

## Known Gaps

Signed-in parity and the deployed runtime invariant require later verification. Users & Access provisions Move participants but does not currently assign their sponsor role; the direct sponsor-assignment UI path remains open. The legacy flow remains as a hatch until a signed-in walk supports a separate removal PR. The pending P3 Step 4 step-page change requires a final rebase and routing/page-count check before this candidate merges.

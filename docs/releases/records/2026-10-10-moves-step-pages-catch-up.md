# 2026-10-10 — Moves step-page catch-up

## Release ID

`2026-10-10-moves-step-pages-catch-up`

## Status

`candidate`

## Plain-English Summary

When a Move has passed Discover but its root-cause step record still needs a person to confirm a cause or its order, the step pages show that gap with a direct link to the existing Root causes page. The phase bar keeps Done and adds the number to confirm. A blocked Design step names the same action. A bare Move address starts at the first confirmation gap; when none exists, it follows the current phase's normal first-open-step routing. The Root causes read view uses a short name or truncated first sentence, with the full text available by disclosure and in the editor.

The confirmation list is read-only. It does not settle a cause, attach evidence, change gate approval, advance a phase, or write a step record. A passed gate does not prove which earlier interface was used, so the banner states the record confirmation gap without claiming that history.

## Layer Impact

- Release lane: `global-control-lane`, behind a tenant feature flag.
- Layer 3: no schema or data change. The detector reads the existing phase state, gate readback, and saved root-cause register.
- Layer 4: Moves step-page routing, phase bar, next-action copy, and compact root-cause display.

## Client Applicability

- All clients: flag off, existing behavior unchanged.
- Enrolled client: the synthetic demo tenant only.
- Feature flag: `moves_step_pages_catch_up_v1`, in conjunction with the existing capture and step-page flags.

## Changes Included

- Pure catch-up detector and first-item ordering for Discover's root-cause dependency on Design.
- Read-only confirmation banner and action links on Discover and affected Design step pages.
- Phase bar count and compact Root causes read view.
- Bare Move and bare Discover landing through the saved record, with `?legacy=1` retained.
- Synthetic tests and generated manual and test-coverage census updates.

## QA / Validation

- Focused suites: 5 passed, 56 tests passed, including detector, page, routing, and blocked-state cases.
- Mutation checks: 6 behavior-changing mutants applied one at a time and restored; all killed.
- `npm run typecheck`: pass, zero errors.
- ESLint on changed TypeScript/TSX files: pass.
- `npm run audit:lib-orphans`: pass, no new orphans.
- Route and export reachability: pass, no new findings.
- Test CI coverage census: `coveredTestFiles` 2,826 to 2,827 after the concurrent main merge, exactly one new test file.
- Tenancy fence census: unchanged, no new API route; write and check pass.
- Nexus manual: generated and check pass.
- Visual check: real component rendered with the module CSS at 390 and 1440, light and dark. No horizontal overflow; blocked action begins at 604px on mobile.
- `npm run release:check`: pass, all 11 gates.

## Rollout Plan

Merge through a squash PR after local and CI gates pass and the coverage-count collision check clears. The repo-owned ACA main deploy workflow handles the shared runtime. A signed-in, read-only walk must then check the enrolled synthetic Move at Discover and Design. If the cause has already been settled, record the no-catch-up state and rely on synthetic tests for the unsettled variant; do not create live data to force a screenshot.

## Deployment Authority

- Shared web traffic: repo-owned `.github/workflows/aca-main-deploy.yml` only.
- Approved image digest and runtime invariant: established by that workflow and checked after deploy.
- Worker image invariant: checked after deploy.
- Live proof: signed-in read-only browser walk after the approved deploy.

## Rollback Plan

Remove the synthetic tenant from `moves_step_pages_catch_up_v1` in a release PR or revert this change. Saved root-cause records and historic gate state remain untouched.

## Audit Evidence

- Pull request, CI, local focused test and mutation output, and four local synthetic visual renders.
- Post-deploy signed-in screenshots and runtime invariant readback, when available.

## Known Gaps

- The exact interface in which a historic phase was completed is not stored in these readers. The banner describes the gap without asserting that interface.
- The currently proven downstream catch-up dependency is Discover Root causes to Design. Additional cross-phase record dependencies require explicit reader and workflow mapping before they can be listed.
- The live signed-in walk and its UX scorer are pending the repo-owned main deploy. Local renders do not prove deployed behavior.

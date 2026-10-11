# 2026-10-10 — Moves phase bar contrast

## Release ID

`2026-10-10-moves-phase-bar-contrast`

## Status

`candidate`

## Plain-English Summary

Small labels in the Moves phase bar now use readable theme colors directly. The phase bar keeps the same subdued hierarchy while its labels remain legible in light and dark modes.

## Layer Impact

- Release lane: `global-control-lane`.
- Layers 1–3: no intake, adapter, canonical data, schema, or loader change.
- Layer 4: Moves presentation and a read-only browser check only.

## Client Applicability

- All clients using the Moves step page receive the phase bar style correction.
- No client data is changed. The signed-in walk targets a synthetic demo Move.

## Changes Included

- Replace opacity on phase bar status labels with theme color tokens.
- Keep the active phase labels on the active phase ink token.
- Add a focused browser contrast check at desktop and phone widths in both themes.

## QA / Validation

- A signed-in read-only diagnostic on the prior deployment identified the phase bar labels as the dark contrast finding. A temporary token-color probe cleared the finding; the page was restored afterward.
- Focused Chromium checks: pass, 2 tests. The contrast case covers desktop and phone widths in light and dark modes; the scroll case confirms that long content remains reachable.
- Mutation check: restoring the prior opacity values made the contrast case fail; the corrected CSS passed after restoration.
- Temporary Jest rendering of the real step component: pass, 1 test. The temporary file was removed after reviewing 1440px and 390px light/dark renders against the phase bar design.
- Typecheck, changed-file ESLint, library orphan audit, route/export reachability, test coverage census, tenancy fence census, and manual check: pass. No new test file or census delta; `coveredTestFiles` remains 2,830.
- Release gates: pass, all 11 gates.
- The preceding automatic signed-in walk passed 20 of 20 reachable pages with nine later pages not reachable, and measured 89/100 overall UX. The dark contrast deduction remains the gap this change addresses; the next deployed walk must establish its actual score.

## Rollout Plan

Squash merge after current-head CI and the open-PR coverage-count collision check. Only the repo-owned ACA main workflow may update shared web traffic. Verify the deployed digest invariant and repeat the signed-in read-only walk before reporting a live result.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this PR.
- Approved image digest: determined by the main workflow after merge.
- ACA runtime invariant: required from the main workflow proof bundle.
- Worker image invariant: required from the main workflow proof bundle.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert this style change through a release PR. It does not alter records, approvals, or job outputs.

## Audit Evidence

- Pull request diff and current-head CI, focused browser contrast result, main deployment proof, and signed-in walk artifact.

## Known Gaps

- Nine later step pages remain unreachable without governed progression. No governed action is part of this release.
- Settled page load time remains an independent UX deduction.

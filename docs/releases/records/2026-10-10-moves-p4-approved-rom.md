# 2026-10-10 — P4 estimate reads the approved P3 ROM

## Release ID

`2026-10-10-moves-p4-approved-rom`

## Status

`candidate`

## Plain-English Summary

The P4 estimate step now reads the Move's approved P3 rough order of magnitude
(ROM) capture through the authenticated phase capture route. It presents the
stored low, plan and high figure for each release. A missing approval, a stale
approval and an unreadable capture are separate states. A failed read offers
retry and never claims there is no approval.

The workbook action uses the existing read-only ROM preview route with
`?format=xlsx`. Before downloading, the page rereads the P3 approval and
checks today's deterministic preview against every stored approved figure.
If the approval or cost reference has changed, the page stops and asks for a
fresh P3 review.

## Layer Impact

- Release lane: `global-control-lane`, behind the existing tenant step-page and
  ROM flags.
- Layer 3: no data-model, schema, or write-path change. The saved P3 step record
  and its approval fingerprint remain the source for the planning snapshot.
- Layer 4: P4.2 reads the authenticated capture and assumptions projections;
  it does not compute estimate money or change an approval.

## Client Applicability

- All clients: behavior changes only behind the existing feature flags.
- Specific clients: currently enrolled synthetic demo workspaces receive the
  P4.2 read path in place of the temporary empty snapshot stub.
- Flag-off workspaces: unchanged.
- No client-specific figures or records are included in this release.

## Changes Included

- The ROM snapshot reader returns approved, missing, stale or failed as a
  discriminated result. It rejects malformed or redacted reads and a changed
  approval basis.
- P4.2 shows the approved per-release figures and workbook action, with a
  distinct retry on read failure and a P3 link for a stale approval.
- Focused reader and page tests cover each state and workbook refusal.

## QA / Validation

- Focused tests: 2 suites, 25 tests passed (reader and P4/P5 step pages).
- Typecheck: clean. ESLint on changed source and tests: clean.
- Mutation checks: 6 of 6 killed (capture failure, approval fingerprint,
  register drift, redacted figures, workbook preview equality and approval
  reread before download).
- Library orphan audit: no change against baseline. Route reachability: no
  new unreachable components or exports. Export reachability: 19 tests passed
  and exactly the recorded baseline.
- Test coverage census: one new swept test file, covered files 2813 to 2814.
  Tenancy census: unchanged, write and check passed (15 tests). Manual check:
  current. Release check: all 11 gates passed.
- Visual review: rendered the real P4.2 component with its module CSS at 1440
  and 390 in light and dark, inspected the expanded approved basis, and
  measured zero horizontal overflow at both widths. No new CSS or template
  deviations were introduced.

## Rollout Plan

Merge the pull request through protected `main`. The repo-owned ACA main deploy
workflow builds and deploys the approved image digest. The existing flags keep
the step page scoped to enrolled workspaces. Signed-in proof of all four read
states is required before calling this live-proven.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: assigned by the workflow.
- ACA runtime invariant: confirm the web template, serving revision and
  required worker images match the approved digest after deployment.

## Rollback Plan

Disable the step-page flag for an affected tenant or revert this change through
a pull request. The P3 saved approval record is left intact.

## Audit Evidence

- Pull request diff and CI results.
- Focused tests, mutation results and visual render evidence recorded below.

## Known Gaps

- This candidate has local validation only. It has not been deployed or
  inspected in a signed-in browser.
- The P3 estimate approval is persisted inside the `rom_estimate` capture
  record. It is not a separate immutable sign-off record; this change reads
  and verifies that stored step approval rather than creating a new attestation.
- The workbook route recomputes from the current reference pack. The page
  refuses a download if today's preview differs from the approved figures;
  it does not publish an immutable workbook alongside the P3 approval.

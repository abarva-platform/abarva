# 2026-09-30-t786-abarvanav-render — Rewrite the AbarvaNav routing byte scan as a render test and wire it by named file

## Release ID

`2026-09-30-t786-abarvanav-render`

## Status

`candidate`

## Plain-English Summary

`src/components/__tests__/AbarvaNav.client-routing.test.ts` ran in no
continuous-integration job. T-785 held its directory because both suites there
read component source **bytes** instead of exercising the component. This
suite checked that `AbarvaNav.tsx` contained the literal text
`<Link href={href} prefetch` and did not contain `<a href={href}`.

A check like that answers the wrong question. It went red when the `Link`
props were moved onto separate lines, which changes nothing a user sees. It
stayed green when the Login button, the wordmark or a product item's
destination was broken, because none of those changes touch the literal it
greps for.

This change takes the **claimable half** of T-786:

- **The suite is rewritten as a render.** It renders `AbarvaNav` in jsdom.
  `next/link` is replaced by an anchor carrying a marker attribute, so any
  anchor without the marker was rendered by something else — a
  document-reload link, the regression the suite exists to catch. Its 8 cases
  cover:
  - every product nav item for a signed-in admin and a signed-in client is a
    prefetched `next/link` route to the right destination;
  - no anchor in the bar lacks the marker (admin, client, signed out);
  - only the current path's item is marked active;
  - `compact` omits the product items;
  - the signed-out Investor item is a `next/link` route.

  The file keeps its `.ts` path (it uses `createElement`, not JSX), so this
  record supersedes T-785's row under the same path.
- **It is wired by file name** in the unit-suites job, as T-784 did.

`legacy-setup-links.test.ts` stays out. It is still a byte scan, and the only
component it checks is listed as unreachable. Whether to retire it is T-786's
**gated half**, a decision this change does not take.

**What the dark-directory ratchet does now.** It tracks only directories with
nothing covered. Once one file runs, the directory is *partial*, so its line
leaves the baseline and the ratchet stops watching it. The new control takes
over: it pins the directory's on-disk test files to the record.

This change protects future work; it does not repair a break. No product code
changes.

## Layer Impact

**Release lane: `global-control-lane`.** This is shared CI tooling that applies
to every client's build equally, behind no feature gate.

- **Layer 4 (Products):** no product behavior changes. `AbarvaNav.tsx` is not
  edited. Only its test is rewritten.
- **Platform tooling / CI:** one job step, one triage record and one control
  suite are added. The census and dark baseline are updated to match. T-785's
  control is unchanged: it already honours a later record that wires a held
  row.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes. CI coverage only.
- Public/demo only: no
- Feature flag: none

## Changes Included

- `src/components/__tests__/AbarvaNav.client-routing.test.ts`: the byte scan
  (1 case) is replaced by a render suite (8 cases). It no longer imports
  `node:fs`.
- `.github/workflows/unit-suites.yml`: one step, `Run the T-786 AbarvaNav
  render suite by named file`. It uses `--runTestsByPath` with the one file.
- `src/__tests__/behaviors/product-directory-ci-coverage.baseline.json`: the
  directory's line is removed, because the directory is now partial.
- `docs/architecture/t786-abarvanav-render-triage.json`: the record. It has
  one row per file in the directory (two), plus the mutation table below. It
  is dated after T-785's record and supersedes its row for the wired file.
- `src/__tests__/behaviors/t786-abarvanav-render-wiring.test.ts`: the control.
  It has 9 cases and reads every partition out of the record.
- `docs/architecture/test-ci-coverage-census.json`: regenerated with
  `npm run audit:test-ci-coverage:write`.
  - Test files: 2578 → 2579 (the new control).
  - Covered files: 2315 → 2317 (the wired suite plus the control).
  - Uncovered directories: 121 → 120.
  - Partial directories: 30 → 31.

## QA / Validation

**Rewrite, measured by mutation.** Each mutation edits `AbarvaNav.tsx`. Both
the pre-change byte scan and the new suite then run with `--runTestsByPath`,
and the file is restored.

| Mutation | Byte scan (before) | Render (after) |
|---|---|---|
| M1: product item as a plain `<a>`, two spaces | caught | caught |
| M2: product item as a plain `<a>` | caught | caught |
| M3: `prefetch` dropped | caught | caught |
| M4: signed-out Login as a plain `<a>` | missed | caught |
| M5: wordmark as a plain `<a>` | missed | caught |
| M6: Source routes to the wrong destination | missed | caught |
| M7: `compact` ignored | missed | caught |
| M8: Source active state inverted | missed | caught |
| N1 (neutral): `Link` props on separate lines | **false red** | green |

Before the change, 3 of 8 were caught and the neutral reformat failed. After,
8 of 8 are caught and the reformat passes. M2 was confirmed to fail on the
assertion (`nextLink: null` against `"true"`), not on a compile error.

**Control, red first.** With the record and control present but the workflow
and baseline unchanged, 3 of 17 cases fail across the T-786 and T-785
controls. After the change, 0 of 21 fail over those two controls plus the
product-directory ratchet.

**Control mutations.** Each was run over the same 21 cases, then restored.

| Mutation | Result |
|---|---|
| M1: named file replaced by the directory | 2 of 21 fail |
| M2: held scanner added to the step | 2 of 21 fail |
| M3: wired file dropped from the step | 3 of 21 fail |
| M4: dark-baseline line restored | 3 of 21 fail |
| M5: a new test file added beside them | 1 of 21 fails |
| M6: held scanner loses its `node:fs` import | 2 of 21 fail |
| M7: wired suite starts importing `node:fs` | 1 of 21 fails |
| M8: record dated before T-785's | 3 of 21 fail |
| M9: wired subject swapped for a module the suite does not import | 1 of 21 fails |

**Same-scope baseline, base `5df067d041` vs this branch:**

- `npx jest src/__tests__/behaviors`: 165 suites / 1746 tests / 0 failing
  before (as T-785 reported at merge), and 166 / 1755 / 0 after. The delta is
  exactly the new control's 9 cases.
- The wired step's own command: 1 suite / 8 tests / 0 failing.
- `npm run coverage:behavior-gate` exited 0. Lines are 90.12 and functions
  69.42, both unchanged. The control imports only the census script.

**Other checks:**

- `tsc --noEmit` exited 0, judged by its exit code.
- ESLint reported 0 problems on both new files.
- `node scripts/quality/triage-record-census-reconciliation.test.mjs`: 4 of 4
  pass.

## Rollout Plan

Merge to `main` through the repo-owned workflow. There is no runtime rollout:
no image, migration, flag, environment variable or traffic change. The step
becomes active on the next pull request.

## Deployment Authority

Not required. This release cannot affect Azure Container Apps, runtime images,
flags, environment variables, worker jobs, traffic or DNS.

- Repo-owned deploy workflow: not invoked by this change
- Shared runtime mutators: none
- Approved image digest: n/a (no runtime image change)
- ACA runtime invariant: unaffected
- Worker image invariant: unaffected
- Feature/env flag update path: n/a
- Live signed-in proof required: **no**, because no product surface changes

## Rollback Plan

Revert the pull request. That restores all of the following together:

- the byte-scan suite;
- the step's absence;
- the baseline line;
- the previous census.

They are consistent only as a set. There is nothing to unwind in a running
environment.

## Audit Evidence

- The triage record, with per-file run counts, the held row's reason and the
  rewrite's mutation table.
- The control suite and the control-mutation table above.
- Runner proof from the pull request's unit-suites job log: the step's `PASS`
  line and case total. It is recorded in the backlog after the run, not
  inferred from the YAML.

## Known Gaps

- `legacy-setup-links.test.ts` stays unwired until T-786's gated half decides
  whether to retire it.
- The render mocks Clerk, the pathname hook, the sign-out hook and the client
  context. It proves what the nav renders for a given session. It does not
  prove what Clerk returns for a real signed-in user.

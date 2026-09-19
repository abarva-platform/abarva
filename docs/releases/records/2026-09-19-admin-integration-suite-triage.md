# 2026-09-19-admin-integration-suite-triage — Admin integration suite triage

## Release ID

`2026-09-19-admin-integration-suite-triage`

## Status

`candidate`

## Plain-English Summary

`src/__tests__/integration/admin` holds 51 test suites that almost no CI workflow runs — one
workflow names exactly one file in it. Running the whole directory for the first time found 12
suites red and 24 failing assertions. This change triages all 24 and repairs 22 of them.

The triage found two causes, not 24 problems.

The first, and it covers 21 of the 24: these suites assert on **copy a person reads** and on
**markers inside source files**, and both were deliberately rewritten while the contracts
underneath them did not move. A route was re-pointed at a different surface by a named feature
change, so a marker attribute in its old markup now exists nowhere in `src/` outside test files.
Four navigation panels shipped with real routes, so an exact-list lock on the navigation
configuration was four ids short. Internal release labels were taken out of the sentences shown
beside disabled controls, so every assertion that matched one of those labels went red while the
control it was supposed to be guarding — the gated status, the stated reason, the disabled
affordance — was untouched. One gated action is genuinely no longer gated, and that is correct:
it stopped performing a live write and became navigation to a page that documents the manual
request flow.

Each of those assertions is rewritten to hold the contract rather than the wording — an id
instead of a label, a status instead of a release name, a navigation entry instead of a string
match on a route file — and each carries a dated comment saying what moved and why. None was
deleted, and each rewritten assertion was then broken deliberately to confirm it still fails.

The second cause is a defect in a check rather than in the code it checks. The admin font-family
sweep extracted its values with a pattern that stopped at the first quote character of any kind,
rather than at the quote that opened the string. A canonical font stack containing an inner quote
was therefore read as the fragment before it and reported as a violation. All 11 of the sweep's
reported violations were this, and the deeper problem is that every verdict it gave — positive or
negative — was about a fragment rather than the declared value. The extractor now matches to its
opening quote and unescapes before testing.

Two suites are deliberately left red, because both found something real that an agent must not
decide:

1. The admin hex-literal sweep reports 643 non-canonical colour literals. Measured independently:
   254 distinct literals over 839 occurrences across 229 files, of which 9 are design-token
   values. That is genuine drift from the locked palette, and mapping roughly 245 ad-hoc colours
   onto tokens is a design decision, not a test repair.
2. The admin visible-vocabulary check reports two surfaces whose visible chrome says `Setup ·`.
   That check exists because of an approved record that admin chrome says Admin rather than
   Setup; a later structural change made Setup the canonical admin experience and set the browser
   title accordingly. Two merged decisions contradict each other and choosing between them is a
   product vocabulary call.

The directory is therefore wired **with a quarantine** naming exactly those two suites, the same
shape `source-integration.yml` and the Intelligence step already use — 49 of its 51 suites now run
on every PR, and the 2 excluded ones are named with a reason and an owning backlog item.

The quarantine differs from the Intelligence one in the control that expires it. Those entries name
retired files whose **absence** is the reason, so a static check can watch for their return. These
two name **live defects**, so the honest re-measurement is to run the thing:
`check:admin-integration-quarantine` re-runs each excluded suite and **fails if one passes**. Fix
the palette drift or settle the vocabulary record and the gate goes red until the entry is deleted.
The list ceiling is a ratchet in both directions, so clearing an entry cannot leave silent headroom
for the next one.

## Layer Impact

`global-control-lane`, tests and tooling only. Eleven integration test files under
`src/__tests__/integration/admin`, one comment line in `src/lib/admin/agent-readiness-deep-drill.ts`
whose text named a caption that had already been rewritten two hundred lines below it, and the CI
wiring for the directory: a new workflow step, a quarantine list, its generator and its checker.
No route, component, prompt, schema, API, data-plane path or runtime behaviour changes.

## Client Applicability

- All clients: none. No shipping behaviour changes.
- Specific clients: none.
- Internal only: yes — CI/test scope only.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `src/__tests__/integration/admin/admin-header-consistency.test.ts`
- `src/__tests__/integration/admin/admin-nav-six-panels.test.ts`
- `src/__tests__/integration/admin/admin-route-shell-enforcement.test.ts`
- `src/__tests__/integration/admin/admin-shell-v2.test.ts`
- `src/__tests__/integration/admin/admin11-users-access-depth.test.ts`
- `src/__tests__/integration/admin/admin13-connectors-depth.test.ts`
- `src/__tests__/integration/admin/admin16-production-readiness-depth.test.ts`
- `src/__tests__/integration/admin/admin7-visual-lock.test.ts`
- `src/__tests__/integration/admin/agent-readiness-deep-drill.test.ts`
- `src/__tests__/integration/admin/production-readiness-tracker.test.ts`
- `src/__tests__/integration/admin/steward-editorial.test.ts`
- `src/lib/admin/agent-readiness-deep-drill.ts` (comment only)
- `.github/workflows/integration-suites.yml` — new Admin step and its quarantine check
- `scripts/quality/admin-integration-quarantine.json` — 2 entries, each with a failing case, a
  reason and an owning backlog item
- `scripts/quality/admin-integration-ignore-args.mjs` — generates the `--testPathIgnorePatterns`
  flags from that list
- `scripts/quality/check-admin-integration-quarantine.mjs` — the gate that expires the list
- `package.json` — `check:admin-integration-quarantine`
- `docs/architecture/ci-gate-registry.json` — the new gate, `kind: pr-gate`
- `src/__tests__/behaviors/integration-directory-ci-coverage.test.ts` — `admin` moves from
  `KNOWN_DARK_DIRECTORIES` to `QUARANTINED_WIRED_DIRECTORIES`, and `admin/data` with it

## QA / Validation

Baseline and result measured over the same scope, `npx jest src/__tests__/integration/admin
--no-coverage --ci`, on `origin/main` `28e8b4bd1`:

- **Before: 12 failed / 40 passed of 52 suites; 24 failed / 1,724 passed of 1,748 tests.**
- **After: 2 failed / 50 passed of 52 suites; 2 failed / 1,747 passed of 1,749 tests.**

The 52nd suite is the loose root file `admin-context-uploads-tabs.test.tsx`, which the path
argument also selects because a jest path is a regex; it is already registered by name in
`integration-suites.yml`, so it is covered, not dark.

Every repaired assertion was broken deliberately and confirmed to fail. Eight mutations, each
applied to the product file and then reverted:

| Mutation | Result |
|---|---|
| `/admin` route stops rendering `AdminSetupExperience` | 3 failed of 35 |
| `ops` sub-section id renamed in the nav config | 2 failed of 60 |
| `invite_user` un-gated to `safe`; `configure_sso` href repointed | 2 failed of 61 |
| one blocked connector action given a reason of its own | 3 failed of 71 |
| `approve_gate` given an href; `demo-seed` criterion id renamed | 2 failed of 74 |
| "not live" denial dropped from the readiness caption | 1 failed of 37 |
| a fourth ContextBar cell added without widening the grid | 1 failed of 56 |
| non-canonical font family declared behind an inner quote | 2 failed of 151 (1 pre-existing) |

Font extractor, measured over the 423 files the sweep walks: 11 violations before, all 11
truncation artifacts whose full declared value is canonical, 0 after. Declaration count is
unchanged at 123 — the fix changes the values read, not how many are found.

The wired command itself, exactly as the workflow runs it —
`npx jest src/__tests__/integration/admin --no-coverage --ci $(node scripts/quality/admin-integration-ignore-args.mjs)`
— **50 suites passed of 50, 1,597 tests passed of 1,597, 0 failed.**

The quarantine checker was mutated twice and failed both times, including the control that matters:

| Mutation | Result |
|---|---|
| a green suite added to the quarantine list | exit 1 — "admin-shell-v2.test.ts PASSES now … its reason has expired", plus the ceiling breach |
| an entry's `reason` emptied | exit 1 — malformed entry, every entry needs a failing case, a reason and an owner |

- PASS — `node scripts/quality/check-integration-ci-visibility.mjs --base origin/main`: 11 changed
  suites registered. This gate correctly **refused the first push of this branch**, which changed
  eleven suites that no workflow ran; that refusal is what forced the wiring rather than leaving
  the repairs in a dark directory.
- PASS — `npx jest --runTestsByPath src/__tests__/behaviors/integration-directory-ci-coverage.test.ts`
  — 13 of 13.
- PASS — `npm run check:admin-integration-quarantine`, exit 0.
- PASS — `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false`, exit 0, no output.
- PASS — `npx eslint` over the changed files, exit 0.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — recorded on the PR.

## Rollout Plan

Merge to `main`. No runtime rollout: this change alters test files and one source comment, so the
deployed image changes only by carrying the new commit.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none.
- Approved image digest: unchanged by this release; the post-merge deploy builds from the merge SHA.
- ACA runtime invariant: to be proven after merge with `scripts/deploy/check-aca-runtime-invariant.mjs`.
- Worker image invariant: unchanged.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: **no** — no product surface, route, prompt or data path changes.

## Rollback Plan

Revert the PR. No data or migration rollback applies.

## Audit Evidence

The PR diff, the before/after directory measurements above, the eight mutation results, the
typecheck and lint exits, and the CI run on the PR.

## Known Gaps

- The 49 newly-running suites have **never executed on a CI runner**. They pass locally on one
  machine; environment-dependent flake has had no chance to show. This is the same exposure T-021
  and T-038 record for the Source and Intelligence wirings, and it applies here identically.
- The CI-visibility gate counts a quarantined suite as registered, because the workflow command
  names its containing directory even though the ignore args exclude it. So the two excluded
  suites read as covered to that gate while running nowhere. The quarantine list and its checker
  are what actually own them. Recorded as a backlog item.
- `docs/architecture/test-ci-coverage-census.json` is not regenerated here. It is a committed
  derived artifact that T-012 already records as drifting with nothing reporting it; the
  behavioural coverage case runs the census live, so this change is measured against current
  `main` rather than against that file.
- The admin hex-literal drift is recorded, not fixed. `decision needed`.
- The Admin/Setup visible-vocabulary contradiction is recorded, not resolved. `decision needed`.
- Two dead props were found while triaging and are not touched here: `contextUsed` on
  `StewardEditorial`, and `mode`/`agent` on `ContextBar`. All three are declared and never
  destructured, left behind when the provenance chips were removed.
- Two suites hold the same exact-list lock on the admin navigation configuration and nothing
  holds them to each other; both had to be corrected by hand.

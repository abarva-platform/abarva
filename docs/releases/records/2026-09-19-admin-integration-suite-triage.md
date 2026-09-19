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

Because those two are still red, the directory is **not** wired into CI in this change. Wiring a
red directory is what turns a job into noise, and both remaining failures are decisions rather
than code.

## Layer Impact

`global-control-lane`, tests and tooling only. Eleven integration test files under
`src/__tests__/integration/admin` and one comment line in `src/lib/admin/agent-readiness-deep-drill.ts`
whose text named a caption that had already been rewritten two hundred lines below it. No route,
component, prompt, schema, API, data-plane path or runtime behaviour changes. No workflow file
changes.

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

- `src/__tests__/integration/admin` is **still not wired into any workflow** beyond the single
  file `production-readiness-gate.yml` names. It cannot be wired while two suites are red, and
  both remaining failures need a decision rather than code. Tracked as its own backlog item.
- `admin/data` (5 suites) remains at zero coverage; wiring the parent directory would cover it,
  and that wiring is blocked by the two above.
- The admin hex-literal drift is recorded, not fixed. `decision needed`.
- The Admin/Setup visible-vocabulary contradiction is recorded, not resolved. `decision needed`.
- Two dead props were found while triaging and are not touched here: `contextUsed` on
  `StewardEditorial`, and `mode`/`agent` on `ContextBar`. All three are declared and never
  destructured, left behind when the provenance chips were removed.
- Two suites hold the same exact-list lock on the admin navigation configuration and nothing
  holds them to each other; both had to be corrected by hand.

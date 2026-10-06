# 2026-09-11-source-c360-header-corrections — Header corrections from live proof

## Release ID

`2026-09-11-source-c360-header-corrections`

## Status

`draft`

## Plain-English Summary

Three corrections to the Contract 360 header and evidence list that shipped in
the previous release. All three were found by opening the deployed page and
looking at it, not by the test suite — which is why tests now pin each one.

1. **The page heading ran on.** The design pairs the contract name with a short
   second clause in grey. The governed headline field it was reading is
   long-form prose — on a real contract, several sentences — so the heading
   became a paragraph. The name now stands alone unless the clause is genuinely
   short; the full text stays on the Story tab where it belongs.

2. **A four-year-away deadline was rendered as an alarm.** The notice chip is
   the loudest element on the page, and it was reading "Notice window — 1404
   days" in red. That is the most urgent treatment available saying something
   benign, which teaches a reader to ignore the chip by the time it matters. It
   now raises alarm only inside 120 days and states the same fact quietly
   beyond that.

3. **A not-required lane still carried a zero.** The evidence list rendered
   "Service performance · 0 — Not required", reintroducing exactly the zero the
   not-required state exists to replace. The count is now omitted for a lane the
   contract type does not require.

## Layer Impact

- `global-control-lane`: shared Source product behaviour, not feature-gated.
- **Layer 4 (Products · Source).** Presentation only.
- **Layer 3 (Canonical model).** Unchanged.

## Client Applicability

- All clients: yes.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `Contract360Surfaces.tsx` — headline taken into the heading only when it is
  one short clause; `NOTICE_URGENT_DAYS` gates the alarm treatment; a
  not-required evidence lane renders without a count.
- `workspace.css` — `.sw-c3-pill-quiet` for the non-urgent notice statement.
- `__tests__/Contract360Surfaces.test.tsx` — new; five cases covering the long
  headline, the short clause, the near deadline, the distant deadline, and the
  contract with no dates recorded.

## QA / Validation

- `npx tsc -p tsconfig.json --noEmit` — clean.
- `npx eslint src/app/(maestro)/source/preview/workspace/` — clean.
- `npx jest 'preview/workspace' src/lib/source/contract-intelligence` — 18
  suites, 167 tests, passing.
- All three defects were observed on the deployed page at
  `app.abarva.ai/source/workspace?contractId=MER-TECH-DBX-001`, on revision
  `1cb805992`, before being fixed.

## Rollout Plan

Merge to `main`; the repo-owned ACA main deploy workflow builds and deploys. No
migration, no seed, no data build, no flag.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: assigned by the workflow on merge.
- ACA runtime invariant: asserted by the workflow's own verification step.
- Worker image invariant: unchanged.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: **yes.** On the Databricks contract, confirm
  the heading is the contract name alone, that the notice window is stated
  quietly rather than in red, and that the Service performance lane carries no
  count.

## Rollback Plan

Revert and redeploy. No migration and no data change.

## Known Gaps

- **The 120-day alarm horizon is a judgement, not a derived value.** It is
  wider than the 90-day notice period on the contract in front of us so that a
  reader sees the chip before the window opens, but it is not read from the
  contract's own notice period. Deriving it per contract would be better.
- **The short-clause threshold is a character count.** Sixty characters
  separates a clause from a paragraph well enough for the current data, but a
  field that carried a 55-character paragraph would still land in the heading.
  The real fix is a distinct short-form field on the intelligence record rather
  than a length heuristic on a long-form one.
- The Economics, Performance and Education surfaces named in the previous
  release record remain unbuilt, and the register/evidence identifier split is
  unchanged.

## Audit Evidence

- Commit on branch `claude/source-c360-header-fixes`, based on `1cb805992`.
- CI run for the PR, including `npm run release:check`.
- Local validation recorded under QA / Validation.
- Post-deploy: the workflow's runtime invariant check and the signed-in proof
  named under Deployment Authority.

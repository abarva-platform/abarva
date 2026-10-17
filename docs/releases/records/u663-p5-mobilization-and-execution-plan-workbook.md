# u663 — P5 mobilization and execution plan workbook

## Release ID

`2026-10-17-moves-p5-mobilization-plan`

## Status

`candidate`

## Plain-English Summary

Moves had no mobilization plan: the delivery owner left P5 with documents but no plan to run from. P5's "Plan the first 90 days" step now offers **Download mobilization plan (.xlsx)**, a live-formula workbook built only from the Move's own approved records.

- **Inputs:** the approved estimate's build blocks with their weeks, cost at plan, low and high, and the delivery team's roles, FTE and hourly rates on the rates the estimate was approved on. An optional start date shows calendar dates.
- **Plan:** one row per task.
  - Build blocks run one after another, as the estimate prices them, with weeks linked to Inputs.
  - Each P4 milestone keeps its workstream, owner role, dependencies, recorded window, timing basis and whether it was reviewed.
  - A recorded window the plan can read ("Weeks 3–6", "M2–M4", "Q1") becomes start week and duration. Anything else is marked "To schedule" and left for the owner; it is never guessed.
  - A live check flags a task that starts before the latest of its dependencies ends, or that waits on an unscheduled task.
- **Gantt:** drawn by formula from Plan. Build blocks are teal, milestones grey-green.
- **Team and Cost:** each build block's cost at plan, spread over the weeks it runs on Plan. The total equals the approved estimate, and a check cell says YES. Client staff time, run cost and change management are listed as open rows with no amount, because the estimate does not cover them.
- **Owners:** the P3 design elements with their owners and decision rights. They are marked proposed if P3 has not accepted them.
- **Readiness Checklist:** the P5 readiness and mobilization items as recorded, each with an Open/Closed state.
- **Risks and Open Items:** the register's open assumptions, plus the P5 open items. No likelihood or impact score is invented.
- **Sources:** which record each part came from. A part that could not be read is named "Not available" instead of being filled.

The download needs an approved, current estimate. The route recomputes it on its pinned rates and refuses, with a sentence the user can act on, when:
- it is missing;
- it is stale;
- it cannot be read;
- it no longer reproduces its approved figures.

Nothing is stored.

## Layer Impact

Release lane: `global-control-lane`, behind the existing `moves_rom_engine_v1` flag.

- **Layer 4, products (P5 step page, new read-only route, new workbook module):** no schema, migration or data write.

## Client Applicability

- **All clients:** yes, where the Moves estimate engine is enabled.
- **Specific clients:** none.
- **Internal only:** no.
- **Public/demo only:** no.
- **Feature flag:** `moves_rom_engine_v1` (existing).

## Changes Included

- `src/lib/programs/mobilization-plan/workbook.ts`: the workbook (nine sheets, cached results on every formula).
- `src/lib/programs/mobilization-plan/planned-window.ts`: reads a recorded window as plan weeks; month m is weeks floor((m−1)·52/12)+1 … floor(m·52/12).
- `src/lib/programs/mobilization-plan/refusals.ts`: every refusal with its sentence.
- `src/app/api/v1/programs/[programId]/mobilization-plan/route.ts`: the read-only download (fenced directly with `requireTenancy`).
- `src/components/strategic-moves/step-page/p5-step-pages.tsx`: the download row on "Plan the first 90 days".
- `src/testing/fixtures/synthetic-rom-estimate.ts`: the synthetic estimate the ROM workbook tests use, shared by the new suites.
- `.github/workflows/ai-surface-control-catalog.yml`: runs `src/lib/programs/mobilization-plan/__tests__` in CI, so the suite is not dark on arrival.
- Census refreshes: `docs/architecture/test-ci-coverage-census.json`, `docs/security/tenancy-fence-coverage.json`.

## QA / Validation

- New and changed suites:
  - workbook and window: 26;
  - route: 9;
  - P4/P5 step pages: 55, three of them new;
  - all pass.
- **Independent recalculation:** a sample workbook with every cached result stripped was recalculated from scratch in LibreOffice. All 519 formula cells match the cached values, with zero formula errors. Cost by week equals the approved estimate (check = YES), and every dependency check and month label matches.
- Mutation check: 17 hand mutants, all killed. They covered:
  - build chaining and cost spreading;
  - the month boundary;
  - the latest-dependency rule;
  - hidden unknown dependencies;
  - item splitting;
  - unaccepted owners shown as accepted;
  - confirmed rows shown as risks;
  - an ignored approval match;
  - the route's ladder order;
  - the UI's error sentence;
  - the check formula;
  - the Gantt bar;
  - the five-year cap;
  - a stale estimate;
  - the strict flag;
  - reversed ranges.
- `npm run typecheck` clean; ESLint clean on changed files; `audit:lib-orphans` no change; test-coverage census +2 test files, both covered; fence census +1 route, fenced directly.

## Rollout Plan

Merge after u657–u662 (this PR stacks on them), then ship in the next repo-owned ACA main deploy.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: set by the main deploy.
- ACA runtime invariant: unchanged.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: yes. On a Move with an approved estimate, open P5 "Plan the first 90 days", download the plan, and confirm the Team and Cost check reads YES. The demo Move has not reached P5 live yet.

## Rollback Plan

Revert the squash commit and redeploy. Nothing is stored, so nothing needs cleaning up.

## Known Gaps

- **This is not yet a signed-off P5 deliverable.** It is a download, not an entry in the deliverable registry, so it has no sign-off and no gate criterion. Making it a gated deliverable is a separate change.
- **Build owners are left for the owner to name.** The estimate does not record who leads each block.
- **Windows in other wording stay "To schedule".** Only week, month and quarter forms are read.

## Audit Evidence

- PR URL and CI run.
- The mutation table and the recalculation result in the PR description.

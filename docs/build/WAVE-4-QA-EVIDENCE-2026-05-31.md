# Wave 4 Portfolio Sequencing QA Evidence

Date: 2026-06-01  
Lane: global-control-lane  
Scope: Wave 4 portfolio sequencing, Tower rendering, Sentinel portfolio answers, tenant scoping, and answer-quality guardrails.

## Executive Summary

Wave 4 adds portfolio sequencing: AbarVa can now tell a CXO which programs to run next, which ones should not run together, where capacity is tight, and which value claims overlap. This QA packet focuses on whether that intelligence is readable, scoped to the active client, and free of raw system artifacts such as `signal:<uuid>` in executive-facing answers.

## Feature PRs Covered

| PR | Merge SHA | What shipped |
| --- | --- | --- |
| #2713 | `cf5f80d7885757f5acae123311eaac5795ff7521` | Dependency graph foundation |
| #2714 | `bb8f5244b72de3ead1f5d9427a6020575a1337d9` | Resource pools and capacity constraints |
| #2717 | `99b5ddc9a2d70d598aae25cd6de8b0f106551551` | Cannibalization and value-overlap detection |
| #2720 | `abad6fa4c5697bd49eedccc47b4d024bcd823d17` | Sequence optimizer |
| #2722 | `3afdc602af6b75e43555286a87767f18b1160c0c` | Tower portfolio sequence view |
| #2724 | `ade73d9bfc0acd51d9d06a39833f1f84b5605017` | Sentinel portfolio sequencing answers |

## Evidence Levels

| Level | Result | Evidence |
| --- | --- | --- |
| L1 schema and contracts | Pass | `src/lib/tower/__tests__/wave-4-portfolio-contract.test.ts` validates scoped sequence packets, unsupported-client empty state, and Sentinel answers without raw IDs. |
| L2 deterministic answer behavior | Pass | `src/lib/eval/answer-quality/__tests__/wave4-portfolio-fixtures.test.ts` accepts known-good CXO answers and rejects raw IDs, vague actions, and internal artifacts. |
| L3 UI/static render | Pass | `tests/e2e/wave-4/portfolio-sequence-surface.spec.ts` renders the Tower sequence surface for Apex, Meridian, SkyHarbor, and unsupported-client paths. |
| L4 tenant/no-raw-artifact guard | Pass | Contract and E2E assertions check for no cross-client terms, no `signal:<uuid>`, no UUIDs, and no client/tenant field names in rendered answers. |
| L5 production guard | Pass | Main Reasoning Layer Guard run `26774163711` passed for #2724. Main Post-deploy crawl run `26774163735` passed for #2724. |
| L6 human go/no-go | Pending | Awaiting Anand review after this QA PR lands and the next production proof runs. |

## Issue Register

| ID | Severity | Status | Finding | Resolution |
| --- | --- | --- | --- | --- |
| W4-QA-1 | Medium | Deferred | Sentinel portfolio answers are exposed as a deterministic broker helper; live Sentinel chat-route integration is not part of this slice. | Track as the next integration slice after QA closes. |
| W4-QA-2 | Medium | Disclosed | Meridian and SkyHarbor use signature planning fixtures until full program-instance substrate is loaded for those clients. | Tower disclosure labels them as planning fixtures. |
| W4-QA-3 | Low | Disclosed | Local `npm run dev` in temp worktrees can fail because Turbopack rejects symlinked `node_modules`; CI normal checkouts are the runtime authority. | Use focused tests locally and CI/main proof after merge. |

## Rollback Chain

If Wave 4 needs rollback, revert newest to oldest to avoid dangling references:

1. Revert Sentinel answer helper PR #2724.
2. Revert Tower sequence view PR #2722.
3. Revert sequence optimizer PR #2720.
4. Revert cannibalization detector PR #2717.
5. Revert resource pools PR #2714.
6. Revert dependency graph PR #2713.

## QA Commands

These are the commands for this QA PR:

```bash
npx jest src/lib/tower/__tests__/wave-4-portfolio-contract.test.ts src/lib/eval/answer-quality/__tests__/wave4-portfolio-fixtures.test.ts --runInBand
npx playwright test tests/e2e/wave-4/portfolio-sequence-surface.spec.ts --project=chromium
npx eslint src/lib/tower/__tests__/wave-4-portfolio-contract.test.ts src/lib/eval/answer-quality/__tests__/wave4-portfolio-fixtures.test.ts tests/e2e/wave-4/portfolio-sequence-surface.spec.ts
npx tsc --noEmit --pretty false
npm run release:check -- --base origin/main --head HEAD
```

## Local Validation Results

| Command | Result | Notes |
| --- | --- | --- |
| `npx jest src/lib/tower/__tests__/wave-4-portfolio-contract.test.ts src/lib/eval/answer-quality/__tests__/wave4-portfolio-fixtures.test.ts --runInBand` | Pass | 9 tests passed. Existing duplicate manual mock warnings remain unrelated. |
| `npx playwright test tests/e2e/wave-4/portfolio-sequence-surface.spec.ts --project=chromium` | Pass | 4 tests passed across Apex, Meridian, SkyHarbor, and unsupported-client empty state. |
| `npx eslint src/lib/tower/__tests__/wave-4-portfolio-contract.test.ts src/lib/eval/answer-quality/__tests__/wave4-portfolio-fixtures.test.ts tests/e2e/wave-4/portfolio-sequence-surface.spec.ts` | Pass | No focused lint findings. |
| `npx tsc --noEmit --pretty false` | Pass | Full TypeScript check completed cleanly. |
| `npm run release:check -- --base origin/main --head HEAD` | Pass | Release Control Gate passed after QA statuses were recorded. |

## Decision

Local QA is ready for PR CI. The L6 human go/no-go remains pending Anand review after this QA PR lands and the next production proof stays green.

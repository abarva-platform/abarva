# Coverage Threshold Runbook

## Purpose

This runbook explains the first merge-blocking Jest coverage floor for Nexus. The initial gate covers deterministic behavior tests, not the entire repository.

## Scope

The gate runs:

```bash
npm run coverage:behavior-gate
```

That command executes `src/__tests__/behaviors` with Jest coverage and checks the generated JSON summary.

## Thresholds

| Metric     | Floor |
| ---------- | ----: |
| Lines      |   90% |
| Statements |   90% |
| Functions  |   60% |
| Branches   |   50% |

The floor is intentionally below the measured baseline so the gate catches meaningful regression without making normal PRs fight unrelated historical coverage gaps.

## Local Use

Run the gate before changing shared behavior code:

```bash
npm run coverage:behavior-gate
```

The script writes `coverage/behavior-gate/coverage-summary.json`. The `coverage/` directory is ignored and should not be committed.

## Raising the Floor

Raise thresholds only when:

- The new threshold passes on `origin/main`.
- The release record explains the new floor and current baseline.
- The PR owner confirms the affected suites remain fast enough for normal PR CI.

## Known Limitations

This is not full-repository coverage. It is the first enforceable coverage floor for fast behavior tests. Broader module and route coverage should be added as additional gates once their baselines are measured and stabilized.

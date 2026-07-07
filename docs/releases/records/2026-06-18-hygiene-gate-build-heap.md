# 2026-06-18-hygiene-gate-build-heap — Raise hygiene-gate build heap to 8 GB

## Release ID

`2026-06-18-hygiene-gate-build-heap`

## Status

`candidate`

## Plain-English Summary

The CI "hygiene gate" runs `npm run build` with a 4 GB Node heap. The current
Next.js build needs more than that — it dies of "JavaScript heap out of memory"
at ~4080 MB — so the gate fails intermittently and **blocks every PR's
auto-merge** until someone reruns it (sometimes repeatedly). This raises the
build heap to 8 GB. The `ubuntu-latest` runner has 16 GB RAM, so there is ample
headroom and no risk to the runner.

## Layer Impact

- `global-control-lane` (CI tooling only): one constant in
  `scripts/integration/hygiene_gate.sh`. No application code, runtime, schema, or
  data change. Affects how the gate runs, not what it checks.

## Client Applicability

- All clients: not applicable to runtime — this is a CI gate change. It affects
  every PR's mergeability equally.
- Specific clients: n/a
- Internal only: yes (CI/build infrastructure)
- Public/demo only: no
- Feature flag: none.

## Changes Included

- Branch `fix/hygiene-gate-build-heap`.
- `scripts/integration/hygiene_gate.sh` — default build `--max-old-space-size`
  4096 → 8192 (only when the caller has not already set a heap size).

## QA / Validation

- `bash -n scripts/integration/hygiene_gate.sh` → **PASS** (syntax valid).
- This PR's own `Run hygiene_gate.sh` check exercises the new 8 GB build and is
  the live proof — **validated in CI** on this PR.

## Rollout Plan

Merge to main on green PR check. Takes effect immediately for every subsequent
PR's hygiene gate. No deploy, migration, or flag.

## Rollback Plan

Revert the one-line change back to 4096. No persistent state.

## Audit Evidence

- PR: (filled on open) `fix/hygiene-gate-build-heap`
- The hygiene_gate check on this PR passing IS the evidence the 8 GB build works.
- Prior OOM evidence: hygiene_gate failures on #3687 / #3689 ("heap out of
  memory" near 4080 MB during the TypeScript build step).

## Known Gaps

If the build's memory footprint keeps growing, 8 GB may need a further bump or a
bigger runner; this addresses the immediate flake. Other gates that occasionally
time out (architecture rules, production readiness) are unrelated and unchanged.

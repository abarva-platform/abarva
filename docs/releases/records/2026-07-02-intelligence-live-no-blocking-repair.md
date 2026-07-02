# 2026-07-02-intelligence-live-no-blocking-repair — Intelligence Live No-Blocking-Repair Mode

## Release ID

`2026-07-02-intelligence-live-no-blocking-repair`

## Status

`candidate`

## Plain-English Summary

This release removes the sequential Claude repair loop from the default live Intelligence answer path. The first usable Claude answer becomes the live answer, and deterministic AbarVa fallbacks complete missing companion tabs or native canvas exhibits without making the user wait for additional model calls.

## Layer Impact

- `global-control-lane`: Changes shared Intelligence orchestration for all tenants by defaulting the live path away from blocking model repair calls.
- `global-control-lane`: Adds an explicit opt-in repair mode for offline/deep repair behavior so the previous repair path remains available when intentionally enabled.

## Client Applicability

- All clients: The default live Intelligence route uses no blocking repair calls.
- Specific clients: Demo proof is targeted at Industrial/Morgan Street and SkyHarbor/Airline prompts.
- Internal only: Operator latency traces expose whether blocking repair was skipped.
- Public/demo only: None.
- Feature flag: Blocking repair is disabled by default. It can be explicitly re-enabled with `INTELLIGENCE_LIVE_REPAIR_MODE=blocking`. `INTELLIGENCE_DISABLE_BLOCKING_REPAIR=true` forces repair off.

## Changes Included

- `src/lib/intelligence/repair-mode.ts`: Defines the explicit repair-mode guard.
- `src/lib/intelligence/ask/index.ts`: Skips the consultant detour in default live no-repair mode.
- `src/lib/intelligence/ask/synthesizer.ts`: Gates visual, tab, missing-tab, native-canvas, and standalone repair calls behind explicit repair opt-in; deterministic fallback still fills tabs/canvas.
- `src/lib/intelligence/intelligence-consultant-text-synthesis.ts`: Applies the same repair-mode guard for direct consultant synthesis callers.
- Tests for repair-mode defaults, guarded live route behavior, and direct consultant no-repair behavior.

## QA / Validation

- `pass`: `npm test -- --runTestsByPath src/lib/intelligence/__tests__/repair-mode.test.ts src/lib/intelligence/__tests__/intelligence-consultant-text-synthesis.test.ts src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts`
- `pass`: `npx eslint src/lib/intelligence/repair-mode.ts src/lib/intelligence/__tests__/repair-mode.test.ts src/lib/intelligence/ask/index.ts src/lib/intelligence/ask/synthesizer.ts src/lib/intelligence/intelligence-consultant-text-synthesis.ts src/lib/intelligence/__tests__/intelligence-consultant-text-synthesis.test.ts src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts`
- `pass`: `git diff --check`
- `pass`: `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false`
- `not-run`: Signed-in browser latency proof is pending deploy.

## Rollout Plan

Merge through the normal PR path, build the exact SHA through ACR, deploy with the approved Azure Container Apps lane, assign 100% traffic after the revision is healthy, then run signed-in latency proof for Industrial/Morgan Street and SkyHarbor/Airline prompts.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None outside the repo-owned ACA workflow.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Pending deploy.
- Worker image invariant: Not applicable.
- Feature/env flag update path: No env change required for the new default. `INTELLIGENCE_LIVE_REPAIR_MODE=blocking` is the opt-in rollback-style flag for the older blocking repair behavior.
- Live signed-in proof required: Yes.

## Rollback Plan

Roll back ACA traffic to the prior healthy revision. If a code rollback is not immediately available, set `INTELLIGENCE_LIVE_REPAIR_MODE=blocking` and redeploy through the controlled ACA lane to restore the previous blocking repair behavior.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- Deploy revision/digest: pending.
- Signed-in latency proof: pending.

## Known Gaps

- This release removes the repair tail; it does not reduce primary Claude generation time.
- Browser proof must confirm `repair calls attempted = 0` and final settle timing after deployment.

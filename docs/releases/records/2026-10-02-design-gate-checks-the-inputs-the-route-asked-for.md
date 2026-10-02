# 2026-10-02 — The Design Gate Checks the Inputs the Confirmed Route Asked For

## Release ID

`2026-10-02-design-gate-checks-the-inputs-the-route-asked-for`

## Status

`candidate`

## Plain-English Summary

In the design phase, a Move is asked for a set of written inputs. Once discovery has confirmed what kind of change the Move is, that set is right-sized: a limited process change or a technical product is asked for fewer, different inputs than a full redesign.

The gate that closes the design phase checked whether those inputs were captured — but against the default full-redesign list, not the list the Move was actually asked for. For a right-sized Move it reported inputs that were never requested as missing, could not report capture as complete, and therefore could not report the gate as ready to approve.

The gate now resolves the confirmed route the same way the input screen does and checks that list.

## Layer Impact

**Release lane: `global-control-lane`.** Shared Moves gate behavior for every client; not behind a feature flag.

- **Product layer — Moves design gate:** Which input list the capture-completeness check uses at the design phase. The hard gate checks, the evidence binding, and the approval authority check are unchanged. No check is removed: the gate still requires every input the Move was asked for.
- **Canonical model:** No schema or data changes.

## Client Applicability

- All clients using Moves receive the behavior after deployment. Moves on the default (full design) route see no change.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/api/v1/programs/[programId]/phase-gate-approval/route.ts`: at the design phase, resolve the confirmed solution route from the recorded assessment, the validation, and approved discovery evidence, and pass it to the section lookup.
- Tests: the gate reports capture complete for a right-sized route whose own inputs are captured; other phases do not resolve a route.

## QA / Validation

- Targeted Jest: pass — the gate route suite, `22 tests`, 2 new.
- Mutation check: with the route not passed to the section lookup, the new test fails.
- Targeted ESLint: pass.
- `node scripts/release-check.mjs --base origin/main --head HEAD`: pass.
- Typecheck: deferred to CI (the local compiler run is not reliable on this machine).
- Deployed-runtime observation that motivated the change: on a synthetic limited-change workflow with all eight requested design inputs saved, the gate status listed two inputs from the full-redesign list as missing.
- Signed-in runtime verification of this change: pending deployment.

## Rollout Plan

Merge through a reviewed PR. Deploy only through the repository-owned ACA main deploy workflow. After the exact merge SHA is live, read the design gate status of the synthetic workflow and confirm it no longer lists inputs the route does not ask for.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside the deploy workflow.
- Approved image digest: Pending exact-SHA deployment.
- ACA runtime invariant: Pending exact-SHA verification.
- Worker image invariant: Pending exact-SHA verification.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, on a synthetic workflow.

## Rollback Plan

Use the repo-owned ACA main deploy workflow to redeploy the prior approved digest, or revert this change. No database migration or data mutation is included.

## Audit Evidence

- PR and exact-SHA CI checks: pending.
- Targeted test output and mutation result: recorded in the PR.
- Exact-SHA ACA deployment, digest invariants, and signed-in proof: pending.

## Known Gaps

- The route is resolved in four places with the same three inputs (the input screen, the build, the assistant, and now the gate). They are not yet one shared loader.
- If the confirmed route can no longer be resolved — for example the recorded assessment changed after validation — the gate falls back to the default list, as the input screen does.

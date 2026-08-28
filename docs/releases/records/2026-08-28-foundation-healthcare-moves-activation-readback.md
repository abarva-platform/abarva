# 2026-08-28-foundation-healthcare-moves-activation-readback — Moves Activation Readback

## Release ID

`2026-08-28-foundation-healthcare-moves-activation-readback`

## Status

`candidate`

## Plain-English Summary

Records the governed operator-job execution that loaded the foundation healthcare Moves activation rows and updates the demo readiness tracker so completed activation work is no longer reported as pending.

## Layer Impact

- `client-data-lane`: Moves activation rows were loaded through the approved private ACA operator job path and read back by row family.
- `public-demo`: The readiness tracker now reports the Moves activation denominator from execution proof instead of leaving the completed slice in the next backlog.

## Client Applicability

- All clients: No.
- Specific clients: Foundation healthcare demo tenant only.
- Internal only: Yes, for demo-readiness tracking and operator evidence.
- Public/demo only: Yes.
- Feature flag: None.

## Changes Included

- `docs/architecture/meridian-phs-demo-readiness-status.json`
- `scripts/ecl/write_meridian_phs_demo_status.mjs`
- ACA operator execution `job-abarva-private-operator-eus-87hv2eh`
- Read-only diagnostic execution `job-abarva-private-operator-eus-a33iihm`

## QA / Validation

- Pass: `node --check scripts/ecl/write_meridian_phs_demo_status.mjs`
- Pass: `npm run test:ecl-meridian-phs-moves-activation`
- Pass: `npm run test:ecl-meridian-phs-moves-activation-execute`
- Pass: ACA operator load execution reported `Succeeded`, with readback `issues=[]`.
- Pass: Read-only ACA diagnostic reported `accepted=true`, `issues=[]`.
- Pass: Private operator job restored to idle image, `/bin/true`, 0.5 CPU, 1Gi memory, and 1800-second timeout.

## Rollout Plan

Merge to `main`. No web runtime behavior change is required for the tracker update, though the proof was captured against the deployed `main` image.

## Deployment Authority

- Repo-owned deploy workflow: Existing `main` deploy run `33155945679` produced the digest-pinned image used by the operator job.
- Shared runtime mutators: None in this PR.
- Approved image digest: `acrabarvalab001.azurecr.io/abarva/web@sha256:7ac01573987d0f4431a8ebc8a35f58ccf03a8783cdcd31b4e07048cdd9ee2c32`
- ACA runtime invariant: Passed in deploy run `33155945679`.
- Worker image invariant: Passed in deploy run `33155945679`.
- Feature/env flag update path: None.
- Live signed-in proof required: No new route behavior in this PR.

## Rollback Plan

Revert the tracker/status commit if the status artifact needs to return to pre-load reporting. The data load itself used deterministic upserts and idempotency readback; rollback of loaded operational rows should use the activation basis if needed.

## Audit Evidence

- Operator output: `/tmp/meridian-phs-moves-activation-load-de414b1de-20260828`
- Diagnostic output: `/tmp/meridian-phs-moves-readpath-diagnostic-de414b1de-20260828`
- Load execution: `job-abarva-private-operator-eus-87hv2eh`
- Diagnostic execution: `job-abarva-private-operator-eus-a33iihm`
- Readback counts: 38 engagements, 490 program modules, 262 phase-capture modules, 228 milestones, 228 work items, 38 risks, 38 source events, 38 outcome ledger rows, 38 Intelligence evidence rows, 38 trace-joinable moves, and zero claimable value rows.

## Known Gaps

The operator wrapper did not extract the proof tar from the load logs because the begin marker was not present in the retained log stream, although the job JSON and readback tail were captured. A smaller structured proof output should replace large tar streaming for this lane.

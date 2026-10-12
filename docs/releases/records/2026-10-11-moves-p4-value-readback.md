# 2026-10-11 — Moves P4 value readback

## Release ID

`2026-10-11-moves-p4-value-readback`

## Status

`candidate`

## Plain-English Summary

The P4 value page read a response field that the value-case API does not return, so a valid evaluated case could appear unevaluated. It now reads the API's `case` projection, preserves the exact refusal sentence and offers a read-only retry. It labels the investment cost source, displays the engine's three-year credited cash ROI, carries collection-timing qualifications, and keeps the value row open when the readback is blocked, restricted or still requires input validation. It no longer silently requests internal delivery as a fallback cost choice.

## Layer Impact

- Release lane: `global-control-lane`, within the existing tenant-gated P4 step page.
- Layer 3: no schema, data, seed, approval or computation changes. The existing governed value-case projection owns every number and refusal.
- Layer 4: the Moves P4 page consumes that projection and shows its source and readiness. Percentage formatting uses the engine's supplied ratio; the page calculates no economics.

## Client Applicability

- All clients: unchanged outside the existing enrolled step-page surface.
- Specific clients: the enrolled synthetic demo workspace only.
- Internal only: no.
- Public/demo only: synthetic demo enrollment.
- Feature flag: existing `moves_step_pages_p4p5_v1`, with `moves_step_pages_v3` and `moves_capture_v2`; the value API retains its own `moves_value_engine_v1` and tenant/access fences.

## Changes Included

- P4 page reads the actual API contract and verifies the returned Move identity and evaluation state.
- Read failures and named refusals hold readiness; a retry performs another read.
- Blocked or restricted results show no economics, even if a malformed response carries them.
- Open counted inputs remain visible for validation before funding.
- Cash ROI, ROM/estimate source, zero-cash capacity and timing limitations use the engine and reviewed captured model.
- Regression fixtures exercise the real `valueCaseForViewer` projection instead of repeating the page's incorrect response field.

## QA / Validation

- Pass: six focused suites, 175 tests, including the P4/P5 page, approved-ROM reader, live-formula ROM workbook, value cost basis, value engine and value API route.
- Pass: thirteen mutation checks killed; the source was restored after each mutation run. Checks cover the API field, implicit delivery choice, named refusal, Move binding, retry, open inputs, blocked/restricted figures, ROI basis, ceiling wording, timing qualification and zero-cash rule.
- Pass: Node 24 `npm run typecheck`, zero diagnostics.
- Pass: targeted ESLint, library orphan audit, route/export reachability, coverage and tenancy write/check, manual check, and all 11 release gates. Coverage stays at 2,829 files: this change adds cases to an existing swept suite and adds no test file.
- Pass: actual component renders at 1440 and 390 in light/dark, compared with template v1.10; no horizontal overflow. The temporary render test was deleted. These local fixtures exclude the signed-in host and agent dock.
- Not run: exact-head GitHub CI, merge, ACA runtime invariant or fresh signed-in P4 acceptance. Local fixtures are not runtime proof.

## Rollout Plan

Open a controlled PR after local validation. Reconcile actual main without rebasing a pushed branch, regenerate affected shared artifacts and validate the resulting head. Complete exact-head CI and a fresh fetched-ref coverage-count scan of every open Moves PR including drafts before arming squash merge. The existing repository-owned main ACA workflow performs the runtime release. Observe the stated demo merge cutoff and freeze.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this change.
- Approved image digest: assigned by the main workflow; no digest claimed by this candidate.
- ACA runtime invariant: web template and 100% serving revision must match the approved digest.
- Worker image invariant: required delivery-worker images must match that digest.
- Feature/env flag update path: unchanged; any update uses the same repository-owned workflow.
- Live signed-in proof required: on a fresh synthetic Move, compare the P4 page with the selected approved ROM and exact value-case response, exercise a refusal/retry, inspect downloaded artifacts and record operator-only acceptance.

## Rollback Plan

Revert this presentation-only patch through a PR and the repository-owned main workflow, or withdraw the existing P4/P5 step-page enrollment through that same controlled lane. Existing records and signatures are unaffected by this patch.

## Audit Evidence

- Focused regression, mutation and typecheck results above.
- Candidate PR, exact-head CI and fetched-ref coverage scan to be recorded at release.
- Deployment digest and signed-in proof to be recorded separately after the runtime release.

## Known Gaps

- Fresh synthetic Move and generated P4 artifacts are still pending with the sole execution owner; no P4 acceptance is claimed.
- Structured milestone dependencies and owner roles are a separate discovered page gap.
- Measurement-plan content and gate-decision persistence require independent artifact/readback review; nonempty prose and a passing gate alone do not prove output acceptance.
- The step bar retains the capture host's readiness source; this readback cannot establish approval or funding authority.

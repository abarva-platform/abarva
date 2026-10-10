# 2026-10-10 — P4 and P5 Moves step pages

## Release ID

`2026-10-10-moves-step-pages-p4p5`

## Status

`candidate`

## Plain-English Summary

The Roadmap and Mobilize phases now have seven step pages on the shared Moves
template. Their last steps continue through the governed gate page. The pages
write existing capture answers, show evidence review in the step, and display
milestones and confirmed assumption rows from their owning routes. The
estimate reviewer remains a human decision. The terminal phase describes a
handoff to Tower; it does not say execution or measurement has started.

Default step routing now counts the gate page mounted by the host for every
phase. A redirect shows the target step name while navigation completes.

## Layer Impact

- Release lane: `global-control-lane`, limited by the existing tenant feature flag.
- Layer 3: no schema or canonical-object change.
- Layer 4: Moves presentation and step-page routing only. Existing capture,
  milestone and register routes remain the stores of record. The gate evaluator
  still owns approval status and criteria.

## Client Applicability

- All clients: flag-off behavior stays on the existing capture flow.
- Specific clients: the enrolled synthetic demo tenant only.
- Internal only: no.
- Public/demo only: no.
- Feature flag: `moves_step_pages_p4p5_v1`, with its existing capture and step-page prerequisites.

## Changes Included

- P4.1–P4.4 and P5.1–P5.3 step-page slots.
- Gate-view routing derivation, P2 gate view registration, and visible redirect status.
- Tests for slot coverage, view/mount parity and page states.
- Legacy-surface sunset ledger update.
- No migration or database operation.

## QA / Validation

- Page, notes-fill, host, routing and governance tests: pass (359 tests across five suites).
- After rebasing onto current main: Programs unit suites pass (3,556 tests
  across 229 suites); focused page, host and routing suites pass (336 tests
  across three suites). The newly mounted upstream view remains in routing.
- Six mutation probes: pass; each changed behavior failed a focused test before restoration.
- Typecheck: pass with zero errors.
- ESLint on changed source: pass with zero warnings.
- Library orphan audit, route reachability and export reachability: pass; no new findings.
- Test CI census: pass, one new covered test file and a covered-file delta of +1.
- Tenancy fence census write/check: pass; no API route added.
- Nexus manual generation/check: pass; generated manual unchanged.
- Release control: pass (11 of 11 gates).
- Local visual previews: 168 screenshots at 1440px and 390px, light and dark; 140 shared-template state fixtures and 28 actual initial adapter renders. The P4.2 initial render was refreshed after its blocked-state adjustment.

## Rollout Plan

Review and squash merge the PR, then use the repo-owned main deploy workflow.
The existing feature flag controls the enrolled tenant. Record a signed-in
walk before removing the legacy hatch.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this PR.
- Approved image digest: not assigned; no deployment performed.
- ACA runtime invariant: required after a future deploy.
- Worker image invariant: required after a future deploy.
- Feature/env flag update path: existing tenant flag registry; no live flag update here.
- Live signed-in proof required: yes, before claiming these pages are live-proven.

## Rollback Plan

Turn off `moves_step_pages_p4p5_v1` for the enrolled tenant. The existing
capture flow and `?legacy=1` hatch remain available. Revert the PR if the
step-page routing needs to be removed from a later image.

## Audit Evidence

- This PR diff and its test output.
- Render previews under the design brief's `renders/p4p5/` directory.
- A future main-deploy run and signed-in browser walk are separate evidence.

## Known Gaps

- The current baseline does not contain the approved ROM snapshot service or
  the read-only value-case route. P4.2 and P4.3 show explicit unavailable
  states rather than fabricated figures. Per-release ROM rows, workbook links
  and engine formula readback need those upstream services.
- Value-lever editing here is limited to conversion and register references
  for attribution and probability. Creating a new lever model remains open.
- The phase host does not provide the P2 route confirmer, a linked session
  date, or a per-step completion timestamp. The pages label missing session
  context instead of inventing it; a stored capture answer reaches Ready but
  does not claim a dated Done state.
- P4/P5-specific HTML mocks do not exist in the design handoff. Visual review
  used template v1.10 and its P3 instances. Static previews omit the existing
  AgentDock chrome and use placeholder tabs and upload controls.
- Signed-in runtime behavior, gate decisions and persistence are unverified.

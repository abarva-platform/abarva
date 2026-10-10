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
- Review fixes: Context reads the actual step depth, milestone readiness follows
  the milestone route, value readback formats engine cents as dollars and names
  driver units, and P4.2 reads through an approval-backed ROM snapshot seam.
- Gate-view routing derivation, P2 gate view registration, and visible redirect status.
- Tests for slot coverage, view/mount parity and page states.
- Legacy-surface sunset ledger update.
- No migration or database operation.

## QA / Validation

- Page, notes-fill, host, routing, governance and money formatter tests: pass
  (377 tests across seven focused suites). Host tests cover first-open routing
  and the `?legacy=1` hatch in both P4 and P5.
- After rebasing onto current main: Programs unit suites pass (3,558 tests
  across 230 suites). The newly mounted upstream view remains in routing.
- Eleven representative mutation probes: pass. Five review-fix probes
  (depth, zero milestones, NPV display, approved ROM read and cents conversion)
  and six earlier step-page probes each failed a focused test before restoration.
- Typecheck: pass with zero errors.
- ESLint on changed source: pass with zero warnings.
- Library orphan audit, route reachability and export reachability: pass; no new findings.
- Test CI census: pass, two new test files and a covered-file delta of +2
  (2,798 to 2,800); no new unrun test file.
- Tenancy fence census write/check: pass; no API route added.
- Nexus manual generation/check: pass; generated manual unchanged.
- Release control: pass (11 of 11 gates).
- Local visual previews: 168 screenshots at 1440px and 390px, light and
  dark; 140 shared-template state fixtures and 28 actual initial adapter
  renders. The 28 actual initial renders were refreshed after the review
  fixes and local readbacks settled.

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

- The ROM calculator and preview route are present, but the approved P3 ROM
  snapshot read path is not. The single read function returns `null` today;
  P4.2 remains blocked until a governed approved snapshot can be supplied.
  Its per-release display and workbook link are tested with a synthetic
  approved snapshot. The read-only value-case route is also absent, so P4.3
  shows an explicit unavailable state rather than fabricated figures.
- Value-lever editing here is limited to conversion and register references
  for attribution and probability. Creating a new lever model remains open.
- The phase host does not provide the P2 route confirmer, a linked session
  date, or a per-step completion timestamp. The pages state only the actual
  step depth and evidence summary; a stored capture answer reaches Ready but
  does not claim a dated Done state.
- P4/P5-specific HTML mocks do not exist in the design handoff. Visual review
  used template v1.10 and its P3 instances. Static previews omit the existing
  AgentDock chrome and use placeholder tabs and upload controls.
- Signed-in runtime behavior, gate decisions and persistence are unverified.

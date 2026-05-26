# 2026-05-26-northstar-demo-readiness — Northstar CXO demo playbook + dry-run capture

## Release ID

`2026-05-26-northstar-demo-readiness`

## Status

`candidate`

## Plain-English Summary

Pre-demo deliverables for the 2026-05-27 Northstar CXO demo. Ships the demo playbook with step-by-step scenes, talking points, risk register with mitigations, and a Playwright-based demo-capture script that runs the entire flow end-to-end as a dry-run and produces an HTML report with screenshots of every screen.

## Layer Impact

- `documentation`: new `docs/build/northstar-demo/DEMO_PLAYBOOK_2026-05-27.md` covering pre-flight checks, 6 demo scenes with talking points, risk register, backup flows, and post-demo follow-up checklist.
- `ops-release-lane`: new `scripts/demo/northstar-demo-capture.mjs` — Playwright dry-run script that signs in as Priya Mehta, walks all 13 demo steps, captures screenshots + console errors + Sentinel response samples into an HTML report. Run any time to verify demo readiness.

No runtime change. No schema. No tenant-data write.

## Client Applicability

- All clients: no
- Specific clients: Northstar Clinical Tech CXO demo
- Internal only: yes — operations + sales readiness
- Public/demo only: no (these are internal artifacts)
- Feature flag: none

## Changes Included

- `docs/build/northstar-demo/DEMO_PLAYBOOK_2026-05-27.md`
- `scripts/demo/northstar-demo-capture.mjs`
- PR: this PR

## QA / Validation

- Playbook covers all 6 demo scenes with concrete talking points and backup flows: **passed**
- Risk register addresses 9 named risks with mitigations: **passed**
- Playwright capture script: **in flight** (run task `bgvz6alip`) — produces HTML report at `audit-artifacts/northstar-demo-dryrun-<timestamp>/DEMO_DRYRUN.html`

## Rollout Plan

Merge to `main`. No production rollout — internal demo readiness artifacts. Owner runs the dry-run script the morning of the demo, verifies all green, executes the demo flow from the playbook.

## Rollback Plan

Revert this PR. No runtime, no schema, no policy change.

## Audit Evidence

- Playbook references all 5 closed Northstar P0s, Codex's merged Stream B (PR #2359), and the 1,720 chunks loaded across 4 tenants
- Capture script mirrors the production stress-test runner's sign-in approach (createSignInToken from Clerk, ticket strategy, abarva_active_client cookie)

## Known Gaps

- Capture script depends on Playwright Chromium and Clerk service-role key — same prerequisites as the stress-test runner
- Most-recent stress-test transcripts (post-substrate-load) confirmed grounding works; capture script is the new end-to-end gate
- The session-timeout regression on the long-form stress runner (sign-in early then 6.5 min crawl then agent probes — token expires) is noted; this capture script avoids that pattern by doing sign-in immediately before agent questions
- Task #17 remains open

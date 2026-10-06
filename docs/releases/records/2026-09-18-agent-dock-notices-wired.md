# 2026-09-18-agent-dock-notices-wired - Wire The Coverage That Already Existed

## Release ID

`2026-09-18-agent-dock-notices-wired`

## Status

`candidate`

## Plain-English Summary

The agent dock declares two controls in the AI surface control catalog: the persistent AI responsibility footer, and the in-chat notice that agent actions need human approval. Both already had behavioral tests — they were simply not wired into the catalog's CI job, so nothing would have failed if either disappeared.

This wires the two existing assertions into that job. No new test was written, because writing one would have duplicated coverage that already exists and made the duplicate the thing maintained.

## Layer Impact

CI only. No product code and no test code changed. `global-control-lane`.

## Client Applicability

- All clients: no behavior change.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `.github/workflows/ai-surface-control-catalog.yml`: runs the dock's two control assertions alongside the catalog check.

## Why the run is name-filtered

`AgentDock.test.tsx` also carries three assertions deliberately left red: a
`pin-top` dock mode that is still declared in `DockMode` and still persistable
but has no control in the picker, and two structured-render assertions for
rendering the July refactor moved elsewhere. Those are open product questions,
recorded as such in PR #7772, not defects to paper over.

Wiring the whole file would gate the control catalog on unrelated open
questions, and the pressure to make the job green would push someone toward
deleting those assertions — which is exactly the behavior this programme exists
to prevent. The job runs the two control tests by name instead. The control is
gated; the open questions stay visibly open.

## QA / Validation

- Filtered run: **2 of 2 pass**, 59 skipped. Status: **pass**.
- Mutation checks: removing the responsibility footer fails 1 of the 2; removing the approval notice fails 1 of the 2. Each mutation fails only its own assertion.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit` after deleting `tsconfig.tsbuildinfo`: **exit 0**, zero diagnostics.
- Signed-in acceptance: **not applicable** — no product behavior changes.

## Rollout Plan

Squash-merge after required checks pass. No deploy is required; it rides the next ACA main deploy.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: None.

## Rollback Plan

Revert through a new PR. No runtime effect either way.

## Audit Evidence

PR link, the filtered test result, and both mutation results to be added when available.

## Known Gaps

- Five of the eighteen declared controls still have no behavioral test.
- A name-filtered CI step is coupled to two test titles. Renaming either assertion silently drops it from the gate. That is a real weakness of this approach; the durable fix is resolving the three red assertions so the whole file can be wired by path.

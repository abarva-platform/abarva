# 2026-09-18-canvas-and-response-disclosure-behavior - Four More Controls, And What Testing Them Turned Up

## Release ID

`2026-09-18-canvas-and-response-disclosure-behavior`

## Status

`candidate`

## Plain-English Summary

Four more of the catalog's 37 declared controls now have a behavioral test:
the Moves deliverable canvas view model's AI-draft label, evidence trace and
readiness, and the shared response renderer's confidence display. Coverage goes
from 21 of 37 to **25 of 37**.

Writing them turned up five things that were not defects in the controls but are
worth having in writing, because each is a case of something reading as more than
it is.

## Layer Impact

Test, CI and catalog only. No product code changes. `global-control-lane`.

## Client Applicability

- All clients: no behavior change.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/programs/__tests__/deliverable-canvas-polish-view.controls.test.ts`:
  seven cases against the real builder.
- `src/components/agent/__tests__/AgentResponse.controls.test.tsx`: three cases
  added, and its citation fixture replaced with the real `Citation` type.
- `.github/workflows/ai-surface-control-catalog.yml`: runs the new suite.
- `docs/security/ai-surface-control-catalog.json`: four controls now name their
  test; one evidence list corrected; one uncovered reason made specific.

## What testing them turned up

**The citation fixture was fiction.** The existing case "stays quiet about
citation gaps when the answer is actually cited" passed an object with
`id`/`marker`/`source_name`/`source_type`. None of those four fields exists on
`Citation`. It was cast `as never`, so nothing type-checked it, and it satisfied
the assertion because the gap check only counts the array. Replaced with the real
shape.

**No jsdom suite can prove a citation renders.** Substitution happens inside
react-markdown's component overrides, and react-markdown is mocked repo-wide to a
passthrough because its ESM breaks next/jest's transform. The `citation` control
on the shared renderer therefore stays uncovered, with that as its recorded
reason, and the wired suite asserts the limit explicitly — otherwise the visible
placeholder text looks like a product defect to the next reader.

**`confidence_signal` discloses nothing.** The confidence indicator reads
`honest_disclosure.confidenceLevel`. A response carrying `confidence_signal:
"medium"` and no `honest_disclosure` shows the reader no confidence at all.
Asserted as current behavior so a fix has to change that line.

**The canvas `confidence` evidence token was the bare word `confidence`**, which
matched `e.confidence !== "low"` — a filter input, not a disclosure. Repointed at
`deriveReadiness` / `readinessLabel`, which is what the reader actually sees.

**Readiness is a phase-level fact wearing a deliverable-level label.** Evidence is
never associated with a deliverable anywhere in this model, so one piece of
evidence in the phase makes *every* pending deliverable read `partial`, including
ones it has nothing to do with. Two smaller versions of the same thing: the
evidence trace silently stops at two citations with no indication more exist, and
a pending deliverable shows an empty trace whether or not evidence was filed.
All three are pinned by tests that assert current behavior, so a fix has to change
the test rather than slip past it.

## QA / Validation

- New canvas suite: **7 of 7 pass**. Extended response suite: **8 of 8 pass**.
  Status: **pass**.
- Six mutations, each applied to the real module and reverted:

| Mutation | Result |
|---|---|
| Draft label set only on done deliverables | 1 of 7 fail |
| Evidence trace stops excluding low-confidence and contradicted items | 1 of 7 fail |
| Readiness collapses to a single value | 1 of 7 fail |
| Trace cap changes from two | 1 of 7 fail |
| Approve and export become enabled from the read surface | 1 of 7 fail |
| The confidence indicator stops rendering | 1 of 8 fail |

  Each fails only its own assertion. Status: **pass**.

- `npm run audit:ai-surface-controls`: **exit 0** — `25 of 37` covered, `8 of 37`
  on no screen. Status: **pass**.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit` after deleting
  `tsconfig.tsbuildinfo`: **exit 0**, zero diagnostics. Status: **pass**.
- ESLint on both suites: **exit 0**. `release-check`: **exit 0**. Both captured as
  exit statuses, not read off a pipe. Status: **pass**.
- Signed-in acceptance: **not applicable** — no product behavior changes.

## Rollout Plan

Squash-merge after required checks pass. No deploy required; it rides the next ACA
main deploy.

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

PR link, both suite results, the six mutation results, and the checker's coverage
lines.

## Known Gaps

- **12 of 37 controls remain uncovered**, 8 of them on surfaces no route reaches.
- The three canvas findings are **recorded, not fixed**. Associating evidence with
  a deliverable is a data-model change, not a test change.
- The response renderer's `citation` control cannot be covered without changing how
  react-markdown is mocked repo-wide, which affects every suite that imports it.
- A test that asserts current behavior to document a gap will keep passing after
  someone fixes the gap badly. These say in their names that they document a gap,
  which is a convention, not a check.

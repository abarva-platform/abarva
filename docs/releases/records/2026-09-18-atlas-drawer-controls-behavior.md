# 2026-09-18-atlas-drawer-controls-behavior - Prove The Drawer Carries Its Own Disclosures

## Release ID

`2026-09-18-atlas-drawer-controls-behavior`

## Status

`candidate`

## Plain-English Summary

The Atlas drawer declares four controls: the AI draft label, the responsibility footer, the notice that agent actions need human approval, and the citation-gap notice. All four render in the drawer's dark tone, which is a separate code path from the light-tone surfaces already covered.

The checker proves those component names appear in the file. It cannot prove they render — a tone-prop typo or a collapsed branch keeps the names and loses the notices. This is the fourteenth behavioral test in that programme; it renders the real drawer.

## Layer Impact

Test and CI only. No product code changes. `global-control-lane`.

## Client Applicability

- All clients: no behavior change.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/shell/__tests__/AtlasDrawer.controls.test.tsx`: three cases against the rendered drawer.
- `.github/workflows/ai-surface-control-catalog.yml`: runs the new test alongside the catalog check.

## What is and is not covered

Covered: the responsibility footer and the approval notice both render inside
the drawer, in its own tone, with the shared copy the rest of the product uses.
The third case asserts both appear in the drawer's own markup — the drawer is a
separate surface from the page that opened it, and a reader working inside it
must see the disclosures without closing it.

Not covered here: the AI draft label and the citation-gap notice, which render
per answer and need a streamed thread to exist. This suite mocks the agent
stream to an empty thread, so asserting them would mean fabricating a thread
shape and proving the fixture rather than the drawer. The two per-answer
controls are already covered on the rendered-response surface, where they belong.
Stated rather than left as an implied "four controls tested".

## QA / Validation

- New suite: **3 of 3 pass**. Status: **pass**.
- Mutation checks: removing the responsibility footer fails 2 of 3; removing the approval notice fails 2 of 3. Each mutation takes down its own assertion and the both-present case.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit` after deleting `tsconfig.tsbuildinfo`: **exit 0**, zero diagnostics. ESLint: **exit 0**.
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

PR link, the three test results, and both mutation results to be added when available.

## Known Gaps

- Four of the eighteen declared controls still have no behavioral test.
- This suite asserts two of the drawer's four controls, for the reason above. The catalog does not distinguish partial coverage from full, so a future reader could take this step's presence as proof of all four. That distinction lives only in this record, which is a weakness of the current catalog shape rather than of this test.

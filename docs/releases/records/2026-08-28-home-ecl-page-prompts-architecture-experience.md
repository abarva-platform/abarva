# 2026-08-28-home-ecl-page-prompts-architecture-experience — Home ECL Page Prompts And Architecture Experience

## Release ID

`2026-08-28-home-ecl-page-prompts-architecture-experience`

## Status

`candidate`

## Plain-English Summary

Adds the page-by-page Home ECL prompt and experience contract. The document explains how Home should
present current-state systems, organization, interviews, technology/vendor data, and architecture
for a new business or technology executive: conceptual blocks first, then logical system maps, then
physical drilldown and evidence.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: documents the intended Home page prompts, visual hierarchy, architecture
  experience, data/browser interaction model, and acceptance bar.
- Layer 3 Canonical Enterprise Model: no schema or data changes. The document requires visible
  numbers and relationships to reconcile to governed source truth.
- Layer 1 and Layer 2: no intake or adapter changes. The document names required future producers
  for business model, org, interviews, applications, hosting, data/analytics, vendor contracts,
  Tower, and Source signals.

## Client Applicability

- All clients: applies as a Home design and prompt standard.
- Specific clients: none.
- Internal only: design guidance for product and engineering agents.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `docs/architecture/home-ecl-page-prompts-and-architecture-experience-2026-08-28.md`
- `docs/architecture/home-ecl-executive-narrative-v2-design-2026-08-28.md`

## QA / Validation

- Documentation-only change: `pass`.
- Public-disclosure review: `pass`; no private prospect names, screenshots, or confidential
  customer narrative details are included.
- Runtime/browser validation: `not-run`; this change does not alter product code or deploy a page.
- Release control: `pass` expected via `npm run release:check -- --base origin/main --head HEAD`.

## Rollout Plan

No runtime rollout. The design becomes active for future Home V2 implementation once merged to
`main`. Any implementation of this contract must carry separate tests, proof, release record, and
browser evidence.

## Deployment Authority

- Repo-owned deploy workflow: not applicable.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: not for this documentation-only change.

## Rollback Plan

Revert the documentation commit if the page prompt contract is superseded or replaced.

## Audit Evidence

- Architecture document: `docs/architecture/home-ecl-page-prompts-and-architecture-experience-2026-08-28.md`
- Companion document: `docs/architecture/home-ecl-executive-narrative-v2-design-2026-08-28.md`

## Known Gaps

- This does not implement the Home V2 UI.
- This does not generate or publish a new narrative bundle.
- This does not validate the in-flight Tower or Source data additions.

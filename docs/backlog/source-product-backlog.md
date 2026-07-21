# Source Product Backlog (Canonical)

This is the canonical, permanent backlog for the AbarVa Nexus Source module. Established
2026-07-21, following the same convention as `docs/backlog/moves-product-backlog.md`
(the Moves Continuous Execution Directive, established 2026-07-20). Completed items are
never deleted — history is preserved. This file should be reconciled against `main` and
merged PRs at the start of every execution loop.

**Status values** (use only these): `Proposed`, `Needs Design`, `Needs Owner Decision`,
`Approved`, `Ready`, `In Progress`, `In Review`, `Merged`, `Deployed`, `Runtime Proven`,
`Blocked`, `Deferred`, `Superseded`, `Closed`.

**Priority order** (mirrors Moves): (1) security/data-corruption/tenant-isolation/
unauthorized-mutation, (2) evidence-integrity and governed-migration correctness, (3)
live runtime failures, (4) approval/authority/lineage controls, (5) deliverable/content
quality, (6) workspace UX, (7) automation and efficiency, (8) cosmetic.

---

## Completed and closed

### SOURCE-GUIDEBOOK-001 — Stage guidebooks foundation + read-only workspace tab

- **Problem statement**: Source had no facilitator-guide content system for the working
  session that moves an event through a stage's gate (Moves' Workshop Facilitator Guide
  had this; Source did not).
- **User/business impact**: No structured agenda/talking-points/decision-capture surface
  for the Strategy gate conversation (or any stage).
- **Severity**: P4 (capability gap, not a defect)
- **Workstream**: Deliverable/content quality
- **Status**: `Deployed` — code and migration both live; component rendering proven; a
  real signed-in click-through is not yet done (tracked separately as
  `SOURCE-GUIDEBOOK-002`).
- **Dependencies**: the governed database-migration delivery lane
  (`docs/releases/records/2026-07-20-db-migration-lab-workflow.md`) — this was the
  feature that originally surfaced the need for that lane.
- **Acceptance criteria**: schema + repository function + one real authored guidebook
  (Strategy); a read-only "Guidebook" workspace tab on the Source event shell, visible
  only for stages with authored content.
- **Required tests**: `src/lib/source/stage-guidebooks/__tests__/repository.test.ts`;
  `src/lib/source/__tests__/source-event-shell-v2.test.ts` (guidebook cases);
  `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.guidebook.test.tsx`.
- **PR**: #5135 (schema/repository/seed), #5175 (workspace tab UI)
- **Merge SHA**: `02c08d3e28f16d6fe708fb9caaca3c56d3e1547b` (#5135),
  `4a4290345db4624bbcee08e4f66f98574b82c5fe` (#5175)
- **Deploy run**: aca-main-deploy [29790788429](https://github.com/abarva-platform/abarva/actions/runs/29790788429),
  `success`
- **Runtime proof**: ACA revision `ca-abarva-web-lab-eastus--m4a429034` confirmed
  matching the deploy digest via `az containerapp show`. Migration applied for real via
  the governed migration lane, real apply run
  [29789097644](https://github.com/abarva-platform/abarva/actions/runs/29789097644);
  real repository readback confirms the seeded Strategy row. Component rendering proven
  via real RTL tests. **Live signed-in server-to-database rendering is NOT proven** —
  see `SOURCE-GUIDEBOOK-002`.
- **Release record**: `docs/releases/records/2026-07-20-source-stage-guidebooks-foundation.md`,
  `docs/releases/records/2026-07-20-source-guidebook-workspace-ui.md`
- **Discovered from**: a proposal for consulting-grade Source artifact governance,
  referencing Moves' Workshop Facilitator Guide pattern.
- **Notes / remaining gaps**: only the Strategy stage has authored content (the other 10
  stages correctly hide the tab, not show it empty); no authoring/edit UI exists yet.

### SOURCE-GUIDEBOOK-003 — Render guidebook section bodies as real Markdown

- **Problem statement**: `SourceStageGuidebookSection.body` is typed and documented as
  Markdown, but `GuidebookWorkspace` in `SourceAnalyticsCanvas.tsx` rendered it with
  `whiteSpace: 'pre-wrap'` plain text — the seeded Strategy agenda's numbered list
  showed literal `1. `/`2. ` prefixes instead of a real ordered list.
- **User/business impact**: Cosmetic (content-fidelity), not a defect.
- **Severity**: P7 (cosmetic / content-quality)
- **Workstream**: Workspace UX
- **Status**: `Deployed` — real Markdown rendering via `react-markdown` +
  `remark-gfm` + `rehype-sanitize` (already-bundled dependencies, no new one added).
- **Dependencies**: none.
- **Acceptance criteria**: met — real `<ol>`/`<li>` output confirmed via
  `renderToStaticMarkup` against the real library and the real seeded agenda content.
- **Required tests**:
  `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.guidebook.test.tsx`
  — asserts rendering delegates to `ReactMarkdown` (this repo's global Jest mock for
  `react-markdown` is a hard passthrough, so the committed test can only guard against
  regressing back to plain text; real markup rendering was verified separately, see the
  release record).
- **PR**: #5180
- **Merge SHA**: `7888cab375fde5224bb03f6b9b7100a46ef66deb`
- **Deploy run**: [aca-main-deploy #29793844800](https://github.com/abarva-platform/abarva/actions/runs/29793844800),
  `success`
- **Runtime proof**: ACA revision `ca-abarva-web-lab-eastus--m7888cab3` confirmed
  matching the deploy digest via `az containerapp show`. Live signed-in
  server-to-database rendering not proven — same open item as `SOURCE-GUIDEBOOK-002`.
- **Release record**: `docs/releases/records/2026-07-20-source-guidebook-markdown-rendering.md`
- **Discovered from**: `SOURCE-GUIDEBOOK-001`'s own Known Gaps.
- **Notes / remaining gaps**: none yet.

---

## Ready / in progress

None — the one safe, independent, unblocked item (`SOURCE-GUIDEBOOK-003`) is now
complete. Remaining Source work either requires authored content (out of scope for an
agent to fabricate) or is blocked on authenticated test access (`SOURCE-GUIDEBOOK-002`).

## Blocked

### SOURCE-GUIDEBOOK-002 — Signed-in guidebook runtime certification

- **Problem statement**: `SOURCE-GUIDEBOOK-001` shipped and is deployed, but a real
  signed-in user opening a Source event's Strategy stage and seeing the Guidebook tab
  render real content from the live database has never been observed. Component-level
  tests are real and pass, but they do not exercise the live server-side
  `getSourceStageGuidebook()` call against real Postgres through a real authenticated
  session.
- **User/business impact**: The feature is very likely working (every layer up to the
  authenticated boundary is independently proven), but "very likely" is not "proven" —
  this is the one remaining gap between deployed code and a certified user-facing
  feature.
- **Severity**: P5 (verification/evidence gap, not a known defect)
- **Workstream**: Live runtime verification
- **Status**: `Ready / Blocked only on authenticated test access` — this agent attempted
  live verification via the claude-in-chrome browser and was stopped by Clerk's
  one-time-email-code sign-in flow with no inbox access available. Entering credentials
  or bypassing authentication on the user's behalf is out of scope regardless of inbox
  access.
- **Dependencies**: an approved test account with either (a) reusable signed-in browser
  storage state, or (b) inbox access to complete a one-time-code sign-in, or (c) a human
  operator performing the click-through directly.
- **Acceptance criteria**:
  1. Authenticate using an approved test account or reusable signed-in storage state.
  2. Open a Source event at the Strategy stage.
  3. Verify the Guidebook workspace tab is visible.
  4. Confirm the rendered title is "Strategy Gate Review".
  5. Verify all five authored sections render.
  6. Confirm stages without guidebooks hide the workspace tab (not shown-and-empty).
  7. Capture screenshot, response evidence, tenant/event identity, and the deployed
     commit SHA.
  8. Add the evidence to `docs/releases/records/2026-07-20-source-guidebook-workspace-ui.md`.
- **Required tests**: none new — this is a verification pass, not a code change.
- **PR**: N/A.
- **Discovered from**: `SOURCE-GUIDEBOOK-001`'s deploy — flagged honestly rather than
  claimed complete.
- **Notes / remaining gaps**: do not use personal credentials or bypass authentication
  to close this item.

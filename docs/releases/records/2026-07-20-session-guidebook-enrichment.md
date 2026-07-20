# 2026-07-20-session-guidebook-enrichment — Facilitator instructions, stakeholder alignment, and reusable workshop templates for Moves session packs

## Release ID

`2026-07-20-session-guidebook-enrichment`

## Status

`candidate`

## Plain-English Summary

The design-conversation ask was that phase guidebooks be first-class deliverables that
tell a human team how to actually run the sessions, not just what to discuss: which
stakeholder pairs must genuinely agree (not just both attend), how to open and close the
workshop, what to probe when the room gives a vague answer, what signals mean the room
is actually misaligned rather than just having a rough patch, and standalone, reusable
templates (Decision Log, Open Issue Log, Assumption Register, etc.) rather than prose
lines buried inside a capture checklist. This release adds all of that to the 5 default
Moves phase sessions (P1 Charter through P5 Mobilize & Hand off) and to the Design
Session Pack HTML the team downloads.

## Layer Impact

- **global-control-lane**: `src/lib/programs/playbook/*` is shared Moves infrastructure
  behind the "Generate Session Pack → File Cabinet" action available on every phase
  workspace. This is additive: existing fields (`discussionGuide`, `captureTemplate`,
  `frameworks`, the alignment `gate`) are unchanged in shape and content; the new fields
  are optional on the type and rendered only when present, so any caller not yet updated
  (see Known Gaps) is unaffected.

## Client Applicability

- All clients: yes — shared Moves session-pack infrastructure, no gate.
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none.

## Changes Included

- `src/lib/programs/playbook/move-phase-playbook.ts`:
  - New types: `AlignmentPoint` (a pairwise stakeholder check — which two roles must
    genuinely agree, and on what), `FacilitationNotes` (opening framing, closing
    checklist, what to probe on a weak answer, disagreement signals to watch for, the
    parking-lot rule for what's out of scope this session), `WorkshopTemplateKind` +
    `WorkshopTemplateSpec` + the `WORKSHOP_TEMPLATES` registry of the 8 canonical,
    reusable templates named in the design conversation (Decision Log, Open Issue Log,
    Assumption Register, Evidence Request Tracker, Stakeholder Alignment Matrix, Option
    Scoring, Action Register, Approval Page) — each with real columns, not placeholder
    prose.
  - `MovePhaseSession` gains three new **optional** fields: `alignmentPoints`,
    `facilitation`, `workshopTemplates`. Optional (not required) because the AI-PDLC
    archetype's 8-session P3 override does not yet carry them — see Known Gaps; the
    renderer omits the corresponding section gracefully when absent rather than
    rendering an empty one.
  - All 5 default phase sessions (P1–P5) fully populated with real, phase-specific
    content — not generic filler. E.g. P1's alignment point is Sponsor vs. Finance
    partner on the funding envelope and Sponsor vs. Business owner on the outcome
    metric; P3's is Enterprise architect vs. Security/risk on guardrails and Business
    owner vs. Enterprise architect on whether the design actually solves the stated
    problem; P1's facilitation notes explicitly park solution-design discussion for P3,
    matching the existing phase-discipline pattern already used elsewhere in this
    codebase (`forbiddenSectionTopics` on deliverable structures).
- `src/lib/programs/playbook/design-session-pack.ts`:
  - `renderFacilitationNotes`, `renderAlignmentPoints`, `renderSessionWorkshopTemplateRefs`
    — new render helpers, each a no-op when the session doesn't carry the corresponding
    optional field.
  - `renderWorkshopTemplateAppendix` — a single, de-duplicated appendix of blank,
    reusable template tables at the end of the pack (one per distinct kind referenced
    across all of the playbook's sessions, not repeated per session), matching the
    "standalone reusable" requirement rather than embedding the template inline and
    duplicated in every session that uses it.
- New test file `move-phase-playbook.test.ts` (10 tests): every default phase session
  has real (non-empty, substantive) alignment points/facilitation/templates; P1's
  parking-lot rule explicitly defers to P3; P3's alignment points name the
  architect/security tension; the `WORKSHOP_TEMPLATES` registry covers all 8 kinds with
  real columns; the existing `listPlaybookPhases` resolver is unaffected; an archetype
  override without the new fields still resolves and renders without crashing or
  showing empty sections; the appendix de-duplicates shared template kinds across
  sessions.

## QA / Validation

- `npx jest src/lib/programs/playbook src/__tests__/integration/solutions/pattern-playbook.test.ts src/components/strategic-moves/__tests__` —
  207 tests passed. One pre-existing, unrelated test-suite-level failure
  (`moves-liability-visible-controls.test.tsx`, a Clerk-backend ESM transform error in
  this Jest environment, confirmed identical on a clean baseline via `git stash`
  before/after — nothing to do with this change).
- `npx eslint` on all changed/new files — 0 errors.
- Local `npx tsc --noEmit -p .` — known, previously-documented environment crash
  unrelated to this change; CI's typecheck check is authoritative.
- `git diff --check` — clean.

## Rollout Plan

Merge to `main` via the protected PR lane (squash merge). No feature flag, no migration,
no worker job. Deploy proceeds through the repo-owned `aca-main-deploy` workflow — the
next "Generate Session Pack" click on any Move phase will produce a pack with the new
facilitation/alignment/template sections.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none used directly; deploy proceeds through the standard
  workflow only.
- Approved image digest: to be recorded once the deploy workflow runs.
- ACA runtime invariant: to be proven after deploy.
- Worker image invariant: N/A — no worker involved in this change.
- Feature/env flag update path: N/A — no flag.
- Live signed-in proof required: yes — generate a real Design Session Pack for a P1–P5
  phase on a live Move after deploy and confirm the facilitator notes, alignment table,
  and workshop template appendix render.

## Rollback Plan

Revert the merge commit (single self-contained PR, no migration, no data change). The
three new fields are optional and the renderer degrades gracefully in their absence, so
a revert simply removes the new sections with no cleanup required.

## Audit Evidence

- PR URL: to be added when opened.
- CI run: to be added when the PR's checks complete.
- Deployment URL / ACA revision: to be added after deploy.

## Known Gaps

- **The AI-PDLC archetype's 8-session P3 override (`ai-pdlc-design-sessions.ts`) does not
  yet carry alignment points, facilitation notes, or workshop template references.**
  Confirmed this codebase already supports multiple sessions per phase for this
  archetype (contrary to an earlier assumption that Moves defaults to exactly one
  session per phase everywhere) — but enriching all 8 of those sessions with real,
  specific content (not filler) is a distinct, scoped follow-up, not attempted in this
  release to keep this PR's content authentically specific to what was written rather
  than rushed.
- **Multi-session-per-phase is not being introduced as a new default** — the 5 default
  playbooks (P1–P5) remain one session each, as they were before. The design
  conversation's framing implied potentially more than one session per phase; today
  that already exists only for the AI-PDLC archetype override. Whether the DEFAULT
  playbooks should also become multi-session is a product decision, not made here.
- Session-level workshop-template references (`workshopTemplates: WorkshopTemplateKind[]`)
  point at the canonical registry but do not yet feed into the deliverable-generation
  pipeline (i.e., a completed Decision Log captured via this template is not yet
  auto-ingested as governed evidence for later phases) — that integration is a separate,
  larger piece of work.

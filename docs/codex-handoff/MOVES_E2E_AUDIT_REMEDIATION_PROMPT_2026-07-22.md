# Codex handoff — Moves end-to-end audit remediation

**Date**: 2026-07-22
**Requested by**: Anand Sundaram
**Context**: A six-dimension audit of the Moves product (UI/UX, aVa chat analytics, artifact
narrative quality, session/workshop guidebooks, client-upload/supersede, evidence persistence)
found one repeating pattern: **a real, working capability already exists somewhere else in
this codebase, and Moves either doesn't call it or ships a thinner bespoke copy.** A follow-up
pass looked specifically at visual/copy polish (clutter, sentence length, label necessity,
alignment, canvas-width usage, borders, navigation clarity) that the first pass didn't cover,
and found several concrete, grounded issues on the live phase-workspace page — these are
Phase 0 below. None of the items in this document are "build from zero" — every one is
wiring/integration or a scoped bug fix against infrastructure that's already proven elsewhere in
this repo, or a narrow, precisely-located polish fix. Full audit detail:
`docs/backlog/moves-product-backlog.md` (add your findings there as you close each item,
following the existing `MOVES-UI-00x`/`MOVES-CAPABILITY-00x` entry format).

## Read first (mandatory)

1. `docs/backlog/moves-product-backlog.md` — `MOVES-CAPABILITY-001`, `MOVES-BUG-002`,
   `MOVES-UI-006`, `MOVES-UI-007` (the P2 decision-surface fix, PR #5291 — the most recent
   precedent for how a phase-workspace UI change should be scoped, tested, and proven).
2. `docs/specs/programs/deliverable-quality-and-approval-lifecycle-design.md` — the intended
   artifact lifecycle model. Status is `Needs Owner Decision`, **not approved for
   implementation as a whole** — Phase 3 below only wires the ALREADY-BUILT
   `deliverable-versioning.ts` state machine into the live path; it does not implement the
   full design doc.
3. `AGENTS.md` "Context & corpus governance" section (repo root) — mandatory for Phase 3, item
   9. No dataset load or indexing change without a manifest first.

## Hard constraints — read twice

- **No changes to `governance.ts`, `evaluateGate()`, or the Approve & Build two-sequential-calls
  wiring** (`onBeforeBuild`/`onBuildSettled` → `approvePhaseGateAfterBuild`) in any phase of this
  work. Every item here is presentation, chat-answer, content-generation, or data-plumbing work
  — none of it changes what makes a gate pass or fail.
- **No schema migration in Phase 3 without a dataset manifest first**, per `AGENTS.md`'s
  governance section. If item 9 requires a new column/table, stop and write the manifest under
  `docs/governance/dataset-manifests/` before touching schema, following
  `docs/governance/NEW_DATASET_ONBOARDING_POLICY.md`.
- **No live mutating action (Approve & Build, gate submission, "final" upload) against any
  Move other than a confirmed sandbox** (`Codex Proof Agent Assist 123131`,
  `HEALTHCARE_PROVIDER-CODEX-2026`). Read-only navigation against real client-named Moves (e.g.
  "AI MEMBER ASSIST TRANSFORMATION") for verification purposes is fine and has been done
  repeatedly this session; do not click Approve & Build or submit a gate on it.
- **Work phases in order.** Phase 0 is pure visual/copy polish (styling, markup, string edits —
  zero data or behavior change). Phase 1 is presentation/wiring only (no logic behavior change
  to gates, evidence, or generation). Phase 2 changes content-quality logic. Phase 3 touches
  data model and governance and is the highest-risk — do not start it until Phases 0-2 are
  merged, deployed, and live-verified.
- **Every merged PR needs**: real tests (RTL `fireEvent`/actual assertions, not shape checks),
  a release record under `docs/releases/records/` following
  `docs/releases/templates/release-record-template.md`, and — for anything touching the shared
  `MovesPhaseStandaloneClient.tsx` — the ACA runtime-invariant check (template image = 100%
  traffic image) plus a live signed-in browser check before calling it done. This project's
  established discipline: don't claim `live-proven` until you've actually looked.
- **Check for collisions before starting.** This repo has multiple parallel sessions landing
  PRs on `main` continuously (this audit itself found PR #5291 shipped independently mid-work
  on the same section). Before starting any item, `git log --oneline -20 origin/main` and grep
  for related recent commits — if something has already shipped, verify it against the
  acceptance criteria below rather than redoing it.

---

## Phase 0 — Visual/copy polish on the live phase-workspace page (pure styling/markup, zero behavior change)

All six items below were found by direct live-browser inspection of
`/strategic-moves/[id]/phase/2` (the real "AI MEMBER ASSIST TRANSFORMATION" Move, read-only —
no mutating action taken), cross-referenced against the exact rendering code in
`src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`. Every line number below was
verified against `main` at commit `055c0d25c` — re-check before starting in case the file moved.

### 0.1 Remove the duplicated content block in the step-detail panel

**Problem**: when a capture section (e.g. "Current-state findings") is selected, the panel
renders the exact same saved text **twice, back to back**, with no label explaining why:
- `mxw-contract-captured` div (`:1798-1802`) — a read-only quote-styled block showing
  `phaseCaptureValues[selectedSection.key]`.
- The `<textarea>` directly below it (`:1808-1820`) — `value={phaseCaptureValues[selectedSection.key] ?? ""}`, i.e. the identical string, now editable.
**Fix**: the read-only `mxw-contract-captured` block and the editable `<textarea>` should not
both render the same content unmodified. Either (a) remove `mxw-contract-captured` entirely for
sections with an existing value and let the textarea itself be the single source of truth
(pre-filled, editable), or (b) if the read-only block exists to show "last saved" vs. "in
progress" divergence, only render it when the two values actually differ, with a small label
("Last saved" / "Editing") explaining the distinction. Do not leave both rendering identically
with no explanation.
**Acceptance criteria**: a completed section shows its content exactly once by default; if a
"saved vs. draft" distinction is kept, it only appears when values diverge and is clearly
labeled. Add a test asserting the read-only block is absent (or clearly differentiated) when
`phaseCaptureValues[key]` matches what's already in the textarea.

### 0.2 Stop hardcoding the "Provide" label

**File**: `MovesPhaseStandaloneClient.tsx:1791` — `<em>Provide</em>` never varies; it renders on
every step regardless of step type, next to a real, functional status pill
(`<b>{detailComplete ? "Done" : "Open"}</b>`, `:1792`).
**Fix**: either make this label reflect something real (e.g. distinguish a "provide input"
step from a "review evidence" step, if that distinction exists elsewhere in the data model), or
remove it — a label that never changes value carries no information and is exactly the kind of
non-functional label to cut per this task's brief ("less labels — only required for
functionality").
**Acceptance criteria**: `Provide` either becomes a real, varying value, or is removed. Add/
update a test reflecting whichever choice is made.

### 0.3 Declutter the phase-progress stat card

**File**: `MovesPhaseStandaloneClient.tsx` — the `.mxw-progress-card` in `.mxw-stage-head`
(around `:1195-1205`) renders `{phaseProgressDone} / {phase.substeps.length}` as a large
number, then a progress bar, then `{phaseReadinessLabel} · {substep.label}` — and
`phaseReadinessLabel` itself is built (`:407-425`) by concatenating a percent, a "hard met"
fraction, or a "Complete"/"Gate ready"/"Gate blocked" phrase depending on context. On the P2
gate-blocked view this renders as a single dense line like `25% workflow · 3/5 hard met ·
Prepare` — three different units of measure (a percent, a ratio, a stage name) joined by
mid-dots with no visual hierarchy between them.
**Fix**: give the card a clear one-thing-per-line hierarchy — e.g. the fraction/percent as the
primary large number (already is), then the hard-gate ratio and current-stage name as two
visually distinct secondary lines (or a small label + value pair each) instead of one
run-on string. Do not remove the underlying information — it's real and useful — just stop
compressing three different units into one dot-separated sentence.
**Acceptance criteria**: the three pieces of information (workflow progress, hard-gate
progress, current stage) are visually distinguishable at a glance, not read as one clause.

### 0.4 Fix canvas-width underuse in the phase header

**File**: `MovesPhaseStandaloneClient.tsx` inline CSS — `.mxw-stage-head p{...max-width:64ch...}`
(around `:4387`). `.mxw-stage-head` itself is a grid with the text column at `minmax(0,1fr)`
(`:4382`) — i.e. it can be considerably wider than 64 characters on a normal desktop viewport,
but the subheading paragraph (`phase.lede`) is hard-capped at 64ch regardless, forcing
unnecessary line wraps even when the actual available column is wider. Confirmed live: on
`/phase/2` at standard desktop width, the lede paragraph wraps to 2 lines while roughly 300px of
available column width sits unused to its right.
**Fix**: either raise the cap to genuinely match the available column width (measure the real
rendered column width at common breakpoints and set the max-width accordingly — don't just
delete the cap and let it stretch to something illegibly wide either; a sensible readable
measure, but one that actually reflects the space this grid gives it, not an arbitrary 64ch that
was set without checking).
**Acceptance criteria**: the phase lede paragraph on a standard desktop viewport uses
meaningfully more of its available column width and wraps to fewer lines than it does today,
without exceeding a comfortably readable line length.

### 0.5 Tie the workflow-stage indicator to whichever stage the current Inputs section belongs to

**File**: `MovesPhaseStandaloneClient.tsx:1722-1744` — the `Workflow` nav group's `active` state
(`:1725`, `active = selectedWorkflow && index === substepIndex`) only lights up when a workflow
substep itself is explicitly selected. While a user is working through `Inputs` section items
(`:1702-1721` — which is where most step-completion time is actually spent; P2 has 7 Inputs vs.
4 Workflow stages), the Workflow list shows no stage as active at all — a user deep in filling
out Inputs has no visual answer to "which of the 4 workflow stages am I actually in right now?"
The active-state CSS itself (`:4898`, a left inset-shadow + background change) is real and
works correctly when a workflow item is selected — this is specifically about the gap while an
Inputs item is selected instead.
**Fix**: when an Inputs section is selected, compute which workflow stage that section logically
belongs to (via whatever existing mapping ties capture sections to workflow substeps — check
`getPhaseCaptureSections`/`phase.substeps` for an existing relationship before inventing a new
one) and apply the same `active` treatment to that workflow row, not just to explicitly-clicked
workflow rows.
**Acceptance criteria**: at all times, exactly one Workflow row shows the active treatment,
whether the user got there by clicking a workflow stage directly or by clicking an Inputs
section that belongs to it. Add a test selecting an Inputs section and asserting its owning
Workflow row is marked active.

### 0.6 Give the "what's next" disclosure real default visibility, and separate it from unrelated generic footer copy

**File**: `MovesPhaseStandaloneClient.tsx:1745-1776` — `mxw-contract-comingup` ("What
{readinessPack.nextPhaseLabel} will need") is a click-to-expand `<button>` that defaults
collapsed (`comingUpExpanded` state), with real content behind it
(`readinessPack.openNeeds` chips, `:1756-1771`). Directly below it, separated only by a plain
`border-top`, sits `mxw-contract-nav-foot` (`:1773-1776`) — generic, unrelated instructional
copy ("Use the left steps in order. Approve & Build remains the governed close..."). Confirmed
live: with the disclosure collapsed (its default state), these two blocks read as one
undifferentiated paragraph of generic text, giving no visual signal that real, specific
next-phase content exists one click away.
**Fix**: two options, either is acceptable — (a) default the disclosure to expanded when
`readinessPack.openNeeds.length > 0` (i.e. when there's actually something concrete to show),
collapsing it only when there's nothing to show; or (b) keep it collapsed by default but give
the toggle button stronger visual weight (not the same muted grey as the generic footer text
right below it) so it reads as "click to reveal specific next-phase items," not as more
boilerplate. Either way, add clearer visual separation between `mxw-contract-comingup` and
`mxw-contract-nav-foot` so they don't read as one continuous block of generic text.
**Acceptance criteria**: a user scanning the left rail can tell, without clicking, whether real
next-phase-readiness content exists here — and the toggle is visually distinct from the
unrelated generic instructional footer beneath it.

### 0.7 Copy pass for sentence length and voice consistency

**Files**: the `lede`/`avaContext`/similar narrative strings inside each phase's `PhaseContract`
definition (`MovesPhaseStandaloneClient.tsx`, roughly `:114-310` — each phase P0-P5 has its own
hand-authored strings). Confirmed inconsistent voice and sentence length across phases (e.g. P2's
lede is a 24-word compound sentence; P3's `avaContext` reads conversationally; P5's is terser) —
a byproduct of each phase's copy having been authored independently across many separate PRs.
**Fix**: do a single editing pass over every phase's `lede`/`question`/`avaContext` strings
(and the `mxw-contract-nav-foot` copy from 0.6 while you're in there) for: shorter sentences
(prefer two short sentences over one compound one), consistent second-person/direct voice, and
removing hedge-y filler words. This is copy-only — do not change the underlying `PhaseContract`
structure, keys, or any logic that reads these fields.
**Acceptance criteria**: no `lede`/`avaContext` string exceeds roughly 20 words per sentence;
a side-by-side read of all six phases' ledes reads as one consistent voice, not six different
authors. Since this is pure string content, a lightweight test asserting max sentence length
(split on `.`/`?`/`!`, word-count per segment) across all `PHASES[].lede` values is a reasonable
regression guard against this drifting back.

---

## Phase 1 — UX + chat wiring (no schema/gate-logic change)

### 1.1 Fix the phase rail disappearing below 900px

**File**: `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx:4805-4807`
**Problem**: `@media (max-width:900px){ .mxw-side{display:none} }` hard-hides the entire phase
rail (phase nav, Files/Intelligence/Approvals switcher, rail-collapse toggle) with no
replacement. Below 900px there is no way to switch phases or reach Files & Evidence except by
editing the URL.
**Acceptance criteria**: below 900px, a compact top bar or equivalent control surfaces at
minimum: current phase indicator, a way to switch phases, and a way to open Files &
Evidence/Phase Intelligence/Approvals. Reuse the existing `railCollapsed` state/markup where
possible rather than building a second parallel implementation. Add a jest test that renders at
a narrow viewport (or asserts the fallback control exists in the DOM regardless of CSS) and
confirms phase-switching is still reachable.

### 1.2 Stop fabricating the approver name in Approvals overview

**File**: `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx:1561` —
`<span className="mxw-approvals-approver">Sponsor</span>` is a hardcoded literal for every row.
**Real data already exists**: `src/components/strategic-moves/RoleApprovalsPanel.tsx` has a real
multi-role model (business/technology/finance/risk_security, real `approverName`), already wired
into `src/components/strategic-moves/PhaseDocumentsPanel.tsx:541` — but that panel only mounts
on a separate legacy route (`src/app/(maestro)/strategic-moves/[moveId]/evidence/page.tsx`),
never inside the current universal-shell Approvals overview.
**Acceptance criteria**: the Approvals overview inside `MovesPhaseStandaloneClient.tsx` shows
the real per-role approver (or a clearly-labeled "not yet assigned" state) instead of the static
"Sponsor" string — either by rendering real `RoleApprovalsPanel` data here, or by fetching the
same underlying role-approval data this panel already reads. Do not invent a new approver data
source; reuse what `RoleApprovalsPanel`/`PhaseDocumentsPanel` already read. Add a test asserting
the approver name varies by gate role and is not a fixed string.

### 1.3 Wire Moves chat into the existing chart/rich-answer pipeline

**Problem**: Moves' "Ask aVa" (`MovesPhaseStandaloneClient.tsx:1401-1416`) renders every turn as
a bare `<p>{turn.text}</p>`. The chat send path (`:616-676`) calls `extractArtifacts()` on the
streamed response and gets back a `visibleText` + `artifacts` pair, but discards `artifacts` —
never rendered.
**What already exists and works, unused by Moves**:
- `src/components/agent-answer/AgentAnswerRenderer.tsx` renders a typed `AvaAnswerPacket`
  (`src/lib/ava-answer/contract.ts`) including a Recharts-backed `AnswerChart[]`
  (`bar | horizontal-bar | stacked-bar | line | waterfall | value-bridge | 2x2-matrix | tornado
  | range-bar | heatmap | swimlane | cost-stack | quadrant-matrix`).
- `src/lib/cio-tower/tower-chat-artifacts.ts` (`buildTowerChatAvaAnswerPacket`) is the working
  template for building one of these packets from a domain's own data. `composeAvaAnswer()` is
  called from `src/app/api/intelligence/ask/route.ts` and `src/lib/intelligence/answer/engine.ts`
  for Intelligence/Tower chat. Grep the repo for Moves call sites of `composeAvaAnswer` — there
  are none as of this handoff; verify that's still true before starting.
- `src/components/agent/AgentDock.tsx:1203-1236` shows the client-side pattern: render through
  `AgentMarkdown` (`src/lib/agent/markdownRenderer.tsx`) for prose/markdown/inline `ChartHint`
  charts, and through `<AgentAnswerRenderer answer={turn.agentAnswer}>` when a full packet is
  present.
- **Real, non-fabricated data ready to chart**: `getMovePhaseTallies()`
  (`src/lib/programs/phase-explorer-tallies.ts`) gives deterministic met/total gate-criteria
  counts per phase P0-P5, derived from the same rule catalog the actual gate evaluates against
  — a ready-made "gate readiness by phase" bar/funnel chart with zero drift risk from the real
  gate. `buildNextPhaseReadinessPack` gives real evidence-coverage counts per phase.

**Task**:
1. Build `buildMovesChatAvaAnswerPacket()` (new file, e.g.
   `src/lib/programs/moves-chat-artifacts.ts`), mirroring `tower-chat-artifacts.ts`'s structure:
   given a Move + phase, pull `getMovePhaseTallies(move)` and shape a `horizontal-bar` or
   `stacked-bar` `AnswerChart` (gate criteria met/total per phase), plus prose narration via
   `composeAvaAnswer()`.
2. Wire it into whichever chat route serves Moves (`MOVES_PHASE_SURFACE` regex match — locate
   the exact route file and confirm it's the same shared `/api/chat/agent` route referenced in
   this audit) — when the question is analytics-shaped (reuse whatever
   intent-detection pattern Tower/Intelligence chat already use before calling
   `composeAvaAnswer`, don't build a new classifier from scratch), call the new packet builder
   and return the resulting `AvaAnswerPacket` the same way Intelligence/Tower already do.
3. On the client, stop discarding `extractArtifacts()`'s `artifacts` result in
   `MovesPhaseStandaloneClient.tsx`; render turns with an `agentAnswer`/packet through
   `<AgentAnswerRenderer>` (or the shared `AgentMarkdown` path used in `AvaChatShell.tsx`'s
   `AvaMessage` at line 226) instead of the bare `<p>{turn.text}</p>`.
4. **Do not invent a new chart type or contract field.** `AnswerChartKind` already covers what's
   needed; reuse it exactly as Tower does.
**Acceptance criteria**: asking Moves' aVa chat a gate-readiness/analytics question (e.g. "how
close is this phase to passing?", "what's blocking approval?") returns a real chart backed by
`getMovePhaseTallies()`/readiness-pack data, rendered via the existing Recharts pipeline — not a
plain-text answer. Add tests mirroring `tower-chat-artifacts.test.ts`'s structure for the new
packet builder, plus a client-side test confirming a turn with a chart payload renders via
`AgentAnswerRenderer` and one without renders via the existing text path (no regression for
plain prose answers).

---

## Phase 2 — Content quality (logic changes, no schema)

### 2.1 Fix `completeDeliverable()`'s missing lineage write (MOVES-BUG-002)

**File**: `src/lib/agent/tools/program/completeDeliverable.ts` — confirmed no write to
`signed_off_version`/`approved_artifact_id` anywhere in this file.
**Acceptance criteria**: when `completeDeliverable()` runs, it writes the same lineage columns
`signOffDeliverable()` (`src/lib/programs/mutations.ts:618-714`) already writes on the real
client-upload path, so both paths leave a consistent, traceable record of which artifact is
authoritative. Add a regression test asserting `signed_off_version`/`approved_artifact_id` are
set after a successful `completeDeliverable()` call, matching the existing
`MOVES-BUG-002` acceptance criterion in the backlog.

### 2.2 Route session/workshop guides off the canonical archetype, not a name regex

**Files**: `src/app/api/v1/programs/[programId]/playbook/route.ts` (the `isAiPdlc` regex match
on `${move.archetype} ${move.name}`), `src/lib/programs/playbook/move-phase-playbook.ts`
(`DEFAULT_PLAYBOOKS`, `getMovePhasePlaybook`), `src/lib/programs/playbook/
ai-pdlc-design-sessions.ts` (the one real bespoke override, AI-PDLC's P3), and
`src/lib/programs/archetypes/registry.ts` (the canonical archetype list —
`AI_PDLC_FAMILIES`, `SOURCING_FAMILIES`, `AI_OPS_FAMILIES`,
`CONTACT_CENTER_AGENT_ASSIST_FAMILIES`, `COMMERCIAL_LENDING_AGENT_ASSIST_FAMILIES`).
**Problem confirmed**: every archetype except AI-PDLC gets the identical static session list
per phase number; the one working override is matched by a fragile string regex, not the
archetype's canonical id.
**Task**:
1. Change the override lookup to key off the Move's canonical `archetypeId` (however it's
   actually stored/resolved on `move` — check `move-archetype-resolution.ts` referenced
   elsewhere in this codebase for the canonical resolution helper), not a regex on free-text
   name/archetype strings.
2. Build session packs for the other four archetypes (Sourcing, AI Ops, Contact Center Agent
   Assist, Commercial Lending Agent Assist) the same way `ai-pdlc-design-sessions.ts` does —
   real facilitator questions grounded in each archetype's own `evidenceFamilies`, not generic
   filler. Match the quality bar of the existing AI-PDLC P3 pack (real discovery questions, not
   just session titles).
3. Separately (smaller, independent change): have `buildNextPhaseReadinessPack`'s
   `suggestedSessions` also factor in the Move's actual open `evidenceNeedPackets` (one session
   suggestion per unresolved required evidence family) rather than only the static
   per-phase constant — this uses data that already exists but currently isn't consulted here.
**Acceptance criteria**: two different archetypes at the same phase produce visibly different,
archetype-grounded session/question content (not byte-identical strings). Add tests asserting
at least two archetypes resolve to different playbook overrides, and that the lookup keys off
`archetypeId` not a name/string match.

### 2.3 Port the consulting-grade rubric into the Moves orchestrator's quality gate

**Files**: `src/lib/deliverables/quality/consulting-grade-rubric.ts` (the existing 9-dimension
0-10 LLM-judge rubric with an 8/10 floor, generic and not Source-specific in its inputs —
`artifactCode`/`artifactName`/`bodyMarkdown`/`sourceContext`), currently called only from
`src/lib/source/agent-generation/quality-review.ts` and Source's artifact-generation route.
Moves' current gate is `src/lib/deliverables/orchestrator/quality-validator.ts` +
`src/lib/deliverables/quality/transformation-gates.ts` — mostly structural checks (section/word
counts, a ≥12-word recommendation) plus a `GENERIC_PHRASES`/`FILLER_TELLS` regex list that's
warn-only below 2/4 hits, and shallow keyword checks (`hasCentralTension`,
`hasOptionsConsidered`) that pass on a single throwaway sentence.
**Task**:
1. Call `buildConsultingGradeReviewPrompt`/the rubric scorer from the Moves orchestrator's
   `board_grade_rewrite` → `render_package` boundary (`src/lib/deliverables/orchestrator/
   prompt-builder.ts:498-505` — the six-pass pipeline), as an additional scored gate alongside
   (not replacing) the existing structural `quality-validator.ts` checks.
2. Lower the `GENERIC_PHRASES`/`FILLER_TELLS` block threshold from 2/4 hits to 1 hit each
   (`quality-validator.ts:192-194`, `transformation-gates.ts:157`) — a single instance of
   "best-in-class" or "leverage synergies" in a board artifact should already fail.
3. Feed the `red_team` pass's actual critique output (currently discarded after informing one
   rewrite pass, `prompt-builder.ts:407-430`) into a lightweight verification check comparing
   red-team findings against the final render, rather than trusting the rewrite blindly
   resolved them.
**Acceptance criteria**: a Moves deliverable that would pass today's structural checks but reads
as generic/templated fails the new rubric gate with a specific, actionable reason (which
dimension scored below the floor and why). Add tests using realistic-but-synthetic generic vs.
sharp sample content to confirm the gate actually discriminates between them (not just that it
runs).

---

## Phase 3 — Data model / governance (higher risk — start only after Phases 1-2 are live-proven)

### 3.1 Wire the dead supersession state machine into the live mutation path (MOVES-CAPABILITY-001)

**Files**: `src/lib/programs/deliverable-versioning.ts` and
`src/lib/programs/deliverable-approval-flow.ts` — full, real state-machine implementations
(472/412 lines) with `superseded` transitions, confirmed imported ONLY by their own tests
(`src/__tests__/integration/programs/deliverable-versioning.test.ts`), never by
`src/lib/programs/mutations.ts` or any live route. Meanwhile `signOffDeliverable()`
(`mutations.ts:618-714`) already does the real, working part — new version, correct
`signed_off_version`/`approved_artifact_id` re-link — it just never marks the prior version
`superseded`.
**Task**: wire `deliverable-versioning.ts`'s supersession call into `signOffDeliverable()` (and
the Phase 2.1 fix to `completeDeliverable()`) so the prior AI-draft version's status is actually
set to `superseded` when a newer authoritative version lands. If, on inspection, the dead
module's state machine doesn't cleanly fit the current `deliverables_v2`/`deliverable_versions`
shape, adapt the minimum needed logic rather than wiring the whole unused module in wholesale —
but do not leave two divergent, undocumented models of the same concept in the codebase; either
retire one or make clear which is authoritative.
**Acceptance criteria**: after a client-approved upload supersedes an AI draft, querying the
prior version's row shows `status = 'superseded'`, not merely "no longer pointed to." Add a
regression test for this exact transition — this is precisely the `MOVES-CAPABILITY-001`
acceptance criterion in the backlog.

### 3.2 Fix evidence-family mis-categorization for non-lending archetypes

**File**: `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx:3638-3716`
(`inferCurrentStateFamilies`) — hardcoded to lending-domain keywords (`kyc`, `covenant`, `los`,
`crm`, etc.). For any non-lending archetype, or any filename that doesn't match those exact
keywords, it silently falls back to "assign to whatever evidence family is still open"
(`:3703-3715`) — the server accepts the upload against a validly-open family for the archetype,
so nothing is rejected, but the categorization is arbitrary, not content-matched.
**Task**: replace the single hardcoded keyword list with per-archetype keyword vocabularies
derived from each archetype's own `evidenceFamilies` definitions in
`src/lib/programs/archetypes/registry.ts` (each family likely already has a name/description you
can derive reasonable keywords from — don't invent unrelated vocabulary). When no confident
match exists, surface an explicit "couldn't auto-match this file — choose a family" UI choice to
the uploader instead of silently guessing via the "first open slot" fallback.
**Acceptance criteria**: uploading a file with archetype-appropriate keywords for a non-lending
archetype (e.g. a Contact Center Agent Assist evidence file) maps to the correct family, not
just whatever's first open. A file matching nothing gets an explicit chooser, not a silent
guess. Add tests covering at least two non-lending archetypes plus the no-match case.

### 3.3 Declare Moves evidence as a governed dataset and wire it toward `agent_ready`

**Read first, mandatory**: `AGENTS.md`'s "Context & corpus governance" section,
`docs/governance/CONTEXT_CORPUS_POLICY.md`, `src/lib/governance/context-corpus-policy.ts`
(`GovernedObject`, `evaluateGovernedObject`), `docs/governance/NEW_DATASET_ONBOARDING_POLICY.md`,
and `docs/governance/DATASET_POLICY_MANIFEST_TEMPLATE.json`.
**Problem confirmed**: Moves evidence lives in `move_artifacts`, `evidence_ledger` (surface=
`'moves'`), and `generated_artifacts` — none shaped as `GovernedObject`, none carrying
`agent_readiness_status`/`retrievability`/`cited_render_verified_at`. The only real indexing
pipeline (`src/scripts/governance/readiness-backfill.ts`,
`src/scripts/azure-ai-search-backfill.ts`) is hardcoded to a single table,
`enterprise_context_chunks` — no case for any Moves table. The cross-agent read path
(`src/lib/knowledge/agent-context-broker.ts:769-838`) reads the raw `evidence_ledger` table
directly, bypassing `evaluateGovernedObject`/`buildValidatedAgentContextBundle` entirely. There
is no manifest for Moves evidence under `docs/governance/dataset-manifests/`.
**Task, in this exact order — do not skip ahead**:
1. **Write the dataset manifest first.** Use
   `docs/governance/DATASET_POLICY_MANIFEST_TEMPLATE.json` to declare Moves evidence
   (`move_artifacts`, `evidence_ledger` surface=`'moves'`) as a governed dataset — owner,
   source_layer, retention, tenant scoping, PII posture. `validate:context-corpus manifests`
   must pass. **Nothing else in this item may proceed without this manifest passing.**
2. Extend `readiness-backfill.ts`/`azure-ai-search-backfill.ts` to add `move_artifacts` (and the
   Moves-scoped `evidence_ledger` rows) as a second `object_table` case, mapping their existing
   fields into `governed_object_readiness` — follow the exact pattern already used for
   `enterprise_context_chunks`, don't invent a new sidecar shape.
3. Build the actual indexing step (Postgres FTS or Azure AI Search, matching whichever the
   existing backfill scripts use for `enterprise_context_chunks`) so Moves evidence content can
   earn `fts_indexed`/`search_indexed`.
4. Add the cite-render verification step required before anything can claim `agent_ready`,
   per `evaluateGovernedObject`'s existing hard-block logic.
5. Reroute `agent-context-broker.ts`'s Moves `evidence_ledger` read through
   `buildValidatedAgentContextBundle` instead of the direct raw-table fetch, so cross-agent
   consumption (Nexus/Sentinel/Atlas/Steward) respects the same governed gate every other
   surface's context does.
**Acceptance criteria**: `validate:context-corpus` (manifests + runtime bundle checks) passes
with Moves evidence included; a Moves evidence object can genuinely progress from
`not_reviewed` → `committed_not_indexed` → `agent_ready` through real backfill/indexing runs,
not a hand-set flag; `agent-context-broker.ts`'s Moves segment goes through the validated bundle
path. **This is schema/data-plane work — follow the ACA data-build job rule
(`docs/ops/aca-data-build-job-rule.md`) for any actual production backfill run; do not run a
mutating backfill via ad hoc `az containerapp exec` or a production web request.**

---

## Report format

For each item (Phase 0's 7 sub-items plus the original 9): PR number, what changed (file:line), test results (real
`fireEvent`/assertion tests, not shape checks), release record path, and — for anything touching
`MovesPhaseStandaloneClient.tsx` or a shared route — the ACA runtime-invariant confirmation and
a live signed-in browser check (screenshot or described observation) before calling it done.
Explicitly flag anything you could not complete and why, rather than reporting partial work as
finished. Update `docs/backlog/moves-product-backlog.md` with a new `MOVES-AUDIT-00x` entry per
item (or reuse the existing `MOVES-CAPABILITY-001`/`MOVES-BUG-002` entries where they already
exist), following the established entry format (Problem statement, Severity, Workstream,
Status, Scope, Explicit non-goals, Discovered from).

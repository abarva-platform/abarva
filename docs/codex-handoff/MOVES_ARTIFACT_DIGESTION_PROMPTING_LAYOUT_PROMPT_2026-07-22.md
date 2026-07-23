# Codex handoff — Moves artifact digestion, prompting, and layout redesign

**Date**: 2026-07-22
**Requested by**: Anand Sundaram
**Context**: A real First Capital E2E proof bundle (client-provided zip,
`first-capital-moves-e2e-audit-bundle-2026-07-22`) was inspected directly — every claim below is
grounded in the actual downloaded artifacts and DOCX content, not the backlog's self-reported
status. Findings, quantified:

- The flagship P2 discovery deliverable (`...KYC_Discovery_Root-Cause_Decomposition...docx`) is
  535 paragraphs / ~19,245 words / **136 headings** / **zero Table of Contents** / **14 duplicate
  heading titles** (e.g. "Recommendation" appears both as §12 and again, separately, at paragraph
  517; "Source Register" appears in Appendix A.4 and again at paragraph 534).
- This is not a one-off: **every** regenerated variant of this same artifact in the bundle (19
  total DOCX files, one per Approve & Build re-run) shows 10-14 duplicate headings and zero TOC.
  The **Charter (P1)** artifacts show the identical pattern at smaller scale (1 duplicate heading
  each, only 1 embedded image). This is a shared-pipeline bug, not an artifact-specific one.
- The document's "Visual Exhibits" section has four sub-headings — **Issue Tree, Heatmap,
  Process Pain Map, Capability Maturity** — literally the consulting-framework visuals a board-
  grade artifact should lead with. Every one of them contains the identical placeholder sentence
  instead of a real diagram: *"Profile-required view for Discovery & Diagnostic Readout;
  populated from cited evidence, assumptions, and open inputs."* Only 2 images exist in the
  entire 61-page document, and the "Visual Exhibits" section sits at the very end, not in the
  executive summary where it would do work.
- A real executive summary exists (§1: working thesis, headline findings, what remains unproven,
  the decision ask) — but it's structured as section 1 of 13 equal-weight sections, not as a
  true front-loaded one-page synthesis.
- The "P2 Context Extract" (the digest handed to generation) contains the same raw CSV rows
  duplicated 2-3 times verbatim within a single evidence bullet — the noise starts at digestion,
  before the writing prompt ever runs.

**Correction to a prior audit this session produced**: an earlier pass described the orchestrator
as a "six-pass pipeline" (architect → evidence_grounding → full_draft → red_team →
board_grade_rewrite → render_package) and referenced an `ArtifactQualityContract`/
`DiagramRequirement` type. Both are **stale/incorrect** — verify before relying on either:
- The actual runtime pipeline (`src/lib/deliverables/orchestrator/orchestrator.ts`,
  `runDeliverableOrchestration`, ~lines 157-273) is a **3-stage decomposed pipeline**: one
  `architect` call, then bounded-concurrency `section_draft` calls per planned section, then one
  `synthesis` call, followed by code-side `assembleDeliverable` and the quality gate. The old
  `GENERATION_PASSES` six-item constant in `prompt-builder.ts` (~lines 498-505) is dead code —
  nothing in the orchestrator imports or calls `evidence_grounding`/`full_draft`/`red_team`/
  `board_grade_rewrite` today.
- `ArtifactQualityContract`/`DiagramRequirement` do not exist anywhere in `src/`. The real,
  closest-existing structure is `VisualArtifactContract`
  (`src/lib/deliverables/visual-artifact-contract.ts`) — a `CONTRACTS` record keyed by
  `DeliverableKey`, fields `requiredVisuals: string[]`, `requiredTables: string[]`,
  `minNarrativeDepth: "concise"|"standard"|"board-grade"`. It is a **prompt-injection contract**
  (feeds a `VISUAL_ARTIFACT_STANDARD` text block into the prompt) — it has no page-count target,
  no section list, and no framework-type field. Any "layout contract" work below extends this
  real file, not a fictional one.

Real deliverable profiles exist for (confirmed in `src/lib/deliverables/profiles/registry.ts`):
Initiative Charter, Discovery & Diagnostic Readout, Root-Cause Readout, Solution Approach &
Options, Target Architecture, Solution Design, Operating Model, Sourcing Strategy, Execution
Roadmap, Business Case, Financial Model, Value & Metrics Model, Executive Handoff, Value
Measurement Contract — spanning P1 through P5. Fixing the shared pipeline (Tracks A and B below)
benefits all of these; Track C defines the per-type layout/visual-framework spec each needs.

## Read first (mandatory)

1. `src/lib/programs/move-context-extract.ts` — `evidenceRowText` (~lines 276-291),
   `attachedItemFromEvidenceRow` (~line 341).
2. `src/lib/programs/evidence-ingestion.ts` — `extractProgramEvidenceFromText`
   (~lines 179-242): `summary` (line ~220), `extractedText` (line ~227), signal collection
   (`collectPrefixed`/`collectSectionItems`, ~lines 190-216).
3. `src/lib/deliverables/orchestrator/section-generation.ts` — `expectedExhibitsForProfile`
   (~lines 290-327), `assembleDeliverable` (~lines 437-486), `consolidateOpenInputPlaceholders`
   (~lines 166-185). Read the file header (lines 1-10, "Slice 0") for the real pipeline
   description.
4. `src/lib/deliverables/orchestrator/orchestrator.ts` — `runDeliverableOrchestration`
   (~lines 157-273) — the real 3-stage pipeline. Note lines 3-4 have a stale comment describing
   the old six-pass design; fix that comment while you're in there (cheap, avoids misleading the
   next person).
5. `src/lib/deliverables/orchestrator/renderers.tsx` — `exhibitToDocxBlocks` (~lines 652-686),
   and the `kind` inference for exhibits (~lines 315-319 in `section-generation.ts`,
   `key.includes("map") || key.includes("flow") ? "flow" : "matrix"` — note this incorrectly
   matches `"heatmap"` and `"process_pain_map"` on the substring `"map"`, so both currently
   render via `svgFlowExhibit` instead of an actual matrix/heatmap grid, independent of whether
   they're populated).
6. `src/lib/deliverables/profiles/registry.ts` — the 14 deliverable profiles, each with a
   `requiredExhibits` list (`discoveryReport`'s is `["issue_tree", "heatmap", "process_pain_map",
   "capability_maturity"]`, ~lines 213-243).
7. `src/lib/deliverables/visual-artifact-contract.ts` — the real contract structure to extend.
8. `src/lib/deliverables/quality-validator.ts` and `src/lib/deliverables/quality/
   transformation-gates.ts` — read what the existing quality gate does and doesn't check (per
   this session's prior audit: mostly structural presence checks, no duplicate-heading check).

## Hard constraints

- **No changes to `governance.ts`, `evaluateGate()`, or the Approve & Build wiring.** This is
  content-generation and rendering work; it must not change what makes a gate pass or fail.
- **No live mutating action against any Move other than the confirmed sandbox**
  (`Codex Proof Agent Assist 123131`, `HEALTHCARE_PROVIDER-CODEX-2026`), or the sandbox
  referenced in the audit bundle if it's still reachable and still a sandbox
  (`Codex Proof First Capital E2E 20260721` — confirm it's genuinely disposable before treating
  it as one; if uncertain, use the healthcare sandbox instead).
- **Do not fabricate a page-count or section list for any of the 14 profiles without checking
  what that profile's `requiredExhibits`/`requiredTables`/existing prompt text already implies.**
  Ground each layout spec in the real profile definition in `registry.ts`, not a generic template
  applied uniformly to all 14.
- **This is presentation/generation-quality work, not a schema change.** The layout contract
  extension (Track C) should live as a TypeScript structure alongside/extending
  `visual-artifact-contract.ts`, the same way that file already works — no new Postgres table,
  no governance manifest needed for this specific work.
- **Every merged PR needs real tests, a release record, and — for anything affecting a real
  generated artifact — an actual before/after DOCX generated against the sandbox Move, inspected
  the same way this audit was done** (python-docx or equivalent: paragraph/heading/word counts,
  duplicate-heading check, embedded-image count) **rather than just a passing unit test.** A
  test asserting the code ran without throwing is not sufficient evidence this actually fixes the
  reported bloat/duplication/stub problem — regenerate a real artifact and inspect it.
- **Check for collisions before starting**, same as every other item this session — this repo
  has continuous parallel PR activity.

---

## Track A — Fix input digestion (Context Extract duplication)

### A.1 De-duplicate `evidenceRowText`'s three overlapping text sources

**Problem**: `evidenceRowText` (`move-context-extract.ts:276-291`) concatenates `row.summary`
(first 4 raw lines of the source file), `signals` (keyword-matched lines — which, for a CSV
where columns are literally named things like "defect_type"/"issue", re-catches many of the same
rows a second time), and `row.extractedText` (the entire raw file, up to 20,000 chars, which
*starts with the same first 4 lines as `summary`*) — with no de-duplication between the three.
This is why the same CSV rows appear 2-3 times verbatim in one evidence bullet.
**Fix**: restructure `evidenceRowText` so these three sources don't overlap — e.g. `summary`
should not be re-included inside `extractedText`'s preview window, and `signals` should exclude
lines already captured verbatim in `summary`. The goal is one clean, non-redundant preview per
evidence item, not three overlapping views of the same rows.
**Acceptance criteria**: regenerate a Context Extract for a Move with a real CSV evidence item;
confirm no row of source text appears more than once across the full evidence bullet. Add a
regression test with a synthetic CSV fixture asserting the extract's total text does not contain
the same distinctive substring twice.

### A.2 Cap raw-content contribution per evidence item

**File**: `evidence-ingestion.ts:227` — `extractedText` allows up to 20,000 characters of raw
file content per evidence item, which is a major contributor to prompt bloat even after A.1's
dedup fix.
**Fix**: lower the raw-content cap for `extractedText` and/or bias toward the already-extracted
`signals` (structured facts) over the raw passthrough when both exist — the digestion output
handed to generation should read as a distilled brief, not a re-embedded copy of the source file.
Do not remove the ability to fall back to raw text when no structured signal exists (needed for
formats without a clean row/column shape) — only tighten it when a cleaner extraction is already
available.
**Acceptance criteria**: a Context Extract for a Move with several CSV/DOCX evidence items is
meaningfully shorter than today's baseline (measure before/after word count on the same real
sandbox Move) while still containing every real, distinct fact from the source.

---

## Track B — Fix the generation/assembly pipeline

### B.1 Root-cause and fix why diagram exhibits render as unpopulated stubs

**File**: `section-generation.ts:290-327`, `expectedExhibitsForProfile`. When the architect
pass's `brief.expectedExhibits` doesn't include a real entry for one of a profile's
`requiredExhibits` keys (e.g. `discoveryReport`'s `issue_tree`/`heatmap`/`process_pain_map`/
`capability_maturity`, `registry.ts:213-243`), this function synthesizes a stub with the generic
placeholder description — no evidence is ever read to populate real diagram content for the
fallback case.
**Task**: trace why the architect pass isn't emitting real `expectedExhibits` entries for these
keys in practice (is the architect prompt not asking for them explicitly enough? is evidence
that could drive them — e.g. the KYC control-defect CSV for an issue tree, the metrics CSV for a
heatmap — not being surfaced to the architect pass at all?), and fix it so the architect pass
produces real, evidence-grounded exhibit content for these required keys rather than falling
through to the stub. If a genuine "not enough evidence yet" case exists, the fallback should say
something honest and specific about what's missing (e.g. "requires the KYC control-defect log,
not yet uploaded"), not the generic boilerplate sentence used for every unmatched key today.
**Acceptance criteria**: regenerate the discovery-report artifact against the sandbox Move with
real evidence uploaded (the synthetic packs in the audit bundle are a good source — e.g.
`08_p2_kyc_control_defect_log_synthetic_2026-07-22.csv` for an issue tree); confirm the four
required exhibits contain real content derived from that evidence, not the placeholder string.

### B.2 Fix the "heatmap"/"process_pain_map" kind-misclassification

**File**: `section-generation.ts:315-319` — `key.includes("map")` matches both `"heatmap"` and
`"process_pain_map"`, routing both to `svgFlowExhibit` (a flow-diagram renderer) instead of an
actual matrix/heatmap grid. This is wrong regardless of B.1 — even with real content, "Heatmap"
would render as a flow diagram.
**Fix**: make the kind-inference exact-match or keyword-list-based instead of a loose substring
check (e.g. explicit `"heatmap" → "matrix"`, `"process_pain_map" → "flow"` or whatever the
correct per-key mapping actually is — check what visual each of the 4 keys is meant to be first).
**Acceptance criteria**: each of the four required discovery-report exhibits renders as the
visual type its name implies (a heatmap literally looks like a heatmap grid, not a flowchart).

### B.3 Add a duplicate-heading/duplicate-exhibit-key check to `assembleDeliverable`

**File**: `section-generation.ts:437-486`, `assembleDeliverable` — currently only normalizes
placeholders and uncited figures; nothing checks for duplicate section titles or duplicate
exhibit keys before finalization. This is why the same "Recommendation"/"Source Register"
headings appear twice in the real generated artifact.
**Fix**: add a pass that detects duplicate section/heading titles (and duplicate exhibit keys)
across the assembled sections, and either merges them or fails the quality gate with a specific,
actionable reason — don't ship a document with the same heading appearing twice.
**Acceptance criteria**: regenerate the discovery-report artifact and confirm zero duplicate
heading titles in the final DOCX (verifiable the same way this audit did — extract all
`Heading`-styled paragraph text via python-docx and assert no duplicates). Add a unit test on
`assembleDeliverable` with a synthetic section plan containing an intentional duplicate, asserting
it's caught.

### B.4 Build a real Table of Contents, and stop telling the model not to have one

**Files**: `prompt-builder.ts:256` currently instructs the model *not* to include a table of
contents. There is no TOC-generation code anywhere in `src/lib/deliverables/` — this is new
capability, not a bug fix.
**Task**: generate a real, code-driven Table of Contents from the final assembled section/
heading structure (not model-authored) — for DOCX, use the `docx` library's native
`TableOfContents` field construct (check what version/API this repo's `docx` dependency
supports) so it's a real, clickable, auto-updating Word TOC, not static text. Keep the prompt
instruction telling the model not to hand-author a TOC (that's correct — a model-written TOC
would drift from the real structure), but add the code-generated one at render time.
**Acceptance criteria**: a regenerated discovery-report DOCX opens with a real, correct Table of
Contents matching the actual heading structure.

### B.5 Make the executive summary a true front-loaded synthesis

**Problem**: today's executive summary (§1) is written as part of the same per-section drafting
pass as every other section, so it reads as "section 1 of 13," not as a synthesis of the whole
finished document.
**Fix**: generate the executive summary in a distinct step *after* the other sections are
drafted and assembled — a synthesis pass that reads the finished body and writes a genuinely
compressed, standalone front page (headline finding, the decision ask, 3-4 supporting points,
one visual — see Track C) that could be read alone and still convey the whole document's point.
This may already partially exist in the `synthesis` stage of the real 3-stage pipeline
(`orchestrator.ts` ~line 246-254) — check what that stage currently produces before building a
new one; extend it if it's already close, don't duplicate it.
**Acceptance criteria**: the executive summary section, read on its own, gives a reader the
document's full point without needing to read the other 12 sections — verified by an actual
side-by-side read of a regenerated artifact's §1 in isolation.

---

## Track C — Per-artifact-type layout and visual-framework spec

Extend `src/lib/deliverables/visual-artifact-contract.ts`'s `CONTRACTS` record (or add a
parallel structure it composes with — your call, but don't create a second, disconnected
"layout contract" system; it should read as one coherent extension of the real existing file)
with, for each of the 14 profiles in `registry.ts`:

- **Target page-count range** (a realistic range, not a hard cap that truncates real content —
  e.g. "8-14 pages" not "exactly 10").
- **Mandatory section list, in order**, matching what that specific profile's `requiredExhibits`/
  existing prompt content already implies — do not invent a generic template and apply it to all
  14 uniformly.
- **One primary visual framework, chosen for what that artifact is deciding** — not a generic
  SWOT bolted onto every type. Concrete starting points grounded in real evidence already present
  in the audit bundle's synthetic packs (use these as the pattern, not literal requirements if a
  profile's real content differs):
  - **Discovery & Diagnostic Readout**: an Impact × Readiness (or Urgency × Confidence) 2×2,
    leading the executive summary — directly answers "where do we act first."
  - **Solution Approach & Options / Target Architecture**: a Value × Complexity 2×2. Note real
    data for exactly this already exists as evidence in the bundle
    (`P3_01_solution_options_value_complexity_scorecard.csv`) — this is the single best concrete
    proof-of-concept to build first, since the data-to-diagram path is already real.
  - **Business Case / Financial Model**: a risk/value quadrant or a waterfall (value bridge) —
    check what `AnswerChart`'s `waterfall`/`value-bridge` kinds (from the chat-analytics work in
    the earlier audit, `src/lib/ava-answer/contract.ts`) already support; there may be a reusable
    chart-shape pattern here even though that infra targets chat, not DOCX.
  - **Execution Roadmap / Executive Handoff**: a timeline/swimlane view, not a matrix — these are
    sequencing artifacts, a 2×2 doesn't fit; pick the framework that matches the actual decision
    each artifact supports, section by section.
- **An explicit rule against duplicate trailing sections** — nothing after the last numbered
  section may restate content from Appendix A / the main body under a different heading name
  (this ties directly to B.3's dedup check — Track C defines the *intended* structure, B.3
  *enforces* it doesn't get violated).

**Acceptance criteria**: for at least the Discovery & Diagnostic Readout and Solution Approach &
Options profiles (the two with the strongest real evidence to prove this against), a regenerated
artifact leads its executive summary with a real, populated 2×2 (not a stub), matches its target
page-count range, and contains zero duplicate trailing sections. Report exactly which of the
other 12 profiles were also updated vs. left for a follow-up — do not claim all 14 are done
unless all 14 were actually verified against a real regenerated artifact.

---

## Report format

For each of the three tracks: PR number(s), what changed (file:line), and — critically — an
actual before/after comparison of a real regenerated DOCX artifact (word count, heading count,
duplicate-heading count, embedded-image count, presence of a real TOC), inspected the same way
this handoff's grounding was produced (python-docx or equivalent), not just "tests pass." Update
`docs/backlog/moves-product-backlog.md` with a new `MOVES-ARTIFACT-00x` entry per track,
following the established format. Flag explicitly which of the 14 deliverable profiles were
actually verified against real output vs. only updated in the layout-contract data without a
regenerated-artifact check — don't round up partial coverage to "done."

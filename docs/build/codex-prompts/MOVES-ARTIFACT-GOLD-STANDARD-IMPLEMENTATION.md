# Prompt — Moves Artifact Gold Standard Implementation

Use this prompt for the next build wave.

## Mission

Implement the Moves Artifact Gold Standard incrementally. The goal is not to add
more documents. The goal is to make every Moves artifact board-grade, visually
usable and governed by typed quality standards.

Read first:

- `docs/strategy/MOVES-ARTIFACT-GOLD-STANDARD.md`
- `docs/strategy/MOVES-DELIVERABLE-AND-BUSINESS-CASE-SPEC.md`
- `docs/strategy/MOVES-AGENTIC-SHAPING-METHODOLOGY.md`
- `src/lib/programs/expert-kernel/exports/artifact-catalog.ts`
- `src/lib/programs/expert-kernel/scenario-quality-lab.ts`

## Non-negotiables

- Do not fabricate content.
- Do not hand-author one-off sample artifacts.
- Build typed standards and deterministic scoring.
- Keep work PR-sized.
- Add tests for every increment.
- Do not change nav/topbar unless explicitly requested.

## Increment 1 — Standards Layer

Create:

- `src/lib/programs/expert-kernel/artifact-standards.ts`
- `src/lib/programs/expert-kernel/artifact-quality-rubric.ts`
- tests under `src/lib/programs/expert-kernel/__tests__/artifact-standards.test.ts`

Required behavior:

- One standard per kernel artifact:
  - `discover_brief`
  - `charter_case`
  - `business_case_pack`
  - `financial_model`
  - `cfo_pack`
  - `mobilize_pack`
- Each standard defines:
  - audience
  - decision job
  - required sections
  - required visuals
  - required evidence
  - hard-fail rules
  - minimum acceptable score
- Rubric scores:
  - executive clarity
  - evidence grounding
  - financial defensibility
  - expert challenge
  - visual usefulness
  - actionability
  - formatting/readability
  - auditability
- Add a function that scores the current generated artifact view models against
  the standard and returns:
  - score
  - hard failures
  - missing sections
  - missing visuals
  - improvement recommendations

Definition of done:

- All six artifacts have standards.
- Current artifacts can be scored.
- Tests prove hard fails override score.
- Tests prove business case without sensitivity fails.
- Tests prove architecture artifact without diagram fails once architecture
  standard is introduced.

## Increment 2 — Master Move Dossier View Model

Create:

- `src/lib/programs/expert-kernel/master-move-dossier.ts`
- tests under `src/lib/programs/expert-kernel/__tests__/master-move-dossier.test.ts`

Required behavior:

- Build a master dossier for any `ExpertReviewCaseId`.
- Dossier has:
  - top status rail
  - section navigation
  - executive summary
  - phase sections
  - evidence/gap section
  - Tower measurement section
  - downloads section
  - review/sign-off section
- The dossier links each section to the relevant artifact IDs.
- The dossier includes artifact quality scores from Increment 1.

Definition of done:

- Apex, Meridian and First Capital dossiers build deterministically.
- Each dossier includes all phase sections and all six artifact IDs.
- Missing evidence appears as gaps, never blank.

## Increment 3 — HTML Master Artifact

Create a route or static renderer for the HTML dossier. Prefer a route under the
existing authenticated expert-review area unless the founder explicitly wants it
public.

Candidate route:

- `/programs/expert-kernel/expert-review/dossier?case=apexretail`

Required UX:

- Left navigation.
- Top status rail.
- Executive summary above the fold.
- Phase sections.
- Download cards.
- Evidence/gap table.
- Review/sign-off matrix.
- Responsive, readable, board-grade.

Definition of done:

- Browser-tested locally.
- No overlapping text.
- No placeholder lorem ipsum.
- Screenshots captured for desktop and mobile.

## Increment 4 — Visual Uplift

Add minimum viable visuals into the dossier and, where feasible, into exports:

- value vs investment chart;
- assumption sensitivity stack;
- cost by workstream;
- role mix by phase;
- 30/60/90 swimlane;
- evidence/gap matrix;
- risk/control heatmap;
- architecture context/data-flow placeholders grounded in current architecture
  outputs.

Definition of done:

- Tests fail when required visuals are missing.
- Dossier score improves or gaps are explicit.

## Increment 5 — Regenerate Samples

Regenerate public sample artifacts only after standards and visuals land.

Definition of done:

- `public/downloads/moves-artifacts/` samples updated.
- Live URLs return 200.
- DOCX/XLSX/PDF byte validation passes.
- Samples meet the standard or list gaps honestly.

## Report Format

After each PR:

- PR number
- files changed
- validation commands
- artifact-quality score movement
- hard fails closed
- remaining hard fails

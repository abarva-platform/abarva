# 2026-07-25-roadmap-pr9-governed-structured-output — PR9: governed structured roadmap output engine + prompt wiring

## Release ID

`2026-07-25-roadmap-pr9-governed-structured-output`

## Status

`candidate`

## Plain-English Summary

PR9 makes the P4 execution roadmap emit a **machine-readable structured block, explicitly**, alongside
its narrative — never derived by parsing prose or SVG — and adds the governed engine that validates it
and turns it into the shared `RoadmapPresentationContract` plus three synchronized renders (HTML
preview, DOCX detail, PPTX deck), or **fails honestly** with no contract.

What ships in this PR (all unit-proven, type-clean):

1. **Structured-output schema + parser** (`roadmap-structured-output.ts`) — strict Zod schema
   (unknown fields rejected), sentinel-delimited block (not a ```json fence, which the prose itself
uses), the exact instruction both pipelines give the model, and a parser that fails honestly:
absent / malformed / schema-invalid / missing-horizon-outcome → `roadmap_structured_output_invalid`
   with NO input. Never infers from prose; never defaults a missing horizon outcome.
2. **Prose ⇄ structure consistency guard** (`roadmap-prose-structure-consistency.ts`) — blocks on
   material contradictions: horizon-count mismatch, a title claiming controlled scaling with no
   control gate, a milestone described in prose but absent from the structure, a dependency the prose
   calls resolved but the structure marks unproven, and lifecycle/finality-language mismatch. It does
   not silently pick a side.
3. **Governed builder** (`build-governed-roadmap-artifact.ts`) — the single seam both pipelines call:
   parse → block unsupported `approved` claims (any `approved` without authoritative approved-evidence
   is blocked) → cross-check the model's claimed lifecycle against the governed state → prose/structure
   consistency → build ONE contract → render the three synchronized formats → emit a provenance record
   (pipeline, contract version, schema-validation result, content hash, generatedAt, lifecycle state,
   lineage, cited source refs, extraction issues). Any failure returns a governed failure with NO
   contract and NO renders.
4. **Prompt wiring into BOTH pipelines** — golden-bar (`p4RoadmapAssignment`) and orchestrator
   (`artifactHonestyDiscipline`, which feeds every generation pass) both append the same
   `roadmapStructuredOutputInstruction()`, so both emit the same schema for one validator + one
   extractor.

## Layer Impact

- **global-control-lane**: additive generation-prompt instruction (both pipelines) + a pure governed
  engine. No route, schema, flag, persistence, or data change in this PR.

## Client Applicability

- All clients, once the live route is wired to call the governed builder and expose the downloads
  (the next PR). This PR asks the model to ALSO emit a structured block (additive to the prompt — the
  block is ignored by current persist/download paths until wired), so it changes nothing a client
  sees yet and cannot break existing roadmap generation.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- ACA runtime invariant: to be verified after deploy (no runtime behavior change beyond the added
  prompt text).
- Live signed-in proof required: yes — at the live-route wiring PR (persist + download + Meridian
  regeneration), recorded below as remaining work.

## Changes Included

- `src/lib/deliverables/roadmap-structured-output.ts` (new) — schema, delimiters, instruction, parser.
- `src/lib/deliverables/roadmap-prose-structure-consistency.ts` (new) — consistency guard.
- `src/lib/deliverables/build-governed-roadmap-artifact.ts` (new) — the governed builder + provenance.
- `src/lib/deliverables/strategic-moves-artifact-standard.ts` — golden-bar roadmap prompt now appends
  the structured-output instruction.
- `src/lib/deliverables/orchestrator/prompt-builder.ts` — orchestrator roadmap honesty discipline
  appends the same instruction; `artifactHonestyDiscipline` exported for test.
- Tests: `roadmap-governed-output.test.ts` (17), `roadmap-structured-output-prompt-wiring.test.ts`
  (4) — covering valid→contract, absent→no-contract, malformed→blocked, unknown-field→rejected,
  missing-horizon-outcome→blocked, missing evidence→`evidence_required` (never approved), unsupported
  approval→blocked, lifecycle mismatch→blocked, prose/structure horizon mismatch→blocked, both
  pipelines share schema + contract version, tenant/move lineage preserved, HTML/DOCX/PPTX carry the
  same content hash, and both pipelines' prompts carry the block markers.

## QA / Validation

- `npx jest` (new suites) — 35/35 pass. Full `src/lib/deliverables` — the pre-existing 6-failure
  baseline (golden-regression, visual-and-prompt, renderers snapshots) is **unchanged**; PR9 adds
  zero new failures (verified by running the three baseline suites with PR9 changes stashed).
- `npx eslint` on changed files — clean. `tsc --noEmit` — 0 errors.

## Rollout Plan

Squash-merge to `main`. No flag, no migration. Stacks on PR8 (#5625, the extractor) — merge after it.

## Rollback Plan

Revert the merge commit. The only runtime effect is additional prompt text asking the model to emit a
structured block; reverting removes it. No schema/data changes.

## Audit Evidence

- PR: to be opened. Builds on PR4 #5617 (contract), PR5 #5619 (PPTX), PR6 #5621 (DOCX),
  PR7 #5623 (HTML preview), PR8 #5625 (extractor).

## Known Gaps

The roadmap pilot **stays OPEN**. This PR delivers the governed structured-output mechanism (model
emits + system validates + synchronizes) and wires both prompts. It deliberately does **not** include:

- **Persist write + download route (live wiring).** Making the live generate/persist path call the
  governed builder, persisting the contract to `deliverable_versions.structured_data` + provenance,
  and adding a download route that serves HTML/DOCX/PPTX from the persisted contract (refusing when no
  valid contract exists). This mutates a shared live persist path and adds routes that can only be
  meaningfully proven against the running app — so it is the immediately-following PR, done against the
  app, where the live proof lives. Splitting it keeps this PR safe and reviewable (no risk of breaking
  live roadmap generation) per the "do not combine a gate-model change, renderer architecture, and
  route wiring into one unsafe PR" discipline.
- **GOV-5 live regeneration** on the Meridian Move + verify governance state, once wired.
- **PDF derived from the PPTX** — no in-process PPTX→PDF converter exists here (LibreOffice absent);
  the governed PDF is produced as part of the manual PowerPoint export during acceptance.
- **Application-level editability proof (GOV-11)** — Microsoft PowerPoint open/edit/save/reopen/export
  on the real live-generated Meridian PPTX (not the local renderer fixture).

**Closure language stays: "story-first renderer proven; governed-artifact synchronization, executive
packaging and editable PPTX delivery remain open."** The model now emits a governed, validated,
synchronized structured contract; wiring the live product route to persist and serve it, and the
office-application acceptance, are what remain.

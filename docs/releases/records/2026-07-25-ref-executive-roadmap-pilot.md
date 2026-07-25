# 2026-07-25-ref-executive-roadmap-pilot — REF_EXECUTIVE_ROADMAP: the first Visual & Artifact Reference Contract

## Release ID

`2026-07-25-ref-executive-roadmap-pilot`

## Status

`candidate`

## Plain-English Summary

The two prior increments this session (Charter and P3/P4 word-band reconciliation, PRs #5593/#5594)
fixed _how much_ an artifact should say. They did not fix _what it should show_ or _why_. The P4
Executive Roadmap had no dedicated prompt at all in one pipeline, no diagram requirement in the
other, and no SVG renderer case — it drew as a generic timeline, indistinguishable from any other
exhibit, with no shared definition of what "good" looks like.

This release is the **pilot** for a design-system-style **Visual & Artifact Reference Contract** —
one reusable, named spec (`REF_EXECUTIVE_ROADMAP`) that both pipelines, the renderer, and the
quality gate all read from. Rather than build all ~20 references the eventual system needs
(Current-State Overview, Root-Cause Tree, Target Architecture, Business Case, etc. across P2/P3/P4),
this proves the full pattern on one artifact type first, chosen because it had the least existing
infrastructure and the most detailed user specification.

What it adds:

1. **A single source-of-truth contract** (`executive-roadmap-reference.ts`) defining purpose,
   audience, the 4 required horizons, the 6 allowed workstreams, per-item required fields, and
   forbidden patterns (sprint numbers, Gantt language, day/week counters, unapproved calendar
   dates) — plus an **Executive Story Contract** layer (executive question, core message, decision
   required, audience takeaway, narrative arc) sitting above it, per an explicit request mid-session
   that the visual contract alone doesn't guarantee a coherent executive narrative.
2. **Both pipelines' prompts now reference it.** golden-bar gains a dedicated `p4RoadmapAssignment()`
   (previously `execution_roadmap` fell through to one generic P4 sentence); the orchestrator's
   `MOVES_ROADMAP` brief gains a real `expectedExhibits` entry (previously empty).
3. **A real SVG renderer** (`svgRoadmapExhibit()`) — horizons × workstreams grid, decision-gate
   diamonds, dashed dependency connectors — registered in the exhibit dispatcher, replacing the
   generic flow/timeline fallback every roadmap previously rendered as.
4. **The quality gate now actually checks the reference, not just prompts it.** `requiredElements`
   on `ExpectedExhibit` has existed since the 2026-07-15 pilot but was only ever read into the
   prompt — this is the first real presence-check against the generated exhibit. A matching
   forbidden-content-pattern check flags implementation-schedule language on both pipelines. Both
   are advisory (warning) only, following the same caution applied to the word-count bands until
   proven on real generations.
5. **Human-facing reference documentation** (`docs/design/moves/reference-library/executive-roadmap/`)
   — purpose, audience, rendering rules, an illustrative structured-data example, and hand-authored
   gold-standard/bad-example SVGs matching the actual renderer output, giving a future Claude session
   (or the next reference's author) a concrete template to follow.

## Layer Impact

- **global-control-lane**: shared P4 roadmap reference contract, applies to both generation
  pipelines for every tenant.

## Client Applicability

- All clients: yes — every P4 Executive Roadmap generated after this deploys (either pipeline)
  uses the new prompt, renders through the new SVG layout, and is checked against the new
  required-element/forbidden-pattern rules.

## Changes Included

- `src/lib/deliverables/shared/reference-library/executive-roadmap-reference.ts` — new, the contract
  (including the `ExecutiveStoryContract` narrative-arc layer).
- `src/lib/deliverables/orchestrator/types.ts` — `ExpectedExhibit["kind"]` gains `"roadmap"`;
  `QualityBar` gains `requiredExhibitElementsByKind` and `forbiddenContentPatterns`.
- `src/lib/deliverables/orchestrator/briefs/deliverable-structures.ts` — `MOVES_ROADMAP.expectedExhibits`
  populated (was empty).
- `src/lib/deliverables/orchestrator/quality-bar-registry.ts` — `moves::roadmap` gains
  `requiresCentralTension` (the storytelling check, reusing the existing `TENSION_RE` heuristic
  already proven for Charter/business_case) plus the new required-elements/forbidden-pattern wiring.
- `src/lib/deliverables/orchestrator/quality-validator.ts` — new real checks for both new `QualityBar`
  fields (advisory-only).
- `src/lib/deliverables/strategic-moves-artifact-standard.ts` — new `p4RoadmapAssignment()`, wired
  into `phaseAssignmentForArtifact()`; `premiumGoldenBarOptionsForArtifact` wires
  `forbiddenContentPatterns` for `execution_roadmap`.
- `src/lib/deliverables/orchestrator/renderers.tsx` — new `svgRoadmapExhibit()` + dispatch case.
- `src/lib/deliverables/golden-bar.ts` — matching `forbiddenContentPatterns` option/check/result field
  for this pipeline.
- `docs/design/moves/reference-library/executive-roadmap/{README.md,rendering-rules.md,example-data.json,gold-standard.svg,bad-example.svg}` — new human-facing reference docs.
- Tests: new contract-shape test, new quality-validator reference-contract test, new golden-bar
  forbidden-pattern tests, new renderer test (roadmap grid + gate/dependency legend), one existing
  fixture fix (`persist-move-generated-artifact.test.ts` — an unrelated local drift discovered
  during validation, corrected here: the test's mock `SolutionContext` was locally missing
  `evidencePackets: []` versus `origin/main`, unrelated to this PR's own content).

## QA / Validation

- `npx eslint` on all changed/new files — pass, in a clean worktree built from `origin/main` (which
  already includes PRs #5593 and #5594).
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` (full project) — pass.
- `npx jest src/lib/deliverables` — 466/472 pass; the 6 failures are the same pre-existing baseline
  confirmed on a clean `origin/main` checkout (3 unrelated suites with stale fixture-name/snapshot
  expectations, unchanged by this PR).
- `node scripts/release-check.mjs --base origin/main --head HEAD` — pass, changed-file list matches
  exactly this PR's diff.
- Live signed-in proof — not yet run for this PR.

## Rollout Plan

Merge to `main` via squash-merge PR, repo-owned `aca-main-deploy.yml` deploys it. No flag, no
migration.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- ACA runtime invariant: to be verified after deploy
- Live signed-in proof required: yes — generate a P4 Executive Roadmap on a test Move through both
  pipelines and confirm the rendered exhibit is the new horizons × workstreams grid with decision
  gates (not the old generic timeline/flow fallback), and confirm a deliberately schedule-heavy
  input surfaces the new advisory warning instead of being silently accepted.

## Rollback Plan

Revert the merge commit. No schema/data changes.

## Audit Evidence

- PR: to be opened.
- Prior context: PRs #5593 (Charter word-count advisory band), #5594 (P3/P4 word-band
  reconciliation) — this release extends the same "one shared contract, both pipelines read it"
  pattern from word budgets to visual/exhibit content for the first time.

## Known Gaps

- This is a **pilot for one artifact type**. The other ~19 references in the eventual design system
  (Current-State Overview, Root-Cause Tree, Target Architecture, Business Case, Value Waterfall,
  Operating Model, etc.) are not built here — they follow this same shape once this pattern is
  proven live.
- No generic "reference loader" abstraction exists yet — deliberately deferred until 2-3 more
  references exist and the real common shape across them is clear, per the plan's explicit scoping.
- `requiredExhibitElementsByKind` and `forbiddenContentPatterns` are advisory (warning) only on both
  pipelines, matching the same caution applied to the word-count bands — no live-generation sample
  exists yet to prove these checks are well-calibrated before making them hard blockers.
- The Executive Story Contract layer (narrative arc, core message, decision required) is currently
  enforced only via the existing `requiresCentralTension`/`TENSION_RE` heuristic (a fuzzy text-match,
  not a structural check) — a fuller "does this artifact actually argue a coherent case section by
  section" validator is real follow-up scope, not built here.
- The gold-standard/bad-example SVGs in the reference docs are hand-authored to match the renderer's
  actual output — they are documentation, not executable test fixtures; a future improvement could
  render them programmatically from the same fixture data the renderer tests use, to guarantee they
  never drift from the real implementation.

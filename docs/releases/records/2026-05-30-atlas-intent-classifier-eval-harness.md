# 2026-05-30 Atlas · intent classifier expansion (25 CXO question types) + Tier-1/Tier-2 eval harness

## Release ID

`2026-05-30-atlas-intent-classifier-eval-harness`

## Status

`candidate`

## Plain-English Summary

Before this PR, Atlas (the CXO advisor on the Tower surface) had only 8
scripted intents. The CXO-quality audit
(`docs/audits/ATLAS-CXO-QUALITY-AUDIT-2026-05-30.md`, audit PR #2562)
identified 25 canonical questions a real CIO/CFO/CDO/CDAO asks against
the portfolio. Atlas's classifier covered 8 of them; the other 17
(~68 %) fell through to the LLM path — which the audit flagged as the
worst path (cross-tenant alias bleed, non-determinism, mid-sentence
truncation, templated comparison-row boilerplate).

Most concretely: "Show me lagging programs by realized value" misrouted
to `intent='roi'` and returned portfolio-wide value totals instead of
a ranked list of underperforming programs.

This PR closes the coverage gap and adds the eval scaffolding that
keeps it closed:

1. **Intent expansion** — the classifier now has dedicated intents and
   handlers for all 25 question types in audit §3, organized by
   category (portfolio diagnostics, peer/industry, spend/cost,
   risk/governance, decisions, drilldown, compare/hypothetical).
2. **Gold-standard response shape** — every handler returns the
   audit §4 contract: Lead (1 sentence, names the active tenant),
   Evidence (2-4 short citations), Honesty line (named gap when
   applicable), Next step, Handoff (when scope-crossing). When the
   underlying data layer cannot yet supply a field, the honesty line
   names the gap — no fabricated values, no boilerplate.
3. **Tier-1 / Tier-2 eval harness** — invariant grep guards + golden
   classifier snapshots wired into a new `npm run atlas:eval` script
   and a new `.github/workflows/atlas-quality.yml` CI gate.
4. **Tier-3 model-graded eval** — documented as a follow-up at the
   bottom of `atlas-golden.test.ts` with the sketched grader prompt
   and the rationale for nightly cadence.

The LLM path is preserved as a deliberate fallback for genuinely
free-form questions (industry corpus, knowledge-corpus questions),
NOT as the default for missing coverage.

## Layer Impact

- **Runtime / app-lane:**
  - `src/lib/atlas/classifier.ts` — full rewrite of the rule catalog,
    25 deterministic intents + LLM fallback rule.
  - `src/lib/atlas/types.ts` — `AtlasIntent` union extended by 17
    new intents.
  - `src/lib/atlas/scripted-engine.ts` — 17 new handler functions
    + dispatcher branches. Each handler returns the audit §4
    gold-standard response shape.
- **Test surface:**
  - `src/__tests__/integration/atlas/atlas-invariants.test.ts` (new)
    — Tier-1 grep invariants for legacy alias bleed, hardcoded
    fixtures, boilerplate strings, naked percentile renders, and
    missing `temperature: 0` settings. 5 invariants are `.skip`d
    until sibling fixes A/B/C land; flip `.skip` to `it(` to activate.
  - `src/__tests__/integration/atlas/atlas-golden.test.ts` (new) —
    Tier-2 golden snapshots for the 25 CXO questions × 3 tenants,
    plus the ≥80 % deterministic-coverage demo-ready criterion
    (audit §10).
- **CI / build-lane:**
  - `package.json` — new `atlas:eval` script.
  - `.github/workflows/atlas-quality.yml` (new) — runs the eval
    harness on PRs that touch Atlas runtime files, matching the
    existing `integrity.yml` workflow pattern.

No data-layer changes. No migrations. No env vars. Application-layer
only, as required by the fix-D scope.

## Client Applicability

- All clients: yes — the classifier is tenant-independent; intent
  routing is derived from message text. The handlers consume per-tenant
  data via `query_portfolio_aggregates`, `query_programs`, `query_signals`,
  etc., so the rendered prose is tenant-correct.
- Internal only: no.

## Changes Included

- PR #2566 (this PR)
- Closes the structural classifier gap identified in audit PR #2562
- Touched files:
  - `src/lib/atlas/classifier.ts`
  - `src/lib/atlas/types.ts`
  - `src/lib/atlas/scripted-engine.ts`
  - `src/__tests__/integration/atlas/atlas-invariants.test.ts` (new)
  - `src/__tests__/integration/atlas/atlas-golden.test.ts` (new)
  - `package.json`
  - `.github/workflows/atlas-quality.yml` (new)

Explicitly NOT touched (sibling fix files per the fix-D scope):
- `src/app/api/tower/synthesis/route.ts`
- `src/lib/agent/retrieval.ts`
- `src/lib/agent/response-shape.ts`
- `src/lib/atlas/llm.ts`

## QA / Validation

- `npx tsc --noEmit` clean.
- `npm run atlas:eval` — 32 passed + 5 `.skip`d (the 5 are documented
  invariants gated on sibling fixes A/B/C; they activate when those
  PRs flip `.skip` to `it(`).
- `npx jest src/lib/atlas/classifier.test.ts src/__tests__/integration/atlas/atlas-tower-grounding-contract.test.ts`
  — pre-existing classifier + Tower grounding contract tests still
  pass with the expanded catalog.
- `npm run test:behaviors` — 1 pre-existing failure in
  `tenant-onboarding.test.ts` confirmed unrelated to this change
  (reproduced on main with this branch's changes stashed).
- PR-time CI: integrity gate + new `Atlas quality` gate green.

## Rollout Plan

- Merge to main → standard Vercel preview/production deploy.
- No migrations, no env vars, no feature flag.
- The expanded classifier is active immediately on merge.

## Rollback Plan

- Revert PR #2566 — single revert restores the prior 8-intent
  classifier. No migrations to roll back. The Tier-1 / Tier-2 test
  files are additive; they remove cleanly with the revert.

## Audit Evidence

- Audit doc: `docs/audits/ATLAS-CXO-QUALITY-AUDIT-2026-05-30.md`
- Audit PR: #2562
- This PR: #2566
- CI run: linked in PR #2566 checks
- Tier-1 / Tier-2 test files are the audit-anchored regression
  contract; the 5 `.skip`d invariants are pending sibling fixes A/B/C
  and become active by removing the `.skip`.

## Known Gaps

- Tier-3 model-graded eval is **documented but not built**. The
  grader prompt sketch + nightly-cadence rationale lives at the
  bottom of `src/__tests__/integration/atlas/atlas-golden.test.ts`.
  Implementation follow-up: a new PR titled
  "feat(atlas): Tier-3 model-graded eval harness".
- Per-program measured-value-to-commit ratio is not yet exposed on
  the `listAtlasPrograms` shape; the `lagging_programs_by_value`
  handler returns sequence-ranked programs and names the gap in
  the honesty line. A follow-up `query_program_value_attainment`
  tool closes this.
- Several handlers (`ai_spend_vs_budget`, `cost_overruns`,
  `governance_coverage_gaps`, `regulatory_open_items`) name a
  data gap rather than answer fully — they require corresponding
  tools to be added to the Atlas tool-belt. The classifier-side
  coverage is closed by this PR; the data-side coverage is the
  next wave.
- Sibling fix waves (A: synthesis-route untether; B: response-shape
  boilerplate + percentile helper; C: temperature=0) close the
  `.skip`d invariants. This PR is sequenced to land first because
  the classifier expansion is the structural prerequisite for the
  Tier-2 golden snapshots.

# 2026-07-26-home-v4-evidence-classification-and-full-rows-fix — producer-side fix for a cross-field confusion, and a real full_rows gap in the live generation pipeline

## Release ID

`2026-07-26-home-v4-evidence-classification-and-full-rows-fix`

## Status

`candidate` — verified locally, not yet merged.

## Plain-English Summary

Prerequisite fix before regenerating and activating a real tenant's V4 candidate. Two real,
independent defects found while investigating why a governed regeneration for `skyharbor-air`
failed its quality gate.

**1. `evidence_tab.classification` cross-field confusion (legacy pipeline).** Two dimension
tabs (`integrations`, `vendors`) had `classification: "directional"`, which is not in
`classificationEnum` (`loaded_fact`, `derived_measure`, `industry_pattern`, `strategic_inference`,
`missing_evidence`). Root-caused rather than papered over: `"directional"` is a real, legitimate
value — but for a different field, `evidence_maturity` (`source_backed`, `directional`,
`needs_validation`, `not_evidenced`), used only on use-case items. The prompt's own guidance
already states the correct mapping ("if source data is directional rather than measured,
classification must be strategic_inference or industry_pattern") but that instruction lives in
visual-annotation guidance, not the tab-classification instruction, so it didn't reliably reach
`evidence_tab`. Fix: strengthened the prompt instruction with an explicit anti-confusion sentence
(mirroring the existing `business_object_classification` guard), and added a producer-side
normalization step (`normalizeLegacyDimensionClassifications`) that remaps this one specific, known
confusion to `strategic_inference` before validation runs. `classificationEnum` itself is
unchanged — still 5 values, still never includes `"directional"` — and any other unrecognized
classification still fails exactly as before; this is not a validator weakening.

**2. `full_rows` (the 900-row Applications & Systems inventory) was never wired into the real
generation pipeline.** It was only ever injected into the static `/home/v4-preview` fixture file,
as a side effect of `reconcile-tenant-applications.mjs`'s CLI. The actual candidate persisted to
Postgres by `processTenant()` never received it — a real candidate approved and served on the live
`/home` route would have shipped with an empty Applications & Systems grid and portfolio summary.
Fix: extracted the pure computation into `buildApplicationFullRows(tenantKey)` (no side effects) and
wired a new `attachApplicationFullRows()` into both `processTenant()`'s book-mode branch and
`--reresolve-visuals`, so every real candidate — not just the fixture — carries the real inventory.

## Layer Impact

- `internal-admin` lane: both fixes live in the governed candidate generator. No tenant currently
  has an approved V4 pack, so no client-facing surface is affected by this PR alone. This is a
  prerequisite for the separate regeneration/approval/activation work that follows.

## Client Applicability

- Internal only. No client-visible surface changes in this PR.

## Changes Included

- `scripts/knowledge/build-home-knowledge-v4-review-pack.mjs`:
  - Strengthened the Claude prompt instruction distinguishing `classification` from
    `evidence_maturity`.
  - New `normalizeDirectionalClassification()` and `normalizeLegacyDimensionClassifications()`,
    wired into the legacy pipeline right before `validateCandidate()` runs.
  - New `attachApplicationFullRows()`, wired into both `processTenant()`'s book-mode branch and
    `--reresolve-visuals`.
  - Exported `classificationEnum`, `evidenceMaturityEnum`, `validateCandidate`,
    `validateDimensionTabs`, `validateClosedEnums` (previously module-private) for direct testing.
- `scripts/knowledge/reconcile-tenant-applications.mjs`: extracted `buildApplicationFullRows()` as
  a pure, exported, side-effect-free function; the CLI's fixture-patching behavior is unchanged and
  guarded behind an ESM entry-point check so importing the function elsewhere has no side effect.
- `scripts/knowledge/__tests__/run-evidence-classification-tests.mjs` (new, 20 assertions): proves
  the enum is unchanged, the normalization fixes the real bug scenario, an unrelated unknown
  classification is never swallowed, and there is no tenant-specific hardcoding.
- `scripts/knowledge/__tests__/run-application-full-rows-tests.mjs` (new, 8 assertions): proves the
  real inventory attaches correctly per tenant, an unknown tenant doesn't fabricate rows, and there
  is no cross-tenant leakage (confirmed `first-capital`'s 260 real rows share no `app_id` with
  `skyharbor-air`'s 900).

## QA / Validation

- `pass` — `npx eslint`, zero findings.
- `pass` — new suites: `run-evidence-classification-tests.mjs` (20/20),
  `run-application-full-rows-tests.mjs` (8/8).
- `pass` — all existing generator suites re-run clean: dimension-headline (11/11),
  relationship-graph (13/13), visual-data-fabrication (8/8), integrated-manifest (25/25),
  prompt-preflight (6/6).
- `pass` — full V4 component test suite: 13/13 passing.
- `pass` — `node scripts/knowledge/reconcile-tenant-applications.mjs` re-run confirmed byte-identical
  fixture output post-refactor (`git diff` empty).

## Rollout Plan

1. Merge to `main` → `aca-main-deploy.yml` builds and deploys the new image.
2. Verify the ACA runtime invariant.
3. Separately (tracked in the next release record): regenerate `skyharbor-air` explicitly in book
   mode using the now-fixed pipeline, review, and (if clean) approve and activate.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy.yml`, triggered by merge.
- Shared runtime mutators: none.
- Live signed-in proof required: no direct UI surface in this PR to verify; the next PR in this
  sequence carries the live verification.

## Rollback Plan

Revert the PR. No schema or data-plane effect; both fixes are pure code paths inside the generator,
exercised only by a future governed regeneration.

## Audit Evidence

- This PR's diff and CI run.
- New test suite output (28/28 passing across both new suites).

## Known Gaps

- The already-persisted `home-pack-v4-book-skyharbor-air-d03972c27cb2662e` candidate was generated
  by the legacy (non-book-mode) pipeline by mistake (the governed job invocation never set
  `HOME_KNOWLEDGE_V4_BOOK_MODE=true`) and remains `candidate_failed` in Postgres. It is not touched
  by this PR and will be superseded, not repaired, by the next real book-mode regeneration.

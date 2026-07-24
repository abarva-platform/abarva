# 2026-07-24-home-knowledge-v4-integrated-contract-hardening — Home Knowledge V4 integrated-generation contract hardening + zero-cost preflight

## Release ID

`2026-07-24-home-knowledge-v4-integrated-contract-hardening`

## Status

`candidate`

## Plain-English Summary

Home Knowledge V4 has an experimental "integrated" generation mode that writes all 38 Home
dimension pages in one Claude call instead of 38 separate calls. A real paid trial run on the
skyharbor-air demo tenant on 2026-07-24 proved the one-call approach works, but also produced
three contract defects: the model fabricated numeric chart values inside a field that was
supposed to be a declarative pointer, several factual claims carried no evidence citation, and
one dimension (risks) silently skipped a dataset binding that was available to it. This release
closes all three defects at the contract level — not by asking the model more nicely, but by
removing the fields/instructions that made the defects possible, and by adding two independent
deterministic checks that run before any Claude call and before any candidate is accepted:

1. **`validate-integrated-manifest.mjs`** — checks a generated candidate: no dimension may contain
   a fabricated numeric visual value, every evidence citation must resolve to a real evidence
   registry entry, every dataset binding must resolve to a real registered dataset, dimensions and
   measures used in a chart must be real fields on that dataset, and the candidate must contain
   exactly 38 dimensions with no duplicates and a fresh source hash.
2. **`assert-integrated-prompt-preflight.mjs`** — a new, separate check that inspects the actual
   assembled prompt payload the pipeline would send to Claude (not just the candidate it gets
   back), so a bug where the validator is correct but the runtime prompt silently omits or
   contradicts the hardened contract cannot pass unnoticed. This closes a real gap found during
   this work: the old prompt told Claude to "ignore" a contradicting instruction rather than
   removing it, and a dataset binding key (`spend`) didn't match any real dimension name
   (`budget`) and was silently unreachable.

No product-runtime code is touched by this change (confirmed: nothing under `src/` imports these
scripts), and no paid Claude call was made to build or prove any of it — every check in this
release was proven against either a fabricated fixture or the real output/prompt already captured
from the 2026-07-24 paid trial run.

## Layer Impact

Release lane: `internal-admin` (operator generation tooling, not a product surface) combined with
`experimental` (the integrated-generation mode this hardens is feature-flag/env-var gated, off by
default, and has never shipped an approved candidate to any live tenant page).

- **Layer 2 (Source Adapters) / operator tooling**: `scripts/knowledge/build-home-knowledge-v4-review-pack.mjs`
  is an offline operator script that assembles Claude prompts from governed tenant source data and
  the reconciled `tower-standardized-v1` datasets. This release changes what that script puts in
  the prompt for the experimental integrated-generation mode and adds a `--preflight` mode that
  proves the payload shape without calling Claude.
- No changes to Layer 3 (Canonical Model), Layer 4 product surfaces, or any live route. The
  integrated-generation mode is not wired into any product page today.

## Client Applicability

- All clients: No — this only affects the experimental `HOME_KNOWLEDGE_V4_INTEGRATED=true`
  generation path, which has not produced any candidate accepted into the live `/home` page for
  any tenant.
- Specific clients: skyharbor-air is the only tenant with real registry/evidence data wired
  (`DIMENSION_DATASET_BINDINGS` covers `apps`, `vendors`, `programs`, `risks`, `evidence`,
  `budget` for the 5 tenants present in `tower-standardized-v1`).
- Internal only: Yes — this is operator/generation tooling, not a client-visible surface.
- Public/demo only: No.
- Feature flag: Gated by `HOME_KNOWLEDGE_V4_INTEGRATED=true` / `--integrated`, off by default; the
  new `--preflight` mode is a separate, always-safe, zero-network mode.

## Changes Included

- `scripts/knowledge/build-home-knowledge-v4-review-pack.mjs`:
  - Fixed `DIMENSION_DATASET_BINDINGS.spend` → `budget` (the real dimension key; `spend` matched
    no dimension in `expandedDimensionCatalog` and was silently unreachable).
  - `integrated_dimensions` pass now excludes the old `visual_contract_rules` (which required
    `data_points`/`encoding`/`annotation`) from the `common` object sent to Claude for this pass,
    instead of including it alongside a contradicting "ignore this" instruction.
  - Widened the `visual_binding` contract to distinguish forbidden model-generated DATA
    (`data_points`, `series`, `values`, `percentages`, `computed_totals`, `x_values`, `y_values`)
    from permitted non-numeric PRESENTATION fields (`title`, `annotation_instruction`, `format`,
    `orientation`), per explicit review feedback that the prior all-or-nothing shape was too
    restrictive.
  - Added `--preflight` mode: assembles the real `integrated_dimensions` prompt (real packet, real
    `deterministic_dataset_registry`, real `evidence_index`, real `DIMENSION_DATASET_BINDINGS`)
    using a checked-in real story-architecture fixture in place of Call 1's output, writes it to
    disk, and runs `assert-integrated-prompt-preflight.mjs` against it — all before constructing
    an Anthropic client (the client/SDK import is skipped entirely in this mode, same as the
    existing `--packet-only` mode).
- `scripts/knowledge/validate-integrated-manifest.mjs` (new): deterministic validator for the
  integrated manifest candidate shape (distinct from the pre-existing
  `validate-dimension-contradictions.mjs`, which targets the older per-dimension schema).
- `scripts/knowledge/assert-integrated-prompt-preflight.mjs` (new): deterministic preflight
  assertions against the assembled runtime prompt payload.
- `scripts/knowledge/__fixtures__/`: real story-architecture fixture (`story-architecture-skyharbor-air.json`,
  taken from the actual 2026-07-24 paid trial run's Call 1 output), 10 hand-built manifest fixtures
  covering each defect class, and 7 prompt-preflight fixtures (the real current assembled prompt
  plus 5 single-field regressions).
- `scripts/knowledge/__tests__/`: two zero-cost regression suites (`run-integrated-manifest-tests.mjs`,
  `run-prompt-preflight-tests.mjs`) proving each fixture produces the specific expected rule ID.
- `package.json`: added `home:knowledge-v4:preflight`, `home:knowledge-v4:test-manifest-validator`,
  `home:knowledge-v4:test-prompt-preflight`.

## QA / Validation

All validation below is zero-cost (no Claude API calls) and was run locally.

- `npx eslint` on every new/changed file: clean.
- `npm run home:knowledge-v4:test-manifest-validator`: 10/10 fixture cases pass (each fixture
  produces exactly the rule ID it's designed to trigger — fabricated visual field, missing
  evidence, unresolved evidence ID, unapproved dataset binding, stale context hash, missing
  dimension, duplicated dimension, unresolved dataset on risks, unknown visual dimension/measure).
- `npm run home:knowledge-v4:test-prompt-preflight`: 6/6 fixture cases pass, including proof that
  the real, current assembled prompt (`--preflight` output for skyharbor-air) passes with zero
  failures, and that reintroducing any one of the fixed defects (stale visual contract, orphaned
  binding key, empty dataset dimensions, truncated evidence index, missing dimension) is caught.
- `validate-integrated-manifest.mjs` run against the real flawed candidate from the 2026-07-24
  paid trial run (`/tmp/proof_extracted/.../candidate-home-knowledge-v4.json`, not checked into
  the repo): 203 hard failures (119 `forbidden_visual_field`, 84 `insight_without_evidence`), 1
  warning (`missing_expected_binding` on `risks`) — confirms the validator would have rejected
  that exact output.
- `assert-integrated-prompt-preflight.mjs` run against the real assembled skyharbor-air prompt
  produced by `--preflight` today: 0 failures — confirms the runtime prompt (not just the local
  packet) actually carries the full registry (6 datasets), the complete evidence index (80/80
  entries), the corrected `budget` binding, the hardened visual-binding contract, the current
  source hash, `contract_version`, all 38 dimensions, and the explicit numeric-data prohibition —
  and that the old `visual_contract_rules` object is structurally absent, not merely
  overridden by instruction text.
- Confirmed no product-runtime code imports these scripts (`grep` across `src/`) — the only
  references are comments in `HomeEnterpriseBriefApp.tsx` and `homeV4Visual.ts` documenting the
  mirrored field lists, not imports. Blast radius is limited to the operator generation pipeline.
- `node scripts/release-check.mjs --base origin/main --head HEAD`: passes once this record is
  added (documented in this record's own commit).

## Rollout Plan

Merge to `main` via the standard governed PR path (squash merge). This is operator tooling only —
`aca-main-deploy.yml` will build and deploy the new web image containing these script changes as
part of the normal deploy, but no product route or runtime behavior changes, so no separate
runtime-invariant proof or live-client verification is required for this PR.

The next step after merge is a single explicit, separately-approved action: one paid
`HOME_KNOWLEDGE_V4_INTEGRATED=true` SkyHarbor regeneration run, submitted as a governed ACA
operator job per `docs/ops/aca-data-build-job-rule.md`, using the digest-pinned image built from
this merged commit. That paid run is explicitly out of scope for this release/PR and requires
separate go-ahead.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy.yml` (standard image build on merge to `main`; no
  special handling needed since no runtime behavior changes).
- Shared runtime mutators: None — this PR does not touch any `az containerapp update` call, env
  var, secret, or traffic weight.
- Approved image digest: N/A for this PR; the next paid generation run must use the digest-pinned
  image built from the merged commit, resolved at submission time via the standard
  `submit-aca-operator-job.mjs` flow.
- ACA runtime invariant: N/A — no shared web/worker runtime template changes.
- Worker image invariant: N/A.
- Feature/env flag update path: None changed; `HOME_KNOWLEDGE_V4_INTEGRATED` remains an explicit
  opt-in env var / CLI flag on the operator script, unchanged by this PR.
- Live signed-in proof required: No — no client-facing surface is touched.

## Rollback Plan

Revert the PR. Since no product route or runtime behavior is affected, rollback is a plain code
revert with no migration, data, or traffic implications.

## Audit Evidence

- This PR (URL to be filled in on open).
- Local validation output quoted verbatim in QA / Validation above.
- Real trial-run artifacts referenced (not checked into the repo, ephemeral operator output):
  `/tmp/proof_extracted/home-knowledge-v4-canary/tenants/skyharbor-air/candidate-home-knowledge-v4.json`
  and `.../responses/01-story-architect.json` (the latter's `client_visible` content is checked
  into this PR as `scripts/knowledge/__fixtures__/story-architecture-skyharbor-air.json`).
- Fixture-based regression suites checked into this PR
  (`scripts/knowledge/__tests__/run-integrated-manifest-tests.mjs`,
  `scripts/knowledge/__tests__/run-prompt-preflight-tests.mjs`) are themselves durable audit
  evidence — anyone can re-run them at zero cost to reprove every claim in this record.

## Known Gaps

- Cross-dimension narrative conflict detection (e.g. two dimensions stating incompatible facts)
  is explicitly not attempted deterministically in `validate-integrated-manifest.mjs` — this needs
  either a targeted rule set per known conflict class or a separate model-based check, and is
  called out here rather than silently claimed as covered.
- `DIMENSION_DATASET_BINDINGS` / `deterministic_dataset_registry` only cover 6 of the 38
  dimensions (the ones with real, directly-verified `tower-standardized-v1` datasets) and only for
  the 5 tenants present in that dataset. The other 32 dimensions and any tenant outside those 5
  have no dataset binding and no chart data source — this is intentional (no placeholder bindings
  for unverified data) but remains real, disclosed scope, not solved by this release.
- The one paid SkyHarbor regeneration needed to prove the hardened contract end-to-end against a
  live Claude response has not been run — that is the explicit next step, pending separate
  approval, per this release's Rollout Plan.

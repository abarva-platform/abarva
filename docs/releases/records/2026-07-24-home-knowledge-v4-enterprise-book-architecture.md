# 2026-07-24-home-knowledge-v4-enterprise-book-architecture — Home Knowledge V4 Enterprise Book architecture (structural fabrication-proofing)

## Release ID

`2026-07-24-home-knowledge-v4-enterprise-book-architecture`

## Status

`candidate`

## Plain-English Summary

The just-shipped integrated-generation contract hardening (see
`2026-07-24-home-knowledge-v4-integrated-contract-hardening.md`) fixed the specific fabrication
defects found in one paid trial run by policing the shape of a `visual_binding` field Claude was
still allowed to write. That is real, but it leaves the model as the thing choosing dataset,
dimension, measure, and chart type for every page — a schema check can catch an obviously wrong
value, but nothing structurally prevents a plausible-looking wrong one, and 38 independently
authored pages remain 38 independent chances to drift from each other.

This release changes the architecture, not just the contract: Claude now writes ONE enterprise
knowledge book — a governing executive narrative plus a compact `dimension_notes` entry for each
of the 38 real dimension keys, authored in a single shared context so every page is a chapter of
the same story instead of a fresh essay. Claude's requested output schema for this call **never
contains a visual/chart field of any kind** — `visual_binding` does not exist for it to fabricate
into. A new deterministic function, `renderDimensionsFromBook()`, is the only code path that ever
produces a `visual_binding`: it looks up each of the 6 dimensions with a real governed dataset and
attaches a fixed, code-owned visual specification (the same good dataset/dimension/measure/chart-type
choices Claude itself picked well in the 2026-07-24 paid trial, now hardcoded so they can never be
fabricated or drift between runs). This makes the fabrication defect class structurally impossible
for those 6 dimensions, not merely policed after the fact.

Also fixed in this pass: `DIMENSION_DATASET_BINDINGS` was already corrected from `spend` to
`budget` in the prior release, but this release is the first to actually exercise that fix through
a full dimension-chapter mapping — every one of the 38 real catalog keys is now explicitly assigned
to exactly one of 15 book chapters, with a load-time self-check that throws if any catalog key is
uncovered or any chapter key is unrecognized.

The new architecture is fully additive: gated behind its own `HOME_KNOWLEDGE_V4_BOOK_MODE=true` /
`--book-mode` flag, alongside the untouched, already-proven `HOME_KNOWLEDGE_V4_INTEGRATED=true`
path. Output shape (`dimensions[]`, per-dimension fields) is deliberately identical to the
integrated-mode output, so the existing validator (`validate-integrated-manifest.mjs`) and any
future downstream consumer work unchanged.

## Layer Impact

Release lane: `internal-admin` (operator generation tooling) combined with `experimental`
(feature-flag gated, off by default, never shipped an approved candidate to any live tenant page).

- **Layer 2 (Source Adapters) / operator tooling**:
  `scripts/knowledge/build-home-knowledge-v4-review-pack.mjs` gains a new `enterprise_book` prompt
  pass, a new `bookMode` orchestration branch, and the deterministic
  `renderDimensionsFromBook()` renderer.
- No changes to Layer 3 (Canonical Model), Layer 4 product surfaces, or any live route.

## Client Applicability

- All clients: No — experimental `HOME_KNOWLEDGE_V4_BOOK_MODE=true` path only, never run against
  live Claude yet, never produced any candidate accepted into `/home` for any tenant.
- Specific clients: skyharbor-air is the only tenant with a book-mode fixture and real
  registry/evidence data wired.
- Internal only: Yes.
- Public/demo only: No.
- Feature flag: `HOME_KNOWLEDGE_V4_BOOK_MODE=true` / `--book-mode`, off by default; `--preflight`
  mode (zero-network) works for both this and the existing integrated path.

## Changes Included

- `scripts/knowledge/build-home-knowledge-v4-review-pack.mjs`:
  - `bookMode` flag, additive alongside the existing `integratedMode`.
  - `DIMENSION_BOOK_CHAPTERS`: all 38 real catalog keys mapped to one of 15 chapters, with a
    load-time self-check (throws on any uncovered catalog key or unrecognized chapter key).
  - `VISUAL_RENDER_RULES`: fixed, code-owned visual templates for the 6 datasets with real data
    (`applications_full`, `vendors_full`, `programs_full`, `risk_register`, `evidence_registry`,
    `budget_summary`) — the same dataset/dimension/measure/chart-type choices Claude made well in
    the prior paid trial, now hardcoded.
  - `renderDimensionsFromBook(book, packet)` (exported): pure deterministic function producing the
    same `dimensions[]` shape the integrated-mode pipeline already produces; Claude supplies
    `dimension_notes`, every dataset/visual field is attached by this function alone.
  - New `enterprise_book` prompt pass type: requests `executive_narrative` +
    `dimension_notes` only, with the shared `visual_contract_rules` removed from its `common`
    object (not merely overridden by instruction text) and explicit, repeated "never choose/name a
    chart" language in both `instruction` and `hard_limits`.
  - `bookMode` orchestration branch in `processTenant()`: replaces Calls 1 (`story_architect`) and
    5 (dimension generation, either architecture) with one `enterprise_book` call;
    `assembled.story_architect` is set from the book's own `executive_narrative` afterward so
    downstream passes (`executive_brief`, `industry_change`, `use_cases`, `relationships`,
    `evidence`, `coherence`) are unchanged and still run.
  - `--preflight` mode extended: branches to a new book-specific preflight assertion, and — when a
    fixture `EnterpriseBook` exists for the tenant — also runs the real
    `renderDimensionsFromBook()` against it and validates the result with the real
    `validate-integrated-manifest.mjs`, all before any Claude call.
- `scripts/knowledge/assert-enterprise-book-prompt-preflight.mjs` (new): zero-cost runtime-prompt
  preflight for the `enterprise_book` pass. Strongest check: scans the literal field-name lists in
  `output_requirements` (not prose) for any visual/chart field name — the schema itself must never
  offer Claude a field to fabricate into. Prose fields (`instruction`, `hard_limits`,
  `dimension_notes_shape`) are checked separately with a prohibition-aware regex, since prohibition
  text must be able to name the field it forbids.
- `scripts/knowledge/__fixtures__/enterprise-book/skyharbor-air-book.json` (new): a realistic
  `EnterpriseBook` fixture reshaped from the real 2026-07-24 paid integrated-run output (same real
  narrative content, reorganized into the book's `dimension_notes` shape) — used to prove the
  renderer end-to-end at zero cost, since no real book-mode Claude call has been made yet.

## QA / Validation

All validation below is zero-cost (no Claude API calls) and was run locally.

- `node --check` + `npx eslint` on every new/changed file: clean.
- All 16 pre-existing regression fixtures (10 manifest-validator + 6 prompt-preflight, from the
  prior release) still pass unchanged — confirms no regression to the already-proven integrated
  path from this additive change.
- `--preflight --book-mode` run for skyharbor-air: `pass (0 failures)` — confirms the real
  assembled `enterprise_book` prompt carries the dataset registry, the complete 80/80-entry
  evidence index, the 38-key `dimension_chapters` map, the current source hash, `contract_version`,
  and does not carry the old `visual_contract_rules` object.
- Renderer end-to-end proof (fixture book -> `renderDimensionsFromBook()` -> real
  `validate-integrated-manifest.mjs`, all zero-cost, all real production code — not a duplicate):
  `38 failures, 0 warnings`, **all** in a single category, `insight_without_evidence` — a content
  gap inherited verbatim from the fixture's source content (the same 38 uncited insights already
  disclosed in the prior release), not a renderer defect. **Zero** `forbidden_visual_field`
  failures and **zero** `unresolved_dataset_binding` / `unapproved_dataset_for_dimension` failures
  — every one of the 6 governed dimensions (`apps`, `vendors`, `programs`, `risks`, `evidence`,
  `budget`) received a correctly bound, schema-clean, code-generated `visual_binding` with no
  Claude involvement in its construction.

## Rollout Plan

Merge to `main` via the standard governed PR path (squash merge). Operator tooling only — no
product route or runtime behavior changes, so no separate runtime-invariant proof or live-client
verification is required for this PR.

The next step after merge is a single explicit, separately-approved action: one paid
`HOME_KNOWLEDGE_V4_BOOK_MODE=true` SkyHarbor generation run, submitted as a governed ACA operator
job per `docs/ops/aca-data-build-job-rule.md`, using the digest-pinned image built from this merged
commit. Unlike the prior release's paid follow-up (which re-ran an already-proven prompt shape),
this is the **first real Claude call against the new `enterprise_book` prompt** — the renderer half
is proven at zero cost in this record, but Claude's actual authoring quality for the book shape
(narrative coherence across chapters, `dimension_notes` completeness, evidence-citation rate) is
not yet measured against real output and must not be assumed from the integrated-mode trial. That
paid run is explicitly out of scope for this release/PR and requires separate go-ahead.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy.yml` (standard image build on merge to `main`; no
  special handling needed since no runtime behavior changes).
- Shared runtime mutators: None.
- Approved image digest: N/A for this PR; the next paid generation run must use the digest-pinned
  image built from the merged commit.
- ACA runtime invariant: N/A.
- Worker image invariant: N/A.
- Feature/env flag update path: None changed; `HOME_KNOWLEDGE_V4_BOOK_MODE` is a new, explicit
  opt-in env var / CLI flag, off by default.
- Live signed-in proof required: No.

## Rollback Plan

Revert the PR. Since no product route or runtime behavior is affected, and `bookMode` is additive
and defaults off, rollback is a plain code revert with no migration, data, or traffic implications.
The pre-existing `HOME_KNOWLEDGE_V4_INTEGRATED=true` path is untouched by this change and remains
available regardless of this release's status.

## Audit Evidence

- This PR (URL to be filled in on open).
- Local validation output quoted verbatim in QA / Validation above.
- Real trial-run artifacts referenced (not checked into the repo, ephemeral operator output):
  `/tmp/paid-run2-extracted/home-knowledge-v4-canary/tenants/skyharbor-air/candidate-home-knowledge-v4.json`
  — the source of the checked-in `skyharbor-air-book.json` fixture's real narrative content.
- Fixture-based proof is itself durable audit evidence: `--preflight --book-mode` can be re-run at
  zero cost by anyone to reprove every claim in this record.

## Known Gaps

- No real Claude call has been made against the `enterprise_book` prompt. Everything proven in
  this record is either (a) the assembled prompt's structural shape, or (b) the deterministic
  renderer fed a fixture built from a *different* pass type's real output. Whether Claude actually
  writes a single coherent story across 38 `dimension_notes` entries as well as it wrote 38
  independent entries is an open, real question the next paid run must answer — this record does
  not claim narrative quality parity or improvement, only that the fabrication risk class is
  structurally closed for the 6 governed dimensions.
- Only 6 of 38 dimensions get a code-generated `visual_binding` (`apps`, `vendors`, `programs`,
  `risks`, `evidence`, `budget`) — the same scope limit as the prior release, unchanged: only
  dimensions with a real, directly-verified `tower-standardized-v1` dataset get one. The other 32
  dimensions have no chart at all under either architecture — intentional, not silently expanded.
  This applies only to the 5 tenants present in `tower-standardized-v1`.
- Calls 2 (`executive_brief`), 3 (`industry_change`), 4 (`use_cases`), 6 (`relationships`), and 7
  (`evidence`) are unchanged by this release and still use the OLD visual contract
  (`data_points`/`encoding`/`annotation`-based, the same shape that was fabrication-prone before
  the integrated-mode hardening). The same defect class this release closes for the 38 dimension
  pages likely still exists in those five passes' visuals (`dashboard_visuals`,
  `benchmark_exhibits`, `priority_matrix_visual`, `graph_display_contract`, `evidence_visuals`).
  This is a real, disclosed, deliberately out-of-scope gap for this release, not something silently
  ignored — hardening those five passes is a natural next candidate for the same treatment.
- Cross-dimension narrative conflict detection remains not attempted deterministically (unchanged
  from the prior release's disclosed gap) — book mode's single shared-context call should reduce
  the *likelihood* of conflicts materially (this is the core thesis of the architecture change),
  but that is an expected outcome to verify against real output, not something this record measures
  or claims yet.

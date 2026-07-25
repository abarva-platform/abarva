# 2026-07-24-home-knowledge-v4-enterprise-book-v2-shared-sections — Enterprise Book v2: shared sections + tagged conclusions, execution-path gating, contaminated-seed fix, evidence semantics

## Release ID

`2026-07-24-home-knowledge-v4-enterprise-book-v2-shared-sections`

## Status

`candidate`

## Plain-English Summary

A detailed review of the v1 Enterprise Book architecture (merged earlier the same day) found that,
despite removing Claude from visual-binding authorship, it was still structurally "38
independently-authored pages" wearing a different schema: Claude wrote a `dimension_notes` object
per dimension_key, so the same underlying fact could still be (and, checked against the real prior
paid output, demonstrably was) restated with different wording across many dimensions. The review
also found the code's own execution path contradicted the release record's description — 5 of 7
legacy Claude passes still ran unchanged under book mode — a source-data contamination bug in the
dimension seed catalog, and an evidence index where a technically-resolvable ID could still be too
generic to support a specific claim. This release fixes all four, with zero-cost proof for each:

1. **Execution path is now real, not just described.** Book mode runs exactly two Claude calls
   (`enterprise_book`, `coherence-review`); the other five legacy passes are explicitly marked
   `skipped` in a machine-checkable execution trace written on every run (real or dry-run).
2. **Schema redesigned around shared sections + tagged conclusions, not per-dimension objects.**
   Claude now writes 13 shared narrative sections plus flat `conclusions`/`decisions`/
   `recommendations`/`open_questions` lists, each tagged `applies_to_dimensions`. A fact that's true
   of `apps`, `org`, and `rel` is written ONCE and referenced three times — the same JS object, not
   three independently retyped statements. Proven against real content: the prior paid output had 6
   separately-worded "ownership" statements across `apps`/`org`(×2)/`rel`/`proven_strengths`/
   `interview_signals`; this release's renderer collapses that into one shared conclusion object.
3. **Dimension seed catalog contamination fixed.** The source `design-contract-pack.json`'s legacy
   19-entry DIMS array has 6 duplicate entries (functions/budget, profile/ai, risks/opev share
   byte-identical summary text) and a stale application count (`apps` says "Fourteen systems"
   against a real registry of 900 rows) — confirmed by direct inspection, not assumed. Book mode no
   longer sends the `summary`/`status` fields at all; only clean, code-derived identity/routing
   metadata (`key`, `name`, `business_source_coverage`).
4. **Evidence semantics hardened beyond ID resolution.** 72 of 80 real skyharbor-air evidence rows
   carry a literal `"synthetic locator N"` placeholder locator behind a broad category tag —
   technically resolvable, too generic to support a precise claim. The evidence index now carries a
   `specificity` signal; the validator flags (warns, does not hard-fail) any claim supported only by
   low-specificity evidence; and an honest `evidence_status: "not_evidenced"` disclosure is now
   accepted in place of a citation, distinct from a silent omission (which still hard-fails).

No paid Claude call was made to build or prove any of this.

## Layer Impact

Release lane: `internal-admin` (operator generation tooling) combined with `experimental`
(`HOME_KNOWLEDGE_V4_BOOK_MODE=true`, off by default, has never produced a candidate accepted into
any live tenant page).

- **Layer 2 (Source Adapters) / operator tooling**: `scripts/knowledge/build-home-knowledge-v4-review-pack.mjs`
  — orchestration, prompt, schema, and renderer rewritten for book mode only; the untouched
  `HOME_KNOWLEDGE_V4_INTEGRATED=true` path and legacy 38-call path are unaffected.
- No changes to Layer 3 (Canonical Model), Layer 4 product surfaces, or any live route.

## Client Applicability

- All clients: No.
- Specific clients: skyharbor-air (fixture + real prior content available).
- Internal only: Yes.
- Public/demo only: No.
- Feature flag: `HOME_KNOWLEDGE_V4_BOOK_MODE=true` / `--book-mode`, off by default.

## Changes Included

- `scripts/knowledge/build-home-knowledge-v4-review-pack.mjs`:
  - `processTenant()` restructured: book mode is now a fully separate branch from the legacy
    pipeline (previously interleaved conditionals across the two architectures, which is exactly
    what let the "only 2 of 8 passes replaced" gap go unnoticed). Book mode runs `enterprise_book`
    then `coherence-review` only; the other 6 legacy pass definitions are never invoked.
  - New `executionTrace` mechanism: every real run and every `--preflight` dry run writes
    `execution-trace.json` / `dry-run-execution-trace.json` listing every pass with an
    `executed`/`skipped` verdict and reason. `bookModeExecutionTrace()` (exported) is the single
    source of truth both paths read from, so the dry-run trace cannot drift from what a real run
    does.
  - `DIMENSION_BOOK_CHAPTERS` rebuilt around 13 `BOOK_SECTION_IDS` (business_context,
    operating_model, capabilities, value_streams, applications_context, data_context,
    technology_context, vendor_context, risk_context, portfolio_context, ai_opportunity_context,
    evidence_context, relationships_context) plus `executive_narrative`; load-time self-check
    extended to also reject any chapter value not in that known set.
  - `renderDimensionsFromBook()` rewritten: derives each of 38 pages from `book.sections[chapter]`
    (shared headline/narrative) filtered `book.conclusions`/`decisions`/`recommendations`/
    `open_questions` by `applies_to_dimensions`. `related_dimensions` is now computed from shared
    conclusion membership, not authored. No per-dimension object is read from Claude's output at
    all.
  - New `dimensionRendererMapping()` (exported): the literal answer to "which book sections /
    datasets / evidence families / renderer does each of the 38 dimensions read" — generated from
    the same tables the renderer uses, written to `preflight/dimension-renderer-mapping.json`.
  - `enterprise_book` prompt rewritten: requests `sections`/`conclusions`/`decisions`/
    `recommendations`/`open_questions`, explicitly forbids per-dimension objects, explains the
    reuse-via-tagging pattern, and adds explicit evidence-specificity instructions.
  - `dimension_catalog` sent to Claude is now a clean projection (`key`, `name`,
    `business_source_coverage`) — the contaminated `summary`/`status` fields are never sent.
  - `loadTenantEvidenceIndex()`: added `specificity: "low"|"high"`, detected via
    `LOW_SPECIFICITY_LOCATOR_PATTERN` (matches the literal `"synthetic locator N"` placeholder
    confirmed in the real source CSV).
- `scripts/knowledge/validate-integrated-manifest.mjs`:
  - `insight_without_evidence` now exempts an honest `evidence_status: "not_evidenced"` marker with
    empty `evidence_refs` (previously always a hard fail) — distinguishing disclosed gaps from
    silent omissions.
  - New `weak_evidence_specificity` warning: fires when every evidence_id backing a claim resolves
    but is low-specificity.
- `scripts/knowledge/assert-enterprise-book-prompt-preflight.mjs`: new checks for
  contaminated-catalog absence (`summary`/`status` fields must not be present),
  `book_sections`/`sections`/`conclusions` presence, and explicit rejection if the legacy
  `dimension_notes` field name reappears in the requested schema.
- `scripts/knowledge/__fixtures__/enterprise-book/skyharbor-air-book.json`: rebuilt to the v2
  schema, reshaped from the same real 2026-07-24 paid output as before, with the 6 real
  independently-worded "ownership" statements collapsed into one shared, multi-tagged conclusion —
  this is the actual content-reuse proof fixture, not a synthetic example.
- `scripts/knowledge/__fixtures__/integrated-manifest/`: 2 new regression fixtures
  (`weak-evidence-specificity.json`, `honest-not-evidenced.json`); `packet.json` evidence_index
  extended with one `specificity: "low"` entry.
- `scripts/knowledge/__tests__/run-integrated-manifest-tests.mjs`: 2 new cases (12/12 total, up
  from 10/10).

## QA / Validation

All validation below is zero-cost (no Claude API calls) and was run locally.

- `node --check` + `npx eslint` on every changed file: clean.
- All 12 integrated-manifest fixture cases pass (10 pre-existing + 2 new).
- All 6 prompt-preflight fixture cases pass, unchanged (the untouched integrated path).
- `--preflight --book-mode` for skyharbor-air: `pass (0 failures)`.
- **Execution trace** (real, not asserted): `executed: 01-enterprise-book, 08-coherence-review` /
  `skipped: 01-story-architect, 02-executive-brief, 03-industry-change, 04-use-cases-batch-*,
  05-integrated-dimensions, 06-relationships, 07-evidence` — resolves the review's internal-
  consistency finding: book mode now genuinely runs only these two calls.
- **Contaminated catalog, confirmed and fixed**: direct inspection of
  `datasets/tenant-inputs/skyharbor-air/approved-content/home/design-contract-pack.json`'s DIMS
  array found `functions`/`budget` share byte-identical summary text, `profile`/`ai` share
  byte-identical summary text, `risks`/`opev` share byte-identical summary text (6 of 19 legacy
  entries, 32%), and `apps` claims "Fourteen systems" against a real registry `row_count` of 900.
  The new `dimension_catalog` sent to Claude for book mode carries no `summary`/`status` field at
  all, for any of the 38 keys — confirmed via the real assembled prompt, not the intent.
- **Renderer end-to-end proof, real content**: fixture book reshaped from the real 2026-07-24 paid
  output, run through the real `renderDimensionsFromBook()` and real `validate-integrated-manifest.mjs`:
  `0 hard failures, 28 warnings`, all `weak_evidence_specificity` — including the exact scenario the
  review named as a concern ("Crew management carries the highest legality and safety sensitivity"
  backed only by a low-specificity placeholder). Zero fabrication-class failures, zero
  unresolved-binding failures.
- **Content-reuse proof, real content**: the real "ownership coverage" fact, independently restated
  6 different ways across `apps`/`org`(×2)/`rel`/`proven_strengths`/`interview_signals` in the prior
  paid output, is now one shared conclusion. Rendered output for `apps`, `org`, and `rel` all carry
  the byte-identical statement string (verified: `d['key_insights']` cross-checked across all
  three), and each dimension's `related_dimensions` is computed from shared-conclusion membership
  (`apps -> [org, rel]`, `org -> [apps, rel]`, `rel -> [apps, org]`), not separately authored.
- `dimension-renderer-mapping.json`: 38 entries, one per dimension_key, each naming its real book
  section(s), dataset(s), evidence families, and renderer — generated from the same tables the
  renderer itself uses.

## Rollout Plan

Merge to `main` via the standard governed PR path (squash merge). Operator tooling only — no
product route or runtime behavior changes.

The next step after merge is a single explicit, separately-approved action: one paid
`HOME_KNOWLEDGE_V4_BOOK_MODE=true` SkyHarbor generation run against this v2 schema. This has still
never been tested against real Claude output — everything in this record is either the assembled
prompt's structural shape or the deterministic renderer fed a fixture reshaped from a DIFFERENT
pass type's real output. Whether Claude actually writes a compact, well-tagged `conclusions` list
(rather than, say, tagging everything to every dimension, or writing 38 near-duplicate conclusions
anyway) is the real open question the next paid run must answer. That paid run requires explicit
go-ahead and is out of scope for this release/PR.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy.yml` (standard image build; no runtime behavior
  changes, no special handling needed).
- Shared runtime mutators: None.
- Approved image digest: N/A for this PR; the next paid run must use the digest-pinned image built
  from the merged commit.
- ACA runtime invariant / worker image invariant: N/A.
- Feature/env flag update path: None changed; `HOME_KNOWLEDGE_V4_BOOK_MODE` unchanged, off by
  default.
- Live signed-in proof required: No.

## Rollback Plan

Revert the PR. `bookMode` is additive and defaults off; the pre-existing
`HOME_KNOWLEDGE_V4_INTEGRATED=true` path is untouched by this change. Plain code revert, no
migration, data, or traffic implications.

## Audit Evidence

- This PR (URL to be filled in on open).
- Local validation output quoted verbatim in QA / Validation above.
- Real trial-run artifacts referenced (not checked into the repo, ephemeral operator output):
  `/tmp/paid-run2-extracted/home-knowledge-v4-canary/tenants/skyharbor-air/candidate-home-knowledge-v4.json`
  — source of the checked-in `skyharbor-air-book.json` v2 fixture, including the real 6-way
  ownership-statement duplication this release collapses.
- `--preflight --book-mode` is itself durable, re-runnable audit evidence for every claim above.

## Known Gaps

- No real Claude call has been made against the v2 `enterprise_book` prompt. The redesigned schema,
  the execution-path gating, the catalog fix, and the evidence hardening are all proven structurally
  and against a fixture built from different-pass-type real content — not against a real response to
  THIS prompt. This is the explicit next step, pending approval.
- Book mode's scope reduction (5 legacy passes skipped, not folded in) means `assembled.executive_brief`,
  `industry_change`, `use_cases`, `relationships` (including the real graph-projection feature), and
  `evidence` (the dedicated evidence-maturity narrative pass) do not exist under this architecture
  today. This was disclosed in the v1 release record too; it remains real, unresolved scope, not
  silently expanded or silently ignored.
- Only 6 of 38 dimensions get a code-generated `visual_binding` (unchanged scope limit from prior
  releases): only dimensions with a real, directly-verified `tower-standardized-v1` dataset.
- The same old visual contract (and the same fabrication risk this whole effort exists to close)
  still exists, unchanged, in whatever of the 5 skipped legacy passes eventually gets folded into a
  future book-mode iteration or continues to run standalone.
- Cross-dimension conflict detection beyond the specific ownership-reuse mechanism proven here is
  still not attempted deterministically for conclusions that DON'T get correctly co-tagged by
  Claude — if Claude fails to recognize that two facts are the same underlying conclusion and
  writes them as two separate conclusion objects with disjoint `applies_to_dimensions`, this
  architecture reduces the likelihood versus v1 (shared context, one call) but does not guarantee
  it structurally the way the visual-binding fix does. This is a real, disclosed limit of the
  design, not a claimed solved problem.

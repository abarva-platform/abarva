# 2026-07-25-home-knowledge-v4-enterprise-book-five-jobs-and-graphs — Five-jobs strategic synthesis + purposeful relationship graphs

## Release ID

`2026-07-25-home-knowledge-v4-enterprise-book-five-jobs-and-graphs`

## Status

`candidate`

## Plain-English Summary

Two directives on top of the just-shipped Enterprise Book v2 architecture:

1. The v2 prompt was correctly fabrication-proof but was still optimized for safe, compact
   manifest production, not strategic depth. It asked for 38 concise notes under a ~24K token
   budget, with no explicit step comparing this tenant against real industry data — industry
   patterns sat unused inside `context_packet`, and the model was left to write "competent but
   repetitive" summaries rather than an integrated point of view.
2. Relationships/graphs should exist wherever real data supports them, with a real purpose — not
   forced onto every dimension as decoration.

This release restructures the `enterprise_book` instruction into five explicit, sequenced jobs
(understand the enterprise → compare with industry → identify the few material gaps and advantages
→ develop an integrated point of view → translate into decisions and exhibits), raises the output
budget from ~24K to a 64K target (Opus 4.8 supports 128K; the old cap was optimizing for the wrong
thing), and adds a deterministic — never Claude-authored — `graph_binding` for the six dimensions
where real dependency data exists (confirmed against skyharbor-air: 40 real edges, 78 unique named
nodes, 4 real relationship types spanning business-function-to-system and system-to-integration
chains). No paid Claude call was made to build or prove any of this.

## Layer Impact

Release lane: `internal-admin` + `experimental` (`HOME_KNOWLEDGE_V4_BOOK_MODE=true`, off by
default, unchanged).

- **Layer 2 (Source Adapters) / operator tooling**: `scripts/knowledge/build-home-knowledge-v4-review-pack.mjs`
  — `enterprise_book` prompt instruction and output_requirements rewritten; new deterministic
  `graph_binding` mechanism; `maxTokens` now defaults higher specifically for book mode.
- No changes to Layer 3, Layer 4, or any live route.

## Client Applicability

- All clients: No — experimental `HOME_KNOWLEDGE_V4_BOOK_MODE=true` path only, never run against
  live Claude, never produced any candidate accepted into `/home` for any tenant.
- Specific clients: skyharbor-air is the only tenant with a book-mode fixture and real
  registry/evidence/relationship data wired.
- Internal only: Yes — this is operator/generation tooling, not a client-visible surface.
- Public/demo only: No.
- Feature flag: `HOME_KNOWLEDGE_V4_BOOK_MODE=true` / `--book-mode`, off by default; unchanged by
  this release.

## Changes Included

- `scripts/knowledge/build-home-knowledge-v4-review-pack.mjs`:
  - `bookMode` detection moved earlier so `maxTokens` can default on it: book mode now defaults to
    `64000` (was the shared `32000` default) — explicit `--max-tokens`/`HOME_KNOWLEDGE_V4_MAX_TOKENS`
    still always wins. Reasoning kept inline: the old 12000→32000 default change exists because a
    call that hits the output cap mid-generation returns an incomplete tool call, which the
    pipeline reads as empty and retries in full — the same failure mode a too-tight book-mode cap
    would reintroduce at a deeper synthesis depth.
  - `enterprise_book` instruction rewritten around five explicit, sequenced jobs (see Plain-English
    Summary). New output fields: `industry_comparison` (job 2 — one item per genuinely relevant
    `industry_fact_base` pattern, tenant's position ahead/behind/at_parity/not_applicable, never a
    restatement of the fact base), `material_gaps` / `material_advantages` (job 3 — 3-7 items each,
    each tagged `applies_to_dimensions` and `why_it_matters_to_leadership`, explicitly bounded so
    they stay "the few things that matter" rather than a complete inventory).
  - `industry_fact_base` pulled out of `context_packet` as an explicit, named prompt input (was
    previously just one more field the model had no explicit instruction to use comparatively).
  - `GRAPH_ELIGIBLE_DIMENSIONS` (apps, infra, architecture_dependencies, integrations, data, rel) +
    `deriveGraphBinding()`: same non-fabricable-pointer pattern as `VISUAL_RENDER_RULES` —
    `graph_binding` is a real, code-computed count/type summary of `relationship_samples`
    (`node_count`, `edge_count`, `relationship_types`), never actual node/edge data, and only
    attached where real relationship evidence exists. Every other dimension gets no `graph_binding`
    at all.
  - `renderDimensionsFromBook()`: wires `material_gaps`/`material_advantages` (filtered by
    `applies_to_dimensions`, same reuse-by-reference pattern as `conclusions`) and `graph_binding`
    into each of the 38 rendered pages.
- `scripts/knowledge/validate-integrated-manifest.mjs`: new `checkGraphBindingForFabrication()` —
  same allow-list principle as the existing visual-binding check (`relationship_source`,
  `projection_type`, `node_count`, `edge_count`, `relationship_types`, `empty_state` only; any other
  field, or an array where a count should be a number, is a hard `forbidden_graph_field` failure).
- `scripts/knowledge/assert-enterprise-book-prompt-preflight.mjs`: new checks that
  `industry_comparison`/`material_gaps`/`material_advantages` are actually requested in
  `output_requirements.fields` (not just `sections`/`conclusions` — proof that jobs 2-3 are real
  requested outputs, not narrative alone), that `industry_fact_base` is present and non-empty, and
  extended the never-requested-from-model field list to include `graph_binding`/`node_count`/
  `edge_count`.

## QA / Validation

All zero-cost, no Claude API calls.

- `node --check` + `npx eslint`: clean.
- All 12 integrated-manifest + 6 prompt-preflight fixtures still pass unchanged.
- `--preflight --book-mode` for skyharbor-air: `pass (0 failures)` — confirms the real assembled
  prompt requests all five-jobs output fields, carries a non-empty `industry_fact_base`, and never
  requests a visual or graph field from the model.
- Renderer proof against the existing v2 fixture (material_gaps/material_advantages/
  industry_comparison absent from that older fixture, so they render as empty arrays — expected,
  not a defect; the fixture predates this prompt version): `0 hard failures, 28 warnings` (same
  `weak_evidence_specificity` warnings as before — unaffected by this change).
- **Graph binding, real and purposeful**: rendered fixture output confirms exactly 6 of 38
  dimensions (`apps`, `data`, `integrations`, `infra`, `architecture_dependencies`, `rel`) receive a
  `graph_binding`, each `{relationship_source: "relationship_samples", projection_type:
  "dependency_map", node_count: 78, edge_count: 40, relationship_types: ["feeds","owns","runs_on","uses"]}`
  — real counts from real relationship_samples rows, identical across the 6 because it's the same
  underlying real dataset, not independently computed or guessed per dimension. Zero of the other
  32 dimensions received a graph_binding.

## Rollout Plan

Merge to `main` via the standard governed PR path (squash merge). Operator tooling only.

Next step, still pending separate explicit approval: one paid `HOME_KNOWLEDGE_V4_BOOK_MODE=true`
SkyHarbor run against this prompt. This is the first version of the prompt that asks for genuine
comparative/strategic synthesis (jobs 2-3) rather than compact manifest production — real output
quality against that bar is unverified and is exactly what the next paid run must answer, alongside
whatever the v2 record already flagged as open (conclusion tagging quality, cross-dimension
consistency in practice).

## Deployment Authority

Unchanged from the v2 record: no product-runtime code touched, no shared runtime mutators, no live
signed-in proof required.

## Rollback Plan

Revert the PR. `bookMode` remains additive and off by default; unrelated to `HOME_KNOWLEDGE_V4_INTEGRATED`.

## Audit Evidence

- This PR (URL to be filled in on open).
- Local validation output quoted verbatim above.
- `--preflight --book-mode` is itself durable, re-runnable audit evidence.

## Known Gaps

- No real Claude call has been made against the five-jobs prompt. Whether the model actually
  performs genuine comparative synthesis (versus restating `industry_fact_base` entries, or
  padding `material_gaps`/`material_advantages` past the 3-7 guidance) is unverified.
- The graph_binding mechanism is proven structurally and against real relationship_samples data,
  but no UI currently renders it — `RelationshipTopologyGraph` (built earlier this session) reads a
  different data path today; wiring graph_binding into that component is separate, undone work.
- All Known Gaps from the v2 record (5 legacy passes still skipped, only 6/38 dimensions get any
  dataset-backed content, cross-dimension conflict detection depends on Claude tagging conclusions
  correctly) remain unchanged and unresolved by this release.

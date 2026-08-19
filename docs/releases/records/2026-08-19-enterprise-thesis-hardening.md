# 2026-08-19-enterprise-thesis-hardening — verify the top-of-thesis narrative, add citeable context, scope the domain bar, add visual intent

## Release ID

`2026-08-19-enterprise-thesis-hardening`

## Status

`candidate`

## Plain-English Summary

Four corrections to the EnterpriseThesis generation/verification pipeline before any chapter
writer or visual prototype is built on top of it. None change how the thesis is stored or served —
this is entirely inside `scripts/data-build/build-enterprise-thesis.ts` and
`scripts/data-build/enterprise-signal-packet.ts`.

1. **The narrative itself is now verified, not just the itemized arrays around it.** Live output
   showed the highest-visibility text in the whole object — `enterprise_story` and
   `value_creation_model` — carrying material synthesis claims (e.g. "third-party spend at 52%
   means capability is externally delivered, not internally built") that never passed through the
   entailment verifier, because they lived in free-text prose rather than a `GroundedClaim` array.
   `enterprise_story` now also emits `enterprise_story_claims[]` decomposing its material
   assertions, and `value_creation_model.primary_value_drivers`/`economic_dependencies` are now
   `GroundedClaim[]` instead of bare strings. All of these route through the same verify/repair
   ledger as everything else. If verification changes any of these claims, a new reconciliation
   call rewrites the prose paragraph to stay consistent with what actually got published, rather
   than leaving the claims array and the prose next to it saying two different things.

2. **Governed context is now citeable, not just computed signals.** Before this, a claim resting
   on revenue, industry, a declared strategic priority, or a customer segment had nothing real to
   cite — live output showed the model falling back to bare, unresolvable references like
   "(enterpriseIdentity)". `enterpriseIdentity`, `businessEconomics`, declared priorities, and
   customer/segment context now each get a stable `ctx_*` id (mirroring `sig_*` signals), and the
   verifier/repair evidence lookup resolves both namespaces identically. No new relationships are
   asserted — each `ctx_*` item is a standalone fact, same "no invented priority→program linkage"
   discipline as the signal layer already holds.

3. **The two-domain rule is now scoped to what's actually claiming a connection.** Every
   `GroundedClaim` carries a new `claim_type` (`FACT | OBSERVATION | CROSS_DOMAIN_INSIGHT |
   ADVISORY_INFERENCE`). The domain-span check only applies to the latter two. A live run had
   flagged 34–36 "structural issues" per tenant that were single-domain program-status facts (e.g.
   "Program X is 12% complete") — never wrong, just never claiming a cross-domain connection in
   the first place, so the unconditional bar was checking the wrong thing.

4. **The thesis can now propose visual intent, never plotted values.** A new
   `visual_opportunities[]` field lets the model select a `visual_type` from a fixed grammar
   (Recharts-shaped: bar/line/scatter/etc.; governed-SVG-shaped: capability_map/dependency_graph/
   etc.) and a `dataset_ref` that must be an exact key in a new, deterministic
   `signalPacket.visualDatasets` catalog computed in the signal-packet compiler (vendor
   concentration, technology spend mix, program investment distribution, leadership theme
   frequency, metric attainment, risk concentration). The model never supplies or adjusts a
   plotted value. Structural validation checks both the `visual_type` allowlist and that
   `dataset_ref` actually exists — a chart pointed at a nonexistent dataset or an invented
   renderer is now a caught structural issue, not a runtime surprise downstream.

## Layer Impact

Lane: `global-control-lane`. Layer 4 (Products) generation tooling only —
`scripts/data-build/build-enterprise-thesis.ts` and `scripts/data-build/enterprise-signal-packet.ts`.
No canonical model, adapter, or storage-shape change.

## Client Applicability

- All clients: applies to any tenant this generator is run against.
- Specific clients: none.
- Internal only: yes — data-build script, not a served route.
- Public/demo only: no.
- Feature flag: none new; existing `THESIS_WRITE`/`THESIS_WRITE_APPROVED` gate unchanged and still
  not enabled — no DB row has been written under any version of this script this stretch.

## Changes Included

- `scripts/data-build/enterprise-signal-packet.ts` — new `ContextItem` type and internal
  `buildContextItems()`; new exported `buildVisualDatasets()`; both wired into
  `buildEnterpriseSignalPacket()`'s return as `contextItems` and `visualDatasets`.
- `scripts/data-build/build-enterprise-thesis.ts` — `GroundedClaim.claim_type` added; new
  `VisualType`/`VisualOpportunity` types and `VISUAL_TYPES` allowlist; `EnterpriseThesis` gains
  `enterprise_story_claims` and `visual_opportunities`; `value_creation_model.primary_value_drivers`
  /`economic_dependencies` changed from `string[]` to `GroundedClaim[]`; `SYSTEM_PROMPT` and
  `buildUserPrompt` updated for all four changes; `validateStructure` scopes the domain check by
  `claim_type`, resolves `ctx_*` alongside `sig_*`, and validates `visual_opportunities` against
  the dataset catalog and type allowlist; `verifyClaim`/`repairClaim` evidence lookup extended via
  new `evidenceLookup()` helper; `claimsRequiringVerification` includes the story/VCM claim arrays;
  new `reconcileNarrative()` + `RECONCILE_SYSTEM_PROMPT` regenerate prose only when the claims
  underneath it actually changed; `buildTenant` wires the reconciliation calls in.
- `tests/behaviors/enterprise-thesis-validation.test.ts` — fixtures updated for the new shapes;
  9 new test cases covering claim_type domain scoping (FACT/OBSERVATION exempt,
  CROSS_DOMAIN_INSIGHT/ADVISORY_INFERENCE still enforced), ctx_* resolution, story/VCM claim
  verification, and visual_opportunities validation (unknown dataset_ref, disallowed visual_type,
  valid case).
- `tests/behaviors/enterprise-signal-packet.test.ts` — 4 new test cases covering ctx_* id
  generation, absence of a context item for an undeclared fact, conditional presence of a visual
  dataset based on real underlying data, and correctness of the technology-spend-mix numbers.

## QA / Validation

- `NODE_OPTIONS="--max-old-space-size=6144" npx tsc --noEmit -p tsconfig.json` — PASS, 0 errors.
- `npx eslint` on all four changed files — PASS, 0 errors.
- `npx jest tests/behaviors/enterprise-thesis-validation.test.ts
  tests/behaviors/enterprise-signal-packet.test.ts` — PASS, 33/33 (24 new test cases added this
  release on top of the 20 that existed before it, plus 0 changes to the number of pre-existing
  cases that still exercise the same behavior they always did — the two-domain rule itself, only
  now scoped correctly).
- Not yet run: a live generation pass against real tenant data. Tracked as a required follow-up
  before any conclusion is drawn about whether the four fixes actually improve real output, per
  the standing rule that a green test suite proves the mechanism compiles and behaves as specified
  against fixtures, not that a live model call will use it well.

## Rollout Plan

Merge to `main`. ACA main-deploy builds a new digest-pinned image. A fresh
`data-build:enterprise-thesis:plan` job run (no DB write) against both tenants is the actual proof
this release's four changes hold on real data — specifically: story/VCM claims appear in the
verification ledger, `ctx_*` citations appear and resolve, single-domain FACT/OBSERVATION claims
no longer appear as structural issues, and `visual_opportunities` are present and valid against
the dataset catalog. Only after that passes does chapter-writer / static-prototype work begin, per
the standing gate on this whole workstream.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this PR.
- Live signed-in proof required: not for this PR; follow-up is a plan-only ACA Job run, no
  product surface reads this artifact type yet.

## Rollback Plan

Revert the commit. No DB row has been written under any version of this script this stretch
(`THESIS_WRITE` has not been enabled for a live run), so rollback is a pure code revert with no
data migration needed.

## Audit Evidence

PR link recorded at merge. The follow-up live job's captured log and exported thesis output
(raw/published/ledger per tenant) become the audit evidence for whether these four fixes actually
hold — tracked as the immediate next step after merge/deploy.

## Known Gaps

No live model call has exercised any of these four changes yet — validated only by type/lint/unit
tests against fixtures so far, same caveat as every generation-mechanics change this stretch. A
plan-only ACA Job run against both tenants is required before drawing conclusions about real
behavior, and before the gated next phase (static Home prototypes) begins.

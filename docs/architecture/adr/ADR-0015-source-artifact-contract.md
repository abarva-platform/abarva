# ADR-0015 - SourceArtifactContract: a single, typed, versioned contract for stage/artifact eligibility (PR 4A)

## Status

Accepted

## Date

2026-07-26

## Context

`ADR-0013-source-modernization-baseline.md` named PR 4 as the successor to PR 3 (governed
vendor-proposal ingestion) and the RLS/tenant-isolation workstream: "the canonical lifecycle,
shared `SourceArtifactContract` and `SourceWordBudget` types... both generation paths (should
only be one by this point) consuming the same contracts." This ADR is PR 4A — the contract and
registry — the first of a four-part sequence (4A contract/registry, 4B generation/route
enforcement, 4C review/export/downstream enforcement, 4D UI/regression harness).

### Scope discovery findings this design rests on

A full scope-discovery pass (not repeated here in detail) found:

1. **Four incompatible stage enumerations already exist.** The canonical `SourceStageKey`
   (`src/lib/source/types.ts`) has 11 values — `strategy, scope, rfp, responses, evaluation,
   pricing, bafo, executive_decision, selection, transition, value` — plus 7 legacy aliases
   (`intake, sourcing_strategy, rfp_rfi_package, vendor_responses, orals_bafo,
   contract_mobilization, value_realization`) that real persisted event rows still use,
   normalized on read via `normalizeSourceStageKey()` (`constants.ts`). A separate 8-value
   numeric `SourcingStageNumber` model exists for "stage packs." Free-text stage labels
   (`"1 · Strategy"`, `"3 · RFP"`) exist on artifact profiles. An initial proposal to build this
   contract on a different, 14-value stage list (`intake, market_scan, rfi, decision, award,
   contracting, closed`, …) was rejected after this finding — those names don't match the
   canonical model OR real persisted data (`market_scan`/`rfi`/`contracting`/`closed` are not
   `SourceStageKey` values at all; `decision`/`award` are code's `executive_decision`/
   `selection`). Per explicit user decision, **this contract is built on the existing 11-stage
   canonical model**, not a new one — matching real data, not silently reinterpreting it.
2. **Three separate per-artifact registries exist, with no cross-validation between them:**
   `canonical-specs/artifact-specs.ts` (code, stage, family, requirementLevel, gateDefining —
   correctly keyed on canonical `SourceStageKey`), `agent-generation/prompt-registry.ts` (the
   actual `upstreamRequired`/`upstreamOptional` dependency graph, keyed by full code, no stage
   field), and `documentation-standards/source-artifact-profiles.ts` (audience, clientFacing,
   format, evidenceMode, requiredExhibits — keyed by the SHORT code prefix, e.g. `"d09"` not
   `"d09_rfp_pack"`, via `shortPromptProfileCode()`). Nothing enforces they stay in sync.
3. **No shared eligibility function exists.** The two live artifact-generation entry points
   (`[eventId]/artifacts/[artifactCode]/generate/route.ts` and the generic
   `[eventId]/artifacts/generate/route.ts` chat-save path) each hand-roll their own notion of
   "eligible" — the first checks only upstream-body presence (no stage check at all, no
   approval-status filter — "any non-empty body counts"); the second accepts a client-supplied
   `stageKey` validated only for canonical-key membership, with its own independent
   stage→family mapping.
4. **Review/acceptance authority is a flat, per-event capability today**, not keyed by artifact
   type or stage (`source-access-policy.ts`'s `canApproveSourceStages` etc.) — every
   artifact-accept route uses the same check regardless of which artifact.
5. **Export/render routes have no governance-stage gate at all.** The governance banner
   (`artifact-governance.ts`) is informational content embedded in the rendered document, not an
   access-control check on whether rendering is allowed.
6. **Context-binder authoritative-use eligibility is inconsistent across three mechanisms**:
   generation's `collectUpstreamBodies()` applies no authority filter at all (any non-empty body
   counts); aVa/Q&A's `resolveAuthoritativeArtifactSlots()` (`client-final-artifacts.ts`) applies
   a real 5-tier fallback pool, general across artifact types; `VendorProposalFact` (not a d-code
   artifact) gets a third, simplest binary accepted-only treatment specific to itself.

## Decision

1. **Named `SourceArtifactContract`**, matching ADR-0013's own naming — not a new,
   inconsistent name for the same concept. `SourceWordBudget` (also named in ADR-0013) is a
   deliberately separate, not-yet-built concern; this ADR does not create it.
2. **Composed, not hand-authored.** `src/lib/source/contracts/build-registry.ts` builds the
   registry by joining `canonical-specs/artifact-specs.ts`, `agent-generation/prompt-registry.ts`
   (via the existing `getPromptTemplate()`), and `documentation-standards/
   source-artifact-profiles.ts` (via `getSourceArtifactProfile()`) at module load — it does not
   duplicate their data into a fourth hand-typed table. If any of the three registries is
   missing an entry the other two have, the module **throws at load time** — this is the direct
   fix for finding #2 (no cross-validation): drift between the three registries is now a startup
   error, not a silent gap.
3. **The stage model is the existing canonical `SourceStageKey`.** `earliestEligibleStage` is
   the artifact's own declared stage (`artifact-specs.ts`'s `stage` field);
   `allowedGenerationStages` is every stage from there through the end of `SOURCE_STAGE_ORDER` —
   once eligible, an artifact stays eligible at every later stage too. This matches current real
   behavior (nothing today blocks generating an earlier-stage artifact from a later stage) and
   only adds a NEW restriction (blocking generation BEFORE eligibility) that nothing currently
   enforces at all — a strictly additive, non-breaking gate for PR 4B to wire in.
4. **New fields this contract introduces are named as intended targets, not existing
   enforcement**, and each says so in its own doc comment: `acceptanceAuthority` (today
   uniformly `canApproveSourceStages` — real per-artifact authority differentiation is future
   work `source-access-policy.ts` doesn't support yet), `exportEligibility` (a rule this contract
   defines; no live route enforces it yet — PR 4C's scope), `downstreamConsumers` (names the
   intended per-artifact-type consumer scope; neither `collectUpstreamBodies()` nor
   `resolveAuthoritativeArtifactSlots()` filters by artifact type today — also PR 4C's scope).
   This ADR does not claim PR 4A itself changes any of that behavior — it only names the target
   the later sub-PRs will wire in, so the fields exist with real semantics before the
   enforcement code is written, rather than being invented ad hoc mid-route-change.
5. **`tenantIsolationPosture` is honest about ADR-0014's finding**: every `SourceArtifactContract`
   entry (all 33 d-codes) is `standard_application_layer_tenant_scoping` — ordinary
   `client_id`/`tenant_key`-filtered queries, RLS enabled but decorative for live traffic, the
   same gap ADR-0014 named as a real, separate, larger follow-up for the rest of Source. Only
   `source_vendor_proposal_facts`/`source_vendor_proposal_fact_reviews` have the stronger
   `rls_enforced_tenant_scoped_session` posture, and neither is a d-code artifact in this
   registry — this contract does not silently upgrade a claim ADR-0014 was explicit about.
6. **Finality conditions are named only for the two artifacts that make a decision/selection
   claim requiring a sibling precondition**: `d24_decision_brief` and `d27_selection_memo` both
   require `d26_steward_signoff` (Governance Sign-off Record) to already be accepted — matching
   the contract rule "Decision artifacts must not claim finality before the event and artifact
   acceptance conditions are met." Every other artifact has `finalityConditions: null` — finality
   is a decision/selection-stage concept only, not something every artifact type claims.
7. **Runtime schema validation via Zod** (`schema.ts`), matching this repo's existing convention
   (`src/lib/governance/context-corpus-policy.ts`) rather than inventing a new validation
   pattern. A contract-coverage test suite (`__tests__/registry.test.ts`, 18 cases) proves: one
   contract per spec code (no missing, no duplicate); every contract passes the Zod schema;
   every upstream reference (required and optional) is a real, registered code; no artifact
   requires itself; **the required-upstream dependency graph has no cycles** (verified against
   the real, live dependency data — not a synthetic fixture); `allowedGenerationStages` always
   starts at the artifact's own stage; the 5 consulting-grade gate codes get the stronger review
   requirement; decision-stage finality preconditions are exactly `d26_steward_signoff`; historical
   legacy stage aliases normalize to a stage this registry actually has contracts for.

## Consequences

- Routes, generation, review, export, and context-binding code that needs eligibility/authority
  answers should import from `src/lib/source/contracts/registry.ts` — never reach into the three
  underlying registries directly for this purpose. This is not yet enforced (PR 4B/4C wire the
  actual call sites); this ADR states the intended access pattern.
- The three underlying registries (`artifact-specs.ts`, `prompt-registry.ts`,
  `source-artifact-profiles.ts`) remain the sources of truth for their own concerns (stage/family
  scaffolding, prompt content, document-standards formatting) — this contract does not replace
  them, it joins and validates them.
- A future genuinely-new artifact type must be added to all three underlying registries before
  the contract registry will build at all (the module throws otherwise) — this is a deliberate,
  loud failure mode, not friction to work around.
- This ADR does not migrate the stage model to the previously-proposed 14-value list. That
  remains a real, larger, separate undertaking (touching `queries.ts`, `lifecycle.ts`,
  `portfolio-derivations.ts`, `portfolio-filtering.ts`, the stage-pack files, and a real
  historical-data backfill decision) if ever pursued — named explicitly as out of scope rather
  than silently declined.
- One incidental finding, not acted on in this PR: `prompt-registry.ts`'s `REGISTRY` object
  contains 4 dead entries keyed `d02_value_target_legacy`, `d03_archetype_decision_legacy`,
  `d04_app_inv_legacy`, `d24_decision_brief_legacy` — real object properties whose `artifactCode`
  field matches a live, differently-keyed entry, but which `getPromptTemplate()`'s
  `REGISTRY[artifactCode]` lookup can never reach (no caller ever looks up a `"_legacy"`-suffixed
  key). Confirmed via the programmatic AST extraction used to build this contract's upstream-
  dependency data (33 live entries, 4 orphaned `_legacy` entries, no code overlap). Left alone —
  cleanup, not this PR's scope.

## Alternatives

- **Migrate the stage model to the proposed 14-value list first, then build the contract on
  top.** Rejected for this PR — bigger, separate undertaking with a real historical-data
  reinterpretation decision; the existing 11-stage model is what real event rows and dozens of
  call sites actually use today.
- **Hand-author a fourth, standalone 33-entry contract table.** Rejected — this is exactly the
  fragmentation this ADR closes (three registries already exist and already drift); a fourth
  table would be one more place to keep in sync rather than a fix.
- **Name the type `StageArtifactContract`** (as originally proposed). Rejected in favor of
  `SourceArtifactContract` — ADR-0013 already committed to that name for this exact deliverable.

## Amendment (2026-07-26) — PR 4B: generation and route enforcement

PR 4A built the contract; nothing called it. PR 4B wires the two live generation entry points —
`[eventId]/artifacts/[artifactCode]/generate/route.ts` (AI-generate) and
`[eventId]/artifacts/generate/route.ts` (chat-save) — through a new shared resolver,
`src/lib/source/contracts/generation-eligibility.ts`'s `evaluateGenerationEligibility()`.

**What changed, concretely:**

1. **Stage eligibility, genuinely new, applied to BOTH routes identically.** Previously nothing
   checked whether an event's current stage permitted generating a given artifact at all — an
   event still at `strategy` could generate a `d24_decision_brief` (stage `executive_decision`)
   with no error. Both routes now call `isArtifactEligibleAtStage()` (via
   `evaluateGenerationEligibility`) and return `409 stage_not_eligible` with the artifact's real
   earliest eligible stage and the event's current stage in the response body. This is purely
   additive — it blocks a request that nothing previously permitted meaningfully (no live route
   or UI flow depends on generating a later-stage artifact from an earlier stage), and does not
   remove any capability that worked before.
2. **Upstream-required presence, consolidated on AI-generate, deliberately NOT extended to
   chat-save.** The AI-generate route's existing `findMissingUpstreamCodes(template, ctx)` check
   is unchanged in its exact response shape (`error: "upstream_required"`, same `detail` text,
   same `missingUpstream` array) — this PR only adds the new stage check ahead of it, using the
   same shared resolver so both blockers are computed through one function.
   **Chat-save intentionally does not gate on missing upstream at all** — discovered mid-build:
   an existing, real, currently-passing test in this route's own suite chat-saves a
   `d09_rfp_pack` with zero upstream artifacts present, which is a legitimate use case (chat-save
   persists content a human already wrote; unlike AI-generate, which drafts FROM upstream
   evidence and is meaningless without it, chat-save is often used to capture notes or catch up
   on documentation out of order). Applying the AI-generate route's upstream gate to chat-save
   would have silently broken that real, tested behavior. This is a deliberate, named scope
   boundary — not the full literal reading of "ensure chat-save and direct generation use the
   same checks," which this ADR interprets as "the same STAGE-eligibility check," not "an
   identical upstream-authoring gate regardless of each route's actual purpose."
3. **Chat-save's independent stage→family mapping removed.** The route previously re-derived
   `SourceArtifactFamily` from a hardcoded switch on the resolved stage key, independent of the
   artifact code itself — a second, drift-prone stage→family mapping alongside
   `canonical-specs/artifact-specs.ts`'s real one (which PR 4A's contract already exposes
   correctly per code). Family now resolves from the contract (`contract.family`), falling back
   to the caller's explicit override only if one is supplied — matching prior behavior for that
   case, but now correct-by-construction for the common (no explicit override) case instead of
   guessed from stage.
4. **Both routes' existing test suites still pass unmodified** (chat-save: all 5 pre-existing
   tests green with zero changes to their assertions) — proving these changes are additive to
   the AI-generate route's response shape and non-breaking to chat-save's existing, tested
   behavior. Two new tests were added proving the new stage gate actually rejects an ineligible
   request and that chat-save's deliberate upstream-check exemption is real (a d09 with no
   upstream still saves successfully).

**Deliberately not attempted in this PR** (named explicitly, not silently deferred):
tightening the upstream-presence check to "accepted authoritative" (the contract's fuller rule)
— this needs a real, general definition of "accepted" for arbitrary d-code artifacts, which
today only exists via `client-final-artifacts.ts`'s slot-based resolver
(`resolveAuthoritativeArtifactSlots`), never wired to either generation route. A distinct,
larger, separate follow-up.

## References

- `docs/architecture/adr/ADR-0013-source-modernization-baseline.md` — named this deliverable and
  its target type name.
- `docs/architecture/adr/ADR-0014-vendor-proposal-facts-rls-tenant-context.md` — the tenant-
  isolation posture finding this ADR's `tenantIsolationPosture` field stays honest about.
- `src/lib/source/canonical-specs/artifact-specs.ts` — stage/family/requirement-level source.
- `src/lib/source/agent-generation/prompt-registry.ts` — upstream-dependency source.
- `src/lib/source/documentation-standards/source-artifact-profiles.ts` — format/audience/
  evidence source.
- `src/lib/source/agent-generation/quality-review.ts` — `SOURCE_CONSULTING_GRADE_GATE_CODES`,
  reused unchanged for `reviewRequirement`/`qualityBarProfile`.
- `src/lib/source/client-final-artifacts.ts` — the general authoritative-use mechanism named in
  `authoritativeUseMechanism`.
- `src/lib/source/artifact-governance.ts` — the governance-stage/banner mechanism named in
  `exportEligibility`/`governanceBannerAudience`.
- `src/lib/source/contracts/types.ts`, `build-registry.ts`, `schema.ts`, `registry.ts` — PR 4A's
  implementation.
- `src/lib/source/contracts/generation-eligibility.ts` — PR 4B's shared eligibility resolver.
- `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate/route.ts` — PR 4B's
  AI-generate route change.
- `src/app/api/v1/source/[eventId]/artifacts/generate/route.ts` — PR 4B's chat-save route
  change.

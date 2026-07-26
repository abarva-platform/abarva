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

## Amendment (2026-07-26) — PR 4C: review, export, and downstream enforcement

PR 4B enforced stage/upstream eligibility at generation time. PR 4C closes the distinction it
surfaced: AI generation enforces stage + authoritative-upstream; human chat-save authoring may
still create an out-of-sequence draft, but what it creates must not automatically become
authoritative, exportable, or available to downstream decision artifacts. Concretely:

**1. A new shared authority resolver — `src/lib/source/contracts/artifact-authority.ts`.**
`resolveArtifactAuthority(input)` is now the one place that decides, for any artifact instance,
whether it is `isDraft`, `isAccepted`, `isAuthoritative`, `isExportEligible`, or `isFinal`, plus a
structured `blockers[]` list explaining why not. It composes two pre-existing, previously-unwired
mechanisms rather than inventing new ones: `deriveSourceArtifactGovernanceStage()`
(`artifact-governance.ts`, already correct, had exactly one call site before this PR — the accept
route) and the contract's `exportEligibility`/`finalityConditions` fields (PR 4A, never read by
any route before this PR). `upstreamCandidateSatisfiesRequirement(input)` is a one-line wrapper
(`resolveArtifactAuthority(input).isAuthoritative`) — the single definition of "satisfies an
upstream requirement" that every consumer now shares, per the ask that no route implement its own
interpretation.

**2. Root-cause finding: the acceptance ledger had zero effect on anything before this PR.**
`source_artifact_acceptances` (built in a prior slice) and `resolveAuthoritativeArtifact`'s
`hasActiveAcceptance` pool (also pre-existing, correctly designed) were never connected — no live
caller anywhere in the repo ever populated `hasActiveAcceptance` on a candidate. Accepting an
artifact inserted an audit-ledger row and nothing else. This PR wires it into every place authority
is actually decided:
   - **Accept route** (`accept/route.ts`): now resolves the artifact's `SourceArtifactContract`
     first (404 `unsupported_artifact` if none is registered — no more accepting a code this
     workstream has no opinion about), replaces the acceptance-authority permission check with
     `accessPolicy?.[contract.acceptanceAuthority]` (contract-driven, though today's schema has
     exactly one authority value so behavior is unchanged — the existing stronger permission bar
     is preserved, not weakened), adds a genuinely new stage-eligibility gate before acceptance
     (409 `stage_not_eligible` if the artifact's stage hasn't been reached), and returns the full
     `ArtifactAuthorityDecision` in the success response instead of just the ledger row.
   - **`nexus/ask/route.ts`**: `toArtifactAuthorityCandidate` now populates real
     `hasActiveAcceptance` via a batch `getLatestArtifactAcceptancesByArtifactIds` lookup before
     calling `resolveAuthoritativeArtifactSlots` — the pool-based resolver's acceptance pool
     (pool 2, ranked above status/generated-origin) now actually has data. This is the mechanism
     behind ask #5's "Source aVa evaluation/comparison contexts" — d16/d19/d22/d24 and every other
     slot this route resolves now prefer an accepted artifact over a newer, unaccepted draft in
     the same slot.
   - **AI-generate route**: `findMissingUpstreamCodes` (body-presence only) replaced with
     `findUnsatisfiedRequiredUpstream` (`src/lib/source/contracts/upstream-satisfaction.ts`),
     which resolves each required upstream code's authority for real — draft, review-pending,
     rejected (`status: "blocked"` — see point 4), and superseded upstream artifacts no longer
     satisfy a requirement just because a body exists. `collectUpstreamBodies` (the function that
     actually binds upstream text into the generation prompt) is intentionally left unchanged: it
     is called with `[...upstreamRequired, ...upstreamOptional]` AFTER the new gate has already
     confirmed every required code is authoritative, so binding its body is safe by construction;
     optional codes still bind on "any body present," matching PR 4A's required-vs-optional
     distinction. This function has exactly one live call site in the repo (this route) — the
     broader "downstream chain used by exports or Decision Brief generation" ask #5 named does
     not exist as a separate code path today: `spec-builder.ts` and every renderer render each
     artifact's own already-generated body; they do not re-stitch other artifacts' content at
     render time. The two enforcement points above (generation-time upstream authority + the
     export-eligibility gate in point 3) are the complete set of places this chain passes through.
   - **Vendor-proposal authoritative-fact context** (`getAuthoritativeVendorProposalFacts`,
     bound into `ctx.authoritativeVendorProposalFacts` in `context-binder.ts`) already resolves
     authority correctly — built in an earlier slice (PR3) with its own accept/reject ledger for
     the separate `VendorProposalFact` model. Out of scope for this PR; named here only to confirm
     it was checked, not silently skipped.

**3. Contract-driven export eligibility — the render and download routes.** Both
`[eventId]/artifacts/[artifactCode]/render/route.ts` (the unified render route) and
`artifacts/[artifactId]/download/route.ts` (File Cabinet / Gate Decision panel / canvas Document
tab) now resolve the linked artifact's `SourceArtifactContract` and, when one is registered, block
with a structured `409 export_not_eligible` (governance stage + full `blockers[]`) whenever
`resolveArtifactAuthority(...).isExportEligible` is false — e.g. a client-facing artifact still at
`ai_draft` cannot export until it clears `approved_for_external_use`. The gate is skipped silently
(not blocked) when no contract is registered for the code, or when nothing has been generated/
linked yet — this PR does not extend new restrictions to artifact families it never analyzed, and
"nothing to export yet" is a different failure mode the existing code already handles. Both routes'
pre-existing test suites needed real fixture updates (several used draft/unapproved `d09_rfp_pack`
and `d05_scope_memo` fixtures to test unrelated mechanics — substitution, format resolution,
filename encoding) — those fixtures now carry `status: "approved", approvedBy` so they continue to
exercise what they were built to test, and each route gained two new tests proving the gate itself
(blocked when not eligible, allowed once accepted + approved for external use).

**4. Rejected artifacts, honestly scoped.** No reject mechanism exists for general d0X Source
artifacts (only the separate `VendorProposalFact` model has one). `resolveArtifactAuthority`
treats `status === "blocked"` — an existing, currently-unused enum value — as the rejected/
terminal-non-authoritative signal, alongside `lifecycleState === "superseded" | "retired"`. This is
named explicitly as an honest, minimal interpretation of an existing field, not new reject
infrastructure this PR was not asked to build.

**5. Governance-banner text normalization across renderers — explicitly scoped OUT, inventoried
rather than silently skipped.** Of the 20 `SourceDeliverableKind` values, renderers fall into three
groups:
   - **Shared narrative renderer** (`narrative-docx.ts` / `narrative-html.ts`) — backs 9 kinds
     (strategy-memo, scope-memo, rfp-package, vendor-response-pack, pricing-workbook-summary,
     decision-brief, selection-memo, demand-challenge, sourcing-approach, vendor-risk-pack). Calls
     `sourceArtifactGovernanceBanner()` / a hardcoded `SOURCE_AI_DRAFT_GOVERNANCE_MESSAGE`, both
     unconditionally as if every rendered artifact is at `ai_draft` — this was true before this PR
     (nothing computed a real stage at render time) and remains true after it, since PR 4C's export
     gate blocks ineligible exports at the route level before rendering ever runs, but does not
     change what the rendered banner *text* claims for artifacts that DO clear the gate.
   - **Structured renderers wired to governance, same hardcoded-`'ai_draft'` limitation**:
     app-inventory(+docx), bafo-question-pack-docx, market-scan-docx, pricing-template(+docx),
     response-checklist(+docx), scorecard(+docx) — 6 dedicated renderer pairs.
   - **Structured renderers with NO governance banner call at all**: tco-iceberg(+docx),
     ai-clause-gap(+docx+html), renewal-decision(+docx), pricing-comparison(+docx), trap-log(+docx)
     — 5 dedicated renderer pairs. These render with no draft/final banner of any kind today.

   Making the banner *text* reflect the artifact's real governance stage requires threading a
   computed `governanceStage` (or the full `ArtifactAuthorityDecision`) from
   `buildSourceDeliverableSpec()` — which has the context needed to look up the linked artifact's
   real row — down through `SourceDeliverableSpec` into all ~20 renderer call sites, replacing every
   hardcoded literal and adding a banner call to the 5 kinds that have none. That is a real,
   separate, mechanical plumbing change (new spec field + ~20 call-site edits + new tests per
   renderer), not attempted here under the same PR as the authority resolver, the two export gates,
   and the acceptance-ledger wiring above. Tracked as explicit follow-up (PR 4C-2 or folded into
   PR 4D) rather than silently left unstated. The export **gate** (point 3) is the actual access-
   control mechanism and is real and enforced now; the banner **text** inside a successfully-exported
   file is the part still pending.

**Preserving the human-authoring decision.** Chat-save is unchanged by this PR beyond PR 4B's
stage-eligibility check: it can still create an out-of-sequence draft (`accept/__tests__/route.test.ts`
and `[eventId]/artifacts/generate/__tests__/route.test.ts` both still pass unmodified). What
changes is what that draft can *become*: it cannot be accepted before its stage is reached (accept
route's new gate), cannot export until it clears the contract's governance-stage minimum (render/
download gates), and does not satisfy an upstream requirement or win an authoritative slot until it
actually is accepted (upstream-satisfaction.ts, nexus/ask wiring). Stage and upstream eligibility
are enforced at acceptance/export/downstream-consumption time, not at save time — exactly as asked.

**Required-tests coverage.** `artifact-authority.test.ts` (16 tests: draft/accepted/authoritative/
export-eligible/final permutations, including out-of-sequence-draft-blocked-two-ways, rejected-
via-`blocked`, superseded-never-authoritative, client-facing-vs-internal export minimums, finality
requiring sibling sign-off); `upstream-satisfaction.test.ts` (6 tests, including the batched-no-N+1
proof); `accept/route.test.ts` (+3: authority decision on success, stage-gated 409, unregistered-
code 404); `nexus/ask` context test (+2: acceptance-wired structural proof, accepted-outranks-newer-
draft precedence proof); `render/route.test.ts` (+2: blocked 409, eligible 200); `download/
route.test.ts` (+2: blocked 409, eligible 200, plus 5 pre-existing fixtures updated to stay green
under the new gate). Vendor-facing/client-facing export requiring stronger authority is proven by
both new render/download tests using `d09_rfp_pack` (a real client-facing contract).

## Amendment (2026-07-26) — PR 4D: UI eligibility explanations and the stage × artifact regression harness

PR 4C made every blocked action return a real, structured reason (`{code, detail, blockers}`).
Nothing in the UI read any of it. Scoping (per an Explore-agent code-grounded audit of every
Source component that triggers generate/accept/export or displays an artifact's status): DocumentTab's
generate flow special-cased exactly one blocker code (`upstream_required`) and dropped everything
else down to a single `detail` string; ArtifactAcceptancePanel's accept flow did the same;
File Cabinet/Document-tab export links were bare `<a href download>` anchors with **no error
handling at all** — a blocked export (PR 4C's real `409 export_not_eligible`) silently downloaded
or opened the JSON error body as if it were the file. No shared component or mapping existed
anywhere for turning a blocker code into UI copy.

**What changed, concretely:**

1. **`src/lib/source/contracts/blocker-copy.ts`** (new, isomorphic — no server-only imports) —
   `normalizeArtifactBlockers(payload, fallbackDetail?)` reads either real route-response shape
   (accept/render/download's `{blockers: [...]}` array, or the AI-generate route's single
   flattened `{error, detail, ...meta}`) and always returns a `ArtifactBlockerLike[]`, so no
   client call site needs to know which shape it's looking at. `blockerLabel(code)` maps each
   known blocker code to a short, scannable badge (`Stage`, `Upstream`, `Acceptance`, `Review`,
   `Approval`, `Sign-off`, ...), falling back to a generic title-cased reading of an unrecognized
   code rather than throwing — new blocker codes the resolver adds later don't require a matching
   UI release. This module does not rewrite the server's `detail` sentences (they were already
   full, human-written prose aimed at being read directly) — it stops them from being dropped.
2. **`ArtifactBlockerList`** (new, `src/components/source/canvas/`) — the one shared renderer for
   a blocker list, used identically by every surface below. A multi-blocker response now shows
   every reason, not just the first one a caller happened to keep.
3. **`ExportLink`** (new, `src/components/source/canvas/workspace-tabs/`) — replaces the bare
   `<a href download>` export pattern. Fetches first; a real 2xx response triggers an actual
   Blob download/`window.open`; a blocked response reports its blockers to the caller instead of
   downloading the error body. Wired into DocumentTab's five export anchors (xlsx, xlsx-comparison,
   docx, html, pdf) and File Cabinet's two (registry download, export-ready render links).
4. **DocumentTab** — `onGenerateArtifact`'s return type gained an additive `blockers?` field;
   `handleGenerate` renders the full blocker list (via `ArtifactBlockerList`) instead of one
   special-cased string; a new `exportBlockers` state (reset the same way `generationBlockers`
   already was, on artifact switch) surfaces export-link failures next to the export buttons.
5. **`ArtifactAcceptancePanel`** — the flat `error: string | null` state is now
   `blockers: ArtifactBlockerLike[]`, rendered through the same shared list. The panel also now
   reads the accept route's `authority` field (returned since PR 4C, read by no client before
   this PR) and shows a real, contract-derived status line after a successful accept —
   distinguishing "accepted and authoritative, cleared for export," "accepted and authoritative
   but not yet cleared for export" (a client-facing artifact needs `approved_for_external_use`
   separately from acceptance — a real, load-bearing distinction, not a hypothetical one), and
   "accepted but not yet authoritative," each with any remaining blockers listed underneath. This
   is the concrete "UI eligibility explanation" the user asked for: the UI now tells the person
   accepting an artifact whether that action actually finished the job or not, instead of only
   confirming the POST succeeded.
6. **Full stage × artifact regression harness** —
   `src/lib/source/contracts/__tests__/stage-artifact-regression-matrix.test.ts` (new). PR 4A-4C's
   own suites are example-based (a handful of representative cases each). This file is
   deliberately exhaustive: every registered artifact code × all 11 canonical stages for
   `isArtifactEligibleAtStage`/`evaluateGenerationEligibility` monotonicity and agreement; every
   code × every stage × every `{status, lifecycleState, hasActiveAcceptance}` combination that
   actually drives governance-stage derivation and terminal-state detection, asserting the core
   authority invariants (`isFinal ⇒ isAuthoritative ⇒ isAccepted`; a terminal artifact is never
   accepted/authoritative/export-eligible/final regardless of acceptance; `isAccepted` only when
   the caller actually passed an active acceptance and the artifact isn't terminal; empty
   `blockers` only alongside a fully clean decision) hold universally and nothing throws. A change
   that breaks eligibility/authority logic for even one code/stage/state combination the example
   tests don't happen to pick will fail here.

**Deliberately not attempted in this PR** (named explicitly): the Gate Decision panel and the
Approvals page/queue are a separate, older gap/criteria system (`GateCriterionAssessment`,
`deriveGapLine` in `GateTab.tsx`) that predates `SourceArtifactContract` and never surfaced
artifact-authority blockers — they were out of scope for the Explore-agent audit's own finding and
remain untouched. Governance-banner *text* normalization across the ~20 renderer kinds (PR 4C's
Known Gaps) is still not attempted — the export **gate** (blocking an ineligible export) is what
this and PR 4C wire; the *text* inside a file that does successfully export is separate, tracked
follow-up.

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
- `src/lib/source/contracts/artifact-authority.ts` — PR 4C's shared authority resolver.
- `src/lib/source/contracts/upstream-satisfaction.ts` — PR 4C's real upstream-satisfaction check.
- `src/lib/source/artifact-acceptances.ts` — the acceptance ledger PR 4C wires into authority.
- `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/accept/route.ts` — PR 4C's
  contract-driven acceptance gate.
- `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/render/route.ts` and
  `src/app/api/v1/source/artifacts/[artifactId]/download/route.ts` — PR 4C's export-eligibility
  gates.
- `src/app/api/v1/source/[eventId]/nexus/ask/route.ts` — PR 4C's acceptance-aware authority
  candidate wiring.
- `src/lib/source/contracts/blocker-copy.ts` — PR 4D's client-safe blocker normalizer/labeler.
- `src/components/source/canvas/ArtifactBlockerList.tsx` and
  `src/components/source/canvas/workspace-tabs/ExportLink.tsx` — PR 4D's shared UI components.
- `src/components/source/canvas/workspace-tabs/DocumentTab.tsx`,
  `src/components/source/canvas/analytics/ArtifactAcceptancePanel.tsx`, and
  `src/components/source/FileCabinetPanel.tsx` — PR 4D's wiring into the three live surfaces.
- `src/lib/source/contracts/__tests__/stage-artifact-regression-matrix.test.ts` — PR 4D's
  exhaustive stage × artifact regression harness.

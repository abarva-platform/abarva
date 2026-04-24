# S9b · Programs Nexus rail metadata binding

Slice ID: S9b
Slice name: Programs Nexus rail metadata binding
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-24
Author: Code (sole)

First Programs consumer of the S5/S6 honest-disclosure runtime
foundation. Wires the Programs Nexus rail to produce deterministic
`RenderedResponse` objects with `honest_disclosure` metadata so the
rail renders confidence, context-used, missing-input, and response-gate
state through the existing `<AgentResponse>` primitive — not by
fabricating data, and not by calling a live agent or model.

## What this slice changed

1. **New helper module**
   [src/lib/programs/programs-nexus-rail-view.ts](../../../src/lib/programs/programs-nexus-rail-view.ts):
   - `buildProgramNexusContextBundle(tenant, program)` assembles a
     platform `ContextBundle` (S1) for the Programs surface using only
     seed data. All eight canonical categories are addressed:
     - **Identity**, **Work Object**, **Workflow State**, **Artifacts**
       (when deliverables are seeded), **Patterns** (when the seed
       carries a `patternSlug`), **Conversation** are marked
       `present: true` with `provenance: 'deterministic' | 'retrieved'`.
     - **Business Context** and **Evidence** are honestly marked
       `present: false` with explicit `missingFields` (deferred to
       S9d).
   - Bundle is then scored via `scoreContextBundle` (S2), classified
     via `classifyContextBundle`, and gated via `createResponseGate`.
   - `buildProgramNexusRenderedResponse(tenant, program, mode)` returns
     a `RenderedResponse` carrying:
     - `honest_disclosure` metadata derived via
       `deriveHonestDisclosureMetadata` (S5).
     - A `confidence_signal` mirrored from
       `metadata.confidenceLevel` (S5).
     - `sparsity_flag: true` while evidence is unseeded.
     - Deterministic prose composed inline (no model call) that opens
       with the disclosure message and always closes with a tenant /
       program-code anchor line so output is never generic across
       tenants.
   - `buildProgramNexusRailChoices(tenant, program)` returns the five
     canonical Programs-rail choices (`walk-charter`, `pressure-test`,
     `surface-contradictions`, `phase-readiness`, `next-step`).

2. **Rail wiring**
   [src/components/deliverables/NexusProgramRail.tsx](../../../src/components/deliverables/NexusProgramRail.tsx)
   updated:
   - Public props (`{ tenant, program }`) and visual geometry are
     unchanged.
   - The opener `AgentTurn` and every choice/escape reply now carry a
     `rendered: RenderedResponse` field. The shared `<AgentRail>`
     primitive already renders `<AgentResponse response={turn.rendered}
     />` when `turn.rendered` is set, so no additional rail UI was
     required.
   - Free-text "ask something else" input still routes through the
     same deterministic path; it falls back to the `next-step` mode
     framing.
   - Hardcoded `replyFor` switch is gone; deterministic prose now
     lives in the helper module.

3. **Tests**
   [src/__tests__/integration/programs/programs-nexus-rail-metadata.test.ts](../../../src/__tests__/integration/programs/programs-nexus-rail-metadata.test.ts):
   - Bundle structure: 8 canonical category keys; per-category
     present/absent posture; pattern reference attached when seed has
     a slug; deterministic across repeated calls; non-empty
     `allowedActions` with no `'none'` kind; `missingInputs` surface
     value/risk/evidence fallbacks.
   - Rendered response: `honest_disclosure` block exists;
     `confidence_signal` mirrors the disclosure tier;
     `contextCategoriesUsed` non-empty; `missingInputs` surface
     value/risk/evidence; `responseGate` is one of the four canonical
     reasons; `disclosureMessage` non-empty; `sparsity_flag` true while
     evidence is unseeded; deterministic across calls; per-mode prose
     is distinct (output is not generic).
   - Choices stable in order and content.
   - Module hygiene: helper + rail do not import legacy `/programs`,
     `mock.ts`, preview, demo, Source UI, or Nexus runtime.
   - Cross-tenant determinism across all four canonical demo tenants.

## What is still deterministic

- Prose composition is a deterministic switch over the rail mode plus
  tenant/program metadata. Same inputs → same outputs.
- Confidence tier is derived from S2 quality scores; no model call.
- Honest fallbacks (`HONEST_FALLBACK_LABELS`) are imported from S9's
  `programs-canonical-view.ts` so the wording stays consistent across
  Programs surfaces.

## What is NOT live agent behavior yet

- No Claude / OpenAI / Pinecone / parallel retrieval invocation.
- No persistence of conversation turns across sessions.
- No real Context Bundle assembly inside `runPipeline()`.
- Confidence and gating reflect what the **bundle** says; they do not
  reflect a live composer's epistemic state.
- Citations are empty by design (sparsity_flag handles the disclosure).

## What is deferred

- **S9c** Program phase / hard-gate status rendering — Steward state
  machine, audit events, gate decision rendering. The bundle currently
  records the gate machine as `missingFields: ['gates_status']`.
- **S9d** Program deliverables evidence + value summary — populates
  Business Context and Evidence categories so confidence rises off
  LOW and value claims become defensible. Most missing-input
  fallbacks the rail surfaces today resolve at S9d.
- **S9e** Programs Control Tower signal emission — Atlas signal
  triggers wired to Tower pressure cards.
- **Live agent binding** — `runPipeline()` invocation, real Context
  Bundle assembly inside Nexus runtime, streaming compose, citations,
  persistence. This is the largest follow-on and is a separate slice
  family.

## Honest fallbacks used

- **Business Context** and **Evidence** categories declared absent in
  the bundle with named missingFields.
- Three baseline missing inputs registered in `bundle.missingInputs`
  (value, risks, evidence citations) — surface in the S5
  `disclosureMessage` and the S6 footer chip group.
- Phase-readiness mode prose includes
  `HONEST_FALLBACK_LABELS.gateState` ("gate state machine not yet
  wired").
- Walk-charter and pressure-test mode prose include
  `HONEST_FALLBACK_LABELS.valueAtStake` so the rail does not assert
  dollar amounts the seed cannot defend.
- Free-text escape input falls back to the `next-step` framing rather
  than fabricating a model response.

## Validation

- `npx tsc --noEmit --pretty false` — pass
- `npx jest src/__tests__/integration/programs/programs-nexus-rail-metadata.test.ts` — pass
- `npx jest src/__tests__/integration/programs/programs-canonical-surface.test.ts` — pass (S9 regression)
- `npx jest src/lib/auth/__tests__/tenant-isolation-probes.test.ts` — pass (S7 regression)
- `npm run build` — pass

## Acceptance

A rail surface is shippable for S9b when:
- Each agent turn arrives at `<AgentResponse>` with non-empty
  `honest_disclosure`.
- Confidence chip, context-used chips, and missing-input chips render
  via S6 wiring without code changes to AgentResponse.
- No live model call is initiated.
- Prose distinguishes between the four canonical demo tenants (no
  cross-tenant content leaks; tenant-anchor line proves it).

Promotion to `verified` requires a live walk by founder confirming the
above on `/tenant/[slug]/programs/[programSlug]` for at least two
canonical demo tenants.

## Status

Code complete. Pending founder review.

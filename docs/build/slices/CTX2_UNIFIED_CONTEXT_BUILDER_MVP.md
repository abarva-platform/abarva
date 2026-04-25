# CTX2 · Unified Context Builder MVP

Slice ID: CTX2
Slice name: Unified Context Builder MVP
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-25
Author: Code (sole)

Adds a deterministic, seed-backed builder that assembles a single
**Unified Context Pack** for any agent turn against any one of three
canonical work-object kinds: program, intelligence pattern, or
solution archetype. The pack is the canonical container an agent
runtime would consult before composing a response — it names the
work object, names what was retrieved, and names what is honestly
missing. **No model call, no live retrieval, no Date.now reads, no
randomness, no UI build, no migrations.**

CTX2 is a builder, not a runtime. It does not stream, score, or
invoke any agent. It projects already-canonical, deterministic
modules into a uniform twelve-section pack shape the rest of the
platform can converge on.

## What changed

- New module
  [src/lib/architecture/unified-context-builder.ts](../../../src/lib/architecture/unified-context-builder.ts):
  - Public types: `WorkObjectType`, `UnifiedContextBuildRequest`,
    `UnifiedContextQuality`, `UnifiedContextMissingInput`,
    `UnifiedContextGovernanceConstraint`,
    `UnifiedContextSourceBasis`, `UnifiedContextSection`,
    `UnifiedContextSectionKey`, `UnifiedContextPack`,
    `UnifiedContextBuildResult`.
  - `buildUnifiedContextPack(request)` — pure projection that
    returns a result containing the pack, the quality verdict, the
    explicit missing-input list, and an optional refusal block.
  - `summarizeUnifiedContextPack(pack)` — per-pack counters
    (`totalSections`, `sectionsWithContent`, `missingInputCount`,
    `quality`).
  - `computeUnifiedContextQuality(result, request?)` — re-derive
    quality from a result with the optional request for high-stakes
    intent re-evaluation.
  - `UNIFIED_CONTEXT_PACK_SECTIONS` — canonical twelve-key section
    order.
  - Reads only from:
    - `@/lib/programs/programs-canonical-view` (S9 read model)
    - `@/lib/programs/enhancement-seed-planner` (deterministic seed)
    - `@/lib/intelligence/sentinel-pattern-detections` (I1 read model)
    - `@/lib/solutions/solution-archetype-registry` (SOL3 registry)
    - `@/lib/agent/context-bundle` (CTX1 declarative type alignment, read-only)

- New tests
  [src/__tests__/integration/architecture/unified-context-builder.test.ts](../../../src/__tests__/integration/architecture/unified-context-builder.test.ts):
  32 deterministic tests covering byte-equal output, the always-12
  section invariant, work-object resolution per kind, sparse /
  refused verdicts, evidence / conversation / dataset honest
  emptiness, audit basis presence, governance constraint merging,
  and module hygiene.

## How the pack is built

```text
UnifiedContextBuildRequest
        │
        ▼
buildUnifiedContextPack
        │
        ├── resolveWorkObject (program | pattern | archetype)
        │
        ├── 12 section builders (each returns UnifiedContextSection)
        │
        ├── missing-input bookkeeping (always honest)
        │
        ├── quality classifier (refused / weak / partial / usable)
        │
        ▼
UnifiedContextBuildResult { pack, quality, missingInputs, refused? }
```

## Twelve canonical sections

Every pack always contains all twelve in this order. Sections that
do not apply to a given work object remain present with
`hasContent: false` and a `notes` line stating why. This keeps the
shape uniform across surfaces and keeps audit assertions simple.

| Key                       | Source                                                | Always present? | Always populated?                         |
|---------------------------|-------------------------------------------------------|-----------------|-------------------------------------------|
| `identity`                | `request_input + programs_canonical_view`             | yes             | yes when tenantKey is non-empty           |
| `work_object`             | `request_input`                                       | yes             | yes when work-object id is non-empty      |
| `workflow_state`          | `programs_canonical_view (S9)`                        | yes             | program work objects only                 |
| `business_context`        | `programs_canonical_view (S9)`                        | yes             | program work objects only                 |
| `artifacts`               | `programs_canonical_view (S9d readiness)`             | yes             | program work objects only                 |
| `patterns`                | `sentinel_pattern_detections (I1)`                    | yes             | program or pattern work objects           |
| `evidence`                | `evid2_evidence_ledger`                               | yes             | NO — empty body, EVID2 not yet wired      |
| `conversation`            | `conversation_memory`                                 | yes             | NO — empty body, no memory wired          |
| `datasets`                | `adm3_dataset_inventory`                              | yes             | NO — empty body, ADM3 deferred in v1      |
| `solution_archetypes`     | `solution_archetype_registry (SOL3)`                  | yes             | solution_archetype work objects only      |
| `governance_constraints`  | `request_input + ctx2_defaults`                       | yes             | always (CTX2 carries three honest defaults)|
| `audit_basis`             | `ctx2_unified_context_builder`                        | yes             | always                                    |

## Work-object resolution rules

- **`program`**: matched against `programs_canonical_view` for the
  named tenant. The id may be the program slug, the program code,
  or the graph node id. Unknown ids return `resolved: false` with a
  `resolutionNote`.
- **`intelligence_pattern`**: matched against the canonical
  five-key pattern list shipped by I1
  (`value_ledger_incompleteness`, `evidence_chain_gap`,
  `gate_governance_gap`, `program_context_sparsity`,
  `ai_governance_operating_model_gap`). Unknown keys return
  `resolved: false`.
- **`solution_archetype`**: matched against the SOL3 canonical
  archetype registry via `getSolutionArchetype`. Unknown keys
  return `resolved: false`.

When a tenant cannot be located in the canonical seed, no work
object can be resolved against tenant data. The pack still emits all
twelve sections, with workflow / business / artifacts / patterns
honestly empty.

## Quality classifier

Quality is a function of section content count, blocking missing
inputs, and the caller's intent:

- `refused` if the work object is unresolvable AND the intent
  contains a high-stakes verb (`approve`, `execute`, `deliver`).
- `weak` if fewer than 3 sections have content.
- `partial` if 3–5 sections have content OR there is at least one
  blocking missing input.
- `usable` if 6+ sections have content AND there are no blocking
  missing inputs.

When the verdict is `refused`, the result carries a `refused` block
with the reason and the list of missing hard inputs.

## Honest missing-input bookkeeping

Every pack records its own gaps explicitly rather than silently
omitting them:

| Kind                  | Impact                | Reason                                                                |
|-----------------------|-----------------------|-----------------------------------------------------------------------|
| `tenant_key`          | `blocks_response`     | Request did not name a tenant; pack cannot be scoped.                  |
| `tenant_seed`         | `blocks_response`     | Tenant is not in the canonical seed.                                  |
| `work_object`         | `blocks_response`     | Work object id could not be resolved against canonical sources.        |
| `evidence_ledger`     | `downgrades_quality`  | EVID2 ledger is not wired; pack has no per-deliverable citations.      |
| `conversation_history`| `missing_metadata`    | Conversation memory is not yet wired; pack has no prior turns.         |

## Governance constraints

Three CTX2 defaults always merge into the governance section:

1. `no_fabricated_evidence_citations` (hard) — agents must not
   invent E-### citations while EVID2 is unwired.
2. `no_fabricated_dollar_value` (hard) — agents must not invent
   dollar amounts; projected and realized value are not in the
   seed.
3. `honest_missing_input_disclosure` (soft) — missing inputs must
   be surfaced explicitly.

Caller-supplied constraints merge alongside the defaults; duplicate
policies are deduped by policy key. The merged list is sorted
ascending by policy key for byte-equal determinism.

## Audit basis

The audit basis section captures, for every pack:

- `retrievalSources` — sorted, deduplicated list of canonical
  modules consulted during the build (e.g.
  `programs_canonical_view`, `sentinel_pattern_detections`,
  `solution_archetype_registry`).
- `generatedAt` — fixed string `"deterministic_seed"`.
- `contextBuilderVersion` — fixed string `"ctx2.v1"`.

The pack also carries `createdFrom: 'deterministic_seed'` at the top
level so callers can assert the no-live-model invariant directly.

## What is intentionally NOT in CTX2 v1

- **EVID2 evidence ledger ingest.** Evidence section is always
  empty with the honest note "EVID2 ledger not yet wired". A future
  EVID2 slice will populate per-deliverable E-### citations, and
  CTX2 will read from it without changing the pack shape.
- **Conversation memory.** Conversation section is always empty.
  When a memory store lands, CTX2 will populate prior turns without
  changing the pack shape.
- **ADM3 dataset inventory binding.** Datasets section is always
  empty with the honest note "ADM3 dataset inventory not imported
  in CTX2 v1 to keep MVP scoped". A later slice will wire ADM3 and
  surface dataset summaries.
- **Live retrieval.** No network calls, no Supabase reads, no
  vector store queries. CTX2 projects the deterministic seed.
- **UI surface.** No component is rendered. A future slice can
  visualize the pack on a debug surface.
- **Agent runtime invocation.** CTX2 does not call Nexus, Sentinel,
  Atlas, or Steward. It is a pre-runtime projection layer.

## Hygiene invariants

- No `Date.now()`, `Math.random()`, `new Date(` in the module body.
- No `fetch(`, no Anthropic / OpenAI SDK imports.
- No React state / effect hooks.
- No imports from `@/lib/sentinel`, `@/lib/atlas`, `@/lib/nexus`,
  `@/lib/source`, `@/lib/auth`, supabase, or
  `@/lib/programs/mock`.
- Read-only import from `@/lib/agent/context-bundle` is allowed
  (CTX1 type alignment); no agent runtime symbols are referenced.
- All quality / missing-input / refusal logic is pure: same input →
  byte-equal output across calls.

## Validation commands

```bash
npx tsc --noEmit --pretty false
npx jest src/__tests__/integration/architecture/unified-context-builder.test.ts
npm run build
```

All three pass on 2026-04-25.

## Future slices that build on CTX2

- **CTX3 — Live retrieval integration.** Wire EVID2, conversation
  memory, and ADM3 dataset inventory into the same pack shape.
- **CTX4 — Pack diagnostics surface.** A read-only debug surface
  that visualizes a pack for a given tenant + work object.
- **CTX5 — Agent runtime adapter.** A thin adapter from
  `UnifiedContextBuildResult` into the per-agent prompt frame
  consumed by the eventual Nexus / Sentinel / Atlas / Steward
  runtimes (subject to the Model Gateway contract).

## Acceptance criteria mapping

- Defines the canonical twelve-section pack shape with type-safe
  bodies — see public type list above and the
  `UNIFIED_CONTEXT_PACK_SECTIONS` constant.
- Pure projection, no model calls — module hygiene tests assert
  the absence of forbidden tokens and forbidden imports.
- Honest missing-input surfacing — see "Honest missing-input
  bookkeeping" table; tests cover blocking / downgrading /
  metadata-only categories.
- Refusal under high-stakes intent on unresolvable work object —
  covered by the "returns refused with high-stakes intent" test.
- Always-twelve sections invariant — covered by the
  `it.each` parametrized section completeness test across program /
  pattern / archetype / sparse inputs.
- Byte-equal determinism — covered by paired-call equality tests
  on both happy-path and sparse inputs.
- No fabricated evidence citations — covered by the explicit
  no-`E-\d+` assertion plus the always-empty evidence section.

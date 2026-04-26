# SOL12 · Architecture Draft Read Model

Slice ID: SOL12
Slice name: Architecture Draft Read Model
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-26
Author: Code (sole)

Pure deterministic library that names the canonical shape of a
per-tenant architecture draft. Solution Architects, Client Maestros,
and AbarVa Maestros consume the draft to render an architecture canvas
and to drive workshop sequencing without inventing content at runtime.
The draft groups its content into eight canonical sections, each
anchored to explicit assumptions, components, risks, and evidence gaps
so reviewers see the basis without a model run. **Library only — no
model-generated architecture, no fake citations, no live retrieval, no
tenant runtime state, no persistence.**

## What changed

- New module
  [src/lib/solutions/architecture-draft-read-model.ts](../../../src/lib/solutions/architecture-draft-read-model.ts):
  - Public types: `ArchitectureDraft`, `ArchitectureDraftSection`,
    `ArchitectureDraftSectionKey`, `ArchitectureAssumption`,
    `ArchitectureComponent`, `ArchitectureRisk`,
    `ArchitectureEvidenceGap`, `ArchitectureDraftSummary`,
    `ArchitectureDraftStatus`, `ArchitectureDraftInput`.
  - Public helpers:
    - `buildArchitectureDraft(input?)` — deterministic draft builder;
      returns the canonical seed when no input is provided.
    - `summarizeArchitectureDraft(draft)` — at-a-glance readout
      reconciling section / assumption / component / risk /
      evidence-gap totals plus blocker counts.
    - `getArchitectureBlockers(draft)` — explicit list of approval-
      blocking risks and evidence gaps.
  - Public constant: `ARCHITECTURE_DRAFT_SECTION_KEYS` (frozen tuple
    of canonical section keys in canonical order).

- New tests
  [src/__tests__/integration/solutions/architecture-draft-read-model.test.ts](../../../src/__tests__/integration/solutions/architecture-draft-read-model.test.ts):
  56 deterministic checks covering all 8 section types, all 5 status
  values, byte-equal determinism, explicit assumptions / components /
  risks / evidence gaps with section anchors, summary reconciliation,
  blocker derivation, recommended-next-action transitions, no
  fabricated dollars, no fabricated `https://` citations, no banned
  placeholder phrases, and module hygiene (no Sentinel / Atlas /
  Nexus / Agent / Source / auth / supabase imports, no clock reads,
  no random, no fetch, no React hooks, no model providers).

## Public surface

```ts
buildArchitectureDraft(input?: ArchitectureDraftInput): ArchitectureDraft;

summarizeArchitectureDraft(draft: ArchitectureDraft)
  : ArchitectureDraftSummary;

getArchitectureBlockers(draft: ArchitectureDraft)
  : readonly { kind: 'risk' | 'evidence_gap'; id: string;
               sectionKey: ArchitectureDraftSectionKey;
               description: string }[];
```

## Canonical sections

| Section key | Title |
|---|---|
| `context` | Context and intent |
| `capabilities` | Capabilities and components |
| `data_model` | Data model and foundation |
| `integration` | Integration topology |
| `security` | Security and privacy |
| `governance` | Governance and human-in-loop |
| `observability` | Observability and audit |
| `rollout` | Rollout sequence |

## Canonical statuses

`'draft' | 'reviewed' | 'approved' | 'requires_workshop' | 'blocked'`

## Hard rules

- No imports from `src/lib/source/**`, `src/lib/nexus/**`,
  `src/lib/sentinel/**`, `src/lib/atlas/**`, `src/lib/agent/**`,
  `src/components/agent/**`, `src/lib/auth/**`, `supabase/**`.
- No `Math.random`, no clock reads, no live model calls, no
  `fetch`, no React hooks, no banned placeholder copy
  (`Coming soon`, `TBD`, `Lorem ipsum`).
- No model-generated architecture: every section, assumption,
  component, risk, and evidence gap comes from a deterministic seed
  or is supplied verbatim by the caller.
- No fake citations: the serialised draft contains no `https://` and
  no `http://` URLs.
- `createdFrom: 'deterministic_architecture_draft_seed'` on every
  draft.

## Validation

```bash
npx tsc --noEmit --pretty false
npx jest src/__tests__/integration/solutions/architecture-draft-read-model.test.ts
npx eslint --max-warnings=0 \
  src/lib/solutions/architecture-draft-read-model.ts \
  src/__tests__/integration/solutions/architecture-draft-read-model.test.ts
python3 -c "import json; json.load(open('docs/build/build-slices.json')); json.load(open('docs/build/production-readiness.json'))"
```

## Acceptance criteria

- Module exports `ArchitectureDraft`, `ArchitectureDraftSection`,
  `ArchitectureAssumption`, `ArchitectureComponent`,
  `ArchitectureRisk`, `ArchitectureEvidenceGap`,
  `ArchitectureDraftSummary`, and `ArchitectureDraftStatus` as the
  canonical contract.
- `ArchitectureDraftStatus` is a string-literal union of exactly
  `'draft' | 'reviewed' | 'approved' | 'requires_workshop' |
  'blocked'`.
- `ArchitectureDraftSectionKey` is a string-literal union of exactly
  `'context' | 'capabilities' | 'data_model' | 'integration' |
  'security' | 'governance' | 'observability' | 'rollout'`.
- `buildArchitectureDraft` returns a draft whose `sections` contain
  exactly the eight canonical section keys in canonical order.
- `buildArchitectureDraft` is byte-equal across repeated calls for
  the same input (no input and populated input both verified).
- The default seed surfaces at least one assumption, one component,
  one risk, and one evidence gap per canonical section, each with a
  unique id.
- `summarizeArchitectureDraft` reconciles totals against the draft
  (sections, assumptions, components, risks, evidence gaps, blocker
  counts, workshop-gated assumption count).
- `getArchitectureBlockers` returns approval-blocking risks and
  approval-blocking evidence gaps; returns an empty list when the
  caller supplies no blocking content.
- Serialised draft contains no fabricated dollar amounts, no
  `https://` / `http://` URLs (no fake citations), and no banned
  placeholder phrases (`Coming soon`, `TBD`, `Lorem ipsum`).
- Module imports nothing from Sentinel / Atlas / Nexus / Agent
  runtime, Source UI, legacy `/programs`, `mock.ts`, auth, or
  supabase; contains no `Math.random`, clock reads, `fetch`,
  `anthropic`, `openai`, `useState`, `useEffect`.

## Notes

- SOL12 is a *library*, not a UI. The architecture draft read model
  is consumed by the future Solution Intelligence Canvas (SOL10+)
  and by Nexus when composing per-tenant architecture drafts. SOL12
  itself does not render or persist anything.
- The deterministic seed names a generic cross-sector architecture
  draft so the contract stands alone. Per-archetype seed packs
  (per SOL3 archetype key) are deferred — callers can already pass
  a populated `ArchitectureDraftInput` to override the seed verbatim.
- `recommendedNextAction` is derived deterministically from status,
  approval-blocking risks, and approval-blocking evidence gaps so
  the field is reviewable without a model run.
- Live runtime, model gateway routing, and audit ledger persistence
  remain deferred behind the Model Gateway / audit ledger contract;
  `agent_runtime` status is not promoted by this slice.

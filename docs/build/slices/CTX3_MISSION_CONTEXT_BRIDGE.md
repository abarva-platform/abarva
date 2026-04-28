# CTX3 · Mission Context Bridge

Slice ID: CTX3
Slice name: Mission Context Bridge
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-25
Author: Code (sole)

Adds a deterministic projection that joins the **AG10 agent mission
queue** to the **CTX2 unified context builder**. Given a single
`AgentMission` and a `tenantKey`, the bridge maps the mission's
work-object kind to a CTX2 `WorkObjectType`, calls
`buildUnifiedContextPack`, and returns a `MissionContextBridgeResult`
that names the resolved context pack, a readiness verdict, and an
honest list of `MissionContextGap` entries explaining what was
missing or unsupported. **No model call, no live retrieval, no
Date.now reads, no randomness, no UI build, no migrations.**

CTX3 is a bridge, not a runtime. It does not stream, score, or
invoke any agent. It does not call any model, perform live
retrieval, or write to any persistent store. It reads only from
CTX2 (deterministic seed) and AG10 (deterministic seed); the
result inherits the determinism of both.

## What changed

- New module
  [src/lib/architecture/mission-context-bridge.ts](../../../src/lib/architecture/mission-context-bridge.ts):
  - Public types: `MissionContextReadiness`, `MissionContextGap`,
    `MissionContextBuildRequest`, `MissionContextBridgeResult`,
    `MissionContextReadinessSummary`.
  - `buildContextForAgentMission(request)` — pure projection that
    returns a single bridge result.
  - `buildMissionContextBatch(requests)` — batch convenience that
    preserves caller order verbatim.
  - `buildMissionContextBatchForAllSeededMissions(tenantKey)` —
    convenience that loops every AG10 seed mission against a single
    tenant.
  - `summarizeMissionContextReadiness(results)` — per-batch counters
    keyed by readiness, plus the sorted unique list of unsupported
    work-object kinds.
  - `getMissionContextReadinessOrder()` — canonical readiness order
    constant for stable rendering.
  - Reads only from:
    - `@/lib/architecture/unified-context-builder` (CTX2)
    - `@/lib/agents/agent-mission-queue` (AG10)

- New tests
  [src/__tests__/integration/architecture/mission-context-bridge.test.ts](../../../src/__tests__/integration/architecture/mission-context-bridge.test.ts):
  36 deterministic tests covering byte-equal output, supported and
  unsupported work-object handling, gap promotion, summary
  reconciliation, fake-citation hygiene, basis invariants, and
  module hygiene.

## How the bridge is built

```text
AgentMission (AG10) + tenantKey
        │
        ▼
buildContextForAgentMission
        │
        ├── kind unsupported by CTX2 v1?
        │     └─ yes → contextResult: null
        │              readiness: 'work_object_unsupported'
        │              gaps: [explanatory gap]
        │
        ├── kind supported → map to CTX2 WorkObjectType
        │
        ├── buildUnifiedContextPack(...) (CTX2)
        │
        ├── promote CTX2 missingInputs to MissionContextGap (1:1)
        │
        ├── map UnifiedContextQuality to MissionContextReadiness
        │
        ▼
MissionContextBridgeResult { missionId, agent, workObject,
                             contextResult, readiness, gaps, basis,
                             createdFrom }
```

## Work-object kind mapping

AG10 exposes nine `AgentMissionWorkObjectKind` values. CTX2 v1
exposes three `WorkObjectType` values. The bridge encodes the
canonical projection:

| AG10 kind          | CTX2 WorkObjectType     | Notes                                                                                  |
|--------------------|-------------------------|----------------------------------------------------------------------------------------|
| `program`          | `program`               | Direct match — natural CTX2 program scope.                                             |
| `phase`            | `program`               | Phase ordinal hint dropped; CTX2 program scope already covers the phase timeline.       |
| `workshop`         | `program`               | Workshop ties to its parent program; CTX2 program scope is sufficient.                  |
| `artifact`         | `program`               | Artifact lives under a program; CTX2 program scope covers artifact inventory.           |
| `pattern`          | `intelligence_pattern`  | Direct match — CTX2 pattern scope.                                                     |
| `tower_dimension`  | (none)                  | **Unsupported in v1** — surfaced as `work_object_unsupported` with explanatory gap.    |
| `dataset_domain`   | (none)                  | **Unsupported in v1** — surfaced as `work_object_unsupported` with explanatory gap.    |
| `sourcing_event`   | (none)                  | **Unsupported in v1** — surfaced as `work_object_unsupported` with explanatory gap.    |
| `vendor_response`  | (none)                  | **Unsupported in v1** — surfaced as `work_object_unsupported` with explanatory gap.    |

### Unsupported-kind handling

When the bridge encounters a mission with an unsupported kind, it
does **not** silently drop the mission, throw, or invent a
synthetic context pack. It returns a fully formed bridge result
with:

- `contextResult: null` — explicitly signals no CTX2 pack was built.
- `readiness: 'work_object_unsupported'` — distinct from CTX2's own
  quality verdicts so callers can branch on the unsupported case.
- `gaps: [{ kind: 'work_object_kind_unsupported', impact: 'blocks_response', reason: '<kind explained>' }]`
  — the reason names the unsupported kind explicitly.

This makes the bridge honest: a downstream consumer that wires the
bridge into an agent runtime will know exactly which missions
cannot yet receive a context pack and can either suppress them,
escalate them, or wait for a future CTX slice.

## Readiness mapping

`UnifiedContextQuality` (CTX2) projects 1:1 onto
`MissionContextReadiness` (CTX3) for the four CTX2 quality states,
plus one CTX3-only state for the unsupported-kind branch:

| CTX2 `UnifiedContextQuality` | CTX3 `MissionContextReadiness` |
|------------------------------|--------------------------------|
| `usable`                     | `usable`                       |
| `partial`                    | `partial`                      |
| `weak`                       | `weak`                         |
| `refused`                    | `refused`                      |
| (n/a — bridge-only)          | `work_object_unsupported`      |

The canonical order of readiness states (used by the summary type
and `getMissionContextReadinessOrder`) is:

```
usable → partial → weak → refused → work_object_unsupported
```

## Gap promotion

CTX2 emits `UnifiedContextMissingInput` entries with `kind`,
`impact`, and `reason`. The bridge promotes every CTX2 missing
input into a `MissionContextGap` with the same field shape, in the
same order. Mapping is 1:1 — no synthesis, no merging, no
filtering. The bridge layer's only additional gap is the
`work_object_kind_unsupported` gap on the unsupported-kind branch.

## Audit basis

Every bridge result carries:

- `basis.source` — fixed string `'mission_context_bridge'`.
- `basis.bridgeVersion` — fixed string `'ctx3.v1'`.
- `createdFrom` — fixed string `'deterministic_seed'`.

When `contextResult` is non-null, the inner CTX2 pack additionally
carries its own `audit_basis` section
(`contextBuilderVersion: 'ctx2.v1'`, deterministic-seed flag, sorted
retrieval source list). The two basis layers compose: CTX2 documents
which canonical sources were consulted, CTX3 documents which bridge
version produced the projection.

## Determinism

- Same input → byte-equal output across calls.
- `buildMissionContextBatch` preserves caller mission order
  verbatim.
- `summarizeMissionContextReadiness` returns
  `unsupportedWorkObjectKinds` ascending-sorted and deduplicated.

## What is intentionally NOT in CTX3 v1

- **Live retrieval.** No network calls, no Supabase reads, no
  vector store queries. CTX3 inherits CTX2's deterministic seed
  exactly.
- **Mission scheduling.** CTX3 reads from AG10 but does not schedule
  missions, mutate AG10 seed state, or emit triggers. AG10 (Lane A)
  + AG11 (Lane B) own the queue and UI; CTX3 only projects.
- **Wider work-object scope.** Tower, dataset domain, sourcing
  event, and vendor response work objects are honestly surfaced as
  unsupported. A future CTX slice will widen `WorkObjectType` and
  the `SUPPORTED_KIND_MAP`.
- **Agent runtime invocation.** CTX3 does not call Nexus, Sentinel,
  Atlas, or Steward. It is a pre-runtime projection layer.
- **Persistence.** No bridge result is persisted. Callers are
  expected to project on demand from the deterministic seed.

## Hygiene invariants

- No `Date.now()`, `Math.random()`, `new Date(` in the module body.
- No `fetch(`, no Anthropic / OpenAI SDK imports.
- No React state / effect hooks.
- No imports from `@/lib/sentinel`, `@/lib/atlas`, `@/lib/nexus`,
  `@/lib/source`, `@/lib/auth`, or supabase.
- Only allowed cross-imports: `@/lib/architecture/unified-context-builder`
  and `@/lib/agents/agent-mission-queue`.
- All bridging logic is pure: same input → byte-equal output across
  calls.

## Validation commands

```bash
npx tsc --noEmit --pretty false
npx jest src/__tests__/integration/architecture/mission-context-bridge.test.ts
npx jest src/__tests__/integration/architecture/unified-context-builder.test.ts
npx jest src/__tests__/integration/agents/agent-mission-queue.test.ts
npm run build
python3 -c "import json; json.load(open('docs/build/build-slices.json')); json.load(open('docs/build/production-readiness.json'))"
```

All commands pass on 2026-04-25.

## Future slices that build on CTX3

- **CTX4 — Pack diagnostics surface.** A read-only debug surface
  that visualizes the bridge result for a tenant + mission pair.
- **CTX5 — Wider work-object scope.** Add CTX2 `WorkObjectType`
  values for tower dimension, dataset domain, sourcing event, and
  vendor response so the bridge no longer needs the unsupported
  branch for those AG10 kinds.
- **CTX6 — Agent runtime adapter.** A thin adapter from
  `MissionContextBridgeResult` into the per-agent prompt frame
  consumed by the eventual Nexus / Sentinel / Atlas / Steward
  runtimes (subject to the Model Gateway contract and audit
  ledger).

## Acceptance criteria mapping

- New module exposes `MissionContextReadiness`, `MissionContextGap`,
  `MissionContextBuildRequest`, `MissionContextBridgeResult`, and
  `MissionContextReadinessSummary` types plus the three required
  helpers — see public type list above.
- `buildContextForAgentMission` is pure and deterministic — covered
  by paired-call equality tests.
- `buildMissionContextBatch` preserves canonical mission order —
  covered by the order-equality test.
- Supported AG10 kinds (`program`, `phase`, `workshop`, `artifact`,
  `pattern`) produce non-null `contextResult` — covered by the
  parametrized `it.each(SUPPORTED_KINDS)` test (the workshop case
  uses a synthetic mission because AG10's deterministic seed does
  not currently include a workshop mission; the bridge mapping is
  the unit under test, not the seed coverage).
- Unsupported kinds (`tower_dimension`, `dataset_domain`,
  `sourcing_event`, `vendor_response`) produce `contextResult: null`
  AND `readiness: 'work_object_unsupported'` AND ≥1 explanatory
  gap — covered by the parametrized unsupported-kinds test.
- CTX2 missing inputs are preserved as gaps — covered by the 1:1
  promotion test.
- Summary reconciles correctly — covered by total / by-readiness /
  total-gaps / sorted-unsupported tests.
- No fabricated `E-\d+` evidence citations — covered by the
  serialized-batch hygiene test.
- `basis.source === 'mission_context_bridge'` and
  `createdFrom === 'deterministic_seed'` on every result — covered
  by the basis invariant test.
- Module hygiene — covered by the `fs.readFileSync` static-source
  hygiene tests.

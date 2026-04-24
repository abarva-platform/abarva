# 04 SOURCE CONTEXT BUILDER REVIEW

## 1. Inventory

### Created

| File | Purpose | Key Exports | Deterministic? | UI/API/Model/Upload? | Forbidden Imports? |
|---|---|---|---|---|---|
| `src/lib/source/context-builder.ts` | Seed-based deterministic builder for `SourceAgentContextBundle`. This is the first engineering proof that Nexus can be grounded in Source context before chat/model work. | `buildSourceAgentContextBundle`, `buildSourceContextFromSeed`, `buildSourceContextAssemblyResultFromSeed`, `createEmptySourceContextBundle`, `assessSourceContextQuality`, `getSourceContextUsed`, `getAllowedSourceActions`, `getMissingContextReasons`, `createSourceContextAssemblyFailure`, `SourceContextBuilderInput` | Yes. Uses only Source seed data and pure deterministic mapping/scoring. | No UI, no API route, no model call, no upload/parsing. | No. Imports only Source-local files: constants, lifecycle, mock seed, Source context/chat/quality/types. |

### Updated

| File | Purpose | Key Exports/Changes | Deterministic? | UI/API/Model/Upload? | Forbidden Imports? |
|---|---|---|---|---|---|
| `src/lib/source/index.ts` | Barrel export for Source library. | Adds `export * from './context-builder';` | Yes. Export-only. | No. | No. |
| `CYCLE_STATE.md` | Operating state note. | Adds Source sidecar state: current item, completed builder stub, supported contexts, blockers, next recommended review packet. | Documentation only. | No. | No. |

## 2. Function Review

| Function | Purpose | Input | Output | Deterministic Behavior | Failure Behavior | Future Production Replacement Path |
|---|---|---|---|---|---|---|
| `buildSourceAgentContextBundle` | Public alias for building a Source context bundle. | `SourceContextBuilderInput` | `SourceAgentContextBundle` | Delegates to seed builder. | Missing event returns empty/low-context bundle through `buildSourceContextFromSeed`. | Keep as stable public entry point; later delegate to Supabase-backed builder. |
| `buildSourceContextFromSeed` | Main seed-based bundle assembler. | `SourceContextBuilderInput` | `SourceAgentContextBundle` | Reads `getSourceDashboardSeed` or `getSourceEventSeed`; maps event/stage/gates/artifacts/scorecard/value/pattern identity. | If event id is absent, builds portfolio context. If event id is missing, returns an empty low-context bundle. | Replace seed reads with Source persistence/query layer while keeping deterministic mapping rules. |
| `buildSourceContextAssemblyResultFromSeed` | Formal result wrapper with failure semantics. | `SourceContextBuilderInput` | `SourceContextAssemblyResult` | Checks event existence deterministically before bundle creation. | Returns `{ ok: false, failure }` for missing event id matches. Does not throw. | Keep shape; later use in API route/context service boundary. |
| `createEmptySourceContextBundle` | Creates minimal bundle preserving tenant/user/route/prompt and empty arrays. | `SourceContextBuilderInput` | `SourceAgentContextBundle` | No external reads. Defaults role/persona to `unknown`; sets low context quality. | No throw; represents low-context fallback. | Keep for missing-context responses, tests, and safe fallback paths. |
| `assessSourceContextQuality` | Computes simple deterministic context-quality assessment. | `SourceAgentContextBundle` | `SourceContextQualityAssessment` | Scores event/stage/pattern/evidence/actionability/vanilla risk from bundle fields. | No throw; returns failed dimensions and notes. | Later enrich with validation harness and route-specific thresholds. |
| `getSourceContextUsed` | Builds "what Nexus used" summary. | `SourceAgentContextBundle` | `SourceContextUsed[]` | Lists deterministic, model-assisted, evidence-gated fields used from current bundle. | No throw; missing context is included in summary. | Later power UI context chips and audit logs. |
| `getAllowedSourceActions` | Derives simple allowed action set from deterministic state. | `SourceAgentContextBundle` | `SourceAllowedAction[]` | Uses context scope, missing inputs, Scope stage, wait state, scorecard lock, value ledger, artifacts. | No throw; returns empty array if no actions apply. | Later replace/enrich with authorization and gate engine. |
| `getMissingContextReasons` | Explains low/missing context. | `SourceAgentContextBundle` | `string[]` | Checks missing event/stage/pattern/citations/inputs/attachment summaries. | No throw. | Later use for Nexus limitation copy and validation harness. |
| `createSourceContextAssemblyFailure` | Creates deterministic failure object. | `SourceContextBuilderInput`, reason | `SourceContextAssemblyFailure` | Normalizes reason, computes missing fields, message, recoverability. | No throw; unknown reason maps to `unknown`. | Keep for service/API boundary and tests. |

## 3. Context Coverage Review

### Portfolio / Dashboard Context

Built when no `eventId` is supplied.

Populated:

- tenant, user, role/persona, route, surface
- `contextScope: 'portfolio'`
- portfolio next action
- blockers from waiting/blocked events
- risks from dashboard attention items
- decisions from dashboard attention items
- allowed actions: review portfolio, view Source value ledger
- source-of-truth timestamp for seed dashboard
- context quality and missing context reasons

Empty/null by design:

- event, stage, lifecycle, event owner, stage owner, decision owner
- event-level artifacts, scorecard, selected pattern pack
- uploaded files, parsed summaries, evidence citations
- projected/realized ledger lines

Why:

- Dashboard context is portfolio-level. It should not pretend a single event/stage is selected.

Future source:

- Source portfolio persistence or API query should populate events, attention items, portfolio value rollup, portfolio alerts, and cross-event decisions.

### Event-Level Context

Built when `eventId` matches seeded Source data.

Populated:

- event snapshot: id, code, name, account, archetype, rigor, lifecycle, owner, current stage, value fields
- lifecycle status
- active stage if no stage is requested
- next action and next-action owner
- event owner, stage owner, decision owner
- aging and wait state
- blockers
- required/missing inputs from gate artifacts and scorecard criteria
- stage gates
- artifacts
- scorecard snapshot
- projected and realized value ledger lines
- risks from alerts
- next decision
- selected pattern pack identity
- citation coverage placeholder showing missing citations
- allowed actions and suggested actions
- context quality

Empty/null by design:

- uploaded files and parsed summaries
- evidence citations
- pattern sections
- scorecard default weights and overrides
- attachment-selected context
- generated artifact sections

Why:

- Current seed data does not contain uploads, citations, pattern-pack sections, or scorecard default weight records.

Future source:

- Supabase Source event tables, pattern-pack tables, artifact tables, evidence registry, scorecard governance records, and attachment summaries.

### Stage-Level Context: Data & AI Modernization SI Selection / Scope

Built with the Data & AI event id and `stageKey: 'scope'`.

Populated:

- `contextScope: 'stage'`
- event snapshot
- Scope stage snapshot
- blocked gate state
- stage readiness score
- missing application/workload inventory baseline blockers
- required artifacts: Minimum Data Request, Scope Document, Projected Value Ledger
- scorecard criteria that are blocked/draft
- waiting state based on `waiting_on_client`
- allowed actions: show missing inputs, generate minimum data request, explain scope readiness, send client reminder, update owner, upload supporting data, review scorecard, view value context, review artifacts

Empty/null by design:

- actual uploaded application inventory
- parsed file summaries
- formal citations
- pattern sections
- generated minimum data request content

Why:

- The seed intentionally says the Scope stage is blocked by missing client inputs. The builder should surface missing context rather than invent it.

Future source:

- Required-input records, attachment metadata, parsed inventory/workload summaries, pattern section retrieval, and evidence citations.

### Failure Context

For missing event ids:

- `buildSourceContextAssemblyResultFromSeed` returns `ok: false` with `SourceContextAssemblyFailure`.
- `buildSourceContextFromSeed` returns an empty low-context bundle instead of throwing.

Populated in failure:

- deterministic failure code, message, recoverability, missing fields
- or empty bundle with tenant/user/route/prompt preserved

Empty/null by design:

- event/stage/pattern/artifact/value/evidence fields

Future source:

- API/service layer should prefer `buildSourceContextAssemblyResultFromSeed` or a production equivalent when the caller needs explicit failure semantics.

## 4. Anti-Vanilla Readiness Check

| Anti-Vanilla Input | Provided? | Notes |
|---|---|---|
| current event | Yes | Event snapshot populated for seeded events. |
| current stage | Yes | Active stage or requested stage snapshot. |
| lifecycle status | Yes | `SourceLifecycleStatus` from seed. |
| missing inputs | Yes | Derived from gate blockers, event blocker, required scorecard criteria. |
| blockers | Yes | Event and stage gate blockers. |
| owner | Yes | Event, stage, decision, next-action owners. |
| aging | Yes | Event aging days and wait state. |
| next action | Yes | Seeded event/dashboard next action. |
| value context | Yes | Projected/realized value ledger line snapshots. |
| pattern/archetype context | Yes | Pattern identity from event/archetype and golden ids. |
| allowed actions | Yes | Deterministically derived. |
| context-used summary | Yes | `getSourceContextUsed`. |
| context quality assessment | Yes | `assessSourceContextQuality`. |
| failure semantics | Yes | Explicit assembly-result failure helper; empty bundle fallback for direct builder. |

Gaps:

- Pattern sections are empty because no pattern-pack data source is wired.
- Evidence citations are empty because seed data does not include citations.
- Required/missing inputs are strings, not structured input records.
- Suggested actions are derived from allowed actions but not yet forced into an exact "3 choices + custom" action set.

Verdict: ready as the deterministic grounding layer for anti-vanilla behavior. Not ready for model calls until validation fixtures and citation/pattern retrieval are added.

## 5. Deterministic vs Model-Assisted Boundary

Confirmed:

- no model calls
- no generated RFP content
- no vendor recommendation
- no invented citations
- no fake file summaries
- no hallucinated value claims
- no UI behavior
- no API route
- no upload/parsing implementation

The builder produces deterministic context only. It does not generate advisory narrative. Evidence gaps remain explicit through missing context reasons and citation coverage.

## 6. Type and Naming Review

| Topic | Assessment | Recommendation |
|---|---|---|
| string arrays for required/missing inputs | Acceptable for seed stage. Existing seed data only exposes gate artifact names, blockers, and scorecard criteria text. | Add structured `SourceRequiredInputSnapshot` later before upload/gate implementation. |
| `SourceValueLedgerSnapshot` vs `SourceValueLedgerLineSnapshot` | Clear. Canonical snapshot remains in `types.ts`; context-specific line extends ledger entry with assumptions/citation ids. | Keep. |
| `buildSourceContextAssemblyResultFromSeed` naming | Verbose but clear. It distinguishes formal failure semantics from direct bundle construction. | Accept for now. Could later become `buildSourceContextAssemblyResult` when seed is replaced. |
| duplicate/confusing types | No serious duplication. `SourceContextQualityAssessment` and `SourceAgentValidationResult` are separate context-vs-response layers. | Keep separation. |
| `index.ts` barrel exports | Safe. New builder is exported; selected context types remain explicit. | Keep. |

Potential refinements before or soon after commit:

- Add `SourceRequiredInputSnapshot` and use it for `requiredInputs`/`missingInputs`.
- Consider returning `SourceContextAssemblyResult` from the main public builder in production.
- Add exact suggested-action set type if UI requires "3 choices + custom" enforcement.

## 7. Future Production Path

| Phase | Description | Status |
|---|---|---|
| Phase 1 | Seed-based deterministic context builder | Current. |
| Phase 2 | Supabase-backed Source event context builder | Future. |
| Phase 3 | Attachment-aware context builder | Future; requires upload metadata and parsed summaries. |
| Phase 4 | Pattern/evidence retrieval integration | Future; requires pattern pack and citation sources. |
| Phase 5 | Source-specific Nexus API route | Future; should consume context bundle, not Program APIs. |
| Phase 6 | Chat UI consuming `SourceAgentContextBundle` | Future; no UI yet. |
| Phase 7 | Model-assisted Nexus responses | Future; only after context validation. |
| Phase 8 | Context validation harness fixtures | Recommended before any model route. |

## 8. Validation

Focused eslint:

```bash
npx eslint src/lib/source/context-builder.ts src/lib/source/index.ts src/lib/source/agent-context.ts src/lib/source/chat-types.ts src/lib/source/context-quality.ts src/lib/source/attachments.ts src/lib/source/agent-validation.ts
```

Result: passed.

TypeScript:

```bash
npx tsc --noEmit --pretty false
```

Result: passed.

## 9. Worktree Risk

Unrelated dirty files are present:

- `src/components/deliverables/SeedRouteShell.tsx`
- `src/components/intelligence/SentinelPatternRail.tsx`

They were not touched by the Source context builder slice and should not be included in Source commits.

## 10. Recommended Next Step

Recommended next step: commit the Source type/context builder layer after review.

If review wants one more non-UI step first, the safest follow-up is context validation fixture data. Do not proceed to UI/API/model work yet.

## 11. Commit Recommendation

Recommendation: commit context builder as-is after review.

Rationale:

- It is deterministic and Source-scoped.
- It proves portfolio, event, stage, quality, allowed-action, context-used, and failure semantics.
- It does not introduce UI, API routes, uploads, parsing, model calls, or Program coupling.
- Known gaps are appropriate next-slice work and are honestly represented as missing context rather than invented facts.

Do not commit until explicitly asked.

# ARCH2 · Nexus End-to-End Execution Flow

Slice ID: ARCH2
Slice name: Nexus End-to-End Execution Flow
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-25
Author: Code (sole)
Type: Specification / contract document only — no application code,
no runtime modification, no migrations, no model calls.

This contract describes how a single user interaction composes
through every layer of the AbarVa agentic platform — from the user's
input on Client Maestro to the audit row that closes the loop.

ARCH1 governed **architecture**. ARCH2 governs **flow**. Both
contracts inherit from the same non-negotiable principles. ARCH2 is
the canonical reference for any later slice that wires a new
surface.

The flow has **sixteen** ordered steps. Each step names:

- **What it does.**
- **Inputs / outputs.**
- **The canonical source-of-truth contract or read model that owns
  it.**
- **Refusal conditions** — when the step refuses to advance and
  what fallback the surface renders.

A reader can read these sixteen steps as a runbook for any one
turn — a Nexus recommendation, a Sentinel detection surfacing, an
Atlas Tower brief, a Steward gate review, a Maestro workshop
agenda — because every turn passes through the same spine.

---

## Step 1 — User / Client Maestro input

### 1.1 What it does

A user lands on a surface — `/tenant/<slug>/programs/<programSlug>`
(programs detail), `/tenant/<slug>/intelligence` (Sentinel),
`/tenant/<slug>/tower` (Atlas), `/tenant/<slug>/maestro` (Maestro),
`/tenant/<slug>/admin` (Steward / Admin), `/source/...` (Source) —
and the surface accepts a user input.

A typed `UserInput` carrying `tenantKey`, `routeSlug`, `surface`
(one of: `programs_index` | `programs_detail` | `programs_phase` |
`tower` | `tower_pressure` | `tower_lens` | `intelligence_brief` |
`intelligence_pattern_detail` | `maestro_workshop` |
`maestro_deliverable` | `admin_dataset` | `admin_steward` |
`source_event` | `source_artifact`), `workObjectHint` (a
discriminated union by `kind`: `program` / `phase` / `workshop` /
`pattern` / `failure_mode` / `solution` / `deliverable` /
`artifact` / `portfolio` / `operating_model`), an optional `intent`
(`view` | `narrate` | `recommend` | `critique` | `export` |
`mutate` | `gate_review`), an optional `userQuery` (only on
free-input surfaces), `userId`, and `userRole` (`cio` | `cfo` |
`caio` | `cto` | `value` | `risk` | `transformation` |
`tenant_admin` | `platform_admin`).

### 1.2 Inputs

The surface receives the user's click, route segment, query
parameters, optional free-text input, and the authenticated user
session.

### 1.3 Outputs

A typed `UserInput` object that flows into Step 2.

### 1.4 Owner

**Source-of-truth contract.** Each surface contract owns its
input shape:
- Programs: S9 / S9b–g
- Tower: ACT1
- Intelligence: I1 / I2 / I3 / I4
- Maestro workshops: MW1 / MW2
- Admin / Dataset: ADM1 / ADM3 / ADM4
- Source: Source contract pack
- Solutions: SOL1 / SOL2 / SOL3 (deferred)

### 1.5 Refusal conditions

- Unauthenticated user → redirect to sign-in.
- Authenticated user without route access (S7) → render `403`
  surface, do not flow downstream.
- Tenant key / route slug cannot be resolved → render `not found`
  surface, log a structured warning.

---

## Step 2 — Identify work object

### 2.1 What it does

Resolve the typed work object the user input points to. The work
object is one of: program, phase, workshop, pattern, failure-mode,
solution-component, deliverable, artifact, portfolio, operating-
model gap.

This is a deterministic resolution, not a model call. The
resolver reads the programs read model, the pattern pack, the
failure-mode pack, the solution pack, the deliverable inventory,
or the portfolio composition, depending on the hint kind.

### 2.2 Inputs

`UserInput.workObjectHint` plus the tenant key.

### 2.3 Outputs

A typed `WorkObject` discriminated by `kind` (`program` | `phase`
| `workshop` | `pattern` | `failure_mode` | `solution` |
`deliverable` | `artifact` | `portfolio` | `operating_model`),
with kind-appropriate fields (e.g., `program` carries `programCode`,
`programSlug`, `phase`, `gateState`; `pattern` carries `patternKey`,
`affectedPrograms`; `deliverable` carries `deliverableId`, `tier`,
`renderMode`; etc.). Every variant carries `tenantKey` and
`createdFrom: 'deterministic_read_model'`.

### 2.4 Owner

**Source-of-truth contract.** The work-object resolver lives in
`src/lib/agent/work-object-resolver.ts` (canonical path). It reads
from:

- Programs: S9 / S9b / S9c / S9d / S9e / S9f / S9g
- Patterns: I1
- Failure modes: PF1
- Solution components: SOL2
- Deliverables / artifacts: PDEL
- Workshops: MW1 / MW2
- Portfolio: ACT1 (composed)

### 2.5 Refusal conditions

- Hint resolves to no row in the canonical read model → typed
  `WorkObjectNotFound`, surface renders missing-input chip.
- Hint references a tenant other than the user's tenant → S7
  isolation refusal, audit ledger logs the attempt.
- Hint kind is `pattern` / `failure_mode` / `solution` referencing
  a key not in the canonical pack → typed `UnknownKey` refusal.

---

## Step 3 — Assemble context bundle

### 3.1 What it does

Call the **Context Builder** (ARCH1 §5, S1) to assemble the typed
context bundle for the work object.

### 3.2 Inputs

`UserInput` + `WorkObject` + tenant context + program state +
governance constraints.

### 3.3 Outputs

A typed `ContextBundle` (S1) with:

- State classifier (S2): `low_context` | `partial_context` |
  `usable_with_gaps` | `usable` | `rich`.
- Six-dimension quality scorecard (S2).
- Vanilla-response risk flag (S2).
- Resolved evidence (Step 4 result).
- Resolved patterns (Step 5 result).
- Resolved failure modes (Step 6 result).
- Resolved solution archetypes (Step 7 result).
- Governance verdicts (Step 8 result).
- Conversation history bound to the work object.
- Graph relationships (PDEL artifacts, program ↔ workshops, etc.).

Steps 4–8 below are **inputs** to the bundle; the context builder
orchestrates them. They are listed as separate steps so the
refusal contract per layer is explicit.

### 3.4 Owner

**Source-of-truth contract.** S1 (Context Bundle Contracts) +
S2 (Context Scoring / Classifier).

### 3.5 Refusal conditions

- Tenant key unresolved → `ContextRefusal { reason: 'tenant_unresolved' }`.
- Work object cannot be identified → `ContextRefusal { reason: 'work_object_unresolved' }`.
- Bundle classifies as `low_context` and the surface requires
  `usable_with_gaps` minimum → typed refusal; surface renders
  missing-input chip.

---

## Step 4 — Retrieve evidence

### 4.1 What it does

Call the **evidence ledger** tool (ARCH1 §4.5, §8) to resolve E-###
citations bound to the work object.

### 4.2 Inputs

`WorkObject` + retrieval scope (program, phase, workshop, pattern,
deliverable). The evidence ledger composes vector search + chunk
projection internally; the caller never reads vector hits directly.

### 4.3 Outputs

A typed `EvidenceCitationSet` — a readonly array of citations,
each carrying `citationId` (`E-001`, `E-002`, …), `chunkId`,
`tenantKey`, `sourceObjectId`, `sourceLocator`
(page / row / paragraph / slide), `extractedFields`,
`citationTier` (`primary` | `corroborating` | `unverified`),
`confidenceCap`, `evidenceUsability` (`usable` | `partial` |
`unusable`), and `createdFrom`.

### 4.4 Owner

**Source-of-truth contract.** Evidence Ledger tool (canonical
location: `src/lib/tools/evidence-ledger.ts`). Reads through the
relational store + vector memory + graph (ARCH1 §4) and projects
citations.

### 4.5 Refusal conditions

- No evidence bound to work object → empty citation set; bundle
  state classifier reports `partial_context` or `low_context`
  accordingly.
- Citation tier `unverified` on a steering-deliverable surface →
  bundle attaches `evidenceUsability: 'partial'` chip; gateway
  may still compose narrative but flags the gap.

### 4.6 Anti-pattern

Reading raw vector hits and surfacing them as "evidence" without
ledger resolution. **Forbidden** (ARCH1 §12.1).

---

## Step 5 — Retrieve patterns

### 5.1 What it does

Call the **Sentinel pattern detection read model** (I1) to resolve
active pattern detections bound to the work object's tenant or
program.

Patterns name **what is happening** (e.g.,
`value_ledger_incompleteness`, `evidence_chain_gap`,
`gate_governance_gap`, `program_context_sparsity`,
`ai_governance_operating_model_gap`).

### 5.2 Inputs

`WorkObject.tenantKey`, `WorkObject.programCode` (when applicable),
plus the S9e signal list for the tenant.

### 5.3 Outputs

`ReadonlyArray<SentinelPatternDetection>` (I1 typed shape) — each
detection carries `patternKey`, `confidence`, `severity`,
`affectedPrograms`, `evidenceSignals`, `sourceSignalIds`,
`missingInputs`, `recommendedAction`, `handoffTargets`,
`createdFrom: 'deterministic_seed'`.

### 5.4 Owner

**Source-of-truth contract.** I1 — Sentinel Pattern Detection
Read Model.

### 5.5 Refusal conditions

- No pattern detections (empty tenant) → empty array, bundle still
  composes.
- Confidence calibration would exceed I1 caps → calibration
  enforces; never auto-promotes (ARCH1 §12.9).

---

## Step 6 — Evaluate failure modes

### 6.1 What it does

Map the active patterns + S9e signals to the **PF1 12-failure
catalog**.

Failure modes name **what could go wrong if unaddressed** (e.g.,
`weak_data_foundation`, `poor_use_case_framing`,
`no_business_owner`, `no_measurable_baseline`, `no_value_ledger`,
`weak_workflow_integration`, `tool_first_thinking`,
`missing_governance_risk`, `no_adoption_change_plan`,
`no_operating_model_for_scale`, `pilot_purgatory`,
`ai_tool_sprawl_without_value`).

### 6.2 Inputs

The active S9e signal list and the I1 pattern detections.

### 6.3 Outputs

`ReadonlyArray<AiProgramFailureMode>` (PF1 typed shape) — each
mode carries `key`, `name`, `definition`, `whyItMatters`,
`commonSignals`, `requiredEvidence`, `phaseWhereDetected`,
`recommendedIntervention`, `gateImplication`,
`deliverableImplication`, `primaryAgent`, `handoffAgents`,
`createdFrom: 'deterministic_pattern_pack'`.

### 6.4 Owner

**Source-of-truth contract.** PF1 — AI Program Failure Modes
Pattern Pack. Helper: `mapSignalsToFailureModes(signalTypes)`.

### 6.5 Refusal conditions

- Unknown signal type in the input → ignored without throwing
  (PF1 invariant).
- No matching failure modes → empty array, bundle still composes.

---

## Step 7 — Evaluate solution archetypes

### 7.1 What it does

When the surface is composing a **recommendation** (Nexus,
Maestro, Tower), evaluate which **AI-led PDLC solution
components** (SOL2) are relevant.

Solution components are 14 canonical archetypes (e.g., DORA
telemetry rollup, MLOps registry, RAI governance layer, evaluation
loop, observability spine, etc.). Each component names
`relatedFailureModes` (PF1) and `relatedPatterns` (I1) as
union-semantics keys, so the recommender can match active failure
modes / patterns to applicable solutions.

### 7.2 Inputs

The active failure modes (Step 6) + active patterns (Step 5).

### 7.3 Outputs

`ReadonlyArray<SolutionComponent>` (SOL2 typed shape), in canonical
order, filtered by union-semantics on
`recommendPdlcComponentsFromInputs(failureModes, patternKeys)`.

For surfaces composing a **per-tenant solution draft** (deferred
to SOL3), the SOL2 components are inputs to a SOL1 composition
contract that emits a typed solution architecture.

### 7.4 Owner

**Source-of-truth contracts.**
- **SOL1** — Solution Architecture Composition Contract.
- **SOL2** — AI-led PDLC Solution Component Pack.
- **SOL3** — per-tenant Solution Draft (deferred; future slice).

### 7.5 Refusal conditions

- No matching solution components → empty array, recommendation
  surface renders missing-input chip naming the gap.
- Unknown failure-mode or pattern key in the input → ignored
  without throwing (SOL2 invariant).

---

## Step 8 — Check governance / gates

### 8.1 What it does

Call **Steward** (ARCH1 §7.4) to evaluate the relevant gate(s)
(G1 Charter, G2 Architecture, G3 Build / Risk, G4 Adopt / Scale)
against the canonical criteria. Steward emits a typed verdict.

### 8.2 Inputs

`WorkObject` + program state (current phase, deliverables, value
ledger, RAI flags) + evidence + governance constraints.

### 8.3 Outputs

A typed `GateVerdict` carrying `tenantKey`, `programCode`, `gate`
(`G1` | `G2` | `G3` | `G4`), `status` (`pass` |
`pass_with_conditions` | `block` | `needs_review`), `criteriaMet`
(per-criterion `{ criterionId, met, evidence: E-###[] }`),
`raiFlags`, `remedy` (honest fallback when status ≠ `pass`),
`createdFrom`.

### 8.4 Owner

**Source-of-truth contracts.** Steward gate verdicts (canonical
location: `src/lib/agent/steward/**`, future slice). Today, gate
state surfaces through S9 / S9b / S9c / S9d / S9e read models with
deterministic verdicts; the live evaluator slice is deferred
(ARCH1 §11.2).

### 8.5 Refusal conditions

- Insufficient evidence to evaluate → `needs_review` verdict with
  named missing inputs.
- RAI flag at `critical` severity → forces `block` regardless of
  other criteria; verdict names the flag and remedy.
- Tenant policy revokes gate evaluation for the surface →
  `needs_review`, audit ledger logs the policy invocation.

---

## Step 9 — Assemble prompt via model gateway

### 9.1 What it does

Call the **Model Gateway** (ARCH1 §6) with the typed context
bundle + intent + role. The gateway:

1. Renders the canonical prompt template for the role.
2. Attaches the resolved evidence citations as a structured
   `evidence_block`.
3. Attaches the active patterns + failure modes + solution
   archetypes + gate verdicts as a structured
   `signals_block`.
4. Attaches the missing-input chips as a structured
   `gaps_block`.
5. Picks the model class (`narrate`, `critique`, `summarize`,
   `score`, `compose`) and the provider + model name based on
   role + tenant tier + cost / latency budget.
6. Hashes the prompt and the context bundle for the audit ledger.

### 9.2 Inputs

`ContextBundle` + `intent` + `role`.

### 9.3 Outputs

A typed `GatewayPrompt` ready for dispatch (Step 10): carries
`gatewayVersion`, `promptHash`, `contextBundleHash`, `role`
(`narrate` | `critique` | `summarize` | `score` | `compose`),
`modelClass`, resolved `modelName`, `systemPrompt`,
`instructionBlock`, `evidenceBlock` (resolved citations),
`signalsBlock` (patterns + failure modes + solution archetypes +
gate verdicts), `gapsBlock` (missing-input chips), `outputSchema`
(`text` | `json` | `json_with_citations`), `costBudgetUsd`,
`latencyBudgetMs`.

### 9.4 Owner

**Source-of-truth contract.** ARCH1 §6 (Model Gateway). Canonical
location: `src/lib/gateway/**`.

The prompt is **provider-agnostic**; the same `GatewayPrompt`
shape can dispatch to Anthropic, OpenAI, Vercel AI Gateway, or a
future local model.

### 9.5 Refusal conditions

- Bundle classifier is `low_context` and role is `compose` /
  `score` → typed `GatewayRefusal { reason: 'context_too_low' }`.
- Vanilla-response risk flag is true → typed
  `GatewayRefusal { reason: 'vanilla_response_risk' }`.
- Cost budget exceeded → typed
  `GatewayRefusal { reason: 'cost_budget_exceeded' }`.

---

## Step 10 — Call model THROUGH GATEWAY ONLY

### 10.1 What it does

The gateway dispatches the typed `GatewayPrompt` to the chosen
provider + model. The provider returns a response. The gateway:

1. Records tokens in / out, cost, latency.
2. Hashes the response for audit.
3. Decodes the response against `outputSchema`.
4. Validates output structure (e.g., for `json_with_citations`,
   every cited E-### must resolve through the evidence ledger).
5. Returns a typed `GatewayResponse`.

### 10.2 Inputs

`GatewayPrompt`.

### 10.3 Outputs

A typed `GatewayResponse` carrying `promptHash`, `responseHash`,
`modelName`, `providerName` (`anthropic` | `openai` |
`vercel-ai-gateway` | `local`), `tokensIn`, `tokensOut`, `costUsd`,
`latencyMs`, an `output` discriminated by `kind` (`text` | `json` |
`json_with_citations` — the latter carries E-### `citations`),
`warnings` (e.g., `unverified_citation_rejected`), and
`createdFrom: 'gateway_compose'`.

### 10.4 Owner

**Source-of-truth contract.** ARCH1 §6 (Model Gateway), §9
(Audit). Canonical location: `src/lib/gateway/dispatch.ts`.

### 10.5 Refusal conditions

- Provider returns transient error → gateway retries once; on
  second failure, returns typed
  `GatewayResponseRefusal { reason: 'provider_transient' }`.
- Provider returns unrecoverable error → typed
  `GatewayResponseRefusal { reason: 'provider_unrecoverable' }`.
- Output fails schema validation → typed
  `GatewayResponseRefusal { reason: 'schema_invalid' }`.
- Cited E-### does not resolve through the evidence ledger →
  citation stripped; warning attached.

### 10.6 Anti-pattern

A page component, agent module, or read model that imports
`anthropic` / `openai` / any provider SDK directly and bypasses
the gateway. **Forbidden** (ARCH1 §2.2, §6.2, §12.3).

---

## Step 11 — Render response

### 11.1 What it does

Render the `GatewayResponse` into the surface's **canvas** (the
deliverable canvas, the Tower brief panel, the Sentinel pattern
detail card, the Steward gate verdict pane, the workshop agenda
view, the artifact preview).

The renderer is per-surface, but the contract is uniform: the
canvas reads the typed response, attaches the structural metadata
(citations, missing-input chips, provenance), and renders the
designed component (DES1 / DES2 design canon).

### 11.2 Inputs

`GatewayResponse` + `WorkObject` + render mode (per PDEL §10).

### 11.3 Outputs

A rendered surface element ready for the user. The render carries
its `createdFrom` marker, its tier (Stub / Outline / Rich), its
render mode (`html_render` / `markdown_render` / `pdf_export` /
`docx_export` / `ppt_export` / `no_render`), and its citation
links.

### 11.4 Owner

**Source-of-truth contracts.**
- **DES1 / DES2** — Design system canon and execution rails.
- **PDEL** — Render mode declarations.
- **ACT1** — Tower canvas constraints.
- **I3 / I4** — Intelligence pattern detail / renderer.
- **S9 / S9b–g** — Programs canvas.

### 11.5 Refusal conditions

- Render mode `no_render` → canvas declares the limit and renders
  the honest fallback.
- Tier `stub` → canvas renders the Stub placeholder with the
  promote-to-Outline next-step chip.
- Citations missing → canvas renders the missing-input chip and
  lowers the surface's confidence indicator.

---

## Step 12 — Attach evidence + missing-input chips

### 12.1 What it does

For every claim in the rendered surface, attach the resolved
E-### citation links. For every gap (missing inputs, partial
evidence usability, capped confidence), attach a structured
**missing-input chip** with the named remedy.

This is the user-facing manifestation of ARCH1 §2.4 — missing
inputs surfaced, not hidden.

### 12.2 Inputs

`GatewayResponse` + `EvidenceCitationSet` (Step 4) + bundle gaps
(Step 3).

### 12.3 Outputs

The rendered surface element now carries:

- **Citation chips** linking each named claim to its E-### row
  (which links to the evidence-ledger detail panel).
- **Missing-input chips** naming each gap and its remedy.
- **Provenance ribbon** stating `createdFrom`, tier, render mode,
  agent (Nexus / Sentinel / Atlas / Steward), gateway model name
  (when applicable).

### 12.4 Owner

**Source-of-truth contracts.**
- **DES1 / DES2** — Chip patterns and provenance ribbon.
- **I3 / I4** — Per-pattern evidence trail rendering.
- **PDEL** — Per-deliverable evidence binding count.

### 12.5 Refusal conditions

- A surface that drops citations or chips at render time is in
  violation of ARCH1 §2.1 / §2.4 and must be corrected.

---

## Step 13 — Create actions / artifacts

### 13.1 What it does

When the user's intent is `mutate` (e.g., "promote deliverable to
Outline", "schedule workshop", "open gate review", "accept
recommendation"), the surface calls the appropriate **tool**
(ARCH1 §8) to create the action / artifact.

Tools are the only side-effect surface for agents and for the
canvas (ARCH1 §8.3).

### 13.2 Inputs

`UserInput.intent === 'mutate'` + `WorkObject` + tool-specific
parameters (tier promotion target, workshop scheduling slot, gate
review reason, etc.).

### 13.3 Outputs

A typed `ToolResult` discriminated by `kind`: `ok` (carries
`mutationId`, `resultObject`, `auditRowId`), `partial` (carries
`mutationId`, `warnings`, `auditRowId`), or `refusal` (carries
`reason`, `remedy`).

### 13.4 Owner

**Source-of-truth contract.** ARCH1 §8 (Tool Layer). Canonical
location: `src/lib/tools/**`.

Per-domain tools:
- **Programs state mutation tool** — promotes phase, opens gate
  review, accepts recommendation (S9 / S9b–g).
- **Deliverable promotion tool** — Stub → Outline → Rich (PDEL).
- **Workshop scheduling tool** — books MW1 workshop, links to
  MW2 readiness (MW1 / MW2).
- **Export tool** — renders pdf_export / docx_export / ppt_export
  (PDEL).
- **Steward gate review tool** — opens / closes gate review (§8).

### 13.5 Refusal conditions

- Tool input fails preflight (e.g., promote Stub → Rich without
  passing through Outline) → typed refusal.
- Tenant policy blocks the mutation → typed refusal with policy id.
- Steward gate state blocks the mutation (e.g., promoting a
  deliverable past G3 with a `block` verdict) → typed refusal.

---

## Step 14 — Update program / workshop / deliverable state

### 14.1 What it does

The mutation tool (Step 13) writes the canonical state change
through the **read-model write API**, never through a raw
Supabase write from a page component.

The read-model write API:

1. Validates the mutation against the typed read-model schema.
2. Composes the typed write transaction.
3. Applies the write under tenant scope (RLS + S7 invariants).
4. Emits a structured event (Step 15).
5. Appends the audit row (Step 16).

### 14.2 Inputs

`ToolResult { kind: 'ok' | 'partial' }` plus the typed write
payload.

### 14.3 Outputs

The persisted state change, plus the typed event for Step 15 and
the audit row for Step 16.

### 14.4 Owner

**Source-of-truth contracts.**
- **S9 / S9b–g** — Programs read model writes.
- **PDEL** — Deliverable / artifact writes.
- **MW1 / MW2** — Workshop / readiness writes.
- **ADM3 / ADM4** — Dataset writes.
- **ACT1** — Tower dimension recomposition (read-only;
  recomposition is implicit on read).

### 14.5 Refusal conditions

- Write violates S7 isolation → write rejected, audit ledger
  records the attempt.
- Write violates schema invariants → write rejected, typed
  refusal returned to the canvas.

### 14.6 Anti-pattern

A page component bypassing the read-model write API and writing
directly to Supabase. **Forbidden** (ARCH1 §12.10).

---

## Step 15 — Emit Tower / Intelligence signals

### 15.1 What it does

Every state change that affects portfolio posture, gate state,
value-ledger state, evidence-chain state, or operating-model
state emits a structured event that:

- Updates the **S9e program control-tower signal list** for the
  tenant.
- Triggers **I1 Sentinel pattern recomputation** (idempotent;
  detection list is deterministic per signal list).
- Triggers **PF1 failure-mode mapping recomputation**
  (idempotent).
- Triggers **ACT1 Tower dimension recomposition** (read-only;
  next Tower load reads the new dimensions).

### 15.2 Inputs

The persisted state change from Step 14.

### 15.3 Outputs

A typed `PlatformEvent` carrying `eventId`, `tenantKey`,
`workObjectKind`, `workObjectKey`, `eventType` (`phase_advanced` |
`gate_verdict_changed` | `deliverable_tier_promoted` |
`value_ledger_updated` | `evidence_added` | `rai_flag_raised` |
`workshop_scheduled` | `pattern_detected` | `pattern_resolved` |
`failure_mode_flagged` | `failure_mode_cleared`), `emittedAt`,
`emittedBy { userId, agent }`, structured `payload`, and
`createdFrom`.

### 15.4 Owner

**Source-of-truth contracts.**
- **S9e** — Control Tower signal list.
- **I1** — Sentinel pattern detection recomputation.
- **PF1** — Failure-mode mapping recomputation.
- **ACT1** — Tower dimension recomposition.
- **Atlas (§7.3)** — Recomposes the Tower brief on next read.
- **Sentinel (§7.2)** — Recomposes the Sentinel brief on next
  read.

### 15.5 Refusal conditions

- Event payload fails schema validation → event dropped, audit
  ledger records the drop.
- Event tenant key does not match the originating mutation →
  event rejected (S7 invariant).

---

## Step 16 — Audit / trace everything

### 16.1 What it does

Append a structured row to the **audit ledger** (ARCH1 §9.2) for
every model call (Step 10), every gate verdict (Step 8), every
mutation (Step 14), every event emission (Step 15), and every
refusal at any prior step.

### 16.2 Inputs

The artifacts of every prior step that emits an audit-eligible
event.

### 16.3 Outputs

A typed `AuditRow` carries: `auditRowId`, `tenantKey`, `userId`,
`surface`, `workObjectKind`, `workObjectKey`, `eventKind`
(`gateway_call` | `gateway_refusal` | `gate_verdict` | `mutation` |
`event_emit` | `tool_call` | `context_refusal` | `tool_refusal`),
`agent` (`nexus` | `sentinel` | `atlas` | `steward` | `human` |
`system`), gateway-specific fields when applicable (`modelName`,
`promptHash`, `contextBundleHash`, `responseHash`, `tokensIn`,
`tokensOut`, `costUsd`, `latencyMs`), `provenance`, `createdAt`,
`agentVersion`, optional `gatewayVersion` and `notes`.

### 16.4 Owner

**Source-of-truth contract.** ARCH1 §9.2 (Audit). Canonical
location: `src/lib/audit/ledger.ts` (future slice).

The audit ledger is **append-only**, **tenant-isolated**, and
**replayable** (a future replay slice can re-dispatch a recorded
gateway call against a different model to verify reproducibility).

### 16.5 Refusal conditions

- Audit row fails schema validation → write retries once; on
  permanent failure, the originating action is rolled back and the
  user sees a typed error chip.
- Tenant policy revokes audit retention for the surface →
  audit row still appends with a redaction marker; redaction is
  applied at read time.

---

## Cross-cutting invariants

The following hold **across all sixteen steps**:

### CCI-1. Every step is tenant-scoped.

`tenantKey` flows from Step 1 to Step 16 unchanged. No step may
mutate, drop, or substitute the tenant key. S7 isolation tests
exercise this end-to-end.

### CCI-2. Every step is provenance-tagged.

Every typed output across the sixteen steps carries
`createdFrom` (ARCH1 §2.3). Render layers, audit ledger, and
downstream agents read this tag.

### CCI-3. Every step refuses honestly.

No step silently fails or fabricates output. Every refusal is
typed, named, and surfaces as a missing-input chip on the canvas.

### CCI-4. Every step is replayable.

Given the same `(tenantKey, workObject, seed snapshot)`, every
deterministic step (1, 2, 3, 4, 5, 6, 7, 14, 15) produces
byte-equal output. Gateway steps (9, 10) are replayable through
the audit ledger by re-dispatching the recorded prompt.

### CCI-5. Every step is auditable.

Step 16 closes the loop on every prior step. A reader of the audit
ledger can reconstruct the full sixteen-step flow for any one
turn.

---

## How this flow composes by surface

| Surface | Work object | Lead agent | Gateway role | Distinguishing steps |
|---|---|---|---|---|
| Programs detail (S9 / S9b–g) | `program` | Nexus | `narrate` (optional) | 13 / 14 promote deliverable / advance phase; 15 emits S9e signal recompute |
| Tower (ACT1) | `portfolio` | Atlas | `compose` | 4–7 roll up across programs; 11 caps ≤5 scorecards / ≤3 pressure cards |
| Intelligence (I1 / I2 / I3 / I4) | `pattern` | Sentinel | `narrate` | 5 returns the detection set; 12 attaches S9e signal trail |
| Maestro workshop (MW1 / MW2) | `workshop` | Nexus | `compose` | 8 reads MW2 readiness; 13 schedules / accepts agenda |
| Steward gate review | `phase` (gate boundary) | Steward | none (deterministic) | 8 emits the typed verdict; 12 attaches RAI flag chips |
| Solutions (SOL1 / SOL2 / SOL3) | `solution` / `portfolio` | Nexus | `compose` | 7 returns SOL2 archetypes via union semantics on PF1 + I1 keys |
| Admin / dataset (ADM1 / ADM3 / ADM4) | `dataset` / `artifact` | Steward (governance) | none / `narrate` | 4 reads via ADM3 inventory; 13 mutates only through the dataset write tool |
| Source (`/source/...`) | `source_event` / `source_artifact` | Nexus | `narrate` | 3 leans on Source-specific context contracts; rest of spine is uniform |

Every surface flows through the same sixteen steps. The only
variation is which work object is resolved (Step 2), which agent
leads (Step 11 + Step 13), and whether the gateway is invoked at
all (deterministic surfaces skip Steps 9 / 10).

---

## What is enforced today vs future work

### Enforced today

- Steps 1, 2, 11, 12 land on every shipped surface. The contracts
  for these steps are fully wired (S9 / S9b–g, ACT1, I1 / I2 / I3 /
  I4, PDEL, MW1 / MW2, ADM3, S7).
- Step 3 (context bundle) and the classifier in Step 9 are wired
  via S1 / S2.
- Steps 4, 5, 6, 7 are wired through I1, PF1, SOL1 / SOL2 (read-
  model surfaces) and the evidence ledger projection (deterministic
  seed binding).
- Step 8 (Steward) is wired through S9 / S9b–g gate-state read
  models with deterministic verdicts.
- Steps 14, 15 are wired through the read-model layer and the S9e
  signal recomputation (deterministic).

### Aspirational / deferred

- **Steps 9, 10 — Live Model Gateway dispatch.** Contract is
  defined; the live gateway module and provider routing land in a
  future slice.
- **Step 16 — Persisted audit ledger.** Contract is defined; the
  persisted ledger and replay surfaces land later.
- **Step 13 — Mutation tools (full set).** Tier-promotion,
  workshop-scheduling, gate-review-open tools land in future
  slices; today, mutations are scoped to the surfaces explicitly
  wired (Programs / Workshops / Admin scopes).
- **Step 7 — SOL3 per-tenant solution draft.** SOL2 components are
  wired; per-tenant composed solution drafts land later.
- **Step 8 — Live Steward gate evaluator.** Today gate verdicts are
  read-model-bound; the live evaluator slice is deferred.

---

## End of ARCH2

ARCH2 is the runbook every later slice authors against. A reader
who can recite the sixteen steps and the source-of-truth contract
for each step has the canonical mental model of the AbarVa
platform.

Read ARCH1 first for the architecture; read ARCH2 for the flow.
This contract does not modify any code. It is the basis for every
later slice that wires a surface, a tool, an agent, or a gateway.

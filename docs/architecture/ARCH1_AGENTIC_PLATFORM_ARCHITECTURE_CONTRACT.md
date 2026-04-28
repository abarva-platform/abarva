# ARCH1 · Agentic Platform Architecture Contract

Slice ID: ARCH1
Slice name: Agentic Platform Architecture Contract
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-25
Author: Code (sole)
Type: Specification / contract document only — no application code,
no runtime modification, no migrations, no model calls.

This contract is the canonical statement of what the AbarVa agentic
platform **is** and what it **refuses to be**. Every later contract
(ARCH2 end-to-end flow, ACT1 Tower, I1 / I2 / I3 / I4 Intelligence,
PF1 / PF2 failure-mode binding, SOL1 / SOL2 / SOL3 solution pack,
PDEL deliverables, ADM1 / ADM3 / ADM4 admin / dataset surfaces, S1
context bundle, S7 tenant isolation, S9 / S9b–g programs spine, MW1 /
MW2 workshops, QA1 / QA2 evaluation, DES1 / DES2 design system, I1 /
PF1 / SOL2 deterministic packs) inherits the principles named here.

ARCH1 governs **architecture**. ARCH2 governs **execution flow**.
ACT1 governs the **Tower surface**. I1 / PF1 / SOL2 govern
**deterministic packs**. S1 governs the **context bundle contract**.
This contract does not displace any of those. It explains how they
compose into one coherent platform.

---

## 1. Platform purpose

### 1.1 What AbarVa is

AbarVa is a **calm intelligence layer for AI program execution**.

A single executive sentence: AbarVa helps a CIO / CFO / CAIO / CTO /
Value Office / Governance reviewer / Transformation lead **run AI
programs with discipline** — from origination to verified value
realization — without losing the narrative chain from a steering
question to the evidence behind every recommendation.

AbarVa is the surface where:

- A **program** has a defensible posture at every gate (G1 Charter,
  G2 Architecture, G3 Build / Risk, G4 Adopt / Scale).
- A **portfolio** has a defensible operating model (Atlas brief
  composes a board-ready three-minute read).
- A **steering touchpoint** can be defended with named patterns
  (Sentinel I1) and named failure modes (PF1) rather than vibes.
- A **deliverable** has a stub → outline → rich promotion ladder
  (PDEL) where each tier states honestly what it can and cannot do.
- A **tenant** is isolated at the read-model layer (S7) regardless
  of whether the surface is Programs, Tower, Intelligence, or Admin.

### 1.2 What AbarVa is NOT

AbarVa is **not**:

- **A chat app.** The model never has free conversational rein over
  tenant data; every model call passes through the gateway and
  attaches to a work object.
- **A generic RAG app.** Retrieval is bound to the evidence ledger,
  not raw vector search; every chunk surfaced is citable as `E-###`.
- **A no-op governance layer.** Governance gates are evaluated by
  Steward against named criteria, not painted onto a status page.
- **A dashboard wallpaper.** The Tower (ACT1) refuses to be a
  metrics wall; it answers three questions in three minutes.
- **A document generator that fabricates dollar amounts.** Every
  surface that names a value figure must trace it to a value-ledger
  row with at least one E-### citation, or honestly fall back.

### 1.3 Tone and posture

AbarVa is a **calm** intelligence layer. The product is for a
boardroom, not a developer console. The agentic spine is the
discipline that lets the surface stay calm.

The platform earns calm by being:

- **Boring at runtime.** Deterministic read models compose first;
  models compose second; speculative model output never displaces a
  deterministic source of truth.
- **Honest under low context.** Missing inputs are surfaced as
  chips, never silently filled.
- **Defensible at audit.** Every recommendation traces to evidence,
  every model call traces to a gateway audit row, every gate verdict
  traces to a Steward criterion.

---

## 2. Non-negotiable technical principles

These principles are **non-negotiable**. They override every product
decision. A surface that violates a principle below is broken even
if it ships.

### 2.1 Every output traces to evidence

Every artifact, recommendation, scorecard, brief, deliverable, gate
verdict, and Tower lens that names a substantive claim must trace
that claim to one or more `E-###` citations resolved through the
evidence ledger. Surfaces with no evidence must use **honest
fallback** language naming the missing input — never a fabricated
number, never an unattributed claim.

A surface that displays a value figure with no E-### citation is in
violation. A deliverable that quotes a finding with no E-### is in
violation. A pattern detection (I1) that names an affected program
without a sourceSignalId is in violation.

### 2.2 Agents never call providers directly

No agent (Nexus, Sentinel, Atlas, Steward, future agents) may
import a provider SDK (`anthropic`, `@anthropic-ai/sdk`, `openai`,
`@google-ai/...`, `pinecone-client`, etc.) directly. All model
calls must flow through the **Model Gateway** (§6).

The provider import is a **single chokepoint** so that:

- Routing, model selection, and fallback are centralized.
- Every prompt is composed against the canonical context bundle.
- Every model call is audited in one place.
- The platform can swap providers without rewriting every agent.

A `grep "import OpenAI"` or `grep "from 'anthropic'"` outside
`src/lib/gateway/**` (or its current canonical path) is a forbidden
pattern (§12).

### 2.3 Every artifact carries provenance

Every artifact emitted by the platform — a deliverable, a workshop
note, a pattern detection, a failure-mode flag, a Tower
pressure-card, a Sentinel brief, a Steward gate verdict, a
solution-component recommendation — must declare its
**`createdFrom`** marker.

Canonical markers used today:

- `deterministic_seed` — built from the seed planner; safe under
  any tenant; cannot fabricate beyond seed content.
- `deterministic_pattern_pack` — built from a curated, code-checked
  pack (PF1, I1, SOL2).
- `deterministic_read_model` — built from a deterministic read model
  composition (S9, S9b–g, ADM3, PDEL, MW2, ACT1 dimensions).
- `gateway_compose` — composed by the Model Gateway against a
  context bundle (S1) and audited (§9).
- `human_authored` — uploaded by a tenant user; passes through the
  parsing pipeline (§3).

Provenance is part of the artifact contract. A render pipeline that
strips provenance is in violation.

### 2.4 Missing inputs are surfaced, not hidden

When a context bundle (S1) is **incomplete** — `low_context`,
`partial_context`, `usable_with_gaps`, etc. — surfaces must show
the gap, name what is missing, and offer the remedy.

The canonical surfacing primitive is the **missing-input chip**.
Examples:

- A scorecard without `value_ledger` shows "value ledger not yet
  seeded — see Programs / Charter".
- A deliverable in Stub tier names "promote to Outline to render
  rich body".
- A Sentinel detection at `low` confidence names "needs cross-
  steering recurrence to promote to high".
- An Atlas pressure-card names "evidence registry binding deferred
  — confidence capped at medium".

Never silently fill, never auto-confidence-promote, never display a
zero where the real value is "not yet computed".

### 2.5 Deterministic source of truth for v0 surfaces

For v0, every Tower / Intelligence / Programs / Admin surface must
ground itself in a **deterministic read model** (seed planner +
typed read-model module + integration tests). The Model Gateway can
**augment** narrative, but cannot **displace** the deterministic
source of truth.

This is the core posture difference vs. a generic agentic app:
AbarVa's surfaces are **read-model-first**. The model is permitted
to summarize, narrate, recommend — never to invent the read model.

A surface that wires `gateway_compose` directly into a tenant
scorecard without a deterministic read model behind it is in
violation.

### 2.6 Tenant isolation at the read-model layer

Every read model and every gateway call carries a `tenantKey` (and,
where applicable, a `programCode`, `phase`, `workshopKey`,
`patternKey`, `solutionKey`, `deliverableId`, etc.). Cross-tenant
reads are not possible at the read-model layer (S7 tenant isolation
probe tests enforce this).

A future Supabase RLS layer is the persistence enforcement; the
read-model contract is the in-process enforcement.

### 2.7 No fabricated dollars, no fabricated citations

Every test pack (PF1, I1, SOL2, PDEL, ADM3, ADM4, ACT1 dimensions)
asserts:

- No string field contains a fabricated dollar amount that the seed
  cannot defend.
- No string field contains an `E-###` citation unless it resolves
  through the evidence ledger.

This invariant lives in the test layer because it is not
self-enforcing in TypeScript types alone.

---

## 3. Ingestion and parsing pipeline

This section governs how a tenant's **uploaded** content (a charter
PDF, a process map, an interview transcript, a value-ledger
spreadsheet, a steering deck, a dataset CSV) becomes evidence the
platform can cite.

### 3.1 Lifecycle (explicit)

Every upload flows through **seven** ordered stages:

1. **Parse.** Convert the binary into structured text + structural
   metadata (page, paragraph, table, slide, sheet, row).
2. **Chunk.** Split the parsed structure into evidence-sized chunks
   that respect document structure (paragraph / row / cell, not
   arbitrary 512-token splits).
3. **Enrich.** Attach metadata: program / phase / workshop binding,
   role of the chunk (charter section, baseline value row, gate
   criterion, finding, decision, action item).
4. **Embed.** Generate vector embeddings for retrieval. Embeddings
   are tools (§8), not the source of truth.
5. **Extract.** Run **deterministic extractors** (regex / structured
   parsers / typed schema extractors) to populate read-model fields
   (e.g., baseline value, target value, owner, gate criterion).
6. **Persist.** Write to the relational store, the vector memory,
   the graph, and the evidence ledger atomically with provenance.
7. **Validate.** Run integration tests against the persisted state
   (typed shape, citation chain, tenant isolation, no-fabrication
   invariants).

A surface that consumes a chunk that has not been validated is in
violation.

### 3.2 Claude / OpenAI is NOT used as a parser

This is **non-negotiable**:

> **The platform does not use Claude, OpenAI, or any other model
> as a primary parser.**

Models are used to **narrate**, **summarize**, **recommend**,
**critique**, and **draft**. Models are **not** used to:

- Extract a baseline dollar value from a value-ledger PDF.
- Identify the gate criterion from a charter PDF.
- Resolve "owner = Jane Doe" from a meeting note.
- Bind a finding to a phase.

Every extraction above must run through a **deterministic
extractor** (typed schema parser with a unit test). If the
deterministic extractor fails, the surface declares the chunk
**unextracted** with an honest fallback — it does not fall through
to a model and pretend.

The reason: model parsing is non-reproducible. A demo that depended
on model parsing would silently drift across tenants and across
model versions, fabricating evidence that the audit log could not
defend.

### 3.3 Where models DO live in the pipeline

Models live **after** the deterministic extractor, in two roles:

1. **Narrate.** Take a deterministic read-model output and render
   it into prose for the canvas. The deterministic output is the
   substrate; the model adds language only.
2. **Critique.** Read a draft (deliverable, brief, scorecard) and
   surface contradictions or gaps. This is opt-in, not on the
   primary path.

Both roles flow through the Model Gateway (§6).

### 3.4 Extractor library

Extractors live in `src/lib/extractors/**` (canonical path). Each
extractor is:

- Pure (input → output), no side effects.
- Typed (input shape, output shape).
- Unit tested (golden file against a representative chunk).
- Versioned (`extractorVersion: 'v1'` on every extracted row, so
  the persistence layer can re-extract without losing prior
  provenance).

### 3.5 Failure handling

Every stage emits a **stage status** per chunk:

- `parse: ok | failed | unsupported_format`
- `chunk: ok | empty`
- `enrich: ok | partial | failed`
- `embed: ok | failed | skipped`
- `extract: ok | partial | failed | not_applicable`
- `persist: ok | failed | quarantined`
- `validate: ok | failed`

A chunk in `parse: failed` does not propagate downstream; the
upload is marked partial and the missing-input chip names the
parse failure.

---

## 4. Knowledge Fabric

The **Knowledge Fabric** is the platform's persistence layer.
Every later layer (context builder, gateway, agents, tools, surfaces)
reads from the fabric — never directly from a tenant upload.

The fabric has **five** stores. Each store has a job and an
invariant.

### 4.1 Relational state (Postgres / Supabase)

**Job.** Hold the canonical state of every tenant, program, phase,
workshop, gate, deliverable, decision, action, scorecard, brief,
detection, failure-mode flag, solution-component recommendation,
audit row.

**Invariant.** Every row carries `tenant_key` (and where applicable
`program_code`, `phase`, etc.). RLS policies enforce isolation at
the persistence layer; S7 enforces it at the read-model layer.

**Anti-pattern.** A row without `tenant_key`. A query that joins
across tenants. A read model that bypasses the typed read model
and selects raw rows in a page component.

### 4.2 Vector memory

**Job.** Hold embeddings of evidence chunks (§3) for retrieval.
Used by the evidence ledger and Sentinel pattern detection as a
tool — not as a source of truth.

**Invariant.** Every embedding row links back to a relational
chunk row by id. Vector search results are **never** surfaced
without resolving the originating chunk and re-projecting through
the evidence ledger.

**Anti-pattern.** "Top 5 vector hits" surfaced as evidence (no
ledger binding). Cross-tenant vector index. Embeddings used as the
sole answer to a fact question.

### 4.3 Graph relationships

**Job.** Hold typed relationships between work objects: program →
phase → workshop → deliverable → evidence; pattern → failure-mode
→ solution-component; tenant → portfolio → operating-model gap.

**Invariant.** Every edge is typed (e.g., `program_owns_phase`,
`phase_produces_deliverable`, `deliverable_cites_evidence`,
`pattern_implies_failure_mode`). Untyped edges are not permitted.

**Anti-pattern.** A free-form "knowledge graph" with arbitrary
edge labels. A graph that conflates ontology nodes (canonical
patterns, failure modes, solution components) with tenant-instance
nodes (this program, this evidence chunk).

### 4.4 Object / raw store

**Job.** Hold the raw uploaded binary (PDF, DOCX, XLSX, PPTX, CSV,
PNG, MP4, transcript) so the platform can re-parse, re-extract,
and re-bind without losing the source of truth.

**Invariant.** Every raw object has a hash, a tenant binding, a
mime type, an upload provenance row, and a chunk-set link.

**Anti-pattern.** Stripping the original after parsing. Storing
raw bytes outside tenant isolation. Allowing direct download of
raw objects without auth + tenant scoping.

### 4.5 Evidence ledger

**Job.** Be the **only** surface for evidence retrieval used by the
context builder, the agents, and the deliverable / brief / scorecard
composers. Every E-### citation resolves through the ledger.

**Invariant.** The ledger projects every cited chunk with: id,
tenant binding, source object, page / row / paragraph, extracted
fields, citation tier (`primary` / `corroborating` / `unverified`),
confidence cap, provenance.

**Anti-pattern.** Bypassing the ledger to read vector hits
directly. Citing a chunk that has not yet been validated (§3.5).
Allowing a citation tier of `unverified` on a steering-deliverable
surface without an explicit `evidenceUsability: 'partial'` chip.

---

## 5. Context Builder

The **Context Builder** is the layer that takes a request from a
surface and assembles the **context bundle** the gateway will use to
compose a response.

S1 is the canonical contract for the context bundle. ARCH1 names
**why** the bundle exists; S1 names the typed shape.

### 5.1 Input shape

The context builder accepts a request consisting of:

- **Work object.** Program / phase / workshop / pattern / failure-
  mode / solution-component / deliverable / portfolio / operating-
  model gap. The work object names what the surface is currently
  about.
- **Tenant context.** Tenant key, route slug, allowed users,
  current user role, allowed surfaces.
- **Program state.** Current phase, gate verdicts (Steward G1-G4),
  active deliverables, baseline / target / realized values.
- **Evidence.** Resolved E-### citations from the evidence ledger
  bound to the work object.
- **Patterns.** Active Sentinel detections (I1) bound to the work
  object's tenant or program.
- **Artifacts.** Per-program artifact inventory (PDEL) — generated
  deliverables, uploaded documents, workshop notes, decision
  records, evidence artifacts, datasets.
- **Graph relationships.** Connected nodes (program ↔ workshops ↔
  deliverables ↔ evidence; pattern ↔ failure-mode ↔ solution-
  component) so the gateway can compose with awareness of the local
  topology.
- **Conversation.** Recent steering / advisor / Source events
  bound to the work object.
- **Governance constraints.** Steward gate verdicts, RAI / risk
  flags, jurisdictional constraints, tenant policies.

### 5.2 Output shape

The context builder emits a **structured context bundle** typed
by S1. The bundle is the only input the gateway uses to assemble a
prompt.

A bundle carries:

- A **state classifier** (S2): one of `low_context`,
  `partial_context`, `usable_with_gaps`, `usable`, `rich`.
- A **quality scorecard** (S2): six dimensions across evidence,
  pattern, governance, value, workflow integration, change.
- The typed work object, tenant context, program state, evidence,
  pattern, artifact, graph, conversation, governance fields.
- A **vanilla-response risk** flag — a boolean that, when true,
  forces the gateway to refuse or downgrade composition (S2).

### 5.3 Refusal posture

The context builder **refuses** to emit a usable bundle when:

- The tenant key is missing or unresolved.
- The work object cannot be identified.
- The state classifier is `low_context` and the surface requires
  `usable_with_gaps` minimum (e.g., gate verdict on G3).

A refused bundle returns a typed `ContextRefusal` with reason and
remedy. The surface then renders a missing-input chip; it does
**not** fall through to a vanilla model call.

### 5.4 Determinism guarantees

The context builder is deterministic per `(tenant, work object,
seed snapshot)`. Two calls with the same input return byte-equal
output. This is what lets the gateway cache prompt prefixes and
audit replays.

---

## 6. Model Gateway

The Model Gateway is the **single chokepoint** for every model
call. ARCH1 §2.2 named the principle; this section names the
contract.

### 6.1 Responsibilities

1. **Routing.** Decide which provider + model class to use for a
   given role (`narrate`, `critique`, `summarize`, `extract_assist`,
   `score`, `compose`).
2. **Prompt assembly.** Take the typed context bundle (S1) and the
   role, render the canonical prompt template, attach evidence
   citations, attach missing-input flags.
3. **Model selection.** Pick the model (e.g., `claude-opus-4-7`,
   `claude-sonnet-4-7`, `gpt-5`, `local-rerank`) based on role,
   tenant tier, cost budget, latency budget.
4. **Cost tracking.** Record token in / out, dollar cost, model
   name, latency for every call.
5. **Audit logging.** Append to the audit ledger (§9) for every
   call: tenant, work object, role, model, prompt hash, context
   bundle hash, response hash, cost, latency, gateway version.
6. **Fallback behavior.** Retry once on transient error; on
   permanent failure, emit a typed `GatewayRefusal` so the surface
   can render a missing-input chip rather than a stale answer.

### 6.2 Anti-pattern: direct provider import

Forbidden anywhere outside the gateway module:

```
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { Anthropic } from '@anthropic-ai/sdk'
```

A page component, an agent module, a deterministic library, a
read model, an extractor — none of these may import a provider SDK.

The CI lint rule (future slice) enforces this with a static-source
check identical to the slice-hygiene checks PF1 / I1 / SOL2 already
use.

### 6.3 Provider-agnostic prompt assembly

The gateway assembles a **provider-agnostic** prompt. The prompt is
a typed structure (system, instructions, evidence block, work
object, conversation block, output schema) — not a string template
hard-coded against a provider.

This lets the gateway swap providers without changing agent code,
and lets the audit ledger replay a call against a different model
to verify reproducibility.

### 6.4 Refusal contract

The gateway refuses a call when:

- The context bundle is `low_context` and the role requires
  `usable_with_gaps` minimum.
- The vanilla-response risk flag is true (S2) and the role is
  `compose` or `score`.
- The cost budget would be exceeded.
- The provider returns an unrecoverable error after one retry.
- The tenant has revoked model-call consent for the work object's
  surface.

Every refusal is typed, named in the audit ledger, and surfaces as
a missing-input chip on the canvas.

---

## 7. Agent Runtime

The Agent Runtime hosts the four canonical agents. Each agent has a
**bounded job** and a **refusal contract**.

### 7.1 Nexus — mastermind

**Job.** Compose program-level recommendations. Frame use cases.
Sequence phases. Recommend the next workshop. Surface the next
deliverable.

**Refuses.** To compose against a `low_context` bundle. To
recommend a value figure without a value-ledger row. To fabricate a
gate verdict (that is Steward's job). To call a provider directly
(every call routes through the gateway).

**Reads.** Programs read model (S9 / S9b–g), context bundle (S1),
evidence ledger (§4.5), Sentinel detections (I1), Steward gate
verdicts.

**Emits.** Recommendations, narrative for deliverables, draft
workshop agendas, draft charter prose. All flagged
`createdFrom: 'gateway_compose'` and audited.

### 7.2 Sentinel — intelligence

**Job.** Detect patterns (I1) and failure modes (PF1). Surface
recurrence. Compose Sentinel briefs (I2). Render pattern detail
(I3 / I4).

**Refuses.** To name a cross-program operating-model gap from a
single program (I1 confidence calibration). To claim
`high` confidence on seed alone without recurrence. To fabricate a
detection that the seed does not justify.

**Reads.** S9e signals, seed plan, evidence ledger, programs read
model.

**Emits.** Pattern detections, failure-mode flags, Sentinel briefs.
All flagged `createdFrom: 'deterministic_seed'` for v0; later
slices promote to `gateway_compose` for narrative augmentation.

### 7.3 Atlas — control tower

**Job.** Compose the executive Tower brief (ACT1). Surface top
three pressure cards. Sequence the next steering decision. Render
the AI operating brief.

**Refuses.** To exceed five scorecards or three pressure cards on a
single Tower. To narrate a value figure without a ledger row.
To claim portfolio-level conclusions from sub-portfolio scope.
To present a metrics wall.

**Reads.** Tower dimensions read models (ACT2 → ACT8), Sentinel
detections, Steward gate verdicts, programs read model.

**Emits.** Tower brief, pressure cards, lens projections,
steering-decision next step. All flagged accordingly.

### 7.4 Steward — governance

**Job.** Evaluate gates (G1 Charter, G2 Architecture, G3 Build /
Risk, G4 Adopt / Scale). Issue gate verdicts. Surface RAI / risk /
regulatory constraints. Author governance review prompts.

**Refuses.** To issue a `pass` verdict on a gate whose criteria are
not met. To compose a verdict without naming the criterion. To
hide an RAI flag.

**Reads.** Gate criteria pack (deterministic), context bundle,
evidence ledger, programs read model.

**Emits.** Gate verdicts, RAI flags, governance review notes,
Steward escalation guidance. All flagged with criterion id and
provenance.

---

## 8. Tool Layer

Tools are the **only side-effect surface** for agents. An agent
that wants to read or change state does so by calling a tool.

### 8.1 Canonical tools

- **Vector search.** Returns ranked chunk ids for a query. Always
  composes through the evidence ledger before being surfaced as
  evidence. Never surfaced as a "top hits" list.
- **Graph traversal.** Returns connected nodes for a starting
  node + edge type. Used by the context builder to assemble local
  topology.
- **File retrieval.** Returns a parsed chunk by id from the
  relational store + the evidence ledger projection.
- **Program state.** Returns the typed program / phase / workshop /
  deliverable / scorecard read-model row(s) for a tenant + program.
- **Export / document.** Renders a deliverable into html_render /
  markdown_render / pdf_export / docx_export / ppt_export (PDEL).
- **Audit emit.** Append a structured row to the audit ledger
  (§9). Used by the gateway and every agent that takes an
  observable action.

### 8.2 Tool contract

Every tool is:

- Typed (input + output).
- Tenant-scoped (every call carries `tenantKey`).
- Side-effect declared (read-only / mutation / external-effect).
- Audited if mutation or external-effect.
- Refusable — tool returns a typed refusal with reason and remedy
  rather than throwing on a missing input.

### 8.3 Anti-pattern: side effects outside the tool layer

A page component, an agent module, or a read model that performs a
mutation (write to Postgres, write to the vector store, send a
notification, render a PDF, sign a presigned URL) **outside** the
tool layer is in violation. Every mutation passes through a tool.

---

## 9. Evidence / Audit / Governance layer

This layer is where the platform's defensibility lives.

### 9.1 Evidence

Every artifact that names a substantive claim attaches **E-###**
citations resolved through the evidence ledger (§4.5). The
citation is part of the artifact contract, not a footer decoration.

A pattern detection (I1) has `evidenceSignals` and
`sourceSignalIds`. A failure-mode flag (PF1) has `requiredEvidence`
named in the pack. A solution-component recommendation (SOL2) names
`relatedFailureModes` + `relatedPatterns` so the evidence chain is
traceable.

### 9.2 Audit

Every model call (gateway), every gate verdict (Steward), every
mutation (tool layer with side effects), and every artifact emit
appends to the **audit ledger**. The audit row carries:

- Tenant key, work object id, surface, role, agent.
- Gateway model name, prompt hash, response hash, tokens, cost,
  latency.
- Provenance marker (§2.3).
- Time, gateway version, agent version.

Every audit row is tenant-isolated and immutable (append-only).

### 9.3 Governance

Steward (§7.4) evaluates G1-G4 gates against canonical criteria.
Verdicts are typed (`pass`, `pass_with_conditions`, `block`,
`needs_review`). Each verdict names the criterion, the evidence,
and the remedy.

The gate verdicts are **read** by Nexus (to refuse to advance),
Atlas (to surface portfolio gate posture), and Sentinel (to bind
detected patterns to gate implications).

### 9.4 Tenant isolation

Tenant isolation is enforced at:

- **Persistence (RLS).** Every Supabase row is scoped by
  `tenant_key`.
- **Read-model (S7).** Every read-model module passes the
  S7 isolation probe tests.
- **Gateway audit.** Every audit row is tenant-scoped; replay
  cannot leak across tenants.
- **Tool layer.** Every tool call carries `tenantKey`.

---

## 10. Deliverable / output layer

The deliverable layer is the surface where program / portfolio /
intelligence / governance output becomes a renderable artifact.

### 10.1 Render modes

Per the PDEL contract, deliverables and artifacts declare a render
mode:

- `html_render` — renderable in the canvas as HTML; used for the
  primary detail surface.
- `markdown_render` — renderable as markdown for plain-text
  preview, decision records, audit notes.
- `pdf_export` — exportable as a PDF for steering distribution.
- `docx_export` — exportable as a DOCX for working sessions /
  redlining.
- `ppt_export` — exportable as a PPTX for steering decks.
- `no_render` — declared non-renderable; the artifact carries an
  honest fallback naming the limit (e.g., upload pipeline deferred,
  parser deferred, dataset inspector deferred).

### 10.2 Stub → Outline → Rich promotion ladder

Every generated deliverable carries a **tier**:

- **Stub.** Names the deliverable, its purpose, and what would be
  needed to promote. Renderable as a placeholder; the canvas
  declares the limit.
- **Outline.** Headings + bullets + missing-input chips. Renderable
  as HTML / markdown with explicit gaps.
- **Rich.** Full prose + evidence citations + tables + figures.
  Renderable across all export formats.

Promotion is **never automatic**. Promotion requires either:

- Additional evidence ingest (§3) raising the context bundle state
  classifier.
- Tenant user action through a tool (e.g., "promote to outline").
- A workshop output (MW1 / MW2) producing the missing inputs.

### 10.3 Provenance on every deliverable

Every deliverable surfaces its `createdFrom` marker, its tier, its
render mode, its evidence binding count, and its missing-input
chips. A deliverable rendered without provenance is in violation.

---

## 11. What is enforced today vs future work

This contract is honest about what is wired and what is aspirational.

### 11.1 Enforced today (v0 spine)

- **S1 — Context bundle contract.** Typed bundle covering tenant,
  work object, evidence, workflow, patterns, files, conversation,
  quality state. `code_complete`.
- **S2 — Context scoring / classifier.** 5-state classifier,
  6-dimension quality scoring, vanilla-response risk flag.
  `code_complete`.
- **S7 — Tenant isolation probes.** Read-model isolation enforced
  by integration tests across all read-model surfaces.
  `code_complete`.
- **S9 / S9b–g — Programs read-model spine.** Programs index, Nexus
  rail metadata, deliverables / evidence / value summary, control-
  tower signals, Atlas executive brief. `code_complete`.
- **I1 — Sentinel pattern detection read model.** Five canonical
  patterns + meta operating-model gap. Confidence calibration.
  `code_complete`.
- **I2 / I3 / I4 — Intelligence brief / detail / renderer.**
  `code_complete`.
- **ADM3 — Dataset domain inventory read model.** `code_complete`.
- **PDEL — Program deliverables / artifacts read model.**
  `code_complete`.
- **PF1 — AI program failure modes pattern pack.** Twelve canonical
  failure modes. `code_complete`.
- **SOL1 / SOL2 — Solution architecture composition contract +
  AI-led PDLC component pack.** `code_complete`.
- **MW1 / MW2 — Maestro workshop registry + readiness read model.**
  `code_complete`.
- **ACT1 — AI Control Tower contract.** Seven canonical dimensions,
  pressure-card and scorecard limits. `code_complete`.
- **DES1 / DES2 — Design system canon + execution rails.**
  `code_complete`.

### 11.2 Aspirational / deferred

- **Live Sentinel runtime subscriber.** I1 today is seed-bounded;
  cross-steering recurrence promotion to `high` confidence requires
  a future Sentinel persistence slice.
- **Live evidence ledger ingest pipeline.** §3 lifecycle is
  contractually defined; the live extractor library and chunk
  validation pipeline land in a future slice.
- **Model Gateway wiring.** §6 is contractually defined; the live
  gateway module lands in a future slice. The contract here lets
  every later agent be authored against the gateway from day one
  without retrofitting.
- **Live audit ledger.** §9 audit row contract is defined; the
  persisted ledger and replay surfaces land later.
- **Steward G1–G4 live evaluator.** §7.4 governance evaluator
  contract is defined; the live gate evaluator and surface land
  later.
- **Cross-tenant operating-model meta-pattern recurrence.** I1
  meta-pattern is suppressed unless ≥2 programs share the gap.
  Cross-steering persistence and meta-meta-pattern detection land
  later.
- **Export pipeline (pdf_export / docx_export / ppt_export).**
  PDEL declares the render-mode contract; the live export pipeline
  is deferred.
- **Per-tenant failure-mode persistence (PF4).** PF1 today is a
  deterministic pack; per-tenant recurrence and meta-failure-mode
  detection land later.
- **Solution Draft read model (SOL3).** SOL1 / SOL2 are wired;
  per-tenant composed solution drafts land later.
- **Adoption / Change pack (SOL4 / SOL5 / SOL6).** Component pack is
  wired; per-tenant adoption rails and workshop scheduling land
  later.

---

## 12. Anti-patterns

The following are explicitly forbidden. CI lints, integration tests,
and slice-hygiene checks enforce them.

### 12.1 Raw vector search without evidence binding

```
// FORBIDDEN
const hits = await vectorStore.search(query);
return hits.map(h => h.text); // surfaced as evidence
```

**Why.** Vector hits are not evidence. Evidence is a chunk
projected through the evidence ledger with a tenant binding,
extracted fields, citation tier, and confidence cap.

**Right.** Use the evidence ledger tool; it composes the vector
search internally and returns typed `EvidenceCitation` rows with
E-### ids.

### 12.2 Claude / OpenAI as a parser

```
// FORBIDDEN
const baseline = await claude.complete({
  prompt: `Extract baseline value from this PDF: ${rawText}`,
});
```

**Why.** Model parsing is non-reproducible; the audit ledger
cannot defend it; cross-tenant drift is invisible.

**Right.** Run a deterministic typed extractor (§3.4). If the
extractor fails, declare the chunk unextracted with an honest
fallback chip.

### 12.3 Direct model call from a page component

```
// FORBIDDEN — anywhere outside the gateway
import { Anthropic } from '@anthropic-ai/sdk';
import OpenAI from 'openai';
const result = await client.messages.create({ ... });
```

**Why.** Bypasses the gateway audit, the prompt assembly, the
context bundle, the cost tracker, the fallback contract, the
tenant isolation enforcement.

**Right.** Call the gateway with a typed role + the typed context
bundle from the context builder. Render the gateway response.

### 12.4 Artifact without provenance

```
// FORBIDDEN
return {
  title: 'Charter draft',
  body: composedText,
  // no createdFrom marker
};
```

**Why.** The audit ledger cannot trace the artifact back to its
source. The render layer cannot decide whether to surface a
fallback chip.

**Right.** Every artifact carries `createdFrom`, tier, render mode,
evidence-binding count, missing-input chips.

### 12.5 Recommendation without missing-input disclosure

```
// FORBIDDEN
return {
  recommendation: 'Promote program to G3.',
  // no missingInputs, no evidence chain
};
```

**Why.** The user cannot decide whether to act. The audit ledger
cannot defend the recommendation.

**Right.** Every recommendation names its evidence chain, its
gate criteria, its missing inputs, and its remedy.

### 12.6 Fabricated dollar amount

```
// FORBIDDEN
return {
  baseline: '$2.4M',
  target: '$5.1M',
  // no value-ledger row
};
```

**Why.** A fabricated dollar figure is the highest-risk
fabrication for a CFO / Value Office user; it invalidates every
adjacent claim.

**Right.** Either reference a value-ledger row with E-### citation,
or render an honest fallback ("baseline not yet seeded — see
Programs / Charter").

### 12.7 Fake E-### citation

```
// FORBIDDEN
return {
  finding: 'Adoption is below target',
  citations: ['E-001', 'E-002'], // not resolved through the ledger
};
```

**Why.** A fake citation breaks the audit chain. Every E-### must
resolve through the evidence ledger.

**Right.** Compose citations only through the evidence-ledger tool;
the tool returns ledger-resolved E-### ids tied to chunks.

### 12.8 Cross-tenant read

```
// FORBIDDEN
const allPrograms = await db.query('SELECT * FROM programs');
```

**Why.** Violates S7 isolation and the persistence RLS.

**Right.** Every query passes through a typed read model that
takes `tenantKey` and projects only that tenant's rows. The
read-model module passes the S7 isolation probe.

### 12.9 Confidence promotion without recurrence

```
// FORBIDDEN — single-program detection auto-promoted to 'high'
return { confidence: 'high', affectedPrograms: [oneProgram] };
```

**Why.** I1 calibration caps single-program detections at
`medium`. A `high` claim without cross-program / cross-steering
evidence is fabrication.

**Right.** Use the calibration table in I1 §confidence calibration.
Promotion to `high` requires ≥3 affected programs OR a future
recurrence persistence slice.

### 12.10 Side effect outside the tool layer

```
// FORBIDDEN — page component writes directly to Postgres
await supabase.from('programs').update({ phase: 'design' });
```

**Why.** Bypasses the audit ledger; loses the tool-layer refusal
contract; breaks tenant scoping invariants.

**Right.** Call the program-state mutation tool; it composes the
update through the read model, audits the change, and emits the
canonical event.

---

## End of ARCH1

ARCH1 governs the architecture. ARCH2 governs the end-to-end
execution flow that this architecture implies. Read ARCH2 next to
see how a single user interaction composes through every layer
named here.

This contract does not modify any code. It is the basis every later
slice authors against.

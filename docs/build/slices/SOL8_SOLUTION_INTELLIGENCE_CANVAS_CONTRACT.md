# SOL8 · Solution Intelligence Canvas Contract

Slice ID: SOL8
Slice name: Solution Intelligence Canvas Contract
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-25
Author: Code (sole)
Type: Specification / contract document only — no application code,
no runtime modification, no migrations, no model calls.

This contract governs the shape and behavior of the **Solution
Intelligence Canvas** — the surface where Client Maestro, AbarVa
Maestro, and Solution Architect compose a tenant-specific solution
architecture from a Solution Archetype (SOL3) plus the relevant
component packs (SOL2 PDLC, SOL4 Analytics, SOL5 Healthcare),
calibrated by workshop findings, evidence, and missing-input
posture.

The canvas is the **single working surface** for solution
composition. It is not a wizard. It is not a multi-page form. It
is one canvas with side drawers that compose from canonical
contracts. Everything authoritative happens here.

This slice is **documentation only**. It defines the canvas shape
so v1 implementation has a single source of truth. SOL9 onward
implement the actual UI, read model, refinement loop, and
deliverable renderer that consume this contract.

---

## §A · Purpose

The Solution Intelligence Canvas is where **Client Maestro /
AbarVa Maestro / Solution Architect** compose a tenant-specific
solution architecture from:

- a **Solution Archetype** (SOL3) selected for the tenant's sector
  and primary problem,
- the relevant **component packs**:
  - **SOL2** — AI-led PDLC solution component pack,
  - **SOL4** — Analytics solution component pack,
  - **SOL5** — Healthcare solution component pack,
- **workshop findings** (per MW1 / MW2),
- **evidence** (per EVID1 `usable_as_evidence` discipline),
- **patterns** observed (per Sentinel I1) and **failure modes**
  flagged (per PF1),
- the tenant's current-state context bundle (per CTX1).

This contract defines the **canvas shape** so the v1
implementation has a single source of truth across:

- the Builder + Reviewer agent partition,
- the canonical contracts the canvas consumes,
- the readiness gates the canvas honors,
- the deliverable contract the canvas hands off to.

The contract is not the canvas itself. The contract is the
specification the canvas must satisfy.

### What this contract does

- Names the canvas route candidates and marks each as **proposed**.
- Names the primary user.
- Names the agent roles on the canvas with explicit responsibility.
- Enumerates the canvas sections in canonical order.
- Defines the same-canvas interaction model (drawers, transitions,
  no full-page navigation).
- Defines versioning and approval / lock state.
- Defines handoff to the deliverable renderer.
- States the no-live-model v1 rules.
- Names the future slices that implement the canvas.
- States the no-fabrication rules the canvas must obey.

### What this contract does not do

- Does not specify CSS, component composition, or layout pixels.
  Those land in DES2 and SOL9.
- Does not specify a database schema. The canvas reads from
  existing canonical read models.
- Does not invoke the model gateway (MG1). v1 is deterministic.
- Does not implement the deliverable renderer. SOL12 owns that.

---

## §B · Canvas route candidates

The canvas surfaces under the tenant route family. **All routes
listed below are proposed and not yet implemented.** SOL9
implements the index and canvas routes; SOL10 / SOL11 / SOL12
extend with sub-canvases.

### B.1 — `/tenant/[tenantSlug]/solutions`

**Proposed.** The index of the tenant's authored solutions. Lists
each solution by `solutionKey`, archetype reference, primary
problem, version, readiness state, and last-touched timestamp.
Index entries are read-only summaries; the canvas is reached by
clicking an entry.

### B.2 — `/tenant/[tenantSlug]/solutions/[solutionKey]`

**Proposed.** The Solution Intelligence Canvas — this contract.
One canvas per `solutionKey`. All ten canvas sections (per §E)
render here. All same-canvas interaction (per §F) is rooted here.
This is the only route that may mutate solution state in v1.

### B.3 — `/tenant/[tenantSlug]/solutions/[solutionKey]/architecture`

**Proposed.** An architecture sub-canvas. Renders the composed
architecture (per SOL10 read model) at full fidelity for
review-mode use. The sub-canvas is a deeper view of canvas section
§E.5; it is not a separate composition surface and does not
duplicate canvas state.

### B.4 — `/tenant/[tenantSlug]/solutions/[solutionKey]/build-buy-partner`

**Proposed.** A decision sub-canvas. Renders the SOL6 evaluator
output for the composed components at decision fidelity. The
sub-canvas is a deeper view of canvas section §E.7; it does not
fork canvas state.

### Routing constraints

- The `[tenantSlug]` segment is authoritative; cross-tenant viewing
  is forbidden.
- The `[solutionKey]` segment is opaque and stable; renaming a
  solution does not change its key.
- Sub-canvases (B.3, B.4) are reachable only from the canvas (B.2),
  never from the index (B.1) directly. This preserves the
  single-canvas model.

---

## §C · Primary user

The primary user of the Solution Intelligence Canvas is one of:

- **Client Maestro** — the client-side architect or program lead
  who is composing the solution for their own organization.
- **AbarVa Maestro** — the AbarVa-side architect partnering with
  the client.
- **Solution Architect** — a domain SME (PDLC / Analytics /
  Healthcare) who composes or refines the solution at workshop
  fidelity.

All three share the same canvas, the same drawers, and the same
mutation surface. Role-specific affordances (e.g., Steward
approval) are gated by per-user role checks, not by separate
canvases.

The canvas is **not** for executive consumption. Executive
posture surfaces in the AI Control Tower per Atlas (see §D.4).
The canvas is the working surface; the Tower is the briefing
surface.

---

## §D · Agent roles on this canvas

The canvas is shared by four agents. Each agent has an explicit,
non-overlapping responsibility. Agents do not impersonate each
other on this surface.

### D.1 · Nexus — composition lead

Nexus is the **composition lead**. Nexus assembles:

- the selected **archetype** (SOL3),
- the relevant **components** (SOL2 / SOL4 / SOL5),
- the captured **workshop findings** (MW1 / MW2),
- the **evidence** (EVID1 `usable_as_evidence`),
- the tenant's **current-state inputs** (CTX1),

into a draft solution architecture per the SOL1 composition flow.
In v1, Nexus composition is **deterministic** — no model calls
during composition. Any "Composed by Nexus" label on the canvas
must clarify "deterministic seed" until the model gateway lands
(see §I).

Nexus does not approve. Nexus does not refuse. Nexus drafts.

### D.2 · Sentinel — validation

Sentinel is the **validation** voice on the canvas. For each
draft, Sentinel:

- flags **failure modes** that apply to the composition per the
  PF1 pattern pack,
- surfaces **patterns** observed across the tenant per the I1
  read model,
- ties each flag to canonical PF1 / I1 keys (no ad-hoc strings).

Sentinel commentary appears in canvas section §E.3 (Patterns
used) and as inline marks on §E.5 (Architecture components).
Sentinel does not block; Sentinel informs.

### D.3 · Steward — readiness enforcement

Steward is the **readiness enforcement** voice on the canvas.
Steward:

- consumes the canvas readiness state per MW2,
- refuses to advance the canvas to deliverable when **hard
  inputs** are missing or evidence is **unusable**,
- emits explicit refusal language: "Steward refuses approval — N
  hard inputs missing".

Steward does not compose. Steward does not draft. Steward gates.
The canonical missing-inputs list per §E.10 is the authoritative
source for Steward refusal.

### D.4 · Atlas — executive implication

Atlas is the **executive implication** voice. Atlas does not
compose on the canvas. Atlas surfaces, in the tenant's AI Control
Tower (per ACT1), the portfolio-level posture for this solution:
how it relates to other solutions in flight, what executive
narrative it advances, what cross-program risk it carries.

Atlas commentary may render in a canvas drawer (read-only) but
never mutates canvas state.

### Role partition summary

| Agent    | Canvas role              | Mutates state? | Refuses? |
|----------|--------------------------|----------------|----------|
| Nexus    | Composition lead         | Yes (draft)    | No       |
| Sentinel | Validation               | No (annotates) | No       |
| Steward  | Readiness enforcement    | Yes (gate)     | Yes      |
| Atlas    | Executive implication    | No (read-only) | No       |

---

## §E · Canvas sections (in order)

The canvas presents ten sections in canonical order. Section
order is load-bearing — top-to-bottom is the composition flow.
SOL9 implements this rendering; this contract names the sections
and their semantics.

### E.1 · Solution brief

The brief carries:

- `title` — the human-readable solution title,
- `archetypeRef` — the SOL3 archetype reference (key),
- `sector` — the tenant sector (financial services, healthcare,
  retail, etc.),
- `primaryProblem` — one-paragraph statement of the primary
  problem the solution addresses.

The brief is editable by Client Maestro / AbarVa Maestro /
Solution Architect. The archetype reference is set once at
solution creation and changes only by creating a new version
(per §G).

### E.2 · Current-state inputs

Renders the tenant's current-state context per CTX1. Each input
has a status:

- `present` — captured and usable,
- `partial` — captured but incomplete,
- `missing` — not captured.

Missing inputs render as **missing-input chips** (per CTX1) so
the user can act on them in place. The canvas links each missing
chip to the workshop or capture surface that would resolve it.

### E.3 · Patterns used

Lists the Sentinel pattern keys (I1) and relevant failure modes
(PF1) that apply to this solution. Each entry is a canonical key
with a one-line gloss. Sentinel populates this section; the user
may pin or unpin entries but cannot fabricate keys.

### E.4 · Archetype selected

Renders the SOL3 archetype reference plus rationale. Rationale is
a short authored note from the composer ("Selected because the
tenant has X current-state posture and Y target outcome"). The
archetype's metadata is shown in a drawer per the SOL7 detail-view
rules (per §F).

### E.5 · Architecture components

The composed architecture. Components are drawn from:

- the SOL3 archetype's `architectureBuildingBlocks` field,
- plus the SOL2 / SOL4 / SOL5 component packs as relevant to the
  archetype's sector and problem class.

Each component carries:

- canonical key (e.g., `pdlc.dora_telemetry`),
- name and definition (from the pack),
- inclusion rationale (authored at composition time),
- linked workshops (from §E.6),
- linked failure modes (from §E.3 via Sentinel),
- linked evidence (per EVID1).

The architecture composition is deterministic in v1; the canvas
shows components in canonical pack order, not in composer-chosen
order.

### E.6 · Workshops required

Lists the workshops the solution requires per MW1, with status:

- `not_yet_scheduled` — workshop identified but no date set,
- `scheduled` — workshop on the calendar with date and attendees,
- `completed` — workshop run and findings captured.

Status reads from the MW2 readiness model. The canvas does not
schedule workshops; it shows the state and links to the workshop
surface.

### E.7 · Build / buy / partner decision

Per the SOL6 evaluator. For each component (or component cluster)
the canvas renders the evaluator output:

- recommended posture (`build` / `buy` / `partner`),
- rationale,
- governance warnings (surfaced in §E.8),
- alternatives considered.

The user may override the evaluator recommendation with an
authored note; the override and its rationale are versioned per
§G.

### E.8 · Risks / governance

Risks come from:

- the SOL3 archetype's risk register,
- the SOL2 / SOL4 / SOL5 component pack risks per included
  component,
- the SOL6 evaluator's governance warnings.

Each entry carries severity (`low` / `medium` / `high`),
mitigation, and owner. No fabricated severities; severities come
from the source contracts.

### E.9 · Deliverables

Lists the deliverables the solution will produce, per:

- the SOL3 archetype's deliverable list,
- the PDEL render-mode inventory.

Each deliverable carries the OUT1 render mode (`html` is the only
mode produced in v1; see §H). The canvas shows deferred modes as
**deferred** (not as missing).

### E.10 · Missing inputs

The canonical list of missing inputs that block the canvas from
advancing to deliverable. This list is the authoritative source
for Steward refusal (per §D.3). Each entry carries:

- input key (canonical CTX1 / EVID1 key),
- severity (`hard` blocks; `soft` warns),
- resolution path (workshop, capture surface, or evidence link).

Steward consumes this list directly; no other section is
consulted for refusal logic.

### Section order is canonical

The ten sections render top to bottom in the order above. SOL9
must not reorder. A composer reading the canvas top-to-bottom is
walking the SOL1 composition flow.

---

## §F · Same-canvas interaction model

The canvas is **one surface**. The user does not navigate
between sections; the user opens drawers from the canvas.

### F.1 · Drawer behavior

- Clicking any section header or any entry within a section opens
  a side drawer.
- The drawer is anchored to the canvas; canvas state is preserved
  while the drawer is open.
- Only **one drawer at a time** is open. Opening a second drawer
  closes the first.
- Drawer transitions use a **120ms fade**. No slide animations,
  no overlays, no full-screen takeovers.
- Closing the drawer returns the user to the same scroll position
  on the canvas.

### F.2 · No full-page navigation

Users do not navigate full-page between canvas sections. The
canvas is a single route (per §B.2). Sub-canvases (per §B.3 and
§B.4) are deeper views, not alternative compositions; they read
the same canvas state.

### F.3 · Drawers compose from canonical contracts

Drawers do not invent content. They render canonical contract
data:

- archetype detail drawer renders the **SOL3 detail view per
  SOL7**,
- component detail drawer renders the **SOL2 / SOL4 / SOL5
  component metadata** (whichever pack the component comes from),
- build/buy/partner drawer renders the **SOL6 evaluator output**,
- workshop drawer renders the **MW1 / MW2 workshop record**,
- evidence drawer renders the **EVID1 evidence trail**,
- pattern drawer renders the **I1 pattern detail** (per I3).

Drawers are read-mostly. The only mutation a drawer permits is
pinning / unpinning, authoring inclusion rationale, or capturing
an override; all such mutations version the canvas per §G.

### F.4 · No modals over the canvas

The canvas does not use modals for content. Modals are reserved
for confirm-style interactions (e.g., "Confirm new version?") and
must not contain canvas state.

---

## §G · Versioning

Each canvas has a `version: string` field and a
`versions: readonly DeliverableVersion[]` history.

### G.1 · What creates a new version

A new version is created when any of the following changes:

- the **archetype** reference (§E.4),
- the **architecture components** set (§E.5),
- the **build/buy/partner decision** (§E.7),
- the **deliverables list** render-mode set (§E.9).

A new version is **not** created for cosmetic edits (rationale
text tweaks, drawer pin/unpin). Those increment a `revision`
counter under the same version.

### G.2 · OUT1 alignment

Versioning follows the OUT1 contract. Each version carries:

- `version` — semver-style or monotonically increasing label,
- `createdAt` — ISO timestamp,
- `createdBy` — author user ref,
- `summary` — one-line authored note describing what changed,
- `provenance` — references to the contracts that changed
  (archetype ref, component keys added/removed, etc.).

### G.3 · Approval and lock state

Approval lands per Steward (per §D.3). When Steward approves a
version:

- the version is **locked** — immutable from that point,
- the lock state is **auditable** per AUD1 (who approved, when,
  with what missing-inputs posture),
- subsequent edits create a **new version** in `draft` state; the
  approved version remains intact.

Approval does not delete prior versions. The full version history
is retained.

### G.4 · Immutability

Once approved:

- no field on the locked version may change,
- no component may be added or removed from the locked version,
- no override note on the locked version may change.

To change an approved canvas, the composer creates a new version
(which inherits from the locked version and is then edited).

### G.5 · Steward refusal does not roll back

If Steward refuses approval (per §D.3 missing-inputs check), the
canvas remains in `draft` state at its current version. Refusal
is recorded but does not mutate the version. The composer
resolves missing inputs and re-requests approval.

---

## §H · Handoff to deliverable renderer

The canvas is composed for one purpose: to produce a
decision-grade deliverable. This section defines the handoff.

### H.1 · Trigger

The handoff fires when **both**:

- the canvas reaches **`usable` readiness** per MW2, and
- a **Steward approval** lands on the current version (per §G.3).

If either is absent, the handoff does not fire and no deliverable
is produced.

### H.2 · Producer

**Nexus** produces the deliverable. The deliverable is composed
deterministically from the locked canvas version; no model calls
during deliverable composition in v1 (see §I).

### H.3 · Render mode

The v1 deliverable is rendered in **`html`** mode per the OUT1
render-mode contract. Other render modes are deferred:

- `markdown` — deferred,
- `pdf_export_later` — deferred,
- `docx_export_later` — deferred,
- `ppt_export_later` — deferred.

The canvas shows deferred modes in §E.9 with the `deferred`
label, not as missing or in-progress. Deferred modes are honest;
they are named, ordered, and explicitly out of scope for v1.

### H.4 · Deliverable contract

The deliverable produced is OUT1-compliant:

- carries provenance to the locked canvas version,
- carries the canvas's missing-inputs posture at the time of
  approval,
- carries Sentinel's pattern / failure-mode annotations,
- carries the Steward approval record,
- carries the build/buy/partner decision rationale.

The deliverable is the artifact the steering committee sees. The
canvas is the surface that produced it. The two are linked by the
locked version.

### H.5 · No partial handoff

The canvas does not produce partial deliverables. The handoff is
all-or-nothing: a complete `html` deliverable for the locked
version, or no deliverable. There is no "draft deliverable"
artifact in v1.

---

## §I · No-live-model v1 rules

The v1 canvas is **deterministic**. This section makes the rules
explicit so neither composer nor implementer assumes otherwise.

### I.1 · Deterministic composition

The canvas reads from:

- **SOL3** — the archetype catalog,
- **SOL2 / SOL4 / SOL5** — the component packs,
- **SOL6** — the build/buy/partner evaluator,
- **MW2** — the workshop readiness model,
- **PDEL** — the deliverable inventory.

All five sources are deterministic. Given the same inputs, the
canvas produces the same composition. There is no randomness, no
sampling, no temperature.

### I.2 · No model calls during composition

The v1 canvas does **not** call:

- the model gateway (MG1),
- any LLM directly,
- any embedding service,
- any retrieval-augmented generation pipeline.

LLM enrichment is **deferred to v2** and lands inside the
dedicated Nexus runtime, not on this canvas directly. The v2
enrichment is a refinement layer over the v1 deterministic
composition; it does not replace the deterministic seed.

### I.3 · "Composed by Nexus" labeling

Any "Composed by Nexus" label on the canvas **must** clarify
**"deterministic seed"** until the model gateway is wired. The
label reads, for v1:

> Composed by Nexus (deterministic seed)

The label may not read simply "Composed by Nexus" without
qualification. The qualification is removed only when:

- the model gateway lands per MG1,
- the v2 enrichment layer is wired through Nexus runtime,
- the canvas is updated in a versioned slice that names the
  change.

### I.4 · No fabricated reasoning chains

Because v1 is deterministic, the canvas does not display
"reasoning chains" or "thought process" content. Every authored
note on the canvas comes from a human composer; no synthetic
prose appears under a Nexus byline.

### I.5 · Auditability

The deterministic v1 composition is **auditable**: given the
canvas state and the source contract versions, the composition
can be reproduced exactly. This is a feature, not a constraint;
auditability is the v1 trust contract.

---

## §J · Future slices

The canvas implementation lands across four future slices. This
contract is the spec they all consume.

### J.1 · SOL9 — Solution Canvas UI

Builds the actual `<SolutionCanvas>` component using AbarVa
primitives (DES2). SOL9 implements:

- the canvas route (§B.2),
- the index route (§B.1),
- the ten canvas sections (§E),
- the same-canvas drawer interaction (§F),
- the version history surface (§G).

SOL9 does not implement the deliverable renderer; that is SOL12.
SOL9 does not implement the architecture composition logic; that
is SOL10.

### J.2 · SOL10 — Architecture Draft Read Model

Pure helper that composes a draft architecture from:

- the selected archetype (SOL3),
- the selected components (SOL2 / SOL4 / SOL5),
- the captured workshop findings (MW2).

SOL10 is a deterministic read model — no I/O, no mutations, no
model calls. SOL10 powers canvas sections §E.5 (Architecture
components) and §B.3 (architecture sub-canvas).

### J.3 · SOL11 — Workshop-to-Architecture Refinement

Feeds MW2 workshop notes into the architecture draft. SOL11 lands
in two phases:

- **Phase 1** — deterministic merge: workshop findings update
  component inclusion rationale and missing-input posture by
  canonical key match.
- **Phase 2** — LLM-assisted refinement: the model gateway (MG1)
  proposes refinement deltas; the composer accepts or rejects
  per delta.

Phase 1 is the v1 scope; Phase 2 is deferred per §I.

### J.4 · SOL12 — Architecture Deliverable Renderer

Emits the final `html` deliverable that consumes the canvas state
and produces an OUT1-compliant artifact. SOL12 implements:

- the deterministic composition pipeline from locked canvas
  version to OUT1 deliverable,
- the `html` render mode,
- the provenance trail per §H.4.

SOL12 does not implement deferred render modes (per §H.3).

### Future slice ordering

The canonical implementation order is:

1. **SOL9** — UI shell (so composers have a surface),
2. **SOL10** — read model (so the UI has data),
3. **SOL11** — workshop refinement Phase 1 (so workshops affect
   the canvas),
4. **SOL12** — deliverable renderer (so canvas produces decision
   artifacts),
5. **SOL11 Phase 2** — LLM-assisted refinement (deferred per §I).

---

## §K · No-fabrication rules

The canvas is decision-grade. Decision-grade means honest. This
section enumerates the no-fabrication rules the canvas must
obey. These rules are non-negotiable; a v1 implementation that
violates any of them is non-compliant.

### K.1 · No fabricated dollar amounts

The canvas must **not** display dollar amounts (savings, costs,
ROI, deal sizes, headcount-cost-equivalents) unless those amounts
trace to a tenant-specific evidence record per EVID1.

If the source contract (archetype, component, evaluator) carries
no dollar amount for the tenant in front of the composer, the
canvas displays no dollar amount. There is no "illustrative
example" of a dollar amount on the canvas. Illustrative is
fabrication.

### K.2 · No fabricated evidence citations

Every evidence citation on the canvas must trace to an EVID1
record marked `usable_as_evidence`. The `E-###` citation format
is reserved for canonical evidence; any `E-###` shown on the
canvas must resolve to a real EVID1 record.

If a component, archetype, or decision lacks usable evidence, the
canvas surfaces that as a **missing input** per §E.10, not as a
placeholder citation.

### K.3 · No fabricated vendor endorsements

The canvas must **not** name vendors, products, or platforms in
build/buy/partner recommendations unless those names come from
the SOL6 evaluator's authored vendor catalog. The evaluator's
vendor catalog is the only source of vendor names on the canvas.

There is no "for example, Vendor X" prose on the canvas.
Examples are fabrication.

### K.4 · Missing inputs surfaced explicitly

Missing inputs are **surfaced explicitly** in canvas section
§E.10. They are never:

- papered over with placeholder content,
- approximated from adjacent inputs,
- inferred via cross-tenant aggregation,
- silently omitted from the canvas.

A missing input is a real, named, addressable gap. The composer
sees it; the Steward gates on it.

### K.5 · Honest refusal language

When Steward refuses approval, the canvas displays the explicit
refusal language:

> Steward refuses approval — N hard inputs missing

where N is the count of `hard`-severity entries in §E.10. The
language is not softened to "approval pending" or "ready for
review later". Honest refusal is the contract.

### K.6 · No invented patterns or failure modes

Every pattern key in §E.3 must be a canonical I1 SentinelPatternKey.
Every failure mode key must be a canonical PF1 AiProgramFailureKey.
The canvas does not display ad-hoc pattern strings, custom failure
mode labels, or composer-authored taxonomy entries.

Sentinel populates §E.3 from canonical sources. Composers may pin
or unpin from the canonical list; they may not extend it.

### K.7 · No silent provenance loss

Every component, decision, and risk on the canvas carries
provenance:

- which contract it came from (SOL3 archetype, SOL2/4/5 component
  pack, SOL6 evaluator, MW2 workshop),
- which version of that contract,
- which composer authored the inclusion rationale.

If provenance is unavailable, the entry does not render. Silent
provenance loss is a contract violation.

### K.8 · No "Coming soon" or "TBD" content

The canvas does not render "Coming soon", "TBD", "Lorem ipsum",
or any other placeholder content. Deferred content is named
deferred (per §H.3); missing content is named missing (per §E.10);
absent content is absent. Placeholder text is fabrication.

---

## Document scope summary

This contract is **specification only**. It does not modify
runtime, database, auth, agent runtime, or product UI. Future
slices SOL9, SOL10, SOL11, SOL12 implement the canvas, the
architecture read model, the workshop refinement loop, and the
deliverable renderer respectively.

The canvas is the working surface. The deliverable is the
decision artifact. This contract is the spec that ties the two
together.

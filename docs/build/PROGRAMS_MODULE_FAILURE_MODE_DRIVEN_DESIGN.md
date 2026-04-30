# Programs Module — Failure-Mode-Driven Design (v1)

> **Status.** v1 covers Parts A–D plus P0 fully worked through. v2 adds P1–P6 with the same depth and the cross-program worked-example sweep through Apex CDP, Contact Center AI, AMS Consolidation, Demand Forecasting.
>
> **Audience.** Anand (founder, design lead) + future implementers. The doc must read like a design artifact a senior practitioner would sign off on — not a sales deck and not a sprint backlog. Decisions and tradeoffs are explicit; alternatives considered are written down; gaps between current code and the design are named honestly.
>
> **Pilot-readiness, not demo-readiness.** Every choice in this doc is chosen because it holds up when a real customer runs a real program through the platform. "Demoable today, real later" is not an accepted framing.

---

## Part A — Premise

### A.1 The platform's promise

Most enterprise AI programs fail. Independent research from Gartner, RAND, MIT/BCG, McKinsey, and Forrester converges on a small number of root causes that explain the bulk of those failures. The Programs module's promise is precise: **the platform forces the customer through the success-thinking that prevents each of these failures, at the phase and step where prevention is most efficient.**

Said another way: a phase is not a date range. It is the *forcing function* for a specific subset of failure modes. A step is not a checkbox. It is the agent's *operating doctrine* for the success-thinking the customer must complete to keep that failure mode at bay. The gate is not a button. It is the *evaluator* that confirms — with evidence, not vibes — that the failure mode was addressed before the program is allowed to spend further.

### A.2 The 10 — research-grounded

These are the failure modes the Programs module exists to prevent. Each is cited in at least two of the major firms' published research; the highest-impact ones (data foundation, sponsorship, problem definition, workflow change, measurement) are cited in all five.

| # | Failure mode | Primary prevention phase(s) | Anchoring research |
|---|---|---|---|
| 1 | **Lack of executive sponsorship and ownership** | P0 | McKinsey: high-performer leaders are 3× more likely to demonstrate AI ownership; MIT, Forrester corroborate |
| 2 | **Unclear problem definition or business objectives** | P0, P2 | RAND #1 root cause; MIT: top reason GenAI pilots fail; Gartner cites unclear business value |
| 3 | **Lack of data foundation** (quality, ownership, accessibility) | P1, P2 | Gartner: 43% top obstacle, drives 60% of project abandonments through 2026; RAND #2 |
| 4 | **Lack of right talent and skills** | P0, P1 | Gartner: 35% cite skills/literacy gap; 38% of I&O failures cite skills; Forrester corroborates |
| 5 | **Lack of business commitment to operating-model and workflow change** | P3, P5, P6 | McKinsey: workflow redesign is the single biggest EBIT driver; MIT: integration-into-workflow failure dominates the "GenAI Divide" |
| 6 | **Late attention to governance, privacy, and risk** | P2, P3 | Gartner: inadequate risk controls fuel abandonment; Forrester: governance complexity is rising |
| 7 | **Vendor and build-vs-buy strategy errors** | P3 (sourcing module is the primary surface) | MIT: internal builds succeed only ⅓ as often; Forrester: 75% of self-built agentic architectures fail |
| 8 | **Pilot-to-production scaling gap** | P4, P5 | McKinsey: 73% never get past pilot; MIT: 95% of pilots fail to deliver revenue acceleration |
| 9 | **Inability to measure outcomes and impact** | P1 (baseline), P5–P6 (measurement) | McKinsey: many lack leading KPIs — where they exist, value rises and risk falls; Forrester: only 15% can prove EBITDA gain |
| 10 | **Unrealistic expectations and use-case sprawl** | P0 (entry filter), P6 (closeout) | Gartner: 57% of failed projects "expected too much too fast"; Forrester: dozens of pilots, no prioritization framework |

**The platform's mechanism for prevention** is the combination of:

1. **Phase packs** — universal doctrine; what good looks like for any program in this phase, and which of the 10 it prevents.
2. **Pattern catalog** — program-specific parameterization; what *this archetype* (CDP, AMS Consolidation, Contact Center AI, Demand Forecasting, …) needs at this phase that a generic program does not.
3. **Agent doctrine** — when to ask, when to flag, when to refuse advance; trained on the failure-mode catalog so the agent's behavior is defensible against each of the 10.
4. **Stage gates** — server-side, evidence-based evaluation; cannot be bypassed by chat optimism.
5. **Tenant-admin governance** — approval gates at program creation and at each phase advance; audit trail every actor / time / decision / rationale.
6. **Learning loop** — outcomes harvested into the pattern catalog so the next program of the same archetype starts smarter.

### A.3 Pilot-readiness baseline

These are the floor — every workflow and every feature in this module must satisfy them before pilot:

- **Audit trail.** Every state transition (program lifecycle, gate decision, approval, evidence accrual, file upload) writes an immutable row: actor, timestamp, before/after state, rationale, optional evidence. No state change is unaudited.
- **Multi-tenant isolation.** Every Programs-module table has a `tenant_key` column; Supabase RLS gates reads and writes by tenant. The `apex-retail` ↔ `apexretail` key drift in `feedback_apex_tenant_key_split` is the canonical caution; the design eliminates it by canonicalizing on a single key per tenant at the auth boundary.
- **RBAC.** Five roles: Program Initiator, Tenant Admin, Sponsor, SME (contributor), Viewer. Every API and every UI action checks role × tenant. No action runs solely on chat-side trust.
- **Notifications.** In-app primary; email for approval requests, gate decisions, and overdue prep. No silent state changes that affect another actor.
- **File uploads.** Supabase Storage, RLS-scoped buckets per tenant, mime-type allowlist (PDF, DOCX, XLSX, PPTX, MD, TXT, CSV, PNG/JPG, MP3/MP4 capped at 100MB), virus-scan on upload, retention policy per tenant.
- **Telemetry.** Posthog events for every "the agent flagged failure mode X at phase Y," "evidence accrued against item Z," "gate evaluated pass/fail with reasons R." This is not analytics for us — it is the evidence the customer reviews to see how much success-thinking the platform made them do.
- **Content quality.** Phase packs and pattern seeds are reviewed by a senior practitioner (founder + design partner) and signed off before pilot. No placeholder content. No "we'll fill this in later." The agent is only as good as the doctrine it carries.
- **Observability of agent behavior.** Every agent turn that flags a failure mode, refuses an advance, or surfaces an anti-pattern is logged with enough context to reconstruct *why*. When a pilot customer asks "why did Nexus block our Phase 1 advance," we answer with the exact evidence and the exact rule.

---

## Part B — Module Architecture

### B.1 Workflow map

The Programs module contains eight named workflows. Every change to the module must trace back to one or more of these — and must declare its impact on the *seams* between them.

| # | Workflow | Trigger | Primary actor | Outcome |
|---|---|---|---|---|
| 1 | **Origination** | Program initiator wants to start a new program | Program Initiator | Persisted brief in `draft` → `submitted_for_approval` |
| 2 | **Approval** | Brief submitted | Tenant Admin | `approved` (Phase 0 unlocks) or `rejected` with rationale |
| 3 | **Phase 0 preparation** | Status flips to `approved` | Program Initiator + agent | Sponsor confirmed, value hypothesis seeded, classification chosen, Discovery envelope set |
| 4 | **Phase advancement** | Initiator requests advance | Initiator → Sponsor (gate approver) | Gate evaluated → approved/blocked → next phase active |
| 5 | **In-phase execution** | Phase active | Initiator + SMEs + agent | Steps completed, evidence accrued, anti-patterns flagged or cleared |
| 6 | **Cross-program signals** | Triggered by another program's state, source-event linkage, or shared SME/system | Atlas (portfolio agent) | Dependency or contradiction surfaced; receiving program adapts |
| 7 | **Program completion** | Final phase advance | Initiator + Sponsor | Outcomes settled vs. baseline, learnings harvested into pattern catalog, program → `completed` |
| 8 | **Pause / cancel / pivot** | Mid-flight change | Initiator + Tenant Admin | Status changes (`paused`, `canceled`, `pivoted`); downstream consumers notified |

### B.2 Program state machine

```
            ┌──────────────┐
            │    draft     │     created in /programs/new
            └──────┬───────┘
                   │ submit_for_approval
                   ▼
       ┌──────────────────────┐
       │ submitted_for_approval│  tenant admin queue
       └──────────┬───────────┘
        approve   │   reject (with rationale)
                  │
        ┌─────────┴────────────────────────────┐
        ▼                                      ▼
  ┌──────────────┐                       ┌─────────────┐
  │  approved    │  Phase 0 unlocks      │  rejected   │
  └──────┬───────┘                       └─────────────┘
         │ enter_phase_0
         ▼
  ┌──────────────┐  advance     ┌──────────────┐  ...
  │  P0_active   │ ───gate───►  │  P1_active   │ ──► ... ──► P6_active
  └──────┬───────┘              └──────┬───────┘
         │                             │
         │ pause | cancel | pivot      │ (any phase)
         ▼                             ▼
  ┌──────────────┐                ┌──────────────┐
  │   paused /   │                │  completed   │
  │  canceled /  │                │  (P6 done +  │
  │   pivoted    │                │  outcomes    │
  └──────────────┘                │  settled)    │
                                  └──────────────┘
```

**Transition rules:**

- Every transition records `actor`, `timestamp`, `from_state`, `to_state`, `rationale`, `evidence_refs`.
- `submit_for_approval` requires the brief to satisfy the **soft floor** (the 6-8 fields, see Part D). Hard checks are deferred to gate evaluation; the brief just needs to be coherent.
- `approve` / `reject` is restricted to the Tenant Admin role.
- `enter_phase_N+1` requires `evaluateGate(fromPhase=N, toPhase=N+1)` to return `pass: true`, OR `requiresApproval: true` with a successful Sponsor (or Tenant Admin) approval for soft-fail bypass with rationale.
- `pause` is reversible (`resume`); `cancel` is terminal; `pivot` requires re-approval (back to `submitted_for_approval`).

**What's already in code:** `governance.evaluateGate` (server-side per-check evaluation) and `requestFounderApproval` / `decideApproval` (approval workflow plumbing) already exist. The state machine extends them with explicit pre-Phase-0 approval (new) and the `paused`/`canceled`/`pivoted` branch (new).

### B.3 Actor / RBAC model

| Role | Authority | Surfaces |
|---|---|---|
| **Program Initiator** | Create draft, submit for approval, drive in-phase execution, request advance, upload evidence, propose pivot/pause/cancel | `/programs/new`, `/programs/<id>` |
| **Tenant Admin** | Approve/reject program creation, audit any program in tenant, force pause/cancel, override gate decisions with rationale | `/admin/approvals`, `/admin/audit`, `/programs/<id>` (read+intervene) |
| **Sponsor** | Gate-review approval at each phase advance; receive notifications on flagged anti-patterns, blocked gates, outcome settlement | `/programs/<id>` (approver mode), email |
| **SME (Contributor)** | Upload evidence, attend workshops, contribute to specific deliverables; cannot advance phases or sign off gates | `/programs/<id>/workshops`, `/programs/<id>/deliverables/<id>` |
| **Viewer** | Read-only access to a specific program (e.g. board observer, partner consultant) | `/programs/<id>` (read-only) |

**Cross-cutting:**

- All five roles are tenant-scoped. There is no cross-tenant role at the Programs-module level.
- Every API call carries `(actor_id, tenant_key, role)`; every database row checks against RLS policies that match this tuple.
- Role assignments are auditable; `engagement_participants` already carries `approval_authority` — extend with explicit `role` and `assigned_by` / `assigned_at`.

### B.4 Cross-cutting concerns

- **Audit log.** New table `program_audit_log` (id, tenant_key, program_id, actor_id, role, action, from_state, to_state, rationale, evidence_refs[], created_at). Every workflow writes here. Read-only after write.
- **Evidence registry.** Existing `evidence` table (ContextBroker citations) is the durable surface; programs reference evidence by id. New: `phase_evidence_links` join table tying evidence → phase_pack_evidence_item_id, so the gate evaluator can resolve "did we accrue evidence for `baseline-captured`?" without scanning text.
- **Notifications.** New table `program_notifications` (id, tenant_key, program_id, recipient_user_id, kind, body, link, created_at, read_at). Email mirror via Resend or Postmark for approval / gate / overdue events.
- **File uploads.** New Supabase Storage bucket `program-attachments` per tenant (RLS gated by `tenant_key` extracted from path prefix). Mime allowlist enforced server-side. Each upload writes a row in `program_attachments` (program_id, phase, step_id, deliverable_id?, original_name, storage_path, uploader_id, mime, size_bytes, sha256, created_at).
- **Telemetry events.** Posthog events: `program.created`, `program.submitted`, `program.approved/rejected`, `phase.entered`, `phase.gate_evaluated`, `phase.advanced`, `phase.advance_blocked`, `evidence.accrued`, `anti_pattern.flagged`, `anti_pattern.cleared`, `failure_mode.surfaced`, `attachment.uploaded`, `program.paused/resumed/canceled/completed`.

---

## Part C — The Expert Knowledge Layer

This is the doctrine the agent carries. The platform's promise is only as good as this layer.

### C.1 Phase packs (universal, pattern-agnostic)

**What exists.** Seven packs — `P0_originate.ts` through `P6_operate.ts` — implementing the `PhasePack` contract in `src/lib/programs/phase-packs/types.ts`. Each pack carries:

- `outcome` — one paragraph: what good looks like for this phase, in senior-practitioner voice.
- `definitionOfDone` — array of evidence items, each with `id`, `label`, `severity` (hard/soft), `evaluationHint`. The hint tells the agent how to recognize the evidence, not just that it should exist.
- `rightQuestions` — three arcs: `open` / `converge` / `close`. Each question carries `text`, `why`, `expectedAnswerShape` so the agent knows when the question is satisfied.
- `antiPatterns` — array of failure modes with `detectionHint` (observable signal), `whatToFlag`, `mitigation`.
- `coachingArc` — entry / mid-phase / exit posture.
- `dependencies` — `requiresFromPrior` and `producesForNext`, the seed for next-phase primer.

**What v1 of this design adds.**

- **Failure-mode tagging.** Every `definitionOfDone` item, every anti-pattern, and every `rightQuestion` gains an optional `preventsFailureModes: number[]` field referencing the 10. Telemetry rolls up "this phase prevented failures #1, #2, #4 in this program."
- **Step decomposition.** A new `steps: PhaseStep[]` field. Each step carries `id`, `label`, `complexity: 'simple' | 'complex'`, `agentRole: AgentStepRole`, `inputs[]`, `outputs[]`, `templateRefs[]`, `preventsFailureModes[]`. (Detailed in C.4 below.)
- **Template links.** Each step references templates from the deliverables library (see C.5).

The existing pack content is largely correct — it does not need to be rewritten. The contract gains new fields; the content gets *annotated* with failure-mode tags and *decomposed* into steps.

### C.2 Pattern catalog (program-specific parameterization)

**What exists.** `LifecyclePatternSeed` in `src/lib/intelligence/seed-types.ts` (referenced by P0 outcome text — `PAT-PRG-CDP-001`, `PAT-PRG-AI-CODING-001`, `PAT-PRG-COPILOT-001`, `PAT-PRG-CC-AI-001`, `PAT-PRG-DATA-FAB-001`, etc.). Each pattern carries archetype-specific knowledge: failure modes, contradiction templates, lifecycle expectations.

**The parameterization model.** A program in P1 Discovery needs *some* baseline KPI. *Which* baseline depends on the archetype:

- **CDP:** identity-match rate, fragmentation index, consent posture
- **AMS Consolidation:** application count, run-rate cost, integration debt
- **Contact Center AI:** intent inventory, automation containment, AHT, CSAT
- **Demand Forecasting:** forecast accuracy (MAPE/WAPE), inventory turn, stockout rate

The phase pack defines the *requirement* ("baseline KPI captured with provenance"). The pattern catalog supplies the *parameter* (which KPI, which template, which workshop). At runtime the agent composes them.

**What v1 of this design adds.**

- A **typed parameterization schema** on `LifecyclePatternSeed`: each pattern declares per-phase parameters (`p1.baselineMetrics: Metric[]`, `p1.dataAssetsRequired: DataAsset[]`, `p2.optionsToWeigh: Option[]`, etc.). These slots are typed so the agent and the gate evaluator can both consume them.
- An explicit **`smesNeeded[]` per phase per pattern** — names of roles (CIO, Data Engineer, Privacy Counsel, WFM Lead, Vendor Manager) the program needs at this phase. Drives the Phase 0 primer's "team you'll need" section.
- An explicit **`workshopsRecommended[]` per phase per pattern** — facilitated session formats with template references. Drives the agent's complex-step coaching.

### C.3 The 10 failure-mode catalog (cross-cutting tagging)

**New artifact:** `src/lib/programs/failure-modes.ts` — a single source of truth for the 10. Each entry has:

```ts
interface FailureMode {
  id: number;                    // 1..10
  name: string;                  // "Lack of executive sponsorship"
  shortDescription: string;
  primaryPhases: PhaseNumber[];
  researchAnchors: ResearchCitation[];  // Gartner, RAND, MIT, McKinsey, Forrester refs
  preventionMechanism: string;   // how the platform prevents this
}
```

This catalog is the spine. Every anti-pattern in every phase pack tags which of the 10 it detects. Every gate criterion tags which it gates. Every telemetry event tags which is being surfaced or cleared.

**Why this matters at pilot.** When a pilot customer asks "what value is the platform giving us" or "why did Nexus block our advance," the answer rolls up to the 10. The customer reads them. They are the contract.

### C.4 Agent doctrine — `PhaseStep`

The `PhaseStep` type is new. It is the unit at which the agent decides *what to do next*.

```ts
type StepComplexity = 'simple' | 'complex';

type AgentStepRole =
  | 'extract'              // pull a single fact from chat (sponsor name, timeline)
  | 'validate'             // test a claim against expected shape (is the sponsor real?)
  | 'coach_workshop'       // help the user prepare/run a workshop (intent → plan → template → capture)
  | 'coach_interview'      // 1:1 stakeholder interview (sponsor 1:1, SME interview)
  | 'coach_baseline'       // help the user gather baseline data (archetype-specific metric)
  | 'evaluate_evidence'    // judge whether uploaded evidence satisfies a DoD item
  | 'request_approval'     // ask sponsor / tenant admin to sign off
  | 'flag_anti_pattern'    // proactively surface a failure-mode signal
  | 'compose_artifact';    // produce a deliverable (charter, design spec, outcome report)

interface PhaseStep {
  id: string;                          // kebab-case, stable
  label: string;
  complexity: StepComplexity;
  agentRole: AgentStepRole;
  inputs: string[];                    // what the step consumes (e.g. 'sponsor_candidate', 'baseline_metric_choice')
  outputs: string[];                   // what the step produces (evidence ids it writes)
  templateRefs: string[];              // references to deliverables-library template ids
  preventsFailureModes: number[];      // 1..10 from the catalog
  intentCaptureRequired: boolean;      // for complex steps: capture user's intent before they run the off-platform work
  postMeetingUploadExpected: boolean;  // for complex steps: agent expects a file/notes upload after the meeting
}
```

**Simple vs. complex.** A simple step is resolvable inside the chat in a few turns ("name your sponsor," "pick the first cohort"). A complex step requires off-platform work — a stakeholder workshop, a sponsor 1:1, a data-quality assessment — and the agent's role shifts: capture intent and plan *before* the meeting; expect notes/data upload *after* the meeting; validate the captured output against the step's `outputs`.

**Intent capture for complex steps.** When the agent recognizes a complex step, it does *not* try to extract the answer in chat. Instead:

1. Captures **intent**: "What are you trying to learn from this workshop?"
2. Captures **plan**: who attends, agenda, expected outputs.
3. Hands over **template**: the agent surfaces the right deliverable-library template (e.g. "data-discovery workshop facilitator guide").
4. **Schedules expected upload**: the agent tells the user "after the workshop, upload notes here. I'll evaluate them against [DoD items]."
5. **Validates after upload**: when the upload arrives, the agent reads (or asks the user to summarize) the output, evaluates against expected shape, marks the DoD item met / unmet / partial.

This is the loop that makes the platform feel like a senior practitioner walking alongside the program lead — not a chatbot collecting form fields.

### C.5 Templates

**What exists.** `deliverable-canvas-view.ts`, `deliverable-export-contract.ts`, and the deliverables library scaffolding — programs already have deliverable types per phase (charter, design_spec, execution_plan, outcome_report).

**What v1 of this design adds.** A new typed `Template` registry, scoped per archetype × phase × step:

```ts
interface Template {
  id: string;                          // 'tmpl:cdp:p0:value-hypothesis-seed'
  archetype: PatternId | 'universal';
  phase: PhaseNumber;
  stepId?: string;
  kind: 'document' | 'workshop_facilitator_guide' | 'interview_script' | 'capture_template' | 'spreadsheet';
  title: string;
  description: string;
  storagePath: string;                 // where the template lives in Supabase Storage
  exportableHtml: boolean;             // can render the filled-in version as HTML for download
}
```

The agent surfaces templates inline ("I'll use the CDP P1 data-discovery facilitator guide; here's the link") and the user downloads them. After the workshop, the user uploads the filled-in capture template and the agent evaluates.

### C.6 Agent training (system-prompt composition)

Already implemented in `src/app/api/chat/agent/route.ts`. Layered:

1. Voice line (Nexus / Sentinel / Atlas / Steward)
2. User context (Layer 0 — who is the user)
3. Four-layer reasoning + scope policy + integrity contract
4. Artifact channel instructions (when surface has reactive workspace)
5. Tenant context (PR-R — executive bench + program inventory; on /programs surfaces only)
6. Phase pack (when on /programs/<id> with an active phase pack)
7. Page context (tenant, surface, stage, program data)
8. Response guidelines (PR-S — prose over code blocks, names over IDs, ≤3 bullets)
9. Tenant demo block (legacy — Apex-specific context for Apex tenant)

**What v1 of this design adds.**

- **The 10 catalog as a system-prompt block** — universal, on every Programs surface for every Programs agent. The agent always knows the failure modes it exists to prevent.
- **PhaseStep doctrine block** — when in an active phase, the prompt names the current step the agent should be working on (selected from the phase pack's step list, advanced as evidence accrues), with the simple/complex classification and the intent-capture / post-meeting-upload expectations.
- **Failure-mode-flagging directive** — explicit rule: "when you detect a failure-mode signal, emit an `anti-pattern-flag` artifact tagged with the failure-mode number; do not bury it in prose." Closes the gap where the agent currently flags inconsistently.

---

## Part D — Phase-by-Phase Design Template

Every phase section in this doc (and in the implementation that follows) follows the same structure:

1. **Failures prevented** — which of the 10 this phase exists to address
2. **What good looks like (universal)** — the phase pack's `outcome` + hard `definitionOfDone` items
3. **Parameterized program-specific** — what the pattern catalog supplies for each archetype
4. **Steps** — the `PhaseStep[]` decomposition, simple vs. complex, agent role, templates, intent capture
5. **Stage gate** — server-side evaluation (`governance.evaluateGate`), approver role, hard vs. soft fails, bypass rules
6. **Next-phase primer** — handoff content rendered when the phase closes
7. **Brainstorm — design alternatives considered** — at least two alternatives explored, the chosen one, the rationale, the explicit tradeoff
8. **Worked example scenarios** — for each of 4 example programs (CDP, Contact Center AI, AMS Consolidation, Demand Forecasting), the user's likely opening, the agent's *desired* doctrine-grade response, the agent's *actual* current behavior, and the design delta

P0 is fully written below. P1–P6 follow the same structure in v2.

---

## P0 — Originate (fully worked)

### D.0.1 Failures prevented

| # | Failure mode | Why P0 is the right phase to prevent it |
|---|---|---|
| 1 | Lack of executive sponsorship and ownership | The phase exists *to* surface a real sponsor candidate. If P0 closes without a named, plausibly-authoritative sponsor, the program will fail later regardless. |
| 2 | Unclear problem definition or business objectives | P0's value-hypothesis-seed and first-cohort question force the program out of slogan language into a testable claim before Discovery spend begins. |
| 4 | Lack of right talent and skills | Pattern + classification → `smesNeeded` for Discovery; P0 must name the SMEs before Phase 1 starts. |
| 10 | Unrealistic expectations and use-case sprawl | P0's "first cohort" question and the Tenant Admin approval are the platform's filter against vague enterprise-wide aspirations. |

### D.0.2 What good looks like (universal)

From the existing P0 phase pack `outcome`:

> A Discovery-ready program seed: a named sponsor candidate with plausible decision rights, a value hypothesis seed that states the target cohort, behavior change, expected direction of value, and causal mechanism, plus a classification that selects the program pattern, business domain, risk posture, and evidence family for P1. P0 is not done when someone likes the idea. It is done when the idea is specific enough to investigate, owned enough to fund Discovery, and classified enough that Nexus knows what evidence P1 must collect.

**Hard `definitionOfDone` items** (already coded):

- `program-seed-recorded` — pattern/classification field non-null and aligned to a real `PAT-PRG-*` id.
- `value-hypothesis-seed` — names target cohort, behavior change, expected direction, causal mechanism.
- `sponsor-candidate-named` — `engagement_participants` row with plausible authority; not "the CIO office."

**Soft items:**

- `discovery-funding-envelope` — budget/capacity/time-box for Discovery (provisional OK).
- `initial-scope-boundary` — first cohort named.
- `evidence-family-selected` — Discovery evidence type selected (paramaterized by pattern; see D.0.3).

### D.0.3 Parameterized program-specific

| Pattern | Sponsor archetype | First-cohort examples | Discovery evidence family |
|---|---|---|---|
| **CDP** (`PAT-PRG-CDP-001`) | CDO / CMO with martech budget authority | One customer-data use case (e.g. cross-channel identity for top loyalty cohort) | Identity fragmentation baseline + stakeholder map |
| **Contact Center AI** (`PAT-PRG-CC-AI-001`) | CX / Operations VP with WFM authority | Top 3 call intents OR one channel | Intent inventory + automation containment baseline + AHT/CSAT |
| **AMS Consolidation** (`PAT-PRG-AMS-CONSOLIDATION-001`) | CIO / Application Services lead | One application portfolio segment (e.g. retail merchandising) | Application inventory + run-rate baseline + integration map |
| **Demand Forecasting** (`PAT-PRG-FORECAST-001`*) | COO / Supply Chain VP | One product family or store cluster | Forecast-accuracy baseline (MAPE/WAPE) + S&OP cadence inventory |

*Demand Forecasting pattern id is provisional; verify in seed catalog.

`smesNeeded` (universal across archetypes for P0): sponsor candidate, program lead, finance partner (for envelope). Pattern-specific SMEs surface in P1 primer, not P0.

### D.0.4 Steps

| Step id | Label | Complexity | Agent role | Outputs (evidence) | Prevents |
|---|---|---|---|---|---|
| `p0-trigger-and-window` | Capture what triggered the program now and the decision window | simple | extract | `program_trigger_note` | #2 |
| `p0-first-cohort` | Name the first cohort or use case | simple | extract + validate | `initial-scope-boundary` | #2, #10 |
| `p0-value-hypothesis` | Compose the value hypothesis seed (cohort × behavior × mechanism × direction) | simple-to-complex | coach + validate | `value-hypothesis-seed` | #2 |
| `p0-sponsor-candidate` | Identify a real sponsor candidate with authority | **complex** (sponsor 1:1 expected) | coach_interview | `sponsor-candidate-named` + sponsor-1:1 notes upload | #1 |
| `p0-pattern-classification` | Select the pattern / archetype for the program | simple | validate (against pattern catalog) | `program-seed-recorded` | #2 |
| `p0-discovery-envelope` | State Discovery funding / capacity / time-box | simple | extract | `discovery-funding-envelope` | #10 |
| `p0-evidence-family` | Confirm which Discovery evidence family P1 will collect (parameterized by pattern) | simple | validate | `evidence-family-selected` | #2, #3 (looking ahead) |
| `p0-submit-for-approval` | Submit the brief to Tenant Admin for approval | simple | request_approval | program status flips to `submitted_for_approval` | governance |

Two of the eight are non-trivial:

- **`p0-sponsor-candidate` is COMPLEX.** The agent should not let the user assert "the CIO is the sponsor" inside chat. Doctrine: the agent asks for a real conversation with the candidate. It captures intent ("what are you going to ask them?"), plan (when, what topics), template (sponsor-1:1 facilitator guide → Discovery commitment, decision rights, calendar cadence). After the 1:1, the user uploads notes; the agent evaluates against the sponsor template's expected outputs (calendar commitment, escalation authority, succession owner).
- **`p0-value-hypothesis` is SIMPLE-TO-COMPLEX.** Often a few iterations in chat are enough — the agent challenges the seed against `expectedAnswerShape` ("a dollar number alone fails — name the behavior change"). Sometimes the user needs a structured workshop with their team to converge; in that case the step escalates to complex.

### D.0.5 Stage gate (P0 → submitted_for_approval / approved)

P0 has two gates, not one:

**Gate 0a — Brief floor (chat-side, no approver):** all hard P0 DoD items met, OR the user accepts a soft-floor exception with rationale. The agent runs this gate itself; failing it means it keeps coaching.

**Gate 0b — Tenant Admin approval (new, this design):** when the brief floor is met, the user clicks "Submit for approval." The Tenant Admin sees the brief, the overlap detection (any existing program with similar archetype + sponsor + system footprint? — see B.4 cross-program), the anti-pattern flags, and approves or rejects. Rejection comes with rationale and routes back to draft.

**Audit:** every approve/reject writes `program_audit_log` with the admin's user_id, rationale, and full brief snapshot.

### D.0.6 Next-phase primer (rendered at approval)

When status flips to `approved`, Nexus opens on `/programs/<id>` with the **Phase 0 primer** (in-app reactive panel + downloadable HTML brief). Composed from `dependencies.producesForNext` plus pattern-supplied parameters.

**Sections (per the user's earlier brief):**

1. **What good looks like for Phase 1 in your program** — the P1 outcome statement, contextualized with the pattern's evidence family.
2. **Steps you'll be working through** — the P1 step list with simple/complex tags so the user knows what to expect.
3. **Team / SMEs you'll need** — pattern-supplied list with role descriptions (e.g. "Data Engineer — owns identity-resolution data store; needed for Discovery workshop on day 2").
4. **Templates you'll use** — the P1 templates linked, downloadable as a starter pack.
5. **Workshops to schedule** — pattern-supplied recommended sessions with facilitator guides.
6. **Data to gather before kicking off** — baseline data the user should bring (provenance + format).
7. **How to upload outputs** — the chat-window upload affordance and what counts as evidence for which DoD item.

The same content renders as a self-contained HTML brief the user downloads to share with the team (reuses the deliverable-export pattern in `deliverable-export-contract.ts`).

### D.0.7 Brainstorm — design alternatives considered

**Alternative 1: No tenant-admin approval — `commit_program` directly creates a P0-active program** (today's behavior).

- Pro: faster path from idea to active program.
- Con: violates the design thesis. Allows use-case sprawl (#10) — any user can spin up arbitrarily many programs without portfolio oversight. Tenant Admin has no say in what the platform commits to.
- **Rejected.** The cost of letting sprawl through is far higher than the cost of one approval click.

**Alternative 2: Tenant-admin approval + auto-approval threshold** (e.g. small / experimental programs auto-approve).

- Pro: friction calibrated to risk.
- Con: introduces a "what counts as small" rule that becomes the new failure surface. Pilot customers will argue every program is small.
- **Rejected for v1.** May revisit after observing pilot behavior.

**Alternative 3: Tenant-admin approval AND sponsor co-approval at P0** (sponsor must accept the role before the program enters P0_active).

- Pro: closes failure mode #1 harder — the sponsor formally accepts.
- Con: in practice the sponsor 1:1 happens *during* P0 (step `p0-sponsor-candidate` is the whole point). Requiring sponsor co-approval *before* P0 unlocks creates a chicken-and-egg.
- **Resolution:** sponsor co-approval moves to **Gate 1 (P0 → P1)**, not Gate 0b. Sponsor signs off on accepting the role at the close of P0, having had the 1:1 during P0. This is consistent with the existing `sponsor_assigned` gate check.

**Alternative 4: Skip the Phase 0 primer; let the agent surface what's needed conversationally as P0 unfolds.**

- Pro: simpler.
- Con: the primer is the platform's promise made visible. The user / sponsor / team see the success-thinking commitments up front. Without it, the program lead drives Phase 1 from chat memory; nothing visible to share with the team or the sponsor.
- **Rejected.** The primer is core, not optional.

### D.0.8 Worked example scenarios

For each of four programs, the user's likely P0 opening, what the agent *should* do (doctrine), what the agent *currently* does (actual), and the design delta.

#### Scenario A — Apex CDP Activation

**User opens P0:** "We need to start a CDP program. The CIO mentioned it last quarter."

**Desired agent behavior (doctrine):**

> "Got it — CDP programs are about resolving customer identity across channels and activating that resolution into experience and decisioning. Before I can scope this, I need to anchor four things and they all matter:
>
> 1. **What triggered this now?** A CIO mention isn't a trigger by itself — was it a board commitment, a martech contract pressure, an identity-match incident, an outcome target?
> 2. **Who's the first cohort?** CDPs that try to do "all customers" sprawl. Which segment, channel, or use case do we activate first?
> 3. **What value mechanism are we testing?** Specifically — what behavior changes if identity resolution improves, and how does that produce value?
> 4. **Who's the real sponsor?** A CIO mention isn't ownership. We need a named executive with budget access and calendar commitment.
>
> Let's start with the trigger. What's actually forcing this conversation right now?"
>
> [No pattern-match cards shown on /programs/new — that's the wrong content for origination. Right pane shows Brief Progress (3 of 8 fields filling in as user answers) + Overlap Alert (we have an Apex CDP program already in P3 — flag this as overlap candidate.)]

**Desired right-pane content during this exchange:**

- Brief Progress card filling in field-by-field
- Overlap alert: "Apex Retail has an existing CDP program (`apex-cdp-2026`) currently in P3 Design. Is this the same initiative or a parallel one? If parallel, what differentiates this scope?"
- NO pattern-match cards. Pattern-match arrives at P0-close when classification is being confirmed, not during brief building.

**Actual current behavior (today):**

- Steward asks generic open-ended questions; collects fields one at a time without sequencing the four anchors.
- Right pane shows pattern-match cards immediately (3-of-them, often duplicates — fixed in PR-Q dedupe but still wrong content for the surface).
- No overlap alert; the existing Apex CDP program is not surfaced.
- Pattern classification happens before the value hypothesis is testable.

**Design delta:**

- Reorder Steward's question arc to drive the four anchors in sequence (already in P0 pack's `rightQuestions.open`; current code's question selection is too loose).
- Right-pane content swap on /programs/new: drop pattern-match, add Brief Progress + Overlap Alert (per Origination v2 slice OV2-1).
- Build the overlap-detection signal: scan tenant's active programs for archetype + sponsor + system overlap; surface as artifact.
- Pattern classification step (`p0-pattern-classification`) moves to *late* in the arc, after value hypothesis is in shape.

#### Scenario B — Apex Contact Center AI

**User opens P0:** "We're behind on AI in the contact center. I want to deflect more calls with a bot."

**Desired:**

> "Two things to anchor before we shape this. First, contact-center AI programs that lead with deflection without naming the first intent or volume cohort almost always sprawl into a generic chatbot rebuild and stall in P3. So: which intent or call cohort would you deflect *first* — billing inquiries? appointment changes? outage status? Second, what's the current containment baseline — what % of those calls are already self-serve vs. agent-handled? If we don't anchor in current containment we can't tell whether a deflection target is realistic."

The delta against today is the same shape as Scenario A: doctrinal sequencing, the right four anchors, the right pane fed by Brief Progress + Overlap Alert, not pattern-match.

#### Scenario C — Apex AMS Consolidation

**User opens P0:** "We need to consolidate AMS vendors. Spend is up 18% YoY and the board is asking."

**Desired:**

> "AMS consolidation is a real, fundable idea — the board pressure plus the spend trajectory is a clear trigger. But two things sink AMS programs every time, so we want to lock them in P0:
>
> First — which segment of the application portfolio? Consolidation that goes "all 1,200 apps at once" cannot baseline anything in P1 and stalls. The strongest AMS programs name a portfolio segment with a plausible run-rate signal first — e.g. retail merchandising, store ops, or one application family.
>
> Second — who is the *named* sponsor with vendor-decision authority? AMS programs run by an enthusiast app owner without CIO commitment lose air cover the first time a vendor pushes back on the consolidation thesis.
>
> What segment is in scope, and who owns the vendor decision?"

**Failure-mode tagging this scenario surfaces:** #1 (sponsor authority), #2 (problem definition / first cohort), #10 (sprawl risk).

#### Scenario D — Apex Demand Forecasting

**User opens P0:** "Forecast accuracy is killing us. We want to use AI to fix it."

**Desired:**

> "Demand-forecasting programs fail in two specific ways and we should anchor against both before we go further:
>
> First — which forecast horizon and product family? "Forecast accuracy" without a named granularity (SKU-store-week vs. category-region-month) cannot baseline. Pick the cohort.
>
> Second — what's the current MAPE or WAPE on that cohort? If we don't capture the baseline before the program starts, we can't prove improvement at the end. This is also the most common reason demand-forecast programs fail to renew.
>
> Which product family or store cluster do we anchor on, and do you have the current accuracy baseline at hand?"

This scenario uses the agent's coaching to *force the baseline question* in P0 — even though baseline capture is technically a P1 activity, P0 must commit to *which* baseline the program will collect. That commitment is the `evidence-family-selected` soft DoD item.

### D.0.9 Open questions for P0

1. **Overlap detection algorithm.** What's the threshold? Same archetype + same sponsor → strong overlap. Same archetype, different sponsor → portfolio question. Same sponsor, different archetype → SME-load question. Need explicit rules.
2. **Soft-floor bypass.** Can the user submit for approval with a soft DoD item missing? Today: yes if the user provides rationale. Should the Tenant Admin see soft-fail items separately in the approval queue? (Lean: yes — admin needs to know what's *not* nailed before approving.)
3. **Sponsor 1:1 — required or recommended?** Is `p0-sponsor-candidate` complex always, or only when the agent detects no prior sponsor relationship? (Lean: always complex for pilot; can soften based on pilot data.)
4. **What if the user wants to enter P0 without naming a pattern?** (e.g. "I don't know which pattern this is — that's what Discovery is for"). Today the pack treats `program-seed-recorded` as hard; should there be a `pattern_pending` state that allows P0 entry but blocks P0 exit? (Lean: yes, because forcing premature classification creates worse classifications.)

---

## Part E — v2 Scope (P1–P6 + cross-program walkthroughs)

To follow in v2 of this doc, with the same per-phase depth (failures prevented, what good looks like, parameterized, steps, gate, primer, brainstormed alternatives, worked-example scenarios across all 4 Apex programs):

- **P1 — Discovery (Diagnose).** Failures: #2, #3, #4, #9 baseline. Step focus: data-discovery workshop (complex), stakeholder interviews (complex), root-cause synthesis. Gate: baseline captured, data ownership confirmed, root causes named.
- **P2 — Synthesis (Design Choice).** Failures: #2 (sharpen), #6 compliance. Step focus: options weighed, trade-offs surfaced, compliance / privacy review folded in *here*, not later. Gate: charter signed off; sponsor commits.
- **P3 — Design.** Failures: #5 commitment to change, #6 governance, #7 vendor strategy. Step focus: architecture, sourcing decision (link to /source module), workflow integration design, change-management plan committed. Gate: design approved + vendor selection approved.
- **P4 — Build.** Failures: #5 workflow, #8 pilot-to-production. Step focus: execution plan, integration build, scaled-data validation, change-management activation. Gate: execution plan drafted + first scale validation passes.
- **P5 — Activate.** Failures: #5, #8, #9. Step focus: rollout, training, incentive change, measurement instrumentation, real-user adoption tracking. Gate: outcome instrumentation live + adoption thresholds met.
- **P6 — Operate.** Failures: #9, #10, learning loop. Step focus: outcome measurement vs. baseline, learnings harvest into pattern catalog, sponsor verification, benefits realization attestation. Gate: outcome report + CXO verification + benefits attested.

**Cross-program worked examples in v2:** for each of the 4 Apex programs (CDP, Contact Center AI, AMS Consolidation, Demand Forecasting), walk the agent's desired vs. actual behavior at *every* phase, surfacing the design delta.

---

## Part F — Pilot-Readiness Checklist (gates the implementation slices)

- [ ] Audit log on every state transition.
- [ ] RLS on every Programs-module table.
- [ ] RBAC enforced at API boundary, not just UI.
- [ ] Notifications: in-app + email mirror for approvals, gates, overdue prep.
- [ ] File uploads: Supabase Storage, mime allowlist, virus scan, retention.
- [ ] Telemetry: events for every failure-mode-flagged / cleared / refused-advance.
- [ ] Phase packs reviewed and signed off by senior practitioner.
- [ ] Pattern catalog parameterized for the 4 Apex archetypes (CDP, Contact Center AI, AMS Consolidation, Demand Forecasting).
- [ ] Templates: starter pack per archetype × phase, downloadable.
- [ ] Integration tests: full lifecycle for one program (originate → approve → P0 → ... → P6 → complete).
- [ ] Scenario tests: agent's desired behavior vs. the chat transcripts in Part D.0.8 — each scenario passes.

---

## Part G — Slicing (sequence, after this doc is approved)

| Slice | Scope | Failure modes addressed | Pilot-readiness floor |
|---|---|---|---|
| **OV2-1** | Brief + pacing on /programs/new; replace pattern-match with Brief Progress + Overlap Alert; the 8-step P0 decomposition | #2, #10 | RLS, audit log, telemetry events |
| **OV2-2** | Tenant-admin approval workflow; `submitted_for_approval` state; admin queue; approve/reject API + UI | #1, #10 | RBAC for admin role, audit log, notifications |
| **OV2-3** | Phase 0 primer (in-app reactive card + downloadable HTML); `producesForNext` rendering; per-archetype SME / template / workshop content | #1, #4 | Templates registry, content sign-off, export contract |
| **OV2-4** | Chat-window file upload; `program_attachments` table; mime allowlist; virus scan; evidence-link to phase pack DoD items | enabling | Storage RLS, virus scan, retention, audit log |
| **OV2-5** | Step doctrine layer in agent system prompt; intent capture / post-meeting upload loop for complex steps | enabling | Telemetry per step transition |
| **OV2-6** | Failure-mode catalog as system-prompt block; failure-mode tagging on phase packs and gate criteria; failure-mode telemetry rollup | foundational | Catalog signed off, content review |
| **OV2-7** | P1 Discovery package (per same template as P0): pack annotations, step decomposition, primer, scenarios | #3, #9 baseline | All of the above |
| **OV2-8 … OV2-13** | P2–P6 packages — same template per phase | #5, #6, #7, #8, #9, #10 | All of the above |
| **OV2-14** | Cross-program signals (overlap detection, blocker propagation) | #10 | Atlas integration |
| **OV2-15** | Program completion: outcomes settlement, learnings harvest into pattern catalog | #9, #10, learning loop | Pattern-catalog write contract |

Pilot-readiness floor is cumulative — every slice must satisfy the prior slices' floors plus its own.

---

## Part H — Open Questions (cross-cutting)

1. **Approver routing under absence.** When the Tenant Admin is OOO, who can approve? Designated delegate? Tenant-level approver pool? Pilot-stage rule.
2. **Sponsor co-approval at gates.** Sponsor signs off at every gate, or only at gate 1 (P0→P1) and gate 6 (P5→P6)? Tradeoff: friction vs. accountability.
3. **Pattern catalog parameterization authoring.** Hand-authored per pattern (today's path) is right for the four Apex archetypes for pilot; the corpus loop ([recent ops/cycles](docs/build/)) is producing more patterns. When does the parameterization become catalog-derived vs. hand-authored? Decision deferred until the corpus crosses a maturity threshold (TBD).
4. **File-upload parsing depth.** v1: store + reference. v2 candidate: parse PDFs/DOCX into structured evidence items the agent can read. Pilot-stage decision: store+reference is enough; parsing comes later. Agent asks the user to summarize the upload content if needed.
5. **Cross-program dependency model.** Explicit (user declares "depends on X") or inferred (system detects shared SME / system / vendor)? Lean: both; explicit always allowed, inferred surfaces alerts.
6. **Outcome harvest cadence.** Real-time as the program runs, or settled at P6 close? Lean: real-time signals fire telemetry at every gate; formal harvest at P6.
7. **Telemetry surfacing to customer.** Internal-only (Posthog) or also a customer-facing portfolio dashboard showing "platform forced you through these failure modes"? Lean: the dashboard is the platform's value-prop made visible; build it for pilot.

---

## Part I — Reviewer instructions

Read in this order:

1. Part A (premise + the 10 + pilot-readiness baseline). If you disagree with the 10, stop and tell me — everything below assumes them.
2. Part B (module architecture). If you disagree with the workflow split or the state machine or the actor model, stop and tell me.
3. Part C (expert-knowledge layer). This is where existing code meets new design — flag any interpretation of existing code that's wrong.
4. Part D — P0 fully worked. Skim Sections 1–6, read Section 7 (alternatives) and Section 8 (scenarios) carefully — these are the design-thinking artifacts. If the depth and shape work, v2 fills in P1–P6 the same way.
5. Parts F-H — checklists and open questions.

**The two questions that decide whether v2 is worth writing:**

- **Q1 — Are the 10 right?** (Lock or revise)
- **Q2 — Is the per-phase template structure right?** (8 sections × 7 phases × 4 worked examples = the doc's spine)

If yes to both, v2 (P1–P6 in the same depth, plus the cross-program scenario sweep) is mechanical — substantive but not exploratory. If no to either, we revisit before v2.

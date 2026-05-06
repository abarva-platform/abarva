# Nexus · Specialist Hierarchy Design
## Moves / Programs Product

| Field | Value |
|---|---|
| **Doc path** | `docs/architecture/NEXUS_SPECIALIST_DESIGN.md` |
| **Status** | Design — v1.0 |
| **Date** | 2026-05-06 |
| **Author** | Architecture |
| **Companion** | `docs/architecture/SPECIALIST_CATALOG.md` |

---

## Mental model

Nexus is the brain. The user always talks to Nexus. Nexus never says "I'm routing to a specialist" — it just responds. Behind the response, Nexus composed output from whichever specialists it routed to.

```
User
  │
  ▼
┌─────────────────────────────────┐
│  Nexus  (brain / orchestrator)  │  ← only face the user ever sees
└─────────┬───────────────────────┘
          │ routes based on phase + intent + program state
          │
     ┌────┴────────────────────────────────────────┐
     │         Specialist layer                    │
     │                                             │
     │  Phase specialists    Cross-cutting         │
     │  ────────────────     ─────────────         │
     │  P0 · 5 specialists   FailureModeDetector   │
     │  P1 · 4 specialists   CitationGuard         │
     │  P2 · 4 specialists   DuplicateDetector     │
     │  P3 · 4 specialists   CrossProgramAnalyzer  │
     │  P4 · 4 specialists   ValueLineTracker      │
     │  P5 · 3 specialists   AuditTrailComposer    │
     └─────────────────────────────────────────────┘
          │
     ┌────▼──────────────────────────┐
     │  Data / substrate layer       │
     │  programs DB · broker bundle  │
     │  context chunks · phase packs │
     │  failure modes · gate rules   │
     └───────────────────────────────┘
```

---

## Nexus orchestrator role

Nexus's job is **one conversation across six phases**. It holds the longitudinal context of the program and hands off to the right specialists silently.

**Nexus does:**
- Maintains the program narrative across phase transitions
- Decides which specialist(s) to invoke based on the user's message and program state
- Composes specialist outputs into a single, coherent voice
- Enforces all AH-ORIG and evidence-integrity constraints before responding
- Emits structured artifacts (`brief-progress`, `failure-mode-flagged`, `gate-check`, etc.)
- Asks clarifying questions when specialist outputs have ambiguity

**Nexus does NOT do:**
- Run all specialists on every turn (that is the parallel-all anti-pattern)
- Speak in specialist names to the user
- Expose routing decisions in the response
- Surface an opinion without a specialist's finding to back it

**Nexus routing logic (pseudocode):**
```
given(message, phase, programState):
  if phase === P0:
    run DuplicateDetector first
    if duplicate risk → surface and wait for confirmation
    else → run HypothesisExtractor, ArchetypeClassifier, SponsorIdentifier, BriefProgressTracker
  if phase === P1:
    if message mentions sponsor/budget → SponsorConfirmationValidator
    if message mentions success/metric/KPI → SuccessMetricDefiner
    if message mentions scope/boundary → ScopeBoundarySpecifier
    always → FoundationReadinessChecker (F1–F4 checklist)
  if phase === P2:
    if gate partial → GateChecker + EvidenceGapMapper
    if baseline topic → BaselineDataValidator
    always → FailureModeDetector (FM-9 / FM-4 primary)
  if phase === P3:
    if scope drift detected → ScopeBoundaryGuard (FM-10)
    if delivery plan topic → DeliveryPlanValidator (FM-8)
    if infra/vendor topic → InfrastructureReadinessChecker (FM-6)
  if phase === P4:
    always → RiskMonitor (all 10 FMs, weekly cadence)
    if deliverable topic → DeliverableStatusAggregator
    if pace concern → PhaseVelocityTracker
  if phase === P5:
    always → ValueRealizationVerifier
    if closure discussion → ClosureReadinessChecker
  always (every turn):
    CitationGuard → block any $ figure without evidence label
    AuditTrailComposer → log the turn with specialist chain
```

---

## Phase specialists

### P0 · Originate

**Context:** User is describing a new move idea. No program record exists yet. Input is unstructured — CEO note, email, problem statement.

| Specialist | Trigger | Output | FM |
|---|---|---|---|
| **DuplicateDetector** | Always fires first | List of existing programs with overlapping scope; confidence score; deduplication recommendation | — |
| **HypothesisExtractor** | After duplicate check passes | Structured hypothesis: bet, metric, current state, target state, value stake label | FM-2 |
| **ArchetypeClassifier** | After hypothesis extracted | Archetype classification + confidence band (e.g., "Contact Center AI — tentative") | FM-2 |
| **SponsorIdentifier** | Sponsor candidate mentioned | Candidate name, source attribution, distinction between "business case lead" vs "budget authority" | FM-1 |
| **BriefProgressTracker** | After any field extraction | Emits `brief-progress` artifact; updates section fill count; gate summary | — |

**P0 completion gate:** All 7 brief sections filled + program name set → Promote to P1 enabled.

---

### P1 · Charter (Discovery)

**Context:** Program is promoted from P0. Charter is being written. Sponsor must be confirmed. Success metrics must be defined.

| Specialist | Trigger | Output | FM |
|---|---|---|---|
| **SponsorConfirmationValidator** | Sponsor topic in conversation | Checks sponsor record: named, budget authority confirmed, RACI set | FM-1 |
| **SuccessMetricDefiner** | Metric/KPI topic | Validates: metric is measurable, baseline exists or plan to measure it exists | FM-4, FM-9 |
| **ScopeBoundarySpecifier** | Scope definition or "what's in scope" conversation | In-scope / out-of-scope boundary; flags vague objectives | FM-2, FM-10 |
| **FoundationReadinessChecker** | Gate approach or foundation readiness check | F1: Data access · F2: Sponsor confirmed · F3: Platform available · F4: Team capacity | FM-3, FM-6 |

**P1 completion gate:** Sponsor confirmed, success metric with baseline plan, scope defined, F1-F4 assessed.

---

### P2 · Diagnose (Synthesis)

**Context:** Program is running. Diagnostic work is happening. Gate criteria must be met. Baseline measurement is live.

| Specialist | Trigger | Output | FM |
|---|---|---|---|
| **GateChecker** | Gate status or "what's blocking" conversation | Pass/partial/blocked per gate criterion; gate summary | — |
| **EvidenceGapMapper** | Missing gate criterion | List of evidence needed to close each unmet criterion; suggested sources | — |
| **BaselineDataValidator** | Baseline or KPI topic | Confirms baseline measurement is live, not projected; flags contamination risk | FM-9 |
| **DataOwnershipAuditor** | Data access or ownership topic | Confirms data custodian named, access confirmed, quality gate defined | FM-3 |

**P2 completion gate:** All gate criteria met; baseline measurement confirmed; sponsor re-engaged.

---

### P3 · Design

**Context:** Solution is being designed. Delivery plan is being written. Vendors/infra may be selected.

| Specialist | Trigger | Output | FM |
|---|---|---|---|
| **ScopeBoundaryGuard** | Scope addition or expansion | Detects scope sprawl; quantifies impact on P4 timeline; recommends gate review | FM-10 |
| **DeliveryPlanValidator** | Delivery plan, timeline, sprint, milestone topic | Validates: P4 milestones defined, handoffs named, no "agile will figure it out" gaps | FM-8 |
| **InfrastructureReadinessChecker** | Vendor, platform, cloud, tooling topic | Confirms vendor decision made, architecture sized, no mid-build rework risk | FM-6 |
| **StakeholderAlignmentAuditor** | Team engagement, change management, adoption topic | Flags critical teams not engaged, change management plan missing, training not planned | FM-7 |

**P3 completion gate:** Delivery plan approved, infra confirmed, all critical stakeholders aligned, scope locked.

---

### P4 · Deliver (Build)

**Context:** Build is underway. Sprint cadence is running. Deliverables are being produced.

| Specialist | Trigger | Output | FM |
|---|---|---|---|
| **RiskMonitor** | Every turn (weekly cadence check) | Active FM risk signals (all 10); severity; recommended mitigation | All FMs |
| **DeliverableStatusAggregator** | Deliverable topic or phase review | Completion state per deliverable; blocked vs. in-progress vs. done | — |
| **PhaseVelocityTracker** | Pace, timeline, "are we on track" conversation | Phase velocity vs. plan; projected completion; drift signal | FM-8 |
| **GovernanceGateValidator** | Security, compliance, HITL, privacy topic | Validates security/governance not deferred; HITL plan confirmed | FM-5 |

**P4 completion gate:** All deliverables complete, governance sign-off, build deployed to staging.

---

### P5 · Validate (Activate)

**Context:** Solution is deployed. Outcomes are being measured against the hypothesis.

| Specialist | Trigger | Output | FM |
|---|---|---|---|
| **ValueRealizationVerifier** | Outcome or results discussion | Compares measured result to hypothesis; labels deltas; [UNVALIDATED_HYPOTHESIS] until confirmed | FM-4, FM-9 |
| **OutcomeAttributionValidator** | "Did AI cause this improvement?" | Validates that value is attributed to the AI intervention (A/B or equivalent), not confounders | FM-4 |
| **ClosureReadinessChecker** | "Can we close?" or gate check | All P5 gate criteria; value verified or variance explained; handoff to operations complete | — |

**P5 completion gate:** Value measured and attributed, closure criteria met, handoff to operations signed off.

---

## Cross-cutting specialists

These fire on every surface, every phase, when triggered by their signal.

| Specialist | Signal | Output | Priority |
|---|---|---|---|
| **CitationGuard** | Any dollar figure, percentage claim, or benchmark in response draft | Blocks emission unless evidence label present (`[UNVALIDATED_HYPOTHESIS]`, `[PRELIMINARY_ESTIMATE]`, `[MEASURED_RESULT]`) | P0 — blocks response |
| **DuplicateDetector** | New origination attempt | Cross-program overlap check; deduplication recommendation | P0 — fires first |
| **CrossProgramDependencyAnalyzer** | Program referenced, dependency topic, or "what else is affected" | Dependency map across Apex programs; shared sponsor conflicts; resource contention | P1 |
| **FailureModeDetector** | Every turn (FM signal scanning) | Scans message + program state against FM-1 through FM-10 hooks; emits `failure-mode-flagged` when signal detected | P1 |
| **ValueLineTracker** | Value figure updated or phase advanced | Moves value state (projected → committed → measuring → realized); never allows backward transitions | P1 |
| **AuditTrailComposer** | Every turn | Logs turn with: specialist chain, artifacts emitted, FM flags, evidence citations | P2 |

---

## Artifact vocabulary

Specialists communicate back to Nexus (and to the client) through structured artifacts embedded in the SSE stream.

| Artifact tag | Emitting specialist | What it does |
|---|---|---|
| `[[artifact:brief-progress]]` | BriefProgressTracker | Updates canvas brief section fill count; triggers checkmark on scaffold chip |
| `[[artifact:failure-mode-flagged]]` | FailureModeDetector | Surfaces an FM risk card in the chat pane |
| `[[artifact:gate-check]]` | GateChecker, ClosureReadinessChecker | Updates gate panel state (pass/partial/blocked) |
| `[[artifact:value-line-update]]` | ValueLineTracker | Updates value lifecycle state |
| `[[artifact:duplicate-alert]]` | DuplicateDetector | Surfaces deduplication warning card |
| `[[artifact:sponsor-confirmed]]` | SponsorConfirmationValidator | Marks sponsor as confirmed in charter |
| `[[artifact:scope-lock]]` | ScopeBoundaryGuard | Locks scope and prevents future expansions without gate review |

---

## What exists today vs. what's designed

| Specialist | Code status | Location |
|---|---|---|
| DuplicateDetector | active | `src/lib/programs/origination-overlap.ts` |
| HypothesisExtractor | active (in system prompt) | P0 phase pack + `composeOriginateFirstMessage.ts` |
| ArchetypeClassifier | active (in system prompt) | P0 phase pack + `archetype-normalization.ts` |
| SponsorIdentifier | active (in system prompt) | P0 phase pack |
| BriefProgressTracker | active | `StrategicMoveOriginateClient.tsx` + artifact channel |
| FoundationReadinessChecker | active (in phase pack) | `phase-packs/P0_originate.ts` |
| GateChecker | active | `quality-gates.ts` + `gate-ribbon-view.ts` |
| EvidenceGapMapper | active (partial) | Deliverable evidence trace |
| FailureModeDetector | active | `failure-mode-prompt.ts` + `failure-mode-telemetry.ts` |
| CitationGuard | active (in system prompt) | AH rules in chat route |
| CrossProgramDependencyAnalyzer | active | Broker bundle + cross-program signals in route |
| DeliverableStatusAggregator | active | `deliverable-canvas-view.ts` |
| ValueLineTracker | planned | — |
| RiskMonitor | partial (FM detection exists, no weekly cadence) | `failure-mode-prompt.ts` |
| BaselineDataValidator | planned | — |
| OutcomeAttributionValidator | planned | — |
| AuditTrailComposer | partial | `audit-log.ts` |
| All others | planned | — |

---

## Implementation priority

**Wave 1 (now — in-phase context depth):**
The phase packs already load per-phase coaching. The gap is that specialists are not called deterministically — Nexus relies on the LLM to apply the right coaching contextually. No code change is needed for Wave 1; the specialist catalog becomes the reference for which functions should be extracted as discrete modules when model calls land.

**Wave 2 (when model gateway is ready):**
Wire each specialist as a tool-call the orchestrator can invoke deterministically. Tool results replace the LLM's pattern-matching with structured outputs.

**Wave 3 (production):**
Add trace drill-down: users can ask "how did you determine the gate is partial?" and see the specialist chain.

---

## Naming conventions for implementation

- Specialist functions: `buildNexus{SpecialistName}Mission()` — mirrors Source's `buildNexusSourceMissions()` pattern
- Artifact emitters: emit `[[artifact:{artifact-tag}]]` in the SSE stream
- Cite tags: `[{SpecialistName}:v{n}]` in trace output

---

*End of design.*

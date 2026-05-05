# Pattern Fabric Design
**Audit date:** 2026-05-05  
**Branch:** `claude/laughing-kare-a04314`  
**Status:** Target-state design. Current-state gaps are documented in the Gap Backlog. This doc describes where the fabric must go.

---

## What the pattern fabric is

The pattern fabric is the structured knowledge substrate that makes Nexus's coaching phase-specific and archetype-specific rather than generic. It answers: given a program in phase P with archetype A on surface S, what exactly should Nexus know, ask, produce, and flag?

The fabric has three binding axes:

```
Pattern Fabric
├── Phase axis    → Which phase (P0–P5) determines coaching posture and gate logic
├── Archetype axis → Which primer (CDP, CC-AI, etc.) determines SMEs, data assets, templates
└── Surface axis  → Which surface (Programs detail, Intelligence, Tower) determines context domain
```

Today, axes are partially bound. The target state binds all three dynamically at the start of every Nexus turn.

---

## Current state

```
Phase Packs (P0–P5)          Archetype Primers (×6)       Context Broker
     ↓                               ↓                          ↓
failure-mode-prompt.ts        getArchetypePrimer()        buildProgramsContextBundle()
     ↓                               ↓                          ↓
  Nexus system prompt ←────────────── not merged ──────────────→ separate inject
```

Problems with the current state:
1. Phase pack content is injected as one string block; archetype primer content is injected as a separate block. The agent sees them as parallel inputs, not as a unified per-phase-per-archetype briefing.
2. The broker context (tenant people, program state) is built independently of the phase pack and archetype primer. A Nexus turn assembles 3 independent blocks from 3 different callers.
3. No surface-specific filtering: the Intelligence surface and the Programs surface receive similar context even though they serve different agent postures.

---

## Target state

### Binding model

```
NexusContextAssembler
├── input: { programId, currentPhase, archetype, surface, tenantKey }
├── resolves:
│   ├── PhasePack = getPhasePack(currentPhase)
│   ├── ArchetypePrimer = getArchetypePrimer(archetype)
│   ├── BrokerBundle = buildProgramsContextBundleAsync({ tenantKey, programId })
│   ├── FailureModes = getFailureModesForPhase(currentPhase) [unified catalog]
│   └── PhaseSteps = PhasePack.steps (if defined)
└── produces: UnifiedNexusContext (single typed object)
```

The assembler is the single call point before a Nexus turn. It does not exist yet; `failure-mode-prompt.ts` + `programs-broker-adapter.ts` are its precursors.

### `UnifiedNexusContext` shape (target)

```typescript
interface UnifiedNexusContext {
  // Identity
  tenantName: string;
  programCode: string;          // e.g. RETAIL-UNIFIED-2026
  programName: string;
  currentPhase: PhaseNumber;
  phaseLabel: string;           // from phase-labels.ts

  // Phase intelligence
  phaseOutcome: string;         // PhasePack.outcome
  definitionOfDone: PhaseEvidenceItem[];
  rightQuestions: {
    open: PhaseQuestion[];
    converge: PhaseQuestion[];
    close: PhaseQuestion[];
  };
  antiPatterns: PhaseAntiPattern[];
  coachingArc: PhaseCoachingArc;
  activeSteps?: PhaseStep[];    // PhasePack.steps if defined

  // Archetype intelligence
  archetype: string;
  primerFound: boolean;
  smesNeeded: PrimerSME[];
  dataAssetsNeeded: PrimerDataAsset[];
  phaseTemplates: PrimerTemplate[];   // filtered to currentPhase
  phaseWorkshops: PrimerWorkshop[];   // filtered to currentPhase

  // Failure modes (unified catalog)
  activeFailureModes: UnifiedFailureMode[];  // from unified registry

  // Tenant context (broker bundle)
  executiveBench: ExecBenchEntry[];   // who is who, decision rights
  programInventory: ProgramSummary[]; // other programs for portfolio context
  tenantIndustry: string;
  tenantTechStack: string[];

  // Gate state
  gateRule: GateRule | null;         // from governance.ts
  openGateChecks: GateCheck[];
  blockedChecks: GateCheck[];        // hard failures

  // Surface routing
  surface: 'programs' | 'programs-detail' | 'intelligence';
  agentMode: 'side_panel' | 'draft' | 'cxo_takeover';
}
```

### How surface routing affects context

| Surface | Phase pack | Archetype primer | Failure modes | Broker domains |
|---------|-----------|-----------------|--------------|---------------|
| `programs-detail` | Full (all sections) | Full | Active for phase | people, programs, worldview |
| `programs` (list) | Summary only (outcome + gate) | PatternId only | None | people, programs |
| `intelligence` | None | Patterns only (no phase steps) | Intelligence catalog only | worldview, industry |

The surface filter prevents Intelligence from receiving Programs phase-step coaching (wrong posture) and prevents Programs from receiving Intelligence's retrieval-mode guidance.

---

## Pattern binding rules

### Rule 1 — Phase-first, archetype-second

Phase pack content is the primary coaching layer. Archetype primer content augments it with pattern-specific detail. Nexus must never let the primer override the phase gate logic.

Example: CDP Activation primer says the data asset inventory is "nice to have in P0". Phase Pack P0 has no data asset gate check. But Phase Pack P1 has a hard gate on `baseline_captured`. The phase pack wins for gate logic; the primer provides the data asset checklist.

### Rule 2 — Archetype primer is filtered to current phase

The `ArchetypePrimer` type has per-phase sections in its `phases[]` array. The assembler must extract only the sections relevant to `currentPhase`. Loading the full primer across all phases inflates the system prompt and adds noise from future-phase guidance.

### Rule 3 — Failure modes filtered to active phase, not entire catalog

`getFailureModesForPhase(phase)` returns only modes where `primaryPhases` includes `phase`. The unified assembler uses the same filter on the reconciled catalog (GAP-IMPL-1).

### Rule 4 — Questions staged by coaching arc position

The `rightQuestions` are partitioned into `open`, `converge`, `close`. Nexus must select questions based on where in the phase the conversation is:
- **Open** questions: first 1–3 turns of a phase (establish priors).
- **Converge** questions: mid-phase (push for commitment).
- **Close** questions: approaching gate submission (validate completeness).

The coaching arc position is inferred from the ratio of completed gate checks to total gate checks for the phase. If 0–33% complete: open. 33–75%: converge. 75–100%: close.

### Rule 5 — Anti-pattern detection is proactive, not reactive

When the phase anti-pattern list includes `detectionHint` strings, Nexus scans its own output for these signals before delivering a response. If a signal fires, Nexus prepends the `whatToFlag` message before continuing. This is not a post-hoc filter — it is a pre-delivery step.

### Rule 6 — No archetype primer = degraded mode, not failure

When `getArchetypePrimer(archetype)` returns null (GAP-P0-3), the assembler must:
1. Set `primerFound: false` in the context.
2. Log a structured warning with the archetype key.
3. Continue with phase pack content only; do not crash or hallucinate primer content.
4. Nexus explicitly tells the user: "I don't have a specific playbook for [archetype] yet — I'll coach using the general 6-phase framework."

---

## Source surface pattern binding (target state)

The Source surface has its own lifecycle patterns (`source-lifecycle-patterns.ts`). When a program's Discovery phase (P2) involves a sourcing event (RFP, vendor selection), the pattern fabric must bridge:

```
Strategic Move P2 (Discover & Diagnose)
         ↓
source-phase-bridge.ts maps P2 → [RFP, Q&A, Initial-Bid stages]
         ↓
Source lifecycle pattern for the matched pattern (e.g., AMS)
         ↓
NexusContextAssembler includes source stage context when bridged
```

This binding is not yet implemented. See GAP-IMPL-2.

---

## Target fabric topology summary

```
                    ┌────────────────────────────────┐
                    │   NexusContextAssembler         │
                    │                                  │
  Phase axis ───────┤ PhasePack (P0–P5)               │
  Archetype axis ───┤ ArchetypePrimer (×10 target)    │
  Failure modes ────┤ UnifiedFailureModeRegistry       │
  Tenant context ───┤ AgentContextBroker (domains)     │
  Gate state ───────┤ GovernanceGateRules              │
  Source bridge ────┤ SourcePhaseBridge (target)       │
                    └─────────────────┬────────────────┘
                                      │
                             UnifiedNexusContext
                                      │
                    ┌─────────────────┴────────────────┐
                    │     Nexus System Prompt Builder    │
                    │  (composes blocks in surface order)│
                    └──────────────────────────────────┘
```

The blocks are ordered: tenant identity → phase posture → active gate state → failure-mode doctrine → archetype primer detail → right questions (staged) → coaching arc instruction.

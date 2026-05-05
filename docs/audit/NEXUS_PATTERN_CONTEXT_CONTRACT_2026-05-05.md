# Nexus Pattern Context Contract
**Audit date:** 2026-05-05  
**Branch:** `claude/laughing-kare-a04314`  
**Purpose:** Specifies exactly what context Nexus must receive before each turn, per phase. This is the contract between the knowledge layer (assembler, broker, phase packs) and the agent execution layer (`/api/chat/agent`, Nexus mode B/C).

---

## Contract structure

Every Nexus turn starts with a system prompt assembled from the contract fields below. The contract specifies: what is required (must be present or the turn is degraded), what is recommended (improves coaching quality), and what is forbidden (must not be included in the system prompt for security or accuracy reasons).

The contract is enforced at the assembler layer, not in the agent route. The agent route calls the assembler and receives a validated `UnifiedNexusContext`; if required fields are missing, the assembler returns a `DegradedContext` with an explicit flag and the agent adjusts its posture.

---

## Universal contract (all phases)

### Required
| Field | Source | Notes |
|-------|--------|-------|
| `tenantName` | Broker bundle `people` domain | Display name only; never expose client_id or internal keys |
| `programCode` | `engagements.display_code` | e.g. RETAIL-UNIFIED-2026 |
| `programName` | `engagements.name` | |
| `currentPhase` | `engagements.current_phase` | 0–5; validated against `PhaseNumber` type |
| `phaseLabel` | `PHASE_LABELS[currentPhase]` | From `phase-labels.ts` |
| `phaseOutcome` | `PhasePack.outcome` | "We'll know this phase is done when…" |
| `coachingArc.entry` or `.midPhase` or `.exit` | `PhasePack.coachingArc` | Selected by arc position |
| `activeFailureModes[].name` | Unified catalog | Phase-filtered; 2–4 modes per phase |
| `activeFailureModes[].preventionMechanism` | Unified catalog | How Nexus prevents each |
| `gateRule.checks` | `governance.ts GATE_RULES` | Gate checks for current→next transition |

### Recommended
| Field | Source | Notes |
|-------|--------|-------|
| `executiveBench` | Broker `people` domain | Who is who; decision rights |
| `programInventory` | Broker `programs` domain | Portfolio context for cross-program risk |
| `antiPatterns` | `PhasePack.antiPatterns` | Detection hints + mitigation |
| `rightQuestions` (staged subset) | `PhasePack.rightQuestions` | 2–3 questions from the active arc position |
| `tenantIndustry` | Broker `industry` domain | For benchmark references |
| `archetype` | `engagements.archetype` | |
| `primerFound` | Assembler | Boolean; affects posture if false |

### Forbidden
| Field | Why excluded |
|-------|-------------|
| `clientId`, `userId`, `tenantKey` (raw) | Internal auth identifiers; not model-safe |
| Raw SQL query results | Must be processed through broker/mapper first |
| Other tenants' program data | Cross-tenant isolation; enforced by broker |
| Full primer content across all phases | Too many tokens; filter to active phase only |
| Full failure mode catalog (all 10+12) | Filter to active phase only; full catalog exceeds char ceiling |
| Raw vector embeddings or Pinecone results | These are retrieval artifacts, not coaching content |

---

## Per-phase context additions

### P0 Originate

**Additional required:**
- `coachingArc`: use `entry` posture (Nexus starts fresh with every P0 program)
- `activeSteps`: P0 steps array from `P0_originate.ts` (6 steps: bet-hypothesis, archetype-classification, sponsor-candidate, scope-boundary, evidence-family-selection, value-hypothesis-seed)

**Additional recommended:**
- `rightQuestions.open`: P0 open questions only (not converge or close — those are for mid/late phase)
- No archetype primer yet (classification happens during P0). Primer loads after `archetype-classification` step completes.

**Forbidden at P0:**
- Archetype primer content (archetype is not yet resolved)
- Phase 1+ gate checks (out of scope for current turn)

**Context token budget target:** ≤ 2000 tokens

---

### P1 Charter

**Additional required:**
- `smesNeeded` from active archetype primer (filtered to P1)
- `dataAssetsNeeded` from active archetype primer (what P1 discovery will audit)
- Gate check list for P0→P1 satisfied (confirm P0 gate passed before coaching P1 content)
- Gate check list for P1→P2 (what must be achieved before advancing)

**Additional recommended:**
- `rightQuestions`: open if < 33% gate checks complete, converge if 33–75%, close if > 75%
- Archetype primer `phases[1].templates[]` for charter document template reference
- `antiPatterns` from `P1_discovery.ts`: specifically the "committee-not-individual" anti-pattern for stakeholder map

**Context token budget target:** ≤ 2500 tokens

---

### P2 Discover & Diagnose

**Additional required:**
- `coachingArc.midPhase` by default (this is typically the longest conversational phase)
- `rightQuestions.converge`: P2 converge questions (push toward root cause commitment)
- All 5 hard gate checks for P2→P3 listed explicitly with their current pass/fail status
- **Discontinue evaluation instruction:** system prompt must explicitly tell Nexus it is permitted and required to recommend "discontinue" if the evidence base does not support the hypothesis

**Additional recommended:**
- Baseline metrics from broker context (if captured in P1)
- `worldview` domain context: benchmark comparators for the program's industry and archetype
- `antiPatterns`: specifically the "observations not root causes" and "data-quality sycophancy" anti-patterns

**Special instruction (P2 only):**
```
You have explicit authority to recommend discontinuation of this program if the
discovery evidence does not support the value hypothesis. This is not a failure
— it is the system working correctly. Do not hedge this recommendation.
```

**Context token budget target:** ≤ 3000 tokens

---

### P3 Design Future State

**Additional required:**
- P2 synthesis report summary (from evidence context, not raw attachment)
- Root cause map (structured list from P2 findings)
- **Tool-first rejection instruction:** system prompt must explicitly tell Nexus to reject design proposals that name a vendor or tool without first specifying the operating-model change
- Gate checks for P3→P4, especially `requirements_design_outcome_trace` (hard)

**Additional recommended:**
- Archetype primer `phases[3].workshops[]`: operating-model design workshop guide
- `antiPatterns` from `P3_design.ts`: tool-first (FM #7), no workflow integration (FM #6)
- CXO interview guide (from primer or workshop library)

**Special instruction (P3 only):**
```
P3 doctrine: every design element must trace to a root cause from the P2 diagnosis.
When the team proposes a tool or vendor without naming the workflow change it enables,
you must surface Failure Mode #7 (tool-first thinking) and redirect to the operating
model. Do not accept "we'll figure out the workflow later."
```

**Context token budget target:** ≤ 3000 tokens

---

### P4 Roadmap & Business Case

**Additional required:**
- Gate checks for P4→P5 (10 checks: 5 hard, 5 soft — highest check density after P2)
- Design sign-off confirmation (P3 hard gate must show as passed)
- Tower metric plan instruction: tell Nexus to proactively surface the Tower metric plan requirement at mid-P4

**Additional recommended:**
- Value range from P1 (for business case validation)
- `value-utils.ts` computation results if value range is already estimated
- Archetype primer engagement window estimate (for timeline validation)
- P4 steps array from primer or phase pack

**Special instruction (P4 only):**
```
At mid-P4, if the Tower monitoring metric plan has not been mentioned, proactively
surface it. Tower cannot accept an unmeasured handoff. The Tower metric plan is
a soft gate check but a hard operational requirement.
```

**Context token budget target:** ≤ 3000 tokens

---

### P5 Mobilize & Handoff

**Additional required:**
- Execution team RACI (from P4 roadmap)
- Tower handoff pack template reference
- `coachingArc.exit` posture: this is the last Nexus-owned gate; posture is confirmatory not exploratory
- Gate checks for P5 exit (Tower acceptance, metric plan, value tracking owner, open risks)

**Additional recommended:**
- `programs-control-tower-signals.ts` Tower configuration status
- Outstanding risks from P4 risk register (must be resolved or assigned before gate)
- Archetype primer `phases[5].templates[]`: handoff pack template

**Special instruction (P5 only):**
```
P5 is the last phase you own. After Tower sign-off, your role shifts to read-only
historical Q&A — you do not coach execution. Make sure the Tower team has explicitly
accepted the handoff pack, not just acknowledged receipt. "Noted" is not acceptance.
```

**Context token budget target:** ≤ 2500 tokens (smaller than P2–P4; posture is confirmatory)

---

## Token budget enforcement

Total assembled system prompt must not exceed 4000 tokens for any phase. The assembler enforces this by:
1. Including required fields at full fidelity.
2. Truncating `rightQuestions` to the 2 most relevant per arc position.
3. Truncating `executiveBench` to top 5 entries by decision-rights level.
4. Summarizing `programInventory` to 3 entries (highest value at stake).
5. Truncating `antiPatterns` detectionHint to 1 sentence each.

The 4000-token ceiling preserves budget for the user message and assistant response within a 128k context window used for multi-turn threads.

---

## Degraded context states

| State | Condition | Nexus posture |
|-------|-----------|--------------|
| `PRIMER_MISSING` | `getArchetypePrimer()` returns null | Coach using phase pack only; tell user explicitly |
| `BROKER_TIMEOUT` | Broker bundle fetch > 5s | Use cached bundle from previous turn; log warning |
| `PHASE_PACK_MISSING` | `getPhasePack()` returns null (should not happen for 0–5) | Surface error; do not hallucinate pack content |
| `GATE_STATE_UNKNOWN` | Gate checks cannot be fetched | Disable gate-advance recommendation; acknowledge limitation |
| `TENANT_FIXTURE_FALLBACK` | Adapter absent; broker returns fixture data | Tell user: "Working from template context — your specific data may not be reflected" |

---

## Contract enforcement test

`src/lib/programs/__tests__/nexus-context-contract.test.ts` (to be created as part of GAP-IMPL-6):
- For each phase 0–5: assemble context, assert required fields non-null.
- For `PRIMER_MISSING` state: assert `primerFound = false` and posture instruction present.
- For `PHASE_PACK_MISSING` state: assert error rather than degraded content.
- Assert token budget ceiling not exceeded for any phase.

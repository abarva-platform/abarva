# Source Audit · M6 · Cross-Reference Matrix

| Field | Value |
|---|---|
| Mode | M6 · Cross-reference matrix |
| Status | Complete (synthesizing M1, M2, M4, M5; M3 deferred) |
| Audit date | 2026-05-06 |
| Total findings consolidated | 12 compliance · 23 drift · 23 design observations |

---

## 1 · Cluster matrix

Findings grouped by the architectural decision they inform. Each cluster has multiple findings that point to the same redesign question.

### Cluster A · The agent architecture (#1 priority for redesign)

| Finding | Mode | Severity | What it claims |
|---|---|---|---|
| F-M2-101 | M2 | P0 | Code's agent model is "all four, every stage" |
| F-M4-101 | M4 | P0 | 5th agent model (parallel-all) not declared anywhere |
| F-M5-201 | M5 | — | 4 different agent models across 5 sources |
| F-M2-102 | M2 | P1 | Build spec asserts "Sentinel-led" but code disagrees |
| F-M4-102 | M4 | P1 | No category→agent assignment in code |
| F-M4-103 | M4 | P1 | Voice is stage-generic within agent |
| F-M1-203 | M1 | P2 | No `lead_agent` column on events |
| F-M1-202 | M1 | P1 | `event_type` doesn't match design's 4 categories |
| F-M4-202 | M4 | — | Handoff topology converges on Nexus implicitly |
| F-M4-203 | M4 | — | Atlas in Source vs Atlas in Tower unresolved |

**Cluster impact:** Load-bearing. The agent architecture decision drives the redesign of the entire Source surface, and the dossier digestion §16.1 flagged this as the founder's open question. Recommended treatment: **decide first, before any other redesign work.** See M4 §4 decision matrix.

### Cluster B · Voice genericness and editorial sharpening

| Finding | Mode | Severity | What it claims |
|---|---|---|---|
| F-M4-103 | M4 | P1 | Editorial templates use stage-label injection only |
| F-M4-201 | M4 | — | Voice samples concrete (operational/evidence/exec/governance) |
| F-M4-205 | M4 | — | No persona-specific voice variation |
| F-M4-208 | M4 | — | Pattern packs are agent-blind |
| F-M2-201 | M2 | — | Component duplication (12+ Commercial* panels) |

**Cluster impact:** Adjacent to Cluster A. The voice question can be answered independently of the agent-model question — but the answers compound. If parallel-all wins, voice differentiation per stage matters more (otherwise users see four identical-shape templates). If single-lead wins, voice differentiation is the lead's specialization.

### Cluster C · Substrate gaps for design's gate and value semantics

| Finding | Mode | Severity | What it claims |
|---|---|---|---|
| F-M1-204 | M1 | P1 | Approvals are action-level, not gate-criterion-level |
| F-M1-205 | M1 | P1 | No per-line value-state column |
| F-M1-101 | M1 | P1 | 13 readiness states not enumerated as canonical |
| F-M1-102 | M1 | P2 | 10 artifact states reduced to 6 in approval_state |
| F-M1-103 | M1 | P1 | Artifact catalog drifts from dossier 13 |
| F-M5-104 | M5 | — | 5 of 13 readiness states have no code representation |
| F-M5-106 | M5 | — | Value-state vocabulary not modeled in substrate |
| F-M5-110 | M5 | — | 4 dossier artifacts missing in code |

**Cluster impact:** Substrate-level. To deliver the design template's gate panels, value ledger lines, and full readiness vocabulary, ~3-5 substrate additions are needed. Either build them, or simplify dossier vocabulary to match what the substrate actually models.

### Cluster D · Code-only feature sprawl

| Finding | Mode | Severity | What it claims |
|---|---|---|---|
| F-M2-203 | M2 | — | 12 code-only routes beyond dossier+design |
| F-M2-204 | M2 | — | Patterns subsystem invisible to dossier |
| F-M2-201 | M2 | — | Component duplication |
| F-M5-108 | M5 | — | Five code-only routes that have no dossier or design |

**Cluster impact:** Hygiene. The redesign should explicitly decide for each code-only route: keep, fold, or remove. Patterns subsystem in particular needs a dossier-level decision.

### Cluster E · Build spec drift (separate document needs update)

| Finding | Mode | Severity | What it claims |
|---|---|---|---|
| F-M5-101 | M5 | — | Build spec uses 10 stages, not 11 |
| F-M5-202 | M5 | — | Build spec internally inconsistent (Sentinel-led vs Nexus panel) |
| F-M2-102 | M2 | P1 | Build spec's "Sentinel-led" claim contradicts code |
| F-M2-105 | M2 | P2 | Vendor detail route in design but missing in code |

**Cluster impact:** Documentation hygiene. The build spec is dated April 28, before May 2 11-stage migration and current code. Updating it post-redesign captures the canonical state.

### Cluster F · Compliance positives (the strong stuff)

| Finding | Mode | What it confirms |
|---|---|---|
| F-M2-002 | M2 | Forbidden-claims discipline holds |
| F-M2-003 | M2 | Usable Evidence semantically separated |
| F-M2-004 | M2 | Award is recommendation, not automation |
| F-M2-005 | M2 | Real approval API exists (contradicts dossier §6) |
| F-M1-003 | M1 | Context receipts substrate (strong evidence integrity) |
| F-M1-002 | M1 | Tenant-scoped RLS on every table |
| F-M2-001 | M2 | All 6 canonical routes implemented |
| F-M4-207 | M4 | Code self-documents "no model calls" |

**Cluster impact:** Counts the wins. The dossier is wrong about §6 implementation status — code has shipped more discipline than the dossier credits. Worth recording.

---

## 2 · Severity-ranked unified gap register

### P0 (load-bearing for redesign)
- **F-M4-101 / F-M2-101** — Pick an agent architecture model. See M4 decision matrix (Options A–E).

### P1 (drives redesign work)
- **F-M4-103** — Editorial sharpening: per-stage voice templates per agent
- **F-M2-102** — Reconcile build spec to match code (or update code to match a chosen direction)
- **F-M4-102** — Decide if category→agent mapping is needed
- **F-M1-204** — Add `source_gate_criteria` table or accept rendering complexity at app tier
- **F-M1-205** — Add `source_value_lines` substrate; required for T07/T11 design
- **F-M1-103** — Reconcile artifact catalog
- **F-M1-101** — Decide whether to enumerate 13 readiness states or simplify dossier
- **F-M1-202** — Reconcile category enum (event_type) with design's 4 categories
- **F-M2-104** — Plan retirement of legacy stage_keys

### P2 (cleanup, not blocking redesign)
- **F-M2-103** — Rename `SOURCE_NEXUS_API_STUB_VERSION`
- **F-M2-105** — Decide on vendor detail route
- **F-M1-102** — Reconcile 10 vs 6 artifact states
- **F-M4-104** — Decide if handoffs need to be modeled flows

### Design observations (no severity, inform the redesign)
- F-M2-201 (component duplication)
- F-M2-202 (three-shell stack)
- F-M2-203 (code-only routes)
- F-M2-204 (patterns subsystem)
- F-M4-201 to F-M4-208 (voice + handoff observations)
- F-M5-201 to F-M5-206 (multi-source drift observations)

---

## 3 · The architectural reconciliations

The redesign decision tree:

```
1. AGENT ARCHITECTURE (Cluster A)
   ├── Option A · Stay parallel-all + sharpen voice (Medium cost)
   ├── Option B · Single-lead per stage (High cost)
   ├── Option C · Single-lead + category co-lead (Highest cost) ← matches design B
   ├── Option D · Per-stage specialist agents (Very high cost)
   └── Option E · Parallel-all + UX prioritization (Low cost) ← preserves investment

2. VOICE EDITORIAL (Cluster B)
   └── Decision: per-stage templates regardless of agent model

3. SUBSTRATE GAPS (Cluster C)
   ├── Add source_gate_criteria table (for design B gate panels)
   ├── Add source_value_lines table (for T07/T11 value ledger)
   └── Decide: enumerate 13 readiness states or simplify dossier

4. CODE-ONLY FEATURES (Cluster D)
   └── Per-route decision: keep / fold / remove

5. BUILD SPEC UPDATE (Cluster E)
   └── Sequenced after 1-4 land
```

---

## 4 · What the audit answers · what it doesn't

**Answers:**
- Are the canonical routes implemented? Yes (6/6)
- Are forbidden claims under discipline? Yes (15/15 effectively)
- Does code match dossier on agent model? No (5 different models)
- Is voice differentiated per stage? No (templates are stage-label injection)
- Is substrate ready for design's gate panels? Partially (approval action exists, criterion granularity missing)
- Is substrate ready for design's value ledger? No (no per-line state column)

**Doesn't answer (needs M3 or follow-up):**
- Does the rendered UI honor the patterns the code claims?
- Does T03 genericness manifest in the browser as it does in code?
- Do the 12 code-only routes serve real users or are they dead?
- Does the patterns subsystem render meaningfully?

---

End of M6.

# AbarVa Patterns & Knowledge Layer · Comprehensive Backlog v1.1

**Version:** 1.1 · April 28 2026
**Supersedes:** v1.0 (same date — v1.0 had incomplete Phase 1)
**Status:** Comprehensive plan locked
**Purpose:** Drive the knowledge layer from architecturally-correct-but-thin to substantively-credible. Every phase produces a corpus state that is **demo-complete for the storylines it serves**, not partial.

---

## §0 · The comprehensiveness standard (locked for all phases)

Every phase in this backlog — and every future phase added to this backlog — must satisfy this standard before being declared "complete." This is not an aspirational goal; it is the **definition of done.**

### The five comprehensiveness tests

A phase is comprehensive when **all five** are true:

**Test 1 · Storyline coverage.** Every demo storyline that the phase intends to serve has all of its required primitives present. "Required primitives" means: the patterns, signals, contradictions, and solutions that Atlas would need to cite to produce a defensible synthesis on a query about that storyline.

Example: if Phase N claims to serve the M365 Copilot rollout storyline, then Phase N must include the productivity-agent pattern, the ROI attribution methodology pattern, the shadow-AI governance pattern, the vendor-claim contradiction, and at least 2 industry signals about Copilot. Anything less, and the storyline is partial — which means the phase is partial.

**Test 2 · Citation depth threshold.** For every storyline the phase serves, the Atlas synthesis on the canonical demo query for that storyline must produce ≥4 numbered citations, all clickable, all resolving to typed primitives that exist in the corpus by end of phase.

**Test 3 · Cross-primitive density.** Patterns alone are not a corpus. By end of phase, the corpus has all four primitive types (patterns, signals, contradictions, solutions) populated for every domain the phase serves. A phase that ships 50 patterns but no contradictions is not comprehensive — the contradiction concept is invisible.

**Test 4 · Composition closure.** If a phase ships a solution that composes patterns A, B, C, then A, B, C must also ship in the same phase. No solution references a pattern that doesn't exist yet. Apply transitively to all references.

**Test 5 · Demo viability.** If you opened the running app at end of phase and walked the storylines the phase serves, every page renders meaningful content, every cross-surface storyline chip resolves, every Atlas voice quote cites real primitives. No "coming soon" placeholders for storylines the phase is supposed to serve.

### What the standard explicitly is NOT

**It is not "ship everything in the backlog at once."** Phases still partition work. The standard is that each phase delivers a *complete subset*, not a partial union.

**It is not "wait for perfect."** A pattern at confidence 0.7 with 3 instances is comprehensive enough to ship. A pattern at confidence 0.4 with 1 instance flagged as TODO is not. The standard is "defensible," not "perfect."

**It is not "founder reviews everything."** Comprehensive doesn't mean human-blessed. Auto-extraction with strong source grounding can satisfy the standard without per-pattern founder review.

### Future phases follow this standard

When Phase 2, Phase 3, Phase 4 are planned, the planning phase **must run the five tests against the proposed phase scope** before the phase is locked. If a test fails, the scope expands until it passes.

This document's §10 (Phase 2), §11 (Phase 3), §12 (Phase 4), §13 (Phase 5) all conform to this standard.

---

## §1 · Position · The reframe (unchanged from v1.0)

This backlog is not "invent 80 new patterns." It is **"extract and structure the patterns that already exist in the source corpus."**

A scan reveals substantial pattern material already authored: 15 pattern packs in `intelligence-pack/`, foundational meta-patterns M1-M6, the reference shadow-AI implementation, the 8,727-line deliverables spec, four tenant overlays each naming 7+ pattern packs, architecture documentation across 16+ files, and a three-tier structure already defined.

What's missing is not authorship. It is **extraction into typed Pattern fixtures with consistent schema, indexed in the 5-store knowledge fabric, queryable by Atlas, navigable in Intelligence, surfaced as storyline chips in Programs/Source/Tower.**

---

## §2 · Storylines this backlog serves

Before specifying patterns, we name the storylines the corpus must support. Every storyline is a query a user could ask that the system must answer defensibly.

### §2.1 · Phase 1 storylines (must be demo-complete by end of Phase 1)

| Storyline | Canonical demo query | Required primitives |
|---|---|---|
| **APX-CDP-2026** | "What's the state of Apex Retail's CDP activation?" | PAT-CDP-001, PAT-CDP-002, PAT-CDP-006, PAT-CDP-010, PAT-IND-RET-001, CON-001, SOL-001 |
| **AMS Vendor Consolidation 2026** | "Synthesize the AMS sourcing event end-to-end" | PAT-SRC-001, PAT-SRC-007, PAT-SRC-010, PAT-CDP-001, CON-001, SOL-014 |
| **M365 Copilot rollout** | "What do we know about M365 Copilot ROI?" | PAT-AI-007, PAT-AI-010, PAT-AI-005, CON-002, CON-003, signals from MS, SOL-006 |
| **Claude Code rollout** | "What's the value model for our Claude Code adoption?" | PAT-AI-006, PAT-AI-010, PAT-AI-013, signals from Anthropic, SOL-002 |
| **Now Assist deployment** | "Why is Now Assist underperforming?" | PAT-AI-011, PAT-AI-010, CON-004, signals from ServiceNow, SOL-004 |
| **AI Cloud Spend pressure** | "How should we think about LLM inference cost overruns?" | PAT-AI-009, PAT-AI-003, PAT-SRC-008, signals from vendors |
| **Vendor consolidation playbook** | "How should we approach AI tooling vendor consolidation?" | PAT-AI-003, PAT-SRC-005, PAT-SRC-009, SOL-003 |
| **Shadow AI to sanctioned migration** | "What's our position on shadow AI?" | PAT-AI-005, PAT-AI-002, regulatory signals, SOL-007 |
| **AI portfolio governance** | "How do we govern our AI investment portfolio?" | PAT-AI-002, PAT-AI-004, PAT-ARCH-002, SOL-013 |

**9 Phase-1 storylines.** Each maps to the four flagship demo programs plus the cross-cutting concerns (governance, vendor consolidation, shadow AI, cost pressure). This is the full Tower module's reach plus the CDP / AMS storylines that anchor Programs and Source.

### §2.2 · Phase 2 storylines (Phase 2 must be demo-complete for these by end of Phase 2)

| Storyline | Domain |
|---|---|
| Ambient clinical documentation deployment | Healthcare (Meridian) |
| Prior authorization automation | Healthcare (Meridian) |
| Fraud detection modernization | Financial services (First Capital) |
| Customer onboarding KYC AI | Financial services (First Capital) |
| Predictive maintenance modernization | Energy (Keystone) |
| EU AI Act readiness | Compliance (cross-tenant) |
| AI MRM for financial services | Compliance (First Capital) |

**7 Phase-2 storylines.** Industry-specific deepening + compliance.

### §2.3 · Phase 3+ storylines

Future-of-work programs, talent strategy, cross-tenant patterns, etc. Specified when those phases are planned.

---

## §3 · The four-primitive corpus targets · revised

| Primitive | End of Phase 1 | End of Phase 2 | End of Phase 3 | End of 90 days |
|---|---|---|---|---|
| **Patterns** | **65** (was 44) | 90 | 130 | 150 |
| **Signals** | **30** (was 20) | 50 | 100 | 200 |
| **Solutions** | **9** (P0 set) | 18 | 28 | 35 |
| **Contradictions** | **10** (was 0) | 18 | 25 | 30 |

Phase 1 is the comprehensiveness fix: every primitive type populated, all 9 demo storylines covered.

---

## §4 · Pattern backlog · 80 patterns across 8 domains

Pattern entries unchanged from v1.0 except for **phase reassignment** to satisfy §0 standard.

### §4.1 · Meta tier (PAT-META-M1 through M6)

**Phase 1.** Same as v1.0.

### §4.2 · Sourcing domain (PAT-SRC-001 through 012)

**Phase 1.** Same as v1.0.

### §4.3 · CDP domain (PAT-CDP-001 through 010)

**Phase 1.** Same as v1.0.

### §4.4 · AI Programs domain (PAT-AI-001 through 014)

**Phase 1 (was Phase 2 in v1.0).** This is the critical reassignment. The entire Tower module's storylines need these patterns.

| ID | Name | Source | Priority |
|---|---|---|---|
| PAT-AI-001 | AI-Led PDLC Methodology | `intelligence-pack/02-ai-led-pdlc.md` | P0 |
| PAT-AI-002 | AI Governance Operating Model | `intelligence-pack/03-ai-governance-operating-model.md` | P0 |
| PAT-AI-003 | AI Vendor Sprawl Rationalization | `intelligence-pack/04-vendor-sprawl-ai-tool-rationalization.md` | P0 |
| PAT-AI-004 | AI Use-Case Portfolio Management | `intelligence-pack/05-ai-use-case-portfolio-management.md` | P0 |
| PAT-AI-005 | Shadow AI Governance | `pattern-pack-01-shadow-ai-governance.md` | P0 |
| PAT-AI-006 | Coding-Agent Rollout Pattern | Tower T-CODE + Claude Code seed | P0 |
| PAT-AI-007 | Productivity-Agent Adoption Curve | Tower T-PROD + M365 Copilot seed | P0 |
| PAT-AI-008 | AI Program Kill Criteria | Identified gap; needs authoring | P0 |
| PAT-AI-009 | Cross-Vendor Inference Cost Normalization | AI Cloud Spend pressure | P0 |
| PAT-AI-010 | AI Program ROI Attribution Methodology | Tower §6 confidence-haircut framework | P0 |
| PAT-AI-011 | Service-Desk AI Deflection Optimization | Tower T-SVC + Now Assist seed | P0 |
| PAT-AI-012 | ERP-Agent Integration Depth Decision | Tower T-ERP + SAP Joule seed | P1 |
| PAT-AI-013 | AI Talent Strategy for AI-Mature Orgs | T-FOW + future-of-work overlay | P1 |
| PAT-AI-014 | AI Program Sponsor Activation | Programs origination + Apex sponsor design | P1 |

P0 set: 11 of 14. P0 set is **mandatory for Phase 1**. P1 patterns can ship in Phase 1 if time allows or shift to Phase 2.

### §4.5 · Architecture domain (PAT-ARCH-001 through 010)

**Phase 1 (was Phase 2 in v1.0).** Architecture patterns are needed for self-explanation storylines (the Architecture sub-page in Setup, the iceberg principle pattern surfaced when explaining UX choices).

Same patterns as v1.0 §4.6, all P0 except PAT-ARCH-006, 007, 010 which are P1.

### §4.6 · Compliance domain (PAT-COMP-001 through 008)

**Phase 2.** Compliance content has the founder-review bottleneck and isn't required for the Phase 1 storylines.

Same as v1.0 §4.5.

### §4.7 · Talent / Future-of-Work (PAT-FOW-001 through 008)

**Phase 2.** Not on the Phase 1 critical path.

Same as v1.0 §4.7.

### §4.8 · Industry-specific (PAT-IND-* · 12 patterns)

**Split:** PAT-IND-RET-001 ships in Phase 1 (anchors APX-CDP-2026 storyline). The remaining 11 ship in Phase 2 (industry-specific storylines). This avoids double-counting since several of these patterns are already extracted as part of KP-2.

### §4.9 · Pattern phase totals

| Phase | Patterns shipped | Cumulative |
|---|---|---|
| Phase 1 | 65 | 65 |
| Phase 2 | 25 | 90 |
| Phase 3 | 35 | 125 |

**Phase 1 = 65 patterns.** Up from 44 in v1.0. Adds AI Programs (14) + Architecture (10) + 1 industry pattern (PAT-IND-RET-001) - 4 patterns that were already counted via KP-2's existing-pack extraction.

---

## §5 · Signal backlog · 30 by end of Phase 1

Same source taxonomy as v1.0 (Class A RSS, Class B regulatory, Class C analyst, Class D manual). Phase reassignment:

**Phase 1 signal seed (30 signals total):**

- 10 from SIG-SRC-* (vendor announcements — Microsoft, Anthropic, OpenAI, Google, ServiceNow, SAP, Salesforce, AWS, Azure, Apple)
- 5 from SIG-REG-* (regulatory — EU AI Act, NIST RMF, SEC, FDA, CFPB)
- 15 from SIG-MAN-* (manual curation — vendor exec interviews, earnings calls, competitor moves, customer behavior, internal observations)

These are *seed* signals — manually-curated entries to populate the corpus. RSS automation (SIG-INFRA-1) is Phase 4. Manual entry form (SIG-INFRA-2) is Phase 2.

**The signals must be real.** "Forrester Q2-2026 CDP Report (April 24)" only ships if that report actually exists. If unavailable, mark the placeholder as TODO and don't ship it.

---

## §6 · Solution backlog · 9 P0 solutions in Phase 1

Same composition as v1.0 §6 but Phase 1 ships the full P0 set (was Phase 3 in v1.0):

| ID | Name | Composing patterns | Phase |
|---|---|---|---|
| **SOL-001** | CDP Activation for mid-market retail | PAT-CDP-001, 002, 006, PAT-IND-RET-001 | **1** |
| **SOL-002** | AI-coding-agent rollout for engineering org of 100-500 | PAT-AI-006, 010, PAT-FOW-005 | **1** |
| **SOL-003** | Vendor consolidation playbook for AI tooling >$10M | PAT-AI-003, PAT-SRC-005, 009 | **1** |
| **SOL-004** | ITSM AI deployment with deflection target >35% | PAT-AI-011, PAT-IND-CROSS-001 | **1** |
| **SOL-006** | M365 Copilot enterprise rollout | PAT-AI-007, PAT-IND-CROSS-002 | **1** |
| **SOL-007** | Shadow AI to sanctioned AI migration | PAT-AI-005, PAT-AI-002 | **1** |
| **SOL-010** | Owned-brand margin recovery (retail) | PAT-IND-RET-001, 002 | **1** |
| **SOL-013** | AI portfolio governance establishment | PAT-AI-002, 004, PAT-ARCH-002 | **1** |
| **SOL-014** | Vendor BAFO orchestration | PAT-SRC-001, 002, 007 | **1** |

**Composition closure verified:** every pattern referenced in a P0 solution is in Phase 1's pattern set. Test 4 of §0 passes.

---

## §7 · Contradiction backlog · 10 in Phase 1

Same 10 as v1.0 §7. Phase reassignment from Phase 3 → **Phase 1**.

The first 5 (CON-001 through CON-005) are vendor-claim-vs-evidence type and are demo-distinctive. Without these, the contradiction concept doesn't render at demo time.

---

## §8 · Knowledge fabric infrastructure backlog · phase reassignment

| Wave | Description | Phase |
|---|---|---|
| **KF-1** | Pattern fixture loader | Phase 2 |
| **KF-2** | 5-store indexing | Phase 2 |
| **KF-3** | Atlas synthesis engine | Phase 2 |
| **KF-4** | Cross-surface storyline injection | Phase 2 |
| **KF-5** | Contradiction detection engine | Phase 3 |
| **KF-6** | Public pattern sample | Phase 3 |
| **SIG-INFRA-1** | RSS poller | Phase 4 |
| **SIG-INFRA-2** | Manual signal entry form | Phase 2 |

Phase 1 is **fixture-only**. Infrastructure (the engine that makes fixtures queryable) is Phase 2. This is intentional: Phase 1 produces the data; Phase 2 makes it useful.

---

## §9 · Phase 1 detailed wave plan

**Phase 1 outcome:** by end of phase, the corpus has 65 patterns, 30 signals, 10 contradictions, 9 solutions. Every Phase 1 storyline (§2.1) passes the citation-depth test (≥4 citations on canonical demo query). The corpus exists as typed fixtures, ready for Phase 2 infrastructure to make queryable.

**Estimated duration:** 10-12 days at typical Sonnet pace.
**Estimated agent time:** ~50 hours Sonnet + ~5 hours founder review.

### §9.1 · Wave dependency graph

```
KP-1 (meta) ──────────┐
                      │
KP-2 (existing packs)─┼──┐
                      │  │
KP-3 (sourcing) ──────┼──┤
                      │  │
KP-4 (CDP) ───────────┼──┤
                      │  │
KP-5 (AI programs) ───┼──┼──► KS-1 (P0 solutions) ──► KC-1 (contradictions seed)
                      │  │
KP-6 (architecture) ──┘  │
                         │
KS-2 (signals seed) ─────┘
```

**Critical path:** KP-1 → KP-2 → KP-3 → KP-4 → KP-5 → KP-6 → KS-1 → KC-1.
**Parallel-safe:** KS-2 can run any time after KP-1.

### §9.2 · Per-wave specs

#### Wave KP-1 · Meta-pattern extraction

- Scope: PAT-META-M1 through M6
- Source: `pattern-library-package/`
- Deliverable: `src/lib/intelligence/seed-patterns-meta.ts` (6 entries)
- Time: 2-3h Sonnet
- Auto-merge: yes (pure extraction, low risk)

#### Wave KP-2a · AI Programs pattern extraction (existing packs)

- Scope: PAT-AI-001 through 005
- Source: `intelligence-pack/02-05` + `pattern-pack-01-shadow-ai-governance.md`
- Deliverable: `src/lib/intelligence/seed-patterns-ai-programs.ts` (5 entries — first batch)
- Time: 2-3h Sonnet
- Auto-merge: yes

#### Wave KP-2b · Industry pattern extraction (existing packs)

- Scope: PAT-IND-* from `intelligence-pack/06-13` (8 patterns)
- Source: `intelligence-pack/06-13`
- Deliverable: `src/lib/intelligence/seed-patterns-industry.ts` (8 entries)
- Time: 3h Sonnet
- Auto-merge: yes

#### Wave KP-3 · Sourcing-domain authoring

- Scope: PAT-SRC-001 through 012 (12 patterns)
- Source: `abarva-source-build-spec.md`, Apex/Keystone overlays, AMS storyline data
- Deliverable: `src/lib/intelligence/seed-patterns-sourcing.ts` (12 entries)
- Time: 5-6h Sonnet
- Auto-merge: **founder review recommended** (authoring, not pure extraction)

#### Wave KP-4 · CDP-domain authoring

- Scope: PAT-CDP-001 through 010 (10 patterns)
- Source: Apex overlay, T3-H03 fixture, APX-CDP-2026 fixture, AMS-VC-2026 fixture
- Deliverable: `src/lib/intelligence/seed-patterns-cdp.ts` (10 entries)
- Special: PAT-CDP-010 explicitly born from CON-001 contradiction
- Time: 4-5h Sonnet
- Auto-merge: founder review recommended

#### Wave KP-5a · AI Programs domain (Tower-derived patterns)

- Scope: PAT-AI-006 through 011 (6 patterns — coding agents, productivity, kill criteria, inference cost, ROI, service desk)
- Source: Tower design spec value models, Tower fixture data
- Deliverable: appends to `src/lib/intelligence/seed-patterns-ai-programs.ts`
- Time: 4-5h Sonnet
- Auto-merge: founder review recommended

#### Wave KP-5b · AI Programs domain (talent + sponsor patterns)

- Scope: PAT-AI-012, 013, 014 (3 patterns) — these are P1 priority
- Source: Programs origination spec, T-FOW value model, ERP value model
- Deliverable: appends to `src/lib/intelligence/seed-patterns-ai-programs.ts`
- Time: 3h Sonnet
- Auto-merge: founder review recommended
- **Note:** if Phase 1 time pressure, KP-5b can defer to Phase 2.

#### Wave KP-6 · Architecture-domain authoring

- Scope: PAT-ARCH-001 through 010 (10 patterns)
- Source: `docs/architecture/*` (16+ files), Source/Tower/Intelligence design specs
- Deliverable: `src/lib/intelligence/seed-patterns-architecture.ts` (10 entries)
- Time: 5-6h Sonnet
- Auto-merge: founder review recommended

#### Wave KS-2 · Signal seed (manual curation)

- Scope: 30 signals (10 vendor, 5 regulatory, 15 manual)
- Source: vendor blogs, regulatory feeds, recent observations
- Deliverable: `src/lib/intelligence/seed-signals.ts` (30 entries)
- Time: 2-3h Sonnet
- Auto-merge: yes (signals are factual citations, low risk)
- **Critical: signals must be real.** No fabricated dates, sources, or content.

#### Wave KS-1 · P0 solution composition

- Scope: SOL-001, 002, 003, 004, 006, 007, 010, 013, 014 (9 solutions)
- Depends on: KP-1 through KP-6 + KP-2b complete (every composing pattern must exist)
- Deliverable: `src/lib/intelligence/seed-solutions.ts` (9 entries)
- Time: 4-5h Sonnet
- Auto-merge: founder review recommended (composing prescriptive content)

#### Wave KC-1 · Contradiction seed

- Scope: CON-001 through CON-010 (10 contradictions)
- Depends on: KP-3, KP-4, KP-5a complete (contradictions reference patterns)
- Deliverable: `src/lib/intelligence/seed-contradictions.ts` (10 entries)
- Time: 3h Sonnet
- Auto-merge: founder review recommended

### §9.3 · Wave order (single agent)

```
Day 1:    KP-1 (2-3h) + KS-2 start (1h)
Day 2:    KP-2a (2-3h) + KP-2b (3h)
Day 3:    KP-3 (5-6h)
Day 4:    KP-4 (4-5h)
Day 5:    KP-5a (4-5h)
Day 6:    KP-5b (3h) + KP-6 start (3h)
Day 7:    KP-6 finish (3h) + KS-2 finish (2h)
Day 8:    KS-1 (4-5h)
Day 9:    KC-1 (3h)
Day 10:   Buffer + comprehensiveness verification (§9.4)
```

10 days end-to-end. Each day is one Sonnet session (~5 hours of effective agent time accounting for context-window resets and PR creation overhead).

### §9.4 · Phase 1 comprehensiveness verification

Before declaring Phase 1 complete, run all five tests from §0:

**Test 1 · Storyline coverage** — for each of the 9 Phase 1 storylines (§2.1), confirm every required primitive exists in the corpus.

**Test 2 · Citation depth** — manually run each canonical demo query against the seed data (Atlas isn't live yet in Phase 1, so simulate by listing primitives that match the query). Confirm ≥4 citations per query.

**Test 3 · Cross-primitive density** — confirm patterns + signals + contradictions + solutions all populated. (Solutions are 9, patterns 65, signals 30, contradictions 10. Pass.)

**Test 4 · Composition closure** — for each solution, verify every composing pattern exists. Run as `git grep` test against the seed files.

**Test 5 · Demo viability** — manually walk a demo storyline conceptually: "Open /tower → drill into M365 Copilot → click ROI question → see corpus citations." Confirm content exists for each step.

If any test fails, **scope expands until it passes.** Do not declare Phase 1 complete with a failing test.

### §9.5 · Phase 1 founder review checkpoints

Sonnet runs the waves autonomously. Founder review at three checkpoints:

1. **After KP-3 + KP-4 ship** (Day 4-5): review sourcing + CDP patterns for accuracy and tone. Course-correct before AI Programs / Architecture waves.
2. **After KP-6 ships** (Day 7): all patterns done. Review the 65-pattern corpus for gaps before solutions/contradictions compose on top.
3. **After KC-1 ships** (Day 9): full Phase 1 review. Run §9.4 verification. Sign off or send back.

Each checkpoint is ~30 minutes of founder time. Total: ~1.5 hours founder review across the phase.

---

## §10 · Phase 2 plan · comprehensive (per §0 standard)

Phase 2 outcome: corpus serves the **Phase 2 storylines** (§2.2 — industry deepening, compliance) and ships the infrastructure that makes Phase 1's corpus queryable.

### §10.1 · Phase 2 storylines (must be demo-complete)

7 storylines per §2.2: ambient clinical, prior auth, fraud detection, KYC, predictive maintenance, EU AI Act readiness, AI MRM.

### §10.2 · Phase 2 waves

**Pattern waves:**
- KP-7 · Compliance domain (8 patterns) · founder-review-heavy
- KP-8 · Talent / FoW domain (8 patterns)
- KP-9 · Industry-specific deepening (4 patterns — the remaining IND patterns not in Phase 1's KP-2b)

**Infrastructure waves:**
- KF-1 · Pattern fixture loader
- KF-2 · 5-store indexing (touches architecture; founder-approved)
- KF-3 · Atlas synthesis engine
- KF-4 · Cross-surface storyline injection
- SIG-INFRA-2 · Manual signal entry form

**Solution waves:**
- KS-3 · Phase 2 solution composition (9 more solutions for Phase 2 storylines)

**Contradiction waves:**
- KC-2 · 8 more contradictions for Phase 2 domains

### §10.3 · Phase 2 comprehensiveness verification

Same 5 tests as §0, applied to Phase 2 storylines. Notably:
- Test 4 (composition closure): Phase 2 solutions can reference Phase 1 patterns (they exist), but cannot reference patterns that don't ship until Phase 3. This forces Phase 2 to either ship the dependent patterns or pick different solutions.

### §10.4 · Estimated Phase 2 duration

15-18 days. Longer than Phase 1 because:
- Compliance bottleneck (founder review per pattern)
- Infrastructure waves (KF-1 through KF-4) are heavier than fixture work
- More waves total (~12 vs Phase 1's ~10)

---

## §11 · Phase 3 plan · comprehensive

Phase 3 outcome: contradictions auto-detected, public pattern sample shipped, corpus crosses 125 patterns and starts demonstrating the network effect.

### §11.1 · Phase 3 storylines

To be specified at Phase 3 planning time, but expected to include:
- Cross-tenant pattern observations (anonymized)
- Forward-looking signals (analyst projections, market direction)
- Pattern lineage visualization
- Decision provenance walks

### §11.2 · Phase 3 waves

- KF-5 · Contradiction detection engine
- KF-6 · Public pattern sample
- KP-10 · Phase 3 patterns (pattern coverage gaps identified during Phase 1-2 use)
- KS-4 · Phase 3 solutions

Comprehensive verification per §0 still applies.

### §11.3 · Estimated Phase 3 duration

12-15 days.

---

## §12 · Phase 4 plan · comprehensive

Phase 4 outcome: signal ingestion fully automated. Corpus updates daily without manual curation.

### §12.1 · Phase 4 waves

- SIG-INFRA-1 · RSS poller infrastructure
- KP-11 · Compliance and FoW pattern depth (additional patterns for Phase 2 domains as needed)

### §12.2 · Estimated duration

10-12 days.

---

## §13 · Phase 5 plan · comprehensive

Phase 5 outcome: cross-tenant network effect explored (v2 ambition). Editorial governance fully operational.

To be specified.

---

## §14 · Editorial governance (unchanged from v1.0 §10)

Pattern editorial calendar, quarterly review, pattern reviewer role. Founder is initial reviewer. Documented now so the role can be delegated as the platform scales.

---

## §15 · Public asset strategy (unchanged from v1.0 §11)

7-pattern public sample shipped via Wave KF-6 (Phase 3). Marketing differentiator.

---

## §16 · Cross-tenant network effect (unchanged from v1.0 §12)

V2 ambition. Anonymized pattern sharing across tenants with explicit opt-in. Specced now; built post-v1.

---

## §17 · How this backlog interacts with the build loop (unchanged from v1.0 §14)

Pattern extraction waves don't conflict with module build waves. Different file globs. Run in parallel safely.

---

## §18 · Document control

- **Authoritative location:** `docs/build/PATTERNS_AND_KNOWLEDGE_LAYER_BACKLOG.md`
- **Version:** 1.1 (supersedes 1.0 same date)
- **Authored:** April 28 2026
- **Owner:** Founder
- **§0 standard:** locked. Future edits to Phases 2-5 must run the 5 tests before phase scope is locked.

---

**End of patterns and knowledge layer backlog v1.1.**

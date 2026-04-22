# Codex Handoff · Evening Build Wave · Drops 3, 4, 5

**Three coordinated build packs queued behind A1 (north star + Keystone, currently 41%+ and rising). Total ~2,100 lines of specification. Each drop is independently shippable but coordinated to maximize Codex throughput this evening.**

**April 21, 2026 · Post-9pm queue**

---

## What this handoff contains

Three build packs + one master backlog tracking document:

1. **00-MASTER-BACKLOG.md** — Governance view · 62 tasks · status tracking (240 lines)
2. **apex-intelligence-layer-overlay.md** — Drop 3 · Intelligence layer instantiation (687 lines)
3. **contradiction-engine-foundation.md** — Drop 4 · Net-new architecture for Candor vibe (684 lines)
4. **executive-profile-system.md** — Drop 5 · Net-new architecture for Presence vibe (767 lines)

---

## Sequencing

### Dependency chain

```
A1 [in flight]
  ├─ north star schema migration
  ├─ Keystone base seed + overlay ingestion
  └─ must land before Drop 3 runs
      │
      └─ Drop 3 [Apex overlay]
            - reuses A1 schema (no migration)
            - template-driven against Keystone ingestion pattern
            - small-to-moderate scope
            
Drops 4 and 5 run parallel to each other, both after A1 lands but not blocked by Drop 3:

Drop 4 [Contradiction Engine]        Drop 5 [Executive Profile System]
  - own schema migration              - own schema migration
  - new detection pipeline            - new personalization integration
  - net-new infrastructure            - net-new infrastructure
  - larger scope                      - REQUIRES Anand ethics review
                                        before real-world profile ingestion
```

### Recommended order

**Path 1 (parallel maximum throughput).**
1. A1 lands → Anand merges
2. Drop 3 starts (small scope, fast)
3. Drop 5 starts in parallel (but pauses before real-world profile ingestion for Anand review)
4. Drop 4 starts after Drop 3 completes (or in parallel if Codex has capacity)

**Path 2 (safer serial).**
1. A1 lands → Anand merges
2. Drop 3 completes
3. Drop 5 schema + composite profiles (no ethics review needed for composites)
4. Drop 4 runs
5. Drop 5 real-world profiles after Anand ethics review

**Path 2 preferred given governance posture tonight.**

---

## Drop 3 · Apex Intelligence Layer Overlay

### Scope

Extends the already-ingested Apex Retail Group base seed (from PR #22) with:
- 34 first-class KPI objects covering retail KPI taxonomy (financial, merchandising, customer, digital, operational, supply chain, employee, cross-functional)
- 7 pattern packs upgraded from narrative to full schema (Owned Brand Margin, Omnichannel Fulfillment, Shadow AI, Customer Data Platform, Analytics Modernization, Store Workforce, Loss Prevention)
- External signal envelope (tracked executives, BUs, initiatives, vendors, peer competitors, topics, geography)
- 9 operational telemetry sources with dual-scope access control
- Dual-scope configuration across all entities
- Graph entity population plan (~530 entities, 2,300-3,200 edges)

### Ingestion approach

This is a data-layer-only task. No schema changes needed — the schema landed with A1.

- Reuse the ingestion pipeline from A1's Keystone overlay work
- Template-swap Apex-specific data
- Preserve PR #22 compatibility patterns (short name `clients.name = "Apex Retail"`, benchmark data in JSONB)
- Idempotent upserts

### Expected throughput

Substantially faster than A1 because no schema work. Estimate 45min-2hr based on A1's observed rate.

### Smoke tests

12 tests in Part 8 of the overlay spec. All should pass post-ingestion.

### Non-goals

- No UI changes (data layer only)
- No personalization — just data availability
- No telemetry source actual connector implementation (registrations only)

---

## Drop 4 · Contradiction Engine Foundation

### Scope

Net-new architectural infrastructure for persistent contradiction detection and surfacing. Five categories (A-E), 15 foundational detection rules, stakes scoring, deduplication, agent integration points, and UI scaffolding.

### Ingestion approach

Eight-step implementation (Part 11 of spec):
1. Schema migration (contradiction, detection_rule, contradiction_evidence, resolution_action)
2. Detection rule framework (definition, execution engine, scheduler)
3. 15 foundational detection rules (A-R1 through E-R3)
4. Scoring engine
5. Deduplication logic
6. Agent integration points
7. UI surface scaffolding
8. Seed 20 example contradictions (4 composites × 5 categories, from Part 9)

### Key architectural decisions pre-approved

Per Anand's Q1-Q5 answers earlier:
- Hybrid schema approach (new tables + additive columns as needed)
- Dual-scope fields on contradiction entity, enforcement at output filter
- Composite-world simulation for detection validation (no real external signal ingestion required for this drop)
- Scope: schema + detection framework + 15 rules + seed contradictions + smoke tests

### Sensitivity

Category C (Sponsor-Behavior) and Category E (External-Internal Messaging) contradictions are inherently high-sensitivity. Dual-scope defaults specified in Part 11.4. Contradictions involving named individuals require severe sensitivity treatment.

### Expected throughput

Larger scope than Drop 3 given schema + detection + seeding. Estimate 3-6hr.

### Smoke tests

13 tests in Part 10. Should all pass.

### Non-goals

- No UI polish beyond scaffolding
- No notification orchestration
- No cross-tenant contradiction synthesis (future Atlas capability)
- No full production data validation (composite data sufficient)

---

## Drop 5 · Executive Profile System

### Scope

Net-new architectural infrastructure for the Presence vibe. Profile schema covering communication style, decision patterns, public commitments, relationship network, AbarVa interaction history, personalization layer integration, and VIP population for 4 real-world executives plus 4 composite tenant executives.

### Ingestion approach

Six-step implementation (Part 9 of spec):
1. Schema migration (executive_profiles + supporting tables)
2. Graph edge types added to graph model
3. Personalization layer hook in agent reasoning pipeline (Stakeholder Mapping step)
4. Seed 4 real-world profiles (Prat, Shail, Tim, Ranjan) — **PAUSE FOR ANAND ETHICS REVIEW**
5. Seed 4 primary composite profiles (Jonathan, Marcus, Linda, Daniel)
6. Smoke tests

### Critical checkpoint · Anand ethics review

Real-world profiles involve real people with sensitive observed-behavior inferences. **Codex must pause after schema migration and before real-world profile ingestion to allow Anand to review the four profile drafts in Part 3 of the spec.**

Acceptable paths:
- Anand approves as-is → ingest
- Anand requests edits → revise and re-submit for approval
- Anand deletes specific fields or entire profiles → respect and ingest approved subset

**Composite profile ingestion (Part 4) does not require this pause** — composite profiles are synthetic and carry no real-person risk.

### Scope enforcement

Real-world profiles: default Anand-scope for both reasoning and disclosure. Structural enforcement at output filter prevents real-world profile data from leaking into composite tenant maestro context.

Composite profiles: tenant-scoped reasoning, program-scoped disclosure per tenant conventions.

### Expected throughput

Moderate scope. Schema + graph edges + personalization hook + 8 profile seeds. Estimate 2-4hr total, with the Anand review being the external dependency.

### Smoke tests

9 tests in Part 7. Should all pass after both composite and real-world seeds.

### Non-goals

- No full personalization layer implementation (hook points only)
- No UI for profile viewing/editing
- No automated style-capture from public sources (manual population for VIPs)
- No cross-profile relationship graph depth (basic edges only)

---

## Governance posture tonight

Per Anand's explicit approval earlier:

### Auto-merge for Drop 3

Drop 3 is data-layer instantiation against landed schema. Low architectural risk. **Auto-merge acceptable when smoke tests pass and preservation checks confirm.** Anand reviews the PR summary, not every diff.

### Full review for Drops 4 and 5

Drops 4 and 5 introduce new schema and new architectural surfaces. **Anand stays in the review loop** on both. Pre-merge readout required per standard pattern.

### Ethics review for Drop 5 real-world profiles

Explicit stop-gate before real-world profile ingestion. No auto-proceed.

---

## Spec-review pass before building

Anand approved a 15-minute Codex review of each spec against existing code before building. This catches errors cheaply before they become merge-review issues.

**Drop 3.** Verify Apex base seed structure in repo matches spec references. Confirm schema-readiness from A1.

**Drop 4.** Verify graph schema supports contradiction entity relationships. Confirm evidence chain model is consistent with existing Evidence entity if present.

**Drop 5.** Verify agent reasoning pipeline has the Stakeholder Mapping step (Step 3 per north star Part 12.1) where personalization layer will hook. Confirm graph schema supports person entities with the richness specified.

Report back any issues before starting build.

---

## Pre-merge readout expectations

### Standard pattern (per PR #22 and A1)

1. Scope summary (what was built)
2. Schema migration summary (for Drops 4 and 5)
3. Ingestion results (for Drop 3)
4. Smoke test outputs (raw, preserved)
5. Any caveats or deferred items
6. Preservation confirmation (existing tenants still functional)
7. Safe-to-merge recommendation

### Additional for Drop 5

- Ethics review checkpoint acknowledgment
- Anand-approved real-world profile set enumerated
- Scope enforcement verification

---

## Questions Codex may want to ask before starting

If unclear, ask Anand before proceeding on any individual drop.

**Drop 3 questions:**
1. Is A1 merged? If not, wait.
2. Confirmed Apex base seed is query-able against the landed north star schema?

**Drop 4 questions:**
1. Should the 15 detection rules be implemented as configuration records or as code? (Spec allows both.)
2. Is there an existing Evidence entity to extend, or does this introduce one?
3. UI scaffolding implies Claude Code coordination — should Codex produce placeholder UI or skip entirely for Claude Code to build?

**Drop 5 questions:**
1. Is there an existing Person entity to extend, or does this introduce one?
2. Does the current agent pipeline have the 8-step reasoning protocol as structured code? If not, where should the personalization hook integrate?
3. For the Anand ethics review pause — what's the mechanism? Stop and notify? Branch with review PR?

---

## Summary

**Three packs. One evening. Target throughput: all three shipped to PR stage by morning.**

Drop 3 likely completes tonight. Drops 4 and 5 begin tonight, complete tomorrow. Anand manages governance load by leaning on auto-merge for Drop 3 and staged review for Drops 4 and 5.

The build packs themselves are specification-complete. Any clarification is pragmatic, not architectural — the architectural decisions are pre-made in the specs per Anand's guidance.

---

**END UNIFIED HANDOFF**

*Package: 00-MASTER-BACKLOG.md + apex-intelligence-layer-overlay.md + contradiction-engine-foundation.md + executive-profile-system.md. Total ~2,400 lines of build specification plus governance tracking. Ready to roll.*

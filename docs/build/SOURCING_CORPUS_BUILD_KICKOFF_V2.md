# AbarVa Sourcing Corpus Build · Behavioral Excellence Loop

**Version:** 2.0 · 2026-04-29
**Supersedes:** SOURCING_CORPUS_BUILD_KICKOFF_V1.md
**Status:** Ready for execution after pre-flight gate

---

## §0 · Mandate

Build the sourcing corpus that makes AbarVa behave like a senior IT sourcing practitioner — one who has run hundreds of vendor selections, knows where vendors hide cost, recognizes the contradiction nobody else sees, and produces artifacts that procurement, IT, finance, and legal use without rewriting.

The corpus is not the deliverable. **The agent's behavior is the deliverable.** Every pattern is judged by whether it changes what Sentinel, Atlas, or Nexus does on a real sourcing decision. Word count, structural completeness, and citation density are necessary but not sufficient. A 1500-word pattern that never fires in retrieval is failure. A 600-word pattern that consistently surfaces the right contradiction at the right moment is success.

This v2 supersedes v1. v1 produced 152 corpus patterns and proved the binding loop (PR #1084 wired agent retrieval to the corpus). What v1 did not specify: how to know when a pattern is good, what coverage the agent needs to be world-class, and how to halt when the loop drifts. v2 adds those.

**Non-negotiable read order before starting:**

1. `docs/build/BRAND_VOICE_SPEC_V1.md` — voice rules
2. `docs/build/PUBLIC_SITE_SPEC_V1.md` §6 — pattern body editorial rules
3. `docs/build/KNOWLEDGE_LAYER_AUDIT_CURRENT.md` — what's already in the corpus
4. `docs/build/KNOWLEDGE_IDENTITY_COUNT_CONTRACT.md` — corpus IDs vs manifest IDs vs slugs
5. `docs/build/KNOWLEDGE_ROUTE_PROVENANCE_MAP.md` — what surface consumes what
6. `docs/build/KNOWLEDGE_ENTERPRISE_DATA_ROOM_WRITEBACK_CONTRACT.md` — how patterns interact with tenant data
7. `src/lib/intelligence/seed-types.ts` — the `PatternSeed` type
8. `src/lib/intelligence/agent-retrieval.ts` — the binding layer
9. `src/lib/intelligence/seed-patterns-sourcing.ts` and the seven domain files — current corpus state and tone baseline
10. The five behavioral benchmark scenarios in §11 — these are the acceptance bar

Do not respond to this prompt with a plan summary. Run the pre-flight gate in §13 first. Then begin Wave 0.

---

## §1 · The eleven domains and quality-gated targets

Targets are quality-gated, not count-gated. Authoring stops in a domain when the behavioral benchmark in §11 scores adequately for that domain, not when a count quota is hit. The numbers below are upper-bound estimates.

| Domain | Code prefix | Upper bound | Status (post-v1) | Authoring approach |
|---|---|---|---|---|
| 1 · Category sourcing playbooks | `PAT-SRC-CAT-*` | ~50 | 51 shipped | Augment, do not duplicate |
| 2 · Vendor intelligence profiles | `PAT-SRC-VEN-*` | ~50 thin profiles | ~12 shipped | **Reduced from 200 — see §3.2** |
| 3 · Contract intelligence | `PAT-SRC-CON-*` | ~30 | 7 shipped | Continue |
| 4 · Pricing intelligence | `PAT-SRC-PRC-*` | ~25 | 3 shipped | Continue |
| 5 · Process and methodology | `PAT-SRC-PROC-*` | ~20 | ~12 shipped | Continue |
| 6 · Industry-specific overlays | `PAT-SRC-IND-*` | ~50 | partial | Continue |
| 7 · Regulatory and compliance | `PAT-SRC-REG-*` | ~15 | 2 shipped | Continue |
| 8 · Risk patterns | `PAT-SRC-RSK-*` | ~25 | 0 shipped | Continue |
| **9 · IT-specific complexity** | `PAT-SRC-ITX-*` | ~40 | 0 shipped | **NEW — see §3.9** |
| **10 · Workflow patterns** | `PAT-SRC-WFL-*` | ~30 | 0 shipped | **NEW — see §3.10** |
| **11 · Contradiction patterns** | `PAT-SRC-CTR-*` | ~40 | 0 shipped | **NEW — see §3.11** |
| **TOTAL upper bound** | | **~375** | **~87** | |

The reduction from v1's 415 target to v2's 375 upper bound is intentional. v1 over-invested in vendor profiles (200) at the expense of IT-specific complexity, workflow knowledge, and contradiction patterns — the three things that actually distinguish a senior practitioner. v2 rebalances.

The corpus is "v1.0 complete" when the behavioral benchmark suite in §11 scores 22+ out of 27, not when 375 patterns ship.

---

## §2 · Pattern type extension status (LANDED in v1)

`SourcingPatternExtensions` shipped to `seed-types.ts` in PR #811 on 2026-04-29. Existing primitives validate unchanged.

v2 adds three additional optional fields to `PatternSeed`. These are backward-compatible. PR #1118 (Wave 0 of v2) lands them before any new authoring.

```ts
export interface PatternSeed extends SourcingPatternExtensions {
  // ... existing fields unchanged

  // NEW in v2 — behavioral acceptance fields, all optional
  triggerScenarios?: TriggerScenario[];
  behavioralDeltas?: BehavioralDelta[];
  retrievalTestIds?: string[];
}

export interface TriggerScenario {
  /** A user prompt that should retrieve this pattern. */
  prompt: string;
  /** What surface this prompt would arrive on. */
  surface: 'programs' | 'source' | 'intelligence' | 'tower' | 'any';
  /** Other patterns that should co-fire on this prompt. */
  expectedCoFiringPatternIds?: string[];
  /** What the agent must say or do that it would not say without this pattern. */
  expectedBehavioralDelta: string;
}

export interface BehavioralDelta {
  /** Plain-English description of what changes. */
  description: string;
  /** What surface(s) the delta applies to. */
  surfaces: Array<'programs' | 'source' | 'intelligence' | 'tower'>;
  /** Which agent the delta applies to. */
  agent: 'sentinel' | 'atlas' | 'nexus' | 'steward' | 'any';
}
```

`retrievalTestIds` references entries in a new test fixture file at `tests/intelligence/sourcing-corpus-behavioral-fixtures.ts`. The behavioral acceptance gate in §4.7 uses these.

---

## §3 · Per-domain authoring guides

### §3.1 · Category sourcing playbooks (`PAT-SRC-CAT-*`) — augment

51 categories shipped in v1. Do not duplicate. v2 augments by:

**Adding the missing IT categories:**

- `PAT-SRC-CAT-NETWORK-001` — Enterprise networking (SD-WAN, MPLS retirement)
- `PAT-SRC-CAT-VOICE-001` — Unified communications and contact center
- `PAT-SRC-CAT-PRINT-001` — Print and managed print services
- `PAT-SRC-CAT-EUC-001` — End-user compute (laptops, mobile, desktop-as-a-service)
- `PAT-SRC-CAT-COLO-001` — Colocation and data center hosting

**Deepening the highest-leverage existing categories** with v2 fields. PR-by-PR, take an existing `PAT-SRC-CAT-*` pattern and add `triggerScenarios` and `behavioralDeltas`. Priority order: CRM, ERP, CDW, LLM, IAM, AMS, EHR, ITSM, observability, EUC.

The deepening work is the more important half. Adding `triggerScenarios` to existing patterns is what makes them retrievable; without that, the 51 shipped categories are dormant.

### §3.2 · Vendor intelligence profiles (`PAT-SRC-VEN-*`) — REVISED FROM v1

v1 specified 200 vendor profiles at 600–1200 words. v2 reduces to 50 thin profiles at ~400 words and moves the dynamic content to the Signal pipeline.

**Three-layer vendor model:**

| Layer | Where it lives | Refresh cadence | Content |
|---|---|---|---|
| Static | `PAT-SRC-VEN-*` body, ~400 words | Annual | Company snapshot, positioning, product portfolio summary, durable contract patterns, durable known weak points |
| Dynamic | `SignalSeed` records attached via `affectedPatternIds` | Continuous | M&A, leadership changes, security incidents, pricing model shifts, regulatory exposure |
| Negotiation | `PAT-SRC-PRC-*` patterns referencing the vendor | When pricing changes | Discount levers, escalator behavior, BAFO mechanics |

A vendor profile pattern body must NOT include any claim that requires refreshing within 12 months. Time-sensitive content goes in Signals, which the agent retrieves and attaches at runtime.

**The 50 vendors:**

Tier 1 (must-cover, 25): AWS, Microsoft, Google Cloud, Oracle, IBM, Salesforce, SAP, ServiceNow, Workday, Adobe, Snowflake, Databricks, Atlassian, OpenAI, Anthropic, Palo Alto Networks, CrowdStrike, Okta, Zscaler, Cisco, Confluent, MongoDB, Elastic, Splunk, GitHub.

Tier 2 (next 25): Coupa, NetSuite, HubSpot, Zendesk, Twilio (Segment), UiPath, Pega, OneTrust, Stripe, Adyen, Shopify, Datadog, New Relic, Dynatrace, GitLab, JFrog, Sonatype, Veeva, nCino, Guidewire, Cerner/Epic, Workday Student, Tyler Tech, Tanium, Wiz.

Tier 3 (defer until benchmark scores demand it): everything else.

### §3.3 · Contract intelligence (`PAT-SRC-CON-*`) — continue v1

v1 list of 30 stands. Add `triggerScenarios` to each as authored.

### §3.4 · Pricing intelligence (`PAT-SRC-PRC-*`) — continue v1

v1 list of 25 stands. Add `triggerScenarios` to each as authored.

### §3.5 · Process and methodology (`PAT-SRC-PROC-*`) — continue v1

v1 list of 20 stands. Most overlap with the new workflow patterns in §3.10. Where overlap exists, prefer the new workflow pattern and reference it from the process pattern.

### §3.6 · Industry overlays (`PAT-SRC-IND-*`) — continue v1

v1 list of 50 stands.

### §3.7 · Regulatory and compliance (`PAT-SRC-REG-*`) — continue v1

v1 list of 15 stands.

### §3.8 · Risk patterns (`PAT-SRC-RSK-*`) — continue v1

v1 list of 25 stands.

### §3.9 · IT-specific complexity (`PAT-SRC-ITX-*`) — NEW

This is the domain v1 missed. These patterns make AbarVa an IT sourcing app rather than a generic procurement app. ~40 patterns, organized in eight clusters.

**Cluster 1 · Cloud commit and marketplace mechanics (~8 patterns):**

- `PAT-SRC-ITX-CLOUD-EDP-001` — AWS Enterprise Discount Program patterns
- `PAT-SRC-ITX-CLOUD-MACC-001` — Azure MACC commitment mechanics
- `PAT-SRC-ITX-CLOUD-CUD-001` — GCP Committed Use Discounts
- `PAT-SRC-ITX-CLOUD-MKT-001` — Hyperscaler marketplace pass-through (private offers, retire commit)
- `PAT-SRC-ITX-CLOUD-EDPTRUE-001` — EDP true-up patterns
- `PAT-SRC-ITX-CLOUD-RIBALANCE-001` — Reserved instance / savings plan rebalancing
- `PAT-SRC-ITX-CLOUD-EGRESS-001` — Egress cost mechanics across clouds
- `PAT-SRC-ITX-CLOUD-SOVEREIGN-001` — Sovereign cloud sourcing decisions

**Cluster 2 · License compliance and audit exposure (~6 patterns):**

- `PAT-SRC-ITX-LIC-MS-001` — Microsoft licensing audit patterns
- `PAT-SRC-ITX-LIC-ORACLE-001` — Oracle audit and ULA mechanics
- `PAT-SRC-ITX-LIC-IBM-001` — IBM PVU and sub-capacity audit patterns
- `PAT-SRC-ITX-LIC-SAP-001` — SAP indirect access and named-user audit patterns
- `PAT-SRC-ITX-LIC-POSITION-001` — Effective license position assessment as sourcing input
- `PAT-SRC-ITX-LIC-MIDAUDIT-001` — Negotiating a renewal while mid-audit

**Cluster 3 · Open source and community-licensed software (~4 patterns):**

- `PAT-SRC-ITX-OSS-COPYLEFT-001` — Copyleft license exposure in vendor selection
- `PAT-SRC-ITX-OSS-RELICENSE-001` — When OSS goes proprietary (the Elastic / MongoDB / Redis / HashiCorp pattern)
- `PAT-SRC-ITX-OSS-SUPPORT-001` — Sourcing commercial support for OSS (Red Hat, Confluent, Canonical)
- `PAT-SRC-ITX-OSS-CONTRIB-001` — Contributing to OSS as a sourcing strategy

**Cluster 4 · Reseller, partner, and channel sourcing (~5 patterns):**

- `PAT-SRC-ITX-CHAN-DIRECT-001` — Direct vs partner buying decision
- `PAT-SRC-ITX-CHAN-MARGIN-001` — Channel margin patterns and pass-through pricing
- `PAT-SRC-ITX-CHAN-GSI-001` — Global SI vs boutique vs offshore-pure-play decision frame
- `PAT-SRC-ITX-CHAN-SISTACK-001` — MSA-with-SI-plus-SOW-stack pattern
- `PAT-SRC-ITX-CHAN-CONFLICT-001` — Conflict-of-interest when SI is also reseller

**Cluster 5 · Multi-vendor program sourcing (~5 patterns):**

- `PAT-SRC-ITX-MULTI-PRIME-001` — Who's the prime in a multi-vendor program
- `PAT-SRC-ITX-MULTI-SEQUENCE-001` — Contract signature sequencing across vendors
- `PAT-SRC-ITX-MULTI-CDP-001` — The CDP build pattern (vendor + SI + DQ + identity + CDP + activation)
- `PAT-SRC-ITX-MULTI-DATA-001` — The modern data stack sourcing pattern
- `PAT-SRC-ITX-MULTI-AIPLAT-001` — The AI platform sourcing pattern

**Cluster 6 · Sourcing in regulated change windows (~4 patterns):**

- `PAT-SRC-ITX-WINDOW-FREEZE-001` — Sourcing during change-freeze periods
- `PAT-SRC-ITX-WINDOW-Q4-001` — Q4 close considerations (vendor and buyer)
- `PAT-SRC-ITX-WINDOW-MA-001` — Sourcing during M&A diligence and integration
- `PAT-SRC-ITX-WINDOW-CIO-001` — Sourcing across CIO transitions

**Cluster 7 · Vendor exit and re-compete (~5 patterns):**

- `PAT-SRC-ITX-EXIT-SWITCH-001` — Switching cost realization patterns
- `PAT-SRC-ITX-EXIT-TRANS-001` — Transition-services contract design
- `PAT-SRC-ITX-EXIT-DATA-001` — Data extraction obligations and what vendors hide
- `PAT-SRC-ITX-EXIT-DUAL-001` — Dual-run windows and the cutover decision
- `PAT-SRC-ITX-EXIT-HCM-001` — The HCM exit pattern (Workday/SAP SuccessFactors switches)

**Cluster 8 · Contract operations and CLM hygiene (~3 patterns):**

- `PAT-SRC-ITX-CLM-LIBRARY-001` — Clause library as a living system
- `PAT-SRC-ITX-CLM-FALLBACK-001` — Fallback positions and when to use them
- `PAT-SRC-ITX-CLM-PAPER-001` — Third-party paper acceptance patterns

### §3.10 · Workflow patterns (`PAT-SRC-WFL-*`) — NEW

Workflow patterns are the procedural know-how of running a sourcing motion well. ~30 patterns. These are the patterns Nexus cites most often in day-to-day program work and that Atlas cites at the portfolio level.

**Motion shapes (~5):**

- `PAT-SRC-WFL-MOTION-4WK-001` — The 4-week sprint sourcing motion
- `PAT-SRC-WFL-MOTION-12WK-001` — The 12-week standard motion
- `PAT-SRC-WFL-MOTION-6MO-001` — The 6-month enterprise motion
- `PAT-SRC-WFL-MOTION-EMER-001` — Emergency / unplanned sourcing
- `PAT-SRC-WFL-MOTION-RENEW-001` — Renewal as a sourcing event

**Stakeholder orchestration (~4):**

- `PAT-SRC-WFL-STAKE-MAP-001` — Stakeholder mapping at intake
- `PAT-SRC-WFL-STAKE-CISO-001` — Bringing security in early vs late
- `PAT-SRC-WFL-STAKE-FIN-001` — Finance involvement timing
- `PAT-SRC-WFL-STAKE-SPONSOR-001` — Sponsor cadence by deal size

**Vendor engagement (~6):**

- `PAT-SRC-WFL-DEMO-DESIGN-001` — Demo script design
- `PAT-SRC-WFL-DEMO-SCORE-001` — Demo scoring during the demo
- `PAT-SRC-WFL-DEMO-RED-001` — Red-team scenario design
- `PAT-SRC-WFL-REF-CALL-001` — Reference call patterns
- `PAT-SRC-WFL-REF-BACK-001` — Backchannel reference patterns
- `PAT-SRC-WFL-PROOF-001` — POC and proof-of-value design

**BAFO and decision (~5):**

- `PAT-SRC-WFL-BAFO-CAL-001` — BAFO as a multi-day calendar
- `PAT-SRC-WFL-BAFO-SEQ-001` — BAFO meeting sequence design
- `PAT-SRC-WFL-BAFO-HOLDBACK-001` — What to hold back vs reveal
- `PAT-SRC-WFL-BAFO-TRAPS-001` — Common BAFO traps
- `PAT-SRC-WFL-AWARD-001` — Award-day playbook (notify in what order)

**Stop-the-line and escalation (~4):**

- `PAT-SRC-WFL-RED-001` — Red flags that should pause a sourcing motion
- `PAT-SRC-WFL-ESCALATE-001` — Escalation patterns when red flags surface
- `PAT-SRC-WFL-WALKAWAY-001` — Credible walkaway signaling
- `PAT-SRC-WFL-RESTART-001` — When to restart vs continue

**Post-signature transition (~6):**

- `PAT-SRC-WFL-TRANS-90DAY-001` — The 90-day window after award
- `PAT-SRC-WFL-TRANS-KICK-001` — Kickoff design
- `PAT-SRC-WFL-TRANS-OWN-001` — Vendor relationship ownership transition
- `PAT-SRC-WFL-TRANS-MEAS-001` — Outcome measurement setup
- `PAT-SRC-WFL-TRANS-LOSE-001` — Managing losing-vendor relationships
- `PAT-SRC-WFL-TRANS-LESSONS-001` — Capturing lessons learned

### §3.11 · Contradiction patterns (`PAT-SRC-CTR-*`) — NEW

Contradiction patterns are first-class objects in v2. ~40 patterns. These cross-cut the other domains and are exactly what makes Atlas valuable — surfacing the contradiction is the senior-practitioner move.

The `ContradictionSeed` type already exists. `PAT-SRC-CTR-*` patterns wrap or reference contradictions and add the sourcing-specific resolution playbook.

**Vendor-buyer contradictions (~10):**

- "Vendor claims X% lift but only when measured against the vendor's own baseline"
- "Vendor's reference customers are all in industries unlike yours"
- "Vendor demo data has more rows than the vendor has total customers"
- "Vendor's stated implementation timeline assumes only their work, not yours"
- "Vendor's TCO model excludes the integration cost they introduce"
- "Vendor's roadmap commitment is to a feature already shipped by a competitor"
- "Vendor pricing flexibility correlates with their fiscal year, not yours"
- "Vendor 'AI capability' is a wrapper around the same models you can use directly"
- "Vendor's compliance certification covers a subset of what they're selling you"
- "Vendor's security posture is excellent except for the surface that touches your data"

**Internal stakeholder contradictions (~10):**

- "CFO wants 3-year commitment for discount; CIO wants 1-year for flexibility"
- "Procurement KPI is savings %; IT KPI is time-to-value"
- "Security wants vendor consolidation; functional teams want best-of-breed"
- "Architect wants modern stack; operations wants vendor they already know"
- "Business owner wants speed; legal wants thoroughness"
- "Sponsor wants the marquee vendor; budget supports the challenger"
- "Finance wants OpEx; tax structure favors CapEx"
- "Data owner wants control; ML team wants frictionless access"
- "Compliance wants audit trail; product wants user experience"
- "Founder/CEO has a relationship with the vendor; team has reservations"

**Process contradictions (~8):**

- "Selection methodology is best-of-breed scoring; outcome decision is incumbent loyalty"
- "RFP scoring is on functional fit; decision is on commercial terms"
- "POC measures the wrong workload"
- "Reference customers are vendor-curated; questions are buyer-curated mismatch"
- "BAFO assumes price flexibility but vendor has nothing to lose"
- "Walk-away leverage exists but timeline doesn't allow using it"
- "Deal owner is too senior to do diligence; diligence team is too junior to be heard"
- "Decision committee has more votes than relevant expertise"

**Market contradictions (~6):**

- "Category leader has feature gaps; category challenger has stability gaps"
- "OSS option is technically superior; commercial support is essential and weak"
- "Specialized vendor fits exactly; platform vendor is already in the stack"
- "Best vendor for use case A is worst vendor for use case B; both are needed"
- "Hyperscaler-native option is cheapest; lock-in is highest"
- "Vendor's roadmap matches your needs; vendor's customer base doesn't"

**Lifecycle contradictions (~6):**

- "Switching cost is calculated against current state, not future state"
- "Renewal pricing is based on usage; usage will drop after a planned migration"
- "Multi-year discount makes sense for predictable workloads; AI workloads are unpredictable"
- "Exit clause looks strong; exit assistance pricing nullifies it"
- "Contract is buyer-friendly; SOWs underneath erode it"
- "MFN clause exists; vendor's pricing model has changed enough to make it meaningless"

---

## §4 · Quality gates · what makes a pattern shippable

Every pattern body must pass these checks before its PR auto-merges. The autonomous loop self-checks each pattern against these.

### §4.1 · Required structural completeness

- [ ] All required `PatternSeed` fields populated (id, slug, title, domain, tier, vertical, thesis, applicability, status, version, confidence, body)
- [ ] Sourcing extension fields populated where applicable
- [ ] **NEW: Behavioral acceptance fields populated (`triggerScenarios`, `behavioralDeltas`, `retrievalTestIds`)**
- [ ] Body length: 400–1500 words depending on pattern type
- [ ] Body contains all required sections per §3 domain guides

### §4.2 · Voice and tone

- [ ] Passes brand voice spec §13 review checklist
- [ ] Operational + technical register per §4 of brand voice spec
- [ ] No promotional content about AbarVa itself
- [ ] **NEW: Voice matches Sentinel register on Sourcing surface — citation-first, contradiction-aware, librarian tone**
- [ ] **NEW: Pattern body language is identical-shape to Programs Phase Pack pattern bodies (same renderer must work for both)**

### §4.3 · Citation density

- [ ] Every quantitative claim has a source
- [ ] Hedge unsourced claims with "estimated" or "varies"
- [ ] No invented numbers, no invented vendor pricing, no invented analyst quotes
- [ ] Where data is unavailable, the body says so plainly

### §4.4 · Cross-references

- [ ] Pattern declares `relatedPatternIds` honestly — at least 2–3
- [ ] Pattern declares `taggedContradictionIds` if active contradictions apply
- [ ] Pattern declares `derivedFromPatternIds` if it specializes a parent

### §4.5 · Determinism

- [ ] No `Date.now()`, `Math.random()`, or runtime calls
- [ ] All field values are static literals
- [ ] `confidence` field set thoughtfully

### §4.6 · TypeScript validation

- [ ] `npx tsc --noEmit` passes
- [ ] Pattern validates against `PatternSeed` type
- [ ] Loader integrity test passes (no orphaned exports)
- [ ] Reference closure test passes (`relatedPatternIds`, `derivedFromPatternIds`, `taggedContradictionIds` all resolve)

### §4.7 · Behavioral acceptance — NEW IN v2

This is the gate that v1 was missing. A pattern is not shippable just because the body is well-written.

- [ ] Pattern declares 2–4 `triggerScenarios`
- [ ] Each `triggerScenario` has been added to `tests/intelligence/sourcing-corpus-behavioral-fixtures.ts`
- [ ] The behavioral retrieval test (`tests/intelligence/sourcing-corpus-behavioral.test.ts`) **runs** against the new fixtures
- [ ] For at least 75% of declared `triggerScenarios`, the pattern is in the top-5 retrieval result
- [ ] At least one `triggerScenario` co-fires with each declared `expectedCoFiringPatternIds` entry
- [ ] The `behavioralDelta` is observable — when this pattern is in the retrieval result, the agent's response demonstrably differs from when it is not (manual check against the existing `agent-retrieval.test.ts` baseline)

If §4.7 fails, the pattern is held with `[NEEDS BEHAVIORAL REWORK]`. Either the pattern body, the `triggerScenarios`, or the retrieval scoring needs adjustment. The loop continues with other patterns; held patterns accumulate for founder review.

### §4.8 · Provenance and write-back compatibility — NEW IN v2

- [ ] Pattern's `sourceBasis` set per `KNOWLEDGE_ROUTE_PROVENANCE_MAP.md`
- [ ] Pattern declares whether it accepts tenant-data overlays (most do; some, like regulatory, do not)
- [ ] Pattern is compatible with the write-back contract in `KNOWLEDGE_ENTERPRISE_DATA_ROOM_WRITEBACK_CONTRACT.md` — i.e., a tenant could attach evidence or annotations to this pattern without breaking the corpus

---

## §5 · Authoring loop mechanics

### §5.1 · Wave structure

**Wave 0 · v2 type extension** (one PR)

- Extend `seed-types.ts` with `TriggerScenario`, `BehavioralDelta`, `triggerScenarios`, `behavioralDeltas`, `retrievalTestIds`
- Create the empty `tests/intelligence/sourcing-corpus-behavioral-fixtures.ts`
- Create the empty `tests/intelligence/sourcing-corpus-behavioral.test.ts` with the harness
- Land before any other v2 wave starts

**Wave 1 · Behavioral baseline** (one PR)

- Run the behavioral benchmark from §11 against the existing 152-pattern corpus
- Score each scenario; record results in `docs/build/SOURCING_BEHAVIORAL_BASELINE.md`
- This is the reference point against which all subsequent authoring is measured
- Auto-merge if the doc is well-formed

**Wave 2 · Augment existing categories** (multiple PRs, parallelized)

- Add `triggerScenarios` and `behavioralDeltas` to existing high-leverage `PAT-SRC-CAT-*` patterns
- Priority order from §3.1
- Re-run benchmark after each PR; record delta
- Stop when behavioral score on category-related scenarios reaches ≥80% of upper bound

**Wave 3 · IT-specific complexity** (`PAT-SRC-ITX-*`, ~40 patterns, parallelized)

**Wave 4 · Workflow patterns** (`PAT-SRC-WFL-*`, ~30 patterns, parallelized)

**Wave 5 · Contradiction patterns** (`PAT-SRC-CTR-*`, ~40 patterns, parallelized)

**Wave 6 · Continue v1 domains** (contracts, pricing, risk, regulatory, industry, vendor profiles)

**Wave 7 · Behavioral benchmark validation** (one PR)

- Re-run the benchmark suite from §11
- Corpus is "v1.0 complete" when score ≥22/27
- Document the result in `docs/build/SOURCING_BEHAVIORAL_v1_0_COMPLETE.md`

**Wave Final · Confirmed not needed**

v1's Wave Final consolidation already happened (PR #1084 wired agent retrieval to corpus; freestanding playbooks deleted). No further runtime refactor is part of this kickoff.

### §5.2 · Auto-approval criteria per PR

A PR auto-merges when **all** of:

1. `pnpm typecheck` passes
2. `pnpm test` passes (including behavioral fixtures)
3. Pattern body passes the §4 quality gates
4. **NEW: §4.7 behavioral acceptance passes**
5. PR title format: `[corpus][<domain>] Author <pattern-id-list> · <count> patterns · <behavioral-delta-summary>`
6. PR description lists each pattern ID, title, body word count, confidence, declared `triggerScenarios`, retrieval test result
7. No file outside `src/lib/intelligence/`, `tests/intelligence/`, or `seed-types.ts` is modified
8. No regression in existing test suites
9. **NEW: Reference closure test green** (no broken cross-references)
10. **NEW: Loader integrity test green** (pattern is loaded, not orphaned)

### §5.3 · Holds and escalations

A PR holds for founder review (does NOT auto-merge) if:

- Any pattern body claims a specific vendor's recent M&A or financial distress without public source citation
- Any pattern body makes a claim about a named regulator's specific enforcement without citation
- Pattern body falls below 400 words despite genuine effort
- Confidence value is set ≥0.85 but citations are thin
- **NEW: §4.7 behavioral acceptance fails after two retry attempts**
- **NEW: Pattern fires on triggerScenarios it shouldn't (over-broad retrieval — surfaces in ≥40% of unrelated test scenarios)**
- **NEW: Pattern conflicts with an existing pattern's behavioralDelta (two patterns prescribe contradictory agent behavior on the same trigger)**

Holds use `[NEEDS REVIEW]`, `[NEEDS BEHAVIORAL REWORK]`, or `[BEHAVIORAL CONFLICT]` PR labels.

### §5.4 · Parallelization

Up to 8 simultaneous open branches across non-conflicting file globs. Domains are mostly independent (different files for `PAT-SRC-CAT-*` vs `PAT-SRC-ITX-*` vs `PAT-SRC-WFL-*` etc.) so most patterns can author in parallel.

**NEW v2 constraint:** at most 2 simultaneous PRs per domain to prevent benchmark-score thrashing. The behavioral baseline must update predictably.

---

## §6 · Source material guidance

### §6.1 · Acceptable source types

Unchanged from v1: public analyst reports, vendor public disclosures, regulatory documents, reputable trade publications, industry consortium publications, AbarVa-observed enterprise programs (when they exist).

### §6.2 · Unacceptable

Unchanged from v1: invented citations, invented pricing, invented analyst quotes, speculation about private financials, marketing copy verbatim.

### §6.3 · When source is unavailable

Unchanged from v1: hedge with "estimated" or "varies", set confidence 0.50–0.70, note the gap, add TODO marker.

### §6.4 · NEW v2 — Source material for IT-specific complexity patterns

`PAT-SRC-ITX-*` patterns about cloud commit programs, license audits, etc. require sources that aren't always in analyst reports. Acceptable sources for this domain include:

- Public AWS/Azure/GCP documentation on commit programs
- Microsoft Volume Licensing Service Center public docs
- Oracle public licensing FAQs and audit notification templates
- Public court filings in licensing disputes (e.g., Mars v. Oracle, City of Denver v. Oracle)
- Industry practitioner write-ups in named publications (The Information, Stratechery, RedMonk, Gartner Peer Insights when cited specifically)
- Public RFP templates from government procurement (state, federal, EU)

When citing public court filings or government RFPs, link to the original document, not a summary.

### §6.5 · NEW v2 — Source material for workflow and contradiction patterns

These domains often draw from practitioner experience rather than published sources. The honest citation pattern is:

- "Observed in n=N enterprise sourcing programs" with N specified, only when AbarVa has actual aggregated observation data
- "Pattern observed by [named practitioner role] across [industry/scale]" without inventing specific organizations
- Reference to published practitioner books or talks (e.g., "Bargaining for Advantage" by Shell, "Getting to Yes" by Fisher/Ury) when the pattern has academic provenance

Workflow and contradiction patterns may have lower citation density than category or pricing patterns. Confidence should be set lower (0.65–0.80 range) to reflect this.

---

## §7 · Tools available to the authoring loop

Unchanged from v1: web search, web fetch, repo search, existing corpus reference. Use them aggressively. A 1000-word pattern body authored without web search is almost certainly speculation.

**NEW v2:** the authoring loop also has access to:

- The behavioral test harness (`tests/intelligence/sourcing-corpus-behavioral.test.ts`)
- The corpus status report (`src/scripts/intelligence/corpus-status-report.ts`)
- The reference closure validator
- The agent retrieval test (`tests/intelligence/agent-retrieval.test.ts`) — run this after authoring to verify the pattern doesn't break existing retrieval

---

## §8 · Estimated PR count and merge cadence

The full v2 corpus expansion is approximately:

- 1 type extension PR (Wave 0)
- 1 behavioral baseline PR (Wave 1)
- ~20 augmentation PRs for existing categories (Wave 2)
- ~15 PRs for IT-specific complexity (Wave 3, batched 2–3 patterns each)
- ~10 PRs for workflow patterns (Wave 4, batched 3 patterns each)
- ~14 PRs for contradiction patterns (Wave 5, batched 3 patterns each)
- ~50 PRs for continued v1 domain authoring (Wave 6)
- 1 behavioral benchmark validation PR (Wave 7)

Total: ~110 PRs. Less than v1's ~200. The reduction is because vendor profiles drop from 200 single-pattern PRs to 50 thin-profile PRs (batched 3–5 each), and because workflow/contradiction patterns batch better than individual vendor profiles.

The loop runs until §11 benchmark scores 22+/27, not until count quotas hit.

---

## §9 · After the corpus expansion

Once the corpus is at depth, downstream work becomes available:

1. **Vendor profile pages on the public site** — `abarva.ai/vendors/{slug}`
2. **Category sourcing playbook pages** — `abarva.ai/categories/{slug}`
3. **Pricing benchmark public surface** — `abarva.ai/benchmarks/`
4. **Contract clause library** — `abarva.ai/contracts/{clause}`
5. **Public Atlas scope expansion** — Atlas now answers from 250+ patterns instead of 30
6. **NEW: Workflow library** — `abarva.ai/workflows/{slug}` — the workflow patterns become a public playbook
7. **NEW: Contradiction library** — `abarva.ai/contradictions/{slug}` — every contradiction becomes a buyer-shareable insight

These downstream surfaces are out of scope for this loop but are unblocked by it.

---

## §10 · Halt conditions

The loop halts on:

**Operational halts (unchanged from v1):**

1. `seed-types.ts` extension PR fails to merge (foundational)
2. The autonomous agent runs out of credit
3. Founder explicitly halts via `docs/build/CORPUS_PAUSE.md`
4. Master orchestration's KF-* waves are still active and would conflict

**NEW v2 — Quality halts:**

5. Behavioral acceptance failure rate exceeds 20% across the last 10 PRs
6. More than 5 patterns merged without firing in any retrieval test in the next 50 PRs (orphan accumulation)
7. Domain coverage skewed: any single domain exceeds 40% of total corpus while another domain sits at <50% of its upper bound
8. Source-citation degradation: average citations-per-pattern drops more than 30% from the prior 20-PR window
9. Behavioral benchmark score drops between waves (regression — new patterns made the corpus worse, not better)
10. Reference closure failure rate exceeds 5% of authored patterns (cross-references aren't resolving)

When a quality halt fires, the loop pauses, writes a diagnostic to `docs/build/CORPUS_QUALITY_HALT.md`, and waits for founder review. The halt is not a failure — it's the loop catching itself before it produces a v1-style ~175-PR drift.

For everything else (slow merges, transient CI failures, individual patterns failing review): continue.

---

## §11 · Behavioral benchmark suite — NEW IN v2

This section defines what "best IT sourcing app in the world" means in concrete, testable terms. The corpus is judged against these scenarios. v1.0 is complete when the suite scores ≥22/27.

Each scenario specifies a user prompt and the behaviors the agent must demonstrate. Each behavior is worth 1 point. The benchmark is run after every wave and recorded in `docs/build/SOURCING_BEHAVIORAL_BASELINE.md` with a delta from prior wave.

### Scenario 1 · The CDW evaluation (7 points)

**Prompt:** "We're evaluating Snowflake vs Databricks for a 50TB analytics workload. Help us think through this."

**Behaviors required:**

1. Cite `PAT-SRC-CAT-CDW-001` (cloud data warehouse category pattern)
2. Surface the TCO normalization concern (per-TB-month vs per-credit-hour vs egress)
3. Flag egress as silent cost — cite `PAT-SRC-ITX-CLOUD-EGRESS-001`
4. Ask about query concurrency profile (analytical vs operational workload)
5. Suggest 3+ reference questions to ask both vendors
6. Recommend a 90-day POC structure with measurable success criteria
7. Surface 2+ contradictions in vendor positioning (e.g., "Snowflake claims simplicity but charges for compute separation; Databricks claims unified but lakehouse adds operational complexity")

### Scenario 2 · The renewal scenario (6 points)

**Prompt:** "Our Salesforce contract renews in 60 days, they're proposing a 12% increase. We have 4,000 seats. What should we do?"

**Behaviors required:**

1. Cite `PAT-SRC-CON-RENEW-001` and `PAT-SRC-CON-RENEW-002` (renewal patterns)
2. Surface MFN clause investigation (is one in the prior contract?)
3. Flag the 60-day window as too tight for credible walkaway — cite `PAT-SRC-WFL-WALKAWAY-001`
4. Suggest competitive shortlist development as leverage even without intent to switch
5. Recommend BAFO timing strategy
6. Surface the AI-feature activation concern — cite `PAT-SRC-VEN-SALESFORCE-001` re: Einstein/Data Cloud activation patterns

### Scenario 3 · The BAFO scenario (5 points)

**Prompt:** "We're going into BAFO with 3 vendors next week for our IAM platform decision. Help us prepare."

**Behaviors required:**

1. Cite `PAT-SRC-WFL-BAFO-CAL-001` (BAFO as multi-day calendar)
2. Suggest specific sequence of meetings — incumbent last or first, with reasoning
3. Identify what to hold back vs reveal across rounds
4. Flag 2+ common BAFO traps (e.g., "vendor's 'final' offer comes with new conditions")
5. Recommend post-BAFO sequence including signal management to losing vendors

### Scenario 4 · The cross-program scenario (4 points)

**Prompt:** "We're sourcing a CDP, a data quality tool, and an SI partner for the same customer-360 program. How should we sequence this?"

**Behaviors required:**

1. Surface the multi-vendor sequencing pattern — cite `PAT-SRC-ITX-MULTI-CDP-001`
2. Identify which contract gets signed first and why (CDP first, then DQ scoped to CDP, then SI scoped to both)
3. Flag the SI conflict-of-interest if the SI is also a reseller of any of the platform vendors — cite `PAT-SRC-ITX-CHAN-CONFLICT-001`
4. Recommend a master MSA approach if the same SI does multiple workstreams

### Scenario 5 · The exit scenario (5 points)

**Prompt:** "We've decided to switch off Workday in 18 months. What do we need to think about?"

**Behaviors required:**

1. Cite `PAT-SRC-ITX-EXIT-HCM-001` (HCM exit pattern)
2. Surface transition-services obligations and Workday's specific exit-assistance pricing pattern
3. Flag data extraction limits — what Workday will and won't export
4. Recommend dual-run window length and decision criteria
5. Identify the typical 60% over-budget pattern in HCM exits and what causes it

### Total: 27 points

**Acceptance bar for v1.0 corpus completion: ≥22/27**

The benchmark is run by `tests/intelligence/sourcing-behavioral-benchmark.test.ts`. The harness invokes the agent retrieval pipeline with each prompt and scores the response against the behavior list. Behaviors are graded by the test, not by humans, using the pattern IDs that surface plus a regex-based check on the response text for the named behavioral elements.

The benchmark is reproducible. Re-running on the same corpus gives the same score (within 1 point of variance from LLM nondeterminism, which is why a single retry is permitted on a borderline behavior).

---

## §12 · Design and look-and-feel alignment with Programs

The corpus authoring is content work, but it ships into a UX. To prevent design drift, v2 locks three structural requirements:

### §12.1 · Pattern body structure mirrors Phase Pack structure

Programs uses `evaluationHint`, gate criteria, and expected artifacts. Sourcing patterns must use the same shape so the same renderer works for both surfaces. Specifically:

- Pattern body sections must use the same heading hierarchy as Phase Pack pattern bodies
- "What this pattern is" first, "When it applies" second, "How to use it" third, "What to watch for" fourth, "References" last
- No surface-specific prose or formatting

### §12.2 · Sentinel voice on Sourcing matches Sentinel voice on Programs

Citation-first, contradiction-aware, librarian register. Same agent, same voice. Concretely:

- Patterns are written in a voice that the agent can quote verbatim
- No marketing language, no AbarVa-promotional framing
- Citations precede claims, not follow them
- Hedging is explicit ("estimated", "varies by", "as observed in")

### §12.3 · The reactive workspace pattern from Programs applies to Sourcing

Conversational query → workspace materializes. The corpus must support this. Concretely:

- Every pattern must produce at least one structured artifact (vendor card, contract clause callout, contradiction flag, BAFO scoreboard, etc.) that can render in the reactive panel
- The artifact type is declared in the `behavioralDeltas` field
- The renderer expects: `pattern-match`, `evidence-highlight`, `cross-program-dependency`, `contradiction-flag`, `vendor-card`, `contract-clause`, `pricing-benchmark`, `workflow-step`

If a pattern can't produce a renderable artifact, it's probably not load-bearing and should be folded into a related pattern.

---

## §13 · Pre-flight gate · before Wave 0 fires

Run these checks before starting Wave 0. If any fail, fix before proceeding.

1. **Verify `CORPUS_PAUSE.md` is absent** (loop is allowed to run)
2. **Verify `PAUSE.md` is absent** (master orchestration not blocking)
3. **Verify Programs Strict Completion has reached its acceptance gate** OR **founder has explicitly authorized v2 corpus loop in parallel** (per the parallelism decision recorded earlier)
4. **Verify the behavioral test harness exists** (will be created in Wave 0; this check is for re-runs)
5. **Verify `KNOWLEDGE_LAYER_AUDIT_CURRENT.md` is current** (within last 7 days)
6. **Verify the architecture vision doc and the readiness doc agree on embedding dimensions** (1536 vs 3072 reconciliation)
7. **Verify `agent-retrieval.ts` is the active retrieval path** (not a stale `stage-playbooks.ts` import — should already be true post-PR-#1084)

If checks pass, fire Wave 0.

---

## §14 · Final note

v1 of this kickoff produced a corpus and proved the binding loop. v2 produces the corpus that makes AbarVa behave like a senior IT sourcing practitioner.

The depth is the moat, but only because behavior is the product. Every pattern authored is a piece of behavior the agent now demonstrates. The autonomous loop's job is to keep authoring patterns that change behavior, never settle for a body that doesn't fire, never invent data, and pause itself when quality slips.

Read every spec file referenced. Run the pre-flight gate. Begin Wave 0. Don't ask for permission between waves.

**Do not respond to this prompt with a plan. Do not summarize. Run the pre-flight gate, then start with Wave 0 — the v2 type extension PR.**

---

**End of sourcing corpus build kickoff v2.**

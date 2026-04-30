# PAT-PRG-AMS-CONSOLIDATION-001 — Pattern Catalog Proposal

**Slice:** OV2-3a-AMS · **Path:** B (gap proposal — pattern does not yet exist)
**Status:** Proposal · **Owner:** Programs / Intelligence
**Source design doc:** `docs/build/PROGRAMS_MODULE_FAILURE_MODE_DRIVEN_DESIGN.md`
**Related:** `feedback_no_demo_thinking`, `feedback_design_thinking_end_to_end`

---

## 1. Premise

The failure-mode-driven Programs design names AMS Consolidation as one of four worked-example archetypes (alongside CDP, Contact Center AI, Demand Forecasting). It appears in every phase walk-through (Scenario C in D.0.8, D.1.8, D.2.8) and has its own full-lifecycle table in §E.3. The Pilot-Readiness Checklist (§F) explicitly lists "Pattern catalog parameterized for the 4 Apex archetypes (CDP, Contact Center AI, AMS Consolidation, Demand Forecasting)" as a gate item.

Today, the pattern catalog ships **6** `PAT-PRG-*` patterns (`src/lib/intelligence/program-lifecycle-patterns.ts`):

- `PAT-PRG-CDP-001`
- `PAT-PRG-AI-CODING-001`
- `PAT-PRG-COPILOT-001`
- `PAT-PRG-LOYALTY-001`
- `PAT-PRG-CC-AI-001`
- `PAT-PRG-DATA-FAB-001`

There is **no** `PAT-PRG-AMS-*` entry. The token `AMS` appears only in references to the *sourcing* pattern `PAT-SRC-AMS-001` (an upstream sourcing event the CDP pattern depends on), not as a program-lifecycle pattern in its own right.

**Consequences of the gap:**

1. **OV2-3a-AMS cannot ship a primer.** Archetype primers are keyed by `patternId` (`src/lib/programs/archetype-primers/index.ts`); without a catalog entry to bind to, a primer would be dangling.
2. **OV2-1d-archetype matching has nothing to match.** The broker hook can tag programs with archetype patterns, but AMS Consolidation programs land on whichever pattern matches loosest (typically none).
3. **The design doc's worked examples are pattern-less.** The Scenario C transcripts in D.0.8 / D.1.8 / D.2.8 describe agent behavior keyed off pattern-specific evidence families and contradiction templates that have no canonical home.
4. **The Apex demo seed anchor explicitly mentions AMS Consolidation as adjacent context** (the AMS Vendor Consolidation source event is referenced from the CDP pattern body), but the program-lifecycle counterpart is missing.

This proposal does not ship the pattern. It documents the gap, proposes the canonical name and minimum content, and lays out the path to closing it without picking up scope that belongs to a separate slice.

## 2. Canonical name

**Proposed id:** `PAT-PRG-AMS-CONSOLIDATION-001`

**Rationale:**

- Matches the existing `PAT-PRG-{ARCHETYPE}-{NNN}` convention.
- Explicit `CONSOLIDATION` qualifier distinguishes this pattern from *generic* AMS engagements (run-the-business managed services, single-vendor renewals, decom-driven AMS exits). Those are different programs with different failure modes — keeping the name specific protects future patterns (`PAT-PRG-AMS-RENEWAL-001`, `PAT-PRG-AMS-DECOM-001`) from collisions.
- The qualifier mirrors how the design doc describes the archetype throughout (every reference is "AMS Consolidation", never bare "AMS").

**Add-only union update required** (`src/lib/intelligence/seed-types.ts`, `ProgramLifecyclePatternId`): append `'PAT-PRG-AMS-CONSOLIDATION-001'`.

## 3. What the pattern needs to carry

Per the `LifecyclePatternSeed` shape (`src/lib/intelligence/seed-types.ts`).

### 3.1 Failure modes (≥ 4)

Drawn from §D.0.3, §D.1.3, §D.1.8 Scenario C, §E.3:

| id | label | stages where it manifests |
|---|---|---|
| `FM-AMS-EVERYWHERE-CHARTER` | Consolidating "all 1,200 apps at once" — no first portfolio segment named | P0, P1 |
| `FM-AMS-ENTHUSIAST-WITHOUT-CIO` | Program owner lacks vendor-decision authority; vendor pushback collapses the consolidation thesis | P0, P2, P3 |
| `FM-AMS-FINANCE-VS-CMDB-MISMATCH` | Run-rate baselined from contracts only; SCCM / EAM / CMDB never reconciled — zombie apps and overcharged retainers go undetected | P1 |
| `FM-AMS-VENDOR-DRIVEN-BAFO` | Vendor sets the BAFO posture; floor concessions undefined; transition-risk treated as vendor's narrative | P2, P3 |
| `FM-AMS-LATE-PRIVACY` | Data-classification audit deferred to P5; privacy obligations surface during transition rather than before consolidation | P1, P3 |
| `FM-AMS-INTEGRATION-DEBT-IGNORED` | Run-rate measured without the integration map — P3 ambushed by integration cost | P1, P3 |

The 10-failure-mode catalog tags this archetype most heavily under **#1 sponsor authority**, **#2 problem definition / first cohort**, **#4 talent/skills (vendor management capacity)**, **#5 workflow change (transition risk)**, **#7 vendor strategy**, **#10 sprawl**.

### 3.2 Contradiction templates (≥ 3)

| id | partyA → partyB | severity |
|---|---|---|
| `CT-AMS-VENDOR-SAVINGS-VS-RUNRATE` | Vendor savings claim → measured run-rate after Finance/CMDB reconciliation | high |
| `CT-AMS-PROMISED-TIMELINE-VS-TRANSITION-RISK` | Vendor's promised consolidation timeline → transition-risk burndown realistic at the integration map | high |
| `CT-AMS-INCUMBENT-ATTESTATION-VS-PERFORMANCE` | Incumbent self-attested SLA / quality posture → measured performance against in-scope portfolio | medium |
| `CT-AMS-FINANCE-INVENTORY-VS-CMDB` | Finance contract registry → SCCM/EAM/CMDB deployed footprint | high |

Each fires inside the `contradiction-detector` lens with a `detectionHint` keyed off keywords surfaced in workshop notes and uploaded artifacts (cf. existing CDP / CC-AI patterns).

### 3.3 Stage-specific expectations (P0–P6)

Direct from §E.3, distilled into `gateCriteria` + `expectedArtifacts`:

| Phase | Healthy AMS Consolidation looks like | Gate-blocking artifacts |
|---|---|---|
| **P0** | First portfolio segment named (e.g. retail merchandising) — anti-`everywhere-charter`. CIO / Application Services Lead is the named sponsor with vendor-decision authority. | `ART-PRG-AMS-P0-01` Charter seed (segment + sponsor) |
| **P1** | Application inventory reconciled (Finance bills vs SCCM/EAM/CMDB actual). Run-rate baseline + integration debt mapped. Privacy / data-classification audit started. | `ART-PRG-AMS-P1-01` Application reconciliation, `…-P1-02` Run-rate baseline, `…-P1-03` Integration map |
| **P2** | Three sourcing options weighed (single-vendor managed / hybrid / in-house+partner). Architecture Review Board signs vendor lock-in posture. /source module engaged. | `ART-PRG-AMS-P2-01` Options-comparison brief, `…-P2-02` Vendor lock-in posture |
| **P3** | Vendor BAFO complete; transition design includes exit-assistance terms; pilot segment = first portfolio segment from P0. | `ART-PRG-AMS-P3-01` BAFO package, `…-P3-02` Transition design |
| **P4** | Pilot-segment transition executed; vendor onboarding complete; integration tested at scale. | `ART-PRG-AMS-P4-01` Transition execution report |
| **P5** | Rollout segment-by-segment; run-rate realized tracked against baseline; transition-risk burndown green. | `ART-PRG-AMS-P5-01` Rollout dashboard |
| **P6** | Quarterly run-rate review; vendor renewal prep at 90 days; pattern catalog harvest. | `ART-PRG-AMS-P6-01` Run-rate review, `…-P6-02` Renewal-readiness checklist |

### 3.4 Co-applies-with patterns

`PAT-SRC-AMS-001` (sourcing event), `PAT-SRC-RFP-001` when consolidation runs through a competitive event, optionally `PAT-PRG-DATA-FAB-001` when the consolidated AMS scope includes data-platform operations.

## 4. Proposed primer outline (for OV2-3a-AMS-FOLLOWUP)

Once the pattern lands in the catalog, the primer file `src/lib/programs/archetype-primers/PAT-PRG-AMS-CONSOLIDATION-001.ts` should follow the existing CDP / CC-AI / Forecast shape. Sketch:

**SMEs (6)** — drawn from §D.1.3 + §E.3:

1. CIO / Application Services Lead — kickoff, sponsor, vendor-decision authority.
2. Vendor Manager — kickoff; owns BAFO posture and exit-assistance terms.
3. Application Owner — data-discovery; per-application context.
4. Architecture Review Board — data-discovery + integration map; signs lock-in posture in P2.
5. Finance Partner — baseline; owns run-rate truth and contract-registry reconciliation.
6. Privacy Counsel — baseline; owns data-classification audit before consolidation.

**Templates (5)** — `kind: 'workshop-guide' | 'spreadsheet' | 'checklist' | 'script' | 'report-skeleton'`:

1. `portfolio-rationalization-workshop-guide` — TIME (Tolerate / Invest / Migrate / Eliminate) facilitator script for the first segment.
2. `run-rate-baseline-spreadsheet` — Finance-billed vs CMDB-deployed reconciliation grid with integration-debt column.
3. `application-inventory-reconciliation-template` — checklist of system-of-record sources to triangulate (Finance, SCCM, EAM, CMDB, ITSM).
4. `vendor-bafo-posture-script` — pre-BAFO posture-setting script anchoring floor / walk-away / lock-in stance before the vendor sets it.
5. `ams-discovery-report-template` — P1 → P2 handoff report skeleton with run-rate, integration map, privacy posture, and segment scoping.

**Workshops (3)** — Day 1 / Day 2 / Day 3 cadence mirroring the CDP primer:

- **Day 1 — Portfolio rationalization.** Application Owner + Architecture Review Board + Vendor Manager run TIME on the P0 segment.
- **Day 2 — Run-rate + integration debt + privacy.** Finance Partner reconciles contract registry against CMDB/SCCM/EAM; ARB pulls the integration map; Privacy Counsel scopes the data-classification audit.
- **Day 3 — Sponsor sync + vendor posture.** CIO 1:1 to confirm the consolidation thesis still holds; Vendor Manager locks BAFO posture before any vendor conversation.

**Data assets to bring (5)** — `format: 'spreadsheet' | 'document' | 'export' | 'image'`:

1. Finance contract registry (current AMS retainers + scope statements).
2. SCCM / EAM / CMDB deployed-application export.
3. Integration map (architecture team, current within 6 months).
4. Headcount allocation (in-house AMS capacity + skills inventory).
5. Existing vendor performance data (incident history, SLA breach log, CSAT).

**Prep checklist (5+)**:

- [ ] First portfolio segment named (anti-`everywhere-charter`).
- [ ] CIO sponsor confirmed in writing with vendor-decision authority.
- [ ] Finance and ITAM contacts identified for inventory reconciliation.
- [ ] Architecture Review Board engagement scheduled before P2.
- [ ] Privacy Counsel scoped for data-classification audit.
- [ ] /source module engagement initiated for the P2 sourcing event.

**Tests** — replicate the CDP / CC-AI / Forecast pattern: presence test (primer registers), shape test (every SME / template / workshop has required fields), and content test (every workshop maps to ≥ 1 SME and ≥ 1 template).

## 5. Path to adding the pattern

Two-step plan; each step is its own slice so this proposal can land without taking on scope it shouldn't.

**Step 1 — Author the seed file** (`OV2-3a-AMS-CATALOG`, follow-up slice):

1. Create `src/lib/intelligence/lifecycle-patterns/PAT-PRG-AMS-CONSOLIDATION-001.ts` (or, if the existing module has not been split into per-pattern files, add the seed to `program-lifecycle-patterns.ts` alongside the other six — match the file's current organization).
2. Author `AMS_CONS_FAILURE_MODES`, `AMS_CONS_CONTRADICTIONS`, `AMS_CONS_STAGES`, `AMS_CONS_GATES`, `AMS_CONS_ARTIFACTS` from §3 above.
3. Add `'PAT-PRG-AMS-CONSOLIDATION-001'` to the `ProgramLifecyclePatternId` union in `seed-types.ts`.
4. Register the pattern in the exported map / array in `program-lifecycle-patterns.ts`.
5. Co-applies-with: `['PAT-SRC-AMS-001', 'PAT-SRC-RFP-001']`.
6. Tests: extend the existing pattern-graph-validation tests so the new pattern's failure modes and contradictions are linted against the catalog rules; ensure `pattern-manifest` resolves the new id.

**Step 2 — Ship the primer** (`OV2-3a-AMS-FOLLOWUP`):

1. Author `src/lib/programs/archetype-primers/PAT-PRG-AMS-CONSOLIDATION-001.ts` per §4.
2. Register in `archetype-primers/index.ts` (export named `AMS_CONSOLIDATION_PRIMER`, append to `PRIMERS` array).
3. Mirror the CDP / CC-AI / Forecast test files in `src/lib/programs/archetype-primers/__tests__/`.

**OV2-1d-archetype matching** already wired through the broker hook — no broker changes needed once the catalog has the entry.

**Pilot-readiness rules apply** (per `feedback_no_demo_thinking`): seed content must be pilot-quality (not stub), the schema must be designed for the eventual scaled solution, and audit / RBAC / RLS / telemetry concerns must already be satisfied by the surrounding intelligence-layer infrastructure (they are — patterns are catalog-only static seeds, no per-tenant write path).

## 6. Open question

**Founder authoring vs engineering-shipped placeholder.**

- **Option A — Founder authors via the corpus loop.** Higher quality. AMS Consolidation joins the queue alongside the other corpus-authored patterns (the recent `PAT-SRC-CAT-*` series shipped at 3 patterns per commit). Longer wall-clock — corpus loop authoring is paced.
- **Option B — Engineering ships a pilot-quality placeholder now.** OV2-3a-AMS-CATALOG is a slice; the seed content above is already drawn from the design doc's worked examples and §E.3 lifecycle table. The corpus loop later refines (adds vendor-landscape entries, pricing benchmarks, regulatory chips, industry variants).

**Recommendation:** Option B. The §E.3 table is already pilot-quality content — it was authored at the design doc level by the founder and signed off as part of the failure-mode-driven design. Encoding it into a catalog seed is a translation, not authoring. The corpus loop's value-add (vendor landscape, pricing benchmarks, regulatory chips) is layered on top and does not block the primer or archetype matching.

This also unblocks OV2-3a-AMS-FOLLOWUP and removes the "AMS programs land on no pattern" gap for downstream archetype-aware features without waiting on the corpus pace.

---

*Slice OV2-3a-AMS shipped this proposal (Path B). Pattern authoring and primer authoring are deliberately scoped to follow-up slices.*

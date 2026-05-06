# Source Audit · M5 · Documentation Drift

| Field | Value |
|---|---|
| Mode | M5 · Doc drift |
| Status | Complete |
| Audit date | 2026-05-06 |
| Sources compared | A=Dossier · B=Design template · C=Walkthrough · D=Code · E=Build spec |
| Findings count | 0 compliance · 11 drift · 6 design observations |

---

## 1 · Critical drift summary

The five-way comparison surfaces **a fundamental architectural conflict** about what kind of system Source is. Each source describes a different agent model:

| Source | Agent model claim |
|---|---|
| **A · Dossier** | One lead agent per stage. Nexus leads 7, Steward leads 2, Atlas leads 2. Sentinel observes. |
| **B · Design template** | One lead agent per stage. Plus category co-leadership (Cloud=Sentinel+Atlas, Data=Steward+Sentinel, Enterprise=Atlas, AMS=Nexus). |
| **C · Walkthrough** | Implicit — follows design template. AMS-Out is Nexus-led. |
| **D · Code** | **All four agents run on every stage in parallel.** `SourceMultiAgentBriefing` always builds Nexus + Sentinel + Atlas + Steward briefings simultaneously. No per-stage lead. ([src/lib/source/multi-agent-briefing.ts:25-30](src/lib/source/multi-agent-briefing.ts:25)) |
| **E · Build spec** | "Source is the **Sentinel-led surface**." ([docs/source-material/build-specs/abarva-source-build-spec.md:17](docs/source-material/build-specs/abarva-source-build-spec.md:17)) |

This is the single most important finding of the audit. Resolving it is a prerequisite for the agent-architecture redesign discussed in §16.1 of the dossier digestion.

---

## 2 · Vocabulary matrix · agent names

| Term | Dossier (A) | Design (B) | Walkthrough (C) | Code (D) | Build spec (E) | Status |
|---|---|---|---|---|---|---|
| Lead orchestration | **Nexus** | Nexus | Nexus | `'nexus'` | (Sentinel-led overall) | Code matches A/B; E disagrees |
| Evidence integrity | **Sentinel** | Sentinel | Sentinel | `'sentinel'` | Sentinel | All match |
| Governance | **Steward** | Steward | Steward | `'steward'` | Steward | All match |
| Executive synthesis | **Atlas** | Atlas | Atlas | `'atlas'` | Atlas | All match |

Agent name spelling: consistent across all five sources. ✓

---

## 3 · Vocabulary matrix · stage names

The eleven canonical stages, with each source's spelling:

| # | Dossier (A) | Design (B) | Code stage_key (D) | Code label | Build spec (E) | Drift |
|---|---|---|---|---|---|---|
| 01 | Strategy | Strategy | `strategy` | "Strategy" | `intake → sourcing_strategy` | E uses **legacy two-stage** approach |
| 02 | Scope | Scope | `scope` | "Scope" | `scope` | OK |
| 03 | RFP / RFI Readiness | RFP | `rfp` | "RFP" | `rfp_rfi_package` | Label differs in build spec |
| 04 | Vendor Responses | Responses | `responses` | "Responses" | `vendor_responses` | Label differs |
| 05 | Evaluation | Evaluate | `evaluation` | "Evaluation" | `evaluation` | OK |
| 06 | Pricing Normalization | Pricing | `pricing` | "Pricing" | (no separate stage) | E **omits Pricing** as separate stage |
| 07 | BAFO / Negotiation | BAFO | `bafo` | "BAFO" | `orals_bafo` | E couples BAFO with Orals |
| 08 | Executive Decision | Decision | `executive_decision` | "Decision" | (under selection) | E **rolls Decision into Selection** |
| 09 | Vendor Selection Readiness | Select | `selection` | "Select" | `selection` | OK |
| 10 | Transition Readiness | Transition | `transition` | "Transition" | `contract_mobilization` | Label differs |
| 11 | Value Realization | Value | `value` | "Value" | `value_realization` | OK |

**Key drift findings:**

- **F-M5-101 · Build spec uses 10 stages, not 11.** The build spec's 10-stage model collapses Strategy + Scope (intake/sourcing_strategy), couples Orals + BAFO, and rolls Decision into Selection. Migration `20260502143000_source_11_stage_lifecycle.sql` (May 2) post-dates the build spec (April 28) and added the 11-stage model — but legacy keys are still permitted. ([supabase/migrations/20260502143000_source_11_stage_lifecycle.sql:11-31](supabase/migrations/20260502143000_source_11_stage_lifecycle.sql:11))

- **F-M5-102 · Code uses both modern AND legacy stage_key sets.** The CHECK constraint allows both. ([supabase/migrations/20260502143000_source_11_stage_lifecycle.sql:11](supabase/migrations/20260502143000_source_11_stage_lifecycle.sql:11)) Real artifacts in the substrate may have either set. M2 must verify which set seeded data uses.

- **F-M5-103 · Stage labels in code are abbreviated** ("RFP" instead of dossier's "RFP/RFI Readiness"). Not a defect — abbreviated labels are appropriate for UI rails — but worth noting that the dossier's longer formal names appear nowhere in code.

---

## 4 · Vocabulary matrix · readiness states

The dossier specifies 13 readiness states. Mapping each to code:

| Dossier state (A) | Design representation (B) | Code modeling (D) | Drift |
|---|---|---|---|
| Missing | "Missing" / dot-neutral | `parse_status='pending'` + no row | Inferred, not enumerated |
| Requested | "Not Requested" or similar | No direct equivalent | **Missing in code** |
| Uploaded | (not visible) | `parse_status='pending'` after row create | Maps |
| Connected | (not in design) | No direct equivalent | **Missing in code** |
| Loaded | "LOADED · NOT PARSED" | `parse_status='pending'` post-upload | Maps |
| Parsed | "PARSED · LOW CONFIDENCE" | `parse_status='parsed'` | Maps |
| Available | "USABLE EVIDENCE" / "Available" | `evidence_state='parsed_uncited'` | Approximate |
| Usable Evidence | "USABLE EVIDENCE" | `evidence_state='cited'` | Approximate |
| Low Confidence | "LOW CONFIDENCE" | `confidence < 0.5` (numeric) | **Threshold-based, not enumerated** |
| Stale | (not in design) | No direct equivalent | **Missing in code** |
| Access Restricted | "Access Restricted" | No direct equivalent | **Missing in code** |
| Not Applicable | (not in design) | No direct equivalent | **Missing in code** |
| Waived | (not in design) | No direct equivalent | **Missing in code** |

**F-M5-104 · 5 of 13 readiness states have no direct code representation:** Requested, Connected, Stale, Access Restricted, Not Applicable, Waived. They may be derivable from other columns or application-level concerns, but they are not enumerated. The dossier's 13-state vocabulary is not faithfully implementable from current substrate.

---

## 5 · Vocabulary matrix · artifact states

| Dossier state (A) | Design (B) | Code `approval_state` (D) | Code `SourceArtifactStatus` type (D) | Drift |
|---|---|---|---|---|
| Not Started | "Not Started" | (no equivalent) | `not_started` | Substrate missing |
| Draft | "Drafting" | `draft` | `draft` | OK |
| Needs Inputs | (not in design) | (no equivalent) | `needs_inputs` | Substrate missing |
| In Review | "In Review" | `in_review` | `needs_review` | Naming mismatch in types |
| Changes Requested | (not in design) | `rejected`? | (not in type) | Code uses `rejected` as proxy |
| Approved | "Approved" | `approved` | `approved` | OK |
| Locked | "Locked" | `locked` | `locked` | OK |
| Issued | "Issued" | (no equivalent) | (not in type) | **Missing** |
| Superseded | (not in design) | `evidence_state='superseded'` | `superseded` | Stored elsewhere |
| Archived | "Archived" | (no equivalent) | `archived` | Type exists, substrate missing |

**F-M5-105 · Substrate `approval_state` enum (6 values) is narrower than `SourceArtifactStatus` type (8 values), which is itself narrower than dossier (10 states).** Two layers of drift. ([src/lib/source/types.ts:69-78](src/lib/source/types.ts:69) — to verify)

---

## 6 · Vocabulary matrix · value realization states

The dossier and design explicitly enumerate 4 value states. Mapping:

| Dossier state | Design rendering | Code | Status |
|---|---|---|---|
| Projected | "PROJECTED" pill | (no enum yet) | **Substrate gap — F-M1-205** |
| Committed | "COMMITTED" pill (amber) | (no enum yet) | **Substrate gap** |
| Measuring | "MEASURING" pill (blue) | (no enum yet) | **Substrate gap** |
| Realized | "REALIZED" pill (green) | (no enum yet) | **Substrate gap** |

**F-M5-106 · Value-state vocabulary is not modeled in substrate.** The substrate has a `value_ledger` artifact_family flag, but no per-line value state column. See F-M1-205 in M1 audit.

---

## 7 · Vocabulary matrix · routes

Six dossier-canonical routes + design's 7th + code-only routes:

| URL | Dossier (A) | Design (B) | Code (D) | Status |
|---|---|---|---|---|
| `/source` | ✓ Dashboard | ✓ Portfolio | ✓ `page.tsx` | OK |
| `/source/events` | ✓ Portfolio | ✓ Portfolio | ✓ `events/page.tsx` | OK |
| `/source/events/[id]` | ✓ Canvas | ✓ Universal canvas | ✓ `[eventId]/page.tsx` | OK |
| `/source/events/[id]/scorecard` | ✓ | ✓ T08 | ✓ | OK |
| `/source/events/[id]/artifacts/[artifactId]` | ✓ | ✓ T09 | ✓ | OK |
| `/source/value` | ✓ Value Ledger | ✓ T11 | ✓ `value/page.tsx` | OK |
| `/source/events/[id]/vendors/[vId]` | ✗ | ✓ T10 | ✗ | **Missing in code** |
| `/source/compare` | ✗ | ✗ | ✓ | **Code-only** |
| `/source/new` | ✗ | T02 modal | ✓ | **Code adds page; design uses modal** |
| `/source/events/[id]/report` | ✗ | ✗ | ✓ | **Code-only** |
| `/source/patterns` | ✗ | ✗ | ✓ | **Code-only** |
| `/source/patterns/[patternId]` | ✗ | ✗ | ✓ | **Code-only** |

**F-M5-107 · `/source/events/[id]/vendors/[vendorId]` design route (T10) is not implemented.** Worth deciding whether the vendor detail surface is needed. Source code currently surfaces vendor data inline in pricing comparison and BAFO panels.

**F-M5-108 · Five code-only routes that have no dossier or design representation:** `/source/compare`, `/source/new` (as a route, not modal), `/source/events/[id]/report`, `/source/patterns`, `/source/patterns/[patternId]`. The patterns subsystem in particular looks substantial in code but is invisible to dossier and design.

---

## 8 · Vocabulary matrix · sourcing categories

Design template B introduces 4 named categories. Code's `event_type` enum:

| Design category (B) | Code `event_type` value (D) | Drift |
|---|---|---|
| Application Managed Services | `managed_service` | Maps |
| Cloud & Infrastructure | `infrastructure` | Maps |
| Data & Analytics | (no value) | **Missing** |
| Enterprise Software | `software` | Maps |
| (none) | `staffing` | Code-only |
| (none) | `consulting` | Code-only |
| (none) | `other` | Code-only |

**F-M5-109 · Design category set ≠ code event_type set.** "Data & Analytics" has no event_type value; code adds `staffing`, `consulting`, `other`. If category drives agent leadership (per design B), this gap blocks the design's category-co-leadership pattern from being implementable.

---

## 9 · Vocabulary matrix · artifact catalog

Dossier §10 lists 13 named artifacts. Code's `artifact_family` enum has 14 values. Mapping:

| Dossier artifact (A) | Code `artifact_family` (D) | Drift |
|---|---|---|
| Sourcing Strategy Memo | `sourcing_strategy` | OK |
| Minimum Data Request | (none) | **Missing in code** |
| Scope Document | `scope_document` | OK |
| RFP Package | `rfp` | OK |
| Pricing Template | `pricing_workbook` | Naming differs |
| Vendor Q&A Tracker | (none) | **Missing in code** |
| Vendor Response Completeness Checklist | (none) | **Missing in code** |
| Pricing Normalization Workbook | `pricing_workbook` | Same family as Pricing Template |
| BAFO Question Pack | `bafo` | Loose mapping |
| Executive Decision Brief | `decision_brief` | OK |
| Vendor Selection Memo | (none) | **Missing in code** |
| Transition Readiness Checklist | `transition_risk_register` | Loose mapping |
| Value Ledger Assumptions | `value_ledger` | Loose mapping |

**Code adds:** `rfi`, `proposal`, `meeting_notes`, `workshop_output`, `other`.

**F-M5-110 · 4 dossier artifacts have no code representation:** Minimum Data Request, Vendor Q&A Tracker, Vendor Response Completeness Checklist, Vendor Selection Memo. These are dossier-canonical artifacts the code does not catalog. Either subdivide existing families to model them, or remove from dossier.

---

## 10 · Persona drift

Dossier names 13 personas. Code reference (file: `src/lib/source/agent-context.ts:SourceUserRole`):

**F-M5-111 · Persona enumeration to verify.** I did not exhaustively check the SourceUserRole enum vs the 13 dossier personas (CIO, CTO, CDO, CISO, CFO, Sourcing Lead, Procurement Lead, Vendor Management Lead, IT Operations Lead, Transformation Lead, Legal/Risk Reviewer, Finance Partner, Program Sponsor). This deserves a follow-up read of `src/lib/source/agent-context.ts`. Logged as a deferred item.

---

## 11 · Design observations

### F-M5-201 · Source has FOUR agent models across five sources of truth
Dossier (1 lead per stage) ≠ Design (per stage + category co-lead) ≠ Code (all 4 in parallel) ≠ Build spec ("Sentinel-led"). This is not minor drift — it's evidence that the agent architecture has never been settled. The redesign exercise should treat this as a forcing function: pick ONE model, propagate to all four artifacts.

### F-M5-202 · The build spec is internally inconsistent
[docs/source-material/build-specs/abarva-source-build-spec.md:17](docs/source-material/build-specs/abarva-source-build-spec.md:17) says "Sentinel-led surface" but [docs/source-material/build-specs/abarva-source-build-spec.md:46](docs/source-material/build-specs/abarva-source-build-spec.md:46) describes `SourceRouteShell` adding "Nexus engagement panel on detail pages." Lead agent vs UI panel are not the same thing, but the conflict is unresolved in the spec itself.

### F-M5-203 · Code has a `multi-agent-types.ts` file that fully embraces parallel agents
The `SourceMultiAgentBriefing` type has Nexus + Sentinel + Atlas + Steward as four equal fields. ([src/lib/source/multi-agent-types.ts:82-96](src/lib/source/multi-agent-types.ts:82)) The architecture is structurally committed to "all four, all the time." Adopting a single-lead model would require a substantial type-level refactor.

### F-M5-204 · Patterns subsystem exists in code but is invisible to dossier and design
`/source/patterns` and `/source/patterns/[patternId]` are real routes. Build spec mentions pattern packs (`'data-ai-modernization-sourcing'`, `'ams-managed-services-sourcing'`). The dossier and design do not reference patterns at all. This may be a code-side concept that needs documentation, or a feature that should be hidden until codified.

### F-M5-205 · Dossier's 13 readiness states are aspirational; code has a working subset
The full 13-state ramp may be more than is needed for the working sourcing event. The code's compressed model (parse_status × evidence_state × confidence) effectively captures 8-10 of the dossier states. Decide whether to expand code or simplify dossier.

### F-M5-206 · Stage label abbreviation in code is appropriate
"RFP" reads better than "RFP/RFI Readiness" on a step rail. The drift is harmless if formal names appear in tooltips or page titles. Verify that.

---

## 12 · Reconciliation priorities for the redesign

Ranked by load-bearing impact for the agent-architecture redesign:

1. **Settle the agent model** (F-M5-201). Pick one of: parallel-all, single-lead-per-stage, per-category-co-lead, hybrid. Drive into all four sources.
2. **Reconcile the 10 vs 11 stage model** (F-M5-101). Build spec needs an update to 11-stage; legacy keys in substrate need a deprecation plan.
3. **Reconcile category enum** (F-M5-109). Adding "Data & Analytics" + tightening event_type may unlock category-co-lead pattern (if chosen).
4. **Decide whether vendor detail route exists** (F-M5-107). Either implement T10 or remove from design.
5. **Document patterns subsystem** (F-M5-204). Either bring into dossier/design or scope decision needed.
6. **Reconcile readiness states** (F-M5-104). 13-state aspirational vs working subset.
7. **Reconcile artifact catalog** (F-M5-110). 4 dossier artifacts missing in code.
8. **Reconcile artifact states** (F-M5-105). 10 vs 8 vs 6 across sources.

---

End of M5.

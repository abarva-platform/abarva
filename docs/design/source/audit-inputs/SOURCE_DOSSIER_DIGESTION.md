# Source Dossier v1 — Structured Digestion Summary

| | |
|---|---|
| **Doc ID** | `SOURCE_DOSSIER_DIGESTION_2026-05-05` |
| **Source document** | `AbarVa_Source_IT_Sourcing_Product_Requirements_Design_Dossier_v1.md` (3,139 lines, ~192KB) |
| **Purpose** | Convert the dossier into a structured baseline that Claude Code can audit current Source implementation against |
| **Status** | Digestion complete · ready to inform audit prompt |

---

## 1 · Document character — what kind of doc this is

The dossier is a **product requirements + experience design + implementation guidance** document. It is unusual in three ways worth flagging up front:

1. **It commits to specific architectural choices.** Four named agents (Nexus, Sentinel, Steward, Atlas), 11 canonical sourcing steps, 13 data readiness states, six routes, seven artifact states. These are not suggestions — the dossier treats them as locked vocabulary.

2. **It is honest about runtime boundaries.** Section 12 enumerates what's implemented vs. partial vs. not started. Section 20 maps runtime capabilities (model gateway, upload/parsing, approval engine) to "do not pretend X exists" rules. The dossier does NOT overpromise.

3. **It has structural template repetition.** Sections 6 (Pages), 16 (Step interaction maps), 17 (Click maps), 22 (Page blueprints) reuse identical templated content per item with only the title changing. This means per-step uniqueness is concentrated in section 5 (Detailed Step Design Sheets), not in the appendices.

The audit must respect these characteristics. The dossier provides a strong baseline for *what should be true*, an honest baseline for *what is implemented*, and a clear set of forbidden behaviors. The audit's job is to verify reality against all three.

---

## 2 · Locked vocabulary — terms the audit must use exactly

These terms appear throughout the dossier as bound vocabulary. Any audit finding that uses different terms has drifted.

### 2.1 Agents (exactly four — no aliases, no nicknames)

| Agent | Role | What it does |
|---|---|---|
| **Nexus** | Lead orchestration | Stage readiness, next action, artifact guidance, vendor clarification, BAFO questions, RFP tier explanation |
| **Sentinel** | Evidence + pattern integrity | Evidence confidence, unsupported vendor claims, loaded vs usable evidence, citation readiness, stale/restricted data |
| **Steward** | Governance + readiness | Stage gates, approvals, data readiness handoffs, audit posture, waiver/defer logic |
| **Atlas** | Executive synthesis | Value/risk tradeoff, decision posture, steering committee implications, CFO/CIO briefing |

### 2.2 Eleven canonical sourcing steps

| # | Name | Primary user question | Lead agent |
|---|---|---|---|
| 01 | Strategy | What technology service, platform, or vendor capability are we sourcing, and why? | Nexus |
| 02 | Scope | Is the IT service scope clear enough for vendor pricing and delivery accountability? | Nexus |
| 03 | RFP / RFI Readiness | Can we release a defensible technology services RFP/RFI package? | Nexus |
| 04 | Vendor Responses | Are vendor responses complete enough to compare? | Nexus |
| 05 | Evaluation | Is evaluation governed enough to support a defensible recommendation? | Steward |
| 06 | Pricing Normalization | Are vendor prices comparable on a like-for-like basis? | Nexus |
| 07 | BAFO / Negotiation | What vendor-specific commercial questions reduce risk and improve value? | Nexus |
| 08 | Executive Decision | What is the executive decision posture given evidence and risk? | Atlas |
| 09 | Vendor Selection Readiness | Is selection review ready, deferred, or blocked? | Steward |
| 10 | Transition Readiness | Are KT, access, runbook, RACI, and continuity plans complete? | Steward |
| 11 | Value Realization | What is projected, committed, measuring, or realized — and how confident? | Atlas |

### 2.3 Six canonical routes

| Route | Page name | Lead agent | Primary question |
|---|---|---|---|
| `/source` | Source Dashboard | Nexus | What Source events need attention right now? |
| `/source/events` | Source Events Portfolio | Nexus | Which sourcing events are active, blocked, waiting, or ready for action? |
| `/source/events/[eventId]` | Source Event Canvas | Nexus | What is happening in this event and what should happen next? |
| `/source/events/[eventId]/scorecard` | Scorecard Governance | Steward | Is the scorecard governed enough to support evaluation? |
| `/source/events/[eventId]/artifacts/[artifactId]` | Artifact Detail / Review | Nexus | What is this artifact, what evidence supports it, and what review state is it in? |
| `/source/value` | Source Value Ledger | Atlas | What value is projected, committed, measuring, or realized, and how confident are we? |

### 2.4 Thirteen data readiness states

`Missing` · `Requested` · `Uploaded` · `Connected` · `Loaded` · `Parsed` · `Available` · `Usable Evidence` · `Low Confidence` · `Stale` · `Access Restricted` · `Not Applicable` · `Waived`

The audit must verify these are all distinguishable in UI and substrate. The most-violated boundary historically: treating `Loaded` or `Uploaded` as `Usable Evidence`.

### 2.5 Ten artifact states

`Not Started` · `Draft` · `Needs Inputs` · `In Review` · `Changes Requested` · `Approved` · `Locked` · `Issued` · `Superseded` · `Archived`

### 2.6 Four value states

`projected` · `committed` · `measuring` · `realized`

The boundary the dossier polices most aggressively: `realized` requires measurement owner + evidence; the UI must NOT show `realized` where only `projected` exists.

### 2.7 Thirteen personas

CIO, CTO, CDO, CISO, CFO, Sourcing Lead, Procurement Lead, Vendor Management Lead, IT Operations Lead, Transformation Lead, Legal/Risk Reviewer, Finance Partner, Program Sponsor.

All thirteen share the same "first three seconds" view (where am I / what's blocked / what does the agent recommend / what do I own). This is a per-persona UI implication the audit must check.

---

## 3 · Forbidden claims — what the implementation must NOT do

Section 15.2 is the most important single section for audit because it enumerates lies the product must not tell. Reproducing verbatim:

1. Do not claim **production readiness** unless required gates pass
2. Do not claim **live telemetry** for seeded data
3. Do not claim **real market benchmark comparisons** without licensed/cited sources
4. Do not claim a document is **usable evidence** merely because it is uploaded or loaded
5. Do not claim **final vendor selection readiness** if blockers remain
6. Do not claim **approval** if only placeholder status exists
7. Do not claim **realized savings** without measurement owner and evidence

Plus from section 2.2 (Non-Goals):

8. Do not build a **general procurement platform**
9. Do not build **chat-first sourcing**
10. Do not make **model calls** until model gateway, context builder, evidence ledger, and safety posture are ready
11. Do not implement **real upload/parsing** as a UI placeholder that implies evidence is usable before conversion and validation
12. Do not implement a **final vendor selection button** or automated award recommendation
13. Do not implement **approval engine behavior** until approvals, audit, permissions, and persistence are designed and validated
14. Do not show **old logo symbols** or unapproved brand marks
15. Do not bury the agent in a rail without **agent editorial and context-used behavior in the main workspace**

These 15 prohibitions are the core audit checklist. Every UI surface gets checked against all 15.

---

## 4 · The "must remain visible" truths

Section 2.3 enumerates seven product truths with explicit design implications. These are positive obligations (must do X) rather than prohibitions (must not do Y).

| Truth | Required design implication |
|---|---|
| Source consumes Admin/Setup data readiness; it does not own connector setup | Data readiness panels must show handoffs to Steward/Admin rather than duplicating setup flows |
| Loaded data is not usable evidence | Panels must distinguish all 13 readiness states |
| RFP readiness is conditional | UI must not show Rich-tier readiness when critical pricing baseline data is missing |
| Vendor pricing is not comparable until normalized | Pricing comparison must show assumptions, exclusions, transition cost, risk-adjusted notes |
| BAFO questions are guidance, not automatic messaging | BAFO panel must not send vendor messages |
| Executive decision is not final selection | Executive decision summary must offer decision posture and tradeoffs, not automated award |
| Stage gates are governance signals today, not full workflow automation | Gate panels must show blockers and required approvals without pretending an approval engine exists |

Each truth becomes an audit assertion — verify the design implication is honored on every relevant surface.

---

## 5 · Universal page acceptance criteria

Section 13.1 enumerates nine universal acceptance criteria that apply to every Source page. The audit treats these as a checklist per route:

1. The **five questions** are answerable within three seconds: where am I, what matters, what is blocked, what does the agent recommend, what should I do next
2. The **primary agent editorial is context-specific** and cannot apply to any generic event
3. **Context-used information** is visible or accessible
4. **Three choices plus custom** appears where the user needs to move workflow forward
5. Data-bound elements map to **deterministic seed data today and a real future data source tomorrow**
6. **Missing data and low confidence states are disclosed honestly**
7. **No model calls, upload/parsing, approval engine, workflow engine, or final selection automation** is implied unless implemented
8. **Page-specific smoke tests** verify the key wireframe contract
9. **No generic chatbot panel** is used as the primary interaction model

---

## 6 · Implementation status snapshot per the dossier

This is the dossier's own self-assessment as of v1.0. The audit must verify these statuses are still accurate.

| Capability | Dossier-stated status | Audit must verify |
|---|---|---|
| Source dashboard | Implemented | Context-used + action enforcement consistent |
| Source events portfolio | Implemented (PR #412) | Drawer/filter polish state |
| Event canvas | Implemented / strong partial | Drawer/action/context consistency |
| Scope workspace | Implemented | Visual QA polish state |
| Data readiness panel | Implemented | Real Admin/Setup live backing deferred |
| RFP readiness | Implemented | No document generation yet |
| Vendor response completeness | Implemented | No real upload/parsing |
| Pricing normalization | Implemented | No market benchmarks or live vendor data |
| BAFO / negotiation | Implemented | No actual vendor messaging |
| Executive decision | Implemented | No final selection automation |
| Vendor selection readiness | **Verify current state** | Status uncertain in dossier — audit must determine |
| Stage gates | Implemented | No workflow/approval engine |
| Artifact strip | Implemented | Artifact detail shell compliance unverified |
| **Scorecard governance** | **Partial / gap** | Steward-led shell needed |
| **Artifact detail** | **Partial / gap** | Review shell + evidence/version placeholders needed |
| **Source value ledger** | **Partial / gap** | Atlas-led shell needed |
| Context-used enforcement | Partial | Route-family consistency needed |
| Upload/parsing | Not started | Must not be implied |
| Approval/workflow engine | Not started | Gate placeholders only |
| Model runtime | Not started | No-model deterministic behavior |

The three explicit "Partial / gap" items (Scorecard Governance, Artifact Detail, Source Value Ledger) are the highest-priority audit verification points — has work happened on these since v1.0?

The "Verify current state" item (Vendor Selection Readiness) is a known dossier gap — the audit must close it.

---

## 7 · Stage-by-stage data requirements (audit anchor points)

Section 9.2 specifies what data each stage requires. These become specific audit questions: "for each tenant, does the substrate hold each required field for each stage?"

| Stage | Required data | Primary consumer agent |
|---|---|---|
| Strategy | Business objective, sourcing category, current vendor posture, target outcomes, owner, stakeholder map, initial value hypothesis | Nexus |
| Scope | Application/workload inventory, ticket history, SLA baseline, current support cost, retained roles, vendor contracts, security requirements | Nexus |
| RFP/RFI Readiness | Scope baseline, pricing template fields, artifact readiness, evidence status, scorecard governance, release approvals | Nexus |
| Vendor Responses | Vendor responses, pricing template status, transition plan, assumptions, exclusions, security response, automation roadmap, evidence links | Nexus |
| Evaluation | Scorecard criteria, evidence status, rationale, risk exceptions, vendor completeness, pricing normalization status | Steward |
| Pricing Normalization | Vendor pricing, volumes, apps, tickets, transition cost, optional/excluded services, SLAs, escalation, on/offshore mix, automation assumptions | Nexus |
| BAFO/Negotiation | Commercial traps, assumptions, exclusions, normalized pricing, evidence status, gate posture, vendor-specific gaps | Nexus |
| Executive Decision | Commercial signals, unified agent missions, vendor tradeoffs, value at stake, evidence confidence, blockers | Atlas |
| Vendor Selection Readiness | Executive summary, stage gates, artifacts, approvals, commercial issues, evidence issues, vendor viability | Steward |
| Transition Readiness | Transition plan, knowledge transfer, access, runbooks, retained/vendor RACI, security onboarding, service continuity risks | Steward |
| Value Realization | Baseline value, committed value, measured outcomes, measurement owner, evidence, variance, service KPIs | Atlas |

---

## 8 · Field-level data binding reference (substrate audit anchor points)

Section 18 enumerates the canonical field names that should exist in the Source context bundle. These map to specific substrate columns the audit must verify.

| Field | Description | Real source tomorrow |
|---|---|---|
| `sourcingEvent.eventId` | Unique event identifier | `sourcing_events.id` |
| `sourcingEvent.tenantSlug` | Tenant/client slug | tenant table / auth context |
| `sourcingEvent.linkedProgramCode` | Linked program | program association table |
| `stage.currentStep` | Current canonical step | workflow state table |
| `stage.gateState` | Current gate state | workflow/gate state table |
| `dataReadiness.category` | Required data category | Admin/Setup data domain readiness |
| `dataReadiness.state` | Readiness state | data readiness service |
| `artifact.status` | Artifact status | artifact store |
| `vendor.responseStatus` | Vendor response state | vendor submission system |
| `pricing.normalizedAnnualRunCost` | Normalized run cost | pricing normalization service |
| `commercialRisk.type` | Risk pattern | commercial risk detector |
| `bafo.vendorQuestions` | Vendor-specific questions | BAFO model / future artifact |
| `executive.decisionPosture` | Executive posture | executive decision summary service |
| `selection.selectionReviewReady` | Selection readiness boolean | vendor selection readiness service |
| `value.realizationState` | Value state | value ledger |
| `evidence.confidence` | Evidence confidence | evidence ledger |

---

## 9 · UI element to data source matrix (UI audit anchor points)

Section 9.3 maps UI elements to seed sources today and real sources tomorrow. The audit walks each row.

| UI element | Seed source today | Real source tomorrow |
|---|---|---|
| Event header | `getSourcingEvent` / demo scenario | tenant event table + program linkage |
| Journey tracker | `source-stage-gates` / mock seed | workflow state engine |
| Data readiness panel | contract-shaped seed readiness | Admin/Setup data readiness service |
| RFP readiness panel | `rfp-readiness` model | artifact/workflow/evidence state |
| Vendor completeness panel | `vendor-response-completeness` model | parsed vendor submissions |
| Pricing normalization | `pricing-normalization` model | pricing template parser + commercial data store |
| BAFO panel | `bafo-negotiation` model | commercial signals + vendor response data |
| Executive decision panel | `executive-decision-summary` model | commercial signal adapter + workflow state |
| Stage gate panel | `source-stage-gates` model | workflow/approval state |
| Artifact strip | mock seed artifact list | artifact store + version/review state |
| Value ledger | `SourceValueLedger` seed | value ledger + measurement evidence |

---

## 10 · Artifact catalog (artifact audit anchor points)

Section 10 specifies thirteen distinct artifacts, their producing/reviewing agents, and required evidence:

| Artifact | Stage | Generated by | Reviewed by | Evidence required |
|---|---|---|---|---|
| Sourcing Strategy Memo | Strategy | Nexus | Steward / Sponsor | Strategy data, sourcing objective |
| Minimum Data Request | Scope | Nexus | Steward / IT Owner | Required baseline data categories |
| Scope Document | Scope | Nexus | Steward / Sourcing Lead | Scope, out-of-scope, assumptions |
| RFP Package | RFP Readiness | Nexus | Steward / Procurement | Scope, data readiness, scorecard |
| Pricing Template | RFP Readiness | Nexus | Procurement / Finance | Pricing fields and assumptions |
| Vendor Q&A Tracker | Vendor Responses | Nexus | Sourcing Lead | Vendor questions and responses |
| Vendor Response Completeness Checklist | Vendor Responses | Sentinel | Nexus / Steward | Required response elements |
| Pricing Normalization Workbook | Pricing Normalization | Nexus | Finance / Atlas | Vendor pricing and assumptions |
| BAFO Question Pack | BAFO/Negotiation | Nexus | Procurement / Legal | Commercial traps and assumptions |
| Executive Decision Brief | Executive Decision | Atlas | Sponsor / CIO / CFO | Tradeoffs, value, risk, evidence |
| Vendor Selection Memo | Vendor Selection Readiness | Atlas / Nexus | Steward / Sponsor | Selection readiness and approvals |
| Transition Readiness Checklist | Transition | Steward | IT Ops / Security | KT, access, runbook, RACI |
| Value Ledger Assumptions | Value Realization | Atlas | Finance / Sponsor | Baseline, owner, evidence |

---

## 11 · Cross-surface requirements (integration audit anchor points)

Section 11 specifies how Source connects to other surfaces:

| Cross-surface link | Requirement |
|---|---|
| Source ↔ Programs | Source events show linked program code; Program pages show Source event chip |
| Source ↔ Admin/Setup | Data readiness gaps route to Admin/Setup; Source consumes readiness, doesn't duplicate setup |
| Source ↔ Intelligence | Commercial risks, evidence gaps, sourcing patterns become Sentinel signals |
| Source ↔ Control Tower | Value at stake, decision posture, blocked gates, commercial risks roll into Atlas executive views |
| Source ↔ Production Readiness | Production readiness tracker reflects route smoke, UI readiness, evidence/upload absence |
| Source ↔ Experience Gallery | Visual + agent-centric rules align with Experience System |

Each represents an integration point the audit must verify functions per spec.

### Consistency rules (section 11.1)

- Stage names must not drift across dashboard, event canvas, scorecard, artifact, value ledger, trackers
- Vendor names must remain consistent across response completeness, pricing, BAFO, executive decision, selection readiness
- Linked program identifiers (e.g. APX-CDP-2026) must render consistently across Programs and Source
- Data readiness state labels must use canonical 13-state list — no synonyms
- Agent names must remain Nexus, Sentinel, Steward, Atlas — no nicknames
- Value states must distinguish projected, committed, measuring, realized

These six consistency rules are testable assertions for the audit.

---

## 12 · Pieces likely superseded since v1.0

Based on context I have from the broader work (6-phase Strategic Moves model, Tower handoff doctrine, recent substrate evolution), some elements of this dossier may have been overtaken by more recent decisions. **The audit must flag these as "potentially superseded" rather than as defects.**

| Dossier claim | Potential supersession | Audit treatment |
|---|---|---|
| "Atlas summarizes for executive views" inside Source | Atlas is now Tower's agent (per recent Tower scoping) — its role inside Source vs. Tower needs reconciliation | Flag as architectural question, not defect |
| Section 11 "Source to Control Tower" rollup model | Tower scope may have evolved since dossier; rollup mechanism may differ | Flag for reconciliation |
| Implementation status statuses (sec 12) | These are v1.0 self-assessments; ground truth needed via current code inspection | Audit verifies, doesn't assume |
| "Vendor Selection Readiness" as a separate stage (step 09) | Need to confirm this is still the model vs. consolidated into Executive Decision | Flag as architectural question |

The audit prompt must explicitly tell Claude Code: when in doubt about supersession, log it as a question to be reconciled, not as a defect.

---

## 13 · What the audit should test (anchor points consolidated)

Pulling together Sections 1-12 of this digestion, the audit has the following testable anchor points:

### A. Vocabulary integrity (section 2)
- 4 agents, exact names, exact roles, present in correct surfaces
- 11 stages, exact names, in correct order, in correct routes
- 6 routes, exact paths
- 13 readiness states, all distinguishable
- 10 artifact states, all distinguishable
- 4 value states, all distinguishable

### B. Forbidden claims (section 3)
- 15 specific prohibitions, each must be checked across every route

### C. Required design implications (section 4)
- 7 product truths, each with explicit UI/agent obligation

### D. Universal page acceptance (section 5)
- 9 criteria applied to each of 6 routes = 54 specific assertions

### E. Implementation status verification (section 6)
- 19 capabilities, each with stated status that must be verified against code

### F. Stage data requirements (section 7)
- 11 stages × N required fields each = ~80 specific data presence checks per tenant

### G. Field-level binding (section 8)
- 16 canonical fields, each with substrate target

### H. UI element binding (section 9)
- 11 UI elements, each with seed source + real source

### I. Artifact catalog (section 10)
- 13 artifacts, each with producer + reviewer + evidence requirement

### J. Cross-surface integration (section 11)
- 6 integration points + 6 consistency rules

That's roughly **300+ discrete testable assertions** the audit can structure itself around.

---

## 14 · Recommended audit modes mapped to this baseline

Refining the original five-modal proposal against what the dossier actually specifies:

| Mode | Anchor points it consumes | Effort estimate |
|---|---|---|
| **M1 Substrate audit** | Sections G (field binding), H (UI binding), F (stage data) | 12-15 hrs (bumped from original 10-12) |
| **M2 Code-path audit** | Sections E (implementation status), H (UI binding), J (cross-surface) | 14-16 hrs |
| **M3 UI deployed audit (Chrome)** | Sections A (vocabulary), C (truths visible), D (universal acceptance) | 8-10 hrs |
| **M4 Agent behavior audit** | Sections A (vocabulary), B (forbidden claims), C (truths) | 10-12 hrs |
| **M5 Documentation drift** | All sections — does code match dossier? | 8-10 hrs |
| **M6 Cross-reference matrix** | All modes synthesized | 6-8 hrs |
| **Total** | | **58-71 hrs** |

The original five-mode estimate was 42-53 hours. Adding the cross-reference matrix as a formal Mode 6 and reflecting the dossier's specificity bumps it to 58-71 hours. Calendar: ~2 weeks with one Claude Code throughput, faster if Mode 3 (Chrome) runs in parallel.

---

## 15 · The audit prompt structure (preview)

Based on this digestion, the audit prompt for Claude Code should have these top-level sections:

1. **Hard scope ground rules** — read-only, no PRs touching `src/`, no migrations, no fixes-while-auditing (lessons from Knowledge Layer audit incident)
2. **The baseline** — embed this digestion summary as the source of truth
3. **The six audit modes** — what each mode produces, where it lives in repo
4. **The supersession protocol** — when reality differs from dossier, log as question first, defect second
5. **Output structure** — seven docs + one gap register + one cross-reference matrix
6. **Acceptance** — all 300+ anchor points verified or flagged
7. **Decision boundary** — audit ends with findings; recommendations for fixes go in gap register; actual fixing is a separate decision afterward

---

## 16 · Open questions for Anand before audit prompt finalizes

Three questions worth answering before I draft the audit prompt:

1. **Atlas scoping** — is Atlas still inside Source as the executive synthesis agent (per dossier), or has it migrated to Tower entirely? This affects how M4 agent behavior tests are scoped.

2. **Single-tenant or multi-tenant audit?** Apex Retail is the dossier's primary demo narrative. Should the audit verify all 5 demo tenants behave per spec, or is Apex Retail the canonical baseline and other tenants are expected to mirror? (My recommendation: audit runs against Apex Retail as baseline; flags drift in other tenants but doesn't fail them.)

3. **Audit reporting cadence** — incremental (each mode produces output as it completes) or final (all modes complete then report)? Incremental gives you visibility but may invite mid-audit course correction. Final is cleaner but slower to first findings. My recommendation: incremental per mode, with a hold-fire rule: no decisions on findings until all modes complete and cross-reference matrix is produced.

---

End of digestion.

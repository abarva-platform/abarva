# Presbyterian Healthcare Services × AbarVa — Pilot Statement of Work (Draft v1)

**Date:** 2026-05-26
**Pilot fee:** $225,000 (one-time, 90 days)
**Year-1 commit decision point:** Day 75 of pilot → $750,000 ARR if criteria met
**Data posture:** Live de-identified clinical/operational data under BAA. PHI processing gated behind Phase-2 milestone.

---

## 1. Executive summary (1 page — paste into MSA / cover memo)

Presbyterian Healthcare Services (Albuquerque, NM; ~$5.1B consolidated revenue; 9 hospitals; 14,000 employees; Presbyterian Health Plan serving 580K+ lives) faces three high-leverage 2026-2027 strategic deadlines:

1. **Turquoise Care Medicaid MCO contract re-procurement** (current contract expires 12/31/2026)
2. **CMS-0057-F Prior Authorization Rule** — operational compliance effective 1/1/2026; FHIR API mandate 1/1/2027
3. **CMS Star Ratings recovery** — flagship MA plan at 3.0 stars (below the 4.0 bonus threshold)

PHS already operates with a governance-first AI posture (formal AI governance committee, data access/security committee, legal/compliance gate on every deployment) and has one production-grade clinical AI deployment (RhythmX AI primary-care copilot, ~200 clinicians since Dec 2024). The pilot's job is to compress the decision cycle on the **next 5–10 AI investments** PHS will defend to the board over the next 18 months, with full evidence provenance and PHS-specific grounding.

AbarVa delivers, in 90 days:
- **One originated clinical AI Move** with named-vendor recommendation, evidence-grounded ROI model, governance-ready submission packet
- **One Source-grounded vendor decision** anchored on the Turquoise Care re-procurement readiness narrative or the ambient-documentation vendor selection
- **One Maestro-level board-pack synthesis** ("PHS Year-1 AI Investment Plan") tying Star Ratings recovery, CMS-0057-F readiness, and Turquoise re-procurement under Dr. Sikka's published governance-first doctrine

If pilot success criteria are met at Day 75, PHS commits to $750,000 ARR for production access through end of FY27.

---

## 2. Pilot context

### Discovery findings (FILL FROM PHS DISCOVERY NOTES — placeholder where I don't have your notes)

- **Executive sponsor:** Dr. Rishi Sikka, CEO (per public AI-governance-first stance; confirm in your notes)
- **Day-to-day pilot owner at PHS:** _[FILL IN — likely a VP-level digital strategy or innovation lead given the CMO seat is currently in transition]_
- **Budget approval path:** _[FILL IN — operations CFO? AI Governance Committee?]_
- **Stated pain points** (verbatim from discovery if available):
  - _[FILL IN — likely include: scaling AI from RhythmX (one deployment) to a portfolio; governance throughput; vendor evaluation overhead; board narrative pressure post-Sikka transition]_
- **Why AbarVa specifically (vs. Deloitte / McKinsey / Accenture):**
  - _[FILL IN — the displacement frame]_
- **What PHS has already tried:** RhythmX AI deployment (Dec 2024) is the only public AI initiative. MedeAnalytics for analytics layer.

### Three modules in scope (per discovery)

- ✅ **Intelligence** — Sentinel + Atlas agent-grounded reasoning
- ✅ **Moves** — program lifecycle for ORIGINATING new AI initiatives (not tracking existing)
- ✅ **Source** — AMS / vendor / RFP / contract intelligence
- ❌ Tower — explicitly out of scope (PHS has insufficient AI portfolio depth to justify the rollup layer in the pilot window)

---

## 3. The three Pilot Anchor Moves

These three Moves are the concrete deliverables. Each maps to a real PHS pressure point.

### Move A — Originate ambient clinical documentation deployment

**Why this Move first:** clean white space (no incumbent vendor publicly named at PHS), direct burnout-mitigation linkage (NM is the only US state to LOSE practicing physicians 2019-2024), Epic-native plug, fast ROI signal (minutes saved per encounter), low BAA-novelty risk (vendor evaluation does not require PHI ingestion).

**AbarVa delivers:**
- **Vendor evaluation matrix** — Abridge / Microsoft DAX / Suki / Nuance scored on Epic integration depth, NM-specific clinical specialty coverage, governance-committee readiness, total cost over 3 years (Source)
- **PHS-specific business case** — clinician time savings × NM physician scarcity × specialty mix, modeled against PHS payor mix (Intelligence)
- **Governance-committee submission packet** — risk classification, model card, data flow diagram, monitoring plan (Moves P1 Charter)

**Outcome by Day 75:** named-vendor recommendation, board-defensible business case, governance-committee submission complete.

### Move B — Source-grounded Turquoise Care MCO re-procurement readiness

**Why this Move:** the **single highest-leverage decision on PHS's 2026 calendar**. Turquoise Care contract expires 12/31/2026; PHP is one of just 4 MCOs holding NM Medicaid. Re-procurement readiness is existential for PHP's $500M+ Medicaid book.

**AbarVa delivers:**
- **AI-enabled HEDIS/quality-lift readiness assessment** — which Star Ratings and HEDIS measures are most addressable via AI (population health, gaps-in-care closure, prior auth automation, ambient docs)
- **Contract-narrative scaffolding** — the parts of the Turquoise re-procurement narrative where AI-enabled population health is a competitive differentiator vs. the other 3 MCOs (Intelligence)
- **AI-readiness evidence binder** — the artifacts (model inventory, governance committee minutes, deployment outcomes, AI/ML quality measures) PHS will need to ship to the NM Health Care Authority during re-procurement

**Outcome by Day 75:** a 30-page Source-grounded re-procurement readiness assessment with specific recommendations, evidence binder framework, and a measurement scorecard PHS can run quarterly through 2026.

### Move C — Maestro "PHS Year-1 AI Investment Plan" board pack

**Why this Move:** Dr. Sikka took over Oct 2024 and has publicly committed to a governance-first AI strategy. The board needs a defensible 18-month AI investment plan that ties to the three 2026-2027 deadlines (Turquoise, CMS-0057-F, Star Ratings 3.0→4.0). This is the McKinsey-displacement deliverable.

**AbarVa delivers:**
- **The board pack itself** — 25-30 slide synthesis: which AI bets, in what sequence, against which deadline, at what cost, with what governance posture
- **Decision-tracking spine** — every recommendation traces to underlying evidence (corpus chunks, vendor data, regulatory text, peer benchmarks) with hover-to-source-document fidelity
- **Quarterly refresh capability** — the same artifacts auto-regenerate when underlying data changes (vs. a one-shot McKinsey deck that goes stale)

**Outcome by Day 75:** board-ready deck reviewed by AI Governance Committee, with auto-refresh capability hooked into the Maestro layer.

---

## 4. 90-day timeline (week-by-week)

| Week | Workstream | Deliverable | Status gate |
|---|---|---|---|
| **Phase 1 — Connect + ground (Weeks 1–3, no-PHI)** | | | |
| 1 | BAA execution + connector kickoff | BAA signed; PHS sandbox tenant provisioned in AbarVa production (RLS-isolated; PHI-blocked) | BAA executed; tenant accessible |
| 1–2 | Discovery deep-dive: stakeholders + systems-of-record inventory + existing governance committee minutes review | Stakeholder map; non-PHI systems inventory; governance baseline; identified data feeds in priority order | Sponsor sign-off on connector priority |
| 2–3 | Connect Workday / Coupa / ServiceNow CMDB (non-PHI metadata only); ingest public Form 990 + investor materials; ingest published quality measures | Data-trust scorecard, signal density per system | First Sentinel session against live PHS substrate (no PHI) |
| **Phase 2 — Originate (Weeks 4–7)** | | | |
| 4 | Move A — ambient documentation vendor matrix | Source-grounded comparison of Abridge / DAX / Suki / Nuance | Vendor matrix reviewed by sponsor + IT |
| 4–5 | Move A — PHS-specific business case | Time savings × physician scarcity × payor mix model; 3-year TCO | Business case reviewed by CFO designate |
| 5–6 | Move B — Turquoise Care readiness assessment | 30-page AI-readiness assessment + evidence binder framework | Reviewed by PHP leadership + AI Governance Committee |
| 5–7 | Move C — Year-1 board pack v1 | Slide pack + decision-tracking spine | Sponsor + Governance Committee review |
| **Phase 3 — Execute + verify (Weeks 8–10)** | | | |
| 8 | Run ONE production decision through the platform end-to-end (e.g., the ambient vendor selection) | Documented vendor selection decision with full evidence trail | Decision logged in AbarVa; outcome on track |
| 9 | Run ONE governance-committee submission through the platform | Submission packet generated from platform, reviewed at next governance meeting | Committee submission accepted |
| 10 | Quarterly-refresh demonstration | Same board pack auto-regenerates when underlying data is updated | Refresh demonstrated to sponsor |
| **Phase 4 — Decide + commit (Weeks 11–13)** | | | |
| 11 | Day-75 ROI memo + Year-1 production rollout plan | Audited dollar-savings + commitment plan | Sponsor reviews |
| 12 | Year-1 contracting conversation | $750K ARR commit decision packet | Executive sign-off path defined |
| 13 | Pilot close-out + transition to Year-1 | Final pilot HTML evidence report + Year-1 SOW signed | Year-1 commit signed OR pilot closes |

---

## 5. Success criteria

Pilot is deemed successful (and Year-1 commit triggered at Day 75) if **all four** of these are demonstrably true:

| # | Criterion | Measurement | Threshold |
|---|---|---|---|
| 1 | Move A landed | Ambient-documentation vendor selected; business case approved; governance submission complete | All three artifacts delivered |
| 2 | Move B landed | Turquoise Care readiness assessment delivered; PHP leadership reviewed; AI Governance Committee accepted the evidence-binder framework | Documented review minutes |
| 3 | Move C landed | Board pack delivered; auto-refresh demonstrated; decision-tracking spine reviewed by Governance Committee | Committee acceptance |
| 4 | Sentinel agent answers PHS-specific questions with named-entity recall | At Day 60: agent answers 10 of 10 demo-class questions (executive bench, application portfolio, vendor renewals, regulatory exposure) with no hallucinations | 0 hallucinations + ≥ 8 grounded answers (using same `demo-question-readiness.mjs` harness AbarVa runs internally) |

Failure to meet (1) AND (4) terminates the pilot with no Year-1 commit obligation. PHS pays the $225K fee regardless; AbarVa absorbs the production-platform cost for the 90-day window.

---

## 6. Data + BAA posture

### Tenant isolation (production-grade)
- PHS gets a dedicated production tenant in AbarVa: `tenant_key = 'presbyterian-health'`, `client_id` provisioned at kickoff
- Row-level security (RLS) on every Supabase table enforces `client_id = current_tenant()` — PHS data never visible to any other tenant
- AbarVa staff access to PHS data requires explicit tenant-scoped service role with audit trail per access
- All AI calls write to `ai_egress_audit` with PHS `tenant_id`, request metadata, and provider/model/decision; auditable from AbarVa Admin → Audit surface

### BAA scope
- **Phase 1 (Weeks 1–3): no PHI.** All ingestion is metadata only (Workday non-PHI fields, ServiceNow CMDB, vendor contracts, governance committee minutes, public Form 990, Star Ratings public data). BAA covers de-identified clinical context.
- **Phase 2 (Weeks 4–7): de-identified clinical data permitted.** Aggregate quality measures, de-identified workflow telemetry. Still no individually identifiable PHI.
- **Phase 3 (Weeks 8–13): PHI ingestion gated behind explicit milestone.** If a Move requires PHI (unlikely in this pilot scope; possible for Move A's clinician time-savings measurement), PHS AI Governance Committee approves the specific data feed before AbarVa receives it. Default: pilot completes WITHOUT PHI ingestion.

### Production-grade RLS audit
- AbarVa commits to a third-party RLS audit before kickoff. **The audit pen-test report is delivered to PHS within 5 business days of BAA execution.** No PHS data ingestion before this report.

### Existing AbarVa BAA template
- Reference: AbarVa standard BAA template — _[link to current rev]_
- PHS-specific redlines tracked in `docs/build/phs-pilot/PHS_BAA_v1.md` (to be authored separately)

### Data localization
- All PHS data resides in US-region Supabase + Azure AI Foundry deployments. No EU, no cross-border replication.

---

## 7. Roles + governance

### PHS roles
| Role | Person | Responsibility |
|---|---|---|
| Executive sponsor | Dr. Rishi Sikka, CEO (confirm) | Final commit authority on Year-1 spend; Governance Committee chair |
| Day-to-day pilot owner | _[FILL IN]_ | Weekly working sessions with AbarVa; gates on each Move |
| AI Governance Committee | Existing PHS body | Reviews each Move's submission packet; gates PHI ingestion if any |
| CISO | Barbara McClung | Reviews RLS audit; BAA red-line lead |
| Legal/compliance | _[FILL IN]_ | BAA and SOW execution |
| PHP leadership | _[FILL IN]_ | Move B (Turquoise re-procurement) primary stakeholder |

### AbarVa roles
| Role | Person | Responsibility |
|---|---|---|
| Pilot owner (single point of contact) | _[FILL IN — likely founder / CEO for a pilot of this stage]_ | Weekly working sessions with PHS; SOW change control |
| Solution architect | _[FILL IN]_ | Connector engineering; tenant provisioning; RLS audit |
| Domain advisor (clinical AI) | _[FILL IN — would benefit from a named healthcare-AI advisor with payvider experience]_ | Move A vendor selection; ambient documentation specifics |
| Maestro lead | _[FILL IN]_ | Board pack synthesis; quarterly-refresh wiring |

### Cadence
- Weekly 60-min working session (sponsor + AbarVa pilot owner + day-to-day owner)
- Bi-weekly 30-min checkpoint with AI Governance Committee
- Day-30, Day-60, Day-75 written checkpoint memos to PHS executive sponsor
- All Sentinel sessions recorded (with consent); transcripts in PHS tenant for audit replay

---

## 8. Pricing + payment terms

### Pilot fee structure
- **Total pilot fee: $225,000**
- **Payment schedule:**
  - $75,000 at SOW execution
  - $75,000 at Day 30 (Phase 1 complete + sponsor sign-off on connector priority)
  - $75,000 at Day 75 (Day-75 ROI memo delivered; Year-1 commit decision made)
- Wire transfer terms; net-30 invoicing
- No travel charged unless PHS requests on-site presence (waived for Albuquerque visits)

### Year-1 ARR
- **$750,000 / year for production access** through FY27
- Auto-renews unless PHS provides 60-day written notice before each anniversary
- Includes:
  - Unlimited Sentinel agent calls within reasonable rate limits
  - Production tenant with full RLS isolation
  - Up to 20 PHS user seats (additional seats $25K/year per 10-seat block)
  - Monthly governance-committee submission packet generation
  - Quarterly Maestro board-pack auto-refresh
  - 24/7 production support (1-business-day SLA on platform issues; 4-hour on tenant-isolation issues)

### What's NOT in the pilot fee
- BAA legal review by PHS counsel (PHS borne)
- PHS-side data prep / cleansing for ingestion (PHS borne)
- Any custom development beyond the three named Anchor Moves (separately scoped)
- Travel for in-person sessions if PHS requests

---

## 9. Risks + mitigations (write into the SOW so PHS reads them)

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| 1 | **HIPAA/BAA review cycle slips the pilot timeline** — PHS Governance Committee operates on a cadence that may not align with our 90-day pilot | HIGH | Pilot slips by 2-4 weeks | Phase 1 designed as no-PHI; PHI gated behind Phase 3 milestone. Pilot can deliver Moves A, B, C without PHI access. Day-1 redline kickoff on BAA with explicit milestones. |
| 2 | **CMO seat is in transition** (post-Jason Mitchell departure March 2025) — clinical-side AI ownership may be unclear during the pilot | MEDIUM | Move A (ambient documentation) loses internal sponsor | Pilot SOW names CEO Sikka as explicit executive sponsor for clinical Moves; new CMO when seated becomes the Move owner via planned hand-off memo at Day 60. |
| 3 | **PHS existing analytics/SI relationships (MedeAnalytics, etc.) push back on AbarVa scope** | LOW-MEDIUM | Internal resistance to platform | SOW explicitly positions AbarVa as the AI-strategy synthesis layer ABOVE existing SI/analytics, not a substitute. No SI displacement scope in pilot. |
| 4 | **Sentinel agent hallucinates on PHS-specific named entities** before substrate is fully loaded | MEDIUM | Trust damage during demo / first sessions | Same fact-fingerprint guardrail we shipped for Northstar prevents fabrication. Day-30 demo-question-readiness audit confirms zero hallucinations before client-visible sessions. |
| 5 | **PHS data prep effort exceeds expectation** — their Workday / ServiceNow / Coupa exports require more cleansing than anticipated | MEDIUM | Phase 1 timeline slip | AbarVa provides a Day-7 data-readiness scorecard surfacing specific cleansing needs. PHS commits to a named data-prep owner. Mutually-defined cleansing scope. |
| 6 | **Turquoise Care re-procurement timing accelerates** (NMHCA may issue RFP earlier than 12/31/2026 expiry) | LOW | Move B may need to deliver faster | Pilot scope flexible: if NMHCA RFP drops during pilot, Move B accelerates to Week 6 deliverable instead of Week 7. |

---

## 10. Term + termination + IP

### Term
- Pilot SOW effective at execution; expires Day 90 unless converted to Year-1 ARR
- Year-1 ARR effective Day 90; one-year initial term; auto-renews unless terminated

### Termination
- PHS may terminate the pilot at any point with 14 days written notice; pro-rated refund on unused pilot fee
- AbarVa may terminate the pilot for non-payment with 30 days written notice and cure
- Either party may terminate Year-1 ARR with 60 days written notice before anniversary
- Termination for cause (data breach, material BAA violation, fraud): immediate, no refund obligation

### IP
- AbarVa retains ownership of the AbarVa platform, code, models, training data, and the AbarVa-authored corpus (industry patterns, regulatory libraries)
- PHS retains ownership of all PHS-supplied data (operational data, financial data, vendor contracts, governance committee minutes)
- **Aggregated, de-identified insights derived from PHS data may inform AbarVa's industry-pattern corpus only after PHS approval per insight class**
- AbarVa receives a non-exclusive perpetual license to reference PHS as a customer in marketing materials AFTER PHS public-relations review

### Data return + deletion
- Within 30 days of any termination: AbarVa exports all PHS-supplied data + derived analyses in machine-readable format and returns to PHS
- Within 60 days of termination: all PHS data is purged from AbarVa systems with attested deletion certificate

### Confidentiality
- Mutual NDA for the term of this SOW plus 3 years
- PHS-specific findings (vendor evaluations, Move B re-procurement readiness, board pack content) are PHS-confidential

---

## 11. Signature block

```
PRESBYTERIAN HEALTHCARE SERVICES
By: ________________________________
Name:
Title:
Date:


ABARVA, INC.
By: ________________________________
Name: Anand Sundaram (or executive signatory)
Title:
Date:
```

---

## 12. Appendix A — What PHS gets that they CAN'T get from McKinsey / Deloitte / Accenture

(Quote-ready for the meeting where someone says "why not just hire Deloitte for this?")

| Comparator | What they deliver | What AbarVa delivers different |
|---|---|---|
| McKinsey AI strategy engagement | 12–16-week study, named team in offices, board-ready deck WITH THEIR LOGO, political work to align stakeholders | Same deliverables (board pack, vendor matrix, business cases) — but auto-refreshable, evidence-traceable to source documents, and PHS-owned. We do not displace McKinsey for the political work — we displace them for the synthesis work that should have been built on your own data. |
| Deloitte / Accenture SI execution | Implementation muscle, change management, 100-FTE pyramid for billable hours | AbarVa is NOT an SI. We sit ABOVE the SI layer, sharpening scope and surfacing lock-in clauses before the SI's SOW is signed. PHS still hires an SI for implementation. |
| KPMG / EY advisory | Governance-framework templates, risk libraries, audit-side advisory | AbarVa's Atlas module provides comparable governance-committee submission packets, but tied to YOUR specific Moves with auto-refresh, not as deliverable PDFs that go stale. |
| Internal team building it themselves | Full ownership, no ongoing fees | Time-to-value: building AbarVa-equivalent internally takes ~18 months and $4M+ headcount. We deliver Day-30 grounded Sentinel against your data. |

---

## 13. Appendix B — What's STILL OUT OF SCOPE for the pilot

(So PHS legal / IT / clinical leadership all see what we are NOT promising)

- Production deployment of any clinical AI model (Move A delivers the SELECTION + business case; deployment is post-pilot)
- Direct integration with Epic clinical workflows (out of pilot scope; Year-1 work)
- PHI processing beyond the de-identified envelope unless explicitly gated through Phase 3 milestone
- Tower module (PHS has insufficient AI portfolio depth in 2026 to justify; revisit in Year-2)
- Replacement of MedeAnalytics or RhythmX AI (both stay; AbarVa sits above them)
- Cybersecurity remediation services beyond surfacing surface-level vendor risks in Source
- Direct CMS / NMHCA filings (we prepare the artifacts; PHS files them)

---

## 14. Open items requiring PHS input before SOW execution

1. **Final executive sponsor confirmation** (assumed: Dr. Sikka). If not Sikka, who?
2. **Day-to-day pilot owner at PHS** (likely a VP-level digital strategy or operations lead)
3. **PHP leadership representative for Move B** (Turquoise re-procurement)
4. **Legal / compliance lead for BAA execution**
5. **Data-prep owner for Phase 1 connector work**
6. **Existing analytics/SI relationships that need scope-fencing** (MedeAnalytics is known; others?)
7. **PHS Form W-9 + ACH wire details for invoicing**
8. **Insurance certificates** (E&O, cyber, general liability — PHS may require)

---

## 15. Companion artifacts (separate documents)

- `PHS_BAA_v1.md` — BAA redlines + PHS-specific addendum (to be authored)
- `PHS_DISCOVERY_NOTES.md` — what we learned in discovery (to be paste-in)
- `PHS_KICKOFF_PLAN.md` — Week-1 detailed plan
- `PHS_RLS_AUDIT_TEMPLATE.md` — production-grade tenant-isolation audit scope

---

**Version history**
- v1 (2026-05-26) — Initial draft, ready for internal review + PHS discovery-notes paste-in
- v2 (planned 2026-05-27/28) — Post-Northstar-demo update with named-entity demonstration evidence; final pricing + legal review
- v3 (target 2026-05-29) — Send to PHS legal

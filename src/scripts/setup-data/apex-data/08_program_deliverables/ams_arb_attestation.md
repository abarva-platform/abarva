# AMS Consolidation 2026 — Architecture Review Attestation

**Program ID:** apex-ams-consolidation-2026
**Phase:** P2 Synthesis
**ARB Session date:** 2026-04-08
**ARB Chair:** Linda Mwangi (VP Enterprise Architecture)
**Status:** Attested with conditions

## 1. Reviewers

- Linda Mwangi (VP EA, chair)
- Diana Lopez (VP Application Services, program co-lead)
- Sarah Whitfield (CISO, observer)
- Daniel Okeke (Director PMO, observer)
- Kevin Harrison (VP CyberSec Ops, joint security review)

## 2. Materials reviewed

- AMS Consolidation 2026 P1 Discovery Package (final)
- Per-application discovery findings (22 apps)
- Vendor BAFO submissions (Wipro, Infosys, TCS — initial)
- Transition risk assessment (per-application)
- Integration map for in-scope apps
- Service-level framework draft

## 3. ARB findings — attested

### 3.1 The portfolio scope is appropriate

The 22 in-scope applications (15 merchandising + 7 supply chain) constitute a coherent portfolio segment for AMS consolidation. Excluded categories (store technology, customer-facing) appropriately deferred. ARB attests that the scope boundary is defensible.

### 3.2 The transition design framework is sound

The framework specifies:
- Per-application transition plan with named technical lead from selected vendor
- 90-day shadow period before responsibility transfer for tier-1 applications
- 60-day shadow period for tier-2 applications
- Knowledge transfer documentation requirement before shadow period start
- Service-level burn-in period of 60 days post-transfer at relaxed SLAs

ARB attests this framework adequately addresses the transition risk pattern that surfaced in the 2023 program.

### 3.3 The integration architecture is preserved

The selected vendor will maintain — not replace — the existing integration topology for in-scope applications. The legacy EDI gateway (Sterling Commerce), the SAP CPI middleware, and the custom ETL paths to Snowflake are out of scope for the AMS contract; they are owned by Apex's internal infrastructure team. Vendor responsibilities end at the application boundary.

### 3.4 Vendor lock-in posture is mitigated

Apex's exit-assistance template language (12-month transition, data export rights, price-locked extension) is required of all three BAFO vendors. ARB has reviewed the language and considers it sufficient for the consolidation's vendor-concentration risk.

### 3.5 Security posture is adequate

CISO joint review (Sarah Whitfield + Kevin Harrison):
- All three BAFO vendors have current SOC 2 Type II
- All three pass Apex's Vendor Risk Questionnaire
- Privileged access management (CyberArk integration) required of selected vendor; all three have committed
- Audit log retention requirements (7 years for SOX-relevant apps) confirmed feasible

## 4. ARB conditions on attestation

The following must be addressed before P3 (Design) close:

### 4.1 Legacy POS application transition risk

The Oracle Retail POS application is on the in-scope list. Per-application discovery flagged it as **transition risk: AMBER**. The application is aging, has limited Apex-side documentation, and is mission-critical for stores.

**ARB condition:** Before P3 close, the selected vendor must produce a detailed POS transition plan with named technical resources who have prior Oracle Retail POS experience. If no vendor can demonstrate prior experience with the specific Oracle Retail POS version Apex runs, ARB may require descoping POS from this consolidation effort.

### 4.2 Edge case — legacy EDI dependencies

Five in-scope applications interact with the legacy Sterling EDI gateway. The EDI gateway is not in scope but the applications' EDI interactions are. The selected vendor must commit to maintaining EDI-pattern competency.

**ARB condition:** Before P3 close, the selected vendor's named technical leads must include EDI-pattern competency demonstrated by reference.

### 4.3 Realized-savings methodology

The program's stated $2.2M annual savings target is a P2 commitment. ARB notes that the 2023 program had $4.2M projected savings that became zero realized after the pause. The Investment Committee is expected to scrutinize the realized-savings methodology.

**ARB condition:** Before P3 close, the program team must produce a realized-savings methodology document approved by Margaret Chen (CFO) that defines:
- What counts as a "realized" saving (vs. paper savings)
- Cadence and authority for reporting realized savings
- Trigger conditions for paper-vs-realized variance escalation

## 5. Outstanding issues for P3

These are not blockers to ARB attestation but require P3 attention:

1. **Service-level framework remains generic.** The current draft specifies SLA structure but not specific SLA values per application tier. Per-application SLA values to be authored in P3 with selected vendor.
2. **Disaster recovery posture** for the consolidated portfolio needs explicit documentation in P3.
3. **Cross-portfolio dependencies** — three of the in-scope applications have dependencies on out-of-scope apps (notably the customer-facing e-commerce platform). P3 design must specify the operational handoff for cross-portfolio incidents.

## 6. Recommendation to program

ARB attests that the P2 synthesis design is sound and recommends advancement to P3 (Design) on completion of the BAFO process. The conditions in section 4 must be satisfied before P3 close.

**Vote:** Unanimous (Linda Mwangi, Diana Lopez, Sarah Whitfield).

## 7. ARB cross-reference

This attestation is cross-referenced against the corpus of past Apex AMS program decisions. Specifically:

- AMS-2023 (paused): the 2023 program lacked an ARB attestation of this depth at P2. The 2026 program incorporates the lessons from that gap.
- The ARB's strict discipline since 2024 (weekly reviews of every program in P2 and P3) is the platform-level mitigation for the 2023 root causes.

---

**Document metadata:**

- Source basis: `tenant_authored`
- Confidence: 1.00
- Status: Attested
- Approval: Linda Mwangi (ARB Chair) — 2026-04-08
- File location: PMO archive
- Next review: at P3 → P4 transition (or earlier if ARB conditions change)

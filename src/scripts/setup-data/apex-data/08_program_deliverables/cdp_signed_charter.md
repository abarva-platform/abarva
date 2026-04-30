# CDP Activation 2026 — Program Charter

**Program ID:** apex-cdp-2026
**Charter version:** 1.0 (signed)
**Charter date:** 2026-03-15
**Phase at signing:** P2 → P3 transition
**Status:** Approved

## 1. Sponsor commitment

**Sponsor:** Jennifer Park, Chief Marketing Officer
**Co-sponsor:** Lynne Stratham, Chief Data Officer

We commit to:
- Available calendar time: 4 hours per month for program reviews + ad-hoc as needed
- Decision authority: discretionary spend up to $500K within approved program budget
- Escalation: any decision not resolved at program level escalates to me within 5 business days
- Succession: in the event of role change, succession owner is Priya Iyer (program lead) until new sponsor is named

## 2. Recommended path

Apex will deploy a Customer Data Platform that unifies customer identity and event data across owned channels and activates that data into marketing, customer experience, and analytics use cases.

The selected platform will be either Treasure Data or Segment (Twilio), with selection to be finalized in P3 after BAFO.

The CDP will:
- Replace Tealium AudienceStream as the primary audience composition layer
- Co-exist with Salesforce Commerce, Klaviyo, Braze, Adobe Target, Salesforce Service Cloud (CDP feeds these systems)
- Co-exist with Snowflake (Snowflake remains source-of-truth for customer master data; CDP enriches and activates)
- Implement deterministic + probabilistic identity resolution
- Activate to owned and paid media channels with consent enforcement at activation time

## 3. Scope boundary

**In scope:**
- All customer interactions on owned web, owned mobile app, in-store transactions, customer service contacts
- Email and SMS activation
- Mobile push activation
- Web personalization activation
- Paid media activation (Meta, Google, TikTok, programmatic display) — Phase 2 of activation, not pilot
- Identity resolution across loyalty, transaction, web cookie, mobile device, email

**Out of scope:**
- B2B customer data (separate small system; not included)
- Vendor/supplier customer data
- Operational analytics use cases that are not customer-facing
- Real-time pricing personalization (explicitly excluded; AI Governance Council policy)
- Hiring/screening AI (explicitly excluded; Council policy)

## 4. Target metrics with kill criterion

| Metric | Current | Target | Kill threshold |
|---|---|---|---|
| Identity match rate | 71% | 87% by end of FY2026 | <78% by Q3 FY2027 = pause and reevaluate |
| Customer acquisition cost (digital) | $84 | $77 by end of FY2027 | >$84 by end of FY2027 = pause |
| E-commerce conversion rate (loyalty) | 4.2% | 4.6% by end of FY2027 | <4.2% sustained Q3-Q4 FY2027 = pause |
| Customer-data activation rate | <5% currently | 60% of audiences activated within 24h of composition | <40% sustained = redesign |

If pause is triggered, the program enters a 60-day evaluation window. Resumption requires re-validation against the kill criteria; cancellation is a possible outcome.

## 5. Architecture review attestation

The Architecture Review Board (chair: Linda Mwangi, VP EA) reviewed the program at the P2 architecture review session on 2026-03-08. The ARB has attested:

- The Snowflake-stays-source-of-truth posture is architecturally sound
- The CDP-Snowflake bidirectional integration is a credible architecture
- Privacy controls (Klaviyo remediation in progress, OneTrust integration, PII vault retained) are designed appropriately
- Data residency requirements are met by the candidate vendors
- Vendor lock-in posture is mitigated by the open-architecture requirement and the explicit exit assistance terms

ARB review document on file.

## 6. Compliance and privacy review

**General Counsel review (Rebecca Singh):**
- DPA template language confirmed required of selected vendor
- AI Governance Council policy on customer-data use confirmed; explicit "no vendor-trained model" language required
- DSR fulfillment integration required

**CISO review (Sarah Whitfield):**
- SOC 2 Type II + ISO 27001 required
- Quarterly third-party risk reassessment after go-live
- Klaviyo classification gap remediation plan confirmed in flight (separate project)

## 7. Stakeholder map

**Champions (active):**
- Jennifer Park, CMO (sponsor)
- Lynne Stratham, CDO (co-sponsor)
- Priya Iyer, VP Digital (program lead)
- James Wright, VP Data Engineering (technical lead)

**Engaged but neutral (require regular communication):**
- Carlos Rivera, CIO
- Sarah Whitfield, CISO
- Rebecca Singh, GC

**Cost-skeptical (require regular reassurance on discipline):**
- Margaret Chen, CFO
- Nathan Kohl, VP Procurement (note: dual role — both program-team member and cost-discipline force)

**Operational impact stakeholders (require change management):**
- Elise Tran, Director Loyalty (CDP success depends on her team's adoption)
- Brendan Fox, Director Customer Service Operations (CDP feeds Service Cloud)
- (vacant) VP Store Tech — need engagement on in-store activation Phase 2

**Dissenter on record:**
- Margaret Chen has noted on the record that the FY2026 cost-takeout posture creates tension with the CDP investment. The IC has approved the budget on the rationale that the FY2027+ savings (digital marketing efficiency + Tealium retirement) are dependent on the CDP being live. Her dissent is on record but not blocking.

## 8. Succession owner

In the event of any executive transition affecting the program:

- Sponsor succession: Lynne Stratham (CDO) is named succession sponsor.
- Program lead succession: Diana Lopez (VP App Services) is named program-lead succession.

## 9. Approvals

Charter signed by:

- Jennifer Park, Chief Marketing Officer (Sponsor) — 2026-03-15
- Lynne Stratham, Chief Data Officer (Co-sponsor) — 2026-03-15
- Linda Mwangi, VP Enterprise Architecture (ARB Chair) — 2026-03-15
- Sarah Whitfield, Chief Information Security Officer — 2026-03-15
- Rebecca Singh, General Counsel — 2026-03-15
- Margaret Chen, Chief Financial Officer (with noted dissent) — 2026-03-15

---

**Document metadata:**

- Source basis: `tenant_authored`
- Confidence: 1.00
- Status: Approved (P2 close gate)
- File location: PMO archive
- Next review: at P3 → P4 transition

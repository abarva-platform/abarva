# First Capital Financial — Change Failure Record

**Tenant key:** `first-capital`
**Last updated:** 2026-04-28
**Maintained by:** James Forsythe (CEO), Karen Nakamura (CIO), Elliot Greenberg (General Counsel)
**Data classification:** Confidential — Internal lessons use only

This document records past transformation attempts that did not achieve their stated objectives. It is not a blame document. Its purpose is to ensure that root causes documented in one generation of programs are explicitly addressed in the next. Each entry includes explicit connections to current active programs.

---

## Failure 1: DIGITAL-PORTAL-2022 — Retail Digital Banking Portal Redesign

**What was approved:** $4.2M for a consumer-facing digital banking portal redesign. Objective: increase digital account opening rates, improve mobile experience, and close the digital adoption gap with peers.

**What happened:** The portal launched in Q2 2023 on time and on budget. Digital adoption reached 41% by Q4 2023, against a 62% target. The primary failure: the portal was built without integration with the FiServ Cleartouch core banking APIs. Real-time account opening still required a branch visit to complete identity verification and account funding. New customers who initiated account opening through the portal and hit the branch requirement abandoned the process at a 72% rate. The digital account open rate moved from 28% to 31% — a 3-percentage-point improvement against a 27-point target.

**Who was involved:** IT (director of digital at the time, position subsequently restructured), Retail Banking (Robert Landon — supportive of the investment, frustrated by the outcome), Finance (Charlotte Reid — approved budget; concerned by the gap between projected and actual adoption). The CDO role did not exist. There was no digital product owner with authority to push back on technical scope decisions or require UX testing with real customer journeys before build.

**Root cause analysis:** The root cause was not technical incompetence — the portal itself functioned correctly. The root cause was organizational: IT built a portal without business-led UX testing at the full customer journey level. The FiServ Cleartouch API limitation was known to the infrastructure team but was not surfaced to the business case authors. There was no role in the organization with both technical fluency and business accountability to bridge this gap. The $4.2M was spent correctly on what was scoped; it was scoped incorrectly.

**Compounding factor:** The 2022–2023 investment priced out a more ambitious digital program for 24 months. Because the portal had just been "modernized," there was no budget appetite for a second attempt until 2025.

**Lessons applied to current portfolio:**

1. *Technical root cause unresolved in fcfi-digital-2026.* The FiServ Cleartouch API limitation is the same technical constraint that caused the DIGITAL-PORTAL-2022 failure. The Deloitte Q4 2025 assessment (ev:fcfi:006) confirmed that Cleartouch cannot expose the REST APIs required for real-time account opening — the exact gap that caused 72% portal abandonment in 2023. The CDO role (Vincent Morales, the organizational fix for the 2022 failure) now exists, but the FiServ limitation remains. The organizational root cause is addressed; the technical root cause is not. Any digital program deliverable that requires real-time account opening is dependent on the core banking decision (fcfi-core-2026) — not on the digital program's own execution.

2. *Business-led UX testing is now a gate requirement.* Patricia Holbrook and Robert Landon co-drafted a P2 gate requirement after the DIGITAL-PORTAL-2022 review: no digital program enters P3 (Design) without a completed user journey map with real customers for each primary flow, and without explicit confirmation of backend API support for each journey step. fcfi-digital-2026 has met this requirement in its P3 gate pass (March 2026). The gate requirement is now institutional, not individual.

3. *Adoption targets in fcfi-digital-2026 must be split between legacy-FiServ-achievable and new-core-required.* The program's 78% consumer adoption target (up from 68%) includes features (real-time account opening, digital-only account funding) that are architecturally dependent on the new core. If the core banking program (fcfi-core-2026) is delayed or descoped, the digital program's 78% target must be revised to reflect which features are achievable on Cleartouch and which are not. This split has not been formally documented in the digital program's current scope. Vincent Morales and Karen Nakamura should present a segmented adoption target model to the CEO by Q3 2026 gate.

---

## Failure 2: WEALTH-CONSOLIDATION-2021 — Wealth Platform Consolidation to Envestnet

**What was approved:** $6.8M to consolidate First Capital's wealth management technology from Advent Geneva + Orion to a single Envestnet platform. Objective: reduce platform fragmentation, improve advisor productivity, and enable self-service wealth portal for clients.

**What happened:** The program launched in Q1 2022 and was paused in Q2 2022 after $2.1M of the $6.8M budget was spent. The program never reached production. Data migration from Advent Geneva failed at the test environment phase: First Capital's Advent Geneva account hierarchy had been customized over 10+ years to accommodate specific trust structures and multi-generational family account relationships. The customizations were beyond the standard Envestnet import specification. Envestnet's implementation team quoted an additional $1.8M–$2.4M and 9 additional months to build custom migration logic — terms that were not in the original contract.

**Who was involved:** Diana Stern (Head of Wealth Management) signed off on the vendor selection and the go-ahead. Karen Nakamura's predecessor in the CIO role conducted a high-level systems review but did not conduct a data architecture review. There was no formal pre-contract data migration assessment. The $6.8M budget was based on Envestnet's standard implementation estimate, which assumed standard account hierarchy structure.

**Diana Stern's specific role:** Diana Stern made the call to pause the program in Q2 2022 after receiving the revised cost and timeline estimate. She presented the situation to Charlotte Reid transparently rather than attempting to absorb the overrun. The pause was handled without significant reputational damage to Stern because of how she managed it. She retains the institutional memory of exactly what went wrong.

**Root cause analysis:** No data architecture review was conducted before vendor selection. The vendor selection process evaluated Envestnet on features, cost, and client references — not on migration capability for the specific First Capital data structure. The gap was discovered only during data export and mapping, by which point $2.1M had been committed and the contract was signed. The contract had no provision for migration complexity risk.

**Compounding factor:** The $2.1M spent on the failed program reduced the wealth business's credibility for technology investment requests for three years. The Q4 2025 evidence (ev:fcfi:011) shows that AUM growth missed by $80M in FY2025 with $60M attributable to net outflows from platform-dissatisfied clients — a direct cost of the three-year delay in addressing the platform situation.

**Lessons applied to current portfolio:**

1. *Envestnet is on the shortlist again in fcfi-wealth-2026, and the 2021 failure is specifically known.* Diana Stern's notes in the program record acknowledge that the vendor shortlist for fcfi-wealth-2026 includes Envestnet (alongside SS&C Advent). The 2021 failure's root cause — inadequate data architecture review before vendor selection — must be formally discharged before any vendor contract for fcfi-wealth-2026 is signed. The deliverable required: an independent data migration assessment covering First Capital's current Advent Geneva account hierarchy, Orion client data structure, and any Salesforce FSC wealth records, conducted before the vendor selection P-gate. Karen Nakamura (CIO) must validate this assessment. Diana Stern cannot self-certify it.

2. *The $7.8M current budget for fcfi-wealth-2026 is almost certainly understated by the same mechanism.* The consultant Diana Stern engaged in Q4 2025 identified $12–15M as the realistic range for comparable implementations. The $7.8M budget was built on preliminary estimates without vendor input — the same budget basis as the 2021 program. Charlotte Reid's review of the revised business case (due by 2026-05-31) must explicitly address the migration complexity scope that caused the 2021 failure to ensure the revised estimate accounts for it.

3. *Diana Stern is the single point of failure for program continuity on fcfi-wealth-2026.* Programs.json lists Stern as both sponsor and lead (the same structure that caused the AML governance gap). The 2021 pause was handled well because Stern has good judgment and transparency instincts. The risk is that her bandwidth is the binding constraint — she is managing a $142M NNM growth shortfall, two advisor departures, and a vendor selection process while also serving as program lead. If she makes the same bandwidth-driven error as in 2021 (approving a vendor without adequate data architecture review), the program will fail for the same reason. An IT co-lead with data migration authority should be named.

---

## Failure 3: AML-RULES-2023 — In-House Transaction Monitoring Model Tuning

**What was approved:** The AML-RULES-2023 effort was not a formal capital program — it was a joint AML team / IT project to retune the Actimize transaction monitoring rules to reduce a false-positive rate that had reached 48%. Estimated effort: approximately $340K in internal resource cost plus $120K in Actimize professional services. No Board approval required. Managed as a compliance operations initiative.

**What happened:** The AML team and IT co-led the retuning effort through 2023. By Q4 2023 the false-positive rate was reduced from 48% to 31% — a genuine improvement. The OCC November 2025 examination, however, rejected the validation methodology used to document the retuning. The OCC finding: the model validation was conducted internally without independent review, and the methodology did not comply with SR 11-7 model risk management guidance (which requires independent model validation for material models). The false-positive reduction was real; the governance of the process was not compliant. The OCC treated the retuning as a model change subject to SR 11-7 validation requirements that had not been met. This contributed directly to the MRAC finding in the November 2025 exam.

**Who was involved:** Patricia Holbrook's predecessor as CCO/BSA Officer led the AML team side. Marcus Osei (CRO, joined January 2022) was involved as CRO oversight. The failure mode is specifically that Osei's team and the AML team cross-reviewed each other's work — each reviewing the other's documentation — without any party truly independent of both. This is the circular oversight pattern.

**Current relevance — Patricia Holbrook's specific knowledge:** Patricia Holbrook joined in September 2023, overlapping with the later stages of the AML-RULES-2023 effort. She is aware of the SR 11-7 finding. Her decision to engage EY for independent model validation on fcfi-aml-2026 is a direct response to this failure. EY engagement addresses the technical model governance gap. It does not address the program-level governance gap (Holbrook as both sponsor and lead) that recreates a version of the same circular oversight risk at a higher level.

**Root cause analysis:** The AML retuning effort was operationally successful by the metric it optimized (false-positive rate). The root cause of the OCC finding was governance design: two teams that reported to each other (CCO/BSA team and CRO team) validated each other's work, creating a closed loop with no external check. SR 11-7 exists specifically to break this loop. The error was not knowing SR 11-7 requirements — the requirement was known. The error was treating it as a documentation exercise rather than a structural independence requirement.

**Compounding factor:** The 2023 false-positive rate improvement (48% → 31%) created a false sense of progress on AML compliance. The current false-positive rate of 31% (ev:fcfi:010) is still above the industry average of 18–22% and is listed as an active risk in the OCC remediation plan. The 2023 effort moved the needle but did not produce a compliant outcome, which is arguably worse than no action: it consumed two years of attention and budget and produced an OCC finding.

**Lessons applied to current portfolio:**

1. *EY independent validation in fcfi-aml-2026 directly addresses the SR 11-7 gap.* The engagement of EY as external validator (listed in programs.json vendor_partners) is the correct structural fix for the technical root cause of AML-RULES-2023. This lesson has been incorporated. The question is whether the engagement scope covers all material model changes — including the Actimize rule retuning currently underway — or only the model validation for the false-positive reduction deliverable. Patricia Holbrook should confirm with EY that their scope covers every model change in the fcfi-aml-2026 program timeline, not only the final deliverable.

2. *Holbrook as both sponsor and lead in fcfi-aml-2026 recreates the circular oversight structure at program level.* AML-RULES-2023's root cause was a closed loop: the people making decisions reviewed their own work. fcfi-aml-2026 has the same structure at program level: Holbrook sets the remediation strategy (as sponsor) and executes it (as lead), with no independent program-level sponsor to question her scope or pace judgment. Marcus Osei (CRO) is the proposed sponsor fix (sig:fcfi:003). Until Osei is formally named as sponsor, the program has a governance gap that the OCC — which is specifically trained to identify SR 11-7 structural failures — will recognize.

3. *Progress metrics that lack independent verification will not satisfy the OCC.* The AML-RULES-2023 effort reported genuine progress (false-positive rate: 48% → 31%) but the OCC rejected the methodology, not the metric. For fcfi-aml-2026, every progress metric submitted in the Q2 and Q3 2026 OCC progress reports must have an independently verifiable source — not just internal measurement. CDD completeness improvement (currently measured by Actimize dashboard + compliance team manual review, ev:fcfi:009) should have an external spot-check layer before OCC submission.

---

## Failure 4: COMMERCIAL-CRM-2020 — Salesforce Financial Services Cloud Deployment

**What was approved:** $3.2M for a Salesforce Financial Services Cloud (FSC) deployment for the commercial banking team. Objective: give Relationship Managers (RMs) a unified client view, improve pipeline management, and enable better cross-sell of treasury management and wealth referrals.

**What happened:** The system went live in Q1 2021 on time and approximately on budget ($3.4M actual). Adoption by RMs was below 30% by end of 2022. By Q4 2023, the pattern had stabilized: RMs use Salesforce FSC to log completed calls (satisfying the minimum compliance requirement) but do not use it to manage pipeline, track opportunities, or record relationship-level intelligence. The commercial banking team treats it as a logging tool, not a management tool. Data quality is low; cross-sell referral tracking is unreliable; the investment thesis (better pipeline visibility → better treasury + wealth cross-sell) has not materialized.

**Who was involved:** The program was led by the commercial banking leadership at the time. Thomas Yuen joined as Head of Commercial Banking in July 2022 (per executive_bench.json: tenure_start 2017-07-01 — note: Yuen has been at FCF since 2017 in various commercial roles; he took the Head role in 2022) and inherited the deployment. He did not design it and did not choose Salesforce FSC. The adoption failure predates his tenure as Head.

**Root cause analysis:** RMs were compensated on loan volume originated, not on CRM data quality or pipeline discipline. The Salesforce FSC implementation required approximately 45 additional minutes per client interaction for complete data entry. With no incentive to spend that time — and a compensation structure that rewarded loan production, not activity logging — RMs made a rational choice to minimize CRM effort. No incentive redesign was included in the program scope. No adoption KPI was owned by a commercial banking sponsor. The program team declared success at go-live (deployment complete, all users licensed) and closed the program. Adoption was someone else's problem.

**Compounding factor:** The low-quality Salesforce FSC data has created a secondary problem: cross-sell reporting from commercial banking to wealth management uses Salesforce data. Because RM pipeline data is unreliable, Diana Stern cannot trust cross-sell referral numbers from commercial banking, which affects her ability to plan advisor capacity and NNM targets. The 2020 program failure is contributing to the wealth AUM growth miss in 2025.

**Lessons applied to current portfolio:**

1. *Thomas Yuen must be a named co-sponsor with adoption KPI accountability for any digital program that touches commercial banking workflows.* The COMMERCIAL-CRM-2020 failure's root cause was a program that changed RM behavior without redesigning RM incentives and without a commercial banking sponsor accountable for adoption outcomes. If fcfi-digital-2026 deploys digital tools to the commercial banking team (the program's current scope includes "banker digital productivity tools deployed to all 68 RMs"), Thomas Yuen must be a co-sponsor with a specific adoption metric. Adoption cannot be defined as "tools deployed." It must be defined as "tools used at specified frequency by RMs for core workflow tasks." Vincent Morales cannot own adoption in a community where he has no relationship capital or incentive leverage.

2. *fcfi-core-2026 cannot succeed as a technology program without a parallel commercial banking process and incentive design workstream.* The core banking modernization will change commercial banking workflows — new transaction entry, new credit decisioning interfaces, new treasury management APIs. If the pattern of COMMERCIAL-CRM-2020 repeats (new system deployed, adoption left to chance), First Capital will have a modern core with the same RM adoption problems. Karen Nakamura's program scope for fcfi-core-2026 should include a formal change management and incentive alignment workstream co-owned by Thomas Yuen. This is not IT's responsibility alone.

3. *The Salesforce FSC data quality problem is a live risk to fcfi-data-gov-2026.* The data governance program (fcfi-data-gov-2026) is attempting to consolidate six unconnected data warehouses into a single governed platform (ev:fcfi:014). Salesforce FSC is not listed as one of the six warehouses but it contains relationship and referral data that will be needed for enterprise analytics and cross-sell measurement. Charlotte Reid (sponsor, fcfi-data-gov-2026) should add Salesforce FSC data quality remediation to the program's scope — with Thomas Yuen as accountable co-sponsor — or explicitly document the exclusion and its implications for any commercial banking analytics deliverable.

---

**Document metadata:**

- Source basis: `tenant_authored`
- Confidence: 0.90 (program records, OCC findings, and vendor contract records verified; individual attribution represents collected management perspective)
- Maintained by: James Forsythe (CEO), Karen Nakamura (CIO), Elliot Greenberg (General Counsel)
- Last reviewed at: 2026-04-28
- Access: CEO + direct reports + Board Audit Committee (on request); not shared with OCC; not exported
- Next review: 2026-07-28

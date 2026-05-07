# Provider-Plan Data Constraints: Meridian Health System and Meridian Health Plans

**Classification:** Internal — Legal and Compliance Sensitive  
**Author:** Rebecca Hollings, General Counsel; Karen Mercer, Chief Compliance Officer  
**Last Reviewed:** March 2026  
**Purpose:** AI agent context document — explains why certain cross-entity data flows are blocked and how this constrains active programs

---

## 1. HIPAA Same-Entity Analysis: Why Meridian Is Not One Entity

### The Common-Ownership Misconception

Meridian Health System (the hospital and employed physician group) and Meridian Health Plans (the Medicare Advantage and commercial insurance entity) share a parent holding company and share executive leadership at the CEO and board level. Employees frequently refer to "Meridian" as a single organization. For HIPAA purposes, they are not.

Under **45 CFR § 164.105**, covered entities with common ownership or control may elect to designate themselves as a single "organized health care arrangement" (OHCA) — but only if they have done so explicitly and have put in place compliant joint notice of privacy practices. Meridian Health System and Meridian Health Plans have **not** made an OHCA election. The two entities each have their own Notice of Privacy Practices, their own HIPAA privacy officer designations, and separate Business Associate Agreements where required.

As a result, for purposes of HIPAA's Privacy Rule:

- **Meridian Health System** is a covered entity acting as a **healthcare provider** under 45 CFR § 160.103. It receives, generates, and maintains protected health information (PHI) in the context of providing treatment.
- **Meridian Health Plans** is a covered entity acting as a **health plan** under 45 CFR § 160.103. It maintains PHI in the context of paying for healthcare services and managing benefit eligibility.

Data flows between these two entities are **not** internal data flows. They are disclosures from one covered entity to another, subject to the full Privacy Rule constraints applicable to third-party disclosures.

### What the Privacy Rule Permits Without Member Authorization

Under **45 CFR § 164.506**, covered entities may use and disclose PHI for Treatment, Payment, and Healthcare Operations (TPO) without individual member authorization. This creates the framework for what can and cannot move between Meridian Health System and Meridian Health Plans:

**Permitted flows (Payment purposes, 45 CFR § 164.501):**
- Claims data from provider to plan: Meridian Health System may submit claims to Meridian Health Plans for services rendered to covered members. This is the primary existing data flow.
- Authorization requests and responses: providers may submit prior authorization requests containing clinical information; the plan may respond with authorization decisions.
- Eligibility verification: the plan may confirm member eligibility to the provider at the point of care.
- Formulary data: the plan may share formulary information with providers to guide prescribing decisions within the provider-patient treatment relationship.

**Permitted flows (Healthcare Operations, 45 CFR § 164.501):**
- Quality assessment and improvement programs where both entities participate under a joint arrangement — but only if Meridian Health System and Meridian Health Plans have a specific data sharing arrangement documented and the population is limited to individuals who have received treatment from Meridian Health System *and* are enrolled in Meridian Health Plans.
- Fraud and abuse detection activities may permit limited data flows under joint compliance programs.

**Flows that require individual authorization (45 CFR § 164.508):**
- Any use of PHI for purposes other than TPO, including predictive modeling that the receiving entity will use for its own business purposes (e.g., plan using provider clinical notes to build risk scores for benefit design or marketing segmentation).
- Sharing of behavioral health, substance use disorder (42 CFR Part 2 applies separately), or HIV-related records requires authorization even within TPO contexts in many states; Virginia follows federal floor with some enhancements.

### What Is Categorically Prohibited

The following disclosures are prohibited regardless of business rationale under HIPAA:

- **Underwriting**: Meridian Health Plans may not obtain PHI from Meridian Health System and use it to make underwriting, eligibility, or benefit design decisions for individual members. 45 CFR § 164.504(f) prohibits health plans from using PHI held by health care providers for underwriting purposes unless the individual has authorized it.
- **Marketing**: Neither entity may use the other's PHI for marketing communications without individual authorization under 45 CFR § 164.508(a)(3).

---

## 2. Current Data Flows Between the Two Entities

### What Actually Moves Today

The following data flows are actively in operation between Meridian Health System and Meridian Health Plans:

**Claims and eligibility (daily batch):**
Meridian Health System submits electronic claims to Meridian Health Plans via standard EDI 837 transactions through a clearinghouse. Claims data feeds back to Epic via the clearinghouse with approximately a **24-hour delay** in adjudication status. This is the most mature integration and is operationally reliable. However, the 24-hour delay means that real-time clinical decision support drawing on claim adjudication data is not possible without infrastructure changes.

**Eligibility and benefits verification (real-time):**
Meridian Health Plans provides real-time eligibility response (EDI 270/271) to Meridian Health System at the point of care via Epic's eligibility integration. This works reliably for active MA and commercial enrollees. Medicare FFS eligibility is verified against CMS directly, not through Meridian Health Plans.

**Prior authorization (request-response, manual and portal-based):**
Meridian Health System submits prior authorization requests to Meridian Health Plans through the Cohere Health portal and via fax backup. Meridian Health Plans returns authorization decisions through Cohere. **This flow is asynchronous and not real-time** — the treating clinician does not see the authorization decision at the point of care in Epic without a manual workflow step. The prior-auth decision is not injected into the clinical workflow automatically; a CBO staff member must check the Cohere portal and update the scheduling note.

**Formulary data (monthly refresh):**
Meridian Health Plans provides formulary data to Meridian Health System in a monthly batch that updates Epic's prescribing decision support. This is adequate for stable formularies but creates a gap when formulary changes occur mid-month (approximately 3-4 formulary changes per month on average).

### What Does Not Move Today

The following data does **not** flow from Meridian Health Plans to Meridian Health System in the current environment:

- **Predictive risk scores**: Meridian Health Plans' actuarial and population health team generates HCC risk scores, predicted total cost of care, and readmission risk flags for MA members. These scores are **not shared with treating clinicians** at Meridian Health System. A treating physician seeing a Meridian Health Plans MA patient has no visibility into the plan's risk assessment for that patient.
- **Medical management decisions**: When Meridian Health Plans' medical management team makes a utilization management decision (including denial reasons, peer-to-peer review findings, or internal clinical criteria applied to authorization decisions), that information is **not pre-shared** with the treating clinician. The clinician learns of a denial through Cohere or fax notification but does not see the plan's clinical reasoning in Epic.
- **Network adequacy gaps**: When Meridian Health Plans identifies that a member needs a specialist not in-network, the member and treating PCP do not receive a proactive notification. The network adequacy gap is a plan-side administrative fact that does not flow to the treating provider.
- **Plan-side care management notes**: When Meridian Health Plans' care management team (led by Dr. Priya Sharma) works with a high-risk member, the care plan notes and intervention history maintained in the plan's care management system (Innovaccer) are **not visible** to treating clinicians at Meridian Health System. A hospitalist admitting a plan-side care-managed patient has no visibility into the plan's care plan for that patient.

---

## 3. What Is Blocked and Why

### Block 1: Pre-populating clinical documentation with claims data

**The situation:** The RCM Modernization program and ambient documentation program have both explored whether claims data from Meridian Health Plans could be used to pre-populate clinical documentation in Epic — specifically, to pull historical diagnosis codes, procedure history, and care gaps from claims and pre-fill HCC documentation reminders at the point of care.

**Why it is blocked:**  
While claims data can flow from provider to plan (for payment), the reverse flow — plan claims history to provider for documentation pre-population — is a disclosure from the plan to the provider for a purpose that is not straightforwardly "treatment." CMS has addressed this in the context of the Interoperability and Patient Access Final Rule (85 FR 25510, CMS-9115-F, effective January 2021), which requires plans to make patient claims data available to patients and upon patient direction to providers through USCDI-compliant APIs. However, **the plan may not proactively push claims history to a specific provider's EHR without a patient access request or a formal OHCA arrangement with proper disclosure**.

Under **45 CFR § 164.506(c)(4)**, a covered entity that participates in an organized health care arrangement may use and disclose the PHI of individuals who are part of that arrangement for the healthcare operations of the arrangement. But Meridian has not created an OHCA, meaning this provision does not apply.

**The practical consequence for meridian-rcm-modernization-2026:** The program cannot leverage Meridian Health Plans' claims history to pre-populate or auto-document HCC codes in Epic encounters without either (a) patient authorization under 45 CFR § 164.508, or (b) creating a formal OHCA with a compliant Joint NOPP, or (c) routing the data disclosure through a patient-directed API request per the Interoperability Rule. None of these pathways are currently in place. Patricia Okafor's team has not yet escalated this to Rebecca Hollings' office; the program's Phase 1 discovery plan should include a formal legal review of the pre-population use case.

### Block 2: Risk stratification scores and predictive models in clinical intervention workflows

**The situation:** Meridian Health Plans generates population health risk scores for MA and commercial members using Innovaccer and actuarial models. The program design for multiple programs implicitly assumes these scores could be used to identify patients for proactive clinical interventions — for example, flagging high-risk patients for outreach from a clinical care manager at Meridian Health System.

**Why it is blocked:**  
Risk stratification scores derived from plan-side data (claims, pharmacy data, enrollment data) are created and held by the **health plan** for health plan operations (utilization management, care management, benefit design). Using these scores to select specific patients for clinical interventions by the **provider** crosses the boundary between plan operations and treatment operations.

Under **45 CFR § 164.501**, healthcare operations includes quality assessment and care coordination — but the definition requires that care coordination activities be for the purpose of the individual's **treatment** and that the PHI be used appropriately within the entity's own operations. When Meridian Health Plans' risk score is disclosed to Meridian Health System for use in clinical care coordination, the disclosure must be under one of the following:

1. A TPO disclosure for **payment** (care coordination to support a value-based arrangement or claims processing): permissible but limited to payment-related purposes.
2. A TPO disclosure for **treatment**: this requires that the provider have an existing treatment relationship or be providing treatment. A proactive outreach to a high-risk member who has not yet presented for care is more difficult to characterize as "treatment" under HIPAA.
3. An **organized health care arrangement** (not in place at Meridian).
4. **Individual authorization**.

Virginia state insurance regulations add an additional layer: the Virginia State Corporation Commission's Bureau of Insurance has issued guidance (Bureau of Insurance Administrative Letter 2019-04) stating that MA plan risk stratification data used in member targeting may require disclosure to members of how their data is being used, creating a state-law Notice of Privacy Practices obligation that is more specific than the federal floor.

**The practical consequence for meridian-ai-governance-2026:** Any AI governance framework that contemplates deploying AI models trained on or fed by plan-side risk data for provider-side clinical intervention workflows must include a legal and compliance review of the specific data flow before deployment authorization is granted. This is a gap in the current AI Governance program's attestation framework, which does not contain a provider-plan data flow classification requirement as of Q1 FY2026. Dr. Anita Krishnamurthy's team needs to add this as a mandatory attestation criterion.

### Block 3: Real-time authorization decisions at point of care

**The situation:** The meridian-prior-auth-2026 program's original design concept included a "real-time authorization advisory" feature in Epic: when a physician orders a service requiring prior authorization, the system would display the likely authorization outcome (approve/deny/pend) before the physician submits the order, theoretically improving care planning and reducing unnecessary authorization requests.

**Why it is blocked:**  
Real-time authorization advisory at the point of care requires the plan to share its authorization decision logic and medical necessity criteria with the provider system in advance of the specific authorization request. This pre-sharing of plan medical management data — specifically, the clinical criteria the plan uses to make authorization decisions — is a form of disclosure of the plan's protected medical management information to the provider.

This is blocked on two grounds:

**First, HIPAA:** The plan's prior authorization criteria are not themselves PHI (they are plan administrative policies), but applying those criteria to a **specific patient encounter** to generate a real-time prediction creates a disclosure loop. The prediction itself is derived from a combination of the patient's PHI (diagnosis, procedure codes) and the plan's authorization logic. Under **45 CFR § 164.506**, the plan may disclose PHI for payment purposes including authorization decisions — but a **predictive pre-authorization advisory** is not an authorization decision; it is a model output that draws on both PHI and plan proprietary data. The permissibility of this flow is unsettled.

**Second, state insurance law (Virginia Code § 38.2-3407.15):** Virginia's prior authorization reform law, enacted 2020, requires health carriers to implement electronic prior authorization capabilities and to respond to authorization requests within specified timeframes. However, the statute does not address pre-sharing of criteria or predictive advisories, and the Virginia State Corporation Commission has not issued guidance on whether predictive PA advisories constitute an insurance product that requires filing or approval. The State Corporation Commission could potentially characterize a predictive PA advisory system as an extension of the plan's utilization management program, which would subject it to the SCC's UM regulation framework (14 VAC 5-230) — triggering additional filing and approval requirements.

**The practical consequence for meridian-prior-auth-2026:** The real-time authorization advisory feature as originally designed requires patient authorization (for the PHI component) plus regulatory clearance from the Virginia SCC (for the UM product question) before it can be deployed. Neither is in place. The program team should re-scope the feature to a **retrospective analytics display** (showing historical authorization outcomes for similar procedures/diagnoses in prior encounters, not a real-time prediction tied to a specific encounter) which is more clearly within the existing TPO framework.

---

## 4. Impact on Active Programs

### meridian-rcm-modernization-2026 (Sponsor: David Park; Lead: Patricia Okafor)

**Primary constraint:** The program's Phase 2 design assumptions include a "Payer Intelligence Layer" that would ingest Meridian Health Plans' clinical criteria, medical management decisions, and denial rationale data into the Epic clinical decision support layer to pre-arm physicians before ordering. This design is blocked under the analysis in Section 3, Block 1.

**Specific blocked use case:** Auto-population of HCC coding prompts in Epic from Meridian Health Plans' claims-derived diagnosis history for the same patient. Without the OHCA election or patient-directed data access, this requires patient authorization at the point of care — which is operationally impractical at scale.

**Required action:** Patricia Okafor must engage Rebecca Hollings' office before Phase 2 build begins to conduct a data flow inventory of every Meridian Health Plans data source assumed in the program design. The current Phase 1 discovery plan does not include a legal/compliance workstream for plan-provider data governance. This should be added as a Phase 1 deliverable with a target completion by June 30, 2026.

**The pathway that is available:** Meridian Health System may use its own Epic claims data (claims it has generated as a provider) for clinical decision support. This is treatment-purpose use of provider-generated data, which is clearly within the TPO framework. The RCM Modernization program should reframe its data strategy around Epic-native historical data rather than plan-side data imports.

### meridian-ai-governance-2026 (Sponsor: Jennifer Wexler; Lead: Anita Krishnamurthy)

**Primary constraint:** The AI Governance program's attestation framework is being designed without a category for "provider-plan data flow" AI deployments — models that draw on data from one Meridian entity to produce outputs used by the other Meridian entity. This gap means the framework would not flag or evaluate the compliance risk of cross-entity AI data flows.

**Specific blocked use case:** Any shared AI model trained on combined provider-plan data (e.g., a readmission prediction model trained on both Epic clinical notes and Meridian Health Plans claims history) is a cross-entity data sharing arrangement that requires either OHCA election, data use agreement between the entities, or individual patient authorization for the training data disclosure. The current attestation framework does not ask whether the training data spans entity boundaries.

**Required action:** Dr. Anita Krishnamurthy must add the following mandatory attestation question to the AI governance use-case registration form: "Does this AI model's training data, inference data, or output data flow from Meridian Health Plans to Meridian Health System (or vice versa) across the covered entity boundary?" If yes, the use case should be automatically routed to Karen Mercer's compliance team for a covered-entity boundary review before attestation is granted.

**The pathway that is available:** AI models that are entirely within one entity's boundary (provider-only or plan-only) are not subject to these constraints. The AI Governance program should explicitly designate each attested AI use case as "provider-scope," "plan-scope," or "cross-entity" in the registry, and develop differentiated attestation pathways for each.

### meridian-prior-auth-2026 (Sponsor: Patricia Okafor; Co-Sponsor: Jennifer Wexler)

**Primary constraint:** The program's most advanced design feature — real-time authorization advisory at the point of care — requires either patient authorization or a product filing with the Virginia State Corporation Commission before deployment. Neither is in place. See Section 3, Block 3 for full analysis.

**Specific blocked use case:** The original program design would display in the Epic ordering workflow a prediction of whether a given service will be authorized by Meridian Health Plans, based on the plan's criteria applied to the patient's clinical data. This is blocked under HIPAA's TPO framework analysis and potentially requires Virginia SCC review as an extension of the plan's UM program.

**Required action:** Rebecca Hollings should brief the prior-auth program steering committee on this constraint before the Phase 4 design is finalized. The program team should revise the real-time advisory feature to a retrospective decision support display (showing aggregate historical authorization rates by procedure/diagnosis category, not individual patient-specific predictions) which is supportable within the existing provider-side data framework.

**Additional constraint:** Even if patient authorization is obtained, using Meridian Health Plans' authorization logic to drive a predictive model that influences which care is ordered creates a potential co-liability issue: if the model incorrectly predicts authorization and the physician adjusts care accordingly, both the plan and the provider may face liability for the outcome. Rebecca Hollings has flagged this as a separate legal risk, independent of HIPAA, that should be addressed in the program's risk register.

---

## 5. Path Forward: Governance Structures That Could Unlock These Flows

### Option 1: Organized Health Care Arrangement (OHCA) Election

Under **45 CFR § 164.105(b)**, Meridian Health System and Meridian Health Plans could elect to be treated as a single organized health care arrangement for purposes of HIPAA compliance. This election would require:

1. Both entities must participate in joint healthcare activities that constitute "healthcare operations" under 45 CFR § 164.501 — which their joint care management programs (e.g., shared care coordination for MA members who are also Meridian patients) do satisfy.
2. Both entities must adopt a joint Notice of Privacy Practices (NOPP) disclosing the arrangement to patients.
3. The NOPP must be distributed to all patients and members — a significant operational undertaking given Meridian's patient volume (approximately 320,000 active patients and 87,000 MA members, with significant overlap).
4. Legal review of whether Virginia state insurance law imposes additional requirements on an OHCA-affiliated health plan.

**Timeline and scale:** Rebecca Hollings estimates a 12-18 month timeline to properly execute an OHCA election, including NOPP redesign, patient notification, system updates, workforce training, and Virginia SCC consultation. The full executive team — including Thomas Hartwell (President, Meridian Health Plans), Dr. Elaine Morales (CEO), and Karen Mercer (CCO) — would need to sponsor this initiative. It is not a program that can be embedded in any of the current four active programs without a dedicated governance track.

**Benefit once complete:** An OHCA election would substantially resolve the data governance constraints described in this document, enabling legitimate shared data flows for care coordination, AI model training, and clinical decision support across the provider-plan boundary. It would be a multi-year strategic enabler for the full suite of provider-plan integration use cases in Meridian's FY2027 strategy.

### Option 2: Member-Directed Consent Framework via Patient Access APIs

CMS's Interoperability and Patient Access Final Rule (CMS-9115-F) requires MA plans to implement FHIR-compliant APIs that allow members to direct their health data (including plan claims history) to third-party applications and providers of their choice. Meridian Health Plans is required to have complied with this rule as of July 2021.

Under this framework, Meridian Health System could develop a workflow where:

1. At registration or first MA encounter, a Meridian patient/member is presented with a consent request to share their Meridian Health Plans claims and care management data with their Meridian Health System clinical team.
2. Upon consent, Meridian Health Plans' API delivers the patient's claims history, care management notes, and risk data to Epic via FHIR.
3. The Epic CDS Hooks framework uses this data to surface relevant care gap alerts, prior authorization predictions, or risk-stratified care plans.

**Feasibility at scale:** This approach is technically feasible within Epic's FHIR infrastructure. The key challenge is the consent workflow at scale: if consent is required per-patient, obtaining consent for 87,000 MA members who are also Meridian Health System patients requires a consent capture program (patient portal, registration desk, or mailed consent) with ongoing maintenance as new patients present.

**Recommended pilot design:** Dr. Anita Krishnamurthy and Maya Iyer (Chief Product Officer, Digital Health) should design a pilot consent workflow embedded in MyChart for MA members who are active Meridian Health System patients. A pilot with 5,000-10,000 members would allow assessment of consent rates, data quality, and clinical workflow impact before deciding whether to scale. This pilot could be funded within the meridian-prior-auth-2026 program's Phase 4 budget with an amendment to the program scope.

### Option 3: Accountable Care Organization Structure

If Meridian Health System and Meridian Health Plans were to jointly participate in a Medicare Shared Savings Program (MSSP) Accountable Care Organization, the ACO structure — which is recognized under 45 CFR § 164.506(c)(4) as a form of organized health care arrangement — would create a legitimate data sharing basis for the ACO population.

**Feasibility assessment:** Meridian is not currently an MSSP ACO participant. CMS's Next Generation ACO model and ACO REACH model offer alternative structures. Pursuing ACO participation is a strategic decision requiring Board-level commitment and multi-year infrastructure investment. This is a medium-term enabler (3-5 year horizon) rather than a solution to the immediate program constraints.

### Executive Ownership for Path Forward

The three path-forward options require involvement from named executives:

- **Patricia Okafor (VP Revenue Cycle):** Must immediately halt the "Payer Intelligence Layer" design within RCM Modernization pending legal review. Should sponsor the patient-directed consent pilot as a Phase 4 meridian-prior-auth-2026 work stream.

- **Dr. Anita Krishnamurthy (Chief Digital and Information Officer):** Must add cross-entity data flow classification to the AI governance attestation framework immediately. Should jointly sponsor with Maya Iyer the FHIR consent workflow pilot design. Is the appropriate CDIO sponsor for any OHCA technical infrastructure work if leadership elects Option 1.

- **Rebecca Hollings (General Counsel):** Must brief all four program steering committees on the cross-entity constraints outlined in this document. Should initiate an OHCA feasibility analysis with outside HIPAA counsel (target: completed assessment by Q4 FY2026). Is the decision authority on all cross-entity data flow approvals until an OHCA or other framework is in place.

- **Thomas Hartwell (President, Meridian Health Plans):** Must be engaged in any OHCA election discussion as the plan-side covered entity principal. The plan's NOPP and its operational readiness for FHIR API integration are critical dependencies for Options 1 and 2.

- **Karen Mercer (Chief Compliance Officer):** Must add a "covered entity boundary" checkpoint to the compliance review calendar. Every new AI use case, program data design, and vendor data agreement should trigger a boundary review question before contracting.

---

*This document is a living reference for program governance. It should be updated following: (1) any OHCA feasibility assessment outcome; (2) any Virginia SCC guidance on predictive prior authorization tools; (3) any CMS regulatory guidance updates on provider-plan data sharing in integrated delivery systems; (4) any final FDA guidance on AI/ML SaMD classification that affects the analysis in Section 3.*

*Document questions should be directed to Rebecca Hollings (General Counsel) or Karen Mercer (Chief Compliance Officer).*

# Meridian Health System · Comprehensive Seed Data Specification

**An Intermountain-class composite integrated health system designed to populate the AbarVa platform with Fortune-500-scale healthcare depth, including integrated payer operations, value-based care agenda, and Mountain West regional character.**

Meridian Health System is a composite. It is sized and structured like a regional integrated health system with provider and payer operations, comparable in scale to systems such as Intermountain Health, Geisinger, or Henry Ford Health. The financials, named executives, initiatives, and specific details in this document are composite representations built from real healthcare transformation patterns. Meridian must always be described as "a composite organization built from real-world data" — never as a real health system.

This specification completes the healthcare vertical in the three-composite demo library, alongside Apex Retail Group (retail) and First Capital Financial (financial services). Together, these three composites span the verticals where AbarVa's beachhead opportunity is strongest and enable demo flexibility depending on the industry context of the prospect.

Reads alongside:
- `docs/specs/_meta/seed-data/apex-retail-group-comprehensive-seed.md` — the retail companion composite
- `docs/specs/platform/agent-architecture.md` — agent consumption patterns
- `docs/specs/platform/administration-architecture.md` — Track E on org structure as intelligence input

---

## Part 1 · Company Profile

### 1.1 · Identity and positioning

Meridian Health System is a non-profit integrated health system headquartered in Salt Lake City, Utah, serving patients and health plan members across the Mountain West region of the United States. Founded in 1973 through the consolidation of three regional hospital networks, Meridian has grown into one of the largest integrated delivery networks west of the Mississippi, distinguished by three structural characteristics that set it apart from both pure acute-care systems and pure payers:

- **Integrated provider and payer operations.** Meridian operates Meridian Health Plans alongside its provider network, creating a structurally-aligned incentive system for value-based care that most US health systems lack. The payer arm covers approximately 1.4M lives across Medicare Advantage, commercial group, individual marketplace, and Medicaid managed care products.

- **Value-based care pioneer status.** Meridian has operated under risk-bearing contracts since the 1990s and has built one of the country's most sophisticated population health management capabilities. Approximately 68% of Meridian's provider revenue flows through value-based arrangements, compared to roughly 24% for the national average.

- **Research and innovation orientation.** The Meridian Institute, the system's research arm, holds over 240 active research grants with cumulative external funding exceeding $180M annually. Meridian's electronic health record is used for published clinical research at a rate comparable to academic medical centers, despite Meridian being classified as a community-based non-academic system.

Meridian's brand positioning in the community emphasizes "care that stays with you" — a reference both to longitudinal patient relationships and to the integrated nature of the care-and-coverage model. Meridian's market share in its home state of Utah exceeds 45% in acute care and approximately 32% in commercial health insurance, making it the dominant health system and a meaningful regional insurer.

### 1.2 · Scale and operational snapshot

As of the most recent fiscal year (FY2025 ending June 30, 2025):

- **Total revenue:** $14.8B
- **Operating income:** $612M (4.1% operating margin)
- **Net assets:** $8.9B (non-profit; equivalent of equity)
- **Hospitals:** 44 hospitals across Utah, Idaho, Nevada, Wyoming, Montana, and Colorado
- **Ambulatory sites:** 380+ clinics, urgent care centers, surgery centers, and specialty facilities
- **Employed physicians:** approximately 4,200
- **Affiliated/contracted physicians:** approximately 6,800
- **Total employees:** approximately 68,000
- **Health plan covered lives:** 1.4M (680K commercial group, 320K individual/marketplace, 280K Medicare Advantage, 120K Medicaid managed care)
- **Acute admissions:** approximately 385,000 annually
- **Ambulatory encounters:** approximately 18.5M annually
- **Emergency department visits:** approximately 1.6M annually

The system operates an integrated electronic health record (Epic) across all provider sites and shares data with the payer arm through a federated data platform. Meridian's capital expenditure has averaged $800M-$1.0B annually over recent years, with approximately 40% allocated to facility expansion and modernization, 30% to technology infrastructure, 20% to clinical equipment, and 10% to research.

### 1.3 · Service line structure

Meridian's clinical operations are organized into 14 service lines, each with dedicated physician leadership, operational management, and quality oversight. The largest service lines by revenue:

- **Cardiovascular** — approximately $1.8B, anchored by a nationally-recognized heart program and three cardiac surgery centers of excellence
- **Oncology** — approximately $1.6B, including the Meridian Cancer Institute flagship facility in Salt Lake City and 8 regional cancer centers
- **Orthopedics and Spine** — approximately $1.3B, driven by high-volume joint replacement programs
- **Women's Health and Pediatrics** — approximately $1.2B, including two dedicated children's hospitals (Salt Lake City and Boise)
- **Neurosciences** — approximately $900M, covering stroke, epilepsy, and neurosurgery programs
- **Digestive Health** — approximately $700M
- **Behavioral Health** — approximately $450M, with notable expansion investment in the last three years

Additional service lines include Primary Care, Transplant (liver, kidney, heart, bone marrow), Trauma, Rehabilitation, Critical Care, Surgical Services, Imaging, and Laboratory.

### 1.4 · Health plan structure

Meridian Health Plans is organized into four product lines, each with dedicated leadership reporting to the President of Meridian Health Plans:

- **Commercial Group** — 680K members across employer-sponsored products in six states, with concentration in Utah, Idaho, and Nevada
- **Individual and Marketplace** — 320K members, growing from 180K in 2020 through marketplace expansion
- **Medicare Advantage** — 280K members across HMO, PPO, and D-SNP products; strong 4.5-star CMS quality rating
- **Medicaid Managed Care** — 120K members primarily in Utah and Nevada

The health plan operates approximately $8.4B in premium revenue (approximately 57% of consolidated system revenue), with the balance ($6.4B) coming from third-party payer reimbursement and direct patient revenue for non-Meridian-Plan patients.

### 1.5 · Geographic footprint

Meridian operates in six states across the Mountain West:

- **Utah** — headquarters state, 22 hospitals, largest market share, 850K attributed lives
- **Idaho** — 8 hospitals, second-largest market, 220K attributed lives
- **Nevada** — 6 hospitals, growing Medicare Advantage presence, 180K attributed lives
- **Wyoming** — 4 hospitals, rural access focus, 65K attributed lives
- **Montana** — 3 hospitals, rural access focus, 45K attributed lives
- **Colorado** — 1 hospital (western slope), 40K attributed lives

Recent strategic emphasis has been on expanding ambulatory and virtual care access rather than additional acute care footprint, reflecting both the cost advantages of lower-acuity settings and the value-based care imperative to keep patients healthy rather than hospitalized.

### 1.6 · Recent corporate trajectory

Significant events over the past 24 months:

- **March 2024 · Merger completion.** Meridian completed the merger with Rocky Mountain Health System, adding 8 hospitals in Idaho, Wyoming, and Montana. Integration work remains ongoing and has been a major organizational focus.

- **Q2 2024 · CEO transition.** Dr. Elena Vasquez succeeded retiring CEO Dr. James Forsyth, who had led Meridian for 14 years. Vasquez was previously the system's Chief Medical Officer and is the first physician CEO in Meridian's history, succeeding the second non-physician CEO.

- **Q4 2024 · Value-based care 2030 commitment.** Meridian publicly committed to having 85% of provider revenue in value-based arrangements by 2030, up from 68% at announcement. The commitment includes specific sub-targets for downside risk contracts, population health enrollment, and quality outcomes.

- **Q2 2025 · Medicare Advantage expansion.** The health plan launched Medicare Advantage products in three new Colorado counties, expanding the MA footprint meaningfully.

- **Q3 2025 · Workforce action.** A major nursing contract negotiation concluded with substantial wage increases across 11 hospitals following an actual-but-brief nursing strike in two Utah facilities. The outcome was broadly viewed as favorable to nursing staff but creates meaningful operating cost pressure.

- **Q4 2025 · AI and digital health strategy announcement.** Meridian announced a $250M commitment over four years to AI-enabled clinical and operational capabilities, with specific focus areas including ambient clinical documentation, diagnostic decision support, population health risk stratification, and revenue cycle automation.

- **January 2026 · Regulatory inspection.** CMS conducted a Medicare Advantage program audit that resulted in a corrective action plan for 14 findings. Meridian is executing on the plan; initial remediation was accepted in March 2026. No civil monetary penalty was imposed, but the findings triggered internal governance changes.

- **March 2026 · Strategic plan refresh.** Board approved updated 2030 strategic plan with three anchor priorities: value-based care 2030, integrated patient experience, and AI-enabled operating model.

---

## Part 2 · Executive Leadership

The Meridian executive committee comprises sixteen leaders reporting to CEO Dr. Elena Vasquez, reflecting the complexity of integrated provider-payer-research operations.

### 2.1 · Executive roster

- **Dr. Elena Vasquez** — President and Chief Executive Officer (since April 2024)
- **Dr. Marcus Halberstam** — President, Provider Operations and Chief Operating Officer
- **Linda Chen-Winters** — President, Meridian Health Plans
- **Daniel Okeke-Reid** — Chief Financial Officer
- **Dr. Priya Venkataraman** — Executive Vice President and Chief Medical Officer
- **Dr. James Morley-Kahn** — President, Meridian Institute (research)
- **Katherine Oshima** — Chief Information Officer (previously Chief Digital Health Officer, expanded role as of January 2026)
- **Dr. Rashid Khoury** — Chief Population Health Officer
- **Susan Ahmadi-Clarke** — Chief Nursing Officer (system-level)
- **Dr. Sarah Whitfield** — Chief Quality and Patient Safety Officer
- **Thomas Berglund-Morales** — Chief Human Resources Officer
- **Dr. Nathan Goldberg** — Chief Strategy and Growth Officer
- **Christopher Iwuanyanwu** — Chief Diversity and Community Health Officer
- **Meredith Ashford-Singh** — General Counsel and Chief Compliance Officer
- **Jonathan Reese-Park** — Chief Development Officer (philanthropy and community relations)
- **Dr. Tia Nguyen-Walsh** — Chief Clinical Officer, Ambulatory (newly elevated to exec committee 2025)

### 2.2 · Board of Trustees

Meridian is governed by a 17-member Board of Trustees, including four physician members, three community health leaders, seven business and civic leaders, two Meridian employees (non-executive), and the CEO. Board chair is Dr. William Kessler-Mbeki, retired physician and former system CEO from another region. Committees include Audit and Compliance, Quality and Safety (a major committee given the integrated payer-provider structure), Finance, Strategy, Compensation, and a newly-formed Technology and AI Governance Committee established in Q4 2025.

---

## Part 3 · Strategic Priorities · 2026

Meridian operates under the 2030 Strategic Plan refreshed in March 2026. Three anchor priorities with specific 2026 deliverables.

### 3.1 · Anchor Priority One · Value-Based Care 2030

Commitment to 85% of provider revenue in value-based arrangements by 2030, up from 68% current state.

Named 2026 priorities:

- **Downside risk contract expansion** — increasing the share of provider revenue in full-risk or shared-risk arrangements from 34% to 42%
- **Attributed lives growth** — expanding attributed lives under primary care risk arrangements from 740K to 880K, with growth in Idaho and Nevada specifically
- **Value-based specialty bundles** — launching bundled-payment arrangements for five additional specialties (joint replacement, cardiac, oncology, maternity, bariatric) with both internal Meridian payers and external payer partners
- **Commercial ACO expansion** — launching a commercial accountable care organization product with self-insured employers in partnership with Meridian Health Plans' commercial group team
- **Provider incentive alignment** — redesigning physician compensation methodology for primary care to align with value-based outcomes rather than RVU productivity, targeting implementation in 2027

### 3.2 · Anchor Priority Two · Integrated Patient Experience

Creating a seamless patient experience across provider care, health plan services, digital tools, and community health programs.

Named 2026 priorities:

- **Unified patient portal evolution** — next-generation patient portal integrating care, benefits, pharmacy, and wellness in a single experience
- **Ambulatory access modernization** — reducing new-patient appointment wait times from 18 days average to 9 days across key specialties
- **Virtual care expansion** — growing virtual visit volume from 15% of total ambulatory encounters to 22%, with specific focus on behavioral health and chronic disease management
- **Care coordination platform** — rolling out enhanced care coordination technology across 220,000 complex-care patients, connecting primary care, specialist, home health, behavioral health, and health plan care management
- **Digital front door** — redesigning the patient-facing digital experience for appointment scheduling, symptom navigation, and benefit transparency

### 3.3 · Anchor Priority Three · AI-Enabled Operating Model

The $250M AI commitment announced in Q4 2025, positioning Meridian as a leader in AI-augmented care delivery and operations.

Named 2026 priorities:

- **Ambient clinical documentation rollout** — scaling ambient documentation from current 800-physician pilot to 2,400 physicians by end of 2026, targeting reduced documentation burden and physician burnout
- **Diagnostic decision support expansion** — deploying AI-augmented imaging review across radiology, pathology, and cardiology, with governance framework managed by the new Technology and AI Governance Committee
- **Population health risk stratification** — replacing legacy risk stratification models with next-generation AI approach, targeting improved identification of rising-risk patients for earlier intervention
- **Revenue cycle automation** — applying AI to prior authorization, denial management, and payment integrity functions, targeting 35% reduction in administrative labor hours within affected functions
- **Operational optimization** — AI applications in scheduling, staffing, and supply chain across hospitals

### 3.4 · Cross-cutting priorities

- **Rocky Mountain integration completion** — integration work from the 2024 merger remains material in 2026, including EHR standardization, care model harmonization, and service line integration
- **Workforce sustainability** — physician and nursing workforce stability, retention, and well-being, including ongoing responses to the 2025 nursing agreement and broader burnout dynamics
- **Financial discipline** — operating margin stability under commercial payment pressure and regulatory payment changes
- **Regulatory and compliance posture** — strengthened governance following the January 2026 CMS audit

### 3.5 · Board-level commitments

From the March 2026 strategic plan board approval, Meridian publicly committed to:

- 85% value-based care revenue by 2030 (with annual progression milestones)
- 95th percentile CMS Star Ratings across all Medicare Advantage products by 2028
- Top-quartile patient experience scores in CMS-measured programs by 2027
- 25% reduction in preventable hospitalizations across attributed populations by 2028
- Net-zero operational greenhouse gas emissions by 2035

---

## Part 4 · Executive Profiles · VIP Depth

### 4.1 · Dr. Elena Vasquez · President and CEO

**Background.** Joined Meridian in 2008 as an internal medicine physician at the Salt Lake City flagship hospital. Progressed through medical leadership roles — Associate Chief Medical Officer in 2013, Chief Medical Officer for the Central Utah region in 2016, system Executive Vice President and Chief Medical Officer in 2020, and President and CEO in April 2024. Internal medicine residency at UCSF; medical school at Stanford; undergraduate at Rice University. Mexican-American, 55 years old, married to a lawyer, two adult children.

**Strategic priorities.** Vasquez is the architect of the value-based care 2030 commitment, having championed the target internally before her elevation to CEO. Her stated priorities are: completing the Rocky Mountain integration, delivering on value-based care 2030, stabilizing the workforce, and positioning Meridian as a national leader in AI-augmented care.

**Communication style.** Thoughtful, precise, evidence-oriented. Brings physician discipline to executive meetings — meaning she expects data, logical structure, and explicit acknowledgment of uncertainty. Comfortable with long pauses; does not fill silence with talking. Has maintained a limited clinical practice through her executive tenure and is known to reference specific patient encounters (anonymized) when making strategic points.

**Decision pattern.** Deliberate. Will defer high-stakes decisions until evidence is comprehensive, sometimes to the frustration of faster-moving peers. Once committed, executes with full organizational mobilization.

**Known pain points.**
- Workforce burnout and the cost implications of the 2025 nursing settlement
- Regulatory exposure surfaced by the CMS audit
- The tension between value-based care strategy and fee-for-service revenue realities during transition
- The pace of AI adoption in clinical settings, balancing innovation against patient safety

**Public statements worth referencing:**

*From March 2026 strategic plan announcement:*
> "If we are still measuring our success in hospital admissions and surgical volumes in 2030, we will have failed our patients and our mission. The transition to value is not a financial strategy; it is a care strategy."

*From a January 2026 Health Affairs interview:*
> "I am deeply enthusiastic about AI in healthcare and deeply skeptical of the timelines people promise. These are not incompatible positions. The same care and governance we apply to any other clinical innovation must apply here."

**VIP-enriched reasoning notes for agents.** When Programs touch Vasquez directly, agents should lead with clinical evidence, acknowledge patient-impact dimensions explicitly, and respect the physician-CEO posture (she is not a business-first CEO; she is a physician who runs a business).

### 4.2 · Dr. Marcus Halberstam · President, Provider Operations and COO

**Background.** Joined Meridian in 2002 as a cardiothoracic surgeon. Clinical leadership roles through the 2000s; became Chief Medical Officer for the Idaho region in 2011; President of the Idaho market in 2015; Chief Operating Officer system-level in 2019; expanded to President Provider Operations in 2024. Medical school at Johns Hopkins; cardiothoracic surgery training at Cleveland Clinic. Jewish-American, 58 years old, married with three adult children.

**Strategic priorities.** Halberstam owns the 44-hospital provider operation, the Rocky Mountain integration completion, ambulatory access modernization, and operational aspects of AI implementation. His 2026 priorities center on integration delivery, operational margin protection, and preparing the provider operation for expanded value-based care.

**Communication style.** Direct, clinical, unemotional. Patient in listening; decisive in deciding. Has tremendous credibility with operational leaders and physician leadership, slightly less with technology and digital leaders where his language shifts uncomfortably.

**Decision pattern.** Speed-oriented within his scope. Tension with Vasquez, who is more deliberative; the two complement each other.

**Known pain points.**
- Rocky Mountain integration slower than originally targeted
- Physician recruitment and retention pressures across specialty lines
- EHR standardization work that has dragged through 2025
- The cost structure implications of value-based care adoption

### 4.3 · Linda Chen-Winters · President, Meridian Health Plans

**Background.** Joined Meridian in 2017 as Chief Operating Officer of Meridian Health Plans, after 14 years at a large national payer. Promoted to President of Meridian Health Plans in 2021. Undergraduate in actuarial science from University of Wisconsin; MBA from Northwestern Kellogg. Chinese-American of Taiwanese heritage, 51 years old, married to an oncologist, two school-aged children.

**Strategic priorities.** Chen-Winters owns the four payer product lines (commercial group, individual/marketplace, Medicare Advantage, Medicaid managed care). Her 2026 priorities include Medicare Advantage growth and quality, commercial ACO launch, individual/marketplace retention, and Medicaid operations excellence.

**Communication style.** Polished, commercial, fluent in both healthcare language and corporate finance. Known to run tight, structured meetings. Represents the "payer mindset" within the executive committee and occasionally creates productive friction with physician leaders over formulary, prior authorization, and utilization management decisions.

**Decision pattern.** Data-driven and quick. Less collaborative than physician counterparts; more willing to move forward when the data supports direction.

**Known pain points.**
- The CMS audit findings, which primarily touched Medicare Advantage operations under her scope
- Competitive pressure in Medicare Advantage from national plans entering her markets
- Medical loss ratio trends requiring constant vigilance
- Tension between her commercial mandate and the system's value-based care stance

### 4.4 · Daniel Okeke-Reid · CFO

**Background.** Joined Meridian in 2021 from a Catholic health system where he had been Vice President of Finance. Prior roles in investment banking (healthcare coverage) and corporate finance at a managed care company. Undergraduate in economics from Williams College; MBA from University of Chicago Booth. Nigerian-American, 48 years old, married with two young children.

**Strategic priorities.** Okeke-Reid owns system financial operations, capital allocation, rating agency relations, and financial implications of strategic initiatives. His 2026 priorities include operating margin stabilization under wage pressure, capital expenditure rationalization post-merger, and financial infrastructure for value-based care contracting.

**Communication style.** Calm, precise, unflappable under pressure. Respected for combining financial rigor with mission orientation (important in non-profit healthcare). Comfortable pushing back on clinical and operational leaders; comfortable being pushed back on in return.

**Known pain points.**
- Operating margin erosion from wage increases
- Capital allocation tension between merger integration, facility modernization, technology investment, and community health priorities
- Rating agency pressure related to wage cost implications
- Medicaid payment rate pressure

### 4.5 · Dr. Priya Venkataraman · EVP and Chief Medical Officer

**Background.** Joined Meridian in 2019 as Chief Quality Officer. Became Chief Medical Officer in 2023 when Vasquez was promoted to CEO. Internal medicine subspecialty in infectious disease; earlier career in academic medicine including faculty at Emory and Duke. Indian-American, 49 years old, married to a hospitalist, one teenage child.

**Strategic priorities.** Venkataraman owns physician leadership across the system, medical staff relations, clinical standards, and the interface between clinical and administrative operations. Her 2026 priorities include physician workforce strategy, clinical AI governance, and quality outcomes under value-based arrangements.

**Communication style.** Scholarly, deliberate, respected. Speaks with precision and expects the same. Cares deeply about clinical workforce well-being and has been publicly vocal about physician burnout.

**Known pain points.**
- Physician burnout and its interaction with ambient documentation and other AI tools meant to help
- Clinical AI governance complexity
- Specialty workforce shortages in critical areas (primary care, behavioral health, certain surgical subspecialties)
- The balance between physician autonomy and standardized care pathways required by value-based arrangements

### 4.6 · Dr. James Morley-Kahn · President, Meridian Institute

**Background.** Joined Meridian in 2015 as Chief Scientific Officer after 20 years in academic medicine, most recently as a department chair at a top-five US medical school. Promoted to President of the Meridian Institute in 2019. Research background in cardiovascular medicine with over 140 peer-reviewed publications. Jewish-American, 62 years old, married with adult children.

**Strategic priorities.** Morley-Kahn owns research operations, external grants and funding, publication output, and research infrastructure. His 2026 priorities include growing external research funding, expanding translational research capabilities, and integrating research with clinical AI development.

**Communication style.** Academic, thoughtful, occasionally impatient with operational minutiae. Highly respected externally in research communities; viewed as a distinct presence within the operational executive team.

### 4.7 · Katherine Oshima · Chief Information Officer

**Background.** Joined Meridian in 2022 as Chief Digital Health Officer, a newly-created role. Expanded to CIO in January 2026, combining technology infrastructure with digital health strategy. Prior experience: CTO of a digital health company; VP Technology at a regional health system; engineering roles at a large technology company. Undergraduate in computer science from Carnegie Mellon; MBA from MIT Sloan. Japanese-American, 43 years old, married, one young child.

**Strategic priorities.** Oshima owns technology infrastructure, clinical applications (including Epic), digital health capabilities, and the newly-expanded AI agenda. Her 2026 priorities include the $250M AI portfolio execution, EHR standardization post-merger, and cybersecurity posture enhancement.

**Communication style.** Technical, clear, comfortable with executive-level framing. One of the more digitally-native leaders on the executive committee. Builds strong relationships across clinical, operational, and financial leaders.

**Known pain points.**
- Legacy technology debt, particularly from the Rocky Mountain merger where systems remain partially unintegrated
- Clinical AI governance complexity
- Cybersecurity threat environment in healthcare
- Cost pressure on technology investment during wage cost pressure

**VIP-enriched reasoning notes for agents.** Oshima is likely an AbarVa champion given her background and the alignment between AbarVa's positioning and her AI strategy. She is a sophisticated buyer.

### 4.8 · Dr. Rashid Khoury · Chief Population Health Officer

**Background.** Joined Meridian in 2012 as medical director of the Wasatch Front accountable care organization. Progressed through population health leadership to the system CPHO role in 2021. Family medicine physician by training; MPH from Johns Hopkins. Palestinian-American, 52 years old, married with three children.

**Strategic priorities.** Khoury owns population health management across 740K attributed lives (growing to 880K target), the value-based care clinical model, care management operations, and the interface between population health and payer operations.

**Communication style.** Mission-driven, systematic, patient. Works well across clinical and payer stakeholders because he understands both sides deeply.

**Known pain points.**
- Scaling care management capacity as attributed lives grow
- Data integration between provider and payer systems for closed-loop population health
- Physician compensation alignment with population health goals
- Rural access to care coordination services

### 4.9 · Susan Ahmadi-Clarke · Chief Nursing Officer (system-level)

**Background.** Joined Meridian in 2008 as a hospital CNO in the Idaho market. Progressed to regional CNO; assumed system CNO in 2020. BSN from BYU; MSN from University of Utah; DNP from Johns Hopkins. Iranian-American of Persian heritage, 55 years old, married with adult children.

**Strategic priorities.** Ahmadi-Clarke owns the approximately 18,000 nursing workforce across the system. Her 2026 priorities include implementing the 2025 nursing agreement, scaling nursing workforce sustainability initiatives, and navigating the interface between nursing and the AI clinical tools agenda.

**Known pain points.**
- Nursing workforce stability post-settlement
- Nursing leadership pipeline development
- Technology burden on nursing workflows
- The tension between optimal nurse-to-patient ratios and financial sustainability

### 4.10 · Dr. Sarah Whitfield · Chief Quality and Patient Safety Officer

**Background.** Joined Meridian in 2013 as a patient safety physician. Became CQO in 2020. Anesthesiology background; Masters in patient safety from University of Illinois. Black-American, 50 years old, single, based in Salt Lake City.

**Strategic priorities.** Whitfield owns the quality and patient safety program across provider operations, quality measurement and reporting for both provider and payer, and patient safety culture. Her 2026 priorities include preparing for accreditation surveys, post-CMS-audit remediation tracking, and quality infrastructure for value-based care contracts.

### 4.11 through 4.16 · Additional executive profiles

Abbreviated profiles for completeness; deeper development as specific engagements touch their scope.

- **Thomas Berglund-Morales** (CHRO) — Swedish-Mexican heritage; joined 2022; prior CHRO experience in academic healthcare; priorities include workforce strategy post-nursing settlement and leadership development.
- **Dr. Nathan Goldberg** (Chief Strategy and Growth Officer) — joined 2020; former McKinsey partner; priorities include service line growth, merger integration completion, and strategic partnerships.
- **Christopher Iwuanyanwu** (Chief Diversity and Community Health Officer) — Nigerian-American; joined 2021 in a newly-created role combining DEI and community health; priorities include health equity measurement and community benefit strategy.
- **Meredith Ashford-Singh** (General Counsel and Chief Compliance Officer) — British-Indian dual citizen; joined 2019; priorities include CMS audit remediation oversight, regulatory response, and contractual work.
- **Jonathan Reese-Park** (Chief Development Officer) — joined 2016; priorities include philanthropic campaign execution and community relations.
- **Dr. Tia Nguyen-Walsh** (Chief Clinical Officer, Ambulatory) — Vietnamese-Irish heritage; elevated to exec committee in 2025; priorities include ambulatory access modernization and virtual care expansion.

---

## Part 5 · Active Initiatives · 2026

Meridian has 19 named major initiatives in-flight. Most demo-relevant:

### 5.1 · Clinical AI Governance and Ambient Documentation Scale-Up

Sponsor: Dr. Priya Venkataraman (CMO) with Katherine Oshima (CIO)
Scope: Expand ambient clinical documentation from 800 to 2,400 physicians; establish governance framework for all clinical AI
Current phase: Scale-up in progress; governance framework in Board Technology and AI Committee review

### 5.2 · Value-Based Care 2030 Progression

Sponsor: Dr. Rashid Khoury (CPHO) with Linda Chen-Winters (President MHP)
Scope: Cross-system initiative advancing from 68% to 85% value-based revenue by 2030
Current phase: Annual milestone tracking and expansion workstreams

### 5.3 · Rocky Mountain Integration Completion

Sponsor: Dr. Marcus Halberstam (President Provider Ops)
Scope: Finish integration work from 2024 merger across Idaho, Wyoming, Montana facilities
Current phase: EHR standardization in Wave 3 of 4; care model harmonization in progress

### 5.4 · CMS Audit Remediation

Sponsor: Meredith Ashford-Singh (GC) with Linda Chen-Winters (President MHP)
Scope: 14-finding corrective action plan from January 2026 CMS MA audit
Current phase: Initial remediation accepted March 2026; ongoing monitoring through 2026

### 5.5 · Physician Workforce Sustainability

Sponsor: Dr. Priya Venkataraman (CMO) with Thomas Berglund-Morales (CHRO)
Scope: Physician burnout mitigation, recruitment and retention across specialty lines
Current phase: Multiple workstreams; ambient documentation is a key enabler

### 5.6 · Integrated Patient Portal Next Generation

Sponsor: Katherine Oshima (CIO) with Dr. Tia Nguyen-Walsh (CCO Ambulatory)
Scope: Unified patient experience across care, benefits, pharmacy, wellness
Current phase: Vendor evaluation completed; implementation beginning Q2 2026

### 5.7 · Medicare Advantage Growth and Quality

Sponsor: Linda Chen-Winters (President MHP)
Scope: Membership growth, market expansion, CMS Star Rating maintenance
Current phase: Colorado expansion underway; Star Rating protection in progress

### 5.8 · Commercial ACO Launch

Sponsor: Linda Chen-Winters (President MHP) with Dr. Rashid Khoury (CPHO)
Scope: Launch commercial ACO product for self-insured employer customers
Current phase: Product design; initial employer customer conversations

### 5.9 · Revenue Cycle Automation

Sponsor: Daniel Okeke-Reid (CFO) with Katherine Oshima (CIO)
Scope: AI applications across prior authorization, denial management, payment integrity
Current phase: Tool selection in progress; pilot workstreams beginning

### 5.10 · Through 5.19 · Additional initiatives

Including behavioral health expansion, transplant program growth, specialty bundle expansion, community health strategy, women's health strategy, philanthropic campaign, research expansion, sustainability commitments, rural access strategy, and digital transformation cross-cutting program.

---

## Part 6 · Active Patterns Observable in Meridian Data

### 6.1 · Pattern: Shadow Clinical AI Tool Adoption

**Summary.** Individual physicians and departments have independently adopted approximately 11 AI clinical tools across the system outside of central governance, including ambient scribes beyond the authorized pilot, diagnostic AI tools in radiology and cardiology, and documentation assistants in ambulatory settings.

**Analog to the Apex Shadow AI pattern but in clinical context.** This is a dual governance challenge: financial (unmanaged spend) and clinical (patient safety implications of ungoverned AI).

**Severity.** High. The CMS audit flagged AI governance as an observation category; uncontrolled clinical AI could create additional exposure.

### 6.2 · Pattern: Care Coordination Gaps in Complex Patients

**Summary.** Approximately 14% of high-complexity patients (those with three or more chronic conditions and at least one annual hospitalization) experience documented care coordination failures per year, with downstream impact on both patient outcomes and total cost of care.

**Program implications.** Directly relevant to value-based care performance and to the integrated patient portal investment.

### 6.3 · Pattern: Physician Burnout Signals

**Summary.** Physician burnout scores across the system remain elevated, with specialty-level variation: hospitalists (62% burnout rate), primary care (58%), emergency medicine (54%), outpatient subspecialists (43%). Documentation burden is a consistently-cited driver.

**Program implications.** Ambient documentation scale-up is the primary intervention; adjacent workflow redesign opportunities.

### 6.4 · Pattern: Medicare Advantage Risk Adjustment Opportunity

**Summary.** Risk adjustment coding completeness varies meaningfully across Medicare Advantage provider groups, with the top quartile capturing approximately 18% more condition categories than the bottom quartile for comparable populations. Net impact estimated at $110M-$140M in annualized revenue.

**Program implications.** Revenue cycle automation initiative intersects this opportunity; compliance dimension requires careful handling post-CMS audit.

### 6.5 · Pattern: Ambulatory Access Constraint in Specific Specialties

**Summary.** New-patient wait times exceed 30 days in six specialties (dermatology, endocrinology, rheumatology, gastroenterology, behavioral health, and certain surgical subspecialties), constraining Meridian's ability to grow attributed lives and creating member abrasion in the health plan.

**Program implications.** Ambulatory access modernization initiative; virtual care expansion; workforce strategy.

### 6.6 · Pattern: Value-Based Care Contract Performance Variation

**Summary.** Performance across value-based contracts varies significantly. Top-performing contracts exceed benchmarks by 4-7% on quality and cost metrics; bottom contracts underperform by 3-5%. Drivers include attributed population composition, care management intensity, and physician engagement.

**Program implications.** Core to value-based care 2030 progression and to commercial ACO launch strategy.

### 6.7 · Pattern: Post-Merger Operating Model Inconsistency

**Summary.** 18 months after the Rocky Mountain merger, operating practices vary across the pre-existing Meridian footprint and the integrated Rocky Mountain facilities in scheduling, staffing, supply chain, and quality processes. Normalization is ongoing but slow.

**Program implications.** Directly relevant to Rocky Mountain integration completion and operational margin protection.

---

## Part 7 · Vendor and Technology Landscape

### 7.1 · Core clinical systems

- **EHR:** Epic across all Meridian-legacy facilities; former Rocky Mountain facilities in migration from Cerner to Epic with completion targeted Q4 2026
- **Payer core:** HealthEdge (health plan core administration) integrated with Epic
- **Clinical data platform:** Epic Cogito with supplementary Databricks for advanced analytics
- **Patient engagement:** Epic MyChart plus custom extensions
- **Population health:** Internal platform with selected third-party components (HealthCatalyst, Arcadia)

### 7.2 · AI and analytics stack

- **Cloud:** Multi-cloud with AWS primary, Azure secondary
- **LLM providers:** Anthropic (primary for clinical, selected for governance properties), Microsoft OpenAI (secondary), Google Med-PaLM selective use
- **Clinical AI tools:** Ambient documentation (DAX, Abridge under evaluation), imaging AI across modalities, clinical decision support via Epic tools, sepsis prediction, readmission risk
- **Analytics:** Tableau, internal tools, Tableau Cloud migration in progress

### 7.3 · AI vendor engagements

- **Central authorized:** Ambient documentation vendor (single primary, governed), imaging AI vendors per modality, Epic clinical AI tools
- **Shadow/decentralized (the pattern):** approximately 11 tools flagged in Part 6.1

---

## Part 8 · Prior AbarVa Programs at Meridian

### 8.1 · Program: Physician Compensation Redesign

**Sponsor:** Dr. Priya Venkataraman (CMO) with Daniel Okeke-Reid (CFO)
**Phases:** 0-4 completed
**Duration:** September 2025 - March 2026
**Outcomes:**
- Primary care compensation methodology redesigned from RVU-heavy to value-aligned
- Implementation plan for 2027 go-live approved
- Specialty care compensation redesign scoped for follow-on Program

### 8.2 · Program: Health Plan Member Experience Diagnostic

**Sponsor:** Linda Chen-Winters (President MHP)
**Phases:** 0-3 completed; Phase 4 in progress
**Duration:** December 2025 - May 2026
**Outcomes:**
- Member journey pain points mapped and prioritized
- Integrated patient portal requirements refined
- Member service operations redesign in progress

---

## Part 9 · Benchmarks and Peer Data Layer

### 9.1 · Peer set definition

**Integrated system peers:**
- Kaiser Permanente (larger scale, reference point for integrated model)
- Intermountain Health (direct geographic and model peer)
- Geisinger Health System (integrated peer, value-based care pioneer)
- Henry Ford Health
- Sentara Health
- SSM Health
- Advocate Health

**Regional integrated peers:**
- UPMC
- Jefferson Health
- Memorial Hermann Health System

**Extended peer set for payer benchmarking:**
- Humana (Medicare Advantage benchmark)
- UnitedHealthcare (commercial benchmark)
- Elevance Health

### 9.2 · Benchmark categories

**Financial:**
- Operating margin (non-profit health system benchmark range 2.5%-5.0%)
- Days cash on hand
- Debt service coverage
- Capital expenditure as % of revenue
- Value-based care revenue percentage

**Clinical quality:**
- CMS Star Ratings (Medicare Advantage)
- Hospital HCAHPS scores
- Leapfrog grades
- Readmission rates
- Mortality observed-to-expected ratios
- Preventable hospitalization rates in attributed populations

**Operational:**
- Length of stay
- Emergency department throughput
- Ambulatory access times
- Surgical case productivity
- Revenue cycle days

**Payer:**
- Medical loss ratio
- Administrative cost ratio
- Member retention
- Net promoter score

**Workforce:**
- Physician turnover
- Nursing turnover
- Employee engagement scores
- Physician burnout rates

**AI and digital:**
- Ambient documentation adoption
- Patient portal activation rates
- Virtual care penetration
- IT spending % of revenue

### 9.3 · Public data sources

- CMS data (Hospital Compare, MA Star Ratings, ACO performance)
- AHRQ quality indicators
- Leapfrog data
- Moody's and S&P rating reports
- Specialty society publications
- Health Affairs research
- Peer system annual reports and 990s (for non-profits)

### 9.4 · Demo-relevant benchmarks

- **Value-based care revenue share · national average:** 24%; Meridian at 68%; peer leaders at 78-85%
- **Operating margin · non-profit health system average:** 2.8%; Meridian at 4.1%; peer leaders at 5.5-7.0%
- **Medicare Advantage Stars · national average:** 3.8; Meridian at 4.5; peer leaders at 4.5-5.0
- **Physician burnout · national average:** 53%; Meridian at 54% (slight improvement from 2024)
- **Ambient documentation adoption · national average:** 8% of physicians; Meridian at 12% (expanding to 34% by end 2026)
- **Patient portal activation · national average:** 62%; Meridian at 78%

---

## Part 10 · Data Room Inventory

### 10.1 · Client-private datasets

- Full org structure (68,000 employees; richest executive-level depth)
- VIP profiles for top 16 executives plus 40+ SVPs
- Clinical operations data (encounter-level, aggregated)
- Financial statements and operating performance
- Quality and safety data across all measured programs
- Value-based contract performance
- Member experience data (health plan)
- Physician performance data
- Board materials and strategic plan documents

### 10.2 · Client-contributed cross-system data

- Cross-system clinical AI adoption patterns (aggregated)
- Cross-system value-based care performance benchmarks
- Cross-system physician workforce patterns

### 10.3 · Platform-public datasets

- CMS data (continuous)
- Peer system publicly-available data
- Health Affairs, JAMA, NEJM research indexing
- Regulatory updates (CMS, state health departments)
- Industry analyst data (Moody's, S&P, sector specialists)
- Clinical society data

### 10.4 · Known gaps

- Detailed vendor contract terms for clinical AI tools
- Granular operating data from Rocky Mountain integration sites
- Patient-reported outcomes data at scale
- Social determinants of health data

---

## Part 11 · How This Data Flows to Agents

Same pattern as Apex seed (Part 12 of Apex document). Nexus consumes role-specific context, Sentinel integrates external research, Atlas aggregates cross-system patterns, Steward handles admin.

Meridian-specific adaptations:

- **Clinical vs operational vs payer context** — agents recognize whether a Program touches clinical operations, payer operations, or integration, and adjust framing accordingly
- **Value-based care reasoning** — agents understand fee-for-service vs value-based revenue dynamics in Meridian recommendations
- **Regulatory sensitivity** — post-CMS audit, agents flag regulatory implications proactively
- **Physician-CEO register** — agents match Vasquez's physician-CEO communication style when she is in the room

---

## Part 12 · Summary

**Meridian vs Apex composite comparison:**

| Dimension | Apex Retail Group | Meridian Health System |
|---|---|---|
| Industry | Retail | Healthcare (integrated provider + payer) |
| Scale | $108B revenue | $14.8B revenue |
| Geography | National (1,976 stores) | Regional (6 Mountain West states) |
| Business complexity | 8 merchandise categories | 14 clinical service lines + 4 payer products + research |
| Strategic pressure | Margin + AI adoption + activist investor | Value-based care transition + workforce + AI governance |
| Regulatory intensity | Moderate | High (CMS, state DOIs, clinical) |
| Demo narrative anchor | Shadow AI $2.3M signal | Shadow clinical AI + value-based care |
| Key tensions | Merchandising ↔ Planning ↔ Supply Chain | Provider ↔ Payer + Fee-for-service ↔ Value-based |

Both composites enable rich agent reasoning. Which one anchors the demo depends on prospect industry.

---

**END OF DOCUMENT · MERIDIAN HEALTH SYSTEM COMPREHENSIVE SEED DATA SPECIFICATION**

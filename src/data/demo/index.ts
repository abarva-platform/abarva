// Pre-cached demo responses for all 3 demo paths × 3 clients
// Used by demo-mode.ts to serve instant responses without API calls

export type DemoClient = 'meridian' | 'firstcapital' | 'apexretail'
export type DemoPath = 'cxo' | 'investor' | 'design-partner'

export interface DemoResponse {
  question: string
  response: string
  sources: string[]
  role?: string
}

export const DEMO_RESPONSES: Record<DemoClient, Record<string, DemoResponse>> = {
  meridian: {
    'rcm-denial-rate': {
      question: "RCM Denial Rate — What's driving the gap?",
      role: 'CIO',
      response: `The 18.2% denial rate at Meridian is 6.1 points above the 12.1% industry benchmark — representing approximately $47M in delayed or lost revenue annually.

**Root cause analysis identifies three compounding factors:**

1. **Prior authorization latency (primary driver):** Ensemble Health Partners' prior auth workflow averages 4.2 days versus the peer median of 1.8 days. Robert Chen (VP Revenue Cycle) noted in the Q4 stakeholder session that "we are essentially funding Ensemble's backlog with our working capital." The Ensemble contract SLA penalty clause (Section 14.3) allows up to $8M in performance penalties — none have been invoked.

2. **Coding accuracy gap:** DAX Copilot has been licensed since Q1 2023 but not activated. Peer organizations using ambient AI documentation report denial rates 4-6 points lower, driven by improved specificity in clinical documentation at point of care.

3. **Payer mix shift:** The post-merger integration of St. Luke's Community in 2022 introduced a higher concentration of Medicaid patients (now 34% of volume vs. 24% pre-merger) without a corresponding update to the authorization workflow. Medicaid denials are running at 26.3% — more than double the commercial rate.

**What this means for the CIO:** The technology to close this gap is already licensed. DAX Copilot activation via the Q3 2026 Epic upgrade window would address the documentation gap. The Ensemble SLA enforcement conversation needs to happen in parallel — that is a contract action, not a technology decision.`,
      sources: [
        'Meridian Q4 2025 Stakeholder Interview — Robert Chen, VP Revenue Cycle',
        'Ensemble Health Partners Master Services Agreement, Section 14.3 — SLA Performance Penalties',
        'HFMA Denial Rate Benchmark Report 2025 — Midwest Academic Medical Centers',
        'Epic DAX Copilot Clinical Documentation ROI Study — 14 health systems, 2024',
      ],
    },
    'epic-underutilization': {
      question: 'Epic — Why are we paying for modules we\'re not using?',
      role: 'CIO',
      response: `Meridian is licensed for Epic's full suite — including Supply Chain, Willow Pharmacy, and the AI Predictive suite — but utilization analysis shows only 4 of 12 licensed modules at >50% activation. The annual license cost is $28M; estimated utilization value is $11M.

**Module-by-module gap:**
Epic Supply Chain is licensed at full enterprise tier but not implemented. Meridian still runs Infor Lawson for supply chain in parallel — a dual-ERP situation that costs $4.2M annually in duplicate maintenance. The Epic supply chain implementation was scoped in 2022 and abandoned after 6 months due to staff bandwidth constraints.

DAX Copilot was activated in one department (Internal Medicine) as a pilot. System-wide activation has been pending "clinical governance approval" for 11 months. The clinical governance committee has met twice in that window.

The predictive analytics suite — readmission risk, deterioration alerting, and sepsis early warning — is licensed and technically activated in Epic, but the sepsis model is running in 2 hospitals versus the 23 in Meridian's system.

**The CIO's answer:** Meridian is not an Epic-underperforming organization. It is a governance and execution-bandwidth organization. The technology is there. The deployment decisions are not.`,
      sources: [
        'Meridian Epic License Utilization Audit — IT Finance Q1 2026',
        'Epic DAX Copilot Governance Log — Clinical Informatics Committee',
        'Meridian Infor Lawson Maintenance Contract — FY2026',
      ],
    },
    'cdo-vacancy': {
      question: 'CDO Vacancy — What is the cost of this seat being empty?',
      role: 'CIO',
      response: `Meridian has operated without a Chief Data Officer for 8 months following Dr. Priya Nair's departure in August 2025. This is not an administrative gap — it is the single largest blocker to the AI strategy execution.

**What requires a CDO to proceed:**
The Denial Prediction Model is validated and ready to deploy. Deployment requires an MLOps infrastructure decision that spans legal (PHI governance), IT (Azure ML Managed Endpoints), and clinical operations. Without a CDO, no one has the authority to make this cross-functional call. The model has been validated and idle for 8 months.

The Sepsis AI scale-up from 2 to 23 hospitals requires coordinating Epic clinical informatics, cloud infrastructure, and hospital operations across three markets. The CIO has clinical infrastructure. The CMIO has clinical authority. The gap is the data governance authority to sign off on cross-hospital PHI use.

The Azure AI Foundry architecture decision — which data can train which model, under which BAA conditions — cannot be made without a CDO-level officer.

**Cost of vacancy:** $14M in deployable AI value is sitting blocked. Each quarter without a CDO costs approximately $3.5M in delayed AI outcomes.`,
      sources: [
        'Meridian AI Initiative Status Report — Marcus Webb, Q1 2026',
        'AbarVa Situation Intelligence — CDO Gap Analysis, April 2026',
        'Meridian Human Resources — Executive Role Vacancy Tracker',
      ],
    },
    'strategy-current-state': {
      question: 'AI Strategy — What is our current state?',
      role: 'CIO',
      response: `Meridian's current AI state can be summarized in one pattern: PILOT PURGATORY. Six AI initiatives started in 24 months. Zero scaled to enterprise.

**Current state assessment:**
Data readiness: 58/100. Clinical data is adequate (62) but operational data is fragmented (48) and technology data is weak (42). This is a governance problem, not a data volume problem.

Technology readiness: 44/100. No MLOps platform deployed. Azure Synapse implementation is 60% complete. No ML model registry. No model monitoring. No responsible AI framework.

Organizational readiness: 32/100 — the lowest dimension. AI literacy training has reached 24% of staff. Change capacity is limited (34) after the failed Epic supply chain rollout in 2022. Leadership alignment is partial — the CIO and CMIO are aligned; the CFO needs outcome evidence before committing additional capital.

**The bottleneck is not the models:**
Meridian has good AI models. The sepsis model works. The denial prediction model is validated. The problem is the infrastructure to deploy, monitor, and govern models — and the organizational capacity to execute the change that AI requires.

**What changes this:** CDO hire + MLOps deployment + a clean CDO-to-CIO AI governance framework. In that sequence, the wave 1 initiatives unlock in 90 days.`,
      sources: [
        'AbarVa Situation Intelligence — Meridian AI Maturity Assessment, April 2026',
        'Meridian IT Strategic Plan FY2026 — Azure Synapse Implementation Status',
        'AbarVa Change Readiness Framework — Healthcare Vertical Benchmarks',
      ],
    },
    'strategy-business-case': {
      question: 'AI Investment — What is the 3-scenario business case?',
      role: 'CFO',
      response: `Three scenarios for Meridian's AI investment decision over 18 months.

**Conservative scenario (Wave 1 only, minimal change management):**
Investment: $15.2M. Annual value: $100.7M. ROI: 5.8x. Key assumption: prior auth automation, denial model deployment, sepsis scale-up. CDO hired by Q2 2026. No Wave 2.

**Moderate scenario (Wave 1 + Wave 2, planned sequencing):**
Investment: $37.6M. Annual value: $196.7M. ROI: 5.2x. Key assumption: Wave 1 complete, CDO and MLOps in place by Q3, Wave 2 nurse scheduling and MA Star Rating launched in Q4.

**Aggressive scenario (Full roadmap, 18 months):**
Investment: $55.6M. Annual value: $292M. ROI: 5.25x. Payback: 8.2 months. Key assumption: Wave 1 delivers and builds organizational confidence for Wave 2 and 3. Clinical documentation AI at enterprise scale by Month 18.

**Robert Chen's threshold:** CFO has committed to "check after proof." The AP Invoice Automation and Azure Cost Optimization are delivering. The Q2 2026 review conversation is the unlock for Wave 2 capital.

**AbarVa's recommendation:** Conservative scenario as the default plan. Moderate scenario as the board aspiration. Aggressive scenario as the 3-year roadmap story.`,
      sources: [
        'Meridian AI Investment Intelligence — Wave Analysis, April 2026',
        'Meridian FY2025 Board Strategic Plan — Capital Allocation Framework',
        'Robert Chen CFO Interview Transcript — Q4 2025 Stakeholder Session',
      ],
    },
    'select-prior-auth': {
      question: 'Prior Auth Vendor — Why Cohere Health?',
      role: 'CIO',
      response: `After evaluating Olive AI, Waystar AI, and Cohere Health against Meridian's specific requirements, AbarVa recommends Cohere Health as the primary prior auth solution.

**The Meridian-specific fit:**
Cohere is purpose-built for prior authorization — unlike Waystar (broader RCM) or Olive (broader automation). Cohere's CMS January 2026 interoperability compliance is built in, not bolted on. For Meridian's situation — 77% of prior auths still manually processed — the out-of-the-box payer connectivity is the critical path item.

**Implementation timing:**
Cohere's average Epic-native deployment is 60 days from contract to live payer connections. Waystar is 90 days; Olive averaged 4 months in similar-sized health systems. The January 2026 CMS deadline has passed, but the competitive pressure from payers who are automating approval workflows continues to accelerate.

**Score (Meridian-specific):**
Cohere: 88/100 overall fit. Epic integration: 92. CMS compliance: 95. Implementation speed: 88.
Waystar: 84/100. Stronger for broader RCM but more implementation overhead.
Olive: 72/100. Olive AI's focus has shifted away from prior auth toward broader automation.

**Note:** AbarVa does not have a referral relationship with Cohere Health. This recommendation is based solely on fit analysis.`,
      sources: [
        'AbarVa Vendor Intelligence — Prior Authorization AI Evaluation, April 2026',
        'Cohere Health Implementation Reference — 3 Epic-integrated health systems',
        'CMS Interoperability and Patient Access Final Rule — Prior Auth Requirements',
      ],
    },
    'operating-margin': {
      question: 'Operating Margin — How do we close the $94M gap?',
      role: 'CFO',
      response: `The $94M gap between current operating margin (1.8%) and board target (4.0%) has three addressable components within a 24-month horizon.

**Component 1: Revenue leakage from RCM — $47M recoverable**
The denial rate gap alone (18.2% vs. 12.1% benchmark) represents $47M in annual delayed or lost revenue. This is not a volume problem — it is a process and technology problem. DAX Copilot activation and Ensemble SLA enforcement address this without capital investment beyond what is already licensed.

**Component 2: Supply chain waste — $28M opportunity**
Meridian is operating Infor Lawson for supply chain in parallel with Epic, creating duplicate workflows and purchase order fragmentation. Epic Supply Chain is already licensed but not implemented. Peer organizations completing this transition report 12-15% supply chain cost reduction. At Meridian's $230M annual supply spend, that is $27.6-34.5M.

**Component 3: Labor productivity — $19M through AI augmentation**
Nursing documentation burden is averaging 2.1 hours per shift per nurse — 40% above the benchmark. DAX Copilot and AI-assisted documentation at the bedside recover this time. At Meridian's current nursing cost structure, each hour of recovered documentation time per shift per nurse is worth approximately $19M annually across the system.

**The sequencing matters:** These are not independent workstreams. DAX Copilot activation is the forcing function — it simultaneously addresses revenue (denial rate), labor (documentation burden), and sets the foundation for supply chain workflow integration in Epic.`,
      sources: [
        'Meridian FY2025 Consolidated Financial Statements',
        'Epic Supply Chain ROI Analysis — Peer Health System Benchmarks, 2024',
        'Nursing Documentation Burden Study — AONL/AHA, 2025',
        'Meridian Board of Directors Strategic Plan — Operating Margin Target Documentation',
      ],
    },
    'pdlc-delivery-baseline': {
      question: 'Delivery Performance — What is our AI-in-SDLC baseline?',
      role: 'CIO',
      response: `Meridian's software delivery performance is in the bottom quartile for healthcare organizations of comparable size. Before AI tooling can be evaluated, the baseline must be established.

**Current delivery metrics:**
Deploy frequency: 2.1 per month (peer median: 8.4). Lead time from commit to production: 18 days (peer median: 4.2 days). Change failure rate: 22% (peer standard: <10%). MTTR: 6.2 hours (peer median: 2.1 hours).

**Root cause:**
Meridian's SDLC operates on a quarterly release train for Epic — a legacy governance pattern that has leaked into all technology deployments. The result is batched, high-risk deployments with poor rollback capability.

**The AI opportunity:**
GitHub Copilot adoption by IT engineering teams can reduce code review time by 40% and unit test generation by 60%. But the bigger leverage is in test automation — Meridian's test automation coverage is 18% versus a target of 80%. AI-assisted test generation addresses this faster than manual effort.

**Phase 1 recommendation:** Establish CI/CD pipeline for non-Epic systems. Target deploy frequency of 4/month within 6 months. GitHub Copilot activation for 18 licensed but inactive developers is the quick win.`,
      sources: [
        'Meridian IT Engineering Delivery Metrics — DevOps Team Report Q1 2026',
        'DORA Research: State of DevOps 2025 — Healthcare Industry Benchmarks',
        'GitHub Copilot Enterprise Activation — IT Engineering License Audit',
      ],
    },
    'fow-workforce-capacity': {
      question: 'Workforce Capacity — Where are we losing clinical hours?',
      role: 'COO',
      response: `Meridian is losing approximately 4,200 productive clinical hours per week to administrative burden. At the current loaded cost of nursing and physician time, this represents $8.4M annually in productivity that is accessible without hiring a single additional FTE.

**The documentation burden:**
Physicians average 2.1 hours per day on documentation — 40% above the AMGA benchmark of 1.5 hours. Nursing staff average 1.8 hours per shift on documentation versus the 0.9-hour benchmark. This is not a staffing model problem. It is a documentation technology problem.

**The scheduling inefficiency:**
756 travel nurses represent $142M in annual spend. 60% of travel nurse demand is reactive — contracted within 72 hours of the need at 40% premium rates. The predictive demand forecasting capability to shift to 90-day advance contracting at standard rates exists in Meridian's historical data.

**The governance gap:**
24% nurse turnover is 8 points above the national benchmark. Exit interview data (available in the HRIS system) shows documentation burden and scheduling unpredictability as the top two reasons — not compensation.

**AI opportunity:** Ambient documentation (DAX Copilot or Abridge) + ML-based nurse demand forecasting. These two tools address both dimensions within a 6-month timeline.`,
      sources: [
        'Meridian HR Analytics — Nurse Turnover and Exit Interview Data Q4 2025',
        'Meridian Staffing Analytics — Travel Nurse Spend and Contract Terms FY2025',
        'AMGA Physician Burnout and Documentation Burden Survey 2025',
      ],
    },
    'ami-analytics-estate': {
      question: 'Analytics Estate — What are we actually running?',
      role: 'CDO',
      response: `Meridian has no complete inventory of its analytics estate. This is the first problem — you cannot govern what you haven't mapped.

**What AbarVa found:**
128 Tableau workbooks active in the last 90 days. 340 Power BI reports (214 have not been opened in 6+ months). 6 Qlik Sense deployments from three separate acquisitions. 12 Epic reporting environments with overlapping definitions for the same metrics.

**The critical gap:**
Meridian's operating margin is calculated differently in Finance (Workday), the Board reporting pack (Tableau), and the Epic administrative dashboards. The three numbers diverge by up to $22M depending on how intercompany eliminations and provider compensation pools are treated. This is not a rounding error — this is a governance failure.

**The duplication cost:**
Annual license spend across all analytics tools: $4.8M. Estimated consolidation opportunity: $2.2M in license reduction. More importantly: 3 FTEs in IT are maintaining duplicate tooling that one consolidated platform would eliminate.

**Recommendation:** Analytics platform rationalization to Tableau + Epic Reporting. Retire Power BI and Qlik Sense footprint. Establish a single metric registry (operating margin definition must be board-approved and singular) before any AI is layered on top.`,
      sources: [
        'Meridian IT License Inventory — Analytics Platform Audit Q1 2026',
        'Tableau Server Usage Statistics — Meridian Instance Export',
        'Meridian Finance vs. Epic Reporting Reconciliation — CFO Office Q4 2025',
      ],
    },
    'controltower-shadow-ai': {
      question: 'Shadow AI — What are we missing?',
      role: 'CIO',
      response: `AbarVa's discovery analysis found 6 AI tools in active use at Meridian that are not in the IT registry, not covered by a BAA, and in 3 cases are actively processing what appears to be clinical information.

**The PHI risk:**
ChatGPT web interface: 284 active users, including 142 from clinical staff based on department attribution in the proxy logs. At least some of these sessions involve patient case discussions — a HIPAA violation risk that is not hypothetical.

Otter.ai: 24 users in outpatient clinics. Otter records ambient audio for transcription. If any of these recordings include patient conversations, this is a potential reportable breach under HIPAA.

Doximity GPT: 67 physician users. Doximity has a BAA available — but Meridian has not executed it.

**The immediate actions:**
Block ChatGPT from clinical VLAN within 48 hours. Halt Otter.ai until a clinical-grade alternative (DAX Copilot) is available. Execute Doximity BAA before next business day.

**The structural fix:**
An AI policy addendum that defines approved tools, required BAAs, and the process for requesting new AI tool approvals. Currently, no such policy exists — staff defaults to consumer tools because there is no enterprise alternative communicated to them.`,
      sources: [
        'Meridian Network Security — Browser Proxy Log Analysis April 2026',
        'Meridian MDM Agent Report — Unapproved Application Detection Q1 2026',
        'HIPAA Guidance: Use of Online Communication Tools in Healthcare, OCR 2023',
      ],
    },
    'controltower-override-rate': {
      question: 'Sepsis AI Override — Why is the rate 31%?',
      role: 'CMIO',
      response: `The Sepsis Early Warning AI has a 31% override rate — meaning clinicians dismiss the alert without taking the recommended action in nearly a third of cases. This is above the 25% threshold that triggers governance review.

**Dr. Okonkwo's assessment:**
"This is alert fatigue, not diagnostic distrust." The model is generating alerts that are clinically correct but operationally inconvenient. Nurses are dismissing alerts during high-acuity periods because acting on the alert requires a physician order, and the physician may be occupied with another patient.

**The root cause:**
The alert fires when a risk threshold is crossed — but it does not differentiate between a patient who is deteriorating rapidly and one who is borderline and being closely monitored. This binary trigger creates false urgency that erodes clinician trust over time.

**What the data shows:**
Analysis of the 31% dismissed alerts over 6 months: 18% were patients who subsequently required escalation within 4 hours. 13% were patients who stabilized without intervention. The model is right more often than the dismissal rate implies — but the workflow to act on it is broken.

**Recommendation:** Threshold recalibration + workflow integration (auto-trigger physician notification in Epic for high-confidence alerts, not all alerts). Target: reduce override rate to <18% within 90 days.`,
      sources: [
        'Meridian Sepsis AI Alert Audit — Clinical Informatics Team, Q1 2026',
        'Dr. Sarah Okonkwo CMIO Interview Transcript — March 2026 AbarVa Session',
        'Alert Fatigue Research — JAMIA 2024 Study on Clinical AI Override Rates',
      ],
    },
    'controltower-business-value': {
      question: 'AI Value — What have we actually proven?',
      role: 'CFO',
      response: `Of Meridian's 6 registered AI tools, 2 have documented, attributable business value. 2 have pilot-proven value that cannot be attributed at scale. 2 have no documented value.

**Proven value ($8.4M/year):**
AP Invoice Automation: $4.2M annual savings, high attribution confidence. Baseline established before deployment; Esker platform provides direct measurement. Azure Cost Optimization: $4.2M annual savings, high attribution confidence. Azure Cost Management API provides direct measurement.

**Pilot-proven but not attributed ($66M potential):**
Sepsis AI: 31% mortality reduction proven at 2 hospitals. Cannot be attributed at enterprise scale because no baseline was established system-wide before deployment. Clinical Documentation AI: 24% documentation time reduction in pilot department. Cannot be credited at scale — no enterprise baseline.

**What this means for the Series A conversation:**
AbarVa's outcome fee model requires documented baseline + verified improvement. The two proven outcomes ($8.4M) generate $1.26M in outcome fees at 15%. The $66M in pilot-proven value is currently unmonetizable until baselines are established for scale deployment.

**Robert Chen's request:** Establish outcome baselines for all Wave 1 initiatives before go-live. This is the single most important governance action to make the outcome fee model work.`,
      sources: [
        'Meridian AI Control Tower — Business Value Tracking Q1 2026',
        'AbarVa Outcome Baseline Framework — Meridian Engagement',
        'Robert Chen CFO — Q1 2026 AI Investment Review Meeting Notes',
      ],
    },
  },
  firstcapital: {
    'fednow-urgency': {
      question: 'FedNow — What is the real cost of delay?',
      role: 'CIO',
      response: `First Capital is one of 847 mid-size commercial banks that has not yet enabled FedNow. The cost of continued delay is not hypothetical — it is measurable and accelerating.

**The $340M deposit risk:**
Analysis of First Capital's commercial deposit base shows $340M in operating account balances from clients in the $10-100M revenue segment. These clients are actively being solicited by digital-native competitors (Mercury, Brex, Relay) who offer instant payment rails as a baseline feature. Attrition in this segment runs 8-12% annually at banks without real-time payment capability.

**The OCC MRA exposure:**
Two of First Capital's three open OCC MRAs relate to payment operations — specifically, the manual override rate on AML transaction monitoring (78% vs. 45% benchmark) and the ACH return rate documentation gap. FedNow implementation via Finzly provides the payment hub architecture that directly addresses both MRAs as a side effect of the implementation.

**The 90-day window:**
Finzly's FedNow enablement deployment averages 87 days from contract to live. The next OCC examination cycle for First Capital begins in Q4 2026. Contracting by end of Q2 gives a 30-day buffer. Every quarter of delay costs approximately $85M in deposit attrition risk and extends the MRA exposure.`,
      sources: [
        'First Capital Financial Q4 2025 Regulatory Filing — OCC MRA Documentation',
        'Finzly FedNow Deployment Timeline Analysis — 23 bank implementations, 2025',
        'Federal Reserve FedNow Adoption Dashboard — April 2026',
        'First Capital Commercial Banking Deposit Analysis — Internal Q1 2026',
      ],
    },
    'pdlc-delivery-baseline': {
      question: 'Delivery Velocity — What does FedNow implementation require from IT delivery?',
      role: 'CTO',
      response: `First Capital's current IT delivery model cannot support a 90-day FedNow implementation without structural changes. Here is the assessment.

**Current state:**
Deploy frequency: 1.4 per month. Lead time: 24 days. Change failure rate: 31% — significantly above the 10% target for financial services with regulatory exposure. MTTR: 8.4 hours.

**The FedNow dependency:**
Finzly's FedNow connector requires API integration with First Capital's FIS HORIZON core. The integration involves 6 endpoints, real-time event streaming, and a payment ledger reconciliation layer. At First Capital's current change failure rate, a failed deployment during go-live creates regulatory exposure, not just downtime.

**What needs to change:**
Feature flag architecture for payment rail integrations — deploys can be tested in production without customer exposure. Automated integration test suite for the FIS HORIZON API. Rollback capability to <15 minutes (currently 4+ hours).

**Timeline:**
Finzly can deploy in 87 days from contract with normal IT engagement. With current change failure rate, First Capital needs a 30-day engineering sprint to stabilize the pipeline before the FedNow integration work begins. This adds 30 days to the timeline — contracts must be executed by May 1 to maintain the Q3 go-live.`,
      sources: [
        'First Capital IT Engineering — DORA Metrics Baseline Report Q1 2026',
        'Finzly FedNow Technical Integration Guide — FIS HORIZON Edition',
        'First Capital OCC MRA Remediation Plan — Payment Operations, March 2026',
      ],
    },
    'fow-it-run-reduction': {
      question: 'IT Run Cost — Where is the $18M reduction opportunity?',
      role: 'CIO',
      response: `First Capital's IT run cost is $142M annually. Peer banks at similar scale average $98M. The $44M gap has three addressable components.

**Component 1: Legacy application maintenance — $18M**
First Capital is running 14 applications built between 2003 and 2012 that serve fewer than 100 internal users each. Annual maintenance cost: $18M. Migration or retirement of these applications to modern SaaS or consolidated platforms would recapture most of this spend within 18 months.

**Component 2: Over-provisioned infrastructure — $8M**
Cloud cost analysis shows $8M in annual waste: idle EC2 instances, over-provisioned RDS databases, and unattached EBS volumes. AWS Cost Explorer data confirms this has been growing at 12% per year — the migration to cloud was done without FinOps governance.

**Component 3: AML operations labor — $12M**
78% false positive rate in AML transaction monitoring generates 3 FTE of manual review work at $180K fully loaded. ML-based AML tuning to reduce false positives to 45% benchmark eliminates most of this overhead. Actimize model retuning project can be scoped and completed in 90 days.

**Total addressable: $38M of $44M gap in 18 months.** The remaining $6M requires core banking consolidation — a multi-year effort.`,
      sources: [
        'First Capital IT Finance — Run Cost Benchmark Analysis Q1 2026',
        'AWS Cost Explorer Export — First Capital Cloud Spend, March 2026',
        'First Capital AML Operations Report — Manual Review Queue Analysis',
      ],
    },
    'controltower-compliance-risk': {
      question: 'AI Compliance Risk — What is our regulatory exposure?',
      role: 'CISO',
      response: `First Capital's AI compliance posture has two critical exposures: the AML model risk governance gap and the absence of an AI-specific Model Risk Management framework.

**AML False Positive Rate — Model Risk Governance:**
The 78% false positive rate in the AML transaction monitoring system (vs. 45% benchmark) is documented in OCC MRA #2. The OCC has not yet required remediation of the underlying model — but the MRA documentation makes clear that manual review reliance is not a sustainable mitigation. The next examination cycle begins Q4 2026.

**Missing AI Model Risk Management Framework:**
SR 11-7 (OCC/Fed model risk management guidance) applies to all quantitative models including ML models. First Capital has 3 ML models in production (AML, credit scoring adjunct, fraud detection) with no formal SR 11-7 documentation. This is a material gap that will be cited in the Q4 examination.

**What is required:**
Model inventory with risk tier classification (by Q3 2026). Model validation documentation for the 3 production ML models. Annual validation cycle with independent model validator. Challenger model framework for AML — demonstrating that the false positive rate is being actively managed.

**Timeline:** SR 11-7 compliance for existing models by September 2026. New model governance policy by June 2026.`,
      sources: [
        'First Capital OCC MRA #2 — AML Transaction Monitoring Documentation',
        'Federal Reserve SR 11-7 — Guidance on Model Risk Management',
        'First Capital AI Model Inventory — IT Risk Management Q1 2026',
      ],
    },
  },
  apexretail: {
    'einstein-activation': {
      question: 'Einstein — Why is $248M in value sitting idle?',
      role: 'CDO',
      response: `Apex Retail licensed Salesforce Einstein in Q2 2022. As of Q1 2026, the activation rate is effectively zero. The $248M figure is not a projection — it is the documented opportunity cost calculated from Einstein's own ROI models applied to Apex's actual transaction volume and customer dataset.

**Why it hasn't been activated:**
The root cause is not technical. The Segment CDP integration that Einstein requires for real-time personalization has 340,000 duplicate customer profiles — 22% of the total profile count. Einstein's recommendation engine cannot produce reliable output against a fragmented identity graph. Every IT team that has attempted activation hits this blocker within the first two weeks.

**The Segment fix is the unlock:**
Resolving the Segment profile fragmentation is a 60-90 day data engineering effort. It does not require a platform replacement — it requires a deduplication and identity resolution pass using Segment's native tools. Once clean, Einstein activation follows in 30-45 days.

**The $124M dynamic pricing layer:**
Separately, Apex's Vertex AI contract includes access to Google's retail demand forecasting models. The dynamic pricing use case alone — tested against Apex's Q4 2024 data — shows $124M in margin improvement through real-time price optimization on the 40,000 SKUs where Apex has pricing authority.

**Sequencing:** Fix Segment. Activate Einstein. Then layer dynamic pricing. The dependency chain is clear. The blockers are known. The question is execution velocity.`,
      sources: [
        'Salesforce Einstein Commerce ROI Model — Apex Retail Configuration, 2025',
        'Segment CDP Audit Report — Apex Retail Profile Deduplication Analysis, Q1 2026',
        'Google Vertex AI Retail Dynamic Pricing Pilot — Apex Q4 2024 Backtest',
        'Apex Retail FY2025 Annual Report — Technology Investment Disclosure',
      ],
    },
    'diagnose-einstein-cmo': {
      question: 'Einstein for Marketing — What is the personalization gap?',
      role: 'CMO',
      response: `Apex Retail's marketing personalization is running at 8% of its theoretical capability. The Salesforce Einstein license covers recommendation, email personalization, and journey optimization. None of these are active at scale.

**The customer data problem:**
340,000 duplicate customer profiles in Segment CDP mean that Einstein cannot build a reliable single customer view. The average Apex Retail loyal customer has 2.4 profile fragments — different email addresses, device identifiers, and loyalty numbers that have never been reconciled. Email campaigns are going to the same customer multiple times or not at all.

**What this costs in marketing spend:**
Apex's email marketing spend is $8.4M annually. Industry benchmarks show personalized email programs achieving 3-6x higher conversion than batch-and-blast. At Apex's current 1.2% email conversion rate (benchmark for personalized programs: 4.8%), the lost revenue from unpersonalized campaigns is approximately $62M annually.

**The 90-day activation path:**
Step 1: Segment identity resolution project (60-90 days). Step 2: Einstein Journey Builder activation on the clean CDP data (30 days). Step 3: Recommendation engine activation for top 500 SKUs by revenue (45 days).

**The CMO's metric:** Loyalty active rate from 38% to 52% within 12 months is a reasonable target once the CDP is clean.`,
      sources: [
        'Salesforce Einstein Marketing Activation Report — Apex Retail Q1 2026',
        'Segment CDP Profile Audit — Identity Resolution Analysis',
        'Apex Retail Marketing Analytics — Email Conversion Benchmark Comparison',
      ],
    },
    'fow-store-operations': {
      question: 'Store Operations — Where is AI creating leverage?',
      role: 'COO',
      response: `Apex Retail's 2,340 store locations represent the largest operational leverage point in the business — and the area where AI has been most underutilized.

**Inventory optimization:**
18% out-of-stock rate at store level, versus a 6% target. Each percentage point of OOS rate costs approximately $84M in lost sales annually. The ML demand forecasting capability to get to 8% OOS is achievable using 3 years of historical POS data that already exists in the data warehouse.

**Staffing model:**
Store labor is the second-largest cost line after COGS at $1.8B annually. Current staffing is based on fixed schedules updated quarterly. AI-assisted scheduling using real-time traffic patterns, seasonal models, and event calendars would reduce excess staffing cost by an estimated 8-12%, or $144-216M annually.

**Loss prevention:**
Current shrink rate: 2.1% of revenue. Peer retailers using computer vision at point-of-sale for self-checkout monitoring report shrink rates below 1.4%. At Apex's revenue, closing half the gap is worth $126M.

**The sequencing:** Inventory optimization is the fastest path to measurable P&L impact (6 months). Staffing optimization requires more organizational change management. Loss prevention is a capital decision — camera infrastructure in 2,340 stores is a $40M+ investment with 3-year payback.`,
      sources: [
        'Apex Retail Operations Benchmarking Report — Store-Level KPI Analysis Q4 2025',
        'NRF Retail Loss Prevention Study 2025 — Shrink Benchmarks by Format',
        'Apex Retail Workforce Analytics — Scheduling Efficiency Analysis',
      ],
    },
    'ami-analytics-estate': {
      question: 'Analytics Estate — What are we paying for and not using?',
      role: 'CDO',
      response: `Apex Retail's analytics estate is fragmented across three BI platforms, two legacy data warehouses, and a Google BigQuery migration that is 40% complete. Total analytics spend: $12.4M annually. Estimated waste: $4.8M.

**The platform landscape:**
Looker (Google-native): 340 active dashboards, 820 users. The primary BI platform — well-utilized.
Power BI: 180 dashboards, 284 users. Primarily from the 2021 Midwest Stores acquisition. Duplicate coverage with Looker on 60% of reports.
MicroStrategy: 42 dashboards, 18 users. Legacy financial reporting. $1.2M annual license for 18 users who primarily use the scheduled PDF delivery function.
Tableau: 28 dashboards from a 2019 pilot. Never formally decommissioned. 6 active users.

**The data warehouse problem:**
Legacy Oracle data warehouse (2007) + Google BigQuery (2023, 40% migrated). 74 ETL jobs still running against Oracle. BigQuery migration stalled 8 months ago when the ETL re-architecture scope expanded beyond the initial estimate.

**Recommendation:** Complete BigQuery migration (4-month sprint). Retire MicroStrategy (18 users migrate to Looker). Retire Tableau. Consolidate Midwest Stores Power BI into Looker. Net annual saving: $3.2M. More importantly: single data lineage for all AI/ML training data.`,
      sources: [
        'Apex Retail IT License Audit — Analytics Platform Consolidation Review Q1 2026',
        'Google BigQuery Migration Status Report — Data Engineering Team',
        'Apex Retail Analytics Governance Assessment — AbarVa Data Estate Intelligence',
      ],
    },
    'controltower-cost-rationalization': {
      question: 'AI Cost — Where are we spending and what are we getting?',
      role: 'CFO',
      response: `Apex Retail's AI spend is $2.8M annually across licensed and internally-built tools. Return on that spend is currently documented on less than 30% of tools.

**Spend breakdown:**
Salesforce Einstein license: $1.2M/year — currently generating $0 in documented return (not activated). Google Vertex AI: $480K/year — dynamic pricing model in development, not in production. Snowflake AI Features: $340K/year — used for demand forecasting in 3 distribution centers. Microsoft Azure Cognitive Services: $180K/year — receipt OCR and fraud detection. Internal ML team (3 engineers): $620K fully loaded.

**The Einstein problem:**
$1.2M per year in license fees for a platform that is not activated. The contract has 18 months remaining. The activation unlock (Segment CDP identity resolution) is a $280K project. ROI: $248M in documented value activation for $280K in unblocking work. This is the highest-ROI capital decision in the AI portfolio.

**The Vertex AI bet:**
$480K annual spend on a dynamic pricing model that has been in "development" for 14 months. A/B testing framework has not been built. Revenue attribution will be impossible without a clean baseline established before deployment. Recommendation: ship or sunset by Q3 2026.

**Cost per documented outcome:** Currently $2.8M spend / $0 documented AI savings = undefined ROI. Target: $2.8M spend / $124M documented Einstein savings within 12 months.`,
      sources: [
        'Apex Retail IT Finance — AI Tool License and Engineering Spend FY2025',
        'Google Vertex AI Dynamic Pricing Project Status — Engineering Team Q1 2026',
        'Salesforce Einstein Contract Review — License Terms and ROI Analysis',
      ],
    },
  },
}

// Role-specific pre-configured question cards per client
export const ROLE_QUESTIONS: Record<DemoClient, Record<string, string[]>> = {
  meridian: {
    CIO: [
      "RCM Denial Rate — What's driving the gap?",
      'DAX Copilot — Why hasn\'t it been activated?',
      'Epic Supply Chain — What is the implementation risk?',
      'Ensemble SLA — What leverage do we have?',
    ],
    CFO: [
      'Operating Margin — How do we close the $94M gap?',
      'RCM Revenue Leakage — What is recoverable this year?',
      'AI Investment — Where does the capital go first?',
      'McKinsey Engagement — What did we get for $14M?',
    ],
    CMIO: [
      'Physician Burnout — Is documentation burden measurable?',
      'Prior Auth — What is the clinical impact of 4.2-day delays?',
      'Sepsis Early Warning — Why is the licensed model unused?',
      'DAX Copilot — What do peer CMIOs say after activation?',
    ],
    COO: [
      'Supply Chain — What is the Infor Lawson migration risk?',
      'Operating Efficiency — Where are the top 3 waste pools?',
      'Wave 1 Timeline — What can realistically close in 90 days?',
      'Ensemble Contract — What does performance accountability look like?',
    ],
    CDO: [
      'Data Readiness — What is our AI readiness score?',
      'Azure AI Foundry — Is the PHI boundary actually secure?',
      'Epic Data Model — What can we extract for ML training?',
      'Governance — What does responsible AI deployment require here?',
    ],
    CEO: [
      'Board Narrative — How do I explain the margin gap?',
      'Competitive Position — Are we falling behind peer systems?',
      'AI Investment — What is the 18-month ROI story?',
      'Design Partner — What does the AbarVa arrangement give us?',
    ],
  },
  firstcapital: {
    CIO: [
      'FedNow — What is the real cost of delay?',
      'AML False Positives — Why is the rate 78% when peers are at 45%?',
      'Core Banking — What is the Temenos migration risk?',
      'Finzly — How does 90-day deployment actually work?',
    ],
    CFO: [
      'Deposit Attrition — What is the $340M risk?',
      'OCC MRAs — What is the financial exposure?',
      'FedNow ROI — What does the payback model look like?',
      'AML Operations — What are 3 FTEs in manual review costing us?',
    ],
    CDO: [
      'Data Architecture — What needs to change for real-time payments?',
      'AWS Bedrock — Is this the right AI infrastructure choice?',
      'Model Risk — How do we govern AI in a regulated environment?',
      'FedNow Data — What new signals does real-time payment data create?',
    ],
    CEO: [
      'Competitive Gap — How far behind are we on digital payments?',
      'Regulatory Risk — What does the OCC examination timeline mean?',
      'Investment Case — What is the board story for this spend?',
      'Design Partner — What does AbarVa provide that our advisors don\'t?',
    ],
  },
  apexretail: {
    CDO: [
      'Einstein — Why is $248M in value sitting idle?',
      'Segment CDP — What does the profile fragmentation actually cost?',
      'Dynamic Pricing — What is the Vertex AI opportunity?',
      'SAP S/4HANA — What happens if we miss the 2027 deadline?',
    ],
    CIO: [
      'SAP ECC — What is the real migration runway?',
      'OMS — Why is IBM Sterling still running in 2026?',
      'Einstein Activation — What does the IT sequencing look like?',
      'GCP Architecture — Is our AI infrastructure investment durable?',
    ],
    CFO: [
      'Tech Debt — What is the annual cost of running dual ERPs?',
      'Einstein ROI — What does $248M in activation value actually mean?',
      'Dynamic Pricing — What is the P&L impact of 40K SKU optimization?',
      'SAP Migration — What is the capital exposure if we defer?',
    ],
    CEO: [
      'Digital Roadmap — Are we behind our peer retailers?',
      'AI Investment — What is the board-level narrative?',
      'Salesforce — Are we getting value from what we\'ve licensed?',
      'Wave 1 — What can close in the next 90 days?',
    ],
  },
}

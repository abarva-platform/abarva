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

"use client";
// /home/learn — Executive review landing.
//
// Founder directive 2026-05-10: "this has to be simple, elegant, and
// amazing... case study and example driven. Sample clients in learn must be
// 100% accurate. We should orient them on who they are / leadership / vision
// / data loaded and also the vision for corpus. How intelligent our agents
// are emphasis. Focus on 'who we are and why they should use us'. If that
// vision and purpose is not understood upfront in 5 minutes, we lose the
// battle."
//
// Structure:
//   1. Hero — 5-minute "who we are + what we solve" pitch with 3 tenant tabs
//   2. Vision — Ava (one assistant) and the specialist expertise she draws on,
//      plus the corpus thesis
//   3. Case study (active tab) — composite tenant: who, leadership, data
//      loaded, what's at stake. All numbers traced to executive_bench.json
//      and function_capacity.csv on disk.
//   4. Agent intelligence — concrete Q&A pairs showing Ava reaching
//      into the tenant's substrate to answer sized/scoped/funded questions.
//   5. Walkthrough — the 5-minute path with explicit clicks.

import { useState } from "react";
import Link from "next/link";
import {
  Section,
  HeroBand,
  Eyebrow,
  SectionTitle,
  Lead,
  SubHead,
  InlineAbarvaLogo,
  Callout,
  T,
} from "./primitives";

type TenantKey = "apex" | "meridian" | "firstcapital";

type Stat = { label: string; value: string; detail: string };

type CxoLogin = {
  title: string;
  name: string;
  email: string;
  responsibility: string;
};

type DataLoadedRow = { kind: string; count: string; example: string };

type AgentQA = {
  agent: "Ava";
  expertise: string;
  question: string;
  groundedAnswer: string;
  citesFrom: string;
};

type TenantConfig = {
  shortLabel: string; // e.g., "Apex Retail"
  tabDetail: string; // e.g., "$108B retailer"
  accent: string; // primitive color for this tenant
  accentSoft: string;
  industryEyebrow: string;
  whoTitle: string;
  whoLead: string;
  scaleStats: Stat[]; // 4-stat summary
  leadership: CxoLogin[]; // 3 CXO test logins
  visionTitle: string;
  visionLead: string;
  dataLoadedLead: string;
  dataLoaded: DataLoadedRow[];
  whatsAtStakeTitle: string;
  whatsAtStakeBullets: string[];
  agentSamples: AgentQA[];
  walkStart: { href: string; label: string; reason: string };
};

// ───────────────────────────────────────────────────────────────────────────
// Tenant fixtures — every number reconciled to the live composite seed data
// (executive_bench.json, function_capacity.csv, fy2026_capital_plan.csv,
//  funding_authority_matrix.csv) committed 2026-05-10.
// ───────────────────────────────────────────────────────────────────────────
const TENANTS: Record<TenantKey, TenantConfig> = {
  apex: {
    shortLabel: "Apex Retail",
    tabDetail: "$108B retailer · 250k EE",
    accent: T.purple,
    accentSoft: T.purpleSoft,
    industryEyebrow: "Composite tenant · Retail",
    whoTitle: "Apex Retail Group",
    whoLead:
      "A $108B mass-and-specialty omnichannel retailer with 1,976 stores across three U.S. regions, 12 distribution centers, and a category portfolio spanning apparel, home, beauty, and grocery. Activist-investor pressure on cost-to-revenue. AI bets are being shaped by CIO Carlos Rivera, CDO Lynne Stratham, and a sharp-eyed CFO Margaret Chen who gates every line above $25M.",
    scaleStats: [
      {
        label: "Revenue",
        value: "$108B",
        detail: "Mass + specialty omnichannel",
      },
      {
        label: "Footprint",
        value: "1,976 stores",
        detail: "12 DCs across 3 regions (W/E/Central)",
      },
      {
        label: "Headcount",
        value: "~250k",
        detail: "Largest single workforce: store associates",
      },
      {
        label: "IT operating budget",
        value: "$1.62B",
        detail: "1.5% of revenue (retail benchmark)",
      },
    ],
    leadership: [
      {
        title: "CIO",
        name: "Carlos Rivera",
        email: "cio@apex-retail.example.com",
        responsibility:
          "IT modernization, AMS rebuild, AI platform readiness. Single-decision authority up to $25M.",
      },
      {
        title: "CFO",
        name: "Margaret Chen",
        email: "cfo@apex-retail.example.com",
        responsibility:
          "Capital discipline + activist-investor narrative + AI ROI scrutiny. Joint with CIO above $25M.",
      },
      {
        title: "CDO",
        name: "Lynne Stratham",
        email: "cdo@apex-retail.example.com",
        responsibility:
          "CDP Activation 2026, customer-360, AI under governance. Sponsor pickup for marketing AI.",
      },
    ],
    visionTitle: "What Apex needs the platform to do",
    visionLead:
      "Apex is not asking for another AI roadmap deck. It needs a platform that can stand in the room, name owners and authorities, and turn a candidate AI bet into governed, ROI-defensible product change — fast enough that activist investors stop drafting the narrative for them.",
    dataLoadedLead:
      "The Apex tenant is loaded with composite enterprise depth. When a CXO asks any sized/scoped/funded question, Ava reaches into these substrates first.",
    dataLoaded: [
      {
        kind: "Named persons",
        count: "79",
        example:
          "CEO + 11 C-suite + SVPs of Merch (4) + Stores (W/E/Central) + Supply Chain + 27 IT leaders",
      },
      {
        kind: "Functions sized",
        count: "30",
        example:
          "Each with FTE / onshore / offshore / contractor split + FY26 budget + system count",
      },
      {
        kind: "Capital plan lines",
        count: "15",
        example:
          "Store tech $78M, Merch platform $32.5M, AI program $12.5M, DC automation $385M",
      },
      {
        kind: "Funding authority bands",
        count: "9",
        example:
          "Director $250K → VP $1M → SVP $5M → CIO $25M → CFO+CIO $75M → CEO $200M → Board",
      },
      {
        kind: "Systems inventory",
        count: "65",
        example:
          "Salesforce Einstein, JDA, Oracle ERP, Snowflake, Adobe Experience Platform",
      },
      {
        kind: "Vendor scorecards",
        count: "28",
        example:
          "Performance + risk + financial health per vendor with renewal-calendar flags",
      },
    ],
    whatsAtStakeTitle: "What's at stake on the Apex narrative",
    whatsAtStakeBullets: [
      "The CDP Activation 2026 program is mid-flight under Stratham; vendor BAFO open. Tester should pressure-test whether Ava surfaces the failure modes as she moves from strategy into sourcing.",
      "Activist investors are watching cost-to-revenue. Any Move with a payback profile longer than 24 months gets challenged by Chen — and Ava had better cite real numbers.",
      "Self-checkout deployment + RFID rollout to 1,200 stores is in flight; Ava should ground vendor and platform advice in the actual store-tech footprint.",
      "AI workforce scheduling is the candidate Move closest to launch. Tester can shape it as a real Move with Ava and watch the funding authority + governance gate trigger.",
    ],
    agentSamples: [
      {
        agent: "Ava",
        expertise: "AI strategy",
        question:
          "What AI bets are common at multi-banner retailers our size, and which ones actually hold up?",
        groundedAnswer:
          "My view: at $80-150B mass-and-specialty retailers, the bets that hold up cluster in three lanes — labor optimization (workforce scheduling, store labor productivity), demand & assortment (forecasting, allocation accuracy), and customer activation (NBO, loyalty, CDP). Personalization is overhyped at this scale because the data plumbing eats two years before ROI shows up. For Apex specifically, your workforce-scheduling pilot is the cleanest of the seven AI lines because the value lever (store labor cost) is concrete and the vendor space is mature. Demand sensing has the next-best ROI shape but depends on planning data that's still cleaning up post-AMS.",
        citesFrom:
          "Apex AI portfolio (7 initiatives) + retail benchmark patterns + AMS rebuild context",
      },
      {
        agent: "Ava",
        expertise: "investment shaping",
        question:
          "I want to fund a $4M AI workforce-scheduling pilot. What's the approval path?",
        groundedAnswer:
          "At $4M you're below the joint CFO+CIO threshold ($25M+) and inside CIO Carlos Rivera's single-decision authority ($5-25M band). But two parallel gates apply regardless of dollar: AI Governance Council attestation (use case design + bias assessment + workforce-data handling) and Internal Audit liaison via Joaquin Mendoza-Levitt. CFO Margaret Chen will still want a 1-page business case and 24-month payback evidence — she's the gating signature on activist-investor narrative even when she isn't a formal approver.",
        citesFrom: "funding_authority_matrix.csv (9 bands) + 2 parallel gates",
      },
      {
        agent: "Ava",
        expertise: "vendor & sourcing",
        question:
          "How is Salesforce Einstein performing for us right now? Anything to renegotiate?",
        groundedAnswer:
          "Einstein scorecard: 3.6 performance / 2.6 risk / A financial health / High strategic alignment. Owned by CMO Park's org. License-and-usage audit was last refreshed Mar 15. The leverage point is that your Salesforce Financial Services Cloud + Tableau renewal sits Mar 31, 2027 — bundle the negotiation. Open issue: license utilization is below the contracted seat count, which is the recurring gap to fix before BAFO on the next CDP-related contract.",
        citesFrom:
          "vendor_scorecards.csv + renewal_calendar.csv + Salesforce Einstein license audit",
      },
    ],
    walkStart: {
      href: "/intelligence?client=apexretail",
      label: "Ava · Apex Intelligence",
      reason:
        "Open with the workforce-scheduling question above; watch how Ava reaches into the IT financials and vendor scorecards.",
    },
  },
  meridian: {
    shortLabel: "Meridian Health System",
    tabDetail: "$16.8B IDN · 58k EE",
    accent: T.teal,
    accentSoft: T.tealSoft,
    industryEyebrow: "Composite tenant · Healthcare",
    whoTitle: "Meridian Health System",
    whoLead:
      "A $16.8B integrated delivery network with 30 hospitals across California and Hawaii, 280 ambulatory clinics, 7,400 employed physicians, plus the Meridian Health Plan (1.6M members, $5.2B medical-cost run rate) and Meridian Research Institute. Provider-and-plan integration is both the strategic edge and the operational complexity the AI portfolio has to navigate.",
    scaleStats: [
      {
        label: "Revenue",
        value: "$16.8B",
        detail: "Integrated provider + plan + research",
      },
      {
        label: "Footprint",
        value: "30 hospitals",
        detail: "280 clinics across CA + HI; Plan covers 1.6M members",
      },
      {
        label: "Headcount",
        value: "~58k",
        detail: "~14,800 RNs · 7,400 employed MDs",
      },
      {
        label: "IT operating budget",
        value: "$384M",
        detail: "2.3% of revenue (healthcare benchmark)",
      },
    ],
    leadership: [
      {
        title: "CDIO",
        name: "Dr. Anita Krishnamurthy",
        email: "cdio@meridian-health.example.com",
        responsibility:
          "Combined CDO+CIO; Epic strategy, plan-provider digital, AI Governance Council sponsor (chaired by CMIO Wexler).",
      },
      {
        title: "CFO",
        name: "David Park",
        email: "cfo@meridian-health.example.com",
        responsibility:
          "$1.1B capital plan steward; RCM modernization sponsor partner with VP Patricia Okafor; joint with CDIO on $10-25M IT capital.",
      },
      {
        title: "COO",
        name: "Sarah O'Brien",
        email: "coo@meridian-health.example.com",
        responsibility:
          "30 hospitals + ambulatory + nursing operations; ED throughput + nursing turnover; ambient documentation sponsor pickup.",
      },
    ],
    visionTitle: "What Meridian needs the platform to do",
    visionLead:
      "Healthcare AI dies one of two deaths: governance theatre or sprawl. Meridian needs a platform that can sequence ambient documentation, prior authorization, RCM modernization, and clinical AI under one operating discipline — without letting any single bet bypass clinical sign-off, model risk attestation, or the AI Governance Council.",
    dataLoadedLead:
      "The Meridian tenant is loaded with composite enterprise depth across provider, plan, and research. When a CXO asks a sized/scoped/funded question, Ava reaches into these substrates first.",
    dataLoaded: [
      {
        kind: "Named persons",
        count: "106",
        example:
          "CEO Morales + EC + SVPs of Hospital Ops (CA/HI) + Plan Ops (Hartwell) + 39 IT leaders",
      },
      {
        kind: "Functions sized",
        count: "26",
        example:
          "Data & Analytics 185 FTE / $38.5M / 14 systems · App Services 680 FTE · RCM 1,820 FTE",
      },
      {
        kind: "Capital plan lines",
        count: "18",
        example:
          "Cyber $22M, Epic $38M, RCM mod $18.5M, ambient doc $8.5M, AI Gov $2.2M, Hawaii DEFERRED",
      },
      {
        kind: "Funding authority bands",
        count: "10",
        example:
          "Director $100K → VP $500K → SVP $2M → CDIO $10M → CFO+CDIO $25M → CEO $50M → Board",
      },
      {
        kind: "Systems inventory",
        count: "114",
        example:
          "Epic Hyperspace + Ambulatory + Cogito + Cosmos · Snowflake · Atlas custom · Workday",
      },
      {
        kind: "Vendor scorecards",
        count: "45",
        example:
          "Performance + risk + financial health; Cohere Health + Abridge + Paige AI + Arcadia",
      },
    ],
    whatsAtStakeTitle: "What's at stake on the Meridian narrative",
    whatsAtStakeBullets: [
      "DENIALS-2024 sunk-cost narrative is alive in the C-suite. Q4 FY2025 denial spike is the operational pain — Ava should surface it without prompting.",
      "AI Governance Council is operating: 23 use cases under review, chaired by CMIO Dr. Jennifer Wexler. Any AI Move triggers parallel-gate attestation regardless of dollar.",
      "Hawaii integration funding deferred to FY2027 — capital allocation pressure is real; the agent should know this before recommending any net-new clinical AI capex.",
      "Ambient documentation rollout is in flight; Abridge contract renewal April 2026; Cohere Health prior-auth program is in P4 build with $6.1M of $9.8M consumed.",
    ],
    agentSamples: [
      {
        agent: "Ava",
        expertise: "AI strategy",
        question:
          "How big is the data analytics function vs. industry standard?",
        groundedAnswer:
          "Meridian Data & Analytics is sized to industry standard for a $16-20B IDN with both provider and plan analytics needs. 185 FTE total — 152 onshore, 18 offshore, 15 contractor. FY2026 budget $38.5M ($5.5M capex + $33M opex). Owns 14 systems including Snowflake, Epic Cogito, Epic Cosmos, the Atlas custom plan-provider platform, dbt, Tableau, Arcadia for population health, and Databricks under evaluation. Reports to VP Jordan McKenzie (CDIO direct). The onshore-heavy mix is typical because clinical data sensitivity makes offshore analytics hard at scale.",
        citesFrom:
          "function_capacity.csv (Data & Analytics row) + benchmark notes",
      },
      {
        agent: "Ava",
        expertise: "investment shaping",
        question:
          "I want to fund a $6M ambient documentation expansion. Walk me through the parallel gates.",
        groundedAnswer:
          "At $6M you're inside CDIO Anita Krishnamurthy's single-decision authority ($2-10M band). But two parallel gates apply regardless of dollar: AI Governance Council attestation chaired by CMIO Dr. Jennifer Wexler (use case design + clinical safety + PHI handling — required because ambient is in the 23-case active review cycle), and Board Risk Committee oversight if scope creates new enterprise risk concentration. CFO David Park is not a formal approver here but he's the gating signature on FY2026 transformation envelope, and the deferred Hawaii line tightens his envelope this year. Sponsor pickup: COO Sarah O'Brien partners on rollout to nursing.",
        citesFrom: "funding_authority_matrix.csv (10 bands + 2 parallel gates)",
      },
      {
        agent: "Ava",
        expertise: "vendor & sourcing",
        question:
          "How is Cohere Health performing for us, and what's the renewal posture?",
        groundedAnswer:
          "Cohere Health is owned by VP Thomas Hartwell on the plan side. The prior-auth automation program is in P4 Build, $6.1M of $9.8M budget consumed. My read on renewal: don't open it cold — your leverage is concentrated in the integration tail, not the core spec. Push for outcome-based fee structure tied to first-pass denial reduction (which is your DENIALS-2024 anchor). The healthier negotiation is bundling Cohere with the Abridge renewal in April 2026 — different categories but overlapping change-management surface area, and Hartwell + Krishnamurthy have the mandate to do it.",
        citesFrom:
          "vendor_scorecards.csv + program inventory + renewal_calendar.csv",
      },
    ],
    walkStart: {
      href: "/strategic-moves?client=meridian",
      label: "Ava · Meridian Strategic Moves",
      reason:
        "Pose the $6M ambient documentation question as a CDIO-sponsored Move; watch the parallel gates surface.",
    },
  },
  firstcapital: {
    shortLabel: "FS Demo",
    tabDetail: "$18.2B regional super-bank · $362B assets",
    accent: T.navy,
    accentSoft: T.navySoft,
    industryEyebrow: "Composite tenant · Banking",
    whoTitle: "FS Demo",
    whoLead:
      "A $18.2B-revenue regional super-bank with $362B in assets, 4 lines of business (Consumer / Commercial / Wealth / Treasury & Markets), $420B wealth AUM, 480 branches, 720 ATMs, and the heaviest compliance org of the three composite tenants. JPM-style operating committee structure scaled to $20B — every IT capital decision routes through a three-signature CFO + CIO + CRO joint approval, and SR 11-7 model risk gates every AI/ML model regardless of dollar.",
    scaleStats: [
      {
        label: "Revenue",
        value: "$18.2B",
        detail: "$362B assets · $420B wealth AUM",
      },
      {
        label: "Footprint",
        value: "480 branches",
        detail: "720 ATMs · 4 LOBs · OCC examination cycle",
      },
      {
        label: "Headcount",
        value: "~46k",
        detail: "~1,180 in compliance/BSA-AML alone (2.5%)",
      },
      {
        label: "IT operating budget",
        value: "$1.67B",
        detail: "9.2% of revenue · 34% compliance share (highest in peer)",
      },
    ],
    leadership: [
      {
        title: "CIO",
        name: "Patricia Huang",
        email: "cio@firstcapital.example.com",
        responsibility:
          "AI program portfolio sponsor; FedNow tech readiness; FIS Profile core banking modernization decision in flight.",
      },
      {
        title: "CRO",
        name: "James Park",
        email: "cro@firstcapital.example.com",
        responsibility:
          "Independent voice. Gating sponsor on every AI program (SR 11-7 / MRM via Adekoya-Park). OCC findings remediation owner.",
      },
      {
        title: "CFO",
        name: "Michael Torres",
        email: "cfo@firstcapital.example.com",
        responsibility:
          "Cost-discipline coalition. Three-signature joint approver on $5-25M IT capital with CIO + CRO. CCAR readiness.",
      },
    ],
    visionTitle: "What FS Demo needs the platform to do",
    visionLead:
      "Banks don't fail on AI strategy — they fail on AI governance. FS Demo needs a platform that respects SR 11-7 model risk attestation, fair-lending review, OCC examination posture, and the three-signature approval reality without reducing every conversation to compliance theater. Patricia Huang needs the platform to make her FedNow build defensible to James Park's risk org without 14 PowerPoints.",
    dataLoadedLead:
      "The FS Demo tenant is the most recently authored composite (full JSON authoring on 2026-05-10). When a CXO asks any sized/scoped/funded question, Ava reaches into these substrates first.",
    dataLoaded: [
      {
        kind: "Named persons",
        count: "92",
        example:
          "CEO Morrison + Operating Committee + 4 LOB CEOs (Osei/Walsh/Vasquez-Roth/Fontaine) + 22 IT leaders",
      },
      {
        kind: "Functions sized",
        count: "25",
        example:
          "Compliance/BSA-AML 1,180 FTE largest · App Services 820 FTE · Data & Analytics 245 FTE under MRM",
      },
      {
        kind: "Capital plan lines",
        count: "18",
        example:
          "FedNow $32.5M, core banking discovery $12M, cyber $38.5M, AI under MRM $8.5M, CRA $145M",
      },
      {
        kind: "Funding authority bands",
        count: "11",
        example:
          "Director $100K → VP $500K → SVP $2M → CIO $5M → CFO+CIO+CRO three-sig $25M → Board",
      },
      {
        kind: "Systems inventory",
        count: "84",
        example:
          "FIS Profile core, Volante FedNow, FIS Charlotte wealth, BNY Pershing, Murex MX.3, AxiomSL",
      },
      {
        kind: "Vendor scorecards",
        count: "51",
        example:
          "FIS Tier 1 ($100M+), Microsoft Tier 1, Adenza renegotiation flag, NICE Actimize expansion",
      },
    ],
    whatsAtStakeTitle: "What's at stake on the FS Demo narrative",
    whatsAtStakeBullets: [
      "SR 11-7 model risk gates every AI/ML model regardless of dollar. The agent should treat MRM (VP Ferris Adekoya-Park reporting to CRO) as a parallel-gate authority equal to the dollar threshold.",
      "Three-signature joint approval (CFO + CIO + CRO) on $5-25M IT capital is bank-only. Retail and healthcare don't require this — the agent should not bleed advice across industries.",
      "Compliance is 34% of IT budget — highest in peer group. Any AI Move that reduces compliance cost has the strongest ROI defense and the strongest political resistance.",
      "FedNow build is in flight, cutover 2026. Core banking modernization (FIS Profile replace vs. modernize) is the largest single transformation decision pending; CFO Torres + CIO Huang + CRO Park are the joint gate.",
    ],
    agentSamples: [
      {
        agent: "Ava",
        expertise: "AI strategy",
        question:
          "Walk me through the parallel gates for any new ML model — MRM, fair lending, board risk.",
        groundedAnswer:
          "Three parallel gates that fire regardless of dollar threshold. (1) Model Risk Management (SR 11-7): VP Ferris Adekoya-Park reporting to CRO James Park. Any ML model deployment requires model documentation, validation, monitoring, lineage, and bias assessment. Bi-weekly attestation cycle during active program windows. (2) Fair Lending compliance review: VP Brendan Castellanos-Liu reporting to CCO Westbrook. Required for any consumer-facing AI/ML touching credit decisions — disparate impact testing, variable selection review. (3) Board Risk Committee oversight: any spend creating new risk concentration. CRO Park is independent voice; reports dotted-line to Board Risk. These are concurrent with — not subordinate to — your CIO/CFO dollar approvals.",
        citesFrom:
          "funding_authority_matrix.csv (3 parallel gates) + risk function org",
      },
      {
        agent: "Ava",
        expertise: "investment shaping",
        question:
          "I want to ship an AI-assisted regulatory reporting Move. Where does it land politically?",
        groundedAnswer:
          "You're sitting at the highest-leverage AI Move in the bank — compliance is 34% of IT budget, highest in peer. Sponsor structure that actually works: VP Eleanora Ouellette-Park (Reg Reporting Tech) as program lead, CRO James Park as accountable sponsor (his org owns the outcome), CIO Patricia Huang as funding sponsor. CFO Torres will care about cost-to-income, not the technology — frame the value lever as compliance FTE reduction (1,180 today) and OCC examination cycle compression. The AxiomSL renegotiation flag (Adenza price increase post-Nasdaq) is your best leverage on the platform side. This is a P0 originate-able now if Park's MRM intake clears the architecture review.",
        citesFrom:
          "function_capacity.csv (Compliance + Reg Reporting) + vendor_scorecards.csv (Adenza)",
      },
      {
        agent: "Ava",
        expertise: "vendor & sourcing",
        question: "Which vendors are on renegotiation flags right now?",
        groundedAnswer:
          "Three vendor scorecards in renegotiation status. (1) Adenza (Nasdaq) — AxiomSL ControllerView + Calypso treasury at $9.2M annual; renewal Jun 30, 2027; price increase post-Nasdaq acquisition is the flag. (2) NICE Actimize — Fraud + AML platform at $10M annual; renewal Apr 30, 2027; expanding under OCC findings, but VP Quintero is sitting on a Verafin pilot that could shift the leverage. (3) Black Knight (ICE Mortgage) — Mortgage Origination + Default at $9.2M annual; renewal Sep 30, 2026; volume in current rate environment makes this a price re-cut conversation. CPO Nadia Rahman owns the bundling logic; Brooks (Director, IT Sourcing) runs the platform-tier negotiations.",
        citesFrom:
          "renewal_calendar.csv + vendor_scorecards.csv (3 renegotiation flags)",
      },
    ],
    walkStart: {
      // D-014 fix (2026-05-13): the prior href surfaced the legacy
      // codename `arcturus` in the URL. The internal ClientKey is still
      // `arcturus` (per active-client.ts), but it should never appear
      // in user-visible URLs. The proxy resolves the active client from
      // the session, so `?client=...` is unnecessary here.
      href: "/source",
      label: "Ava · FS Demo Vendor Operations",
      reason:
        "Pose the renegotiation question above; Ava should ground in the renewal calendar with named owners.",
    },
  },
};

// ───────────────────────────────────────────────────────────────────────────
// Vision content — the AbarVa "what + why" for the first 5 minutes.
// One assistant, Ava, presented through the specialist expertise she draws on
// as you move across surfaces.
// ───────────────────────────────────────────────────────────────────────────

const AGENT_TRIO = [
  {
    name: "Ava on Intelligence",
    archetype: "Drawing on senior AI-strategy expertise",
    job: "Forms views. Pressure-tests bets. Surfaces failure modes. Decides what is worth a Move and what is theatre.",
    color: T.purple,
    colorSoft: T.purpleSoft,
    surface: "Intelligence",
  },
  {
    name: "Ava on Strategic Moves",
    archetype: "Drawing on senior investment-shaping expertise",
    job: "Turns a candidate bet into a governed Move. Names sponsor, decision rights, gates, business case, and evidence.",
    color: T.teal,
    colorSoft: T.tealSoft,
    surface: "Strategic Moves",
  },
  {
    name: "Ava on Source",
    archetype: "Drawing on senior vendor-selection expertise",
    job: "Vets vendors. Checks financial health. Constructs RFI/RFP. Names which logos to drop. Defends the contract.",
    color: T.navy,
    colorSoft: T.navySoft,
    surface: "Source",
  },
];

const TENANT_KEYS: TenantKey[] = ["apex", "meridian", "firstcapital"];

// ───────────────────────────────────────────────────────────────────────────
// Component
// ───────────────────────────────────────────────────────────────────────────

export function WelcomeSection() {
  const [activeKey, setActiveKey] = useState<TenantKey>("meridian");
  const active = TENANTS[activeKey];

  return (
    <>
      {/* HERO — vision + 3-tab tenant selector */}
      <HeroBand color="navy">
        <Eyebrow light>
          <InlineAbarvaLogo light heightEm={1.35} /> · Five-minute orientation
        </Eyebrow>
        <SectionTitle light size="xl">
          The AI strategy operating system for{" "}
          <span style={{ fontStyle: "italic" }}>your</span> enterprise.
        </SectionTitle>
        <Lead light>
          AbarVa is one platform with one assistant — Ava — who grounds every
          recommendation in your enterprise truth — your org, your systems, your
          funding authority — not generic AI patterns. She is present on every
          surface and draws on a faculty of specialist expertise as the work
          demands. Pick a composite tenant below and pressure-test what Ava
          actually knows.
        </Lead>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginTop: 4,
            marginBottom: 18,
          }}
        >
          {["Ava · Intelligence", "Ava · Moves", "Ava · Vendor selection"].map(
            (tag) => (
              <span
                key={tag}
                style={{
                  fontFamily: T.fMono,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  padding: "5px 12px",
                  borderRadius: 4,
                  background: "rgba(255,255,255,0.14)",
                  color: "rgba(255,255,255,0.92)",
                  border: "1px solid rgba(255,255,255,0.18)",
                }}
              >
                {tag}
              </span>
            ),
          )}
        </div>
        <div
          role="tablist"
          aria-label="Choose composite tenant"
          style={{
            display: "inline-flex",
            flexWrap: "wrap",
            gap: 4,
            marginTop: 6,
            padding: 4,
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.22)",
            background: "rgba(255,255,255,0.10)",
          }}
        >
          {TENANT_KEYS.map((key) => {
            const t = TENANTS[key];
            const selected = key === activeKey;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveKey(key)}
                style={{
                  minWidth: 200,
                  border: 0,
                  borderRadius: 6,
                  cursor: "pointer",
                  padding: "11px 14px",
                  textAlign: "left",
                  background: selected ? "#fff" : "transparent",
                  color: selected ? T.navy : "rgba(255,255,255,0.82)",
                  boxShadow: selected ? "0 8px 20px rgba(0,0,0,0.18)" : "none",
                }}
              >
                <span
                  style={{
                    display: "block",
                    fontFamily: T.fBody,
                    fontSize: 14,
                    fontWeight: 800,
                  }}
                >
                  {t.shortLabel}
                </span>
                <span
                  style={{
                    display: "block",
                    fontFamily: T.fMono,
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    marginTop: 4,
                    opacity: 0.9,
                  }}
                >
                  {t.tabDetail}
                </span>
              </button>
            );
          })}
        </div>
      </HeroBand>

      {/* WHO WE ARE + AGENT TRIO — the why-use-us framing */}
      <Section>
        <Eyebrow>Who we are · Why this matters</Eyebrow>
        <SectionTitle>
          One assistant. One enterprise truth. Zero generic AI advice.
        </SectionTitle>
        <Lead>
          Every other AI tool starts with the model. AbarVa starts with your
          enterprise — your org chart, your IT financials, your funding
          authority matrix, your vendor scorecards, your in-flight programs. You
          always talk to Ava; she adapts to what you are doing and reaches into
          that substrate every time she answers. Her views are opinions,
          calibrated, and grounded in your real numbers. Behind her sits a
          faculty of specialist expertise — strategy, investment shaping,
          sourcing — but you never switch agents or get handed off.
        </Lead>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 20,
            margin: "24px 0 8px",
          }}
        >
          {AGENT_TRIO.map((a) => (
            <div
              key={a.name}
              style={{
                border: `1px solid ${T.border}`,
                borderRadius: 10,
                padding: 22,
                background: T.surface,
                borderLeft: `4px solid ${a.color}`,
              }}
            >
              <div
                style={{
                  fontFamily: T.fMono,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: a.color,
                  marginBottom: 8,
                }}
              >
                {a.surface}
              </div>
              <div
                style={{
                  fontFamily: T.fDisp,
                  fontSize: 24,
                  color: T.ink,
                  fontWeight: 500,
                  letterSpacing: "-0.01em",
                  marginBottom: 4,
                }}
              >
                {a.name}
              </div>
              <div
                style={{
                  fontFamily: T.fBody,
                  fontSize: 12,
                  color: T.faint,
                  fontStyle: "italic",
                  marginBottom: 12,
                }}
              >
                {a.archetype}
              </div>
              <div
                style={{
                  fontFamily: T.fBody,
                  fontSize: 13,
                  color: T.body,
                  lineHeight: 1.65,
                }}
              >
                {a.job}
              </div>
            </div>
          ))}
        </div>
        <Callout kind="info" icon="◆" label="The corpus thesis">
          Tenant truth + curated industry corpus + senior-advisor expertise —
          three sources, every response. The corpus is one input, not a refusal
          trigger. When your tenant data answers a sized/scoped/funded question
          directly, Ava reaches for it first; when the question is judgment, she
          forms a view and calls out her confidence.
        </Callout>
      </Section>

      {/* CASE STUDY — active tenant: who they are + leadership + data loaded + vision */}
      <Section>
        <Eyebrow>{active.industryEyebrow}</Eyebrow>
        <SectionTitle>{active.whoTitle}</SectionTitle>
        <Lead>{active.whoLead}</Lead>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 16,
            margin: "20px 0 28px",
          }}
        >
          {active.scaleStats.map((s) => (
            <div
              key={s.label}
              style={{
                borderTop: `3px solid ${active.accent}`,
                paddingTop: 12,
              }}
            >
              <div
                style={{
                  fontFamily: T.fMono,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: T.faint,
                }}
              >
                {s.label}
              </div>
              <div
                style={{
                  fontFamily: T.fDisp,
                  fontSize: 28,
                  color: T.ink,
                  letterSpacing: "-0.01em",
                  marginTop: 6,
                  fontWeight: 500,
                }}
              >
                {s.value}
              </div>
              <div
                style={{
                  fontFamily: T.fBody,
                  fontSize: 12,
                  color: T.muted,
                  lineHeight: 1.5,
                  marginTop: 4,
                }}
              >
                {s.detail}
              </div>
            </div>
          ))}
        </div>

        <SubHead>Leadership · The 3 CXO test logins for this tenant</SubHead>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 14,
            margin: "14px 0 8px",
          }}
        >
          {active.leadership.map((cx) => (
            <div
              key={cx.email}
              style={{
                border: `1px solid ${T.borderLt}`,
                background: active.accentSoft,
                borderRadius: 8,
                padding: 18,
              }}
            >
              <div
                style={{
                  fontFamily: T.fMono,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: active.accent,
                  marginBottom: 6,
                }}
              >
                {cx.title}
              </div>
              <div
                style={{
                  fontFamily: T.fBody,
                  fontSize: 16,
                  fontWeight: 700,
                  color: T.ink,
                  marginBottom: 4,
                }}
              >
                {cx.name}
              </div>
              <div
                style={{
                  fontFamily: T.fMono,
                  fontSize: 11,
                  color: T.muted,
                  marginBottom: 8,
                }}
              >
                {cx.email}
              </div>
              <div
                style={{
                  fontFamily: T.fBody,
                  fontSize: 12,
                  color: T.body,
                  lineHeight: 1.55,
                }}
              >
                {cx.responsibility}
              </div>
            </div>
          ))}
        </div>
        <div
          style={{
            fontFamily: T.fBody,
            fontSize: 12,
            color: T.muted,
            marginTop: 14,
          }}
        >
          Shared password{" "}
          <code
            style={{
              fontFamily: T.fMono,
              padding: "2px 6px",
              background: T.surface3,
              borderRadius: 3,
            }}
          >
            Demo2026!
          </code>{" "}
          · OTP code{" "}
          <code
            style={{
              fontFamily: T.fMono,
              padding: "2px 6px",
              background: T.surface3,
              borderRadius: 3,
            }}
          >
            424242
          </code>{" "}
          · provisioned via{" "}
          <code
            style={{
              fontFamily: T.fMono,
              padding: "2px 6px",
              background: T.surface3,
              borderRadius: 3,
            }}
          >
            npx tsx scripts/provision-cxo-personas.ts --apply
          </code>
        </div>
      </Section>

      {/* VISION — what this tenant needs the platform to do */}
      <Section>
        <Eyebrow>{active.shortLabel} · Vision</Eyebrow>
        <SectionTitle>{active.visionTitle}</SectionTitle>
        <Lead>{active.visionLead}</Lead>
        <SubHead>{"What's at stake on this narrative"}</SubHead>
        <ul
          style={{
            margin: "12px 0 0",
            paddingLeft: 20,
            fontFamily: T.fBody,
            fontSize: 14,
            lineHeight: 1.75,
            color: T.body,
          }}
        >
          {active.whatsAtStakeBullets.map((b) => (
            <li key={b} style={{ marginBottom: 6 }}>
              {b}
            </li>
          ))}
        </ul>
      </Section>

      {/* DATA LOADED — concrete substrate the agent retrieves from */}
      <Section>
        <Eyebrow>{active.shortLabel} · Substrate</Eyebrow>
        <SectionTitle>
          {"What's loaded into the database for this tenant"}
        </SectionTitle>
        <Lead>{active.dataLoadedLead}</Lead>
        <div style={{ overflowX: "auto", margin: "20px 0 8px" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontFamily: T.fBody,
              fontSize: 13,
            }}
          >
            <thead>
              <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                {["Record kind", "Count", "What's in it (examples)"].map(
                  (h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "10px 12px",
                        fontFamily: T.fMono,
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: T.muted,
                      }}
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {active.dataLoaded.map((d) => (
                <tr
                  key={d.kind}
                  style={{ borderBottom: `1px solid ${T.borderLt}` }}
                >
                  <td
                    style={{
                      padding: "12px",
                      fontFamily: T.fBody,
                      fontWeight: 700,
                      color: T.ink,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {d.kind}
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      fontFamily: T.fDisp,
                      fontSize: 22,
                      color: active.accent,
                      fontWeight: 500,
                    }}
                  >
                    {d.count}
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      color: T.muted,
                      lineHeight: 1.55,
                    }}
                  >
                    {d.example}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Callout kind="info" icon="✓" label="No dummy wiring">
          {`Every record above flows through the production setup pipeline (load-${activeKey === "meridian" ? "meridian" : activeKey === "apex" ? "apex" : "firstcapital"}-setup-data.ts → Supabase data_inventory_records → enterprise_context_chunks → agent retrieval). Ava's tenant_grounded retrieval whitelist explicitly includes org_structure, it_landscape, and it_financials so these rows surface at every relevant question.`}
        </Callout>
      </Section>

      {/* AGENT INTELLIGENCE — concrete Q&A pairs */}
      <Section>
        <Eyebrow>{active.shortLabel} · Agent intelligence</Eyebrow>
        <SectionTitle>Three questions, three grounded answers</SectionTitle>
        <Lead>
          These are not scripts. They are the kind of answer Ava produces when
          the underlying tenant data has been loaded properly — same assistant
          each time, drawing on the expertise the question demands. Ask any one
          of them once you sign in as a CXO and watch Ava reach for the
          canonical row.
        </Lead>
        <div style={{ display: "grid", gap: 18, margin: "20px 0" }}>
          {active.agentSamples.map((qa, idx) => (
            <div
              key={idx}
              style={{
                border: `1px solid ${T.border}`,
                borderRadius: 10,
                overflow: "hidden",
                background: T.surface,
              }}
            >
              <div
                style={{
                  padding: "14px 20px",
                  borderBottom: `1px solid ${T.borderLt}`,
                  background: active.accentSoft,
                  display: "flex",
                  alignItems: "baseline",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    fontFamily: T.fMono,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: active.accent,
                  }}
                >{`${qa.agent} · ${qa.expertise}`}</span>
                <span
                  style={{
                    fontFamily: T.fBody,
                    fontSize: 14,
                    fontWeight: 700,
                    color: T.ink,
                  }}
                >{`"${qa.question}"`}</span>
              </div>
              <div style={{ padding: "18px 20px" }}>
                <div
                  style={{
                    fontFamily: T.fBody,
                    fontSize: 13,
                    color: T.body,
                    lineHeight: 1.7,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {qa.groundedAnswer}
                </div>
                <div
                  style={{
                    marginTop: 12,
                    paddingTop: 12,
                    borderTop: `1px dashed ${T.borderLt}`,
                    fontFamily: T.fMono,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: T.faint,
                  }}
                >
                  Cites from · {qa.citesFrom}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* WALKTHROUGH — the 5-minute path */}
      <Section>
        <Eyebrow>Walkthrough · {active.shortLabel}</Eyebrow>
        <SectionTitle>The 5-minute first session</SectionTitle>
        <Lead>
          {
            "Sign in as one of the three CXOs above. Open the surface below. Ask the question shown. Watch Ava reach into this tenant's substrate to ground the answer in named owners, real budgets, and the right approval path."
          }
        </Lead>
        <Callout kind="success" icon="→" label="Best first click">
          <Link
            href={active.walkStart.href}
            style={{
              color: active.accent,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            {active.walkStart.label}
          </Link>{" "}
          — {active.walkStart.reason}
        </Callout>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 0,
            border: `1px solid ${T.border}`,
            borderRadius: 8,
            overflow: "hidden",
            margin: "24px 0 8px",
          }}
        >
          {[
            {
              step: "Sign in",
              body: `Use any of the 3 CXOs above. Each lands you in the right workspace pinned to ${active.shortLabel}.`,
            },
            {
              step: "Ask Ava on Intelligence",
              body: "Pose any of the agent-intelligence questions. Ava grounds her answer in the org/IT-financials substrate.",
            },
            {
              step: "Shape a Move with Ava",
              body: "Take a finding from Intelligence and originate a Move. Ava draws on her investment-shaping expertise; the funding authority matrix surfaces named approvers + parallel gates.",
            },
            {
              step: "Run Source with Ava",
              body: "When the Move depends on a vendor, Ava pulls the scorecard + renewal calendar with renegotiation flags — same assistant, sourcing expertise.",
            },
          ].map((s, i) => (
            <div
              key={s.step}
              style={{
                padding: 22,
                borderRight: `1px solid ${T.borderLt}`,
                background: i === 0 ? active.accentSoft : T.surface,
              }}
            >
              <div
                style={{
                  fontFamily: T.fMono,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: active.accent,
                  marginBottom: 10,
                }}
              >
                Step {i + 1}
              </div>
              <div
                style={{
                  fontFamily: T.fBody,
                  fontSize: 15,
                  fontWeight: 700,
                  color: T.ink,
                  marginBottom: 8,
                }}
              >
                {s.step}
              </div>
              <div
                style={{
                  fontFamily: T.fBody,
                  fontSize: 13,
                  color: T.muted,
                  lineHeight: 1.6,
                }}
              >
                {s.body}
              </div>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}

// Single source of truth for the canonical CXO demo personas.
//
// Consumed by:
//   - components/auth/DemoCodeSignIn.tsx (sign-in identity cards)
//   - app/invite/[slug]/page.tsx (hosted invite landing page)
//   - scripts/generate-invite-html.ts (static HTML invites for email)
//   - scripts/provision-cxo-personas.ts (Clerk user provisioning)
//
// If a persona changes, edit it here once. The Clerk publicMetadata
// for each user mirrors the same shape (personaName, personaTitle,
// tenantKey, etc.) — see provision-cxo-personas.ts.

export interface CxoPersona {
  /** URL slug used at /invite/<slug> and as a stable filename. */
  slug: string;
  /** Full email address stored in Clerk. */
  email: string;
  /** Short public label shown on the sign-in card (e.g., "cio@apex"). */
  shortLabel: string;
  /** Persona's first name (also used as Clerk firstName). */
  firstName: string;
  /** Persona's last name (also used as Clerk lastName). Includes title prefix if any (e.g., "Krishnamurthy"). */
  lastName: string;
  /** Display name as it should appear in chrome (e.g., "Dr. Anita Krishnamurthy"). */
  personaName: string;
  /** Two-letter monogram (persona initials, ignoring honorifics). */
  monogram: string;
  /** Short title abbreviation: CIO · CDO · CDIO · CDAO. */
  titleShort: string;
  /** Full title: "Chief Information Officer" etc. */
  titleFull: string;
  /** Tenant display name. */
  tenant: string;
  /**
   * Canonical app ClientKey — matches src/lib/client-config.ts.
   * Used for active-client resolution and Supabase clients-table
   * lookup (clients.name LIKE: Apex Retail / Meridian / Arcturus or
   * First Capital). MUST be one of: apexretail · meridian · arcturus · northstar · skyharbor · lakeshore.
   */
  clientKey: 'apexretail' | 'meridian' | 'arcturus' | 'northstar' | 'skyharbor' | 'lakeshore';
  /**
   * Tenant key used by the data-room / broker layer — a parallel
   * namespace per project memory ("App ClientKey is `apexretail`;
   * broker is `apex-retail`"). Kept for chrome rendering.
   */
  tenantKey:
    | 'apex-retail'
    | 'meridian-health'
    | 'firstcapital'
    | 'northstar-clinical'
    | 'skyharbor-air'
    | 'lakeshore-holdings';
  /** Clerk publicMetadata.role override for demo operations accounts. */
  authRole?: 'maestro' | 'admin';
  /** Graph node id used by persons.graph_node_id (Supabase). */
  graphNodeId: string;
  /** Monogram background — tenant theme color (NOT brand chrome). */
  monogramBg: string;
  /** One-line bio for tooltip / sign-in card hover. */
  bioShort: string;
  /** Multi-sentence bio for the invite page. */
  bioLong: string;
  /** What the user will find inside their workspace, demo-flavored. */
  workspaceTeaser: string;
}

export const CXO_PERSONAS: ReadonlyArray<CxoPersona> = [
  {
    slug: 'cio-apex',
    email: 'cio@apex-retail.example.com',
    shortLabel: 'cio@apex',
    firstName: 'Carlos',
    lastName: 'Rivera',
    personaName: 'Carlos Rivera',
    monogram: 'CR',
    titleShort: 'CIO',
    titleFull: 'Chief Information Officer',
    tenant: 'Apex Retail Group',
    clientKey: 'apexretail',
    tenantKey: 'apex-retail',
    graphNodeId: 'person:apex:carlos-rivera',
    monogramBg: '#C2410C',
    bioShort: '6 yrs CIO. Pragmatic, vendor-skeptical post-2023 AMS rebuild.',
    bioLong:
      'Carlos was promoted to CIO in 2020 after running Apex infrastructure since 2017. He absorbed the blame for the 2023 AMS consolidation pause and rebuilt CIO credibility through 2024-25. He is a pragmatic, vendor-skeptical operator who reports to COO David Okonjo. His 2026 priorities: IT cost stabilization, AMS consolidation completion, cloud migration phase 2, and AI platform readiness.',
    workspaceTeaser:
      'Your workspace shows the live IT modernization portfolio, the 2023 AMS rebuild signals, and the open AI Governance Council debate with CDO Lynne Stratham about platform investment.',
  },
  {
    slug: 'cfo-apex',
    email: 'cfo@apex-retail.example.com',
    shortLabel: 'cfo@apex',
    firstName: 'Margaret',
    lastName: 'Chen',
    personaName: 'Margaret Chen',
    monogram: 'MC',
    titleShort: 'CFO',
    titleFull: 'Chief Financial Officer',
    tenant: 'Apex Retail Group',
    clientKey: 'apexretail',
    tenantKey: 'apex-retail',
    graphNodeId: 'person:apex:margaret-chen',
    monogramBg: '#C2410C',
    bioShort: 'CFO. Capital discipline + activist-investor narrative + AI investment ROI scrutiny.',
    bioLong:
      "Margaret runs Finance, Treasury, FP&A, Internal Audit, Investor Relations, and Procurement at $108B Apex Retail. She is the gating signature on every transformation business case above $5M and the joint approver with CIO Carlos Rivera on every IT capital line over $25M. Her FY2026 priorities: store-fleet capital allocation, activist-investor narrative on the AI program portfolio, and category P&L analytics. She is hard on store-labor productivity and skeptical of AI investments without a 24-month payback profile.",
    workspaceTeaser:
      'Your workspace shows the FY2026 capital plan with funding sources by line, the funding authority matrix with your single-decision authority up to $25M, and the ROI tracking on AI program lines under MRM-equivalent governance.',
  },
  {
    slug: 'cdo-apex',
    email: 'cdo@apex-retail.example.com',
    shortLabel: 'cdo@apex',
    firstName: 'Lynne',
    lastName: 'Stratham',
    personaName: 'Lynne Stratham',
    monogram: 'LS',
    titleShort: 'CDO',
    titleFull: 'Chief Data Officer',
    tenant: 'Apex Retail Group',
    clientKey: 'apexretail',
    tenantKey: 'apex-retail',
    graphNodeId: 'person:apex:lynne-stratham',
    monogramBg: '#C2410C',
    bioShort: '0.5 yrs. Joined from Albertsons. Owns the live CDP Activation 2026 program.',
    bioLong:
      'Lynne joined Apex in October 2025 as Chief Data Officer, succeeding Marcus Holloway. She came from Albertsons (VP Data) and earlier Walmart data engineering. The CDP Activation 2026 program — currently running through vendor BAFO — is partly her credibility test. Successful execution strengthens her hand for FY2027 platform investment requests. She co-sponsors the program with CMO Jennifer Park.',
    workspaceTeaser:
      'Your workspace shows the CDP Activation 2026 charter you signed, the open vendor evaluation, the customer-experience coalition you anchor, and the unresolved AI platform debate with CIO Carlos Rivera.',
  },
  {
    slug: 'cdio-meridian-health',
    email: 'cdio@meridian-health.example.com',
    shortLabel: 'cdio@meridian-health',
    firstName: 'Anita',
    lastName: 'Krishnamurthy',
    personaName: 'Dr. Anita Krishnamurthy',
    monogram: 'AK',
    titleShort: 'CDIO',
    titleFull: 'Chief Digital + Information Officer',
    tenant: 'Meridian Health System',
    clientKey: 'meridian',
    tenantKey: 'meridian-health',
    graphNodeId: 'person:meridian:anita-krishnamurthy',
    monogramBg: '#0E8A65',
    bioShort: '0.5 yrs. New combined CDIO role. Owns digital strategy, info, AI governance.',
    bioLong:
      'Dr. Krishnamurthy was appointed Chief Digital and Information Officer six months ago, when Meridian collapsed its previously-separate CIO and Chief Digital roles into one position reporting directly to CEO Dr. Elaine Morales. Her remit covers Epic platform strategy, plan-provider digital integration, and the AI governance framework. She inherited a vacant VP Application Services role and is building credibility across an unusually wide portfolio.',
    workspaceTeaser:
      'Your workspace shows the integrated provider-and-plan digital portfolio, the open VP Apps vacancy creating ownership ambiguity, and the AI governance framework still being shaped.',
  },
  {
    slug: 'cfo-meridian-health',
    email: 'cfo@meridian-health.example.com',
    shortLabel: 'cfo@meridian-health',
    firstName: 'David',
    lastName: 'Park',
    personaName: 'David Park',
    monogram: 'DP',
    titleShort: 'CFO',
    titleFull: 'Chief Financial Officer',
    tenant: 'Meridian Health System',
    clientKey: 'meridian',
    tenantKey: 'meridian-health',
    graphNodeId: 'person:meridian:david-park',
    monogramBg: '#0E8A65',
    bioShort: 'CFO. Margin recovery, $1.1B capital plan steward, RCM modernization sponsor partner.',
    bioLong:
      "David runs Finance, Treasury, FP&A, Internal Audit, Tax, Capital Planning, and Procurement at $16.8B Meridian Health. He co-sponsors RCM Modernization with Patricia Okafor (the active strategic move post-DENIALS-2024) and is the joint signature with CDIO Anita Krishnamurthy on every IT capital line above $10M. His FY2026 priorities: margin recovery to 6.0% from 4.2%, capital allocation discipline (Hawaii integration deferred to FY2027), rating-agency relations, and AI investment ROI defense to the Audit Committee.",
    workspaceTeaser:
      'Your workspace shows the FY2026 $1.1B capital plan with the Hawaii deferral, the operating budget split provider-vs-plan, the funding authority matrix with your joint authority up to $25M, and the AI Governance Council attestations from Wexler.',
  },
  {
    slug: 'coo-meridian-health',
    email: 'coo@meridian-health.example.com',
    shortLabel: 'coo@meridian-health',
    firstName: 'Sarah',
    lastName: "O'Brien",
    personaName: "Sarah O'Brien",
    monogram: 'SO',
    titleShort: 'COO',
    titleFull: 'Chief Operating Officer',
    tenant: 'Meridian Health System',
    clientKey: 'meridian',
    tenantKey: 'meridian-health',
    graphNodeId: 'person:meridian:sarah-obrien',
    monogramBg: '#0E8A65',
    bioShort: 'COO. 30 hospitals + ambulatory + nursing ops. Owns hospital throughput + workforce.',
    bioLong:
      "Sarah runs hospital operations across California and Hawaii (30 hospitals, 280 clinics, ~50,000 clinical staff) and partners with Dr. Marcus Reid (CPE) on the medical group. Her organization carries the bulk of Meridian's operating cost — clinical labor, allied health, surgical services, ED, ambulatory, nursing operations under CNO Robert Chen. FY2026 priorities: nursing turnover from 22% to 14%, traveler-ratio reduction, ED throughput from 4.2hr to 2hr, OR utilization from 68% to 78%. She is partnered closely with David Park on the labor-cost-of-care narrative and with Anita Krishnamurthy on ambient documentation and clinical AI rollout.",
    workspaceTeaser:
      'Your workspace shows the hospital ops dashboard, nursing operations under Goldman-Ekam, the ED/Surgical/Ambulatory function capacity, and the clinical AI use cases under AI Governance Council review (chaired by CMIO Wexler).',
  },
  {
    slug: 'cdao-meridian-health',
    email: 'cdao@meridian-health.example.com',
    shortLabel: 'cdao@meridian-health',
    firstName: 'Kiran',
    lastName: 'Rao',
    personaName: 'Kiran Rao',
    monogram: 'KR',
    titleShort: 'CDAO',
    titleFull: 'Chief Data and Analytics Officer',
    tenant: 'Meridian Health System',
    clientKey: 'meridian',
    tenantKey: 'meridian-health',
    graphNodeId: 'person:meridian:kiran-rao',
    monogramBg: '#0E8A65',
    bioShort: 'CDAO. Owns enterprise analytics, data governance, and AI-ready data products.',
    bioLong:
      'Kiran is Meridian Health System\'s Chief Data and Analytics Officer. The role owns enterprise analytics, data governance, clinical and plan analytics standards, Snowflake/Epic Cogito/dbt operating maturity, and the data-product foundation behind population health, HCC, ambient documentation, and research AI. Kiran sits at the intersection of Anita Krishnamurthy\'s cloud-AI agenda, Population Health economics, and the research group\'s Palantir / private-GPU estate.',
    workspaceTeaser:
      'Your workspace shows Meridian\'s analytics foundation, Snowflake / Epic Cogito / dbt posture, Palantir and research-private-cloud context, HCC / RAF leakage signals, and the data-readiness questions behind Population Health AI and ambient documentation scale-up.',
  },
  {
    slug: 'cio-firstcapital',
    email: 'cio@firstcapital.example.com',
    shortLabel: 'cio@firstcapital',
    firstName: 'Patricia',
    lastName: 'Huang',
    personaName: 'Patricia Huang',
    monogram: 'PH',
    titleShort: 'CIO',
    titleFull: 'Chief Information Officer',
    tenant: 'First Capital',
    clientKey: 'arcturus',
    tenantKey: 'firstcapital',
    graphNodeId: 'person:firstcapital:patricia-huang',
    monogramBg: '#1E3A8A',
    bioShort: '2 yrs. Ex-Top-5-bank Digital Payments VP. "FedNow is a survival project."',
    bioLong:
      'Patricia joined First Capital in 2024 as CIO from a top-5 US bank where she ran VP Digital Payments. She was hired specifically to modernize payments and digital channels. She is data-driven and impatient by big-bank standards, frustrated by First Capital\'s consensus-building pace. Her core fight: a 22-year-old FIS HORIZON core that cannot support FedNow without middleware, while 68% of peers are already live and $340M in commercial deposits sit at attrition risk.',
    workspaceTeaser:
      'Your workspace shows the FedNow payment-rails program, the FIS HORIZON modernization debate with CFO Michael Torres, the SQL Server 2017 end-of-support remediation, and the digital adoption dashboard tracking against the 67% peer median.',
  },
  {
    slug: 'cro-firstcapital',
    email: 'cro@firstcapital.example.com',
    shortLabel: 'cro@firstcapital',
    firstName: 'James',
    lastName: 'Park',
    personaName: 'James Park',
    monogram: 'JP',
    titleShort: 'CRO',
    titleFull: 'Chief Risk Officer',
    tenant: 'First Capital',
    clientKey: 'arcturus',
    tenantKey: 'firstcapital',
    graphNodeId: 'person:firstcapital:james-park',
    monogramBg: '#1E3A8A',
    bioShort: 'CRO. Independent voice. Gating sponsor on every AI program (SR 11-7 / MRM).',
    bioLong:
      "James is the Chief Risk Officer at $18.2B regional super-bank First Capital, with a dual reporting line to CEO Morrison and to the Board Risk Committee. He owns enterprise risk framework, model risk management (SR 11-7) under VP Ferris Adekoya-Park, OCC findings remediation, credit/market/operational/liquidity risk verticals, and CISO Tobias Aboagye. He is the gating signature on every AI program initiation regardless of dollar size — the parallel-gate authority that sits beside CIO Patricia Huang's dollar-band approval. FY2026 priorities: post-OCC findings closure, AI Program model attestation cycle, FedNow payment risk concurrence, credit-cycle posture in current rate environment.",
    workspaceTeaser:
      "Your workspace shows the AI Program portfolio with each model's MRM attestation status, the OCC findings remediation register, the funding authority matrix with your parallel-gate authority on AI/ML regardless of dollar, and the cybersecurity posture under CISO Aboagye.",
  },
  {
    slug: 'cfo-firstcapital',
    email: 'cfo@firstcapital.example.com',
    shortLabel: 'cfo@firstcapital',
    firstName: 'Michael',
    lastName: 'Torres',
    personaName: 'Michael Torres',
    monogram: 'MT',
    titleShort: 'CFO',
    titleFull: 'Chief Financial Officer',
    tenant: 'First Capital',
    clientKey: 'arcturus',
    tenantKey: 'firstcapital',
    graphNodeId: 'person:firstcapital:michael-torres',
    monogramBg: '#1E3A8A',
    bioShort: 'CFO. Cost-discipline coalition. Three-signature joint approval on $5-25M IT capital.',
    bioLong:
      "Michael runs Finance, Treasury, FP&A (under SVP Jules Bernhardt as Treasurer), Investor Relations, Tax/Regulatory Reporting, and Procurement (under CPO Nadia Rahman) at First Capital. He is the gating CFO signature in the three-way CFO+CIO+CRO joint approval that gates every IT capital line between $5M and $25M — a tighter authority structure than retail or healthcare because of bank regulatory risk. FY2026 priorities: earnings stability, CCAR readiness, capital allocation discipline against a 9.2%-of-revenue IT spend (highest in peer group, 34% compliance share), and AI program ROI scrutiny.",
    workspaceTeaser:
      'Your workspace shows the FY2026 IT capital plan with three-signature decisions live, the CCAR submission cycle, the cost-to-income progression vs. peers, and the FY2026 vendor-renewal calendar with renegotiation flags on Adenza/AxiomSL and NICE Actimize.',
  },
  {
    slug: 'ceo-northstar',
    email: 'ceo@northstar-clinical.example.com',
    shortLabel: 'ceo@northstar',
    firstName: 'Maya',
    lastName: 'Rangan',
    personaName: 'Maya Rangan',
    monogram: 'MR',
    titleShort: 'CEO',
    titleFull: 'Chief Executive Officer',
    tenant: 'Northstar Clinical Technologies',
    clientKey: 'northstar',
    tenantKey: 'northstar-clinical',
    graphNodeId: 'person:northstar:maya-rangan',
    monogramBg: '#0F766E',
    bioShort: 'CEO. Leading a $22.6B post-carveout clinical technology company through margin expansion.',
    bioLong:
      'Maya Rangan leads Northstar Clinical Technologies through its post-carveout operating model, TSA exit, ERP simplification, and regulated AI product modernization agenda. Her board narrative centers on proving Northstar can run independently while protecting FDA, EU MDR, SOX, and HIPAA-adjacent evidence chains.',
    workspaceTeaser:
      'Your workspace shows the Northstar context layer, the board priority map, the $250M margin-expansion plan, and the decision threads connecting ERP, QMS, product portfolio, Source, and Tower value views.',
  },
  {
    slug: 'cfo-northstar',
    email: 'cfo@northstar-clinical.example.com',
    shortLabel: 'cfo@northstar',
    firstName: 'Daniel',
    lastName: 'Okafor',
    personaName: 'Daniel Okafor',
    monogram: 'DO',
    titleShort: 'CFO',
    titleFull: 'Chief Financial Officer',
    tenant: 'Northstar Clinical Technologies',
    clientKey: 'northstar',
    tenantKey: 'northstar-clinical',
    graphNodeId: 'person:northstar:daniel-okafor',
    monogramBg: '#0F766E',
    bioShort: 'CFO. Owns $250M margin expansion, TSA cost removal, and board-grade value proof.',
    bioLong:
      'Daniel Okafor runs finance, FP&A, treasury, investor relations, procurement, and SOX controls for Northstar. He is the sponsor who asks whether the new context layer can prove savings from ERP simplification, vendor renegotiation, product rationalization, and quality automation without confusing projected value with realized value.',
    workspaceTeaser:
      'Your workspace shows annual and quarterly reporting fixtures, segment P&L, vendor contracts, margin opportunities, approval queues, and evidence traces for CFO-signable value claims.',
  },
  {
    slug: 'cio-northstar',
    email: 'cio@northstar-clinical.example.com',
    shortLabel: 'cio@northstar',
    firstName: 'Priya',
    lastName: 'Mehta',
    personaName: 'Priya Mehta',
    monogram: 'PM',
    titleShort: 'CIO',
    titleFull: 'Chief Information Officer',
    tenant: 'Northstar Clinical Technologies',
    clientKey: 'northstar',
    tenantKey: 'northstar-clinical',
    graphNodeId: 'person:northstar:priya-mehta',
    monogramBg: '#0F766E',
    bioShort: 'CIO. Owns ERP/TSA sequencing, CMDB truth, integration topology, and AI-ready IT estate.',
    bioLong:
      'Priya Mehta owns the Northstar technology estate: SAP ECC, S/4 Wave 0, Oracle EBS, JD Edwards, Infor LN, Dynamics AX, AS/400, mainframe batch, plant edge, cloud, security, and data platforms. Her pilot lens is whether AbarVa can ingest messy enterprise uploads, route them to the right context dimensions, and make Sentinel stop guessing.',
    workspaceTeaser:
      'Your workspace shows the 240-application portfolio, 820 integration edges, ERP landscape, org/team topology, DORA telemetry, upload templates, rejected facts, and the agent-ready evidence map.',
  },
  {
    slug: 'cqo-northstar',
    email: 'cqo@northstar-clinical.example.com',
    shortLabel: 'cqo@northstar',
    firstName: 'Elena',
    lastName: 'Kovacs',
    personaName: 'Elena Kovacs',
    monogram: 'EK',
    titleShort: 'CQO',
    titleFull: 'Chief Quality Officer',
    tenant: 'Northstar Clinical Technologies',
    clientKey: 'northstar',
    tenantKey: 'northstar-clinical',
    graphNodeId: 'person:northstar:elena-kovacs',
    monogramBg: '#0F766E',
    bioShort: 'CQO. Protects QMS, CAPA, complaint, audit, and regulated-AI evidence chains.',
    bioLong:
      'Elena Kovacs owns Northstar quality systems, regulatory readiness, CAPA, complaint analytics, audit responses, and the evidence posture behind AI-enabled regulated workflows. Her pilot bar is whether every recommendation can name its QMS basis, owner, freshness, and confidence.',
    workspaceTeaser:
      'Your workspace shows QMS events, regulatory artifacts, AI tooling risk flags, model inventory context, evidence gaps, and upload/approval flows for quality-controlled facts.',
  },
  {
    slug: 'evp-his-northstar',
    email: 'evp-his@northstar-clinical.example.com',
    shortLabel: 'evp-his@northstar',
    firstName: 'Marcus',
    lastName: 'Lee',
    personaName: 'Marcus Lee',
    monogram: 'ML',
    titleShort: 'EVP HIS',
    titleFull: 'EVP Health Information Systems',
    tenant: 'Northstar Clinical Technologies',
    clientKey: 'northstar',
    tenantKey: 'northstar-clinical',
    graphNodeId: 'person:northstar:marcus-lee',
    monogramBg: '#0F766E',
    bioShort: 'EVP HIS. Owns clinical coding/CDI software modernization and regulated AI product economics.',
    bioLong:
      'Marcus Lee runs the Health Information Systems business, including clinical coding, CDI, audit, analytics, and customer-facing software modernization. He is the executive who tests whether AbarVa can connect product strategy, engineering execution, QMS constraints, Source events, and board-grade value artifacts.',
    workspaceTeaser:
      'Your workspace shows the clinical coding AI modernization move, HIS product families, QMS dependencies, Source vendor choices, and Tower value views for product-software outcomes.',
  },
  {
    slug: 'cto-skyharbor',
    email: 'cto@skyharbor-air.example.com',
    shortLabel: 'cto@skyharbor',
    firstName: 'Victor',
    lastName: 'Hale',
    personaName: 'Victor Hale',
    monogram: 'VH',
    titleShort: 'CTO',
    titleFull: 'Chief Technology Officer',
    tenant: 'Airline Demo',
    clientKey: 'skyharbor',
    tenantKey: 'skyharbor-air',
    graphNodeId: 'person:skyharbor:victor-hale',
    monogramBg: '#075985',
    bioShort: 'CTO. Five-year IBM Z to AWS modernization sponsor; defending progress while accelerating the next wave.',
    bioLong:
      'Victor Hale sponsored Airline Demo\'s five-year IBM mainframe to AWS modernization program. He owns the defensible progress narrative, the IBM relationship, the modernization factory, and the board-facing roadmap for what to peel next from Z without disrupting airline operations.',
    workspaceTeaser:
      'Your workspace shows the five-year modernization ledger, remaining IBM Z workloads, AWS-native extracts, IBM engagement profile, AI-powered SDLC opportunities, GCC ramp constraints, and the next-wave modernization move candidates.',
  },
  {
    slug: 'cio-skyharbor',
    email: 'cio@skyharbor-air.example.com',
    shortLabel: 'cio@skyharbor',
    firstName: 'Amala',
    lastName: 'Rao',
    personaName: 'Amala Rao',
    monogram: 'AR',
    titleShort: 'CIO',
    titleFull: 'Chief Information Officer',
    tenant: 'Airline Demo',
    clientKey: 'skyharbor',
    tenantKey: 'skyharbor-air',
    graphNodeId: 'person:skyharbor:amala-rao',
    monogramBg: '#075985',
    bioShort: 'CIO. New challenge voice asking where modernization must speed up, stop, or change governance.',
    bioLong:
      'Amala Rao is the new CIO challenging the pace and shape of SkyHarbor\'s mature modernization program. Her lens is evidence-led acceleration: what has really worked, where duplicate complexity is accumulating, and how to rebalance IBM, AWS, internal engineering, and GCC capacity.',
    workspaceTeaser:
      'Your workspace shows modernization reversals, duplicate-complexity flags, active initiatives by stage, DORA gradients, GCC capability gaps, and the decision map separating real gaps from perception gaps.',
  },
  {
    slug: 'cfo-skyharbor',
    email: 'cfo@skyharbor-air.example.com',
    shortLabel: 'cfo@skyharbor',
    firstName: 'Mara',
    lastName: 'Chen',
    personaName: 'Mara Chen',
    monogram: 'MC',
    titleShort: 'CFO',
    titleFull: 'Chief Financial Officer',
    tenant: 'Airline Demo',
    clientKey: 'skyharbor',
    tenantKey: 'skyharbor-air',
    graphNodeId: 'person:skyharbor:mara-chen',
    monogramBg: '#075985',
    bioShort: 'CFO. Scrutinizes $3.2B IT spend, $2.4B modernization spend, and realized-vs-promised value.',
    bioLong:
      'Mara Chen owns finance, FP&A, procurement governance, and value realization for Airline Demo. She pressures the modernization portfolio to separate promised value from validated savings, quantify disputed benefits, and surface sourcing leverage before the IBM and AWS renewal windows.',
    workspaceTeaser:
      'Your workspace shows the IT spend envelope, modernization value ledger, disputed savings, vendor-renewal pipeline, IBM productivity guarantee history, and Source events with CFO-defensible negotiation levers.',
  },
  {
    slug: 'coo-skyharbor',
    email: 'coo@skyharbor-air.example.com',
    shortLabel: 'coo@skyharbor',
    firstName: 'Darius',
    lastName: 'King',
    personaName: 'Darius King',
    monogram: 'DK',
    titleShort: 'COO',
    titleFull: 'Chief Operating Officer',
    tenant: 'Airline Demo',
    clientKey: 'skyharbor',
    tenantKey: 'skyharbor-air',
    graphNodeId: 'person:skyharbor:darius-king',
    monogramBg: '#075985',
    bioShort: 'COO. Protects IROPs, crew, airport operations, baggage, and fleet reliability during extraction waves.',
    bioLong:
      'Darius King runs airline operations across hubs, crew, airport operations, cargo, maintenance interfaces, and disruption recovery. He supports modernization only when it lowers operational fragility and does not jeopardize passenger service, crew legality, or IROPs resilience.',
    workspaceTeaser:
      'Your workspace shows the operational KPI map, IROPs and crew dependency graph, modernization-blocker integrations, operational-risk gates, and Move pre-mortems for extraction candidates.',
  },
  {
    slug: 'ciso-skyharbor',
    email: 'ciso@skyharbor-air.example.com',
    shortLabel: 'ciso@skyharbor',
    firstName: 'Nadia',
    lastName: 'Sethi',
    personaName: 'Nadia Sethi',
    monogram: 'NS',
    titleShort: 'CISO',
    titleFull: 'Chief Information Security Officer',
    tenant: 'Airline Demo',
    clientKey: 'skyharbor',
    tenantKey: 'skyharbor-air',
    graphNodeId: 'person:skyharbor:nadia-sethi',
    monogramBg: '#075985',
    bioShort: 'CISO. Controls cloud sprawl, AI SDLC risk, privileged access, and safety-critical code safeguards.',
    bioLong:
      'Nadia Sethi owns cybersecurity, cloud governance, identity, third-party risk, and AI SDLC guardrails for Airline Demo. Her bar is explicit: every acceleration proposal must name security controls, operational blast radius, model-code risk, and evidence needed before funding.',
    workspaceTeaser:
      'Your workspace shows cloud control-plane exposure, AI SDLC opportunity risk classes, vendor security posture, privileged-access concerns, and governance gates for modernization moves.',
  },
  {
    slug: 'maestro-skyharbor',
    email: 'maestro@skyharbor-air.example.com',
    shortLabel: 'maestro@skyharbor',
    firstName: 'Rina',
    lastName: 'Patel',
    personaName: 'Rina Patel',
    monogram: 'RP',
    titleShort: 'Maestro',
    titleFull: 'AbarVa Maestro / Pilot Lead',
    tenant: 'Airline Demo',
    clientKey: 'skyharbor',
    tenantKey: 'skyharbor-air',
    graphNodeId: 'person:skyharbor:rina-patel',
    monogramBg: '#075985',
    authRole: 'maestro',
    bioShort: 'Maestro. Runs demo workflow orchestration, context-layer QA, and executive walkthrough readiness.',
    bioLong:
      'Rina Patel is the SkyHarbor pilot Maestro persona. She coordinates context-layer readiness, tenant setup, Intelligence prompts, Moves creation, Source event rehearsal, Tower continuity checks, and executive-demo QA.',
    workspaceTeaser:
      'Your workspace opens all demo-critical modules for SkyHarbor: Setup, Intelligence, Moves, Source, Tower, context-layer QA, and evidence traces for the airline modernization walkthrough.',
  },
  {
    slug: 'admin-skyharbor',
    email: 'admin@skyharbor-air.example.com',
    shortLabel: 'admin@skyharbor',
    firstName: 'Owen',
    lastName: 'Mercer',
    personaName: 'Owen Mercer',
    monogram: 'OM',
    titleShort: 'Admin',
    titleFull: 'Tenant Admin / Context Layer Steward',
    tenant: 'Airline Demo',
    clientKey: 'skyharbor',
    tenantKey: 'skyharbor-air',
    graphNodeId: 'person:skyharbor:owen-mercer',
    monogramBg: '#075985',
    authRole: 'admin',
    bioShort: 'Tenant admin. Owns user access, upload approvals, sync checks, and context-layer stewardship.',
    bioLong:
      'Owen Mercer is the SkyHarbor tenant-admin persona for setup and stewardship. He owns user access, upload approval workflows, rejected-fact review, template governance, ingestion sync status, and context-layer audit trails.',
    workspaceTeaser:
      'Your workspace includes Setup/Admin, user access, context-layer uploads, ingestion history, approval queues, source-file provenance, and cross-module continuity checks.',
  },
  {
    slug: 'cio-lakeshore',
    email: 'cio@lakeshore-holdings.example.com',
    shortLabel: 'cio@lakeshore',
    firstName: 'Meera',
    lastName: 'Rao',
    personaName: 'Meera Rao',
    monogram: 'MR',
    titleShort: 'CIO',
    titleFull: 'Global Chief Information Officer',
    tenant: 'Lakeshore Holdings',
    clientKey: 'lakeshore',
    tenantKey: 'lakeshore-holdings',
    graphNodeId: 'person:lakeshore:meera-rao',
    monogramBg: '#2563EB',
    bioShort: 'Global CIO. Owns holdco standards, opco CIO alignment, AI/delivery agenda, and data-plane readiness.',
    bioLong:
      'Meera Rao is the Global CIO for Lakeshore Holdings, a Chicago diversified holdco with Northline Supply Chain, Brightmark Marketing Services, Forge & Field Consumer Products, and Great Lakes Pantry Services. She owns enterprise architecture, cyber, shared IT standards, the AI/delivery agenda, and the governance tension between holdco standards and opco autonomy. Her immediate focus is proving the private data-plane load path, then using the loaded corpus to govern Kyriba, modernization, sourcing, and AI initiatives across all operating companies.',
    workspaceTeaser:
      'Your workspace shows the private data-plane load ledger, opco-specific IT landscapes, CIO decision-rights, application and vendor portfolios, AI initiative coverage, modernization candidates, and agent-grounding readiness across Moves, Source, Tower, and Intelligence.',
  },
  {
    slug: 'cfo-lakeshore',
    email: 'cfo@lakeshore-holdings.example.com',
    shortLabel: 'cfo@lakeshore',
    firstName: 'Daniel',
    lastName: 'Whitaker',
    personaName: 'Daniel Whitaker',
    monogram: 'DW',
    titleShort: 'CFO',
    titleFull: 'Chief Financial Officer and Treasury Sponsor',
    tenant: 'Lakeshore Holdings',
    clientKey: 'lakeshore',
    tenantKey: 'lakeshore-holdings',
    graphNodeId: 'person:lakeshore:daniel-whitaker',
    monogramBg: '#2563EB',
    bioShort: 'CFO/Treasury sponsor. Owns multi-entity cash, Kyriba business case, FX, and value realization.',
    bioLong:
      'Daniel Whitaker runs Finance, Treasury, FP&A, Procurement, and value realization for Lakeshore Holdings. He is the business sponsor for the Kyriba rollout because Lakeshore manages cash, FX, working capital, and treasury controls across 50 countries and four operating companies. His executive lens is disciplined: quantify value, separate approved data from estimated data, prove sourcing leverage, and prevent AI or modernization programs from overstating benefits before the evidence layer supports them.',
    workspaceTeaser:
      'Your workspace shows the Kyriba rollout, SI and vendor contracts, treasury KPI baselines, multi-entity cash and FX exposure, opco P&L trends, rate-card-informed delivery estimates, sourcing events, and value-realization evidence linked back to loaded documents and templates.',
  },
  {
    slug: 'admin-lakeshore',
    email: 'admin@lakeshore-holdings.example.com',
    shortLabel: 'admin@lakeshore',
    firstName: 'Nora',
    lastName: 'Fields',
    personaName: 'Nora Fields',
    monogram: 'NF',
    titleShort: 'Admin',
    titleFull: 'Tenant Admin / Context Layer Steward',
    tenant: 'Lakeshore Holdings',
    clientKey: 'lakeshore',
    tenantKey: 'lakeshore-holdings',
    graphNodeId: 'person:lakeshore:nora-fields',
    monogramBg: '#2563EB',
    authRole: 'admin',
    bioShort: 'Tenant admin. Owns Lakeshore user access, setup-data approval, and context-layer stewardship.',
    bioLong:
      'Nora Fields is the Lakeshore Holdings tenant-admin persona for setup and stewardship. She owns user access, upload approvals, ingestion history, rejected-fact review, template governance, and tenant-pinning proof for the Lakeshore demo.',
    workspaceTeaser:
      'Your workspace includes Setup/Admin, context-layer uploads, data trust, user access, Source artifact governance, and tenant-isolation evidence for the Lakeshore/Kyriba walkthrough.',
  },
];

export function findPersonaBySlug(slug: string): CxoPersona | undefined {
  return CXO_PERSONAS.find((p) => p.slug === slug);
}

export function findPersonaByEmail(email: string): CxoPersona | undefined {
  const norm = email.trim().toLowerCase();
  return CXO_PERSONAS.find((p) => p.email === norm);
}

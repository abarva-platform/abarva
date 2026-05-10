// Single source of truth for the four canonical CXO demo personas.
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
  /** Short title abbreviation: CIO · CDO · CDIO. */
  titleShort: string;
  /** Full title: "Chief Information Officer" etc. */
  titleFull: string;
  /** Tenant display name. */
  tenant: string;
  /**
   * Canonical app ClientKey — matches src/lib/client-config.ts.
   * Used for active-client resolution and Supabase clients-table
   * lookup (clients.name LIKE: Apex Retail / Meridian / Arcturus or
   * First Capital). MUST be one of: apexretail · meridian · arcturus.
   */
  clientKey: 'apexretail' | 'meridian' | 'arcturus';
  /**
   * Tenant key used by the data-room / broker layer — a parallel
   * namespace per project memory ("App ClientKey is `apexretail`;
   * broker is `apex-retail`"). Kept for chrome rendering.
   */
  tenantKey: 'apex-retail' | 'meridian-health' | 'firstcapital';
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
];

export function findPersonaBySlug(slug: string): CxoPersona | undefined {
  return CXO_PERSONAS.find((p) => p.slug === slug);
}

export function findPersonaByEmail(email: string): CxoPersona | undefined {
  const norm = email.trim().toLowerCase();
  return CXO_PERSONAS.find((p) => p.email === norm);
}

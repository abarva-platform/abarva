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
  /** Tenant key used by app routing / data layer. */
  tenantKey: 'apex-retail' | 'meridian-health' | 'firstcapital';
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
    tenantKey: 'apex-retail',
    monogramBg: '#C2410C',
    bioShort: '6 yrs CIO. Pragmatic, vendor-skeptical post-2023 AMS rebuild.',
    bioLong:
      'Carlos was promoted to CIO in 2020 after running Apex infrastructure since 2017. He absorbed the blame for the 2023 AMS consolidation pause and rebuilt CIO credibility through 2024-25. He is a pragmatic, vendor-skeptical operator who reports to COO David Okonjo. His 2026 priorities: IT cost stabilization, AMS consolidation completion, cloud migration phase 2, and AI platform readiness.',
    workspaceTeaser:
      'Your workspace shows the live IT modernization portfolio, the 2023 AMS rebuild signals, and the open AI Governance Council debate with CDO Lynne Stratham about platform investment.',
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
    tenantKey: 'apex-retail',
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
    tenantKey: 'meridian-health',
    monogramBg: '#0E8A65',
    bioShort: '0.5 yrs. New combined CDIO role. Owns digital strategy, info, AI governance.',
    bioLong:
      'Dr. Krishnamurthy was appointed Chief Digital and Information Officer six months ago, when Meridian collapsed its previously-separate CIO and Chief Digital roles into one position reporting directly to CEO Dr. Elaine Morales. Her remit covers Epic platform strategy, plan-provider digital integration, and the AI governance framework. She inherited a vacant VP Application Services role and is building credibility across an unusually wide portfolio.',
    workspaceTeaser:
      'Your workspace shows the integrated provider-and-plan digital portfolio, the open VP Apps vacancy creating ownership ambiguity, and the AI governance framework still being shaped.',
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
    tenantKey: 'firstcapital',
    monogramBg: '#1E3A8A',
    bioShort: '2 yrs. Ex-Top-5-bank Digital Payments VP. "FedNow is a survival project."',
    bioLong:
      'Patricia joined First Capital in 2024 as CIO from a top-5 US bank where she ran VP Digital Payments. She was hired specifically to modernize payments and digital channels. She is data-driven and impatient by big-bank standards, frustrated by First Capital\'s consensus-building pace. Her core fight: a 22-year-old FIS HORIZON core that cannot support FedNow without middleware, while 68% of peers are already live and $340M in commercial deposits sit at attrition risk.',
    workspaceTeaser:
      'Your workspace shows the FedNow payment-rails program, the FIS HORIZON modernization debate with CFO Michael Torres, the SQL Server 2017 end-of-support remediation, and the digital adoption dashboard tracking against the 67% peer median.',
  },
];

export function findPersonaBySlug(slug: string): CxoPersona | undefined {
  return CXO_PERSONAS.find((p) => p.slug === slug);
}

export function findPersonaByEmail(email: string): CxoPersona | undefined {
  const norm = email.trim().toLowerCase();
  return CXO_PERSONAS.find((p) => p.email === norm);
}

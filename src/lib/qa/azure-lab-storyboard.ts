// LIVE4 - Azure Lab Storyboard
//
// Deterministic, file-pure storyboard model for the Azure private data
// plane architecture live demo. This module never performs any real
// network request, never starts a server, never opens a browser, never
// imports any browser-automation library, never calls into the network,
// never reads the system clock, and never invokes a model provider.
//
// Every field is hardcoded. There are no dynamic lookups, no env reads,
// and no side effects.

// ---------------------------------------------------------------------
// Public types.
// ---------------------------------------------------------------------

export type StoryboardSlideType =
  | 'narrative'
  | 'architecture'
  | 'demo_step'
  | 'trust_story'
  | 'caveat'
  | 'plan';

export interface StoryboardSlide {
  id: string;
  slideType: StoryboardSlideType;
  title: string;
  keyMessage: string;
  speakerNotes: string;
  whatToShow: string;
  whatNotToClaim: string;
  clientQuestion: string;
  durationMinutes: number;
}

export interface AzureLabStoryboard {
  schemaVersion: 1;
  generatedAt: string;
  totalSlides: number;
  totalDurationMinutes: number;
  slides: StoryboardSlide[];
  whatLabProves: string[];
  whatLabDoesNotProve: string[];
  whatRemainsClientSpecific: string[];
  fortune500TrustRationale: string;
  may4LabPlan: string;
}

// ---------------------------------------------------------------------
// Canonical slide seed (order is contract).
// ---------------------------------------------------------------------

const SLIDES: readonly StoryboardSlide[] = [
  {
    id: 'AZLAB-S01',
    slideType: 'narrative',
    title: 'The Data Trust Problem',
    keyMessage:
      'Fortune 500 clients will not send raw data to a SaaS platform',
    speakerNotes:
      'Open with the problem every enterprise buyer has. Their data is their moat.',
    whatToShow:
      'Single slide: client data stays in client boundary diagram',
    whatNotToClaim:
      'Do not claim AbarVa has solved all data sovereignty requirements',
    clientQuestion:
      'How do you handle our data residency and sovereignty requirements?',
    durationMinutes: 2,
  },
  {
    id: 'AZLAB-S02',
    slideType: 'architecture',
    title: 'Two-Plane Architecture',
    keyMessage:
      'SaaS Control Plane + Client Private Data Plane — no raw data crosses the boundary',
    speakerNotes:
      'Show the two-plane split. AbarVa orchestrates; client data never leaves their Azure tenant.',
    whatToShow:
      'AZLAB1 blueprint diagram from docs/architecture/AZLAB1_SAAS_CONTROL_PLANE_PRIVATE_DATA_PLANE_BLUEPRINT.md',
    whatNotToClaim:
      'Do not claim the lab is in production — it is a planned proof of concept',
    clientQuestion: 'Where does my data actually live?',
    durationMinutes: 3,
  },
  {
    id: 'AZLAB-S03',
    slideType: 'architecture',
    title: 'Azure Resource Group Split',
    keyMessage:
      'rg-abarva-lab-control (AbarVa-owned) vs rg-abarva-lab-private-dp (client-owned)',
    speakerNotes:
      'Two resource groups, two ownership domains. Client controls the private data plane RG entirely.',
    whatToShow: 'Resource group table from AZLAB5 runbook',
    whatNotToClaim:
      'Do not claim client billing is set up — lab uses AbarVa subscription for proof of concept',
    clientQuestion: 'What Azure resources are in my environment?',
    durationMinutes: 2,
  },
  {
    id: 'AZLAB-S04',
    slideType: 'demo_step',
    title: 'Private Data Plane Components',
    keyMessage:
      'Private Postgres, Blob Storage, Key Vault, App Insights, Model Gateway Stub — all client-side',
    speakerNotes:
      'Walk through the six components in the private data plane. Each is client-owned and client-controlled.',
    whatToShow:
      'AZLAB5 runbook component list and AZLAB3 connector stub code',
    whatNotToClaim:
      'Do not claim these are provisioned today — May 4 lab target',
    clientQuestion: 'What components run in my environment?',
    durationMinutes: 2,
  },
  {
    id: 'AZLAB-S05',
    slideType: 'demo_step',
    title: 'Evidence Without Raw Data',
    keyMessage:
      'AbarVa requests evidence manifests; client approves what to share',
    speakerNotes:
      'Show the AZLAB4 private evidence manifest demo. 8 enterprise data sources — Workday, Salesforce, Oracle, SAP, Qualtrics, Datadog, Genesys, ServiceNow — all with rawDataRetainedByClient:true.',
    whatToShow:
      'AZLAB4 private evidence manifest types and sample output',
    whatNotToClaim:
      'Do not claim live integration with these systems exists today',
    clientQuestion: 'What data does AbarVa actually see?',
    durationMinutes: 3,
  },
  {
    id: 'AZLAB-S06',
    slideType: 'trust_story',
    title: 'Boundary Enforcement Contract',
    keyMessage:
      'Every cross-boundary call is logged, audited, and governed by explicit rules',
    speakerNotes:
      'Show AZLAB2 boundary contract: 8 rules, 4 failure modes, audit trail. No raw data ever crosses.',
    whatToShow:
      'AZLAB2 boundary rule list and audit event structure',
    whatNotToClaim:
      'Do not claim SOC2 or ISO27001 certification from this lab',
    clientQuestion: 'How is the boundary enforced technically?',
    durationMinutes: 2,
  },
  {
    id: 'AZLAB-S07',
    slideType: 'plan',
    title: 'May 4 Lab Deployment Plan',
    keyMessage: 'Lab will be provisioned and validated by May 4, 2026',
    speakerNotes:
      'Concrete timeline: VNet, Container Apps, Postgres, Key Vault, Blob, App Insights, connector smoke test.',
    whatToShow:
      'AZLAB5 deployment checklist and verification steps',
    whatNotToClaim:
      'Do not commit to a specific client deployment date in this meeting',
    clientQuestion: 'When can we see this running?',
    durationMinutes: 2,
  },
  {
    id: 'AZLAB-S08',
    slideType: 'caveat',
    title: 'What Remains Client-Specific',
    keyMessage:
      'IAM integration, data classification policy, network peering, and compliance certification are client-led',
    speakerNotes:
      'Be honest about what the lab proves vs. what requires a client-specific engagement.',
    whatToShow: 'Caveat list from this storyboard',
    whatNotToClaim:
      'Do not claim the lab substitutes for a full client deployment engagement',
    clientQuestion: 'What would a real deployment require on our side?',
    durationMinutes: 1,
  },
];

// ---------------------------------------------------------------------
// Builder function.
// ---------------------------------------------------------------------

export function buildAzureLabStoryboard(): AzureLabStoryboard {
  const slides = SLIDES.slice();
  const totalDurationMinutes = slides.reduce(
    (sum, s) => sum + s.durationMinutes,
    0,
  );

  return {
    schemaVersion: 1,
    generatedAt: '2026-04-26',
    totalSlides: slides.length,
    totalDurationMinutes,
    slides,
    whatLabProves: [
      'Two-plane architecture is technically viable on Azure',
      'Evidence manifests can be requested and approved without raw data crossing the boundary',
      'Resource group ownership split is deployable',
      'Connector stub pattern supports future real integration',
      'Audit trail enforces boundary rules deterministically',
    ],
    whatLabDoesNotProve: [
      'Production-scale performance under real client load',
      'Live integration with Workday/Salesforce/SAP/Oracle',
      'SOC2 or ISO27001 compliance',
      'Client-specific network peering or IAM policy',
      'Cost at production scale',
    ],
    whatRemainsClientSpecific: [
      'Azure subscription and tenant setup',
      'IAM/Entra ID integration',
      'Data classification and retention policy',
      'Network peering and private endpoint configuration',
      'Compliance audit and certification',
    ],
    fortune500TrustRationale:
      "Fortune 500 clients require data sovereignty. The two-plane architecture ensures AbarVa never receives raw client data — only evidence manifests that the client explicitly approves. The private data plane runs in the client's Azure tenant, under client IAM and network controls.",
    may4LabPlan:
      'By May 4 2026: provision rg-abarva-lab-private-dp with VNet (10.0.0.0/16), Container Apps for connector stub, PostgreSQL Flexible Server (Burstable B1ms), Blob Storage, Key Vault, App Insights. Run connector smoke test. Document boundary audit log output.',
  };
}

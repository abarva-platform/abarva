import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { getClientOption } from '@/lib/client-config';
import {
  getCanonicalV4Manifest,
  resolveV4AppClientKey,
  type CanonicalV4Dimension,
} from '@/lib/context-packs/v4-manifest';

export type LandscapeTone = 'teal' | 'amber' | 'red';

export interface LandscapeNavSection {
  id: string;
  label: string;
  tone: LandscapeTone;
}

export interface LandscapeNavGroup {
  label: string;
  sections: LandscapeNavSection[];
}

export interface LandscapeTableRow {
  area: string;
  assessment: string;
  tag: string;
  tone: LandscapeTone;
}

export interface LandscapeImplication {
  label: string;
  value: string;
  risk?: boolean;
}

export interface LandscapeMaturity {
  label: string;
  score: number;
  tone: LandscapeTone;
}

export type LandscapeExhibit =
  | {
      type: 'architecture';
      title: string;
      interpretation: string;
      columns: Array<{
        title: string;
        nodes: Array<{ label: string; detail: string; tone: LandscapeTone }>;
      }>;
    }
  | {
      type: 'bars';
      title: string;
      interpretation: string;
      rows: Array<{ label: string; value: number; tone: LandscapeTone; display?: string }>;
    }
  | {
      type: 'table';
      title: string;
      interpretation: string;
      headers: string[];
      rows: string[][];
    }
  | {
      type: 'heatmap';
      title: string;
      interpretation: string;
      headers: string[];
      rows: Array<{ label: string; cells: Array<{ label: string; tone: LandscapeTone }> }>;
    };

export interface LandscapeSection {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  meta: Array<{ label: string; value: string }>;
  executiveSummary: string;
  currentState: LandscapeTableRow[];
  implications: LandscapeImplication[];
  maturity: LandscapeMaturity[];
  exhibits: LandscapeExhibit[];
  leadershipRead: string;
  snapshot: Array<readonly [string, string]>;
  sources: Array<{ title: string; detail: string }>;
}

export interface EnterpriseLandscapeViewModel {
  tenantName: string;
  clientKey: string;
  askPlaceholder: string;
  contextCommandCenter: HomeContextCommandCenter;
  navGroups: LandscapeNavGroup[];
  sections: Record<string, LandscapeSection>;
  defaultSectionId: string;
  contextDimensionCount: number;
  canonicalDimensionSource: string;
}

export interface HomeContextCommandCenter {
  contractVersion: string;
  generatedAt: string;
  packSource: string;
  statusLabel: string;
  statusDetail: string;
  summaryMetrics: Array<{ label: string; value: string; detail: string; tone: LandscapeTone }>;
  knownFacts: Array<{ label: string; detail: string; tone: LandscapeTone }>;
  readinessAreas: Array<{ label: string; value: string; detail: string; tone: LandscapeTone }>;
  dataThinAreas: Array<{ label: string; value: string; detail: string; tone: LandscapeTone }>;
  missingEvidence: Array<{ label: string; detail: string; tone: LandscapeTone }>;
  answerBoundaries: Array<{ label: string; detail: string; tone: LandscapeTone }>;
}

interface V6GeneratedManifest {
  tenantKey: string;
  clientDisplayName: string;
  datasetVersion: string;
  generatedAt: string;
  sourceDataset: string;
  templatePack: string;
  contractVersion: string;
  rule: string;
  files: Array<{
    file: string;
    businessObjectFamily: string;
    columns: number;
    rows: number;
    dataThinCells: number;
  }>;
  totals: {
    files: number;
    rows: number;
    dataThinCells: number;
  };
}

const V6_DATASET_BY_CLIENT: Record<string, string> = {
  apexretail: 'apex-retail-synthetic-v6',
  arcturus: 'first-capital-financial-synthetic-v6',
  firstcapital: 'first-capital-financial-synthetic-v6',
  meridian: 'meridian-health-synthetic-v6',
  skyharbor: 'skyharbor-air-synthetic-v6',
  lakeshore: 'lakeshore-industries-synthetic-v6',
};

export const ENTERPRISE_LANDSCAPE_NAV: LandscapeNavGroup[] = [
  {
    label: 'THE ENTERPRISE',
    sections: [
      { id: 'profile', label: 'Enterprise Profile', tone: 'teal' },
      { id: 'operating', label: 'Business & Operating Model', tone: 'amber' },
      { id: 'workforce', label: 'Workforce & Personas', tone: 'amber' },
    ],
  },
  {
    label: 'THE ESTATE',
    sections: [
      { id: 'applications', label: 'Applications & Core Systems', tone: 'amber' },
      { id: 'infrastructure', label: 'Infrastructure & Cloud', tone: 'teal' },
      { id: 'data', label: 'Data & Analytics', tone: 'amber' },
      { id: 'integrations', label: 'Integrations & APIs', tone: 'amber' },
    ],
  },
  {
    label: 'MONEY & PARTNERS',
    sections: [
      { id: 'vendors', label: 'Vendors & Contracts', tone: 'red' },
      { id: 'budget', label: 'IT Budget & Run Cost', tone: 'amber' },
    ],
  },
  {
    label: 'AI & RISK',
    sections: [
      { id: 'ai', label: 'AI Footprint & Adoption', tone: 'amber' },
      { id: 'risk', label: 'Risk & Model Governance', tone: 'red' },
      { id: 'operations', label: 'Operations & Reliability', tone: 'amber' },
    ],
  },
  {
    label: 'OUTSIDE-IN',
    sections: [
      { id: 'benchmarks', label: 'Industry Benchmarks', tone: 'teal' },
      { id: 'policies', label: 'Policies & Governance', tone: 'amber' },
    ],
  },
];

const skyharborSections: Record<string, LandscapeSection> = {
  profile: section({
    id: 'profile',
    eyebrow: 'CURRENT STATE ASSESSMENT - ENTERPRISE PROFILE',
    title: 'SkyHarbor Air',
    subtitle: 'A global airline technology estate with mainframe depth, cloud modernization, and operational AI ambition.',
    executiveSummary:
      'SkyHarbor is a large, complex airline enterprise. The technology opportunity is not a simple cloud migration. It is a current-state modernization problem across core airline operations, data products, integration, customer identity, and disciplined AI sequencing.',
    currentState: [
      row('Enterprise scale', 'Large global airline with operations, commercial, customer, maintenance, crew, loyalty, finance, and corporate functions in scope.', 'STRENGTH', 'teal'),
      row('Technology posture', 'Hybrid estate anchored by IBM Z, SAP, Teradata Vantage on AWS, AWS lake/event streams, and a broad analytics tool footprint.', 'WATCH', 'amber'),
      row('AI ambition', 'Digital and agentic investment is strongest around IROPS, customer experience, service recovery, and operational decision support.', 'OPPORTUNITY', 'teal'),
      row('Primary constraint', 'Value depends on certified data products, lineage, API simplification, and human-in-loop control patterns.', 'CONSTRAINT', 'red'),
    ],
    implications: implications(
      'Modernization should be value-stream led, not platform-led.',
      'The most valuable initiatives cross legacy core, data, digital channels, operations, and governance.',
      'A generic transformation could add new platforms without retiring old workload or simplifying exception handling.',
      'Start with Data & Analytics, Applications & Core Systems, and AI Footprint & Adoption.',
    ),
    maturity: [
      mat('Enterprise context depth', 88, 'teal'),
      mat('Architecture clarity', 66, 'amber'),
      mat('AI readiness', 49, 'amber'),
      mat('Legacy simplification', 35, 'red'),
    ],
    exhibits: [
      architecture('Enterprise architecture at a glance', 'The loaded context shows a coexistence model: stabilize the core, expose controlled interfaces, certify data products, then scale AI.', [
        col('Core airline systems', [
          node('IBM Z mainframe', 'Reservations, ticketing, settlement', 'red'),
          node('SAP ERP', 'Finance, procurement, assets', 'teal'),
          node('IROPS platforms', 'Disruption and airport operations', 'amber'),
        ]),
        col('Integration and data', [
          node('DataStage', 'Batch transformations', 'red'),
          node('Informatica', 'ETL and API patterns', 'amber'),
          node('Event streams', 'Growing AWS event backbone', 'teal'),
        ]),
        col('Analytics and AI', [
          node('Teradata Vantage on AWS', 'EDW and operational analytics', 'teal'),
          node('SAS / Tableau / BI', 'Legacy analytics footprint', 'amber'),
          node('Agentic IROPS', 'Human-in-loop target state', 'amber'),
        ]),
      ]),
      bars('Leadership pressure by domain', 'The strongest pressure is where customer promises meet operational complexity.', [
        bar('IROPS and disruption recovery', 91, 'red'),
        bar('Customer identity / CDP gap', 78, 'amber'),
        bar('Data product certification', 68, 'amber'),
        bar('SAP finance foundation', 58, 'teal'),
      ]),
    ],
    leadershipRead:
      'Treat SkyHarbor as a sophisticated hybrid enterprise. The executive question is not whether there is enough data. It is which slices are trusted enough to run day-of-travel, customer, and AI decisions.',
    snapshot: [
      ['Enterprise type', 'Global airline'],
      ['Architecture', 'Hybrid'],
      ['Primary bet', 'Agentic operations'],
      ['Primary caution', 'Lineage and controls'],
    ],
    sources: sources('F01_enterprise-profile.yaml', 'F05_applications-systems.csv', 'F09_data-analytics-estate.csv', 'SkyHarbor_CIO_Architecture_Board_Update_SYNTHETIC.pptx'),
  }),
  applications: section({
    id: 'applications',
    eyebrow: 'CURRENT STATE ASSESSMENT - APPLICATIONS & CORE SYSTEMS',
    title: 'Core applications are broad, airline-specific, and still carry high integration gravity.',
    subtitle: 'The current state includes mainframe, reservations, SAP, operations, loyalty, airport, crew, maintenance, commercial, and customer systems.',
    executiveSummary:
      'SkyHarbor should not modernize applications as isolated systems. The meaningful assessment is how systems support airline value streams: disruption recovery, day-of-travel service, loyalty, revenue management, maintenance readiness, and finance control.',
    currentState: [
      row('Mainframe and reservations', 'Critical transaction and settlement logic still shapes downstream modernization choices.', 'CONSTRAINT', 'red'),
      row('SAP estate', 'Finance, procurement, asset, and corporate reporting functions have a stable enterprise backbone.', 'STRENGTH', 'teal'),
      row('Digital channels', 'Salesforce and Adobe are present, but customer identity is not yet unified through an enterprise CDP.', 'WATCH', 'amber'),
      row('Operations systems', 'IROPS, airport, crew, maintenance, and customer recovery use cases depend on cross-system orchestration.', 'HIGH COMPLEXITY', 'red'),
    ],
    implications: implications(
      'Modernization has to follow airline journeys, not application lists.',
      'Customer and operations value depends on simplifying handoffs across core systems.',
      'Digital channels could improve the front end while exception work remains trapped in legacy processes.',
      'Use the Integrations & APIs section to sequence the system dependency work.',
    ),
    maturity: [
      mat('Operational reliability', 76, 'teal'),
      mat('API accessibility', 44, 'amber'),
      mat('Rationalization', 37, 'red'),
      mat('Digital composability', 52, 'amber'),
    ],
    exhibits: [
      table('Core system landscape', 'The system view is organized by business role so leadership can see where modernization affects value.', ['System area', 'Business role', 'Modernization implication'], [
        ['Reservation and ticketing core', 'Booking, ticketing, settlement, recovery', 'Wrap with controlled APIs before replacement.'],
        ['SAP ERP', 'Finance, procurement, assets, reporting', 'Use as the finance source of truth.'],
        ['Salesforce and Adobe', 'Service, marketing, digital engagement', 'Requires CDP and identity architecture.'],
        ['Maintenance and crew systems', 'Readiness, legality, schedule integrity', 'Critical for agentic operations.'],
      ]),
      heatmap('Modernization heatmap', 'Criticality and integration gravity point to a sequenced path.', ['Domain', 'Criticality', 'Integration', 'Data', 'Change risk'], [
        heat('Reservations', ['red', 'red', 'amber', 'red']),
        heat('IROPS', ['red', 'red', 'amber', 'red']),
        heat('Customer', ['amber', 'amber', 'red', 'amber']),
        heat('SAP', ['teal', 'amber', 'teal', 'amber']),
      ]),
    ],
    leadershipRead:
      'The best modernization plan starts with the value streams that cannot work without legacy simplification: IROPS, customer identity, loyalty, day-of-travel, and finance control.',
    snapshot: [
      ['Applications', '900'],
      ['Highest complexity', 'IROPS and core apps'],
      ['Digital gap', 'No enterprise CDP'],
      ['Best next section', 'Integrations & APIs'],
    ],
    sources: sources('F05_applications-systems.csv', 'F06_system-function-mapping.csv', 'SkyHarbor_IBM_Z_Mainframe_Modernization_SYNTHETIC.pdf'),
  }),
  infrastructure: section({
    id: 'infrastructure',
    eyebrow: 'CURRENT STATE ASSESSMENT - INFRASTRUCTURE & CLOUD',
    title: 'SkyHarbor runs a deliberate hybrid backbone: IBM Z and on-premise platforms beside AWS modernization zones.',
    subtitle: 'This is a coexistence architecture, not a one-way cloud story.',
    executiveSummary:
      'Cloud investment should be targeted around data sharing, operational speed, resilience, and AI readiness. Some workloads should be stabilized and wrapped before replacement.',
    currentState: [
      row('IBM Z', 'Core transaction workloads remain strategically important and should not be treated as simple lift-and-shift candidates.', 'STABILIZE', 'amber'),
      row('AWS', 'Modern app, data lake, event, and analytics zones are expanding around digital and operations.', 'EXPANDING', 'teal'),
      row('Data centers', 'Legacy x86/Linux and platform footprints remain material for airline operations and integration.', 'HYBRID', 'amber'),
      row('Resilience', 'Day-of-travel resilience needs architecture patterns that span old and new platforms.', 'WATCH', 'amber'),
    ],
    implications: implications(
      'The architecture should classify workloads as stabilize, expose, modernize, or retire.',
      'A broad cloud migration mandate could add cost without reducing operational risk.',
      'Moving analytics while leaving batch integration untouched will not improve real-time operations.',
      'Architect around operational event flows and customer recovery, not platform slogans.',
    ),
    maturity: [
      mat('Hybrid control', 67, 'teal'),
      mat('Cloud operating model', 58, 'amber'),
      mat('Run-cost transparency', 45, 'amber'),
      mat('Real-time resilience', 42, 'red'),
    ],
    exhibits: [
      architecture('Hybrid infrastructure pattern', 'The target state should distinguish what stays stable from what becomes composable.', [
        col('Stabilize', [node('IBM Z', 'Core transactions', 'amber'), node('Data centers', 'Legacy x86/Linux', 'amber')]),
        col('Expose', [node('API gateways', 'Controlled access', 'teal'), node('Event backbone', 'Operational signals', 'teal')]),
        col('Modernize', [node('AWS app zones', 'Digital service', 'teal'), node('AWS data lake', 'Operational data', 'amber')]),
      ]),
      bars('Run-cost pressure by platform family', 'The pressure lens shows where operations preserve complexity versus create change capacity.', [
        bar('Mainframe / core', 88, 'red'),
        bar('Analytics estate', 76, 'amber'),
        bar('SAP / ERP', 64, 'amber'),
        bar('Cloud foundation', 58, 'teal'),
      ]),
    ],
    leadershipRead:
      'The winning architecture is coexistence with discipline: stabilize IBM Z where it earns its keep, expose controlled APIs, and concentrate AWS investment where real-time operations create value.',
    snapshot: [
      ['Architecture', 'Hybrid'],
      ['Core platform', 'IBM Z'],
      ['Cloud', 'AWS'],
      ['Priority', 'Event-driven operations'],
    ],
    sources: sources('F07_infrastructure-cloud.csv', 'F08_platform-volumetrics.csv', 'SkyHarbor_CIO_Architecture_Board_Update_SYNTHETIC.pptx'),
  }),
  data: section({
    id: 'data',
    eyebrow: 'CURRENT STATE ASSESSMENT - DATA & ANALYTICS',
    title: 'SkyHarbor is data-rich, but analytics is still hybrid, batch-heavy, and tool-fragmented.',
    subtitle: 'The estate combines Teradata Vantage on AWS, AWS lake and event streams, SAS, DataStage, Informatica, Tableau, BusinessObjects, mainframe feeds, SAP reporting, and a growing data-product layer.',
    executiveSummary:
      'SkyHarbor has a serious airline data estate, not a simple cloud warehouse story. The opportunity is to rationalize analytics, certify operational data products, and simplify lineage so AI investments can rely on trusted real-time context.',
    currentState: [
      row('Enterprise EDW', 'Teradata Vantage on AWS remains authoritative, with 4,800 active tables and 92,000 scheduled workloads per month.', 'STRENGTH', 'teal'),
      row('Data lake and events', 'AWS lake and event streams are growing around customer, operations, maintenance, and digital use cases.', 'DEVELOPING', 'amber'),
      row('Legacy analytics', 'SAS, DataStage, Informatica, Tableau, and BusinessObjects still carry meaningful production workload.', 'FRAGMENTED', 'red'),
      row('Data products', '420 data products span operations, commercial, maintenance, customer, data, security, and infrastructure domains.', 'PROMISING', 'teal'),
    ],
    implications: implications(
      'Agentic IROPS, personalization, and CDP-scale AI should be sequenced behind governed operational data products.',
      'AI value will be constrained if lineage, freshness, ownership, and quality are not certified across event and reservation flows.',
      'A generic lakehouse program could add another platform without retiring duplicate SAS, DataStage, BI, and EDW workloads.',
      'Start with IROPS, customer identity, and operational data-product certification before broad platform replacement.',
    ),
    maturity: [
      mat('EDW operational scale', 82, 'teal'),
      mat('Cloud data foundation', 61, 'amber'),
      mat('Lineage and ownership', 49, 'amber'),
      mat('Legacy workload simplification', 34, 'red'),
    ],
    exhibits: [
      architecture('Current-state data architecture', 'The architecture is cloud-connected, but operational truth still passes through a hybrid chain of core, EDW, data lake, ETL, and BI layers.', [
        col('Operational core', [node('IBM Z mainframe', 'Reservations, ticketing, settlement', 'red'), node('SAP ERP', 'Finance and procurement', 'teal'), node('IROPS platforms', 'Disruption operations', 'amber')]),
        col('Integration layer', [node('DataStage', 'Batch transformations', 'red'), node('Informatica', 'ETL and API patterns', 'amber'), node('Event streams', 'AWS event backbone', 'teal')]),
        col('Analytics layer', [node('Teradata Vantage on AWS', 'EDW, 4,800 active tables', 'teal'), node('AWS data lake', 'Operational and customer zones', 'amber'), node('SAS / Tableau / BI', 'Legacy analytics footprint', 'red')]),
      ]),
      table('Platform volumetrics that matter', 'These volumes explain why modernization is not a small reporting cleanup.', ['Platform', 'What it tells leadership', 'Scale'], [
        ['Teradata Vantage', 'Authoritative EDW workload remains substantial.', '4,800 tables / 92,000 jobs per month'],
        ['SAS', 'Production analytics logic still carries operational knowledge.', '380 production flows'],
        ['DataStage', 'Batch dependency is a material modernization issue.', '25,660 jobs per month'],
        ['Tableau', 'Business consumption is broad and must be migrated carefully.', '740 dashboards'],
      ]),
      heatmap('Readiness heatmap', 'The strongest gap is not data volume. It is certified lineage and operational readiness.', ['Domain', 'Scale', 'Freshness', 'Ownership', 'Lineage'], [
        heat('EDW', ['teal', 'amber', 'teal', 'amber']),
        heat('AWS lake', ['teal', 'amber', 'amber', 'amber']),
        heat('IROPS data', ['teal', 'amber', 'amber', 'red']),
        heat('Customer identity', ['amber', 'amber', 'red', 'red']),
      ]),
    ],
    leadershipRead:
      'The board-level question is where trusted, real-time operational data can unlock measurable airline value first. The answer is likely IROPS, customer identity, and service recovery.',
    snapshot: [
      ['EDW scale', '4,800 tables'],
      ['Scheduled workloads', '92,000/month'],
      ['Data products', '420'],
      ['Primary risk', 'Lineage gaps'],
    ],
    sources: sources('F08_platform-volumetrics.csv', 'F09_data-analytics-estate.csv', 'SkyHarbor_Teradata_Vantage_AWS_EDW_Current_State_SYNTHETIC.md'),
  }),
  integrations: basicSection('integrations', 'CURRENT STATE ASSESSMENT - INTEGRATIONS & APIS', 'Integration gravity is the hidden constraint behind digital and AI value.', 'SkyHarbor has high-volume interface complexity across mainframe, SAP, data, operations, customer, and partner systems.', 'The integration agenda should prioritize high-value airline workflows before generic API modernization.', 'Use integration complexity to decide where APIs, eventing, and data products must be funded before AI scale.'),
  vendors: section({
    id: 'vendors',
    eyebrow: 'CURRENT STATE ASSESSMENT - VENDORS & CONTRACTS',
    title: 'Vendor concentration and overlapping platforms create negotiation leverage, but also execution dependency.',
    subtitle: 'The vendor estate spans IBM, AWS, SAP, Teradata, Salesforce, Adobe, SAS, Informatica, Tableau, service integrators, and infrastructure providers.',
    executiveSummary:
      'Vendor insight should connect spend, criticality, renewal timing, and value delivered. The immediate opportunity is to separate strategic platforms from overlapping tools and negotiate around modernization commitments.',
    currentState: [
      row('Strategic platforms', 'IBM, AWS, SAP, Teradata, Salesforce, Adobe, and ServiceNow anchor major operating capabilities.', 'DEPENDENCY', 'amber'),
      row('Analytics overlap', 'SAS, DataStage, Informatica, Tableau, and BusinessObjects coexist with newer AWS data capabilities.', 'RATIONALIZE', 'red'),
      row('Service partners', 'Multiple integrators and managed service partners touch modernization and run operations.', 'COORDINATE', 'amber'),
      row('Renewal leverage', 'Contract renewal windows can be tied to workload reduction, modernization, and value proof.', 'OPPORTUNITY', 'teal'),
    ],
    implications: implications(
      'Vendor strategy should be tied to architecture simplification and measurable value.',
      'SkyHarbor can use its scale to demand migration credits, operating commitments, and simplification roadmaps.',
      'Reducing license spend without retiring workload creates operational risk and rework.',
      'Build a scorecard combining spend, dependency, modernization contribution, and value proof.',
    ),
    maturity: [
      mat('Spend visibility', 71, 'teal'),
      mat('Value linkage', 48, 'amber'),
      mat('Renewal discipline', 55, 'amber'),
      mat('Platform rationalization', 36, 'red'),
    ],
    exhibits: [
      bars('Vendor concentration lens', 'Concentration is not automatically bad. The issue is whether strategic vendors reduce complexity or add to it.', [
        bar('IBM', 86, 'red'),
        bar('AWS', 72, 'teal'),
        bar('SAP', 64, 'amber'),
        bar('Teradata', 58, 'amber'),
        bar('SAS / BI tools', 41, 'red'),
      ]),
      table('Vendor decisions to prepare', 'The strongest procurement conversations should include architecture and value commitments.', ['Vendor area', 'Leadership question', 'Likely action'], [
        ['IBM / Mainframe', 'Which workloads should remain stable versus wrapped?', 'Negotiate modernization support and API roadmap.'],
        ['Teradata', 'What EDW workload should stay on Vantage versus move?', 'Tie renewal to workload simplification.'],
        ['SAS and legacy BI', 'Which logic must be preserved before retirement?', 'Inventory models, reports, and owners.'],
      ]),
    ],
    leadershipRead:
      'The vendor story should become a value and simplification story. Ask which vendors are reducing architectural drag, not just which vendors are cheapest.',
    snapshot: [
      ['Vendors/contracts', '320'],
      ['Main risk', 'Overlap'],
      ['Negotiation lever', 'Modernization commitments'],
      ['Best next section', 'Budget'],
    ],
    sources: sources('F11_vendors-contracts-licenses.csv', 'F12_it-budget-financials.csv', 'T08_spend-contracts.csv'),
  }),
  budget: basicSection('budget', 'CURRENT STATE ASSESSMENT - IT BUDGET & RUN COST', 'A $2B+ technology budget gives SkyHarbor room to modernize, but run-cost gravity can starve change capacity.', 'The spend story should identify whether dollars are funding business outcomes or preserving complexity.', 'Move from spend reporting to value governance: what should scale, stop, renegotiate, or be funded first.', 'The CFO/CIO readout should show which spend protects the airline, which spend changes the airline, and which spend is trapped in avoidable complexity.'),
  ai: section({
    id: 'ai',
    eyebrow: 'CURRENT STATE ASSESSMENT - AI FOOTPRINT & ADOPTION',
    title: 'Agentic ambition is real, but adoption and control maturity need to catch up before autonomous scale.',
    subtitle: 'SkyHarbor wants to invest in digital and agentic operations for IROPS and customer experience.',
    executiveSummary:
      'AI should not start as a generic enterprise productivity push. For SkyHarbor, the high-value path is operational: disruption recovery, contact center assistance, crew and maintenance decision support, and customer experience personalization.',
    currentState: [
      row('IROPS agents', 'Strong candidate for value, but dependent on trusted event, inventory, crew, maintenance, airport, and customer data.', 'HIGH POTENTIAL', 'teal'),
      row('Customer experience', 'Salesforce and Adobe are present, but lack of CDP limits identity-driven personalization.', 'BLOCKED', 'amber'),
      row('Enterprise tools', 'Copilot, code assistants, service agents, and ERP AI should be measured by outcomes, not usage.', 'MEASURE', 'amber'),
      row('Governance', 'Model, data, and human-in-loop controls must be designed before autonomous decisions.', 'REQUIRED', 'red'),
    ],
    implications: implications(
      'The AI roadmap should be sequenced by value, data readiness, control readiness, and human-in-loop feasibility.',
      'Poorly controlled AI in disruptions can create customer, crew, safety, and compliance exposure.',
      'Launching AI assistants without data ownership and escalation patterns can increase exception work.',
      'Pilot human-in-loop agents in IROPS and service recovery before autonomous orchestration.',
    ),
    maturity: [
      mat('AI ambition', 83, 'teal'),
      mat('Use-case value clarity', 62, 'amber'),
      mat('Data readiness', 48, 'amber'),
      mat('Control maturity', 39, 'red'),
    ],
    exhibits: [
      bars('AI readiness funnel', 'The AI portfolio should narrow by value, data readiness, control readiness, and scale feasibility.', [
        bar('Ideas and use cases', 90, 'teal'),
        bar('Value cases with owners', 63, 'amber'),
        bar('Data ready', 48, 'amber'),
        bar('Controls ready', 36, 'red'),
        bar('Scale ready', 28, 'red'),
      ]),
      table('Agentic candidates', 'The best first agents support experts in exception-heavy work before they automate decisions.', ['Candidate', 'Why it matters', 'Start pattern'], [
        ['IROPS recovery agent', 'Disruption decisions cross flights, crews, gates, maintenance, and customers.', 'Human-in-loop recommendations.'],
        ['Customer service agent assist', 'Service interactions need context and consistency.', 'Next-best-action with confidence.'],
        ['Maintenance planning assistant', 'Aircraft readiness depends on asset, part, schedule, and compliance data.', 'Decision support and summarization.'],
      ]),
    ],
    leadershipRead:
      'The strongest AI story is not more tools. It is a governed path to operational decision support where trusted data, escalation, and evidence are designed from the start.',
    snapshot: [
      ['AI footprint', '72 rows'],
      ['Model inventory', '64'],
      ['Best first domain', 'IROPS'],
      ['Risk', 'Autonomy before controls'],
    ],
    sources: sources('F17_ai-automation-footprint.csv', 'T04_agent-outcomes.csv', 'T13_model-ai-inventory.csv', 'SkyHarbor_IROPS_Agentic_Roadmap_SYNTHETIC.pptx'),
  }),
  risk: basicSection('risk', 'CURRENT STATE ASSESSMENT - RISK & MODEL GOVERNANCE', 'Risk discipline is the gate between AI ambition and trusted enterprise scale.', 'The page should show where controls, policies, evidence, and operating accountability constrain adoption.', 'Use this section to decide which AI or modernization moves need governance work before scale.', 'Leadership should treat governance as a value unlock, not a compliance afterthought.'),
  operations: basicSection('operations', 'CURRENT STATE ASSESSMENT - OPERATIONS & RELIABILITY', 'Operations reliability is where technology architecture becomes airline value.', 'IROPS, airport operations, maintenance, service recovery, and crew workflows define whether modernization matters.', 'Focus on exception-heavy workflows where better data and AI can improve recovery time and customer impact.', 'The best operational investments should reduce disruption cost, manual recovery work, and customer impact.'),
  operating: basicSection('operating', 'CURRENT STATE ASSESSMENT - BUSINESS & OPERATING MODEL', 'The operating model spans commercial, operations, maintenance, customer, finance, and corporate functions.', 'Business value depends on aligning systems and data to airline value streams, not internal technology towers.', 'Use value-stream ownership to govern modernization sequencing.', 'The operating model should make clear who owns cross-functional outcomes, not just systems.'),
  workforce: basicSection('workforce', 'CURRENT STATE ASSESSMENT - WORKFORCE & PERSONAS', 'Workforce impact should be read by persona and workflow, not generic tool adoption.', 'Crew, airport, maintenance, service, finance, technology, and operations personas need different AI and data support patterns.', 'Start where decision support reduces exception work without removing expert accountability.', 'Workforce readiness should be measured by workflow improvement and trusted adoption, not seats assigned.'),
  benchmarks: basicSection('benchmarks', 'CURRENT STATE ASSESSMENT - INDUSTRY BENCHMARKS', 'Peer patterns point to data-product discipline, operations resilience, customer identity, and controlled AI as the airline north star.', 'Benchmarks should be used to shape choices, not to justify generic transformation programs.', 'Compare SkyHarbor against airline peers on IROPS, loyalty, CDP, data platform, and AI governance maturity.', 'Use benchmarks to set ambition and sequencing, then validate them against SkyHarbor evidence.'),
  policies: basicSection('policies', 'CURRENT STATE ASSESSMENT - POLICIES & GOVERNANCE', 'Policies determine how safely the enterprise can use data, AI, vendors, and automation.', 'Governance content should shape sourcing, AI controls, data access, privacy, and operational accountability.', 'Load corporate policies into the same source trail so every recommendation can reflect enterprise constraints.', 'Policy context should become part of every recommendation, sourcing decision, and AI control design.'),
};

export function getEnterpriseLandscapeViewModel(args: {
  clientKey?: string | null;
  tenantName?: string | null;
}): EnterpriseLandscapeViewModel {
  const option = getClientOption(resolveV4AppClientKey(args.clientKey));
  const tenantName = args.tenantName ?? option.name;
  const clientKey = option.id;
  const manifest = getCanonicalV4Manifest(clientKey);
  const v6Manifest = getV6GeneratedManifest(clientKey);
  const canonicalNav = manifest?.dimensions.length ? navFromManifest(manifest.dimensions) : ENTERPRISE_LANDSCAPE_NAV;
  const canonicalDimensionSource = manifest
    ? `datasets/${manifest.datasetDir}/manifest.yaml`
    : 'legacy-enterprise-landscape-nav';
  const contextCommandCenter = buildContextCommandCenter({
    tenantName,
    clientKey,
    vertical: option.vertical,
    v6Manifest,
    v4Manifest: manifest,
  });

  if (clientKey === 'skyharbor') {
    const sections = buildManifestSections({
      tenantName,
      vertical: option.vertical,
      dimensions: manifest?.dimensions ?? [],
      richSections: skyharborSections,
    });
    return {
      tenantName,
      clientKey,
      askPlaceholder: "Ask about SkyHarbor's business, technology, data, vendors, risk, or AI landscape...",
      contextCommandCenter,
      navGroups: canonicalNav,
      sections,
      defaultSectionId: manifest?.dimensions[0]?.dimension ?? 'profile',
      contextDimensionCount: manifest?.dimensions.length ?? ENTERPRISE_LANDSCAPE_NAV.flatMap((group) => group.sections).length,
      canonicalDimensionSource,
    };
  }

  const generic = manifest?.dimensions.length
    ? buildManifestSections({
      tenantName,
      vertical: option.vertical,
      dimensions: manifest.dimensions,
      richSections: {},
    })
    : buildGenericSections(tenantName, option.vertical);
  return {
    tenantName,
    clientKey,
    askPlaceholder: `Ask about ${tenantName}'s business, technology, data, vendors, risk, or AI landscape...`,
    contextCommandCenter,
    navGroups: canonicalNav,
    sections: generic,
    defaultSectionId: manifest?.dimensions[0]?.dimension ?? 'profile',
    contextDimensionCount: manifest?.dimensions.length ?? ENTERPRISE_LANDSCAPE_NAV.flatMap((group) => group.sections).length,
    canonicalDimensionSource,
  };
}

function getV6GeneratedManifest(clientKey: string): V6GeneratedManifest | null {
  const datasetDir = V6_DATASET_BY_CLIENT[resolveV4AppClientKey(clientKey)] ?? V6_DATASET_BY_CLIENT[clientKey];
  if (!datasetDir) return null;
  const sourcePath = path.join(process.cwd(), 'datasets', datasetDir, 'V6_GENERATED_MANIFEST.json');
  if (!existsSync(sourcePath)) return null;
  try {
    return JSON.parse(readFileSync(sourcePath, 'utf8')) as V6GeneratedManifest;
  } catch {
    return null;
  }
}

function buildContextCommandCenter(args: {
  tenantName: string;
  clientKey: string;
  vertical: string;
  v6Manifest: V6GeneratedManifest | null;
  v4Manifest: ReturnType<typeof getCanonicalV4Manifest>;
}): HomeContextCommandCenter {
  if (!args.v6Manifest) {
    const dimensions = args.v4Manifest?.dimensions ?? [];
    const sourceFiles = new Set(dimensions.map((dimension) => dimension.file));
    return {
      contractVersion: 'V6 pending',
      generatedAt: 'Not generated',
      packSource: args.v4Manifest ? `datasets/${args.v4Manifest.datasetDir}/manifest.yaml` : 'No canonical pack found',
      statusLabel: 'V6 readiness pending',
      statusDetail: 'Home is showing the current context manifest until the tenant receives a generated V6 contract pack.',
      summaryMetrics: [
        metric('Context dimensions', formatNumber(dimensions.length), 'Current manifest dimensions available to Home.', 'amber'),
        metric('Source files', formatNumber(sourceFiles.size), 'Files referenced by the current context manifest.', 'amber'),
        metric('V6 files', '0', 'No generated V6 pack found for this tenant yet.', 'red'),
        metric('Metadata contract', 'Pending', 'Business metadata dictionary must be generated before V6 cutover.', 'red'),
      ],
      knownFacts: [
        insight('Current manifest exists', `${args.tenantName} has a readable context manifest for Home navigation.`, 'amber'),
        insight('V6 pack missing', 'The standardized V6 files, headers, and business metadata dictionary are not yet bound for this tenant.', 'red'),
      ],
      readinessAreas: dimensions.slice(0, 8).map((dimension) => ({
        label: dimension.label,
        value: 'Manifest',
        detail: dimension.file,
        tone: toneForFamily(dimension.family),
      })),
      dataThinAreas: [
        {
          label: 'V6 data-thin classification unavailable',
          value: 'Pending',
          detail: 'Missing evidence cannot be classified at the V6 cell level until the V6 pack is generated.',
          tone: 'red',
        },
      ],
      missingEvidence: [
        insight('V6 generated manifest', 'Generate the tenant V6 pack before presenting Home as the final contract-status view.', 'red'),
        insight('Business metadata dictionary', 'Every column needs a business metadata name, definition, surface use, and claim boundary.', 'red'),
      ],
      answerBoundaries: answerBoundaries(),
    };
  }

  const manifest = args.v6Manifest;
  const totalCells = manifest.files.reduce((sum, file) => sum + file.columns * Math.max(file.rows, 1), 0);
  const populatedCellRate = totalCells > 0
    ? Math.max(0, Math.round(((totalCells - manifest.totals.dataThinCells) / totalCells) * 100))
    : 0;
  const metadataFields = manifest.files.reduce((sum, file) => sum + file.columns, 0);
  const relationshipRows = fileRows(manifest, 'relationship');
  const industryRows = fileRows(manifest, 'industry_corpus_pattern');
  const expertRows = fileRows(manifest, 'expert_lens');
  const aiRows = fileRows(manifest, 'ai_initiative');
  const programRows = fileRows(manifest, 'program_initiative');
  const dataThinFiles = [...manifest.files]
    .filter((file) => file.dataThinCells > 0)
    .sort((a, b) => b.dataThinCells - a.dataThinCells);

  return {
    contractVersion: manifest.contractVersion,
    generatedAt: formatDate(manifest.generatedAt),
    packSource: `datasets/${V6_DATASET_BY_CLIENT[args.clientKey] ?? manifest.sourceDataset.replace(/^datasets\//, '').replace(/-v4$/, '-v6')}`,
    statusLabel: 'V6 context pack available',
    statusDetail: manifest.rule,
    summaryMetrics: [
      metric('V6 files', formatNumber(manifest.totals.files), 'Standard contract files loaded for this tenant.', 'teal'),
      metric('Business records', formatNumber(manifest.totals.rows), 'Rows available for context, relationships, metrics, and evidence.', 'teal'),
      metric('Metadata fields', formatNumber(metadataFields), 'Columns mapped to business metadata across the V6 files.', 'teal'),
      metric('Populated cells', `${populatedCellRate}%`, `${formatNumber(manifest.totals.dataThinCells)} cells are explicitly marked data-thin.`, populatedCellRate >= 70 ? 'teal' : populatedCellRate >= 45 ? 'amber' : 'red'),
    ],
    knownFacts: [
      insight('Business context substrate', `${manifest.clientDisplayName} has ${formatNumber(manifest.totals.rows)} standardized V6 business records across ${formatNumber(manifest.totals.files)} files.`, 'teal'),
      insight('Relationships are explicit', `${formatNumber(relationshipRows)} relationship rows are available to connect entities, systems, programs, spend, and evidence.`, relationshipRows > 0 ? 'teal' : 'red'),
      insight('Industry and expert context', `${formatNumber(industryRows)} industry patterns and ${formatNumber(expertRows)} expert lenses are available as labeled pattern context, not tenant fact.`, industryRows > 0 && expertRows > 0 ? 'teal' : 'amber'),
      insight('AI/program inventory', `${formatNumber(aiRows)} AI initiative rows and ${formatNumber(programRows)} program rows are available for Tower and Intelligence handoff.`, aiRows > 0 && programRows > 0 ? 'teal' : 'amber'),
    ],
    readinessAreas: buildReadinessAreas(manifest),
    dataThinAreas: dataThinFiles.slice(0, 5).map((file) => ({
      label: businessLabel(file.businessObjectFamily),
      value: `${formatNumber(file.dataThinCells)} cells`,
      detail: `${formatNumber(file.rows)} rows in ${file.file}`,
      tone: file.dataThinCells > file.rows * 8 ? ('red' as const) : ('amber' as const),
    })),
    missingEvidence: [
      insight('Client-provided proof', 'Replace synthetic/demo-derived values with client-provided source owner, source basis, freshness, confidence, and known-gap fields before board-grade claims.', 'amber'),
      insight('Cell-level evidence posture', 'Any data-thin value must stay visible to Home and the Ask packet; the renderer must not smooth it away.', 'red'),
      insight('Live retrieval proof', 'The page can show the generated V6 pack, but production readiness still requires live Ask trace proof against the Azure V6 layer.', 'amber'),
    ],
    answerBoundaries: answerBoundaries(),
  };
}

function buildReadinessAreas(manifest: V6GeneratedManifest): HomeContextCommandCenter['readinessAreas'] {
  const groups = [
    {
      label: 'Enterprise identity',
      families: ['enterprise_profile', 'business_function', 'org_ownership', 'workforce_persona'],
    },
    {
      label: 'Technology estate',
      families: ['application_system', 'data_asset_integration'],
    },
    {
      label: 'Money and partners',
      families: ['vendor_contract', 'spend_value'],
    },
    {
      label: 'Programs and AI',
      families: ['program_initiative', 'ai_initiative'],
    },
    {
      label: 'Risk and controls',
      families: ['operations_risk_control', 'metric_definition'],
    },
    {
      label: 'Evidence and context',
      families: ['relationship', 'evidence_source', 'industry_corpus_pattern', 'expert_lens'],
    },
  ];

  return groups.map((group) => {
    const files = manifest.files.filter((file) => group.families.includes(file.businessObjectFamily));
    const rows = files.reduce((sum, file) => sum + file.rows, 0);
    const dataThinCells = files.reduce((sum, file) => sum + file.dataThinCells, 0);
    const cells = files.reduce((sum, file) => sum + file.rows * file.columns, 0);
    const rate = cells > 0 ? Math.round(((cells - dataThinCells) / cells) * 100) : 0;
    const tone: LandscapeTone = rate >= 70 ? 'teal' : rate >= 45 ? 'amber' : 'red';
    return {
      label: group.label,
      value: `${formatNumber(rows)} rows`,
      detail: `${rate}% populated across ${formatNumber(files.length)} V6 files`,
      tone,
    };
  });
}

function answerBoundaries() {
  return [
    insight('Home', 'Shows what context is loaded, trusted, thin, missing, and safe for aVa to use.', 'teal'),
    insight('Intelligence', 'Uses the context packet to answer advisory questions and distinguish tenant fact from industry pattern.', 'teal'),
    insight('Tower / Moves / Source', 'Use their own workspaces for portfolio execution, governed change, and sourcing decisions.', 'amber'),
  ];
}

function fileRows(manifest: V6GeneratedManifest, family: string): number {
  return manifest.files.find((file) => file.businessObjectFamily === family)?.rows ?? 0;
}

function metric(label: string, value: string, detail: string, tone: LandscapeTone) {
  return { label, value, detail, tone };
}

function insight(label: string, detail: string, tone: LandscapeTone) {
  return { label, detail, tone };
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

function businessLabel(value: string): string {
  return value
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function navFromManifest(dimensions: CanonicalV4Dimension[]): LandscapeNavGroup[] {
  const groups = new Map<string, LandscapeNavSection[]>();
  for (const dimension of dimensions) {
    const familyLabel = familyLabelFor(dimension.family);
    const sections = groups.get(familyLabel) ?? [];
    sections.push({
      id: dimension.dimension,
      label: dimension.label,
      tone: toneForFamily(dimension.family),
    });
    groups.set(familyLabel, sections);
  }
  return [...groups].map(([label, sections]) => ({ label, sections }));
}

function buildManifestSections(args: {
  tenantName: string;
  vertical: string;
  dimensions: CanonicalV4Dimension[];
  richSections: Record<string, LandscapeSection>;
}): Record<string, LandscapeSection> {
  return Object.fromEntries(args.dimensions.map((dimension) => {
    const rich = args.richSections[richSectionAlias(dimension.dimension)];
    const section = rich
      ? cloneSectionForDimension(rich, dimension)
      : manifestDimensionSection(args.tenantName, args.vertical, dimension);
    return [dimension.dimension, section];
  }));
}

function cloneSectionForDimension(section: LandscapeSection, dimension: CanonicalV4Dimension): LandscapeSection {
  return {
    ...section,
    id: dimension.dimension,
    eyebrow: `${familyLabelFor(dimension.family)} - ${dimension.label}`.toUpperCase(),
    meta: [
      ...section.meta,
      { label: 'DIMENSION', value: dimension.dimension },
      { label: 'SOURCE', value: dimension.file },
    ],
  };
}

function manifestDimensionSection(
  tenantName: string,
  vertical: string,
  dimension: CanonicalV4Dimension,
): LandscapeSection {
  return basicSection(
    dimension.dimension,
    `${familyLabelFor(dimension.family)} - ${dimension.label}`.toUpperCase(),
    dimension.label,
    `${tenantName} ${vertical} context dimension from the canonical v4 manifest.`,
    `This dimension is part of the canonical v4 context pack. It should be read from ${dimension.file} and treated as the product source of truth for this slice of the enterprise context.`,
    'Use this dimension to convert loaded context into an executive read, with missing evidence called out plainly.',
    [
      ...metaForTenant(tenantName),
      { label: 'DIMENSION', value: dimension.dimension },
      { label: 'SOURCE', value: dimension.file },
    ],
  );
}

function richSectionAlias(dimension: string): string {
  const aliases: Record<string, string> = {
    enterprise_profile: 'profile',
    business_org_functions: 'operating',
    it_org_ownership: 'operating',
    personas_workforce: 'workforce',
    capabilities_value_streams: 'operating',
    applications_systems: 'applications',
    system_function_mapping: 'applications',
    infrastructure_cloud: 'infrastructure',
    platform_volumetrics: 'infrastructure',
    data_analytics_estate: 'data',
    integrations_interfaces: 'integrations',
    vendors_contracts_licenses: 'vendors',
    it_budget_financials: 'budget',
    initiatives_portfolio: 'operations',
    operations_service_management: 'operations',
    kpis_outcome_evidence: 'operations',
    security_risk_compliance: 'risk',
    ai_automation_footprint: 'ai',
    business_metrics: 'benchmarks',
    industry_benchmarks: 'benchmarks',
    competitor_plays: 'benchmarks',
    benefits_realization: 'operations',
    raid_log: 'risk',
    ai_governance: 'risk',
    context_relationships: 'data',
  };
  return aliases[dimension] ?? dimension;
}

function familyLabelFor(family: string): string {
  return family.replace(/_/g, ' ').toUpperCase();
}

function toneForFamily(family: string): LandscapeTone {
  if (family.includes('governance') || family.includes('relationship')) return 'red';
  if (family.includes('financial') || family.includes('execution') || family.includes('data')) return 'amber';
  return 'teal';
}

function buildGenericSections(tenantName: string, vertical: string): Record<string, LandscapeSection> {
  const base = basicSection(
    'profile',
    'CURRENT STATE ASSESSMENT - ENTERPRISE PROFILE',
    tenantName,
    `Current-state enterprise landscape for ${vertical}.`,
    'This page turns the loaded context into a consulting-style current-state assessment. Section-specific exhibits should be enriched as the client data refresh completes.',
    'Use the left-side assessment sections to inspect business, technology, money, partners, AI, risk, and outside-in context.',
    metaForTenant(tenantName),
  );
  const sections: Record<string, LandscapeSection> = { profile: base };
  for (const group of ENTERPRISE_LANDSCAPE_NAV) {
    for (const nav of group.sections) {
      if (sections[nav.id]) continue;
      sections[nav.id] = basicSection(
        nav.id,
        `CURRENT STATE ASSESSMENT - ${nav.label.toUpperCase()}`,
        nav.label,
        `${tenantName} current-state assessment for ${nav.label.toLowerCase()}.`,
        'The section is ready for client-specific evidence, exhibits, and source trail enrichment from the context refresh.',
        'Use this section to convert loaded data into an executive read, not a raw inventory view.',
        metaForTenant(tenantName),
      );
    }
  }
  return sections;
}

function section(input: Omit<LandscapeSection, 'meta'> & { meta?: LandscapeSection['meta'] }): LandscapeSection {
  return {
    ...input,
    meta: input.meta ?? [
      { label: 'TENANT', value: 'SKYHARBOR AIR' },
      { label: 'ASSEMBLED', value: 'JUN 18, 2026' },
      { label: 'MODE', value: 'CURRENT STATE' },
    ],
  };
}

function metaForTenant(tenantName: string): LandscapeSection['meta'] {
  return [
    { label: 'TENANT', value: tenantName.toUpperCase() },
    { label: 'ASSEMBLED', value: 'JUN 18, 2026' },
    { label: 'MODE', value: 'CURRENT STATE' },
  ];
}

function basicSection(
  id: string,
  eyebrow: string,
  title: string,
  subtitle: string,
  summary: string,
  leadershipRead: string,
  meta?: LandscapeSection['meta'],
): LandscapeSection {
  return section({
    id,
    eyebrow,
    title,
    subtitle,
    meta,
    executiveSummary: summary,
    currentState: [
      row('Current-state read', summary, 'READ', 'teal'),
      row('Leadership implication', leadershipRead, 'ACTION', 'amber'),
      row('Evidence trail', 'Source trail is available when the underlying files, rows, pages, sheets, or slides have been loaded for this section.', 'SOURCE', 'teal'),
    ],
    implications: implications(
      'The section should translate context into a management point of view.',
      'Executives need the implication, risk, benchmark, and next action, not the raw record count.',
      'If the evidence is thin, the page should say so plainly rather than invent confidence.',
      'Continue enriching this section from the client context refresh.',
    ),
    maturity: [
      mat('Context coverage', 64, 'amber'),
      mat('Evidence confidence', 58, 'amber'),
      mat('Decision usefulness', 62, 'amber'),
    ],
    exhibits: [
      table('Assessment exhibit', 'This placeholder exhibit uses the same consulting-report format and is ready for client-specific chart/table/diagram binding.', ['Lens', 'What leadership learns', 'Next inspection'], [
        ['Current state', summary, 'Open source trail'],
        ['Leadership read', leadershipRead, 'Ask Sentinel'],
      ]),
    ],
    leadershipRead,
    snapshot: [
      ['Assessment', 'Available'],
      ['Exhibits', 'Ready'],
      ['Source trail', 'Enabled'],
    ],
    sources: sources('enterprise-reads.json', 'manifest.yaml'),
  });
}

function row(area: string, assessment: string, tag: string, tone: LandscapeTone): LandscapeTableRow {
  return { area, assessment, tag, tone };
}

function implications(
  whatItMeans: string,
  whyItMatters: string,
  whatCouldGoWrong: string,
  inspectNext: string,
): LandscapeImplication[] {
  return [
    { label: 'WHAT IT MEANS', value: whatItMeans },
    { label: 'WHY IT MATTERS', value: whyItMatters },
    { label: 'WHAT COULD GO WRONG', value: whatCouldGoWrong, risk: true },
    { label: 'INSPECT NEXT', value: inspectNext },
  ];
}

function mat(label: string, score: number, tone: LandscapeTone): LandscapeMaturity {
  return { label, score, tone };
}

function architecture(
  title: string,
  interpretation: string,
  columns: Extract<LandscapeExhibit, { type: 'architecture' }>['columns'],
): LandscapeExhibit {
  return { type: 'architecture', title, interpretation, columns };
}

function col(
  title: string,
  nodes: Extract<LandscapeExhibit, { type: 'architecture' }>['columns'][number]['nodes'],
) {
  return { title, nodes };
}

function node(label: string, detail: string, tone: LandscapeTone) {
  return { label, detail, tone };
}

function bars(
  title: string,
  interpretation: string,
  rows: Extract<LandscapeExhibit, { type: 'bars' }>['rows'],
): LandscapeExhibit {
  return { type: 'bars', title, interpretation, rows };
}

function bar(label: string, value: number, tone: LandscapeTone, display?: string) {
  return { label, value, tone, display };
}

function table(
  title: string,
  interpretation: string,
  headers: string[],
  rows: string[][],
): LandscapeExhibit {
  return { type: 'table', title, interpretation, headers, rows };
}

function heatmap(
  title: string,
  interpretation: string,
  headers: string[],
  rows: Extract<LandscapeExhibit, { type: 'heatmap' }>['rows'],
): LandscapeExhibit {
  return { type: 'heatmap', title, interpretation, headers, rows };
}

function heat(label: string, tones: LandscapeTone[]) {
  return {
    label,
    cells: tones.map((tone) => ({ tone, label: tone === 'teal' ? 'strong' : tone === 'amber' ? 'watch' : 'risk' })),
  };
}

function sources(...titles: string[]) {
  return titles.map((title) => ({
    title,
    detail: 'Loaded context source used for the current-state assessment and source trail.',
  }));
}

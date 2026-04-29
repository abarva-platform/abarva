import { apexRetail } from '@/data/apexretail';
import { apexRetailAI } from '@/data/apexretail/ai';
import { apexBenchmarks } from '@/data/apexretail/benchmarks';
import { apexFinancials } from '@/data/apexretail/financials';
import { apexLeadership } from '@/data/apexretail/leadership';
import { apexOpportunities } from '@/data/apexretail/opportunities';
import { apexOutcomes } from '@/data/apexretail/outcomes';
import { apexRFP } from '@/data/apexretail/rfp_data';
import { apexRetailTechInventory } from '@/data/apexretail/technology_inventory';
import { apexVendors } from '@/data/apexretail/vendors';
import { firstCapital } from '@/data/firstcapital';
import { meridianHealth } from '@/data/meridian';
import evidenceBase from '@/content/deliverables/apex-retail/morrison/_evidence-base.json';
import timeline from '@/content/deliverables/apex-retail/morrison/_timeline.json';
import { CLIENT_DATA, VOLUMETRICS_PROFILES } from '@/scripts/seed/_shared/enterprise-data';

export type EnterpriseDataSourceBasis =
  | 'synthetic_seed'
  | 'client_provided'
  | 'public_source'
  | 'derived'
  | 'agent_generated';

export type EnterpriseDataClassification =
  | 'synthetic'
  | 'public'
  | 'internal'
  | 'confidential'
  | 'restricted';

export type EnterpriseApprovalState =
  | 'template'
  | 'draft_generated'
  | 'draft_user_edited'
  | 'reviewed'
  | 'approved'
  | 'pending_review'
  | 'blocked'
  | 'superseded'
  | 'archived';

export type EnterpriseResidencyMode =
  | 'abarva_hosted_synthetic'
  | 'client_owned_abarva_hosted'
  | 'client_owned_client_hosted';

export type EnterpriseDataRoomRichness =
  | 'rich'
  | 'partial'
  | 'thin'
  | 'shell_only';

export type EnterpriseDataRoomDomain =
  | 'enterprise_profile'
  | 'people_org'
  | 'system_landscape'
  | 'vendor_contracts'
  | 'financials'
  | 'program_lifecycle'
  | 'sourcing_lifecycle'
  | 'evidence_provenance'
  | 'operating_telemetry'
  | 'templates_examples'
  | 'vector_readiness'
  | 'graph_readiness';

export interface EnterpriseProfileRecord {
  tenantKey: string;
  legalName: string;
  displayName: string;
  industry: string;
  subIndustry: string;
  headquarters: string;
  regions: string[];
  employeeCount: number;
  revenueUsdBillions: number;
  strategicPriorities: string[];
  regulatoryPosture: string[];
  dataClassificationPolicyId: string;
  residencyMode: EnterpriseResidencyMode;
  sourceBasis: EnterpriseDataSourceBasis;
  dataClassification: EnterpriseDataClassification;
}

export interface EnterprisePersonRecord {
  id: string;
  name: string;
  role: string;
  orgUnit: string;
  reportsToRole?: string;
  priorities: string[];
  ownsSystems: string[];
  sponsorsPrograms: string[];
  decisionRights: string[];
  sourceBasis: EnterpriseDataSourceBasis;
  approvalState: EnterpriseApprovalState;
}

export interface EnterpriseSystemRecord {
  id: string;
  name: string;
  vendor: string;
  category: string;
  businessDomains: string[];
  businessUnits: string[];
  deploymentModel: string;
  annualSpendUsd: number;
  contractExpiry?: string;
  businessOwner: string;
  itOwner: string;
  criticality: 'critical' | 'high' | 'medium' | 'low';
  lifecycleState: string;
  dataClassification: string;
  integrationCount: number;
  documentedIntegrationCount: number;
  riskFlags: string[];
  sourceBasis: EnterpriseDataSourceBasis;
}

export interface EnterpriseVendorContractRecord {
  id: string;
  vendorName: string;
  product: string;
  category: string;
  annualSpendUsd: number;
  contractStatus: string;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  renewalOrExpiry?: string;
  keyRisk: string;
  sourceBasis: EnterpriseDataSourceBasis;
}

export interface EnterpriseFinancialRecord {
  id: string;
  metric: string;
  value: number;
  unit: string;
  category: 'revenue' | 'margin' | 'cost' | 'budget' | 'benchmark' | 'opportunity';
  sourceBasis: EnterpriseDataSourceBasis;
  evidenceIds: string[];
}

export interface EnterpriseProgramRecord {
  id: string;
  name: string;
  domain: string;
  lifecycleState: string;
  executiveSponsor: string;
  budgetUsd?: number;
  spentToDateUsd?: number;
  annualValueUsd?: number;
  timeline: string;
  linkedSystemIds: string[];
  linkedVendorIds: string[];
  linkedEvidenceIds: string[];
  sourceBasis: EnterpriseDataSourceBasis;
}

export interface EnterpriseArtifactRecord {
  id: string;
  title: string;
  artifactType: 'program_deliverable' | 'sourcing_artifact' | 'template' | 'example' | 'generated_draft';
  lifecyclePhase: string;
  sourcePath?: string;
  approvalState: EnterpriseApprovalState;
  linkedEvidenceIds: string[];
  linkedProgramIds: string[];
  sourceBasis: EnterpriseDataSourceBasis;
}

export interface EnterpriseSourcingEventRecord {
  id: string;
  title: string;
  workType: string;
  status: string;
  evaluationCriteria: Array<{ criterion: string; weight: number }>;
  vendorResponses: Array<{
    vendorId: string;
    vendorName: string;
    score: number;
    rank: number;
    recommendation: string;
    implementationCostUsd: number;
    annualLicenseUsd: number;
    implementationMonths: number;
  }>;
  recommendedVendorId: string;
  linkedProgramIds: string[];
  linkedArtifactIds: string[];
  sourceBasis: EnterpriseDataSourceBasis;
}

export interface EnterpriseEvidenceRecord {
  id: string;
  tenantKey: string;
  sourceArtifactId: string;
  citationLocator: string;
  claimText: string;
  evidenceType: string;
  confidence: 'high' | 'medium' | 'low' | 'blocked' | 'missing';
  usabilityState:
    | 'loaded'
    | 'parsed'
    | 'indexed'
    | 'classified'
    | 'scoped'
    | 'cited'
    | 'quality_checked'
    | 'usable_as_evidence'
    | 'blocked';
  linkedArtifactIds: string[];
  linkedGraphNodeIds: string[];
  sourceBasis: EnterpriseDataSourceBasis;
  dataClassification: EnterpriseDataClassification;
  approvalState: EnterpriseApprovalState;
}

export interface EnterpriseGraphNodeRecord {
  id: string;
  nodeType:
    | 'Tenant'
    | 'Person'
    | 'Role'
    | 'OrgUnit'
    | 'System'
    | 'Vendor'
    | 'Contract'
    | 'Program'
    | 'SourcingEvent'
    | 'Artifact'
    | 'Kpi'
    | 'Risk'
    | 'Evidence'
    | 'Template';
  stableKey: string;
  title: string;
  sourceBasis: EnterpriseDataSourceBasis;
}

export interface EnterpriseGraphEdgeRecord {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  edgeType:
    | 'HOLDS_ROLE'
    | 'REPORTS_TO'
    | 'SPONSORS_PROGRAM'
    | 'OWNS_SYSTEM'
    | 'OWNS_VENDOR'
    | 'SYSTEM_SUPPORTS_PROGRAM'
    | 'PROGRAM_HAS_DELIVERABLE'
    | 'SOURCING_EVENT_FOR_PROGRAM'
    | 'SOURCING_EVENT_HAS_VENDOR'
    | 'ARTIFACT_CITES_EVIDENCE'
    | 'EVIDENCE_SUPPORTS_CLAIM'
    | 'SYSTEM_HAS_RISK';
  confidence: number;
  evidenceIds: string[];
}

export interface EnterpriseVectorReadinessRecord {
  indexFamily: 'global_corpus' | 'tenant_artifacts' | 'tenant_facts' | 'tenant_evidence' | 'pattern_candidates';
  candidateChunkCount: number;
  sourceTypes: string[];
  tenantKeyRequired: true;
  rawPrivateTextAllowedInSharedMetadata: false;
}

export interface EnterpriseDataRoomCompletenessRequirement {
  domain: EnterpriseDataRoomDomain;
  minimumCount: number;
  actualCount: number;
  status: 'met' | 'gap';
  note: string;
}

export interface EnterpriseDataRoomSummary {
  tenantKey: string;
  richness: EnterpriseDataRoomRichness;
  totalPeople: number;
  totalSystems: number;
  totalVendors: number;
  totalFinancialMetrics: number;
  totalPrograms: number;
  totalArtifacts: number;
  totalSourcingEvents: number;
  totalEvidence: number;
  totalGraphNodes: number;
  totalGraphEdges: number;
  totalVectorCandidateChunks: number;
  completenessMet: number;
  completenessGaps: number;
}

export interface EnterpriseDataRoomValidationResult {
  tenantKey: string;
  isRichTenantReady: boolean;
  requirements: EnterpriseDataRoomCompletenessRequirement[];
  missingRequiredFields: string[];
  summary: EnterpriseDataRoomSummary;
}

export interface EnterpriseDataRoomRecord {
  tenantKey: string;
  generatedFrom: 'deterministic_enterprise_data_room_seed';
  richness: EnterpriseDataRoomRichness;
  sourcePaths: string[];
  canonicalizationWarnings: string[];
  profile: EnterpriseProfileRecord;
  people: EnterprisePersonRecord[];
  systems: EnterpriseSystemRecord[];
  vendorContracts: EnterpriseVendorContractRecord[];
  financials: EnterpriseFinancialRecord[];
  programs: EnterpriseProgramRecord[];
  artifacts: EnterpriseArtifactRecord[];
  sourcingEvents: EnterpriseSourcingEventRecord[];
  evidence: EnterpriseEvidenceRecord[];
  graph: {
    nodes: EnterpriseGraphNodeRecord[];
    edges: EnterpriseGraphEdgeRecord[];
  };
  vectorReadiness: EnterpriseVectorReadinessRecord[];
}

const APEX_TENANT_KEY = 'apex-retail';
const SYNTHETIC_SOURCE: EnterpriseDataSourceBasis = 'synthetic_seed';

const MORRISON_DELIVERABLES: EnterpriseArtifactRecord[] = [
  ['D01', 'Program Charter', 'phase-1', 'D01-d01-program-charter.md'],
  ['D02', 'Stakeholder Map', 'phase-1', 'D02-d02-stakeholder-map.md'],
  ['D03', 'Success Metric Tree', 'phase-1', 'D03-d03-success-metric-tree.md'],
  ['D04', 'Intake Synthesis', 'phase-1', 'D04-d04-intake-synthesis.md'],
  ['D07', 'Financial Baseline', 'phase-2', 'd07-financial-baseline.md'],
  ['D08', 'Pain Point Register', 'phase-2', 'd08-pain-point-register.md'],
  ['D09', 'Root Cause Analysis', 'phase-2', 'd09-root-cause-analysis.md'],
  ['D10', 'Benchmark Comparison', 'phase-2', 'd10-benchmark-comparison.md'],
  ['D11', 'Hypothesis Backlog', 'phase-2', 'd11-hypothesis-backlog.md'],
  ['D12', 'Roadmap', 'phase-3', 'd12-roadmap.md'],
  ['D14', 'Kanban Board', 'phase-3', 'd14-kanban-board.md'],
  ['D15', 'Intervention Portfolio', 'phase-3', 'd15-intervention-portfolio.md'],
  ['D16', 'Business Case', 'phase-3', 'd16-business-case.md'],
  ['D18', 'Risk Register', 'phase-3', 'd18-risk-register.md'],
  ['D19', 'Delivery Plan', 'phase-4', 'd19-delivery-plan.md'],
  ['D20', 'Sprint Artifacts', 'phase-4', 'd20-sprint-artifacts.md'],
  ['D22', 'Change Management Plan', 'phase-4', 'd22-change-management.md'],
  ['D24', 'Outcome Measurement Plan', 'phase-4', 'd24-outcome-measurement-plan.md'],
].map(([code, title, phase, filename]) => ({
  id: `artifact:apex:morrison:${code.toLowerCase()}`,
  title,
  artifactType: 'program_deliverable',
  lifecyclePhase: phase,
  sourcePath: `src/content/deliverables/apex-retail/morrison/${filename}`,
  approvalState: 'approved',
  linkedEvidenceIds: Object.entries(evidenceBase.entries)
    .filter(([, entry]) => entry.deliverable_code === code)
    .map(([id]) => `evidence:apex:morrison:${id.toLowerCase()}`),
  linkedProgramIds: ['program:apex:morrison-owned-brand-margin-recovery'],
  sourceBasis: SYNTHETIC_SOURCE,
}));

function normalizeRiskLevel(riskLevel: string): 'critical' | 'high' | 'medium' | 'low' {
  const normalized = riskLevel.toLowerCase();
  if (normalized.includes('critical')) return 'critical';
  if (normalized.includes('high')) return 'high';
  if (normalized.includes('low')) return 'low';
  return 'medium';
}

function millionsToUsd(value: number): number {
  return Math.round(value * 1_000_000);
}

function personId(name: string): string {
  return `person:apex:${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
}

function roleOrgUnit(role: string): string {
  if (role.includes('CFO')) return 'Finance';
  if (role.includes('CIO') || role.includes('CTO')) return 'Enterprise IT';
  if (role.includes('CDO')) return 'Data and Analytics';
  if (role.includes('CPO')) return 'People';
  if (role.includes('Supply Chain')) return 'Supply Chain';
  if (role.includes('CMO')) return 'Marketing';
  return 'Executive Leadership';
}

function buildApexPeople(): EnterprisePersonRecord[] {
  return apexLeadership.executives.map((leader) => ({
    id: personId(leader.name),
    name: leader.name,
    role: leader.role,
    orgUnit: roleOrgUnit(leader.role),
    reportsToRole: leader.role === 'CEO' ? undefined : 'CEO',
    priorities: leader.priorities,
    ownsSystems: leader.ownsSystems ?? [],
    sponsorsPrograms: leader.role === 'CFO'
      ? ['program:apex:morrison-owned-brand-margin-recovery']
      : leader.role.includes('Supply Chain')
        ? ['program:apex:demand-forecasting-ai']
        : [],
    decisionRights: [
      leader.investmentAppetite,
      `change_readiness:${leader.changeReadiness}`,
    ],
    sourceBasis: SYNTHETIC_SOURCE,
    approvalState: 'approved',
  }));
}

function buildApexSystems(): EnterpriseSystemRecord[] {
  return apexRetailTechInventory.systems.map((system) => ({
    id: `system:apex:${system.id}`,
    name: system.name,
    vendor: system.vendor,
    category: system.category,
    businessDomains: system.businessDomain,
    businessUnits: system.businessUnit,
    deploymentModel: system.version ?? 'documented_seed',
    annualSpendUsd: millionsToUsd(system.annualCost),
    contractExpiry: system.contractExpiry,
    businessOwner: system.businessOwner,
    itOwner: system.itOwner,
    criticality: normalizeRiskLevel(system.riskLevel),
    lifecycleState: system.status,
    dataClassification: system.dataClassification,
    integrationCount: system.interfaces.total,
    documentedIntegrationCount: system.interfaces.documented,
    riskFlags: [system.riskReason, ...system.issues],
    sourceBasis: SYNTHETIC_SOURCE,
  }));
}

function buildApexVendorContracts(): EnterpriseVendorContractRecord[] {
  const vendorContracts = apexVendors.vendors.map((vendor) => ({
    id: `vendor:apex:${vendor.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    vendorName: vendor.name,
    product: vendor.product,
    category: vendor.category,
    annualSpendUsd: millionsToUsd(vendor.annualSpendMillions),
    contractStatus: vendor.contractStatus,
    riskLevel: normalizeRiskLevel(vendor.riskLevel),
    renewalOrExpiry: 'extensionYear' in vendor ? String(vendor.extensionYear) : undefined,
    keyRisk: vendor.keyRisk,
    sourceBasis: SYNTHETIC_SOURCE,
  }));

  const staffAugContracts = CLIENT_DATA['Apex Retail'].staffAug.map((staffAug, index) => ({
    id: `vendor:apex:staff-aug:${index + 1}`,
    vendorName: staffAug.vendor_name,
    product: staffAug.engagement_type,
    category: staffAug.function_area,
    annualSpendUsd: staffAug.annual_spend_usd,
    contractStatus: 'Synthetic service contract seed',
    riskLevel: 'medium' as const,
    keyRisk: `${staffAug.headcount_fte} FTE equivalent engagement; validate scope, onboarding, and data-access posture before production use.`,
    sourceBasis: SYNTHETIC_SOURCE,
  }));

  return [...vendorContracts, ...staffAugContracts];
}

function buildApexFinancials(): EnterpriseFinancialRecord[] {
  const records: EnterpriseFinancialRecord[] = [
    ['revenue-total', 'Total revenue', apexFinancials.revenue.total, 'USD billions', 'revenue'],
    ['revenue-ecommerce', 'Ecommerce revenue', apexFinancials.revenue.ecommerceRevenue, 'USD billions', 'revenue'],
    ['margin-operating', 'Operating margin', apexFinancials.margins.operatingMargin, 'percent', 'margin'],
    ['margin-target', 'Target operating margin', apexFinancials.margins.targetOperatingMargin, 'percent', 'margin'],
    ['cost-technology', 'Technology cost', apexFinancials.costs.technology, 'USD millions', 'cost'],
    ['budget-it', 'IT budget', apexRetail.financials.itBudget, 'USD millions', 'budget'],
    ['inventory-turnover', 'Inventory turnover', apexFinancials.inventoryMetrics.turnover, 'turns', 'benchmark'],
    ['ecommerce-conversion', 'Ecommerce conversion rate', apexFinancials.ecommerce.conversionRate, 'percent', 'benchmark'],
  ].map(([id, metric, value, unit, category]) => ({
    id: `financial:apex:${id}`,
    metric: String(metric),
    value: Number(value),
    unit: String(unit),
    category: category as EnterpriseFinancialRecord['category'],
    sourceBasis: SYNTHETIC_SOURCE,
    evidenceIds: [],
  }));

  const opportunityRecords = apexOpportunities.opportunities.map((opportunity) => ({
    id: `financial:apex:opportunity:${opportunity.id}`,
    metric: `${opportunity.name} annual value`,
    value: opportunity.annualValueMillions,
    unit: 'USD millions',
    category: 'opportunity' as const,
    sourceBasis: SYNTHETIC_SOURCE,
    evidenceIds: [],
  }));

  const benchmarkRecords = apexBenchmarks.financialPerformance.slice(0, 4).map((benchmark, index) => ({
    id: `financial:apex:benchmark:${index + 1}`,
    metric: benchmark.metric,
    value: benchmark.apex,
    unit: benchmark.unit,
    category: 'benchmark' as const,
    sourceBasis: SYNTHETIC_SOURCE,
    evidenceIds: [],
  }));

  return [...records, ...opportunityRecords, ...benchmarkRecords];
}

function buildApexPrograms(): EnterpriseProgramRecord[] {
  const opportunityPrograms = apexOpportunities.opportunities.map((opportunity) => ({
    id: `program:apex:${opportunity.id}`,
    name: opportunity.name,
    domain: opportunity.category,
    lifecycleState: opportunity.blocked ? 'blocked' : `wave-${opportunity.wave}`,
    executiveSponsor: opportunity.category === 'Supply Chain' ? 'SVP Supply Chain' : 'Executive sponsor pending',
    budgetUsd: millionsToUsd(opportunity.implementationCostMillions),
    annualValueUsd: millionsToUsd(opportunity.annualValueMillions),
    timeline: `${opportunity.timelineMonths} months`,
    linkedSystemIds: opportunity.name.includes('Personalization') ? ['system:apex:sfcc', 'system:apex:segment-cdp'] : [],
    linkedVendorIds: [],
    linkedEvidenceIds: [],
    sourceBasis: SYNTHETIC_SOURCE,
  }));

  const outcomePrograms = apexOutcomes.initiatives.map((initiative) => ({
    id: `program:apex:${initiative.id}`,
    name: initiative.name,
    domain: 'outcome_tracking',
    lifecycleState: initiative.status.toLowerCase(),
    executiveSponsor: initiative.name.includes('Labor') ? 'CPO' : 'Operations',
    budgetUsd: undefined,
    spentToDateUsd: millionsToUsd(initiative.currentSavingsMillions ?? 0),
    annualValueUsd: millionsToUsd(initiative.committedSavingsMillions ?? 0),
    timeline: `${initiative.liveMonths} live months`,
    linkedSystemIds: [],
    linkedVendorIds: [],
    linkedEvidenceIds: [],
    sourceBasis: SYNTHETIC_SOURCE,
  }));

  const morrisonProgram: EnterpriseProgramRecord = {
    id: 'program:apex:morrison-owned-brand-margin-recovery',
    name: timeline.program_name,
    domain: 'program_lifecycle',
    lifecycleState: 'phase-4-ready',
    executiveSponsor: timeline.anchor_facts.sponsor_primary,
    budgetUsd: timeline.anchor_facts.capital_ask_usd,
    spentToDateUsd: undefined,
    annualValueUsd: timeline.anchor_facts.steady_state_impact_high_usd,
    timeline: `${timeline.program_start} through ${timeline.phase_5_target}`,
    linkedSystemIds: [],
    linkedVendorIds: [],
    linkedEvidenceIds: Object.keys(evidenceBase.entries).map((id) => `evidence:apex:morrison:${id.toLowerCase()}`),
    sourceBasis: SYNTHETIC_SOURCE,
  };

  return [morrisonProgram, ...opportunityPrograms, ...outcomePrograms];
}

function buildApexSourcingArtifacts(): EnterpriseArtifactRecord[] {
  return [
    {
      id: 'artifact:apex:sourcing:demand-forecasting-rfp',
      title: apexRFP.metadata.rfpTitle,
      artifactType: 'sourcing_artifact',
      lifecyclePhase: 'rfp_evaluation',
      sourcePath: 'src/data/apexretail/rfp_data.ts',
      approvalState: 'approved',
      linkedEvidenceIds: [],
      linkedProgramIds: ['program:apex:op-001'],
      sourceBasis: SYNTHETIC_SOURCE,
    },
    {
      id: 'artifact:apex:sourcing:demand-forecasting-scorecard',
      title: 'Demand Forecasting AI Evaluation Scorecard',
      artifactType: 'sourcing_artifact',
      lifecyclePhase: 'vendor_evaluation',
      sourcePath: 'src/data/apexretail/rfp_data.ts',
      approvalState: 'approved',
      linkedEvidenceIds: [],
      linkedProgramIds: ['program:apex:op-001'],
      sourceBasis: SYNTHETIC_SOURCE,
    },
    {
      id: 'artifact:apex:sourcing:demand-forecasting-award-recommendation',
      title: 'Blue Yonder Award Recommendation',
      artifactType: 'sourcing_artifact',
      lifecyclePhase: 'award_recommendation',
      sourcePath: 'src/data/apexretail/rfp_data.ts',
      approvalState: 'approved',
      linkedEvidenceIds: [],
      linkedProgramIds: ['program:apex:op-001'],
      sourceBasis: SYNTHETIC_SOURCE,
    },
  ];
}

function buildApexEvidence(): EnterpriseEvidenceRecord[] {
  return Object.entries(evidenceBase.entries).map(([id, entry]) => ({
    id: `evidence:apex:morrison:${id.toLowerCase()}`,
    tenantKey: APEX_TENANT_KEY,
    sourceArtifactId: `artifact:apex:morrison:${entry.deliverable_code.toLowerCase()}`,
    citationLocator: `${entry.source} :: ${id}`,
    claimText: entry.reference,
    evidenceType: entry.type,
    confidence: entry.evidence_confidence as EnterpriseEvidenceRecord['confidence'],
    usabilityState: entry.evidence_confidence === 'high' ? 'usable_as_evidence' : 'quality_checked',
    linkedArtifactIds: [`artifact:apex:morrison:${entry.deliverable_code.toLowerCase()}`],
    linkedGraphNodeIds: [],
    sourceBasis: SYNTHETIC_SOURCE,
    dataClassification: 'synthetic',
    approvalState: entry.evidence_confidence === 'high' ? 'approved' : 'reviewed',
  }));
}

function buildApexSourcingEvents(): EnterpriseSourcingEventRecord[] {
  return [
    {
      id: 'sourcing:apex:demand-forecasting-ai-platform',
      title: apexRFP.metadata.rfpTitle,
      workType: 'AI demand forecasting platform',
      status: `recommendation:${apexRFP.metadata.recommendation}`,
      evaluationCriteria: apexRFP.scoringCriteria,
      vendorResponses: apexRFP.vendors.map((vendor) => ({
        vendorId: `vendor:apex:rfp:${vendor.id}`,
        vendorName: vendor.name,
        score: vendor.abarvaScore,
        rank: vendor.abarvaRank,
        recommendation: vendor.recommendation,
        implementationCostUsd: millionsToUsd(vendor.implementationCostMillions),
        annualLicenseUsd: millionsToUsd(vendor.annualLicenseMillions),
        implementationMonths: vendor.implementationMonths,
      })),
      recommendedVendorId: `vendor:apex:rfp:${apexRFP.abarvaRecommendation.vendorId}`,
      linkedProgramIds: ['program:apex:op-001'],
      linkedArtifactIds: [
        'artifact:apex:sourcing:demand-forecasting-rfp',
        'artifact:apex:sourcing:demand-forecasting-scorecard',
        'artifact:apex:sourcing:demand-forecasting-award-recommendation',
      ],
      sourceBasis: SYNTHETIC_SOURCE,
    },
  ];
}

function buildApexGraph(
  people: EnterprisePersonRecord[],
  systems: EnterpriseSystemRecord[],
  vendors: EnterpriseVendorContractRecord[],
  programs: EnterpriseProgramRecord[],
  artifacts: EnterpriseArtifactRecord[],
  sourcingEvents: EnterpriseSourcingEventRecord[],
  evidence: EnterpriseEvidenceRecord[],
): EnterpriseDataRoomRecord['graph'] {
  const nodes: EnterpriseGraphNodeRecord[] = [
    {
      id: 'tenant:apex-retail',
      nodeType: 'Tenant',
      stableKey: APEX_TENANT_KEY,
      title: 'Apex Retail Group',
      sourceBasis: SYNTHETIC_SOURCE,
    },
    ...people.map((person) => ({
      id: person.id,
      nodeType: 'Person' as const,
      stableKey: person.id,
      title: `${person.name} - ${person.role}`,
      sourceBasis: SYNTHETIC_SOURCE,
    })),
    ...systems.map((system) => ({
      id: system.id,
      nodeType: 'System' as const,
      stableKey: system.id,
      title: system.name,
      sourceBasis: SYNTHETIC_SOURCE,
    })),
    ...vendors.map((vendor) => ({
      id: vendor.id,
      nodeType: 'Vendor' as const,
      stableKey: vendor.id,
      title: vendor.vendorName,
      sourceBasis: SYNTHETIC_SOURCE,
    })),
    ...programs.map((program) => ({
      id: program.id,
      nodeType: 'Program' as const,
      stableKey: program.id,
      title: program.name,
      sourceBasis: SYNTHETIC_SOURCE,
    })),
    ...artifacts.map((artifact) => ({
      id: artifact.id,
      nodeType: artifact.artifactType === 'template' ? 'Template' as const : 'Artifact' as const,
      stableKey: artifact.id,
      title: artifact.title,
      sourceBasis: SYNTHETIC_SOURCE,
    })),
    ...sourcingEvents.map((event) => ({
      id: event.id,
      nodeType: 'SourcingEvent' as const,
      stableKey: event.id,
      title: event.title,
      sourceBasis: SYNTHETIC_SOURCE,
    })),
    ...evidence.map((entry) => ({
      id: entry.id,
      nodeType: 'Evidence' as const,
      stableKey: entry.id,
      title: entry.citationLocator,
      sourceBasis: SYNTHETIC_SOURCE,
    })),
  ];

  const edges: EnterpriseGraphEdgeRecord[] = [
    ...people
      .filter((person) => person.reportsToRole)
      .map((person) => ({
        id: `edge:${person.id}:reports-to:ceo`,
        fromNodeId: person.id,
        toNodeId: people.find((candidate) => candidate.role === person.reportsToRole)?.id ?? 'person:apex:jennifer-park',
        edgeType: 'REPORTS_TO' as const,
        confidence: 0.78,
        evidenceIds: [],
      })),
    ...systems.map((system) => ({
      id: `edge:${system.id}:owned-by:${system.businessOwner.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      fromNodeId: system.id,
      toNodeId: personId(system.businessOwner.replace(/\s*\([^)]*\)/g, '')),
      edgeType: 'OWNS_SYSTEM' as const,
      confidence: 0.72,
      evidenceIds: [],
    })),
    ...programs.flatMap((program) => program.linkedSystemIds.map((systemId) => ({
      id: `edge:${systemId}:supports:${program.id}`,
      fromNodeId: systemId,
      toNodeId: program.id,
      edgeType: 'SYSTEM_SUPPORTS_PROGRAM' as const,
      confidence: 0.8,
      evidenceIds: program.linkedEvidenceIds,
    }))),
    ...artifacts.flatMap((artifact) => artifact.linkedProgramIds.map((programId) => ({
      id: `edge:${programId}:has-deliverable:${artifact.id}`,
      fromNodeId: programId,
      toNodeId: artifact.id,
      edgeType: 'PROGRAM_HAS_DELIVERABLE' as const,
      confidence: 0.95,
      evidenceIds: artifact.linkedEvidenceIds,
    }))),
    ...artifacts.flatMap((artifact) => artifact.linkedEvidenceIds.map((evidenceId) => ({
      id: `edge:${artifact.id}:cites:${evidenceId}`,
      fromNodeId: artifact.id,
      toNodeId: evidenceId,
      edgeType: 'ARTIFACT_CITES_EVIDENCE' as const,
      confidence: 0.95,
      evidenceIds: [evidenceId],
    }))),
    ...sourcingEvents.flatMap((event) => event.linkedProgramIds.map((programId) => ({
      id: `edge:${event.id}:for-program:${programId}`,
      fromNodeId: event.id,
      toNodeId: programId,
      edgeType: 'SOURCING_EVENT_FOR_PROGRAM' as const,
      confidence: 0.9,
      evidenceIds: [],
    }))),
    ...sourcingEvents.flatMap((event) => event.vendorResponses.map((vendor) => ({
      id: `edge:${event.id}:has-vendor:${vendor.vendorId}`,
      fromNodeId: event.id,
      toNodeId: vendor.vendorId,
      edgeType: 'SOURCING_EVENT_HAS_VENDOR' as const,
      confidence: 0.9,
      evidenceIds: [],
    }))),
  ];

  return { nodes, edges };
}

export function buildApexEnterpriseDataRoom(): EnterpriseDataRoomRecord {
  const profile: EnterpriseProfileRecord = {
    tenantKey: APEX_TENANT_KEY,
    legalName: apexRetail.org.name,
    displayName: apexRetail.org.shortName,
    industry: 'Retail',
    subIndustry: apexRetail.org.type,
    headquarters: apexRetail.org.headquarters,
    regions: [`${apexRetail.org.states} US states`],
    employeeCount: apexRetail.org.employees,
    revenueUsdBillions: apexRetail.org.revenue,
    strategicPriorities: apexRetail.strategicPriorities,
    regulatoryPosture: ['CCPA customer data posture', 'PCI-sensitive commerce and POS data', 'SOX-relevant finance systems'],
    dataClassificationPolicyId: 'synthetic-demo-policy-v1',
    residencyMode: 'abarva_hosted_synthetic',
    sourceBasis: SYNTHETIC_SOURCE,
    dataClassification: 'synthetic',
  };

  const people = buildApexPeople();
  const systems = buildApexSystems();
  const vendorContracts = buildApexVendorContracts();
  const financials = buildApexFinancials();
  const programs = buildApexPrograms();
  const artifacts = [
    ...MORRISON_DELIVERABLES,
    ...buildApexSourcingArtifacts(),
  ];
  const sourcingEvents = buildApexSourcingEvents();
  const evidence = buildApexEvidence();
  const graph = buildApexGraph(people, systems, vendorContracts, programs, artifacts, sourcingEvents, evidence);

  return {
    tenantKey: APEX_TENANT_KEY,
    generatedFrom: 'deterministic_enterprise_data_room_seed',
    richness: 'rich',
    sourcePaths: [
      'src/data/apexretail',
      'src/scripts/seed/_shared/enterprise-data.ts',
      'src/content/deliverables/apex-retail/morrison',
    ],
    canonicalizationWarnings: [
      'Apex source files use more than one executive persona universe; this first rich seed uses src/data/apexretail/leadership.ts as the people/org source.',
      'Apex financial fields appear as both millions and billions across source files; this seed normalizes annual spend into USD while preserving source-basis metadata.',
    ],
    profile,
    people,
    systems,
    vendorContracts,
    financials,
    programs,
    artifacts,
    sourcingEvents,
    evidence,
    graph,
    vectorReadiness: [
      {
        indexFamily: 'tenant_artifacts',
        candidateChunkCount: artifacts.length * 4,
        sourceTypes: ['program_deliverable', 'sourcing_artifact'],
        tenantKeyRequired: true,
        rawPrivateTextAllowedInSharedMetadata: false,
      },
      {
        indexFamily: 'tenant_facts',
        candidateChunkCount: people.length + systems.length + vendorContracts.length + financials.length + programs.length,
        sourceTypes: ['structured_fact'],
        tenantKeyRequired: true,
        rawPrivateTextAllowedInSharedMetadata: false,
      },
      {
        indexFamily: 'tenant_evidence',
        candidateChunkCount: evidence.length,
        sourceTypes: ['evidence_reference'],
        tenantKeyRequired: true,
        rawPrivateTextAllowedInSharedMetadata: false,
      },
    ],
  };
}


function buildStructuredSystemsFromClientData(
  tenantPrefix: string,
  techStack: typeof CLIENT_DATA['Apex Retail']['techStack'],
): EnterpriseSystemRecord[] {
  return techStack.map((system, index) => ({
    id: `system:${tenantPrefix}:${index + 1}`,
    name: system.product_name ?? system.vendor_name,
    vendor: system.vendor_name,
    category: system.category,
    businessDomains: [system.owning_function ?? 'Unassigned'],
    businessUnits: [system.owning_function ?? 'Unassigned'],
    deploymentModel: system.deployment_model,
    annualSpendUsd: system.annual_spend_usd,
    businessOwner: system.owning_function ?? 'Unassigned',
    itOwner: system.owning_function ?? 'Unassigned',
    criticality: system.touches_ai ? 'high' : 'medium',
    lifecycleState: 'structured_seed_candidate',
    dataClassification: 'Synthetic enterprise seed',
    integrationCount: 0,
    documentedIntegrationCount: 0,
    riskFlags: system.touches_ai ? ['AI-adjacent system; requires governance and evidence binding before production use.'] : [],
    sourceBasis: SYNTHETIC_SOURCE,
  }));
}

function buildStructuredProgramsFromClientData(
  tenantPrefix: string,
  projects: typeof CLIENT_DATA['Apex Retail']['projects'],
): EnterpriseProgramRecord[] {
  return projects.map((project, index) => ({
    id: `program:${tenantPrefix}:${index + 1}`,
    name: project.name,
    domain: project.program_domain,
    lifecycleState: project.status,
    executiveSponsor: project.exec_sponsor,
    budgetUsd: project.total_budget_usd,
    spentToDateUsd: project.spent_to_date_usd,
    annualValueUsd: undefined,
    timeline: 'Candidate program seed; lifecycle dates not yet normalized.',
    linkedSystemIds: [],
    linkedVendorIds: [],
    linkedEvidenceIds: [],
    sourceBasis: SYNTHETIC_SOURCE,
  }));
}

function buildStructuredStaffAugVendors(
  tenantPrefix: string,
  staffAug: typeof CLIENT_DATA['Apex Retail']['staffAug'],
): EnterpriseVendorContractRecord[] {
  return staffAug.map((vendor, index) => ({
    id: `vendor:${tenantPrefix}:staff-aug:${index + 1}`,
    vendorName: vendor.vendor_name,
    product: vendor.engagement_type,
    category: vendor.function_area,
    annualSpendUsd: vendor.annual_spend_usd,
    contractStatus: 'Synthetic staff augmentation/service seed; detailed contract lifecycle not yet normalized.',
    riskLevel: vendor.touches_ai ? 'high' : 'medium',
    keyRisk: `${vendor.headcount_fte} FTE equivalent engagement. Contract terms, data access, renewal, and SLA fields are pending normalization.`,
    sourceBasis: SYNTHETIC_SOURCE,
  }));
}

function buildCandidateGraph(
  tenantPrefix: string,
  profile: EnterpriseProfileRecord,
  systems: EnterpriseSystemRecord[],
  vendors: EnterpriseVendorContractRecord[],
  programs: EnterpriseProgramRecord[],
  evidence: EnterpriseEvidenceRecord[],
): EnterpriseDataRoomRecord['graph'] {
  const tenantNodeId = `tenant:${tenantPrefix}`;
  const nodes: EnterpriseGraphNodeRecord[] = [
    { id: tenantNodeId, nodeType: 'Tenant', stableKey: profile.tenantKey, title: profile.legalName, sourceBasis: SYNTHETIC_SOURCE },
    ...systems.map((system) => ({ id: system.id, nodeType: 'System' as const, stableKey: system.id, title: system.name, sourceBasis: SYNTHETIC_SOURCE })),
    ...vendors.map((vendor) => ({ id: vendor.id, nodeType: 'Vendor' as const, stableKey: vendor.id, title: vendor.vendorName, sourceBasis: SYNTHETIC_SOURCE })),
    ...programs.map((program) => ({ id: program.id, nodeType: 'Program' as const, stableKey: program.id, title: program.name, sourceBasis: SYNTHETIC_SOURCE })),
    ...evidence.map((entry) => ({ id: entry.id, nodeType: 'Evidence' as const, stableKey: entry.id, title: entry.citationLocator, sourceBasis: SYNTHETIC_SOURCE })),
  ];
  const edges: EnterpriseGraphEdgeRecord[] = [
    ...programs.slice(0, 6).map((program) => ({
      id: `edge:${tenantNodeId}:sponsors:${program.id}`,
      fromNodeId: tenantNodeId,
      toNodeId: program.id,
      edgeType: 'SPONSORS_PROGRAM' as const,
      confidence: 0.55,
      evidenceIds: [],
    })),
    ...systems.slice(0, 8).map((system) => ({
      id: `edge:${system.id}:risk-candidate`,
      fromNodeId: system.id,
      toNodeId: tenantNodeId,
      edgeType: 'SYSTEM_HAS_RISK' as const,
      confidence: 0.5,
      evidenceIds: [],
    })),
  ];
  return { nodes, edges };
}

export function buildMeridianEnterpriseDataRoom(): EnterpriseDataRoomRecord {
  const sourceData = CLIENT_DATA['Meridian Health'];
  const systems = buildStructuredSystemsFromClientData('meridian', sourceData.techStack);
  const vendorContracts = buildStructuredStaffAugVendors('meridian', sourceData.staffAug);
  const programs = buildStructuredProgramsFromClientData('meridian', sourceData.projects);
  const evidence: EnterpriseEvidenceRecord[] = [
    {
      id: 'evidence:meridian:canonical-profile-conflict',
      tenantKey: 'meridian',
      sourceArtifactId: 'docs/specs/_meta/seed-data/meridian-health-system-comprehensive-seed.md',
      citationLocator: 'Meridian profile conflict: TS seed vs comprehensive seed',
      claimText: 'Meridian has conflicting profile universes across source files; comprehensive seed describes a Mountain West 44-hospital system while TS seed describes a Charlotte-centered 23-hospital system.',
      evidenceType: 'canonicalization_gap',
      confidence: 'blocked',
      usabilityState: 'blocked',
      linkedArtifactIds: [],
      linkedGraphNodeIds: [],
      sourceBasis: SYNTHETIC_SOURCE,
      dataClassification: 'synthetic',
      approvalState: 'blocked',
    },
  ];
  const profile: EnterpriseProfileRecord = {
    tenantKey: 'meridian',
    legalName: meridianHealth.org.name,
    displayName: meridianHealth.org.shortName,
    industry: 'Healthcare',
    subIndustry: meridianHealth.org.type,
    headquarters: meridianHealth.org.headquarters,
    regions: meridianHealth.org.states,
    employeeCount: meridianHealth.org.employees,
    revenueUsdBillions: meridianHealth.org.revenue,
    strategicPriorities: meridianHealth.strategicPriorities,
    regulatoryPosture: ['HIPAA/PHI sensitivity', 'Provider-payer data boundary', 'Clinical AI governance pending'],
    dataClassificationPolicyId: 'synthetic-demo-policy-v1',
    residencyMode: 'abarva_hosted_synthetic',
    sourceBasis: SYNTHETIC_SOURCE,
    dataClassification: 'synthetic',
  };

  return {
    tenantKey: 'meridian',
    generatedFrom: 'deterministic_enterprise_data_room_seed',
    richness: 'partial',
    sourcePaths: [
      'src/data/meridian',
      'docs/specs/_meta/seed-data/meridian-health-system-comprehensive-seed.md',
      'docs/specs/_meta/seed-data/meridian-intelligence-layer-overlay.md',
      'src/scripts/seed/_shared/enterprise-data.ts',
    ],
    canonicalizationWarnings: [
      'Canonical profile conflict: comprehensive seed and TypeScript seed describe different Meridian scale/geography/persona universes.',
      'HIPAA/PHI handling must be enforced before real client data ingestion; this record is synthetic only.',
      'Detailed contract intelligence and evidence graph are mapped in source docs but not yet fully normalized into runtime records.',
    ],
    profile,
    people: [],
    systems,
    vendorContracts,
    financials: [
      { id: 'financial:meridian:revenue', metric: 'Revenue', value: meridianHealth.financials.revenue2023, unit: 'USD billions', category: 'revenue', sourceBasis: SYNTHETIC_SOURCE, evidenceIds: [] },
      { id: 'financial:meridian:it-budget', metric: 'IT budget', value: meridianHealth.financials.itBudget2024, unit: 'USD millions', category: 'budget', sourceBasis: SYNTHETIC_SOURCE, evidenceIds: [] },
      { id: 'financial:meridian:operating-margin', metric: 'Operating margin', value: meridianHealth.financials.operatingMargin2023, unit: 'percent', category: 'margin', sourceBasis: SYNTHETIC_SOURCE, evidenceIds: [] },
    ],
    programs,
    artifacts: [],
    sourcingEvents: [],
    evidence,
    graph: buildCandidateGraph('meridian', profile, systems, vendorContracts, programs, evidence),
    vectorReadiness: [
      { indexFamily: 'tenant_facts', candidateChunkCount: systems.length + vendorContracts.length + programs.length, sourceTypes: ['structured_candidate_fact'], tenantKeyRequired: true, rawPrivateTextAllowedInSharedMetadata: false },
      { indexFamily: 'tenant_evidence', candidateChunkCount: 220, sourceTypes: ['overlay_evidence_candidate'], tenantKeyRequired: true, rawPrivateTextAllowedInSharedMetadata: false },
    ],
  };
}

export function buildFirstCapitalEnterpriseDataRoom(): EnterpriseDataRoomRecord {
  const systems: EnterpriseSystemRecord[] = Object.entries(firstCapital.technology).map(([key, value], index) => ({
    id: `system:first-capital:${key}`,
    name: key,
    vendor: typeof value === 'object' && value && 'vendor' in value ? String(value.vendor) : 'Unknown',
    category: key,
    businessDomains: ['Financial Services'],
    businessUnits: ['Technology'],
    deploymentModel: 'native_ts_seed_candidate',
    annualSpendUsd: typeof value === 'object' && value && 'annualLicenseCost' in value ? millionsToUsd(Number(value.annualLicenseCost)) : 0,
    businessOwner: 'Technology leadership pending canonicalization',
    itOwner: 'Technology leadership pending canonicalization',
    criticality: index < 2 ? 'high' : 'medium',
    lifecycleState: 'canonicalization_pending',
    dataClassification: 'Synthetic financial-services seed',
    integrationCount: 0,
    documentedIntegrationCount: 0,
    riskFlags: ['Financial-services profile conflict must be resolved before rich data-room promotion.'],
    sourceBasis: SYNTHETIC_SOURCE,
  }));
  const evidence: EnterpriseEvidenceRecord[] = [
    {
      id: 'evidence:first-capital:canonical-profile-conflict',
      tenantKey: 'first-capital',
      sourceArtifactId: 'docs/specs/_meta/seed-data/first-capital-financial-comprehensive-seed.md',
      citationLocator: 'First Capital profile conflict: TS seed vs comprehensive seed vs shared Arcturus seed',
      claimText: 'First Capital has conflicting scale/profile sources: TS regional-bank seed, markdown super-regional-bank seed, and shared enterprise seed currently backed by Arcturus constants.',
      evidenceType: 'canonicalization_gap',
      confidence: 'blocked',
      usabilityState: 'blocked',
      linkedArtifactIds: [],
      linkedGraphNodeIds: [],
      sourceBasis: SYNTHETIC_SOURCE,
      dataClassification: 'synthetic',
      approvalState: 'blocked',
    },
  ];
  const profile: EnterpriseProfileRecord = {
    tenantKey: 'first-capital',
    legalName: firstCapital.org.name,
    displayName: firstCapital.org.shortName,
    industry: 'Financial Services',
    subIndustry: firstCapital.org.type,
    headquarters: firstCapital.org.headquarters,
    regions: ['US regional banking footprint'],
    employeeCount: firstCapital.org.employees,
    revenueUsdBillions: firstCapital.org.revenue,
    strategicPriorities: firstCapital.strategicPriorities,
    regulatoryPosture: ['BSA/AML sensitivity', 'MNPI/legal privileged handling pending', 'Banking regulatory exam posture'],
    dataClassificationPolicyId: 'synthetic-demo-policy-v1',
    residencyMode: 'abarva_hosted_synthetic',
    sourceBasis: SYNTHETIC_SOURCE,
    dataClassification: 'synthetic',
  };
  const programs = firstCapital.aiOpportunities.map((opportunity, index) => ({
    id: `program:first-capital:ai-opportunity:${index + 1}`,
    name: opportunity.useCase,
    domain: 'ai_opportunity',
    lifecycleState: 'candidate',
    executiveSponsor: 'Sponsor pending canonicalization',
    budgetUsd: opportunity.implementationCost,
    spentToDateUsd: undefined,
    annualValueUsd: 'annualSaving' in opportunity ? opportunity.annualSaving : opportunity.annualRevenue,
    timeline: opportunity.timeToValue,
    linkedSystemIds: [],
    linkedVendorIds: [],
    linkedEvidenceIds: [],
    sourceBasis: SYNTHETIC_SOURCE,
  }));

  return {
    tenantKey: 'first-capital',
    generatedFrom: 'deterministic_enterprise_data_room_seed',
    richness: 'partial',
    sourcePaths: [
      'src/data/firstcapital',
      'docs/specs/_meta/seed-data/first-capital-financial-comprehensive-seed.md',
      'docs/specs/_meta/seed-data/first-capital-intelligence-layer-overlay.md',
      'src/scripts/seed/_shared/enterprise-data.ts',
    ],
    canonicalizationWarnings: [
      'Canonical profile conflict: First Capital appears as a regional bank, a super-regional composite, and an Arcturus-backed shared seed.',
      'Legal/MNPI handling is not yet represented in the runtime data-room schema; keep this synthetic-only.',
      'Native First Capital source files have better evidence than CLIENT_DATA[First Capital], which currently points at Arcturus-shaped constants.',
    ],
    profile,
    people: [],
    systems,
    vendorContracts: [],
    financials: [
      { id: 'financial:first-capital:assets', metric: 'Assets', value: firstCapital.financials.assets2023, unit: 'USD billions', category: 'revenue', sourceBasis: SYNTHETIC_SOURCE, evidenceIds: [] },
      { id: 'financial:first-capital:it-budget', metric: 'IT budget', value: firstCapital.financials.itBudget, unit: 'USD millions', category: 'budget', sourceBasis: SYNTHETIC_SOURCE, evidenceIds: [] },
      { id: 'financial:first-capital:cost-to-income', metric: 'Cost-to-income ratio', value: firstCapital.financials.costToIncomeRatio, unit: 'percent', category: 'benchmark', sourceBasis: SYNTHETIC_SOURCE, evidenceIds: [] },
    ],
    programs,
    artifacts: [],
    sourcingEvents: [],
    evidence,
    graph: buildCandidateGraph('first-capital', profile, systems, [], programs, evidence),
    vectorReadiness: [
      { indexFamily: 'tenant_facts', candidateChunkCount: systems.length + programs.length, sourceTypes: ['native_ts_candidate_fact'], tenantKeyRequired: true, rawPrivateTextAllowedInSharedMetadata: false },
      { indexFamily: 'tenant_evidence', candidateChunkCount: 230, sourceTypes: ['overlay_evidence_candidate'], tenantKeyRequired: true, rawPrivateTextAllowedInSharedMetadata: false },
    ],
  };
}

export function listEnterpriseDataRooms(): EnterpriseDataRoomRecord[] {
  return [
    buildApexEnterpriseDataRoom(),
    buildMeridianEnterpriseDataRoom(),
    buildFirstCapitalEnterpriseDataRoom(),
  ];
}

export function getEnterpriseDataRoom(tenantKey: string): EnterpriseDataRoomRecord | null {
  return listEnterpriseDataRooms().find((room) => room.tenantKey === tenantKey) ?? null;
}

export function summarizeEnterpriseDataRoom(room: EnterpriseDataRoomRecord): EnterpriseDataRoomSummary {
  return {
    tenantKey: room.tenantKey,
    richness: room.richness,
    totalPeople: room.people.length,
    totalSystems: room.systems.length,
    totalVendors: room.vendorContracts.length,
    totalFinancialMetrics: room.financials.length,
    totalPrograms: room.programs.length,
    totalArtifacts: room.artifacts.length,
    totalSourcingEvents: room.sourcingEvents.length,
    totalEvidence: room.evidence.length,
    totalGraphNodes: room.graph.nodes.length,
    totalGraphEdges: room.graph.edges.length,
    totalVectorCandidateChunks: room.vectorReadiness.reduce((total, index) => total + index.candidateChunkCount, 0),
    completenessMet: 0,
    completenessGaps: 0,
  };
}

export function validateEnterpriseDataRoom(room: EnterpriseDataRoomRecord): EnterpriseDataRoomValidationResult {
  const summary = summarizeEnterpriseDataRoom(room);
  const requirementInputs: Array<Omit<EnterpriseDataRoomCompletenessRequirement, 'status'>> = [
    { domain: 'enterprise_profile', minimumCount: 1, actualCount: room.profile ? 1 : 0, note: 'Tenant profile must exist.' },
    { domain: 'people_org', minimumCount: 6, actualCount: room.people.length, note: 'First slice requires executive bench; full target is 25+ people/roles.' },
    { domain: 'system_landscape', minimumCount: 10, actualCount: room.systems.length, note: 'First slice uses documented Apex tech inventory systems.' },
    { domain: 'vendor_contracts', minimumCount: 10, actualCount: room.vendorContracts.length, note: 'Combines top vendor spend and staff augmentation/service contracts.' },
    { domain: 'financials', minimumCount: 12, actualCount: room.financials.length, note: 'Financial metrics include revenue, margin, spend, benchmarks, opportunities.' },
    { domain: 'program_lifecycle', minimumCount: 10, actualCount: room.programs.length, note: 'Includes Morrison program, AI opportunities, and outcome initiatives.' },
    { domain: 'sourcing_lifecycle', minimumCount: 1, actualCount: room.sourcingEvents.length, note: 'First slice includes demand forecasting RFP event.' },
    { domain: 'evidence_provenance', minimumCount: 20, actualCount: room.evidence.length, note: 'Morrison evidence base provides citation-level rows.' },
    { domain: 'templates_examples', minimumCount: 18, actualCount: room.artifacts.length, note: 'Morrison deliverables plus sourcing artifacts serve as gold-standard examples.' },
    { domain: 'graph_readiness', minimumCount: 75, actualCount: room.graph.nodes.length + room.graph.edges.length, note: 'Graph has deterministic nodes and edges, not yet persisted.' },
    { domain: 'vector_readiness', minimumCount: 100, actualCount: summary.totalVectorCandidateChunks, note: 'Vector readiness counts candidate chunks only; no embeddings are generated.' },
  ];

  const requirements: EnterpriseDataRoomCompletenessRequirement[] = requirementInputs.map((requirement) => ({
    ...requirement,
    status: requirement.actualCount >= requirement.minimumCount ? 'met' as const : 'gap' as const,
  }));

  const missingRequiredFields = [
    room.profile.tenantKey ? null : 'profile.tenantKey',
    room.profile.legalName ? null : 'profile.legalName',
    room.profile.industry ? null : 'profile.industry',
    room.profile.residencyMode ? null : 'profile.residencyMode',
  ].filter((field): field is string => Boolean(field));

  const completenessMet = requirements.filter((requirement) => requirement.status === 'met').length;
  const completenessGaps = requirements.length - completenessMet;

  return {
    tenantKey: room.tenantKey,
    isRichTenantReady: missingRequiredFields.length === 0 && completenessGaps === 0,
    requirements,
    missingRequiredFields,
    summary: {
      ...summary,
      completenessMet,
      completenessGaps,
    },
  };
}

export function summarizeEnterpriseDataRoomPortfolio(): EnterpriseDataRoomSummary[] {
  return listEnterpriseDataRooms().map((room) => validateEnterpriseDataRoom(room).summary);
}

export const ENTERPRISE_DATA_ROOM_CONTRACT_VERSION = 'enterprise-data-room-v1';
export const APEX_RETAIL_VOLUMETRICS = VOLUMETRICS_PROFILES.RETAIL;
export const APEX_RETAIL_AI_MATURITY = apexRetailAI.maturity;

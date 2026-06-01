import type { ClientKey } from '@/lib/client-config';
import { getClientOption } from '@/lib/client-config';
import {
  SEGMENT_KEYS,
  parseIngestionMessage,
  type SegmentKey,
} from '@/lib/ingestion/azure-landing-zone-types';
import { evaluateSensitiveUpload } from '@/lib/security/sensitive-upload-guard';
import {
  NORTHSTAR_CONTEXT_TEMPLATES,
  type ContextTemplateDefinition,
} from '@/lib/context-ingestion/template-registry';
import { validateExtractedFacts } from '@/lib/context-ingestion/validation-engine';
import type {
  FileClassification,
  ExtractedContextFact,
} from '@/lib/context-ingestion/types';
import {
  ENTERPRISE_CONTEXT_TEMPLATE_TENANTS,
  ENTERPRISE_CONTEXT_TEMPLATE_VERSION,
  ENTERPRISE_CONTEXT_TEMPLATE_WORKBOOKS,
  type EnterpriseContextTemplateWorkbook,
} from '@/lib/enterprise-context/template-schema';
import apexManifest from '../../../docs/enterprise-context/templates/apexretail/manifest.json';
import meridianManifest from '../../../docs/enterprise-context/templates/meridian/manifest.json';
import arcturusManifest from '../../../docs/enterprise-context/templates/arcturus/manifest.json';

export type DataLoadGateStatus = 'ready' | 'needs_configuration' | 'monitored';

export interface DataLoadRehearsalGate {
  id: string;
  label: string;
  objective: string;
  proof: string;
  existingPath: string;
  status: DataLoadGateStatus;
}

export interface DataLoadTemplateRow {
  id: string;
  family: 'Context registry' | 'Day One workbook';
  dimension: string;
  title: string;
  formats: string;
  requiredFields: string;
  optionalFields: string;
  ownerOrSource: string;
  cadenceOrDomain: string;
  unlocks: string;
}

export interface EnterpriseContextManifestWorkbook {
  key: string;
  title: string;
  path: string;
  columns: string[];
}

export interface EnterpriseContextTemplateManifest {
  tenantKey: string;
  tenantSlug: string;
  displayName: string;
  version: string;
  generatedAt: string;
  workbookCount: number;
  commonColumns: string[];
  workbooks: EnterpriseContextManifestWorkbook[];
}

export interface SetupDataLoadCenterModel {
  tenant: {
    clientId: string;
    clientKey: ClientKey;
    tenantName: string;
    vertical: string;
  };
  metrics: {
    rehearsalGates: number;
    setupSegments: number;
    contextRegistryTemplates: number;
    dayOneWorkbooks: number;
  };
  privateDataPlane: {
    queueSchema: 'abarva.ingestion.v1';
    sampleSegment: SegmentKey;
    sampleMessageAccepted: boolean;
    uploadGuardDecision: 'allow' | 'quarantine';
    validationProbeFindings: number;
  };
  tenantManifest: EnterpriseContextTemplateManifest | null;
  manifestCoverage: ReadonlyArray<{
    tenantKey: string;
    displayName: string;
    workbookCount: number;
    version: string;
  }>;
  rehearsalGates: ReadonlyArray<DataLoadRehearsalGate>;
  templateRows: ReadonlyArray<DataLoadTemplateRow>;
}

const ENTERPRISE_CONTEXT_MANIFESTS = [
  apexManifest,
  meridianManifest,
  arcturusManifest,
] as readonly EnterpriseContextTemplateManifest[];

const MANIFEST_KEY_BY_CLIENT_KEY: Partial<Record<ClientKey, string>> = {
  apexretail: 'apexretail',
  meridian: 'meridian',
  arcturus: 'arcturus',
};

const REHEARSAL_GATES: ReadonlyArray<DataLoadRehearsalGate> = [
  {
    id: 'sso',
    label: 'SSO and admin access',
    objective: 'Admin enters through Clerk and the tenant resolver before seeing setup controls.',
    proof: 'resolveAdminTenant and requireTenancy keep the page pinned to the active client.',
    existingPath: 'src/lib/admin/admin-tenant.ts',
    status: 'ready',
  },
  {
    id: 'consent',
    label: 'Consent and role boundary',
    objective: 'Only upload-capable admins can send files into tenant data lanes.',
    proof: 'Tower upload enforces tenant match and upload permission before storage.',
    existingPath: 'src/app/api/tower/upload/route.ts',
    status: 'ready',
  },
  {
    id: 'storage',
    label: 'Client-scoped landing zone',
    objective: 'Pilot files land as tenant-keyed Azure landing-zone events.',
    proof: 'Queue messages carry tenantClientKey, segmentKey, storage path, hash, and producer metadata.',
    existingPath: 'src/lib/ingestion/azure-landing-zone-types.ts',
    status: 'ready',
  },
  {
    id: 'quarantine',
    label: 'Sensitive upload guard',
    objective: 'PHI, PII, and financial identifiers are stopped before storage/indexing.',
    proof: 'evaluateSensitiveUpload runs before context CSV and Tower persistence.',
    existingPath: 'src/lib/security/sensitive-upload-guard.ts',
    status: 'ready',
  },
  {
    id: 'processing',
    label: 'Queue processing',
    objective: 'Landing-zone events can be downloaded, scanned, audited, and routed to the pipeline.',
    proof: 'consumeOneMessage returns accepted, quarantined, rejected, or transient failure outcomes.',
    existingPath: 'src/lib/ingestion/azure-landing-zone-consumer.ts',
    status: 'monitored',
  },
  {
    id: 'validation',
    label: 'Template validation',
    objective: 'Loaded rows must satisfy the matching template before approval.',
    proof: 'validation-engine checks required fields, numeric values, owners, and enum values.',
    existingPath: 'src/lib/context-ingestion/validation-engine.ts',
    status: 'ready',
  },
  {
    id: 'availability',
    label: 'Available to assistants',
    objective: 'Approved context becomes evidence-backed substrate for Source, Moves, Tower, and Intelligence.',
    proof: 'Context upload connector persists tenant facts and evidence rows through the existing context layer.',
    existingPath: 'src/app/api/admin/context-layer/csv-upload/route.ts',
    status: 'needs_configuration',
  },
];

function compactList(values: ReadonlyArray<string>, limit = 4): string {
  if (values.length <= limit) return values.join(', ');
  return `${values.slice(0, limit).join(', ')} +${values.length - limit}`;
}

function fromContextTemplate(template: ContextTemplateDefinition): DataLoadTemplateRow {
  return {
    id: `context:${template.id}`,
    family: 'Context registry',
    dimension: template.dimension,
    title: template.label,
    formats: template.acceptedFormats.join(', '),
    requiredFields: compactList(template.requiredFields, 5),
    optionalFields: compactList(template.optionalFields, 4) || 'None',
    ownerOrSource: template.ownerRole,
    cadenceOrDomain: template.refreshCadence,
    unlocks: compactList(template.unlocks, 2),
  };
}

function fromEnterpriseWorkbook(workbook: EnterpriseContextTemplateWorkbook): DataLoadTemplateRow {
  const requiredFields = workbook.columns
    .filter((column) => column.required)
    .map((column) => column.key);
  const optionalFields = workbook.columns
    .filter((column) => !column.required)
    .map((column) => column.key);

  return {
    id: `day-one:${workbook.key}`,
    family: 'Day One workbook',
    dimension: workbook.domain,
    title: workbook.title,
    formats: 'xlsx, csv',
    requiredFields: compactList(requiredFields, 5),
    optionalFields: compactList(optionalFields, 4) || 'None',
    ownerOrSource: compactList(workbook.sourceSystems, 3),
    cadenceOrDomain: workbook.domain,
    unlocks: workbook.description,
  };
}

function buildTemplateRows(): DataLoadTemplateRow[] {
  return [
    ...NORTHSTAR_CONTEXT_TEMPLATES.map(fromContextTemplate),
    ...ENTERPRISE_CONTEXT_TEMPLATE_WORKBOOKS.map(fromEnterpriseWorkbook),
  ].sort((a, b) => a.family.localeCompare(b.family) || a.title.localeCompare(b.title));
}

function findTenantManifest(clientKey: ClientKey): EnterpriseContextTemplateManifest | null {
  const manifestKey = MANIFEST_KEY_BY_CLIENT_KEY[clientKey];
  if (!manifestKey) return null;
  return ENTERPRISE_CONTEXT_MANIFESTS.find((manifest) => manifest.tenantKey === manifestKey) ?? null;
}

function runQueueShapeProbe(): boolean {
  try {
    const parsed = parseIngestionMessage({
      schema: 'abarva.ingestion.v1',
      tenantClientKey: 'pilot-rehearsal',
      segmentKey: 'enterprise_profile',
      storage: {
        accountName: 'pilotstorage',
        containerName: 'context-ingestion',
        blobPath: 'pilot-rehearsal/enterprise_profile/sample.csv',
        sizeBytes: 128,
        contentType: 'text/csv',
        sha256: 'pilot-rehearsal-sha256',
      },
      declaredClassification: 'confidential_business',
      producedAt: '2026-06-01T00:00:00.000Z',
      metadata: { rehearsal: true },
    });
    return parsed.segmentKey === 'enterprise_profile';
  } catch {
    return false;
  }
}

function runValidationProbe(): number {
  const classification: FileClassification = {
    templateType: 'application-portfolio',
    dimension: 'application_portfolio',
    format: 'csv',
    likelySourceSystem: 'pilot-rehearsal',
    confidence: 0.95,
    extractionStrategy: 'structured_rows',
    requiredApprovalRole: 'VP Enterprise Architecture',
    llmExtractionNeeded: false,
  };
  const facts: ExtractedContextFact[] = [
    {
      id: 'pilot-rehearsal-fact-1',
      tenantKey: 'northstar',
      dimension: 'application_portfolio',
      entityType: 'application',
      entityKey: 'APP-PILOT-1',
      field: 'app_id',
      value: 'APP-PILOT-1',
      valueText: 'APP-PILOT-1',
      sourceFileId: 'pilot-rehearsal-file',
      sourceLocator: { fileName: 'pilot-rehearsal.csv', row: 2 },
      confidence: 0.95,
      extractionMethod: 'deterministic',
      requiresApproval: true,
      approvalRole: 'VP Enterprise Architecture',
      validationFindings: [],
    },
  ];
  return validateExtractedFacts({ classification, facts }).length;
}

export function buildSetupDataLoadCenterModel(args: {
  clientId: string;
  clientKey: ClientKey;
  tenantName: string;
}): SetupDataLoadCenterModel {
  const tenantOption = getClientOption(args.clientKey);
  const tenantManifest = findTenantManifest(args.clientKey);
  const guardProbe = evaluateSensitiveUpload({
    filename: 'pilot-rehearsal.csv',
    mimeType: 'text/csv',
    bytes: new TextEncoder().encode('source_system,source_record_id\nmanual_attestation,SYS-1'),
    declaredClassification: 'confidential_business',
  });

  return {
    tenant: {
      clientId: args.clientId,
      clientKey: args.clientKey,
      tenantName: args.tenantName,
      vertical: tenantOption.vertical,
    },
    metrics: {
      rehearsalGates: REHEARSAL_GATES.length,
      setupSegments: SEGMENT_KEYS.length,
      contextRegistryTemplates: NORTHSTAR_CONTEXT_TEMPLATES.length,
      dayOneWorkbooks: tenantManifest?.workbookCount ?? ENTERPRISE_CONTEXT_TEMPLATE_WORKBOOKS.length,
    },
    privateDataPlane: {
      queueSchema: 'abarva.ingestion.v1',
      sampleSegment: 'enterprise_profile',
      sampleMessageAccepted: runQueueShapeProbe(),
      uploadGuardDecision: guardProbe.decision,
      validationProbeFindings: runValidationProbe(),
    },
    tenantManifest,
    manifestCoverage: ENTERPRISE_CONTEXT_TEMPLATE_TENANTS.map((tenant) => {
      const manifest = ENTERPRISE_CONTEXT_MANIFESTS.find(
        (candidate) => candidate.tenantKey === tenant.tenantKey,
      );
      return {
        tenantKey: tenant.tenantKey,
        displayName: tenant.displayName,
        workbookCount: manifest?.workbookCount ?? 0,
        version: manifest?.version ?? ENTERPRISE_CONTEXT_TEMPLATE_VERSION,
      };
    }),
    rehearsalGates: REHEARSAL_GATES,
    templateRows: buildTemplateRows(),
  };
}
